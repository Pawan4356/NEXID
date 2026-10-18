const now = () => new Date().toISOString();

const paragraph = (content) => ({ type: "paragraph", content });
const heading = (level, content) => ({
  type: "heading",
  props: { level },
  content,
});
const checklist = (content, checked = false) => ({
  type: "checkListItem",
  props: { checked },
  content,
});
const bullet = (content) => ({ type: "bulletListItem", content });

export function createSeed(user) {
  const firstName = (user.name || "there").split(" ")[0];
  const timestamp = now();

  return {
    version: 2,
    createdAt: timestamp,
    notes: [
      {
        id: "n-getting-started",
        ownerId: user.id,
        parentId: null,
        icon: "hand",
        title: "Getting started",
        content: [
          paragraph(`Welcome, ${firstName}. This is your first Nexid page.`),
          paragraph("Use this page as a quick guide, then create your own notes."),
          heading(2, "Try the basics"),
          checklist("Type / to open the block menu", true),
          checklist("Add a checklist item and mark it complete"),
          checklist("Create a child page from the sidebar"),
          checklist("Open search with Ctrl/⌘ + K"),
          heading(2, "Useful patterns"),
          bullet("Use headings to organize a long note."),
          bullet("Use checklist items for tasks. Todo progress comes from checked items in your notes."),
          bullet("Choose a note icon from the icon picker beside the title."),
        ],
        visibility: "private",
        isFavorite: false,
        settings: {
          fullWidth: false,
          smallText: false,
          font: "default",
          locked: false,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        lastViewedAt: timestamp,
      },
    ],
    diagrams: [],
    comments: [],
    shares: {},
  };
}
