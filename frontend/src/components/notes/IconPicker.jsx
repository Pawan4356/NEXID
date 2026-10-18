import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui";
import { NOTE_ICON_OPTIONS, NoteIcon, normalizeNoteIcon } from "./noteIcons";

export function IconPicker({ value, onChange, trigger }) {
  const [open, setOpen] = useState(false);
  const pick = (name) => {
    onChange(name);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent className="w-78 p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-muted">Icon</span>
          <button
            onClick={() => pick("file-text")}
            className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-hover"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-9 gap-0.5">
          {NOTE_ICON_OPTIONS.map(([name, label]) => (
            <button
              key={name}
              onClick={() => pick(name)}
              className={`flex size-8 items-center justify-center rounded text-lg hover:bg-hover ${normalizeNoteIcon(value) === name ? "bg-active" : ""}`}
              aria-label={`Use ${label} icon`}
            >
              <NoteIcon name={name} className="size-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
