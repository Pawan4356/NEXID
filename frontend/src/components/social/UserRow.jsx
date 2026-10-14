import { Link } from "react-router";
import { Avatar, Badge, Skeleton } from "../ui";
import { FollowButton } from "./FollowButton";
import { useAuth } from "../../context/AuthContext";

export function UserRow({ user, followsYou }) {
  const { user: me } = useAuth();
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-hover">
      <Link
        to={`/people/${user.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Avatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            {user.name}
            {user.id === me.id && <Badge>You</Badge>}
            {followsYou && user.id !== me.id && <Badge>Follows you</Badge>}
          </p>
          <p className="truncate text-xs text-muted">
            {user.bio || "No bio yet"}
          </p>
        </div>
      </Link>
      {user.id !== me.id && <FollowButton user={user} />}
    </li>
  );
}

export const UserRowSkeleton = () => (
  <li className="flex items-center gap-3 px-3 py-2.5">
    <Skeleton className="size-8 rounded-full" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
    <Skeleton className="h-7 w-24" />
  </li>
);
