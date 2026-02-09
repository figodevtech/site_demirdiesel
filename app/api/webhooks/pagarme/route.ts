import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

async function findOrderByCustomerAndAmount(customerId?: number, amountCents?: number) {
    if (!customerId || !amountCents) return null;

    try {
        const windowStart = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabaseAdmin
            .from('venda')
            .select('id,valortotal,status,createdat,datavenda')
            .eq('clienteid', customerId)
            .gte('createdat', windowStart)
            .order('createdat', { ascending: false });

        if (error) {
            console.warn("DEBUG: Fallback lookup failed", error);
            return null;
        }

        const targetCents = Math.round(amountCents);
        const candidate = (data || []).find(row => {
            const rowCents = Math.round((row.valortotal || 0) * 100);
            return Math.abs(rowCents - targetCents) <= 100; // allow R$1 tolerance
        });

        return candidate?.id || null;
    } catch (err) {
        console.warn("DEBUG: Error during fallback order lookup", err);
        return null;
    }
}

async function findOrderByAmount(amountCents?: number) {
    if (!amountCents) return null;

    try {
        const windowStart = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabaseAdmin
            .from('venda')
            .select('id,valortotal,status,createdat,datavenda')
            .gte('createdat', windowStart)
            .order('createdat', { ascending: false });

        if (error) {
            console.warn("DEBUG: Fallback lookup (amount only) failed", error);
            return null;
        }

        const targetCents = Math.round(amountCents);
        const candidate = (data || []).find(row => {
            const rowCents = Math.round((row.valortotal || 0) * 100);
            const s = (row.status || '').toUpperCase();
            return Math.abs(rowCents - targetCents) <= 100 && (s === 'PENDENTE' || s === 'PAGAMENTO');
        });

        return candidate?.id || null;
    } catch (err) {
        console.warn("DEBUG: Error during fallback order lookup (amount only)", err);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        if (!HAS_SERVICE_ROLE) {
            console.warn("DEBUG: SUPABASE_SERVICE_ROLE_KEY ausente; usando client anon. Garanta que RLS esteja desabilitado ou permita update em 'venda'.");
        }

        const payload = await parsePayload(request);
        console.log("DEBUG: Pagar.me Webhook Received:", JSON.stringify(payload, null, 2));

        const eventType = payload.type || payload.event || payload.name;
        const data = payload.data?.object || payload.data?.order || payload.data || payload.object || {};
        const orderNode = data.order || data;
        const metadata = orderNode?.metadata || data?.metadata || payload.metadata || {};

        let orderId = metadata?.orderId || metadata?.order_id || metadata?.orderID;
        const pagarmeOrderRef = orderNode?.id || orderNode?.code || data?.id || data?.code || payload.data?.order_code;
        const statusFromPayload = orderNode?.status || data?.status || payload.status;
        const customerId = metadata?.customerId || metadata?.customer_id;
        const amountCents =
            orderNode?.amount ||
            orderNode?.amount_total ||
            orderNode?.paid_amount ||
            orderNode?.total_amount ||
            orderNode?.amount_with_taxes ||
            data?.amount ||
            data?.paid_amount;

        // As cobranças podem trazer o metadata quando o metadata raiz está vazio
        if (!orderId) {
            const charges = orderNode?.charges || data?.charges;
            const chargeMeta = charges?.[0]?.metadata || charges?.[0]?.last_transaction?.metadata;
            orderId = chargeMeta?.orderId || chargeMeta?.order_id;
        }

        // Último recurso: buscar a ordem no Pagar.me para tentar extrair metadata/orderId
        let fetchedOrder: any = null;
        if (!orderId && pagarmeOrderRef) {
            fetchedOrder = await fetchOrderFromPagarme(pagarmeOrderRef);
            const fetchedMeta = fetchedOrder?.metadata || {};
            orderId = fetchedMeta.orderId || fetchedMeta.order_id;
            if (!orderId && fetchedOrder?.code && /^\d+$/.test(String(fetchedOrder.code))) {
                orderId = fetchedOrder.code;
            }
        }

        // Heurística 1: casar por cliente + valor quando o metadata estiver ausente
        if (!orderId) {
            const derivedAmountCents = amountCents || fetchedOrder?.amount || fetchedOrder?.paid_amount || fetchedOrder?.total_amount;
            const derivedCustomer = customerId || fetchedOrder?.customer_id || fetchedOrder?.customer?.id;
            const numericCustomer = Number(derivedCustomer);
            const customerFilter = !Number.isNaN(numericCustomer) ? numericCustomer : undefined;

            if (customerFilter && derivedAmountCents) {
                const matched = await findOrderByCustomerAndAmount(customerFilter, derivedAmountCents);
                if (matched) {
                    console.log(`DEBUG: Fallback matched local order ${matched} using customer + amount`);
                    orderId = matched;
                }
            }
        }

        // Heurística 2: casar apenas pelo valor (recentes e status pendente)
        if (!orderId) {
            const derivedAmountCents = amountCents || fetchedOrder?.amount || fetchedOrder?.paid_amount || fetchedOrder?.total_amount;
            if (derivedAmountCents) {
                const matched = await findOrderByAmount(derivedAmountCents);
                if (matched) {
                    console.log(`DEBUG: Fallback matched local order ${matched} using amount only`);
                    orderId = matched;
                }
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

        // Trava rápida para evitar update indevido
        if (orderFilter === undefined || orderFilter === null) {
            console.warn("DEBUG: Order filter is undefined/null. Aborting update.");
            return NextResponse.json({ message: 'Order filter missing' }, { status: 200 });
        }

        if (!HAS_SERVICE_ROLE) {
            console.warn("DEBUG: SUPABASE_SERVICE_ROLE_KEY is missing. Webhook update may be blocked by RLS.");
        }

        const tryUpdate = async (statusToSet: string) => {
            return supabaseAdmin
                .from('venda')
                .update({ status: statusToSet })
                .eq('id', orderFilter)
                .select('id');
        };

        let { data: updatedRows, error } = await tryUpdate(newStatus);

        // Fallback: se o enum não tiver o status novo, tenta equivalentes antigos
        if (error && error.code === '22P02') {
            const fallback =
                newStatus === 'PAGO' ? 'PAGO' :
                newStatus === 'PENDENTE' ? 'PENDENTE' :
                newStatus === 'CANCELADO' ? 'CANCELADO' :
                newStatus === 'AUTORIZADO' ? 'AUTORIZADO' :
                newStatus;
            console.warn(`DEBUG: Enum reject for status ${newStatus}, trying fallback ${fallback}`);
            ({ data: updatedRows, error } = await tryUpdate(fallback));
        }

        if (error) {
            console.error("DEBUG: Error updating order via webhook:", error);
            return NextResponse.json({ error: 'DB Update failed' }, { status: 200 });
        }

        if (!updatedRows || updatedRows.length === 0) {
            console.warn(`DEBUG: No order updated for ID=${orderFilter}. Check if the ID matches your local table.`);
        }

        return NextResponse.json({ received: true, orderId: orderFilter, status: newStatus });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}
