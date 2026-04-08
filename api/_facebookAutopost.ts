import { ObjectId } from "mongodb";
import { DateTime } from "luxon";
import { buildMediaUrl, getDb } from "./_media.js";
import { requireEnv } from "./_envGuard.js";

type GigDoc = {
  _id: ObjectId;
  venue?: string;
  date: Date;
  startTime?: string | null;
  description?: string;
  privateEvent?: boolean;
};

type MediaDoc = {
  _id: ObjectId;
  title: string;
  altText: string;
  objectKey?: string;
  active: boolean;
};

type FacebookAutoPostHistoryDoc = {
  _id?: ObjectId;
  type: "gig-promo-7-day";
  gigId: ObjectId;
  gigDateKey: string;
  venueSnapshot: string;
  caption: string;
  mediaId?: ObjectId | null;
  mediaTitle?: string | null;
  imageUrl?: string | null;
  status: "posted" | "skipped" | "error";
  reason?: string;
  facebookPostId?: string | null;
  attemptedAt: Date;
  postedAt?: Date | null;
  createdAt: Date;
};

type JobLockDoc = {
  _id: string;
  expiresAt: Date;
  updatedAt: Date;
};

type FacebookGraphResponse = {
  id?: string;
  post_id?: string;
  error?: {
    message?: string;
  };
};

type RunOptions = {
  req: any;
  forceGigId?: string | null;
};

type RunItem = {
  gigId: string;
  venue: string;
  gigDateKey: string;
  action: "posted" | "skipped" | "error";
  reason?: string;
  facebookPostId?: string | null;
  mediaTitle?: string | null;
};

export type FacebookAutoPostRunResult = {
  nowISO: string;
  dueCount: number;
  postedCount: number;
  skippedCount: number;
  errorCount: number;
  items: RunItem[];
};

function getOrdinalSuffix(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatGigDateWithoutYear(dateValue: Date) {
  const dt = DateTime.fromJSDate(dateValue).setZone("Europe/London");
  if (!dt.isValid) {
    return "Coming Soon";
  }
  const day = dt.day;
  return `${dt.toFormat("EEE")}, ${day}${getOrdinalSuffix(day)} ${dt.toFormat("LLL")}`;
}

function formatStartTime(startTime?: string | null) {
  if (!startTime) {
    return "Evening start";
  }

  const match = /^(\d{1,2}):(\d{2})/.exec(startTime.trim());
  if (!match) {
    return "Evening start";
  }

  const hour = match[1].padStart(2, "0");
  const minute = match[2];
  return `${hour}:${minute} start`;
}

function buildCaption(gig: GigDoc) {
  const dateLine = formatGigDateWithoutYear(gig.date);
  const venueLine = (gig.venue || "").trim() || "Soundwalk Live";
  const descriptionLine =
    (gig.description || "").trim() || "Join us for a night of live music.";
  const startLine = formatStartTime(gig.startTime);

  return [dateLine, venueLine, descriptionLine, startLine].join("\n\n");
}

function getAbsoluteBaseUrl(req: any) {
  const configured = process.env.SITE_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const proto =
    req.headers?.["x-forwarded-proto"] ??
    req.headers?.["X-Forwarded-Proto"] ??
    "http";
  const host = req.headers?.host ?? req.headers?.Host;
  if (!host || typeof host !== "string") {
    throw new Error("Missing SITE_BASE_URL and request host.");
  }

  return `${proto}://${host}`;
}

function toAbsoluteUrl(req: any, url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseUrl = getAbsoluteBaseUrl(req);
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

async function pickMediaForPost() {
  const db = await getDb();
  const mediaCollection = db.collection<MediaDoc>("media");
  const historyCollection = db.collection<FacebookAutoPostHistoryDoc>(
    "facebookAutoPostHistory"
  );

  const mediaItems = await mediaCollection
    .find({ active: true })
    .sort({ title: 1 })
    .toArray();

  if (mediaItems.length === 0) {
    return null;
  }

  const successfulHistory = await historyCollection
    .find({
      type: "gig-promo-7-day",
      status: "posted",
      mediaId: { $ne: null },
    })
    .sort({ postedAt: -1, attemptedAt: -1 })
    .toArray();

  const usedMediaIds = new Set(
    successfulHistory
      .map((item) => item.mediaId?.toString())
      .filter((value): value is string => !!value)
  );

  const unusedMediaItems = mediaItems.filter(
    (item) => !usedMediaIds.has(item._id.toString())
  );

  if (unusedMediaItems.length > 0) {
    return unusedMediaItems[Math.floor(Math.random() * unusedMediaItems.length)];
  }

  const latestUseByMediaId = new Map<string, number>();
  for (const item of successfulHistory) {
    const mediaId = item.mediaId?.toString();
    if (!mediaId || latestUseByMediaId.has(mediaId)) {
      continue;
    }
    latestUseByMediaId.set(
      mediaId,
      item.postedAt?.getTime() ?? item.attemptedAt.getTime()
    );
  }

  const rankedItems = mediaItems
    .map((item) => ({
      item,
      lastUsedAt: latestUseByMediaId.get(item._id.toString()) ?? 0,
    }))
    .sort((left, right) => left.lastUsedAt - right.lastUsedAt);

  const oldestLastUsedAt = rankedItems[0]?.lastUsedAt ?? 0;
  const oldestCandidates = rankedItems
    .filter((entry) => entry.lastUsedAt === oldestLastUsedAt)
    .map((entry) => entry.item);

  return oldestCandidates[Math.floor(Math.random() * oldestCandidates.length)];
}

async function publishFacebookPhotoPost({
  caption,
  imageUrl,
}: {
  caption: string;
  imageUrl?: string | null;
}) {
  const pageId = requireEnv("FACEBOOK_PAGE_ID");
  const accessToken = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  const graphVersion = process.env.FACEBOOK_GRAPH_VERSION?.trim() || "v23.0";

  const endpoint = imageUrl
    ? `https://graph.facebook.com/${graphVersion}/${pageId}/photos`
    : `https://graph.facebook.com/${graphVersion}/${pageId}/feed`;

  const body = new URLSearchParams();
  body.set("access_token", accessToken);
  body.set(imageUrl ? "caption" : "message", caption);

  if (imageUrl) {
    body.set("url", imageUrl);
    body.set("published", "true");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json().catch(() => ({}))) as FacebookGraphResponse;
  if (!response.ok || data?.error) {
    const message =
      data?.error?.message ||
      `Facebook API request failed (${response.status})`;
    throw new Error(message);
  }

  return {
    id: typeof data?.id === "string" ? data.id : null,
    postId: typeof data?.post_id === "string" ? data.post_id : data?.id ?? null,
  };
}

async function findCandidateGigs(forceGigId?: string | null) {
  const db = await getDb();
  const gigsCollection = db.collection<GigDoc>("gigs");

  if (forceGigId) {
    if (!ObjectId.isValid(forceGigId)) {
      throw new Error("Invalid gigId.");
    }

    const gig = await gigsCollection.findOne({ _id: new ObjectId(forceGigId) });
    return gig ? [gig] : [];
  }

  const todayLondon = DateTime.now().setZone("Europe/London").startOf("day");
  const gigs = await gigsCollection
    .find({ privateEvent: { $ne: true } })
    .sort({ date: 1 })
    .toArray();

  return gigs.filter((gig) => {
    const gigDay = DateTime.fromJSDate(gig.date)
      .setZone("Europe/London")
      .startOf("day");

    if (!gigDay.isValid) {
      return false;
    }

    const daysUntilGig = Math.floor(gigDay.diff(todayLondon, "days").days);
    return daysUntilGig >= 0 && daysUntilGig <= 7;
  });
}

async function acquireLock() {
  const db = await getDb();
  const locks = db.collection<JobLockDoc>("jobLocks");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const result = await locks.findOneAndUpdate(
    {
      _id: "facebook-auto-post",
      $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }],
    },
    {
      $set: {
        _id: "facebook-auto-post",
        expiresAt,
        updatedAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  return result?.expiresAt?.getTime() === expiresAt.getTime();
}

async function releaseLock() {
  const db = await getDb();
  await db.collection<JobLockDoc>("jobLocks").deleteOne({ _id: "facebook-auto-post" });
}

export async function runFacebookAutoPostJob({
  req,
  forceGigId,
}: RunOptions): Promise<FacebookAutoPostRunResult> {
  const lockAcquired = await acquireLock();
  if (!lockAcquired) {
    return {
      nowISO: new Date().toISOString(),
      dueCount: 0,
      postedCount: 0,
      skippedCount: 1,
      errorCount: 0,
      items: [
        {
          gigId: "",
          venue: "",
          gigDateKey: "",
          action: "skipped",
          reason: "Auto-post job already running.",
        },
      ],
    };
  }

  try {
    const db = await getDb();
    const historyCollection = db.collection<FacebookAutoPostHistoryDoc>(
      "facebookAutoPostHistory"
    );
    const gigs = await findCandidateGigs(forceGigId);
    const items: RunItem[] = [];

    for (const gig of gigs) {
      const gigDateKey = DateTime.fromJSDate(gig.date)
        .setZone("Europe/London")
        .toFormat("yyyy-MM-dd");
      const venue = (gig.venue || "").trim() || "Soundwalk Live";

      if (gig.privateEvent) {
        items.push({
          gigId: gig._id.toString(),
          venue,
          gigDateKey,
          action: "skipped",
          reason: "Private gigs are excluded.",
        });
        continue;
      }

      const existingSuccess = await historyCollection.findOne({
        type: "gig-promo-7-day",
        gigId: gig._id,
        gigDateKey,
        status: "posted",
      });

      if (existingSuccess) {
        items.push({
          gigId: gig._id.toString(),
          venue,
          gigDateKey,
          action: "skipped",
          reason: "Already posted for this gig date.",
          facebookPostId: existingSuccess.facebookPostId ?? null,
          mediaTitle: existingSuccess.mediaTitle ?? null,
        });
        continue;
      }

      const caption = buildCaption(gig);
      const selectedMedia = await pickMediaForPost();
      const imageUrl = selectedMedia
        ? toAbsoluteUrl(req, buildMediaUrl(selectedMedia, 86400))
        : null;

      try {
        const facebookPost = await publishFacebookPhotoPost({
          caption,
          imageUrl,
        });

        await historyCollection.insertOne({
          type: "gig-promo-7-day",
          gigId: gig._id,
          gigDateKey,
          venueSnapshot: venue,
          caption,
          mediaId: selectedMedia?._id ?? null,
          mediaTitle: selectedMedia?.title ?? null,
          imageUrl,
          status: "posted",
          facebookPostId: facebookPost.postId,
          attemptedAt: new Date(),
          postedAt: new Date(),
          createdAt: new Date(),
        });

        items.push({
          gigId: gig._id.toString(),
          venue,
          gigDateKey,
          action: "posted",
          facebookPostId: facebookPost.postId,
          mediaTitle: selectedMedia?.title ?? null,
          reason: selectedMedia ? undefined : "Posted without image fallback.",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown Facebook posting error.";

        await historyCollection.insertOne({
          type: "gig-promo-7-day",
          gigId: gig._id,
          gigDateKey,
          venueSnapshot: venue,
          caption,
          mediaId: selectedMedia?._id ?? null,
          mediaTitle: selectedMedia?.title ?? null,
          imageUrl,
          status: "error",
          reason: message,
          attemptedAt: new Date(),
          postedAt: null,
          createdAt: new Date(),
        });

        items.push({
          gigId: gig._id.toString(),
          venue,
          gigDateKey,
          action: "error",
          reason: message,
          mediaTitle: selectedMedia?.title ?? null,
        });
      }
    }

    return {
      nowISO: new Date().toISOString(),
      dueCount: gigs.length,
      postedCount: items.filter((item) => item.action === "posted").length,
      skippedCount: items.filter((item) => item.action === "skipped").length,
      errorCount: items.filter((item) => item.action === "error").length,
      items,
    };
  } finally {
    await releaseLock();
  }
}
