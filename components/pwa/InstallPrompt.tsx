"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVirtualKeyboardOpen } from "@/hooks/use-virtual-keyboard";
import { isQuietRoute } from "@/lib/pwa/config";
import { isIosSafari, isStandaloneDisplayMode } from "@/lib/pwa/display-mode";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptMode = "android" | "ios";

const DISMISSED_AT_KEY = "demir-pwa-install-dismissed-at";
const INSTALLED_KEY = "demir-pwa-installed";
const VISITS_KEY = "demir-pwa-visits";
const SESSION_COUNTED_KEY = "demir-pwa-session-counted";
const SESSION_PAGEVIEWS_KEY = "demir-pwa-session-pageviews";

const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000; // "Agora não" silencia por 30 dias
const SHOW_DELAY_MS = 4000;
const MIN_VISITS = 2;
const MIN_SESSION_PAGEVIEWS = 3;

function read(storage: "local" | "session", key: string) {
  try {
    return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function write(storage: "local" | "session", key: string, value: string) {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Modo privado / storage bloqueado: o convite apenas não é lembrado.
  }
}

function canSuggestInstall(pathname: string) {
  if (isQuietRoute(pathname) || isStandaloneDisplayMode()) return false;
  if (!window.matchMedia("(pointer: coarse)").matches) return false; // desktop usa o ícone nativo do navegador
  if (read("local", INSTALLED_KEY)) return false;

  const dismissedAt = Number(read("local", DISMISSED_AT_KEY) || 0);
  if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return false;

  const visits = Number(read("local", VISITS_KEY) || 0);
  const pageviews = Number(read("session", SESSION_PAGEVIEWS_KEY) || 0);
  return visits >= MIN_VISITS || pageviews >= MIN_SESSION_PAGEVIEWS;
}

/**
 * Convite discreto para instalar o app: só aparece na segunda visita ou após algumas
 * páginas navegadas, nunca em checkout/login, e respeita "Agora não" por 30 dias.
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const isKeyboardOpen = useVirtualKeyboardOpen();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<PromptMode | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Impede o mini-infobar automático do Chrome; o convite aparece no nosso tempo.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      write("local", INSTALLED_KEY, "1");
      setDeferredPrompt(null);
      setMode(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Conta uma visita por sessão do navegador.
  useEffect(() => {
    if (read("session", SESSION_COUNTED_KEY)) return;
    write("session", SESSION_COUNTED_KEY, "1");
    write("local", VISITS_KEY, String(Number(read("local", VISITS_KEY) || 0) + 1));
  }, []);

  useEffect(() => {
    write("session", SESSION_PAGEVIEWS_KEY, String(Number(read("session", SESSION_PAGEVIEWS_KEY) || 0) + 1));
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!canSuggestInstall(pathname)) return;
      if (deferredPrompt) setMode("android");
      else if (isIosSafari()) setMode("ios");
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, deferredPrompt]);

  const dismiss = () => {
    write("local", DISMISSED_AT_KEY, String(Date.now()));
    setMode(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") write("local", INSTALLED_KEY, "1");
      else write("local", DISMISSED_AT_KEY, String(Date.now()));
    } catch {
      // O evento só pode ser usado uma vez; se falhar, o navegador mantém o menu "Instalar app".
    } finally {
      setDeferredPrompt(null);
      setMode(null);
      setIsInstalling(false);
    }
  };

  if (!mode || isQuietRoute(pathname) || isKeyboardOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.75rem)] z-40 mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-4 md:bottom-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar convite de instalação"
        className="absolute right-1.5 top-1.5 flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-xl border border-border/70"
        />
        <div className="min-w-0">
          <p id="pwa-install-title" className="text-sm font-bold text-foreground">
            Instale o app da Demir Diesel
          </p>
          <p id="pwa-install-description" className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Acesse produtos e acompanhe seus pedidos direto da tela inicial.
          </p>
        </div>
      </div>

      {mode === "ios" ? (
        <div className="mt-3 space-y-3">
          <ol className="space-y-2 rounded-xl bg-muted/70 p-3 text-xs text-foreground">
            <li className="flex items-center gap-2">
              <Share className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Toque em <strong>Compartilhar</strong> na barra do Safari
              </span>
            </li>
            <li className="flex items-center gap-2">
              <SquarePlus className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Escolha <strong>Adicionar à Tela de Início</strong>
              </span>
            </li>
          </ol>
          <Button type="button" variant="outline" onClick={dismiss} className="h-11 w-full rounded-xl text-sm font-semibold">
            Entendi
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={dismiss} className="h-11 rounded-xl text-sm font-semibold">
            Agora não
          </Button>
          <Button type="button" onClick={install} disabled={isInstalling} className="h-11 gap-2 rounded-xl text-sm font-bold">
            <Download className="size-4" aria-hidden="true" />
            Instalar
          </Button>
        </div>
      )}
    </div>
  );
}
