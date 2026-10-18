export const qk = {
  me: ["me"],
  user: (id) => ["user", id],
  userSearch: (q) => ["users", "search", q],
  myFollowers: ["follow", "followers"],
  myFollowing: ["follow", "following"],
  followers: (id) => ["follow", id, "followers"],
  following: (id) => ["follow", id, "following"],
  publicNotes: (id) => ["public-notes", id],
  // mock
  notes: ["mock", "notes"],
  note: (id) => ["mock", "note", id],
  diagrams: ["mock", "diagrams"],
  diagram: (id) => ["mock", "diagram", id],
  share: (type, id) => ["mock", "share", type, id],
  comments: (type, id) => ["mock", "comments", type, id],
};
