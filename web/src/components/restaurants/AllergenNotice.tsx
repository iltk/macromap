/** Explains how many items were hidden by the allergen filter, and why. */
export function AllergenNotice({ contains, unknown }: { contains: number; unknown: number }) {
  if (contains === 0 && unknown === 0) return null;
  return (
    <p className="mt-3 rounded-lg border border-[#f9ab00]/40 bg-warn-soft px-3 py-2 text-xs text-warn-ink">
      {contains > 0 && (
        <>
          <span className="font-semibold">{contains}</span> hidden because they contain an allergen you avoid.{" "}
        </>
      )}
      {unknown > 0 && (
        <>
          <span className="font-semibold">{unknown}</span> hidden because we don't have allergen info for them yet.
        </>
      )}
    </p>
  );
}
