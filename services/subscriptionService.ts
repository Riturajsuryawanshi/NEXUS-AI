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

    static async upgradePlan(userId: string, planType: PlanType): Promise<void> {
        const plan = PLANS[planType];
        if (plan.price > 0) {
            await PaymentService.processPayment(userId, plan.price, plan.currency, 'subscription');
        }

        // Deactivate old active subscriptions
        await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', userId)
            .eq('status', 'active');

        // Create new subscription
        const { error } = await supabase
            .from('subscriptions')
            .insert([{
                user_id: userId,
                plan_type: planType,
                status: 'active',
                started_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
            }]);

        if (error) throw error;

        // Refresh user profile/context
        // In a real app we might trigger a webhook or client refresh
        UserService.refreshProfile();
    }

    static async purchaseCredits(userId: string, packId: string): Promise<void> {
        const pack = CREDIT_PACKS.find(p => p.id === packId);
        if (!pack) throw new Error('Invalid credit pack');

        await PaymentService.processPayment(userId, pack.price, 'INR', 'report_credit');

        // Upsert credits
        // This is race-condition prone in specialized cases but fine for MVP
        // Better to use an RPC 'increment_credits'

        // Check if row exists
        const { data: existing } = await supabase.from('report_credits').select('*').eq('user_id', userId).single();

        if (existing) {
            await supabase
                .from('report_credits')
                .update({ credits_available: existing.credits_available + pack.credits, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
        } else {
            await supabase
                .from('report_credits')
                .insert([{ user_id: userId, credits_available: pack.credits }]);
        }

        UserService.refreshProfile();
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
