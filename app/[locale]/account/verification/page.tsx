import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchGuideVerificationState } from "@/lib/profile/queries";

const toneClasses: Record<VerificationTone, string> = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
  muted: "text-foreground/60",
};

const alertClasses: Record<"success" | "warning" | "error", string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

type VerificationTone = "success" | "warning" | "danger" | "muted";

type StatusKey = "not_started" | "pending" | "approved" | "expired" | "rejected";

type StatusResolution = {
  key: StatusKey;
  tone: VerificationTone;
  date?: string | null;
};

function formatDate(value: string | Date | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function determineStatus(
  credential: Awaited<ReturnType<typeof fetchGuideVerificationState>>,
  licenseVerified: boolean,
  locale: string
): StatusResolution {
  if (!credential) {
    if (licenseVerified) {
      return { key: "approved", tone: "success", date: null };
    }
    return { key: "not_started", tone: "muted" };
  }

  const status = credential.status as StatusKey | string;
  const expiresAt = credential.expiresAt ? new Date(credential.expiresAt) : null;
  const reviewedAt = credential.reviewedAt ? new Date(credential.reviewedAt) : null;

  switch (status) {
    case "approved": {
      if (expiresAt && expiresAt.getTime() < Date.now()) {
        return { key: "expired", tone: "danger", date: formatDate(expiresAt, locale) };
      }
      return { key: "approved", tone: "success", date: formatDate(expiresAt, locale) };
    }
    case "expired": {
      return { key: "expired", tone: "danger", date: formatDate(expiresAt, locale) };
    }
    case "rejected": {
      return {
        key: "rejected",
        tone: "danger",
        date: formatDate(reviewedAt ?? (credential.createdAt ? new Date(credential.createdAt) : null), locale),
      };
    }
    case "pending":
    default: {
      const submitted = credential.createdAt ? formatDate(credential.createdAt, locale) : null;
      return { key: "pending", tone: "warning", date: submitted };
    }
  }
}

type AccountVerificationPageProps = {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AccountVerificationPage({ params, searchParams }: AccountVerificationPageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "account.verification" });

  const checkoutParamRaw = searchParams?.checkout;
  const checkoutParam = Array.isArray(checkoutParamRaw) ? checkoutParamRaw[0] : checkoutParamRaw;
  let checkoutAlert: { tone: "success" | "warning" | "error"; message: string } | null = null;

  if (checkoutParam === "success") {
    checkoutAlert = { tone: "success", message: t("alerts.success") };
  } else if (checkoutParam === "cancel") {
    checkoutAlert = { tone: "warning", message: t("alerts.cancel") };
  } else if (checkoutParam === "error") {
    checkoutAlert = { tone: "error", message: t("alerts.error") };
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("role, license_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load profile for verification", profileError);
  }

  if (!profileRow) {
    notFound();
  }

  if (profileRow.role !== "guide") {
    redirect(`/${locale}/account/billing`);
  }

  const verificationState = await fetchGuideVerificationState(user.id);
  const status = determineStatus(verificationState, profileRow.license_verified ?? false, locale);

  const statusTitle = t(`status.states.${status.key}.title`);
  const statusDescription = t(`status.states.${status.key}.description`, { date: status.date ?? "" });

  const steps = [
    t("steps.checkStatus"),
    t("steps.uploadDocs"),
    t("steps.support"),
  ];

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
        </header>

        {checkoutAlert ? (
          <div className={`rounded-[var(--radius-xl)] border px-4 py-3 text-sm shadow-sm ${alertClasses[checkoutAlert.tone]}`}>
            {checkoutAlert.message}
          </div>
        ) : null}

        <section className="space-y-6 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t("status.heading")}</h2>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{statusTitle}</p>
              <p className={`text-sm ${toneClasses[status.tone]}`}>{statusDescription}</p>
            </div>
          </div>

          <div className="space-y-1 text-sm text-foreground/70">
            <p>{t("body")}</p>
          </div>

          <ul className="list-disc space-y-2 rounded-[var(--radius-lg)] bg-foreground/5 px-5 py-4 text-sm text-foreground/80">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 text-sm text-foreground/70 sm:flex-row sm:items-center sm:justify-between">
            <p>{t("status.actions.prompt")}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/account/billing`}
                className="inline-flex items-center justify-center rounded-full border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
              >
                {t("status.actions.manageBilling")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
