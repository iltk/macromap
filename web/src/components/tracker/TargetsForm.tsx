import { useState } from "react";
import { setProfile, setTargets, useTracker } from "../../stores/tracker";
import { ACTIVITY, BODY_GOALS, estimateTargets, LOW_CALORIE_WARNING, type Activity, type BodyGoal, type BodyProfile, type DailyTarget, type Sex } from "../../utils/targets";
import { ui } from "../ui/styles";

const DEFAULT_TARGET: DailyTarget = { calories: 2000, protein: 120, carbs: 225, fat: 65 };
const DEFAULT_PROFILE: BodyProfile = { sex: "female", age: 30, heightCm: 168, weightKg: 68, activity: "light", goal: "maintain" };

/** Daily targets: type them in, or estimate them from body stats (optional). */
export function TargetsForm({ onDone }: { onDone?: () => void }) {
  const { targets, profile } = useTracker();
  const [draft, setDraft] = useState<DailyTarget>(targets ?? DEFAULT_TARGET);
  const [body, setBody] = useState<BodyProfile>(profile ?? DEFAULT_PROFILE);
  const [lb, setLb] = useState(false);
  const estimate = estimateTargets(body);

  const num = (key: keyof DailyTarget, label: string, unit: string) => (
    <label className="block text-sm text-gray-700">
      {label}
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
          className={ui.input}
        />
        <span className="w-8 text-xs text-gray-500">{unit}</span>
      </span>
    </label>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="border-b border-gray-200 px-5 py-5">
        <h3 className={ui.label}>Daily targets</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {num("calories", "Calories", "cal")}
          {num("protein", "Protein", "g")}
          {num("carbs", "Carbs", "g")}
          {num("fat", "Fat", "g")}
        </div>
        {draft.calories > 0 && draft.calories < LOW_CALORIE_WARNING && (
          <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn-ink">
            That's a very low daily intake. Eating under {LOW_CALORIE_WARNING} calories a day is best done with a doctor or dietitian.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTargets(draft);
              onDone?.();
            }}
            className={ui.btnPrimary}
          >
            Save targets
          </button>
          {targets && (
            <button
              type="button"
              onClick={() => {
                setTargets(null);
                onDone?.();
              }}
              className={ui.btn}
            >
              Remove targets
            </button>
          )}
        </div>
      </section>

      <details className="px-5 py-5" open={!targets}>
        <summary className="cursor-pointer text-sm font-semibold text-gray-900">Estimate them for me</summary>
        <p className="mt-1 text-xs text-gray-500">Optional. Uses the Mifflin-St Jeor formula. Saved only in this browser.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
          <label className="col-span-2 block">
            Sex
            <span className="mt-1 flex gap-2">
              {(["female", "male"] as Sex[]).map((s) => (
                <label key={s} className={`${ui.btnSmall} cursor-pointer capitalize ${body.sex === s ? "border-accent bg-accent-soft text-accent-ink" : ""}`}>
                  <input type="radio" name="sex" checked={body.sex === s} onChange={() => setBody({ ...body, sex: s })} className="sr-only" />
                  {s}
                </label>
              ))}
            </span>
          </label>
          <label className="block">
            Age
            <input type="number" min={14} max={100} value={body.age} onChange={(e) => setBody({ ...body, age: Number(e.target.value) || 0 })} className={`mt-1 ${ui.input}`} />
          </label>
          <label className="block">
            Height (cm)
            <input type="number" min={100} max={250} value={body.heightCm} onChange={(e) => setBody({ ...body, heightCm: Number(e.target.value) || 0 })} className={`mt-1 ${ui.input}`} />
          </label>
          <label className="col-span-2 block">
            Weight
            <span className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={30}
                value={lb ? Math.round(body.weightKg * 2.20462) : body.weightKg}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  setBody({ ...body, weightKg: lb ? Math.round((v / 2.20462) * 10) / 10 : v });
                }}
                className={ui.input}
              />
              <button type="button" onClick={() => setLb(!lb)} className={`${ui.btnSmall} w-14`} title="Switch units">
                {lb ? "lb" : "kg"}
              </button>
            </span>
          </label>
          <label className="col-span-2 block">
            Activity
            <select value={body.activity} onChange={(e) => setBody({ ...body, activity: e.target.value as Activity })} className={`mt-1 w-full ${ui.select}`}>
              {Object.entries(ACTIVITY).map(([k, a]) => (
                <option key={k} value={k}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 block">
            Goal
            <select value={body.goal} onChange={(e) => setBody({ ...body, goal: e.target.value as BodyGoal })} className={`mt-1 w-full ${ui.select}`}>
              {Object.entries(BODY_GOALS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-md bg-gray-50 px-3 py-3 text-sm">
          <p className="text-gray-700">
            About <span className="font-semibold text-gray-900 tabular-nums">{estimate.calories} cal</span> a day
            <span className="text-gray-500"> (maintenance ≈ {estimate.maintenance})</span>
          </p>
          <p className="mt-0.5 text-gray-600 tabular-nums">
            {estimate.protein} g protein · {estimate.carbs} g carbs · {estimate.fat} g fat
          </p>
          {estimate.calories < LOW_CALORIE_WARNING && (
            <p className="mt-2 text-xs text-warn-ink">This estimate is very low. Please check it with a professional before following it.</p>
          )}
          <button
            type="button"
            onClick={() => {
              const { calories, protein, carbs, fat } = estimate;
              setDraft({ calories, protein, carbs, fat });
              setProfile(body);
            }}
            className={`mt-3 ${ui.btn}`}
          >
            Use these numbers
          </button>
          <p className="mt-2 text-xs text-gray-500">An estimate, not medical advice. Adjust it to how you feel and what you see over a few weeks.</p>
        </div>
      </details>
    </div>
  );
}
