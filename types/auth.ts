import { Subscription } from './monetization';

export type PlanType = 'free' | 'pro' | 'agency';
export type AuthProvider = 'email' | 'google' | 'apple' | 'both';

export interface UserProfile {
    userId: string;
    email?: string; // Added email field
    planType: PlanType;
    dailyFileLimit: number;
    filesProcessedToday: number;
    aiCallsRemaining: number;
    aiTokensUsedToday: number;
    aiTokensLimitDaily: number;
    lastUsageResetAt: number;
    authProvider: AuthProvider;
    displayName?: string;
    avatarUrl?: string;

    // Professional Identity
    role?: 'agency_owner' | 'consultant' | 'marketer' | 'analyst' | 'other';
    companyName?: string;
    companyWebsite?: string;
    teamSize?: '1' | '2-10' | '11-50' | '50+';

    // Business Focus
    primaryIndustry?: 'ecommerce' | 'saas' | 'hospitality' | 'retail' | 'healthcare' | 'mixed' | 'other';
    mainUseCase?: 'review_intelligence' | 'financial_proof' | 'general_analysis' | 'other';
    defaultCurrency?: string;

    isAdmin: boolean; // New: Admin flag from DB

    activeClientId?: string; // New: Tracks current workspace
    preferences: {
        learningMode: boolean;
        emailAlerts_jobCompletion?: boolean;
        emailAlerts_weeklySummary?: boolean;
    };
    // Monetization
    subscription?: Subscription;
    creditsAvailable?: number;
}
