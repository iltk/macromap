import type { VenueCategory } from "../../types/venues";
import { brandColorFor, initialsFor, readableOnWhite } from "../../utils/brand";

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
  const color = brandColorFor(brandColor, category);
  const initials = initialsFor(name);
  const dims =
    size === "lg" ? "h-20 w-20 rounded-2xl text-2xl" : "h-14 w-14 rounded-xl text-base";
  return (
    <span
      aria-hidden
      // light theme: readable ink for pale brands (e.g. gold); dark theme: the brand colour itself
      className={`flex shrink-0 items-center justify-center font-bold tracking-tight text-(--logo-ink) dark:text-(--logo-color) ${dims}`}
      style={
        {
          "--logo-color": color,
          "--logo-ink": readableOnWhite(color),
          background: `${color}1f`,
          boxShadow: `inset 0 0 0 1px ${color}55`,
        } as React.CSSProperties
      }
    >
      {initials}
    </span>
  );
}
