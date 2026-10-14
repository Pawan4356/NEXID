import { Link } from "react-router";
import { ChevronsRight, Menu as MenuIcon } from "lucide-react";
import { useShell } from "./AppShell";
import { IconButton, Kbd, Tooltip } from "../ui";
import { modKey } from "../../lib/utils";

/** Page header: breadcrumbs on the left, page actions on the right. */
export function Topbar({ crumbs = [], children }) {
  const { sidebarVisible, isMobile, toggleSidebar } = useShell();
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 px-3">
      {!sidebarVisible && (
        <Tooltip content={<>Open sidebar <Kbd>{modKey}+\</Kbd></>}>
          <IconButton icon={isMobile ? MenuIcon : ChevronsRight} label="Open sidebar" onClick={toggleSidebar} />
        </Tooltip>
      )}
      <Breadcrumbs crumbs={crumbs} />
      <div className="ml-auto flex shrink-0 items-center gap-1">{children}</div>
    </header>
  );
}

export function Breadcrumbs({ crumbs }) {
  // Collapse long chains: first … last two.
  const shown = crumbs.length > 4 ? [crumbs[0], { label: "…" }, ...crumbs.slice(-2)] : crumbs;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center text-sm">
      {shown.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center">
          {i > 0 && <span className="px-1 text-faint">/</span>}
          {c.to ? (
            <Link to={c.to} className="flex min-w-0 items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-fg/80 hover:bg-hover">
              {c.icon && <span className="shrink-0">{c.icon}</span>}
              <span className="truncate">{c.label}</span>
            </Link>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 truncate px-1.5 py-0.5">
              {c.icon && <span className="shrink-0">{c.icon}</span>}
              <span className="truncate">{c.label}</span>
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
