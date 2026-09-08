import { DateTime } from "luxon";
import type { Gig, GoogleCalendarEvent } from "./types";

export const CALENDAR_ZONE = "Europe/London";
export type DiaryEvent = {
  id: string;
  title: string;
  start: DateTime;
  end: DateTime;
  allDay: boolean;
  gig?: Gig;
};

export function buildDiaryEvents(
  gigs: Gig[],
  extraEvents: GoogleCalendarEvent[],
): DiaryEvent[] {
  const events: DiaryEvent[] = gigs.map((gig) => {
    const start = DateTime.fromISO(`${gig.date}T${gig.startTime || "19:00"}`, {
      zone: CALENDAR_ZONE,
    });
    return {
      id: gig._id || `${gig.date}-${gig.venue}`,
      title: gig.venue,
      start,
      end: start.plus({ hours: 2 }),
      allDay: false,
      gig,
    };
  });
  for (const event of extraEvents) {
    const start = DateTime.fromISO(event.startISO, {
      zone: CALENDAR_ZONE,
    }).setZone(CALENDAR_ZONE);
    const end = DateTime.fromISO(event.endISO, { zone: CALENDAR_ZONE }).setZone(
      CALENDAR_ZONE,
    );
    // The gig feed already owns details for mirrored Google gig events.
    if (
      events.some(
        (existing) =>
          existing.start.toMillis() === start.toMillis() &&
          [
            existing.title.toLowerCase(),
            `gig at ${existing.title.toLowerCase()}`,
          ].includes(event.title.toLowerCase()),
      )
    )
      continue;
    events.push({
      id: event.id,
      title: event.title,
      start,
      end,
      allDay: !!event.allDay,
    });
  }
  return events
    .filter(
      (event) =>
        event.start.isValid && event.end.isValid && event.end >= event.start,
    )
    .sort((a, b) => a.start.toMillis() - b.start.toMillis());
}

export function eventsOnDay(events: DiaryEvent[], day: DateTime) {
  const start = day.startOf("day");
  const end = start.plus({ days: 1 });
  // End timestamps are exclusive, including Google's all-day end date.
  return events.filter(
    (event) =>
      event.start < end && (event.end > start || event.start.equals(start)),
  );
}

export function monthDays(month: string) {
  const first = DateTime.fromISO(`${month}-01`, { zone: CALENDAR_ZONE });
  const start = first.startOf("week");
  const count =
    Math.ceil((first.weekday - 1 + (first.daysInMonth || 0)) / 7) * 7;
  return Array.from({ length: count }, (_, index) =>
    start.plus({ days: index }),
  );
}
