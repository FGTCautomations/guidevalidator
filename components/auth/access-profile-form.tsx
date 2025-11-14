"use client";

import { useState } from "react";

type AccessProfileFormProps = {
  locale: string;
};

export function AccessProfileForm({ locale }: AccessProfileFormProps) {
  const [licenseNumber, setLicenseNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-profile-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseNumber: licenseNumber.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request access");
      }

      setSuccess(true);
    } catch (err) {
      console.error("Request access error:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Check Your Email!
        </h2>
        <p className="text-foreground/70 mb-2">
          We've sent an access token to <strong>{email}</strong>
        </p>
        <p className="text-sm text-foreground/60 mb-6">
          Please check your email and use the token to log in. The token will be your temporary password.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            Next Steps:
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Check your email inbox (and spam folder)</li>
            <li>Copy the access token from the email</li>
            <li>Go to the sign-in page and use:
              <ul className="ml-6 mt-1 text-xs space-y-1">
                <li>• Email: <strong>{email}</strong></li>
                <li>• Password: <strong>Your access token</strong></li>
              </ul>
            </li>
            <li>Update your profile with additional information</li>
          </ol>
        </div>
        <a
          href={`/${locale}/auth/sign-in`}
          className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Go to Sign In
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-foreground/70 mb-6">
          Enter your license number and email address. If your profile exists in our system, we'll send you an access token via email.
        </p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">
          License Number <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="Enter your guide license number"
          className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          required
          disabled={loading}
        />
        <p className="mt-2 text-xs text-foreground/50">
          Enter your official guide license number exactly as it appears on your license
        </p>
      </div>

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
          disabled={loading}
        />
        <p className="mt-2 text-xs text-foreground/50">
          We'll send your access token to this email address
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-900 mb-1">Important</p>
            <p className="text-xs text-yellow-800">
              The access token will be your temporary password. After signing in, you should update your profile and set a permanent password in your account settings.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Requesting Access..." : "Request Access Token"}
      </button>
    </form>
  );
}
