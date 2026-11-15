interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

/** A small set of mutually exclusive choices shown side by side (Day / History, Cards / Table…). */
export function Segmented<T extends string>({ label, value, options, onChange, size = "md", className = "" }: Props<T>) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1 text-sm";
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex shrink-0 rounded-md border border-gray-300 bg-white p-0.5 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded ${pad} ${value === o.value ? "bg-gray-900 font-medium text-white" : "text-gray-700 hover:bg-gray-100"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
