import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import type { MenuItem } from "../../types/venues";
import { MACRO_COLORS, macroSplit, needsCheck, proteinDensity } from "../../utils/macros";
import { fitsLimits, type Goal } from "../../utils/goals";
import { ItemActions } from "../tray/ItemActions";
import { AllergenPicker } from "../restaurants/AllergenPicker";
import { AllergenNotice } from "../restaurants/AllergenNotice";
import { useAvoidList } from "../../stores/allergens";
import { allergenLabel, allergenStatus } from "../../utils/allergens";
import { toTrayItem } from "../../stores/tray";
import { Icon } from "../ui/icons";

type SortKey = "menu" | "calories-asc" | "protein-desc" | "density-desc";

const SORT_LABELS: Record<SortKey, string> = {
  menu: "Menu order",
  "calories-asc": "Lowest calories",
  "protein-desc": "Most protein",
  "density-desc": "Protein per 100 kcal",
};

interface MenuTabProps {
  slug: string;
  restaurantName: string;
  menu: MenuItem[];
  focusItemId: string | null;
  goal: Goal;
}

export function MenuTab({ slug, restaurantName, menu, focusItemId, goal }: MenuTabProps) {
  const goalActive = goal.id !== "any";
  const [onlyFits, setOnlyFits] = useState(true);
  const avoid = useAvoidList();
  const [allergensOpen, setAllergensOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("menu");
  const [text, setText] = useState("");
  const maxCalories = useMemo(
    () => Math.max(0, ...menu.map((m) => m.calories ?? 0)),
    [menu],
  );
  const sliderMax = Math.ceil(maxCalories / 50) * 50;
  const [calorieCap, setCalorieCap] = useState<number | null>(null);
  const focusRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusItemId]);

  const visible = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const filtered = menu.filter(
      (m) =>
        (calorieCap === null || (m.calories ?? 0) <= calorieCap) &&
        (!needle || m.name.toLowerCase().includes(needle)) &&
        (!goalActive || !onlyFits || fitsLimits(m, goal.limits)) &&
        allergenStatus(m, avoid) === "ok",
    );
    const by = (f: (m: MenuItem) => number | null, dir: 1 | -1) =>
      [...filtered].sort((a, b) => {
        const av = f(a);
        const bv = f(b);
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av - bv) * dir;
      });
    switch (sort) {
      case "calories-asc":
        return by((m) => m.calories, 1);
      case "protein-desc":
        return by((m) => m.protein, -1);
      case "density-desc":
        return by(proteinDensity, -1);
      default:
        return filtered;
    }
  }, [menu, sort, text, calorieCap, goalActive, onlyFits, goal.limits, avoid]);
  const allergenHidden = useMemo(() => {
    const counts = { contains: 0, unknown: 0 };
    for (const m of menu) {
      const st = allergenStatus(m, avoid);
      if (st !== "ok") counts[st]++;
    }
    return counts;
  }, [menu, avoid]);
  const fitCount = useMemo(
    () => (goalActive ? menu.filter((m) => fitsLimits(m, goal.limits)).length : 0),
    [menu, goalActive, goal.limits],
  );

  if (menu.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <Icon name="restaurant" className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="font-medium text-gray-800">No nutrition data yet</p>
        <p className="mt-1 text-sm text-gray-500">
          We don't have menu macros for {restaurantName} yet.
        </p>
      </div>
    );
  }

  // group consecutive items by category when showing menu order
  const groups: { title: string | null; items: MenuItem[] }[] = [];
  if (sort === "menu") {
    for (const item of visible) {
      const title = item.menuCategory ?? "Other";
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.items.push(item);
      else groups.push({ title, items: [item] });
    }
  } else {
    groups.push({ title: null, items: visible });
  }

  return (
    <div>
      <div className="sticky top-0 z-10 space-y-3 border-b border-gray-200 bg-white py-3 pr-14 pl-6">
        <div className="flex gap-2">
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Filter menu"
            aria-label="Filter menu items"
            className="h-9 min-w-0 flex-1 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-[#1a73e8]"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort menu"
            className="h-9 rounded-full border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#1a73e8]"
          >
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-3 text-xs text-gray-600">
          <span className="w-24 shrink-0">
            Max{" "}
            <span className="font-semibold text-gray-900">
              {calorieCap === null ? "any" : `${calorieCap} kcal`}
            </span>
          </span>
          <input
            type="range"
            min={50}
            max={sliderMax}
            step={50}
            value={calorieCap ?? sliderMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCalorieCap(v >= sliderMax ? null : v);
            }}
            className="flex-1 accent-[#1a73e8]"
            aria-label="Maximum calories"
          />
        </label>
        {goalActive && (
          <label className="flex items-center gap-2 rounded-lg bg-[#e6f4ea] px-3 py-2 text-xs text-[#137333]">
            <input
              type="checkbox"
              checked={onlyFits}
              onChange={(e) => setOnlyFits(e.target.checked)}
              className="accent-[#137333]"
            />
            <span>
              Only the <span className="font-semibold">{fitCount}</span> items that fit{" "}
              <span className="font-semibold">{goal.label.toLowerCase()}</span> ({goal.rule})
            </span>
          </label>
        )}
        <div>
          <button
            type="button"
            onClick={() => setAllergensOpen((o) => !o)}
            aria-expanded={allergensOpen}
            className="flex w-full items-center justify-between text-xs text-gray-700"
          >
            <span>
              <span className="font-semibold">Allergens:</span>{" "}
              {avoid.length ? `avoiding ${avoid.map(allergenLabel).join(", ").toLowerCase()}` : "no filter"}
            </span>
            <Icon name="chevronDown" className={`h-4 w-4 transition-transform ${allergensOpen ? "rotate-180" : ""}`} />
          </button>
          {allergensOpen && (
            <div className="mt-2">
              <AllergenPicker size="sm" />
            </div>
          )}
          <AllergenNotice contains={allergenHidden.contains} unknown={allergenHidden.unknown} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <MacroLegend />
          <Link to={`/restaurants/${slug}${goalActive ? `?goal=${goal.id}` : ""}`} className="shrink-0 text-xs font-medium text-[#1a73e8] hover:underline">
            Full menu →
          </Link>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-500">No items match these filters.</p>
      ) : (
        groups.map((group) => (
          <section key={group.title ?? "all"}>
            {group.title && (
              <h4 className="px-6 pt-4 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                {group.title}
              </h4>
            )}
            <ul>
              {group.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  focused={item.id === focusItemId}
                  fits={goalActive && fitsLimits(item, goal.limits)}
                  actions={<ItemActions item={toTrayItem(item, restaurantName, slug)} compact />}
                  rowRef={item.id === focusItemId ? focusRef : undefined}
                />
              ))}
            </ul>
          </section>
        ))
      )}
      <p className="px-6 py-4 text-[11px] text-gray-400">
        Nutrition values are approximate and based on published restaurant data.
      </p>
    </div>
  );
}

function MacroLegend() {
  return (
    <div className="flex gap-4 text-[11px] text-gray-500">
      {(["protein", "carbs", "fat"] as const).map((k) => (
        <span key={k} className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: MACRO_COLORS[k] }} />
          {k[0].toUpperCase() + k.slice(1)}
        </span>
      ))}

    </div>
  );
}

function MenuItemRow({
  item,
  focused,
  fits,
  actions,
  rowRef,
}: {
  item: MenuItem;
  focused: boolean;
  fits: boolean;
  actions: React.ReactNode;
  rowRef?: React.Ref<HTMLLIElement>;
}) {
  const split = macroSplit(item);
  const density = proteinDensity(item);
  return (
    <li
      ref={rowRef}
      className={`border-b border-gray-100 px-6 py-3 ${focused ? "bg-[#e8f0fe]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {item.name}
            {fits && (
              <span className="ml-1.5 rounded bg-[#e6f4ea] px-1.5 py-0.5 align-middle text-[10px] font-semibold text-[#137333]">
                FITS GOAL
              </span>
            )}
            {needsCheck(item) && (
              <span
                title="These numbers don't add up in the source data. Treat with caution."
                className="ml-1.5 inline-flex translate-y-0.5 text-amber-500"
              >
                <Icon name="warning" className="h-4 w-4" title="Unverified values" />
              </span>
            )}
          </p>
          {item.servingSize && <p className="text-xs text-gray-500">{item.servingSize}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-900">
            {item.calories ?? "–"} <span className="text-xs font-normal text-gray-500">kcal</span>
          </p>
          {density != null && (
            <p className="text-[11px] text-gray-500">{density.toFixed(1)} g P / 100 kcal</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <Macro label="P" value={item.protein} color={MACRO_COLORS.protein} />
        <Macro label="C" value={item.carbs} color={MACRO_COLORS.carbs} />
        <Macro label="F" value={item.fat} color={MACRO_COLORS.fat} />
        <span className="ml-auto">{actions}</span>
      </div>
      {split && (
        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-gray-100">
          <span style={{ width: `${split.protein * 100}%`, background: MACRO_COLORS.protein }} />
          <span style={{ width: `${split.carbs * 100}%`, background: MACRO_COLORS.carbs }} />
          <span style={{ width: `${split.fat * 100}%`, background: MACRO_COLORS.fat }} />
        </div>
      )}
    </li>
  );
}

function Macro({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <span className="flex items-center gap-1 text-gray-700">
      <span className="font-semibold" style={{ color }}>
        {label}
      </span>
      {value ?? "–"} g
    </span>
  );
}
