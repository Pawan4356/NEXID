import { NavLink, useNavigate } from "react-router";
import {
  ChevronsLeft,
  ChevronRight,
  Home,
  Moon,
  PenTool,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useShell } from "./AppShell";
import { NoteTree } from "../notes/NoteTree";
import { NoteIcon } from "../notes/noteIcons";
import { Logo } from "../../pages/AuthPages";
import { useCreateNote, useNotes } from "../../hooks/useNotes";
import { useDiagramMutations, useDiagrams } from "../../hooks/useDiagrams";
import { useLocalStorageState } from "../../hooks/useUtils";
import {
  Avatar,
  IconButton,
  Kbd,
  Tooltip,
} from "../ui";
import { cn, modKey } from "../../lib/utils";

export const navItemCls = (active) =>
  cn(
    "group flex h-[30px] w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-muted transition-colors hover:bg-hover",
    active && "bg-active text-fg",
  );

function NavItem({ to, icon: Icon, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => navItemCls(isActive)}
    >
      <Icon className="size-4.5 shrink-0" strokeWidth={1.7} />
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

export function SidebarSection({ title, action, children }) {
  return (
    <div className="mt-4">
      <div className="group/section flex h-7 items-center justify-between px-2">
        <span className="text-xs font-medium text-faint">{title}</span>
        {action && (
          <div className="opacity-0 transition-opacity group-hover/section:opacity-100 focus-within:opacity-100">
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function DisclosureSection({ title, to, open, onToggle, action, children }) {
  return (
    <section className="mt-3">
      <div className="flex h-8 items-center gap-1 px-1">
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
          aria-expanded={open}
          className="flex size-6 shrink-0 items-center justify-center rounded text-faint hover:bg-hover hover:text-muted"
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 transition-transform",
              open && "rotate-90",
            )}
          />
        </button>
        <NavLink
          to={to}
          className="min-w-0 flex-1 truncate rounded px-1 text-xs font-medium text-faint hover:bg-hover hover:text-muted"
        >
          {title}
        </NavLink>
        {action}
      </div>
      {open && children}
    </section>
  );
}

function WorkspaceHeader() {
  return (
    <div className="flex h-8 min-w-0 flex-1 items-center gap-2 px-1.5">
      <Logo className="size-6 text-fg" />
      <span className="truncate text-sm font-semibold">Nexid</span>
    </div>
  );
}

function Favorites() {
  const { data: notes = [] } = useNotes();
  const { data: diagrams = [] } = useDiagrams();
  const items = [
    ...notes
      .filter((n) => n.isFavorite)
      .map((n) => ({
        id: n.id,
        to: `/notes/${n.id}`,
        icon: n.icon,
        title: n.title,
      })),
    ...diagrams
      .filter((d) => d.isFavorite)
      .map((d) => ({
        id: d.id,
        to: `/diagrams/${d.id}`,
        lucide: PenTool,
        title: d.title,
      })),
  ];
  if (!items.length) return null;
  return (
    <SidebarSection title="Favorites">
      {items.map((it) => (
        <NavLink
          key={it.id}
          to={it.to}
          className={({ isActive }) => navItemCls(isActive)}
        >
          <span className="flex size-4.5 shrink-0 items-center justify-center text-[15px]">
            {it.lucide ? (
              <it.lucide className="size-4" strokeWidth={1.7} />
            ) : (
              <NoteIcon name={it.icon} className="size-4" />
            )}
          </span>
          <span className="truncate">{it.title || "Untitled"}</span>
        </NavLink>
      ))}
    </SidebarSection>
  );
}

function DiagramTree() {
  const { data: diagrams = [] } = useDiagrams();
  return (
    <div className="space-y-px">
      {diagrams.map((diagram) => (
        <NavLink
          key={diagram.id}
          to={`/diagrams/${diagram.id}`}
          className={({ isActive }) => navItemCls(isActive)}
        >
          <PenTool
            className="size-4 shrink-0 text-fg"
            strokeWidth={1.7}
          />
          <span className="truncate">
            {diagram.title || "Untitled diagram"}
          </span>
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { toggleSidebar, openSearch } = useShell();
  const { user } = useAuth();
  const { resolved, setTheme } = useTheme();
  const createNote = useCreateNote();
  const createDiagram = useDiagramMutations().create;
  const navigate = useNavigate();
  const [pagesOpen, setPagesOpen] = useLocalStorageState(
    "nexid.sidebarPagesOpen",
    false,
  );
  const [diagramsOpen, setDiagramsOpen] = useLocalStorageState(
    "nexid.sidebarDiagramsOpen",
    false,
  );

  const newPage = () =>
    createNote.mutate({}, { onSuccess: (n) => navigate(`/notes/${n.id}`) });
  const newDiagram = () =>
    createDiagram.mutate({}, { onSuccess: (d) => navigate(`/diagrams/${d.id}`) });
  const cycleTheme = () =>
    setTheme(resolved === "dark" ? "light" : "dark");
  const ThemeIcon = resolved === "dark" ? Moon : Sun;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 px-2 pt-2">
        <WorkspaceHeader />
        <Tooltip
          content={
            <>
              Close sidebar <Kbd>{modKey}+\</Kbd>
            </>
          }
        >
          <IconButton
            icon={ChevronsLeft}
            label="Close sidebar"
            onClick={toggleSidebar}
          />
        </Tooltip>
      </div>

      <nav className="space-y-px px-2 pt-2">
        <button onClick={openSearch} className={navItemCls(false)}>
          <Search className="size-4.5 shrink-0" strokeWidth={1.7} />
          <span className="flex-1">Search</span>
          <Kbd>{modKey}K</Kbd>
        </button>
        <NavItem to="/" icon={Home} end>
          Home
        </NavItem>
        <NavItem to="/people" icon={Users}>
          People
        </NavItem>
      </nav>

      <div className="mt-1 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <Favorites />
        <DisclosureSection
          title="Pages"
          to="/notes"
          open={pagesOpen}
          onToggle={() => setPagesOpen((open) => !open)}
          action={
            <IconButton
              icon={Plus}
              size="sm"
              label="New page"
              onClick={newPage}
            />
          }
        >
          <NoteTree />
        </DisclosureSection>
        <DisclosureSection
          title="Diagrams"
          to="/diagrams"
          open={diagramsOpen}
          onToggle={() => setDiagramsOpen((open) => !open)}
          action={
            <IconButton
              icon={Plus}
              size="sm"
              label="New diagram"
              onClick={newDiagram}
            />
          }
        >
          <DiagramTree />
        </DisclosureSection>
      </div>

      <div className="flex items-center gap-1 border-t border-line px-2 py-2">
        <NavLink
          to={user ? `/people/${user.id}` : "/people"}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-hover"
        >
          <Avatar user={user} size="sm" />
          <span className="truncate text-sm font-medium">
            {user?.name || "Profile"}
          </span>
        </NavLink>
        <IconButton
          icon={ThemeIcon}
          label="Change theme"
          onClick={cycleTheme}
        />
        <IconButton
          icon={Settings}
          label="Settings"
          onClick={() => navigate("/settings")}
        />
      </div>
    </div>
  );
}
