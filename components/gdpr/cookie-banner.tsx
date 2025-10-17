"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface ConsentPreferences {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieBannerProps {
  locale?: string;
}

export function CookieBanner({ locale = "en" }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    functional: true, // Always required
    analytics: false,
    marketing: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Check if user has already set preferences
    const checkConsent = async () => {
      const consentGiven = localStorage.getItem("cookie_consent_given");

      if (!consentGiven) {
        setIsVisible(true);
        return;
      }

      // Load saved preferences
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: consents } = await supabase
          .from("user_consents")
          .select("consent_type, granted")
          .eq("user_id", user.id);

        if (consents && consents.length > 0) {
          const prefs: ConsentPreferences = {
            functional: true,
            analytics: false,
            marketing: false,
          };

          consents.forEach((consent) => {
            if (consent.consent_type in prefs) {
              prefs[consent.consent_type as keyof ConsentPreferences] = consent.granted;
            }
          });

          setPreferences(prefs);
          applyConsents(prefs);
        }
      }
    };

    checkConsent();
  }, []);

  const applyConsents = (prefs: ConsentPreferences) => {
    // Apply analytics consent
    if (prefs.analytics) {
      // Enable analytics (e.g., Google Analytics)
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "granted",
        });
      }
    } else {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
    }

    // Apply marketing consent
    if (prefs.marketing) {
      // Enable marketing cookies
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
        });
      }
    } else {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
    }
  };

  const saveConsents = async (prefs: ConsentPreferences) => {
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Save to database
        const consentsToSave = Object.entries(prefs).map(([type, granted]) => ({
          user_id: user.id,
          consent_type: type,
          granted,
          ip_address: null, // Backend should set this
          user_agent: navigator.userAgent,
        }));

        for (const consent of consentsToSave) {
          await supabase.from("user_consents").upsert(consent, {
            onConflict: "user_id,consent_type",
          });
        }
      }

      // Save to localStorage
      localStorage.setItem("cookie_consent_given", "true");
      localStorage.setItem("cookie_preferences", JSON.stringify(prefs));

      applyConsents(prefs);
      setIsVisible(false);
    } catch (error) {
      console.error("Error saving consents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptAll = () => {
    const allAccepted: ConsentPreferences = {
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsents(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly: ConsentPreferences = {
      functional: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    saveConsents(necessaryOnly);
  };

  const saveCustomPreferences = () => {
    saveConsents(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-4 sm:pb-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    Cookie Preferences
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    We use cookies to enhance your experience, analyze site traffic, and provide
                    personalized content. You can customize your preferences below.
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Options */}
            {showDetails && (
              <div className="space-y-3 border-t pt-4">
                {/* Functional Cookies */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    disabled
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900">
                      Functional Cookies (Required)
                    </label>
                    <p className="text-xs text-gray-600">
                      Essential for the website to function properly. These cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900">
                      Analytics Cookies
                    </label>
                    <p className="text-xs text-gray-600">
                      Help us understand how visitors interact with our website by collecting and
                      reporting information anonymously.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900">
                      Marketing Cookies
                    </label>
                    <p className="text-xs text-gray-600">
                      Used to track visitors across websites to display relevant advertisements
                      and measure campaign effectiveness.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {showDetails ? "Hide Details" : "Customize Settings"}
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={acceptNecessary}
                  disabled={isLoading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Necessary Only
                </button>

                {showDetails ? (
                  <button
                    onClick={saveCustomPreferences}
                    disabled={isLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Preferences"}
                  </button>
                ) : (
                  <button
                    onClick={acceptAll}
                    disabled={isLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Accept All"}
                  </button>
                )}
              </div>
            </div>

            {/* Privacy Policy Link */}
            <p className="text-xs text-gray-500">
              Learn more about how we use cookies in our{" "}
              <a
                href={`/${locale}/legal/privacy`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
