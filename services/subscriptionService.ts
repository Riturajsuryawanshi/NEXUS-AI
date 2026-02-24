import { supabase } from './supabaseClient';
import { PlanType, Subscription, PlanConfig } from '../types';
import { PaymentService } from './paymentService';
import { UserService } from './userService';

export const PLANS: Record<PlanType, PlanConfig> = {
    free: {
        id: 'free',
        label: 'Free',
        price: 0,
        originalPrice: 0,
        discount: 0,
        currency: 'USD',
        features: [
            '3 Reports / month',
            'Basic 11-section analysis',
            'Rating & sentiment breakdown',
            'View-only (no export)',
        ],
        limits: { clients: 1, reportsPerMonth: 3, canExport: false, whiteLabel: false }
    },
    pro: {
        id: 'pro',
        label: 'Pro',
        price: 10,
        originalPrice: 20,
        discount: 50,
        currency: 'USD',
        features: [
            '50 Reports / month',
            'Full AI-powered analysis',
            'Download PDF reports',
            'Save & revisit reports',
            'AI business suggestions',
            'Priority processing',
        ],
        limits: { clients: 10, reportsPerMonth: 50, canExport: true, whiteLabel: false }
    },
    agency: {
        id: 'agency',
        label: 'Agency',
        price: 50,
        originalPrice: 100,
        discount: 50,
        currency: 'USD',
        features: [
            'Unlimited reports',
            'Everything in Pro',
            'White-label PDF branding',
            'API access',
            'Team seats (up to 5)',
            'Priority support',
            'Bulk URL analysis',
        ],
        limits: { clients: 50, reportsPerMonth: 'unlimited', canExport: true, whiteLabel: true }
    },
};

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
        return null;
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
