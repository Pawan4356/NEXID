import { request } from "./client";
import { normalizeUsers } from "./normalize";

// POST /follow/:userId (auth) -> 201 follow doc, 409 if already following
export const follow = async (userId) => {
  try {
    return await request(`/follow/${encodeURIComponent(userId)}`, {
      method: "POST",
      auth: true,
    });
  } catch (err) {
    if (err.status === 409) return { alreadyFollowing: true };
    throw err;
  }
};

// DELETE /follow/:userId (auth) -> 200 { message, follower, following }
export const unfollow = (userId) =>
  request(`/follow/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    auth: true,
  });

// GET /follow/followers (auth) -> users following the *current* user
export const getMyFollowers = async () =>
  normalizeUsers(await request("/follow/followers", { auth: true }));

// GET /follow/following (auth) -> users the *current* user follows
export const getMyFollowing = async () =>
  normalizeUsers(await request("/follow/following", { auth: true }));

export const getFollowers = async (userId) =>
  normalizeUsers(
    await request(`/follow/${encodeURIComponent(userId)}/followers`, {
      auth: true,
    }),
  );

export const getFollowing = async (userId) =>
  normalizeUsers(
    await request(`/follow/${encodeURIComponent(userId)}/following`, {
      auth: true,
    }),
  );
