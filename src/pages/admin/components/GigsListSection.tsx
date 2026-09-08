import { ArrowUpRight, CalendarDays, Clock3, Search, X } from "lucide-react";
import { Input } from "../../../components/ui/input";
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
    <div className="mt-5">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-3 text-white/40"
            size={18}
          />
          <Input
            id="gigSearch"
            aria-label="Search gigs"
            className="h-11 pl-10 pr-12"
            placeholder="Search venues, dates or notes…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-0 top-0 grid size-11 place-items-center text-white/60"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <p className="text-xs text-white/50" aria-live="polite">
          {loading
            ? "Loading gigs…"
            : `${displayedGigs.length} ${displayedGigs.length === 1 ? "gig" : "gigs"}`}
        </p>
      </div>
      {loading ? (
        <div role="status" className="admin-empty">
          Loading your shows…
        </div>
      ) : displayedGigs.length === 0 ? (
        <div className="admin-empty">
          <CalendarDays size={28} className="mx-auto mb-4 text-white/40" />
          <h2 className="text-lg text-white">
            {search ? "No matching gigs" : "No gigs to show"}
          </h2>
          <p className="mt-2">
            {search
              ? "Try another venue or clear your search."
              : "Add a gig to start planning your next show."}
          </p>
        </div>
      ) : (
        Object.entries(groupGigsByDate(displayedGigs)).map(([year, months]) => (
          <section key={year} className="mb-10">
            <h2 className="mb-6 flex items-center gap-4 text-sm font-medium text-white/50">
              {year}
              <span className="h-px flex-1 bg-white/10" />
            </h2>
            {Object.entries(months).map(([month, gigs]) => (
              <div key={month} className="mb-8">
                <h3 className="mb-4 text-lg font-medium">
                  {month}
                  <span className="ml-3 text-xs font-normal text-white/40">
                    {gigs.length} shows
                  </span>
                </h3>
                <div className="grid gap-3 xl:grid-cols-2">
                  {gigs.map((gig) => (
                    <button
                      type="button"
                      key={gig._id}
                      onClick={() => onSelectGig(gig)}
                      className="group flex min-w-0 items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06] sm:p-5"
                    >
                      <div className="grid w-14 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 py-2">
                        <span className="text-[10px] uppercase tracking-wider text-white/50">
                          {new Date(`${gig.date}T12:00:00`).toLocaleDateString(
                            "en-GB",
                            { weekday: "short" },
                          )}
                        </span>
                        <span className="text-2xl font-semibold">
                          {gig.date.slice(8, 10)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="break-words font-semibold">
                            {gig.venue}
                          </h4>
                          <ArrowUpRight
                            size={16}
                            className="shrink-0 text-white/35 group-hover:text-white"
                          />
                        </div>
                        <p className="mt-1 text-xs text-white/50">
                          {formatDate(gig.date)}
                        </p>
                        {gig.startTime && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/65">
                            <Clock3 size={13} />
                            {formatTime(gig.startTime)}
                          </p>
                        )}
                        {gig.internalNotes && (
                          <p className="mt-3 line-clamp-2 break-words text-sm text-white/55">
                            {gig.internalNotes}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="mr-auto text-sm font-medium tabular-nums">
                            £
                            {Number(gig.fee || 0).toLocaleString("en-GB", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          {gig.privateEvent && (
                            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/60">
                              Private
                            </span>
                          )}
                          {gig.postersNeeded && (
                            <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-200">
                              Posters needed
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
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
