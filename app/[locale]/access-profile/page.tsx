export const dynamic = "force-dynamic";

import type { SupportedLocale } from "@/i18n/config";
import { AccessProfileForm } from "@/components/auth/access-profile-form";

type PageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export default async function AccessProfilePage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="max-w-2xl w-full">
        <div className="bg-background rounded-2xl shadow-xl border border-foreground/10 overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-8 text-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">
                  Access Your Guide Profile
                </h1>
                <p className="text-white/90 text-lg">
                  If you're a licensed guide and your profile exists in our system, enter your details below to gain access.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-primary/5 border-b border-foreground/10 px-8 py-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Once you have access, you'll be able to:
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground/70">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Update your profile information
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Add photos and showcase your expertise
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Receive booking requests from agencies
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Manage your availability and rates
              </li>
            </ul>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <AccessProfileForm locale={locale} />
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-foreground/60">
            Don't have a profile yet?{" "}
            <a href={`/${locale}/application/guide`} className="text-primary hover:underline font-medium">
              Apply to become a guide
            </a>
          </p>
          <p className="text-sm text-foreground/60">
            Already have an account?{" "}
            <a href={`/${locale}/auth/sign-in`} className="text-primary hover:underline font-medium">
              Sign in here
            </a>
          </p>
          <p className="text-sm text-foreground/60 mt-4">
            Need help?{" "}
            <a href={`/${locale}/contact`} className="text-primary hover:underline font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
