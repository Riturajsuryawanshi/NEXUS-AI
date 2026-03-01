// Setup Guide: https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

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
            console.error('Webhook Error: Missing secret or signature')
            throw new Error('Configuration or Signature missing')
        }

        // Verify Signature
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
            console.error('Webhook Error: Invalid Signature')
            throw new Error('Invalid Signature')
        }

        const event = JSON.parse(body)
        console.log(`Received Razorpay event: ${event.event}`)

        if (event.event === 'payment.captured' || event.event === 'subscription.charged') {
            let notes, orderOrSubId;

            if (event.event === 'payment.captured') {
                const payment = event.payload.payment.entity
                orderOrSubId = payment.order_id
                notes = payment.notes
            } else {
                const sub = event.payload.subscription.entity
                orderOrSubId = sub.id
                notes = sub.notes
            }

            console.log(`Fulfilling: ${orderOrSubId}`)

            if (!orderOrSubId) {
                console.log('No order/subscription ID found')
                return new Response(JSON.stringify({ received: true }), { status: 200 })
            }

            // 1. Update Transaction Status
            const { error: txError } = await supabaseAdmin
                .from('payment_transactions')
                .update({ status: 'success' })
                .eq('id', orderOrSubId)

            if (txError) console.error('Error updating transaction:', txError)

            // 2. Grant Entitlements
            const userId = notes.userId
            const type = notes.type
            const itemId = notes.itemId

            if (!userId || !type) {
                console.error('Missing metadata in notes:', notes)
                return new Response(JSON.stringify({ received: true }), { status: 200 })
            }

            if (type === 'subscription') {
                console.log(`Activating/Renewing ${itemId} subscription for user ${userId}`)

                // 1. Deactivate old active subscriptions for this user
                await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('user_id', userId)
                    .eq('status', 'active')

                // 2. Create new active subscription record
                const { error: subError } = await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: itemId,
                        status: 'active',
                        started_at: new Date().toISOString(),
                        expires_at: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
                    })

                if (subError) console.error('Error creating subscription:', subError)

            } else if (type === 'credit_pack') {
                const creditAmount = parseInt(itemId.split('_')[0]) || 0
                console.log(`Granting ${creditAmount} credits to user ${userId}`)

                // Get current credits
                const { data: creditData } = await supabaseAdmin
                    .from('report_credits')
                    .select('credits_available')
                    .eq('user_id', userId)
                    .maybeSingle()

                const currentCredits = creditData?.credits_available || 0

                const { error: creditError } = await supabaseAdmin
                    .from('report_credits')
                    .upsert({
                        user_id: userId,
                        credits_available: currentCredits + creditAmount,
                        updated_at: new Date().toISOString()
                    })

                if (creditError) console.error('Error updating credits:', creditError)
            }
        } else if (event.event === 'payment.failed' || event.event === 'subscription.halted') {
            const id = event.payload.payment?.entity?.order_id || event.payload.subscription?.entity?.id
            console.log(`Payment failed/Subscription halted for: ${id}`)

            if (id) {
                await supabaseAdmin
                    .from('payment_transactions')
                    .update({ status: 'failed' })
                    .eq('id', id)

                // If sub halted, maybe deactivate
                if (event.event === 'subscription.halted') {
                    const userId = event.payload.subscription.entity.notes.userId
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({ status: 'cancelled' })
                        .eq('user_id', userId)
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        const msg = error?.message || String(error);
        console.error('Webhook Error:', msg)
        return new Response(
            JSON.stringify({ error: msg }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})

