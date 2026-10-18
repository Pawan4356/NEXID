import { useEffect, useState } from "react";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  danger = true,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);
  const releasePointerLock = () => {
    document.body.style.removeProperty("pointer-events");
  };

  useEffect(() => () => releasePointerLock(), []);

  if (!open) return null;

  const close = () => {
    releasePointerLock();
    onOpenChange(false);
  };

  const confirm = () => {
    setBusy(true);
    close();
    Promise.resolve()
      .then(onConfirm)
      .catch(() => {
        // The caller's mutation already surfaced the error.
      })
      .finally(() => setBusy(false));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh] dark:bg-black/60">
      <div
        className="relative flex max-h-[80vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-lg bg-elevated text-fg shadow-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="border-b border-line px-5 py-3.5">
          <h2 id="confirm-dialog-title" className="font-semibold">
            {title}
          </h2>
        </div>
        <p className="px-5 py-4 text-sm text-muted">{description}</p>
        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            loading={busy}
            onClick={confirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
