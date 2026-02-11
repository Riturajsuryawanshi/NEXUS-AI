
import { GoogleGenAI, Type } from "@google/genai";
import { DataSummary, Brain2Result, ChatMessage, DashboardConfig } from "../types";
import { UserService } from "./userService";

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static cleanJsonResponse(text: string): string {
    let cleaned = text.trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
    return cleaned;
  }

  static async generateInsights(summary: DataSummary): Promise<Brain2Result> {
    const ai = this.getAI();
    const model = 'gemini-1.5-flash';

    const systemInstruction = `You are Brain 2: The Narrative Reasoning Layer. 
    Interpret the JSON summary provided.
    Ground every claim in the qualityScore and column stats.
    Be a world-class senior data analyst.
    Output MUST be valid JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: `Context: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            key_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggested_kpis: { type: Type.ARRAY, items: { type: Type.STRING } },
            causal_explanation: { type: Type.STRING },
            learning_notes: { type: Type.STRING }
          },
          required: ["summary", "key_insights", "suggested_kpis"]
        },
        temperature: 0.1,
      }
    });

    try {
      return JSON.parse(this.cleanJsonResponse(response.text));
    } catch (e) {
      return { summary: "Error parsing analyst insights.", key_insights: [], suggested_kpis: [] };
    }
  }

  static async designDashboard(summary: DataSummary): Promise<any> {
    const ai = this.getAI();
    const model = 'gemini-1.5-flash';

    const systemInstruction = `You are a Senior Dashboard Architect.
    Based on the column metadata and statistics, design the most effective visual layout.
    - If there are time-series columns, prioritize Line charts.
    - If there are categorical columns with high variance, prioritize Bar or Pie charts.
    - Choose KPIs that represent the core health of the data (Means, Totals).
    Output JSON blueprint.`;

    const response = await ai.models.generateContent({
      model,
      contents: `Data Profile: ${JSON.stringify(summary.columns)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kpis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  column: { type: Type.STRING }
                }
              }
            },
            charts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "bar, line, pie, or scatter" },
                  title: { type: Type.STRING },
                  xKey: { type: Type.STRING },
                  yKey: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(this.cleanJsonResponse(response.text));
  }

  static async chatWithData(summary: DataSummary, history: ChatMessage[], message: string): Promise<ChatMessage> {
    const ai = this.getAI();
    const model = 'gemini-1.5-flash';

    const systemInstruction = `You are the Nexus Lead Data Analyst. 
    You are in a live consultation with a client.
    
    STRICT RULES:
    1. ONLY answer based on the provided data summary and sample rows.
    2. If a question cannot be answered with the current data, state: "The current dataset does not contain sufficient dimensions to answer that."
    3. Use professional, analytical language (e.g., "The distribution suggests...", "We observe a correlation in...").
    4. Provide specific numbers from the stats provided.
    5. If the user asks for a visualization or dashboard, set actionHint to "build_dashboard".
    
    DATA CONTEXT: ${JSON.stringify(summary)}`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: message }] }
      ] as any,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            actionHint: { type: Type.STRING }
          },
          required: ["content"]
        }
      }
    });

    try {
      const result = JSON.parse(this.cleanJsonResponse(response.text));
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        actionHint: result.actionHint
      };
    } catch (e) {
      return { id: crypto.randomUUID(), role: 'assistant', content: "I'm analyzing the data frames, but encountered a processing error. Could you rephrase your question?", timestamp: Date.now() };
    }
  }
  static async generateContent(prompt: string): Promise<string> {
    const ai = this.getAI();
    const model = 'gemini-1.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "text/plain",
      }
    });

    return response.text;
  }
}
