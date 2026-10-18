# Backend work implied by the reference UI

The mock services in `src/services/mock/*.mock.js` define the shapes the UI
consumes. Implementing these endpoints with the same shapes lets each hook in
`src/hooks/` switch from mock to real without component changes.

Conventions assumed below: JSON responses everywhere (including errors, as
`{ "message": "..." }`), `401` for missing/expired auth, `403` for permission
denied, `404` for not found, `200 []` for empty lists, and `id` (or `_id`;
`normalize.js` maps it) on every document.

---

## 1. Proposed schemas (Mongoose)

### Note

```js
{
  ownerId:    { type: ObjectId, ref: "User", required: true, index: true },
  parentId:   { type: ObjectId, ref: "Note", default: null, index: true }, // nesting
  title:      { type: String, trim: true, maxLength: 200, default: "" },
  icon:       { type: String, default: "📄" },             // emoji
  content:    { type: Array, default: [] },               // BlockNote block JSON (see note below)
  visibility: { type: String, enum: ["private", "friends", "public"], default: "private", index: true },
  settings: {
    fullWidth: { type: Boolean, default: false },
    smallText: { type: Boolean, default: false },
    font:      { type: String, enum: ["default", "serif", "mono"], default: "default" },
    locked:    { type: Boolean, default: false },
  },
  // timestamps: true → createdAt, updatedAt
}
```

Per-user state shouldn't live on the shared document once pages are shared:

```js
// NoteUserState (or a generic ResourceUserState)
{ userId, resourceType: "note"|"diagram", resourceId, isFavorite: Boolean, lastViewedAt: Date }
// unique index on { userId, resourceType, resourceId }
```

*Block storage decision:* the UI sends the whole block array on each autosave
(debounced 700 ms). One document per note is simplest. If notes get large or
realtime editing arrives, move to Yjs updates (see §4).

### Todo

```js
{
  ownerId:     { type: ObjectId, ref: "User", required: true, index: true },
  title:       { type: String, required: true, trim: true, maxLength: 300 },
  description: { type: String, default: "", maxLength: 5000 },
  status:      { type: String, enum: ["todo", "in_progress", "done"], default: "todo", index: true },
  priority:    { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  dueDate:     { type: String, match: /^\d{4}-\d{2}-\d{2}$/, default: null }, // calendar day, no timezone
  noteId:      { type: ObjectId, ref: "Note", default: null },               // "Linked page"
  completedAt: { type: Date, default: null },
  // timestamps
}
```

### Diagram

```js
{
  ownerId:    { type: ObjectId, ref: "User", required: true, index: true },
  title:      { type: String, trim: true, maxLength: 200, default: "Untitled diagram" },
  visibility: { type: String, enum: ["private", "friends", "public"], default: "private" },
  scene: {
    elements: { type: Array, default: [] },   // Excalidraw elements (non-deleted)
    appState: { viewBackgroundColor: String, gridSize: Number },
    files:    { type: Object, default: {} },  // embedded images; consider GridFS/S3 for large files
  },
  thumbnail:  { type: String, default: null }, // optional exported PNG/SVG URL for the list view
  // timestamps
}
```

`GET /diagrams` should omit `scene` and return `elementCount` (or a
thumbnail), because scenes can be large.

### Share / Permission

```js
// Collaborator
{
  resourceType: { type: String, enum: ["note", "diagram"], required: true },
  resourceId:   { type: ObjectId, required: true },
  userId:       { type: ObjectId, ref: "User", default: null }, // null until an email invite is accepted
  email:        { type: String, lowercase: true, default: null },
  role:         { type: String, enum: ["view", "comment", "edit"], required: true },
  status:       { type: String, enum: ["invited", "accepted"], default: "invited" },
  invitedBy:    { type: ObjectId, ref: "User", required: true },
  // timestamps
}
// unique: { resourceType, resourceId, userId } (sparse) and { resourceType, resourceId, email } (sparse)
```

**Access rule** (matches the *Sharing permission flow* sample diagram):

1. Owner → full access.
2. Collaborator row → its `role`.
3. `visibility: "public"` → view.
4. `visibility: "friends"` and viewer is a friend → view.
5. Otherwise → 403.

**Decision needed:** define "friends". The UI copy assumes **mutual follows**
(both `Follow` docs exist). Sub-pages should probably inherit the parent's
access unless overridden.

### Comment

```js
{
  resourceType: { type: String, enum: ["note", "diagram"], required: true },
  resourceId:   { type: ObjectId, required: true, index: true },
  authorId:     { type: ObjectId, ref: "User", required: true },
  body:         { type: String, required: true, trim: true, maxLength: 5000 },
  resolved:     { type: Boolean, default: false },
  resolvedBy:   { type: ObjectId, ref: "User", default: null },
  anchor:       { type: Object, default: null }, // later: block id / element id the comment is attached to
  parentId:     { type: ObjectId, ref: "Comment", default: null }, // later: threads
  // timestamps
}
```

Return comments with the author populated as `{ id, name, avatar }`.

---

## 2. Endpoints the UI expects

### Notes (`hooks/useNotes.js` ← `notes.mock.js`)

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| GET | `/notes` | — | notes the user can access (tree is built client-side) |
| POST | `/notes` | `{ parentId?, title?, icon?, content? }` | note |
| GET | `/notes/:id` | — | note (403/404) |
| PATCH | `/notes/:id` | any of `title, icon, content, visibility, settings, parentId` | note |
| POST | `/notes/:id/duplicate` | — | root copy (descendants copied too) |
| DELETE | `/notes/:id` | — | `{ deletedIds: [...] }` (cascades to sub-pages, comments, shares) |
| PUT | `/me/favorites/:type/:id` · DELETE same | — | 204 |
| POST | `/notes/:id/view` | — | 204 (recents) |

### Todos (`hooks/useTodos.js` ← `todos.mock.js`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/todos?status=&priority=&due=overdue\|today\|week\|none&q=&sort=due\|priority` | UI filters client-side today; server-side filtering is needed once lists grow |
| POST | `/todos` | `{ title, description?, status?, priority?, dueDate?, noteId? }` |
| PATCH | `/todos/:id` | partial; set `completedAt` when status becomes `done` |
| DELETE | `/todos/:id` | |

### Diagrams (`hooks/useDiagrams.js` ← `diagrams.mock.js`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/diagrams` | summaries, no `scene` |
| POST | `/diagrams` | `{ title? }` |
| GET | `/diagrams/:id` | includes `scene` |
| PATCH | `/diagrams/:id` | `{ title?, scene?, visibility? }`; autosave sends `scene` every ~900 ms while drawing. Consider `express.json({ limit: "5mb" })` |
| POST | `/diagrams/:id/duplicate` · DELETE `/diagrams/:id` | |

### Sharing (`hooks/useCollab.js` ← `sharing.mock.js`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/:type/:id/collaborators` | `{ collaborators: [{ id, userId, name, email, role, status }] }` |
| POST | `/:type/:id/collaborators` | `{ userId? , email?, role }`; send an invite email/notification |
| PATCH | `/:type/:id/collaborators/:cid` | `{ role }` (owner only) |
| DELETE | `/:type/:id/collaborators/:cid` | owner only |

Visibility changes go through the resource's own `PATCH`.

### Comments (`hooks/useCollab.js` ← `comments.mock.js`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/:type/:id/comments` | sorted oldest → newest |
| POST | `/:type/:id/comments` | `{ body }`; requires comment or edit role |
| PATCH | `/comments/:id` | `{ resolved }` |
| DELETE | `/comments/:id` | author or resource owner |

### Social: additions to the existing follow API

| Method | Path | Why |
| --- | --- | --- |
| GET | `/follow/:userId/followers`, `/follow/:userId/following` | Profile tabs for other users |
| GET | `/user/:userId` → add `followersCount`, `followingCount`, `isFollowing`, `followsYou` | Avoids downloading full lists just to render one button |
| GET | `/user/:userId/notes?visibility=public` | "Public pages" on other people's profiles |
| GET | `/user/users?name=&limit=&cursor=` | Pagination (currently returns every user when `name` is empty) |

---

## 3. Issues found in the current backend

All verified against the source and, where noted, reproduced against a
running instance. The frontend works around each one; nothing in `backend/`
was changed.

| # | Where | Issue | Frontend workaround |
| --- | --- | --- | --- |
| 1 | `GET /user/me`, `GET /user/:userId` | **Response includes the bcrypt `password` hash** (reproduced). `/user/:userId` is unauthenticated, so anyone can fetch any user's hash. Add `.select("-password")` / a `toJSON` transform on the schema. | `normalize.js` strips `password` before it reaches state. |
| 2 | `GET /user/users`, `GET /user/:userId` | Unauthenticated and return every user's **email**. | Other users' emails aren't displayed. |
| 3 | `GET /user/users?name=` | User input goes straight into `$regex`: `?name=(` → **500** (reproduced), and crafted patterns risk ReDoS. Escape it server-side. | Input is regex-escaped in `user.api.js`. |
| 4 | `GET /user/users` | Empty result → `404 "No User found..."`. Should be `200 []`. | 404 mapped to `[]`. |
| 5 | `app.js` | `app.use("/", …)` answers **200 "Home!" for any unknown path and method**, so a mistyped endpoint looks like success. Use `app.get("/")` plus a JSON 404 handler. | No unimplemented endpoints are called. |
| 6 | `auth.middleware.js` | Auth failures return **400** with text `"Error: Invalid token"`. Should be `401`. | `client.js` pattern-matches the text on protected routes. |
| 7 | `app.js` | **No CORS middleware.** | Vite dev proxy (see README). |
| 8 | login/signup `res.cookie` | Cookie lacks `httpOnly`, `secure`, `sameSite`. It expires in **3 h** while the JWT lasts **3 d**. | — (needs backend change) |
| 9 | `POST /auth/refresh` | Empty handler: the **request hangs** until timeout. Remove it or implement it. | Never called. |
| 10 | `follow.router.js` `GET /followers`, `/following` | `catch (error)` but the body uses `err` → `ReferenceError` on any DB error (unhandled → Express default 500). | Generic error state. |
| 11 | `PATCH /user/update` | Validation errors return **500** "Something went wrong..." (e.g. `gender: ""` → 500, reproduced). Should be 400 with the message. `null` clears a field correctly. | Client-side validation; sends `null` to clear. |
| 12 | `POST /auth/signup` | Duplicate email returns the raw Mongo `E11000 …` message. Also `if (!password) res.status(400)…` has no `return` (unreachable today, but would double-send). | E11000 mapped to "An account with this email already exists." |
| 13 | User schema | Default `avatar` is a stock.adobe.com *search page*, not an image. Use `null`/empty and let clients render initials. | Treated as "no avatar". |
| 14 | General | Mixed text/JSON responses. Standardize on JSON (`{ message }` for errors). | `client.js` parses by content-type. |

---

## 4. Realtime collaboration (later)

The UI already has the surfaces in place: presence avatars, an "X is
editing…" status, and a comments panel, all currently simulated in
`presence.mock.js`. A realistic path:

- BlockNote supports Yjs collaboration natively (`collaboration: { provider, fragment, user }`). Excalidraw has a collaborators API (`updateScene({ collaborators })`).
- Run a y-websocket / Hocuspocus server next to Express. Authenticate the WebSocket upgrade with the same JWT cookie, and authorize with the access rule in §1.
- Persist Yjs document updates in Mongo (or snapshot to `Note.content` periodically, so REST reads stay simple).
