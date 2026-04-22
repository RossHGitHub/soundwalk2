import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import type { MediaItem, SiteMediaSlot } from "../types";

type Props = {
  slots: SiteMediaSlot[];
  slotsLoading: boolean;
  mediaItems: MediaItem[];
  mediaLoading: boolean;
  savingKey: string | null;
  onAssign: (key: string, mediaId: string | null) => Promise<void>;
};

export default function SiteImagesSection({
  slots,
  slotsLoading,
  mediaItems,
  mediaLoading,
  savingKey,
  onAssign,
}: Props) {
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const activeSlot = useMemo(
    () => slots.find((slot) => slot.key === activeSlotKey) ?? null,
    [activeSlotKey, slots]
  );

  async function handleAssign(mediaId: string | null) {
    if (!activeSlot) return;
    await onAssign(activeSlot.key, mediaId);
    setActiveSlotKey(null);
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(81,183,172,0.12),_transparent_32%),linear-gradient(180deg,#101c24_0%,#0a1218_100%)] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9ab5bf]">
              Site Media
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Assign Gallery Images To The Site
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            {slotsLoading ? "Loading slots..." : `${slots.length} slots ready`}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {slots.map((slot) => (
          <div
            key={slot.key}
            className="overflow-hidden rounded-[26px] border border-white/10 bg-gray-950/70 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
          >
            <div className="aspect-[16/10] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_45%),linear-gradient(180deg,#111827_0%,#030712_100%)]">
              {slot.imageUrl ? (
                <img
                  src={slot.imageUrl}
                  alt={slot.media?.altText || slot.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm uppercase tracking-[0.28em] text-white/45">
                  Unassigned
                </div>
              )}
            </div>

            <div className="space-y-4 px-5 py-4 text-white">
              <div>
                <h3 className="text-lg font-semibold">{slot.label}</h3>
                <p className="mt-1 text-sm text-white/65">{slot.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                  {slot.key}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveSlotKey(slot.key)}
                  disabled={mediaLoading || savingKey === slot.key}
                >
                  {savingKey === slot.key ? "Saving..." : "Choose Image"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onAssign(slot.key, null)}
                  disabled={!slot.mediaId || savingKey === slot.key}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!activeSlot} onOpenChange={(open) => !open && setActiveSlotKey(null)}>
        <DialogContent className="max-w-5xl border-white/10 bg-gray-950 text-white">
          <DialogHeader>
            <DialogTitle>{activeSlot?.label ?? "Choose Image"}</DialogTitle>
            <DialogDescription className="text-white/60">
              Pick an image from the synced gallery for this slot.
            </DialogDescription>
          </DialogHeader>

          {mediaLoading ? (
            <div className="py-10 text-center text-white/65">Loading gallery...</div>
          ) : mediaItems.length === 0 ? (
            <div className="py-10 text-center text-white/65">
              No gallery images are available yet. Sync the bucket first.
            </div>
          ) : (
            <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
              {mediaItems.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleAssign(item._id ?? null)}
                  className="overflow-hidden rounded-[22px] min-h-[50vh] border border-white/10 bg-white/[0.04] text-left transition hover:-translate-y-1 hover:border-emerald-500/55"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-black/20">
                    <img
                      src={item.assetUrl}
                      alt={item.altText || item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
