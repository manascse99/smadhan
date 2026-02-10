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

    const systemPrompt = `You are an AI image analyst for a civic complaint management system. Analyze the uploaded image and determine what civic issue it shows.

Categories available: Water Supply, Road & Transport, Electricity, Waste Management, Public Safety, Healthcare, Education, Other.

${categoryContext}

Analyze the image and call the validate_image function with your findings.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this complaint image. Determine if it matches the selected category, what you detect in the image, suggest the best category, suggest a description, and check image quality.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "validate_image",
                description:
                  "Return structured validation results for a complaint image.",
                parameters: {
                  type: "object",
                  properties: {
                    match: {
                      type: "boolean",
                      description:
                        "Whether the image matches the selected complaint category. True if it matches or no category selected.",
                    },
                    confidence: {
                      type: "number",
                      description:
                        "Confidence score from 0 to 1 for the category match.",
                    },
                    detected: {
                      type: "string",
                      description:
                        "Brief description of what was detected in the image (e.g. 'garbage pile on roadside', 'pothole on asphalt road').",
                    },
                    suggestedCategory: {
                      type: "string",
                      enum: [
                        "Water Supply",
                        "Road & Transport",
                        "Electricity",
                        "Waste Management",
                        "Public Safety",
                        "Healthcare",
                        "Education",
                        "Other",
                      ],
                      description:
                        "The best matching category for this image based on what was detected.",
                    },
                    suggestedDescription: {
                      type: "string",
                      description:
                        "A suggested complaint description based on the image content (1-2 sentences).",
                    },
                    imageQuality: {
                      type: "string",
                      enum: ["good", "blurry", "dark", "unclear"],
                      description: "Assessment of the image quality.",
                    },
                  },
                  required: [
                    "match",
                    "confidence",
                    "detected",
                    "suggestedCategory",
                    "suggestedDescription",
                    "imageQuality",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "validate_image" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
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
