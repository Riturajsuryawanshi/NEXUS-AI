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
// 8-Section AI Insight Types (Consultant Level)
// ============================================

export interface ExecutiveSummary {
    rating: number;
    total_reviews: number;
    sentiment_score: number;
    local_visibility_score: number;
    summary_text: string;
}

export interface SentimentAnalysis {
    positive_percent: number;
    neutral_percent: number;
    negative_percent: number;
    trend_summary: string;
}

export interface ThemeInsight {
    theme: string;
    frequency: number; // percentage or count
    description: string;
}

export interface ComplaintInsight {
    problem: string;
    frequency_percent: number;
    severity_score: number; // 1-10
}

export interface CompetitorComparison {
    metric: string;
    your_business: string | number;
    competitor_avg: string | number;
}

export interface RevenueOpportunity {
    opportunity: string;
    expected_impact: string;
}

export interface ActionPlanStep {
    timeline_week: string; // e.g. "Week 1"
    action: string;
}

/** Complete AI Insight (8 sections) */
export interface ReviewAIInsight {
    executive_summary: ExecutiveSummary;
    sentiment_analysis: SentimentAnalysis;
    top_positive_themes: ThemeInsight[];
    top_complaints: ComplaintInsight[];
    competitor_comparison: CompetitorComparison[];
    reputation_risks: ComplaintInsight[]; // maps to section 5
    revenue_opportunities: RevenueOpportunity[];
    action_plan: ActionPlanStep[];
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
