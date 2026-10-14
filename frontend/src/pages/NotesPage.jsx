import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FileText, Plus, Search, Star } from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { VISIBILITY } from "../components/sharing/visibility";
import {
  Button,
  EmptyState,
  ErrorState,
  MockBadge,
  Select,
  Skeleton,
} from "../components/ui";
import { useCreateNote, useNoteTree } from "../hooks/useNotes";
import { blocksToText, timeAgo } from "../lib/utils";

export default function NotesPage() {
  const { notes, ancestors, isLoading, error } = useNoteTree();
  const createNote = useCreateNote();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");
  const [visibility, setVisibility] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => visibility === "all" || n.visibility === visibility)
      .map((n) => ({ ...n, text: blocksToText(n.content, 2000) }))
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.text.toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sort === "title"
          ? (a.title || "").localeCompare(b.title || "")
          : b[sort === "created" ? "createdAt" : "updatedAt"].localeCompare(
              a[sort === "created" ? "createdAt" : "updatedAt"],
            ),
      );
  }, [notes, query, sort, visibility]);

  return (
    <div className="flex h-full flex-col">
      <Topbar
        crumbs={[{ label: "All pages", icon: <FileText className="size-4" /> }]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 pt-10 pb-24 sm:px-12">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold tracking-tight">
                All pages
              </h1>
              <p className="mt-1 text-sm text-muted">
                {notes.length} pages, including sub-pages.
              </p>
            </div>
            <MockBadge className="mb-1.5" />
            <Button
              variant="primary"
              icon={Plus}
              loading={createNote.isPending}
              onClick={() =>
                createNote.mutate(
                  {},
                  { onSuccess: (n) => navigate(`/notes/${n.id}`) },
                )
              }
            >
              New page
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles and content"
                aria-label="Search pages"
                className="h-8 w-full rounded-md border border-line-strong bg-subtle pr-2 pl-8 text-sm outline-none focus:border-accent"
              />
            </div>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-36"
              aria-label="Visibility filter"
            >
              <option value="all">All visibility</option>
              {Object.entries(VISIBILITY).map(([v, o]) => (
                <option key={v} value={v}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-40"
              aria-label="Sort"
            >
              <option value="updated">Last edited</option>
              <option value="created">Created</option>
              <option value="title">Title</option>
            </Select>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : error ? (
              <ErrorState error={error} />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={Search}
                title={query ? `No pages match “${query}”` : "No pages yet"}
              />
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {rows.map((n) => {
                  const path = ancestors(n.id);
                  const V = VISIBILITY[n.visibility];
                  return (
                    <li key={n.id}>
                      <Link
                        to={`/notes/${n.id}`}
                        className="flex items-start gap-3 px-2 py-2.5 hover:bg-subtle"
                      >
                        <span className="mt-0.5 text-lg leading-none">
                          {n.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {n.title || "Untitled"}
                            {n.isFavorite && (
                              <Star className="size-3 fill-current text-warning" />
                            )}
                          </p>
                          {path.length > 0 && (
                            <p className="truncate text-xs text-faint">
                              in{" "}
                              {path
                                .map((a) => a.title || "Untitled")
                                .join(" / ")}
                            </p>
                          )}
                          {n.text && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                              {n.text.slice(0, 180)}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-faint">
                          <span>{timeAgo(n.updatedAt)}</span>
                          <span className="inline-flex items-center gap-1">
                            <V.icon className="size-3" /> {V.label}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
