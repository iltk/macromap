import { GOALS, type Goal } from "../../utils/goals";
import { Icon } from "../ui/icons";

/** Chip-styled goal picker (native select underneath for accessibility). */
export function GoalChip({ goal, onChange }: { goal: Goal; onChange: (g: Goal) => void }) {
  const active = goal.id !== "any";
  return (
    <label
      className={`relative flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full pr-2 pl-3 text-sm font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25)] ${
        active ? "bg-gray-900 text-white" : "bg-white text-gray-800 hover:bg-gray-50"
      }`}
      title={active ? goal.rule : "Highlight places with items that fit a macro goal"}
    >
      {active ? goal.label : "Goal"}
      <Icon name="chevronDown" className="h-4 w-4 opacity-70" />
      <select
        value={goal.id}
        onChange={(e) => onChange(GOALS.find((g) => g.id === e.target.value) ?? GOALS[0])}
        aria-label="Macro goal"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {GOALS.map((g) => (
          <option key={g.id} value={g.id}>
            {g.id === "any" ? "No goal" : `${g.label} (${g.rule})`}
          </option>
        ))}
      </select>
    </label>
  );
}
