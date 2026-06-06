import { jsPDF } from "jspdf";

import { normalizeSingers } from "./songs";
import type { SavedSetList, Singer, Song } from "./types";

export type LyricPrintOption = Singer | "All";
export type LyricPrintSelection = LyricPrintOption | "";

export const LYRIC_PRINT_OPTIONS: LyricPrintOption[] = ["Ross", "Keith", "Barry", "All"];

export function getSafeFileName(value: string, fallback: string) {
  return (
    value
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || fallback
  );
}

export function getLyricsForSelection(
  setlist: SavedSetList,
  songsById: Map<string, Song>,
  selection: LyricPrintOption
) {
  let position = 0;

  return setlist.sets.flatMap((set) =>
    set.entries.flatMap((entry) => {
      const song = songsById.get(entry.songId);
      if (!song) return [];

      position += 1;
      const singers = normalizeSingers(song.singers);
      if (selection !== "All" && !singers.includes(selection)) return [];

      return [
        {
          song,
          setName: set.name,
          position,
        },
      ];
    })
  );
}

function splitLyricsToLines(doc: jsPDF, text: string, maxWidth: number) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .flatMap((line) => {
      if (!line.trim()) return [""];
      return doc.splitTextToSize(line.trimEnd(), maxWidth) as string[];
    });
}

function getFittedFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number
) {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    doc.setFontSize(fontSize);
    if (doc.getTextWidth(text) <= maxWidth) return fontSize;
  }

  return minFontSize;
}

export function downloadLyricsPdf(
  setlist: SavedSetList,
  songsById: Map<string, Song>,
  selection: LyricPrintOption
) {
  const lyricSongs = getLyricsForSelection(setlist, songsById, selection);
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const headerBottom = margin + 72;
  const topY = headerBottom + 24;
  const bottomMargin = 34;
  const maxWidth = pageWidth - margin * 2;
  const lyricFontSize = 22;
  const lyricLineHeight = lyricFontSize * 1.24;

  function drawHeader(titleText: string, subtitle: string, continued: boolean) {
    doc.setTextColor(28, 30, 32);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(getFittedFontSize(doc, titleText, maxWidth, 36, 18));
    doc.text(titleText, pageWidth - margin, margin + 34, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(continued ? `${subtitle} - continued` : subtitle, margin, margin + 62, {
      maxWidth,
    });

    doc.setDrawColor(205, 205, 205);
    doc.line(margin, headerBottom, pageWidth - margin, headerBottom);

    doc.setTextColor(18, 18, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(lyricFontSize);

    return topY;
  }

  lyricSongs.forEach(({ song, setName, position }, index) => {
    if (index > 0) {
      doc.addPage("a4", "portrait");
    }

    const songTitle = song.title?.trim() || "Untitled Song";
    const titleText = songTitle.toUpperCase();
    const artistText = song.artist?.trim() ? ` - ${song.artist.trim()}` : "";
    const subtitle = `${setlist.title} - ${setName} - ${position}${artistText}`;
    const lyrics = song.lyrics?.trim() || "No lyrics saved for this song.";
    let y = drawHeader(titleText, subtitle, false);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(lyricFontSize);
    const lyricLines = splitLyricsToLines(doc, lyrics, maxWidth);

    lyricLines.forEach((line) => {
      if (y + lyricLineHeight > pageHeight - bottomMargin) {
        doc.addPage("a4", "portrait");
        y = drawHeader(titleText, subtitle, true);
      }

      if (line) {
        doc.text(line, margin, y);
      }
      y += lyricLineHeight;
    });
  });

  const safeFileName = getSafeFileName(setlist.title, "setlist");
  const singerToken = selection.toLowerCase();
  doc.save(`${safeFileName}-lyrics-${singerToken}.pdf`);
}
