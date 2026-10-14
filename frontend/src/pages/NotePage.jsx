import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  FileText,
  Heading2,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Smile,
  Star,
} from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { NoteActionsMenu } from "../components/notes/NoteActionsMenu";
import { IconPicker } from "../components/notes/IconPicker";
import { SaveStatus } from "../components/notes/SaveStatus";
import { ShareDialog } from "../components/sharing/ShareDialog";
import { VISIBILITY } from "../components/sharing/visibility";
import { PresenceAvatars } from "../components/collab/Presence";
import { CommentsPanel } from "../components/collab/CommentsPanel";
import {
  Button,
  EmptyState,
  IconButton,
  MenuLabel,
  MenuSeparator,
  MockBadge,
  Skeleton,
  Switch,
  Tooltip,
} from "../components/ui";
import {
  useCreateNote,
  useMarkNoteViewed,
  useNote,
  useNoteTree,
  useUpdateNote,
} from "../hooks/useNotes";
import { useComments } from "../hooks/useCollab";
import { useAutosave } from "../hooks/useUtils";
import { qk } from "../lib/queryKeys";
import { blocksToText, cn, formatDate } from "../lib/utils";

const NoteEditor = lazy(() => import("../components/notes/NoteEditor"));

const FONTS = {
  default: { label: "Default", css: "var(--font-sans)", sample: "Ag" },
  serif: { label: "Serif", css: "var(--font-serif)", sample: "Ag" },
  mono: { label: "Mono", css: "var(--font-mono)", sample: "Ag" },
};

function AutoGrowTitle({ value, onChange, onEnter, readOnly }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      placeholder="New page"
      aria-label="Page title"
      data-page-title
      className="w-full resize-none overflow-hidden bg-transparent text-[40px] leading-tight font-bold tracking-tight outline-none placeholder:text-faint/70"
    />
  );
}

function SettingsItems({ note, setSettings }) {
  const s = note.settings;
  const row =
    "flex h-8 items-center justify-between gap-4 rounded px-2 text-sm hover:bg-hover cursor-pointer";
  return (
    <>
      <MenuLabel>Style</MenuLabel>
      <div className="grid grid-cols-3 gap-1 px-1 pb-1">
        {Object.entries(FONTS).map(([k, f]) => (
          <button
            key={k}
            onClick={() => setSettings({ font: k })}
            className={cn(
              "flex flex-col items-center rounded-md py-1.5 hover:bg-hover",
              s.font === k && "text-accent",
            )}
            aria-pressed={s.font === k}
          >
            <span className="text-xl" style={{ fontFamily: f.css }}>
              {f.sample}
            </span>
            <span className="text-xs text-muted">{f.label}</span>
          </button>
        ))}
      </div>
      <MenuSeparator />
      <label className={row}>
        Small text{" "}
        <Switch
          checked={s.smallText}
          onChange={(v) => setSettings({ smallText: v })}
          label="Small text"
        />
      </label>
      <label className={row}>
        Full width{" "}
        <Switch
          checked={s.fullWidth}
          onChange={(v) => setSettings({ fullWidth: v })}
          label="Full width"
        />
      </label>
      <label className={row}>
        Lock page{" "}
        <Switch
          checked={s.locked}
          onChange={(v) => setSettings({ locked: v })}
          label="Lock page"
        />
      </label>
      <MenuSeparator />
    </>
  );
}

function SubPages({ parentId }) {
  const { children } = useNoteTree();
  const kids = children.get(parentId) ?? [];
  if (!kids.length) return null;
  return (
    <div className="mt-6 px-13.5 max-sm:px-6">
      {kids.map((k) => (
        <Link
          key={k.id}
          to={`/notes/${k.id}`}
          className="flex items-center gap-2 rounded px-1 py-1 text-[15px] hover:bg-hover"
        >
          <span>{k.icon}</span>
          <span className="border-b border-line-strong font-medium">
            {k.title || "Untitled"}
          </span>
        </Link>
      ))}
    </div>
  );
}

function NoteView({ note }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const update = useUpdateNote();
  const createNote = useCreateNote();
  const markViewed = useMarkNoteViewed();
  const { ancestors } = useNoteTree();
  const comments = useComments("note", note.id);
  const [title, setTitle] = useState(note.title);
  const [showComments, setShowComments] = useState(false);
  const [wordCount, setWordCount] = useState(
    () => blocksToText(note.content).split(/\s+/).filter(Boolean).length,
  );
  const autosave = useAutosave((patch) =>
    update.mutateAsync({ id: note.id, patch }),
  );
  const locked = note.settings.locked;
  const openComments = (comments.data ?? []).filter((c) => !c.resolved).length;

  useEffect(() => {
    markViewed.mutate(note.id);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTitle = (v) => {
    setTitle(v);
    // Reflect the new title in the sidebar immediately; persistence is debounced.
    qc.setQueryData(qk.notes, (list) =>
      list?.map((n) => (n.id === note.id ? { ...n, title: v } : n)),
    );
    autosave.schedule({ title: v });
  };

  const onContent = (blocks) => {
    setWordCount(blocksToText(blocks).split(/\s+/).filter(Boolean).length);
    autosave.schedule({ content: blocks });
  };

  const setSettings = (patch) =>
    update.mutate({ id: note.id, patch: { settings: patch } });
  const setVisibility = (visibility) =>
    update.mutate({ id: note.id, patch: { visibility } });

  const crumbs = [...ancestors(note.id), { ...note, title }].map((n) => ({
    to: n.id === note.id ? undefined : `/notes/${n.id}`,
    label: n.title || "Untitled",
    icon: n.icon,
  }));
  const V = VISIBILITY[note.visibility];
  const width = note.settings.fullWidth
    ? "max-w-none px-6 sm:px-16"
    : "max-w-[816px]";
  const font = FONTS[note.settings.font]?.css;

  const addSubPage = () =>
    createNote.mutate(
      { parentId: note.id },
      { onSuccess: (n) => navigate(`/notes/${n.id}`) },
    );

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar crumbs={crumbs}>
          <SaveStatus
            status={autosave.status}
            updatedAt={note.updatedAt}
            onRetry={autosave.flush}
          />
          <span className="mx-1" />
          <PresenceAvatars resourceType="note" resource={note} />
          <ShareDialog
            resourceType="note"
            resource={note}
            onVisibilityChange={setVisibility}
            trigger={
              <Button size="sm" variant="ghost" className="text-fg">
                Share
              </Button>
            }
          />
          <Tooltip content="Comments">
            <span className="relative">
              <IconButton
                icon={MessageSquare}
                label="Comments"
                active={showComments}
                onClick={() => setShowComments((s) => !s)}
              />
              {openComments > 0 && (
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-white">
                  {openComments}
                </span>
              )}
            </span>
          </Tooltip>
          <IconButton
            icon={Star}
            label={
              note.isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            className={
              note.isFavorite ? "text-warning [&_svg]:fill-current" : ""
            }
            onClick={() =>
              update.mutate({
                id: note.id,
                patch: { isFavorite: !note.isFavorite },
              })
            }
          />
          <NoteActionsMenu
            note={note}
            align="end"
            onRename={() =>
              document.querySelector("[data-page-title]")?.focus()
            }
            trigger={
              <IconButton
                icon={MoreHorizontal}
                label="Page settings and actions"
              />
            }
            extra={
              <>
                <MenuSeparator />
                <SettingsItems note={note} setSettings={setSettings} />
                <p className="px-2 pb-1 text-xs text-faint">
                  {wordCount} words · Created {formatDate(note.createdAt)}
                </p>
              </>
            }
          />
        </Topbar>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={cn("mx-auto pt-16 pb-40", width)}>
            <div className="group px-13.5 max-sm:px-6">
              <IconPicker
                value={note.icon}
                onChange={(icon) =>
                  update.mutate({ id: note.id, patch: { icon } })
                }
                trigger={
                  <button
                    className="-ml-1 mb-2 flex size-19.5 items-center justify-center rounded-md text-[64px] leading-none hover:bg-hover"
                    aria-label="Change icon"
                    disabled={locked}
                  >
                    {note.icon}
                  </button>
                }
              />
              <div className="mb-1 flex h-7 items-center gap-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <IconPicker
                  value={note.icon}
                  onChange={(icon) =>
                    update.mutate({ id: note.id, patch: { icon } })
                  }
                  trigger={
                    <Button size="sm" variant="ghost" icon={Smile}>
                      Change icon
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={MessageSquare}
                  onClick={() => setShowComments(true)}
                >
                  Add comment
                </Button>
              </div>
              <AutoGrowTitle
                value={title}
                onChange={onTitle}
                onEnter={() => editorRef.current?.focusStart()}
                readOnly={locked}
              />
              <div className="mt-2 mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <V.icon className="size-3.5" /> {V.label}
                </span>
                {locked && (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <Lock className="size-3.5" /> Locked
                  </span>
                )}
                <MockBadge detail="This page is stored in your browser's localStorage. The notes API doesn't exist yet." />
              </div>
            </div>

            <div
              className="nexid-editor"
              style={{
                "--editor-font": font,
                "--editor-size": note.settings.smallText ? "14px" : "16px",
              }}
            >
              <Suspense
                fallback={
                  <div className="space-y-3 px-13.5 max-sm:px-6">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                }
              >
                <NoteEditor
                  ref={editorRef}
                  initialContent={note.content}
                  editable={!locked}
                  onChange={onContent}
                />
                {!locked && (
                  <div className="mt-3 flex flex-wrap gap-1 px-13.5 max-sm:px-6">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={FileText}
                      onClick={() => editorRef.current?.addBlock("paragraph")}
                    >
                      Text
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={CheckSquare}
                      onClick={() =>
                        editorRef.current?.addBlock("checkListItem")
                      }
                    >
                      To-do
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Heading2}
                      onClick={() =>
                        editorRef.current?.addBlock("heading", { level: 2 })
                      }
                    >
                      Heading
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Plus}
                      onClick={addSubPage}
                      loading={createNote.isPending}
                    >
                      Sub-page
                    </Button>
                  </div>
                )}
              </Suspense>
            </div>

            <SubPages parentId={note.id} />
          </div>
        </div>
      </div>
      {showComments && (
        <div className="max-sm:fixed max-sm:inset-0 max-sm:z-40 max-sm:flex">
          <CommentsPanel
            resourceType="note"
            resourceId={note.id}
            onClose={() => setShowComments(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function NotePage() {
  const { noteId } = useParams();
  const { data: note, isLoading, error } = useNote(noteId);

  if (isLoading)
    return (
      <div className="flex h-full flex-col">
        <Topbar />
        <div className="mx-auto w-full max-w-204 space-y-4 px-13.5 pt-24">
          <Skeleton className="size-16" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );

  if (error || !note)
    return (
      <div className="flex h-full flex-col">
        <Topbar />
        <EmptyState
          icon={FileText}
          title="This page doesn't exist"
          description="It may have been deleted, or it was created in a different browser (notes are stored locally for now)."
          action={
            <Link to="/" className="text-sm text-accent hover:underline">
              Back to Home
            </Link>
          }
        />
      </div>
    );

  // key: remount editor + autosave state when switching pages.
  return <NoteView key={note.id} note={note} />;
}
