"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import type { AdminActionState } from "@/app/_actions/admin";
import { adminDeleteUserAction } from "@/app/_actions/admin";

type AdminDeleteUserFormProps = {
  userId: string;
  locale: string;
  translations: {
    heading: string;
    confirm: string;
    cancel: string;
    submit: string;
    success: string;
    error: string;
  };
  redirectTo?: string;
};

const INITIAL_STATE: AdminActionState = { ok: true };

type SubmitProps = {
  label: string;
  pendingLabel: string;
};

function SubmitButton({ label, pendingLabel }: SubmitProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AdminDeleteUserForm({ userId, locale, translations, redirectTo }: AdminDeleteUserFormProps) {
  const [state, formAction] = useFormState(adminDeleteUserAction, INITIAL_STATE);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.message === "USER_DELETED") {
      if (redirectTo) {
        router.replace(redirectTo as Route);
      } else {
        router.refresh();
      }
    }
  }, [redirectTo, router, state.ok, state.message]);

  const feedbackMessage = state.message
    ? state.ok
      ? translations.success
      : `${translations.error} (${state.message})`
    : null;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton label={translations.submit} pendingLabel={translations.submit} />
      {feedbackMessage ? (
        <p className={`text-xs ${state.ok ? "text-emerald-600" : "text-red-600"}`}>{feedbackMessage}</p>
      ) : null}
    </form>
  );
}

