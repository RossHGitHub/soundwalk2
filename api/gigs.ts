import { requireEnv } from './_envGuard';
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

// Helper: convert JS Date to Europe/London ISO string with Luxon
function toLondonISO(date: Date) {
  return DateTime.fromJSDate(date).setZone("Europe/London").toISO();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();
  const col = db.collection("gigs");
  const method = req.method;
  const calendar = getCalendarClient();

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

  // POST — create gig + calendar event
  if (method === "POST") {
    const body = req.body;
    let gigDate = DateTime.fromISO(body.date, { zone: "Europe/London" });
    if (body.startTime) {
      const [hours, minutes] = body.startTime.split(":").map(Number);
      gigDate = gigDate.set({ hour: hours, minute: minutes });
    }

    const newGig = {
      venue: body.venue || "",
      date: gigDate,
      startTime: body.startTime || null,
      description: body.description || "",
      fee: Number(body.fee) || 0,
      privateEvent: !!body.privateEvent,
      postersNeeded: !!body.postersNeeded,
      calendarEventId: null as string | null,
    };

    const r = await col.insertOne(newGig);

    // Create Google Calendar event
    if (calendar) {
      try {
        const event = {
          summary: `Gig at ${body.venue}`,
          description: body.description,
          start: { dateTime: gigDate.toISO(), timeZone: "Europe/London" },
          end: { dateTime: gigDate.plus({ hours: 2 }).toISO(), timeZone: "Europe/London" },
          colorId: "5",
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 * 24 * 7 },
              { method: "popup", minutes: 60 * 24 * 7 },
            ],
          },
        };

        const calendarRes = await calendar.events.insert({
          calendarId,
          requestBody: event,
        });
        const eventId = calendarRes.data.id;
        if (eventId) {
          await col.updateOne({ _id: r.insertedId }, { $set: { calendarEventId: eventId } });
          newGig.calendarEventId = eventId;
        }
      } catch (e) {
        console.error("Error creating calendar event:", e);
      }
    }

    return res.status(201).json({ ...newGig, _id: r.insertedId.toString() });
  }

  // PUT — update gig + calendar event
if (method === "PUT") {
  const body = req.body;
  const id = body._id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid _id" });
  }
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ObjectId format" });
  }

  // Build the gig date
  const gigDate = new Date(body.date);
  if (body.startTime) {
    const [hours, minutes] = String(body.startTime).split(":").map(Number);
    gigDate.setHours(hours || 0, minutes || 0, 0, 0);
  }

  const update = {
    venue: body.venue || "",
    date: gigDate,                        // store as JS Date
    startTime: body.startTime || null,
    description: body.description || "",
    fee: Number(body.fee) || 0,
    privateEvent: !!body.privateEvent,
    postersNeeded: !!body.postersNeeded,
  };

  // Use updateOne + find, so we’re not dependent on `value`
  const _id = new ObjectId(id);
  const u = await col.updateOne({ _id }, { $set: update });

  if (u.matchedCount === 0) {
    return res.status(404).json({ error: "Not found" });
  }

  // fetch updated doc to send back
  const fresh = await col.findOne({ _id });
  // (optional) Google Calendar sync using `gigDate` as you already do...

  return res.status(200).json({ ...fresh, _id: fresh!._id.toString() });
}



  // DELETE — remove gig + calendar event
  if (method === "DELETE") {
    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id" });

    const gig = await col.findOne({ _id: new ObjectId(id) });
    if (!gig) return res.status(404).json({ error: "Not found" });

    await col.deleteOne({ _id: new ObjectId(id) });

    if (calendar && gig.calendarEventId) {
      try {
        await calendar.events.delete({
          calendarId,
          eventId: gig.calendarEventId,
        });
      } catch (e) {
        console.error("Error deleting calendar event:", e);
      }
    }

    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  res.status(405).end(`Method ${method} Not Allowed`);
}
