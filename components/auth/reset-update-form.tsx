"use client";

import { AuthCard, AuthCardFooterLink } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";

export type ResetUpdateFormProps = {
  locale: string;
  strings: {
    title: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    submit: string;
    success: string;
    backToSignIn: string;
  };
};

export function ResetUpdateForm({ locale, strings }: ResetUpdateFormProps) {
  return (
    <AuthCard
      title={strings.title}
      footer={
        <AuthCardFooterLink href={`/${locale}/auth/sign-in`}>
          {strings.backToSignIn}
        </AuthCardFooterLink>
      }
    >
      <form className="space-y-4">
        <FormField name="password" type="password" label={strings.passwordLabel} required disabled />
        <FormField name="confirmPassword" type="password" label={strings.confirmPasswordLabel} required disabled />
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
