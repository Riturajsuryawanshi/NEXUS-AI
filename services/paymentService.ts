import { supabase } from './supabaseClient';
import { PaymentTransaction } from '../types';

export class PaymentService {
    /**
     * Simulates a payment processing delay and result.
     * In a real app, this would integrate with Stripe/Razorpay.
     */
    /**
     * Creates a payment order via the backend Edge Function.
     */
    static async createOrder(
        paymentType: 'subscription' | 'credit_pack',
        itemId: string
    ): Promise<{ orderId?: string; subscriptionId?: string; amount: number; currency: string; keyId: string }> {
        // Retrieve the current user's session token to authorize the Edge Function call
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
            throw new Error('You must be logged in to initiate a payment.');
        }

        const { data, error } = await supabase.functions.invoke('create-order', {
            body: { type: paymentType, itemId },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (error) {
            console.error('Order creation failed:', error);

            let message = 'Failed to initiate payment';

            // Supabase Functions error often includes a 'context' which is the raw response
            if (error as any) {
                const e = error as any;
                if (e.message) message = e.message;

                // If it's a non-2xx response from the function, we check the body
                try {
                    if (e.context && typeof e.context.json === 'function') {
                        const body = await e.context.json();
                        if (body && body.error) message = body.error;
                    }
                } catch (jsonErr) {
                    console.warn('Could not parse error JSON body', jsonErr);
                }
            }

            throw new Error(message);
        }

        return data;
    }
}
