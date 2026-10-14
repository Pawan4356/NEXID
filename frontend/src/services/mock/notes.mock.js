// Mock of a future /notes API. Shapes are what the UI expects from the backend.
import { mockCall, persist, uid, now, getMockUser, MockError } from "./db";

const find = (d, id) => {
  const n = d.notes.find((x) => x.id === id);
  if (!n) throw new MockError("Page not found.");
  return n;
};

const descendantsOf = (d, id) => {
  const out = [];
  const walk = (pid) =>
    d.notes
      .filter((n) => n.parentId === pid)
      .forEach((n) => {
        out.push(n);
        walk(n.id);
      });
  walk(id);
  return out;
};

export const list = () => mockCall((d) => d.notes);

export const get = (id) => mockCall((d) => find(d, id));

export const create = ({
  parentId = null,
  title = "",
  icon = "📄",
  content,
} = {}) =>
  mockCall((d) => {
    if (parentId) find(d, parentId);
    const ts = now();
    const note = {
      id: uid(),
      ownerId: getMockUser().id,
      parentId,
      icon,
      title,
      content: content ?? [{ type: "paragraph", content: "" }],
      visibility: "private",
      isFavorite: false,
      settings: {
        fullWidth: false,
        smallText: false,
        font: "default",
        locked: false,
      },
      createdAt: ts,
      updatedAt: ts,
      lastViewedAt: ts,
    };
    d.notes.push(note);
    persist();
    return note;
  });

const EDITABLE = [
  "title",
  "icon",
  "content",
  "visibility",
  "isFavorite",
  "settings",
  "parentId",
];

export const update = (id, patch) =>
  mockCall((d) => {
    const note = find(d, id);
    for (const key of Object.keys(patch)) {
      if (!EDITABLE.includes(key))
        throw new MockError(`Field "${key}" cannot be updated.`);
    }
    if (patch.settings)
      patch = { ...patch, settings: { ...note.settings, ...patch.settings } };
    // Favoriting is not a content edit, so it doesn't bump updatedAt.
    const contentChange = Object.keys(patch).some((k) => k !== "isFavorite");
    Object.assign(note, patch, contentChange ? { updatedAt: now() } : {});
    persist();
    return note;
  });

export const markViewed = (id) =>
  mockCall((d) => {
    const note = find(d, id);
    note.lastViewedAt = now();
    persist();
    return note;
  });

// Copies the page and all of its sub-pages.
export const duplicate = (id) =>
  mockCall((d) => {
    const root = find(d, id);
    const ts = now();
    const idMap = new Map();
    const source = [root, ...descendantsOf(d, id)];
    source.forEach((n) => idMap.set(n.id, uid()));
    const copies = source.map((n) => ({
      ...structuredClone(n),
      id: idMap.get(n.id),
      parentId: n.id === id ? n.parentId : idMap.get(n.parentId),
      title: n.id === id ? `${n.title || "Untitled"} (copy)` : n.title,
      isFavorite: false,
      createdAt: ts,
      updatedAt: ts,
      lastViewedAt: null,
    }));
    d.notes.push(...copies);
    persist();
    return copies[0];
  });

// Deletes the page, its sub-pages, and their comments/shares.
export const remove = (id) =>
  mockCall((d) => {
    find(d, id);
    const ids = new Set([id, ...descendantsOf(d, id).map((n) => n.id)]);
    d.notes = d.notes.filter((n) => !ids.has(n.id));
    d.comments = d.comments.filter(
      (c) => !(c.resourceType === "note" && ids.has(c.resourceId)),
    );
    ids.forEach((nid) => delete d.shares[`note:${nid}`]);
    d.todos.forEach((t) => {
      if (ids.has(t.noteId)) t.noteId = null;
    });
    persist();
    return [...ids];
  });
