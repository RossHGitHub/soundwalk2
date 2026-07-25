import { DateTime } from "luxon";
import type { Gig } from "./types";

const POSTER_TEMPLATE_URL = "/api/poster-template";

type DrawTextOptions = {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  maxHeight: number;
  maxFontSize: number;
  minFontSize: number;
  lineHeight: number;
  weight: number;
  fillStyle: string;
};

function formatPosterDate(dateISO?: string) {
  if (!dateISO) return "DATE TBC";
  const parsed = DateTime.fromISO(dateISO, { zone: "Europe/London" });
  if (!parsed.isValid) return "DATE TBC";
  return parsed.setLocale("en-GB").toFormat("cccc d LLLL yyyy").toUpperCase();
}

function formatPosterTime(time?: string) {
  if (!time) return "START TIME TBC";
  const parsed = DateTime.fromFormat(time, "HH:mm", { zone: "Europe/London" });
  if (!parsed.isValid) return "START TIME TBC";
  return `START ${parsed.toFormat("HH:mm")}`;
}

function getSafeFileName(value: string, fallback: string) {
  const safe = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || fallback;
}

async function getTemplateBlob() {
  const response = await fetch(POSTER_TEMPLATE_URL);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : `Poster template request failed (${response.status})`;
    throw new Error(message);
  }
  return response.blob();
}

function loadImageFromBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Poster template image could not be loaded."));
    };

    image.src = objectUrl;
  });
}

function getFont(weight: number, size: number) {
  return `${weight} ${size}px Inter, Arial, Helvetica, sans-serif`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawFittedText(ctx: CanvasRenderingContext2D, options: DrawTextOptions) {
  let fontSize = options.maxFontSize;
  let lines: string[] = [];
  let blockHeight = 0;
  let widestLine = 0;

  while (fontSize >= options.minFontSize) {
    ctx.font = getFont(options.weight, fontSize);
    lines = wrapText(ctx, options.text, options.maxWidth);
    blockHeight = lines.length * fontSize * options.lineHeight;
    widestLine = Math.max(...lines.map((line) => ctx.measureText(line).width), 0);

    if (blockHeight <= options.maxHeight && widestLine <= options.maxWidth) {
      break;
    }

    fontSize -= 2;
  }

  if (fontSize < options.minFontSize) {
    fontSize = options.minFontSize;
    ctx.font = getFont(options.weight, fontSize);
    lines = wrapText(ctx, options.text, options.maxWidth);
    blockHeight = lines.length * fontSize * options.lineHeight;
  }

  ctx.font = getFont(options.weight, fontSize);
  ctx.fillStyle = options.fillStyle;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    ctx.fillText(line, options.x, options.y + index * fontSize * options.lineHeight);
  });

  return options.y + blockHeight;
}

function drawPosterText(ctx: CanvasRenderingContext2D, gig: Gig) {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const maxWidth = width * 0.82;
  const lowerTop = height * 0.62;
  const lowerBottom = height * 0.95;
  const availableHeight = lowerBottom - lowerTop;
  const venue = (gig.venue || "VENUE TBC").toUpperCase();
  const date = formatPosterDate(gig.date);
  const time = formatPosterTime(gig.startTime);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.82)";
  ctx.shadowBlur = Math.max(14, width * 0.018);
  ctx.shadowOffsetY = Math.max(4, height * 0.006);

  const venueBottom = drawFittedText(ctx, {
    text: venue,
    x: centerX,
    y: lowerTop,
    maxWidth,
    maxHeight: availableHeight * 0.42,
    maxFontSize: width * 0.078,
    minFontSize: width * 0.038,
    lineHeight: 1.08,
    weight: 800,
    fillStyle: "#fff7eb",
  });

  const ruleY = venueBottom + height * 0.025;
  ctx.strokeStyle = "#d6af67";
  ctx.lineWidth = Math.max(3, width * 0.004);
  ctx.beginPath();
  ctx.moveTo(centerX - maxWidth * 0.18, ruleY);
  ctx.lineTo(centerX + maxWidth * 0.18, ruleY);
  ctx.stroke();

  const dateBottom = drawFittedText(ctx, {
    text: date,
    x: centerX,
    y: ruleY + height * 0.04,
    maxWidth,
    maxHeight: availableHeight * 0.2,
    maxFontSize: width * 0.04,
    minFontSize: width * 0.024,
    lineHeight: 1.1,
    weight: 700,
    fillStyle: "#f2eee7",
  });

  drawFittedText(ctx, {
    text: time,
    x: centerX,
    y: dateBottom + height * 0.018,
    maxWidth,
    maxHeight: availableHeight * 0.16,
    maxFontSize: width * 0.035,
    minFontSize: width * 0.022,
    lineHeight: 1.1,
    weight: 700,
    fillStyle: "#d9f7f2",
  });

  ctx.restore();
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Poster image could not be exported."));
      }
    }, "image/png");
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function generateGigPoster(gig: Gig) {
  const templateBlob = await getTemplateBlob();
  const templateImage = await loadImageFromBlob(templateBlob);
  const canvas = document.createElement("canvas");
  canvas.width = templateImage.naturalWidth || templateImage.width;
  canvas.height = templateImage.naturalHeight || templateImage.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Poster canvas could not be created.");
  }

  ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
  drawPosterText(ctx, gig);

  const posterBlob = await canvasToBlob(canvas);
  const filename = `soundwalk-${getSafeFileName(gig.venue, "gig")}-${getSafeFileName(
    gig.date,
    "date"
  )}-poster.png`;

  downloadBlob(posterBlob, filename);
}
