import { useState } from "react";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useShare } from "../../hooks/useCollab";
import { useUserSearch } from "../../hooks/useSocial";
import { useDebouncedValue } from "../../hooks/useUtils";
import {
  Avatar,
  Badge,
  Button,
  Input,
  MockBadge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  Skeleton,
  Spinner,
} from "../ui";
import { EMAIL_RE } from "../../lib/validation";
import { VISIBILITY, ROLE_LABELS } from "./visibility";

function InviteBox({ share, existingIds }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [role, setRole] = useState("edit");
  const [picked, setPicked] = useState(null);
  const q = useDebouncedValue(text.trim(), 250);
  const isEmail = EMAIL_RE.test(text.trim());
  // Suggestions come from the real GET /user/users endpoint.
  const search = useUserSearch(q, { enabled: !!q && !isEmail && !picked });
  const suggestions = (search.data ?? [])
    .filter((u) => u.id !== user.id && !existingIds.has(u.id))
    .slice(0, 5);

  const invite = () => {
    const payload = picked
      ? { userId: picked.id, name: picked.name, role }
      : isEmail
        ? { email: text.trim(), name: text.trim(), role }
        : null;
    if (!payload) return;
    share.add.mutate(payload, {
      onSuccess: () => {
        toast.success(`Added ${payload.name} to the share list`, {
          description:
            "Saved locally. No invitation was sent — the sharing API doesn't exist yet.",
        });
        setText("");
        setPicked(null);
      },
    });
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          {picked ? (
            <div className="flex h-8 items-center gap-2 rounded-md border border-accent bg-subtle px-2">
              <Avatar user={picked} size="xs" />
              <span className="flex-1 truncate text-sm">{picked.name}</span>
              <button
                onClick={() => setPicked(null)}
                aria-label="Clear"
                className="text-faint hover:text-fg"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite()}
              placeholder="Add people by name or email"
              aria-label="Invite"
            />
          )}
          {!picked && q && !isEmail && (
            <div className="absolute inset-x-0 top-9 z-10 rounded-md bg-elevated p-1 shadow-menu">
              {search.isLoading ? (
                <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted">
                  <Spinner className="size-3.5" /> Searching people…
                </div>
              ) : search.error ? (
                <p className="px-2 py-2 text-sm text-danger">
                  {search.error.message}
                </p>
              ) : suggestions.length ? (
                suggestions.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setPicked(u)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-hover"
                  >
                    <Avatar user={u} size="sm" />
                    <span className="truncate">{u.name}</span>
                  </button>
                ))
              ) : (
                <p className="px-2 py-2 text-sm text-muted">
                  No people found. Enter an email address instead.
                </p>
              )}
            </div>
          )}
        </div>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-35"
          aria-label="Role"
        >
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
        <Button
          variant="primary"
          onClick={invite}
          disabled={!picked && !isEmail}
          loading={share.add.isPending}
        >
          Invite
        </Button>
      </div>
    </div>
  );
}

/**
 * Share popover (Notion style). Visibility is saved on the resource via
 * `onVisibilityChange`; collaborators are stored by the sharing mock.
 */
export function ShareDialog({
  resourceType,
  resource,
  onVisibilityChange,
  trigger,
}) {
  const { user } = useAuth();
  const share = useShare(resourceType, resource.id);
  const collaborators = share.data?.collaborators ?? [];
  const existingIds = new Set(
    collaborators.map((c) => c.userId).filter(Boolean),
  );
  const V = VISIBILITY[resource.visibility] ?? VISIBILITY.private;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${resourceType === "note" ? "notes" : "diagrams"}/${resource.id}`,
      );
      toast.success("Link copied", {
        description:
          "Others can't open it until sharing is implemented on the backend.",
      });
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  };

  return (
    <Popover>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(30rem,calc(100vw-1rem))] p-0"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-sm font-medium">Share</p>
          <MockBadge
            label="Simulated sharing"
            detail="Collaborators and visibility are saved in this browser only. Nobody is notified and nobody else can open the page yet."
          />
        </div>

        <div className="space-y-4 p-4">
          <InviteBox share={share} existingIds={existingIds} />

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">
              People with access
            </p>
            <ul className="space-y-0.5">
              <li className="flex items-center gap-2.5 py-1">
                <Avatar user={user} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {user.name} <span className="text-faint">(you)</span>
                  </p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <span className="text-xs text-muted">Full access</span>
              </li>
              {share.isLoading && <Skeleton className="h-8" />}
              {collaborators.map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 py-1">
                  <Avatar
                    user={{ id: c.userId ?? c.email, name: c.name }}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm">
                      {c.name}
                      {c.simulated && (
                        <Badge className="text-[10px]">sample</Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {c.email ?? "Nexid user"} · Pending (not sent)
                    </p>
                  </div>
                  <Select
                    value={c.role}
                    onChange={(e) =>
                      share.setRole.mutate({ cid: c.id, role: e.target.value })
                    }
                    className="h-7 w-33 text-xs"
                    aria-label={`Role for ${c.name}`}
                  >
                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                  <button
                    onClick={() => share.remove.mutate(c.id)}
                    className="rounded p-1 text-faint hover:bg-hover hover:text-danger"
                    aria-label={`Remove ${c.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">
              General access
            </p>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-hover">
                <V.icon className="size-4 text-muted" />
              </span>
              <div className="min-w-0 flex-1">
                <Select
                  value={resource.visibility}
                  onChange={(e) => onVisibilityChange(e.target.value)}
                  className="h-7 w-36 border-transparent bg-transparent px-1 font-medium hover:bg-hover"
                  aria-label="Visibility"
                >
                  {Object.entries(VISIBILITY).map(([v, o]) => (
                    <option key={v} value={v}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <p className="px-1 text-xs text-muted">{V.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <p className="text-xs text-faint">Roles: view · comment · edit</p>
          <Button size="sm" icon={Link2} onClick={copyLink}>
            Copy link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
