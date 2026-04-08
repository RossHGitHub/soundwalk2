import { useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
} from "../../../push/pushClient";
import { usePwa } from "../../../pwa/PwaProvider";
import type {
  FacebookAutoPostRunResult,
  MediaItem,
  MediaSyncResult,
  SyncResult,
} from "../types";

type Props = {
  syncing: boolean;
  syncResult: SyncResult | null;
  syncError: string | null;
  onRunCalendarSync: () => void;
  mediaItems: MediaItem[];
  mediaLoading: boolean;
  mediaSyncing: boolean;
  mediaSyncError: string | null;
  mediaSyncResult: MediaSyncResult | null;
  onRunMediaSync: () => void;
  facebookPosting: boolean;
  facebookPostResult: FacebookAutoPostRunResult | null;
  facebookPostError: string | null;
  onRunFacebookAutoPost: () => void;
};

export default function ToolsSection({
  syncing,
  syncResult,
  syncError,
  onRunCalendarSync,
  mediaItems,
  mediaLoading,
  mediaSyncing,
  mediaSyncError,
  mediaSyncResult,
  onRunMediaSync,
  facebookPosting,
  facebookPostResult,
  facebookPostError,
  onRunFacebookAutoPost,
}: Props) {
  const {
    installStatus,
    canInstall,
    promptInstall,
    needRefresh,
    refreshApp,
    serviceWorkerRegistration,
  } = usePwa();

  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  const installStatusLabel =
    installStatus === "available"
      ? "Install available"
      : installStatus === "already-installed"
        ? "Already installed"
        : installStatus === "not-supported"
          ? "Not supported"
          : "Install unavailable right now";

  async function handleInstallApp() {
    setInstallMessage(null);
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setInstallMessage("Install accepted. The app should appear on your device soon.");
      return;
    }
    if (outcome === "dismissed") {
      setInstallMessage("Install prompt dismissed.");
      return;
    }
    setInstallMessage("Install is not currently available.");
  }

  async function handleRefreshApp() {
    try {
      setRefreshing(true);
      await refreshApp();
    } catch (error) {
      console.error("Failed to refresh into the latest version", error);
      setInstallMessage("Unable to update automatically. Please refresh the page.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleEnableNotifications() {
    setPushMessage(null);

    if (!isPushSupported()) {
      const msg = "Push notifications are not supported in this browser/device.";
      console.log(msg);
      setPushMessage(msg);
      return;
    }

    const permission = await requestNotificationPermission();
    console.log("Notification permission:", permission);
    if (permission !== "granted") {
      const msg = `Notifications not enabled (${permission}).`;
      setPushMessage(msg);
      return;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      const msg =
        "Missing VITE_VAPID_PUBLIC_KEY. Add it to your environment before subscribing.";
      console.log(msg);
      setPushMessage(msg);
      return;
    }

    let registration = serviceWorkerRegistration;
    if (!registration && "serviceWorker" in navigator) {
      registration = await navigator.serviceWorker.ready.catch(() => null);
    }
    if (!registration) {
      const msg = "Service worker not ready yet. Try again in a moment.";
      console.log(msg);
      setPushMessage(msg);
      return;
    }

    try {
      setPushBusy(true);
      await subscribeToPush(vapidPublicKey, registration);
      const msg = "Push subscription request sent to /api/push/subscribe.";
      console.log(msg);
      setPushMessage(msg);
    } catch (error) {
      console.error("Push subscription failed", error);
      const message =
        error instanceof Error ? error.message : "Unknown push subscription error.";
      setPushMessage(`Failed to enable notifications: ${message}`);
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-gray-900/60 p-6 text-white/70 space-y-4">
      <div className="rounded-lg border border-white/10 bg-gray-950/50 p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Install App</h3>
          <p className="text-sm text-white/60">
            Install the admin-capable web app for a native app-like launch experience.
          </p>
        </div>
        <p className="text-sm text-white/80">Status: {installStatusLabel}</p>
        {canInstall && (
          <Button variant="outline" onClick={handleInstallApp} className="whitespace-nowrap">
            Install App
          </Button>
        )}
        {installMessage && <p className="text-xs text-white/60">{installMessage}</p>}
        {needRefresh && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 space-y-2">
            <p>New version available — refresh to update.</p>
            <Button
              variant="outline"
              onClick={handleRefreshApp}
              disabled={refreshing}
              className="whitespace-nowrap"
            >
              {refreshing ? "Refreshing…" : "Refresh to Update"}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-gray-950/50 p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Enable notifications</h3>
          <p className="text-sm text-white/60">
            Request permission and send a push subscription to the API stub endpoint.
          </p>
          {/* iOS 16.4+ requires the web app to be installed to Home Screen before web push works. */}
          <p className="text-xs text-white/50 mt-1">
            iOS 16.4+: web push only works after installing to Home Screen.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleEnableNotifications}
          disabled={pushBusy}
          className="whitespace-nowrap"
        >
          {pushBusy ? "Enabling…" : "Enable notifications"}
        </Button>
        {pushMessage && <p className="text-sm text-white/70">{pushMessage}</p>}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Media library</h3>
        <p className="text-sm text-white/60">
          Sync Cloudflare bucket images into Mongo and serve them through signed URLs.
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-gray-950/50 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-white/80">
            {mediaLoading
              ? "Loading media records..."
              : `${mediaItems.length} image${mediaItems.length === 1 ? "" : "s"} currently active in the gallery.`}
          </div>
          <Button
            variant="outline"
            onClick={onRunMediaSync}
            disabled={mediaSyncing}
            className="whitespace-nowrap"
          >
            {mediaSyncing ? "Syncing media…" : "Sync media bucket"}
          </Button>
        </div>
        {(mediaSyncError || mediaSyncResult) && (
          <div className="text-sm space-y-1">
            {mediaSyncError && <p className="text-red-400">Media sync error: {mediaSyncError}</p>}
            {mediaSyncResult && (
              <p className="text-white/70">
                Synced: {mediaSyncResult.syncedCount} • Inserted: {mediaSyncResult.insertedCount} • Updated:{" "}
                {mediaSyncResult.updatedCount} • Deactivated: {mediaSyncResult.deactivatedCount}
              </p>
            )}
          </div>
        )}
        {mediaItems.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {mediaItems.slice(0, 8).map((item) => (
              <div
                key={item._id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                <img
                  src={item.assetUrl}
                  alt={item.altText || item.title}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Facebook auto-posting</h3>
        <p className="text-sm text-white/60">
          Starts checking from 7 days before a gig, then retries daily until it posts successfully or the gig date passes.
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-gray-950/50 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/75">
            Generates Facebook gig promo posts with the fallback-safe template and a rotated gallery image.
          </p>
          <Button
            variant="outline"
            onClick={onRunFacebookAutoPost}
            disabled={facebookPosting}
            className="whitespace-nowrap"
          >
            {facebookPosting ? "Running Facebook post check…" : "Run Facebook auto-post check"}
          </Button>
        </div>
        {(facebookPostError || facebookPostResult) && (
          <div className="space-y-2 text-sm">
            {facebookPostError && (
              <p className="text-red-400">Facebook auto-post error: {facebookPostError}</p>
            )}
            {facebookPostResult && (
              <div className="space-y-3 text-white/75">
                <p>
                  Due: {facebookPostResult.dueCount} • Posted: {facebookPostResult.postedCount} •
                  Skipped: {facebookPostResult.skippedCount} • Errors: {facebookPostResult.errorCount}
                </p>
                {facebookPostResult.items.length > 0 && (
                  <div className="space-y-2">
                    {facebookPostResult.items.map((item, index) => (
                      <div
                        key={`${item.gigId || "none"}-${index}`}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-white">
                            {item.venue || "Unknown venue"}
                          </p>
                          <span
                            className={`text-xs uppercase tracking-[0.22em] ${
                              item.action === "posted"
                                ? "text-emerald-300"
                                : item.action === "error"
                                  ? "text-red-300"
                                  : "text-white/45"
                            }`}
                          >
                            {item.action}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/45">{item.gigDateKey || "No date"}</p>
                        {item.reason && <p className="mt-2">{item.reason}</p>}
                        {item.mediaTitle && (
                          <p className="mt-1 text-xs text-white/55">Image: {item.mediaTitle}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
