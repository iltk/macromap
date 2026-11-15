import { notify } from "../../stores/notify";
import { restoreTracker, trackerSnapshot } from "../../stores/tracker";

/** Runs a tracker change and offers Undo, which restores the tracker exactly as it was. */
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

/** Same, for changes outside the tracker that bring their own restore. */
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
