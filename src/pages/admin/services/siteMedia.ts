import type { SiteMediaSlot } from "../types";
import { getAdminHeaders } from "./adminAuth";

export async function fetchSiteMediaSlots(): Promise<SiteMediaSlot[]> {
  const res = await fetch("/api/site-media");
  if (!res.ok) {
    throw new Error(`Failed to fetch site media slots (${res.status})`);
  }

  return res.json();
}

export async function saveSiteMediaSlot(
  key: string,
  mediaId: string | null
): Promise<SiteMediaSlot> {
  const res = await fetch("/api/site-media", {
    method: "POST",
    headers: getAdminHeaders(true),
    body: JSON.stringify({ key, mediaId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || `Failed to save site media slot (${res.status})`);
  }

  return res.json();
}
