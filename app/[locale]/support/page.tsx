export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Route } from "next";

type PageProps = {
  params: { locale: string };
};

export default async function SupportPage({ params }: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations("support");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Support Center
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">How Can We Help You?</h2>
              <p className="mb-4 text-gray-700">
                Welcome to the Guide Validator Support Center. We're here to help you get the most out of our platform.
                Browse our frequently asked questions or contact us directly for assistance.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Frequently Asked Questions</h2>

              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">How do I create an account?</h3>
                  <p className="text-gray-700">
                    Click on the "Sign Up" button in the top right corner of the page. Choose your account type
                    (Guide, Agency, DMC, or Transport) and follow the registration steps. You'll need to provide
                    basic information and verify your email address.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">How do I get verified?</h3>
                  <p className="text-gray-700">
                    After creating your account, navigate to your profile and complete all required information.
                    Then, go to the verification section and submit the required documents (ID, certifications,
                    licenses). Our team will review your submission within 2-3 business days.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">How does the booking system work?</h3>
                  <p className="text-gray-700">
                    Agencies and DMCs can browse verified guides and check their availability. When you find a
                    suitable guide, you can request a booking. The guide will receive a notification and can
                    accept or decline based on their schedule.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">What payment methods do you accept?</h3>
                  <p className="text-gray-700">
                    We accept major credit cards (Visa, Mastercard, American Express) and bank transfers.
                    Payment processing is handled securely through our payment partner. For enterprise customers,
                    we also offer invoice-based billing.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Can I cancel or modify my subscription?</h3>
                  <p className="text-gray-700">
                    Yes, you can cancel or modify your subscription at any time from your account settings.
                    If you cancel, you'll retain access until the end of your current billing period.
                    Refunds are provided on a prorated basis according to our refund policy.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">How do I report a problem or issue?</h3>
                  <p className="text-gray-700">
                    You can contact our support team using the contact form below, or email us directly at{" "}
                    <a href="mailto:support@guidevalidator.com" className="text-blue-600 hover:text-blue-700">
                      support@guidevalidator.com
                    </a>
                    . For urgent issues, please mark your message as "Urgent" in the subject line.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Contact Support</h2>
              <p className="mb-4 text-gray-700">
                Can't find the answer you're looking for? Reach out to our support team, and we'll get back to you
                as soon as possible.
              </p>

              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Email Support</h3>
                  <p className="text-gray-700">
                    <a href="mailto:support@guidevalidator.com" className="text-blue-600 hover:text-blue-700">
                      support@guidevalidator.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-600">We typically respond within 24 hours</p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Contact Form</h3>
                  <Link
                    href={`/${locale}/contact` as Route}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Go to Contact Page
                  </Link>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Business Hours</h3>
                  <p className="text-gray-700">Monday - Friday: 9:00 AM - 6:00 PM (UTC)</p>
                  <p className="text-gray-700">Saturday - Sunday: Closed</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Additional Resources</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href={`/${locale}/legal/privacy` as Route}
                  className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">Privacy Policy</h3>
                  <p className="text-sm text-gray-700">
                    Learn how we protect and manage your personal data
                  </p>
                </Link>

                <Link
                  href={`/${locale}/legal/terms` as Route}
                  className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">Terms of Service</h3>
                  <p className="text-sm text-gray-700">
                    Review our terms and conditions for using the platform
                  </p>
                </Link>

                <Link
                  href={`/${locale}/legal/dpa` as Route}
                  className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">Data Processing Agreement</h3>
                  <p className="text-sm text-gray-700">
                    GDPR-compliant data processing terms
                  </p>
                </Link>

                <Link
                  href={`/${locale}/pricing` as Route}
                  className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">Pricing</h3>
                  <p className="text-sm text-gray-700">
                    View our subscription plans and pricing options
                  </p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
