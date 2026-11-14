import type { VenueCategory } from "../../types/venues";
import { brandColorFor, initialsFor, readableOnWhite } from "../../utils/brand";

/** Flat monogram tile in the chain's brand colour (no third-party logos are shipped). */
export function RestaurantLogo({
  name,
  brandColor,
  category,
  size = "md",
}: {
  name: string;
  brandColor: string | null;
  category: VenueCategory;
  size?: "sm" | "md" | "lg";
}) {
  const color = brandColorFor(brandColor, category);
  // pale brands (e.g. gold) get dark lettering, everything else white
  const ink = readableOnWhite(color) === color ? "#ffffff" : "#2b2100";
  const dims = { sm: "h-9 w-9 text-[11px]", md: "h-11 w-11 text-xs", lg: "h-16 w-16 text-lg" }[size];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-md font-bold tracking-tight ${dims}`}
      style={{ background: color, color: ink }}
    >
      {initialsFor(name)}
    </span>
  );
}
