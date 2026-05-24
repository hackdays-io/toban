import { useEffect, useState } from "react";

// Reactive wrapper around `navigator.onLine`. Initial value is `true` on the
// server (no `navigator`) so SSR markup matches the most common case; the
// real value is read on mount and kept in sync via `online`/`offline` events.
export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
};
