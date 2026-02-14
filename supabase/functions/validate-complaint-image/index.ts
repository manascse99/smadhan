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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    const systemPrompt = `You are a STRICT image validator for a civic complaint system. Your job is to REJECT fake, irrelevant, or unrelated images.

${categoryContext}

CRITICAL RULES:
1. The image MUST be a real photograph taken outdoors or at the actual location of a civic issue.
2. REJECT (match=false, confidence=0.95) these types of images:
   - Screenshots of any kind (code editors, websites, apps, phones)
   - Photos of screens, monitors, or displays
   - Selfies, food photos, indoor furniture, shoes, clothing
   - Stock photos, memes, drawings, or AI-generated images
   - Any image NOT showing a real civic infrastructure problem
3. For "Road & Transport": ONLY accept images showing actual road conditions like potholes, cracks, damaged roads, broken footpaths, traffic issues, waterlogged roads.
4. For "Water Supply": ONLY accept images of water leaks, broken pipes, dirty water, water shortage.
5. For "Electricity": ONLY accept images of fallen poles, broken wires, no streetlights, electrical hazards.
6. For "Waste Management": ONLY accept images of garbage dumps, overflowing bins, littered areas.
7. For "Public Safety": ONLY accept images of broken railings, unsafe structures, missing manhole covers.
8. For "Healthcare": ONLY accept images of hospital/clinic conditions, medical facility issues.
9. For "Education": ONLY accept images of school/college infrastructure issues.

Respond ONLY with a valid JSON object (no markdown, no code fences):
- "match": boolean - true ONLY if the image genuinely matches the selected category
- "confidence": number (0-1) - how confident you are
- "detected": string - what you actually see in the image
- "suggestedCategory": one of: "Water Supply", "Road & Transport", "Electricity", "Waste Management", "Public Safety", "Healthcare", "Education", "Other"
- "suggestedDescription": string - 1-2 sentence complaint description (empty if not a civic issue)
- "imageQuality": one of: "good", "blurry", "dark", "unclear"

BE STRICT. When in doubt, set match to false.`;

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
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: systemPrompt },
                {
                  type: "text",
                  text: "Analyze this complaint image. Respond with JSON only.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 512,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            match: true,
            confidence: 0.5,
            detected: "Verification temporarily unavailable (rate limited)",
            suggestedCategory: category || "Other",
            suggestedDescription: "",
            imageQuality: "good",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error("No response from AI");
    }

    // Parse the JSON from AI response (strip markdown fences if present)
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
    // Return soft failure so user can still submit
    return new Response(
      JSON.stringify({
        match: true,
        confidence: 0.5,
        detected: "Verification temporarily unavailable",
        suggestedCategory: "Other",
        suggestedDescription: "",
        imageQuality: "good",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
