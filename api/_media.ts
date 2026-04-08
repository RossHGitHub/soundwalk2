import crypto from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { S3Client } from "@aws-sdk/client-s3";
import { requireEnv } from "./_envGuard.js";

export type MediaDoc = {
  _id?: ObjectId;
  title: string;
  altText: string;
  objectKey: string;
  contentType: string;
  size?: number;
  etag?: string;
  sortOrder: number;
  active: boolean;
  source: "r2";
  sourceLastModified?: Date | null;
  syncedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SiteMediaSlotDoc = {
  key: string;
  mediaId: ObjectId | null;
  updatedAt?: Date;
};

let mongoClient: MongoClient | null = null;
let r2Client: S3Client | null = null;

export async function getDb() {
  const uri = requireEnv("MONGODB_URI");
  const dbName = requireEnv("MONGODB_DB");

  if (!mongoClient) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
  }

  return mongoClient.db(dbName);
}

export async function getMediaCollection() {
  const db = await getDb();
  return db.collection<MediaDoc>("media");
}

export async function getSiteMediaCollection() {
  const db = await getDb();
  return db.collection<SiteMediaSlotDoc>("siteMediaSlots");
}

export function getR2BucketName() {
  return requireEnv("R2_BUCKET");
}

export function getR2MediaPrefix() {
  const rawPrefix = process.env.R2_MEDIA_PREFIX ?? "";
  const trimmedPrefix = rawPrefix.trim().replace(/^\/+/, "");

  if (!trimmedPrefix) {
    return "";
  }

  return trimmedPrefix.endsWith("/") ? trimmedPrefix : `${trimmedPrefix}/`;
}

export function getR2PublicBaseUrl() {
  const raw = process.env.R2_PUBLIC_BASE_URL ?? "";
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed || null;
}

export function getR2Client() {
  if (!r2Client) {
    const accountId = requireEnv("R2_ACCOUNT_ID");
    const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
    const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");

    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

export function isImageKey(key: string) {
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(key);
}

export function inferContentType(key: string) {
  if (/\.avif$/i.test(key)) return "image/avif";
  if (/\.gif$/i.test(key)) return "image/gif";
  if (/\.jpe?g$/i.test(key)) return "image/jpeg";
  if (/\.png$/i.test(key)) return "image/png";
  if (/\.webp$/i.test(key)) return "image/webp";
  return "application/octet-stream";
}

export function formatTitleFromKey(key: string) {
  const filename = key.split("/").pop() ?? key;
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function signPayload(payload: string) {
  const secret = requireEnv("MEDIA_URL_SIGNING_SECRET");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildSignedMediaUrl(id: string, ttlSeconds = 900) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${id}.${expiresAt}`;
  const sig = signPayload(payload);
  return `/api/media-asset?id=${encodeURIComponent(id)}&exp=${expiresAt}&sig=${sig}`;
}

export function buildMediaUrl(
  media: { _id?: ObjectId | string | null; objectKey?: string | null },
  ttlSeconds = 900
) {
  const publicBaseUrl = getR2PublicBaseUrl();
  if (publicBaseUrl && media.objectKey) {
    const encodedKey = media.objectKey
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${publicBaseUrl}/${encodedKey}`;
  }

  if (!media._id) {
    return "";
  }

  const id =
    typeof media._id === "string" ? media._id : media._id.toString();
  return buildSignedMediaUrl(id, ttlSeconds);
}

export function verifyMediaSignature(id: string, expRaw: string, sig: string) {
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = `${id}.${expiresAt}`;
  const expected = signPayload(payload);
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(sig ?? "");

  if (expectedBuffer.length !== suppliedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}
