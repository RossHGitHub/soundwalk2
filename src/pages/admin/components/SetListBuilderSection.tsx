import { type DragEvent, useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowUp,
  Disc3,
  GripVertical,
  LibraryBig,
  Music2,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  buildDefaultSetLists,
  createSetEntryId,
  createSetListId,
  ensureMinimumSets,
  formatDuration,
  parseDurationToSeconds,
} from "../songs";
import {
  buildDraftFromSavedSetList,
  buildEmptySetListDraft,
  cloneSets,
  readStoredSetListDraft,
  saveStoredSetListDraft,
  totalSongsInSetList,
} from "../setlists";
import type { SavedSetList, SetList, Song } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import SetListActionsModal from "./SetListActionsModal";
import SetListViewerModal from "./SetListViewerModal";

type Props = {
  songs: Song[];
  loading: boolean;
  savedSetLists: SavedSetList[];
  savedSetListsLoading: boolean;
  setListSaving: boolean;
  onCreateSong: () => void;
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
  onSaveSetList: (
    payload: SavedSetList,
    currentSetListId?: string | null
  ) => Promise<SavedSetList>;
  onDeleteSetList: (setListId: string) => Promise<void>;
};

type DragPayload =
  | {
      type: "catalog";
      songId: string;
    }
  | {
      type: "set-entry";
      songId: string;
      entryId: string;
      sourceSetId: string;
    };

type DropTarget = {
  setId: string;
  index: number;
};

function getTargetIndexFromPointer(
  event: DragEvent<HTMLDivElement>,
  index: number
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  return event.clientY < midpoint ? index : index + 1;
}

function buildDragPayload(event: DragEvent, payload: DragPayload) {
  event.dataTransfer.effectAllowed = payload.type === "catalog" ? "copy" : "move";
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
}

function readDragPayload(event: DragEvent): DragPayload | null {
  try {
    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return null;
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

function getSetDuration(set: SetList, songsById: Map<string, Song>) {
  return set.entries.reduce((total, entry) => {
    const song = songsById.get(entry.songId);
    return total + parseDurationToSeconds(song?.duration);
  }, 0);
}

function formatSavedDate(value?: string) {
  if (!value) return "No date";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "No date";
  }
}

export default function SetListBuilderSection({
  songs,
  loading,
  savedSetLists,
  savedSetListsLoading,
  setListSaving,
  onCreateSong,
  onSelectSong,
  onEditSong,
  onSaveSetList,
  onDeleteSetList,
}: Props) {
  const [draftTitle, setDraftTitle] = useState("");
  const [currentSetListId, setCurrentSetListId] = useState<string | null>(null);
  const [sets, setSets] = useState<SetList[]>(() => buildDefaultSetLists());
  const [catalogSearch, setCatalogSearch] = useState("");
  const [activeSetId, setActiveSetId] = useState("set-1");
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [selectedSavedSetList, setSelectedSavedSetList] = useState<SavedSetList | null>(null);
  const [viewerSetList, setViewerSetList] = useState<SavedSetList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedSetList | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [isSetListsModalOpen, setIsSetListsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const songsById = useMemo(
    () =>
      new Map(
        songs
          .filter((song) => !!song._id)
          .map((song) => [song._id as string, song] satisfies [string, Song])
      ),
    [songs]
  );

  const usedSongIds = useMemo(
    () => new Set(sets.flatMap((set) => set.entries.map((entry) => entry.songId))),
    [sets]
  );

  const availableSongs = useMemo(
    () => songs.filter((song) => song._id && !usedSongIds.has(song._id)),
    [songs, usedSongIds]
  );

  const filteredSongs = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    if (!query) return availableSongs;

    return availableSongs.filter((song) =>
      [song.title, song.artist, song.lyrics].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [availableSongs, catalogSearch]);

  useEffect(() => {
    const storedDraft = readStoredSetListDraft();
    setCurrentSetListId(storedDraft.currentSetListId);
    setDraftTitle(storedDraft.title);
    setSets(ensureMinimumSets(storedDraft.sets));
    setActiveSetId(storedDraft.sets[0]?.id ?? "set-1");
  }, []);

  useEffect(() => {
    if (loading) return;

    setSets((prev) => {
      const songIds = new Set(songs.filter((song) => song._id).map((song) => song._id as string));
      return ensureMinimumSets(
        prev.map((set) => ({
          ...set,
          entries: set.entries.filter((entry) => songIds.has(entry.songId)),
        }))
      );
    });
  }, [loading, songs]);

  useEffect(() => {
    saveStoredSetListDraft({
      currentSetListId,
      title: draftTitle,
      sets,
    });
  }, [currentSetListId, draftTitle, sets]);

  useEffect(() => {
    if (!sets.some((set) => set.id === activeSetId)) {
      setActiveSetId(sets[0]?.id ?? "set-1");
    }
  }, [activeSetId, sets]);

  function resetDraft() {
    const next = buildEmptySetListDraft();
    setCurrentSetListId(next.currentSetListId);
    setDraftTitle(next.title);
    setSets(next.sets);
    setActiveSetId(next.sets[0]?.id ?? "set-1");
  }

  function loadSavedSetList(setlist: SavedSetList) {
    const next = buildDraftFromSavedSetList(setlist);
    setCurrentSetListId(next.currentSetListId);
    setDraftTitle(next.title);
    setSets(ensureMinimumSets(cloneSets(next.sets)));
    setActiveSetId(next.sets[0]?.id ?? "set-1");
    setSelectedSavedSetList(null);
    setViewerSetList(null);
  }

  async function handleSave() {
    if (!draftTitle.trim()) {
      alert("Please give the setlist a title.");
      return;
    }

    if (totalSongsInSetList(sets) === 0) {
      alert("Please add at least one song before saving.");
      return;
    }

    try {
      const savedSetList = await onSaveSetList(
        {
          title: draftTitle.trim(),
          sets: cloneSets(sets),
        },
        currentSetListId
      );
      setCurrentSetListId(savedSetList._id ?? null);
      setDraftTitle(savedSetList.title);
      setSets(ensureMinimumSets(cloneSets(savedSetList.sets)));
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "An error occurred while saving the setlist.";
      alert(`Failed to save setlist: ${message}`);
    }
  }

  async function handleDeleteSavedSetList() {
    if (!deleteTarget?._id) return;

    setDeleteBusy(true);
    try {
      await onDeleteSetList(deleteTarget._id);
      if (currentSetListId === deleteTarget._id) {
        resetDraft();
      }
      setDeleteTarget(null);
      setSelectedSavedSetList(null);
      setViewerSetList(null);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "An error occurred while deleting the setlist.";
      alert(`Failed to delete setlist: ${message}`);
    } finally {
      setDeleteBusy(false);
    }
  }

  function addSongToSet(songId: string, setId = activeSetId) {
    if (usedSongIds.has(songId)) return;

    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? {
              ...set,
              entries: [...set.entries, { id: createSetEntryId(), songId }],
            }
          : set
      )
    );
  }

  function handleSetNameChange(setId: string, value: string) {
    setSets((prev) =>
      prev.map((set) => (set.id === setId ? { ...set, name: value } : set))
    );
  }

  function addSet() {
    setSets((prev) => {
      const nextNumber = prev.length + 1;
      return [
        ...prev,
        {
          id: createSetListId(),
          name: `Set ${nextNumber}`,
          entries: [],
        },
      ];
    });
  }

  function removeSet(setId: string) {
    setSets((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((set) => set.id !== setId);
    });
  }

  function moveEntry(setId: string, fromIndex: number, direction: -1 | 1) {
    setSets((prev) =>
      prev.map((set) => {
        if (set.id !== setId) return set;
        const nextIndex = fromIndex + direction;
        if (nextIndex < 0 || nextIndex >= set.entries.length) return set;
        const nextEntries = [...set.entries];
        const [entry] = nextEntries.splice(fromIndex, 1);
        nextEntries.splice(nextIndex, 0, entry);
        return { ...set, entries: nextEntries };
      })
    );
  }

  function removeEntry(setId: string, entryId: string) {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? {
              ...set,
              entries: set.entries.filter((entry) => entry.id !== entryId),
            }
          : set
      )
    );
  }

  function moveOrInsertPayload(payload: DragPayload, targetSetId: string, targetIndex: number) {
    setSets((prev) => {
      if (payload.type === "catalog") {
        const songAlreadyUsed = prev.some((set) =>
          set.entries.some((entry) => entry.songId === payload.songId)
        );
        if (songAlreadyUsed) return prev;

        return prev.map((set) =>
          set.id === targetSetId
            ? {
                ...set,
                entries: [
                  ...set.entries.slice(0, targetIndex),
                  { id: createSetEntryId(), songId: payload.songId },
                  ...set.entries.slice(targetIndex),
                ],
              }
            : set
        );
      }

      const sourceSet = prev.find((set) => set.id === payload.sourceSetId);
      if (!sourceSet) return prev;
      const sourceIndex = sourceSet.entries.findIndex((entry) => entry.id === payload.entryId);
      if (sourceIndex === -1) return prev;

      return prev.map((set) => {
        if (set.id !== payload.sourceSetId && set.id !== targetSetId) return set;

        if (set.id === payload.sourceSetId && payload.sourceSetId === targetSetId) {
          const nextEntries = [...set.entries];
          const [entry] = nextEntries.splice(sourceIndex, 1);
          const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
          nextEntries.splice(adjustedIndex, 0, entry);
          return { ...set, entries: nextEntries };
        }

        if (set.id === payload.sourceSetId) {
          return {
            ...set,
            entries: set.entries.filter((entry) => entry.id !== payload.entryId),
          };
        }

        return {
          ...set,
          entries: [
            ...set.entries.slice(0, targetIndex),
            { id: payload.entryId, songId: payload.songId },
            ...set.entries.slice(targetIndex),
          ],
        };
      });
    });
  }

  function handleDrop(event: DragEvent, setId: string, index: number) {
    event.preventDefault();
    const payload = readDragPayload(event);
    setDropTarget(null);
    if (!payload) return;

    moveOrInsertPayload(payload, setId, index);
    setActiveSetId(setId);
  }

  const totalSongs = totalSongsInSetList(sets);
  const totalRuntime = formatDuration(
    sets.reduce((total, set) => total + getSetDuration(set, songsById), 0)
  );

  return (
    <div className="mt-4 space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(81,183,172,0.18),_transparent_28%),linear-gradient(180deg,rgba(12,20,28,0.96)_0%,rgba(7,11,16,0.98)_100%)] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.28)] sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ab5bf]">
              Set Builder
            </p>
          
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,260px)_auto_auto_auto]">
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Setlist title"
              className="border-white/10 bg-white/5 text-white"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSetListsModalOpen(true)}
            >
              <LibraryBig className="h-4 w-4" />
              Setlists
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetConfirmOpen(true)}
            >
              Start New
            </Button>
            <Button type="button" onClick={handleSave} disabled={setListSaving}>
              <Save className="h-4 w-4" />
              {currentSetListId ? "Save Changes" : "Save Setlist"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Songs
            </p>
            <p className="mt-1 text-sm font-medium text-white">{totalSongs}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Runtime
            </p>
            <p className="mt-1 text-sm font-medium text-white">{totalRuntime}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible">
          {sets.map((set) => {
            const totalDuration = getSetDuration(set, songsById);
            const isActive = set.id === activeSetId;

            return (
              <section
                key={set.id}
                className={`min-w-[85%] snap-center rounded-[28px] border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition md:min-w-0 ${
                  isActive
                    ? "border-emerald-400/60 bg-[#0f1f29]"
                    : "border-white/10 bg-white/[0.035]"
                }`}
                onClick={() => setActiveSetId(set.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Input
                      value={set.name}
                      onChange={(event) => handleSetNameChange(set.id, event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      className="border-white/10 bg-white/5 text-lg font-semibold text-white"
                    />
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                      {set.entries.length} song{set.entries.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {sets.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-white/60 hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeSet(set.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {set.entries.length === 0 && (
                    <div
                      className="rounded-2xl border border-dashed border-white/15 bg-black/10 px-4 py-8 text-center text-sm text-white/45"
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropTarget({ setId: set.id, index: 0 });
                      }}
                      onDrop={(event) => handleDrop(event, set.id, 0)}
                    >
                      Drag songs here or use quick add from the catalogue.
                    </div>
                  )}

                  {set.entries.map((entry, index) => {
                    const song = songsById.get(entry.songId);
                    if (!song) return null;

                    const showDropBefore =
                      dropTarget?.setId === set.id && dropTarget.index === index;

                    return (
                      <div key={entry.id}>
                        <div
                          draggable
                          onDragStart={(event) =>
                            buildDragPayload(event, {
                              type: "set-entry",
                              songId: entry.songId,
                              entryId: entry.id,
                              sourceSetId: set.id,
                            })
                          }
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDropTarget({
                              setId: set.id,
                              index: getTargetIndexFromPointer(event, index),
                            });
                          }}
                          onDrop={(event) => {
                            const nextIndex = getTargetIndexFromPointer(event, index);
                            handleDrop(event, set.id, nextIndex);
                          }}
                          className={`group rounded-[20px] border bg-[#09141c] px-3 py-2 transition hover:bg-[#0d1820] ${
                            showDropBefore
                              ? "border-emerald-400/50 shadow-[inset_0_2px_0_rgba(74,222,128,0.75)]"
                              : "border-white/10 hover:border-emerald-400/35"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onSelectSong(song)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/65">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-white">
                                    {index + 1}. {song.title}
                                  </p>
                                  {song.backingTrack && (
                                    <span className="shrink-0 rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">
                                      BT
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-xs text-white/60">
                                  {song.artist?.trim() || "Artist not set"}
                                </p>
                              </div>
                            </button>

                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                                {song.duration}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white/60 hover:text-white"
                                onClick={() => moveEntry(set.id, index, -1)}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white/60 hover:text-white"
                                onClick={() => moveEntry(set.id, index, 1)}
                                disabled={index === set.entries.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white/60 hover:text-white"
                                onClick={() => onEditSong(song)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white/60 hover:text-red-300"
                                onClick={() => removeEntry(set.id, entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {set.entries.length > 0 && (
                    <div
                      className={`h-3 rounded-full transition ${
                        dropTarget?.setId === set.id && dropTarget.index === set.entries.length
                          ? "bg-emerald-400/80"
                          : "bg-white/5"
                      }`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropTarget({ setId: set.id, index: set.entries.length });
                      }}
                      onDrop={(event) => handleDrop(event, set.id, set.entries.length)}
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Total Duration
                    </p>
                    <p className="text-sm text-white/65">
                      Calculated from the stored song durations
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-emerald-300">
                    {formatDuration(totalDuration)}
                  </p>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-5">
          <Button type="button" variant="outline" onClick={addSet}>
            <Plus className="h-4 w-4" />
            Add Set
          </Button>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-gray-950/60 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ab5bf]">
              Song Catalogue
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Back catalogue</h3>
          
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search title, artist, lyrics..."
                className="border-white/10 bg-white/5 pl-10 text-white"
              />
            </div>
            <Button type="button" onClick={onCreateSong}>
              <Plus className="h-4 w-4" />
              Add Song
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {sets.map((set) => {
            const isActive = set.id === activeSetId;
            return (
              <button
                key={set.id}
                type="button"
                onClick={() => setActiveSetId(set.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                }`}
              >
                {set.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-white/55">
            Loading songs...
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-white/55">
            {songs.length === 0
              ? "No songs in the catalogue yet. Add one to get started."
              : "No songs matched that search."}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {filteredSongs.map((song) => {
              const songId = song._id;
              if (!songId) return null;

              return (
                <article
                  key={songId}
                  draggable
                  onDragStart={(event) =>
                    buildDragPayload(event, { type: "catalog", songId })
                  }
                  className="group flex items-center gap-3 border-b border-white/10 px-3 py-2 transition last:border-b-0 hover:bg-white/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => onSelectSong(song)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/65">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                        {song.backingTrack && (
                          <span className="shrink-0 rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">
                            BT
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-white/55">
                        {song.artist?.trim() || "Artist not set"}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-emerald-200">
                      {song.duration}
                    </div>
                  </button>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button type="button" size="sm" onClick={() => addSongToSet(songId)}>
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditSong(song)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/35">
          <Music2 className="h-4 w-4" />
          <LibraryBig className="h-4 w-4" />
          <Disc3 className="h-4 w-4" />
          <Sparkles className="h-4 w-4" />
          {filteredSongs.length} available song{filteredSongs.length === 1 ? "" : "s"} in the current draft
        </div>
      </section>

      <SetListActionsModal
        isOpen={!!selectedSavedSetList}
        onOpenChange={(open) => {
          if (!open) setSelectedSavedSetList(null);
        }}
        setlist={selectedSavedSetList}
        songsById={songsById}
        onEdit={loadSavedSetList}
        onView={(setlist) => {
          setSelectedSavedSetList(null);
          setViewerSetList(setlist);
        }}
        onDelete={(setlist) => {
          setSelectedSavedSetList(null);
          setDeleteTarget(setlist);
        }}
      />

      <SetListViewerModal
        isOpen={!!viewerSetList}
        onOpenChange={(open) => {
          if (!open) setViewerSetList(null);
        }}
        setlist={viewerSetList}
        songsById={songsById}
        onEdit={loadSavedSetList}
      />

      <DialogPrimitive.Root
        open={isSetListsModalOpen}
        onOpenChange={setIsSetListsModalOpen}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-[2px]" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[100] max-h-[88vh] w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#101c24_0%,#0a1218_100%)] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] focus:outline-none sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f0d18a]">
                  Saved Setlists
                </p>
                <DialogPrimitive.Title asChild>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Open a saved show plan
                  </h3>
                </DialogPrimitive.Title>
                <DialogPrimitive.Description asChild>
                  <p className="mt-2 text-sm text-white/65">
                    Selecting a saved setlist opens the edit, view, and delete actions.
                  </p>
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogPrimitive.Close>
            </div>

            <div className="mt-5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 inline-flex">
              {savedSetLists.length} saved setlist{savedSetLists.length === 1 ? "" : "s"}
            </div>

            {savedSetListsLoading ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-white/55">
                Loading saved setlists...
              </div>
            ) : savedSetLists.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-white/55">
                No saved setlists yet. Build one above, then save it.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savedSetLists.map((setlist) => {
                  const runtime = formatDuration(
                    setlist.sets.reduce(
                      (total, set) => total + getSetDuration(set, songsById),
                      0
                    )
                  );

                  return (
                    <button
                      key={setlist._id}
                      type="button"
                      onClick={() => {
                        setIsSetListsModalOpen(false);
                        setSelectedSavedSetList(setlist);
                      }}
                      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-[#d6af67]/45 hover:bg-white/[0.055]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-white">{setlist.title}</p>
                          <p className="mt-1 text-sm text-white/55">
                            Updated {formatSavedDate(setlist.updatedAt)}
                          </p>
                        </div>
                        {currentSetListId === setlist._id && (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                            Open
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Sets</p>
                          <p className="mt-1 text-sm font-semibold text-white">{setlist.sets.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Songs</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {totalSongsInSetList(setlist.sets)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            Runtime
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">{runtime}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title="Start a new setlist?"
        description="This will clear the current draft from the builder. Your saved setlists will remain untouched."
        confirmLabel="Start New"
        onConfirm={() => {
          resetDraft();
          setIsResetConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete setlist?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.title}" from the database.`
            : ""
        }
        confirmLabel={deleteBusy ? "Deleting..." : "Delete Setlist"}
        busy={deleteBusy}
        onConfirm={handleDeleteSavedSetList}
      />
    </div>
  );
}
