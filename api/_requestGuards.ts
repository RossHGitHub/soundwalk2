type HeaderValue = string | string[] | undefined;

export type RequestLike = {
  headers?: Record<string, HeaderValue>;
};

type JsonResponder = {
  json(payload: unknown): unknown;
};

type ResponseLike = {
  status(code: number): JsonResponder;
};

function getHeader(req: RequestLike, name: string) {
  const headers = req.headers ?? {};
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function normalizeOrigin(raw: string | null | undefined) {
  const value = raw?.trim();
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeVercelUrl(raw: string | null | undefined) {
  const value = raw?.trim();
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

function getAllowedOrigins() {
  const configuredOrigins = (process.env.SECURITY_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  return new Set([
    "https://soundwalk.uk",
    "https://www.soundwalk.uk",
    normalizeOrigin(process.env.SITE_BASE_URL),
    normalizeOrigin(normalizeVercelUrl(process.env.VERCEL_URL)),
    ...configuredOrigins,
  ].filter((origin): origin is string => Boolean(origin)));
}

function isLocalDevOrigin(origin: string) {
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      protocol === "http:" &&
      (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  return getAllowedOrigins().has(origin) || isLocalDevOrigin(origin);
}

function isAllowedHost(host: string) {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname) return false;
  if (hostname === "soundwalk.uk" || hostname === "www.soundwalk.uk") return true;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true;
  }

  return Array.from(getAllowedOrigins()).some((origin) => {
    try {
      return new URL(origin).hostname.toLowerCase() === hostname;
    } catch {
      return false;
    }
  });
}

export function isTrustedSiteRequest(req: RequestLike) {
  const origin = normalizeOrigin(getHeader(req, "origin"));
  if (origin) {
    return isAllowedOrigin(origin);
  }

  const referer = normalizeOrigin(getHeader(req, "referer"));
  if (referer) {
    return isAllowedOrigin(referer);
  }

  const fetchSite = getHeader(req, "sec-fetch-site").toLowerCase();
  if (fetchSite === "same-origin" || fetchSite === "same-site") {
    return isAllowedHost(getHeader(req, "host"));
  }

  return false;
}

export function rejectUntrustedRequest(req: RequestLike, res: ResponseLike) {
  if (isTrustedSiteRequest(req)) {
    return false;
  }

  res.status(403).json({
    error: "Forbidden: API access is restricted to soundwalk.uk and local development.",
  });
  return true;
}

export function rejectAuthError(error: unknown, res: ResponseLike) {
  const status =
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 401;
  const message = error instanceof Error ? error.message : "Unauthorized.";

  res.status(status).json({ error: message });
}
