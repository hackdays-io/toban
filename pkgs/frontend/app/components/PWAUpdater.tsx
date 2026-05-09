import { useEffect } from "react";

export const PWAUpdater = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (import.meta.env.DEV) return;

    let cancelled = false;
    void (async () => {
      // virtual module provided by vite-plugin-pwa. With registerType:
      // "autoUpdate" the helper takes care of skipWaiting + clientsClaim
      // and reloads only when a new SW actually takes control.
      const { registerSW } = await import("virtual:pwa-register");
      if (cancelled) return;
      registerSW({ immediate: true });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};
