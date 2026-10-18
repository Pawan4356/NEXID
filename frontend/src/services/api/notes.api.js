import { request } from "./client";

export const getPublicNotes = async (userId) => {
  const { notes = [] } = await request(
    `/user/${encodeURIComponent(userId)}/notes?visibility=public`,
  );
  return notes.map(({ _id, ...note }) => ({ ...note, id: _id }));
};