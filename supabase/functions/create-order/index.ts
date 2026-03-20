// Setup Guide: https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderRequest {
    type: 'subscription' | 'credit_pack';
    itemId: string;
}

const PLANS = {
    'pro': { razorpay_plan_id: 'plan_SLEPj9zq2QzgR8', price: 84900, currency: 'INR' },    // ₹849
    'agency': { razorpay_plan_id: 'plan_SLER0JQ19whDD9', price: 424900, currency: 'INR' },  // ₹4,249
}

const CREDIT_PACKS = {
    'pack_1': { credits: 1, price: 1500, currency: 'INR' },  // ₹15  — single report
    'pack_5': { credits: 5, price: 4900, currency: 'INR' },  // ₹49  — 5 credits
    'pack_15': { credits: 15, price: 12900, currency: 'INR' },  // ₹129 — 15 credits
    'pack_40': { credits: 40, price: 29900, currency: 'INR' },  // ₹299 — 40 credits
}


serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('Missing Authorization header')
            throw new Error('Authentication required')
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            console.error('User auth error:', userError)
            throw new Error('Unauthorized')
        }

        const { type, itemId } = await req.json() as OrderRequest
        console.log(`Processing ${type} order for user ${user.id}, item: ${itemId}`)

        const keyId = Deno.env.get('RAZORPAY_KEY_ID')
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!keyId || !keySecret) {
            console.error('CRITICAL: Razorpay keys missing from environment variables')
            throw new Error('Server configuration error: Payment provider not configured')
        }

        const auth = btoa(`${keyId}:${keySecret}`)
        let resultData: any = {}

        if (type === 'subscription') {
            const plan = PLANS[itemId as keyof typeof PLANS]
            if (!plan) {
                console.error(`Invalid plan: ${itemId}. Available:`, Object.keys(PLANS))
                throw new Error('Invalid plan selection')
            }

            console.log(`Creating subscription for plan: ${plan.razorpay_plan_id}`)
            const razorpayResp = await fetch('https://api.razorpay.com/v1/subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                    plan_id: plan.razorpay_plan_id,
                    total_count: 1200, // 100 years worth of monthly cycles
                    quantity: 1,
                    customer_notify: 1,
                    notes: { userId: user.id, type, itemId }
                })
            })

            if (!razorpayResp.ok) {
                const errorText = await razorpayResp.text()
                console.error('Razorpay Subscription API Error:', errorText)
                throw new Error(`Razorpay Error: ${errorText}`)
            }

            const subscriptionData = await razorpayResp.json()
            console.log(`Razorpay subscription created: ${subscriptionData.id}`)

            resultData = {
                subscriptionId: subscriptionData.id,
                amount: plan.price,
                currency: plan.currency,
                keyId: keyId
            }

        } else if (type === 'credit_pack') {
            const pack = CREDIT_PACKS[itemId as keyof typeof CREDIT_PACKS]
            if (!pack) {
                console.error(`Invalid credit pack: ${itemId}. Available:`, Object.keys(CREDIT_PACKS))
                throw new Error('Invalid credit pack selection')
            }
            console.log(`Credit pack: ${pack.credits} credits for ₹${pack.price / 100}`)

            const razorpayResp = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                    amount: pack.price,
                    currency: pack.currency,
                    receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
                    notes: { userId: user.id, type, itemId, credits: pack.credits }
                })
            })

            if (!razorpayResp.ok) {
                const errorText = await razorpayResp.text()
                console.error('Razorpay Order API Error:', errorText)
                throw new Error(`Razorpay Error: ${errorText}`)
            }

            const orderData = await razorpayResp.json()
            console.log(`Razorpay order created: ${orderData.id}`)

            resultData = {
                orderId: (orderData as any).id,
                amount: pack.price,
                currency: pack.currency,
                keyId: keyId,
                credits: pack.credits
            }
        } else {
            throw new Error('Invalid payment type')
        }

        // Log transaction in database
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: dbError } = await supabaseAdmin
            .from('payment_transactions')
            .upsert({
                id: resultData.orderId || resultData.subscriptionId,
                user_id: user.id,
                amount: resultData.amount / 100,
                currency: resultData.currency,
                payment_type: type === 'subscription' ? 'subscription' : 'report_credit',
                status: 'pending'
            })

        if (dbError) {
            console.error('Database Error (payment_transactions):', dbError)
        }

        return new Response(
            JSON.stringify(resultData),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error: any) {
        const msg = error?.message || String(error);
        console.error('create-order error:', msg)
        return new Response(
            JSON.stringify({ error: msg }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})

