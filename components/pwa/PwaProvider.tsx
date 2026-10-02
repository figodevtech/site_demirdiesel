"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { recordInAppNavigation } from "@/hooks/use-safe-back";
import { isStandaloneDisplayMode, subscribeDisplayMode } from "@/lib/pwa/display-mode";
import { InstallPrompt } from "./InstallPrompt";
import { OfflineIndicator } from "./OfflineIndicator";
import { ServiceWorkerManager } from "./ServiceWorkerManager";

/**
 * Recursos da PWA montados uma vez no layout raiz.
 * Também marca <html data-display-mode="standalone|browser"> para ajustes de CSS do app instalado.
 */
export function PwaProvider() {
  const pathname = usePathname();
  const firstPathRef = useRef(true);

  useEffect(() => {
    if (firstPathRef.current) {
      firstPathRef.current = false;
      return;
    }
    recordInAppNavigation();
  }, [pathname]);

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.displayMode = isStandaloneDisplayMode() ? "standalone" : "browser";
    };
    apply();

    // O Safari do iOS só aplica estilos :active com algum listener de touchstart no documento.
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    const unsubscribe = subscribeDisplayMode(apply);
    return () => {
      document.removeEventListener("touchstart", noop);
      unsubscribe();
    };
  }, []);

  return (
    <>
      <ServiceWorkerManager />
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}
