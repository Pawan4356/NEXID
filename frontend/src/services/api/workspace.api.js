import { request } from "./client";

const id = (value) => value?._id ?? value?.id ?? value;
const normalizeNote = (value) => ({ ...value, id: id(value) });
const normalizeDiagram = (value) => ({
  ...value,
  id: id(value),
  ownerId: id(value.authorId),
  elementCount: value.scene?.elements?.length ?? 0,
  previewElements: value.scene?.elements ?? [],
  previewFiles: value.scene?.files ?? {},
});

export const notesApi = {
  list: async () => (await request("/note", { auth: true })).notes.map(normalizeNote),
  getPublicNotes: async (userId) =>
    (await request(`/user/${encodeURIComponent(userId)}/notes?visibility=public`)).notes.map(normalizeNote),
  get: async (noteId) => normalizeNote((await request(`/note/${noteId}`, { auth: true })).note),
  create: async (body) => normalizeNote((await request("/note", { method: "POST", body, auth: true })).note),
  update: async (noteId, body) => normalizeNote((await request(`/note/${noteId}`, { method: "PATCH", body, auth: true })).note),
  markViewed: (noteId) => notesApi.update(noteId, { lastViewedAt: new Date().toISOString() }),
  remove: async (noteId) => {
    await request(`/note/${noteId}`, { method: "DELETE", auth: true });
    return [noteId];
  },
};

export const diagramsApi = {
  list: async () => (await request("/canvas", { auth: true })).canvases.map(normalizeDiagram),
  get: async (canvasId) => normalizeDiagram((await request(`/canvas/${canvasId}`, { auth: true })).canvas),
  create: async (body) => normalizeDiagram((await request("/canvas", { method: "POST", body, auth: true })).canvas),
  update: async (canvasId, body) => normalizeDiagram((await request(`/canvas/${canvasId}`, { method: "PATCH", body, auth: true })).canvas),
  duplicate: async (canvasId) => normalizeDiagram((await request(`/canvas/${canvasId}/duplicate`, { method: "POST", auth: true })).canvas),
  remove: async (canvasId) => { await request(`/canvas/${canvasId}`, { method: "DELETE", auth: true }); return canvasId; },
  markViewed: (canvasId) => diagramsApi.update(canvasId, { lastViewedAt: new Date().toISOString() }),
};

export const commentsApi = {
  list: async (type, resourceId) => {
    const path = type === "diagram" ? `/comment/diagram/${resourceId}` : `/comment/note/${resourceId}`;
    const { comments = [] } = await request(path, { auth: true });
    return comments.map((comment) => ({ ...comment, id: id(comment), body: comment.content, author: comment.authorId?._id ? { ...comment.authorId, id: id(comment.authorId) } : comment.author }));
  },
  add: async (type, resourceId, body) => {
    const path = type === "diagram" ? `/comment/diagram/${resourceId}` : `/comment/note/${resourceId}`;
    const comment = (await request(path, { method: "POST", body: { content: body }, auth: true })).comment;
    return { ...comment, id: id(comment), body: comment.content };
  },
  remove: async (commentId) => { await request(`/comment/${commentId}`, { method: "DELETE", auth: true }); return commentId; },
  setResolved: async (commentId, resolved) => {
    const comment = (await request(`/comment/${commentId}`, { method: "PATCH", body: { resolved }, auth: true })).comment;
    return { ...comment, id: id(comment), body: comment.content };
  },
};

export const sharingApi = {
  get: async (type, resourceId) => {
    const { invitations = [] } = await request(`/invitation?direction=sent&resourceId=${resourceId}&resourceType=${type}`, { auth: true });
    return { collaborators: invitations.map((invitation) => ({ id: id(invitation), userId: id(invitation.recieverId), name: invitation.recieverId?.name, email: invitation.recieverId?.email, role: invitation.role === "editor" ? "edit" : "view", status: invitation.status })) };
  },
  add: async (type, resourceId, collaborator) => {
    await request("/invitation", { method: "POST", body: { recipientId: collaborator.userId, email: collaborator.email, resourceId, resourceType: type, role: collaborator.role === "edit" ? "editor" : "viewer" }, auth: true });
    return sharingApi.get(type, resourceId);
  },
  updateRole: async (_type, invitationId, role) => {
    await request(`/invitation/${invitationId}/role`, { method: "PATCH", body: { role: role === "edit" ? "editor" : "viewer" }, auth: true });
    return null;
  },
  remove: async (_type, invitationId) => { await request(`/invitation/${invitationId}/revoke`, { method: "PATCH", auth: true }); return null; },
};