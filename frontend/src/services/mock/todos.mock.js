// Mock of a future /todos API.
import { mockCall, persist, uid, now, getMockUser, MockError } from "./db";

export const STATUSES = ["todo", "in_progress", "done"];
export const PRIORITIES = ["low", "medium", "high", "urgent"];

const find = (d, id) => {
  const t = d.todos.find((x) => x.id === id);
  if (!t) throw new MockError("Task not found.");
  return t;
};

const validate = (fields) => {
  if ("title" in fields && !String(fields.title).trim())
    throw new MockError("A task needs a title.");
  if ("status" in fields && !STATUSES.includes(fields.status))
    throw new MockError("Invalid status.");
  if ("priority" in fields && !PRIORITIES.includes(fields.priority))
    throw new MockError("Invalid priority.");
};

export const list = () => mockCall((d) => d.todos);

export const create = (fields) =>
  mockCall((d) => {
    const todo = {
      id: uid(),
      ownerId: getMockUser().id,
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: null,
      noteId: null,
      createdAt: now(),
      updatedAt: now(),
      ...fields,
    };
    validate(todo);
    todo.title = todo.title.trim();
    d.todos.unshift(todo);
    persist();
    return todo;
  });

export const update = (id, patch) =>
  mockCall((d) => {
    const todo = find(d, id);
    validate(patch);
    Object.assign(todo, patch, { updatedAt: now() });
    persist();
    return todo;
  });

export const remove = (id) =>
  mockCall((d) => {
    find(d, id);
    d.todos = d.todos.filter((t) => t.id !== id);
    persist();
    return id;
  });
