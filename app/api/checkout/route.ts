import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_KEY = process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY || "";
const PAGARME_API_KEY = RAW_KEY.trim().replace(/^["']|["']$/g, "");
const IS_TEST = PAGARME_API_KEY.startsWith("sk_test");
const BASE_URL = IS_TEST ? "https://sdx-api.pagar.me/core/v5" : "https://api.pagar.me/core/v5";
const PAGARME_API_URL = `${BASE_URL}/paymentlinks`;

interface RequestItem {
  productId?: number | string;
  id?: number | string;
  product?: { id: number | string; price?: number };
  quantity: number;
}

/**
 * Autentica o usuário de forma robusta no servidor:
 * 1. Tenta cookies da sessão Supabase (SSR)
 * 2. Tenta header Authorization: Bearer <token>
 */
async function getAuthenticatedUser(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) return user;
  } catch {
    // Falha silenciosa para tentar via header
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);
      if (user && !error) return user;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    // 1. AUTENTICAR NO SERVIDOR (Prioridade 1)
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "NAO_AUTENTICADO", message: "Faça login para continuar o checkout." },
        { status: 401 }
      );
    }

    // Buscar perfil de cliente vinculado ao auth.uid()
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from("cliente")
      .select("id, nomerazaosocial, email, cpfcnpj, telefone, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (clienteError || !cliente) {
      return NextResponse.json(
        {
          error: "PERFIL_NAO_ENCONTRADO",
          message: "Perfil de cliente não encontrado. Complete seu cadastro antes de finalizar a compra.",
        },
        { status: 403 }
      );
    }

    // 2. VALIDAÇÃO ESTRITA DE DADOS DO CLIENTE NO SERVIDOR (Prioridade 2)
    // Dados do cliente vêm EXCLUSIVAMENTE do banco de dados (auth.uid() -> cliente).
    // O backend NÃO aceita documento, telefone, nome ou email enviados no body.
    // Não inventar DDD nem telefone. Se faltar dado obrigatório, retornar erro claro solicitando atualização.
    const cleanDoc = String(cliente.cpfcnpj || "").replace(/\D/g, "");
    if (!cleanDoc || (cleanDoc.length !== 11 && cleanDoc.length !== 14)) {
      return NextResponse.json(
        {
          error: "CADASTRO_INCOMPLETO_DOCUMENTO",
          message: "Seu cadastro precisa de um CPF ou CNPJ válido para gerar a cobrança. Por favor, atualize seus dados na página Minha Conta.",
        },
        { status: 400 }
      );
    }
    const docType = cleanDoc.length === 14 ? "company" : "individual";

    const cleanPhone = String(cliente.telefone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
      return NextResponse.json(
        {
          error: "CADASTRO_INCOMPLETO_TELEFONE",
          message: "Seu cadastro precisa de um telefone celular válido com DDD (10 ou 11 dígitos). Por favor, atualize seus dados na página Minha Conta.",
        },
        { status: 400 }
      );
    }
    const areaCode = cleanPhone.substring(0, 2);
    const phoneNumber = cleanPhone.substring(2);

    const customerName = String(cliente.nomerazaosocial || "").trim();
    if (!customerName) {
      return NextResponse.json(
        {
          error: "CADASTRO_INCOMPLETO_NOME",
          message: "Nome ou Razão Social não informado no cadastro. Por favor, atualize seus dados na página Minha Conta.",
        },
        { status: 400 }
      );
    }

    const customerEmail = String(cliente.email || user.email || "").trim().toLowerCase();
    if (!customerEmail || !customerEmail.includes("@")) {
      return NextResponse.json(
        {
          error: "CADASTRO_INCOMPLETO_EMAIL",
          message: "E-mail de contato inválido no cadastro. Por favor, atualize seus dados na página Minha Conta.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { addressId, items } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "CARRINHO_VAZIO", message: "O carrinho está vazio." },
        { status: 400 }
      );
    }

    // 2. VALIDAR ENDEREÇO AUTORITATIVO NO BANCO (Prioridade 1)
    // O frontend deve enviar apenas addressId. Não confiar em endereço cru do cliente.
    if (!addressId) {
      return NextResponse.json(
        { error: "ENDERECO_OBRIGATORIO", message: "Selecione um endereço de entrega." },
        { status: 400 }
      );
    }

    const { data: addressRow, error: addressError } = await supabaseAdmin
      .from("cliente_endereco")
      .select("id, cliente_id, logradouro, numero, complemento, bairro, cidade, estado, cep")
      .eq("id", addressId)
      .eq("cliente_id", cliente.id)
      .maybeSingle();

    if (addressError || !addressRow) {
      return NextResponse.json(
        {
          error: "ENDERECO_NAO_AUTORIZADO",
          message: "O endereço selecionado não pertence ao cliente autenticado.",
        },
        { status: 403 }
      );
    }

    // 3. AGRUPAR PRODUTOS DUPLICADOS ANTES DA VALIDAÇÃO (Prioridade 4)
    // Ex: produto 10 qtd 2 + produto 10 qtd 3 => produto 10 qtd 5
    const consolidatedMap = new Map<number, number>();

    for (const it of items as RequestItem[]) {
      const rawId = it.productId || it.product?.id || it.id;
      const numId = Number(rawId);
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));

      if (!numId || isNaN(numId) || numId <= 0) {
        return NextResponse.json(
          { error: "ITEM_INVALIDO", message: "Identificador de produto inválido no carrinho." },
          { status: 400 }
        );
      }

      consolidatedMap.set(numId, (consolidatedMap.get(numId) || 0) + qty);
    }

    const uniqueProductIds = Array.from(consolidatedMap.keys());
    if (uniqueProductIds.length === 0) {
      return NextResponse.json(
        { error: "CARRINHO_VAZIO", message: "Nenhum produto válido no carrinho." },
        { status: 400 }
      );
    }

    // 4. CONSULTA AUTORITATIVA NO BANCO DE DADOS
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from("produto")
      .select("id, titulo, tituloMarketplace, precovenda, estoque, is_deleted, exibirPdv")
      .in("id", uniqueProductIds);

    if (dbError) {
      console.error("[checkout] Erro ao consultar produtos no banco:", dbError);
      return NextResponse.json(
        { error: "ERRO_CATALOGO", message: "Falha ao validar produtos no catálogo." },
        { status: 500 }
      );
    }

    const dbProductMap = new Map<number, any>();
    (dbProducts || []).forEach((p) => dbProductMap.set(p.id, p));

    // 5. VALIDA CADA ITEM (existência, exclusão, exibição e estoque agregado)
    interface ValidatedItem {
      id: number;
      name: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }

    const validatedItems: ValidatedItem[] = [];

    for (const [productId, quantity] of consolidatedMap.entries()) {
      const p = dbProductMap.get(productId);

      if (!p) {
        return NextResponse.json(
          {
            error: "PRODUTO_NAO_ENCONTRADO",
            message: `Produto #${productId} não foi encontrado no estoque.`,
          },
          { status: 404 }
        );
      }

      const prodName = (p.tituloMarketplace || p.titulo || `Peça #${p.id}`).trim();

      if (p.is_deleted === true || p.exibirPdv === false) {
        return NextResponse.json(
          {
            error: "PRODUTO_INDISPONIVEL",
            message: `O componente "${prodName}" não está mais disponível para venda online.`,
          },
          { status: 400 }
        );
      }

      const currentStock = Math.max(0, Number(p.estoque) || 0);
      if (currentStock < quantity) {
        return NextResponse.json(
          {
            error: "ESTOQUE_INSUFICIENTE",
            message: `Estoque insuficiente para "${prodName}". Disponível: ${currentStock} unidade(s). Solicitado (total agrupado): ${quantity}.`,
          },
          { status: 409 }
        );
      }

      const realPrice = Number(p.precovenda) || 0;
      if (realPrice <= 0) {
        return NextResponse.json(
          {
            error: "PRECO_SOB_CONSULTA",
            message: `O componente "${prodName}" está sob consulta técnica. Entre em contato pelo WhatsApp para orçamento.`,
          },
          { status: 400 }
        );
      }

      const itemSubtotal = realPrice * quantity;
      validatedItems.push({
        id: p.id,
        name: prodName,
        unitPrice: realPrice,
        quantity,
        subtotal: itemSubtotal,
      });
    }

    // 6. RECALCULA SUBTOTAL E TOTAL NO SERVIDOR
    const serverSubtotal = validatedItems.reduce((acc, it) => acc + it.subtotal, 0);
    const serverShipping = 0;
    const serverTotal = serverSubtotal + serverShipping;
    const totalCents = Math.round(serverTotal * 100);

    if (totalCents <= 0) {
      return NextResponse.json(
        { error: "VALOR_INVALIDO", message: "Valor total do pedido inválido." },
        { status: 400 }
      );
    }

    // Configuração de parcelamento
    const maxInstallments = 12;
    const minInstallmentCents = 5000; // R$ 50,00
    const possibleInstallments =
      Math.min(Math.floor(totalCents / minInstallmentCents), maxInstallments) || 1;

    const installmentsConfig = [];
    for (let i = 1; i <= possibleInstallments; i++) {
      installmentsConfig.push({ number: i, total: totalCents });
    }
    if (installmentsConfig.length === 0) {
      installmentsConfig.push({ number: 1, total: totalCents });
    }

    // 7. CRIAÇÃO DE PEDIDO ATÔMICA VIA RPC (Prioridade 3)
    const enderecoSnapshot = {
      id: addressRow.id,
      logradouro: addressRow.logradouro,
      numero: addressRow.numero,
      complemento: addressRow.complemento,
      bairro: addressRow.bairro,
      cidade: addressRow.cidade,
      estado: addressRow.estado,
      cep: addressRow.cep,
    };

    const orderItemsPayload = validatedItems.map((it) => ({
      produtoid: it.id,
      quantidade: it.quantity,
      sub_total: it.subtotal,
      valor_total: it.subtotal,
      valor_desconto: 0,
      tipo_desconto: null,
    }));

    const { data: orderId, error: rpcError } = await supabaseAdmin.rpc("fn_criar_pedido_site", {
      p_cliente_id: cliente.id,
      p_endereco_snapshot: enderecoSnapshot,
      p_itens: orderItemsPayload,
      p_subtotal: serverSubtotal,
      p_total: serverTotal,
      p_canal: "ONLINE",
      p_forma_pagamento: "Pagar.me",
    });

    if (rpcError || !orderId) {
      console.error("[checkout] Erro crítico ao criar pedido atômico (RPC):", rpcError);
      return NextResponse.json(
        {
          error: "ERRO_CRIACAO_VENDA",
          message: "Não foi possível registrar o pedido no banco de dados.",
        },
        { status: 500 }
      );
    }

    // 8. CRIA O LINK DE PAGAMENTO NO PAGAR.ME SOMENTE APÓS SUCESSO DA TRANSAÇÃO
    // SEGURANÇA: return_url estritamente ancorado na URL oficial configurada do site.
    // Allowlist explícita por ambiente para suportar homologação/desenvolvimento sem permitir domínios arbitrários.
    const configuredBaseUrl = siteConfig.url.replace(/\/+$/, "");
    const allowedOrigins = new Set<string>([
      configuredBaseUrl,
      "https://demirdiesel.com.br",
      "https://www.demirdiesel.com.br",
    ]);

    if (process.env.NODE_ENV !== "production") {
      allowedOrigins.add("http://localhost:3000");
      allowedOrigins.add("http://127.0.0.1:3000");
    }

    const requestOrigin = request.headers.get("origin")?.replace(/\/+$/, "");
    const safeBaseUrl =
      requestOrigin && allowedOrigins.has(requestOrigin)
        ? requestOrigin
        : configuredBaseUrl;

    const returnUrl = `${safeBaseUrl}/sucesso?orderId=${orderId}`;

    const paymentLinkPayload = {
      name: `Demir Diesel - Pedido #${orderId}`,
      type: "order",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      review_informations: true,
      items: validatedItems.map((it) => ({
        amount: Math.round(it.unitPrice * 100),
        name: it.name.slice(0, 100),
        quantity: it.quantity,
        description: it.name.slice(0, 100),
      })),
      payment_settings: {
        accepted_payment_methods: ["credit_card", "pix", "boleto"],
        credit_card_settings: {
          operation_type: "auth_and_capture",
          installments: installmentsConfig,
        },
        boleto_settings: {
          due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        pix_settings: {
          expires_in: 3600,
        },
      },
      cart_settings: {
        return_url: returnUrl,
        shipping_cost: 0,
        items: validatedItems.map((it) => ({
          amount: Math.round(it.unitPrice * 100),
          name: it.name.slice(0, 100),
          quantity: it.quantity,
          default_quantity: it.quantity,
          description: it.name.slice(0, 100),
        })),
      },
      customer_settings: {
        name: customerName,
        email: customerEmail,
        document: cleanDoc,
        type: docType,
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: areaCode,
            number: phoneNumber,
          },
        },
      },
      metadata: {
        customerId: String(cliente.id),
        orderId: String(orderId),
      },
    };

    if (!PAGARME_API_KEY) {
      console.error("[checkout] PAGARME_API_KEY / PAGARME_SECRET_KEY não configurada.");
      return NextResponse.json(
        {
          error: "PAGARME_NAO_CONFIGURADO",
          message: "Gateway de pagamentos não configurado no servidor.",
          orderId,
        },
        { status: 500 }
      );
    }

    const basicAuth = Buffer.from(`${PAGARME_API_KEY}:`).toString("base64");
    const pagarmeRes = await fetch(PAGARME_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "DemirDiesel/1.0",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(paymentLinkPayload),
    });

    const pagarmeRaw = await pagarmeRes.text();
    let pagarmeData: any = {};
    try {
      pagarmeData = pagarmeRaw ? JSON.parse(pagarmeRaw) : {};
    } catch {
      console.error("[checkout] Resposta não-JSON do Pagar.me:", pagarmeRaw);
    }

    if (!pagarmeRes.ok || !pagarmeData.url) {
      console.error("[checkout] Erro retornado pelo Pagar.me:", pagarmeRes.status, pagarmeData);

      // REGRA: Se a criação do link do Pagar.me falhar:
      // - não apagar a venda automaticamente;
      // - manter status PENDENTE e registrar observação do erro de forma segura;
      // - permitir recuperação/reprocessamento futuro.
      try {
        await supabaseAdmin
          .from("venda")
          .update({
            observacao: `[Pagar.me Erro Link] ${new Date().toISOString()} - ${pagarmeData?.message || "Falha ao gerar link de pagamento"}`,
            updatedat: new Date().toISOString(),
          })
          .eq("id", orderId);
      } catch (logErr) {
        console.error("[checkout] Falha ao registrar observação de erro na venda:", logErr);
      }

      return NextResponse.json(
        {
          error: "ERRO_PAGARME",
          message: pagarmeData.message || "Erro ao gerar link de pagamento junto ao Pagar.me.",
          orderId,
        },
        { status: pagarmeRes.status >= 400 && pagarmeRes.status < 500 ? 400 : 502 }
      );
    }

    return NextResponse.json({
      url: pagarmeData.url,
      orderId,
      total: serverTotal,
      subtotal: serverSubtotal,
    });
  } catch (err: any) {
    console.error("[checkout] Exceção no checkout:", err);
    return NextResponse.json(
      { error: "ERRO_INTERNO", message: err.message || "Erro interno de processamento." },
      { status: 500 }
    );
  }
}
