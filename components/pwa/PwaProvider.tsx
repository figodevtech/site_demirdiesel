"use client";

import { useEffect } from "react";
import { isStandaloneDisplayMode, subscribeDisplayMode } from "@/lib/pwa/display-mode";
import { InstallPrompt } from "./InstallPrompt";
import { OfflineIndicator } from "./OfflineIndicator";
import { ServiceWorkerManager } from "./ServiceWorkerManager";

/**
 * Recursos da PWA montados uma vez no layout raiz.
 * Também marca <html data-display-mode="standalone|browser"> para ajustes de CSS do app instalado.
 */
export function PwaProvider() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.displayMode = isStandaloneDisplayMode() ? "standalone" : "browser";
    };
    apply();
    return subscribeDisplayMode(apply);
  }, []);

  return (
    <>
      <ServiceWorkerManager />
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}
