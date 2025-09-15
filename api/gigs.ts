import { requireEnv } from './_envGuard.js';
import { MongoClient, ObjectId } from 'mongodb';
import { google } from 'googleapis';
import { DateTime } from 'luxon';

let client: MongoClient | null = null;

async function getDb() {
  const uri = requireEnv('MONGODB_URI');
  const dbName = requireEnv('MONGODB_DB');
  if (!client) {
    console.log('Connecting to Mongo with URI prefix:', uri.slice(0, 20));
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

// Google Calendar setup
function getCalendarClient() {
  const raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) return null;
  let jsonStr = raw;
  try {
    // accept base64 or raw JSON locally
    if (/^[A-Za-z0-9+/=\s]+$/.test(raw)) {
      const maybe = Buffer.from(raw, 'base64').toString('utf-8');
      if (maybe.trim().startsWith('{')) jsonStr = maybe;
    }
  } catch {}
  const creds = JSON.parse(jsonStr);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

export default async function handler(req: any, res: any) {
  const db = await getDb();
  const col = db.collection("gigs");
  const method = req.method;
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "soundwalkgigs@gmail.com";

  // GET gigs
  if (method === "GET") {
    const gigs = await col.find().sort({ date: 1 }).toArray();
    return res.status(200).json(
      gigs.map((g) => ({
        ...g,
        _id: g._id.toString(),
      }))
    );
  }

  // Helper to build both Luxon (for Calendar) and JS Date (for Mongo) from date + startTime
  function buildDates(dateISO: string, startTime?: string) {
    let lx = DateTime.fromISO(dateISO, { zone: "Europe/London" });
    if (startTime) {
      const [h, m] = String(startTime).split(":").map(Number);
      lx = lx.set({ hour: h || 0, minute: m || 0, second: 0, millisecond: 0 });
    }
    return { luxon: lx, js: lx.toJSDate() };
  }

  // POST — create gig + calendar event (Calendar Description = Internal Notes)
  if (method === "POST") {
    const body = req.body || {};
    if (!body.date) return res.status(400).json({ error: "Missing date" });

    const { luxon: gigLx, js: gigJs } = buildDates(body.date, body.startTime);

    const newGig = {
      venue: body.venue || "",
      date: gigJs,                      
      startTime: body.startTime || null,
      description: body.description || "",
      fee: Number(body.fee) || 0,
      privateEvent: !!body.privateEvent,
      postersNeeded: !!body.postersNeeded,
      internalNotes: body.internalNotes || "",
      calendarEventId: null as string | null,
    };

    const r = await col.insertOne(newGig);

    // Create Google Calendar event with Internal Notes as description
    if (calendar) {
      try {
        const event = {
          summary: `Gig at ${newGig.venue}`,
          description: newGig.internalNotes || "",
          start: { dateTime: gigLx.toISO(), timeZone: "Europe/London" },
          end:   { dateTime: gigLx.plus({ hours: 2 }).toISO(), timeZone: "Europe/London" },
          colorId: "5",
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 * 24 * 7 },
              { method: "popup", minutes: 60 * 24 * 7 },
            ],
          },
        };

        const calendarRes = await calendar.events.insert({ calendarId, requestBody: event });
        const eventId = calendarRes.data.id;
        if (eventId) {
          await col.updateOne({ _id: r.insertedId }, { $set: { calendarEventId: eventId } });
          newGig.calendarEventId = eventId;
        } else {
          console.error("Calendar insert returned no event id:", calendarRes.data);
        }
      } catch (e) {
        console.error("Error creating calendar event:", e);
      }
    }

    return res.status(201).json({ ...newGig, _id: r.insertedId.toString() });
  }

  // PUT — update gig + calendar event (Calendar Description = Internal Notes)
  if (method === "PUT") {
    const body = req.body || {};
    const id = body._id;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing or invalid _id" });
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ObjectId format" });
    if (!body.date) return res.status(400).json({ error: "Missing date" });

    const { luxon: gigLx, js: gigJs } = buildDates(body.date, body.startTime);

    const update = {
      venue: body.venue || "",
      date: gigJs,                           // keep as JS Date
      startTime: body.startTime || null,
      description: body.description || "",
      fee: Number(body.fee) || 0,
      privateEvent: !!body.privateEvent,
      postersNeeded: !!body.postersNeeded,
      internalNotes: body.internalNotes || "", // <- ensure saved
    };

    const _id = new ObjectId(id);
    const u = await col.updateOne({ _id }, { $set: update });
    if (u.matchedCount === 0) return res.status(404).json({ error: "Not found" });

    const fresh = await col.findOne({ _id });

    if (calendar && fresh?.calendarEventId) {
      try {
        const start = DateTime.fromJSDate(fresh.date).setZone("Europe/London");
        const end = start.plus({ hours: 2 });
        await calendar.events.patch({
          calendarId,
          eventId: fresh.calendarEventId,
          requestBody: {
            summary: `Gig at ${fresh.venue}`,
            description: fresh.internalNotes ?? "",
            start: { dateTime: start.toISO(), timeZone: "Europe/London" },
            end: { dateTime: end.toISO(), timeZone: "Europe/London" },
          },
        });
      } catch (e) {
        console.error("Error updating calendar event:", e);
      }
    }

    return res.status(200).json({ ...fresh, _id: fresh!._id.toString() });
  }

  // DELETE — remove gig + calendar event
  if (method === "DELETE") {
    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id" });

    const _id = new ObjectId(id);
    const gig = await col.findOne({ _id });
    if (!gig) return res.status(404).json({ error: "Not found" });

    await col.deleteOne({ _id });

    if (calendar && gig.calendarEventId) {
      try {
        await calendar.events.delete({ calendarId, eventId: gig.calendarEventId });
      } catch (e) {
        console.error("Error deleting calendar event:", e);
      }
    }

    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  res.status(405).end(`Method ${method} Not Allowed`);
}
