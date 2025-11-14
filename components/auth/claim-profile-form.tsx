"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClaimProfileFormProps = {
  token: string;
  licenseNumber: string;
  guideName: string;
  locale: string;
};

export function ClaimProfileForm({ token, licenseNumber, guideName, locale }: ClaimProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All fields in one form
  const [verifiedLicenseNumber, setVerifiedLicenseNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate license number
    if (verifiedLicenseNumber.trim().toLowerCase() !== licenseNumber.trim().toLowerCase()) {
      setError("License number does not match. Please enter your correct license number.");
      return;
    }

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/claim-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          licenseNumber: verifiedLicenseNumber,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim profile");
      }

      // Redirect to profile completion
      router.push(`/${locale}/onboarding/complete-profile?claimed=true`);
    } catch (err) {
      console.error("Claim profile error:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Claim Your Profile: {guideName}
        </h2>
        <p className="text-sm text-foreground/70 mb-6">
          To claim this profile, verify your identity with your license number and create your account.
          You'll then be taken to complete your profile with all your information.
        </p>
      </div>

      {/* License Verification */}
      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">
          License Number <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={verifiedLicenseNumber}
          onChange={(e) => setVerifiedLicenseNumber(e.target.value)}
          placeholder="Enter your license number"
          className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          required
        />
        <p className="mt-2 text-xs text-foreground/50">
          Enter your license number to verify this is your profile
        </p>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-foreground/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-foreground/60">Create your account</span>
        </div>
      </div>

      {/* Account Creation */}
      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">
          Email Address <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          required
        />
        <p className="mt-2 text-xs text-foreground/50">
          This will be your login email and where you'll receive booking requests
        </p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">
          Password <span className="text-destructive">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          required
          minLength={8}
        />
        <p className="mt-2 text-xs text-foreground/50">Must be at least 8 characters</p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">
          Confirm Password <span className="text-destructive">*</span>
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          required
          minLength={8}
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-foreground/20 text-primary focus:ring-2 focus:ring-primary/30"
          required
        />
        <label htmlFor="terms" className="text-sm text-foreground/70">
          I agree to the{" "}
          <a
            href={`/${locale}/legal/terms`}
            target="_blank"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href={`/${locale}/legal/privacy`}
            target="_blank"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
        </label>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Claiming Profile..." : "Verify & Claim Profile"}
      </button>
    </form>
  );
}
