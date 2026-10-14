import { useState } from "react";
import { Link } from "react-router";
import { Check, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFollow } from "../../hooks/useSocial";
import { Button } from "../ui";

export function FollowButton({ user, size = "sm" }) {
  const { user: me } = useAuth();
  const { isFollowing, isKnown, isPending, toggle } = useFollow(user);
  const [hover, setHover] = useState(false);

  if (user.id === me.id)
    return (
      <Link to="/settings">
        <Button size={size}>Edit profile</Button>
      </Link>
    );

  if (isFollowing)
    return (
      <Button
        size={size}
        variant={hover ? "danger-ghost" : "secondary"}
        icon={hover ? undefined : Check}
        loading={isPending}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => {
          e.preventDefault();
          toggle();
        }}
        className="min-w-24"
        aria-label={`Unfollow ${user.name}`}
      >
        {hover ? "Unfollow" : "Following"}
      </Button>
    );

  return (
    <Button
      size={size}
      variant="primary"
      icon={UserPlus}
      loading={isPending}
      disabled={!isKnown}
      onClick={(e) => {
        e.preventDefault();
        toggle();
      }}
      className="min-w-24"
    >
      Follow
    </Button>
  );
}
