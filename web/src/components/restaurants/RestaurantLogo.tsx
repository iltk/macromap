import { CATEGORY_COLORS } from "../../constants/categories";
import type { VenueCategory } from "../../types/venues";

/** Monogram tile in the chain's brand colour (we don't ship third-party logos). */
export function RestaurantLogo({
  name,
  brandColor,
  category,
  size = "md",
}: {
  name: string;
  brandColor: string | null;
  category: VenueCategory;
  size?: "md" | "lg";
}) {
  const color = brandColor ?? CATEGORY_COLORS[category] ?? "#5f6368";
  const initials =
    name
      .replace(/[^A-Za-z&' ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w.includes("&") ? w : w[0]))
      .join("")
      .slice(0, 3)
      .toUpperCase() || "?";
  const dims =
    size === "lg" ? "h-20 w-20 rounded-2xl text-2xl" : "h-14 w-14 rounded-xl text-base";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center font-bold tracking-tight ${dims}`}
      style={{ background: `${color}14`, color, boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      {initials}
    </span>
  );
}
