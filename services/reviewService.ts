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
