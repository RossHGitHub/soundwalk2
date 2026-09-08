import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import GigCalendar from "../../../components/gigCalendar";
import { fetchGoogleEvents } from "../services/gigs";
import { CALENDAR_ZONE, monthDays } from "../calendar";
import type { Gig, GoogleCalendarFeed } from "../types";

type Props = {
  loading: boolean;
  gigsError: boolean;
  gigs: Gig[];
  onRefreshGigs: () => void;
  onEventClick: (gig: Gig) => void;
  onCreateGig: (dateISO: string, startHHmm?: string) => void;
};

export default function GigsCalendarSection({
  loading,
  gigsError,
  gigs,
  onRefreshGigs,
  onEventClick,
  onCreateGig,
}: Props) {
  const [month, setMonth] = useState(() =>
    DateTime.now().setZone(CALENDAR_ZONE).toFormat("yyyy-MM"),
  );
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{
    month: string;
    refresh: number;
    feed: GoogleCalendarFeed | null;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const days = monthDays(month);
    fetchGoogleEvents({
      timeMin: days[0].toISO()!,
      timeMax: days[days.length - 1].plus({ days: 1 }).toISO()!,
    })
      .then((feed) => {
        if (!cancelled) setResult({ month, refresh, feed });
      })
      .catch(() => {
        if (!cancelled) setResult({ month, refresh, feed: null });
      });
    return () => {
      cancelled = true;
    };
  }, [month, refresh]);
  const current = result?.month === month && result.refresh === refresh;
  const feed = current ? result.feed : null;
  const diagnostics = feed?.diagnostics;
  const visibleDays = monthDays(month);
  const covered =
    !!diagnostics?.timeMin &&
    !!diagnostics.timeMax &&
    DateTime.fromISO(diagnostics.timeMin) <= visibleDays[0] &&
    DateTime.fromISO(diagnostics.timeMax) >=
      visibleDays[visibleDays.length - 1].plus({ days: 1 });
  const validEvents = feed?.items.every((event) => {
    const start = DateTime.fromISO(event.startISO);
    const end = DateTime.fromISO(event.endISO);
    return start.isValid && end.isValid && end >= start;
  });
  const verified =
    covered &&
    validEvents &&
    !gigsError &&
    !!diagnostics?.credentialsConfigured &&
    !diagnostics.fetchError &&
    diagnostics.sources.length > 0 &&
    diagnostics.sources.every((source) => source.ok);
  return (
    <GigCalendar
      gigs={gigs}
      extraEvents={feed?.items || []}
      month={month}
      onMonthChange={setMonth}
      checking={loading || !current}
      verified={!!verified}
      onRefresh={() => {
        setRefresh((value) => value + 1);
        onRefreshGigs();
      }}
      onEventClick={onEventClick}
      onCreateGig={onCreateGig}
    />
  );
}
