import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

export type FormFieldProps = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({ label, error, className, ...props }: FormFieldProps) {
  const id = props.id ?? props.name;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex justify-between text-sm font-medium text-foreground">
        <span>{label}</span>
        {props.required ? <span className="text-xs font-normal text-secondary">*</span> : null}
      </label>
      <input
        id={id}
        className={clsx(
          "w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm outline-none transition",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          error ? "border-red-500/70" : null,
          className
        )}
        {...props}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
