// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderRequest {
    type: 'subscription' | 'credit_pack';
    itemId: string; // planType (solo, pro) or packId (1_report, etc)
}

const PLANS = {
    'solo': { price: 99900, currency: 'INR' }, // amount in smallest currency unit (paise)
    'pro': { price: 499900, currency: 'INR' },
    // enterprise is contact sales, free is 0
}

const CREDIT_PACKS = {
    '1_report': { price: 29900, currency: 'INR' },
    '5_reports': { price: 129900, currency: 'INR' },
    '10_reports': { price: 239900, currency: 'INR' },
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        const { type, itemId } = await req.json() as OrderRequest

        let amount = 0
        let currency = 'INR'

        // Calculate Price
        if (type === 'subscription') {
            const plan = PLANS[itemId as keyof typeof PLANS]
            if (!plan) throw new Error('Invalid plan selection')
            amount = plan.price
            currency = plan.currency
        } else if (type === 'credit_pack') {
            const pack = CREDIT_PACKS[itemId as keyof typeof CREDIT_PACKS]
            if (!pack) throw new Error('Invalid credit pack')
            amount = pack.price
            currency = pack.currency
        } else {
            throw new Error('Invalid payment type')
        }

        // Initialize Razorpay
        // We fetch credentials from env. 
        // Ideally use 'razorpay' npm package via esm.sh, but for simple order creation fetch is fine or lightweight wrapper
        const keyId = Deno.env.get('RAZORPAY_KEY_ID')
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!keyId || !keySecret) {
            console.error('Razorpay keys missing')
            throw new Error('Server configuration error')
        }

        // Call Razorpay API to create order
        // Basic Auth
        const auth = btoa(`${keyId}:${keySecret}`)

        const razorpayResp = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                amount: amount,
                currency: currency,
                receipt: `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
                notes: {
                    userId: user.id,
                    type,
                    itemId
                }
            })
        })

        if (!razorpayResp.ok) {
            const errorText = await razorpayResp.text()
            console.error('Razorpay Error:', errorText)
            throw new Error('Failed to create order with payment provider')
        }

        const orderData = await razorpayResp.json()

        // Log pending transaction to Database
        // We need service role to insert potentially if RLS is strict, but user should be able to view their own.
        // However, since we removed "insert own transactions", we MUST use service_role client here to insert.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: dbError } = await supabaseAdmin
            .from('payment_transactions')
            .insert({
                id: orderData.id, // Use Razorpay order_id as our ID
                user_id: user.id,
                amount: amount / 100, // Store as main unit
                currency: currency,
                payment_type: type === 'subscription' ? 'subscription' : 'report_credit',
                status: 'pending'
            })

        if (dbError) {
            console.error('DB Insert Error:', dbError)
            throw new Error('Failed to log transaction')
        }

        return new Response(
            JSON.stringify({
                orderId: orderData.id,
                amount: amount,
                currency: currency,
                keyId: keyId // Send keyId to client to initialize checkout
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
