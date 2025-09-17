import { google } from "googleapis";
import { DateTime } from "luxon";

function getCalendarClient() {
  const raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) return null;
  let jsonStr = raw;
  try {
    if (/^[A-Za-z0-9+/=\s]+$/.test(raw)) {
      const maybe = Buffer.from(raw, "base64").toString("utf-8");
      if (maybe.trim().startsWith("{")) jsonStr = maybe;
    }
  } catch {}
  const creds = JSON.parse(jsonStr);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return google.calendar({ version: "v3", auth });
}

export default async function handler(req: any, res: any) {
  const calendar = getCalendarClient();
  if (!calendar) return res.status(200).json([]);

  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "soundwalkgigs@gmail.com";
  const { timeMin, timeMax } = req.query;

  // Default window: last month → +6 months
  const now = DateTime.now().setZone("Europe/London");
  const tMin = timeMin || now.minus({ months: 1 }).toISO();
  const tMax = timeMax || now.plus({ months: 6 }).toISO();

  try {
    const r = await calendar.events.list({
      calendarId,
      timeMin: tMin as string,
      timeMax: tMax as string,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const items =
      r.data.items?.map((e) => ({
        id: e.id!,
        title: e.summary || "Event",
        startISO:
          e.start?.dateTime ||
          (e.start?.date ? DateTime.fromISO(e.start.date).startOf("day").toISO()! : ""),
        endISO:
          e.end?.dateTime ||
          (e.end?.date ? DateTime.fromISO(e.end.date).endOf("day").toISO()! : ""),
        description: e.description || "",
      })) ?? [];

    res.status(200).json(items);
  } catch (err) {
    console.error("google-events error", err);
    res.status(200).json([]); // fail-soft
  }
}
