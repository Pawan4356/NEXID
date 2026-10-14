import clsx from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our theme tokens so e.g. "text-muted" and
// "text-sm" aren't treated as conflicting.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "bg",
        "sidebar",
        "elevated",
        "hover",
        "active",
        "subtle",
        "fg",
        "muted",
        "faint",
        "line",
        "line-strong",
        "accent",
        "accent-hover",
        "accent-soft",
        "danger",
        "danger-soft",
        "success",
        "warning",
      ],
    },
  },
});

export const cn = (...args) => twMerge(clsx(...args));

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(isoString) {
  if (!isoString) return "";
  const seconds = (new Date(isoString).getTime() - Date.now()) / 1000;
  if (Math.abs(seconds) < 45) return "just now";
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size || unit === "minute")
      return rtf.format(Math.round(seconds / size), unit);
  }
  return "";
}

export const formatDate = (
  isoString,
  opts = { month: "short", day: "numeric", year: "numeric" },
) => (isoString ? new Date(isoString).toLocaleDateString(undefined, opts) : "");

// Due dates are stored as YYYY-MM-DD (local calendar day).
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const addDaysStr = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function describeDue(dateStr) {
  if (!dateStr) return null;
  const today = todayStr();
  const tomorrow = addDaysStr(1);
  const yesterday = addDaysStr(-1);
  if (dateStr === today) return { label: "Today", tone: "warning" };
  if (dateStr === tomorrow) return { label: "Tomorrow", tone: "default" };
  if (dateStr === yesterday) return { label: "Yesterday", tone: "danger" };
  const [y, m, d] = dateStr.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(y !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
  return { label, tone: dateStr < today ? "danger" : "default" };
}

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";

const PALETTE = [
  "#d9730d",
  "#0f7b6c",
  "#9065b0",
  "#2383e2",
  "#c14c8a",
  "#dfab01",
  "#64473a",
  "#e03e3e",
];
export function colorFor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const modKey = isMac ? "⌘" : "Ctrl";

// Plain text from BlockNote blocks, for search and previews.
export function blocksToText(blocks = [], limit = Infinity) {
  let out = "";
  const walk = (list) => {
    for (const b of list) {
      if (out.length > limit) return;
      const c = b.content;
      if (typeof c === "string") out += c + " ";
      else if (Array.isArray(c))
        out +=
          c
            .map(
              (x) =>
                x.text ??
                (Array.isArray(x.content)
                  ? x.content.map((y) => y.text).join("")
                  : ""),
            )
            .join("") + " ";
      if (b.children?.length) walk(b.children);
    }
  };
  walk(blocks);
  return out.trim();
}
