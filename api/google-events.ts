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

  const calendarId =
    process.env.GOOGLE_CALENDAR_ID ?? "soundwalkband@gmail.com";
  const { timeMin, timeMax } = req.query;

  const now = DateTime.now().setZone("Europe/London");
  const tMin = (timeMin as string) || now.minus({ months: 1 }).toISO();
  const tMax = (timeMax as string) || now.plus({ months: 6 }).toISO();

  try {
    const r = await calendar.events.list({
      calendarId,
      timeMin: tMin,
      timeMax: tMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const items =
      (r.data.items || [])
        .map((e) => {
          // determine all-day vs timed
          const hasAllDay = !!e.start?.date || !!e.end?.date;
          const startISO = hasAllDay
            ? DateTime.fromISO(e.start!.date!).startOf("day").toISO()
            : e.start?.dateTime ?? null;
          // Use API’s exclusive end for all-day; client will nudge by -1s.
          const endISO = hasAllDay
            ? DateTime.fromISO(e.end!.date!).toISO()
            : e.end?.dateTime ?? null;

          if (!startISO || !endISO) return null; // drop malformed rows

          return {
            id: e.id || `${e.summary || "Event"}-${startISO}`,
            title: e.summary || "(untitled)",
            startISO,
            endISO,
            description: e.description || "",
            allDay: hasAllDay,
          };
        })
        .filter(Boolean) as Array<{
        id: string;
        title: string;
        startISO: string;
        endISO: string;
        description?: string;
        allDay?: boolean;
      }>;

    res.status(200).json(items);
  } catch (err) {
    console.error("google-events error", err);
    res.status(200).json([]); // fail-soft
  }
}
