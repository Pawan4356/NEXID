import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { useHotkey, useLocalStorageState } from "../../hooks/useUtils";
import { cn } from "../../lib/utils";

const ShellContext = createContext(null);
export const useShell = () => useContext(ShellContext);

const MOBILE = "(max-width: 768px)";

export function AppShell() {
  const [collapsed, setCollapsed] = useLocalStorageState(
    "nexid.sidebarCollapsed",
    false,
  );
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE).matches,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const m = window.matchMedia(MOBILE);
    const onChange = (e) => setIsMobile(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  // Close the mobile drawer after navigating.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }, [isMobile, setCollapsed]);

  useHotkey("\\", toggleSidebar);
  useHotkey("k", () => setSearchOpen((o) => !o));

  const sidebarVisible = isMobile ? mobileOpen : !collapsed;

  const value = useMemo(
    () => ({
      sidebarVisible,
      isMobile,
      toggleSidebar,
      openSearch: () => setSearchOpen(true),
    }),
    [sidebarVisible, isMobile, toggleSidebar],
  );

  return (
    <ShellContext.Provider value={value}>
      <div className="flex h-full overflow-hidden">
        {isMobile && mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          className={cn(
            "z-40 h-full w-60 shrink-0 border-r border-line bg-sidebar transition-[margin,transform] duration-200",
            isMobile ? "fixed inset-y-0 left-0 shadow-xl" : "relative",
            isMobile
              ? mobileOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : collapsed
                ? "-ml-60"
                : "ml-0",
          )}
          aria-hidden={!sidebarVisible}
          inert={!sidebarVisible || undefined}
        >
          <Sidebar />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </ShellContext.Provider>
  );
}
