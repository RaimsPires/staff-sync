import { useId } from "react";
import { cn } from "@/lib/utils";

/** Shared look of text inputs, selects and time pickers on the larger (40px) form controls. */
export const controlClass = (invalid?: boolean) =>
  cn(
    "h-10 w-full min-w-0 rounded-[9px] border border-solid bg-surface px-3 text-[14px] text-text outline-none",
    "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:bg-surface-2 read-only:bg-surface-2 read-only:text-text-2",
    invalid ? "border-bad-dot" : "border-border-strong",
  );

interface FieldShellProps {
  label: React.ReactNode;
  /** Muted text next to the label. */
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => React.ReactNode;
}

/** Label + control + error message with the ids wired for assistive technology. */
export function FieldShell({ label, hint, error, className, children }: FieldShellProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {hint && <span className="ml-1 font-normal text-text-3">{hint}</span>}
      </label>
      {children({ id, invalid: !!error, describedBy: error ? errorId : undefined })}
      {error && (
        <span id={errorId} className="text-[12.5px] text-bad">
          {error}
        </span>
      )}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  fieldClassName?: string;
};

export function TextField({ label, hint, error, fieldClassName, className, ...input }: InputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} className={fieldClassName}>
      {({ id, invalid, describedBy }) => (
        <input id={id} aria-invalid={invalid} aria-describedby={describedBy} className={cn(controlClass(invalid), className)} {...input} />
      )}
    </FieldShell>
  );
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  fieldClassName?: string;
};

export function SelectField({ label, hint, error, fieldClassName, className, children, ...select }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} className={fieldClassName}>
      {({ id, invalid, describedBy }) => (
        <select id={id} aria-invalid={invalid} aria-describedby={describedBy} className={cn(controlClass(invalid), "px-2.5", className)} {...select}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}
