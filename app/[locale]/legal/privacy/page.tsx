export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: { locale: string };
};

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations("legal.privacy");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Privacy Policy
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">1. Introduction</h2>
              <p className="mb-4 text-gray-700">
                Welcome to Guide Validator. We respect your privacy and are committed to protecting your personal data.
                This privacy policy will inform you about how we look after your personal data when you visit our website
                and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Data We Collect</h2>
              <p className="mb-4 text-gray-700">We may collect, use, store and transfer different kinds of personal data about you:</p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li><strong>Identity Data:</strong> First name, last name, username or similar identifier</li>
                <li><strong>Contact Data:</strong> Email address, telephone numbers</li>
                <li><strong>Profile Data:</strong> Your interests, preferences, feedback and survey responses</li>
                <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting</li>
                <li><strong>Usage Data:</strong> Information about how you use our website and services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. How We Use Your Data</h2>
              <p className="mb-4 text-gray-700">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>To register you as a new customer</li>
                <li>To provide and manage your account</li>
                <li>To process and deliver our services</li>
                <li>To manage our relationship with you</li>
                <li>To improve our website, products/services, marketing or customer relationships</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. Data Security</h2>
              <p className="mb-4 text-gray-700">
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
                used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those
                employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Your Legal Rights</h2>
              <p className="mb-4 text-gray-700">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
                <li>Right to withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Cookies</h2>
              <p className="mb-4 text-gray-700">
                Our website uses cookies to distinguish you from other users of our website. This helps us to provide you
                with a good experience when you browse our website and also allows us to improve our site. You can set your
                browser to refuse all or some browser cookies, or to alert you when websites set or access cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">7. Third-Party Links</h2>
              <p className="mb-4 text-gray-700">
                This website may include links to third-party websites, plug-ins and applications. Clicking on those links
                or enabling those connections may allow third parties to collect or share data about you. We do not control
                these third-party websites and are not responsible for their privacy statements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">8. Contact Us</h2>
              <p className="mb-4 text-gray-700">
                If you have any questions about this privacy policy or our privacy practices, please contact us at:{" "}
                <a href="mailto:privacy@guidevalidator.com" className="text-blue-600 hover:text-blue-700">
                  privacy@guidevalidator.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <p className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
