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
        currency: 'INR',
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
        price: 849,
        originalPrice: 1699,
        discount: 50,
        currency: 'INR',
        features: [
            '50 Reports / month',
            'Full AI-powered analysis',
            'Download PDF reports',
            'Save & revisit reports',
            'AI business suggestions',
            'Priority processing',
        ],
        limits: { clients: 10, reportsPerMonth: 50, canExport: true, whiteLabel: false },
        paymentUrl: 'https://rzp.io/rzp/hbaQFRC'
    },
    agency: {
        id: 'agency',
        label: 'Agency',
        price: 4249,
        originalPrice: 8499,
        discount: 50,
        currency: 'INR',
        features: [
            'Unlimited reports',
            'Everything in Pro',
            'White-label PDF branding',
            'API access',
            'Team seats (up to 5)',
            'Priority support',
            'Bulk URL analysis',
        ],
        limits: { clients: 50, reportsPerMonth: 'unlimited', canExport: true, whiteLabel: true },
        paymentUrl: 'https://rzp.io/rzp/uklJppfP'
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
            .maybeSingle();

        if (error) {
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
            .maybeSingle();

        if (error || !data) {
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

    static async createCreditOrder(packId: string): Promise<any> {
        return await PaymentService.createOrder('credit_pack', packId);
    }

    static async consumeCredit(userId: string): Promise<boolean> {
        // Use RPC for atomic decrement
        const { data, error } = await supabase.rpc('consume_report_credit', {
            p_user_id: userId
        });

        if (error || data === false) {
            console.error('Error consuming credit:', error);
            return false;
        }

        UserService.refreshProfile();
        return true;
    }

    // --- Monthly Usage Tracking ---

    static async getMonthlyUsage(userId: string): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error } = await supabase
            .from('business_audits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', startOfMonth);

        if (error) {
            console.error('Error fetching monthly usage:', error);
            return 0;
        }
        return count || 0;
    }

    static getReportLimit(planType: PlanType): number | 'unlimited' {
        return PLANS[planType]?.limits?.reportsPerMonth ?? 3;
    }

    static async canGenerateReport(userId: string, planType: PlanType): Promise<{ allowed: boolean; used: number; limit: number | 'unlimited'; hasCredits: boolean }> {
        const limit = this.getReportLimit(planType);
        if (limit === 'unlimited') {
            return { allowed: true, used: 0, limit: 'unlimited', hasCredits: true };
        }

        const used = await this.getMonthlyUsage(userId);
        const credits = await this.getCredits(userId);

        return {
            allowed: (used < limit) || (credits > 0),
            used,
            limit,
            hasCredits: credits > 0
        };
    }
}
