export const APP_ERROR_EVENT = "soundwalk:app-error";

export type AppErrorRecord = {
  id: string;
  source: string;
  summary: string;
  details: string;
  stack?: string | null;
  occurredAt: string;
};

let originalConsoleError: typeof console.error | null = null;
let consolePatchRefCount = 0;
let lastDispatchedKey = "";
let lastDispatchedAt = 0;

function safeStringify(value: unknown) {
  if (value instanceof Error) {
    return value.message || value.name || "Error";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "undefined") {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildErrorRecord({
  source,
  summary,
  details,
  stack,
}: {
  source: string;
  summary: string;
  details: string;
  stack?: string | null;
}): AppErrorRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    source,
    summary: summary.trim() || "Application error",
    details: details.trim() || summary.trim() || "Unknown error",
    stack: stack?.trim() || null,
    occurredAt: new Date().toISOString(),
  };
}

function dispatchAppError(record: AppErrorRecord) {
  if (typeof window === "undefined") {
    return;
  }

  const dedupeKey = [
    record.source,
    record.summary,
    record.details.slice(0, 400),
    record.stack?.slice(0, 400) ?? "",
  ].join("|");
  const now = Date.now();

  if (dedupeKey === lastDispatchedKey && now - lastDispatchedAt < 500) {
    return;
  }

  lastDispatchedKey = dedupeKey;
  lastDispatchedAt = now;

  window.dispatchEvent(new CustomEvent<AppErrorRecord>(APP_ERROR_EVENT, { detail: record }));
}

export function reportAppError(
  error: unknown,
  options?: {
    source?: string;
    context?: unknown;
  }
) {
  const source = options?.source ?? "app";
  const contextText = typeof options?.context === "undefined"
    ? ""
    : safeStringify(options.context);

  if (error instanceof Error) {
    dispatchAppError(
      buildErrorRecord({
        source,
        summary: error.message || error.name || "Error",
        details: contextText ? `${error.message}\n\n${contextText}` : error.message,
        stack: error.stack,
      })
    );
    return;
  }

  const summary = safeStringify(error);
  dispatchAppError(
    buildErrorRecord({
      source,
      summary,
      details: contextText ? `${summary}\n\n${contextText}` : summary,
    })
  );
}

export function reportConsoleError(args: unknown[]) {
  const firstError = args.find((value) => value instanceof Error);
  const details = args.map((value) => safeStringify(value)).join("\n\n");
  const firstString = args.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  const summary =
    (firstError instanceof Error && (firstError.message || firstError.name)) ||
    firstString ||
    "console.error called";

  dispatchAppError(
    buildErrorRecord({
      source: "console.error",
      summary,
      details,
      stack: firstError instanceof Error ? firstError.stack : null,
    })
  );
}

export function installConsoleErrorReporter() {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  consolePatchRefCount += 1;

  if (!originalConsoleError) {
    originalConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      originalConsoleError?.(...args);
      reportConsoleError(args);
    };
  }

  return () => {
    consolePatchRefCount = Math.max(0, consolePatchRefCount - 1);

    if (consolePatchRefCount === 0 && originalConsoleError) {
      console.error = originalConsoleError;
      originalConsoleError = null;
    }
  };
}
