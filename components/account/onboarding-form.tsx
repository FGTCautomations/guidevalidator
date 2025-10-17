"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/app/_actions/onboarding";
import type { SupportedLocale } from "@/i18n/config";

type OnboardingFormProps = {
  locale: SupportedLocale;
  userId: string;
  role: string;
};

export function OnboardingForm({ locale, userId, role }: OnboardingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    bio: "",
    country: "",
    city: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await completeOnboardingAction(userId, formData);

      if (!result.ok) {
        setError(result.error || "Failed to complete onboarding");
        setIsSubmitting(false);
        return;
      }

      // Check if subscription is required
      if (["agency", "dmc"].includes(role)) {
        router.push(`/${locale}/account/billing`);
      } else {
        router.push(`/${locale}/account/profile`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="+1234567890"
            className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">
            Country *
          </label>
          <input
            type="text"
            id="country"
            name="country"
            required
            value={formData.country}
            onChange={handleChange}
            className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-foreground mb-2">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-[var(--radius-lg)] bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Complete Profile"}
        </button>
        {["agency", "dmc"].includes(role) && (
          <p className="text-xs text-foreground/60">
            After completing your profile, you'll be redirected to setup your subscription.
          </p>
        )}
      </div>
    </form>
  );
}