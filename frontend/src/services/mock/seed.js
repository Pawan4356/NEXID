// Initial sample workspace. Written as BlockNote "partial blocks" for notes and
// Excalidraw "element skeletons" for diagrams (converted on first open).

const DAY = 86400000;
const iso = (offsetDays, hour = 10) => {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const dateOnly = (offsetDays) => iso(offsetDays).slice(0, 10);

const p = (text) => ({ type: "paragraph", content: text });
const h = (level, text) => ({
  type: "heading",
  props: { level },
  content: text,
});
const todo = (text, checked = false) => ({
  type: "checkListItem",
  props: { checked },
  content: text,
});
const li = (text) => ({ type: "bulletListItem", content: text });
const ol = (text) => ({ type: "numberedListItem", content: text });
const rich = (...parts) => ({
  type: "paragraph",
  content: parts.map((part) =>
    typeof part === "string" ? { type: "text", text: part, styles: {} } : part,
  ),
});
const b = (text) => ({ type: "text", text, styles: { bold: true } });
const code = (text) => ({ type: "text", text, styles: { code: true } });

export function createSeed(user) {
  const first = (user.name || "there").split(" ")[0];

  const note = (id, fields) => ({
    id,
    ownerId: user.id,
    parentId: null,
    icon: "📄",
    title: "Untitled",
    content: [p("")],
    visibility: "private",
    isFavorite: false,
    settings: {
      fullWidth: false,
      smallText: false,
      font: "default",
      locked: false,
    },
    createdAt: iso(-20),
    updatedAt: iso(-1),
    lastViewedAt: null,
    ...fields,
  });

  const notes = [
    note("n-welcome", {
      icon: "👋",
      title: "Getting started with Nexid",
      isFavorite: true,
      updatedAt: iso(0, 9),
      lastViewedAt: iso(0, 9),
      content: [
        p(
          `Welcome, ${first}. This page is a tour of the Nexid editor. Everything you change here is saved in this browser only — the notes API does not exist yet.`,
        ),
        h(2, "The basics"),
        todo("Type / on an empty line to open the block menu", true),
        todo("Add a to-do block and check it off"),
        todo("Drag a block by the ⋮⋮ handle on its left"),
        todo("Create a sub-page from the + next to this page in the sidebar"),
        h(2, "Keyboard shortcuts"),
        li("Ctrl/⌘ + K — search pages, diagrams, tasks and people"),
        li("Ctrl/⌘ + \\ — collapse or expand the sidebar"),
        li("Ctrl/⌘ + B / I / U — bold, italic, underline"),
        h(2, "What is real and what is simulated"),
        rich(
          b("Real: "),
          "login, signup, your profile, user search and follows all go through the Express backend.",
        ),
        rich(
          b("Local mock: "),
          "notes, tasks, diagrams, sharing and comments. Collaborator presence is simulated.",
        ),
      ],
    }),
    note("n-roadmap", {
      icon: "🗺️",
      title: "Product roadmap",
      isFavorite: true,
      visibility: "friends",
      updatedAt: iso(-1, 16),
      lastViewedAt: iso(-1, 16),
      content: [
        p(
          "Where Nexid is heading over the next two quarters. Sub-pages hold the detailed specs.",
        ),
        h(2, "Now"),
        li("Notes API with nested pages and block storage"),
        li("Todos API with priorities and due dates"),
        h(2, "Next"),
        li("Diagrams API storing Excalidraw scenes"),
        li("Sharing: private / friends / public plus per-user roles"),
        h(2, "Later"),
        li("Real-time co-editing (Yjs + WebSocket)"),
        li("Comments with mentions and notifications"),
      ],
    }),
    note("n-api", {
      parentId: "n-roadmap",
      icon: "🧩",
      title: "Backend API plan",
      updatedAt: iso(-2, 11),
      lastViewedAt: iso(-2, 11),
      content: [
        p(
          "Endpoints the frontend reference UI expects. Shapes mirror the mock services in frontend/src/services/mock.",
        ),
        h(3, "Notes"),
        rich(
          code("GET /notes"),
          " · ",
          code("POST /notes"),
          " · ",
          code("GET /notes/:id"),
          " · ",
          code("PATCH /notes/:id"),
          " · ",
          code("DELETE /notes/:id"),
        ),
        rich(
          code("POST /notes/:id/duplicate"),
          " — copies the page and its sub-pages",
        ),
        h(3, "Todos"),
        rich(
          code("GET /todos?status=&priority=&due="),
          " · ",
          code("POST /todos"),
          " · ",
          code("PATCH /todos/:id"),
        ),
        h(3, "Open questions"),
        todo("Store blocks as one JSON document or one row per block?"),
        todo("Does 'friends' mean mutual follows or followers?"),
        todo("Soft delete with a trash, or hard delete?", true),
      ],
    }),
    note("n-collab", {
      parentId: "n-roadmap",
      icon: "🤝",
      title: "Collaboration design",
      updatedAt: iso(-4),
      content: [
        p("How shared editing should feel once the realtime backend exists."),
        h(3, "Presence"),
        li(
          "Avatars of everyone currently viewing, with a coloured cursor each",
        ),
        li("'Editing' vs 'viewing' state per person"),
        h(3, "Permissions"),
        ol("View — read only"),
        ol("Comment — read and leave comments"),
        ol("Edit — full editing, cannot change sharing"),
        p(
          "The owner is the only one who can change visibility or remove collaborators.",
        ),
      ],
    }),
    note("n-reading", {
      icon: "📚",
      title: "Reading notes",
      updatedAt: iso(-6),
      content: [
        p("Highlights from books and articles."),
        li("Designing Data-Intensive Applications"),
        li("Refactoring UI"),
      ],
    }),
    note("n-ddia", {
      parentId: "n-reading",
      icon: "📖",
      title: "DDIA — Ch. 5 Replication",
      updatedAt: iso(-6, 20),
      content: [
        h(2, "Leaders and followers"),
        p(
          "One replica accepts writes; followers apply the leader's change stream. Reads from followers may be stale.",
        ),
        h(2, "Replication lag anomalies"),
        li(
          "Read-your-writes: route a user's reads to the leader for a short time after they write",
        ),
        li("Monotonic reads: pin each user to one replica"),
        li(
          "Consistent prefix reads: causally related writes go to the same partition",
        ),
        h(2, "Takeaway for Nexid"),
        p(
          "For collaborative notes, CRDTs avoid most of these issues because every replica can accept writes and still converge.",
        ),
      ],
    }),
    note("n-weekly", {
      icon: "🗓️",
      title: "Weekly review",
      updatedAt: iso(-3, 18),
      lastViewedAt: iso(-3, 18),
      content: [
        h(2, "Wins"),
        li("Follow / unfollow endpoints working end to end"),
        li("Reference UI scaffolded"),
        h(2, "Next week"),
        todo("Finish Note schema draft"),
        todo("Add CORS + cookie options for production"),
        todo("Write tests for auth middleware"),
      ],
    }),
    note("n-ideas", {
      icon: "💡",
      title: "Feature ideas",
      visibility: "public",
      updatedAt: iso(-9),
      content: [
        p("Loose ideas, not committed to."),
        li("Daily note template"),
        li("Publish a page as a public link"),
        li("Embed diagrams inside notes"),
      ],
    }),
  ];

  const task = (id, fields) => ({
    id,
    ownerId: user.id,
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: null,
    noteId: null,
    createdAt: iso(-10),
    updatedAt: iso(-2),
    ...fields,
  });

  const todos = [
    task("t-1", {
      title: "Draft Note mongoose schema",
      priority: "high",
      status: "in_progress",
      dueDate: dateOnly(1),
      noteId: "n-api",
      description:
        "title, icon, parentId, ownerId, blocks, visibility, settings, timestamps.",
    }),
    task("t-2", {
      title: "Add CORS middleware with credentials",
      priority: "high",
      dueDate: dateOnly(0),
      description:
        "Needed before the frontend can call the API cross-origin in production.",
    }),
    task("t-3", {
      title: "Implement /auth/refresh",
      priority: "medium",
      dueDate: dateOnly(4),
      description:
        "The route exists but the handler is empty and never responds.",
    }),
    task("t-4", {
      title: "Stop returning password hash from /user/me",
      priority: "urgent",
      dueDate: dateOnly(-1),
      description:
        "GET /user/me and GET /user/:userId send the full user document.",
    }),
    task("t-5", {
      title: "Endpoints for another user's followers",
      priority: "low",
      dueDate: dateOnly(9),
    }),
    task("t-6", {
      title: "Pick realtime stack (Socket.IO vs y-websocket)",
      priority: "medium",
      dueDate: dateOnly(14),
      noteId: "n-collab",
    }),
    task("t-7", {
      title: "Write auth middleware tests",
      priority: "medium",
      status: "todo",
      dueDate: dateOnly(6),
    }),
    task("t-8", {
      title: "Set up MongoDB Atlas cluster",
      status: "done",
      priority: "high",
      dueDate: dateOnly(-8),
      updatedAt: iso(-8),
    }),
    task("t-9", {
      title: "Follow / unfollow endpoints",
      status: "done",
      priority: "medium",
      dueDate: dateOnly(-5),
      updatedAt: iso(-5),
    }),
    task("t-10", {
      title: "Read DDIA chapter 6",
      status: "todo",
      priority: "low",
      noteId: "n-ddia",
    }),
  ];

  const diagram = (id, fields) => ({
    id,
    ownerId: user.id,
    title: "Untitled diagram",
    visibility: "private",
    isFavorite: false,
    scene: null,
    createdAt: iso(-12),
    updatedAt: iso(-2),
    lastViewedAt: null,
    ...fields,
  });

  const box = (id, x, y, text, backgroundColor = "#e7f5ff") => ({
    type: "rectangle",
    id,
    x,
    y,
    width: 200,
    height: 80,
    backgroundColor,
    fillStyle: "solid",
    roundness: { type: 3 },
    label: { text },
  });
  const arrow = (from, to, x, y, width, height = 0, text) => ({
    type: "arrow",
    x,
    y,
    width,
    height,
    start: { id: from },
    end: { id: to },
    ...(text ? { label: { text } } : {}),
  });

  const diagrams = [
    diagram("d-arch", {
      title: "Nexid system architecture",
      isFavorite: true,
      visibility: "friends",
      updatedAt: iso(-1, 14),
      lastViewedAt: iso(-1, 14),
      skeleton: [
        box("browser", 0, 0, "React + Vite\n(frontend)"),
        box("api", 380, 0, "Express 5 API", "#ebfbee"),
        box("db", 760, 0, "MongoDB", "#fff9db"),
        {
          type: "ellipse",
          id: "rt",
          x: 390,
          y: 200,
          width: 180,
          height: 90,
          backgroundColor: "#f3f0ff",
          fillStyle: "solid",
          strokeStyle: "dashed",
          label: { text: "Realtime\n(planned)" },
        },
        arrow("browser", "api", 205, 40, 170, 0, "cookie JWT"),
        arrow("api", "db", 585, 40, 170, 0, "Mongoose"),
        arrow("browser", "rt", 100, 85, 285, 160),
        // fontFamily 2 (Helvetica) needs no web-font load, so its width is measured correctly.
        {
          type: "text",
          x: 0,
          y: -70,
          text: "Nexid — high-level architecture",
          fontSize: 28,
          fontFamily: 2,
        },
      ],
    }),
    diagram("d-share", {
      title: "Sharing permission flow",
      updatedAt: iso(-5),
      skeleton: [
        box("req", 0, 0, "Request page"),
        {
          type: "diamond",
          id: "own",
          x: 300,
          y: -20,
          width: 160,
          height: 120,
          label: { text: "Owner?" },
        },
        box("vis", 560, 0, "Check visibility", "#fff9db"),
        box("allow", 560, 180, "Allow (role)", "#ebfbee"),
        box("deny", 860, 0, "403", "#ffe3e3"),
        arrow("req", "own", 205, 40, 90),
        arrow("own", "vis", 465, 40, 90, 0, "no"),
        arrow("own", "allow", 380, 105, 175, 115, "yes"),
        arrow("vis", "allow", 660, 85, 0, 90, "ok"),
        arrow("vis", "deny", 765, 40, 90, 0, "no"),
      ],
    }),
  ];

  const comments = [
    {
      id: "c-1",
      resourceType: "note",
      resourceId: "n-roadmap",
      author: { id: "sim-maya", name: "Maya Chen", simulated: true },
      body: "Should comments ship before realtime editing? They feel independent.",
      createdAt: iso(-1, 12),
      resolved: false,
    },
    {
      id: "c-2",
      resourceType: "note",
      resourceId: "n-roadmap",
      author: { id: "sim-arjun", name: "Arjun Mehta", simulated: true },
      body: "Agree. Comments only need REST; presence needs the socket server.",
      createdAt: iso(-1, 13),
      resolved: false,
    },
    {
      id: "c-3",
      resourceType: "diagram",
      resourceId: "d-arch",
      author: { id: "sim-sofia", name: "Sofia Rossi", simulated: true },
      body: "Will the realtime service share the Express process or run separately?",
      createdAt: iso(-1, 15),
      resolved: false,
    },
  ];

  const shares = {
    "note:n-roadmap": {
      collaborators: [
        {
          id: "s-1",
          userId: "sim-maya",
          name: "Maya Chen",
          email: "maya@example.com",
          role: "edit",
          status: "invited",
          simulated: true,
        },
        {
          id: "s-2",
          userId: "sim-arjun",
          name: "Arjun Mehta",
          email: "arjun@example.com",
          role: "comment",
          status: "invited",
          simulated: true,
        },
      ],
    },
  };

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    notes,
    todos,
    diagrams,
    comments,
    shares,
  };
}
