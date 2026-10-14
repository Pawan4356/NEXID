import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Copy,
  Download,
  FileJson,
  Image,
  MessageSquare,
  MoreHorizontal,
  PenTool,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "../components/layout/Topbar";
import { SaveStatus } from "../components/notes/SaveStatus";
import { ShareDialog } from "../components/sharing/ShareDialog";
import { PresenceAvatars } from "../components/collab/Presence";
import { CommentsPanel } from "../components/collab/CommentsPanel";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  MockBadge,
  Spinner,
} from "../components/ui";
import {
  useDiagram,
  useDiagramMutations,
  useDiagrams,
} from "../hooks/useDiagrams";
import { useAutosave } from "../hooks/useUtils";

const DiagramCanvas = lazy(
  () => import("../components/diagrams/DiagramCanvas"),
);

function DiagramEditor({ diagram }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { update, duplicate, remove, markViewed } = useDiagramMutations();
  const { data: list = [] } = useDiagrams();
  // Live metadata (title, favorite, visibility) comes from the list cache.
  const meta = list.find((d) => d.id === diagram.id) ?? diagram;
  const [title, setTitle] = useState(diagram.title);
  const [showComments, setShowComments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const autosave = useAutosave(
    (patch) => update.mutateAsync({ id: diagram.id, patch }),
    900,
  );

  useEffect(() => {
    markViewed.mutate(diagram.id);
  }, [diagram.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const runExport = (fn, label) => async () => {
    try {
      await canvasRef.current[fn]();
    } catch (err) {
      toast.error(`${label} export failed: ${err.message}`);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          crumbs={[
            {
              label: "Diagrams",
              to: "/diagrams",
              icon: <PenTool className="size-4" />,
            },
          ]}
        >
          <SaveStatus
            status={autosave.status}
            updatedAt={meta.updatedAt}
            onRetry={autosave.flush}
          />
          <span className="mx-1" />
          <PresenceAvatars resourceType="diagram" resource={meta} />
          <ShareDialog
            resourceType="diagram"
            resource={meta}
            onVisibilityChange={(visibility) =>
              update.mutate({ id: diagram.id, patch: { visibility } })
            }
            trigger={
              <Button size="sm" variant="ghost" className="text-fg">
                Share
              </Button>
            }
          />
          <Menu>
            <MenuTrigger>
              <Button
                size="sm"
                variant="ghost"
                icon={Download}
                className="text-fg"
              >
                <span className="max-sm:hidden">Export</span>
              </Button>
            </MenuTrigger>
            <MenuContent align="end">
              <MenuLabel>Downloads a file from this browser</MenuLabel>
              <MenuItem icon={Image} onSelect={runExport("exportPng", "PNG")}>
                PNG image
              </MenuItem>
              <MenuItem icon={Image} onSelect={runExport("exportSvg", "SVG")}>
                SVG image
              </MenuItem>
              <MenuItem
                icon={FileJson}
                onSelect={runExport("exportJson", "JSON")}
              >
                Excalidraw file (.excalidraw)
              </MenuItem>
            </MenuContent>
          </Menu>
          <IconButton
            icon={MessageSquare}
            label="Comments"
            active={showComments}
            onClick={() => setShowComments((s) => !s)}
          />
          <IconButton
            icon={Star}
            label={
              meta.isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            className={
              meta.isFavorite ? "text-warning [&_svg]:fill-current" : ""
            }
            onClick={() =>
              update.mutate({
                id: diagram.id,
                patch: { isFavorite: !meta.isFavorite },
              })
            }
          />
          <Menu>
            <MenuTrigger>
              <IconButton icon={MoreHorizontal} label="Diagram actions" />
            </MenuTrigger>
            <MenuContent align="end">
              <MenuItem
                icon={Copy}
                onSelect={() =>
                  duplicate.mutate(diagram.id, {
                    onSuccess: (d) => navigate(`/diagrams/${d.id}`),
                  })
                }
              >
                Duplicate
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={Trash2}
                danger
                onSelect={() => setConfirmDelete(true)}
              >
                Delete
              </MenuItem>
            </MenuContent>
          </Menu>
        </Topbar>

        <div className="flex items-center gap-3 border-b border-line px-4 pb-2">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              autosave.schedule({ title: e.target.value });
            }}
            placeholder="Untitled diagram"
            aria-label="Diagram title"
            className="min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-faint"
          />
          <MockBadge detail="Scenes are saved in this browser's localStorage. The diagrams API doesn't exist yet. Exports are real local downloads." />
        </div>

        <div className="relative min-h-0 flex-1">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
                <Spinner /> Loading canvas…
              </div>
            }
          >
            <DiagramCanvas
              ref={canvasRef}
              diagram={diagram}
              onSceneChange={(scene) => autosave.schedule({ scene })}
            />
          </Suspense>
        </div>
      </div>
      {showComments && (
        <div className="max-sm:fixed max-sm:inset-0 max-sm:z-40 max-sm:flex">
          <CommentsPanel
            resourceType="diagram"
            resourceId={diagram.id}
            onClose={() => setShowComments(false)}
          />
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${title || "Untitled diagram"}"?`}
        description="There is no trash yet, so this can't be undone."
        onConfirm={async () => {
          autosave.cancel();
          await remove.mutateAsync(diagram.id);
          navigate("/diagrams");
        }}
      />
    </div>
  );
}

export default function DiagramPage() {
  const { diagramId } = useParams();
  const { data, isLoading, error } = useDiagram(diagramId);
  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
        <Spinner /> Loading diagram…
      </div>
    );
  if (error || !data)
    return (
      <div className="flex h-full flex-col">
        <Topbar crumbs={[{ label: "Diagrams", to: "/diagrams" }]} />
        <EmptyState
          icon={PenTool}
          title="This diagram doesn't exist"
          description="It may have been deleted, or it was created in another browser."
          action={
            <Link
              to="/diagrams"
              className="text-sm text-accent hover:underline"
            >
              All diagrams
            </Link>
          }
        />
      </div>
    );
  return <DiagramEditor key={data.id} diagram={data} />;
}
