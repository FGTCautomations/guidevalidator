"use client";

import { useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { adminCreateUserAction, type AdminActionState } from "@/app/_actions/admin";

const INITIAL_STATE: AdminActionState = { ok: true };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AdminCreateUserForm({
  locale,
  roles,
  localeOptions,
  countryOptions,
  translations,
}: {
  locale: string;
  roles: Array<{ value: string; label: string }>;
  localeOptions: Array<{ value: string; label: string }>;
  countryOptions: Array<{ value: string; label: string }>;
  translations: {
    title: string;
    description: string;
    email: string;
    password: string;
    fullName: string;
    role: string;
    localeLabel: string;
    country: string;
    timezone: string;
    submit: string;
    success: string;
    error: string;
  };
}) {
  const [state, formAction] = useFormState(adminCreateUserAction, INITIAL_STATE);
  const feedbackMessage = state.message
    ? state.ok
      ? translations.success
      : `${translations.error} (${state.message})`
    : null;

  const normalizedLocaleOptions = useMemo(() => {
    if (localeOptions.length > 0) {
      return localeOptions;
    }
    return [{ value: locale, label: locale }];
  }, [locale, localeOptions]);

  const normalizedCountryOptions = useMemo(() => {
    if (countryOptions.length > 0) {
      return countryOptions;
    }
    return [];
  }, [countryOptions]);

  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{translations.title}</h2>
        <p className="text-sm text-foreground/70">{translations.description}</p>
      </header>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div className="grid gap-3">
          <label className="text-sm font-medium text-foreground">
            {translations.email}
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            {translations.password}
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            {translations.fullName}
            <input
              type="text"
              name="fullName"
              className="mt-1 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            {translations.role}
            <select
              name="role"
              required
              className="mt-1 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            >
              <option value="">--</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            {translations.localeLabel}
            <select
              name="profileLocale"
              required
              defaultValue={locale}
              className="mt-1 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            >
              {normalizedLocaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            {translations.country}
            <select
              name="countryCode"
              required
              className="mt-1 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            >
              <option value="">--</option>
              {normalizedCountryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            {translations.timezone}
            <input
              type="text"
              name="timezone"
              placeholder="Europe/Berlin"
              required
              className="mt-1 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
        <SubmitButton label={translations.submit} pendingLabel={translations.submit} />
        {feedbackMessage ? (
          <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}>{feedbackMessage}</p>
        ) : null}
      </form>
    </section>
  );
}
