import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const RAW_KEY = process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY || '';
const PAGARME_API_KEY = RAW_KEY.trim().replace(/^["']|["']$/g, '');
const IS_TEST = PAGARME_API_KEY.startsWith('sk_test');
const BASE_URL = IS_TEST ? 'https://sdx-api.pagar.me/core/v5' : 'https://api.pagar.me/core/v5';
const BASIC_AUTH = PAGARME_API_KEY ? Buffer.from(`${PAGARME_API_KEY}:`).toString('base64') : '';
const HAS_SERVICE_ROLE = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

async function parsePayload(request: Request) {
    const rawBody = await request.text();

    if (!rawBody) return {};

    try {
        return JSON.parse(rawBody);
    } catch (jsonErr) {
        try {
            return Object.fromEntries(new URLSearchParams(rawBody));
        } catch (formErr) {
            console.error("DEBUG: Unable to parse webhook body", { jsonErr, formErr, rawBody });
            return {};
        }
    }
}

async function fetchOrderFromPagarme(orderRef: string) {
    if (!orderRef || !PAGARME_API_KEY) return null;

    try {
        const response = await fetch(`${BASE_URL}/orders/${orderRef}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${BASIC_AUTH}`
            }
        });

        if (!response.ok) {
            console.warn(`DEBUG: Failed to fetch order ${orderRef} from Pagar.me. Status=${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("DEBUG: Error fetching order from Pagar.me", error);
        return null;
    }
}

function resolveStatus(eventType?: string, status?: string) {
    const normalizedEvent = (eventType || '').toLowerCase();
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedEvent.includes('canceled') || normalizedEvent.includes('payment_failed') || normalizedStatus === 'canceled' || normalizedStatus === 'failed') {
        return 'CANCELADO';
    }

    if (normalizedStatus === 'authorized' || normalizedEvent.includes('authorized')) {
        return 'AUTORIZADO';
    }

    if (normalizedEvent.includes('paid') || normalizedStatus === 'paid' || normalizedStatus === 'captured' || normalizedStatus === 'closed') {
        return 'PAGO';
    }

    return 'PENDENTE';
}

export async function POST(request: Request) {
    try {
        const payload = await parsePayload(request);
        console.log("DEBUG: Pagar.me Webhook Received:", JSON.stringify(payload, null, 2));

        const eventType = payload.type || payload.event || payload.name;
        const data = payload.data?.object || payload.data?.order || payload.data || payload.object || {};
        const orderNode = data.order || data;
        const metadata = orderNode?.metadata || data?.metadata || payload.metadata || {};

        let orderId = metadata?.orderId || metadata?.order_id || metadata?.orderID;
        const pagarmeOrderRef = orderNode?.id || orderNode?.code || data?.id || data?.code;
        const statusFromPayload = orderNode?.status || data?.status || payload.status;

        // Charges metadata can carry the order reference when the root metadata is empty
        if (!orderId) {
            const charges = orderNode?.charges || data?.charges;
            const chargeMeta = charges?.[0]?.metadata || charges?.[0]?.last_transaction?.metadata;
            orderId = chargeMeta?.orderId || chargeMeta?.order_id;
        }

        // As a last resort, fetch the order from Pagar.me to extract metadata/orderId
        let fetchedOrder: any = null;
        if (!orderId && pagarmeOrderRef) {
            fetchedOrder = await fetchOrderFromPagarme(pagarmeOrderRef);
            const fetchedMeta = fetchedOrder?.metadata || {};
            orderId = fetchedMeta.orderId || fetchedMeta.order_id;
            if (!orderId && fetchedOrder?.code && /^\d+$/.test(String(fetchedOrder.code))) {
                orderId = fetchedOrder.code;
            }
        }

        if (orderId) {
            orderId = String(orderId).trim();
        }

        console.log(`DEBUG: Event=${eventType}, OrderRef=${pagarmeOrderRef}, LocalOrderId=${orderId}, Status=${statusFromPayload}`);

        if (!orderId) {
            console.warn("DEBUG: Webhook received without any recognizable Order ID. Nothing to update.");
            return NextResponse.json({ message: 'Order ID not found' }, { status: 200 });
        }

        const paymentSource = orderNode?.last_transaction
            || data?.last_transaction
            || data?.charges?.[0]?.last_transaction
            || fetchedOrder?.charges?.[0]?.last_transaction;

        const paymentMethod = paymentSource?.payment_method || 'Pagar.me';
        const newStatus = resolveStatus(eventType, statusFromPayload || fetchedOrder?.status);

        const numericOrderId = Number(orderId);
        const orderFilterIsNumeric = !Number.isNaN(numericOrderId);
        const orderFilter = orderFilterIsNumeric ? numericOrderId : orderId;

        if (!orderFilterIsNumeric && typeof orderFilter === 'string' && !/^\d+$/.test(orderFilter)) {
            console.warn(`DEBUG: Order ID "${orderFilter}" is not numeric. Skipping DB update to avoid type mismatch.`);
            return NextResponse.json({ message: 'Order ID format not supported' }, { status: 200 });
        }

        if (!HAS_SERVICE_ROLE) {
            console.warn("DEBUG: SUPABASE_SERVICE_ROLE_KEY is missing. Webhook update may be blocked by RLS.");
        }

        const { data: updatedRows, error } = await supabaseAdmin
            .from('pedido')
            .update({
                status: newStatus,
                forma_pagamento: paymentMethod
            })
            .eq('id', orderFilter)
            .select('id');

        if (error) {
            console.error("DEBUG: Error updating order via webhook:", error);
            return NextResponse.json({ error: 'DB Update failed' }, { status: 500 });
        }

        if (!updatedRows || updatedRows.length === 0) {
            console.warn(`DEBUG: No order updated for ID=${orderFilter}. Check if the ID matches your local table.`);
        }

        return NextResponse.json({ received: true, orderId: orderFilter, status: newStatus });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
