import { CATEGORY_COLORS } from "../constants/categories";
import type { VenueCategory } from "../types/venues";

/** "A&W" -> "A&W", "Tim Hortons" -> "TH", "McDonald's" -> "M". */
export function initialsFor(name: string): string {
  return (
    name
      .replace(/[^A-Za-z&' ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w.includes("&") ? w : w[0]))
      .join("")
      .slice(0, 3)
      .toUpperCase() || "?"
  );
}

export const brandColorFor = (brandColor: string | null | undefined, category: VenueCategory) =>
  brandColor ?? CATEGORY_COLORS[category] ?? "#5f6368";

/** Relative luminance (0..1) of a #rrggbb colour. */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** A readable version of the brand colour for text on white (light brands get a dark ink). */
export const readableOnWhite = (color: string) => (luminance(color) > 0.45 ? "#3c2f00" : color);
