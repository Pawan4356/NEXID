import { useState } from "react";
import { Modal } from "./Overlay";
import { Button } from "./Button";

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Delete", danger = true, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // The caller's mutation already surfaced the error.
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={busy} onClick={confirm} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="px-5 py-4 text-sm text-muted">{description}</p>
    </Modal>
  );
}
