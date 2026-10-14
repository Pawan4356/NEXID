import { useState } from "react";
import { Check, MessageSquare, RotateCcw, Trash2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useComments } from "../../hooks/useCollab";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  IconButton,
  Kbd,
  MockBadge,
  Skeleton,
  Textarea,
} from "../ui";
import { cn, modKey, timeAgo } from "../../lib/utils";

export function CommentsPanel({ resourceType, resourceId, onClose }) {
  const { user } = useAuth();
  const comments = useComments(resourceType, resourceId);
  const [tab, setTab] = useState("open");
  const [draft, setDraft] = useState("");
  const list = (comments.data ?? []).filter((c) =>
    tab === "open" ? !c.resolved : c.resolved,
  );

  const submit = () => {
    if (!draft.trim()) return;
    comments.add.mutate(draft, { onSuccess: () => setDraft("") });
  };

  return (
    <aside
      className="flex w-full flex-col border-l border-line bg-bg sm:w-80"
      aria-label="Comments"
    >
      <div className="flex h-11 items-center gap-2 border-b border-line px-3">
        <p className="text-sm font-medium">Comments</p>
        <MockBadge
          label="Local mock"
          detail="Comments are stored in this browser. Replies from other people are pre-written samples."
        />
        <IconButton
          icon={X}
          label="Close comments"
          className="ml-auto"
          onClick={onClose}
        />
      </div>
      <div className="flex gap-1 border-b border-line px-3 py-1.5">
        {["open", "resolved"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium capitalize",
              tab === t ? "bg-active text-fg" : "text-muted hover:bg-hover",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {comments.isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={tab === "open" ? "No open comments" : "No resolved comments"}
            description={
              tab === "open"
                ? "Start a discussion about this page below."
                : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((c) => (
              <li key={c.id} className="group px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar user={c.author} size="sm" />
                  <span className="truncate text-sm font-medium">
                    {c.author.name}
                  </span>
                  {c.author.simulated && (
                    <Badge className="text-[10px]">sample</Badge>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-faint">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1.5 pl-8 text-sm leading-relaxed whitespace-pre-wrap">
                  {c.body}
                </p>
                <div className="mt-1 flex gap-1 pl-7 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={c.resolved ? RotateCcw : Check}
                    onClick={() =>
                      comments.resolve.mutate({
                        cid: c.id,
                        resolved: !c.resolved,
                      })
                    }
                  >
                    {c.resolved ? "Reopen" : "Resolve"}
                  </Button>
                  {c.author.id === user.id && (
                    <Button
                      size="xs"
                      variant="danger-ghost"
                      icon={Trash2}
                      onClick={() => comments.remove.mutate(c.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex gap-2">
          <Avatar user={user} size="sm" className="mt-1" />
          <div className="flex-1">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) =>
                (e.metaKey || e.ctrlKey) && e.key === "Enter" && submit()
              }
              placeholder="Add a comment…"
              className="min-h-16 resize-none"
              aria-label="New comment"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-faint">
                <Kbd>{modKey}</Kbd> <Kbd>Enter</Kbd>
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={submit}
                disabled={!draft.trim()}
                loading={comments.add.isPending}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
