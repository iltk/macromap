import type { FoodKind } from "../../utils/foodKind";

// Simple line drawings (24×24, stroke-only) so placeholders say what the food is.
const DRAWINGS: Record<FoodKind, React.ReactNode> = {
  burger: (
    <>
      <path d="M4 10c0-3.3 3.6-6 8-6s8 2.7 8 6H4z" />
      <path d="M3.5 13.5h17" />
      <path d="M4 16.5h16" />
      <path d="M5 16.5v1a2.5 2.5 0 0 0 2.5 2.5h9a2.5 2.5 0 0 0 2.5-2.5v-1" />
      <path d="M9 7h.01M12 6.2h.01M15 7h.01" />
    </>
  ),
  breakfast: (
    <>
      <path d="M12 3c-3.5 0-7 4.6-7 9.5C5 16.6 8.1 20 12 20s7-3.4 7-7.5C19 7.6 15.5 3 12 3z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  fries: (
    <>
      <path d="M6 10l1.5 10h9L18 10" />
      <path d="M6 10c2 1.4 10 1.4 12 0" />
      <path d="M8.5 10V4M11 10.5V3M13.5 10.5V4M16 10V5" />
    </>
  ),
  chicken: (
    <>
      <path d="M14.5 4.5a5 5 0 0 1 0 7.1l-4.2 4.2-2.1-2.1 4.2-4.2a5 5 0 0 1 2.1-5z" />
      <path d="M8.2 13.7 5.6 16.3a1.7 1.7 0 1 0 2.1 2.1l2.6-2.6" />
    </>
  ),
  wrap: (
    <>
      <path d="M5 17 17 5a3 3 0 0 1 2 5L9 20a3 3 0 0 1-4-3z" />
      <path d="M7.5 14.5 14.5 7.5M10 17l7-7" />
    </>
  ),
  salad: (
    <>
      <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M8 12c0-2.5 1.5-4.5 3.5-5M12 12c.3-2.7 2-4.6 4.5-5M15.5 12c.6-1.6 1.7-2.6 3-3" />
    </>
  ),
  pizza: (
    <>
      <path d="M12 21 3.5 5.5C8.6 2.8 15.4 2.8 20.5 5.5L12 21z" />
      <path d="M5 8.2c4.3-2 9.7-2 14 0" />
      <circle cx="10" cy="10.5" r="1" />
      <circle cx="14" cy="13" r="1" />
    </>
  ),
  taco: (
    <>
      <path d="M3 17a9 9 0 0 1 18 0H3z" />
      <path d="M6 13c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0" />
    </>
  ),
  sushi: (
    <>
      <ellipse cx="12" cy="9" rx="7" ry="3" />
      <path d="M5 9v6c0 1.7 3.1 3 7 3s7-1.3 7-3V9" />
      <ellipse cx="12" cy="9" rx="3" ry="1.2" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z" />
      <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8.5 3.5c-.8 1 .8 2 0 3M11.5 3.5c-.8 1 .8 2 0 3" />
    </>
  ),
  drink: (
    <>
      <path d="M6.5 7h11l-1.3 13H7.8L6.5 7z" />
      <path d="M12 7l2-4h3" />
      <path d="M7 11.5h10" />
    </>
  ),
  dessert: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M8 7.5l.5.8M15.5 7.8l-.6.7M16.5 14l-.9-.3M9 16.3l.6-.7" />
    </>
  ),
  soup: (
    <>
      <path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M9 4c-.8 1.2.8 2.3 0 3.5M12.5 4c-.8 1.2.8 2.3 0 3.5" />
    </>
  ),
  plate: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
};

export function FoodGlyph({ kind, className = "" }: { kind: FoodKind; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {DRAWINGS[kind]}
    </svg>
  );
}
