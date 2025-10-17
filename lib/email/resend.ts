import { Resend } from "resend";

type ProfileEmailPayload = {
  to: string | null | undefined;
  fullName?: string | null;
  role: string;
  locale?: string | null;
  actorEmail?: string | null;
};

type SendResult = {
  ok: boolean;
  error?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME ?? "Guide Validator";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://guidevalidator.com";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured; skipping email send.");
    return null;
  }

  if (!client) {
    client = new Resend(RESEND_API_KEY);
  }

  return client;
}

function getFromAddress(): string | null {
  if (!RESEND_FROM_EMAIL) {
    console.warn("RESEND_FROM_EMAIL is not configured; skipping email send.");
    return null;
  }

  const trimmedName = RESEND_FROM_NAME.trim();
  if (!trimmedName) {
    return RESEND_FROM_EMAIL;
  }

  return `${trimmedName} <${RESEND_FROM_EMAIL}>`;
}

function normaliseRole(role: string): string {
  const ROLE_LABELS: Record<string, string> = {
    guide: "Guide",
    agency: "Agency",
    dmc: "Destination Management Company",
    transport: "Transport Partner",
    visitor: "Visitor",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  return ROLE_LABELS[role] ?? role;
}

function normaliseName(value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return "there";
  return trimmed;
}

function buildFooter(actorEmail?: string | null): string {
  if (!actorEmail) {
    return "This notification was sent automatically by Guide Validator.";
  }

  return `This notification was sent automatically by Guide Validator. If you have questions, reply to ${actorEmail}.`;
}

async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<SendResult> {
  const resend = getClient();
  const from = getFromAddress();

  if (!resend || !from) {
    return { ok: false, error: "missing-client" };
  }

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (error: any) {
    console.error("Failed to send Resend email", error);
    return { ok: false, error: error?.message ?? "send-error" };
  }
}

function formatGreeting(payload: ProfileEmailPayload): string {
  const name = normaliseName(payload.fullName);
  return `Hi ${name},`;
}

function profileDashboardLink(locale?: string | null): string {
  const safeLocale = locale && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(locale) ? locale : "en";
  return `${APP_URL.replace(/\/$/, "")}/${safeLocale}/my-account`;
}

function authLink(locale?: string | null): string {
  const safeLocale = locale && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(locale) ? locale : "en";
  return `${APP_URL.replace(/\/$/, "")}/${safeLocale}/auth/sign-in`;
}

export async function sendProfileCreatedEmail(payload: ProfileEmailPayload): Promise<SendResult> {
  if (!payload.to) {
    console.warn("sendProfileCreatedEmail called without recipient");
    return { ok: false, error: "missing-recipient" };
  }

  const roleLabel = normaliseRole(payload.role);
  const greeting = formatGreeting(payload);
  const loginLink = authLink(payload.locale);
  const dashboardLink = profileDashboardLink(payload.locale);
  const footer = buildFooter(payload.actorEmail);

  const subject = `Your Guide Validator ${roleLabel} profile is ready`;
  const text = [
    greeting,
    "",
    `Your ${roleLabel} profile has been created. You can sign in to review and complete your information at any time.`,
    `Sign in: ${loginLink}`,
    `Profile dashboard: ${dashboardLink}`,
    "",
    footer,
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Your ${roleLabel} profile has been created. You can sign in to review and complete your information at any time.</p>
    <p><a href="${loginLink}">Sign in</a> &middot; <a href="${dashboardLink}">Open your profile dashboard</a></p>
    <p>${footer}</p>
  `;

  return sendEmail({ to: payload.to, subject, html, text });
}

export async function sendProfileUpdatedEmail(payload: ProfileEmailPayload): Promise<SendResult> {
  if (!payload.to) {
    console.warn("sendProfileUpdatedEmail called without recipient");
    return { ok: false, error: "missing-recipient" };
  }

  const roleLabel = normaliseRole(payload.role);
  const greeting = formatGreeting(payload);
  const dashboardLink = profileDashboardLink(payload.locale);
  const footer = buildFooter(payload.actorEmail);

  const subject = `Your Guide Validator ${roleLabel} profile was updated`;
  const text = [
    greeting,
    "",
    `Updates were made to your ${roleLabel} profile. Review the latest information and confirm everything looks correct.`,
    `Profile dashboard: ${dashboardLink}`,
    "",
    footer,
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Updates were made to your ${roleLabel} profile. Review the latest information and confirm everything looks correct.</p>
    <p><a href="${dashboardLink}">Open your profile dashboard</a></p>
    <p>${footer}</p>
  `;

  return sendEmail({ to: payload.to, subject, html, text });
}

export async function sendProfileDeletedEmail(payload: ProfileEmailPayload): Promise<SendResult> {
  if (!payload.to) {
    console.warn("sendProfileDeletedEmail called without recipient");
    return { ok: false, error: "missing-recipient" };
  }

  const roleLabel = normaliseRole(payload.role);
  const greeting = formatGreeting(payload);
  const footer = buildFooter(payload.actorEmail);

  const subject = `Your Guide Validator ${roleLabel} profile was removed`;
  const text = [
    greeting,
    "",
    `Your ${roleLabel} profile has been removed from Guide Validator. If this was unexpected, reply to this email for assistance.`,
    "",
    footer,
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Your ${roleLabel} profile has been removed from Guide Validator. If this was unexpected, reply to this email for assistance.</p>
    <p>${footer}</p>
  `;

  return sendEmail({ to: payload.to, subject, html, text });
}

type ApplicationNotificationPayload = {
  applicantEmail: string;
  applicantName: string;
  applicationType: "guide" | "agency" | "dmc" | "transport";
  applicationId: string;
  locale?: string | null;
};

export async function sendApplicationReceivedEmail(payload: ApplicationNotificationPayload): Promise<SendResult> {
  const roleLabel = normaliseRole(payload.applicationType);
  const greeting = `Hi ${payload.applicantName},`;

  const subject = `Your ${roleLabel} application has been received`;
  const text = [
    greeting,
    "",
    "Thank you for submitting your application to Guide Validator!",
    "",
    "Our verification team will review your credentials and reach out if we need anything else.",
    "You will be notified as soon as your profile is ready.",
    "",
    "This typically takes 1-3 business days.",
    "",
    "Best regards,",
    "The Guide Validator Team",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Thank you for submitting your application to Guide Validator!</p>
    <p>Our verification team will review your credentials and reach out if we need anything else. You will be notified as soon as your profile is ready.</p>
    <p><em>This typically takes 1-3 business days.</em></p>
    <p>Best regards,<br/>The Guide Validator Team</p>
  `;

  return sendEmail({ to: payload.applicantEmail, subject, html, text });
}

export async function sendAdminNewApplicationEmail(payload: ApplicationNotificationPayload): Promise<SendResult> {
  const adminEmail = "info@guidevalidator.com";
  const roleLabel = normaliseRole(payload.applicationType);
  const safeLocale = payload.locale && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(payload.locale) ? payload.locale : "en";
  const adminLink = `${APP_URL.replace(/\/$/, "")}/${safeLocale}/admin/applications`;

  const subject = `New ${roleLabel} Application - ${payload.applicantName}`;
  const text = [
    `A new ${roleLabel} application has been submitted:`,
    "",
    `Applicant: ${payload.applicantName}`,
    `Email: ${payload.applicantEmail}`,
    `Application ID: ${payload.applicationId}`,
    "",
    `Review and approve/decline: ${adminLink}`,
    "",
    "This is an automated notification from Guide Validator.",
  ].join("\n");

  const html = `
    <h2>New ${roleLabel} Application</h2>
    <p>A new ${roleLabel} application has been submitted:</p>
    <ul>
      <li><strong>Applicant:</strong> ${payload.applicantName}</li>
      <li><strong>Email:</strong> ${payload.applicantEmail}</li>
      <li><strong>Application ID:</strong> ${payload.applicationId}</li>
    </ul>
    <p><a href="${adminLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Application</a></p>
    <p><em>This is an automated notification from Guide Validator.</em></p>
  `;

  return sendEmail({ to: adminEmail, subject, html, text });
}

export async function sendApplicationApprovedEmail(payload: ApplicationNotificationPayload & { loginLink?: string }): Promise<SendResult> {
  const roleLabel = normaliseRole(payload.applicationType);
  const greeting = `Hi ${payload.applicantName},`;
  const loginLink = payload.loginLink || authLink(payload.locale);

  const subject = `Your ${roleLabel} application has been approved! 🎉`;
  const text = [
    greeting,
    "",
    "Great news! Your application has been approved.",
    "",
    `Your ${roleLabel} profile is now active on Guide Validator. You can sign in to complete your profile and start connecting with potential clients.`,
    "",
    `Sign in: ${loginLink}`,
    "",
    "Welcome to the Guide Validator community!",
    "",
    "Best regards,",
    "The Guide Validator Team",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p><strong>Great news! Your application has been approved.</strong> 🎉</p>
    <p>Your ${roleLabel} profile is now active on Guide Validator. You can sign in to complete your profile and start connecting with potential clients.</p>
    <p><a href="${loginLink}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In Now</a></p>
    <p>Welcome to the Guide Validator community!</p>
    <p>Best regards,<br/>The Guide Validator Team</p>
  `;

  return sendEmail({ to: payload.applicantEmail, subject, html, text });
}

export async function sendApplicationDeclinedEmail(payload: ApplicationNotificationPayload & { reason?: string }): Promise<SendResult> {
  const roleLabel = normaliseRole(payload.applicationType);
  const greeting = `Hi ${payload.applicantName},`;

  const subject = `Update on your ${roleLabel} application`;
  const reasonText = payload.reason ? `\n\nReason: ${payload.reason}` : "";

  const text = [
    greeting,
    "",
    `Thank you for your interest in joining Guide Validator as a ${roleLabel}.`,
    "",
    `After careful review, we are unable to approve your application at this time.${reasonText}`,
    "",
    "If you have questions or would like to reapply in the future, please feel free to contact us.",
    "",
    "Best regards,",
    "The Guide Validator Team",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Thank you for your interest in joining Guide Validator as a ${roleLabel}.</p>
    <p>After careful review, we are unable to approve your application at this time.${payload.reason ? `<br/><br/><strong>Reason:</strong> ${payload.reason}` : ""}</p>
    <p>If you have questions or would like to reapply in the future, please feel free to contact us.</p>
    <p>Best regards,<br/>The Guide Validator Team</p>
  `;

  return sendEmail({ to: payload.applicantEmail, subject, html, text });
}

/**
 * Send contact form submission notification to admin
 */
export async function sendContactFormEmail(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<SendResult> {
  const adminEmail = "info@guidevalidator.com";

  const subject = `Contact Form: ${payload.subject}`;

  const text = [
    "New Contact Form Submission",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Subject: ${payload.subject}`,
    "",
    "Message:",
    payload.message,
    "",
    "---",
    "This is an automated notification from Guide Validator contact form.",
  ].join("\n");

  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${payload.email}">${payload.email}</a></p>
    <p><strong>Subject:</strong> ${payload.subject}</p>
    <br/>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-wrap;">${payload.message}</p>
    <br/>
    <hr/>
    <p style="color: #666; font-size: 12px;">This is an automated notification from Guide Validator contact form.</p>
  `;

  return sendEmail({ to: adminEmail, subject, html, text });
}

/**
 * Send verification approved notification to applicant
 */
export async function sendVerificationApprovedEmail(payload: {
  applicantEmail: string;
  applicantName: string;
  applicationType: "guide" | "agency" | "dmc" | "transport";
  locale?: string | null;
  notes?: string | null;
}): Promise<SendResult> {
  const roleLabel = normaliseRole(payload.applicationType);
  const greeting = `Hi ${payload.applicantName},`;
  const loginLink = authLink(payload.locale);

  const subject = `Your ${roleLabel} verification has been approved! 🎉`;
  const notesText = payload.notes ? `\n\nAdmin notes: ${payload.notes}` : "";

  const text = [
    greeting,
    "",
    "Great news! Your credentials have been verified and approved.",
    "",
    `Your ${roleLabel} profile is now active on Guide Validator. You can sign in to access all features and start connecting with clients.`,
    "",
    `Sign in: ${loginLink}`,
    notesText,
    "",
    "Welcome to the Guide Validator community!",
    "",
    "Best regards,",
    "The Guide Validator Team",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p><strong>Great news! Your credentials have been verified and approved.</strong> 🎉</p>
    <p>Your ${roleLabel} profile is now active on Guide Validator. You can sign in to access all features and start connecting with clients.</p>
    <p><a href="${loginLink}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In Now</a></p>
    ${payload.notes ? `<p><strong>Admin notes:</strong> ${payload.notes}</p>` : ""}
    <p>Welcome to the Guide Validator community!</p>
    <p>Best regards,<br/>The Guide Validator Team</p>
  `;

  return sendEmail({ to: payload.applicantEmail, subject, html, text });
}

/**
 * Send verification rejected notification to applicant
 */
export async function sendVerificationRejectedEmail(payload: {
  applicantEmail: string;
  applicantName: string;
  applicationType: "guide" | "agency" | "dmc" | "transport";
  locale?: string | null;
  reason?: string | null;
}): Promise<SendResult> {
  const roleLabel = normaliseRole(payload.applicationType);
  const greeting = `Hi ${payload.applicantName},`;

  const subject = `Update on your ${roleLabel} verification`;
  const reasonText = payload.reason ? `\n\nReason: ${payload.reason}` : "";

  const text = [
    greeting,
    "",
    `Thank you for submitting your credentials for ${roleLabel} verification.`,
    "",
    `After careful review, we are unable to approve your verification at this time.${reasonText}`,
    "",
    "If you believe this was a mistake or have questions, please contact our support team. You may also resubmit with updated documentation.",
    "",
    "Best regards,",
    "The Guide Validator Team",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Thank you for submitting your credentials for ${roleLabel} verification.</p>
    <p>After careful review, we are unable to approve your verification at this time.${payload.reason ? `<br/><br/><strong>Reason:</strong> ${payload.reason}` : ""}</p>
    <p>If you believe this was a mistake or have questions, please contact our support team. You may also resubmit with updated documentation.</p>
    <p>Best regards,<br/>The Guide Validator Team</p>
  `;

  return sendEmail({ to: payload.applicantEmail, subject, html, text });
}


/**
 * Send email notification when a review is submitted (pending moderation)
 */
export async function sendReviewSubmittedEmail(payload: {
  revieweeEmail: string;
  revieweeName: string;
  reviewerName: string;
  overallRating: number;
  locale?: string;
}): Promise<SendResult> {
  const { revieweeEmail, revieweeName, reviewerName, overallRating, locale = "en" } = payload;

  if (!revieweeEmail) {
    return { ok: false, error: "missing-email" };
  }

  const subject = `New Review Submitted - Pending Approval`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .rating { font-size: 24px; color: #F59E0B; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Review Received</h1>
        </div>
        <div class="content">
          <p>Hi ${normaliseName(revieweeName)},</p>
          <p><strong>${reviewerName}</strong> has submitted a review for your profile.</p>
          <div class="rating">
            Rating: ${"★".repeat(overallRating)}${"☆".repeat(5 - overallRating)} (${overallRating}/5)
          </div>
          <p>The review is currently pending approval by our moderation team.</p>
          <a href="${APP_URL}/${locale}/dashboard" class="button">View Dashboard</a>
          <div class="footer">${buildFooter()}</div>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${normaliseName(revieweeName)},
${reviewerName} has submitted a review for your profile.
Rating: ${overallRating}/5 stars
The review is currently pending approval by our moderation team.
View your dashboard: ${APP_URL}/${locale}/dashboard
${buildFooter()}`;

  return sendEmail({ to: revieweeEmail, subject, html, text });
}

export async function sendReviewApprovedEmail(payload: {
  revieweeEmail: string;
  revieweeName: string;
  reviewerName: string;
  overallRating: number;
  title: string;
  locale?: string;
}): Promise<SendResult> {
  const { revieweeEmail, revieweeName, reviewerName, overallRating, title, locale = "en" } = payload;
  if (!revieweeEmail) return { ok: false, error: "missing-email" };
  const subject = "Your Review Has Been Published";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background-color:#10B981;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background-color:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.rating{font-size:24px;color:#F59E0B;margin:15px 0}</style></head><body><div class="header"><h1>✓ Review Published</h1></div><div class="content"><p>Hi ${normaliseName(revieweeName)},</p><p>The review from <strong>${reviewerName}</strong> is now visible on your profile.</p><div class="rating">${"★".repeat(overallRating)}${"☆".repeat(5-overallRating)} (${overallRating}/5)</div><p><strong>"${title}"</strong></p></div></body></html>`;
  const text = `Hi ${normaliseName(revieweeName)},\nThe review from ${reviewerName} is now visible.\nRating: ${overallRating}/5\nTitle: "${title}"\n${buildFooter()}`;
  return sendEmail({ to: revieweeEmail, subject, html, text });
}

export async function sendReviewRejectedEmail(payload: {
  reviewerEmail: string;
  reviewerName: string;
  revieweeName: string;
  reason?: string;
  locale?: string;
}): Promise<SendResult> {
  const { reviewerEmail, reviewerName, revieweeName, reason, locale = "en" } = payload;
  if (!reviewerEmail) return { ok: false, error: "missing-email" };
  const subject = "Review Not Approved";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background-color:#EF4444;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background-color:#f9fafb;padding:30px;border-radius:0 0 8px 8px}</style></head><body><div class="header"><h1>Review Not Approved</h1></div><div class="content"><p>Hi ${normaliseName(reviewerName)},</p><p>Your review for <strong>${revieweeName}</strong> was not approved.</p>${reason ? `<p>Reason: ${reason}</p>` : ""}</div></body></html>`;
  const text = `Hi ${normaliseName(reviewerName)},\nYour review for ${revieweeName} was not approved.\n${reason ? `Reason: ${reason}\n` : ""}${buildFooter()}`;
  return sendEmail({ to: reviewerEmail, subject, html, text });
}

/**
 * Send email notification when a hold is requested on availability
 */
export async function sendHoldRequestedEmail(payload: {
  holdeeEmail: string;
  holdeeName: string;
  requesterName: string;
  startDate: string;
  endDate: string;
  requestMessage?: string;
  expiresAt: string;
  holdId: string;
  locale?: string;
}): Promise<SendResult> {
  const { holdeeEmail, holdeeName, requesterName, startDate, endDate, requestMessage, expiresAt, holdId, locale = "en" } = payload;

  if (!holdeeEmail) {
    return { ok: false, error: "missing-email" };
  }

  const subject = `New Availability Hold Request from ${requesterName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background-color: white; padding: 15px; border-left: 4px solid #3B82F6; margin: 15px 0; }
          .message-box { background-color: #EFF6FF; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .button { display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
          .button-secondary { background-color: #6B7280; }
          .warning { color: #DC2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Availability Hold Request</h1>
        </div>
        <div class="content">
          <p>Hi ${normaliseName(holdeeName)},</p>
          <p><strong>${requesterName}</strong> has requested to hold your availability for the following dates:</p>

          <div class="info-box">
            <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
            <p class="warning"><strong>Expires:</strong> ${new Date(expiresAt).toLocaleString()}</p>
          </div>

          ${requestMessage ? `
          <div class="message-box">
            <p><strong>Message from ${requesterName}:</strong></p>
            <p>${requestMessage}</p>
          </div>
          ` : ""}

          <p>This hold will expire automatically in 48 hours if not responded to.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/account/availability?holdId=${holdId}" class="button">Review & Respond</a>
          </div>

          <p style="font-size: 12px; color: #6B7280;">
            You can accept or decline this hold request from your availability calendar.
          </p>

          ${buildFooter()}
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${normaliseName(holdeeName)},

${requesterName} has requested to hold your availability for the following dates:

Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${new Date(endDate).toLocaleDateString()}
Expires: ${new Date(expiresAt).toLocaleString()}

${requestMessage ? `Message from ${requesterName}:\n${requestMessage}\n\n` : ""}

This hold will expire automatically in 48 hours if not responded to.

Review and respond: ${APP_URL}/account/availability?holdId=${holdId}

${buildFooter()}
  `.trim();

  return sendEmail({ to: holdeeEmail, subject, html, text });
}

/**
 * Send email notification when a hold is accepted
 */
export async function sendHoldAcceptedEmail(payload: {
  requesterEmail: string;
  requesterName: string;
  holdeeName: string;
  startDate: string;
  endDate: string;
  responseMessage?: string;
  locale?: string;
}): Promise<SendResult> {
  const { requesterEmail, requesterName, holdeeName, startDate, endDate, responseMessage, locale = "en" } = payload;

  if (!requesterEmail) {
    return { ok: false, error: "missing-email" };
  }

  const subject = `Hold Accepted by ${holdeeName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background-color: white; padding: 15px; border-left: 4px solid #10B981; margin: 15px 0; }
          .message-box { background-color: #D1FAE5; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✓ Hold Accepted</h1>
        </div>
        <div class="content">
          <p>Hi ${normaliseName(requesterName)},</p>
          <p>Great news! <strong>${holdeeName}</strong> has accepted your availability hold request.</p>

          <div class="info-box">
            <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          </div>

          ${responseMessage ? `
          <div class="message-box">
            <p><strong>Message from ${holdeeName}:</strong></p>
            <p>${responseMessage}</p>
          </div>
          ` : ""}

          <p>You can now proceed with your booking plans for these dates.</p>

          ${buildFooter()}
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${normaliseName(requesterName)},

Great news! ${holdeeName} has accepted your availability hold request.

Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${new Date(endDate).toLocaleDateString()}

${responseMessage ? `Message from ${holdeeName}:\n${responseMessage}\n\n` : ""}

You can now proceed with your booking plans for these dates.

${buildFooter()}
  `.trim();

  return sendEmail({ to: requesterEmail, subject, html, text });
}

/**
 * Send email notification when a hold is declined
 */
export async function sendHoldDeclinedEmail(payload: {
  requesterEmail: string;
  requesterName: string;
  holdeeName: string;
  startDate: string;
  endDate: string;
  responseMessage?: string;
  locale?: string;
}): Promise<SendResult> {
  const { requesterEmail, requesterName, holdeeName, startDate, endDate, responseMessage, locale = "en" } = payload;

  if (!requesterEmail) {
    return { ok: false, error: "missing-email" };
  }

  const subject = `Hold Declined by ${holdeeName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background-color: white; padding: 15px; border-left: 4px solid #EF4444; margin: 15px 0; }
          .message-box { background-color: #FEE2E2; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Hold Declined</h1>
        </div>
        <div class="content">
          <p>Hi ${normaliseName(requesterName)},</p>
          <p><strong>${holdeeName}</strong> has declined your availability hold request.</p>

          <div class="info-box">
            <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          </div>

          ${responseMessage ? `
          <div class="message-box">
            <p><strong>Message from ${holdeeName}:</strong></p>
            <p>${responseMessage}</p>
          </div>
          ` : ""}

          <p>You may want to consider alternative dates or reach out to ${holdeeName} directly.</p>

          ${buildFooter()}
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${normaliseName(requesterName)},

${holdeeName} has declined your availability hold request.

Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${new Date(endDate).toLocaleDateString()}

${responseMessage ? `Message from ${holdeeName}:\n${responseMessage}\n\n` : ""}

You may want to consider alternative dates or reach out to ${holdeeName} directly.

${buildFooter()}
  `.trim();

  return sendEmail({ to: requesterEmail, subject, html, text });
}
