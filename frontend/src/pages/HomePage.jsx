import { Link, useNavigate } from "react-router";
import {
  Clock,
  FilePlus,
  Home,
  PenTool,
  Star,
} from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { NoteIcon } from "../components/notes/noteIcons";
import { MockBadge, Skeleton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCreateNote, useNotes } from "../hooks/useNotes";
import { useDiagramMutations, useDiagrams } from "../hooks/useDiagrams";
import { blocksToText, timeAgo } from "../lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 5
    ? "Good evening"
    : h < 12
      ? "Good morning"
      : h < 18
        ? "Good afternoon"
        : "Good evening";
}

function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
      <Icon className="size-3.5" strokeWidth={2} />
      <span className="flex-1">{children}</span>
      {action}
    </div>
  );
}

function QuickAction({ icon: Icon, label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:bg-hover"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-hover">
        <Icon className="size-4 text-muted" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-faint">{hint}</span>
      </span>
    </button>
  );
}

function RecentCard({ item }) {
  return (
    <Link
      to={item.to}
      className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-bg transition-colors hover:bg-subtle"
    >
      <div className="relative h-11 bg-hover">
        <span className="absolute -bottom-3 left-3 text-2xl leading-none">
          {item.iconComponent ? (
            <item.iconComponent name={item.icon} className="size-5" />
          ) : (
            <PenTool className="size-5" />
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
        <p className="line-clamp-2 text-sm leading-snug font-medium">
          {item.title || "Untitled"}
        </p>
        <p className="mt-auto flex items-center gap-1 pt-3 text-[11px] text-faint">
          <Clock className="size-3" /> {timeAgo(item.at)}
        </p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notes = [], isLoading: notesLoading } = useNotes();
  const { data: diagrams = [] } = useDiagrams();
  const createNote = useCreateNote();
  const { create: createDiagram } = useDiagramMutations();

  const recent = [
    ...notes.map((n) => ({
      id: n.id,
      to: `/notes/${n.id}`,
      icon: n.icon,
      iconComponent: NoteIcon,
      title: n.title,
      at: n.lastViewedAt ?? n.updatedAt,
    })),
    ...diagrams.map((d) => ({
      id: d.id,
      to: `/diagrams/${d.id}`,
      icon: "pen-tool",
      iconComponent: PenTool,
      title: d.title,
      at: d.lastViewedAt ?? d.updatedAt,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const favorites = [
    ...notes
      .filter((n) => n.isFavorite)
      .map((n) => ({
        id: n.id,
        to: `/notes/${n.id}`,
        icon: n.icon,
        iconComponent: NoteIcon,
        title: n.title,
        sub: blocksToText(n.content, 120),
      })),
    ...diagrams
      .filter((d) => d.isFavorite)
      .map((d) => ({
        id: d.id,
        to: `/diagrams/${d.id}`,
        icon: "pen-tool",
        iconComponent: PenTool,
        title: d.title,
        sub: `Diagram · ${d.elementCount} elements`,
      })),
  ];

  return (
    <div className="flex h-full flex-col">
      <Topbar crumbs={[{ label: "Home", icon: <Home className="size-4" /> }]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:px-12">
          <h1 className="text-center text-[30px] font-bold tracking-tight">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-center text-sm text-muted">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="mx-auto mt-10 grid max-w-xl gap-2 sm:grid-cols-2">
            <QuickAction
              icon={FilePlus}
              label="New page"
              hint="Write notes & to-dos"
              onClick={() =>
                createNote.mutate(
                  {},
                  { onSuccess: (n) => navigate(`/notes/${n.id}`) },
                )
              }
            />
            <QuickAction
              icon={PenTool}
              label="New diagram"
              hint="Open a blank canvas"
              onClick={() =>
                createDiagram.mutate(
                  {},
                  { onSuccess: (d) => navigate(`/diagrams/${d.id}`) },
                )
              }
            />
          </div>

          <section className="mt-10">
            <SectionTitle icon={Clock} action={<MockBadge />}>
              Recently visited
            </SectionTitle>
            {notesLoading ? (
              <div className="flex gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-36 rounded-xl" />
                ))}
              </div>
            ) : recent.length ? (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                {recent.map((r) => (
                  <RecentCard key={r.id} item={r} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Pages and diagrams you open will show up here.
              </p>
            )}
          </section>

          <div className="mt-10 max-w-md">
            <div className="space-y-10">
              <section>
                <SectionTitle icon={Star}>Favorites</SectionTitle>
                {favorites.length === 0 ? (
                  <p className="text-sm text-muted">
                    Star a page or diagram to pin it here and in the sidebar.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {favorites.map((f) => (
                      <li key={f.id}>
                        <Link
                          to={f.to}
                          className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-hover"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center">
                            <f.iconComponent name={f.icon} className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {f.title || "Untitled"}
                            </span>
                            <span className="block truncate text-xs text-faint">
                              {f.sub}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
