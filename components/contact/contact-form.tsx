"use client";

import { useState } from "react";
import { submitContactFormAction } from "@/app/_actions/contact";
import type { SupportedLocale } from "@/i18n/config";

type ContactFormProps = {
  locale: SupportedLocale;
};

export function ContactForm({ locale }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await submitContactFormAction(formData);

      if (!result.ok) {
        setError(result.error || "Failed to send message");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Thank you for contacting us! We'll get back to you within 24 hours.
        </div>
      )}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2.5 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2.5 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">
          Subject *
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2.5 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
        >
          <option value="">Select a subject</option>
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="verification">Verification Questions</option>
          <option value="billing">Billing & Subscriptions</option>
          <option value="partnership">Partnership Opportunities</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={formData.message}
          onChange={handleChange}
          className="w-full resize-none rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2.5 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          placeholder="Tell us how we can help you..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[var(--radius-lg)] bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>

      <p className="text-xs text-foreground/50">
        By submitting this form, you agree to our privacy policy and terms of service.
      </p>
    </form>
  );
}