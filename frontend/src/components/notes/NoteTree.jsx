import { useEffect, useRef, useState } from "react";
import { NavLink, useMatch, useNavigate } from "react-router";
import { ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import {
  useCreateNote,
  useNoteTree,
  useUpdateNote,
} from "../../hooks/useNotes";
import { useLocalStorageState } from "../../hooks/useUtils";
import { NoteActionsMenu } from "./NoteActionsMenu";
import { IconButton, Skeleton } from "../ui";
import { cn } from "../../lib/utils";

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
          "group relative flex h-[30px] items-center gap-1 rounded-md pr-1 text-sm text-muted hover:bg-hover",
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
            {note.icon}
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
            className="min-w-0 flex-1 truncate py-1"
            onDoubleClick={() => setRenaming(true)}
          >
            {note.title || "Untitled"}
          </NavLink>
        )}
        {!renaming && (
          <div className="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100">
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
