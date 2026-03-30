import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FileMusic, Music2, Pencil, Timer, UserRound, X } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { formatDuration, parseDurationToSeconds } from "../songs";
import type { Song } from "../types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  onEdit: (song: Song) => void;
};

function DetailBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Music2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#86ddd2]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {label}
          </p>
          <p className="text-sm font-medium text-white/90">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function SongDetailsModal({
  isOpen,
  onOpenChange,
  song,
  onEdit,
}: Props) {
  if (!song) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(81,183,172,0.14),_transparent_30%),linear-gradient(180deg,#101c24_0%,#0a1218_100%)] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] focus:outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ab5bf]">
                Song Details
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {song.title || "Untitled Song"}
                </h2>
                {song.backingTrack && (
                  <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-300">
                    BT
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/70">
                Stored in the live song catalogue for the set list builder.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => onEdit(song)}
                className="rounded-xl bg-[#d6af67] text-[#151711] hover:bg-[#e3bc74]"
              >
                <Pencil className="h-4 w-4" />
                Edit Song
              </Button>
              <DialogPrimitive.Close
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailBlock icon={Music2} label="Title" value={song.title || "Not set"} />
            <DetailBlock
              icon={UserRound}
              label="Artist"
              value={song.artist || "Not set"}
            />
            <DetailBlock
              icon={Timer}
              label="Duration"
              value={
                parseDurationToSeconds(song.duration) > 0
                  ? `${song.duration} (${formatDuration(parseDurationToSeconds(song.duration))})`
                  : song.duration || "Not set"
              }
            />
          </div>

          <section className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#d6af67]">
                <FileMusic className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Lyrics
                </p>
                <p className="text-sm font-medium text-white/90">
                  Full stored notes for this song
                </p>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/85">
              {song.lyrics?.trim() || "No lyrics saved for this song."}
            </p>
          </section>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
