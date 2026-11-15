import { Icon } from "./icons";

interface Props {
  value: number;
  /** Item name, for the button labels ("One less Teen Burger"). */
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  tone?: "outline" | "solid";
}

export function QtyStepper({ value, label, onDecrease, onIncrease, tone = "outline" }: Props) {
  const solid = tone === "solid";
  return (
    <span
      className={`flex shrink-0 items-center ${solid ? "rounded-full bg-accent text-white" : "rounded-md border border-gray-300"}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`One less ${label}`}
        className={solid ? "p-1.5" : "p-1.5 text-gray-600 hover:text-gray-900"}
      >
        <Icon name="remove" className="h-3.5 w-3.5" />
      </button>
      <span className={`w-5 text-center text-sm tabular-nums ${solid ? "font-semibold" : ""}`}>{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`One more ${label}`}
        className={solid ? "p-1.5" : "p-1.5 text-gray-600 hover:text-gray-900"}
      >
        <Icon name="add" className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
