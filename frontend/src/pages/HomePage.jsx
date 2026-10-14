import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  CheckSquare,
  Clock,
  FilePlus,
  Home,
  PenTool,
  Plus,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { DueDate, PriorityBadge } from "../components/todos/TodoBits";
import {
  Avatar,
  Checkbox,
  EmptyState,
  MockBadge,
  Skeleton,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCreateNote, useNotes } from "../hooks/useNotes";
import { useDiagramMutations, useDiagrams } from "../hooks/useDiagrams";
import { useTodoMutations, useTodos } from "../hooks/useTodos";
import { useMyFollowers, useMyFollowing } from "../hooks/useSocial";
import { addDaysStr, blocksToText, cn, timeAgo, todayStr } from "../lib/utils";

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
          {item.icon}
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

function NetworkCard() {
  const followers = useMyFollowers();
  const following = useMyFollowing();
  const stat = (q, label, tab) => (
    <Link
      to={`/people/me?tab=${tab}`}
      className="flex-1 rounded-lg px-3 py-2 hover:bg-hover"
    >
      <div className="text-xl font-semibold">
        {q.isLoading ? (
          <Skeleton className="h-7 w-8" />
        ) : q.error ? (
          "—"
        ) : (
          q.data.length
        )}
      </div>
      <p className="text-xs text-muted">{label}</p>
    </Link>
  );
  const people = [...(following.data ?? [])].slice(0, 5);
  return (
    <section>
      <SectionTitle
        icon={Users}
        action={
          <Link to="/people" className="hover:text-fg">
            Find people
          </Link>
        }
      >
        Your network
      </SectionTitle>
      <div className="rounded-xl border border-line p-2">
        <div className="flex">
          {stat(followers, "Followers", "followers")}
          {stat(following, "Following", "following")}
        </div>
        {(followers.error || following.error) && (
          <p className="px-3 pb-2 text-xs text-danger">
            {(followers.error || following.error).message}
          </p>
        )}
        {people.length > 0 && (
          <div className="flex items-center gap-2 border-t border-line px-3 pt-2.5 pb-1">
            <div className="flex -space-x-1.5">
              {people.map((u) => (
                <Avatar key={u.id} user={u} size="sm" ring />
              ))}
            </div>
            <span className="truncate text-xs text-muted">
              You follow {people.map((u) => u.name.split(" ")[0]).join(", ")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notes = [], isLoading: notesLoading } = useNotes();
  const { data: diagrams = [] } = useDiagrams();
  const { data: todos = [], isLoading: todosLoading } = useTodos();
  const { update: updateTodo } = useTodoMutations();
  const createNote = useCreateNote();
  const { create: createDiagram } = useDiagramMutations();

  const recent = [
    ...notes.map((n) => ({
      id: n.id,
      to: `/notes/${n.id}`,
      icon: n.icon,
      title: n.title,
      at: n.lastViewedAt ?? n.updatedAt,
    })),
    ...diagrams.map((d) => ({
      id: d.id,
      to: `/diagrams/${d.id}`,
      icon: "✏️",
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
        title: n.title,
        sub: blocksToText(n.content, 120),
      })),
    ...diagrams
      .filter((d) => d.isFavorite)
      .map((d) => ({
        id: d.id,
        to: `/diagrams/${d.id}`,
        icon: "✏️",
        title: d.title,
        sub: `Diagram · ${d.elementCount} elements`,
      })),
  ];

  const open = todos.filter((t) => t.status !== "done");
  const today = todayStr();
  const counts = {
    overdue: open.filter((t) => t.dueDate && t.dueDate < today).length,
    today: open.filter((t) => t.dueDate === today).length,
    week: open.filter(
      (t) => t.dueDate && t.dueDate > today && t.dueDate <= addDaysStr(7),
    ).length,
    progress: open.filter((t) => t.status === "in_progress").length,
  };
  const upcoming = [...open]
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
    .slice(0, 6);

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

          <div className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
              icon={Plus}
              label="New task"
              hint="Add to your todos"
              onClick={() => navigate("/todos?new=1")}
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
            <QuickAction
              icon={UserPlus}
              label="Find people"
              hint="Search & follow"
              onClick={() => navigate("/people")}
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

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section>
              <SectionTitle
                icon={CheckSquare}
                action={
                  <Link
                    to="/todos"
                    className="inline-flex items-center gap-0.5 hover:text-fg"
                  >
                    All todos <ArrowRight className="size-3" />
                  </Link>
                }
              >
                Upcoming tasks
              </SectionTitle>
              <div className="mb-3 grid grid-cols-4 gap-2">
                {[
                  ["Overdue", counts.overdue, "text-danger"],
                  ["Today", counts.today, "text-warning"],
                  ["Next 7 days", counts.week, ""],
                  ["In progress", counts.progress, "text-accent"],
                ].map(([label, n, tone]) => (
                  <div key={label} className="rounded-lg bg-subtle px-3 py-2">
                    <p className={cn("text-lg font-semibold", n > 0 && tone)}>
                      {todosLoading ? "–" : n}
                    </p>
                    <p className="truncate text-[11px] text-muted">{label}</p>
                  </div>
                ))}
              </div>
              {todosLoading ? (
                <Skeleton className="h-40" />
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="All caught up"
                  description="No open tasks."
                  className="py-8"
                />
              ) : (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {upcoming.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Checkbox
                        checked={false}
                        onChange={() =>
                          updateTodo.mutate({
                            id: t.id,
                            patch: { status: "done" },
                          })
                        }
                        label={`Complete "${t.title}"`}
                      />
                      <Link
                        to={`/todos?task=${t.id}`}
                        className="min-w-0 flex-1 truncate text-sm hover:underline"
                      >
                        {t.title}
                      </Link>
                      <PriorityBadge priority={t.priority} />
                      <span className="w-20 text-right">
                        <DueDate date={t.dueDate} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

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
                          <span className="text-base leading-6">{f.icon}</span>
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
              <NetworkCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
