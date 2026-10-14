import { CalendarDays } from "lucide-react";
import { Badge } from "../ui";
import { describeDue } from "../../lib/utils";
import { PRIORITY, STATUS } from "./meta";

export function StatusBadge({ status }) {
  const s = STATUS[status];
  return (
    <Badge tone={s.tone}>
      <s.icon className="size-3" /> {s.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority];
  return (
    <Badge tone={p.tone}>
      <p.icon className="size-3" /> {p.label}
    </Badge>
  );
}

export function DueDate({ date, done }) {
  const d = describeDue(date);
  if (!d) return <span className="text-xs text-faint">—</span>;
  const tone = done ? "text-faint" : d.tone === "danger" ? "text-danger" : d.tone === "warning" ? "text-warning" : "text-muted";
  return (
    <span className={`inline-flex items-center gap-1 text-xs whitespace-nowrap ${tone}`}>
      <CalendarDays className="size-3.5" /> {d.label}
    </span>
  );
}
