import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";
import { google } from "googleapis";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;
let client: MongoClient | null = null;
const calendarId = "soundwalkband@gmail.com";

async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

// Google Calendar setup (only if creds exist)
function getCalendarClient() {
  if (!process.env.GOOGLE_CREDENTIALS) return null;

  // Decode the base64-encoded credentials string
  const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS, "base64").toString("utf-8");

  // Parse the decoded JSON string into an object
  const creds = JSON.parse(decoded);
console.log(creds.private_key.includes("\n"));

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();
  const col = db.collection("gigs");
  const method = req.method;
  const calendar = getCalendarClient();
  console.log("GOOGLE_CREDENTIALS length:", process.env.GOOGLE_CREDENTIALS?.length);
console.log("Calendar object:", calendar);

  // GET gigs — no Google auth required
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
    console.log("POST request hit with body:", body);

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
          start: { dateTime: gigDate.toISOString() },
          end: { dateTime: new Date(gigDate.getTime() + 3 * 60 * 60 * 1000).toISOString() },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 * 24 * 7 },
              { method: "popup", minutes: 60 * 24 * 7 },
            ],
          },
        };

        const calendarRes = await calendar.events.insert({
          calendarId: calendarId,
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

  // PUT — update gig + update/create calendar event
  if (method === "PUT") {
  const body = req.body;
  const id = body.id || body._id;
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
  console.log("Calendar object present:", !!calendar);
  if (calendar) {
    try {
      const event = {
        summary: `Gig at ${body.venue}`,
        description: body.description,
        start: { dateTime: gigDate.toISOString() },
        end: { dateTime: new Date(gigDate.getTime() + 3 * 60 * 60 * 1000).toISOString() },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 * 24 * 7 },
            { method: "popup", minutes: 60 * 24 * 7 },
          ],
        },
      };

      if (r.value.calendarEventId) {
        console.log("Updating existing calendar event:", r.value.calendarEventId, event);
        const updateRes = await calendar.events.update({
          calendarId: calendarId,
          eventId: r.value.calendarEventId,
          requestBody: event,
        });
        console.log("Calendar update response:", updateRes.data);
      } else {
        console.log("Inserting new calendar event:", event);
        const insertRes = await calendar.events.insert({
          calendarId: calendarId,
          requestBody: event,
        });
        console.log("Calendar insert response:", insertRes.data);
        const eventId = insertRes.data.id;
        if (eventId) {
          await col.updateOne({ _id: new ObjectId(id) }, { $set: { calendarEventId: eventId } });
        }
      }
    } catch (e: any) {
      console.error("Error updating/creating calendar event:", e.errors || e);
    }
  }

  return res.status(200).json({
    ...r.value,
    _id: r.value._id.toString(),
  });
}


  // DELETE — remove from DB + calendar
  if (method === "DELETE") {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing id" });
    }

    const gig = await col.findOne({ _id: new ObjectId(id) });
    if (!gig) return res.status(404).json({ error: "Not found" });

    await col.deleteOne({ _id: new ObjectId(id) });

    if (calendar && gig.calendarEventId) {
      try {
        await calendar.events.delete({
          calendarId: calendarId,
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
