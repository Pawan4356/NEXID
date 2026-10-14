export const qk = {
  me: ["me"],
  user: (id) => ["user", id],
  userSearch: (q) => ["users", "search", q],
  myFollowers: ["follow", "followers"],
  myFollowing: ["follow", "following"],
  // mock
  notes: ["mock", "notes"],
  note: (id) => ["mock", "note", id],
  todos: ["mock", "todos"],
  diagrams: ["mock", "diagrams"],
  diagram: (id) => ["mock", "diagram", id],
  share: (type, id) => ["mock", "share", type, id],
  comments: (type, id) => ["mock", "comments", type, id],
};
