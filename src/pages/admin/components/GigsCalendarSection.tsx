import GigCalendar from "../../../components/gigCalendar";
import type { Gig, GoogleCalendarFeed } from "../types";

type Props = {
  loading: boolean;
  gigs: Gig[];
  googleFeed: GoogleCalendarFeed;
  onEventClick: (gig: Gig) => void;
  onCreateGig: (dateISO: string, startHHmm?: string) => void;
};

export default function GigsCalendarSection({
  loading,
  gigs,
  googleFeed,
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
          extraEvents={googleFeed.items}
          onEventClick={onEventClick}
          onCreateGig={onCreateGig}
        />
      )}
    </div>
  );
}
