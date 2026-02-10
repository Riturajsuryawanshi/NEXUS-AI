import { supabase } from './supabaseClient';
import { PlanType, Subscription, PlanConfig } from '../types';
import { PaymentService } from './paymentService';
import { UserService } from './userService';

export const PLANS: Record<PlanType, PlanConfig> = {
    free: {
        id: 'free',
        label: 'Explorer',
        price: 0,
        currency: 'INR',
        features: ['1 Client Limit', 'Basic Data Analysis', 'Make Money Preview'],
        limits: { clients: 1, reportsPerMonth: 0, canExport: false, whiteLabel: false }
    },
    solo: {
        id: 'solo',
        label: 'Freelancer',
        price: 999,
        currency: 'INR',
        features: ['5 Clients', 'Full Make Money Access', '10 Reports/mo', 'Excel/PDF Export'],
        limits: { clients: 5, reportsPerMonth: 10, canExport: true, whiteLabel: false }
    },
    pro: {
        id: 'pro',
        label: 'Agency',
        price: 4999,
        currency: 'INR',
        features: ['50 Clients', 'Unlimited Reports', 'White Labeling', 'Priority Support'],
        limits: { clients: 50, reportsPerMonth: 'unlimited', canExport: true, whiteLabel: true }
    },
    enterprise: {
        id: 'enterprise',
        label: 'Enterprise',
        price: 0, // Contact Sales
        currency: 'USD',
        features: [],
        limits: { clients: 999, reportsPerMonth: 'unlimited', canExport: true, whiteLabel: true }
    }
};

export const CREDIT_PACKS = [
    { id: '1_report', credits: 1, price: 299, label: 'Single Report' },
    { id: '5_reports', credits: 5, price: 1299, label: '5 Report Pack' },
    { id: '10_reports', credits: 10, price: 2399, label: '10 Report Pack' }
];

export class SubscriptionService {

    static async getCurrentSubscription(userId: string): Promise<Subscription | null> {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
            console.error('Error fetching subscription:', error);
            return null;
        }

        if (!data) return null;

        return {
            id: data.id,
            userId: data.user_id,
            planType: data.plan_type as PlanType,
            status: data.status as any,
            startedAt: new Date(data.started_at).getTime(),
            expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : 0
        };
    }

    static async getCredits(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('report_credits')
            .select('credits_available')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no row exists, treat as 0 credits
            return 0;
        }
        return data?.credits_available || 0;
    }

    static async createSubscriptionOrder(planType: PlanType): Promise<any> {
        const plan = PLANS[planType];
        if (plan.price > 0) {
            return await PaymentService.createOrder('subscription', planType);
        }
        // Free plan logic if needed, or handle separately
        return null;
    }

    static async createCreditPurchaseOrder(packId: string): Promise<any> {
        return await PaymentService.createOrder('credit_pack', packId);
    }

    static async consumeCredit(userId: string): Promise<boolean> {
        const credits = await this.getCredits(userId);
        if (credits <= 0) return false;

        // Use RPC for atomic decrement would be better, but doing client-side for now
        const { error } = await supabase
            .from('report_credits')
            .update({ credits_available: credits - 1, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (error) return false;

        UserService.refreshProfile();
        return true;
    }
}
