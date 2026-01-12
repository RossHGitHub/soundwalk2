import GigCalendar from "../../../components/gigCalendar";
import type { Gig } from "../types";

type Props = {
  loading: boolean;
  gigs: Gig[];
  extraEvents: Array<{
    id: string;
    title: string;
    startISO: string;
    endISO: string;
    description?: string;
    allDay?: boolean;
  }>;
  onEventClick: (gig: Gig) => void;
  onCreateGig: (dateISO: string, startHHmm?: string) => void;
};

export default function GigsCalendarSection({
  loading,
  gigs,
  extraEvents,
  onEventClick,
  onCreateGig,
}: Props) {
  return (
    <div className="mt-4 mb-12">
      {loading ? (
        <p>Loading calendar…</p>
      ) : (
        <GigCalendar
          gigs={gigs}
          extraEvents={extraEvents}
          onEventClick={onEventClick}
          onCreateGig={onCreateGig}
        />
      )}
    </div>
  );
}
