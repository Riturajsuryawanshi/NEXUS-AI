// Setup Guide: https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode, decode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    try {
        const signature = req.headers.get('x-razorpay-signature')
        const body = await req.text()
        const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')

        if (!secret || !signature) {
            throw new Error('Configuration or Signature missing')
        }

        // Verify Signature
        // Manual HMAC-SHA256 verification in Deno
        const key = await crypto.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign", "verify"]
        );
        const verified = await crypto.crypto.subtle.verify(
            "HMAC",
            key,
            decode(new TextEncoder().encode(signature)),
            new TextEncoder().encode(body)
        );

        if (!verified) {
            throw new Error('Invalid Signature')
        }

        const event = JSON.parse(body)
        const { payload } = event

        // We primarily care about 'payment.captured' or 'order.paid'
        // Let's rely on 'payment.captured' as that means money is definitely ours
        // OR 'order.paid' if that covers the full flow.
        // Razorpay flow: Order -> Payment -> Capture. 
        // 'payment.captured' is the safest 'success' state for standard payments.

        if (event.event === 'payment.captured') {
            const payment = payload.payment.entity
            const orderId = payment.order_id
            const notes = payment.notes // We passed userId, type, itemId in create-order notes

            if (!orderId) {
                console.log('No order_id found in payment, potentially direct payment?', payment.id)
                // Handle edge case or ignore
                return new Response(JSON.stringify({ received: true }), { status: 200 })
            }

            // 1. Update Transaction Status
            const { error: txError } = await supabaseAdmin
                .from('payment_transactions')
                .update({ status: 'success' })
                .eq('id', orderId)

            if (txError) console.error('Error updating transaction:', txError)

            // 2. Grant Entitlements
            const userId = notes.userId
            const type = notes.type
            const itemId = notes.itemId

            if (!userId || !type) {
                console.error('Missing metadata in payment notes', notes)
                // Can't fulfill without user info
                return new Response(JSON.stringify({ received: true }), { status: 200 })
            }

            if (type === 'subscription') {
                // Cancel old active subs
                await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('user_id', userId)
                    .eq('status', 'active')

                // Create new sub
                await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: itemId, // solo, pro
                        status: 'active',
                        started_at: new Date().toISOString(),
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
                    })
            } else if (type === 'credit_pack') {
                // Determine credit amount
                let credits = 0
                if (itemId === '1_report') credits = 1
                if (itemId === '5_reports') credits = 5
                if (itemId === '10_reports') credits = 10

                // Get existing
                const { data: existing } = await supabaseAdmin
                    .from('report_credits')
                    .select('*')
                    .eq('user_id', userId)
                    .single()

                if (existing) {
                    await supabaseAdmin
                        .from('report_credits')
                        .update({
                            credits_available: existing.credits_available + credits,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId)
                } else {
                    await supabaseAdmin
                        .from('report_credits')
                        .insert({ user_id: userId, credits_available: credits })
                }
            }
        } else if (event.event === 'payment.failed') {
            const payment = payload.payment.entity
            const orderId = payment.order_id

            if (orderId) {
                await supabaseAdmin
                    .from('payment_transactions')
                    .update({ status: 'failed' })
                    .eq('id', orderId)
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Webhook Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
