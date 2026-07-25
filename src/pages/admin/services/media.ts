import type { MediaItem, MediaSyncResult } from "../types";
import { getAdminHeaders } from "./adminAuth";

export async function fetchMedia(): Promise<MediaItem[]> {
  const res = await fetch("/api/media");
  if (!res.ok) {
    throw new Error(`Failed to fetch media (${res.status})`);
  }

  const data = await res.json();
  return data.map((item: any) => ({
    ...item,
    _id: item._id?.toString(),
  }));
}

export async function syncMediaBucket(): Promise<MediaSyncResult> {
  const res = await fetch("/api/media", {
    method: "POST",
    headers: getAdminHeaders(true),
    body: JSON.stringify({ action: "sync" }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || `Failed to sync media (${res.status})`);
  }

  return res.json();
}
