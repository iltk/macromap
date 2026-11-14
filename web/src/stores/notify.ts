import { useSyncExternalStore } from "react";

export interface Notice {
  id: number;
  message: string;
  /** Optional extra controls (e.g. Undo) rendered by the Notifier. */
  render?: (close: () => void) => React.ReactNode;
}

let current: Notice | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function notify(message: string, render?: Notice["render"], ms = 6000) {
  if (timer) clearTimeout(timer);
  current = { id: ++seq, message, render };
  emit();
  timer = setTimeout(dismiss, ms);
}

export function dismiss() {
  if (timer) clearTimeout(timer);
  current = null;
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useNotice = () => useSyncExternalStore(subscribe, () => current, () => current);
