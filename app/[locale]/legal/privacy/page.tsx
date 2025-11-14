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
                Guide Validator is a marketplace platform connecting licensed tour guides with travel agencies, DMCs, and transport providers.
                We are committed to protecting your privacy and handling your personal data responsibly. This Privacy Policy explains what
                information we collect, how we use it, and your rights regarding your data.
              </p>
              <p className="mb-4 text-gray-700">
                As a marketplace platform, we process data both for platform operations and to facilitate connections between service providers
                and clients. This policy covers both uses of your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Data We Collect</h2>
              <p className="mb-4 text-gray-700">We collect different types of data depending on your role on the platform:</p>

              <p className="mb-2 text-gray-700"><strong>All Users:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted), account type, registration date</li>
                <li><strong>Contact Information:</strong> Email address, phone number (optional), business address (for agencies/DMCs)</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, session data, cookies</li>
                <li><strong>Usage Data:</strong> Pages visited, searches performed, profiles viewed, time spent on platform</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Tour Guides:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li><strong>License Information:</strong> License number, card type, issuing authority, expiration date, verification status</li>
                <li><strong>Professional Profile:</strong> Bio, headline, specialties, spoken languages, years of experience, certifications</li>
                <li><strong>Business Information:</strong> Service areas, rates, currency preferences, availability, liability insurance status</li>
                <li><strong>Media:</strong> Profile photos, portfolio images, promotional materials</li>
                <li><strong>Reviews & Ratings:</strong> Feedback from agencies and clients</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Agencies, DMCs & Transport Providers:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li><strong>Business Information:</strong> Company name, business registration, location, service offerings</li>
                <li><strong>Profile Data:</strong> Company description, specializations, target markets</li>
                <li><strong>Booking History:</strong> Past connections, guide preferences, communication records</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Communication Data:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Messages sent through the platform between users</li>
                <li>Booking inquiries and responses</li>
                <li>Support correspondence with Guide Validator</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. How We Use Your Data</h2>
              <p className="mb-4 text-gray-700">We use your personal data for the following purposes:</p>

              <p className="mb-2 text-gray-700"><strong>Platform Operations:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Creating and managing your account</li>
                <li>Verifying guide licenses and credentials</li>
                <li>Displaying your profile in our marketplace directory</li>
                <li>Facilitating connections between guides and agencies/clients</li>
                <li>Processing and displaying reviews and ratings</li>
                <li>Maintaining platform security and preventing fraud</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Communications:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Sending booking notifications and messages between users</li>
                <li>Platform updates, service announcements, and policy changes</li>
                <li>Responding to support inquiries and resolving disputes</li>
                <li>Marketing communications (with your consent, opt-out available)</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Improvement & Analytics:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Analyzing platform usage to improve features and user experience</li>
                <li>Understanding search patterns and matching effectiveness</li>
                <li>Identifying and fixing technical issues</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Legal Compliance:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Complying with legal obligations and government requests</li>
                <li>Enforcing our Terms of Service and preventing misuse</li>
                <li>Protecting against fraud, abuse, and illegal activity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. Data Sharing</h2>
              <p className="mb-4 text-gray-700">
                As a marketplace platform, we share certain data to facilitate connections:
              </p>

              <p className="mb-2 text-gray-700"><strong>Public Profile Information:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Guide profiles (name, photo, bio, specialties, languages, experience) are visible to all platform visitors</li>
                <li>Agency/DMC profiles (company name, description, service areas) are publicly visible</li>
                <li>Reviews and ratings are publicly displayed on profiles</li>
                <li>License verification status (verified/unverified) is publicly indicated</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Private Information (Not Shared Publicly):</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Full license numbers (partially masked in public view)</li>
                <li>Email addresses and phone numbers</li>
                <li>Login credentials and passwords</li>
                <li>Private messages between users</li>
                <li>Booking history details</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Third-Party Service Providers:</strong></p>
              <p className="mb-4 text-gray-700">We share data with trusted service providers who assist with:</p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Cloud hosting and infrastructure (Vercel, Supabase)</li>
                <li>Email communications (Resend)</li>
                <li>Analytics and performance monitoring</li>
                <li>Security and fraud prevention</li>
              </ul>
              <p className="mb-4 text-gray-700">
                These providers are contractually bound to protect your data and may only use it to provide services to us.
              </p>

              <p className="mb-2 text-gray-700"><strong>Legal Requirements:</strong></p>
              <p className="mb-4 text-gray-700">
                We may disclose your data when required by law, court order, or government request, or to protect our rights,
                property, or the safety of users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Data Security</h2>
              <p className="mb-4 text-gray-700">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Encrypted data transmission using SSL/TLS</li>
                <li>Encrypted password storage using bcrypt hashing</li>
                <li>Secure cloud infrastructure with regular backups</li>
                <li>Access controls limiting employee access to personal data</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Monitoring for suspicious activity and unauthorized access</li>
              </ul>
              <p className="mb-4 text-gray-700">
                While we take reasonable precautions, no internet-based service is 100% secure. You are responsible for maintaining
                the security of your account credentials.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Data Retention</h2>
              <p className="mb-4 text-gray-700">
                We retain your personal data for as long as necessary to provide platform services and comply with legal obligations:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li><strong>Active Accounts:</strong> Data is retained while your account is active</li>
                <li><strong>Closed Accounts:</strong> Core profile data may be retained for 30 days to allow account recovery, then deleted</li>
                <li><strong>Reviews & Ratings:</strong> Retained indefinitely for marketplace integrity and transparency</li>
                <li><strong>Transaction Records:</strong> Retained for 7 years for legal and tax compliance</li>
                <li><strong>License Verification Records:</strong> Retained for 3 years after profile deletion for audit purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">7. Your Privacy Rights</h2>
              <p className="mb-4 text-gray-700">Depending on your location, you may have the following rights:</p>

              <p className="mb-2 text-gray-700"><strong>Access & Portability:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Request a copy of your personal data</li>
                <li>Receive your data in a structured, machine-readable format</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Correction & Deletion:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Update or correct inaccurate information in your profile</li>
                <li>Request deletion of your account and associated data</li>
                <li>Note: Reviews you've written may be anonymized rather than deleted to preserve marketplace integrity</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Restriction & Objection:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Object to processing of your data for marketing purposes</li>
                <li>Request restriction of data processing in certain circumstances</li>
              </ul>

              <p className="mb-2 text-gray-700"><strong>Withdrawal of Consent:</strong></p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Withdraw consent for optional data processing (e.g., marketing emails)</li>
                <li>Note: Some processing is necessary for platform operations and cannot be withdrawn while maintaining an account</li>
              </ul>

              <p className="mb-4 text-gray-700">
                To exercise these rights, contact us at <a href="mailto:privacy@guidevalidator.com" className="text-blue-600 hover:text-blue-700">privacy@guidevalidator.com</a>.
                We will respond within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">8. Cookies and Tracking</h2>
              <p className="mb-4 text-gray-700">
                We use cookies and similar technologies to:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li><strong>Essential Cookies:</strong> Required for platform functionality (login, session management)</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform</li>
                <li><strong>Preference Cookies:</strong> Remember your language, search filters, and display preferences</li>
              </ul>
              <p className="mb-4 text-gray-700">
                You can control cookie settings through your browser, though disabling essential cookies may limit platform functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">9. International Data Transfers</h2>
              <p className="mb-4 text-gray-700">
                Guide Validator operates globally. Your data may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place when transferring data internationally, including:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Using service providers certified under data protection frameworks</li>
                <li>Implementing standard contractual clauses</li>
                <li>Ensuring adequate data protection measures in destination countries</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">10. Children's Privacy</h2>
              <p className="mb-4 text-gray-700">
                Guide Validator is not intended for users under 18 years of age. We do not knowingly collect data from minors.
                If you believe a minor has provided data to us, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">11. Changes to This Policy</h2>
              <p className="mb-4 text-gray-700">
                We may update this Privacy Policy periodically. Material changes will be communicated via email or platform notification
                at least 30 days before taking effect. Your continued use of the platform after changes become effective constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">12. Contact Us</h2>
              <p className="mb-4 text-gray-700">
                For questions, concerns, or to exercise your privacy rights, please contact us at:{" "}
                <a href="mailto:privacy@guidevalidator.com" className="text-blue-600 hover:text-blue-700">
                  privacy@guidevalidator.com
                </a>
              </p>
              <p className="mb-4 text-gray-700">
                For data protection inquiries in specific jurisdictions, you may also contact your local data protection authority.
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
