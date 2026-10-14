import { useShare, useSimulatedPresence } from "../../hooks/useCollab";
import { Avatar, Tooltip } from "../ui";

/**
 * Avatars of (simulated) people on this page, Notion/Figma style. Only shown
 * once the page is shared, since nobody else could be on a private page.
 */
export function PresenceAvatars({ resourceType, resource }) {
  const share = useShare(resourceType, resource.id);
  const shared =
    resource.visibility !== "private" ||
    (share.data?.collaborators.length ?? 0) > 0;
  const people = useSimulatedPresence(shared ? resource.id : null);
  if (!people.length) return null;
  const active = people.filter((p) => p.activity !== "idle");
  const editing = people.find((p) => p.activity === "editing");
  return (
    <div className="hidden items-center gap-2 sm:flex">
      {editing && (
        <span className="text-xs text-faint" aria-live="polite">
          {editing.name.split(" ")[0]} is editing…
        </span>
      )}
      <Tooltip
        content={
          <div className="space-y-0.5">
            {people.map((p) => (
              <p key={p.id}>
                {p.name} — {p.activity}
              </p>
            ))}
            <p className="pt-1 text-white/60">
              Simulated presence. No realtime backend yet.
            </p>
          </div>
        }
      >
        <div
          className="flex -space-x-1.5"
          aria-label={`${active.length} simulated collaborators active`}
        >
          {people.map((p) => (
            <Avatar
              key={p.id}
              user={p}
              size="sm"
              ring
              presence={p.activity}
              className={p.activity === "idle" ? "opacity-50" : ""}
            />
          ))}
        </div>
      </Tooltip>
    </div>
  );
}
