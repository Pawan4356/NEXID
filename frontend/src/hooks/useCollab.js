// LOCAL MOCK + SIMULATION: sharing, comments, presence.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commentsApi, sharingApi } from "../services/api";
import { presenceFor } from "../services/mock";
import { qk } from "../lib/queryKeys";

export function useShare(type, id) {
  const qc = useQueryClient();
  const key = qk.share(type, id);
  const query = useQuery({
    queryKey: key,
    queryFn: () => sharingApi.get(type, id),
    enabled: !!id,
  });
  const set = (data) => qc.setQueryData(key, data);
  const fail = (err) => toast.error(err.message);
  return {
    ...query,
    add: useMutation({
      mutationFn: (collaborator) => sharingApi.add(type, id, collaborator),
      onSuccess: set,
      onError: fail,
    }),
    setRole: useMutation({
      mutationFn: ({ cid, role }) => sharingApi.updateRole(type, cid, role).then(() => sharingApi.get(type, id)),
      onSuccess: set,
      onError: fail,
    }),
    remove: useMutation({
      mutationFn: (cid) => sharingApi.remove(type, cid).then(() => sharingApi.get(type, id)),
      onSuccess: set,
      onError: fail,
    }),
  };
}

export function useComments(type, id) {
  const qc = useQueryClient();
  const key = qk.comments(type, id);
  const query = useQuery({
    queryKey: key,
    queryFn: () => commentsApi.list(type, id),
    enabled: !!id,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const fail = (err) => toast.error(err.message);
  return {
    ...query,
    add: useMutation({
      mutationFn: (body) => commentsApi.add(type, id, body),
      onSuccess: refresh,
      onError: fail,
    }),
    resolve: useMutation({
      mutationFn: ({ cid, resolved }) => commentsApi.setResolved(cid, resolved),
      onSuccess: refresh,
      onError: fail,
    }),
    remove: useMutation({
      mutationFn: commentsApi.remove,
      onSuccess: refresh,
      onError: fail,
    }),
  };
}

/** Simulated presence: rotates fake activity every few seconds. */
export function useSimulatedPresence(resourceId) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 7000);
    return () => clearInterval(t);
  }, []);
  return resourceId ? presenceFor(resourceId, tick) : [];
}
