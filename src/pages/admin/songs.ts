import type { SetList, Song } from "./types";

export const SET_LIST_STORAGE_KEY = "soundwalk:set-list-builder:v1";

export function buildSongFormData(song?: Song | null): Song {
  if (song) {
    return {
      _id: song._id,
      title: song.title ?? "",
      artist: song.artist ?? "",
      duration: song.duration ?? "",
      lyrics: song.lyrics ?? "",
      backingTrack: !!song.backingTrack,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
    };
  }

  return {
    title: "",
    artist: "",
    duration: "",
    lyrics: "",
    backingTrack: false,
  };
}

export function parseDurationToSeconds(value?: string) {
  if (!value?.trim()) return 0;

  const parts = value
    .split(":")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 0 || parts.length > 3) return 0;

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  if (seconds === 0 && hours < 15) {
    return hours * 60 + minutes;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

export function normalizeDurationValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(":");
  if (parts.length === 3 && Number(parts[2]) === 0 && Number(parts[0]) < 15) {
    return `${Number(parts[0])}:${String(Number(parts[1])).padStart(2, "0")}`;
  }

  return trimmed;
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function isValidDuration(value: string) {
  const trimmed = normalizeDurationValue(value);
  if (!trimmed) return false;
  return /^(\d+:)?\d{1,2}:\d{2}$/.test(trimmed);
}

export function createSetListId() {
  return `set-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function createSetEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function buildDefaultSetLists(): SetList[] {
  return [
    { id: "set-1", name: "Set 1", entries: [] },
    { id: "set-2", name: "Set 2", entries: [] },
  ];
}

export function ensureMinimumSets(sets: SetList[]) {
  if (sets.length >= 2) return sets;

  const nextSets = [...sets];
  const defaults = buildDefaultSetLists();

  while (nextSets.length < 2) {
    nextSets.push(defaults[nextSets.length]);
  }

  return nextSets;
}

export function readStoredSetLists() {
  if (typeof window === "undefined") {
    return buildDefaultSetLists();
  }

  try {
    const raw = window.localStorage.getItem(SET_LIST_STORAGE_KEY);
    if (!raw) return buildDefaultSetLists();

    const parsed = JSON.parse(raw) as { sets?: SetList[] };
    if (!Array.isArray(parsed.sets)) return buildDefaultSetLists();

    const safeSets = parsed.sets
      .filter((set) => set && typeof set.id === "string" && typeof set.name === "string")
      .map((set) => ({
        id: set.id,
        name: set.name,
        entries: Array.isArray(set.entries)
          ? set.entries.filter(
              (entry) =>
                entry &&
                typeof entry.id === "string" &&
                typeof entry.songId === "string"
            )
          : [],
      }));

    return ensureMinimumSets(safeSets);
  } catch {
    return buildDefaultSetLists();
  }
}

export function saveStoredSetLists(sets: SetList[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SET_LIST_STORAGE_KEY, JSON.stringify({ sets }));
}
