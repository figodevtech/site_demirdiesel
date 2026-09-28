# REMODELAÇÃO COMPLETA DO SITE DEMIR DIESEL

Você tem liberdade para remodelar completamente o site da Demir Diesel.

Trabalhe como um Senior Product Designer + Senior Front-end/Next.js Engineer + UX Engineer.

## PROJETOS DE REFERÊNCIA

Projeto que será alterado:

`figodevtech/site_demirdiesel`

Projeto de referência visual, arquitetural e de UX:

`figodevtech/itamatayveiculos-site`

Banco de dados da Demir Diesel:

Supabase project:
`lkpwaiynvnfedvxcjmrp`

Antes de alterar qualquer arquivo, analise completamente os dois repositórios.

Não copie simplesmente o site Itamatay.

Use o Itamatay como referência para:

- organização arquitetural;
- hierarquia visual;
- espaçamento;
- responsividade;
- componentização;
- uso de animações;
- experiência de navegação;
- header;
- busca;
- cards;
- tratamento de imagens;
- experiência mobile;
- organização do Supabase;
- Server Components;
- separação entre Supabase client/server;
- performance;
- SEO.

A Demir Diesel deve possuir identidade própria, voltada para:

**linha diesel, caminhões, módulos eletrônicos, peças, motores, injeção, componentes e oficina especializada.**

---

# 1. NÃO REESCREVA A STACK SEM NECESSIDADE

O projeto Demir já utiliza tecnologias modernas.

Mantenha preferencialmente:

- Next.js atual;
- App Router;
- React 19;
- TypeScript;
- Tailwind CSS 4;
- Supabase;
- componentes já úteis;
- integrações existentes.

Pode adicionar bibliotecas modernas quando trouxerem benefício real.

Use o `motion`/Motion para animações discretas, seguindo a abordagem do Itamatay.

Não transforme tudo em Client Component.

Priorize:

Server Components → padrão  
Client Components → somente quando houver interação.

---

# 2. PRESERVE O QUE JÁ FUNCIONA

O site da Demir já possui fluxos importantes.

Não remova nem quebre:

- catálogo;
- busca;
- categorias;
- produto;
- favoritos;
- carrinho;
- checkout;
- login;
- conta;
- endereços;
- pedidos;
- contato;
- APIs existentes;
- integração de pagamento;
- webhook Pagar.me;
- autenticação;
- regras de negócio existentes.

Você pode remodelar completamente a interface desses recursos.

Antes de alterar checkout, autenticação ou pagamento, entenda o fluxo existente inteiro.

Design novo não pode significar regressão funcional.

---

# 3. NOVA IDENTIDADE VISUAL

Crie uma interface completamente nova para a Demir Diesel.

O resultado deve transmitir:

**tecnologia + confiança + mecânica pesada + comércio profissional de peças diesel.**

Evite aparência de:

- template genérico;
- marketplace barato;
- dashboard administrativo;
- site institucional antigo;
- excesso de cards;
- bordas em tudo;
- gradientes aleatórios;
- animações exageradas.

Use uma linguagem visual industrial sofisticada.

Aproveite as cores existentes da identidade Demir, mas crie um design system consistente com:

- cores primárias;
- cores neutras;
- foreground/background;
- superfícies;
- borders;
- radius;
- shadows;
- typography scale;
- spacing scale;
- estados hover/focus/disabled;
- badges;
- botões;
- inputs;
- cards.

Use bastante espaço negativo e hierarquia tipográfica.

A interface deve parecer construída especificamente para a Demir Diesel.

---

# 4. HOME NOVA

Recrie completamente a página inicial.

A home deve vender três ideias imediatamente:

1. Quem é a Demir Diesel.
2. O que ela vende/faz.
3. Como encontrar rapidamente uma peça.

## HERO

A primeira dobra deve ter grande impacto visual, mas sem ficar exageradamente alta.

Pode utilizar imagem/fotografia relacionada a motores, caminhões, módulos ou oficina.

Headline curta e forte.

Exemplo conceitual:

“Tecnologia e peças para manter sua operação rodando.”

Não copie esse texto obrigatoriamente. Escreva algo apropriado à marca.

Inclua busca de produtos diretamente no Hero.

Placeholder contextual, por exemplo:

“Busque por peça, módulo, referência ou fabricante”

A busca é uma das ações mais importantes do site.

No desktop, ela pode ter grande destaque.

No mobile, deve parecer a busca principal de um aplicativo.

---

# 5. CATÁLOGO REAL INTEGRADO AO ERP

O catálogo NÃO deve ter dados mockados.

Utilize diretamente o banco Supabase da Demir.

Dados encontrados:

Tabela:

`produto`

Principais campos públicos úteis:

- id
- titulo
- tituloMarketplace
- descricao
- descricaoMarketplace
- precovenda
- estoque
- referencia
- fabricante
- grupo_produto_id
- imgUrl
- conservacao
- destaque
- exibirPdv
- is_deleted
- status_estoque
- codigobarras, somente quando realmente necessário

Relacionamento:

`produto.grupo_produto_id -> produtogrupo.id`

Tabela:

`produtogrupo`

Campos relevantes:

- id
- nome
- descricao
- ativo
- exibirPdv

Tabela de galeria:

`produto_imagem`

Campos:

- id
- produto_id
- url
- path
- ordem
- createdat

Há atualmente aproximadamente:

- 1.200 produtos;
- 1.192 produtos ativos/exibíveis;
- 969 com estoque positivo;
- 923 com imagem principal;
- 1.342 imagens adicionais;
- 32 grupos;
- nenhum produto marcado atualmente como `destaque=true`.

Existe bucket público:

`produto_imagem`

Use essas estruturas reais.

---

# 6. NÃO EXPONHA CAMPOS INTERNOS DO ERP

Hoje existem consultas usando `select("*")`.

Remova essa abordagem do frontend público.

O site não deve baixar campos internos como:

- preço de compra;
- último valor de compra;
- dados fiscais;
- CST;
- CSOSN;
- PIS;
- COFINS;
- IBS/CBS;
- dados de auditoria;
- created_by;
- updated_by;
- deleted_by;
- dados internos que não tenham finalidade no site.

Crie um modelo/DTO específico para catálogo público.

Exemplo conceitual:

`PublicProduct`

O frontend recebe somente o necessário.

---

# 7. REFATORE A CAMADA SUPABASE

Use como referência a separação existente no Itamatay.

Evite manter tudo dentro de:

`lib/supabase.ts`

Crie uma estrutura semelhante a:

`lib/supabase/client.ts`  
`lib/supabase/server.ts`

e uma camada de domínio como:

`lib/catalog/products.ts`  
`lib/catalog/categories.ts`  
`lib/catalog/search.ts`  
`lib/catalog/types.ts`

A `SUPABASE_SERVICE_ROLE_KEY` jamais deve fazer parte de código potencialmente executável no browser.

Não utilize service role para consultas públicas comuns do catálogo.

Use as políticas apropriadas do Supabase.

Gere/utilize tipos TypeScript baseados no schema real.

Não crie schemas ou tabelas novas sem necessidade.

---

# 8. REGRAS PARA PRODUTOS VISÍVEIS

Por padrão, o catálogo público deve considerar:

`is_deleted = false`

e

`exibirPdv = true`

Categorias devem considerar:

`ativo = true`

Produtos sem estoque podem continuar aparecendo quando comercialmente apropriado, mas devem possuir estado visual claro como:

“Indisponível”

ou

“Consulte disponibilidade”.

Não exponha informações internas desnecessárias.

---

# 9. IMAGENS

A imagem principal pode vir de:

`produto.imgUrl`

A galeria deve vir de:

`produto_imagem`

ordenada por:

`ordem`

Não faça consultas individuais de imagens para cada produto.

Evite N+1 queries.

Na listagem, carregue apenas a imagem necessária.

Na página do produto, carregue a galeria.

Use:

`next/image`

sempre que tecnicamente apropriado.

Configure corretamente o domínio do Supabase em `next.config`.

Crie fallback visual próprio da Demir para produtos sem foto.

Não utilize `placehold.co` no produto final.

O fallback deve parecer parte do design da marca.

---

# 10. PRODUTOS EM DESTAQUE

O banco possui o campo:

`destaque`

Porém atualmente nenhum produto está marcado como destaque.

Implemente a lógica preparada para usar:

`destaque = true`

quando houver produtos configurados.

Enquanto não houver nenhum, a seção da Home deve usar fallback inteligente, por exemplo:

produtos exibíveis + com estoque + com imagem, ordenados pelos mais recentes.

Não deixe a Home vazia.

Quando produtos passarem a ser marcados como destaque no ERP, eles devem assumir automaticamente essa seção.

---

# 11. BUSCA

A busca precisa ser significativamente melhor que a atual.

Permita pesquisar pelo menos:

- título;
- descrição;
- título Marketplace;
- referência;
- fabricante;
- código quando apropriado.

A busca deve tolerar capitalização.

Evite fazer download de 1.200 produtos para filtrar no browser.

Pesquise no banco.

Debounce as interações instantâneas quando necessário.

Ao enviar uma pesquisa, utilize URL compartilhável, por exemplo:

`/buscar?q=volvo`

ou

`/produtos?q=volvo`

Filtros também devem ser refletidos na URL.

Exemplo:

`?q=volvo&categoria=modulos&condicao=usado&estoque=disponivel`

Assim refresh, compartilhamento e botão voltar continuam funcionando.

---

# 12. CATÁLOGO

Crie uma experiência de catálogo moderna.

Desktop:

- sidebar ou painel de filtros;
- grid responsivo;
- contador de resultados;
- ordenação;
- busca;
- filtros;
- breadcrumbs discretos.

Filtros relevantes:

- categoria;
- fabricante;
- novo/usado através de `conservacao`;
- disponibilidade;
- faixa de preço;
- pesquisa.

Não adicione filtros que o banco não consegue suportar.

Utilize paginação ou estratégia equivalente.

Não carregue os 1.192 produtos de uma única vez.

---

# 13. CARD DE PRODUTO

Redesenhe completamente o Product Card.

Ele deve mostrar de forma clara:

imagem  
categoria ou tipo  
nome  
referência, quando existir  
fabricante, quando existir  
estado NOVO/USADO  
preço  
disponibilidade  
ação principal

Evite informação excessiva.

No mobile, o card deve continuar legível e possuir alvos de toque adequados.

Imagens devem manter proporção consistente sem cortar peças de forma ruim.

---

# 14. PÁGINA DO PRODUTO

Crie uma PDP muito mais sofisticada.

Desktop:

galeria de um lado  
informações comerciais do outro

Mobile:

galeria primeiro  
informação essencial  
CTA fixo/contextual

Exibir quando existente:

- título;
- referência;
- fabricante;
- categoria;
- conservação;
- preço;
- disponibilidade;
- descrição;
- galeria.

Não invente avaliações.

Remova o `rating: 5` fixo existente.

Se não existe sistema real de avaliações, não mostre estrelas ou números de avaliação.

Não invente descontos como “5% à vista” ou parcelamentos caso não sejam derivados das regras reais do checkout.

Toda informação comercial apresentada deve corresponder à lógica real do sistema.

---

# 15. WHATSAPP E CONVERSÃO

A Demir possui forte natureza consultiva.

Em produtos de alto valor ou peças específicas, dê bastante relevância à ação:

“Falar com especialista”

ou

“Consultar pelo WhatsApp”.

A mensagem pode ser pré-preenchida com:

- nome do produto;
- referência;
- URL do produto.

Não deixe o WhatsApp competir visualmente com todas as outras ações.

Use hierarquia clara.

Preserve compra pelo site quando o produto e o fluxo atual permitirem.

---

# 16. MOBILE COM CARA DE APLICATIVO

Esta é uma exigência importante.

O mobile NÃO deve ser apenas o desktop reduzido.

Projete a experiência mobile separadamente.

Utilize padrões de app.

Considere:

- App Bar compacta;
- busca muito acessível;
- Bottom Navigation fixa;
- sheets/drawers;
- filtros em Bottom Sheet;
- navegação por gestos/áreas amplas;
- cards otimizados para touch;
- skeleton loading;
- transições curtas;
- safe-area;
- feedback visual de toque;
- CTAs fixos quando fizer sentido.

Sugestão de Bottom Navigation:

**Início | Catálogo | Buscar | Favoritos | Carrinho**

Conta/perfil pode permanecer no header/menu.

Mostre badge no Carrinho.

Use:

`env(safe-area-inset-bottom)`

quando necessário.

Touch targets com aproximadamente 44–48px.

Evite interações que dependam exclusivamente de hover.

No detalhe do produto, considere uma barra inferior com:

preço + botão comprar

ou

preço + consultar/comprar

de acordo com a disponibilidade.

---

# 17. PWA / EXPERIÊNCIA INSTALÁVEL

Avalie transformar o site em PWA leve.

Se fizer sentido para a arquitetura existente:

- manifest;
- ícones;
- theme-color;
- display standalone;
- metadata adequada;
- splash/background adequados.

Não implemente cache agressivo de preços ou estoque que possa mostrar informação comercial desatualizada.

O objetivo principal é fazer o mobile parecer um aplicativo mesmo quando aberto no navegador.

---

# 18. HEADER

Recrie o Header seguindo a qualidade de interação do Itamatay, mas com identidade Demir.

Desktop:

- logo;
- navegação limpa;
- catálogo;
- categorias;
- busca;
- conta;
- favoritos;
- carrinho.

Pode mudar de comportamento ao scroll:

transparente/sobre hero → superfície sólida compacta.

Não exagere.

Mobile:

header simples e baixo.

Evite o tradicional menu desktop espremido.

---

# 19. CATEGORIAS

Use `produtogrupo`.

Categorias importantes como:

MÓDULOS  
MOTOR  
PAINÉIS  
SENSORES  
INJEÇÃO  
FILTROS  
LUBRIFICANTES  
BOMBAS  
ELÉTRICA  
etc.

podem receber destaque visual.

Não exiba grupos inativos.

Não assuma que todos os grupos do ERP representam boas categorias comerciais.

Separe conceito de:

“categoria existente no ERP”

e

“categoria que merece destaque na Home”.

O catálogo pode conter todas as válidas; a Home deve apresentar apenas um conjunto visualmente útil.

---

# 20. HOME — ESTRUTURA SUGERIDA

A página pode seguir aproximadamente:

Header

Hero + busca

Atalhos para principais categorias

Produtos em destaque / recomendados

Bloco institucional sobre Demir Diesel

Principais especialidades / diferenciais

Bloco visual relacionado a módulos, motores ou peças diesel

Produtos recentemente adicionados ou oportunidades

CTA para atendimento especializado

Localização/contato

Footer

Não trate essa ordem como obrigatória.

Se durante o design encontrar uma solução melhor, utilize-a.

---

# 21. ANIMAÇÕES

Use Motion com moderação.

Pode utilizar:

- fade/slide suave na entrada;
- stagger em cards;
- feedback em botões;
- transição de menus;
- Bottom Sheet;
- header ao scroll;
- microinterações.

Evite:

- parallax exagerado;
- animações longas;
- elementos entrando de todas as direções;
- movimentação que prejudique navegação.

Respeite:

`prefers-reduced-motion`.

---

# 22. PERFORMANCE

O site deve ser rápido mesmo com mais de mil produtos.

Priorize:

- Server Components;
- consultas específicas;
- paginação;
- seleção apenas das colunas necessárias;
- otimização de imagens;
- lazy loading;
- cache apropriado;
- revalidation adequada;
- bundles pequenos;
- Client Components pequenos;
- evitar waterfalls;
- evitar N+1.

Não faça polling do catálogo sem necessidade.

Preço e disponibilidade precisam ter estratégia de atualização coerente.

---

# 23. SEO

O catálogo da Demir deve ser indexável.

Implemente/revise:

- metadata;
- title;
- description;
- canonical;
- OpenGraph;
- Twitter metadata;
- sitemap;
- robots;
- páginas de categoria indexáveis;
- produtos indexáveis;
- metadata dinâmica por produto;
- breadcrumbs;
- JSON-LD quando os dados forem reais.

Para produto, utilize schema.org `Product` somente com propriedades realmente existentes.

Não invente:

- avaliações;
- reviews;
- disponibilidade;
- marca;
- GTIN;
- ofertas.

Crie URLs melhores se isso puder ser feito sem quebrar links existentes.

Idealmente evolua de:

`/produto/2034`

para algo amigável como:

`/produto/modulo-hidraulico-caterpillar-366-8821-2034`

mantendo compatibilidade/redirecionamento quando necessário.

---

# 24. ACESSIBILIDADE

Objetivo mínimo:

WCAG 2.2 AA.

Garanta:

- contraste;
- foco visível;
- navegação por teclado;
- labels;
- alt text;
- hierarquia correta de headings;
- aria apenas quando necessário;
- touch targets adequados;
- estado de erro compreensível;
- reduced motion.

---

# 25. ESTADOS DA INTERFACE

Implemente estados profissionais para:

- loading;
- skeleton;
- empty;
- error;
- sem resultados;
- produto indisponível;
- imagem ausente;
- conexão lenta;
- carrinho vazio;
- favoritos vazios.

Nunca deixe layout “quebrar” por falta de dados.

---

# 26. CARRINHO E CHECKOUT

Redesenhe visualmente os dois fluxos, mas não altere regras de negócio sem entender o funcionamento existente.

No mobile, carrinho e checkout devem se comportar quase como telas de aplicativo.

Reduza distrações durante checkout.

Mantenha resumo do pedido acessível.

Validações devem ser claras.

Nunca altere o webhook Pagar.me ou a lógica financeira apenas para atender ao redesign.

---

# 27. FAVORITOS, CONTA E PEDIDOS

Atualize essas áreas para a nova linguagem visual.

Especialmente no mobile, use padrão semelhante a telas internas de aplicativo:

- App Bar;
- cards simples;
- estados vazios;
- navegação clara;
- ações grandes;
- boa hierarquia.

---

# 28. DESIGN RESPONSIVO

Valide pelo menos:

360px  
390px  
430px  
768px  
1024px  
1280px  
1440px+

Não aceite:

- scroll horizontal;
- botões cortados;
- header quebrado;
- cards muito pequenos;
- fontes minúsculas;
- modais maiores que a viewport.

---

# 29. CÓDIGO

Não concentre páginas gigantes em um único arquivo.

Crie componentes por responsabilidade.

Evite abstração prematura.

Elimine código morto depois que a nova implementação estiver estável.

Mantenha nomenclatura consistente.

Evite `any` sempre que o schema conhecido permitir tipagem.

Use funções puras para transformar dados do Supabase em modelos públicos.

---

# 30. SEGURANÇA

Revise especialmente a integração Supabase.

Não disponibilize:

`SUPABASE_SERVICE_ROLE_KEY`

no client.

Não utilize service role como fallback silencioso.

Não exponha dados internos através de `select("*")`.

Revise políticas RLS antes de depender de consultas do browser.

Faça operações sensíveis exclusivamente no servidor.

Não coloque secrets em variáveis `NEXT_PUBLIC_*`.

---

# 31. ANALYTICS

Pode adotar Vercel Analytics seguindo a abordagem do projeto Itamatay.

Não envie dados pessoais ou conteúdo sensível.

Eventos úteis podem incluir:

- busca;
- produto visualizado;
- adicionar ao carrinho;
- iniciar checkout;
- clique WhatsApp;
- categoria visualizada.

Use apenas se isso não causar complexidade desnecessária.

---

# 32. NÃO FAÇA UMA CÓPIA DO ITAMATAY

O Itamatay é uma referência de qualidade.

A Demir deve parecer outro produto.

Itamatay vende veículos.

Demir trabalha com peças e tecnologia diesel.

Transfira os princípios:

- arquitetura;
- polimento;
- UX;
- mobile;
- movimento;
- performance;
- organização.

Não transfira literalmente:

- identidade visual;
- imagens;
- textos;
- branding;
- estrutura comercial específica de veículos.

---

# 33. ORDEM DE EXECUÇÃO

Primeiro faça discovery.

Analise:

- árvore completa do Demir;
- árvore completa do Itamatay;
- componentes;
- rotas;
- layouts;
- estilos;
- integrações;
- Supabase;
- autenticação;
- carrinho;
- checkout;
- pagamento;
- APIs;
- assets.

Depois defina internamente o novo design system e arquitetura.

Depois implemente.

Não pare apenas em um relatório ou sugestão.

A tarefa é executar a remodelação.

Você possui liberdade para alterar qualquer componente visual necessário.

---

# 34. VALIDAÇÃO

Ao finalizar:

rode build;

rode lint;

rode typecheck;

teste navegação;

teste busca;

teste filtros;

teste categorias;

teste produto;

teste favoritos;

teste carrinho;

teste login;

teste checkout sem concluir cobrança real;

teste responsividade;

verifique console;

verifique erros de hydration;

verifique imagens;

verifique páginas 404;

verifique metadata.

Corrija os problemas encontrados antes de considerar a tarefa concluída.

---

# 35. CRITÉRIOS DE ACEITE

A implementação somente estará concluída quando:

- o site tiver aparência completamente moderna;
- a Demir mantiver identidade própria;
- o catálogo utilizar os dados reais do Supabase;
- não existirem produtos mockados;
- nenhuma informação fiscal/interna desnecessária for exposta;
- busca e filtros funcionarem;
- imagens do Supabase funcionarem;
- galeria de produto funcionar;
- produto sem imagem tiver fallback próprio;
- desktop estiver bem resolvido;
- tablet estiver bem resolvido;
- mobile tiver experiência semelhante a aplicativo;
- navegação inferior mobile estiver funcional;
- carrinho continuar funcionando;
- checkout continuar funcionando;
- login/conta continuarem funcionando;
- favoritos continuarem funcionando;
- pagamento não sofrer regressão;
- SEO estiver melhor que a implementação atual;
- acessibilidade estiver adequada;
- não houver erro de build;
- não houver erro de TypeScript;
- não houver erros relevantes no console.

O resultado final deve parecer um projeto novo produzido em 2026, não simplesmente uma atualização de cores do site antigo.

Tome decisões de UX por conta própria quando necessário.

Você tem autorização para reorganizar páginas, componentes e navegação sempre que isso trouxer uma experiência melhor ao usuário, desde que as regras de negócio e integrações existentes sejam preservadas.