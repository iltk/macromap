
import { setThemePref, useThemePref } from "../../stores/theme";
import { setLimits, usePrefs } from "../../stores/prefs";
import { clearAvoid, toggleAvoid } from "../../stores/allergens";
import { ALLERGENS } from "../../utils/allergens";
import { GOALS, NO_LIMITS, goalFor } from "../../utils/goals";
import { RangeField } from "../restaurants/RangeField";
import { ui } from "../ui/styles";
import { Segmented } from "../ui/Segmented";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-200 px-5 py-5">
      <h3 className={ui.label}>{title}</h3>
      {hint && <p className={`mt-0.5 ${ui.hint}`}>{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function PrefsSheet() {
  const { limits, avoid } = usePrefs();
  const theme = useThemePref();
  const preset = goalFor(limits);

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Goal" hint="Places and menu items are matched against this everywhere in the app.">
        <div className="space-y-1">
          {GOALS.map((g) => (
            <label
              key={g.id}
              className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 ${
                preset?.id === g.id ? "bg-accent-soft" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="goal"
                checked={preset?.id === g.id}
                onChange={() => setLimits(g.limits)}
                className="accent-(--color-accent)"
              />
              <span className="flex-1 text-sm text-gray-900">{g.id === "any" ? "No goal" : g.label}</span>
              {g.id !== "any" && <span className="text-xs text-gray-500">{g.rule}</span>}
            </label>
          ))}
          {!preset && (
            <p className="rounded-md bg-accent-soft px-2.5 py-2 text-sm text-accent-ink">Custom goal (set below)</p>
          )}
        </div>
        <details className="mt-3" open={!preset}>
          <summary className="cursor-pointer text-sm text-gray-600">Fine-tune</summary>
          <div className="mt-3 space-y-4">
            <RangeField
              label="Calories"
              kind="upTo"
              value={limits.maxCalories}
              onChange={(v) => setLimits((l) => ({ ...l, maxCalories: v }))}
              min={100}
              max={1500}
              step={50}
              unit="cal"
            />
            <RangeField
              label="Protein"
              kind="atLeast"
              value={limits.minProtein}
              onChange={(v) => setLimits((l) => ({ ...l, minProtein: v }))}
              min={0}
              max={60}
              step={5}
              unit="g"
            />
            <RangeField
              label="Carbs"
              kind="upTo"
              value={limits.maxCarbs}
              onChange={(v) => setLimits((l) => ({ ...l, maxCarbs: v }))}
              min={0}
              max={150}
              step={5}
              unit="g"
            />
            <button type="button" onClick={() => setLimits(NO_LIMITS)} className={`text-sm ${ui.link}`}>
              Clear goal
            </button>
          </div>
        </details>
      </Section>

      <Section
        title="Avoid allergens"
        hint="Items without allergen info are hidden, never assumed safe. Always check with the restaurant."
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {ALLERGENS.map((a) => (
            <label key={a.code} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={avoid.includes(a.code)}
                onChange={() => toggleAvoid(a.code)}
                className="accent-(--color-accent)"
              />
              {a.label}
            </label>
          ))}
        </div>
        {avoid.length > 0 && (
          <button type="button" onClick={clearAvoid} className={`mt-3 text-sm ${ui.link}`}>
            Clear allergens
          </button>
        )}
      </Section>

      <Section title="Appearance">
        <Segmented
          label="Theme"
          value={theme}
          onChange={setThemePref}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </Section>
    </div>
  );
}
