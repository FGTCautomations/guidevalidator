"use client";

import { useFormState } from "react-dom";
import { AuthCard, AuthCardFooterLink } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import type { SignUpState } from "@/app/[locale]/auth/sign-up/actions";
import { signUpAction } from "@/app/[locale]/auth/sign-up/actions";

const SIGN_UP_DEFAULT_STATE: SignUpState = { status: "idle" };

export type SignUpFormProps = {
  locale: string;
  strings: {
    title: string;
    description: string;
    firstNameLabel: string;
    lastNameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    submit: string;
    alreadyHaveAccount: string;
    signIn: string;
    terms: string;
    termsLink: string;
    privacyLink: string;
    error: string;
  };
};

export function SignUpForm({ locale, strings }: SignUpFormProps) {
  const [state, formAction] = useFormState<SignUpState, FormData>(signUpAction, SIGN_UP_DEFAULT_STATE);

  return (
    <AuthCard
      title={strings.title}
      description={strings.description}
      footer={
        <div className="space-y-2">
          <span>
            {strings.alreadyHaveAccount}{" "}
            <AuthCardFooterLink href={`/${locale}/auth/sign-in`}>{strings.signIn}</AuthCardFooterLink>
          </span>
          <p className="text-xs text-foreground/60">
            {strings.terms}{" "}
            <AuthCardFooterLink href={`/${locale}/legal/terms`}>
              {strings.termsLink}
            </AuthCardFooterLink>{" "}
            &
            <AuthCardFooterLink href={`/${locale}/legal/privacy`}>
              {strings.privacyLink}
            </AuthCardFooterLink>
          </p>
        </div>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="firstName" label={strings.firstNameLabel} autoComplete="given-name" />
          <FormField name="lastName" label={strings.lastNameLabel} autoComplete="family-name" />
        </div>
        <FormField
          name="email"
          type="email"
          label={strings.emailLabel}
          required
          autoComplete="email"
        />
        <FormField
          name="password"
          type="password"
          label={strings.passwordLabel}
          required
          autoComplete="new-password"
        />
        <FormField
          name="confirmPassword"
          type="password"
          label={strings.confirmPasswordLabel}
          required
          autoComplete="new-password"
        />
        {state.status === "error" ? (
          <p className="rounded-xl bg-red-100/70 px-3 py-2 text-sm text-red-700">
            {state.message ?? strings.error}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
        >
          {strings.submit}
        </button>
      </form>
    </AuthCard>
  );
}
