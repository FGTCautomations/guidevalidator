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
                By accessing and using Guide Validator's services, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
                from using or accessing this site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Use License</h2>
              <p className="mb-4 text-gray-700">
                Permission is granted to temporarily access the materials on Guide Validator's website for personal,
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and
                under this license you may not:
              </p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on Guide Validator's website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. User Accounts</h2>
              <p className="mb-4 text-gray-700">
                When you create an account with us, you guarantee that the information you provide is accurate, complete,
                and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate
                termination of your account on the Service.
              </p>
              <p className="mb-4 text-gray-700">
                You are responsible for maintaining the confidentiality of your account and password, including but not
                limited to the restriction of access to your computer and/or account. You agree to accept responsibility
                for any and all activities or actions that occur under your account and/or password.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. User Content</h2>
              <p className="mb-4 text-gray-700">
                Our Service allows you to post, link, store, share and otherwise make available certain information, text,
                graphics, videos, or other material. You are responsible for the content that you post on or through the
                Service, including its legality, reliability, and appropriateness.
              </p>
              <p className="mb-4 text-gray-700">
                By posting content on or through the Service, you represent and warrant that: (i) the content is yours
                (you own it) and/or you have the right to use it and the right to grant us the rights and license as
                provided in these Terms, and (ii) that the posting of your content on or through the Service does not
                violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person
                or entity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Prohibited Uses</h2>
              <p className="mb-4 text-gray-700">You may not use our Service:</p>
              <ul className="mb-4 list-disc pl-6 text-gray-700">
                <li>For any unlawful purpose or to solicit others to perform or participate in any unlawful acts</li>
                <li>To violate any international, federal, provincial or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
                <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                <li>For any obscene or immoral purpose</li>
                <li>To interfere with or circumvent the security features of the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Intellectual Property</h2>
              <p className="mb-4 text-gray-700">
                The Service and its original content (excluding content provided by users), features and functionality
                are and will remain the exclusive property of Guide Validator and its licensors. The Service is protected
                by copyright, trademark, and other laws of both the United States and foreign countries.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">7. Termination</h2>
              <p className="mb-4 text-gray-700">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice
                or liability, under our sole discretion, for any reason whatsoever and without limitation, including but
                not limited to a breach of the Terms.
              </p>
              <p className="mb-4 text-gray-700">
                If you wish to terminate your account, you may simply discontinue using the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">8. Limitation of Liability</h2>
              <p className="mb-4 text-gray-700">
                In no event shall Guide Validator, nor its directors, employees, partners, agents, suppliers, or affiliates,
                be liable for any indirect, incidental, special, consequential or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access
                to or use of or inability to access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">9. Disclaimer</h2>
              <p className="mb-4 text-gray-700">
                Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE"
                basis. The Service is provided without warranties of any kind, whether express or implied, including, but
                not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement
                or course of performance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">10. Governing Law</h2>
              <p className="mb-4 text-gray-700">
                These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which
                Guide Validator operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">11. Changes to Terms</h2>
              <p className="mb-4 text-gray-700">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision
                is material we will provide at least 30 days notice prior to any new terms taking effect. What constitutes
                a material change will be determined at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">12. Contact Us</h2>
              <p className="mb-4 text-gray-700">
                If you have any questions about these Terms, please contact us at:{" "}
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
