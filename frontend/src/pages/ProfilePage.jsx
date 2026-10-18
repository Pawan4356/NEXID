import { Link, useParams, useSearchParams } from "react-router";
import { CalendarDays, FileText, Users } from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { NoteIcon } from "../components/notes/noteIcons";
import { FollowButton } from "../components/social/FollowButton";
import { UserRow, UserRowSkeleton } from "../components/social/UserRow";
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  MockBadge,
  Skeleton,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import {
  useFollowers,
  useFollowing,
  useMyFollowers,
  useMyFollowing,
  useUser,
} from "../hooks/useSocial";
import { useNotes, usePublicNotes } from "../hooks/useNotes";
import { cn, formatDate } from "../lib/utils";

function UserList({ query, emptyTitle, followerIds }) {
  if (query.isLoading)
    return (
      <ul>
        {[0, 1, 2].map((i) => (
          <UserRowSkeleton key={i} />
        ))}
      </ul>
    );
  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (!query.data.length) return <EmptyState icon={Users} title={emptyTitle} />;
  return (
    <ul className="space-y-0.5">
      {query.data.map((u) => (
        <UserRow key={u.id} user={u} followsYou={followerIds.has(u.id)} />
      ))}
    </ul>
  );
}

function PublicPages({ isMe, userId }) {
  const ownNotes = useNotes();
  const publicNotes = usePublicNotes(isMe ? null : userId);
  const notesQuery = isMe ? ownNotes : publicNotes;
  const { data: notes = [], isLoading } = notesQuery;
  if (notesQuery.error)
    return <ErrorState error={notesQuery.error} onRetry={notesQuery.refetch} />;
  if (isLoading) return <Skeleton className="h-16" />;
  const pub = notes.filter((n) => n.visibility === "public");
  if (!pub.length)
    return (
      <p className="text-sm text-muted">
        {isMe
          ? "None of your pages are public. Change visibility from a page's Share menu."
          : "This person hasn't published any public pages yet."}
      </p>
    );
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {pub.map((n) => (
        <li key={n.id}>
          <Link
            to={`/notes/${n.id}`}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 hover:bg-hover"
          >
            <NoteIcon name={n.icon} className="size-4" />
            <span className="truncate text-sm font-medium">
              {n.title || "Untitled"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ProfilePage() {
  const { userId: param } = useParams();
  const { user: me } = useAuth();
  const userId = param === "me" ? me.id : param;
  const isMe = userId === me.id;
  const [params, setParams] = useSearchParams();
  const tab = ["followers", "following"].includes(params.get("tab"))
    ? params.get("tab")
    : "overview";

  // Your own profile comes from GET /user/me (already loaded); others from GET /user/:userId.
  const other = useUser(isMe ? null : userId);
  const profile = isMe ? me : other.data;
  const followers = useMyFollowers();
  const following = useMyFollowing();
  const publicFollowers = useFollowers(isMe ? null : userId);
  const publicFollowing = useFollowing(isMe ? null : userId);
  const followersQuery = isMe ? followers : publicFollowers;
  const followingQuery = isMe ? following : publicFollowing;
  const followerIds = new Set((followers.data ?? []).map((u) => u.id));

  if (!isMe && other.isLoading)
    return (
      <div className="flex h-full flex-col">
        <Topbar crumbs={[{ label: "People", to: "/people" }]} />
        <div className="mx-auto w-full max-w-2xl space-y-3 px-6 pt-12">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    );

  if (!isMe && (other.error || !profile))
    return (
      <div className="flex h-full flex-col">
        <Topbar crumbs={[{ label: "People", to: "/people" }]} />
        {other.error?.status === 404 || other.error?.status === 400 ? (
          <EmptyState
            icon={Users}
            title="User not found"
            description="This profile doesn't exist or the link is malformed."
            action={
              <Link
                to="/people"
                className="text-sm text-accent hover:underline"
              >
                Browse people
              </Link>
            }
          />
        ) : (
          <ErrorState error={other.error} onRetry={other.refetch} />
        )}
      </div>
    );

  const tabs = [
    ["overview", "Overview"],
    ["followers", "Followers", followersQuery.data?.length],
    ["following", "Following", followingQuery.data?.length],
  ];

  return (
    <div className="flex h-full flex-col">
      <Topbar
        crumbs={[
          {
            label: "People",
            to: "/people",
            icon: <Users className="size-4" />,
          },
          { label: profile.name },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto max-w-2xl px-6 pt-12 pb-24">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar user={profile} size="xl" />
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight">
                {profile.name}
                {isMe && <Badge>You</Badge>}
                {!isMe && followerIds.has(profile.id) && (
                  <Badge>Follows you</Badge>
                )}
              </h1>
              {profile.bio ? (
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-faint">No bio yet.</p>
              )}
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> Joined{" "}
                  {formatDate(profile.createdAt, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {profile.gender && (
                  <span className="capitalize">{profile.gender}</span>
                )}
                {profile.age && <span>{profile.age} years</span>}
              </p>
            </div>
            <FollowButton user={profile} size="md" />
          </div>

          <div className="mt-8 flex gap-1 border-b border-line">
            {tabs.map(([k, label, count]) => (
              <button
                key={k}
                onClick={() =>
                  setParams(
                    (p) => {
                      k === "overview" ? p.delete("tab") : p.set("tab", k);
                      return p;
                    },
                    { replace: true },
                  )
                }
                className={cn(
                  "-mb-px border-b-2 px-2 pb-2 text-sm font-medium",
                  tab === k
                    ? "border-fg text-fg"
                    : "border-transparent text-muted hover:text-fg",
                )}
              >
                {label}
                {count != null && (
                  <span className="ml-1.5 text-faint">{count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === "overview" && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="size-4 text-muted" />
                  <h2 className="text-sm font-medium">Public pages</h2>
                  {isMe && <MockBadge />}
                </div>
                <PublicPages isMe={isMe} userId={userId} />
              </section>
            )}
            {tab === "followers" &&
              <UserList
                query={followersQuery}
                emptyTitle="No followers yet"
                followerIds={followerIds}
              />}
            {tab === "following" &&
              <UserList
                query={followingQuery}
                emptyTitle="You're not following anyone yet"
                followerIds={followerIds}
              />}
          </div>
        </div>
      </div>
    </div>
  );
}
