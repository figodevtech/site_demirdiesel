import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log("DEBUG: Pagar.me Webhook Received:", JSON.stringify(payload, null, 2));

        // 1. Basic validation and very robust orderId lookup
        const eventType = payload.type; 
        
        // Comprehensive lookup for Order ID across different Pagar.me payload versions/types
        const orderId = payload.data?.metadata?.orderId || 
                        payload.data?.order?.metadata?.orderId ||
                        payload.data?.metadata?.order_id ||
                        payload.data?.code || // 'code' is often the internal ID sent to Pagar.me
                        payload.data?.order?.code;
        
        const status = payload.data?.status || payload.data?.order?.status; 

        console.log(`DEBUG: Event=${eventType}, OrderID_Found=${orderId}, Status=${status}`);

        if (!orderId) {
            console.warn("DEBUG: Webhook received without any recognizable Order ID. Payload structure might be new.");
            return NextResponse.json({ message: 'Order ID not found' }, { status: 200 });
        }

        // 2. Map Pagar.me status to site status
        let newStatus = 'PENDENTE';
        const normalizedStatus = status?.toLowerCase();
        
        if (eventType === 'order.paid' || normalizedStatus === 'paid' || normalizedStatus === 'captured') {
            newStatus = 'PAGO';
        } else if (normalizedStatus === 'authorized') {
            newStatus = 'AUTORIZADO';
        } else if (eventType === 'order.canceled' || normalizedStatus === 'canceled' || normalizedStatus === 'failed') {
            newStatus = 'CANCELADO';
        }

        // 3. Update DB using admin client (bypass RLS)
        console.log(`DEBUG: Updating Order #${orderId} to status: ${newStatus} (Original Pagar.me status: ${status})`);
        
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
