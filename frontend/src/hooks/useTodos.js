import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNotes } from "./useNotes";
import { workspaceNotesApi as notesApi } from "../services/api";
import { qk } from "../lib/queryKeys";
import { blocksToText } from "../lib/utils";

const blockId = (noteId, block, index) =>
  `${noteId}::${block.id ?? `index-${index}`}`;

const taskFromBlock = (note, block, index) => ({
  id: blockId(note.id, block, index),
  ownerId: note.ownerId,
  title: blocksToText([block]) || "Untitled task",
  description: note.title,
  status: block.props?.checked ? "done" : "todo",
  priority: block.props?.priority ?? "medium",
  dueDate: block.props?.dueDate ?? null,
  noteId: note.id,
  noteTitle: note.title,
  noteIcon: note.icon,
  block,
});

const checklistTasks = (notes = []) =>
  notes.flatMap((note) =>
    (note.content ?? [])
      .filter((block) => block.type === "checkListItem")
      .map((block, index) => taskFromBlock(note, block, index)),
  );

export const useTodos = () => {
  const notesQuery = useNotes();
  const todos = useMemo(() => checklistTasks(notesQuery.data), [notesQuery.data]);
  return { ...notesQuery, data: todos };
};

const parseTaskId = (id) => {
  const [noteId, blockKey] = id.split("::");
  return { noteId, blockKey };
};

const updateNoteContent = async (queryClient, noteId, transform) => {
  const note =
    queryClient.getQueryData(qk.note(noteId)) ??
    queryClient.getQueryData(qk.notes)?.find((item) => item.id === noteId);
  if (!note) throw new Error("The task's note is no longer available.");
  const content = transform(note.content ?? []);
  const updated = await notesApi.update(noteId, { content });
  queryClient.setQueryData(qk.note(noteId), updated);
  queryClient.setQueryData(qk.notes, (list) =>
    list?.map((item) => (item.id === noteId ? updated : item)),
  );
  return updated;
};

const locateBlock = (content, blockKey) =>
  content.findIndex((block, index) =>
    block.id ? block.id === blockKey : `index-${index}` === blockKey,
  );

export function useTodoMutations() {
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: ({ id, patch }) => {
      const { noteId, blockKey } = parseTaskId(id);
      return updateNoteContent(qc, noteId, (content) => {
        const index = locateBlock(content, blockKey);
        if (index < 0) throw new Error("Task not found in its note.");
        return content.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                props: {
                  ...item.props,
                  ...(patch.status ? { checked: patch.status === "done" } : {}),
                },
                ...(patch.title ? { content: patch.title } : {}),
              }
            : item,
        );
      });
    },
    onError: (err) => toast.error(`Couldn't update task: ${err.message}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });

  const create = useMutation({
    mutationFn: ({ noteId, title, status = "todo" }) =>
      updateNoteContent(qc, noteId, (content) => [
        ...content,
        {
          id: crypto.randomUUID(),
          type: "checkListItem",
          props: { checked: status === "done" },
          content: title,
        },
      ]),
    onError: (err) => toast.error(`Couldn't create task: ${err.message}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });

  const remove = useMutation({
    mutationFn: (id) => {
      const { noteId, blockKey } = parseTaskId(id);
      return updateNoteContent(qc, noteId, (content) => {
        const index = locateBlock(content, blockKey);
        if (index < 0) throw new Error("Task not found in its note.");
        return content.filter((_, itemIndex) => itemIndex !== index);
      });
    },
    onError: (err) => toast.error(`Couldn't delete task: ${err.message}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });

  return { create, update, remove };
}
