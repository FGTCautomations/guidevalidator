export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { DPADocument } from "@/components/legal/dpa-document";

type PageProps = {
  params: { locale: string };
};

export default async function DPAPage({ params }: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Data Processing Agreement (DPA)
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This Data Processing Agreement governs the processing of personal data as required under GDPR.
          </p>
        </div>

        <DPADocument locale={locale} />
      </div>
    </div>
  );
}
