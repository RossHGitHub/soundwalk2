"use client";

import { useMemo, useCallback } from "react";
import { DateTime } from "luxon";
import {
  Calendar,
  Views,
  luxonLocalizer,
  type Event as RBCEvent,
  type EventProps,
  type View,
} from "react-big-calendar";
import { Button } from "@/components/ui/button";
import "react-big-calendar/lib/css/react-big-calendar.css";

export type Gig = {
  _id?: string;
  venue: string;
  date: string;          // ISO yyyy-mm-dd
  startTime?: string;    // "HH:mm"
  description?: string;
  fee?: number | string;
  privateEvent?: boolean;
  postersNeeded?: boolean;
  internalNotes?: string;
  // when coming from Google Calendar:
  _externalGoogleId?: string;
};

type Props = {
  gigs: Gig[];
  extraEvents?: Array<{
    id: string;
    title: string;
    startISO: string;
    endISO: string;
    description?: string;
  }>;
  onEventClick?: (gig: Gig) => void;
};

const localizer = luxonLocalizer(DateTime, { firstDayOfWeek: 1 });

/** Custom shadcn toolbar (fixes “buttons don’t switch view” issues) */
function Toolbar({
  label,
  onNavigate,
  onView,
  view,
}: {
  label: string;
  onNavigate: (action: "TODAY" | "PREV" | "NEXT") => void;
  onView: (view: View) => void;
  view: View;
}) {
  return (
    <div className="rbc-toolbar flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("PREV")}>
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("NEXT")}>
          Next
        </Button>
      </div>
      <div className="text-white/90 font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <Button
          variant={view === Views.MONTH ? "default" : "outline"}
          size="sm"
          onClick={() => onView(Views.MONTH)}
        >
          Month
        </Button>
        <Button
          variant={view === Views.WEEK ? "default" : "outline"}
          size="sm"
          onClick={() => onView(Views.WEEK)}
        >
          Week
        </Button>
        <Button
          variant={view === Views.DAY ? "default" : "outline"}
          size="sm"
          onClick={() => onView(Views.DAY)}
        >
          Day
        </Button>
        <Button
          variant={view === Views.AGENDA ? "default" : "outline"}
          size="sm"
          onClick={() => onView(Views.AGENDA)}
        >
          Agenda
        </Button>
      </div>
    </div>
  );
}

/** Optional: custom event chip */
function EventItem({ event }: EventProps) {
  const gig = event.resource as Gig | undefined;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-medium">{event.title}</span>
      {gig?.privateEvent ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">Private</span>
      ) : null}
      {gig?.postersNeeded ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">Posters</span>
      ) : null}
      {gig?._externalGoogleId ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">GCal</span>
      ) : null}
    </div>
  );
}

export default function GigCalendar({ gigs, extraEvents = [], onEventClick }: Props) {
  // Map your gigs
  const gigEvents: RBCEvent[] = useMemo(() => {
    return gigs.map((g) => {
      const base = DateTime.fromISO(g.date, { zone: "Europe/London" });
      const [h, m] = (g.startTime ?? "19:00").split(":").map(Number);
      const start = base.set({ hour: h || 0, minute: m || 0, second: 0, millisecond: 0 });
      const end = start.plus({ hours: 2 });

      return {
        id: g._id ?? `${g.venue}-${g.date}-${g.startTime ?? "1900"}`,
        title: g.venue || "Gig",
        start: start.toJSDate(),
        end: end.toJSDate(),
        resource: g,
        allDay: false,
      };
    });
  }, [gigs]);

  // Map extra Google events (read-only)
  const googleEvents: RBCEvent[] = useMemo(() => {
    return extraEvents.map((e) => {
      const start = DateTime.fromISO(e.startISO).toJSDate();
      const end = DateTime.fromISO(e.endISO).toJSDate();
      const g: Gig = {
        venue: e.title,
        date: DateTime.fromISO(e.startISO).toISODate() ?? "",
        internalNotes: e.description,
        _externalGoogleId: e.id,
      };
      return {
        id: `gcal-${e.id}`,
        title: e.title,
        start,
        end,
        resource: g,
        allDay: false,
      };
    });
  }, [extraEvents]);

  const events = useMemo(() => [...gigEvents, ...googleEvents], [gigEvents, googleEvents]);

  const handleSelectEvent = useCallback(
    (evt: RBCEvent) => {
      const gig = evt.resource as Gig;
      onEventClick?.(gig);
    },
    [onEventClick]
  );

  // Colors: normal gigs = emerald, private = indigo, posters = red, GCal = slate
  const eventPropGetter = useCallback((event: RBCEvent) => {
    const gig = event.resource as Gig;
    let bg = "#10B981"; // emerald
    if (gig?._externalGoogleId) bg = "#64748B"; // slate
    if (gig?.privateEvent) bg = "#6366F1";      // indigo
    if (gig?.postersNeeded) bg = "#EF4444";     // red
    return {
      style: {
        backgroundColor: bg,
        border: "none",
        color: "white",
      },
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-3">
      {/* Soft theme overrides (remove harsh white lines) */}
      <style>{`
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { background: transparent; }
        .rbc-header, .rbc-time-header { color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.08); }
        .rbc-today { background-color: rgba(16,185,129,0.12); }
        .rbc-off-range-bg { background: rgba(255,255,255,0.03); }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid rgba(255,255,255,0.06); }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.06); }
        .rbc-time-content, .rbc-time-gutter, .rbc-time-header-gutter {
          border-color: rgba(255,255,255,0.06);
        }
        .rbc-time-slot, .rbc-timeslot-group {
          border-color: rgba(255,255,255,0.06);
        }

        /* Make sure buttons are clickable even if some CSS resets run */
        .rbc-toolbar button {
          all: revert; /* undo any 'all: unset' from 3rd-party resets */
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        components={{
          event: EventItem,
          toolbar: (props) => (
            <Toolbar
              label={props.label}
              onNavigate={props.onNavigate as any}
              onView={props.onView as any}
              view={props.view}
            />
          ),
        }}
        popup
        onSelectEvent={handleSelectEvent}
        step={30}
        timeslots={2}
        min={DateTime.fromObject({ hour: 9 }).toJSDate()}
        max={DateTime.fromObject({ hour: 23 }).toJSDate()}
        eventPropGetter={eventPropGetter}
      />
    </div>
  );
}
