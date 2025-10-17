"use client";

import { useState } from "react";
import type { SupportedLocale } from "@/i18n/config";

interface DPADocumentProps {
  locale: SupportedLocale;
}

export function DPADocument({ locale }: DPADocumentProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // In production, you would call an API to generate a proper PDF
      // For now, we'll create a simple HTML version that can be printed
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to download the DPA");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Data Processing Agreement - Guide Validator</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            h2 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
            h3 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
            p { margin-bottom: 15px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DATA PROCESSING AGREEMENT</h1>
            <p><strong>Guide Validator Platform</strong></p>
            <p>Effective Date: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>1. DEFINITIONS</h2>
            <p><strong>1.1 Controller:</strong> The individual or legal entity who determines the purposes and means of the processing of Personal Data.</p>
            <p><strong>1.2 Processor:</strong> Guide Validator, the entity that processes Personal Data on behalf of the Controller.</p>
            <p><strong>1.3 Personal Data:</strong> Any information relating to an identified or identifiable natural person.</p>
            <p><strong>1.4 Processing:</strong> Any operation performed on Personal Data, including collection, recording, storage, retrieval, use, and disclosure.</p>
            <p><strong>1.5 Data Subject:</strong> The individual to whom Personal Data relates.</p>
            <p><strong>1.6 GDPR:</strong> General Data Protection Regulation (EU) 2016/679.</p>
          </div>

          <div class="section">
            <h2>2. SCOPE AND APPLICABILITY</h2>
            <p><strong>2.1</strong> This DPA applies to the processing of Personal Data by Guide Validator as a Processor on behalf of the Controller in connection with the use of the Guide Validator platform.</p>
            <p><strong>2.2</strong> The subject matter, duration, nature, and purpose of the processing, as well as the types of Personal Data and categories of Data Subjects, are described in Annex A.</p>
          </div>

          <div class="section">
            <h2>3. PROCESSOR'S OBLIGATIONS</h2>
            <p><strong>3.1 Processing Instructions:</strong> The Processor shall process Personal Data only on documented instructions from the Controller, unless required to do so by applicable law.</p>
            <p><strong>3.2 Confidentiality:</strong> The Processor shall ensure that persons authorized to process Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.</p>
            <p><strong>3.3 Security Measures:</strong> The Processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including:
              <ul>
                <li>Encryption of Personal Data in transit and at rest</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Regular backup and disaster recovery procedures</li>
                <li>Security incident response procedures</li>
              </ul>
            </p>
          </div>

          <div class="section">
            <h2>4. SUB-PROCESSING</h2>
            <p><strong>4.1</strong> The Processor may engage sub-processors to carry out specific processing activities. Current sub-processors include:
              <ul>
                <li>Supabase (Database hosting and authentication)</li>
                <li>Vercel (Application hosting and CDN)</li>
                <li>Resend (Email delivery services)</li>
              </ul>
            </p>
            <p><strong>4.2</strong> The Processor shall inform the Controller of any intended changes concerning the addition or replacement of sub-processors, giving the Controller the opportunity to object to such changes.</p>
          </div>

          <div class="section">
            <h2>5. DATA SUBJECT RIGHTS</h2>
            <p><strong>5.1</strong> The Processor shall assist the Controller in responding to requests from Data Subjects to exercise their rights under GDPR, including:
              <ul>
                <li>Right of access</li>
                <li>Right to rectification</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restriction of processing</li>
                <li>Right to data portability</li>
                <li>Right to object</li>
              </ul>
            </p>
            <p><strong>5.2</strong> The Processor provides self-service tools for Data Subjects to exercise these rights through the platform's privacy dashboard.</p>
          </div>

          <div class="section">
            <h2>6. PERSONAL DATA BREACH</h2>
            <p><strong>6.1</strong> The Processor shall notify the Controller without undue delay after becoming aware of a Personal Data breach.</p>
            <p><strong>6.2</strong> The notification shall describe the nature of the breach, the categories and approximate number of Data Subjects and Personal Data records concerned, and the measures taken or proposed to address the breach.</p>
          </div>

          <div class="section">
            <h2>7. DATA RETENTION AND DELETION</h2>
            <p><strong>7.1</strong> The Processor shall delete or return all Personal Data to the Controller after the end of the provision of services, unless applicable law requires continued storage.</p>
            <p><strong>7.2</strong> The Processor implements a 24-month data retention policy for inactive accounts, after which accounts are archived and anonymized.</p>
          </div>

          <div class="section">
            <h2>8. AUDIT AND COMPLIANCE</h2>
            <p><strong>8.1</strong> The Processor shall make available to the Controller all information necessary to demonstrate compliance with this DPA and allow for and contribute to audits conducted by the Controller or an auditor mandated by the Controller.</p>
            <p><strong>8.2</strong> The Processor maintains audit logs of all data processing activities for compliance verification.</p>
          </div>

          <div class="section">
            <h2>9. INTERNATIONAL DATA TRANSFERS</h2>
            <p><strong>9.1</strong> The Processor shall only transfer Personal Data outside the European Economic Area (EEA) with appropriate safeguards in place, such as:
              <ul>
                <li>Standard Contractual Clauses approved by the European Commission</li>
                <li>Binding Corporate Rules</li>
                <li>Adequacy decisions by the European Commission</li>
              </ul>
            </p>
          </div>

          <div class="section">
            <h2>ANNEX A: DETAILS OF PROCESSING</h2>
            <h3>Subject Matter</h3>
            <p>Processing of Personal Data necessary for the operation of the Guide Validator platform, including user registration, profile management, booking services, and communications.</p>

            <h3>Duration</h3>
            <p>The duration of the processing is for the term of the service agreement between the Controller and Processor.</p>

            <h3>Nature and Purpose</h3>
            <p>The processing involves the collection, storage, and management of Personal Data for the purpose of:
              <ul>
                <li>User authentication and account management</li>
                <li>Facilitating connections between guides, transport providers, agencies, and DMCs</li>
                <li>Processing bookings and availability requests</li>
                <li>Communication between platform users</li>
                <li>Platform analytics and improvement</li>
              </ul>
            </p>

            <h3>Categories of Personal Data</h3>
            <ul>
              <li>Identity Data: name, username, email address</li>
              <li>Contact Data: email address, phone number, address</li>
              <li>Profile Data: professional information, specialties, languages, certifications</li>
              <li>Usage Data: interaction with platform features, booking history</li>
              <li>Technical Data: IP address, browser type, device information</li>
              <li>Marketing Data: preferences for receiving communications</li>
            </ul>

            <h3>Categories of Data Subjects</h3>
            <ul>
              <li>Tour guides</li>
              <li>Transport providers</li>
              <li>Travel agencies</li>
              <li>Destination Management Companies (DMCs)</li>
              <li>Platform administrators</li>
            </ul>
          </div>

          <div class="section">
            <h2>CONTACT INFORMATION</h2>
            <p><strong>Data Protection Officer:</strong><br>
            Email: dpo@guide-validator.com<br>
            Address: [Company Address]</p>
          </div>

          <div class="section" style="margin-top: 50px; border-top: 2px solid #000; padding-top: 20px;">
            <p><strong>Controller Signature:</strong> ___________________________ Date: _______________</p>
            <p><strong>Processor Representative:</strong> ___________________________ Date: _______________</p>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error("Error generating DPA:", error);
      alert("Failed to generate DPA. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3 rounded-lg bg-white p-6 shadow">
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {isGenerating ? "Generating..." : "Download / Print PDF"}
        </button>
      </div>

      {/* Preview */}
      <div className="prose max-w-none rounded-lg bg-white p-8 shadow">
        <div className="border-b-2 border-gray-900 pb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold">DATA PROCESSING AGREEMENT</h1>
          <p className="text-lg font-semibold">Guide Validator Platform</p>
          <p className="text-sm text-gray-600">
            Effective Date: {new Date().toLocaleDateString()}
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold">1. DEFINITIONS</h2>
          <p>
            <strong>1.1 Controller:</strong> The individual or legal entity who determines the
            purposes and means of the processing of Personal Data.
          </p>
          <p>
            <strong>1.2 Processor:</strong> Guide Validator, the entity that processes Personal
            Data on behalf of the Controller.
          </p>
          <p>
            <strong>1.3 Personal Data:</strong> Any information relating to an identified or
            identifiable natural person.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">2. SCOPE AND APPLICABILITY</h2>
          <p>
            This DPA applies to the processing of Personal Data by Guide Validator as a Processor
            on behalf of the Controller in connection with the use of the Guide Validator platform.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">3. PROCESSOR'S OBLIGATIONS</h2>
          <h3 className="text-lg font-semibold">3.1 Processing Instructions</h3>
          <p>
            The Processor shall process Personal Data only on documented instructions from the
            Controller.
          </p>
          <h3 className="text-lg font-semibold">3.2 Security Measures</h3>
          <ul className="list-disc pl-6">
            <li>Encryption of Personal Data in transit and at rest</li>
            <li>Regular security assessments and penetration testing</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Regular backup and disaster recovery procedures</li>
          </ul>
        </section>

        <section className="mt-8">
          <p className="text-sm text-gray-600">
            <em>Click "Download / Print PDF" above to access the complete agreement.</em>
          </p>
        </section>
      </div>
    </div>
  );
}
