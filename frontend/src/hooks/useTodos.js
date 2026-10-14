// LOCAL MOCK: todos.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { todosMock } from "../services/mock";
import { qk } from "../lib/queryKeys";

export const useTodos = () => useQuery({ queryKey: qk.todos, queryFn: todosMock.list });

export function useTodoMutations() {
  const qc = useQueryClient();
  const patchCache = (todo) => qc.setQueryData(qk.todos, (list) => list?.map((t) => (t.id === todo.id ? todo : t)));

  const create = useMutation({
    mutationFn: todosMock.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.todos }),
    onError: (err) => toast.error(`Couldn't create task: ${err.message}`),
  });

  // Optimistic: checkbox and drag feel instant; rollback on failure.
  const update = useMutation({
    mutationFn: ({ id, patch }) => todosMock.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.todos });
      const prev = qc.getQueryData(qk.todos);
      qc.setQueryData(qk.todos, (list) => list?.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      return { prev };
    },
    onError: (err, _v, ctx) => {
      qc.setQueryData(qk.todos, ctx?.prev);
      toast.error(`Couldn't update task: ${err.message}`);
    },
    onSuccess: patchCache,
  });

  const remove = useMutation({
    mutationFn: todosMock.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.todos }),
    onError: (err) => toast.error(`Couldn't delete task: ${err.message}`),
  });

  return { create, update, remove };
}
