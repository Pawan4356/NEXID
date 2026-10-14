import { AlertCircle, Check } from "lucide-react";
import { Spinner, Tooltip } from "../ui";
import { timeAgo } from "../../lib/utils";

/** Honest autosave indicator: "Saved" only after the write resolved. */
export function SaveStatus({ status, updatedAt, onRetry, where = "this browser" }) {
  if (status === "pending" || status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-xs text-faint">
        <Spinner className="size-3" /> Saving…
      </span>
    );
  if (status === "error")
    return (
      <button onClick={onRetry} className="flex items-center gap-1 rounded px-1 text-xs text-danger hover:bg-danger-soft">
        <AlertCircle className="size-3.5" /> Not saved — retry
      </button>
    );
  return (
    <Tooltip content={`Saved to ${where} (local mock — no notes API yet)`}>
      <span className="flex cursor-default items-center gap-1 text-xs text-faint">
        {status === "saved" && <Check className="size-3.5" />}
        {status === "saved" ? "Saved locally" : `Edited ${timeAgo(updatedAt)}`}
      </span>
    </Tooltip>
  );
}
