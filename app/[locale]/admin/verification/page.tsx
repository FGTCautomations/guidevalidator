export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPendingVerifications } from "@/lib/admin/queries";
import { VerificationQueue } from "@/components/admin/verification-queue";

export const runtime = "nodejs";

export default async function AdminVerificationPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "admin.verification" });

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect(`/${locale}`);
  }

  const pendingVerifications = await fetchPendingVerifications();

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                {t("title")}
              </h1>
              <p className="text-sm text-foreground/70 sm:text-base">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {pendingVerifications.length} {t("pending")}
              </span>
            </div>
          </div>
        </header>

        <VerificationQueue
          items={pendingVerifications}
          locale={locale}
          translations={{
            noItems: t("noItems"),
            type: t("type"),
            applicant: t("applicant"),
            email: t("email"),
            submitted: t("submitted"),
            actions: t("actions"),
            viewDetails: t("viewDetails"),
            approve: t("approve"),
            reject: t("reject"),
            approving: t("approving"),
            rejecting: t("rejecting"),
            notes: t("notes"),
            notesPlaceholder: t("notesPlaceholder"),
            cancel: t("cancel"),
            confirm: t("confirm"),
            success: t("success"),
            error: t("error"),
            selfie: t("selfie"),
            license: t("license"),
            idDocument: t("idDocument"),
            logo: t("logo"),
            noImage: t("noImage"),
            guide: t("guide"),
            agency: t("agency"),
            dmc: t("dmc"),
            transport: t("transport"),
          }}
        />
      </div>
    </div>
  );
}
