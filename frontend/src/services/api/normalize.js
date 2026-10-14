// The backend returns full Mongoose documents. GET /user/me and GET /user/:userId
// currently include the bcrypt password hash, so we strip it here before the
// object reaches React state, caches, or devtools.
const DEFAULT_AVATAR = "https://stock.adobe.com/search?k=default+avatar"; // backend default, not an image

export function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  // eslint-disable-next-line no-unused-vars
  const { password, __v, _id, avatar, ...rest } = raw;
  return {
    ...rest,
    id: _id,
    avatar: avatar && avatar !== DEFAULT_AVATAR ? avatar : null,
  };
}

export const normalizeUsers = (list) => (Array.isArray(list) ? list.map(normalizeUser).filter(Boolean) : []);
