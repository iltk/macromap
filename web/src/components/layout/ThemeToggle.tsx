import { setThemePref, useThemePref, type ThemePref } from "../../stores/theme";
import { Icon, type IconName } from "../ui/icons";

const NEXT: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
const META: Record<ThemePref, { icon: IconName; label: string }> = {
  system: { icon: "contrast", label: "Theme: system" },
  light: { icon: "sun", label: "Theme: light" },
  dark: { icon: "moon", label: "Theme: dark" },
};

export function ThemeToggle() {
  const pref = useThemePref();
  const { icon, label } = META[pref];
  return (
    <button
      type="button"
      onClick={() => setThemePref(NEXT[pref])}
      title={`${label} (click to change)`}
      aria-label={`${label}. Switch to ${NEXT[pref]}`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
    >
      <Icon name={icon} className="h-5 w-5" />
    </button>
  );
}
