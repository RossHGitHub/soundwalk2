import { ObjectId } from "mongodb";
import { requireAdmin } from "./_adminAuth.js";
import {
  buildMediaUrl,
  getMediaCollection,
  getSiteMediaCollection,
} from "./_media.js";
import { SITE_MEDIA_SLOTS } from "../src/site/siteMediaConfig.js";

type SiteMediaSlotDefinition = (typeof SITE_MEDIA_SLOTS)[number];
type SiteMediaSlotPayload = Awaited<ReturnType<typeof buildSlotPayload>>[number];

function serializeMedia(item: any) {
  if (!item) {
    return null;
  }

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

async function buildSlotPayload() {
  const slotCollection = await getSiteMediaCollection();
  const mediaCollection = await getMediaCollection();
  const assignments = await slotCollection.find().toArray();
  const mediaIds = assignments
    .map((assignment) => assignment.mediaId)
    .filter((mediaId): mediaId is ObjectId => !!mediaId);
  const uniqueMediaIds = Array.from(
    new Map(mediaIds.map((id) => [id.toString(), id])).values()
  );
  const mediaDocs =
    uniqueMediaIds.length > 0
      ? await mediaCollection
          .find({ _id: { $in: uniqueMediaIds }, active: true })
          .toArray()
      : [];
  const mediaById = new Map(mediaDocs.map((media) => [media._id.toString(), media]));

  return SITE_MEDIA_SLOTS.map((slot) => {
    const assignment = assignments.find((item) => item.key === slot.key);
    const media = assignment?.mediaId
      ? mediaById.get(assignment.mediaId.toString()) ?? null
      : null;

    return {
      ...slot,
      media,
      mediaId: media?._id?.toString() ?? null,
      imageUrl: media ? buildMediaUrl(media, 86400) : null,
      updatedAt: assignment?.updatedAt?.toISOString?.() ?? null,
    };
  });
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const slots = await buildSlotPayload();
      return res.status(200).json(
        slots.map((slot) => ({
          ...slot,
          media: serializeMedia(slot.media),
        }))
      );
    }

    if (req.method === "POST") {
      requireAdmin(req);

      const key = typeof req.body?.key === "string" ? req.body.key.trim() : "";
      const mediaIdRaw =
        typeof req.body?.mediaId === "string" && req.body.mediaId.trim()
          ? req.body.mediaId.trim()
          : null;

      if (!SITE_MEDIA_SLOTS.some((slot: SiteMediaSlotDefinition) => slot.key === key)) {
        return res.status(400).json({ error: "Invalid site media slot." });
      }

      const slotCollection = await getSiteMediaCollection();
      const mediaCollection = await getMediaCollection();
      let mediaId: ObjectId | null = null;

      if (mediaIdRaw) {
        if (!ObjectId.isValid(mediaIdRaw)) {
          return res.status(400).json({ error: "Invalid mediaId." });
        }

        mediaId = new ObjectId(mediaIdRaw);
        const mediaExists = await mediaCollection.findOne({
          _id: mediaId,
          active: true,
        });

        if (!mediaExists) {
          return res.status(404).json({ error: "Media item not found." });
        }
      }

      await slotCollection.updateOne(
        { key },
        {
          $set: {
            key,
            mediaId,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      const slots = await buildSlotPayload();
      const updatedSlot = slots.find(
        (slot: SiteMediaSlotPayload) => slot.key === key
      );

      return res.status(200).json({
        ...updatedSlot,
        media: serializeMedia(updatedSlot?.media),
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    const status = error?.status ?? 500;
    console.error("Site media API error:", error);
    return res.status(status).json({
      error: status === 500 ? "Server error" : error?.message ?? "Request failed",
    });
  }
}
