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

  static async generateReviewInsights(preprocessedData: object): Promise<string> {
    const systemInstruction = `You are a world-class Business Intelligence Analyst specializing in review-based business audits. You analyze pre-processed review data to produce founder-level strategic insights.

STRICT RULES:
- You must ONLY use the data provided in the input JSON.
- Output MUST be valid JSON matching the EXACT schema specified below.
- Think like a business consultant who charges $5000/report.
- Every insight must be data-backed and actionable.
- Be specific, not generic. Reference actual review patterns.`;

    const prompt = `Analyze this pre-processed business review data and produce a comprehensive 11-section business intelligence report.

INPUT DATA:
${JSON.stringify(preprocessedData)}

OUTPUT: Return ONLY a valid JSON object matching this EXACT schema:

{
  "business_overview": {
    "category": "string (e.g. Restaurant, Hotel, Salon)",
    "sub_category": "string (e.g. Fine Dining, Budget Hotel)",
    "years_in_operation": "string (estimate from review dates, e.g. '3+ years')",
    "review_volume_assessment": "string (e.g. 'High volume — statistically reliable')"
  },
  "sentiment_analysis": {
    "positive_percentage": number,
    "negative_percentage": number,
    "neutral_percentage": number,
    "repeat_complaints_percentage": number,
    "repeat_praises_percentage": number,
    "sentiment_summary": "string (2-3 sentence analysis)"
  },
  "strengths": [
    {
      "theme": "string (e.g. Staff Behavior, Food Quality)",
      "frequency": "string (e.g. 'Mentioned 45+ times')",
      "description": "string (1-2 sentence explanation)",
      "sample_quotes": ["string (direct review quotes)"]
    }
  ],
  "weaknesses": [
    {
      "category": "string (Service Issues / Staff Behavior / Hygiene / Pricing / Wait Time / Management)",
      "theme": "string",
      "frequency": "string (e.g. 'Appears in 20% of negative reviews')",
      "recency": "string (e.g. 'Increasing in recent months')",
      "is_increasing": boolean,
      "description": "string"
    }
  ],
  "operational_gaps": [
    {
      "complaint": "string (actual customer complaint pattern)",
      "business_problem": "string (translated business issue)",
      "root_cause": "string (systemic cause)"
    }
  ],
  "reputation_risk": {
    "risk_level": "low|medium|high|critical",
    "negative_review_type": "string (emotional vs factual)",
    "management_responds": boolean,
    "response_quality": "string (professional / defensive / absent)",
    "accountability_score": number (1-10),
    "summary": "string (2-3 sentences)"
  },
  "competitive_positioning": {
    "rating_vs_competitors": "string",
    "review_volume_vs_competitors": "string",
    "common_complaints_vs_industry": "string",
    "market_position_summary": "string"
  },
  "financial_impact": {
    "risk_areas": [
      {
        "issue": "string",
        "customer_segment_affected": "string (e.g. families, business travelers)",
        "estimated_revenue_impact": "string (e.g. '25-35% loss in family customers')",
        "explanation": "string"
      }
    ],
    "overall_revenue_risk": "string (overall assessment)"
  },
  "priority_fixes": [
    {
      "priority": "critical|medium|low",
      "issue": "string",
      "action_steps": ["string (specific actionable step)"]
    }
  ],
  "swot": {
    "strengths": ["string (top 3 from reviews)"],
    "weaknesses": ["string (most frequent negative patterns)"],
    "opportunities": ["string (what they can double down on)"],
    "threats": ["string (what could damage long-term brand)"]
  },
  "health_scores": {
    "service": number (1-10),
    "product": number (1-10),
    "management": number (1-10),
    "reputation": number (1-10),
    "operational_stability": number (1-10),
    "overall": number (1-10, weighted average),
    "summary": "string (1-2 sentence verdict)"
  },
  "business_summary": "string (executive summary paragraph)",
  "what_people_like": ["string (bullet points of praise)"],
  "what_people_dislike": ["string (bullet points of complaints)"],
  "complaint_clusters": [
    {
      "theme": "string",
      "frequency_indicator": "string",
      "impact_explanation": "string",
      "recommended_action": "string"
    }
  ],
  "revenue_risk_summary": "string",
  "improvement_priorities": ["string (prioritized action items)"],
  "opportunity_areas": ["string (growth opportunities)"]
}

IMPORTANT:
- Include at least 3-5 items in strengths, weaknesses, operational_gaps, and priority_fixes
- Include at least 3 items in SWOT lists  
- Include 2-4 financial impact risk areas
- All health scores should be between 1-10
- Be specific about the business, don't give generic advice
- priority_fixes should have at least 2 critical, 2 medium, and 1 low priority items`;

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
