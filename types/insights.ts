export interface Brain2Result {
    summary: string;
    key_insights: string[];
    risks_or_anomalies?: string[];
    suggested_kpis: string[];
    learning_notes?: string;
    causal_explanation?: string;
    token_usage?: number;
}

export interface BusinessContext {
    businessType: string;
    primaryGoal: string;
    primaryKPI: string;
    currency: string;
    timeGranularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Client {
    id: string;
    name: string;
    industry: string;
    currency: string;
    businessContext: BusinessContext;
    createdAt: number;
    datasetCount?: number;
    lastActiveAt?: number;
}

export interface Opportunity {
    id: string;
    type: 'revenue_gain' | 'cost_leak' | 'optimization';
    title: string;
    affectedKPI: string;
    estimatedImpact: number;
    estimatedCost: number;
    roiScore: number;
    confidence: number;
    description: string;
    actionPlan: string[];
    dimension?: string;
    factor?: string;
    effort?: 'low' | 'medium' | 'high';
}

export interface BusinessDecision {
    id: string;
    title: string;
    whyItMatters: string;
    action: string;
    expectedGain: number;
    confidence: number;
    type: 'top_3' | 'quick_win' | 'high_impact';
    riskLevel: 'low' | 'medium' | 'high';
    timeToImpact: string;
    affectedSegment: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    actionHint?: string;
}
