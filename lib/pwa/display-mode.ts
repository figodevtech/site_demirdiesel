// Detecção de modo de exibição e plataforma (somente no navegador).

const STANDALONE_QUERY = "(display-mode: standalone), (display-mode: fullscreen)";

/** true quando o site está aberto como app instalado (Android, desktop, iOS ou TWA). */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;

  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const twa = document.referrer.startsWith("android-app://");

  return iosStandalone || twa || window.matchMedia(STANDALONE_QUERY).matches;
}

/** Notifica mudanças de modo (ex.: usuário abre o app instalado a partir da aba). */
export function subscribeDisplayMode(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(STANDALONE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  // iPadOS 13+ se identifica como Mac, mas possui tela touch.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
}

/**
 * Safari do iOS/iPadOS: único navegador onde orientamos "Compartilhar → Adicionar à Tela de Início".
 * Navegadores in-app (Instagram, Facebook, WhatsApp...) e outros browsers são excluídos.
 */
export function isIosSafari(): boolean {
  if (typeof window === "undefined" || !isIos()) return false;
  const ua = window.navigator.userAgent;
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|YaBrowser|DuckDuckGo|FBAN|FBAV|Instagram|Line\/|Snapchat|WhatsApp|TikTok/i;
  return /Safari\//.test(ua) && /Version\//.test(ua) && !otherBrowser.test(ua);
}
