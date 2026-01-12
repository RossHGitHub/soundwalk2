import { Button } from "../../../components/ui/button";
import type { SyncResult } from "../types";

type Props = {
  syncing: boolean;
  syncResult: SyncResult | null;
  syncError: string | null;
  onRunCalendarSync: () => void;
};

export default function ToolsSection({
  syncing,
  syncResult,
  syncError,
  onRunCalendarSync,
}: Props) {
  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-gray-900/60 p-6 text-white/70 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Calendar tools</h3>
        <p className="text-sm text-white/60">
          Run a quick check to reconcile stored gigs with the calendar feed.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onRunCalendarSync}
        disabled={syncing}
        className="whitespace-nowrap"
      >
        {syncing ? "Running calendar sync…" : "Calendar sanity check"}
      </Button>
      {(syncError || syncResult) && (
        <div className="text-sm space-y-1">
          {syncError && <p className="text-red-400">Sync error: {syncError}</p>}
          {syncResult && (
            <div className="text-muted-foreground">
              <p>
                Calendar sync — Upcoming: {syncResult.totalUpcoming} • Created:{" "}
                {syncResult.createdCount} • Recreated: {syncResult.recreatedCount} • Already OK:{" "}
                {syncResult.skippedCount}
              </p>
              {syncResult.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer">
                    View sync issues ({syncResult.errors.length})
                  </summary>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {syncResult.errors.map((e, idx) => (
                      <li key={idx}>
                        Gig <span className="font-mono text-xs">{e.gigId}</span>: {e.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
