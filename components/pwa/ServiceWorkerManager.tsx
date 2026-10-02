"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthContext";
import { isQuietRoute } from "@/lib/pwa/config";

// Em desenvolvimento o SW atrapalha o HMR; habilite com NEXT_PUBLIC_ENABLE_SW_DEV=true se precisar testar.
const SW_ENABLED =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW_DEV === "true";

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const UPDATE_TOAST_ID = "pwa-update";

export function ServiceWorkerManager() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const updateRequestedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SW_ENABLED || !("serviceWorker" in navigator)) return;

    const serviceWorker = navigator.serviceWorker;
    let registration: ServiceWorkerRegistration | undefined;
    let lastCheck = Date.now();
    let disposed = false;

    const watchInstalling = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const onStateChange = () => {
        // "installed" com um controller ativo = atualização aguardando (não é a primeira instalação).
        if (!disposed && worker.state === "installed" && serviceWorker.controller) {
          setWaitingWorker(worker);
        }
      };
      worker.addEventListener("statechange", onStateChange);
      onStateChange();
    };

    const register = () => {
      serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          if (disposed) return;
          registration = reg;
          if (reg.waiting && serviceWorker.controller) setWaitingWorker(reg.waiting);
          watchInstalling(reg.installing);
          reg.addEventListener("updatefound", () => watchInstalling(reg.installing));
        })
        .catch((error) => console.error("[pwa] Falha ao registrar o Service Worker:", error));
    };

    // Apps instalados ficam abertos por dias: verifica novas versões ao voltar para o app.
    const checkForUpdate = () => {
      if (!registration || document.visibilityState !== "visible") return;
      if (Date.now() - lastCheck < UPDATE_CHECK_INTERVAL_MS) return;
      lastCheck = Date.now();
      registration.update().catch(() => undefined);
    };

    // Recarrega somente quando o próprio usuário pediu a atualização (evita loops de reload).
    const onControllerChange = () => {
      if (!updateRequestedRef.current) return;
      updateRequestedRef.current = false;
      window.location.reload();
    };

    // Registra após o load para não competir com os recursos críticos da primeira visita.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", checkForUpdate);
    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.clearInterval(interval);
    };
  }, []);

  // Aviso de nova versão — nunca no meio do checkout, login ou confirmação de pagamento.
  useEffect(() => {
    if (!waitingWorker || isQuietRoute(pathname)) {
      toast.dismiss(UPDATE_TOAST_ID);
      return;
    }

    toast("Nova versão disponível", {
      id: UPDATE_TOAST_ID,
      description: "Atualize para usar a versão mais recente da loja.",
      duration: Infinity,
      action: {
        label: "Atualizar",
        onClick: () => {
          updateRequestedRef.current = true;
          waitingWorker.postMessage({ type: "SKIP_WAITING" });
          // Segurança: se o controllerchange não chegar, recarrega uma única vez.
          window.setTimeout(() => {
            if (!updateRequestedRef.current) return;
            updateRequestedRef.current = false;
            window.location.reload();
          }, 3000);
        },
      },
    });
  }, [waitingWorker, pathname]);

  // Logout ou troca de conta: apaga o HTML guardado no aparelho (defesa em profundidade).
  useEffect(() => {
    const userId = user?.id ?? null;
    if (lastUserIdRef.current && lastUserIdRef.current !== userId) {
      navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PAGE_CACHE" });
    }
    lastUserIdRef.current = userId;
  }, [user?.id]);

  return null;
}
