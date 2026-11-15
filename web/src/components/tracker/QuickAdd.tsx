import { useMemo, useState } from "react";
import { notify } from "../../stores/notify";
import { createCustomFood, logItem, removeCustomFood, slotForTime, toggleFavorite, useTracker, CUSTOM_SLUG } from "../../stores/tracker";
import type { ItemRef } from "../../stores/compare";
import { recentItems } from "../../utils/history";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";
import { undoable } from "../ui/undoable";
import { SavedOrders } from "../build/SavedOrders";
import { EmptyState } from "../ui/EmptyState";
import { TabBar } from "../ui/TabBar";

type Tab = "recent" | "favorites" | "mine" | "orders";

export function QuickAdd({ date }: { date: string }) {
  const { days, favorites, customFoods } = useTracker();
  const [tab, setTab] = useState<Tab>("recent");
  const [form, setForm] = useState(false);
  const recents = useMemo(() => recentItems(days), [days]);
  const list = tab === "recent" ? recents : tab === "favorites" ? favorites : tab === "mine" ? customFoods : [];
  const isFav = (id: string) => favorites.some((f) => f.id === id);
  const log = (item: ItemRef) => {
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
          <TabBar
            className="px-4"
            label="Quick add"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "recent", label: "Recent" },
              { value: "favorites", label: "Starred" },
              { value: "mine", label: "My foods" },
              { value: "orders", label: "Orders" },
            ]}
          />
          {tab === "orders" ? (
            <SavedOrders compact emptyText="Save an order in Build to re-log it here in one tap." />
          ) : list.length === 0 ? (
            <EmptyState
              size="sm"
              art={tab === "mine" ? "salad" : "plate"}
              title={tab === "recent" ? "No recent items" : tab === "favorites" ? "Nothing starred" : "No foods of your own"}
              text={tab === "recent" ? "Items you log show up here for quick re-logging." : tab === "favorites" ? "Tap the bookmark next to an item to keep it here." : "Add something that isn't on a menu, like home cooking."}
              action={
                tab === "mine" ? (
                  <button type="button" onClick={() => setForm(true)} className={ui.btnSmall}>
                    Add a custom food
                  </button>
                ) : undefined
              }
            />
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
                    <button type="button" onClick={() => undoable(`Deleted ${item.name}`, () => removeCustomFood(item.id))} aria-label={`Delete ${item.name}`} className="p-1 text-gray-400 hover:text-gray-900">
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => log(item)} className={ui.btnAccentSmall}>
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

function CustomFoodForm({ onDone }: { onDone: (item: ItemRef) => void }) {
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
