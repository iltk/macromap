/** Explains how many items the allergen filter hid, and why. */
export function AllergenNotice({ contains, unknown }: { contains: number; unknown: number }) {
  if (contains === 0 && unknown === 0) return null;
  return (
    <p className="rounded-md bg-warn-soft px-3 py-2 text-xs text-warn-ink">
      {contains > 0 && <>{contains} hidden because they contain an allergen you avoid. </>}
      {unknown > 0 && <>{unknown} hidden because there's no allergen info for them yet.</>}
    </p>
  );
}
