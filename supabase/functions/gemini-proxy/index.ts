import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.1.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in Edge Function secrets.");
        }

        const { type, prompt, data, history, systemInstruction, config } = await req.json();

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.0-flash by default, or allow override
        const modelName = config?.model || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction
        });

        let resultText = "";
        let actionHint = "";

        if (type === "json_mode" || type === "generateReviewInsights") {
            // Structured JSON generation
            const generationConfig = {
                responseMimeType: "application/json",
                temperature: config?.temperature || 0.1,
            };

            const content = type === "generateReviewInsights"
                ? (prompt || `Analyze these reviews:\n${JSON.stringify(data)}`)
                : prompt;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: content }] }],
                generationConfig
            });
            resultText = result.response.text();

        } else if (type === "chat") {
            // Chat mode
            const chat = model.startChat({
                history: history?.map((h: any) => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }]
                })) || [],
                generationConfig: {
                    responseMimeType: "application/json", // We consistently abuse JSON mode for structure
                }
            });

            const result = await chat.sendMessage(prompt);
            resultText = result.response.text();

        } else {
            // Default text generation
            const result = await model.generateContent(prompt);
            resultText = result.response.text();
        }

        return new Response(JSON.stringify({ text: resultText }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Gemini Proxy Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
