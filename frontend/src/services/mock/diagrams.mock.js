// Mock of a future /diagrams API. `scene` holds Excalidraw { elements, appState, files }.
import { mockCall, persist, uid, now, getMockUser, MockError } from "./db";

const find = (d, id) => {
  const x = d.diagrams.find((g) => g.id === id);
  if (!x) throw new MockError("Diagram not found.");
  return x;
};

// List responses keep lightweight scene data so cards can render previews.
const summary = ({ scene, skeleton, ...rest }) => ({
  ...rest,
  elementCount: scene?.elements?.length ?? skeleton?.length ?? 0,
  previewElements: scene?.elements ?? skeleton ?? [],
  previewFiles: scene?.files ?? {},
});

export const list = () => mockCall((d) => d.diagrams.map(summary));

export const get = (id) => mockCall((d) => find(d, id));

export const create = ({ title = "Untitled diagram" } = {}) =>
  mockCall((d) => {
    const ts = now();
    const diagram = {
      id: uid(),
      ownerId: getMockUser().id,
      title,
      visibility: "private",
      isFavorite: false,
      scene: { elements: [], appState: {}, files: {} },
      createdAt: ts,
      updatedAt: ts,
      lastViewedAt: ts,
    };
    d.diagrams.unshift(diagram);
    persist();
    return diagram;
  });

export const update = (id, patch) =>
  mockCall((d) => {
    const diagram = find(d, id);
    const { title, scene, visibility, isFavorite } = patch;
    if (title !== undefined) diagram.title = title;
    if (scene !== undefined) {
      diagram.scene = scene;
      delete diagram.skeleton;
    }
    if (visibility !== undefined) diagram.visibility = visibility;
    if (isFavorite !== undefined) diagram.isFavorite = isFavorite;
    if (title !== undefined || scene !== undefined || visibility !== undefined)
      diagram.updatedAt = now();
    persist();
    return summary(diagram);
  });

export const markViewed = (id) =>
  mockCall((d) => {
    find(d, id).lastViewedAt = now();
    persist();
    return id;
  });

export const duplicate = (id) =>
  mockCall((d) => {
    const src = find(d, id);
    const ts = now();
    const copy = {
      ...structuredClone(src),
      id: uid(),
      title: `${src.title} (copy)`,
      isFavorite: false,
      createdAt: ts,
      updatedAt: ts,
      lastViewedAt: null,
    };
    d.diagrams.unshift(copy);
    persist();
    return summary(copy);
  });

export const remove = (id) =>
  mockCall((d) => {
    find(d, id);
    d.diagrams = d.diagrams.filter((g) => g.id !== id);
    d.comments = d.comments.filter(
      (c) => !(c.resourceType === "diagram" && c.resourceId === id),
    );
    delete d.shares[`diagram:${id}`];
    persist();
    return id;
  });
