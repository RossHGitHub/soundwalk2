// api/gigs.ts
import { MongoClient, ObjectId } from "mongodb";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

// Don't declare these at the top level
// const credentials = ...
// const auth = ...
// const calendar = ...

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB || "soundwalk";

if (!uri) {
    throw new Error("Missing MONGODB_URI env var");
}

// Cache the client across lambda invocations (important for serverless).
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    // @ts-ignore
    var _mongo: { client?: MongoClient; db?: any } | undefined;
}

async function connect() {
    if (global._mongo && global._mongo.client) {
        return { client: global._mongo.client, db: global._mongo.db };
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    global._mongo = { client, db };
    return { client, db };
}

function formatGig(doc: any) {
    return {
        ...doc,
        _id: doc._id.toString(),
        date:
            doc.date instanceof Date
                ? doc.date.toISOString().slice(0, 10)
                : new Date(doc.date).toISOString().slice(0, 10),
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // MOVE THE CREDENTIALS LOGIC HERE
    if (!process.env.GOOGLE_CREDENTIALS) {
        return res.status(500).json({ error: "Missing GOOGLE_CREDENTIALS env var" });
    }
    const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('ascii')
    );

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    const calendar = google.calendar({ version: "v3", auth });
    
    // ... rest of your handler code
    // The try...catch block and the rest of the logic should remain the same.
    try {
        const { db } = await connect();
        const col = db.collection("gigs");
        const method = req.method;

        if (method === "GET") {
            const docs = await col.find({}).sort({ date: 1 }).toArray();
            return res.status(200).json(docs.map(formatGig));
        }
        if (method === "POST") {
            const body = req.body;
            const doc = {
                venue: body.venue || "",
                date: body.date ? new Date(body.date) : new Date(),
                startTime: body.startTime || null,
                description: body.description || "",
                fee: Number(body.fee) || 0,
                privateEvent: !!body.privateEvent,
                postersNeeded: !!body.postersNeeded,
                calendarEventId: null, // Add a new field to store the event ID
            };

            const r = await col.insertOne(doc);

            // If the gig was successfully added to the DB, create a calendar event
            if (r.acknowledged) {
                const gigDate = new Date(body.date);
                const [hours, minutes] = body.startTime.split(":").map(Number);
                gigDate.setHours(hours, minutes);

                const event = {
                    summary: `Gig at ${body.venue}`,
                    description: body.description,
                    start: {
                        dateTime: gigDate.toISOString(),
                    },
                    end: {
                        dateTime: new Date(gigDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
                    },
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'email', minutes: 60 * 24 * 7 }, // 1 week reminder in minutes
                            { method: 'popup', minutes: 60 * 24 * 7 },
                        ],
                    },
                };

                const calendarRes = await calendar.events.insert({
                    calendarId: "primary", // Or the specific calendar ID
                    requestBody: event,
                });

                const eventId = calendarRes.data.id;

                // Update the DB document with the calendar event ID
                await col.updateOne(
                    { _id: new ObjectId(r.insertedId) },
                    { $set: { calendarEventId: eventId } }
                );
            }

            return res.status(201).json(formatGig({ ...doc, _id: r.insertedId }));
        }

        if (method === "PUT") {
            const body = req.body;
            const id = body.id || body._id;
            if (!id) return res.status(400).json({ error: "Missing id" });

            const update = {
                venue: body.venue || "",
                date: body.date ? new Date(body.date) : new Date(),
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

            if (!r.value) return res.status(404).json({ error: "Not found" });
            return res.status(200).json(formatGig(r.value));
        }

         if (method === "DELETE") {
            const id = (req.query?.id as string) || req.body?.id;
            if (!id) return res.status(400).json({ error: "Missing id" });

            const gigToDelete = await col.findOne({ _id: new ObjectId(id) });

            if (gigToDelete && gigToDelete.calendarEventId) {
                try {
                    await calendar.events.delete({
                        calendarId: "primary",
                        eventId: gigToDelete.calendarEventId,
                    });
                    console.log(`Calendar event ${gigToDelete.calendarEventId} deleted.`);
                } catch (e) {
                    console.error(`Error deleting calendar event: ${e}`);
                }
            }
            await col.deleteOne({ _id: new ObjectId(id) });
            return res.status(200).json({ ok: true });
        }
    } catch (err: any) {
        console.error("API error:", err);
        return res.status(500).json({ error: err.message || "Server error" });
    }

    // Add this to handle any request method that isn't 'GET', 'POST', 'PUT', or 'DELETE'
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
}
