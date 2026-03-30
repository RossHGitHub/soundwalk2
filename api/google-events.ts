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

type CalendarSourceStatus = {
  calendarId: string;
  ok: boolean;
  eventCount: number;
  error?: string;
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
  return {
    client: google.calendar({ version: "v3", auth }),
    serviceAccountEmail: creds.client_email as string | undefined,
  };
}

export default async function handler(req: any, res: any) {
  const calendarClient = getCalendarClient();
  if (!calendarClient) {
    return res.status(200).json({
      items: [],
      diagnostics: {
        serviceAccountEmail: null,
        credentialsConfigured: false,
        timeMin: null,
        timeMax: null,
        sources: [],
        dedupedCount: 0,
        fetchError: "GOOGLE_CREDENTIALS missing in API runtime",
      },
    });
  }

  const { client: calendar, serviceAccountEmail } = calendarClient;

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
    const sourceStatuses: CalendarSourceStatus[] = [];
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

    results.forEach((result, index) => {
      const calendarId = calendarIds[index];

      if (result.status !== "fulfilled") {
        const errorMessage =
          result.reason instanceof Error
            ? result.reason.message
            : typeof result.reason === "string"
              ? result.reason
              : "Unknown Google Calendar error";

        console.error("google-events calendar fetch failed", {
          calendarId,
          error: errorMessage,
        });
        sourceStatuses.push({
          calendarId,
          ok: false,
          eventCount: 0,
          error: errorMessage,
        });
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

      sourceStatuses.push({
        calendarId,
        ok: true,
        eventCount: items.length,
      });

      items.forEach((item) => {
        const key = toDedupKey(item);
        if (!deduped.has(key)) {
          deduped.set(key, item);
        }
      });
    });

    const dedupedItems = Array.from(deduped.values()).sort((a, b) =>
      a.startISO.localeCompare(b.startISO)
    );

    res.status(200).json({
      items: dedupedItems,
      diagnostics: {
        serviceAccountEmail: serviceAccountEmail ?? null,
        credentialsConfigured: true,
        timeMin: tMin,
        timeMax: tMax,
        sources: sourceStatuses,
        dedupedCount: dedupedItems.length,
        fetchError: null,
      },
    });
  } catch (err) {
    console.error("google-events error", err);
    res.status(200).json({
      items: [],
      diagnostics: {
        serviceAccountEmail: serviceAccountEmail ?? null,
        credentialsConfigured: true,
        timeMin: tMin,
        timeMax: tMax,
        sources: calendarIds.map((calendarId) => ({
          calendarId,
          ok: false,
          eventCount: 0,
          error:
            err instanceof Error ? err.message : "Unknown Google Calendar error",
        })),
        dedupedCount: 0,
        fetchError:
          err instanceof Error ? err.message : "Unknown Google Calendar error",
      },
    }); // fail-soft
  }
}
