import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces } from "../../api/venues";
import { CATEGORY_COLORS } from "../../constants/categories";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { MenuItemHit, RestaurantHit, SearchResponse } from "../../types/venues";
import { Icon } from "../ui/icons";
import { FoodImage } from "../media/FoodImage";
import { clearRecents, useRecentPlaces, useSavedPlaces, type PlaceRef } from "../../stores/places";

interface SearchBarProps {
  onSelectRestaurant: (hit: RestaurantHit) => void;
  onSelectItem: (hit: MenuItemHit) => void;
  onSelectPlace: (place: PlaceRef) => void;
}

type Option =
  | { kind: "restaurant"; hit: RestaurantHit }
  | { kind: "item"; hit: MenuItemHit }
  | { kind: "place"; place: PlaceRef; group: "saved" | "recent" };

const optionKey = (o: Option) =>
  o.kind === "restaurant"
    ? `r-${o.hit.restaurantId}`
    : o.kind === "item"
      ? `i-${o.hit.id}`
      : `${o.group}-${o.place.locationId}`;

interface Results {
  query: string;
  data: SearchResponse | null;
  error: boolean;
}

export function SearchBar({ onSelectRestaurant, onSelectItem, onSelectPlace }: SearchBarProps) {
  const saved = useSavedPlaces();
  const recents = useRecentPlaces();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const debounced = useDebouncedValue(query.trim(), 200);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debounced) return;
    const controller = new AbortController();
    searchPlaces(debounced, controller.signal)
      .then((data) => setResults({ query: debounced, data, error: false }))
      .catch(() => {
        if (!controller.signal.aborted) setResults({ query: debounced, data: null, error: true });
      });
    return () => controller.abort();
  }, [debounced]);

  // close the dropdown when clicking elsewhere
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const current = results && results.query === debounced && debounced ? results : null;
  const loading = Boolean(query.trim()) && !current;
  const browsing = !query.trim();
  const savedIds = new Set(saved.map((p) => p.locationId));
  const options: Option[] = browsing
    ? [
        ...saved.map((place) => ({ kind: "place" as const, place, group: "saved" as const })),
        ...recents
          .filter((p) => !savedIds.has(p.locationId))
          .slice(0, 5)
          .map((place) => ({ kind: "place" as const, place, group: "recent" as const })),
      ]
    : current?.data
      ? [
          ...current.data.restaurants.map((hit) => ({ kind: "restaurant" as const, hit })),
          ...current.data.items.map((hit) => ({ kind: "item" as const, hit })),
        ]
      : [];
  const showDropdown = open && (!browsing || options.length > 0);

  const choose = (opt: Option) => {
    setOpen(false);
    if (opt.kind === "restaurant") {
      setQuery(opt.hit.name);
      onSelectRestaurant(opt.hit);
    } else if (opt.kind === "item") {
      setQuery(opt.hit.name);
      onSelectItem(opt.hit);
    } else {
      onSelectPlace(opt.place);
    }
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className="flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white pr-1 pl-3 focus-within:border-accent"
      >
        <Icon name="search" className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search restaurants and menu items"
          data-shortcut="search"
          placeholder="Search places or dishes"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {!query && (
          <kbd className="mr-1 hidden rounded border border-gray-300 px-1.5 text-[11px] text-gray-500 md:inline" title="Press / to search">
            /
          </kbd>
        )}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-11 z-30 max-h-[60vh] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {!browsing && loading && <li className="px-4 py-3 text-sm text-gray-500">Searching…</li>}
          {current?.error && (
            <li className="px-4 py-3 text-sm text-danger-ink">Search is unavailable right now.</li>
          )}
          {browsing && (
            <li className="flex items-center justify-between px-4 pt-2 pb-1 text-xs text-gray-500">
              {saved.length > 0 ? "Saved and recent" : "Recent"}
              {recents.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearRecents}
                  className="text-link hover:underline"
                >
                  Clear history
                </button>
              )}
            </li>
          )}
          {!browsing && current?.data && options.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500">No results for “{current.query}”.</li>
          )}
          {options.map((opt, i) => (
            <li
              key={optionKey(opt)}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(opt)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                i === active ? "bg-gray-100" : ""
              }`}
            >
              {opt.kind === "place" ? (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <Icon name={opt.group === "saved" ? "bookmark" : "history"} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">{opt.place.name}</span>
                    <span className="block truncate text-xs text-gray-500">{opt.place.address}</span>
                  </span>
                </>
              ) : opt.kind === "restaurant" ? (
                <>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ background: CATEGORY_COLORS[opt.hit.category] ?? "#ea4335" }}
                  >
                    <Icon name="place" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {opt.hit.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {opt.hit.locationCount} locations · show nearest
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <FoodImage src={opt.hit.imageUrl} alt={opt.hit.name} tintKey={opt.hit.restaurantSlug} variant="thumb" className="h-8 w-8 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-gray-900">{opt.hit.name}</span>
                    <span className="block truncate text-xs text-gray-500">
                      {opt.hit.restaurantName}
                      {opt.hit.calories != null && ` · ${opt.hit.calories} kcal`}
                      {opt.hit.protein != null && ` · ${opt.hit.protein} g protein`}
                    </span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
