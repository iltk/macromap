import { dismiss, useNotice } from "../../stores/notify";
import { Icon } from "./icons";

export function Notifier() {
  const notice = useNotice();
  if (!notice) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-[60] w-[min(92vw,30rem)] -translate-x-1/2">
      <div key={notice.id} className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
        <span className="min-w-0 flex-1">{notice.message}</span>
        {notice.render?.(dismiss)}
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="-mr-1 rounded p-1 text-white/70 hover:text-white">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
