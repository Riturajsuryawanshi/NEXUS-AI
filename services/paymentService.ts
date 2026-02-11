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
    ): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
        const { data, error } = await supabase.functions.invoke('create-order', {
            body: { type: paymentType, itemId }
        });

        if (error) {
            console.error('Order creation failed', error);
            throw new Error('Failed to initiate payment');
        }

        return data;
    }
}
