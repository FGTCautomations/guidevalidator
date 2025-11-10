export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale, defaultLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BulkUploadForm } from "@/components/admin/bulk-upload-form";

export default async function BulkUploadPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${defaultLocale}/auth/sign-in`);
  }

  const locale = requestedLocale as SupportedLocale;

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect(`/${locale}/account/profile`);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Bulk Upload Profiles
        </h1>
        <p className="text-sm text-foreground/70 sm:text-base">
          Upload multiple profiles at once using an Excel template. You can bulk upload guides,
          agencies, DMCs, and transport companies in a single file.
        </p>
      </header>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All uploaded profiles will be created with "approved" status</li>
              <li>Email addresses must be unique across the entire system</li>
              <li>Passwords must be at least 8 characters long</li>
              <li>Invalid rows will be skipped with error details provided</li>
              <li>The upload process cannot be undone - review your data carefully</li>
            </ul>
          </div>
        </div>
      </div>

      <BulkUploadForm />
    </div>
  );
}
