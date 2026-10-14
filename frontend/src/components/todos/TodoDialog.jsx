import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Field, Input, Modal, Select, Textarea } from "../ui";
import { useNotes } from "../../hooks/useNotes";
import { useTodoMutations } from "../../hooks/useTodos";
import { PRIORITY, STATUS } from "./meta";

const EMPTY = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  noteId: "",
};

/** Create (todo = null) or edit a task. */
export function TodoDialog({ open, onOpenChange, todo, defaults }) {
  const { create, update, remove } = useTodoMutations();
  const { data: notes = [] } = useNotes();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      todo
        ? {
            ...EMPTY,
            ...todo,
            dueDate: todo.dueDate ?? "",
            noteId: todo.noteId ?? "",
          }
        : { ...EMPTY, ...defaults },
    );
    // Reset only when the dialog opens or switches task, not on every parent render.
  }, [open, todo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Give the task a title.");
    const payload = {
      title: form.title.trim(),
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      noteId: form.noteId || null,
    };
    try {
      if (todo) await update.mutateAsync({ id: todo.id, patch: payload });
      else await create.mutateAsync(payload);
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const onDelete = async () => {
    await remove.mutateAsync(todo.id);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={todo ? "Edit task" : "New task"}
    >
      <form onSubmit={submit} className="space-y-4 px-5 py-4">
        <Field label="Title" error={error}>
          {(p) => (
            <Input
              {...p}
              autoFocus
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Draft Note mongoose schema"
            />
          )}
        </Field>
        <Field label="Description">
          {(p) => (
            <Textarea
              {...p}
              value={form.description}
              onChange={set("description")}
              placeholder="Add details…"
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            {(p) => (
              <Select {...p} value={form.status} onChange={set("status")}>
                {Object.entries(STATUS).map(([v, s]) => (
                  <option key={v} value={v}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Priority">
            {(p) => (
              <Select {...p} value={form.priority} onChange={set("priority")}>
                {Object.entries(PRIORITY).map(([v, s]) => (
                  <option key={v} value={v}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Due date">
            {(p) => (
              <Input
                {...p}
                type="date"
                value={form.dueDate}
                onChange={set("dueDate")}
              />
            )}
          </Field>
          <Field label="Linked page">
            {(p) => (
              <Select {...p} value={form.noteId} onChange={set("noteId")}>
                <option value="">None</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.icon} {n.title || "Untitled"}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {todo && (
            <Button
              variant="danger-ghost"
              icon={Trash2}
              onClick={onDelete}
              loading={remove.isPending}
            >
              Delete
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={create.isPending || update.isPending}
            >
              {todo ? "Save" : "Create task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
