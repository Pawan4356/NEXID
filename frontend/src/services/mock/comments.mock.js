// Mock of a future comments API.
import { mockCall, persist, uid, now, getMockUser, MockError } from "./db";

export const list = (type, id) =>
  mockCall((d) =>
    d.comments
      .filter((c) => c.resourceType === type && c.resourceId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );

export const add = (type, id, body) =>
  mockCall((d) => {
    if (!body.trim()) throw new MockError("Comment is empty.");
    const me = getMockUser();
    const c = {
      id: uid(),
      resourceType: type,
      resourceId: id,
      author: { id: me.id, name: me.name, avatar: me.avatar },
      body: body.trim(),
      createdAt: now(),
      resolved: false,
    };
    d.comments.push(c);
    persist();
    return c;
  });

export const setResolved = (commentId, resolved) =>
  mockCall((d) => {
    const c = d.comments.find((x) => x.id === commentId);
    if (!c) throw new MockError("Comment not found.");
    c.resolved = resolved;
    persist();
    return c;
  });

export const remove = (commentId) =>
  mockCall((d) => {
    d.comments = d.comments.filter((x) => x.id !== commentId);
    persist();
    return commentId;
  });
