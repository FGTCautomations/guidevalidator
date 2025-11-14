export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: { locale: string };
};

export default async function TermsOfServicePage({ params }: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations("legal.terms");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Terms of Service
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">1. Agreement to Terms</h2>
              <p className="mb-4 text-gray-700">
                By accessing and using Guide Validator's marketplace platform, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. Guide Validator operates as a marketplace connecting licensed tour guides,
                travel agencies, DMCs (Destination Management Companies), and transport providers. If you do not agree with any
                of these terms, you are prohibited from using or accessing this platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Platform Services</h2>
              <p className="mb-4 text-gray-700">
                Guide Validator provides a marketplace platform that enables:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li><strong>For Tour Guides:</strong> Create professional profiles, verify licenses, showcase expertise, and connect with travel agencies, DMCs, and direct clients</li>
                <li><strong>For Travel Agencies & DMCs:</strong> Search for and connect with verified licensed tour guides, transport providers, and manage booking requests</li>
                <li><strong>For Transport Providers:</strong> List services and connect with agencies and guides for transportation needs</li>
                <li><strong>Verification Services:</strong> We verify guide licenses and credentials to ensure authenticity and professionalism</li>
              </ul>
              <p className="mb-4 text-gray-700">
                Guide Validator acts as a marketplace platform only. We facilitate connections between service providers and clients
                but are not party to the actual service agreements, bookings, or transactions made through the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. User Accounts and Registration</h2>
              <p className="mb-4 text-gray-700">
                <strong>Account Types:</strong> Guide Validator offers different account types including Guide, Agency, DMC, Transport Provider, and Admin accounts.
                When you create an account, you must:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Provide accurate, complete, and current information</li>
                <li>Select the appropriate account type for your professional role</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="mb-4 text-gray-700">
                <strong>For Tour Guides:</strong> You must provide valid licensing information and agree to verification of your credentials.
                Misrepresenting your license status or qualifications will result in immediate account termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. License Verification and Professional Standards</h2>
              <p className="mb-4 text-gray-700">
                <strong>Guide License Verification:</strong> Tour guides must provide accurate license information including license number,
                issuing authority, expiration date, and card type. We verify this information against official government databases where possible.
              </p>
              <p className="mb-4 text-gray-700">
                <strong>Professional Conduct:</strong> All service providers must:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Maintain current, valid licenses and certifications as required by law</li>
                <li>Provide services professionally and competently</li>
                <li>Honor commitments made through the platform</li>
                <li>Comply with all local, national, and international laws and regulations</li>
                <li>Maintain appropriate insurance coverage for their services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Profile Content and Marketplace Listings</h2>
              <p className="mb-4 text-gray-700">
                Service providers may create profiles containing information about their services, expertise, rates, and availability.
                You are responsible for all content in your profile and warrant that:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>All information is accurate, truthful, and not misleading</li>
                <li>You have the right to use any photos, descriptions, or materials in your profile</li>
                <li>Your content does not violate intellectual property rights or other rights of third parties</li>
                <li>Your profile complies with all applicable laws and regulations</li>
                <li>You will update your profile to reflect changes in your services, availability, or credentials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Bookings, Transactions, and Payments</h2>
              <p className="mb-4 text-gray-700">
                <strong>Nature of Platform:</strong> Guide Validator facilitates connections and communications but does not directly
                process bookings or payments. All contracts for services are between the service provider and the client.
              </p>
              <p className="mb-4 text-gray-700">
                <strong>Service Provider Obligations:</strong>
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Clearly state your rates, terms, and cancellation policies</li>
                <li>Honor confirmed bookings and agreements</li>
                <li>Communicate professionally and promptly with clients</li>
                <li>Provide services as described in your profile and agreements</li>
              </ul>
              <p className="mb-4 text-gray-700">
                <strong>Client Obligations:</strong>
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Provide accurate information about your requirements</li>
                <li>Communicate booking changes or cancellations promptly</li>
                <li>Honor payment agreements made with service providers</li>
                <li>Treat service providers with respect and professionalism</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">7. Reviews and Ratings</h2>
              <p className="mb-4 text-gray-700">
                Our platform includes a review and rating system to promote transparency and quality. When submitting reviews, you agree to:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Provide honest, accurate feedback based on your actual experience</li>
                <li>Avoid defamatory, abusive, or inappropriate language</li>
                <li>Not submit fake or fraudulent reviews</li>
                <li>Not attempt to manipulate ratings through coordinated reviews</li>
              </ul>
              <p className="mb-4 text-gray-700">
                We reserve the right to remove reviews that violate these guidelines or appear fraudulent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">8. Prohibited Uses</h2>
              <p className="mb-4 text-gray-700">You may not use the Guide Validator platform to:</p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Misrepresent your identity, credentials, licenses, or qualifications</li>
                <li>Post false, misleading, or fraudulent information</li>
                <li>Circumvent the platform to avoid fees or verification requirements</li>
                <li>Harass, abuse, threaten, or discriminate against other users</li>
                <li>Share contact information to move transactions off-platform inappropriately</li>
                <li>Scrape, copy, or harvest data from the platform without authorization</li>
                <li>Use automated systems or bots to access the platform</li>
                <li>Violate any local, national, or international laws or regulations</li>
                <li>Offer or provide unlicensed guiding services where licenses are required</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">9. Dispute Resolution</h2>
              <p className="mb-4 text-gray-700">
                <strong>Between Users:</strong> Disputes between service providers and clients should be resolved directly between the parties.
                Guide Validator may provide communication facilitation but is not responsible for resolving contractual disputes.
              </p>
              <p className="mb-4 text-gray-700">
                <strong>Mediation:</strong> If a dispute cannot be resolved, parties agree to first attempt mediation before pursuing legal action.
                Each party will bear their own costs of mediation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">10. Intellectual Property</h2>
              <p className="mb-4 text-gray-700">
                The Guide Validator platform, including its design, features, and functionality, are owned by Guide Validator and protected
                by copyright, trademark, and other intellectual property laws. User-generated content remains the property of the respective users,
                but by posting on the platform, you grant Guide Validator a non-exclusive, worldwide license to use, display, and distribute
                your content for platform operations and marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">11. Account Termination</h2>
              <p className="mb-4 text-gray-700">
                We may suspend or terminate your account immediately for:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent activity or misrepresentation</li>
                <li>License revocation or expiration (for guides)</li>
                <li>Multiple verified complaints from other users</li>
                <li>Illegal activity or violation of applicable laws</li>
              </ul>
              <p className="mb-4 text-gray-700">
                Upon termination, your public profile will be removed and you will lose access to platform features. We reserve the right
                to retain certain data as required by law or legitimate business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">12. Limitation of Liability</h2>
              <p className="mb-4 text-gray-700">
                Guide Validator is a marketplace platform that facilitates connections only. We are not responsible for:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>The quality, safety, or legality of services provided by guides, agencies, DMCs, or transport providers</li>
                <li>The accuracy of information in user profiles or listings</li>
                <li>Disputes between users regarding bookings, payments, cancellations, or service quality</li>
                <li>Personal injury, property damage, or financial loss resulting from services arranged through the platform</li>
                <li>Loss of business, profits, or opportunities arising from platform use</li>
              </ul>
              <p className="mb-4 text-gray-700">
                To the maximum extent permitted by law, Guide Validator's total liability shall not exceed the fees paid by you (if any)
                for platform services in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">13. Disclaimer of Warranties</h2>
              <p className="mb-4 text-gray-700">
                The platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We do not guarantee:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>The accuracy or completeness of license verification information</li>
                <li>Uninterrupted or error-free platform operation</li>
                <li>That service providers will fulfill their obligations</li>
                <li>The reliability or quality of services obtained through the platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">14. Indemnification</h2>
              <p className="mb-4 text-gray-700">
                You agree to indemnify and hold harmless Guide Validator from any claims, damages, losses, or expenses (including legal fees)
                arising from: (a) your use of the platform, (b) your violation of these Terms, (c) your violation of any rights of third parties,
                (d) services you provide or receive through the platform, or (e) any content you post on the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">15. Governing Law and Jurisdiction</h2>
              <p className="mb-4 text-gray-700">
                These Terms shall be governed by and construed in accordance with applicable international commerce laws and the laws of the
                jurisdictions in which Guide Validator operates. Any disputes shall be subject to the exclusive jurisdiction of the courts
                in those jurisdictions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">16. Changes to Terms</h2>
              <p className="mb-4 text-gray-700">
                We reserve the right to modify these Terms at any time. Material changes will be communicated through email or platform
                notification at least 30 days before taking effect. Continued use of the platform after changes take effect constitutes
                acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">17. Contact Information</h2>
              <p className="mb-4 text-gray-700">
                For questions, concerns, or notices regarding these Terms of Service, please contact us at:{" "}
                <a href="mailto:legal@guidevalidator.com" className="text-blue-600 hover:text-blue-700">
                  legal@guidevalidator.com
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
