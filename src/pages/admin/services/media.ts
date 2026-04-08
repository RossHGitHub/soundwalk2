import type { MediaItem, MediaSyncResult } from "../types";

function getAdminHeaders() {
  const token = localStorage.getItem("auth-token");
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

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
    headers: {
      "Content-Type": "application/json",
      ...getAdminHeaders(),
    },
    body: JSON.stringify({ action: "sync" }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || `Failed to sync media (${res.status})`);
  }

  return res.json();
}
