import { useState } from "react";
import { foodKind } from "../../utils/foodKind";
import { FoodGlyph } from "./FoodGlyph";

// Soft, warm tints so a menu full of placeholders still has some rhythm (keyed by food kind).
const TINTS = ["#efe6d6", "#e4eadf", "#ede2dd", "#e1e7eb", "#ebe6d2", "#e6e1ea"];

function tintFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

/**
 * A menu item photo, shown whole ("contain") so cut-out product shots sit centred on white.
 * Falls back to a placeholder when there's no image yet or it fails to load:
 * - "card": a tinted plate in the middle of a white photo area
 * - "thumb": a small tinted square
 * The parent sets the size.
 */
export function FoodImage({
  src,
  alt,
  tintKey,
  variant,
  section,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  /** e.g. the menu section, so items in one section share a tint */
  tintKey: string;
  variant: "card" | "thumb";
  /** menu section, to help pick the placeholder drawing */
  section?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const kind = foodKind(alt, section);
  const tint = tintFor(kind + tintKey);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`bg-white object-contain ${variant === "card" ? "p-4" : "p-1"} ${className}`}
      />
    );
  }

  if (variant === "thumb") {
    return (
      <div role="img" aria-label={`${alt} (photo coming soon)`} className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: tint }}>
        <span className="absolute inset-0 hidden bg-gray-100/70 dark:block" />
        <FoodGlyph kind={kind} className="relative h-[60%] w-[60%] text-black/45 dark:text-white/50" />
      </div>
    );
  }

  return (
    <div role="img" aria-label={`${alt} (photo coming soon)`} className={`flex items-center justify-center bg-white ${className}`}>
      <div className="relative flex aspect-square w-[42%] items-center justify-center overflow-hidden rounded-full" style={{ background: tint }}>
        <span className="absolute inset-0 hidden bg-gray-100/70 dark:block" />
        <FoodGlyph kind={kind} className="relative h-1/2 w-1/2 text-black/40 dark:text-white/45" />
      </div>
    </div>
  );
}
