import { useState, type ReactNode } from "react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
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

type ToolModalKey =
  | "install"
  | "notifications"
  | "media"
  | "facebook"
  | "calendar";

function ToolCard({
  title,
  description,
  ctaLabel,
  onOpen,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-gray-950/60 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
      <Button variant="outline" onClick={onOpen} className="mt-5">
        {ctaLabel}
      </Button>
    </div>
  );
}

function ToolDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-gray-950 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-white/60">
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

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

  const [activeModal, setActiveModal] = useState<ToolModalKey | null>(null);
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
      setPushMessage("Push notifications are not supported in this browser/device.");
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      setPushMessage(`Notifications not enabled (${permission}).`);
      return;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setPushMessage(
        "Missing VITE_VAPID_PUBLIC_KEY. Add it to your environment before subscribing."
      );
      return;
    }

    let registration = serviceWorkerRegistration;
    if (!registration && "serviceWorker" in navigator) {
      registration = await navigator.serviceWorker.ready.catch(() => null);
    }
    if (!registration) {
      setPushMessage("Service worker not ready yet. Try again in a moment.");
      return;
    }

    try {
      setPushBusy(true);
      await subscribeToPush(vapidPublicKey, registration);
      setPushMessage("Push subscription request sent to /api/push/subscribe.");
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
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ToolCard
          title="Install App"
          description="Install the admin-capable web app or refresh to the latest cached version."
          ctaLabel="Open Install Tools"
          onOpen={() => setActiveModal("install")}
        />
        <ToolCard
          title="Notifications"
          description="Request browser permission and register this device for push notifications."
          ctaLabel="Open Notification Tools"
          onOpen={() => setActiveModal("notifications")}
        />
        <ToolCard
          title="Media Library"
          description="Sync Cloudflare bucket images into Mongo and review the current gallery feed."
          ctaLabel="Open Media Tools"
          onOpen={() => setActiveModal("media")}
        />
        <ToolCard
          title="Facebook Auto-Posting"
          description="Run the Facebook gig post checker and inspect posting diagnostics and item results."
          ctaLabel="Open Facebook Tools"
          onOpen={() => setActiveModal("facebook")}
        />
        <ToolCard
          title="Calendar Sync"
          description="Run the backend calendar sanity check and inspect any reconciliation issues."
          ctaLabel="Open Calendar Tools"
          onOpen={() => setActiveModal("calendar")}
        />
      </div>

      <ToolDialog
        open={activeModal === "install"}
        onOpenChange={(open) => setActiveModal(open ? "install" : null)}
        title="Install App"
        description="Install the admin web app for a native launch experience and refresh when a new version is available."
      >
        <div className="space-y-4 text-white/75">
          <p className="text-sm">Status: {installStatusLabel}</p>
          {canInstall && (
            <Button variant="outline" onClick={handleInstallApp} className="whitespace-nowrap">
              Install App
            </Button>
          )}
          {installMessage && <p className="text-sm text-white/60">{installMessage}</p>}
          {needRefresh && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-200 space-y-2">
              <p>New version available. Refresh to update.</p>
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
      </ToolDialog>

      <ToolDialog
        open={activeModal === "notifications"}
        onOpenChange={(open) => setActiveModal(open ? "notifications" : null)}
        title="Notification Tools"
        description="Enable browser notifications and send a push subscription to the API stub."
      >
        <div className="space-y-4 text-white/75">
          <p className="text-sm text-white/60">
            iOS 16.4+ requires the web app to be installed to the Home Screen before web push will work.
          </p>
          <Button
            variant="outline"
            onClick={handleEnableNotifications}
            disabled={pushBusy}
            className="whitespace-nowrap"
          >
            {pushBusy ? "Enabling…" : "Enable notifications"}
          </Button>
          {pushMessage && <p className="text-sm">{pushMessage}</p>}
        </div>
      </ToolDialog>

      <ToolDialog
        open={activeModal === "media"}
        onOpenChange={(open) => setActiveModal(open ? "media" : null)}
        title="Media Library"
        description="Sync the Cloudflare bucket into Mongo and inspect the current active image set."
      >
        <div className="space-y-4 text-white/75">
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
                <p>
                  Synced: {mediaSyncResult.syncedCount} • Inserted: {mediaSyncResult.insertedCount} •
                  Updated: {mediaSyncResult.updatedCount} • Deactivated: {mediaSyncResult.deactivatedCount}
                </p>
              )}
            </div>
          )}
          {mediaItems.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mediaItems.slice(0, 9).map((item) => (
                <div
                  key={item._id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                >
                  <img
                    src={item.assetUrl}
                    alt={item.altText || item.title}
                    className="h-40 w-full object-cover"
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
      </ToolDialog>

      <ToolDialog
        open={activeModal === "facebook"}
        onOpenChange={(open) => setActiveModal(open ? "facebook" : null)}
        title="Facebook Auto-Posting"
        description="Run the backend Facebook gig checker and inspect posting diagnostics and per-gig results."
      >
        <div className="space-y-4 text-white/75">
          <p className="text-sm">
            Starts checking from 7 days before a gig, then retries daily until it posts successfully or the gig date passes.
          </p>
          <Button
            variant="outline"
            onClick={onRunFacebookAutoPost}
            disabled={facebookPosting}
            className="whitespace-nowrap"
          >
            {facebookPosting ? "Running Facebook post check…" : "Run Facebook auto-post check"}
          </Button>
          {(facebookPostError || facebookPostResult) && (
            <div className="space-y-3 text-sm">
              {facebookPostError && (
                <p className="text-red-400">Facebook auto-post error: {facebookPostError}</p>
              )}
              {facebookPostResult && (
                <div className="space-y-3">
                  <p>
                    Due: {facebookPostResult.dueCount} • Posted: {facebookPostResult.postedCount} •
                    Skipped: {facebookPostResult.skippedCount} • Errors: {facebookPostResult.errorCount}
                  </p>
                  <p className="text-xs text-white/45">
                    Cron secret:{" "}
                    {facebookPostResult.diagnostics.cronSecretConfigured ? "configured" : "missing"} •
                    Site base URL:{" "}
                    {facebookPostResult.diagnostics.siteBaseUrlConfigured ? "configured" : "missing"} •
                    Public R2 base URL:{" "}
                    {facebookPostResult.diagnostics.r2PublicBaseUrlConfigured
                      ? "configured"
                      : "missing"}
                  </p>
                  {facebookPostResult.items.length > 0 && (
                    <div className="space-y-2">
                      {facebookPostResult.items.map((item, index) => (
                        <div
                          key={`${item.gigId || "none"}-${index}`}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-white">{item.venue || "Unknown venue"}</p>
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
      </ToolDialog>

      <ToolDialog
        open={activeModal === "calendar"}
        onOpenChange={(open) => setActiveModal(open ? "calendar" : null)}
        title="Calendar Tools"
        description="Run the backend calendar sanity check and inspect any reconciliation problems."
      >
        <div className="space-y-4 text-white/75">
          <Button
            variant="outline"
            onClick={onRunCalendarSync}
            disabled={syncing}
            className="whitespace-nowrap"
          >
            {syncing ? "Running calendar sync…" : "Calendar sanity check"}
          </Button>
          {(syncError || syncResult) && (
            <div className="text-sm space-y-2">
              {syncError && <p className="text-red-400">Sync error: {syncError}</p>}
              {syncResult && (
                <div className="space-y-2">
                  <p>
                    Calendar sync — Upcoming: {syncResult.totalUpcoming} • Created:{" "}
                    {syncResult.createdCount} • Recreated: {syncResult.recreatedCount} • Already OK:{" "}
                    {syncResult.skippedCount}
                  </p>
                  {syncResult.errors.length > 0 && (
                    <details className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <summary className="cursor-pointer">View sync issues ({syncResult.errors.length})</summary>
                      <ul className="mt-2 list-disc list-inside space-y-1 text-white/65">
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
      </ToolDialog>
    </>
  );
}
