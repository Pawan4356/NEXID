import {
  BookOpen,
  CalendarDays,
  FileText,
  Hand,
  Handshake,
  Lightbulb,
  Map as MapIcon,
  NotebookPen,
  Palette,
  Puzzle,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";

export const NOTE_ICON_OPTIONS = [
  ["file-text", "Document", FileText],
  ["notebook-pen", "Journal", NotebookPen],
  ["book-open", "Book", BookOpen],
  ["calendar-days", "Calendar", CalendarDays],
  ["map", "Map", MapIcon],
  ["puzzle", "Project", Puzzle],
  ["handshake", "People", Handshake],
  ["lightbulb", "Idea", Lightbulb],
  ["target", "Goal", Target],
  ["rocket", "Launch", Rocket],
  ["palette", "Design", Palette],
  ["wrench", "Build", Wrench],
  ["shield", "Private", Shield],
  ["sparkles", "Highlight", Sparkles],
  ["hand", "Welcome", Hand],
];

const LEGACY_ICONS = {
  "📄": "file-text",
  "👋": "hand",
  "🗺️": "map",
  "🧩": "puzzle",
  "🤝": "handshake",
  "📚": "book-open",
  "📖": "book-open",
  "🗓️": "calendar-days",
  "💡": "lightbulb",
  "✏️": "notebook-pen",
};

const ICONS = new Map(NOTE_ICON_OPTIONS.map(([name, , Icon]) => [name, Icon]));

export function normalizeNoteIcon(value) {
  return ICONS.has(value) ? value : LEGACY_ICONS[value] ?? "file-text";
}

export function NoteIcon({ name, className = "size-4", strokeWidth = 1.8 }) {
  const Icon = ICONS.get(normalizeNoteIcon(name)) ?? FileText;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
