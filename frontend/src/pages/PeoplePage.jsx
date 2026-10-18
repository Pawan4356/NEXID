import { useSearchParams } from "react-router";
import { Search, UserSearch, Users } from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { UserRow, UserRowSkeleton } from "../components/social/UserRow";
import { EmptyState, ErrorState, Spinner } from "../components/ui";
import {
  useMyFollowers,
  useMyFollowing,
  useUserSearch,
} from "../hooks/useSocial";
import { useDebouncedValue } from "../hooks/useUtils";
import { cn } from "../lib/utils";

const TABS = {
  discover: "Discover",
  following: "Following",
  followers: "Followers",
};

export default function PeoplePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tab = TABS[params.get("tab")] ? params.get("tab") : "discover";
  const debounced = useDebouncedValue(q.trim(), 300);

  const search = useUserSearch(debounced, { enabled: tab === "discover" });
  const followers = useMyFollowers();
  const following = useMyFollowing();
  const followerIds = new Set((followers.data ?? []).map((u) => u.id));

  const source =
    tab === "discover" ? search : tab === "following" ? following : followers;
  const needle = q.trim().toLowerCase();
  // Server filters "discover"; the follow lists are filtered client-side.
  const users = (source.data ?? []).filter(
    (u) =>
      tab === "discover" || !needle || u.name.toLowerCase().includes(needle),
  );

  const set = (k, v) =>
    setParams(
      (p) => {
        v ? p.set(k, v) : p.delete(k);
        return p;
      },
      { replace: true },
    );

  return (
    <div className="flex h-full flex-col">
      <Topbar
        crumbs={[{ label: "People", icon: <Users className="size-4" /> }]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto max-w-2xl px-6 pt-10 pb-24">
          <h1 className="text-[32px] font-bold tracking-tight">People</h1>
          <p className="mt-1 text-sm text-muted">
            Find people on Nexid and follow them. Following someone who follows
            you back makes you friends.
          </p>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => set("q", e.target.value)}
              placeholder={
                tab === "discover"
                  ? "Search by name"
                  : `Filter ${TABS[tab].toLowerCase()}`
              }
              aria-label="Search people"
              autoFocus
              className="h-10 w-full rounded-lg border border-line-strong bg-subtle pr-10 pl-9 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            />
            {source.isFetching && !source.isLoading && (
              <Spinner className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
            )}
          </div>

          <div className="mt-4 flex gap-1 border-b border-line">
            {Object.entries(TABS).map(([k, label]) => {
              const count =
                k === "following"
                  ? following.data?.length
                  : k === "followers"
                    ? followers.data?.length
                    : undefined;
              return (
                <button
                  key={k}
                  onClick={() => set("tab", k === "discover" ? null : k)}
                  className={cn(
                    "-mb-px border-b-2 px-2 pb-2 text-sm font-medium",
                    tab === k
                      ? "border-fg text-fg"
                      : "border-transparent text-muted hover:text-fg",
                  )}
                >
                  {label}
                  {count !== undefined && (
                    <span className="ml-1.5 text-faint">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2">
            {source.isLoading ? (
              <ul>
                {[0, 1, 2, 3].map((i) => (
                  <UserRowSkeleton key={i} />
                ))}
              </ul>
            ) : source.error ? (
              <ErrorState
                error={source.error}
                onRetry={source.refetch}
                title="Couldn't load people"
              />
            ) : users.length === 0 ? (
              <EmptyState
                icon={UserSearch}
                title={
                  tab === "discover"
                    ? q
                      ? `No one named “${q}”`
                      : "No users yet"
                    : tab === "following"
                      ? needle
                        ? "No matches"
                        : "You're not following anyone yet"
                      : needle
                        ? "No matches"
                        : "No followers yet"
                }
                description={
                  tab === "discover"
                    ? "Search matches the start of a name."
                    : tab === "following"
                      ? "Discover people and follow them to see them here."
                      : "When people follow you, they'll appear here."
                }
              />
            ) : (
              <ul className="space-y-0.5">
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    followsYou={followerIds.has(u.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
