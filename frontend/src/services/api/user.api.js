import { request } from "./client";
import { normalizeUser, normalizeUsers } from "./normalize";

// GET /user/me (auth) -> user document
export const getMe = async () =>
  normalizeUser(await request("/user/me", { auth: true }));

// PATCH /user/update (auth) -> updated user. Allowed keys: name, avatar, gender, age, bio.
export const updateMe = async (patch) =>
  normalizeUser(
    await request("/user/update", { method: "PATCH", body: patch, auth: true }),
  );

// PATCH /user/changePassword (auth) { oldPassword, newPassword }
export const changePassword = ({ oldPassword, newPassword }) =>
  request("/user/changePassword", {
    method: "PATCH",
    body: { oldPassword, newPassword },
    auth: true,
  });

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /user/users?name= (public). Backend matches names by prefix (regex) and
// answers 404 "No User found..." for an empty result, which we treat as [].
export const searchUsers = async (name = "", { signal } = {}) => {
  const q = name.trim();
  const qs = q ? `?name=${encodeURIComponent(escapeRegex(q))}` : "";
  try {
    return normalizeUsers(await request(`/user/users${qs}`, { signal }));
  } catch (err) {
    if (err.status === 404) return [];
    throw err;
  }
};

// GET /user/:userId (public)
export const getUser = async (userId) =>
  normalizeUser(await request(`/user/${encodeURIComponent(userId)}`));
