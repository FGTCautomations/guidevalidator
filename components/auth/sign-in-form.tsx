"use client";

import { useFormState } from "react-dom";
import { AuthCard, AuthCardFooterLink } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import type { SignInState } from "@/app/[locale]/auth/sign-in/state";
import { SIGN_IN_DEFAULT_STATE } from "@/app/[locale]/auth/sign-in/state";
import { signInAction } from "@/app/[locale]/auth/sign-in/actions";

export type SignInFormProps = {
  locale: string;
  strings: {
    title: string;
    description: string;
    emailLabel: string;
    passwordLabel: string;
    rememberMe: string;
    forgotPassword: string;
    submit: string;
    noAccount: string;
    createAccount: string;
    error: string;
  };
};

export function SignInForm({ locale, strings }: SignInFormProps) {
  const [state, formAction] = useFormState<SignInState, FormData>(signInAction, SIGN_IN_DEFAULT_STATE);

  return (
    <AuthCard
      title={strings.title}
      description={strings.description}
      footer={
        <span>
          {strings.noAccount}{" "}
          <AuthCardFooterLink href={`/${locale}/auth/sign-up`}>{strings.createAccount}</AuthCardFooterLink>
        </span>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
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
          autoComplete="current-password"
        />
        {state.status === "error" ? (
          <p className="rounded-xl bg-red-100/70 px-3 py-2 text-sm text-red-700">
            {state.message ?? strings.error}
          </p>
        ) : null}
        <div className="flex items-center justify-between text-sm text-foreground/70">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="remember"
              value="true"
              className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
            />
            <span>{strings.rememberMe}</span>
          </label>
          <AuthCardFooterLink href={`/${locale}/auth/reset-password`}>
            {strings.forgotPassword}
          </AuthCardFooterLink>
        </div>
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
