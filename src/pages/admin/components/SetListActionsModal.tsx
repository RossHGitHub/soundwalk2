import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Eye, ListMusic, PencilLine, Trash2, X } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { formatDuration, parseDurationToSeconds } from "../songs";
import type { SavedSetList, Song } from "../types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  setlist: SavedSetList | null;
  songsById: Map<string, Song>;
  onEdit: (setlist: SavedSetList) => void;
  onView: (setlist: SavedSetList) => void;
  onDelete: (setlist: SavedSetList) => void;
};

function getStats(setlist: SavedSetList, songsById: Map<string, Song>) {
  const songCount = setlist.sets.reduce((total, set) => total + set.entries.length, 0);
  const duration = setlist.sets.reduce(
    (total, set) =>
      total +
      set.entries.reduce((setTotal, entry) => {
        return setTotal + parseDurationToSeconds(songsById.get(entry.songId)?.duration);
      }, 0),
    0
  );

  return {
    songCount,
    duration: formatDuration(duration),
  };
}

export default function SetListActionsModal({
  isOpen,
  onOpenChange,
  setlist,
  songsById,
  onEdit,
  onView,
  onDelete,
}: Props) {
  if (!setlist) return null;

  const stats = getStats(setlist, songsById);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#101c24_0%,#0a1218_100%)] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] focus:outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ab5bf]">
                Saved Setlist
              </p>
              <DialogPrimitive.Title asChild>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {setlist.title}
                </h2>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Choose an action for this saved setlist.
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Sets
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{setlist.sets.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Songs
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{stats.songCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Duration
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{stats.duration}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onView(setlist)}
              className="justify-start"
            >
              <Eye className="h-4 w-4" />
              View Setlist
            </Button>
            <Button type="button" onClick={() => onEdit(setlist)} className="justify-start">
              <PencilLine className="h-4 w-4" />
              Edit In Builder
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onDelete(setlist)}
              className="justify-start text-red-300 hover:text-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete Setlist
            </Button>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#d6af67]">
                <ListMusic className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Preview
                </p>
                <p className="text-sm text-white/70">
                  {setlist.sets
                    .map((set) => `${set.name} (${set.entries.length})`)
                    .join(" • ")}
                </p>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
