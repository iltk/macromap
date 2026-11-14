import { usePrefs } from "../../stores/prefs";
import { openSheet } from "../../stores/ui";
import { MENU_SORTS, type MenuQuery, type MenuSort } from "../../utils/menuQuery";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";

/** Search, section, sort and "fits my preferences": the same controls on the map panel and the menu page. */
export function MenuToolbar({
  query,
  onChange,
  sections,
  total,
  shown,
  fitCount,
  placeholder,
  layout = "stack",
}: {
  query: MenuQuery;
  onChange: (q: MenuQuery) => void;
  sections: [string, number][];
  total: number;
  shown: number;
  fitCount: number;
  placeholder: string;
  layout?: "stack" | "row";
}) {
  const prefs = usePrefs();
  const set = (patch: Partial<MenuQuery>) => onChange({ ...query, ...patch });
  // in the narrow map panel the two menus share the width; on the page they size to content
  const selectSize = layout === "row" ? "min-w-0 flex-1 sm:flex-none" : "min-w-0 flex-1";

  return (
    <div className="space-y-2.5">
      <div className={layout === "row" ? "flex flex-col gap-2 sm:flex-row" : "space-y-2.5"}>
      <div className="relative flex-1">
        <Icon name="search" className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={query.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${ui.input} pl-8`}
        />
      </div>
      <div className="flex gap-2">
        <select value={query.section} onChange={(e) => set({ section: e.target.value })} aria-label="Menu section" className={`${ui.select} ${selectSize}`}>
          <option value="all">All sections ({total})</option>
          {sections.map(([s, n]) => (
            <option key={s} value={s}>
              {s} ({n})
            </option>
          ))}
        </select>
        <select value={query.sort} onChange={(e) => set({ sort: e.target.value as MenuSort })} aria-label="Sort" className={`${ui.select} ${selectSize}`}>
          {Object.entries(MENU_SORTS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      </div>

      {prefs.goalActive ? (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={query.onlyFits}
            onChange={(e) => set({ onlyFits: e.target.checked })}
            className="mt-0.5 accent-(--color-accent)"
          />
          <span>
            Only items that fit <span className="font-medium text-gray-900">{prefs.goalName?.toLowerCase()}</span> ({fitCount}
            ){" · "}
            <button type="button" onClick={() => openSheet("prefs")} className={ui.link}>
              change
            </button>
          </span>
        </label>
      ) : (
        <p className="text-sm text-gray-500">
          {shown} of {total} items ·{" "}
          <button type="button" onClick={() => openSheet("prefs")} className={ui.link}>
            set a goal
          </button>{" "}
          to see what fits
        </p>
      )}
    </div>
  );
}
