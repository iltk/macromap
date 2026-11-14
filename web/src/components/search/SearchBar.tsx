import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces } from "../../api/venues";
import { CATEGORY_COLORS } from "../../constants/categories";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { MenuItemHit, RestaurantHit, SearchResponse } from "../../types/venues";
import { Icon } from "../ui/icons";

interface SearchBarProps {
  onSelectRestaurant: (hit: RestaurantHit) => void;
  onSelectItem: (hit: MenuItemHit) => void;
}

type Option =
  | { kind: "restaurant"; hit: RestaurantHit }
  | { kind: "item"; hit: MenuItemHit };

interface Results {
  query: string;
  data: SearchResponse | null;
  error: boolean;
}

export function SearchBar({ onSelectRestaurant, onSelectItem }: SearchBarProps) {
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
  const options: Option[] = current?.data
    ? [
        ...current.data.restaurants.map((hit) => ({ kind: "restaurant" as const, hit })),
        ...current.data.items.map((hit) => ({ kind: "item" as const, hit })),
      ]
    : [];
  const showDropdown = open && Boolean(query.trim());

  const choose = (opt: Option) => {
    setOpen(false);
    if (opt.kind === "restaurant") {
      setQuery(opt.hit.name);
      onSelectRestaurant(opt.hit);
    } else {
      setQuery(opt.hit.name);
      onSelectItem(opt.hit);
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
        className={`flex h-12 items-center gap-2 bg-white pr-2 pl-4 shadow-[0_2px_4px_rgba(0,0,0,0.2),0_-1px_0_rgba(0,0,0,0.02)] ${
          showDropdown ? "rounded-t-3xl" : "rounded-3xl"
        }`}
      >
        <Icon name="search" className="h-5 w-5 shrink-0 text-gray-500" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search restaurants and menu items"
          placeholder="Search restaurants or dishes"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-12 z-10 max-h-[60vh] overflow-y-auto rounded-b-3xl border-t border-gray-200 bg-white py-2 shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
        >
          {loading && <li className="px-5 py-3 text-sm text-gray-500">Searching…</li>}
          {current?.error && (
            <li className="px-5 py-3 text-sm text-red-600">Search is unavailable right now.</li>
          )}
          {current?.data && options.length === 0 && (
            <li className="px-5 py-3 text-sm text-gray-500">No results for “{current.query}”.</li>
          )}
          {options.map((opt, i) => (
            <li
              key={`${opt.kind}-${opt.kind === "restaurant" ? opt.hit.restaurantId : opt.hit.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(opt)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${
                i === active ? "bg-gray-100" : ""
              }`}
            >
              {opt.kind === "restaurant" ? (
                <>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <Icon name="restaurant" className="h-4 w-4" />
                  </span>
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
