import { supabase } from "@/integrations/supabase/client";

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: "status_update" | "sla_warning" | "resolution" | "system",
  complaintId?: string
) {
  try {
    const { error } = await supabase.functions.invoke("send-notification", {
      body: {
        user_id: userId,
        title,
        message,
        type,
        complaint_id: complaintId,
      },
    });

    if (error) {
      console.error("Error sending notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error invoking notification function:", error);
    return false;
  }
}

export function getStatusNotificationMessage(
  status: string,
  complaintTitle: string
): { title: string; message: string; type: "status_update" | "resolution" } {
  switch (status) {
    case "verified":
      return {
        title: "Complaint Verified",
        message: `Your complaint "${complaintTitle}" has been verified and is now being processed.`,
        type: "status_update",
      };
    case "processing":
      return {
        title: "Complaint In Progress",
        message: `Work has started on your complaint "${complaintTitle}".`,
        type: "status_update",
      };
    case "resolved":
      return {
        title: "Complaint Resolved!",
        message: `Great news! Your complaint "${complaintTitle}" has been resolved. Please rate your experience.`,
        type: "resolution",
      };
    case "escalated":
      return {
        title: "Complaint Escalated",
        message: `Your complaint "${complaintTitle}" has been escalated to senior officials.`,
        type: "status_update",
      };
    case "fund_required":
      return {
        title: "Funding Required",
        message: `Your complaint "${complaintTitle}" requires budget allocation. This may take additional time.`,
        type: "status_update",
      };
    default:
      return {
        title: "Status Update",
        message: `Your complaint "${complaintTitle}" status has been updated to ${status}.`,
        type: "status_update",
      };
  }
}
