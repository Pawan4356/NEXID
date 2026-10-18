import { useEffect, useRef } from "react";

export function DiagramPreview({ elements, files, className }) {
  const previewRef = useRef(null);

  useEffect(() => {
    let active = true;
    import("@excalidraw/excalidraw").then(({ exportToSvg }) =>
      exportToSvg({
        elements,
        exportPadding: 24,
        appState: {
          exportBackground: true,
          exportWithDarkMode: false,
          theme: "light",
          viewBackgroundColor: "#ffffff",
        },
        files,
      }).then((svg) => {
        if (!active || !previewRef.current) return;
        svg.setAttribute("aria-label", "Diagram preview");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";
        previewRef.current.replaceChildren(svg);
      }),
    );

    return () => {
      active = false;
    };
  }, [elements, files]);

  return (
    <div
      ref={previewRef}
      className={className ?? "h-32 w-full"}
      style={{
        backgroundColor: "#ffffff",
        backgroundImage:
          "radial-gradient(#d9d9d9 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      }}
      aria-label="Diagram preview"
    />
  );
}