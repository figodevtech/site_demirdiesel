import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log("DEBUG: Pagar.me Webhook Received:", JSON.stringify(payload, null, 2));

        // 1. Basic validation (optional signature check for production)
        // Pagar.me v5 typically sends the event object header
        const eventType = payload.type; // e.g. 'order.paid'
        const orderId = payload.data?.metadata?.orderId;
        const status = payload.data?.status; // 'paid', 'canceled', etc

        if (!orderId) {
            console.warn("DEBUG: Webhook received without orderId in metadata.");
            return NextResponse.json({ message: 'No orderId' }, { status: 200 });
        }

        // 2. Map Pagar.me status to site status
        let newStatus = 'PENDENTE';
        if (eventType === 'order.paid' || status === 'paid') {
            newStatus = 'PAGO';
        } else if (eventType === 'order.canceled' || status === 'canceled' || status === 'failed') {
            newStatus = 'CANCELADO';
        }

        // 3. Update DB using admin client (bypass RLS)
        console.log(`DEBUG: Updating Order #${orderId} to status: ${newStatus}`);
        
        const { error } = await supabaseAdmin
            .from('pedido')
            .update({ 
                status: newStatus,
                // If it's a payment link, we might want to track more info
                forma_pagamento: payload.data?.last_transaction?.payment_method || 'Pagar.me'
            })
            .eq('id', orderId);

        if (error) {
            console.error("DEBUG: Error updating order via webhook:", error);
            return NextResponse.json({ error: 'DB Update failed' }, { status: 500 });
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
