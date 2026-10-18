import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ExternalLink, Maximize2, PencilLine, X } from "lucide-react";
import {
  createReactBlockSpec,
  createReactInlineContentSpec,
} from "@blocknote/react";
import { DiagramPreview } from "../diagrams/DiagramPreview";
import { useDiagram } from "../../hooks/useDiagrams";
import { IconButton } from "../ui";

function FileReference({ block }) {
  return (
    <Link
      to={`/notes/${block.props.noteId}`}
      className="my-2 inline-flex max-w-full items-center gap-2 rounded-md border border-line-strong bg-bg px-3 py-2 text-sm font-medium text-fg hover:border-accent hover:bg-hover"
    >
      <ExternalLink className="size-4 shrink-0 text-muted" />
      <span className="truncate">{block.props.title || "Untitled page"}</span>
    </Link>
  );
}

function FileReferenceInline({ inlineContent, contentRef }) {
  return (
    <Link
      ref={contentRef}
      to={`/notes/${inlineContent.props.noteId}`}
      contentEditable={false}
      className="mx-1 inline-flex max-w-full items-center gap-1 rounded-md border border-line-strong bg-bg px-2 py-1 align-middle text-sm font-medium text-fg hover:border-accent hover:bg-hover"
    >
      <ExternalLink className="size-3.5 shrink-0 text-muted" />
      <span className="truncate">
        {inlineContent.props.title || "Untitled page"}
      </span>
    </Link>
  );
}

function DiagramSection({ block, editor }) {
  const navigate = useNavigate();
  const { data: diagram } = useDiagram(block.props.diagramId);
  const [fullScreen, setFullScreen] = useState(false);
  const elements = diagram?.scene?.elements ?? diagram?.previewElements ?? [];
  const files = diagram?.scene?.files ?? diagram?.previewFiles ?? {};
  const title = diagram?.title || block.props.title || "Untitled diagram";
  const closeFullScreen = () => {
    setFullScreen(false);
    requestAnimationFrame(() => editor.focusLastText?.());
  };

  useEffect(() => {
    if (!fullScreen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeFullScreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullScreen]);

  return (
    <section className="my-4 w-full overflow-hidden bg-transparent">
      <div className="relative h-80 w-full bg-white">
        {elements.length ? (
          <DiagramPreview
            elements={elements}
            files={files}
            className="h-full w-full overflow-hidden"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Empty diagram
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <IconButton
            icon={PencilLine}
            label="Edit diagram"
            size="sm"
            className="bg-white/90 text-black/70 shadow-sm hover:text-black"
            onClick={() => navigate(`/diagrams/${block.props.diagramId}`)}
          />
          <IconButton
            icon={Maximize2}
            label="Open diagram full screen"
            size="sm"
            className="bg-white/90 text-black/70 shadow-sm hover:text-black"
            onClick={() => setFullScreen(true)}
          />
        </div>
      </div>
      <div className="py-2 text-center text-xs font-bold italic text-fg">
        {title}
      </div>
      {fullScreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
            <span className="truncate font-medium">{title}</span>
            <IconButton
              icon={X}
              label="Close full screen preview"
              onClick={closeFullScreen}
            />
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f7f7f5] p-6">
            <div className="h-[min(75vh,720px)] w-full max-w-6xl bg-white">
              {elements.length && (
                <DiagramPreview
                  elements={elements}
                  files={files}
                  className="h-full w-full overflow-hidden"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export const fileReferenceBlock = createReactBlockSpec(
  {
    type: "fileReference",
    propSchema: {
      noteId: { default: "" },
      title: { default: "" },
    },
    content: "none",
  },
  { render: FileReference },
);

export const fileReferenceInline = createReactInlineContentSpec(
  {
    type: "fileReferenceInline",
    propSchema: {
      noteId: { default: "" },
      title: { default: "" },
    },
    content: "none",
  },
  { render: FileReferenceInline },
);

export const diagramSectionBlock = createReactBlockSpec(
  {
    type: "diagramSection",
    propSchema: {
      diagramId: { default: "" },
      title: { default: "" },
    },
    content: "none",
  },
  { render: DiagramSection },
);