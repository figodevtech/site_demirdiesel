import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
// Actually, for API routes, it's safer to use a fresh client or just rely on the fact we are creating the order here.

// Pagar.me Config
// Pagar.me Config
const RAW_KEY = process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY || '';
const PAGARME_API_KEY = RAW_KEY.trim().replace(/^["']|["']$/g, '');

// Determine the correct API URL based on the key type
const IS_TEST = PAGARME_API_KEY.startsWith('sk_test');
const BASE_URL = IS_TEST ? 'https://sdx-api.pagar.me/core/v5' : 'https://api.pagar.me/core/v5';
const PAGARME_API_URL = `${BASE_URL}/paymentlinks`;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, shippingAmount, customerId, address, customerName, customerEmail, customerDocument, customerPhone } = body;

        if (!items || !customerId || !address) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // 2. Prepare Items for Pagar.me
        const pagarmeItems = items.map((item: any) => ({
            amount: Math.round(item.product.price * 100),
            name: item.product.name,
            quantity: item.quantity,
            description: item.product.name,
        }));

        // Add Shipping as an Item if present
        if (shippingAmount && shippingAmount > 0) {
            pagarmeItems.push({
                amount: Math.round(shippingAmount * 100),
                name: 'Frete',
                quantity: 1,
                description: 'Custo de entrega',
            });
        }

        const totalAmount = pagarmeItems.reduce((acc: number, item: any) => acc + (item.amount * item.quantity), 0);

        // Calculate installments (Example: Up to 12x, min installment 50.00)
        const maxInstallments = 12;
        const minInstallmentValue = 5000; // R$ 50,00
        const possibleInstallments = Math.min(Math.floor(totalAmount / minInstallmentValue), maxInstallments) || 1;
        
        const installmentsConfig = [];
        for (let i = 1; i <= possibleInstallments; i++) {
            installmentsConfig.push({ number: i, total: totalAmount });
        }
        if (installmentsConfig.length === 0) installmentsConfig.push({ number: 1, total: totalAmount });


        // Create Return URL (absolute)
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const returnUrl = `${origin}/sucesso`; // Redirect to success page

        // --- SAVE TO DATABASE START ---
        console.log("Attempting to save order to DB for customer:", customerId);
        const nowIso = new Date().toISOString();
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('venda')
            .insert({
                clienteid: customerId,
                status: 'PENDENTE',
                valortotal: totalAmount / 100,
                sub_total: totalAmount / 100,
                datavenda: nowIso,
                createdat: nowIso,
                updatedat: nowIso,
                // será atualizado pelo webhook com o método escolhido (pix/boleto/cartão)
                forma_pagamento: 'Pagar.me',
                endereco_entrega_snapshot: address,
                canal: 'ONLINE'
            })
            .select()
            .single();

        if (orderError) {
            console.error("CRITICAL: Error creating order in DB:", JSON.stringify(orderError, null, 2));
        } else if (orderData) {
            console.log("Order created successfully with ID:", orderData.id);
            const orderItems = items.map((item: any) => ({
                venda_id: orderData.id,
                produtoid: Number(item.product.id),
                quantidade: item.quantity,
                sub_total: item.product.price * item.quantity,
                valor_total: item.product.price * item.quantity,
                valor_desconto: 0,
                tipo_desconto: null
            }));

            const { error: itemsError } = await supabaseAdmin
                .from('vendaproduto')
                .insert(orderItems);
            
            if (itemsError) {
                console.error("CRITICAL: Error creating order items:", JSON.stringify(itemsError, null, 2));
            } else {
                console.log("Order items saved successfully.");
            }
        }
        // --- SAVE TO DATABASE END ---

        // 3. Create Payment Link Payload
        const paymentLinkPayload = {
            name: `Pedido Site - #${orderData?.id || 'NOVO'}`,
            type: "order",
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            review_informations: true,
            items: items.map((item: any) => ({
                amount: Math.round(item.product.price * 100),
                name: item.product.name,
                quantity: item.quantity,
                description: item.product.name,
            })),
            payment_settings: {
                accepted_payment_methods: ["credit_card", "pix", "boleto"],
                credit_card_settings: {
                    operation_type: "auth_and_capture",
                    installments: installmentsConfig
                },
                boleto_settings: {
                    due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
                },
                pix_settings: {
                    expires_in: 3600 
                }
            },
            cart_settings: {
                return_url: returnUrl,
                shipping_cost: Math.round((shippingAmount || 0) * 100), // NATIVE SHIPPING FIELD
                items: items.map((item: any) => ({
                    amount: Math.round(item.product.price * 100),
                    name: item.product.name,
                    quantity: item.quantity,
                    default_quantity: item.quantity,
                    description: item.product.name,
                }))
            },
            customer_settings: {
                name: customerName,
                email: customerEmail,
                document: customerDocument.replace(/\D/g, ''),
                type: 'individual',
                phones: {
                    mobile_phone: {
                         country_code: "55",
                         area_code: customerPhone.replace(/\D/g, '').substring(0,2) || "11",
                         number: customerPhone.replace(/\D/g, '').substring(2) || "900000000"
                    }
                }
            },
            metadata: {
                customerId: customerId,
                orderId: orderData?.id
            }
        };

        const maskedKey = PAGARME_API_KEY ? `${PAGARME_API_KEY.substring(0, 6)}...` : 'UNDEFINED';
        console.log("Using Pagar.me Key (Sanitized):", maskedKey);
        
        const basicAuth = Buffer.from(`${PAGARME_API_KEY}:`).toString('base64');
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'DemirDiesel/1.0',
            'Authorization': `Basic ${basicAuth}`
        };

        // 4. Call Pagar.me API
        const response = await fetch(PAGARME_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(paymentLinkPayload)
        });

        const rawResponse = await response.text();
        console.log("Pagar.me Response Status:", response.status);
        console.log("Pagar.me Response Body:", rawResponse);

        let data;
        try {
            data = rawResponse ? JSON.parse(rawResponse) : {};
        } catch (e) {
            console.error("Failed to parse Pagar.me JSON:", e);
            return NextResponse.json({ error: 'Erro de comunicação com Pagar.me: Resposta inválida' }, { status: 502 });
        }

        if (!response.ok) {
            console.error("Pagar.me Error Data:", JSON.stringify(data, null, 2));
            return NextResponse.json({ error: 'Erro ao criar pagamento: ' + (data.message || 'Status ' + response.status) }, { status: response.status });
        }

        // 5. Success
        if (data.url) {
             return NextResponse.json({ url: data.url, orderId: orderData?.id });
        } else {
             console.error("Pagar.me success but no URL:", data);
             return NextResponse.json({ error: 'Link de pagamento não recebido.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Checkout API Error:", error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
