export type Gig = {
  _id?: string;
  venue: string;
  date: string; // ISO yyyy-mm-dd in state
  startTime?: string;
  description?: string;
  fee?: number | string;
  privateEvent?: boolean;
  postersNeeded?: boolean;
  internalNotes?: string;
};

export type SyncResult = {
  totalUpcoming: number;
  createdCount: number;
  recreatedCount: number;
  skippedCount: number;
  errors: { gigId: string; message: string }[];
};

export type AdminSection =
  | "gigs-list"
  | "gigs-calendar"
  | "payments-revenue"
  | "tools";
