import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";
import { google } from "googleapis";
import { DateTime } from "luxon";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;
let client: MongoClient | null = null;
const calendarId = "soundwalkgigs@gmail.com";

async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

// Google Calendar setup
function getCalendarClient() {
  if (!process.env.GOOGLE_CREDENTIALS) return null;

  const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS, "base64").toString("utf-8");
  const creds = JSON.parse(decoded);

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
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
    const gigDate = new Date(body.date);
    if (body.startTime) {
      const [hours, minutes] = body.startTime.split(":").map(Number);
      gigDate.setHours(hours, minutes);
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
          start: { dateTime: toLondonISO(gigDate), timeZone: "Europe/London" },
          end: { dateTime: toLondonISO(new Date(gigDate.getTime() + 2 * 60 * 60 * 1000)), timeZone: "Europe/London" },
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
    if (!id) return res.status(400).json({ error: "Missing id" });

    const gigDate = new Date(body.date);
    if (body.startTime) {
      const [hours, minutes] = body.startTime.split(":").map(Number);
      gigDate.setHours(hours, minutes);
    }

    const update = {
      venue: body.venue || "",
      date: gigDate,
      startTime: body.startTime || null,
      description: body.description || "",
      fee: Number(body.fee) || 0,
      privateEvent: !!body.privateEvent,
      postersNeeded: !!body.postersNeeded,
    };

    const r = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!r || !r.value) return res.status(404).json({ error: "Not found" });

    // Google Calendar sync
    if (calendar) {
      try {
        const event = {
          summary: `Gig at ${body.venue}`,
          description: body.description,
          start: { dateTime: toLondonISO(gigDate), timeZone: "Europe/London" },
          end: { dateTime: toLondonISO(new Date(gigDate.getTime() + 2 * 60 * 60 * 1000)), timeZone: "Europe/London" },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 * 24 * 7 },
              { method: "popup", minutes: 60 * 24 * 7 },
            ],
          },
        };

        let calendarEventId = r.value.calendarEventId;

        if (calendarEventId) {
          try {
            await calendar.events.update({
              calendarId,
              eventId: calendarEventId,
              requestBody: event,
            });
          } catch (err: any) {
            if (err.code === 404) {
              console.warn(`Event ${calendarEventId} not found, creating new one.`);
              const insertRes = await calendar.events.insert({
                calendarId,
                requestBody: event,
              });
              calendarEventId = insertRes.data.id || null;
            } else {
              throw err;
            }
          }
        } else {
          const insertRes = await calendar.events.insert({
            calendarId,
            requestBody: event,
          });
          calendarEventId = insertRes.data.id || null;
        }

        if (calendarEventId && calendarEventId !== r.value.calendarEventId) {
          await col.updateOne({ _id: new ObjectId(id) }, { $set: { calendarEventId } });
          r.value.calendarEventId = calendarEventId;
        }
      } catch (e: any) {
        console.error("Error updating/creating calendar event:", e.errors || e);
      }
    }

    return res.status(200).json({ ...r.value, _id: r.value._id.toString() });
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
