
import { GoogleGenAI, Type } from "@google/genai";
import { 
  DataSchema, AnalysisResponse, AnalysisResult, ImageSize, AspectRatio 
} from "../types";

const SYSTEM_PROMPT = `You are a World-Class Senior AI Data Analyst Narrator. 
Rules:
1. DATA INTEGRITY: You will be provided with pre-computed mathematical profiles. Never contradict these numbers.
2. NARRATION: Your primary job is to provide human-readable executive summaries and strategic "Why" behind the data.
3. CONTEXT: Use the statistical profile (nulls, outliers, counts) to answer user questions. 
4. MATH IS FIRST: The math has been done by a deterministic engine. Use it as ground truth.`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix for components/LiveAssistant.tsx: Exported missing createAI function
export const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAdvancedAnalysis = async (
  query: string, 
  schema: DataSchema, 
  history: { role: string, content: string }[]
): Promise<AnalysisResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: `Task: ${query}. Current Data Profile: ${JSON.stringify(schema)}. Provide an executive narrative.` }] }
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          title: { type: Type.STRING },
          explanation: { type: Type.STRING },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          data: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              // Fix: Properties must be non-empty for OBJECT types
              properties: {
                label: { type: Type.STRING, description: "The x-axis label or category name" },
                value: { type: Type.NUMBER, description: "The y-axis numeric value" }
              }
            } 
          },
          chartConfig: {
            type: Type.OBJECT,
            properties: {
              xAxis: { type: Type.STRING },
              yAxis: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        required: ["type", "title", "explanation", "insights", "data"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Fix for components/DataAnalyst.tsx: Exported missing performDataAnalysis function
export const performDataAnalysis = async (csvSnippet: string, prompt: string): Promise<AnalysisResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this CSV data snippet:\n${csvSnippet}\n\nUser Question: ${prompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chartType: { type: Type.STRING, enum: ['bar', 'line', 'area', 'pie'] },
          chartData: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              // Fix: Properties must be non-empty for OBJECT types
              properties: {
                name: { type: Type.STRING, description: "The dimension name" },
                value: { type: Type.NUMBER, description: "The metric value" }
              }
            } 
          },
          columns: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["chartType", "chartData", "columns", "summary", "insights"]
      }
    }
  });
  
  return JSON.parse(response.text || "{}") as AnalysisResult;
};

// Image and Video logic preserved for platform consistency
export const generateImage = async (prompt: string, size: ImageSize, ratio: AspectRatio): Promise<string> => {
  const model = (size === '2K' || size === '4K') ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: ratio as any, imageSize: size as any } }
  });
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("No image data returned from model");
};

// Fix for components/ImageLab.tsx: Exported missing editImage function using Gemini Vision
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';
  const data = base64Image.split(',')[1];
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data, mimeType } },
        { text: prompt }
      ]
    }
  });
  
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  throw new Error("No edited image data returned from model");
};

export const animateImage = async (base64Image: string, prompt: string, ratio: AspectRatio): Promise<string> => {
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: { imageBytes: base64Image.split(',')[1], mimeType: 'image/png' },
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: ratio as any }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

// Fix for components/GeneralChat.tsx: Exported missing searchGroundedChat function with Google Search tool
export const searchGroundedChat = async (query: string): Promise<{ text: string, sources: any[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  return {
    text: response.text || "",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
