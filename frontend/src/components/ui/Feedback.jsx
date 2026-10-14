import { FlaskConical } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip } from "./Overlay";

export const Spinner = ({ className }) => (
  <span className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70", className)} role="status" aria-label="Loading" />
);

export const Skeleton = ({ className, ...props }) => <div className={cn("animate-pulse rounded bg-hover", className)} {...props} />;

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {Icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-hover text-muted">
          <Icon className="size-5" strokeWidth={1.6} />
        </div>
      )}
      <p className="font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Something went wrong" }) {
  return (
    <div className="mx-auto my-10 max-w-md rounded-lg border border-line p-5 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{error?.message ?? String(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm text-accent hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

const TONES = {
  default: "bg-hover text-muted",
  accent: "bg-accent-soft text-accent",
  danger: "bg-danger-soft text-danger",
  warning: "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-warning",
  success: "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-success",
};

export const Badge = ({ tone = "default", className, children, ...props }) => (
  <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)} {...props}>
    {children}
  </span>
);

/** Marks UI backed by local mock data or simulation rather than the backend. */
export function MockBadge({ label = "Local mock", detail = "Stored in this browser only. The backend API for this feature doesn't exist yet.", className }) {
  return (
    <Tooltip content={detail}>
      <span
        className={cn(
          "inline-flex cursor-help items-center gap-1 rounded border border-dashed border-line-strong px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted",
          className,
        )}
      >
        <FlaskConical className="size-3" />
        {label}
      </span>
    </Tooltip>
  );
}

export const Kbd = ({ children }) => (
  <kbd className="rounded border border-line-strong bg-subtle px-1 font-sans text-[11px] text-muted">{children}</kbd>
);
