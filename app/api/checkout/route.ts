import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";
import {
  AsaasApiError,
  createAsaasCustomer,
  createAsaasPayment,
  findAsaasCustomer,
} from "@/lib/asaas";
import { getStorePaymentConfig } from "@/lib/store-payment-config";
import { isPickupEligible, type DeliveryMethod } from "@/lib/shipping";
import {
  isAsaasBillingType,
  PAYMENT_METHOD_LABELS,
} from "@/lib/payment-methods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      .select("id, nomerazaosocial, email, cpfcnpj, telefone, user_id, asaas_customer_id")
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
    const deliveryMethod: DeliveryMethod = body?.deliveryMethod === "pickup" ? "pickup" : "delivery";
    const billingType = body?.billingType;

    if (!isAsaasBillingType(billingType)) {
      return NextResponse.json(
        {
          error: "FORMA_PAGAMENTO_INVALIDA",
          message: "Selecione Pix, cart\u00e3o de cr\u00e9dito ou boleto para continuar.",
        },
        { status: 400 },
      );
    }

    const paymentMethodLabel = PAYMENT_METHOD_LABELS[billingType];

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

    if (
      deliveryMethod === "pickup" &&
      !isPickupEligible({ city: addressRow.cidade, state: addressRow.estado })
    ) {
      return NextResponse.json(
        {
          error: "RETIRADA_INDISPONIVEL",
          message: "A retirada no local está disponível somente para João Pessoa e cidades próximas habilitadas.",
        },
        { status: 400 },
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
      .select("id, titulo, tituloMarketplace, precovenda, estoque, is_deleted, visible")
      .in("id", uniqueProductIds);

    if (dbError) {
      console.error("[checkout] Erro ao consultar produtos no banco:", dbError);
      return NextResponse.json(
        { error: "ERRO_CATALOGO", message: "Falha ao validar produtos no catálogo." },
        { status: 500 }
      );
    }

    const dbProductMap = new Map<number, NonNullable<typeof dbProducts>[number]>();
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

      if (p.is_deleted === true || p.visible === false) {
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
      deliveryMethod,
      deliveryLabel: deliveryMethod === "pickup" ? "Retirada no local" : "Entrega no endereço",
      pickupAddress: deliveryMethod === "pickup" ? siteConfig.address.full : null,
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
      p_forma_pagamento: paymentMethodLabel,
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

    // 8. CRIA A COBRANÇA NO ASAAS SOMENTE APÓS O PEDIDO LOCAL SER REGISTRADO
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

    try {
      const externalCustomerReference = `LOJA-CLIENTE-${cliente.id}`;
      let asaasCustomerId = String(cliente.asaas_customer_id || "").trim();

      if (!asaasCustomerId) {
        const existingCustomer = await findAsaasCustomer(cleanDoc, externalCustomerReference);
        const asaasCustomer =
          existingCustomer ||
          (await createAsaasCustomer({
            name: customerName,
            cpfCnpj: cleanDoc,
            email: customerEmail,
            mobilePhone: cleanPhone,
            address: addressRow.logradouro,
            addressNumber: addressRow.numero,
            complement: addressRow.complemento || undefined,
            province: addressRow.bairro,
            postalCode: String(addressRow.cep || "").replace(/\D/g, ""),
            externalReference: externalCustomerReference,
            notificationDisabled: false,
          }));

        asaasCustomerId = asaasCustomer.id;
        const { error: customerUpdateError } = await supabaseAdmin
          .from("cliente")
          .update({ asaas_customer_id: asaasCustomerId, updatedat: new Date().toISOString() })
          .eq("id", cliente.id);

        if (customerUpdateError) {
          throw new Error("Falha ao vincular o cliente local ao cadastro do Asaas.");
        }
      }

      const paymentConfig = await getStorePaymentConfig();
      if (!paymentConfig.enabled) {
        throw new Error("O checkout da loja está temporariamente pausado pela administração.");
      }

      const commissionPercent = paymentConfig.commissionPercent;
      const commissionWalletId = paymentConfig.commissionWalletId || "";
      const splitEnabled =
        paymentConfig.commissionEnabled &&
        commissionWalletId.length > 0 &&
        commissionPercent > 0;

      const paymentPayload: Record<string, unknown> = {
        customer: asaasCustomerId,
        billingType,
        value: Number(serverTotal.toFixed(2)),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        description: `Demir Diesel - Pedido #${orderId}`,
        externalReference: String(orderId),
        callback: {
          successUrl: returnUrl,
          autoRedirect: true,
        },
      };

      if (splitEnabled) {
        paymentPayload.split = [
          {
            walletId: commissionWalletId,
            percentualValue: Number(commissionPercent.toFixed(4)),
          },
        ];
      }

      const payment = await createAsaasPayment(paymentPayload);
      if (!payment.id || !payment.invoiceUrl) {
        throw new Error("O Asaas não retornou a identificação ou a URL da cobrança.");
      }

      const { error: paymentUpdateError } = await supabaseAdmin
        .from("venda")
        .update({
          payment_provider: "ASAAS",
          gateway_payment_id: payment.id,
          gateway_checkout_url: payment.invoiceUrl,
          gateway_status: payment.status || "PENDING",
          gateway_due_date: payment.dueDate || null,
          forma_pagamento: paymentMethodLabel,
          commission_percent: splitEnabled ? commissionPercent : 0,
          commission_wallet_id: splitEnabled ? commissionWalletId : null,
          commission_config_revision: paymentConfig.revision,
          updatedat: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (paymentUpdateError) {
        throw new Error("Cobrança criada, mas não foi possível conciliá-la com o pedido local.");
      }

      return NextResponse.json({
        url: payment.invoiceUrl,
        orderId,
        total: serverTotal,
        subtotal: serverSubtotal,
        billingType,
        paymentMethod: paymentMethodLabel,
      });
    } catch (paymentError) {
      const message =
        paymentError instanceof Error
          ? paymentError.message
          : "Falha ao gerar a cobrança no Asaas.";

      console.error("[checkout] Erro ao criar cobrança no Asaas:", paymentError);
      await supabaseAdmin
        .from("venda")
        .update({
          observacao: `[Asaas Erro Cobrança] ${new Date().toISOString()} - ${message}`,
          updatedat: new Date().toISOString(),
        })
        .eq("id", orderId);

      const status =
        paymentError instanceof AsaasApiError &&
        paymentError.status >= 400 &&
        paymentError.status < 500
          ? 400
          : 502;

      return NextResponse.json(
        {
          error: "ERRO_ASAAS",
          message,
          orderId,
        },
        { status }
      );
    }
  } catch (err: unknown) {
    console.error("[checkout] Exceção no checkout:", err);
    const message = err instanceof Error ? err.message : "Erro interno de processamento.";
    return NextResponse.json(
      { error: "ERRO_INTERNO", message },
      { status: 500 }
    );
  }
}
