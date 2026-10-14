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

/** Follow state for one user derived from GET /follow/following, plus a toggle. */
export function useFollow(user) {
  const queryClient = useQueryClient();
  const following = useMyFollowing();
  const isFollowing = !!following.data?.some((u) => u.id === user?.id);

  const mutation = useMutation({
    mutationFn: (next) =>
      next ? followApi.follow(user.id) : followApi.unfollow(user.id),
    onSuccess: (_res, next) => {
      toast.success(
        next ? `You're now following ${user.name}` : `Unfollowed ${user.name}`,
      );
    },
    onError: (err, next) =>
      toast.error(
        `Couldn't ${next ? "follow" : "unfollow"} ${user.name}: ${err.message}`,
      ),
    // Always re-read the truth from the server rather than guessing.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.myFollowing });
      queryClient.invalidateQueries({ queryKey: qk.myFollowers });
    },
  });

  return {
    isFollowing,
    isKnown: following.isSuccess,
    isPending: mutation.isPending || following.isFetching,
    toggle: () => mutation.mutate(!isFollowing),
  };
}
