import { DataSummary, Brain2Result, ChatMessage } from "../types";
import { supabase } from "./supabaseClient";

export class GeminiService {

  private static cleanJsonResponse(text: string): string {
    let cleaned = text.trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
    return cleaned;
  }

  private static async callEdgeFunction(functionName: string, payload: any): Promise<any> {
    console.log(`[GeminiService] Invoking ${functionName} with payload:`, payload);
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      console.error(`[GeminiService] Edge Function Error (${functionName}):`, error);
      throw new Error(`AI Service Unavailable: ${error.message}`);
    }

    // The proxy returns { text: "..." } or { error: "..." }
    if (data.error) {
      throw new Error(`AI Generation Failed: ${data.error}`);
    }

    return data.text;
  }

  static async generateInsights(summary: DataSummary): Promise<Brain2Result> {
    const systemInstruction = `You are Brain 2: The Narrative Reasoning Layer. 
    Interpret the JSON summary provided.
    Ground every claim in the qualityScore and column stats.
    Be a world-class senior data analyst.
    Output MUST be valid JSON.`;

    try {
      const responseText = await this.callEdgeFunction('gemini-proxy', {
        type: 'generate_insights', // Custom type handled by general 'default' payload in proxy or specific if we update proxy
        // Actually, let's just use a generic 'json_mode' for now as proxy supports it
        prompt: `Context: ${JSON.stringify(summary)}`,
        config: {
          model: 'gemini-2.0-flash',
          temperature: 0.1
        },
        systemInstruction
      });

      return JSON.parse(this.cleanJsonResponse(responseText));
    } catch (e) {
      console.error("Insight Generation Error:", e);
      return { summary: "Error parsing analyst insights.", key_insights: [], suggested_kpis: [] };
    }
  }

  static async designDashboard(summary: DataSummary): Promise<any> {
    const systemInstruction = `You are a Senior Dashboard Architect.
    Based on the column metadata and statistics, design the most effective visual layout.
    Output JSON blueprint.`;

    try {
      const responseText = await this.callEdgeFunction('gemini-proxy', {
        prompt: `Data Profile: ${JSON.stringify(summary.columns)}`,
        config: {
          model: 'gemini-1.5-flash',
          temperature: 0.1
        },
        systemInstruction
      });

      return JSON.parse(this.cleanJsonResponse(responseText));
    } catch (e) {
      console.error("Dashboard Design Error:", e);
      return { kpis: [], charts: [] };
    }
  }

  static async chatWithData(summary: DataSummary, history: ChatMessage[], message: string): Promise<ChatMessage> {
    const systemInstruction = `You are the Nexus Lead Data Analyst. 
    STRICT RULES:
    1. ONLY answer based on the provided data summary.
    2. If a question cannot be answered with the current data, state it.
    3. Use professional, analytical language.
    DATA CONTEXT: ${JSON.stringify(summary)}`;

    try {
      // We map history to match what proxy expects
      const chatHistory = history.map(m => ({
        role: m.role,
        content: m.content
      }));

      const responseText = await this.callEdgeFunction('gemini-proxy', {
        type: 'chat',
        prompt: message,
        history: chatHistory,
        config: {
          model: 'gemini-1.5-flash',
          temperature: 0.4
        },
        systemInstruction
      });

      const result = JSON.parse(this.cleanJsonResponse(responseText));
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        actionHint: result.actionHint
      };

    } catch (e) {
      return { id: crypto.randomUUID(), role: 'assistant', content: "I'm encountering a connection error with the AI brain. Please try again.", timestamp: Date.now() };
    }
  }

  // Fallback not needed as much with proxy, but good to keep simple retry logic in proxy if needed.
  // For now, we rely on the single call.

  static async generateContent(prompt: string): Promise<string> {
    return await this.callEdgeFunction('gemini-proxy', {
      prompt,
      config: {
        model: 'gemini-2.0-flash',
        temperature: 0.4
      }
    });
  }

  static async generateReviewInsights(preprocessedData: object, platformData?: any[]): Promise<string> {
    const systemInstruction = `You are a senior business analyst and local SEO consultant.

Your job is to analyze a business using its review data from one or more platforms (Google, Yelp, Trustpilot, etc.).

Your analysis must be structured like a professional consulting report.

Focus on actionable insights that help businesses improve customer satisfaction, visibility, and revenue.

Avoid generic summaries. Provide quantified insights whenever possible.

STRICT RULES:
- You must ONLY use the data provided in the input JSON.
- Output MUST be valid JSON matching the EXACT schema specified below.
- Think like a business consultant who charges $5000/report.
- Every insight must be data-backed and actionable.
- Be specific, not generic. Reference actual review patterns.`;

    // Build platform breakdown for the prompt
    let platformSection = '';
    if (platformData && platformData.length > 1) {
      const platformBreakdown = platformData
        .filter(p => p.reviews?.length > 0 || p.totalReviews > 0)
        .map(p => `- ${p.platform.toUpperCase()}: ${p.rating}★ avg, ${p.totalReviews} total reviews, ${p.reviews?.length || 0} fetched`)
        .join('\n');
      platformSection = `

MULTI-PLATFORM BREAKDOWN:
${platformBreakdown}

When analyzing, note differences between platforms. For example, if Google reviews are more positive than Yelp, mention this.`;
    }

    const prompt = `Analyze this pre-processed business review data and produce a comprehensive business intelligence report.

INPUT DATA:
${JSON.stringify(preprocessedData)}
${platformSection}

Perform the following analysis:
10. Revenue growth opportunities
11. Strategic growth roadmap (Point-wise summary of growth vectors)
12. Online presence audit (Listing status on Google, Yelp, Facebook, etc.)
13. Strategic partnership recommendations
14. Agency contribution specific to business growth
${platformData && platformData.length > 1 ? '15. Cross-platform sentiment consistency analysis' : ''}

OUTPUT: Return ONLY a valid JSON object matching this EXACT schema:

{
  "executive_summary": {
    "rating": number,
    "total_reviews": number,
    "sentiment_score": number (0-100),
    "local_visibility_score": number (0-100),
    "summary_text": "string (2-3 concise sentences)"
  },
  "business_mission": "string (A professional mission statement based on the business's apparent values from reviews)",
  "sentiment_analysis": {
    "positive_percent": number,
    "neutral_percent": number,
    "negative_percent": number,
    "trend_summary": "string"
  },
  "top_positive_themes": [
    {
      "theme": "string",
      "frequency": number,
      "description": "string"
    }
  ],
  "top_complaints": [
    {
      "problem": "string",
      "frequency_percent": number,
      "severity_score": number (1-10)
    }
  ],
  "competitor_comparison": [
    {
      "metric": "string (e.g. Rating, Reviews, Response rate, Photo count)",
      "your_business": "string or number",
      "competitor_avg": "string or number"
    }
  ],
  "reputation_risks": [
    {
      "problem": "string",
      "frequency_percent": number,
      "severity_score": number (1-10)
    }
  ],
  "revenue_opportunities": [
    {
      "opportunity": "string",
      "expected_impact": "string"
    }
  ],
  "strategic_roadmap": [
    {
      "point": "string",
      "benefit": "string"
    }
  ],
  "online_presence_audit": [
    {
      "platform": "string",
      "status": "active | missing | incomplete",
      "action_required": "string"
    }
  ],
  "recommended_partners": ["string"],
  "agency_contribution": ["string (Specific agency services like 'Build Custom Mobile App', 'Social Media Management', 'Professional Website Redesign')"],
  "action_plan": [
    {
      "timeline_week": "string (e.g. 'Week 1')",
      "action": "string"
    }
  ]${platformData && platformData.length > 1 ? `,
  "cross_platform_analysis": {
    "platform_sentiment": [
      {
        "platform": "string (google/yelp/trustpilot/etc)",
        "positivePercent": number,
        "avgRating": number
      }
    ],
    "consistency_score": number (0-100, how consistent sentiment is across platforms),
    "summary": "string (1-2 sentences comparing platform differences)"
  }` : ''}
}

IMPORTANT:
- Keep ALL descriptions and summaries EXTREMELY short (1 sentence max).
- Include EXACTLY 3 items in top_positive_themes, top_complaints, and revenue_opportunities.
- Action plan MUST span exactly 4 weeks.
- Faster, concise generation is CRITICAL. Short & punchy wins.`;

    try {
      const responseText = await this.callEdgeFunction('gemini-proxy', {
        type: 'generateReviewInsights',
        prompt,
        data: preprocessedData,
        config: {
          model: 'gemini-2.0-flash',
          temperature: 0.2
        },
        systemInstruction
      });

      return responseText || '{}';

    } catch (err: any) {
      console.error("Review AI Failed:", err);
      throw new Error('AI analysis temporarily unavailable.');
    }
  }
}

// ============================================
// Standalone Stubs for Future Features
// ============================================

/** Placeholder: Edit an image using AI (not yet implemented) */
export async function editImage(image: string, prompt: string): Promise<string> {
  throw new Error('editImage is not yet implemented. This feature is coming soon.');
}

/** Placeholder: Create an AI instance (not yet implemented) */
export function createAI(): any {
  throw new Error('createAI is not yet implemented. This feature is coming soon.');
}

/** Placeholder: Animate an image using AI (not yet implemented) */
export async function animateImage(image: string, prompt: string, ratio: string): Promise<string> {
  throw new Error('animateImage is not yet implemented. This feature is coming soon.');
}

/** Placeholder: Generate an image using AI (not yet implemented) */
export async function generateImage(prompt: string, size?: string, ratio?: string): Promise<string> {
  throw new Error('generateImage is not yet implemented. This feature is coming soon.');
}

/** Placeholder: Perform data analysis using AI (not yet implemented) */
export async function performDataAnalysis(csvData: string, prompt: string): Promise<any> {
  throw new Error('performDataAnalysis is not yet implemented. This feature is coming soon.');
}

/** Placeholder: Search-grounded chat using AI (not yet implemented) */
export async function searchGroundedChat(query: string): Promise<{ text: string; sources: any[] }> {
  throw new Error('searchGroundedChat is not yet implemented. This feature is coming soon.');
}
