import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  APP_ERROR_EVENT,
  installConsoleErrorReporter,
  reportAppError,
  type AppErrorRecord,
} from "../lib/appErrorReporting";

type Props = {
  children: ReactNode;
};

function formatOccurredAt(occurredAt: string) {
  const parsed = new Date(occurredAt);
  if (Number.isNaN(parsed.getTime())) {
    return occurredAt;
  }

  return parsed.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export default function AppErrorProvider({ children }: Props) {
  const [activeError, setActiveError] = useState<AppErrorRecord | null>(null);

  useEffect(() => {
    const uninstallConsoleReporter = installConsoleErrorReporter();

    const handleAppError = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorRecord>;
      setActiveError(customEvent.detail);
    };

    const handleWindowError = (event: ErrorEvent) => {
      const location = [event.filename, event.lineno, event.colno]
        .filter((value) => value || value === 0)
        .join(":");

      reportAppError(event.error ?? event.message, {
        source: "window.error",
        context: location || undefined,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportAppError(event.reason, {
        source: "unhandledrejection",
      });
    };

    window.addEventListener(APP_ERROR_EVENT, handleAppError as EventListener);
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      uninstallConsoleReporter();
      window.removeEventListener(APP_ERROR_EVENT, handleAppError as EventListener);
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      {children}

      <Dialog open={!!activeError} onOpenChange={(open) => !open && setActiveError(null)}>
        <DialogContent className="max-w-3xl border-red-500/30 bg-gray-950 text-white">
          <DialogHeader>
            <DialogTitle>Application Error</DialogTitle>
            <DialogDescription className="text-white/60">
              {activeError
                ? `${activeError.source} • ${formatOccurredAt(activeError.occurredAt)}`
                : "Latest captured app error"}
            </DialogDescription>
          </DialogHeader>

          {activeError && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm font-medium text-red-100">{activeError.summary}</p>
              </div>

              <pre className="max-h-[50vh] overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs leading-6 text-white/85 whitespace-pre-wrap break-words">
                {activeError.details}
                {activeError.stack ? `\n\nStack\n${activeError.stack}` : ""}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
