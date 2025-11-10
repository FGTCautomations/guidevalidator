export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { ScrollToTop } from "@/components/scroll-to-top";

type ThanksPageProps = {
  params: { locale: string };
  searchParams?: { role?: string };
};

function getRoleCopy(role?: string) {
  switch (role) {
    case 'guide':
      return {
        title: 'Guide application received',
        body: 'Our verification team will review your credentials and reach out if we need anything else. You will be notified as soon as your profile is ready.',
      };
    case 'agency':
      return {
        title: 'Travel agency application submitted',
        body: 'Thank you for applying! Your application is now under review by our team. We will verify your business registration, licensing documents, and credentials. You will receive an email notification once your account has been approved and activated. This typically takes 1-3 business days.',
      };
    case 'dmc':
      return {
        title: 'DMC application submitted',
        body: 'Your destination management credentials are on their way to our review team. Expect an update shortly.',
      };
    case 'transport':
      return {
        title: 'Transport provider application submitted',
        body: 'We are reviewing your fleet and licensing information. We will confirm your onboarding status by email.',
      };
    default:
      return {
        title: 'Application received',
        body: 'Thank you for your submission. We will review the details and get back to you soon.',
      };
  }
}

export default function SignUpThanksPage({ params, searchParams }: ThanksPageProps) {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const { title, body } = getRoleCopy(searchParams?.role);

  return (
    <>
      <ScrollToTop />
      <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center bg-background px-6 py-16 text-foreground sm:px-12 lg:px-24">
        <div className="w-full max-w-xl space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-base text-foreground/70 sm:text-lg">{body}</p>
        </div>
        <div className="space-y-3">
          <Link
            href={`/${locale}/auth/sign-in`}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-lg"
          >
            Go to sign in
          </Link>
          <p className="text-sm text-foreground/60">
            Need assistance? <a href="mailto:hello@guidevalidator.com" className="text-primary underline">Contact support</a>
          </p>
        </div>
        </div>
      </div>
    </>
  );
}
