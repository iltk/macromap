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
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-gray-800">{label}</span>
        <span className="text-gray-500 tabular-nums">
          {value === null ? "No limit" : `${kind === "upTo" ? "up to" : "at least"} ${value} ${unit}`}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? open}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(v === open ? null : v);
        }}
        className="mt-1.5 w-full accent-(--color-accent)"
        aria-label={label}
      />
    </label>
  );
}
