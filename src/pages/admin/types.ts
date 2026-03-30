export type Gig = {
  _id?: string;
  _externalGoogleId?: string;
  venue: string;
  date: string; // ISO yyyy-mm-dd in state
  startTime?: string;
  description?: string;
  fee?: number | string;
  paymentMethod?: "Cash" | "Bank Transfer" | "";
  paymentSplit?: "Even" | "Customise";
  paymentSplitRoss?: number | string;
  paymentSplitKeith?: number | string;
  paymentSplitBarry?: number | string;
  privateEvent?: boolean;
  postersNeeded?: boolean;
  internalNotes?: string;
};

export type Song = {
  _id?: string;
  title: string;
  artist: string;
  duration: string;
  lyrics: string;
  backingTrack?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SetListEntry = {
  id: string;
  songId: string;
};

export type SetList = {
  id: string;
  name: string;
  entries: SetListEntry[];
};

export type SavedSetList = {
  _id?: string;
  title: string;
  sets: SetList[];
  createdAt?: string;
  updatedAt?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
  allDay?: boolean;
};

export type GoogleCalendarSourceStatus = {
  calendarId: string;
  ok: boolean;
  eventCount: number;
  error?: string;
};

export type GoogleCalendarFeed = {
  items: GoogleCalendarEvent[];
  diagnostics: {
    serviceAccountEmail?: string | null;
    credentialsConfigured?: boolean | null;
    timeMin: string | null;
    timeMax: string | null;
    sources: GoogleCalendarSourceStatus[];
    dedupedCount: number;
    fetchError?: string | null;
  };
};

export type SyncResult = {
  totalUpcoming: number;
  createdCount: number;
  recreatedCount: number;
  skippedCount: number;
  errors: { gigId: string; message: string }[];
};

export type AdminSection =
  | "set-list-builder"
  | "gigs-list"
  | "gigs-calendar"
  | "payments-revenue"
  | "payments-payslips"
  | "tools";
