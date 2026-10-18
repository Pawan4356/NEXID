import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Copy,
  MoreHorizontal,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import {
  ConfirmDialog,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../ui";
import { useDiagramMutations } from "../../hooks/useDiagrams";
import { VISIBILITY } from "../sharing/visibility";
import { timeAgo } from "../../lib/utils";
import { DiagramPreview } from "./DiagramPreview";

function Thumb({ elements, files }) {
  return (
    <div className="relative overflow-hidden rounded-t-lg border-b border-line">
      {elements?.length ? (
        <DiagramPreview elements={elements} files={files} />
      ) : (
        <div className="h-32 bg-white" />
      )}
    </div>
  );
}

export function DiagramCard({ diagram }) {
  const { update, duplicate, remove } = useDiagramMutations();
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  const V = VISIBILITY[diagram.visibility];
  return (
    <div className="group relative rounded-lg border border-line bg-bg transition-shadow hover:shadow-[0_2px_8px_rgba(15,15,15,0.08)]">
      <Link to={`/diagrams/${diagram.id}`} className="block">
        <Thumb elements={diagram.previewElements} files={diagram.previewFiles} />
        <div className="p-3">
          <p className="truncate text-sm font-medium">
            {diagram.title || "Untitled diagram"}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <V.icon className="size-3" /> {V.label} · Edited{" "}
            {timeAgo(diagram.updatedAt)}
          </p>
        </div>
      </Link>
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100">
        <Menu>
          <MenuTrigger>
            <IconButton
              icon={MoreHorizontal}
              label="Diagram actions"
              className="bg-elevated shadow-menu"
            />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem
              icon={diagram.isFavorite ? StarOff : Star}
              onSelect={() =>
                update.mutate({
                  id: diagram.id,
                  patch: { isFavorite: !diagram.isFavorite },
                })
              }
            >
              {diagram.isFavorite
                ? "Remove from favorites"
                : "Add to favorites"}
            </MenuItem>
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
            <MenuItem icon={Trash2} danger onSelect={() => setConfirm(true)}>
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete "${diagram.title}"?`}
        description="There is no trash yet, so this can't be undone."
        onConfirm={() => remove.mutateAsync(diagram.id)}
      />
    </div>
  );
}
