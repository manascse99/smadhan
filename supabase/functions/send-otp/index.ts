import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  name: string;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: SendOtpRequest = await req.json();
    
    console.log(`Sending OTP to: ${email}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate 6-digit OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email);

    // Store OTP in database
    const { error: dbError } = await supabase
      .from("otp_codes")
      .insert({
        email,
        code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store OTP");
    }

    // Send email with OTP using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lok Samadhan <onboarding@resend.dev>",
        to: [email],
        subject: "Your Verification Code - Lok Samadhan",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
            <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px;">⚖️</span>
                </div>
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Lok Samadhan</h1>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; margin-bottom: 8px;">Hello ${name},</p>
              <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">Use the verification code below to complete your signup:</p>
              
              <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b;">${otp}</span>
              </div>
              
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-bottom: 0;">
                This code expires in 10 minutes.<br>
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
