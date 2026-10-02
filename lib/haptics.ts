// Feedback tátil para ações importantes (adicionar ao carrinho, favoritar, pagamento confirmado...).
//
// Hoje: usa navigator.vibrate apenas no app instalado no Android (no navegador seria intrusivo
// e o iOS web não suporta vibração). Futuro (Capacitor): registre um adapter nativo no boot do app:
//
//   import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
//   setHapticsAdapter((kind) => {
//     if (kind === "success") return Haptics.notification({ type: NotificationType.Success });
//     if (kind === "error") return Haptics.notification({ type: NotificationType.Error });
//     return Haptics.impact({ style: kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
//   });

export type HapticKind = "selection" | "light" | "medium" | "success" | "error";

type HapticsAdapter = (kind: HapticKind) => void | Promise<void>;

const VIBRATION_PATTERNS: Record<HapticKind, number | number[]> = {
  selection: 6,
  light: 10,
  medium: 18,
  success: [12, 60, 18],
  error: [24, 50, 24],
};

let adapter: HapticsAdapter | null = null;

export function setHapticsAdapter(next: HapticsAdapter | null) {
  adapter = next;
}

function webVibrate(kind: HapticKind) {
  if (typeof window === "undefined" || typeof navigator.vibrate !== "function") return;
  if (document.documentElement.dataset.displayMode !== "standalone") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(VIBRATION_PATTERNS[kind]);
}

export function haptic(kind: HapticKind = "light") {
  try {
    if (adapter) {
      void adapter(kind);
      return;
    }
    webVibrate(kind);
  } catch {
    // Feedback tátil nunca pode quebrar uma ação.
  }
}
