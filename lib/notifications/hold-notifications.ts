/**
 * Email Notification System for Availability Holds
 *
 * Sends emails when:
 * 1. Hold is requested (notify target)
 * 2. Hold is accepted (notify requester)
 * 3. Hold is declined (notify requester)
 * 4. Hold expires (notify requester)
 */

import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface HoldNotificationData {
  holdId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  targetId: string;
  targetName: string;
  targetEmail: string;
  startsAt: string;
  endsAt: string;
  message?: string | null;
  jobReference?: string | null;
  expiresAt?: string;
}

/**
 * Send email notification when a hold is requested
 */
export async function sendHoldRequestNotification(data: HoldNotificationData) {
  const subject = `New Availability Hold Request from ${data.requesterName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">New Availability Hold Request</h2>

      <p>Hello ${data.targetName},</p>

      <p><strong>${data.requesterName}</strong> has requested to place a hold on your availability:</p>

      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Start:</strong> ${format(new Date(data.startsAt), "PPP p")}</p>
        <p style="margin: 5px 0;"><strong>End:</strong> ${format(new Date(data.endsAt), "PPP p")}</p>
        ${data.jobReference ? `<p style="margin: 5px 0;"><strong>Job Reference:</strong> ${data.jobReference}</p>` : ""}
      </div>

      ${data.message ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin: 10px 0 0;">${data.message}</p>
        </div>
      ` : ""}

      <p style="color: #dc2626; font-weight: 600;">
        ⏰ This hold will expire in 48 hours if not responded to.
      </p>

      <div style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/en/account/availability"
           style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View & Respond to Hold
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #6b7280; font-size: 14px;">
        You can accept or decline this hold from your availability calendar. If accepted, this time will be blocked on your calendar.
      </p>
    </div>
  `;

  try {
    // In production, integrate with an email service like Resend, SendGrid, or Amazon SES
    // For now, we'll log and use Supabase's edge function if available

    console.log("Sending hold request notification:", {
      to: data.targetEmail,
      subject,
      holdId: data.holdId,
    });

    // Example with Resend (popular Next.js email service):
    // await resend.emails.send({
    //   from: 'Guide Validator <notifications@guidevalidator.com>',
    //   to: data.targetEmail,
    //   subject,
    //   html,
    // });

    // Placeholder: Store notification in database for now
    await supabaseAdmin.from("notifications").insert({
      user_id: data.targetId,
      type: "hold_request",
      title: subject,
      message: `${data.requesterName} has requested a hold on your availability`,
      data: { hold_id: data.holdId },
      read: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending hold request notification:", error);
    return { success: false, error };
  }
}

/**
 * Send email notification when a hold is accepted
 */
export async function sendHoldAcceptedNotification(data: HoldNotificationData) {
  const subject = `✅ Your Availability Hold Has Been Accepted`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Hold Accepted!</h2>

      <p>Great news!</p>

      <p><strong>${data.targetName}</strong> has accepted your availability hold request:</p>

      <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Start:</strong> ${format(new Date(data.startsAt), "PPP p")}</p>
        <p style="margin: 5px 0;"><strong>End:</strong> ${format(new Date(data.endsAt), "PPP p")}</p>
        ${data.jobReference ? `<p style="margin: 5px 0;"><strong>Job Reference:</strong> ${data.jobReference}</p>` : ""}
      </div>

      <p style="color: #059669; font-weight: 600;">
        ✓ This time is now blocked on ${data.targetName}'s calendar.
      </p>

      <div style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/en/chat"
           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Message ${data.targetName}
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #6b7280; font-size: 14px;">
        You can now proceed with finalizing the booking details with ${data.targetName}.
      </p>
    </div>
  `;

  try {
    console.log("Sending hold accepted notification:", {
      to: data.requesterEmail,
      subject,
      holdId: data.holdId,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: data.requesterId,
      type: "hold_accepted",
      title: subject,
      message: `${data.targetName} accepted your availability hold`,
      data: { hold_id: data.holdId },
      read: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending hold accepted notification:", error);
    return { success: false, error };
  }
}

/**
 * Send email notification when a hold is declined
 */
export async function sendHoldDeclinedNotification(data: HoldNotificationData) {
  const subject = `❌ Your Availability Hold Was Declined`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Hold Declined</h2>

      <p>Hello,</p>

      <p><strong>${data.targetName}</strong> has declined your availability hold request:</p>

      <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Start:</strong> ${format(new Date(data.startsAt), "PPP p")}</p>
        <p style="margin: 5px 0;"><strong>End:</strong> ${format(new Date(data.endsAt), "PPP p")}</p>
        ${data.jobReference ? `<p style="margin: 5px 0;"><strong>Job Reference:</strong> ${data.jobReference}</p>` : ""}
      </div>

      <p>This may mean they're unavailable for these dates or have already committed to another booking.</p>

      <div style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/en/directory"
           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Browse Other Guides
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #6b7280; font-size: 14px;">
        You can search for other available guides or contact ${data.targetName} directly to discuss alternative dates.
      </p>
    </div>
  `;

  try {
    console.log("Sending hold declined notification:", {
      to: data.requesterEmail,
      subject,
      holdId: data.holdId,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: data.requesterId,
      type: "hold_declined",
      title: subject,
      message: `${data.targetName} declined your availability hold`,
      data: { hold_id: data.holdId },
      read: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending hold declined notification:", error);
    return { success: false, error };
  }
}

/**
 * Send email notification when a hold expires
 */
export async function sendHoldExpiredNotification(data: HoldNotificationData) {
  const subject = `⏰ Your Availability Hold Expired`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Hold Expired</h2>

      <p>Hello,</p>

      <p>Your availability hold request to <strong>${data.targetName}</strong> has expired without a response:</p>

      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Start:</strong> ${format(new Date(data.startsAt), "PPP p")}</p>
        <p style="margin: 5px 0;"><strong>End:</strong> ${format(new Date(data.endsAt), "PPP p")}</p>
        ${data.jobReference ? `<p style="margin: 5px 0;"><strong>Job Reference:</strong> ${data.jobReference}</p>` : ""}
        <p style="margin: 5px 0; color: #92400e;"><strong>Expired:</strong> 48 hours after request</p>
      </div>

      <p>The hold has been automatically cancelled. You can:</p>

      <ul style="color: #4b5563;">
        <li>Send a new hold request with different dates</li>
        <li>Contact ${data.targetName} directly to discuss availability</li>
        <li>Browse other available guides</li>
      </ul>

      <div style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/en/directory"
           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Find Other Guides
        </a>
      </div>
    </div>
  `;

  try {
    console.log("Sending hold expired notification:", {
      to: data.requesterEmail,
      subject,
      holdId: data.holdId,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: data.requesterId,
      type: "hold_expired",
      title: subject,
      message: `Your hold request to ${data.targetName} expired`,
      data: { hold_id: data.holdId },
      read: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending hold expired notification:", error);
    return { success: false, error };
  }
}

/**
 * Batch process to send notifications for recently changed holds
 * This would be called by a cron job or scheduled function
 */
export async function processHoldNotifications() {
  try {
    // Get holds that changed status in the last 5 minutes and haven't been notified
    const { data: recentHolds, error } = await supabaseAdmin
      .from("availability_holds")
      .select(`
        id,
        requester_id,
        target_id,
        starts_at,
        ends_at,
        status,
        message,
        job_reference,
        expires_at,
        updated_at,
        requester:profiles!availability_holds_requester_id_fkey(full_name, email),
        target:profiles!availability_holds_target_id_fkey(full_name, email)
      `)
      .gte("updated_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .in("status", ["accepted", "declined", "expired"]);

    if (error) throw error;

    for (const hold of recentHolds || []) {
      const requester = Array.isArray(hold.requester) ? hold.requester[0] : hold.requester;
      const target = Array.isArray(hold.target) ? hold.target[0] : hold.target;

      const notificationData: HoldNotificationData = {
        holdId: hold.id,
        requesterId: hold.requester_id,
        requesterName: requester?.full_name || "Unknown",
        requesterEmail: requester?.email,
        targetId: hold.target_id,
        targetName: target?.full_name || "Unknown",
        targetEmail: target?.email,
        startsAt: hold.starts_at,
        endsAt: hold.ends_at,
        message: hold.message,
        jobReference: hold.job_reference,
        expiresAt: hold.expires_at,
      };

      switch (hold.status) {
        case "accepted":
          await sendHoldAcceptedNotification(notificationData);
          break;
        case "declined":
          await sendHoldDeclinedNotification(notificationData);
          break;
        case "expired":
          await sendHoldExpiredNotification(notificationData);
          break;
      }
    }

    return { success: true, processed: recentHolds?.length || 0 };
  } catch (error) {
    console.error("Error processing hold notifications:", error);
    return { success: false, error };
  }
}
