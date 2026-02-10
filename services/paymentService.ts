import { supabase } from './supabaseClient';
import { PaymentTransaction } from '../types';

export class PaymentService {
    /**
     * Simulates a payment processing delay and result.
     * In a real app, this would integrate with Stripe/Razorpay.
     */
    static async processPayment(
        userId: string,
        amount: number,
        currency: string,
        paymentType: 'subscription' | 'report_credit'
    ): Promise<PaymentTransaction> {

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 90% success rate for simulation
        const isSuccess = Math.random() > 0.1;
        const status = isSuccess ? 'success' : 'failed';

        const transaction: Partial<PaymentTransaction> = {
            userId,
            amount,
            currency,
            type: paymentType,
            status,
            createdAt: Date.now()
        };

        // Log transaction to DB
        const { data, error } = await supabase
            .from('payment_transactions')
            .insert([{
                user_id: userId,
                amount,
                currency,
                payment_type: paymentType,
                status
            }])
            .select()
            .single();

        if (error) {
            console.error('Failed to log transaction', error);
            throw new Error('Transaction logging failed');
        }

        if (status === 'failed') {
            throw new Error('Payment declined by bank');
        }

        return {
            id: data.id,
            userId: data.user_id,
            amount: data.amount,
            currency: data.currency,
            type: data.payment_type as any,
            status: data.status as any,
            createdAt: new Date(data.created_at).getTime()
        };
    }
}
