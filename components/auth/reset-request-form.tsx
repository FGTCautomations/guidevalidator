"use client";

import { AuthCard, AuthCardFooterLink } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";

export type ResetRequestFormProps = {
  locale: string;
  strings: {
    title: string;
    description: string;
    emailLabel: string;
    submit: string;
    success: string;
    backToSignIn: string;
  };
};

export function ResetRequestForm({ locale, strings }: ResetRequestFormProps) {
  return (
    <AuthCard
      title={strings.title}
      description={strings.description}
      footer={
        <AuthCardFooterLink href={`/${locale}/auth/sign-in`}>
          {strings.backToSignIn}
        </AuthCardFooterLink>
      }
    >
      <form className="space-y-4">
        <FormField name="email" type="email" label={strings.emailLabel} required autoComplete="email" disabled />
        <button
          type="submit"
          className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-60"
          disabled
        >
          {strings.submit}
        </button>
        <p className="text-xs text-foreground/60">{strings.success}</p>
      </form>
    </AuthCard>
  );
}
