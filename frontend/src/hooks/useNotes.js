// LOCAL MOCK: notes. Swap notesMock for a real notes API client later.
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notesMock } from "../services/mock";
import { qk } from "../lib/queryKeys";

export const useNotes = () =>
  useQuery({ queryKey: qk.notes, queryFn: notesMock.list });

export const useNote = (id) =>
  useQuery({
    queryKey: qk.note(id),
    queryFn: () => notesMock.get(id),
    enabled: !!id,
    retry: false,
  });

function useWriteThrough() {
  const qc = useQueryClient();
  return (note) => {
    qc.setQueryData(qk.note(note.id), note);
    qc.setQueryData(qk.notes, (list) =>
      list ? list.map((n) => (n.id === note.id ? note : n)) : list,
    );
  };
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notesMock.create,
    onSuccess: (note) => {
      qc.setQueryData(qk.note(note.id), note);
      qc.invalidateQueries({ queryKey: qk.notes });
    },
    onError: (err) => toast.error(`Couldn't create page: ${err.message}`),
  });
}

export function useUpdateNote() {
  const write = useWriteThrough();
  return useMutation({
    mutationFn: ({ id, patch }) => notesMock.update(id, patch),
    onSuccess: write,
  });
}

export function useDuplicateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notesMock.duplicate,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
    onError: (err) => toast.error(`Couldn't duplicate page: ${err.message}`),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notesMock.remove,
    onSuccess: (ids) => {
      ids.forEach((id) => qc.removeQueries({ queryKey: qk.note(id) }));
      qc.invalidateQueries({ queryKey: qk.notes });
      qc.invalidateQueries({ queryKey: qk.todos });
    },
    onError: (err) => toast.error(`Couldn't delete page: ${err.message}`),
  });
}

export function useMarkNoteViewed() {
  const write = useWriteThrough();
  return useMutation({ mutationFn: notesMock.markViewed, onSuccess: write });
}

/** Helpers over the flat notes list: children map, ancestors, descendants count. */
export function useNoteTree() {
  const query = useNotes();
  const notes = query.data;
  const tree = useMemo(() => {
    if (!notes)
      return {
        notes: [],
        byId: new Map(),
        children: new Map(),
        ancestors: () => [],
        countDescendants: () => 0,
      };
    const byId = new Map(notes.map((n) => [n.id, n]));
    const children = new Map();
    for (const n of notes) {
      const key = n.parentId && byId.has(n.parentId) ? n.parentId : null;
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(n);
    }
    for (const list of children.values())
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const ancestors = (id) => {
      const out = [];
      let cur = byId.get(id);
      while (cur?.parentId && byId.has(cur.parentId)) {
        cur = byId.get(cur.parentId);
        out.unshift(cur);
      }
      return out;
    };
    const countDescendants = (id) =>
      (children.get(id) ?? []).reduce(
        (acc, c) => acc + 1 + countDescendants(c.id),
        0,
      );
    return { notes, byId, children, ancestors, countDescendants };
  }, [notes]);
  return { isLoading: query.isLoading, error: query.error, ...tree };
}
