/**
 * Slider for an optional limit. Dragging to the "open" end (max for upper limits,
 * min for lower limits) means "no limit" and is reported as null.
 */
export function RangeField({
  label,
  kind,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  kind: "upTo" | "atLeast";
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const open = kind === "upTo" ? max : min;
  const shown = value ?? open;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-gray-900">{label}</span>
        <span className="text-gray-600 tabular-nums">
          {value === null ? "Any" : `${kind === "upTo" ? "≤" : "≥"} ${value} ${unit}`}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(v === open ? null : v);
        }}
        className="mt-2 w-full accent-gray-900"
        aria-label={label}
      />
    </label>
  );
}
