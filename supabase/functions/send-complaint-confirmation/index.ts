import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ComplaintConfirmationRequest {
  email: string;
  name: string;
  complaintId: string;
  title: string;
  category: string;
  description: string;
  location: string;
  department: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      complaintId, 
      title, 
      category, 
      description, 
      location, 
      department 
    }: ComplaintConfirmationRequest = await req.json();
    
    console.log(`Sending complaint confirmation to: ${email}`);

    const filedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lok Samadhan <onboarding@resend.dev>",
        to: [email],
        subject: `Complaint Registered - ${complaintId} | Lok Samadhan`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center;">
                <div style="width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px;">⚖️</span>
                </div>
                <h1 style="color: white; font-size: 24px; margin: 0;">Complaint Registered Successfully</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 30px;">
                <p style="color: #3f3f46; font-size: 16px; margin-bottom: 20px;">Dear ${name},</p>
                
                <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
                  Your complaint has been successfully registered with Lok Samadhan. Below are the details of your submission:
                </p>
                
                <!-- Complaint ID Box -->
                <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                  <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Complaint ID</p>
                  <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: white;">${complaintId}</span>
                </div>
                
                <!-- Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #71717a; font-size: 14px; width: 140px;">Filed On</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 500;">${filedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #71717a; font-size: 14px;">Title</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 500;">${title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #71717a; font-size: 14px;">Category</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 500;">${category}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #71717a; font-size: 14px;">Forwarded To</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 500;">
                      <span style="background: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 4px; font-size: 12px;">${department} Department</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #71717a; font-size: 14px;">Location</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 500;">${location}</td>
                  </tr>
                </table>
                
                <!-- Description -->
                <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="color: #71717a; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Description</p>
                  <p style="color: #3f3f46; font-size: 14px; margin: 0; line-height: 1.6;">${description.substring(0, 300)}${description.length > 300 ? '...' : ''}</p>
                </div>
                
                <!-- What's Next -->
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px;">
                  <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">What happens next?</p>
                  <ol style="color: #15803d; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Your complaint has been forwarded to the ${department} Department</li>
                    <li>An officer will verify and process your complaint</li>
                    <li>You can track progress using your Complaint ID</li>
                    <li>You'll receive updates as your complaint progresses</li>
                  </ol>
                </div>
                
                <!-- Footer -->
                <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                  Thank you for using Lok Samadhan.<br>
                  Together, we build a better community.
                </p>
              </div>
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

    console.log("Complaint confirmation email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-complaint-confirmation function:", error);
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
