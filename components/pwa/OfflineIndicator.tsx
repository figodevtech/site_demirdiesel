"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] z-[60] flex justify-center px-4">
      {!isOnline && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground shadow-lg shadow-slate-900/25 animate-in fade-in slide-in-from-top-2">
          <WifiOff className="size-4 shrink-0 text-sky-300" aria-hidden="true" />
          <span>Você está offline. Pedidos, conta e checkout precisam de internet.</span>
        </div>
      )}
    </div>
  );
}
