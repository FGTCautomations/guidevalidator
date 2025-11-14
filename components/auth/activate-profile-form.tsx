"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";

type ActivateProfileFormProps = {
  locale: string;
};

export function ActivateProfileForm({ locale }: ActivateProfileFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"lookup" | "confirm">("lookup");
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);

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

    console.log("[ACTIVATE] Looking up license:", licenseNumber);

    try {
      const payload = { licenseNumber };
      console.log("[ACTIVATE] Sending payload:", JSON.stringify(payload));

      const response = await fetch("/api/auth/lookup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[ACTIVATE] Response status:", response.status, response.statusText);

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

    console.log("[ACTIVATE] Activating with license:", licenseNumber, "email:", email);

    try {
      const payload = {
        licenseNumber,
        email,
        password,
      };
      console.log("[ACTIVATE] Activation payload:", JSON.stringify({ ...payload, password: "[REDACTED]" }));

      const response = await fetch("/api/auth/activate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[ACTIVATE] Activation response status:", response.status, response.statusText);

      const data = await response.json();

      if (!response.ok) {
        // Check if error is about email already being registered
        if (data.error && (data.error.includes("already registered") || data.error.includes("already exists"))) {
          setShowEmailExistsModal(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to activate profile");
      }

      console.log("[ACTIVATE] Profile activated successfully, now signing in...");

      // Sign in the user with the newly created account
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (signInError) {
        console.error("[ACTIVATE] Sign-in error:", signInError);
        setError("Account created but failed to sign in. Please try signing in manually.");
        setLoading(false);
        return;
      }

      console.log("[ACTIVATE] Signed in successfully, redirecting to profile completion...");

      // Redirect to profile completion form (now includes billing plan selection)
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
          className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? "Activating Profile..." : "Activate Profile & Create Account"}
        </button>
      </div>

      {/* Email Already Exists Modal */}
      {showEmailExistsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-w-md w-full bg-background rounded-xl shadow-xl border border-foreground/10 p-6">
            <button
              onClick={() => setShowEmailExistsModal(false)}
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Email Already Registered</h3>
              </div>

              <p className="text-sm text-foreground/80 mb-4">
                An account with this email address already exists. This could mean:
              </p>

              <ul className="text-sm text-foreground/70 space-y-2 mb-6 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>You've already activated your profile with this email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Someone else registered using this email by mistake</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>You have an existing account from a previous signup</span>
                </li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-2">What should you do?</p>
                <ul className="text-sm text-blue-700 space-y-1.5">
                  <li>1. Try signing in with this email if you already have an account</li>
                  <li>2. Use a different email address to create a new account</li>
                  <li>3. Contact us if you think this is an error</li>
                </ul>
              </div>

              <div className="bg-foreground/5 rounded-lg p-4 border border-foreground/10">
                <p className="text-sm font-medium text-foreground mb-2">Need Help?</p>
                <p className="text-sm text-foreground/70 mb-3">
                  If you believe this is an error or need assistance with your account, please contact our support team:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:support@guidevalidator.com" className="text-primary hover:underline">
                      support@guidevalidator.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailExistsModal(false);
                  setEmail("");
                }}
                className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Different Email
              </button>
              <button
                onClick={() => router.push(`/${locale}/auth/sign-in`)}
                className="px-4 py-2.5 border border-foreground/20 text-foreground font-medium rounded-lg hover:bg-foreground/5 transition-colors"
              >
                Sign In Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
