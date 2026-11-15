import { useEffect } from "react";
import { TargetsForm } from "../tracker/TargetsForm";
import { openSheet, useSheet } from "../../stores/ui";
import { Icon } from "../ui/icons";
import { CompareSheet } from "./CompareSheet";
import { PrefsSheet } from "./PrefsSheet";

/** The right-hand sheet (preferences, targets or compare), mounted once for the whole app. */
export function Sheets() {
  const sheet = useSheet();

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  if (!sheet) return null;
  const title = { prefs: "Preferences", targets: "Daily targets", compare: "Compare" }[sheet];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={() => openSheet(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[400px] flex-col border-l border-gray-200 bg-white"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-5">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={() => openSheet(null)}
            aria-label="Close"
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        {sheet === "prefs" ? <PrefsSheet /> : sheet === "targets" ? <TargetsForm onDone={() => openSheet(null)} /> : <CompareSheet />}
      </div>
    </div>
  );
}
