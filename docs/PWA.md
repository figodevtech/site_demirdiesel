# PWA — Demir Diesel

O site da Demir Diesel é também um **Progressive Web App** instalável. Não existe um segundo
frontend: o app instalado é exatamente a mesma aplicação Next.js (SSR, ISR, Route Handlers,
Supabase SSR, checkout Asaas e integração ERP), apenas aberta em janela própria (`standalone`).

```text
Next.js / Vercel
        │
        ├── Desktop Web
        ├── Mobile Web
        └── PWA instalada ── mesma aplicação, mesmo backend, mesmas APIs
```

Nada foi convertido para export estático (`output: "export"` **não** é usado).

---

## 1. Arquivos

| Arquivo | Papel |
| --- | --- |
| `app/manifest.ts` | Web App Manifest (`/manifest.webmanifest`): nome, ícones, cores, `start_url`, `scope`, atalhos. |
| `lib/pwa/config.ts` | Cores (`theme_color`/`background_color`), versão do deploy e rotas "silenciosas". |
| `lib/pwa/service-worker.js` | Código-fonte do Service Worker (JavaScript puro, sem biblioteca). |
| `app/sw.js/route.ts` | Serve `/sw.js` estático no build, embutindo a versão do deploy no arquivo. |
| `public/offline.html` | Página offline autônoma (não depende do JS do Next). |
| `public/icons/*` | Ícones 192/512 (`any`), 192/512 (`maskable`) e 96 (atalhos). |
| `scripts/generate-pwa-icons.mjs` | Regenera os ícones a partir de `app/icon.png`. |
| `components/pwa/PwaProvider.tsx` | Monta os recursos da PWA no layout e marca `<html data-display-mode>`. |
| `components/pwa/ServiceWorkerManager.tsx` | Registro do SW, aviso de nova versão, limpeza de cache no logout. |
| `components/pwa/InstallPrompt.tsx` | Convite discreto de instalação (Android) e instruções (iPhone/iPad). |
| `components/pwa/OfflineIndicator.tsx` | Aviso "Você está offline" dentro do app. |
| `lib/pwa/display-mode.ts` | Detecção de `standalone`, TWA e Safari do iOS. |
| `hooks/use-virtual-keyboard.ts` | Recolhe barras fixas inferiores enquanto o teclado virtual está aberto. |

Ajustes em arquivos existentes: `app/layout.tsx` (viewport `viewport-fit=cover`, metadados Apple,
`formatDetection`), `next.config.ts` (versão do deploy + headers do `/sw.js`), `app/globals.css`
(safe areas, anti-zoom do iOS, estilos standalone), `RouteShell`, `BottomNav`, `Header`,
`ProductActions`, `ui/dialog`, `ui/sheet`, guards de login (`router.replace`) e o checkout
(pagamento na mesma janela quando instalado — ver seção 6).

---

## 2. Manifest e ícones

- `id` e `start_url` = `/`, `scope` = `/`, `display` = `standalone`, `lang` = `pt-BR`.
- `theme_color` `#0F172A` (grafite Demir, igual ao `<meta name="theme-color">`).
- `background_color` `#F8FAFC` (fundo do site) — a splash do Android abre com o ícone sobre o
  mesmo fundo da página, sem "flash" de cor diferente ao carregar.
- Ícones `any` usam o mesmo desenho do favicon atual; os `maskable` centralizam o "D" na zona
  segura (80%) para não ser cortado por máscaras circulares/squircle do Android.
- iOS usa `app/apple-icon.png` (180×180, fundo opaco) via `<link rel="apple-touch-icon">`.
- Atalhos (pressionar o ícone no Android): Catálogo, Buscar, Meus pedidos, Carrinho.

Para regenerar os ícones após trocar `app/icon.png`:

```bash
node scripts/generate-pwa-icons.mjs
```

---

## 3. Service Worker

### Por que sem biblioteca?

O Next.js 16 compila com Turbopack por padrão. `next-pwa` está abandonado e o `@serwist/next`
depende de plugin de webpack. A documentação oficial do Next.js recomenda um Service Worker
manual — que também deixa a política de cache totalmente explícita e auditável.

### Como é servido e versionado

- O código fica em `lib/pwa/service-worker.js` e é servido em `/sw.js` por `app/sw.js/route.ts`
  (`force-static`: gerado uma vez no build, sem custo de servidor).
- O placeholder `__APP_VERSION__` recebe a versão do deploy, definida em `next.config.ts`:
  `NEXT_PUBLIC_APP_VERSION` → `VERCEL_GIT_COMMIT_SHA` → `VERCEL_DEPLOYMENT_ID` → versão do `package.json`.
- Cada deploy gera um `/sw.js` com bytes diferentes, então o navegador detecta a atualização
  sozinho. Headers: `Cache-Control: no-cache, no-store, must-revalidate` e registro com
  `updateViaCache: "none"`.
- O registro só acontece em produção, depois do evento `load` (não compete com LCP).
  Para testar em `npm run dev`, use `NEXT_PUBLIC_ENABLE_SW_DEV=true` (não recomendado no dia a dia).
- **Navigation preload** ativado: a requisição da página começa em paralelo ao boot do SW,
  então o TTFB não piora.

### Políticas de cache

| Recurso | Estratégia | Cache |
| --- | --- | --- |
| `/_next/static/*` (JS, CSS, fontes do `next/font`) | **Cache First** — arquivos imutáveis com hash | `demir-static-v1` (250 itens) |
| `/_next/image?...` (imagens de produto otimizadas, inclusive do Supabase Storage) | **Stale While Revalidate** | `demir-images-v1` (150) |
| Arquivos públicos `.png/.jpg/.webp/.avif/.svg/.ico/.woff2` (ícones, logo) | **Stale While Revalidate** | `demir-assets-v1` (60) |
| Navegação em páginas públicas: `/`, `/produtos`, `/produto/*`, `/buscar`, `/carrinho`, `/duvidas-frequentes`, `/fale-conosco`, `/politica-de-privacidade`, `/trocas-e-devolucoes` | **Network First** (cache só se a rede falhar ou demorar > 10 s) | `demir-pages-v1` (40) |
| Navegação em qualquer outra rota (`/conta*`, `/pedidos`, `/enderecos`, `/favoritos`, `/checkout`, `/sucesso`, `/login`, `/registro`, ...) | **Network Only** → `offline.html` sem rede | — |
| `/api/*` (checkout, account, pedidos, integrations/ERP, webhooks/Asaas, catálogo) | **Não interceptado** (Network Only) | — |
| Requisições com `Authorization` ou `Range`, métodos ≠ GET | **Não interceptado** | — |
| Payloads RSC/prefetch do App Router (`RSC: 1`, `?_rsc=`) | **Não interceptado** | — |
| Supabase (REST, Auth, Realtime), Asaas, WhatsApp, Google Maps, Vercel Analytics — qualquer origem externa | **Não interceptado** | — |
| `/banners/*` e respostas > 3 MB | Nunca vão para o cache | — |
| `/offline.html`, ícone 192, logo | Precache na instalação | `demir-precache-<versão>` |

**Sobre o Supabase:** o pedido original sugeria "Network First" para o Supabase. Como as chamadas
REST levam o token do usuário e retornam dados privados (perfil, favoritos, pedidos), qualquer
cache delas arriscaria expor dados de uma conta para outra no mesmo aparelho. Por isso o SW
**não intercepta** o Supabase — vai sempre direto à rede, exatamente como antes da PWA. As
imagens do Storage continuam cacheadas porque passam por `/_next/image`.

**Sobre páginas públicas com `Cache-Control: private`:** páginas dinâmicas do Next (ex.:
`/produtos`, `/produto/[id]`) saem com `private, no-store` mesmo tendo conteúdo público. O HTML
delas não contém dados do usuário (a sessão é resolvida no cliente pelo `AuthProvider`), por isso
a decisão de cachear é feita pela lista fechada `PUBLIC_PAGE_PATTERNS` no SW. **Se alguma dessas
páginas passar a renderizar dados do usuário no servidor, remova-a da lista.**

Ao mudar a política, incremente `CACHE_SCHEMA` em `lib/pwa/service-worker.js` — os caches antigos
são apagados no `activate`.

---

## 4. Segurança

Nunca vão para o cache do Service Worker: tokens, cookies, respostas de `/api/checkout`,
`/api/account/*`, `/api/pedidos/*`, `/api/integrations/*`, `/api/webhooks/*`, dados de cartão,
dados de pagamento, HTML de conta/pedidos/endereços/favoritos/checkout/login, chamadas ao
Supabase e ao Asaas.

Camadas extras:

- Lista **fechada** de páginas cacheáveis (o padrão é Network Only).
- Redirecionamentos e respostas que não sejam `200` + `text/html` não são salvos.
- No **logout** ou troca de conta, o app envia `CLEAR_PAGE_CACHE` ao SW e o HTML guardado é apagado.
- O carrinho continua no `localStorage` (como antes); o checkout sempre revalida preço e estoque no servidor.
- Nenhuma variável server-side foi exposta: a única variável nova no cliente é
  `NEXT_PUBLIC_APP_VERSION` (hash do commit).

---

## 5. Offline

- Sem conexão, páginas públicas já visitadas abrem do cache (home, catálogo, produtos vistos,
  carrinho com os itens do `localStorage`).
- Rotas privadas ou não visitadas mostram `public/offline.html`: identidade Demir, botão
  **Tentar novamente**, recarga automática quando a conexão volta e lista das páginas disponíveis
  offline. Checkout, login e conta exibem uma mensagem explicando que precisam de conexão.
- Dentro do app, `OfflineIndicator` mostra uma pílula "Você está offline" no topo.

---

## 6. Experiência de app (standalone)

- `<html data-display-mode="standalone|browser">` é definido por `PwaProvider`
  (`matchMedia("(display-mode: standalone)")`, `navigator.standalone` do iOS e referrer `android-app://` da TWA).
- Em standalone: sem destaque cinza de toque e sem menu de "abrir link" ao pressionar links da navegação.
- `viewport-fit=cover` ativa `env(safe-area-inset-*)`:
  - **BottomNav** e **CTA fixo do produto**: padding inferior (home indicator/barra de gestos) e laterais.
  - **Header**: padding superior.
  - **body**: padding lateral (notch em paisagem).
  - **RouteShell**: espaçador após o rodapé com a altura da barra fixa + safe area — o fim do
    rodapé não fica mais escondido atrás da BottomNav.
- **Teclado virtual**: BottomNav e CTA do produto recolhem enquanto um campo de texto está focado
  em tela touch (não cobrem o campo, ex.: CEP).
- **iOS**: inputs com fonte < 16px fazem o Safari dar zoom ao focar; uma regra restrita ao WebKit
  do iOS força 16px nesses campos em telas pequenas. Android e desktop não mudam.
- `formatDetection: telephone=no` evita que o Safari transforme referências numéricas de peças em links de telefone.
- `apple-mobile-web-app-status-bar-style: default`: barra de status opaca sobre o header branco.

### Navegação

- Links internos permanecem no app (`scope: "/"`).
- WhatsApp, mapas, DANFE, rastreio e redes sociais já usam `target="_blank"` e abrem fora do app.
- Guards de login (`/checkout`, `/pedidos`, `/enderecos`, `/favoritos`) passaram a usar
  `router.replace` — o botão Voltar do Android não fica preso em "login → página protegida → login".
- **Checkout no app instalado:** popups (`window.open`) são instáveis em PWA standalone. Quando
  instalado, o pagamento Asaas abre na própria janela e o Asaas volta para `/sucesso?orderId=...`
  (callback `autoRedirect` já configurado em `/api/checkout`). No navegador o fluxo de popup
  continua igual. Cartão salvo não usa popup em nenhum dos casos.

---

## 7. Instalação

### Android (Chrome, Edge, Samsung Internet)

O Chrome dispara `beforeinstallprompt` quando o site é instalável. O app guarda o evento e mostra
o convite **somente**:

- em celular/tablet (tela touch), fora de checkout/login/registro/sucesso;
- na **2ª visita** (sessões diferentes) **ou** após **3 páginas** na mesma sessão;
- 4 s após a navegação, sem cobrir campos em edição.

"Agora não" silencia por 30 dias (`localStorage: demir-pwa-install-dismissed-at`). Após instalar,
o convite nunca mais aparece (`demir-pwa-installed` + evento `appinstalled`). O menu do navegador
("Instalar app") continua disponível a qualquer momento.

### iPhone / iPad

O iOS não tem `beforeinstallprompt`. No **Safari** (e apenas nele — navegadores in-app como
Instagram/WhatsApp e outros browsers são excluídos), seguindo as mesmas regras de frequência, o
convite mostra: **Compartilhar → Adicionar à Tela de Início**.

---

## 8. Atualizações

1. Deploy novo → `/sw.js` muda → o navegador instala o SW novo em segundo plano
   (verificado em cada navegação e, para apps abertos por muito tempo, ao voltar para o app a cada 30 min).
2. A primeira instalação ativa imediatamente. Uma **atualização** fica em "waiting" e o usuário
   vê o toast **"Nova versão disponível — [Atualizar]"** (nunca em checkout/login/sucesso).
3. Ao tocar em Atualizar: `SKIP_WAITING` → `controllerchange` → **um único** reload.
   O reload só acontece por ação do usuário, então não há loop.
4. Se o usuário ignorar, a versão nova assume quando todas as janelas do app forem fechadas.
   Como o HTML é Network First, qualquer abertura nova já recebe o HTML/JS do deploy atual.

---

## 9. Como testar localmente

O SW só registra em build de produção. `localhost` é contexto seguro (não precisa de HTTPS).

```bash
npm run build
npm run start            # http://localhost:3000
```

No Chrome: DevTools → **Application**:

- **Manifest**: sem erros/avisos de installability; ícones `any` e `maskable` visíveis.
- **Service workers**: `/sw.js` "activated and is running".
- **Cache storage**: `demir-*`. Confira que não há `/api/*`, `/conta`, `/checkout` ou `/login`.

**Offline:** visite home/catálogo/um produto → Network → *Offline* (ou pare o servidor) →
recarregue. Páginas visitadas abrem; `/checkout`, `/conta` e `/login` mostram a tela offline.

**Atualização:** com o app aberto, rode outro build com versão diferente e recarregue:

```bash
NEXT_PUBLIC_APP_VERSION=teste-2 npm run build && npm run start
```

O toast "Nova versão disponível" deve aparecer; Atualizar recarrega uma vez.

**Celular na mesma rede:** a instalação exige HTTPS fora de `localhost`. Use um preview da Vercel,
ou `chrome://inspect` com *port forwarding* da porta 3000 do Android para o computador.

### Verificar o modo standalone

- No app instalado: `document.documentElement.dataset.displayMode === "standalone"`.
- DevTools → Rendering → *Emulate CSS media feature display-mode* → `standalone`.
- Android: `chrome://inspect` → inspecione o app instalado.
- iOS: Safari do Mac → menu Desenvolver → selecione o app da tela de início.

### Limpar o cache / remover o SW

- DevTools → Application → **Storage** → *Clear site data*.
- Ou, no console: `navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister())); caches.keys().then(k => k.forEach(c => caches.delete(c)))`.
- Celular: Configurações do site → Limpar dados (Android) / Ajustes → Safari → Avançado → Dados dos Sites (iOS).
- **Desativar em produção (emergência):** troque o conteúdo de `lib/pwa/service-worker.js` por um
  SW que apague os caches `demir-*` e chame `self.registration.unregister()` e faça deploy.
  Não remova a rota `/sw.js` simplesmente: o SW antigo continuaria controlando os aparelhos até expirar.

### Lighthouse

O Lighthouse 12+ removeu a categoria "PWA". Use DevTools → Application → Manifest
(installability) e o Lighthouse de Performance/Acessibilidade/Boas práticas em modo mobile.
Requisitos atendidos: HTTPS (Vercel), manifest válido, SW ativo com handler de `fetch`, ícones
192/512 e maskable, viewport, theme-color, fallback offline.

---

## 10. Cuidados com checkout e autenticação

- Nunca adicione `/checkout`, `/sucesso`, `/conta`, `/pedidos`, `/enderecos`, `/favoritos`,
  `/login` ou `/registro` em `PUBLIC_PAGE_PATTERNS`.
- Nunca intercepte `/api/*` nem origens externas no SW.
- Ao criar páginas novas que mostram dados do usuário, não faça nada: o padrão é Network Only.
- O toast de atualização nunca aparece nas rotas de `PWA_QUIET_ROUTES` (`lib/pwa/config.ts`) para
  não recarregar no meio de um pagamento.

---

## 11. Riscos conhecidos / limitações

- Páginas públicas vistas offline podem mostrar preço/estoque antigos; o checkout revalida tudo no servidor.
- Ao abrir o pagamento na mesma janela (app instalado), se o cliente gerar boleto/Pix e sair da
  página do Asaas sem concluir, ele volta ao app pelo botão Voltar/fechar e acompanha em **Meus pedidos**.
- iOS sem *splash screens* específicas: o iOS mostra tela clara (compatível com o fundo do site).
  Gerar `apple-touch-startup-image` por modelo de iPhone é opcional.
- O botão Voltar do Android fecha o app quando está na tela inicial (comportamento padrão de apps)
  e não fecha menus/sheets abertos — fecha a página. Interceptar o Voltar para fechar sheets é uma
  melhoria futura possível.
- Os banners originais em `public/banners` (3–8 MB cada) não são usados por nenhuma página
  (`BannerCarousel` não está montado). Se voltarem a ser usados, converta para WebP/AVIF ≤ 300 KB
  e mantenha `next/image` com `sizes` adequado. O SW nunca cacheia `/banners/*`.

---

## 12. Experiência de app (UX mobile)

Princípio: **todo toque relevante produz algo na tela em menos de ~100 ms**.

| Fluxo | O que foi feito |
| --- | --- |
| Navegação | `app/produtos/loading.tsx` e `app/produto/[id]/loading.tsx` mostram skeletons com o layout real no instante do toque (medido: ~60 ms). Filtros/ordenação/paginação usam `CatalogTransitionProvider`: barra de progresso + grade esmaecida, sem trocar a tela por skeleton e sem fechar o painel de filtros. |
| BottomNav | Início · Buscar · Favoritos · Carrinho · Conta. Fundo sólido (sem blur), pílula da aba ativa animada (`motion` `layoutId`), ícone com estado pressionado, badge que "pula" ao mudar, recolhe só quando o teclado está realmente aberto (`visualViewport`). |
| Busca | `/buscar` é uma tela de app (o header some no mobile): buscas recentes, mais procurados, categorias. `useCatalogSearch`: debounce 200 ms, cancela requisições antigas, cache em memória e mantém a lista anterior esmaecida enquanto carrega (sem flicker). O termo fica na URL — ao voltar de um produto a busca reaparece na hora. |
| Produto | Galeria com swipe nativo (scroll-snap) e indicador; CTA fixo "Adicionar" (48px) com confirmação animada; favorito otimista com "pop"; CEP com teclado numérico, máscara e Enter = calcular. |
| Carrinho | Skeleton até ler o `localStorage` (acabou o flash de "carrinho vazio"); stepper de 40px com número animado; remover com animação e **Desfazer**; barra "Finalizar compra" com total acima da BottomNav. |
| Checkout | Barra fixa com total + "Pagar com Pix/Cartão/Boleto" ao alcance do polegar; endereços como cartões tocáveis com skeleton; cadastro de endereço em **bottom sheet** no celular, CEP que preenche o endereço sozinho ao completar 8 dígitos e foca o "Número"; teclados/autocomplete corretos (`lib/forms/mobile-inputs.ts`). |
| Feedback | Toasts claros com ação ("Ver carrinho", "Desfazer", "Entrar"); `.pressable` e `:active` funcionando no iOS (listener `touchstart`); `touch-action: manipulation`; sheets em 250/200 ms; skeletons com shimmer em pedidos, endereços, favoritos e conta. |
| App instalado | Faixa promocional e lista de categorias do rodapé ocultas (`.pwa-browser-only`); "voltar" seguro (`useSafeBack`) quando o app abre direto numa tela pelo atalho. |

### Haptics (preparado para Capacitor)

`lib/haptics.ts` expõe `haptic("selection" | "light" | "medium" | "success" | "error")`, já chamado
em: troca de aba, adicionar/remover do carrinho, quantidade, favoritar, finalizar compra/pagar,
erros de validação e pagamento confirmado.

- Hoje (web): `navigator.vibrate` curto **somente no app instalado no Android** e respeitando
  `prefers-reduced-motion`. No navegador e no iOS web não faz nada.
- Capacitor: registre um adapter no boot — nenhum componente precisa mudar:

  ```ts
  import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
  import { setHapticsAdapter } from "@/lib/haptics";

  setHapticsAdapter((kind) => {
    if (kind === "success") return Haptics.notification({ type: NotificationType.Success });
    if (kind === "error") return Haptics.notification({ type: NotificationType.Error });
    return Haptics.impact({ style: kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
  });
  ```

---

## Publicação futura

### Google Play (Trusted Web Activity)

A PWA já atende aos requisitos de uma TWA: HTTPS, `start_url`/`scope` = `/`, `display: standalone`,
ícones 512 + maskable, Service Worker com fallback offline e detecção de TWA
(`document.referrer` começa com `android-app://`).

1. Gere o projeto Android com **Bubblewrap** (`npx @bubblewrap/cli init --manifest https://demirdiesel.com.br/manifest.webmanifest`)
   ou com o **PWABuilder** (pwabuilder.com). Sugestão de package: `br.com.demirdiesel.app`.
2. Gere a keystore de assinatura (ou use a *Play App Signing*) e guarde-a com segurança.
3. Obtenha o **SHA-256** do certificado de assinatura do app no Play Console
   (*Configuração → Integridade do app → Certificado da chave de assinatura*).
4. Publique o Digital Asset Links em `public/.well-known/assetlinks.json`
   (o Next serve arquivos de `public/` na raiz, e o SW não intercepta `/.well-known/`):

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "br.com.demirdiesel.app",
         "sha256_cert_fingerprints": ["<SHA-256 REAL DO PLAY CONSOLE>"]
       }
     }
   ]
   ```

   **Não use fingerprints fictícios** — sem o valor real a TWA mostra a barra de endereço do navegador.
   Valide em `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://demirdiesel.com.br&relation=delegate_permission/common.handle_all_urls`.
5. Prepare a ficha da loja: ícone 512, *feature graphic* 1024×500, capturas de tela, política de
   privacidade (`/politica-de-privacidade`) e formulário de segurança de dados (o app coleta dados
   de conta e pedidos; pagamentos são processados pelo Asaas).
6. Pagamentos: produtos físicos podem usar o checkout web (Asaas) — a regra de Google Play Billing
   vale para bens/serviços digitais.
7. Opcional: adicionar `screenshots` (com `form_factor`) ao manifest para a UI de instalação mais
   rica do Android.

### iOS / App Store (Capacitor)

A Apple não aceita "web clips" e restringe apps que sejam apenas um site empacotado
(guideline 4.2). Caminho recomendado quando houver demanda:

1. Criar um projeto **Capacitor** apontando `server.url` para `https://demirdiesel.com.br`
   (mesma aplicação, sem segundo frontend), ou empacotar um shell mínimo.
2. Agregar valor nativo para a revisão: notificações push de status do pedido, leitor de código
   de barras/QR para referência de peças, compartilhamento nativo.
3. Configurar *Universal Links* (`apple-app-site-association` em `/.well-known/`) para links do
   site abrirem no app.
4. Checkout: produtos físicos podem continuar no checkout web (não exige In-App Purchase).

Enquanto isso, usuários de iPhone já podem instalar pelo Safari (Compartilhar → Adicionar à Tela
de Início), com ícone, tela cheia e o mesmo comportamento offline descrito acima.
