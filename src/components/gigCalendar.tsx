"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
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
  date: string;          // yyyy-mm-dd
  startTime?: string;    // HH:mm
  description?: string;
  fee?: number | string;
  privateEvent?: boolean;
  postersNeeded?: boolean;
  internalNotes?: string;
  _externalGoogleId?: string;
};

type Props = {
  gigs: Gig[];
  extraEvents?: Array<{
    id: string;
    title: string;
    startISO: string;
    endISO: string;      // all-day is next-day exclusive (server already handles)
    description?: string;
    allDay?: boolean;
  }>;
  onEventClick?: (gig: Gig) => void;
  onCreateGig?: (dateISO: string, startTimeHHmm?: string) => void;
};

const localizer = luxonLocalizer(DateTime, { firstDayOfWeek: 1 });

function EventItem({ event }: EventProps) {
  const gig = (event?.resource as Gig) || undefined;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-medium">{event?.title || "Event"}</span>
      {gig?.privateEvent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">Private</span>}
      {gig?.postersNeeded && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">Posters</span>}
      {gig?._externalGoogleId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">GCal</span>}
    </div>
  );
}

function weeksInMonth(date: Date) {
  const dt = DateTime.fromJSDate(date);
  const start = dt.startOf("month");
  const days = start.daysInMonth!;
  const lead = ((start.weekday + 6) % 7);
  return Math.ceil((lead + days) / 7);
}

export default function GigCalendar({
  gigs,
  extraEvents = [],
  onEventClick,
  onCreateGig,
}: Props) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());

  // --- mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Always supply a view that exists on mobile
  const safeView: View =
    isMobile && view === Views.MONTH ? Views.AGENDA : view;

  // And always include the current `view` in the `views` prop to avoid RBC crashes mid-resize
  const viewsProp =
    isMobile
      ? { week: true, agenda: true, [view]: true }
      : { month: true, week: true, agenda: true, [view]: true };

  // Header label
  const headerLabel = (() => {
    const dt = DateTime.fromJSDate(date).setLocale("en-GB");
    if (safeView === Views.MONTH) return dt.toFormat("LLLL yyyy");
    if (safeView === Views.WEEK) {
      const start = dt.minus({ days: dt.weekday - 1 });
      const end = start.plus({ days: 6 });
      return `${start.toFormat("d LLL")} – ${end.toFormat("d LLL yyyy")}`;
    }
    return dt.toFormat("LLLL yyyy");
  })();

  // Navigation
  const goToday = () => setDate(new Date());
  const goPrev = () => {
    const d = DateTime.fromJSDate(date);
    setDate((safeView === Views.MONTH ? d.minus({ months: 1 }) : d.minus({ weeks: 1 })).toJSDate());
  };
  const goNext = () => {
    const d = DateTime.fromJSDate(date);
    setDate((safeView === Views.MONTH ? d.plus({ months: 1 }) : d.plus({ weeks: 1 })).toJSDate());
  };

  // Dynamic heights so it doesn’t clip the footer
  const monthRows = weeksInMonth(date);
  const MONTH_ROW_H = isMobile ? 64 : 74;
  const MONTH_HEADER_H = isMobile ? 32 : 38;
  const MONTH_CHROME = 14;
  const monthHeight = MONTH_HEADER_H + monthRows * MONTH_ROW_H + MONTH_CHROME;
  const weekHeight = isMobile ? 500 : 520;
  const agendaHeight = isMobile ? 540 : 420;
  const calendarHeight =
    safeView === Views.MONTH ? monthHeight :
    safeView === Views.WEEK  ? weekHeight   :
                               agendaHeight;

  // ---- DB gigs -> events
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

  // ---- Google events (server now supplies `allDay` and exclusive end for all-day)
  const googleEvents: RBCEvent[] = useMemo(() => {
    return extraEvents.map((e) => {
      const isAllDay = !!e.allDay;
      const startDT = DateTime.fromISO(e.startISO);
      const endDT = isAllDay
        ? DateTime.fromISO(e.endISO).minus({ seconds: 1 })
        : DateTime.fromISO(e.endISO);

      const g: Gig = {
        venue: e.title || "Event",
        date: startDT.toISODate() ?? "",
        internalNotes: e.description,
        _externalGoogleId: e.id,
      };

      return {
        id: `gcal-${e.id}`,
        title: e.title || "Event",
        start: startDT.toJSDate(),
        end: endDT.toJSDate(),
        resource: g,
        allDay: isAllDay,
      };
    });
  }, [extraEvents]);

  // ---- Sanitize so RBC never gets a bad/undefined event
  const events: RBCEvent[] = useMemo(() => {
    const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime?.());
    return [...gigEvents, ...googleEvents].filter(
      (e): e is RBCEvent =>
        !!e &&
        typeof e.title === "string" &&
        e.title.length > 0 &&
        isValidDate(e.start) &&
        isValidDate(e.end)
    );
  }, [gigEvents, googleEvents]);

  const handleSelectEvent = useCallback(
    (evt: RBCEvent) => onEventClick?.(evt.resource as Gig),
    [onEventClick]
  );

  const eventPropGetter = useCallback((event: RBCEvent) => {
    const gig = event.resource as Gig;
    let bg = "#10B981";
    if (gig?._externalGoogleId) bg = "#64748B";
    if (gig?.privateEvent) bg = "#6366F1";
    if (gig?.postersNeeded) bg = "#EF4444";
    return { style: { backgroundColor: bg, border: "none", color: "white" } };
  }, []);

  const handleSelectSlot = useCallback(
    (info: { start: Date; end: Date; action: string; slots: Date[] }) => {
      const start = DateTime.fromJSDate(info.start).setZone("Europe/London");
      const dateISO = start.toISODate()!;
      const timeHHmm = safeView === Views.WEEK ? start.toFormat("HH:mm") : undefined;
      onCreateGig?.(dateISO, timeHHmm);
    },
    [onCreateGig, safeView]
  );

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={goPrev}>Back</Button>
          <Button variant="outline" size="sm" onClick={goNext}>Next</Button>
        </div>
        <div className="text-white/90 font-medium">{headerLabel}</div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button
              variant={safeView === Views.MONTH ? "default" : "outline"}
              size="sm"
              onClick={() => setView(Views.MONTH)}
            >
              Month
            </Button>
          )}
          <Button
            variant={safeView === Views.WEEK ? "default" : "outline"}
            size="sm"
            onClick={() => setView(Views.WEEK)}
          >
            Week
          </Button>
          <Button
            variant={safeView === Views.AGENDA ? "default" : "outline"}
            size="sm"
            onClick={() => setView(Views.AGENDA)}
          >
            {isMobile ? "List" : "Agenda"}
          </Button>
        </div>
      </div>

      <style>{`
        .rbc-toolbar { display: none !important; }

        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { background: transparent; }
        .rbc-header, .rbc-time-header { color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.06); }
        .rbc-today { background-color: rgba(16,185,129,0.10); }
        .rbc-off-range-bg { background: rgba(255,255,255,0.02); }

        .rbc-month-row + .rbc-month-row { border-top: 1px solid rgba(255,255,255,0.05); }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05); }

        .rbc-time-slot { border-top: 0 !important; }
        .rbc-timeslot-group { border-top: 1px solid rgba(255,255,255,0.07) !important; }
        .rbc-time-content, .rbc-time-gutter, .rbc-time-header-gutter { border-color: rgba(255,255,255,0.06); }

        @media (min-width: 641px) {
          .rbc-month-view .rbc-day-bg:hover {
            background-color: rgba(16,185,129,0.09);
            outline: 1px solid rgba(16,185,129,0.35);
            cursor: pointer;
          }
          .rbc-time-content .rbc-time-column:hover .rbc-timeslot-group {
            background-color: rgba(16,185,129,0.06);
          }
        }

        @media (max-width: 640px) {
          .rbc-header { font-size: 12px; padding: 6px 0 }
          .rbc-date-cell { font-size: 12px; padding-right: 4px }
          .rbc-event { padding: 2px 6px; font-size: 12px; border-radius: 6px }
          .rbc-event-label { display: none }
          .rbc-agenda-view table.rbc-agenda-table { font-size: 13px }
          .rbc-agenda-date-cell, .rbc-agenda-time-cell { white-space: nowrap }
          .rbc-time-gutter { width: 38px !important }
        }
      `}</style>

      <Calendar
        key={`${safeView}-${isMobile ? "m" : "d"}-${monthRows}`}
        localizer={localizer}
        view={safeView}
        onView={setView}
        date={date}
        onNavigate={(d) => setDate(d as Date)}
        views={viewsProp}
        step={60}
        timeslots={1}
        min={DateTime.fromObject({ hour: 9 }).toJSDate()}
        max={DateTime.fromObject({ hour: 23 }).toJSDate()}
        events={events}
        popup
        selectable="ignoreEvents"
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        components={{ event: EventItem, toolbar: () => null }}
        style={{ height: `${calendarHeight}px` }}
      />
    </div>
  );
}
