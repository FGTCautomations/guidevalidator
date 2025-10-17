"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { CheckoutActionState } from "@/app/_actions/billing";

type GuideBillingActionsProps = {
  locale: string;
  premiumAction: (prevState: CheckoutActionState, formData: FormData) => Promise<CheckoutActionState>;
  verificationAction: (prevState: CheckoutActionState, formData: FormData) => Promise<CheckoutActionState>;
  labels: {
    premiumCta: string;
    verificationCta: string;
    pending: string;
    errorPrefix: string;
  };
};

type ActionMessageProps = {
  state: CheckoutActionState;
  errorPrefix: string;
};

const INITIAL_STATE: CheckoutActionState = { ok: false };

function CheckoutButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
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

function ActionMessage({ state, errorPrefix }: ActionMessageProps) {
  if (state.ok || !state.message) {
    return null;
  }
  return <p className="text-xs text-red-600">{`${errorPrefix} ${state.message}`}</p>;
}

export function GuideBillingActions({
  locale,
  premiumAction,
  verificationAction,
  labels,
}: GuideBillingActionsProps) {
  const [premiumState, premiumDispatch] = useFormState(premiumAction, INITIAL_STATE);
  const [verificationState, verificationDispatch] = useFormState(verificationAction, INITIAL_STATE);

  return (
    <div className="space-y-6">
      <form action={premiumDispatch} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <CheckoutButton label={labels.premiumCta} pendingLabel={labels.pending} />
        <ActionMessage state={premiumState} errorPrefix={labels.errorPrefix} />
      </form>
      <form action={verificationDispatch} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <CheckoutButton label={labels.verificationCta} pendingLabel={labels.pending} />
        <ActionMessage state={verificationState} errorPrefix={labels.errorPrefix} />
      </form>
    </div>
  );
}