import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Spinner } from "./Feedback";

const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-line-strong bg-bg text-fg hover:bg-hover",
  ghost: "text-muted hover:bg-hover hover:text-fg",
  danger: "bg-danger text-white hover:opacity-90",
  "danger-ghost": "text-danger hover:bg-danger-soft",
};
const SIZES = {
  xs: "h-6 px-1.5 text-xs gap-1 rounded",
  sm: "h-7 px-2 text-[13px] gap-1.5 rounded-md",
  md: "h-8 px-3 text-sm gap-2 rounded-md",
  lg: "h-10 px-4 text-sm gap-2 rounded-md",
};

export const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", loading = false, icon: Icon, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-3.5" /> : Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.8} /> : null}
      {children}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton({ icon: Icon, label, className, size = "md", active, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg",
        "focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40",
        size === "sm" ? "size-6" : "size-7",
        active && "bg-active text-fg",
        className,
      )}
      {...props}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={1.8} />
    </button>
  );
});
