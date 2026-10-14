import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

const fieldBase =
  "w-full rounded-md border bg-subtle px-2.5 text-sm text-fg placeholder:text-faint transition-colors outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:opacity-60";

export const Input = forwardRef(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "h-8",
        invalid ? "border-danger" : "border-line-strong",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "min-h-20 py-2",
        invalid ? "border-danger" : "border-line-strong",
        className,
      )}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select(
  { className, children, invalid, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "h-8 pr-1.5",
        invalid ? "border-danger" : "border-line-strong",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className="pr-9"
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-faint hover:text-fg"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

/** Label + control + hint/error. Pass a render function to receive the id. */
export function Field({ label, error, hint, children, className }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-muted">
          {label}
        </label>
      )}
      {typeof children === "function"
        ? children({ id, "aria-describedby": describedBy, invalid: !!error })
        : children}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-4.5 w-7.5 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-accent" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-3",
        )}
      />
    </button>
  );
}

export function Checkbox({ checked, onChange, label, className, size = "md" }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[3px] border transition-colors",
        size === "sm" ? "size-3.5" : "size-4",
        checked
          ? "border-accent bg-accent text-white"
          : "border-line-strong hover:bg-hover",
        className,
      )}
    >
      {checked && (
        <svg
          viewBox="0 0 12 12"
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2.5 6.5l2.2 2.2 4.8-5" />
        </svg>
      )}
    </button>
  );
}
