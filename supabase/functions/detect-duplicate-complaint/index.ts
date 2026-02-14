import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { imageBase64, category, locationLat, locationLng, title, description } = await req.json();

    if (!category) {
      return new Response(JSON.stringify({ isDuplicate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query: same category, non-resolved, last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let query = supabase
      .from("complaints")
      .select("id, title, description, category, location_lat, location_lng, location_address, image_urls, upvotes, status, created_at")
      .eq("category", category)
      .not("status", "eq", "resolved")
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: complaints, error: dbError } = await query;

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ isDuplicate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!complaints || complaints.length === 0) {
      return new Response(JSON.stringify({ isDuplicate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter by ~2km radius if location provided
    let nearbyComplaints = complaints;
    if (locationLat && locationLng) {
      const kmPerDegreeLat = 111.0;
      const kmPerDegreeLng = 111.0 * Math.cos((locationLat * Math.PI) / 180);
      const deltaLat = 2.0 / kmPerDegreeLat;
      const deltaLng = 2.0 / kmPerDegreeLng;

      nearbyComplaints = complaints.filter((c) => {
        if (!c.location_lat || !c.location_lng) return false;
        return (
          Math.abs(c.location_lat - locationLat) <= deltaLat &&
          Math.abs(c.location_lng - locationLng) <= deltaLng
        );
      });
    }

    if (nearbyComplaints.length === 0) {
      return new Response(JSON.stringify({ isDuplicate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Take top 3 candidates (with images preferred)
    const candidates = nearbyComplaints
      .sort((a, b) => {
        const aHasImg = a.image_urls && a.image_urls.length > 0 ? 1 : 0;
        const bHasImg = b.image_urls && b.image_urls.length > 0 ? 1 : 0;
        return bHasImg - aHasImg;
      })
      .slice(0, 3);

    // Build AI prompt
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not set");
      return new Response(JSON.stringify({ isDuplicate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingDescriptions = candidates.map((c, i) => 
      `Existing Complaint ${i + 1} (ID: ${c.id}):\n- Title: ${c.title}\n- Description: ${c.description}\n- Location: ${c.location_address}\n- Upvotes: ${c.upvotes}\n- Status: ${c.status}`
    ).join("\n\n");

    // Build messages with images
    const userContent: any[] = [];

    // Add new complaint image if provided
    if (imageBase64) {
      userContent.push({
        type: "text",
        text: "NEW COMPLAINT IMAGE:"
      });
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 }
      });
    }

    // Add existing complaint images
    for (const c of candidates) {
      if (c.image_urls && c.image_urls.length > 0) {
        userContent.push({
          type: "text",
          text: `EXISTING COMPLAINT ${c.id} IMAGE:`
        });
        userContent.push({
          type: "image_url",
          image_url: { url: c.image_urls[0] }
        });
      }
    }

    userContent.push({
      type: "text",
      text: `NEW COMPLAINT:\n- Title: ${title || "Not provided"}\n- Description: ${description || "Not provided"}\n- Category: ${category}\n\nEXISTING COMPLAINTS IN THE AREA:\n${existingDescriptions}\n\nCompare the new complaint with each existing complaint. Determine if any existing complaint is about the SAME issue at the SAME location. Consider both the images (if available) and the text descriptions.\n\nReturn a JSON object with:\n- "isDuplicate": boolean (true if confidence >= 0.75)\n- "confidence": number between 0 and 1\n- "matchingComplaintId": string or null (the ID of the matching existing complaint)\n- "matchingReason": string (brief explanation of why it's a match or not)`
    });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a duplicate complaint detector for a civic grievance platform. Compare new complaints against existing ones to find duplicates. Only mark as duplicate if they clearly describe the SAME issue at the SAME location. Return ONLY valid JSON, no markdown."
          },
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429 || aiResponse.status === 402) {
        console.warn("AI rate limited, skipping duplicate check");
      } else {
        console.error("AI error:", aiResponse.status, await aiResponse.text());
      }
      return new Response(JSON.stringify({ isDuplicate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let result;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ isDuplicate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enrich with complaint details if duplicate found
    if (result.isDuplicate && result.matchingComplaintId) {
      const match = candidates.find(c => c.id === result.matchingComplaintId);
      if (match) {
        result.matchingComplaint = {
          id: match.id,
          title: match.title,
          category: match.category,
          location_address: match.location_address,
          upvotes: match.upvotes,
          status: match.status,
        };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-duplicate error:", e);
    return new Response(JSON.stringify({ isDuplicate: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
