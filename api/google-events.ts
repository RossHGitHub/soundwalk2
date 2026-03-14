import { google } from "googleapis";
import { DateTime } from "luxon";

type CalendarFeedEvent = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
  allDay?: boolean;
};

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

  const calendarIds = Array.from(
    new Set([
      process.env.GOOGLE_CALENDAR_ID,
      "soundwalkband@gmail.com",
      "soundwalkgigs@gmail.com",
    ].filter(Boolean))
  ) as string[];
  const { timeMin, timeMax } = req.query;

  const now = DateTime.now().setZone("Europe/London");
  const tMin = (timeMin as string) || now.minus({ months: 1 }).toISO();
  const tMax = (timeMax as string) || now.plus({ months: 6 }).toISO();

  const toDedupKey = (event: CalendarFeedEvent) =>
    [
      event.title.trim().toLowerCase().replace(/\s+/g, " "),
      event.startISO,
      event.endISO,
      event.allDay ? "all-day" : "timed",
    ].join("|");

  try {
    const results = await Promise.allSettled(
      calendarIds.map((calendarId) =>
        calendar.events.list({
          calendarId,
          timeMin: tMin,
          timeMax: tMax,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 2500,
        } as any)
      )
    );

    const deduped = new Map<string, CalendarFeedEvent>();

    results.forEach((result) => {
      if (result.status !== "fulfilled") {
        console.error("google-events calendar fetch failed", result.reason);
        return;
      }

      const items = (result.value.data.items || [])
        .map((e: any) => {
          const hasAllDay = !!e.start?.date || !!e.end?.date;
          const startISO = hasAllDay
            ? DateTime.fromISO(e.start!.date!).startOf("day").toISO()
            : e.start?.dateTime ?? null;
          const endISO = hasAllDay
            ? DateTime.fromISO(e.end!.date!).toISO()
            : e.end?.dateTime ?? null;

          if (!startISO || !endISO) return null;

          return {
            id: e.id || `${e.summary || "Event"}-${startISO}`,
            title: e.summary || "(untitled)",
            startISO,
            endISO,
            description: e.description || "",
            allDay: hasAllDay,
          } satisfies CalendarFeedEvent;
        })
        .filter(Boolean) as CalendarFeedEvent[];

      items.forEach((item) => {
        const key = toDedupKey(item);
        if (!deduped.has(key)) {
          deduped.set(key, item);
        }
      });
    });

    res.status(200).json(
      Array.from(deduped.values()).sort((a, b) => a.startISO.localeCompare(b.startISO))
    );
  } catch (err) {
    console.error("google-events error", err);
    res.status(200).json([]); // fail-soft
  }
}
