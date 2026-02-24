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

    activeClientId?: string; // New: Tracks current workspace
    preferences: {
        learningMode: boolean;
    };
    // Monetization
    subscription?: Subscription;
    creditsAvailable?: number;
}
