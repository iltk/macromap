/** Shared class strings so every control looks the same across pages. */
export const ui = {
  btnPrimary:
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50",
  btn: "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50",
  btnSmall:
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-800 hover:bg-gray-50",
  /** The row-level "do it" action in lists: clear but not as loud as the one filled button per view. */
  btnAccentSmall:
    "inline-flex h-7 items-center justify-center gap-1 rounded-md border border-accent/60 bg-white px-2.5 text-xs font-semibold text-accent-ink hover:bg-accent-soft",
  link: "font-medium text-link hover:underline",
  /** Hero figure: one per screen, proportional digits (tabular only belongs in aligned columns). */
  hero: "text-4xl font-bold tracking-tight text-gray-900",
  input:
    "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-accent",
  select:
    "h-9 rounded-md border border-gray-300 bg-white pr-7 pl-2.5 text-sm text-gray-900 outline-none focus:border-accent",
  label: "text-sm font-semibold text-gray-900",
  hint: "text-xs text-gray-500",
};
