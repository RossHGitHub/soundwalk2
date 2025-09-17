"use client";

import { useMemo, useCallback } from "react";
import { DateTime } from "luxon";
import { Calendar, Views, luxonLocalizer, type Event as RBCEvent } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

type Gig = {
  _id?: string;
  venue: string;
  date: string;          // ISO yyyy-mm-dd in your Admin state
  startTime?: string;    // "HH:mm"
  description?: string;
  fee?: number | string;
  privateEvent?: boolean;
  postersNeeded?: boolean;
  internalNotes?: string;
};

type Props = {
  gigs: Gig[];
  onEventClick?: (gig: Gig) => void;
};

const localizer = luxonLocalizer(DateTime, { firstDayOfWeek: 1 }); // Monday start (UK)

export default function GigCalendar({ gigs, onEventClick }: Props) {
  // map your gigs to react-big-calendar events
  const events = useMemo(() => {
    return gigs.map((g) => {
      // Build a proper DateTime in Europe/London
      const base = DateTime.fromISO(g.date, { zone: "Europe/London" });
      const [h, m] = (g.startTime ?? "19:00").split(":").map(Number); // default 19:00 if empty
      const start = base.set({ hour: h || 0, minute: m || 0, second: 0, millisecond: 0 });
      const end = start.plus({ hours: 2 }); // same assumption as API

      const titleParts = [g.venue];
      if (g.privateEvent) titleParts.push("(Private)");
      if (g.postersNeeded) titleParts.push("🧷 Posters");

      return {
        id: g._id,
        title: titleParts.join(" "),
        start: start.toJSDate(),
        end: end.toJSDate(),
        resource: g,
        allDay: false,
      } as RBCEvent;
    });
  }, [gigs]);

  const handleSelectEvent = useCallback(
    (evt: RBCEvent) => {
      const gig = evt.resource as Gig;
      onEventClick?.(gig);
    },
    [onEventClick]
  );

  // Minimal Tailwind polish (override default rbc classes)
  // You can move these into a CSS file if you prefer
  return (
    <div className="rbc-wrapper rounded-xl border border-white/10 bg-gray-900 p-2">
      <style>{`
        .rbc-toolbar { color: white; }
        .rbc-btn-group button { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.15); }
        .rbc-btn-group button:hover { background: rgba(255,255,255,0.08); }
        .rbc-today { background-color: rgba(16,185,129,0.15); } /* emerald tint */
        .rbc-event { background-color: #10B981; border: none; } /* emerald-500 */
        .rbc-off-range-bg { background: rgba(255,255,255,0.03); }
        .rbc-month-view, .rbc-time-view { background: transparent; }
        .rbc-header, .rbc-time-header { color: rgba(255,255,255,0.85); }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        defaultView={Views.MONTH}
        popup
        onSelectEvent={handleSelectEvent}
        step={30}
        timeslots={2}
        min={DateTime.fromObject({ hour: 9 }).toJSDate()}
        max={DateTime.fromObject({ hour: 23 }).toJSDate()}
      />
    </div>
  );
}
