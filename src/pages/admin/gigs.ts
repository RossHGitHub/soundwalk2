import type { Gig } from "./types";

export function groupGigsByDate(gigs: Gig[]) {
  return gigs.reduce((acc, gig) => {
    const date = new Date(gig.date);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString("default", { month: "long" });
    acc[year] = acc[year] || {};
    acc[year][month] = acc[year][month] || [];
    acc[year][month].push(gig);
    return acc;
  }, {} as { [year: string]: { [month: string]: Gig[] } });
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timeString?: string) {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":");
  return `${hours}:${minutes}`;
}

export function matchesSearch(gig: Gig, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    gig.venue,
    gig.description ?? "",
    gig.internalNotes ?? "",
    gig.date,
    gig.startTime ?? "",
    String(gig.fee ?? ""),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}
