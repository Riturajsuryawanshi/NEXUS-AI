import { PlanType } from './auth';

export interface Subscription {
    id: string;
    userId: string; // references profiles.id
    planType: PlanType;
    status: 'active' | 'expired' | 'cancelled';
    startedAt: number;
    expiresAt: number;
}

export interface ReportCredit {
    id: string;
    userId: string;
    creditsAvailable: number;
    updatedAt: number;
}

export interface PaymentTransaction {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    type: 'subscription' | 'report_credit';
    status: 'success' | 'failed' | 'pending';
    createdAt: number;
}

export interface PlanConfig {
    id: PlanType;
    label: string;
    price: number; // Monthly price (discounted)
    originalPrice: number; // Original price before discount
    discount: number; // Discount percentage (e.g. 50)
    currency: string;
    features: string[];
    limits: {
        clients: number;
        reportsPerMonth: number | 'unlimited';
        canExport: boolean;
        whiteLabel: boolean;
    };
}
