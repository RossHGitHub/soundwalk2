import type { ChangeEvent, FormEvent, ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Music2, Timer, UserRound, X } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import type { Song } from "../types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  currentSong: Song | null;
  formData: Song;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: (e: FormEvent) => void;
  onDelete: () => void;
};

function FieldShell({
  icon: Icon,
  children,
}: {
  icon: typeof Music2;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center gap-3 text-white/70">
        <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SongModal({
  isOpen,
  onOpenChange,
  saving,
  currentSong,
  formData,
  onChange,
  onSave,
  onDelete,
}: Props) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(81,183,172,0.14),_transparent_30%),linear-gradient(180deg,#101c24_0%,#0a1218_100%)] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] focus:outline-none sm:p-6"
        >
          {saving && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-[28px] bg-black/45 backdrop-blur-[1px]">
              <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90">
                Saving song...
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ab5bf]">
                Song Library
              </p>
              <DialogPrimitive.Title asChild>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {currentSong ? "Edit Song" : "Add Song"}
                </h2>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description asChild>
                <p className="mt-2 text-sm text-white/70">
                  Keep the catalogue accurate so the set totals and lyrics stay reliable.
                </p>
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <form onSubmit={onSave} className="mt-6 space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <FieldShell icon={Music2}>
                <Label htmlFor="songTitle">Title</Label>
                <Input
                  id="songTitle"
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  placeholder="Song title"
                  className="mt-2"
                />
              </FieldShell>

              <FieldShell icon={UserRound}>
                <Label htmlFor="songArtist">Artist</Label>
                <Input
                  id="songArtist"
                  name="artist"
                  value={formData.artist}
                  onChange={onChange}
                  placeholder="Artist"
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-white/50">Optional for now.</p>
              </FieldShell>

              <FieldShell icon={Timer}>
                <Label htmlFor="songDuration">Duration</Label>
                <Input
                  id="songDuration"
                  name="duration"
                  value={formData.duration}
                  onChange={onChange}
                  placeholder="3:45"
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-white/50">
                  Use `m:ss` or `h:mm:ss`.
                </p>
              </FieldShell>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="songBackingTrack"
                  name="backingTrack"
                  checked={!!formData.backingTrack}
                  onCheckedChange={(checked) =>
                    onChange({
                      target: {
                        name: "backingTrack",
                        type: "checkbox",
                        checked: !!checked,
                        value: "",
                      },
                    } as ChangeEvent<HTMLInputElement>)
                  }
                />
                <div>
                  <Label htmlFor="songBackingTrack">Backing Track</Label>
                  <p className="text-xs text-white/50">
                    Toggle if this song relies on a backing track.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <Label htmlFor="songLyrics">Lyrics</Label>
              <Textarea
                id="songLyrics"
                name="lyrics"
                value={formData.lyrics}
                onChange={onChange}
                placeholder="Lyrics, chords, or notes"
                className="mt-2 min-h-52"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {currentSong?._id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                    disabled={saving}
                  >
                    Delete Song
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <DialogPrimitive.Close asChild>
                  <Button type="button" variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </DialogPrimitive.Close>
                <Button type="submit" disabled={saving}>
                  {currentSong ? "Save Changes" : "Add Song"}
                </Button>
              </div>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
