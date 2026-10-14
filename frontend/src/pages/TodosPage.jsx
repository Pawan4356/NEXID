import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  CheckSquare,
  Filter,
  KanbanSquare,
  Plus,
  Search,
  Table2,
  X,
} from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { TodoBoard, TodoTable } from "../components/todos/TodoViews";
import { TodoDialog } from "../components/todos/TodoDialog";
import { PRIORITY, STATUS } from "../components/todos/meta";
import {
  Button,
  EmptyState,
  ErrorState,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuLabel,
  MenuRadioGroup,
  MenuSeparator,
  MenuTrigger,
  MockBadge,
  Skeleton,
} from "../components/ui";
import { useTodos } from "../hooks/useTodos";
import { addDaysStr, cn, todayStr } from "../lib/utils";

const DUE = {
  any: { label: "Any time" },
  overdue: { label: "Overdue", test: (d) => d && d < todayStr() },
  today: { label: "Due today", test: (d) => d === todayStr() },
  week: {
    label: "Next 7 days",
    test: (d) => d && d >= todayStr() && d <= addDaysStr(7),
  },
  none: { label: "No due date", test: (d) => !d },
};

const SORTS = {
  manual: { label: "Newest first", fn: () => 0 },
  due: {
    label: "Due date",
    fn: (a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
  },
  priority: {
    label: "Priority",
    fn: (a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank,
  },
};

export default function TodosPage() {
  const { data: todos = [], isLoading, error, refetch } = useTodos();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "board" ? "board" : "table";
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [due, setDue] = useState("any");
  const [sort, setSort] = useState("manual");
  const [hideDone, setHideDone] = useState(false);

  const editingId = params.get("task");
  const creating = params.get("new") === "1";
  const editing = todos.find((t) => t.id === editingId) ?? null;
  const setParam = (k, v) =>
    setParams(
      (p) => {
        v == null ? p.delete(k) : p.set(k, v);
        return p;
      },
      { replace: true },
    );
  const closeDialog = () =>
    setParams(
      (p) => {
        p.delete("task");
        p.delete("new");
        return p;
      },
      { replace: true },
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return todos
      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      )
      .filter((t) => !statuses.length || statuses.includes(t.status))
      .filter((t) => !priorities.length || priorities.includes(t.priority))
      .filter((t) => !DUE[due].test || DUE[due].test(t.dueDate))
      .filter((t) => !hideDone || t.status !== "done")
      .sort(SORTS[sort].fn);
  }, [todos, query, statuses, priorities, due, sort, hideDone]);

  const activeFilters =
    statuses.length + priorities.length + (due !== "any") + hideDone;
  const clearFilters = () => {
    setStatuses([]);
    setPriorities([]);
    setDue("any");
    setHideDone(false);
    setQuery("");
  };
  const toggleIn = (setter) => (v) =>
    setter((arr) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    );
  const open = todos.filter((t) => t.status !== "done").length;
  const overdue = todos.filter(
    (t) => t.status !== "done" && DUE.overdue.test(t.dueDate),
  ).length;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        crumbs={[{ label: "Todos", icon: <CheckSquare className="size-4" /> }]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 pt-10 pb-24 sm:px-12">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight">Todos</h1>
              <p className="mt-1 text-sm text-muted">
                {open} open
                {overdue > 0 && (
                  <span className="text-danger"> · {overdue} overdue</span>
                )}
              </p>
            </div>
            <MockBadge
              className="mb-1.5"
              detail="Tasks are stored in this browser. The todos API doesn't exist yet."
            />
          </div>

          {/* View tabs + toolbar (Notion database style) */}
          <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-line pb-1.5">
            {[
              ["table", Table2, "Table"],
              ["board", KanbanSquare, "Board"],
            ].map(([v, Icon, label]) => (
              <button
                key={v}
                onClick={() => setParam("view", v === "table" ? null : v)}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-md px-2 text-sm font-medium",
                  view === v
                    ? "bg-active text-fg"
                    : "text-muted hover:bg-hover",
                )}
                aria-pressed={view === v}
              >
                <Icon className="size-4" strokeWidth={1.8} /> {label}
              </button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks"
                  aria-label="Search tasks"
                  className="h-7 w-40 rounded-md bg-transparent pr-2 pl-7 text-sm outline-none placeholder:text-faint hover:bg-hover focus:bg-hover"
                />
              </div>
              <Menu>
                <MenuTrigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Filter}
                    className={activeFilters ? "text-accent" : ""}
                  >
                    Filter{activeFilters ? ` · ${activeFilters}` : ""}
                  </Button>
                </MenuTrigger>
                <MenuContent align="end" className="w-56">
                  <MenuLabel>Status</MenuLabel>
                  {Object.entries(STATUS).map(([v, s]) => (
                    <MenuCheckboxItem
                      key={v}
                      icon={s.icon}
                      checked={statuses.includes(v)}
                      onCheckedChange={() => toggleIn(setStatuses)(v)}
                    >
                      {s.label}
                    </MenuCheckboxItem>
                  ))}
                  <MenuSeparator />
                  <MenuLabel>Priority</MenuLabel>
                  {Object.entries(PRIORITY).map(([v, p]) => (
                    <MenuCheckboxItem
                      key={v}
                      icon={p.icon}
                      checked={priorities.includes(v)}
                      onCheckedChange={() => toggleIn(setPriorities)(v)}
                    >
                      {p.label}
                    </MenuCheckboxItem>
                  ))}
                  <MenuSeparator />
                  <MenuLabel>Due</MenuLabel>
                  <MenuRadioGroup
                    value={due}
                    onValueChange={setDue}
                    options={Object.entries(DUE).map(([value, d]) => ({
                      value,
                      label: d.label,
                    }))}
                  />
                  <MenuSeparator />
                  <MenuCheckboxItem
                    checked={hideDone}
                    onCheckedChange={setHideDone}
                  >
                    Hide completed
                  </MenuCheckboxItem>
                </MenuContent>
              </Menu>
              <Menu>
                <MenuTrigger>
                  <Button size="sm" variant="ghost">
                    Sort: {SORTS[sort].label}
                  </Button>
                </MenuTrigger>
                <MenuContent align="end">
                  <MenuRadioGroup
                    value={sort}
                    onValueChange={setSort}
                    options={Object.entries(SORTS).map(([value, s]) => ({
                      value,
                      label: s.label,
                    }))}
                  />
                </MenuContent>
              </Menu>
              <Button
                size="sm"
                variant="primary"
                icon={Plus}
                onClick={() => setParam("new", "1")}
              >
                New
              </Button>
            </div>
          </div>

          {activeFilters > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              Showing {filtered.length} of {todos.length}
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-0.5 rounded px-1 hover:bg-hover hover:text-fg"
              >
                <X className="size-3" /> Clear filters
              </button>
            </div>
          )}

          <div className="mt-3">
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9" />
                ))}
              </div>
            ) : error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : todos.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks yet"
                description="Capture what needs doing. Tasks can link to a page."
                action={
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => setParam("new", "1")}
                  >
                    New task
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Filter}
                title="No tasks match these filters"
                action={<Button onClick={clearFilters}>Clear filters</Button>}
              />
            ) : view === "board" ? (
              <TodoBoard
                todos={filtered}
                onOpen={(t) => setParam("task", t.id)}
              />
            ) : (
              <TodoTable
                todos={filtered}
                onOpen={(t) => setParam("task", t.id)}
              />
            )}
          </div>
        </div>
      </div>
      <TodoDialog
        open={creating || !!editing}
        onOpenChange={(o) => !o && closeDialog()}
        todo={editing}
      />
    </div>
  );
}
