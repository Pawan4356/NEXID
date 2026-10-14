// Mock of a future sharing/permissions API. Visibility itself lives on the
// resource (note.visibility / diagram.visibility); this module stores the
// per-person collaborator list. No invitations are actually delivered.
import { mockCall, persist, uid, MockError } from "./db";

export const ROLES = ["view", "comment", "edit"];
export const VISIBILITIES = ["private", "friends", "public"];

const key = (type, id) => `${type}:${id}`;
const entry = (d, type, id) => (d.shares[key(type, id)] ??= { collaborators: [] });

export const get = (type, id) => mockCall((d) => d.shares[key(type, id)] ?? { collaborators: [] });

export const addCollaborator = (type, id, { userId = null, name, email = null, role = "view" }) =>
  mockCall((d) => {
    if (!ROLES.includes(role)) throw new MockError("Invalid role.");
    const share = entry(d, type, id);
    const dup = share.collaborators.find((c) => (userId && c.userId === userId) || (email && c.email === email));
    if (dup) throw new MockError(`${dup.name || dup.email} already has access.`);
    share.collaborators.push({ id: uid(), userId, name: name || email, email, role, status: "invited" });
    persist();
    return share;
  });

export const updateRole = (type, id, collaboratorId, role) =>
  mockCall((d) => {
    if (!ROLES.includes(role)) throw new MockError("Invalid role.");
    const share = entry(d, type, id);
    const c = share.collaborators.find((x) => x.id === collaboratorId);
    if (!c) throw new MockError("Collaborator not found.");
    c.role = role;
    persist();
    return share;
  });

export const removeCollaborator = (type, id, collaboratorId) =>
  mockCall((d) => {
    const share = entry(d, type, id);
    share.collaborators = share.collaborators.filter((x) => x.id !== collaboratorId);
    persist();
    return share;
  });
