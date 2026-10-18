import { useEffect, useRef, useState } from "react";
import { NavLink, useMatch, useNavigate } from "react-router";
import { Check, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import {
  useCreateNote,
  useNoteTree,
  useUpdateNote,
} from "../../hooks/useNotes";
import { useLocalStorageState } from "../../hooks/useUtils";
import { NoteActionsMenu } from "./NoteActionsMenu";
import { NoteIcon } from "./noteIcons";
import { IconButton, Skeleton } from "../ui";
import { cn } from "../../lib/utils";

function getTodoProgress(content) {
  const todos = [];
  const collect = (blocks) => {
    for (const block of blocks ?? []) {
      if (block.type === "checkListItem") todos.push(block);
      collect(block.children);
    }
  };
  collect(content);
  if (!todos.length) return null;
  const completed = todos.filter((block) => block.props?.checked).length;
  return { completed, total: todos.length, percent: (completed / todos.length) * 100 };
}

function TodoProgress({ content }) {
  const progress = getTodoProgress(content);
  if (!progress) return null;
  const complete = progress.completed === progress.total;

  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded-full"
      style={{
        background: complete
          ? "var(--fg-faint)"
          : `conic-gradient(var(--accent) ${progress.percent}%, var(--border) 0)`,
      }}
      aria-label={`${progress.completed} of ${progress.total} todos complete`}
      role="img"
    >
      {complete && <Check className="size-3 text-bg" strokeWidth={3} />}
    </span>
  );
}

function RenameInput({ note, onDone }) {
  const update = useUpdateNote();
  const [value, setValue] = useState(note.title);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  // Enter and the blur caused by unmounting would otherwise both commit.
  const commit = () => {
    if (done.current) return;
    done.current = true;
    if (value !== note.title)
      update.mutate({ id: note.id, patch: { title: value.trim() } });
    onDone();
  };
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          done.current = true;
          onDone();
        }
      }}
      className="h-6 min-w-0 flex-1 rounded border border-accent bg-bg px-1 text-sm outline-none"
      aria-label="Page title"
    />
  );
}

function TreeItem({ note, depth, tree, expanded, toggle, activeId }) {
  const [renaming, setRenaming] = useState(false);
  const createNote = useCreateNote();
  const navigate = useNavigate();
  const kids = tree.children.get(note.id) ?? [];
  const isOpen = expanded.includes(note.id);

  const addChild = () =>
    createNote.mutate(
      { parentId: note.id },
      {
        onSuccess: (n) => {
          if (!isOpen) toggle(note.id);
          navigate(`/notes/${n.id}`);
        },
      },
    );

  return (
    <li>
      <div
        className={cn(
          "group relative flex h-7.5 items-center gap-1 rounded-md pr-1 text-sm text-muted hover:bg-hover",
          activeId === note.id && "bg-active font-medium text-fg",
        )}
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        <button
          onClick={() => toggle(note.id)}
          className="relative flex size-6 shrink-0 items-center justify-center rounded hover:bg-active"
          aria-label={isOpen ? "Collapse" : "Expand"}
          aria-expanded={isOpen}
        >
          <span className="text-[15px] leading-none group-hover:opacity-0">
            <NoteIcon name={note.icon} className="size-4" />
          </span>
          <ChevronRight
            className={cn(
              "absolute size-3.5 opacity-0 transition-transform group-hover:opacity-100",
              isOpen && "rotate-90",
            )}
          />
        </button>
        {renaming ? (
          <RenameInput note={note} onDone={() => setRenaming(false)} />
        ) : (
          <NavLink
            to={`/notes/${note.id}`}
            className="flex min-w-0 flex-1 items-center gap-1 py-1"
            onDoubleClick={() => setRenaming(true)}
          >
            <span className="min-w-0 flex-1 truncate">{note.title || "Untitled"}</span>
            <TodoProgress content={note.content} />
          </NavLink>
        )}
        {!renaming && (
          <div className="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100">
            <NoteActionsMenu
              note={note}
              onRename={() => setRenaming(true)}
              trigger={
                <IconButton
                  icon={MoreHorizontal}
                  size="sm"
                  label="Page actions"
                />
              }
            />
            <IconButton
              icon={Plus}
              size="sm"
              label="Add a page inside"
              onClick={addChild}
            />
          </div>
        )}
      </div>
      {isOpen &&
        (kids.length ? (
          <ul>
            {kids.map((k) => (
              <TreeItem
                key={k.id}
                note={k}
                depth={depth + 1}
                tree={tree}
                expanded={expanded}
                toggle={toggle}
                activeId={activeId}
              />
            ))}
          </ul>
        ) : (
          <p
            className="py-1 text-xs text-faint"
            style={{ paddingLeft: 32 + depth * 14 }}
          >
            No pages inside
          </p>
        ))}
    </li>
  );
}

export function NoteTree() {
  const tree = useNoteTree();
  const noteId = useMatch("/notes/:noteId")?.params.noteId;
  const [expanded, setExpanded] = useLocalStorageState("nexid.tree.expanded", [
    "n-roadmap",
  ]);
  const toggle = (id) =>
    setExpanded((e) =>
      e.includes(id) ? e.filter((x) => x !== id) : [...e, id],
    );

  // Reveal the active page by expanding its ancestors.
  useEffect(() => {
    if (!noteId) return;
    const ids = tree.ancestors(noteId).map((a) => a.id);
    if (ids.some((id) => !expanded.includes(id)))
      setExpanded((e) => [...new Set([...e, ...ids])]);
  }, [noteId, tree]); // eslint-disable-line react-hooks/exhaustive-deps

  if (tree.isLoading)
    return (
      <div className="space-y-2 px-2 py-1">
        {[70, 55, 80].map((w) => (
          <Skeleton key={w} className="h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
    );

  const roots = tree.children.get(null) ?? [];
  if (!roots.length)
    return <p className="px-2 py-1 text-xs text-faint">No pages yet</p>;

  return (
    <ul>
      {roots.map((n) => (
        <TreeItem
          key={n.id}
          note={n}
          depth={0}
          tree={tree}
          expanded={expanded}
          toggle={toggle}
          activeId={noteId}
        />
      ))}
    </ul>
  );
}
