"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActivateProfileFormProps = {
  locale: string;
};

export function ActivateProfileForm({ locale }: ActivateProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"lookup" | "confirm">("lookup");

  // Step 1: License lookup
  const [licenseNumber, setLicenseNumber] = useState("");

  // Step 2: Profile confirmation
  const [guideName, setGuideName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/lookup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find profile");
      }

      setGuideName(data.guideName);
      setStep("confirm");
    } catch (err) {
      console.error("Profile lookup error:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const response = await fetch("/api/auth/activate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseNumber,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate profile");
      }

      // Redirect to profile completion
      router.push(`/${locale}/onboarding/complete-profile?claimed=true`);
    } catch (err) {
      console.error("Profile activation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (step === "lookup") {
    return (
      <form onSubmit={handleLookup} className="space-y-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">
            License Number <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Enter your tour guide license number"
            className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            required
          />
          <p className="mt-2 text-xs text-foreground/50">
            Enter the license number exactly as it appears on your official tour guide license
          </p>
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
          {loading ? "Looking up profile..." : "Find My Profile"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleActivate} className="space-y-6">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm font-medium text-green-900 mb-1">Profile Found!</p>
        <p className="text-sm text-green-700">
          We found a profile for: <strong>{guideName}</strong>
        </p>
        <p className="text-xs text-green-600 mt-2">
          If this is you, create your account below to claim this profile.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Create Your Account</h3>

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
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setStep("lookup");
            setError(null);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setAgreedToTerms(false);
          }}
          disabled={loading}
          className="px-6 py-3 border border-foreground/20 text-foreground font-semibold rounded-lg hover:bg-foreground/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Activating Profile..." : "Activate Profile & Create Account"}
        </button>
      </div>
    </form>
  );
}
