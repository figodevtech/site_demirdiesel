/**
 * Service Worker da Demir Diesel.
 *
 * Servido em /sw.js por app/sw.js/route.ts, que substitui __APP_VERSION__ pela versão
 * do deploy. Assim cada deploy gera um arquivo diferente e o navegador detecta a atualização.
 *
 * Política (detalhada em docs/PWA.md):
 *  - Nunca intercepta: métodos != GET, /api/*, requisições com Authorization ou Range,
 *    payloads RSC do Next, /_vercel/*, e QUALQUER origem externa (Supabase, Asaas, WhatsApp...).
 *  - /_next/static/*           → Cache First (arquivos imutáveis com hash no nome).
 *  - /_next/image              → Stale While Revalidate (imagens públicas otimizadas).
 *  - Arquivos públicos (ícones, logo, imagens) → Stale While Revalidate.
 *  - Navegação em páginas públicas do catálogo → Network First com fallback para cache.
 *  - Navegação em conta, checkout, login, pedidos etc. → Network Only com página offline.
 */

const APP_VERSION = "__APP_VERSION__";

const CACHE_PREFIX = "demir-";
// Incrementar quando a estrutura/política de cache mudar (apaga caches antigos no activate).
const CACHE_SCHEMA = "v1";

const PRECACHE = `${CACHE_PREFIX}precache-${APP_VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_SCHEMA}`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-${CACHE_SCHEMA}`;
const ASSET_CACHE = `${CACHE_PREFIX}assets-${CACHE_SCHEMA}`;
const PAGE_CACHE = `${CACHE_PREFIX}pages-${CACHE_SCHEMA}`;

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/brand/demir-logo.avif"];

const CACHE_LIMITS = {
  [STATIC_CACHE]: 250,
  [IMAGE_CACHE]: 150,
  [ASSET_CACHE]: 60,
  [PAGE_CACHE]: 40,
};

// Respostas maiores que isso não vão para o cache (ex.: banners originais em PNG).
const MAX_CACHEABLE_BYTES = 3 * 1024 * 1024;
// Se a rede não responder nesse tempo e houver cópia em cache, a cópia é exibida.
const NAVIGATION_TIMEOUT_MS = 10000;

/**
 * Páginas públicas cujo HTML NÃO contém dados do usuário (a sessão é resolvida no cliente).
 * Somente estas podem ser guardadas para uso offline. Qualquer rota fora desta lista é
 * tratada como privada (Network Only).
 */
const PUBLIC_PAGE_PATTERNS = [
  /^\/$/,
  /^\/produtos\/?$/,
  /^\/produto\/[^/]+\/?$/,
  /^\/buscar\/?$/,
  /^\/carrinho\/?$/, // itens ficam no localStorage, o HTML é apenas a casca da página
  /^\/duvidas-frequentes\/?$/,
  /^\/fale-conosco\/?$/,
  /^\/politica-de-privacidade\/?$/,
  /^\/trocas-e-devolucoes\/?$/,
];

const BYPASS_PREFIXES = [
  "/api/",
  "/_vercel/",
  "/.well-known/",
  "/sw.js",
  "/manifest.webmanifest",
];

const PUBLIC_ASSET_PATTERN = /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i;
const TRACKING_PARAMS = /^(?:utm_|fbclid$|gclid$|gbraid$|wbraid$|msclkid$)/i;

/* ------------------------------------------------------------------ */
/* Ciclo de vida                                                       */
/* ------------------------------------------------------------------ */

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })));

      // Primeira instalação: assume o controle imediatamente.
      // Atualizações ficam em "waiting" até o usuário tocar em "Atualizar"
      // (ou até todas as janelas do app serem fechadas), evitando trocar a versão no meio de um fluxo.
      if (!self.registration.active) {
        await self.skipWaiting();
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PRECACHE, STATIC_CACHE, IMAGE_CACHE, ASSET_CACHE, PAGE_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !keep.has(key))
          .map((key) => caches.delete(key))
      );

      // Navigation preload: a requisição da página começa em paralelo ao boot do SW (não piora TTFB/LCP).
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (type === "CLEAR_PAGE_CACHE") {
    // Disparado no logout: remove qualquer HTML guardado deste aparelho.
    event.waitUntil(caches.delete(PAGE_CACHE));
    return;
  }

  if (type === "GET_VERSION" && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});

/* ------------------------------------------------------------------ */
/* Roteamento                                                          */
/* ------------------------------------------------------------------ */

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (request.headers.has("authorization") || request.headers.has("range")) return;

  const url = new URL(request.url);

  // Origens externas (Supabase, Asaas, WhatsApp, Google Maps, Vercel Analytics...) → sempre rede.
  if (url.origin !== self.location.origin) return;
  if (BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event, url));
    return;
  }

  // Payloads RSC/prefetch do App Router: deixamos o Next.js lidar (sem cache do SW).
  if (isRscRequest(request, url)) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname === "/_next/image") {
    event.respondWith(staleWhileRevalidate(event, request, IMAGE_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/")) return;

  if (PUBLIC_ASSET_PATTERN.test(url.pathname) && !url.pathname.startsWith("/banners/")) {
    event.respondWith(staleWhileRevalidate(event, request, ASSET_CACHE));
  }
});

function isRscRequest(request, url) {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-Prefetch") ||
    url.searchParams.has("_rsc")
  );
}

function isPublicPage(url) {
  return PUBLIC_PAGE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

/* ------------------------------------------------------------------ */
/* Estratégias                                                         */
/* ------------------------------------------------------------------ */

async function handleNavigation(event, url) {
  const network = (async () => {
    const preloaded = await event.preloadResponse;
    return preloaded || fetch(event.request);
  })();

  // Rotas privadas (conta, pedidos, checkout, login...): Network Only.
  if (!isPublicPage(url)) {
    try {
      return await network;
    } catch {
      return offlineResponse();
    }
  }

  // Páginas públicas: Network First, cache apenas como plano B.
  const cacheKey = pageCacheKey(url);
  const cache = await caches.open(PAGE_CACHE);

  const update = network.then(async (response) => {
    if (isCacheablePage(response)) {
      await cache.put(cacheKey, response.clone());
      await trimCache(PAGE_CACHE);
    }
    return response;
  });
  event.waitUntil(update.catch(() => undefined));

  const cached = await cache.match(cacheKey);

  try {
    return cached ? await withTimeout(update, NAVIGATION_TIMEOUT_MS, cached) : await update;
  } catch {
    return cached || offlineResponse();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheableAsset(response)) {
    await cache.put(request, response.clone());
    await trimCache(cacheName);
  }
  return response;
}

async function staleWhileRevalidate(event, request, cacheName) {
  const cache = await caches.open(cacheName);
  // caches.match procura em todos os caches (inclui o precache da página offline).
  const cached = await caches.match(request);

  const network = fetch(request).then(async (response) => {
    if (isCacheableAsset(response)) {
      await cache.put(request, response.clone());
      await trimCache(cacheName);
    }
    return response;
  });

  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */

async function offlineResponse() {
  const cached = await caches.match(OFFLINE_URL);
  if (cached) return cached;
  return new Response(
    "<!doctype html><meta charset=utf-8><title>Sem conexão</title><p>Sem conexão. Verifique sua internet e tente novamente.</p>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function pageCacheKey(url) {
  const key = new URL(url.href);
  key.hash = "";
  for (const param of [...key.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(param)) key.searchParams.delete(param);
  }
  return key.href;
}

function hasForbiddenCacheControl(response) {
  const cacheControl = (response.headers.get("Cache-Control") || "").toLowerCase();
  return cacheControl.includes("no-store") || cacheControl.includes("private");
}

function isTooLarge(response) {
  const length = Number(response.headers.get("Content-Length") || 0);
  return length > MAX_CACHEABLE_BYTES;
}

function isCacheableAsset(response) {
  return (
    !!response &&
    response.status === 200 &&
    response.type === "basic" &&
    !hasForbiddenCacheControl(response) &&
    !isTooLarge(response)
  );
}

/**
 * HTML de página pública. O Next.js envia "private, no-store" em páginas dinâmicas mesmo
 * quando o conteúdo é público (catálogo), por isso aqui a decisão é feita pela lista
 * PUBLIC_PAGE_PATTERNS e não pelo Cache-Control. Redirecionamentos nunca são guardados.
 */
function isCacheablePage(response) {
  if (!response || response.status !== 200 || response.type !== "basic" || response.redirected) {
    return false;
  }
  const contentType = response.headers.get("Content-Type") || "";
  return contentType.includes("text/html") && !isTooLarge(response);
}

async function trimCache(cacheName) {
  const limit = CACHE_LIMITS[cacheName];
  if (!limit) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  // Cache API mantém ordem de inserção: remove as entradas mais antigas.
  await Promise.all(keys.slice(0, keys.length - limit).map((key) => cache.delete(key)));
}

function withTimeout(promise, ms, fallback) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
