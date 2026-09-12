import { DateTime } from "luxon";
import type { Gig, GoogleCalendarFeed, SyncResult } from "../types";
import { getAdminHeaders } from "./adminAuth";

export function normalizeGig(gig: Gig): Gig {
  return {
    ...gig,
    _id: gig._id?.toString(),
    // Mongo stores instants; the diary uses the UK booking date.
    date: DateTime.fromISO(gig.date, { zone: "Europe/London" }).toISODate()!,
  };
}

export async function fetchGigs(): Promise<Gig[]> {
  const res = await fetch("/api/gigs", {
    headers: getAdminHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch gigs (${res.status})`);
  }
  const data = await res.json();
  return data.map(normalizeGig);
}

export async function fetchGoogleEvents(range?: {
  timeMin: string;
  timeMax: string;
}): Promise<GoogleCalendarFeed> {
  const query = range ? `?${new URLSearchParams(range)}` : "";
  const res = await fetch(`/api/google-events${query}`, {
    headers: getAdminHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Google events (${res.status})`);
  }
  const data = await res.json();

  if (Array.isArray(data)) {
    return {
      items: data,
      diagnostics: {
        serviceAccountEmail: null,
        credentialsConfigured: null,
        timeMin: null,
        timeMax: null,
        sources: [],
        dedupedCount: data.length,
        fetchError: null,
      },
    };
  }

  return data;
}

export async function saveGig(formData: Gig, currentGig?: Gig | null) {
  const method = currentGig ? "PUT" : "POST";
  const payload: Gig = {
    ...formData,
    fee: Number(formData.fee) || 0,
  };

  if (currentGig?._id) payload._id = currentGig._id;

  const res = await fetch("/api/gigs", {
    method,
    headers: getAdminHeaders(true),
    body: JSON.stringify(payload),
  });

  if (![200, 201].includes(res.status)) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error || "Server error";
    throw new Error(message);
  }
  return normalizeGig(await res.json());
}

export async function deleteGig(gigId: string) {
  const res = await fetch(`/api/gigs?id=${gigId}`, {
    method: "DELETE",
    headers: getAdminHeaders(),
    cache: "no-store",
  });
  if (![200, 204].includes(res.status)) {
    throw new Error("Failed to delete gig");
  }
}

export async function runCalendarSync(): Promise<SyncResult> {
  const res = await fetch("/api/gigs-sync", {
    method: "POST",
    headers: getAdminHeaders(true),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sync failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}
