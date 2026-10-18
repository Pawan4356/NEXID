import { useState } from "react";
import { useNavigate } from "react-router";
import { Command } from "cmdk";
import { Dialog } from "radix-ui";
import {
  FilePlus,
  Moon,
  PenTool,
  Search,
  Sun,
  Users,
} from "lucide-react";
import { useNotes, useCreateNote } from "../../hooks/useNotes";
import { useDiagrams, useDiagramMutations } from "../../hooks/useDiagrams";
import { useUserSearch } from "../../hooks/useSocial";
import { useDebouncedValue } from "../../hooks/useUtils";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Spinner } from "../ui";
import { NoteIcon } from "../notes/noteIcons";
import { blocksToText, timeAgo } from "../../lib/utils";

const itemCls =
  "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm";

// Substring match: title hits rank above body-text hits (cmdk's default is fuzzy).
const filter = (value, search, keywords = []) => {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  // Values are "label␟id"; ids only keep values unique and must not match.
  if (value.split("\u241f")[0].toLowerCase().includes(q)) return 1;
  return keywords.some((k) => k.toLowerCase().includes(q)) ? 0.5 : 0;
};

export function CommandPalette({ open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolved, setTheme } = useTheme();
  const { data: notes = [] } = useNotes();
  const { data: diagrams = [] } = useDiagrams();
  const createNote = useCreateNote();
  const { create: createDiagram } = useDiagramMutations();
  const debounced = useDebouncedValue(query.trim(), 250);
  const people = useUserSearch(debounced, {
    enabled: open && debounced.length > 0,
  });

  const go = (to) => {
    onOpenChange(false);
    setQuery("");
    navigate(to);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60" />
        <Dialog.Content className="fixed top-[14vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl bg-elevated shadow-menu">
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search pages, diagrams and people
          </Dialog.Description>
          <Command label="Search" loop filter={filter}>
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="size-4 text-faint" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search pages, diagrams, people…"
                className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
              />
              {people.isFetching && <Spinner className="size-3.5" />}
            </div>
            <Command.List className="max-h-[52vh] overflow-y-auto p-1.5">
              <Command.Empty className="py-8 text-center text-sm text-muted">
                No results for “{query}”
              </Command.Empty>

              {!query && (
                <Command.Group heading="Quick actions">
                  <Command.Item
                    className={itemCls}
                    onSelect={() =>
                      createNote.mutate(
                        {},
                        { onSuccess: (n) => go(`/notes/${n.id}`) },
                      )
                    }
                  >
                    <FilePlus className="size-4 text-muted" /> New page
                  </Command.Item>
                  <Command.Item
                    className={itemCls}
                    onSelect={() =>
                      createDiagram.mutate(
                        {},
                        { onSuccess: (d) => go(`/diagrams/${d.id}`) },
                      )
                    }
                  >
                    <PenTool className="size-4 text-fg" /> New diagram
                  </Command.Item>
                  <Command.Item
                    className={itemCls}
                    onSelect={() =>
                      setTheme(resolved === "dark" ? "light" : "dark")
                    }
                  >
                    {resolved === "dark" ? (
                      <Sun className="size-4 text-muted" />
                    ) : (
                      <Moon className="size-4 text-muted" />
                    )}
                    Switch to {resolved === "dark" ? "light" : "dark"} theme
                  </Command.Item>
                </Command.Group>
              )}

              <Command.Group heading="Pages">
                {[...notes]
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .map((n) => (
                    <Command.Item
                      key={n.id}
                      value={`${n.title || "Untitled"}\u241f${n.id}`}
                      keywords={query ? [blocksToText(n.content, 2000)] : []}
                      className={itemCls}
                      onSelect={() => go(`/notes/${n.id}`)}
                    >
                      <NoteIcon name={n.icon} className="size-4 text-muted" />
                      <span className="flex-1 truncate">
                        {n.title || "Untitled"}
                      </span>
                      <span className="text-xs text-faint">
                        {timeAgo(n.updatedAt)}
                      </span>
                    </Command.Item>
                  ))}
              </Command.Group>

              <Command.Group heading="Diagrams">
                {diagrams.map((d) => (
                  <Command.Item
                    key={d.id}
                    value={`${d.title}\u241f${d.id}`}
                    className={itemCls}
                    onSelect={() => go(`/diagrams/${d.id}`)}
                  >
                    <PenTool className="size-4 text-fg" />
                    <span className="flex-1 truncate">{d.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              {query && (people.data?.length ?? 0) > 0 && (
                <Command.Group heading="People">
                  {people.data.map((u) => (
                    <Command.Item
                      key={u.id}
                      value={`${u.name}\u241f${u.id}`}
                      className={itemCls}
                      onSelect={() => go(`/people/${u.id}`)}
                    >
                      <Avatar user={u} size="xs" />
                      <span className="flex-1 truncate">{u.name}</span>
                      {u.id === user?.id && (
                        <span className="text-xs text-faint">You</span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {query && (
                <Command.Item
                  className={itemCls}
                  value={`\u241fsearch-people`}
                  keywords={[query]}
                  onSelect={() => go(`/people?q=${encodeURIComponent(query)}`)}
                >
                  <Users className="size-4 text-muted" /> Search people for “
                  {query}”
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
