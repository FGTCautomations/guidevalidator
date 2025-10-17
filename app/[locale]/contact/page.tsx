import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { ContactForm } from "@/components/contact/contact-form";

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
        </div>

        {/* Contact Info + Form Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-foreground">{t("info.title")}</h2>

              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-foreground/5 text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground">{t("info.email.label")}</h3>
                    <a
                      href="mailto:info@guidevalidator.com"
                      className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                    >
                      info@guidevalidator.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-foreground/5 text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground">{t("info.phone.label")}</h3>
                    <a
                      href="tel:+84867956573"
                      className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                    >
                      +84 (0)867956573
                    </a>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-foreground/5 text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground">{t("info.hours.label")}</h3>
                    <p className="text-sm text-foreground/70">{t("info.hours.value")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="rounded-[var(--radius-xl)] border border-foreground/10 bg-white/60 p-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("additional.title")}</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                {t("additional.description")}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm lg:p-8">
            <h2 className="mb-6 text-lg font-semibold text-foreground">{t("form.title")}</h2>
            <ContactForm locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}