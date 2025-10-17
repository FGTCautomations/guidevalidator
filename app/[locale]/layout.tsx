import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CookieBanner } from "@/components/gdpr/cookie-banner";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupportedLocale, locales, type SupportedLocale } from "@/i18n/config";

export const runtime = "nodejs";

type LocaleLayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<LocaleLayoutProps>) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  setRequestLocale(locale);

  const supabase = getSupabaseServerClient();

  const [sessionResult, messages, navTranslations, footerTranslations] = await Promise.all([
    supabase.auth.getSession(),
    getMessages(),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "footer" }),
  ]);

  const authUser = sessionResult.data.session?.user ?? null;
  let profileRole: string | null = null;

  if (authUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();
    profileRole = profile?.role ?? null;
  }

  const userEmail = authUser?.email ?? null;
  const localePrefix = `/${locale}`;

  const navItems = [
    { label: navTranslations("home"), href: localePrefix },
    { label: navTranslations("directory"), href: `${localePrefix}/directory` },
    { label: navTranslations("pricing"), href: `${localePrefix}/pricing` },
    { label: navTranslations("jobs"), href: `${localePrefix}/jobs` },
    { label: navTranslations("contact"), href: `${localePrefix}/contact` },
  ];

  // Add calendar and booking links based on user role
  if (profileRole && ["guide", "transport"].includes(profileRole)) {
    navItems.push({ label: "Calendar", href: `${localePrefix}/account/availability` });
  }

  if (profileRole && ["agency", "dmc"].includes(profileRole)) {
    navItems.push({ label: "Availability", href: `${localePrefix}/availability` });
    navItems.push({ label: "Bookings", href: `${localePrefix}/bookings` });
  }

  if (profileRole && ["admin", "super_admin"].includes(profileRole)) {
    navItems.push({ label: navTranslations("admin"), href: `${localePrefix}/admin` });
  }

  const footerLinks = [
    { label: footerTranslations("links.privacy"), href: `${localePrefix}/legal/privacy` },
    { label: footerTranslations("links.terms"), href: `${localePrefix}/legal/terms` },
    { label: "Privacy & Data", href: `${localePrefix}/account/privacy` },
    { label: "Data Processing Agreement", href: `${localePrefix}/legal/dpa` },
    { label: footerTranslations("links.support"), href: `${localePrefix}/support` },
  ];

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader
          navItems={navItems}
          ctaLabel={navTranslations("signup")}
          ctaHref={`${localePrefix}/auth/sign-up`}
          signinLabel={navTranslations("signin")}
          signinHref={`${localePrefix}/auth/sign-in`}
          signOutLabel={navTranslations("signout")}
          userEmail={userEmail}
          locale={locale}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter
          description={footerTranslations("tagline")}
          links={footerLinks}
          cta={{
            title: footerTranslations("cta.title"),
            body: footerTranslations("cta.body"),
            actionLabel: footerTranslations("cta.action"),
            actionHref: `${localePrefix}/contact`,
          }}
        />
        <CookieBanner locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
