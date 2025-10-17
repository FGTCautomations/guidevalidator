"use client";

import { useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { adminUpdateUserAction, type AdminActionState } from "@/app/_actions/admin";

type RoleOption = {
  value: string;
  label: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type AdminUpdateUserFormProps = {
  userId: string;
  locale: string;
  initial: {
    fullName: string | null;
    role: string;
    verified: boolean;
    licenseVerified: boolean;
    locale: string;
    countryCode: string | null;
    timezone: string | null;
  };
  roles: RoleOption[];
  localeOptions: SelectOption[];
  countryOptions: SelectOption[];
  translations: {
    heading: string;
    fullName: string;
    role: string;
    verified: string;
    licenseVerified: string;
    localeLabel: string;
    country: string;
    timezone: string;
    submit: string;
    success: string;
    error: string;
  };
};

const INITIAL_STATE: AdminActionState = { ok: true };

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

function SubmitButton({ label, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AdminUpdateUserForm({
  userId,
  locale,
  initial,
  roles,
  localeOptions,
  countryOptions,
  translations,
}: AdminUpdateUserFormProps) {
  const [state, dispatch] = useFormState(adminUpdateUserAction, INITIAL_STATE);

  const feedbackMessage = useMemo(() => {
    if (!state.message) return null;
    return state.ok ? translations.success : `${translations.error} (${state.message})`;
  }, [state.message, state.ok, translations.error, translations.success]);

  const normalizedLocaleOptions = useMemo(() => {
    return localeOptions.length > 0 ? localeOptions : [{ value: initial.locale, label: initial.locale }];
  }, [initial.locale, localeOptions]);

  const normalizedCountryOptions = useMemo(() => {
    if (countryOptions.length > 0) {
      return countryOptions;
    }
    if (initial.countryCode) {
      return [{ value: initial.countryCode, label: initial.countryCode }];
    }
    return [];
  }, [countryOptions, initial.countryCode]);

  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{translations.heading}</h2>
      <form action={dispatch} className="space-y-4">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="locale" value={locale} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-foreground/80 sm:col-span-2">
            <span className="font-medium text-foreground">{translations.fullName}</span>
            <input
              name="fullName"
              defaultValue={initial.fullName ?? ""}
              className="rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-foreground/80 sm:col-span-1">
            <span className="font-medium text-foreground">{translations.role}</span>
            <select
              name="role"
              defaultValue={initial.role}
              className="rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {roles.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-foreground/80 sm:col-span-1">
            <span className="font-medium text-foreground">{translations.localeLabel}</span>
            <select
              name="profileLocale"
              defaultValue={initial.locale}
              className="rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {normalizedLocaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-foreground/80 sm:col-span-1">
            <span className="font-medium text-foreground">{translations.country}</span>
            <select
              name="countryCode"
              defaultValue={initial.countryCode ?? ""}
              className="rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {normalizedCountryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-foreground/80 sm:col-span-1">
            <span className="font-medium text-foreground">{translations.timezone}</span>
            <input
              name="timezone"
              defaultValue={initial.timezone ?? ""}
              placeholder="Europe/Berlin"
              className="rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              name="verified"
              type="checkbox"
              defaultChecked={initial.verified}
              className="h-4 w-4 rounded border border-foreground/40 text-primary focus:ring-primary/40"
            />
            <span>{translations.verified}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              name="licenseVerified"
              type="checkbox"
              defaultChecked={initial.licenseVerified}
              className="h-4 w-4 rounded border border-foreground/40 text-primary focus:ring-primary/40"
            />
            <span>{translations.licenseVerified}</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3">
          <SubmitButton label={translations.submit} pendingLabel={translations.submit} />
        </div>
        {feedbackMessage ? (
          <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}>{feedbackMessage}</p>
        ) : null}
      </form>
    </section>
  );
}
