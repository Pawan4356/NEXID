// Excalidraw canvas. Provides the drawing toolbar (select, rectangle, diamond,
// ellipse, arrow, line, draw, text, eraser), zoom and undo/redo out of the box.
// Lazy-loaded because Excalidraw is large.
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  Excalidraw,
  MainMenu,
  convertToExcalidrawElements,
  exportToBlob,
  exportToSvg,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "../../context/ThemeContext";

const versionOf = (elements) =>
  elements.reduce((acc, el) => acc + el.version, elements.length);

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const DiagramCanvas = forwardRef(function DiagramCanvas(
  { diagram, onSceneChange },
  ref,
) {
  const { resolved } = useTheme();
  const apiRef = useRef(null);

  const initialData = useMemo(() => {
    // Seed diagrams are stored as element skeletons; convert once.
    const elements =
      diagram.scene?.elements ??
      (diagram.skeleton
        ? convertToExcalidrawElements(diagram.skeleton, {
            regenerateIds: false,
          })
        : []);
    return {
      elements,
      appState: {
        ...(diagram.scene?.appState ?? {}),
        collaborators: new Map(),
      },
      files: diagram.scene?.files ?? {},
      scrollToContent: true,
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lastVersion = useRef(
    diagram.scene ? versionOf(initialData.elements) : -1,
  );

  useImperativeHandle(ref, () => ({
    async exportPng() {
      const api = apiRef.current;
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: true },
        files: api.getFiles(),
        mimeType: "image/png",
      });
      download(blob, `${diagram.title || "diagram"}.png`);
    },
    async exportSvg() {
      const api = apiRef.current;
      const svg = await exportToSvg({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: true },
        files: api.getFiles(),
      });
      download(
        new Blob([svg.outerHTML], { type: "image/svg+xml" }),
        `${diagram.title || "diagram"}.svg`,
      );
    },
    exportJson() {
      const api = apiRef.current;
      const json = serializeAsJSON(
        api.getSceneElements(),
        api.getAppState(),
        api.getFiles(),
        "local",
      );
      download(
        new Blob([json], { type: "application/json" }),
        `${diagram.title || "diagram"}.excalidraw`,
      );
    },
    elementCount: () => apiRef.current?.getSceneElements().length ?? 0,
  }));

  const onChange = (elements, appState, files) => {
    const v = versionOf(elements);
    if (v === lastVersion.current) return; // ignore pointer moves, selection, scrolling
    lastVersion.current = v;
    onSceneChange({
      elements: elements.filter((e) => !e.isDeleted),
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize ?? null,
      },
      files,
    });
  };

  return (
    <div className="nexid-canvas h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => (apiRef.current = api)}
        initialData={initialData}
        onChange={onChange}
        theme={resolved}
        name={diagram.title}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            toggleTheme: false,
            saveAsImage: false,
          },
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.Help />
        </MainMenu>
      </Excalidraw>
    </div>
  );
});

export default DiagramCanvas;
