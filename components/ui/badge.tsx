import type { PropsWithChildren } from "react";
import clsx from "clsx";

export type BadgeProps = PropsWithChildren<{
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}>;

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary/15 text-secondary",
  ghost: "bg-foreground/5 text-foreground/70",
};

export function Badge({ variant = "ghost", className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
