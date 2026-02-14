import { requireEnv } from "./_envGuard.js";
import { MongoClient, ObjectId } from "mongodb";
import { google } from "googleapis";
import { DateTime } from "luxon";

let client: MongoClient | null = null;

async function getDb() {
  const uri = requireEnv("MONGODB_URI");
  const dbName = requireEnv("MONGODB_DB");
  if (!client) {
    console.log("Connecting to Mongo with URI prefix:", uri.slice(0, 20));
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

function getCalendarClient() {
  const raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) return null;

  let jsonStr = raw;
  try {
    // accept base64 or raw JSON locally
    if (/^[A-Za-z0-9+/=\s]+$/.test(raw)) {
      const maybe = Buffer.from(raw, "base64").toString("utf-8");
      if (maybe.trim().startsWith("{")) jsonStr = maybe;
    }
  } catch {}

  const creds = JSON.parse(jsonStr);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

type GigDoc = {
  _id: ObjectId;
  venue: string;
  date: Date;
  startTime?: string | null;
  description?: string;
  fee?: number;
  privateEvent?: boolean;
  postersNeeded?: boolean;
  internalNotes?: string;
  calendarEventId?: string | null;
};

function buildLuxonFromGig(gig: GigDoc) {
  let lx = DateTime.fromJSDate(gig.date).setZone("Europe/London");
  if (gig.startTime) {
    const [h, m] = gig.startTime.split(":").map(Number);
    lx = lx.set({
      hour: h || 0,
      minute: m || 0,
      second: 0,
      millisecond: 0,
    });
  }
  return lx;
}

function buildEventPayload(gig: GigDoc) {
  const start = buildLuxonFromGig(gig);
  const end = start.plus({ hours: 2 });

  return {
    summary: `Gig at ${gig.venue}`,
    description: gig.internalNotes || "",
    start: { dateTime: start.toISO(), timeZone: "Europe/London" },
    end: { dateTime: end.toISO(), timeZone: "Europe/London" },
    colorId: "5",
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 * 24 * 7 },
        { method: "popup", minutes: 60 * 24 * 7 },
      ],
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const db = await getDb();
  const col = db.collection<GigDoc>("gigs");
  const calendar = getCalendarClient();

  if (!calendar) {
    return res.status(500).json({ error: "No Google Calendar client configured" });
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "soundwalkgigs@gmail.com";

  // London start-of-day -> UTC for Mongo
  const todayUTC = DateTime.now()
    .setZone("Europe/London")
    .startOf("day")
    .toUTC();

  const upcoming = await col
    .find({ date: { $gte: todayUTC.toJSDate() } })
    .sort({ date: 1 })
    .toArray();

  const created: string[] = [];
  const linkedExisting: string[] = [];
  const updated: string[] = [];
  const errors: { gigId: string; message: string }[] = [];

  // how close (in minutes) an event has to be to count as "the same gig"
  const MATCH_WINDOW_MINUTES = 180; // ±3h

  for (const gig of upcoming) {
    const gigId = gig._id.toString();
    const gigStart = buildLuxonFromGig(gig);
    const payload = buildEventPayload(gig);

    try {
      // 1) Find calendar events near this gig's time
      const timeMin = gigStart.minus({ hours: 6 }).toISO();
      const timeMax = gigStart.plus({ hours: 6 }).toISO();

      const listRes: any = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      } as any);

      const items = listRes.data.items || [];

      const candidates = items
        .map((e: any) => {
          const startISO = e.start?.dateTime || e.start?.date;
          if (!e.id || !startISO) return null;
          const evStart = DateTime.fromISO(startISO).setZone("Europe/London");
          const diffMinutes = Math.abs(evStart.diff(gigStart, "minutes").minutes);
          return { ev: e, diffMinutes };
        })
        .filter((x: any): x is { ev: any; diffMinutes: number } =>
          !!x && x.diffMinutes <= MATCH_WINDOW_MINUTES
        );

      let targetEventId: string | null = null;
      let fromStoredId = false;

      if (candidates.length > 0) {
        // If we already have a calendarEventId and it's in the candidates, prefer that
        if (gig.calendarEventId) {
          const matchById = candidates.find(
            (c: { ev: any; diffMinutes: number }) => c.ev.id === gig.calendarEventId
          );
          if (matchById && matchById.ev.id) {
            targetEventId = matchById.ev.id;
            fromStoredId = true;
          }
        }

        // Otherwise, if there's exactly one candidate, use it
        if (!targetEventId && candidates.length === 1) {
          targetEventId = candidates[0].ev.id || null;
        }

        // If still no targetEventId but multiple candidates, treat as ambiguous:
        // we'll create a new event instead of risking linking the wrong one.
      }

      if (targetEventId) {
        // ensure DB points at this event
        if (gig.calendarEventId !== targetEventId) {
          await col.updateOne(
            { _id: gig._id },
            { $set: { calendarEventId: targetEventId } }
          );
        }

        // patch it to match the DB
        await calendar.events.patch({
          calendarId,
          eventId: targetEventId,
          requestBody: payload,
        });

        if (fromStoredId) {
          updated.push(gigId);
        } else {
          linkedExisting.push(gigId);
        }

        continue;
      }

      // 2) No clear matching event -> create a new one
      const insertRes: any = await calendar.events.insert({
        calendarId,
        requestBody: payload,
      } as any);

      const newId = insertRes.data.id;
      if (newId) {
        await col.updateOne(
          { _id: gig._id },
          { $set: { calendarEventId: newId } }
        );
        created.push(gigId);
      } else {
        errors.push({
          gigId,
          message: "Insert returned no eventId",
        });
      }
    } catch (err: any) {
      console.error("gigs-sync: error for gig", gigId, err);
      errors.push({
        gigId,
        message: err?.message || "Unknown error",
      });
    }
  }

  return res.status(200).json({
    totalUpcoming: upcoming.length,
    createdCount: created.length,
    linkedExistingCount: linkedExisting.length,
    updatedCount: updated.length,
    created,
    linkedExisting,
    updated,
    errors,
  });
}
