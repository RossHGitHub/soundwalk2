import { jsPDF } from "jspdf";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Download, Sparkles, Star, X } from "lucide-react";

import { Button } from "../../../components/ui/button";
import logoUrl from "../../../assets/img/logo.jpg";
import { formatDuration, parseDurationToSeconds } from "../songs";
import type { SavedSetList, Song } from "../types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  setlist: SavedSetList | null;
  songsById: Map<string, Song>;
  onEdit: (setlist: SavedSetList) => void;
};

function getSetDuration(entries: SavedSetList["sets"][number]["entries"], songsById: Map<string, Song>) {
  return entries.reduce((total, entry) => {
    return total + parseDurationToSeconds(songsById.get(entry.songId)?.duration);
  }, 0);
}

async function loadImageData(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

export default function SetListViewerModal({
  isOpen,
  onOpenChange,
  setlist,
  songsById,
  onEdit,
}: Props) {
  if (!setlist) return null;
  const currentSetList = setlist;

  const grandTotal = currentSetList.sets.reduce(
    (total, set) => total + getSetDuration(set.entries, songsById),
    0
  );

  async function handleDownloadPdf() {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 42;
      const logoData = await loadImageData(logoUrl);
      const logoWidth = 140;
      const logoHeight = 32;

      currentSetList.sets.forEach((set, setIndex) => {
        if (setIndex > 0) {
          doc.addPage("a4", "portrait");
        }

        doc.addImage(
          logoData,
          "JPEG",
          pageWidth - margin - logoWidth,
          margin - 4,
          logoWidth,
          logoHeight
        );

        doc.setDrawColor(220);
        doc.line(margin, margin + 48, pageWidth - margin, margin + 48);

        const title = `${currentSetList.title} - ${set.name}`;
        const lines = set.entries.map((entry) => {
          const song = songsById.get(entry.songId);
          const titleText = (song?.title || "Unknown song").toUpperCase();
          const lineText = song?.backingTrack ? `${titleText} (BT)` : titleText;
          return lineText;
        });

        const topY = margin + 78;
        const bottomMargin = 34;
        const availableHeight = pageHeight - topY - bottomMargin;
        const maxWidth = pageWidth - margin * 2;
        const rowCount = Math.max(lines.length, 1);

        let fontSize = Math.min(30, Math.floor(availableHeight / rowCount) - 6);
        fontSize = Math.max(fontSize, 18);
        doc.setFont("helvetica", "bold");

        while (fontSize > 18) {
          doc.setFontSize(fontSize);
          const widestLine = Math.max(
            ...lines.map((line, index) => doc.getTextWidth(`${index + 1}. ${line}`)),
            0
          );
          const totalHeight = rowCount * (fontSize + 10);
          if (widestLine <= maxWidth && totalHeight <= availableHeight) {
            break;
          }
          fontSize -= 1;
        }

        const rowHeight = fontSize + 10;

        doc.setFontSize(22);
        doc.text(title, margin, margin + 18);

        doc.setFontSize(fontSize);
        lines.forEach((line, index) => {
          const y = topY + index * rowHeight;
          doc.text(`${index + 1}. ${line}`, margin, y);
        });
      });

      const safeFileName = `${currentSetList.title}`
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      doc.save(`${safeFileName || "setlist"}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Failed to generate the setlist PDF.");
    }
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-[3px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[100] max-h-[92vh] w-[94vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[32px] border border-[#8d6a30]/35 bg-[radial-gradient(circle_at_top,_rgba(244,190,92,0.14),transparent_28%),radial-gradient(circle_at_bottom,_rgba(81,183,172,0.18),transparent_26%),linear-gradient(180deg,#120f16_0%,#090d12_100%)] p-5 text-white shadow-[0_40px_120px_rgba(0,0,0,0.55)] focus:outline-none sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8d6a30]/40 bg-[#2a1d11]/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#f0d18a]">
                <Sparkles className="h-3.5 w-3.5" />
                Setlist Viewer
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {currentSetList.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                The polished running order. Fixed, readable, and ready for the night.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPdf}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                type="button"
                onClick={() => onEdit(currentSetList)}
                className="rounded-xl bg-[#d6af67] text-[#151711] hover:bg-[#e3bc74]"
              >
                Edit In Builder
              </Button>
              <DialogPrimitive.Close
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[#8d6a30]/25 bg-[linear-gradient(180deg,rgba(38,24,13,0.92)_0%,rgba(12,16,22,0.92)_100%)] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-[#f0d18a]">
                <Star className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Show Order
                </span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                Total Runtime: <span className="font-semibold text-white">{formatDuration(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {currentSetList.sets.map((set) => {
                const setTotal = getSetDuration(set.entries, songsById);

                return (
                  <section
                    key={set.id}
                    className="rounded-[26px] border border-white/10 bg-black/15 p-4"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ab5bf]">
                          {set.name}
                        </p>
                        <p className="mt-1 text-sm text-white/65">
                          {set.entries.length} song{set.entries.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="rounded-full border border-[#8d6a30]/35 bg-[#2a1d11]/55 px-3 py-1 text-sm text-[#f0d18a]">
                        {formatDuration(setTotal)}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {set.entries.map((entry, index) => {
                        const song = songsById.get(entry.songId);

                        return (
                          <div
                            key={entry.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <p className="text-sm font-semibold text-white">
                                    {index + 1}. {song?.title || "Unknown song"}
                                  </p>
                                  {song?.backingTrack && (
                                    <span className="shrink-0 rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">
                                      BT
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-sm text-white/55">
                                  {song?.artist?.trim() || "Artist not set"}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                                {song?.duration || "--:--"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
