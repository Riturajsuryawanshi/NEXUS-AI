// ============================================
// Review Intelligence Types (11-Section Dashboard)
// ============================================

/** Supported review platforms */
export type ReviewPlatform = 'google' | 'yelp' | 'tripadvisor' | 'trustpilot' | 'zomato' | 'justdial' | 'facebook';

/** Platform display metadata */
export const PLATFORM_META: Record<ReviewPlatform, { label: string; icon: string; color: string }> = {
    google: { label: 'Google', icon: 'fa-google', color: '#4285F4' },
    yelp: { label: 'Yelp', icon: 'fa-yelp', color: '#D32323' },
    tripadvisor: { label: 'TripAdvisor', icon: 'fa-tripadvisor', color: '#34E0A1' },
    trustpilot: { label: 'Trustpilot', icon: 'fa-star', color: '#00B67A' },
    zomato: { label: 'Zomato', icon: 'fa-utensils', color: '#E23744' },
    justdial: { label: 'Justdial', icon: 'fa-phone', color: '#2196F3' },
    facebook: { label: 'Facebook', icon: 'fa-facebook', color: '#1877F2' },
};

/** A single raw review record */
export interface RawReview {
    rating: number; // 1-5
    text: string;
    timestamp: string; // ISO date string
    author?: string;
    platform: ReviewPlatform; // which platform this review came from
}

/** Review data fetched from a single platform */
export interface PlatformReviewData {
    platform: ReviewPlatform;
    reviews: RawReview[];
    rating: number;
    totalReviews: number;
    profileUrl?: string;
    fetchedAt: number;
    error?: string; // if this platform fetch failed
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
    platforms_analyzed?: ReviewPlatform[];
}

// ============================================
// Competitor Benchmarking Types
// ============================================

/** Profile data for a competitor business */
export interface CompetitorProfile {
    name: string;
    place_id: string;
    rating: number;
    total_reviews: number;
    types: string[];
    address: string;
    location?: { lat: number; lng: number };
    platformData?: PlatformReviewData[];
    preprocess?: ReviewPreprocessResult;
}

/** A single benchmarking dimension (e.g. Service Quality) */
export interface BenchmarkDimension {
    name: string;
    subjectScore: number;
    scores: { name: string; score: number }[];
}

/** Ranking entry for a specific metric */
export interface CompetitorRanking {
    metric: string;
    rankings: { name: string; value: number | string; rank: number; isSubject?: boolean }[];
}

/** Full benchmark result comparing subject vs competitors */
export interface CompetitorBenchmark {
    subject: CompetitorProfile;
    competitors: CompetitorProfile[];
    dimensions: BenchmarkDimension[];
    rankings: CompetitorRanking[];
    generatedAt: number;
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

export interface StrategicRoadmapPoint {
    point: string;
    benefit: string;
}

export interface OnlineListing {
    platform: string;
    status: 'active' | 'missing' | 'incomplete';
    action_required: string;
}

/** Complete AI Insight (Professional analyst level) */
export interface ReviewAIInsight {
    executive_summary: ExecutiveSummary;
    business_mission?: string; // High-level mission/overview
    sentiment_analysis: SentimentAnalysis;
    top_positive_themes: ThemeInsight[];
    top_complaints: ComplaintInsight[];
    competitor_comparison: CompetitorComparison[];
    reputation_risks: ComplaintInsight[]; // maps to section 5
    revenue_opportunities: RevenueOpportunity[];
    strategic_roadmap?: StrategicRoadmapPoint[]; // Professional growth summary
    online_presence_audit?: OnlineListing[]; // Status of various listings
    recommended_partners?: string[]; // Strategic partnership suggestions
    agency_contribution?: string[]; // Specific services the agency can provide
    action_plan: ActionPlanStep[];
    cross_platform_analysis?: {
        platform_sentiment: { platform: ReviewPlatform; positivePercent: number; avgRating: number }[];
        consistency_score: number; // 0-100, how consistent sentiment is across platforms
        summary: string;
    };
    /** Health scores returned by AI (used in MyReports preview) */
    health_scores?: {
        overall: number;
        service: number;
        product: number;
        management: number;
        reputation: number;
        operational_stability: number;
    };
    /** Business overview returned by AI (used in MyReports preview) */
    business_overview?: {
        category: string;
        summary: string;
    };
    /** Top strengths identified by AI */
    strengths?: ThemeInsight[];
    /** Top weaknesses identified by AI */
    weaknesses?: ThemeInsight[];
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
    platformData?: PlatformReviewData[];
    competitorBenchmark?: CompetitorBenchmark | null;
    review_clusters: ReviewCluster[];
    revenue_leak_indicators: RevenueLeak[];
    upsell_opportunities: UpsellOpportunity[];
    generatedAt: number;
}
