import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui";

const EMOJIS =
  "📄 📝 📚 📖 🗒️ 📌 📎 🗂️ 🗃️ 🗓️ 📅 ⏰ ✅ ☑️ 🎯 🚀 💡 🧠 🧩 🛠️ ⚙️ 🔧 🧪 🔬 📊 📈 🗺️ 🧭 🏁 🔥 ⭐ 💬 🤝 👋 🎨 ✏️ 🖊️ 🧾 💼 🏠 🌱 🌍 ☕ 🎵 🎮 🏃 🧘 ✈️ 🍕 ❤️ 🔒 🌐".split(" ");

export function IconPicker({ value, onChange, trigger }) {
  const [open, setOpen] = useState(false);
  const pick = (e) => {
    onChange(e);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[312px] p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-muted">Icon</span>
          <button onClick={() => pick("📄")} className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-hover">
            Reset
          </button>
        </div>
        <div className="grid grid-cols-9 gap-0.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => pick(e)}
              className={`flex size-8 items-center justify-center rounded text-lg hover:bg-hover ${value === e ? "bg-active" : ""}`}
              aria-label={`Use ${e} as icon`}
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
