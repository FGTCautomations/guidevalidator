"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/_actions/auth";

export type SignOutButtonProps = {
  locale: string;
  label: string;
};

export function SignOutButton({ locale, label }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      void signOutAction(locale);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
      disabled={pending}
    >
      {label}
    </button>
  );
}
