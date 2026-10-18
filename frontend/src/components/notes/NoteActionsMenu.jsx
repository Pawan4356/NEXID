import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Copy, Link2, PencilLine, Star, StarOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../ui";
import {
  useDeleteNote,
  useDuplicateNote,
  useNoteTree,
  useUpdateNote,
} from "../../hooks/useNotes";
import { timeAgo } from "../../lib/utils";

/** Rename / favorite / duplicate / copy link / delete — used in the sidebar and the page header. */
export function NoteActionsMenu({
  note,
  trigger,
  onRename,
  align = "start",
  extra,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { countDescendants, ancestors } = useNoteTree();
  const update = useUpdateNote();
  const duplicate = useDuplicateNote();
  const remove = useDeleteNote();
  const subCount = countDescendants(note.id);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/notes/${note.id}`,
      );
      toast.success("Link copied", {
        description: "Only you can open it until the sharing API exists.",
      });
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  };

  const onDelete = async () => {
    const parent =
      location.pathname === `/notes/${note.id}`
        ? ancestors(note.id).at(-1)
        : null;
    const removed = await remove.mutateAsync(note.id);
    const viewing = removed.some((id) => location.pathname === `/notes/${id}`);
    if (viewing) {
      navigate(parent ? `/notes/${parent.id}` : "/");
    }
    toast.success(
      `Deleted "${note.title || "Untitled"}"${removed.length > 1 ? ` and ${removed.length - 1} sub-page(s)` : ""}`,
    );
  };

  return (
    <>
      <Menu>
        <MenuTrigger>{trigger}</MenuTrigger>
        <MenuContent
          align={align}
          className="w-60"
          onCloseAutoFocus={(e) => onRename && e.preventDefault()}
        >
          <MenuItem
            icon={note.isFavorite ? StarOff : Star}
            onSelect={() =>
              update.mutate({
                id: note.id,
                patch: { isFavorite: !note.isFavorite },
              })
            }
          >
            {note.isFavorite ? "Remove from favorites" : "Add to favorites"}
          </MenuItem>
          <MenuSeparator />
          {onRename && (
            <MenuItem icon={PencilLine} onSelect={onRename}>
              Rename
            </MenuItem>
          )}
          <MenuItem
            icon={Copy}
            onSelect={() =>
              duplicate.mutate(note.id, {
                onSuccess: (copy) => {
                  toast.success(`Duplicated as "${copy.title}"`);
                  navigate(`/notes/${copy.id}`);
                },
              })
            }
          >
            Duplicate
          </MenuItem>
          <MenuItem icon={Link2} onSelect={copyLink}>
            Copy link
          </MenuItem>
          {extra}
          <MenuSeparator />
          <MenuItem icon={Trash2} danger onSelect={() => setConfirmOpen(true)}>
            Delete
          </MenuItem>
          <MenuSeparator />
          <p className="px-2 py-1 text-xs text-faint">
            Last edited {timeAgo(note.updatedAt)}
          </p>
        </MenuContent>
      </Menu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${note.title || "Untitled"}"?`}
        description={
          subCount
            ? `This also deletes ${subCount} sub-page${subCount > 1 ? "s" : ""} and their comments. There is no trash yet, so this can't be undone.`
            : "There is no trash yet, so this can't be undone."
        }
        onConfirm={onDelete}
      />
    </>
  );
}
