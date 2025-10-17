"use client";

import { useState } from "react";

interface LoginCredentialsInputProps {
  email: string;
  password: string;
  confirmPassword: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
}

export function LoginCredentialsInput({
  email,
  password,
  confirmPassword,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
}: LoginCredentialsInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Account Login Credentials</h3>
        <p className="text-sm text-foreground/70">
          Create your login credentials. Your account will be activated once your application is approved.
        </p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your.email@example.com"
          required
          className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-foreground/60">
          This will be your username for logging in
        </p>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Create a strong password"
            required
            minLength={8}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-2 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              <div className={`h-1 flex-1 rounded ${passwordStrength >= 1 ? "bg-red-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded ${passwordStrength >= 2 ? "bg-yellow-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded ${passwordStrength >= 3 ? "bg-green-500" : "bg-gray-200"}`} />
            </div>
            <p className="text-xs text-foreground/60">
              {passwordStrength === 1 && "Weak password"}
              {passwordStrength === 2 && "Medium strength"}
              {passwordStrength === 3 && "Strong password"}
            </p>
          </div>
        )}

        <p className="mt-1 text-xs text-foreground/60">
          Minimum 8 characters, include uppercase, lowercase, numbers and special characters
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="Re-enter your password"
            required
            className={`w-full rounded-lg border bg-white px-4 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 ${
              confirmPassword && !passwordsMatch
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : "border-foreground/20 focus:border-primary focus:ring-primary/20"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-600">
            Passwords do not match
          </p>
        )}

        {confirmPassword && passwordsMatch && (
          <p className="mt-1 text-xs text-green-600">
            ✓ Passwords match
          </p>
        )}
      </div>

      <div className="p-3 bg-white border border-blue-300 rounded text-xs text-foreground/70">
        <strong>Note:</strong> Your account will be created in pending status. Once your application is reviewed and approved by our team, you'll receive an email confirmation and your login will be activated.
      </div>
    </div>
  );
}

function getPasswordStrength(password: string): number {
  if (password.length < 8) return 0;

  let strength = 1;

  // Check for mixed case
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;

  // Check for numbers and special characters
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength++;

  return strength;
}
