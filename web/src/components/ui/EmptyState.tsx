import type { FoodKind } from "../../utils/foodKind";
import { FoodGlyph } from "../media/FoodGlyph";

/** Drawing, one sentence and the next step. Use size="sm" inside cards and lists. */
export function EmptyState({
  art = "plate",
  title,
  text,
  action,
  size = "md",
}: {
  art?: FoodKind;
  title: string;
  text?: React.ReactNode;
  action?: React.ReactNode;
  size?: "sm" | "md";
}) {
  const sm = size === "sm";
  return (
    <div className={`flex flex-col items-center text-center ${sm ? "px-4 py-6" : "px-6 py-10"}`}>
      <span className={`flex items-center justify-center rounded-full bg-accent-soft text-accent-ink ${sm ? "h-12 w-12" : "h-16 w-16"}`}>
        <FoodGlyph kind={art} className={sm ? "h-6 w-6" : "h-8 w-8"} />
      </span>
      <p className={`mt-3 font-semibold text-gray-900 ${sm ? "text-sm" : "text-base"}`}>{title}</p>
      {text && <p className={`mt-1 max-w-xs text-gray-600 ${sm ? "text-xs" : "text-sm"}`}>{text}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
