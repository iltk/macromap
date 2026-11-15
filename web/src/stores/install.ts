import { useSyncExternalStore } from "react";

/** Chrome/Edge's install prompt event (not in the DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of the browser's mini-infobar
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

/** Registers the offline service worker (production builds only, so dev never serves stale files). */
export function registerServiceWorker() {
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is a bonus; the app works without it */
      });
    });
  }
}

const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
let snapshot = { canPrompt: false, installed, ios: isIos };
const getSnapshot = () => {
  const next = { canPrompt: deferred !== null, installed, ios: isIos };
  if (next.canPrompt !== snapshot.canPrompt || next.installed !== snapshot.installed) snapshot = next;
  return snapshot;
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useInstall = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export async function promptInstall() {
  if (!deferred) return;
  await deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  emit();
}
