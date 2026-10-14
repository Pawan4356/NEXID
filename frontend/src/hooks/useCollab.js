// LOCAL MOCK + SIMULATION: sharing, comments, presence.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commentsMock, presenceFor, sharingMock } from "../services/mock";
import { qk } from "../lib/queryKeys";

export function useShare(type, id) {
  const qc = useQueryClient();
  const key = qk.share(type, id);
  const query = useQuery({ queryKey: key, queryFn: () => sharingMock.get(type, id), enabled: !!id });
  const set = (data) => qc.setQueryData(key, data);
  const fail = (err) => toast.error(err.message);
  return {
    ...query,
    add: useMutation({ mutationFn: (c) => sharingMock.addCollaborator(type, id, c), onSuccess: set, onError: fail }),
    setRole: useMutation({ mutationFn: ({ cid, role }) => sharingMock.updateRole(type, id, cid, role), onSuccess: set, onError: fail }),
    remove: useMutation({ mutationFn: (cid) => sharingMock.removeCollaborator(type, id, cid), onSuccess: set, onError: fail }),
  };
}

export function useComments(type, id) {
  const qc = useQueryClient();
  const key = qk.comments(type, id);
  const query = useQuery({ queryKey: key, queryFn: () => commentsMock.list(type, id), enabled: !!id });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const fail = (err) => toast.error(err.message);
  return {
    ...query,
    add: useMutation({ mutationFn: (body) => commentsMock.add(type, id, body), onSuccess: refresh, onError: fail }),
    resolve: useMutation({ mutationFn: ({ cid, resolved }) => commentsMock.setResolved(cid, resolved), onSuccess: refresh, onError: fail }),
    remove: useMutation({ mutationFn: commentsMock.remove, onSuccess: refresh, onError: fail }),
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
