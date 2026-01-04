import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationPayload {
  complaint_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  complaint_title: string;
  old_status: string;
  new_status: string;
  remarks?: string;
  admin_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const payload: StatusNotificationPayload = await req.json();

    console.log("Received status notification request:", payload);

    if (!payload.complaint_id || !payload.user_id || !payload.new_status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let title = "Status Update";
    let message = "";
    let type: "status_update" | "resolution" | "sla_warning" | "system" = "status_update";

    switch (payload.new_status) {
      case "verified":
        title = "Complaint Verified";
        message = `Your complaint "${payload.complaint_title}" has been verified and is now being processed.`;
        break;
      case "processing":
        title = "Complaint In Progress";
        message = `Work has started on your complaint "${payload.complaint_title}".`;
        break;
      case "resolved":
        title = "Complaint Resolved!";
        message = `Great news! Your complaint "${payload.complaint_title}" has been resolved. Please rate your experience.`;
        type = "resolution";
        break;
      case "escalated":
        title = "Complaint Escalated";
        message = `Your complaint "${payload.complaint_title}" has been escalated to senior officials.`;
        break;
      case "fund_required":
        title = "Funding Required";
        message = `Your complaint "${payload.complaint_title}" requires budget allocation.`;
        break;
      default:
        message = `Your complaint "${payload.complaint_title}" status has been updated to ${payload.new_status}.`;
    }

    if (payload.remarks) {
      message += ` Remarks: ${payload.remarks}`;
    }

    // Create in-app notification
    const { data: notificationData, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: payload.user_id,
        title,
        message,
        type,
        complaint_id: payload.complaint_id,
        is_read: false,
      })
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    } else {
      console.log("In-app notification created:", notificationData);
    }

    // Send email notification
    if (resendApiKey && payload.user_email) {
      try {
        const resend = new Resend(resendApiKey);

        const statusBadgeColor: Record<string, string> = {
          verified: "#3b82f6",
          processing: "#f59e0b",
          resolved: "#22c55e",
          escalated: "#ef4444",
          fund_required: "#8b5cf6",
          filed: "#6b7280",
        };

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #ea580c 0%, #f59e0b 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">LokSeva Complaint Portal</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px;">
                <p>Dear <strong>${payload.user_name || "Citizen"}</strong>,</p>
                <div style="background: #f9fafb; border-left: 4px solid ${statusBadgeColor[payload.new_status] || "#6b7280"}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin: 0 0 10px 0;">${title}</h2>
                  <p style="margin: 0; color: #6b7280;">${message}</p>
                </div>
                <p><strong>Complaint ID:</strong> ${payload.complaint_id}</p>
                <p><strong>Status:</strong> <span style="background: ${statusBadgeColor[payload.new_status] || "#6b7280"}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${payload.new_status.toUpperCase()}</span></p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px;">This is an automated message from LokSeva Complaint Portal.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: "LokSeva <onboarding@resend.dev>",
          to: [payload.user_email],
          subject: `${title} - Complaint #${payload.complaint_id}`,
          html: emailHtml,
        });

        console.log("Email sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification: notificationData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
