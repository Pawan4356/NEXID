# Nexid — frontend reference UI

A clickable, Notion-style reference implementation of Nexid (notes, todos,
diagrams, people, sharing, collaboration). **Auth, profile, user search and
follows use the real Express backend. Everything else runs on local mock
data** and is labelled in the UI with a dashed **"Local mock"** badge.

See [`BACKEND_TODO.md`](./BACKEND_TODO.md) for the APIs and schemas the
backend still needs, plus issues found in the current backend.

---

## Quick start

Requirements: Node **20.19+** or **22.12+** (required by Vite 8), plus a running backend.

```bash
# 1. Backend (unchanged): needs backend/.env with PORT, DB_URL, JWT_SECRET_KEY
cd backend
npm install
npm run dev            # listens on PORT (5101 in the provided .env template)

# 2. Frontend
cd ../frontend
npm install
npm run dev            # http://localhost:5173
```

Open http://localhost:5173, create an account, and you land on Home.

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`
(serves `dist/`, using the same `/api` proxy).

### Environment variables (optional)

Copy `.env.example` to `.env` if you need to change the defaults.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base URL the browser calls. `/api` goes through the Vite proxy. |
| `DEV_PROXY_TARGET` | `http://localhost:5101` | Where the proxy forwards `/api/*`. **Must match backend `PORT`.** Read only by `vite.config.js` and never shipped to the browser. |
| `VITE_MOCK_LATENCY_MS` | `150` | Artificial delay for mock services, so loading states are visible. |

There are no secrets in the frontend. Don't put backend variables (`DB_URL`,
`JWT_SECRET_KEY`) in any `VITE_*` variable, because those are embedded in the bundle.

---

## Cookies and CORS: why there's a proxy

The backend sets the JWT in a `token` cookie and has **no CORS middleware**. A
browser on `localhost:5173` calling `localhost:5101` directly would be blocked.

So in development, the browser only talks to Vite (`/api/...`), and Vite
forwards the request to Express with the `/api` prefix stripped. For the
browser this is same-origin, so the cookie just works and **no backend change
is needed**. All requests use `credentials: "include"`, so they keep working
if you later switch to cross-origin.

**To call the API cross-origin instead** (e.g. separate deployments), set
`VITE_API_BASE_URL=https://api.example.com` and add this to the backend:

```js
// backend/src/app.js (before the routers)
const cors = require("cors");
app.use(cors({ origin: "https://app.example.com", credentials: true }));
```

and set cookie options on login/signup:
`{ httpOnly: true, secure: true, sameSite: "none" }` (use `sameSite: "lax"`
if frontend and API share a site). `localhost:5173 → localhost:5101` counts as
same-site, so locally only `cors()` would be needed.

For production on a single domain, the simplest setup is a reverse proxy
(nginx, Caddy, Vercel rewrites) that maps `/api/*` to Express, the same way the
dev proxy does.

---

## Stack and why

| Choice | Reason |
| --- | --- |
| **React 19 + Vite 8**, plain JS/JSX | No frontend existed. Plain JS matches the backend (CommonJS JS, no TS). |
| **React Router 7** | Nested layout route (`AppShell`) with URL-driven state (`?view=board`, `?tab=followers`). |
| **TanStack Query** | One caching/loading/error model for both real API calls and mock services, so swapping a mock for a real API doesn't touch components. |
| **Tailwind CSS 4** + CSS variables | Notion-like design tokens in `src/index.css`. Light/dark switch through one `.dark` class. |
| **BlockNote** (pinned `0.51.4`) | Notion-style block editor: slash menu, drag handles, to-do blocks, nesting. Newer versions (0.52+) ship a broken optional peer chain (`@y/y` prerelease) that makes `npm install` fail with ERESOLVE. |
| **Excalidraw** | Full diagram editor (select / rectangle / diamond / ellipse / arrow / line / draw / text / eraser tools, zoom, undo/redo). Not hand-built. |
| **Radix UI**, **cmdk**, **sonner**, **lucide-react** | Accessible menus/dialogs/popovers/tooltips, ⌘K palette, toasts, icons. |

BlockNote and Excalidraw are **lazy-loaded**, so the initial JS is ~210 kB
gzip. They load when you open a page or a diagram.

---

## Folder structure

```
frontend/
├── index.html                 # theme applied before first paint
├── vite.config.js             # /api proxy, Excalidraw define
├── .env.example
├── BACKEND_TODO.md            # missing APIs, proposed schemas, backend issues
└── src/
    ├── main.jsx               # providers: Query → Theme → Tooltip → Auth
    ├── App.jsx                # routes + auth guards
    ├── index.css              # design tokens, BlockNote/Excalidraw theming
    ├── services/
    │   ├── api/               # REAL backend: the only code that calls fetch()
    │   │   ├── client.js      #   fetch wrapper, text/JSON parsing, auth-error detection
    │   │   ├── normalize.js   #   strips password hash, maps _id → id
    │   │   ├── auth.api.js    #   /auth/*
    │   │   ├── user.api.js    #   /user/*
    │   │   └── follow.api.js  #   /follow/*
    │   └── mock/              # LOCAL MOCK: localStorage, no network
    │       ├── db.js          #   per-user store, artificial latency
    │       ├── seed.js        #   sample workspace content
    │       ├── notes.mock.js  todos.mock.js  diagrams.mock.js
    │       ├── sharing.mock.js  comments.mock.js
    │       └── presence.mock.js   # simulated collaborators
    ├── hooks/                 # React Query wrappers (one file per domain)
    │   ├── useSocial.js       #   real: users, search, follow
    │   ├── useNotes.js  useTodos.js  useDiagrams.js  useCollab.js   # mock
    │   └── useUtils.js        #   autosave, hotkeys, debounce, localStorage state
    ├── context/               # AuthContext (session), ThemeContext
    ├── lib/                   # utils (cn, dates), validation (mirrors backend), query keys
    ├── components/
    │   ├── ui/                # Button, Input, Modal, Menu, Popover, Tooltip, Avatar, Badge, MockBadge…
    │   ├── layout/            # AppShell, Sidebar, Topbar/Breadcrumbs, CommandPalette
    │   ├── notes/             # NoteTree, NoteEditor (BlockNote), NoteActionsMenu, IconPicker, SaveStatus
    │   ├── todos/             # TodoTable, TodoBoard, TodoDialog, badges
    │   ├── diagrams/          # DiagramCanvas (Excalidraw), DiagramCard
    │   ├── social/            # FollowButton, UserRow
    │   ├── sharing/           # ShareDialog, visibility/role metadata
    │   └── collab/            # PresenceAvatars, CommentsPanel
    └── pages/                 # one component per route
```

---

## Architecture

**Routing** (`src/App.jsx`)

```
/login, /signup                 GuestOnly → auth pages
<RequireAuth><AppShell/>        layout route: sidebar + <Outlet/> + ⌘K palette
  /                             HomePage (dashboard)
  /notes                        NotesPage (all pages, search/filter/sort)
  /notes/:noteId                NotePage (editor, share, comments, settings)
  /todos[?view=board&task=&new=1]  TodosPage
  /diagrams                     DiagramsPage
  /diagrams/:diagramId          DiagramPage (lazy)
  /people[?q=&tab=]             PeoplePage (discover / following / followers)
  /people/:userId | /people/me  ProfilePage (?tab=followers|following)
  /settings                     SettingsPage
```

**Session.** On load, `AuthProvider` calls `GET /user/me`. The result is
`authenticated` (user stored), `anonymous` (go to login), or `unreachable`
(backend down, with a retry screen). If any protected request returns the
auth-middleware error, the `client.js` `onUnauthorized` event fires and the
app returns to the login screen. Logout only clears local state after
`POST /auth/logout` succeeds.

**Data flow.** Components → domain hooks (`hooks/use*.js`) → services
(`services/api` or `services/mock`). Components never import a service
directly, apart from the settings forms that call `userApi`. To replace a
mock with a real API, write e.g. `services/api/notes.api.js` with the same
function signatures as `notes.mock.js` and change the import in
`hooks/useNotes.js`.

**Mock persistence.** `services/mock/db.js` stores one JSON document per
logged-in user under `localStorage["nexid.mock.v1.<userId>"]`. It's seeded on
first use and can be reset under Settings → Local prototype data.

**Honest status.** Autosave shows "Saving…" while a write is in flight and
"Saved locally" only after it resolves. Failures show "Not saved — retry".
Mock-backed toasts say what actually happened (e.g. *"Saved locally. No
invitation was sent"*). Simulated people carry a "sample" tag, and presence
only appears on pages that are shared.

---

## What's real vs. mocked

### Backend endpoints integrated

| Endpoint | Used by |
| --- | --- |
| `POST /auth/signup` | Signup form (then `GET /user/me`) |
| `POST /auth/login` | Login form (then `GET /user/me`) |
| `POST /auth/logout` | Workspace menu → Log out |
| `GET /user/me` | Session bootstrap, sidebar, share dialog owner row |
| `PATCH /user/update` | Settings → Profile (sends only changed fields) |
| `PATCH /user/changePassword` | Settings → Password |
| `GET /user/users?name=` | People search, ⌘K people results, share-dialog invite suggestions |
| `GET /user/:userId` | Profile page |
| `POST /follow/:userId` | Follow button (409 treated as "already following") |
| `DELETE /follow/:userId` | Unfollow |
| `GET /follow/followers` | Your followers tab, "Follows you" badges, Home network card |
| `GET /follow/following` | Your following tab, follow-button state, Home network card |

`POST /auth/refresh` is **not** called: its handler is empty and never responds.

### Powered by mock data (localStorage)

- **Notes**: page tree (nesting, breadcrumbs), create / rename / duplicate (with sub-pages) / delete (cascades), favorites, icon, block content, page settings (font, small text, full width, lock), visibility, recents.
- **Todos**: table & board, status / priority / due date / linked page, filters, sort, quick add, drag between columns.
- **Diagrams**: Excalidraw scenes, title, favorites, duplicate, delete. PNG / SVG / `.excalidraw` **export is real** (generated and downloaded in the browser).
- **Sharing**: visibility (private / friends / public), collaborator list with view / comment / edit roles. Invite suggestions come from the real user search, but **no invitation is sent and nobody else can open the page**.
- **Comments**: per page / diagram, resolve / reopen / delete. Pre-written comments are from sample people.
- **Presence**: simulated collaborators (Maya, Arjun, Sofia) with rotating viewing / editing / idle state.
- **Public pages** on your own profile.

### UI states that need missing endpoints

- Another user's followers/following tabs show an explanatory empty state (no per-user endpoint exists).
- Another user's public pages show what API is needed.

---

## Clickable journeys

1. Signup / login → Home dashboard
2. Home → **New page** (or sidebar **+**) → type a title → **Text** / **To-do** buttons, or `/` in the editor
3. Sidebar tree → hover a page → **⋯** (rename / duplicate / delete / favorite) or **+** (sub-page)
4. Home → **New diagram**, or Diagrams → *Nexid system architecture*
5. People → search → open a profile → **Follow / Unfollow**
6. Avatar menu → *Your profile* → Followers / Following tabs
7. Any page → **Share** → change visibility, invite a person, change roles
8. Any page → 💬 → comments panel
9. `Ctrl/⌘ + K` search everywhere · `Ctrl/⌘ + \` toggle sidebar · Settings → theme

---

## Known limitations and things to handle manually

- **Mock data is per browser.** Notes/todos/diagrams don't sync across browsers or devices, and a link to a page only works for you.
- **Excalidraw fonts load from a CDN** (`esm.sh`) by default. For offline use, copy `node_modules/@excalidraw/excalidraw/dist/prod/fonts` into `public/` and set `window.EXCALIDRAW_ASSET_PATH = "/"` in `index.html`.
- **`npm audit`** reports advisories in transitive dependencies of Excalidraw (mermaid/katex/lodash-es/sass tooling). They're upstream and don't affect this prototype's runtime surface. Track Excalidraw releases.
- **BlockNote is pinned to 0.51.4.** See the stack table above before upgrading.
- **Session length:** the backend cookie expires after 3 hours (the JWT is valid for 3 days). After that, the next request returns you to login.
