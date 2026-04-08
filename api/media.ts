import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { requireAdmin } from "./_adminAuth.js";
import {
  buildMediaUrl,
  formatTitleFromKey,
  getMediaCollection,
  getR2BucketName,
  getR2Client,
  getR2MediaPrefix,
  inferContentType,
  isImageKey,
} from "./_media.js";

function serializeMediaItem(item: any) {
  return {
    _id: item._id.toString(),
    title: item.title,
    altText: item.altText,
    contentType: item.contentType,
    size: item.size,
    sortOrder: item.sortOrder,
    active: item.active,
    assetUrl: buildMediaUrl(item, 86400),
    createdAt: item.createdAt?.toISOString?.() ?? null,
    updatedAt: item.updatedAt?.toISOString?.() ?? null,
    syncedAt: item.syncedAt?.toISOString?.() ?? null,
    sourceLastModified: item.sourceLastModified?.toISOString?.() ?? null,
  };
}

async function listBucketImages() {
  const client = getR2Client();
  const bucket = getR2BucketName();
  const prefix = getR2MediaPrefix();
  const results: Array<{
    key: string;
    size?: number;
    etag?: string;
    lastModified?: Date;
  }> = [];

  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuationToken,
      })
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key || !isImageKey(object.Key)) {
        continue;
      }

      results.push({
        key: object.Key,
        size: object.Size,
        etag: object.ETag?.replaceAll('"', ""),
        lastModified: object.LastModified,
      });
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return results.sort((left, right) => left.key.localeCompare(right.key));
}

export default async function handler(req: any, res: any) {
  try {
    const col = await getMediaCollection();

    if (req.method === "GET") {
      const items = await col
        .find({ active: true })
        .sort({ sortOrder: 1, title: 1, createdAt: 1 })
        .toArray();

      return res.status(200).json(items.map(serializeMediaItem));
    }

    if (req.method === "POST") {
      requireAdmin(req);

      const bucketItems = await listBucketImages();
      const seenKeys = bucketItems.map((item) => item.key);
      const existingDocs = await col
        .find({ source: "r2" })
        .project({ objectKey: 1, active: 1 })
        .toArray();
      const existingKeys = new Set(existingDocs.map((doc) => doc.objectKey));
      const activeExistingKeys = new Set(
        existingDocs.filter((doc) => doc.active).map((doc) => doc.objectKey)
      );

      const now = new Date();

      if (bucketItems.length > 0) {
        await col.bulkWrite(
          bucketItems.map((item, index) => ({
            updateOne: {
              filter: { objectKey: item.key },
              update: {
                $set: {
                  objectKey: item.key,
                  contentType: inferContentType(item.key),
                  size: item.size,
                  etag: item.etag,
                  active: true,
                  source: "r2",
                  sourceLastModified: item.lastModified ?? null,
                  syncedAt: now,
                  updatedAt: now,
                },
                $setOnInsert: {
                  title: formatTitleFromKey(item.key),
                  altText: formatTitleFromKey(item.key),
                  sortOrder: index,
                  createdAt: now,
                },
              },
              upsert: true,
            },
          }))
        );
      }

      const missingKeys = Array.from(activeExistingKeys).filter(
        (key) => !seenKeys.includes(key)
      );

      if (missingKeys.length > 0) {
        await col.updateMany(
          { objectKey: { $in: missingKeys }, source: "r2" },
          {
            $set: {
              active: false,
              updatedAt: now,
            },
          }
        );
      }

      return res.status(200).json({
        syncedCount: bucketItems.length,
        insertedCount: bucketItems.filter((item) => !existingKeys.has(item.key)).length,
        updatedCount: bucketItems.filter((item) => existingKeys.has(item.key)).length,
        deactivatedCount: missingKeys.length,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    const status = error?.status ?? 500;
    console.error("Media API error:", error);
    return res.status(status).json({
      error: status === 500 ? "Server error" : error?.message ?? "Request failed",
    });
  }
}
