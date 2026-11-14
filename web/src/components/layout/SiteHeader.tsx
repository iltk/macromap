import { Link, NavLink } from "react-router";
import { usePrefs } from "../../stores/prefs";
import { mealTotals, useTray } from "../../stores/tray";
import { openSheet } from "../../stores/ui";
import { Icon } from "../ui/icons";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="MacroMap home">
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <rect width="24" height="24" rx="5" fill="var(--color-accent)" />
        <path fill="var(--color-white)" d="M6 17V7h2.4l3.6 5.6L15.6 7H18v10h-2.3v-6.1L12 16.5l-3.7-5.6V17z" />
      </svg>
      <span className="hidden text-[17px] font-bold tracking-tight text-gray-900 min-[420px]:inline">MacroMap</span>
    </Link>
  );
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2.5 py-1.5 text-sm ${
    isActive ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-600 hover:text-gray-900"
  }`;

export function SiteHeader({ fullWidth = false }: { fullWidth?: boolean }) {
  const prefs = usePrefs();
  const { meal, compare } = useTray();
  const totals = mealTotals(meal);

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-gray-200 bg-white">
      <div className={`mx-auto flex h-14 items-center gap-3 px-3 sm:px-5 ${fullWidth ? "" : "max-w-5xl"}`}>
        <Logo />
        <nav className="flex items-center gap-1 sm:ml-2" aria-label="Main">
          <NavLink to="/" end className={navCls}>
            Map
          </NavLink>
          <NavLink to="/restaurants" className={navCls}>
            Restaurants
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {compare.length > 0 && (
            <button type="button" onClick={() => openSheet("compare")} className="hidden h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-gray-700 hover:bg-gray-100 sm:inline-flex">
              <Icon name="compare" className="h-4 w-4" />
              Compare {compare.length}/2
            </button>
          )}
          <button
            type="button"
            onClick={() => openSheet("meal")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Icon name="meal" className="h-4 w-4" />
            <span className="hidden sm:inline">Meal</span>
            {totals.count > 0 && (
              <span className="rounded bg-gray-900 px-1.5 text-xs font-semibold text-white tabular-nums">
                {Math.round(totals.calories)} cal
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => openSheet("prefs")}
            className={`inline-flex h-9 max-w-[16rem] items-center gap-1.5 rounded-md border px-2.5 text-sm ${
              prefs.active
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
            title={prefs.active ? prefs.summary : "Set a goal and allergens to avoid"}
          >
            <Icon name="tune" className="h-4 w-4 shrink-0" />
            <span className="hidden truncate sm:inline">{prefs.active ? prefs.summary : "Preferences"}</span>
            <span className="sr-only sm:hidden">Preferences</span>
          </button>
        </div>
      </div>
    </header>
  );
}
