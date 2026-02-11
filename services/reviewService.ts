<<<<<<< HEAD
import { supabase } from './supabaseClient';
import { ReviewAudit } from '../types';
import { GeminiService } from './geminiService';

const CACHE_KEY_PREFIX = 'nexus_review_cache_';

export class ReviewService {

    static async getAudit(placeUrl: string): Promise<ReviewAudit> {
        const placeId = this.extractPlaceId(placeUrl);
        if (!placeId) {
            throw new Error("Invalid Google Maps URL. Could not extract Place ID.");
        }

        // Check Cache
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + placeId);
        if (cached) {
            const parsed = JSON.parse(cached);
            // Simple expiration: 24 hours
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                return parsed.data;
            }
        }

        // 1. Fetch raw data from Edge Function
        const businessData = await this.fetchPlaceData(placeId);

        // 2. Process with AI
        const audit = await this.generateAudit(businessData);

        // Cache result
        localStorage.setItem(CACHE_KEY_PREFIX + placeId, JSON.stringify({
            timestamp: Date.now(),
            data: audit
        }));

        return audit;
    }

    private static extractPlaceId(url: string): string | null {
        // Decode URL first
        const decoded = decodeURIComponent(url);
        
        // Pattern 1: place_id parameter
        const placeIdMatch = decoded.match(/place_id=([a-zA-Z0-9_-]+)/);
        if (placeIdMatch) return placeIdMatch[1];
        
        // Pattern 2: /place/NAME/data=... format
        const dataMatch = decoded.match(/\/place\/[^\/]+\/data=([^&\s]+)/);
        if (dataMatch) {
            // Extract place_id from data parameter
            const dataStr = dataMatch[1];
            const pidMatch = dataStr.match(/!1s([a-zA-Z0-9_-]+):/);
            if (pidMatch) return pidMatch[1];
        }
        
        // Pattern 3: Short URL - extract from path
        const shortMatch = decoded.match(/maps\.app\.goo\.gl\/([a-zA-Z0-9]+)/);
        if (shortMatch) {
            // For short URLs, we need to use the business name from the URL
            // Extract business name and use text search
            const nameMatch = decoded.match(/\/place\/([^\/@]+)/);
            if (nameMatch) {
                return 'search:' + nameMatch[1].replace(/\+/g, ' ');
            }
        }
        
        // Pattern 4: Standard /place/NAME format
        const nameMatch = decoded.match(/\/place\/([^\/@?]+)/);
        if (nameMatch) {
            return 'search:' + nameMatch[1].replace(/\+/g, ' ');
        }
        
        return null;
    }

    private static async fetchPlaceData(placeId: string): Promise<any> {
        // Check if it's a search query
        if (placeId.startsWith('search:')) {
            const query = placeId.replace('search:', '');
            const { data, error } = await supabase.functions.invoke('places-data', {
                body: { query, action: 'search' }
            });
            
            if (error) {
                console.error("Edge Function Error:", error);
                throw new Error("Failed to fetch business data. Please try again.");
            }
            
            return data;
        }
        
        // Standard place_id lookup
        const { data, error } = await supabase.functions.invoke('places-data', {
            body: { place_id: placeId, action: 'details' }
        });

        if (error) {
            console.error("Edge Function Error:", error);
            throw new Error("Failed to fetch business data. Please try again.");
        }

        return data;
    }

    private static async generateAudit(businessData: any): Promise<ReviewAudit> {
        // Construct a prompt for Gemini
        const reviews = businessData.reviews || [];
        const reviewsText = reviews.map((r: any) => `"${r.text}" (Rating: ${r.rating})`).join('\n');

        const prompt = `
      Analyze the following Google Maps reviews for "${businessData.name}" and generate a structured audit report.
      
      Business Name: ${businessData.name}
      Total Reviews: ${businessData.user_ratings_total}
      Rating: ${businessData.rating}

      Reviews:
      ${reviewsText}

      Output strict JSON with the following structure:
      {
        "review_clusters": [
          {"theme": "...", "frequency_percentage": 0, "sentiment": "positive|negative|mixed", "key_complaints_or_praises": ["..."], "business_impact_estimate": "..."}
        ],
        "revenue_leak_indicators": [
          {"issue": "...", "potential_business_risk": "...", "recommended_fix": "..."}
        ],
        "upsell_opportunities": [
          {"opportunity": "...", "supporting_review_pattern": "..."}
        ]
      }
    `;

        // Retrieve AI result
        const aiResponse = await GeminiService.generateContent(prompt);

        // Parse JSON
        // Note: GeminiService might return markdown-wrapped JSON
        let jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        let parsed: any;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            console.error("AI Pattern Generation Failed", e);
            throw new Error("Failed to generate audit report.");
        }

        return {
            business_summary: {
                name: businessData.name,
                rating: businessData.rating,
                total_reviews: businessData.user_ratings_total,
                place_id: businessData.place_id
            },
            review_clusters: parsed.review_clusters || [],
            revenue_leak_indicators: parsed.revenue_leak_indicators || [],
            upsell_opportunities: parsed.upsell_opportunities || [],
            generatedAt: Date.now()
        };
    }
}
=======
import { UserProfile } from '../types';
import { GeminiService } from './geminiService';

export interface ReviewCluster {
  theme: string;
  frequencyPercentage: number;
  sentiment: 'positive' | 'negative' | 'mixed';
  keyPoints: string[];
  businessImpact?: string;
}

export interface RevenueLeak {
  issue: string;
  potentialRisk: string;
  recommendedFix: string;
}

export interface UpsellOpportunity {
  opportunity: string;
  supportingPattern: string;
}

export interface ReviewReport {
  businessSummary: {
    name: string;
    rating: number;
    totalReviews: number;
  };
  reviewClusters: ReviewCluster[];
  revenueLeaks: RevenueLeak[];
  upsellOpportunities: UpsellOpportunity[];
}

interface CachedReport {
  placeId: string;
  report: ReviewReport;
  timestamp: number;
}

class ReviewServiceClass {
  private cache: Map<string, CachedReport> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  extractPlaceId(url: string): string | null {
    // Extract Place ID from Google Maps URL
    const patterns = [
      /place\/[^\/]+\/([^\/\?]+)/,
      /data=.*!1s([^!]+)/,
      /ftid=([^&]+)/,
      /cid=([^&]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // Check if it's already a Place ID
    if (url.match(/^[A-Za-z0-9_-]{27}$/)) return url;

    return null;
  }

  async analyzeBusinessReviews(input: string, profile: UserProfile): Promise<ReviewReport> {
    const placeId = this.extractPlaceId(input);
    if (!placeId) {
      throw new Error('Invalid Google Maps link. Please provide a valid business URL.');
    }

    // Check cache
    const cached = this.cache.get(placeId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.report;
    }

    // Fetch reviews (mock for now - would use Google Places API)
    const reviews = await this.fetchReviews(placeId);
    
    // Preprocess reviews
    const processed = this.preprocessReviews(reviews);
    
    // Cluster reviews
    const clusters = await this.clusterReviews(processed);
    
    // Generate insights
    const report = await this.generateReport(reviews, clusters);
    
    // Cache result
    this.cache.set(placeId, {
      placeId,
      report,
      timestamp: Date.now()
    });

    return report;
  }

  private async fetchReviews(placeId: string): Promise<any[]> {
    // Mock data - In production, use Google Places API
    return [
      { rating: 5, text: 'Excellent service! The staff went above and beyond. Very professional and knowledgeable. Will definitely return.', date: '2024-01-20' },
      { rating: 4, text: 'Good experience overall. Quality is great but pricing is a bit steep. Worth it though for the service level.', date: '2024-01-19' },
      { rating: 2, text: 'Long wait times are frustrating. Waited 45 minutes past appointment. Staff seemed overwhelmed and disorganized.', date: '2024-01-18' },
      { rating: 5, text: 'Amazing quality! Best in the area. Staff is incredibly friendly and helpful. Clean environment too.', date: '2024-01-17' },
      { rating: 3, text: 'Average experience. Nothing special but nothing terrible. Pricing could be more competitive with nearby options.', date: '2024-01-16' },
      { rating: 1, text: 'Terrible service. Staff was rude and dismissive. Felt rushed. Would not recommend to anyone.', date: '2024-01-15' },
      { rating: 5, text: 'Outstanding product quality! Staff really knows their stuff. Great location and easy parking too.', date: '2024-01-14' },
      { rating: 4, text: 'Good selection and knowledgeable staff. Parking was difficult to find. Slightly overpriced but quality justifies it.', date: '2024-01-13' },
      { rating: 2, text: 'Overpriced for what you get. Staff was friendly but product quality disappointed. Expected more for the price.', date: '2024-01-12' },
      { rating: 5, text: 'Perfect experience from start to finish. Staff went above and beyond! Clean, professional, and efficient.', date: '2024-01-11' },
      { rating: 3, text: 'Decent service but wait time was longer than expected. Staff tried their best but seemed understaffed.', date: '2024-01-10' },
      { rating: 4, text: 'Great quality and friendly staff. Location is convenient. Only complaint is the pricing structure could be clearer.', date: '2024-01-09' },
      { rating: 1, text: 'Worst experience ever. Long wait, rude staff, and overpriced. Save your money and go elsewhere.', date: '2024-01-08' },
      { rating: 5, text: 'Exceptional service quality! Staff is professional and courteous. Clean facility and great atmosphere.', date: '2024-01-07' },
      { rating: 4, text: 'Very satisfied with the quality. Staff is helpful and knowledgeable. Pricing is fair for the value received.', date: '2024-01-06' },
      { rating: 2, text: 'Service was slow and staff seemed untrained. Quality was okay but not worth the wait or the price.', date: '2024-01-05' },
      { rating: 5, text: 'Highly recommend! Best staff, great quality, and reasonable pricing. Clean and well-maintained location.', date: '2024-01-04' },
      { rating: 3, text: 'Mixed feelings. Some staff members are great, others not so much. Quality is inconsistent.', date: '2024-01-03' },
      { rating: 4, text: 'Good overall experience. Staff is friendly and location is convenient. Pricing is competitive.', date: '2024-01-02' },
      { rating: 5, text: 'Absolutely love this place! Staff treats you like family. Quality is consistently excellent.', date: '2024-01-01' }
    ];
  }

  private preprocessReviews(reviews: any[]): any {
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => ratingDist[r.rating as keyof typeof ratingDist]++);

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return {
      totalReviews: reviews.length,
      avgRating,
      ratingDistribution: ratingDist,
      reviews
    };
  }

  private async clusterReviews(processed: any): Promise<any[]> {
    const themes = [
      'Service Quality',
      'Pricing & Value',
      'Staff Behavior',
      'Product Quality',
      'Wait Times & Speed',
      'Cleanliness & Ambiance',
      'Location & Accessibility'
    ];
    
    const keywords = {
      'Service Quality': ['service', 'experience', 'quality', 'attention', 'care'],
      'Pricing & Value': ['price', 'pricing', 'expensive', 'worth', 'cost', 'value', 'cheap', 'overpriced'],
      'Staff Behavior': ['staff', 'employee', 'friendly', 'helpful', 'rude', 'knowledgeable', 'professional', 'attitude'],
      'Product Quality': ['product', 'quality', 'selection', 'fresh', 'taste', 'variety'],
      'Wait Times & Speed': ['wait', 'time', 'slow', 'fast', 'quick', 'delay', 'long'],
      'Cleanliness & Ambiance': ['clean', 'dirty', 'atmosphere', 'ambiance', 'decor', 'environment'],
      'Location & Accessibility': ['location', 'parking', 'access', 'convenient', 'far']
    };

    const clusters = themes.map(theme => {
      const relatedReviews = processed.reviews.filter((r: any) => 
        keywords[theme as keyof typeof keywords].some(kw => r.text.toLowerCase().includes(kw))
      );

      if (relatedReviews.length === 0) return null;

      const avgSentiment = relatedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / relatedReviews.length;
      const positiveCount = relatedReviews.filter((r: any) => r.rating >= 4).length;
      const negativeCount = relatedReviews.filter((r: any) => r.rating <= 2).length;

      return {
        theme,
        count: relatedReviews.length,
        frequency: (relatedReviews.length / processed.totalReviews) * 100,
        sentiment: avgSentiment >= 4 ? 'positive' : avgSentiment <= 2.5 ? 'negative' : 'mixed',
        positiveCount,
        negativeCount,
        reviews: relatedReviews,
        avgRating: avgSentiment
      };
    }).filter(c => c !== null);

    return clusters;
  }

  private async generateReport(reviews: any[], clusters: any[]): Promise<ReviewReport> {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Analyze patterns for actionable insights
    const negativeThemes = clusters.filter(c => c.sentiment === 'negative').sort((a, b) => b.frequency - a.frequency);
    const positiveThemes = clusters.filter(c => c.sentiment === 'positive').sort((a, b) => b.frequency - a.frequency);
    const pricingCluster = clusters.find(c => c.theme.includes('Pricing'));

    // Generate revenue leak indicators
    const revenueLeaks: RevenueLeak[] = [];
    
    negativeThemes.forEach(theme => {
      if (theme.frequency > 15) {
        revenueLeaks.push({
          issue: `${theme.theme} Issues (${Math.round(theme.frequency)}% of reviews)`,
          potentialRisk: `Estimated ${Math.round(theme.negativeCount / reviews.length * 100)}% customer churn risk. Could be losing $${Math.round(theme.negativeCount * 50)}-$${Math.round(theme.negativeCount * 200)}/month in repeat business.`,
          recommendedFix: this.getRecommendation(theme.theme, theme.reviews)
        });
      }
    });

    // Pricing-specific revenue leak
    if (pricingCluster && pricingCluster.sentiment === 'negative') {
      revenueLeaks.push({
        issue: 'Pricing Perception Mismatch',
        potentialRisk: `${Math.round(pricingCluster.frequency)}% of customers mention pricing concerns. This suggests value communication gap, not necessarily overpricing.`,
        recommendedFix: 'Implement value-based messaging, bundle offerings, or introduce tiered pricing. Consider loyalty program to improve perceived value.'
      });
    }

    // Generate upsell opportunities
    const upsellOpportunities: UpsellOpportunity[] = [];
    
    positiveThemes.forEach(theme => {
      if (theme.frequency > 20) {
        upsellOpportunities.push({
          opportunity: `Leverage Strong ${theme.theme}`,
          supportingPattern: `${Math.round(theme.frequency)}% of customers praise ${theme.theme.toLowerCase()}. This is a competitive advantage that can be monetized through premium offerings or marketing campaigns.`
        });
      }
    });

    // Identify gaps (low mention = opportunity)
    const lowMentionThemes = clusters.filter(c => c.frequency < 10 && c.frequency > 0);
    if (lowMentionThemes.length > 0) {
      upsellOpportunities.push({
        opportunity: 'Untapped Service Areas',
        supportingPattern: `Customers rarely mention ${lowMentionThemes.map(t => t.theme.toLowerCase()).join(', ')}. This could indicate either excellence (no complaints) or missed opportunities to highlight these aspects.`
      });
    }

    // Generate detailed insights for each cluster
    const reviewClusters: ReviewCluster[] = clusters.map(c => ({
      theme: c.theme,
      frequencyPercentage: Math.round(c.frequency),
      sentiment: c.sentiment,
      keyPoints: this.extractKeyPoints(c.reviews, c.sentiment),
      businessImpact: this.calculateBusinessImpact(c)
    }));

    return {
      businessSummary: {
        name: 'Business Name',
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length
      },
      reviewClusters,
      revenueLeaks,
      upsellOpportunities
    };
  }

  private getRecommendation(theme: string, reviews: any[]): string {
    const recommendations: Record<string, string> = {
      'Service Quality': 'Implement service quality training, establish service standards checklist, and introduce customer feedback loops after each interaction.',
      'Pricing & Value': 'Conduct competitive pricing analysis, introduce value-add services, or create tiered pricing options to match different customer segments.',
      'Staff Behavior': 'Invest in customer service training, implement recognition programs for positive reviews, and establish clear service protocols.',
      'Product Quality': 'Review supplier relationships, implement quality control checks, and gather specific product feedback to identify improvement areas.',
      'Wait Times & Speed': 'Analyze peak hours, optimize staffing schedules, implement queue management system, or introduce online booking to reduce wait times.',
      'Cleanliness & Ambiance': 'Establish cleaning schedules, invest in facility upgrades, and create ambiance improvement plan based on customer preferences.',
      'Location & Accessibility': 'Improve signage, explore additional parking options, enhance online directions, or consider satellite locations.'
    };
    return recommendations[theme] || 'Conduct detailed analysis and implement targeted improvements based on specific customer feedback.';
  }

  private extractKeyPoints(reviews: any[], sentiment: string): string[] {
    const points: string[] = [];
    const commonWords = this.findCommonPhrases(reviews);
    
    if (sentiment === 'positive') {
      points.push(`Customers consistently praise this aspect`);
      points.push(`${reviews.filter(r => r.rating >= 4).length} positive mentions`);
      if (commonWords.length > 0) {
        points.push(`Common praise: "${commonWords[0]}"`);
      }
    } else if (sentiment === 'negative') {
      points.push(`Critical improvement area identified`);
      points.push(`${reviews.filter(r => r.rating <= 2).length} complaints recorded`);
      if (commonWords.length > 0) {
        points.push(`Common complaint: "${commonWords[0]}"`);
      }
    } else {
      points.push(`Mixed feedback - opportunity for differentiation`);
      points.push(`${reviews.length} mentions with varying experiences`);
    }
    
    return points;
  }

  private findCommonPhrases(reviews: any[]): string[] {
    const phrases = reviews.map(r => {
      const sentences = r.text.split(/[.!?]/);
      return sentences[0]?.trim() || r.text.substring(0, 50);
    });
    return phrases.slice(0, 3);
  }

  private calculateBusinessImpact(cluster: any): string {
    const frequency = cluster.frequency;
    const sentiment = cluster.sentiment;
    
    if (sentiment === 'negative' && frequency > 20) {
      return 'HIGH PRIORITY: Significant revenue impact - immediate action required';
    } else if (sentiment === 'negative' && frequency > 10) {
      return 'MEDIUM PRIORITY: Notable customer concern affecting reputation';
    } else if (sentiment === 'positive' && frequency > 25) {
      return 'COMPETITIVE ADVANTAGE: Strong differentiator to leverage in marketing';
    } else if (sentiment === 'positive' && frequency > 15) {
      return 'STRENGTH: Maintain and highlight in customer communications';
    } else if (sentiment === 'mixed') {
      return 'OPPORTUNITY: Inconsistent experience - standardization needed';
    }
    return 'Monitor and track for trends';
  }

}

export const ReviewService = new ReviewServiceClass();
>>>>>>> 3172753 (finally)
