// REAL backend: user lookup, search and follow relationships.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { followApi, userApi } from "../services/api";
import { qk } from "../lib/queryKeys";

export const useUser = (id) =>
  useQuery({
    queryKey: qk.user(id),
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
    retry: false,
  });

export const useUserSearch = (q, { enabled = true } = {}) =>
  useQuery({
    queryKey: qk.userSearch(q),
    queryFn: ({ signal }) => userApi.searchUsers(q, { signal }),
    enabled,
    placeholderData: (prev) => prev,
  });

export const useMyFollowers = () =>
  useQuery({ queryKey: qk.myFollowers, queryFn: followApi.getMyFollowers });
export const useMyFollowing = () =>
  useQuery({ queryKey: qk.myFollowing, queryFn: followApi.getMyFollowing });
export const useFollowers = (userId) =>
  useQuery({
    queryKey: qk.followers(userId),
    queryFn: () => followApi.getFollowers(userId),
    enabled: !!userId,
  });
export const useFollowing = (userId) =>
  useQuery({
    queryKey: qk.following(userId),
    queryFn: () => followApi.getFollowing(userId),
    enabled: !!userId,
  });

/** Follow state for one user derived from GET /follow/following, plus a toggle. */
export function useFollow(user) {
  const queryClient = useQueryClient();
  const following = useMyFollowing();
  const isFollowing = !!following.data?.some((u) => u.id === user?.id);

  const mutation = useMutation({
    mutationFn: (next) =>
      next ? followApi.follow(user.id) : followApi.unfollow(user.id),
    onSuccess: (_res, next) => {
      queryClient.setQueryData(qk.myFollowing, (current = []) =>
        next
          ? current.some((item) => item.id === user.id)
            ? current
            : [...current, user]
          : current.filter((item) => item.id !== user.id),
      );
      toast.success(
        next ? `You're now following ${user.name}` : `Unfollowed ${user.name}`,
      );
    },
    onError: (err, next) =>
      toast.error(
        `Couldn't ${next ? "follow" : "unfollow"} ${user.name}: ${err.message}`,
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.followers(user.id) });
    },
  });

  return {
    isFollowing,
    isKnown: following.isSuccess,
    isPending: mutation.isPending,
    toggle: () => mutation.mutate(!isFollowing),
  };
}
