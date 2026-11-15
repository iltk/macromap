import { usePrefs } from "../../stores/prefs";
import { openSheet } from "../../stores/ui";
import { Icon } from "./icons";

/** Says the viewer's goal/allergens are filtering what they see. Renders nothing when none are set. */
export function PrefsNote({ className = "" }: { className?: string }) {
  const prefs = usePrefs();
  if (!prefs.active) return null;
  return (
    <p className={`flex items-center gap-1.5 text-xs text-gray-600 ${className}`}>
      <Icon name="tune" className="h-3.5 w-3.5 shrink-0 text-accent-ink" />
      <span className="min-w-0 truncate">
        Using your preferences: <span className="font-medium text-gray-900">{prefs.summary}</span>
      </span>
      <button type="button" onClick={() => openSheet("prefs")} className="shrink-0 font-medium text-link hover:underline">
        Change
      </button>
    </p>
  );
}
