// LOCAL MOCK: diagrams.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { diagramsMock } from "../services/mock";
import { qk } from "../lib/queryKeys";

export const useDiagrams = () => useQuery({ queryKey: qk.diagrams, queryFn: diagramsMock.list });

// The editor owns the scene once loaded, so never refetch it underneath Excalidraw.
export const useDiagram = (id) =>
  useQuery({ queryKey: qk.diagram(id), queryFn: () => diagramsMock.get(id), enabled: !!id, retry: false, staleTime: Infinity, gcTime: 0 });

export function useDiagramMutations() {
  const qc = useQueryClient();
  const refreshList = () => qc.invalidateQueries({ queryKey: qk.diagrams });
  const fail = (what) => (err) => toast.error(`Couldn't ${what}: ${err.message}`);

  return {
    create: useMutation({ mutationFn: diagramsMock.create, onSuccess: refreshList, onError: fail("create diagram") }),
    update: useMutation({
      mutationFn: ({ id, patch }) => diagramsMock.update(id, patch),
      onSuccess: (summary) => qc.setQueryData(qk.diagrams, (list) => list?.map((d) => (d.id === summary.id ? summary : d))),
    }),
    duplicate: useMutation({ mutationFn: diagramsMock.duplicate, onSuccess: refreshList, onError: fail("duplicate diagram") }),
    remove: useMutation({ mutationFn: diagramsMock.remove, onSuccess: refreshList, onError: fail("delete diagram") }),
    markViewed: useMutation({ mutationFn: diagramsMock.markViewed, onSuccess: refreshList }),
  };
}
