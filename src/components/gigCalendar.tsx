import { useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import type { Gig, GoogleCalendarEvent } from "../pages/admin/types";
import {
  buildDiaryEvents,
  CALENDAR_ZONE,
  eventsOnDay,
  monthDays,
} from "../pages/admin/calendar";
import "./gigCalendar.css";

type Props = {
  gigs: Gig[];
  extraEvents: GoogleCalendarEvent[];
  month: string;
  onMonthChange: (month: string) => void;
  checking: boolean;
  verified: boolean;
  onRefresh: () => void;
  onEventClick: (gig: Gig) => void;
  onCreateGig: (dateISO: string) => void;
};

export default function GigCalendar({
  gigs,
  extraEvents,
  month,
  onMonthChange,
  checking,
  verified,
  onRefresh,
  onEventClick,
  onCreateGig,
}: Props) {
  const [availability, setAvailability] = useState(false);
  const dayPanel = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const today = DateTime.now().setZone(CALENDAR_ZONE).startOf("day");
  const anchor = DateTime.fromISO(`${month}-01`, { zone: CALENDAR_ZONE });
  const events = useMemo(
    () => buildDiaryEvents(gigs, extraEvents),
    [gigs, extraEvents],
  );
  const days = useMemo(() => monthDays(month), [month]);
  const selectedDate = selected?.startsWith(month) ? selected : null;
  const selectedEvents = selectedDate
    ? eventsOnDay(
        events,
        DateTime.fromISO(selectedDate, { zone: CALENDAR_ZONE }),
      )
    : [];
  const selectDay = (iso: string) => {
    setSelected(iso);
    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() =>
        dayPanel.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        }),
      );
    }
  };
  const changeMonth = (value: string) => {
    if (/^\d{4}-\d{2}$/.test(value) && DateTime.fromISO(`${value}-01`).isValid)
      onMonthChange(value);
  };

  return (
    <section className="diary" aria-label="Gig calendar">
      <div className="diary-mode-bar">
        <div>
          <p className="diary-eyebrow">
            {availability ? "Booking call mode" : "The band diary"}
          </p>
          <p className="diary-hint">
            {availability
              ? "Tap a green date to create a gig."
              : "Select a day to see the plan."}
          </p>
        </div>
        <Button
          type="button"
          aria-pressed={availability}
          onClick={() => setAvailability((value) => !value)}
          className={
            availability ? "diary-availability active" : "diary-availability"
          }
        >
          <ShieldCheck size={17} />
          {availability ? "Show event details" : "Check availability"}
        </Button>
      </div>
      <div className="diary-toolbar">
        <div className="diary-month">
          <h2 aria-live="polite">{anchor.toFormat("LLLL yyyy")}</h2>
          <label className="diary-month-picker">
            Jump to month
            <input
              type="month"
              aria-label="Jump to month"
              value={month}
              onChange={(event) => changeMonth(event.target.value)}
            />
          </label>
        </div>
        <div className="diary-navigation">
          <button
            type="button"
            onClick={() => changeMonth(today.toFormat("yyyy-MM"))}
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() =>
              changeMonth(anchor.minus({ months: 1 }).toFormat("yyyy-MM"))
            }
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              changeMonth(anchor.plus({ months: 1 }).toFormat("yyyy-MM"))
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="diary-status" role="status">
        <span>
          {checking
            ? "Checking gigs and band calendars…"
            : !verified
              ? "Availability unconfirmed. Refresh to check all calendars."
              : availability
                ? "Green = available · Grey = busy or past"
                : "Gigs and band calendars are up to date."}
        </span>
        <button
          type="button"
          aria-label="Refresh availability"
          disabled={checking}
          onClick={onRefresh}
        >
          <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
        </button>
      </div>
      <div className={`diary-grid ${availability ? "availability-mode" : ""}`}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="diary-weekday">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const iso = day.toISODate()!;
          const inMonth = day.toFormat("yyyy-MM") === month;
          const dailyEvents = eventsOnDay(events, day);
          const past = day < today;
          const free =
            verified &&
            !checking &&
            !past &&
            dailyEvents.length === 0 &&
            inMonth;
          const status = past
            ? "Past date"
            : dailyEvents.length
              ? "Unavailable"
              : !verified || checking
                ? "Not yet checked"
                : "Available";
          return (
            <button
              type="button"
              key={iso}
              disabled={!inMonth || (availability && !free)}
              aria-current={day.equals(today) ? "date" : undefined}
              aria-pressed={!availability && selectedDate === iso}
              aria-label={`${day.toFormat("cccc d LLLL yyyy")}${availability ? `, ${status}` : `, ${dailyEvents.length} events`}`}
              className={`diary-day ${!inMonth ? "outside" : ""} ${past ? "past" : ""} ${availability && free ? "available" : ""} ${!availability && selectedDate === iso ? "selected" : ""}`}
              onClick={() =>
                availability ? onCreateGig(iso) : selectDay(iso)
              }
            >
              <span className="diary-day-number">{day.day}</span>
              {availability ? (
                <span className="diary-availability-mark">
                  {free ? (
                    <Check size={15} />
                  ) : !past && !dailyEvents.length && inMonth && !verified ? (
                    <CircleHelp size={13} />
                  ) : null}
                  <span className="diary-desktop-label">
                    {inMonth ? status : ""}
                  </span>
                </span>
              ) : (
                <>
                  <span className="diary-event-titles">
                    {dailyEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className={event.gig ? "diary-gig" : "diary-time-off"}
                      >
                        {event.title}
                      </span>
                    ))}
                    {dailyEvents.length > 2 && (
                      <span>+{dailyEvents.length - 2} more</span>
                    )}
                  </span>
                  <span className="diary-event-dots">
                    {dailyEvents.slice(0, 3).map((event) => (
                      <i
                        key={event.id}
                        className={event.gig ? "diary-gig" : "diary-time-off"}
                      />
                    ))}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {!availability && (
        <div ref={dayPanel} className="diary-day-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3>
              {selectedDate
                ? DateTime.fromISO(selectedDate, {
                    zone: CALENDAR_ZONE,
                  }).toFormat("cccc d LLLL")
                : "Your day, at a glance"}
            </h3>
            {selectedDate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onCreateGig(selectedDate)}
              >
                Create gig
                <ArrowUpRight size={15} />
              </Button>
            )}
          </div>
          {!selectedDate ? (
            <p className="diary-hint mt-3">
              Tap a date above. For a quick booking check, switch to
              availability.
            </p>
          ) : selectedEvents.length === 0 ? (
            <p className="diary-hint mt-3">
              {verified && !checking
                ? "Nothing scheduled for this day."
                : "No events loaded for this day. Availability is not confirmed yet."}
            </p>
          ) : (
            <div className="diary-day-events">
              {selectedEvents.map((event) =>
                event.gig ? (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => onEventClick(event.gig!)}
                  >
                    <span>
                      <strong>{event.title}</strong>
                      <small>
                        {event.start.toFormat("HH:mm")} ·{" "}
                        {event.gig.privateEvent ? "Private gig" : "Gig"}
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ) : (
                  <div key={event.id}>
                    <span>
                      <strong>{event.title}</strong>
                      <small>
                        {event.allDay
                          ? "All day"
                          : event.start.toFormat("HH:mm")}{" "}
                        · Band calendar
                      </small>
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}
      {availability && (
        <p className="diary-footnote">
          A date is available when there are no gigs or busy band-calendar
          events that day. Creating a gig confirms the booking.
        </p>
      )}
    </section>
  );
}
