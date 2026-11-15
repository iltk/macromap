import { notify } from "../../stores/notify";
import { restoreTracker, trackerSnapshot } from "../../stores/tracker";

/**
 * Runs a tracker change and shows a notice with Undo, which puts the tracker back
 * exactly as it was. Use for anything that removes or moves data.
 */
export function undoable(message: string, change: () => void) {
  const before = trackerSnapshot();
  change();
  notify(message, (close) => (
    <button
      type="button"
      onClick={() => {
        restoreTracker(before);
        close();
      }}
      className="shrink-0 font-semibold text-white underline underline-offset-2"
    >
      Undo
    </button>
  ));
}

/** Same, for any change with its own restore function. */
export function undoableWith(message: string, change: () => void, restore: () => void) {
  change();
  notify(message, (close) => (
    <button
      type="button"
      onClick={() => {
        restore();
        close();
      }}
      className="shrink-0 font-semibold text-white underline underline-offset-2"
    >
      Undo
    </button>
  ));
}
