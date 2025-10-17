"use server";

import { sendContactFormEmail } from "@/lib/email/resend";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function submitContactFormAction(
  data: ContactFormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      return { ok: false, error: "All fields are required" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { ok: false, error: "Invalid email address" };
    }

    // Send email notification to admin
    const emailResult = await sendContactFormEmail({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });

    if (!emailResult.ok) {
      console.error("Failed to send contact form email:", emailResult.error);
      return { ok: false, error: "Failed to send message. Please try again later." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}