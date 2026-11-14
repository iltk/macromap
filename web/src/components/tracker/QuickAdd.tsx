import { useMemo, useState } from "react";
import { notify } from "../../stores/notify";
import { createCustomFood, logItem, removeCustomFood, slotForTime, toggleFavorite, useTracker, CUSTOM_SLUG } from "../../stores/tracker";
import type { TrayItem } from "../../stores/tray";
import { recentItems } from "../../utils/history";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";

type Tab = "recent" | "favorites" | "mine";

/** Re-log recent or starred items, and add foods that aren't on any menu. */
export function QuickAdd({ date }: { date: string }) {
  const { days, favorites, customFoods } = useTracker();
  const [tab, setTab] = useState<Tab>("recent");
  const [form, setForm] = useState(false);
  const recents = useMemo(() => recentItems(days), [days]);
  const list = tab === "recent" ? recents : tab === "favorites" ? favorites : customFoods;
  const isFav = (id: string) => favorites.some((f) => f.id === id);
  const log = (item: TrayItem) => {
    logItem(item, { date, slot: slotForTime() });
    notify(`Logged ${item.name}`);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Quick add</h2>
        <button type="button" onClick={() => setForm(!form)} className={`text-sm ${ui.link}`}>
          {form ? "Cancel" : "+ Custom food"}
        </button>
      </header>
      {form ? (
        <CustomFoodForm onDone={(item) => { log(item); setForm(false); }} />
      ) : (
        <>
          <div className="flex gap-4 border-b border-gray-100 px-4" role="tablist">
            {(
              [
                ["recent", "Recent"],
                ["favorites", "Starred"],
                ["mine", "My foods"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 py-2 text-sm ${tab === k ? "border-gray-900 font-semibold text-gray-900" : "border-transparent text-gray-600"}`}>
                {label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-500">
              {tab === "recent" ? "Items you log show up here." : tab === "favorites" ? "Star items to keep them here." : "Foods you add by hand show up here."}
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              {list.map((item) => (
                <li key={item.id} className="flex items-center gap-2 px-4 py-2">
                  <button type="button" onClick={() => toggleFavorite(item)} aria-pressed={isFav(item.id)} aria-label={isFav(item.id) ? `Unstar ${item.name}` : `Star ${item.name}`} className={isFav(item.id) ? "text-accent-ink" : "text-gray-400 hover:text-gray-700"}>
                    <Icon name={isFav(item.id) ? "bookmark" : "bookmarkBorder"} className="h-4 w-4" />
                  </button>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate text-gray-900">{item.name}</span>
                    <span className="block text-xs text-gray-500 tabular-nums">
                      {item.restaurantName} · {item.calories ?? "–"} cal · {item.protein ?? "–"} g protein
                    </span>
                  </span>
                  {tab === "mine" && item.restaurantSlug === CUSTOM_SLUG && (
                    <button type="button" onClick={() => removeCustomFood(item.id)} aria-label={`Delete ${item.name}`} className="p-1 text-gray-400 hover:text-gray-900">
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => log(item)} className={`${ui.btnSmall} h-7`}>
                    Log
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function CustomFoodForm({ onDone }: { onDone: (item: TrayItem) => void }) {
  const [f, setF] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [save, setSave] = useState(true);
  const n = (v: string) => Math.max(0, Number(v) || 0);
  const valid = f.name.trim() && n(f.calories) > 0;
  const field = (k: keyof typeof f, label: string, type = "number") => (
    <label className="block text-xs text-gray-600">
      {label}
      <input type={type} min={0} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`mt-1 ${ui.input}`} />
    </label>
  );
  return (
    <form
      className="space-y-3 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onDone(createCustomFood({ name: f.name, calories: n(f.calories), protein: n(f.protein), carbs: n(f.carbs), fat: n(f.fat) }, save));
      }}
    >
      {field("name", "Name", "text")}
      <div className="grid grid-cols-2 gap-2">
        {field("calories", "Calories")}
        {field("protein", "Protein (g)")}
        {field("carbs", "Carbs (g)")}
        {field("fat", "Fat (g)")}
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="accent-(--color-accent)" />
        Save to My foods
      </label>
      <button type="submit" disabled={!valid} className={ui.btnPrimary}>
        Log it
      </button>
    </form>
  );
}
