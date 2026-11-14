import { useState } from "react";
import type { VenueCategory } from "../../types/venues";
import { brandColorFor, initialsFor, readableOnWhite } from "../../utils/brand";

const SIZES = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-3xl",
} as const;

/** The chain's logo image when we have one, otherwise a flat monogram tile in its brand colour. */
export function RestaurantLogo({
  name,
  brandColor,
  category,
  logoUrl,
  size = "md",
}: {
  name: string;
  brandColor: string | null;
  category: VenueCategory;
  logoUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const dims = SIZES[size];

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-md border border-gray-200 bg-white object-contain p-1.5 ${dims}`}
      />
    );
  }
  const color = brandColorFor(brandColor, category);
  const ink = readableOnWhite(color) === color ? "#ffffff" : "#2b2100";
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
