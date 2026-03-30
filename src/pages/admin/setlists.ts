import type { SavedSetList, SetList } from "./types";
import { buildDefaultSetLists } from "./songs";

export type SetListDraft = {
  currentSetListId: string | null;
  title: string;
  sets: SetList[];
};

export const SET_LIST_DRAFT_STORAGE_KEY = "soundwalk:set-list-draft:v1";

export function buildEmptySetListDraft(): SetListDraft {
  return {
    currentSetListId: null,
    title: "",
    sets: buildDefaultSetLists(),
  };
}

export function cloneSets(sets: SetList[]) {
  return sets.map((set) => ({
    ...set,
    entries: set.entries.map((entry) => ({ ...entry })),
  }));
}

export function buildDraftFromSavedSetList(setlist: SavedSetList): SetListDraft {
  return {
    currentSetListId: setlist._id ?? null,
    title: setlist.title ?? "",
    sets: cloneSets(setlist.sets),
  };
}

export function readStoredSetListDraft(): SetListDraft {
  if (typeof window === "undefined") {
    return buildEmptySetListDraft();
  }

  try {
    const raw = window.localStorage.getItem(SET_LIST_DRAFT_STORAGE_KEY);
    if (!raw) return buildEmptySetListDraft();

    const parsed = JSON.parse(raw) as Partial<SetListDraft>;
    const sets = Array.isArray(parsed.sets) ? cloneSets(parsed.sets) : buildDefaultSetLists();

    return {
      currentSetListId:
        typeof parsed.currentSetListId === "string" ? parsed.currentSetListId : null,
      title: typeof parsed.title === "string" ? parsed.title : "",
      sets,
    };
  } catch {
    return buildEmptySetListDraft();
  }
}

export function saveStoredSetListDraft(draft: SetListDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SET_LIST_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function totalSongsInSetList(sets: SetList[]) {
  return sets.reduce((total, set) => total + set.entries.length, 0);
}
