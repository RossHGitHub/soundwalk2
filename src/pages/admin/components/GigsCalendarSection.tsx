import GigCalendar from "../../../components/gigCalendar";
import { DateTime } from "luxon";
import type { Gig, GoogleCalendarFeed } from "../types";

type Props = {
  loading: boolean;
  gigs: Gig[];
  googleFeed: GoogleCalendarFeed;
  onEventClick: (gig: Gig) => void;
  onCreateGig: (dateISO: string, startHHmm?: string) => void;
};

function formatWindowDate(value: string | null) {
  if (!value) return "Not available";
  return DateTime.fromISO(value).setZone("Europe/London").toFormat("d LLL yyyy");
}

export default function GigsCalendarSection({
  loading,
  gigs,
  googleFeed,
  onEventClick,
  onCreateGig,
}: Props) {
  const serviceAccountLabel =
    googleFeed.diagnostics.serviceAccountEmail ??
    (googleFeed.diagnostics.credentialsConfigured === false
      ? "GOOGLE_CREDENTIALS missing in API runtime"
      : googleFeed.diagnostics.fetchError
        ? "Unavailable due to feed error"
        : "Unknown");

  return (
    <div className="mt-4 mb-12">
      {loading ? (
        <p>Loading calendar…</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-gray-950/60 p-4 text-white">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Google Calendar Debug
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Service account:{" "}
                  <span className="font-medium text-white/90">
                    {serviceAccountLabel}
                  </span>
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Window: {formatWindowDate(googleFeed.diagnostics.timeMin)} to{" "}
                  {formatWindowDate(googleFeed.diagnostics.timeMax)}. Deduped feed events:{" "}
                  {googleFeed.diagnostics.dedupedCount}
                </p>
              </div>
              <div className="text-sm text-white/60">
                {googleFeed.diagnostics.sources.length} calendar
                {googleFeed.diagnostics.sources.length === 1 ? "" : "s"} checked
              </div>
            </div>

            {googleFeed.diagnostics.fetchError && (
              <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/8 px-4 py-3 text-sm text-red-100">
                Feed error: {googleFeed.diagnostics.fetchError}
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {googleFeed.diagnostics.sources.map((source) => (
                <div
                  key={source.calendarId}
                  className={`rounded-xl border p-4 ${
                    source.ok
                      ? "border-emerald-400/25 bg-emerald-500/8"
                      : "border-red-400/25 bg-red-500/8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{source.calendarId}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        source.ok
                          ? "bg-emerald-400/12 text-emerald-200"
                          : "bg-red-400/12 text-red-200"
                      }`}
                    >
                      {source.ok ? "Connected" : "Failed"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/70">
                    Events returned: {source.eventCount}
                  </p>
                  {!source.ok && (
                    <p className="mt-2 text-sm text-red-200/90">
                      Error: {source.error ?? "Unknown Google Calendar error"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <GigCalendar
            gigs={gigs}
            extraEvents={googleFeed.items}
            onEventClick={onEventClick}
            onCreateGig={onCreateGig}
          />
        </div>
      )}
    </div>
  );
}
