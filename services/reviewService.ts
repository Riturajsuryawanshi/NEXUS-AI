import { ReviewAudit } from '../types';
import { GeminiService } from './geminiService';

const CACHE_KEY_PREFIX = 'nexus_review_cache_';

export class ReviewService {

  static async getAudit(placeUrl: string): Promise<ReviewAudit> {
    const businessInfo = this.extractBusinessInfo(placeUrl);
    if (!businessInfo) {
      throw new Error("Invalid Google Maps URL. Please paste a valid Google Maps business link.");
    }

    const cacheKey = CACHE_KEY_PREFIX + businessInfo.cacheId;

    // Check Cache (24 hour validity)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    // Generate comprehensive audit using Gemini AI
    const audit = await this.generateAIAudit(businessInfo.name, placeUrl);

    // Cache result
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: audit
    }));

    return audit;
  }

  /**
   * Extracts business name and cache ID from various Google Maps URL formats.
   * Supports: standard URLs, short URLs, embedded URLs, search URLs
   */
  private static extractBusinessInfo(url: string): { name: string; cacheId: string } | null {
    const trimmedUrl = url.trim();

    // Must look like a Google Maps URL or a business name
    const isGoogleMapsUrl = /google\.(com|co\.[a-z]+|[a-z]+)\/maps|maps\.app\.goo\.gl|maps\.google/i.test(trimmedUrl);
    const isPlainBusinessName = !trimmedUrl.startsWith('http') && trimmedUrl.length > 2;

    if (!isGoogleMapsUrl && !isPlainBusinessName) {
      return null;
    }

    // If it's a plain business name (not a URL), use it directly
    if (isPlainBusinessName) {
      const name = trimmedUrl.trim();
      return { name, cacheId: name.toLowerCase().replace(/[^a-z0-9]/g, '_') };
    }

    const decoded = decodeURIComponent(trimmedUrl);

    // Pattern 1: /place/Business+Name/ format (most common)
    const placeNameMatch = decoded.match(/\/place\/([^\/\@\?]+)/);
    if (placeNameMatch) {
      const name = placeNameMatch[1].replace(/\+/g, ' ').replace(/%20/g, ' ').trim();
      return { name, cacheId: name.toLowerCase().replace(/[^a-z0-9]/g, '_') };
    }

    // Pattern 2: Search query in URL (?q=business+name)
    const queryMatch = decoded.match(/[?&]q=([^&]+)/);
    if (queryMatch) {
      const name = queryMatch[1].replace(/\+/g, ' ').trim();
      return { name, cacheId: name.toLowerCase().replace(/[^a-z0-9]/g, '_') };
    }

    // Pattern 3: Short URL (maps.app.goo.gl/xxx) - treat the URL itself as identifier
    const shortMatch = decoded.match(/maps\.app\.goo\.gl\/([a-zA-Z0-9]+)/);
    if (shortMatch) {
      // For short URLs, we ask the user or try to use the full URL
      return { name: trimmedUrl, cacheId: shortMatch[1] };
    }

    // Pattern 4: data parameter with place info
    const dataMatch = decoded.match(/data=.*?!1s([^!]+)/);
    if (dataMatch) {
      return { name: trimmedUrl, cacheId: dataMatch[1].replace(/[^a-z0-9]/g, '_') };
    }

    // Fallback: use the entire URL as input
    if (isGoogleMapsUrl) {
      return { name: trimmedUrl, cacheId: trimmedUrl.replace(/[^a-z0-9]/g, '_').substring(0, 100) };
    }

    return null;
  }

  /**
   * Uses Gemini AI to generate a comprehensive review audit report.
   * The AI analyzes publicly known information about the business,
   * clusters sentiment patterns, identifies revenue leaks, and 
   * generates actionable consulting recommendations.
   */
  private static async generateAIAudit(businessNameOrUrl: string, originalUrl: string): Promise<ReviewAudit> {
    const prompt = `You are a Review Intelligence Analyst AI. Your job is to analyze a business and produce a structured, data-backed consulting report based on publicly available review patterns.

BUSINESS INPUT: "${businessNameOrUrl}"
GOOGLE MAPS LINK: ${originalUrl}

YOUR TASK:
1. Identify this business (name, industry, location if possible)
2. Analyze common review patterns for this type of business based on publicly available information
3. Cluster reviews into themes with sentiment analysis
4. Identify revenue leaks: where the business is losing money based on customer complaints
5. Find upsell opportunities: where positive sentiment can be monetized further
6. Provide realistic, actionable business recommendations suitable for a consulting pitch

CRITICAL RULES:
- Be specific and realistic. Do NOT use generic placeholder text.
- Use realistic percentages that add up logically.
- Give concrete dollar-impact estimates where possible.
- Make recommendations that a freelancer or agency could pitch to this business owner.
- The report should be so specific that a consultant could walk into the business and present it.

OUTPUT FORMAT - Return ONLY valid JSON, no markdown, no code fences:
{
  "business_summary": {
    "name": "Actual business name extracted from the URL/input",
    "rating": 4.2,
    "total_reviews": 500,
    "place_id": "extracted or generated identifier",
    "industry": "e.g. Restaurant, Salon, Auto Repair, etc.",
    "location": "City, State if identifiable"
  },
  "review_clusters": [
    {
      "theme": "Service Quality & Staff Behavior",
      "frequency_percentage": 35,
      "sentiment": "positive",
      "key_complaints_or_praises": [
        "Specific praise or complaint #1",
        "Specific praise or complaint #2",
        "Specific praise or complaint #3"
      ],
      "business_impact_estimate": "Drives ~40% of repeat customers. Staff friendliness mentioned in 8 out of 10 5-star reviews."
    }
  ],
  "revenue_leak_indicators": [
    {
      "issue": "Specific operational issue causing revenue loss",
      "potential_business_risk": "Estimated $X,XXX/month in lost revenue from Y% customer churn",
      "recommended_fix": "Concrete, actionable step the business can take immediately"
    }
  ],
  "upsell_opportunities": [
    {
      "opportunity": "Specific monetization opportunity based on positive patterns",
      "supporting_review_pattern": "X% of customers mention loving [feature], suggesting demand for [premium offering]"
    }
  ],
  "consulting_hooks": [
    {
      "pitch_angle": "How a consultant would frame this insight to the business owner",
      "estimated_roi": "Projected return if the recommendation is implemented", 
      "implementation_effort": "low|medium|high"
    }
  ]
}

Generate 4-6 review clusters, 3-5 revenue leak indicators, 3-5 upsell opportunities, and 2-3 consulting hooks.
Make it deeply insightful, specific to THIS business, and ready for client outreach.`;

    const aiResponse = await GeminiService.generateContent(prompt);

    // Clean and parse JSON response
    let jsonStr = aiResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Try to extract JSON object if there's extra text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("AI JSON Parse Failed. Raw response:", aiResponse);
      console.error("Cleaned string:", jsonStr);
      throw new Error("Failed to generate audit report. The AI response was not valid JSON. Please try again.");
    }

    // Validate and structure the response
    const businessSummary = parsed.business_summary || {};

    return {
      business_summary: {
        name: businessSummary.name || businessNameOrUrl,
        rating: businessSummary.rating || 0,
        total_reviews: businessSummary.total_reviews || 0,
        place_id: businessSummary.place_id || 'ai_generated',
      },
      review_clusters: (parsed.review_clusters || []).map((c: any) => ({
        theme: c.theme || 'Unknown Theme',
        frequency_percentage: c.frequency_percentage || 0,
        sentiment: c.sentiment || 'mixed',
        key_complaints_or_praises: c.key_complaints_or_praises || [],
        business_impact_estimate: c.business_impact_estimate || 'Impact not estimated',
      })),
      revenue_leak_indicators: (parsed.revenue_leak_indicators || []).map((r: any) => ({
        issue: r.issue || 'Issue not specified',
        potential_business_risk: r.potential_business_risk || 'Risk not estimated',
        recommended_fix: r.recommended_fix || 'No recommendation available',
      })),
      upsell_opportunities: (parsed.upsell_opportunities || []).map((u: any) => ({
        opportunity: u.opportunity || 'Opportunity not specified',
        supporting_review_pattern: u.supporting_review_pattern || 'Pattern not identified',
      })),
      generatedAt: Date.now(),
    };
  }
}
