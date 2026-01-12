import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import type { Gig } from "../types";
import { formatDate, formatTime, groupGigsByDate } from "../gigs";

type Props = {
  loading: boolean;
  search: string;
  displayedGigs: Gig[];
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSelectGig: (gig: Gig) => void;
};

export default function GigsListSection({
  loading,
  search,
  displayedGigs,
  onSearchChange,
  onClearSearch,
  onSelectGig,
}: Props) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-6">
        <Label htmlFor="gigSearch" className="whitespace-nowrap">
          Search gigs:
        </Label>
        <div className="relative flex-1">
          <Input
            id="gigSearch"
            placeholder="Search by Venue, Notes, Description, Date etc."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <p>Loading gigs...</p>
      ) : displayedGigs.length === 0 ? (
        <p>No gigs found.</p>
      ) : (
        Object.entries(groupGigsByDate(displayedGigs)).map(([year, months]) => (
          <section key={year} className="mb-20">
            <h2 className="text-4xl font-semibold border-b border-muted pb-3 mb-8">
              {year}
            </h2>
            {Object.entries(months).map(([month, monthGigs]) => (
              <div key={month} className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">{month}</h3>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {monthGigs.map((gig) => (
                    <div
                      key={gig._id}
                      onClick={() => onSelectGig(gig)}
                      className="p-6 border border-emerald-600 rounded-lg cursor-pointer bg-gray-900 hover:bg-emerald-800 hover:shadow-lg transition-all relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <strong className="text-emerald-500 text-xl">
                          {gig.venue}
                        </strong>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(gig.date)}
                        </span>
                      </div>
                      {gig.postersNeeded && (
                        <div className="absolute top-[2px] right-[2px] bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          Posters Needed!
                        </div>
                      )}
                      {gig.startTime && (
                        <p className="text-sm text-emerald-300 mb-2">
                          Start: {formatTime(gig.startTime)}
                        </p>
                      )}
                      {gig.description && (
                        <p className="text-muted-foreground mb-4">
                          {gig.internalNotes}
                        </p>
                      )}
                      <div className="flex justify-between items-end">
                        <p className="text-xl text-emerald-400">£{gig.fee}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
