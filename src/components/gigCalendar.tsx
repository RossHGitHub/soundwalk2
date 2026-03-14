"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  Calendar,
  Views,
  luxonLocalizer,
  type Event as RBCEvent,
  type EventProps,
  type View,
} from "react-big-calendar";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Lock,
  Megaphone,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import "react-big-calendar/lib/css/react-big-calendar.css";

export type Gig = {
  _id?: string;
  venue: string;
  date: string;
  startTime?: string;
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
    endISO: string;
    description?: string;
    allDay?: boolean;
  }>;
  onEventClick?: (gig: Gig) => void;
  onCreateGig?: (dateISO: string, startTimeHHmm?: string) => void;
};

type CalendarEvent = RBCEvent & {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Gig;
  allDay?: boolean;
};

type Tone = {
  key: "gig" | "private" | "posters" | "google";
  label: string;
  bg: string;
  soft: string;
  border: string;
  text: string;
  dot: string;
};

type MobileBucket = {
  dateISO: string;
  dayLabel: string;
  metaLabel: string;
  isToday: boolean;
  events: CalendarEvent[];
};

const localizer = luxonLocalizer(DateTime, { firstDayOfWeek: 1 });

const EVENT_TONES: Record<Tone["key"], Tone> = {
  gig: {
    key: "gig",
    label: "Booked Gigs",
    bg: "#0f766e",
    soft: "rgba(15, 118, 110, 0.18)",
    border: "rgba(94, 234, 212, 0.36)",
    text: "#e6fffb",
    dot: "#5eead4",
  },
  private: {
    key: "private",
    label: "Private Event",
    bg: "#a16207",
    soft: "rgba(161, 98, 7, 0.18)",
    border: "rgba(251, 191, 36, 0.34)",
    text: "#fff7df",
    dot: "#fbbf24",
  },
  posters: {
    key: "posters",
    label: "Posters to Action",
    bg: "#c2410c",
    soft: "rgba(194, 65, 12, 0.18)",
    border: "rgba(251, 146, 60, 0.34)",
    text: "#fff0e8",
    dot: "#fb923c",
  },
  google: {
    key: "google",
    label: "Google calendar",
    bg: "#1d4ed8",
    soft: "rgba(29, 78, 216, 0.18)",
    border: "rgba(96, 165, 250, 0.34)",
    text: "#eef5ff",
    dot: "#60a5fa",
  },
};

const LEGEND_ORDER: Array<{ key: "gig" | "posters" | "private"; label: string }> = [
  { key: "gig", label: "Booked Gigs" },
  { key: "posters", label: "Posters to Action" },
  { key: "private", label: "Private Event" },
];

function getEventTone(gig?: Gig): Tone {
  if (gig?.postersNeeded) return EVENT_TONES.posters;
  if (gig?.privateEvent) return EVENT_TONES.private;
  if (gig?._externalGoogleId) return EVENT_TONES.google;
  return EVENT_TONES.gig;
}

function getLegendKey(gig?: Gig): "gig" | "posters" | "private" {
  if (gig?.postersNeeded) return "posters";
  if (gig?.privateEvent) return "private";
  return "gig";
}

function getDedupKey(event: CalendarEvent) {
  return [
    event.title.trim().toLowerCase().replace(/\s+/g, " "),
    event.start.getTime(),
    event.end.getTime(),
    event.allDay ? "all-day" : "timed",
  ].join("|");
}

function getEventPriority(event: CalendarEvent) {
  if (event.resource._id) return 3;
  if (event.resource._externalGoogleId) return 2;
  return 1;
}

function formatEventTime(event: CalendarEvent, compact = false) {
  if (event.allDay) return "All day";

  const start = DateTime.fromJSDate(event.start).setZone("Europe/London");
  const end = DateTime.fromJSDate(event.end).setZone("Europe/London");
  const startFormat = compact ? "HH:mm" : "HH:mm";

  return `${start.toFormat(startFormat)}-${end.toFormat("HH:mm")}`;
}

function getRangeLabel(dateISO: string) {
  return DateTime.fromISO(dateISO, { zone: "Europe/London" })
    .setLocale("en-GB")
    .toFormat("cccc d LLL");
}

function weeksInMonth(date: Date) {
  const dt = DateTime.fromJSDate(date);
  const start = dt.startOf("month");
  const days = start.daysInMonth ?? 0;
  const lead = (start.weekday + 6) % 7;
  return Math.ceil((lead + days) / 7);
}

function getVisibleRange(view: View, date: Date, isMobile: boolean) {
  const anchor = DateTime.fromJSDate(date).setZone("Europe/London");

  if (view === Views.WEEK) {
    const start = anchor.startOf("week");
    const end = start.plus({ days: 6 }).endOf("day");
    return { start, end };
  }

  if (isMobile || view === Views.MONTH || view === Views.AGENDA) {
    return {
      start: anchor.startOf("month"),
      end: anchor.endOf("month"),
    };
  }

  return {
    start: anchor.startOf("month"),
    end: anchor.endOf("month"),
  };
}

function isEventInRange(event: CalendarEvent, start: DateTime, end: DateTime) {
  const eventStart = DateTime.fromJSDate(event.start).setZone("Europe/London");
  const eventEnd = DateTime.fromJSDate(event.end).setZone("Europe/London");
  return eventEnd >= start && eventStart <= end;
}

function EventItem({ event }: EventProps<CalendarEvent>) {
  const gig = event.resource;
  const tone = getEventTone(gig);
  const typeLabel = gig.privateEvent
    ? "Private"
    : gig.postersNeeded
      ? "Poster run"
      : gig._externalGoogleId
        ? "Google"
        : "Gig";

  return (
    <div className="gig-calendar-event-item">
      <div className="gig-calendar-event-title-row">
        <span
          className="gig-calendar-event-dot"
          style={{ backgroundColor: tone.dot }}
          aria-hidden="true"
        />
        <span className="gig-calendar-event-title">{event.title || "Event"}</span>
      </div>
      <div className="gig-calendar-event-meta">
        <span>{formatEventTime(event, true)}</span>
        <span className="gig-calendar-event-separator" aria-hidden="true">
          •
        </span>
        <span>{typeLabel}</span>
      </div>
    </div>
  );
}

function LegendPill({ tone, count }: { tone: Tone; count: number }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
      style={{
        backgroundColor: tone.soft,
        borderColor: tone.border,
        color: tone.text,
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: tone.dot }}
        aria-hidden="true"
      />
      <span>{tone.label}</span>
      <span className="text-white/70">{count}</span>
    </div>
  );
}

export default function GigCalendar({
  gigs,
  extraEvents = [],
  onEventClick,
  onCreateGig,
}: Props) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const effectiveView = isMobile
    ? view === Views.WEEK
      ? Views.WEEK
      : Views.AGENDA
    : view;

  const gigEvents: CalendarEvent[] = useMemo(() => {
    return gigs.map((g) => {
      const base = DateTime.fromISO(g.date, { zone: "Europe/London" });
      const [hour, minute] = (g.startTime ?? "19:00").split(":").map(Number);
      const start = base.set({
        hour: hour || 0,
        minute: minute || 0,
        second: 0,
        millisecond: 0,
      });
      const end = start.plus({ hours: 2 });

      return {
        id: g._id ?? `${g.venue}-${g.date}-${g.startTime ?? "19:00"}`,
        title: g.venue || "Gig",
        start: start.toJSDate(),
        end: end.toJSDate(),
        resource: g,
        allDay: false,
      };
    });
  }, [gigs]);

  const googleEvents: CalendarEvent[] = useMemo(() => {
    return extraEvents.map((e) => {
      const isAllDay = !!e.allDay;
      const startDT = DateTime.fromISO(e.startISO, { zone: "Europe/London" });
      const endDT = isAllDay
        ? DateTime.fromISO(e.endISO, { zone: "Europe/London" }).minus({ seconds: 1 })
        : DateTime.fromISO(e.endISO, { zone: "Europe/London" });

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

  const events: CalendarEvent[] = useMemo(() => {
    const isValidDate = (value: unknown): value is Date =>
      value instanceof Date && !Number.isNaN(value.getTime());

    const deduped = new Map<string, CalendarEvent>();

    [...gigEvents, ...googleEvents]
      .filter(
        (event): event is CalendarEvent =>
          !!event &&
          typeof event.title === "string" &&
          event.title.length > 0 &&
          isValidDate(event.start) &&
          isValidDate(event.end)
      )
      .forEach((event) => {
        const key = getDedupKey(event);
        const existing = deduped.get(key);

        if (!existing || getEventPriority(event) > getEventPriority(existing)) {
          deduped.set(key, event);
        }
      });

    return Array.from(deduped.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [gigEvents, googleEvents]);

  const visibleRange = useMemo(
    () => getVisibleRange(effectiveView, date, isMobile),
    [date, effectiveView, isMobile]
  );

  const visibleEvents = useMemo(
    () => events.filter((event) => isEventInRange(event, visibleRange.start, visibleRange.end)),
    [events, visibleRange]
  );

  const nextEvent = useMemo(() => {
    const now = DateTime.now().setZone("Europe/London");
    return events.find((event) =>
      DateTime.fromJSDate(event.end).setZone("Europe/London") >= now
    );
  }, [events]);

  const summaryCounts = useMemo(() => {
    return LEGEND_ORDER.map(({ key, label }) => ({
      tone: { ...EVENT_TONES[key], label },
      count: visibleEvents.filter((event) => getLegendKey(event.resource) === key).length,
    }));
  }, [visibleEvents]);

  const mobileBuckets: MobileBucket[] = useMemo(() => {
    if (!isMobile) return [];

    const todayISO = DateTime.now().setZone("Europe/London").toISODate();

    if (effectiveView === Views.WEEK) {
      return Array.from({ length: 7 }, (_, index) => {
        const current = visibleRange.start.plus({ days: index });
        const dateISO = current.toISODate() ?? "";

        return {
          dateISO,
          dayLabel: current.toFormat("ccc d"),
          metaLabel: current.toFormat("LLLL"),
          isToday: dateISO === todayISO,
          events: visibleEvents.filter(
            (event) =>
              DateTime.fromJSDate(event.start).setZone("Europe/London").toISODate() === dateISO
          ),
        };
      });
    }

    const grouped = visibleEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const dateISO =
        DateTime.fromJSDate(event.start).setZone("Europe/London").toISODate() ?? "";
      if (!acc[dateISO]) acc[dateISO] = [];
      acc[dateISO].push(event);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateISO, dayEvents]) => {
        const current = DateTime.fromISO(dateISO, { zone: "Europe/London" });
        return {
          dateISO,
          dayLabel: current.toFormat("ccc d"),
          metaLabel: current.toFormat("LLLL"),
          isToday: dateISO === todayISO,
          events: dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime()),
        };
      });
  }, [effectiveView, isMobile, visibleEvents, visibleRange]);

  const handleSelectEvent = useCallback(
    (event: RBCEvent) => onEventClick?.((event as CalendarEvent).resource),
    [onEventClick]
  );

  const handleCreateGig = useCallback(
    (dateISO: string, startTimeHHmm?: string) => {
      onCreateGig?.(dateISO, startTimeHHmm);
    },
    [onCreateGig]
  );

  const handleSelectSlot = useCallback(
    (info: { start: Date }) => {
      const start = DateTime.fromJSDate(info.start).setZone("Europe/London");
      const dateISO = start.toISODate() ?? "";
      const timeHHmm = effectiveView === Views.WEEK ? start.toFormat("HH:mm") : undefined;
      handleCreateGig(dateISO, timeHHmm);
    },
    [effectiveView, handleCreateGig]
  );

  const eventPropGetter = useCallback((event: RBCEvent) => {
    const tone = getEventTone((event as CalendarEvent).resource);

    return {
      style: {
        backgroundColor: tone.soft,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        boxShadow: "none",
      },
    };
  }, []);

  const goToday = () => setDate(new Date());

  const goPrev = () => {
    const anchor = DateTime.fromJSDate(date).setZone("Europe/London");
    const unit = effectiveView === Views.WEEK ? { weeks: 1 } : { months: 1 };
    setDate(anchor.minus(unit).toJSDate());
  };

  const goNext = () => {
    const anchor = DateTime.fromJSDate(date).setZone("Europe/London");
    const unit = effectiveView === Views.WEEK ? { weeks: 1 } : { months: 1 };
    setDate(anchor.plus(unit).toJSDate());
  };

  const headerLabel = useMemo(() => {
    const anchor = DateTime.fromJSDate(date).setZone("Europe/London").setLocale("en-GB");

    if (effectiveView === Views.WEEK) {
      const start = anchor.startOf("week");
      const end = start.plus({ days: 6 });
      return `${start.toFormat("d LLL")} - ${end.toFormat("d LLL yyyy")}`;
    }

    return anchor.toFormat("LLLL yyyy");
  }, [date, effectiveView]);

  const viewsProp =
    effectiveView === Views.MONTH
      ? { month: true, week: true, agenda: true }
      : { week: true, agenda: true, month: true };

  const monthRows = weeksInMonth(date);
  const monthHeight = 96 + monthRows * 128;
  const weekHeight = 760;
  const agendaHeight = 560;
  const calendarHeight =
    effectiveView === Views.MONTH
      ? monthHeight
      : effectiveView === Views.WEEK
        ? weekHeight
        : agendaHeight;

  return (
    <div className="gig-calendar-shell overflow-hidden rounded-[28px] border border-[#244353] bg-[radial-gradient(circle_at_top_left,_rgba(75,171,168,0.18),_transparent_38%),linear-gradient(180deg,#10232e_0%,#09161d_100%)] p-4 text-[#ecf7fb] shadow-[0_24px_80px_rgba(2,12,18,0.48)] sm:p-5">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#31586b] bg-[#102d3b]/90 text-[#7ce0d2]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8db1be]">
                Gig calendar
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {headerLabel}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {summaryCounts.map(({ tone, count }) => (
              <LegendPill key={tone.key} tone={tone} count={count} />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[340px] lg:max-w-[380px]">
          <div className="rounded-2xl border border-[#2b4958] bg-[#0b1d27]/85 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8db1be]">
              Next up
            </p>
            {nextEvent ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-semibold text-white">{nextEvent.title}</p>
                <p className="text-sm text-[#c7dde5]">
                  {getRangeLabel(
                    DateTime.fromJSDate(nextEvent.start)
                      .setZone("Europe/London")
                      .toISODate() ?? ""
                  )}
                  {" · "}
                  {formatEventTime(nextEvent)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#c7dde5]">No upcoming events scheduled.</p>
            )}
          </div>

          <Button
            type="button"
            onClick={() =>
              handleCreateGig(DateTime.now().setZone("Europe/London").toISODate() ?? "")
            }
            className="h-auto rounded-2xl bg-[#d4ae64] px-4 py-3 text-[#1a1e16] hover:bg-[#e1bb71]"
          >
            <Plus className="h-4 w-4" />
            Add gig
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 border-t border-white/8 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#33576a] bg-[#102634] text-[#d7e7ed] hover:bg-[#163445] hover:text-white"
            onClick={goToday}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#33576a] bg-[#102634] px-3 text-[#d7e7ed] hover:bg-[#163445] hover:text-white"
            onClick={goPrev}
            aria-label="Go to previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#33576a] bg-[#102634] px-3 text-[#d7e7ed] hover:bg-[#163445] hover:text-white"
            onClick={goNext}
            aria-label="Go to next period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isMobile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setView(Views.MONTH)}
              className={cn(
                "border-[#33576a] px-4",
                effectiveView === Views.MONTH
                  ? "bg-[#1b4756] text-white hover:bg-[#235768]"
                  : "bg-[#0d202a] text-[#c7dde5] hover:bg-[#163445] hover:text-white"
              )}
            >
              Month
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setView(Views.WEEK)}
            className={cn(
              "border-[#33576a] px-4",
              effectiveView === Views.WEEK
                ? "bg-[#1b4756] text-white hover:bg-[#235768]"
                : "bg-[#0d202a] text-[#c7dde5] hover:bg-[#163445] hover:text-white"
            )}
          >
            Week
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setView(Views.AGENDA)}
            className={cn(
              "border-[#33576a] px-4",
              effectiveView === Views.AGENDA
                ? "bg-[#1b4756] text-white hover:bg-[#235768]"
                : "bg-[#0d202a] text-[#c7dde5] hover:bg-[#163445] hover:text-white"
            )}
          >
            {isMobile ? "List" : "Schedule"}
          </Button>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {mobileBuckets.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#305467] bg-[#0b1d27]/75 px-5 py-8 text-center">
              <p className="text-lg font-semibold text-white">No gigs in this period</p>
              <p className="mt-2 text-sm text-[#b7ced7]">
                This mobile view uses a day-by-day list so the schedule stays readable.
              </p>
              <Button
                type="button"
                onClick={() =>
                  handleCreateGig(
                    DateTime.fromJSDate(date).setZone("Europe/London").toISODate() ?? ""
                  )
                }
                className="mt-4 rounded-xl bg-[#d4ae64] text-[#1a1e16] hover:bg-[#e1bb71]"
              >
                <Plus className="h-4 w-4" />
                Create a gig
              </Button>
            </div>
          ) : (
            mobileBuckets.map((bucket) => (
              <section
                key={bucket.dateISO}
                className={cn(
                  "rounded-[24px] border bg-[#0b1d27]/86 p-4 shadow-[0_14px_32px_rgba(4,12,18,0.25)]",
                  bucket.isToday ? "border-[#d4ae64]/65" : "border-[#2c4d5e]"
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-center",
                        bucket.isToday
                          ? "border-[#d4ae64]/65 bg-[#d4ae64]/12 text-[#fde8b6]"
                          : "border-[#315666] bg-[#102634] text-[#def0f6]"
                      )}
                    >
                      <p className="text-base font-semibold">{bucket.dayLabel}</p>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-current/70">
                        {bucket.metaLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {bucket.events.length} {bucket.events.length === 1 ? "event" : "events"}
                      </p>
                      <p className="text-xs text-[#8db1be]">{bucket.isToday ? "Today" : getRangeLabel(bucket.dateISO)}</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#33576a] bg-[#102634] text-[#d7e7ed] hover:bg-[#163445] hover:text-white"
                    onClick={() => handleCreateGig(bucket.dateISO)}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {bucket.events.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#325363] px-4 py-5 text-sm text-[#b7ced7]">
                      No gigs booked for this day.
                    </div>
                  ) : (
                    bucket.events.map((event) => {
                      const tone = getEventTone(event.resource);
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => onEventClick?.(event.resource)}
                          className="block w-full rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:brightness-110"
                          style={{
                            backgroundColor: tone.soft,
                            borderColor: tone.border,
                            color: tone.text,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{event.title}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-current/80">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {formatEventTime(event)}
                                </span>
                                {event.resource.privateEvent && (
                                  <span className="inline-flex items-center gap-1">
                                    <Lock className="h-3.5 w-3.5" />
                                    Private
                                  </span>
                                )}
                                {event.resource.postersNeeded && (
                                  <span className="inline-flex items-center gap-1">
                                    <Megaphone className="h-3.5 w-3.5" />
                                    Posters
                                  </span>
                                )}
                                {event.resource._externalGoogleId && (
                                  <span className="inline-flex items-center gap-1">
                                    <Globe2 className="h-3.5 w-3.5" />
                                    Google
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <>
          <style>{`
            .gig-calendar-shell .rbc-toolbar {
              display: none !important;
            }

            .gig-calendar-shell .rbc-month-view,
            .gig-calendar-shell .rbc-time-view,
            .gig-calendar-shell .rbc-agenda-view {
              overflow: hidden;
              border: 1px solid rgba(141, 177, 190, 0.16);
              border-radius: 26px;
              background:
                linear-gradient(180deg, rgba(7, 21, 29, 0.92) 0%, rgba(11, 29, 39, 0.94) 100%);
            }

            .gig-calendar-shell .rbc-header {
              padding: 14px 10px;
              border-bottom: 1px solid rgba(141, 177, 190, 0.12);
              color: #d7e7ed;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }

            .gig-calendar-shell .rbc-time-header,
            .gig-calendar-shell .rbc-time-content,
            .gig-calendar-shell .rbc-time-gutter,
            .gig-calendar-shell .rbc-time-header-content,
            .gig-calendar-shell .rbc-time-view {
              border-color: rgba(141, 177, 190, 0.12);
            }

            .gig-calendar-shell .rbc-time-slot {
              border-top: 0;
            }

            .gig-calendar-shell .rbc-timeslot-group {
              border-top: 1px solid rgba(141, 177, 190, 0.1);
              min-height: 64px;
            }

            .gig-calendar-shell .rbc-label {
              color: rgba(198, 220, 228, 0.8);
              font-size: 12px;
            }

            .gig-calendar-shell .rbc-current-time-indicator {
              background-color: rgba(212, 174, 100, 0.92);
              height: 2px;
            }

            .gig-calendar-shell .rbc-month-row + .rbc-month-row,
            .gig-calendar-shell .rbc-day-bg + .rbc-day-bg {
              border-color: rgba(141, 177, 190, 0.12);
            }

            .gig-calendar-shell .rbc-day-bg {
              background: rgba(10, 25, 34, 0.64);
              transition: background-color 160ms ease;
            }

            .gig-calendar-shell .rbc-off-range-bg {
              background: rgba(255, 255, 255, 0.025);
            }

            .gig-calendar-shell .rbc-day-bg.rbc-today,
            .gig-calendar-shell .rbc-today {
              background:
                linear-gradient(180deg, rgba(212, 174, 100, 0.15) 0%, rgba(212, 174, 100, 0.04) 100%);
            }

            .gig-calendar-shell .rbc-date-cell {
              padding: 8px 10px 0;
              text-align: left;
            }

            .gig-calendar-shell .rbc-date-cell > a {
              display: inline-flex;
              min-width: 2rem;
              align-items: center;
              justify-content: center;
              border-radius: 999px;
              padding: 2px 8px;
              color: rgba(215, 231, 237, 0.9);
              font-size: 13px;
              font-weight: 700;
            }

            .gig-calendar-shell .rbc-now .rbc-button-link {
              background: rgba(212, 174, 100, 0.18);
              color: #fde8b6;
            }

            .gig-calendar-shell .rbc-off-range .rbc-button-link {
              color: rgba(141, 177, 190, 0.48);
            }

            .gig-calendar-shell .rbc-row-content {
              padding: 2px 6px 8px;
            }

            .gig-calendar-shell .rbc-event {
              min-height: 48px;
              border-radius: 14px;
              padding: 0;
              overflow: hidden;
            }

            .gig-calendar-shell .rbc-row-segment {
              padding: 1px 4px 5px;
            }

            .gig-calendar-shell .rbc-event:focus,
            .gig-calendar-shell .rbc-event:hover {
              filter: brightness(1.08);
            }

            .gig-calendar-shell .gig-calendar-event-item {
              display: flex;
              height: 100%;
              min-width: 0;
              flex-direction: column;
              justify-content: center;
              gap: 3px;
              padding: 8px 10px;
            }

            .gig-calendar-shell .gig-calendar-event-title-row {
              display: flex;
              min-width: 0;
              align-items: center;
              gap: 7px;
            }

            .gig-calendar-shell .gig-calendar-event-dot {
              height: 8px;
              width: 8px;
              flex-shrink: 0;
              border-radius: 999px;
            }

            .gig-calendar-shell .gig-calendar-event-title {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 12.5px;
              font-weight: 700;
              line-height: 1.2;
            }

            .gig-calendar-shell .gig-calendar-event-meta {
              display: flex;
              align-items: center;
              gap: 5px;
              color: rgba(236, 247, 251, 0.76);
              font-size: 10.5px;
              font-weight: 600;
              letter-spacing: 0.03em;
              text-transform: uppercase;
            }

            .gig-calendar-shell .gig-calendar-event-separator {
              opacity: 0.45;
            }

            .gig-calendar-shell .rbc-show-more {
              color: #d7e7ed;
              font-size: 11px;
              font-weight: 700;
              padding-left: 8px;
            }

            .gig-calendar-shell .rbc-day-bg:hover {
              background: rgba(21, 55, 69, 0.72);
              cursor: pointer;
            }

            .gig-calendar-shell .rbc-time-content .rbc-day-slot .rbc-events-container {
              margin-right: 0;
            }

            .gig-calendar-shell .rbc-agenda-view table.rbc-agenda-table {
              border-collapse: separate;
              border-spacing: 0 10px;
              background: transparent;
            }

            .gig-calendar-shell .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
              border-bottom: 1px solid rgba(141, 177, 190, 0.12);
              color: #8db1be;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .gig-calendar-shell .rbc-agenda-view table.rbc-agenda-table tbody > tr {
              overflow: hidden;
              background: rgba(16, 38, 52, 0.72);
              box-shadow: inset 0 0 0 1px rgba(141, 177, 190, 0.14);
            }

            .gig-calendar-shell .rbc-agenda-view table.rbc-agenda-table tbody > tr td {
              border-top: 0;
              color: #ecf7fb;
              padding: 14px 16px;
            }

            .gig-calendar-shell .rbc-agenda-date-cell,
            .gig-calendar-shell .rbc-agenda-time-cell {
              color: rgba(215, 231, 237, 0.78);
              font-weight: 600;
              white-space: nowrap;
            }
          `}</style>

          <Calendar
            localizer={localizer}
            date={date}
            view={effectiveView}
            onView={setView}
            onNavigate={(nextDate) => setDate(nextDate as Date)}
            views={viewsProp}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable="ignoreEvents"
            popup
            step={60}
            timeslots={1}
            min={DateTime.fromObject({ hour: 9 }).toJSDate()}
            max={DateTime.fromObject({ hour: 23 }).toJSDate()}
            style={{ height: `${calendarHeight}px` }}
            messages={{ showMore: (count) => `+${count} more` }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            components={{ event: EventItem, toolbar: () => null }}
          />
        </>
      )}
    </div>
  );
}
