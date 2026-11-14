import { clearAvoid, toggleAvoid, useAvoidList } from "../../stores/allergens";
import { ALLERGENS } from "../../utils/allergens";

export function AllergenPicker({ size = "md" }: { size?: "sm" | "md" }) {
  const avoid = useAvoidList();
  const chip = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {ALLERGENS.map((a) => {
          const on = avoid.includes(a.code);
          return (
            <button
              key={a.code}
              type="button"
              onClick={() => toggleAvoid(a.code)}
              aria-pressed={on}
              className={`rounded-full border font-semibold ${chip} ${
                on ? "border-[#d93025] bg-danger-soft text-danger-ink line-through" : "border-gray-300 bg-white text-gray-700 hover:border-gray-900"
              }`}
            >
              {a.label}
            </button>
          );
        })}
        {avoid.length > 0 && (
          <button type="button" onClick={clearAvoid} className={`font-semibold text-link hover:underline ${chip}`}>
            Clear
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-gray-500">
        Items without allergen info are hidden, never assumed safe. Always confirm with the restaurant:
        recipes change and cross-contact can happen.
      </p>
    </div>
  );
}
