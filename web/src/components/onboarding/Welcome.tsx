import { useState } from "react";
import { Link } from "react-router";
import { openSheet } from "../../stores/ui";
import { readJson, writeJson } from "../../utils/storage";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";

const KEY = "macromap.welcome.v1";

/** Shown once per browser: the three things MacroMap is for, each one tap away. */
export function Welcome() {
  const [open, setOpen] = useState(() => !readJson<boolean>(KEY, false));
  if (!open) return null;
  const close = () => {
    writeJson(KEY, true);
    setOpen(false);
  };

  const steps = [
    {
      title: "Set your goal",
      text: "High protein, a light meal, low carb, or your own numbers. Add allergens to avoid.",
      action: (
        <button
          type="button"
          onClick={() => {
            close();
            openSheet("prefs");
          }}
          className={ui.btn}
        >
          Set preferences
        </button>
      ),
    },
    {
      title: "Find food nearby",
      text: "The map lists places around you with the best item for your goal.",
      action: (
        <Link to="/" onClick={close} className={ui.btn}>
          Open the map
        </Link>
      ),
    },
    {
      title: "Build or log a meal",
      text: "Put an order together before you buy, then log what you ate to track your day.",
      action: (
        <Link to="/build" onClick={close} className={ui.btn}>
          Build a meal
        </Link>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id="welcome-title" className="text-lg font-bold text-gray-900">
              Welcome to MacroMap
            </h2>
            <p className="mt-1 text-sm text-gray-600">Fast food, with the calories and macros up front.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <ol className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 px-5 py-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                <p className="mt-0.5 text-sm text-gray-600">{s.text}</p>
                <div className="mt-2">{s.action}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-gray-100 px-5 py-3 text-right">
          <button type="button" onClick={close} className={ui.btnPrimary}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
