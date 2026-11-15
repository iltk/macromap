interface Tab<T extends string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface Props<T extends string> {
  value: T;
  tabs: Tab<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

/** Underlined tabs; scrolls sideways when there are more tabs than room. */
export function TabBar<T extends string>({ value, tabs, onChange, label, className = "" }: Props<T>) {
  return (
    <div role="tablist" aria-label={label} className={`no-scrollbar flex gap-4 overflow-x-auto border-b border-gray-200 ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          disabled={t.disabled}
          onClick={() => onChange(t.value)}
          className={`-mb-px shrink-0 border-b-2 py-2 text-sm whitespace-nowrap ${
            value === t.value
              ? "border-gray-900 font-semibold text-gray-900"
              : "border-transparent text-gray-600 hover:text-gray-900 disabled:text-gray-400"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1 text-xs text-gray-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
