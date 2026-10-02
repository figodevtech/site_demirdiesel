// Configuração compartilhada da PWA (manifest, metadata e componentes cliente).

/** Cor da barra de status / barra de título do app instalado. */
export const PWA_THEME_COLOR = "#0F172A";

/** Cor da splash screen do Android: igual ao fundo do site para evitar "flash" na abertura. */
export const PWA_BACKGROUND_COLOR = "#F8FAFC";

/**
 * Versão do deploy atual. Definida em next.config.ts a partir do commit da Vercel.
 * É embutida no /sw.js para que cada deploy gere um Service Worker novo.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

/** Rotas onde CTAs da PWA (instalação, atualização) nunca devem interromper o usuário. */
export const PWA_QUIET_ROUTES = ["/checkout", "/sucesso", "/login", "/registro"];

export function isQuietRoute(pathname: string) {
  return PWA_QUIET_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
