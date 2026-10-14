import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { Checkbox } from "../ui";
import { useNotes } from "../../hooks/useNotes";
import { useTodoMutations } from "../../hooks/useTodos";
import { cn } from "../../lib/utils";
import { DueDate, PriorityBadge, StatusBadge } from "./TodoBits";
import { STATUS } from "./meta";

const toggleDone = (update, t) =>
  update.mutate({
    id: t.id,
    patch: { status: t.status === "done" ? "todo" : "done" },
  });

function QuickAdd({ defaults, className }) {
  const { create } = useTodoMutations();
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);
  const submit = () => {
    if (!title.trim()) return setActive(false);
    create.mutate({ ...defaults, title }, { onSuccess: () => setTitle("") });
  };
  if (!active)
    return (
      <button
        onClick={() => setActive(true)}
        className={cn(
          "flex h-8 w-full items-center gap-1.5 px-2 text-sm text-faint hover:bg-hover hover:text-muted",
          className,
        )}
      >
        <Plus className="size-4" /> New
      </button>
    );
  return (
    <input
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") {
          setTitle("");
          setActive(false);
        }
      }}
      placeholder="Task name, then Enter"
      className={cn(
        "h-8 w-full bg-transparent px-3 text-sm outline-none placeholder:text-faint",
        className,
      )}
      aria-label="New task title"
    />
  );
}

export function TodoTable({ todos, onOpen }) {
  const { update } = useTodoMutations();
  const { data: notes = [] } = useNotes();
  const noteById = new Map(notes.map((n) => [n.id, n]));
  const cols =
    "grid grid-cols-[28px_minmax(0,1fr)_110px_96px_100px] md:grid-cols-[28px_minmax(0,1fr)_120px_100px_110px_180px]";

  return (
    <div className="overflow-x-auto">
      <div className="min-w-140 text-sm">
        <div
          className={cn(
            cols,
            "h-8 items-center border-y border-line text-xs text-muted",
          )}
        >
          <span />
          <span className="px-2">Name</span>
          <span className="border-l border-line px-2">Status</span>
          <span className="border-l border-line px-2">Priority</span>
          <span className="border-l border-line px-2">Due</span>
          <span className="hidden border-l border-line px-2 md:block">
            Page
          </span>
        </div>
        {todos.map((t) => {
          const note = noteById.get(t.noteId);
          return (
            <div
              key={t.id}
              className={cn(
                cols,
                "group h-9 cursor-pointer items-center border-b border-line hover:bg-subtle",
              )}
              onClick={() => onOpen(t)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onOpen(t)}
            >
              <span className="flex justify-center">
                <Checkbox
                  checked={t.status === "done"}
                  onChange={() => toggleDone(update, t)}
                  label={`Mark "${t.title}" ${t.status === "done" ? "not done" : "done"}`}
                />
              </span>
              <span
                className={cn(
                  "truncate px-2 font-medium",
                  t.status === "done" && "text-faint line-through",
                )}
              >
                {t.title}
              </span>
              <span className="px-2">
                <StatusBadge status={t.status} />
              </span>
              <span className="px-2">
                <PriorityBadge priority={t.priority} />
              </span>
              <span className="px-2">
                <DueDate date={t.dueDate} done={t.status === "done"} />
              </span>
              <span className="hidden truncate px-2 md:block">
                {note ? (
                  <Link
                    to={`/notes/${note.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted hover:text-fg hover:underline"
                  >
                    {note.icon} {note.title || "Untitled"}
                  </Link>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </span>
            </div>
          );
        })}
        <QuickAdd className="border-b border-line" />
      </div>
    </div>
  );
}

export function TodoBoard({ todos, onOpen }) {
  const { update } = useTodoMutations();
  const [dragOver, setDragOver] = useState(null);

  const onDrop = (status) => (e) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/todo-id");
    const t = todos.find((x) => x.id === id);
    if (t && t.status !== status) update.mutate({ id, patch: { status } });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {Object.entries(STATUS).map(([status, s]) => {
        const items = todos.filter((t) => t.status === status);
        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={(e) =>
              !e.currentTarget.contains(e.relatedTarget) && setDragOver(null)
            }
            onDrop={onDrop(status)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg p-1.5 transition-colors",
              dragOver === status ? "bg-accent-soft" : "bg-subtle",
            )}
            aria-label={s.label}
          >
            <header className="flex h-8 items-center gap-2 px-1.5 text-sm">
              <StatusBadge status={status} />
              <span className="text-faint">{items.length}</span>
            </header>
            <div className="space-y-1.5">
              {items.map((t) => (
                <article
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/todo-id", t.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onOpen(t)}
                  className="cursor-pointer rounded-md border border-line bg-bg p-2.5 shadow-[0_1px_2px_rgba(15,15,15,0.06)] hover:bg-subtle"
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={t.status === "done"}
                      onChange={() => toggleDone(update, t)}
                      className="mt-0.5"
                      label={`Toggle "${t.title}"`}
                    />
                    <p
                      className={cn(
                        "text-sm leading-snug font-medium",
                        t.status === "done" && "text-faint line-through",
                      )}
                    >
                      {t.title}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                    <PriorityBadge priority={t.priority} />
                    <DueDate date={t.dueDate} done={t.status === "done"} />
                  </div>
                </article>
              ))}
            </div>
            <QuickAdd defaults={{ status }} className="mt-1 rounded-md" />
          </section>
        );
      })}
    </div>
  );
}
