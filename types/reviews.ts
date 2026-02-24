// ============================================
// Review Intelligence Types (11-Section Dashboard)
// ============================================

/** A single raw review record */
export interface RawReview {
    rating: number; // 1-5
    text: string;
    timestamp: string; // ISO date string
    author?: string;
}

/** Output of Step 3: Deterministic Preprocessing (NO AI) */
export interface ReviewPreprocessResult {
    business_name: string;
    business_industry?: string;
    business_location?: string;
    total_reviews: number;
    average_rating: number;
    rating_distribution: { [star: number]: number };
    negative_review_percentage: number;
    positive_review_percentage: number;
    top_keywords: { word: string; count: number }[];
    time_trends: { month: string; avgRating: number; count: number; negativeCount: number }[];
    sentiment_breakdown: { positive: number; negative: number; neutral: number };
    raw_review_clusters_input: {
        negative_reviews_summary: string[];
        positive_reviews_summary: string[];
    };
}

// ============================================
// 11-Section AI Insight Types
// ============================================

/** Section 1: Business Overview */
export interface BusinessOverview {
    category: string;
    sub_category?: string;
    years_in_operation?: string;
    review_volume_assessment: string; // e.g. "High volume (5000+ reviews) — statistically reliable"
}

/** Section 2: Sentiment Breakdown */
export interface SentimentAnalysis {
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
    repeat_complaints_percentage: number;
    repeat_praises_percentage: number;
    sentiment_summary: string;
}

/** Section 3: Strengths */
export interface StrengthItem {
    theme: string;
    frequency: string; // e.g. "Mentioned 45+ times"
    description: string;
    sample_quotes: string[];
}

/** Section 4: Weaknesses */
export interface WeaknessItem {
    category: string; // Service, Hygiene, Pricing, etc.
    theme: string;
    frequency: string;
    recency: string; // e.g. "Increasing in last 3 months"
    is_increasing: boolean;
    description: string;
}

/** Section 5: Operational Gaps */
export interface OperationalGap {
    complaint: string;
    business_problem: string;
    root_cause: string;
}

/** Section 6: Reputation Risk */
export interface ReputationRisk {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    negative_review_type: string; // "emotional" or "factual"
    management_responds: boolean;
    response_quality: string; // "professional", "defensive", "absent"
    accountability_score: number; // 1-10
    summary: string;
}

/** Section 7: Competitive Positioning */
export interface CompetitivePositioning {
    rating_vs_competitors: string;
    review_volume_vs_competitors: string;
    common_complaints_vs_industry: string;
    market_position_summary: string;
}

/** Section 8: Financial Impact */
export interface FinancialImpact {
    risk_areas: {
        issue: string;
        customer_segment_affected: string;
        estimated_revenue_impact: string;
        explanation: string;
    }[];
    overall_revenue_risk: string;
}

/** Section 9: Priority Fix */
export interface PriorityFix {
    priority: 'critical' | 'medium' | 'low';
    issue: string;
    action_steps: string[];
}

/** Section 10: SWOT */
export interface SWOTAnalysis {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

/** Section 11: Health Scores */
export interface HealthScores {
    service: number; // 1-10
    product: number;
    management: number;
    reputation: number;
    operational_stability: number;
    overall: number;
    summary: string;
}

/** Complete AI Insight (all 11 sections) */
export interface ReviewAIInsight {
    // Section 1
    business_overview: BusinessOverview;
    // Section 2
    sentiment_analysis: SentimentAnalysis;
    // Section 3
    strengths: StrengthItem[];
    // Section 4
    weaknesses: WeaknessItem[];
    // Section 5
    operational_gaps: OperationalGap[];
    // Section 6
    reputation_risk: ReputationRisk;
    // Section 7
    competitive_positioning: CompetitivePositioning;
    // Section 8
    financial_impact: FinancialImpact;
    // Section 9
    priority_fixes: PriorityFix[];
    // Section 10
    swot: SWOTAnalysis;
    // Section 11
    health_scores: HealthScores;

    // Legacy fields (kept for backward compat)
    business_summary: string;
    what_people_like: string[];
    what_people_dislike: string[];
    complaint_clusters: {
        theme: string;
        frequency_indicator: string;
        impact_explanation: string;
        recommended_action: string;
    }[];
    revenue_risk_summary: string;
    improvement_priorities: string[];
    opportunity_areas: string[];
}

/** Legacy compatibility types */
export interface ReviewCluster {
    theme: string;
    frequency_percentage: number;
    sentiment: 'positive' | 'negative' | 'mixed';
    key_complaints_or_praises: string[];
    business_impact_estimate: string;
}

export interface RevenueLeak {
    issue: string;
    potential_business_risk: string;
    recommended_fix: string;
    estimated_loss?: string;
}

export interface UpsellOpportunity {
    opportunity: string;
    supporting_review_pattern: string;
    potential_impact?: string;
}

/** Combined output from the full pipeline */
export interface ReviewAudit {
    source: 'full' | 'deterministic';
    preprocess: ReviewPreprocessResult;
    ai_insights: ReviewAIInsight | null;
    business_summary: {
        name: string;
        rating: number;
        total_reviews: number;
        place_id: string;
    };
    review_clusters: ReviewCluster[];
    revenue_leak_indicators: RevenueLeak[];
    upsell_opportunities: UpsellOpportunity[];
    generatedAt: number;
}
