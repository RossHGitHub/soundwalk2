import type { Gig, SyncResult } from "../types";

export async function fetchGigs(): Promise<Gig[]> {
  const res = await fetch("/api/gigs");
  if (!res.ok) {
    throw new Error(`Failed to fetch gigs (${res.status})`);
  }
  const data = await res.json();
  return data.map((gig: any) => ({
    ...gig,
    _id: gig._id?.toString(),
    date: new Date(gig.date).toISOString().slice(0, 10),
  }));
}

export async function fetchGoogleEvents(): Promise<any[]> {
  const res = await fetch("/api/google-events");
  if (!res.ok) {
    throw new Error(`Failed to fetch Google events (${res.status})`);
  }
  return res.json();
}

export async function saveGig(formData: Gig, currentGig?: Gig | null) {
  const method = currentGig ? "PUT" : "POST";
  const payload: any = {
    ...formData,
    fee: Number(formData.fee) || 0,
  };

  if (currentGig?._id) payload._id = currentGig._id;

  const res = await fetch("/api/gigs", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (![200, 201, 204].includes(res.status)) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error || "Server error";
    throw new Error(message);
  }
}

export async function deleteGig(gigId: string) {
  const res = await fetch(`/api/gigs?id=${gigId}`, { method: "DELETE" });
  if (![200, 204].includes(res.status)) {
    throw new Error("Failed to delete gig");
  }
}

export async function runCalendarSync(): Promise<SyncResult> {
  const res = await fetch("/api/gigs-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sync failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}
