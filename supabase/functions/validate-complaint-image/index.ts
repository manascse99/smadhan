import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { imageBase64, category } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryContext = category
      ? `The user selected complaint category: "${category}".`
      : `No category has been selected yet.`;

    const systemPrompt = `You are an AI image analyst for a civic complaint management system. Analyze the uploaded image and determine what civic issue it shows.

Categories available: Water Supply, Road & Transport, Electricity, Waste Management, Public Safety, Healthcare, Education, Other.

${categoryContext}

Respond ONLY with a valid JSON object (no markdown, no code fences) with these exact fields:
- "match": boolean - whether the image matches the selected complaint category. True if it matches or no category selected.
- "confidence": number - confidence score from 0 to 1 for the category match.
- "detected": string - brief description of what was detected in the image (e.g. "garbage pile on roadside", "pothole on asphalt road").
- "suggestedCategory": string - one of: "Water Supply", "Road & Transport", "Electricity", "Waste Management", "Public Safety", "Healthcare", "Education", "Other"
- "suggestedDescription": string - a suggested complaint description based on the image content (1-2 sentences).
- "imageQuality": string - one of: "good", "blurry", "dark", "unclear"

If the image is completely unrelated to any civic issue (e.g. a selfie, food photo, random object), set match to false, confidence to 0.9+, and detected to what you actually see.`;

    // Extract the base64 data and mime type
    let mimeType = "image/jpeg";
    let base64Data = imageBase64;

    if (imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  text: "Analyze this complaint image. Determine if it matches the selected category, what you detect in the image, suggest the best category, suggest a description, and check image quality. Respond with JSON only.",
                },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No response from Gemini");
    }

    // Parse the JSON from Gemini's response (strip markdown fences if present)
    let cleanJson = textContent.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const result = JSON.parse(cleanJson);

    // Validate required fields
    const validated = {
      match: typeof result.match === "boolean" ? result.match : false,
      confidence: typeof result.confidence === "number" ? result.confidence : 0.5,
      detected: typeof result.detected === "string" ? result.detected : "Unable to determine",
      suggestedCategory: result.suggestedCategory || "Other",
      suggestedDescription: result.suggestedDescription || "",
      imageQuality: ["good", "blurry", "dark", "unclear"].includes(result.imageQuality) ? result.imageQuality : "good",
    };

    return new Response(JSON.stringify(validated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("validate-complaint-image error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
