import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      customerId,
      address,
      customerName,
      customerEmail,
      customerDocument,
      customerPhone,
    } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "CARRINHO_VAZIO", message: "O carrinho está vazio." },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "CLIENTE_NAO_IDENTIFICADO", message: "Faça login para continuar o checkout." },
        { status: 401 }
      );
    }

    if (!address || !address.logradouro || !address.cep) {
      return NextResponse.json(
        { error: "ENDERECO_INVALIDO", message: "Selecione um endereço de entrega válido." },
        { status: 400 }
      );
    }

    // 1. Extrai e sanitiza os IDs solicitados
    const normalizedItems: { id: number; quantity: number }[] = [];
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
      normalizedItems.push({ id: numId, quantity: qty });
    }

    const uniqueProductIds = Array.from(new Set(normalizedItems.map((i) => i.id)));

    // 2. Consulta autoritativa no banco de dados (REGRA CRÍTICA 1)
    // O frontend NUNCA pode determinar preço, estoque ou disponibilidade.
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

    // 3. Valida cada item quanto a existência, exclusão, exibição e estoque
    interface ValidatedItem {
      id: number;
      name: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }

    const validatedItems: ValidatedItem[] = [];

    for (const item of normalizedItems) {
      const p = dbProductMap.get(item.id);

      if (!p) {
        return NextResponse.json(
          {
            error: "PRODUTO_NAO_ENCONTRADO",
            message: `Produto #${item.id} não foi encontrado no estoque.`,
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
      if (currentStock < item.quantity) {
        return NextResponse.json(
          {
            error: "ESTOQUE_INSUFICIENTE",
            message: `Estoque insuficiente para "${prodName}". Disponível em estoque: ${currentStock} unidade(s). Solicitado: ${item.quantity}.`,
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

      const itemSubtotal = realPrice * item.quantity;
      validatedItems.push({
        id: p.id,
        name: prodName,
        unitPrice: realPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // 4. Recalcula Subtotal e Total no SERVIDOR (REGRA 1 e REGRA 2)
    // Frete é strictly 0 enquanto não houver transportadora integrada (sem valores fictícios de 38.5)
    const serverSubtotal = validatedItems.reduce((acc, it) => acc + it.subtotal, 0);
    const serverShipping = 0; // Cotação formal acordada após o endereço e análise da carga
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
    const possibleInstallments = Math.min(
      Math.floor(totalCents / minInstallmentCents),
      maxInstallments
    ) || 1;

    const installmentsConfig = [];
    for (let i = 1; i <= possibleInstallments; i++) {
      installmentsConfig.push({ number: i, total: totalCents });
    }
    if (installmentsConfig.length === 0) {
      installmentsConfig.push({ number: 1, total: totalCents });
    }

    // 5. Salva a Venda no Banco de Dados
    let finalClienteId: number | null = Number(customerId);
    if (!finalClienteId || isNaN(finalClienteId) || finalClienteId <= 0) {
      if (customerEmail) {
        const { data: c } = await supabaseAdmin
          .from("cliente")
          .select("id")
          .eq("email", customerEmail)
          .limit(1)
          .maybeSingle();
        if (c?.id) finalClienteId = c.id;
      }
      if (!finalClienteId && customerDocument) {
        const cleanDoc = customerDocument.replace(/\D/g, "");
        const { data: c } = await supabaseAdmin
          .from("cliente")
          .select("id")
          .eq("cpfcnpj", cleanDoc)
          .limit(1)
          .maybeSingle();
        if (c?.id) finalClienteId = c.id;
      }
    }

    if (!finalClienteId) {
      return NextResponse.json(
        {
          error: "CLIENTE_NAO_IDENTIFICADO",
          message: "Identificação do cliente inválida. Por favor, faça login para continuar.",
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("venda")
      .insert({
        clienteid: finalClienteId,
        status: "PENDENTE",
        valortotal: serverTotal,
        sub_total: serverSubtotal,
        datavenda: nowIso,
        createdat: nowIso,
        updatedat: nowIso,
        forma_pagamento: "Pagar.me",
        endereco_entrega_snapshot: address,
        canal: "ONLINE",
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error("[checkout] Erro crítico ao criar registro de venda:", orderError);
      return NextResponse.json(
        { error: "ERRO_CRIACAO_VENDA", message: "Não foi possível registrar o pedido no banco." },
        { status: 500 }
      );
    }

    // 6. Insere os itens da venda
    const orderItemsPayload = validatedItems.map((it) => ({
      venda_id: orderData.id,
      produtoid: it.id,
      quantidade: it.quantity,
      sub_total: it.subtotal,
      valor_total: it.subtotal,
      valor_desconto: 0,
      tipo_desconto: null,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("vendaproduto")
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error("[checkout] Erro ao gravar itens da venda:", itemsError);
    }

    // 7. Prepara Payload Pagar.me com dados autoritativos e URLs limpas
    const origin = request.headers.get("origin") || siteConfig.url;
    // URL de retorno leva o orderId para que a tela de sucesso valide o status real (Prioridade 3)
    const returnUrl = `${origin}/sucesso?orderId=${orderData.id}`;

    const cleanDoc = String(customerDocument || "").replace(/\D/g, "");
    const docType = cleanDoc.length === 14 ? "company" : "individual";
    const cleanPhone = String(customerPhone || "").replace(/\D/g, "");
    const areaCode = cleanPhone.substring(0, 2) || "83";
    const phoneNumber = cleanPhone.substring(2) || "900000000";

    const paymentLinkPayload = {
      name: `Demir Diesel - Pedido #${orderData.id}`,
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
        name: customerName || "Cliente",
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
        customerId: String(customerId),
        orderId: String(orderData.id),
      },
    };

    if (!PAGARME_API_KEY) {
      console.error("[checkout] PAGARME_API_KEY / PAGARME_SECRET_KEY não configurada.");
      return NextResponse.json(
        {
          error: "PAGARME_NAO_CONFIGURADO",
          message: "Gateway de pagamentos não configurado no servidor.",
          orderId: orderData.id,
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
      return NextResponse.json(
        {
          error: "ERRO_PAGARME",
          message: pagarmeData.message || "Erro ao gerar link de pagamento junto ao Pagar.me.",
          orderId: orderData.id,
        },
        { status: pagarmeRes.status >= 400 && pagarmeRes.status < 500 ? 400 : 502 }
      );
    }

    return NextResponse.json({
      url: pagarmeData.url,
      orderId: orderData.id,
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
