import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getR2Client, inferContentType } from "./_media.js";
import { rejectUntrustedRequest } from "./_requestGuards.js";

const DEFAULT_POSTER_TEMPLATE_KEY = "sw-poster-template.png";

type TemplateLocation = {
  bucket: string;
  key: string;
};

function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function normalizePrefix(value: string | null) {
  if (!value) return "";
  const normalized = value.replace(/^\/+/, "");
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function normalizeKey(value: string) {
  return value.trim().replace(/^\/+/, "");
}

function getErrorHttpStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("$metadata" in error)) {
    return undefined;
  }

  const metadata = (error as { $metadata?: { httpStatusCode?: number } })
    .$metadata;
  return metadata?.httpStatusCode;
}

function isPipeableBody(
  body: unknown
): body is { pipe(destination: NodeJS.WritableStream): void } {
  return (
    !!body &&
    typeof body === "object" &&
    "pipe" in body &&
    typeof body.pipe === "function"
  );
}

function isTransformableBody(
  body: unknown
): body is { transformToByteArray(): Promise<Uint8Array> } {
  return (
    !!body &&
    typeof body === "object" &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  );
}

function buildTemplateLocations(): TemplateLocation[] {
  const configuredBucket =
    getOptionalEnv("POSTER_TEMPLATE_BUCKET") ??
    getOptionalEnv("R2_UTILITIES_BUCKET");
  const templateKey = normalizeKey(
    getOptionalEnv("POSTER_TEMPLATE_KEY") ?? DEFAULT_POSTER_TEMPLATE_KEY
  );
  const configuredPrefix = normalizePrefix(getOptionalEnv("POSTER_TEMPLATE_PREFIX"));
  const fallbackBucket = getOptionalEnv("R2_BUCKET");
  const locations: TemplateLocation[] = [];
  const primaryKey = `${configuredPrefix}${templateKey}`;

  if (configuredBucket) {
    locations.push({
      bucket: configuredBucket,
      key: primaryKey,
    });
  } else {
    locations.push({
      bucket: "Utilities",
      key: primaryKey,
    });
  }

  if (fallbackBucket && fallbackBucket !== configuredBucket) {
    locations.push({
      bucket: fallbackBucket,
      key: primaryKey,
    });

    if (!configuredPrefix) {
      locations.push({
        bucket: fallbackBucket,
        key: `Utilities/${templateKey}`,
      });
    }
  }

  return locations.filter(
    (location, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.bucket === location.bucket &&
          candidate.key === location.key
      ) === index
  );
}

async function sendObjectBody(res: VercelResponse, body: unknown) {
  if (isPipeableBody(body)) {
    body.pipe(res);
    return;
  }

  if (isTransformableBody(body)) {
    const bytes = await body.transformToByteArray();
    res.send(Buffer.from(bytes));
    return;
  }

  if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
    res.send(Buffer.from(body));
    return;
  }

  throw new Error("Unsupported poster template body");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectUntrustedRequest(req, res)) return;

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = getR2Client();
    const locations = buildTemplateLocations();

    for (const location of locations) {
      try {
        const object = await client.send(
          new GetObjectCommand({
            Bucket: location.bucket,
            Key: location.key,
          })
        );

        res.status(200);
        res.setHeader("Content-Type", object.ContentType || inferContentType(location.key));
        res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
        res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Poster-Template-Key", location.key);

        if (typeof object.ContentLength === "number") {
          res.setHeader("Content-Length", object.ContentLength.toString());
        }

        if (req.method === "HEAD") {
          return res.end();
        }

        await sendObjectBody(res, object.Body);
        return;
      } catch (locationError) {
        const status = getErrorHttpStatus(locationError);
        if (status === 400 || status === 403 || status === 404) {
          continue;
        }
        throw locationError;
      }
    }

    return res.status(404).json({
      error:
        "Poster template image sw-poster-template.png not found. Add POSTER_TEMPLATE_BUCKET/POSTER_TEMPLATE_KEY, or place it in the Utilities bucket or Utilities/ prefix.",
    });
  } catch (error) {
    console.error("Poster template API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
