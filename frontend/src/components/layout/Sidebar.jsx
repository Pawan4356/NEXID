import { NavLink, useNavigate } from "react-router";
import { ChevronsLeft, ChevronsUpDown, CheckSquare, Home, LogOut, Moon, Monitor, PenTool, Plus, Search, Settings, Sun, User, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useShell } from "./AppShell";
import { NoteTree } from "../notes/NoteTree";
import { useCreateNote, useNotes } from "../../hooks/useNotes";
import { useDiagrams } from "../../hooks/useDiagrams";
import { Avatar, IconButton, Kbd, Menu, MenuContent, MenuItem, MenuLabel, MenuRadioGroup, MenuSeparator, MenuTrigger, SubMenu, Tooltip } from "../ui";
import { cn, modKey } from "../../lib/utils";

export const navItemCls = (active) =>
  cn(
    "group flex h-[30px] w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-muted transition-colors hover:bg-hover",
    active && "bg-active text-fg",
  );

function NavItem({ to, icon: Icon, children, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => navItemCls(isActive)}>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.7} />
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

export function SidebarSection({ title, action, children }) {
  return (
    <div className="mt-4">
      <div className="group/section flex h-7 items-center justify-between px-2">
        <span className="text-xs font-medium text-faint">{title}</span>
        {action && <div className="opacity-0 transition-opacity group-hover/section:opacity-100 focus-within:opacity-100">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function WorkspaceMenu() {
  const { user, logout } = useAuth();
  const { preference, setTheme } = useTheme();
  const navigate = useNavigate();
  const first = user?.name?.split(" ")[0] ?? "My";

  const onLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      toast.error(`Couldn't log out: ${err.message}`);
    }
  };

  return (
    <Menu>
      <MenuTrigger>
        <button className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left hover:bg-hover">
          <Avatar user={user} size="sm" />
          <span className="truncate text-sm font-medium">{first}&rsquo;s Nexid</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-faint" />
        </button>
      </MenuTrigger>
      <MenuContent className="w-64">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
        </div>
        <MenuSeparator />
        <MenuItem icon={User} onSelect={() => navigate(`/people/${user.id}`)}>
          Your profile
        </MenuItem>
        <MenuItem icon={Settings} onSelect={() => navigate("/settings")}>
          Settings
        </MenuItem>
        <SubMenu icon={preference === "dark" ? Moon : preference === "light" ? Sun : Monitor} label="Theme">
          <MenuRadioGroup
            value={preference}
            onValueChange={setTheme}
            options={[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ]}
          />
        </SubMenu>
        <MenuSeparator />
        <MenuLabel>Signed in via the Nexid API</MenuLabel>
        <MenuItem icon={LogOut} onSelect={onLogout}>
          Log out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function Favorites() {
  const { data: notes = [] } = useNotes();
  const { data: diagrams = [] } = useDiagrams();
  const items = [
    ...notes.filter((n) => n.isFavorite).map((n) => ({ id: n.id, to: `/notes/${n.id}`, icon: n.icon, title: n.title })),
    ...diagrams.filter((d) => d.isFavorite).map((d) => ({ id: d.id, to: `/diagrams/${d.id}`, lucide: PenTool, title: d.title })),
  ];
  if (!items.length) return null;
  return (
    <SidebarSection title="Favorites">
      {items.map((it) => (
        <NavLink key={it.id} to={it.to} className={({ isActive }) => navItemCls(isActive)}>
          <span className="flex size-[18px] shrink-0 items-center justify-center text-[15px]">
            {it.lucide ? <it.lucide className="size-4" strokeWidth={1.7} /> : it.icon}
          </span>
          <span className="truncate">{it.title || "Untitled"}</span>
        </NavLink>
      ))}
    </SidebarSection>
  );
}

export function Sidebar() {
  const { toggleSidebar, openSearch } = useShell();
  const createNote = useCreateNote();
  const navigate = useNavigate();

  const newPage = () => createNote.mutate({}, { onSuccess: (n) => navigate(`/notes/${n.id}`) });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 px-2 pt-2">
        <WorkspaceMenu />
        <Tooltip content={<>Close sidebar <Kbd>{modKey}+\</Kbd></>}>
          <IconButton icon={ChevronsLeft} label="Close sidebar" onClick={toggleSidebar} />
        </Tooltip>
      </div>

      <nav className="space-y-px px-2 pt-2">
        <button onClick={openSearch} className={navItemCls(false)}>
          <Search className="size-[18px] shrink-0" strokeWidth={1.7} />
          <span className="flex-1">Search</span>
          <Kbd>{modKey}K</Kbd>
        </button>
        <NavItem to="/" icon={Home} end>
          Home
        </NavItem>
        <NavItem to="/todos" icon={CheckSquare}>
          Todos
        </NavItem>
        <NavItem to="/diagrams" icon={PenTool}>
          Diagrams
        </NavItem>
        <NavItem to="/people" icon={Users}>
          People
        </NavItem>
      </nav>

      <div className="mt-1 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <Favorites />
        <SidebarSection
          title={
            <NavLink to="/notes" className="hover:text-muted">
              Pages
            </NavLink>
          }
          action={<IconButton icon={Plus} size="sm" label="New page" onClick={newPage} />}
        >
          <NoteTree />
        </SidebarSection>
      </div>

      <div className="space-y-px border-t border-line px-2 py-2">
        <NavItem to="/settings" icon={Settings}>
          Settings
        </NavItem>
        <button onClick={newPage} disabled={createNote.isPending} className={navItemCls(false)}>
          <Plus className="size-[18px] shrink-0" strokeWidth={1.7} />
          New page
        </button>
      </div>
    </div>
  );
}
