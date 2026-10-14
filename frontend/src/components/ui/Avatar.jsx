import { useState } from "react";
import { cn, colorFor, initials } from "../../lib/utils";

const SIZES = { xs: "size-5 text-[9px]", sm: "size-6 text-[10px]", md: "size-8 text-xs", lg: "size-12 text-base", xl: "size-20 text-2xl" };
const DOT = { xs: "size-1.5", sm: "size-2", md: "size-2.5", lg: "size-3", xl: "size-4" };

export function Avatar({ user, size = "md", presence, className, ring }) {
  const [broken, setBroken] = useState(false);
  const name = user?.name ?? "";
  const src = !broken ? user?.avatar : null;
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img src={src} alt="" onError={() => setBroken(true)} className={cn("rounded-full object-cover", SIZES[size], ring && "ring-2 ring-bg")} />
      ) : (
        <span
          aria-hidden
          className={cn("flex items-center justify-center rounded-full font-medium text-white", SIZES[size], ring && "ring-2 ring-bg")}
          style={{ background: user?.color ?? colorFor(user?.id ?? name) }}
        >
          {initials(name)}
        </span>
      )}
      {presence && (
        <span
          className={cn("absolute right-0 bottom-0 rounded-full ring-2 ring-bg", DOT[size], presence === "editing" ? "bg-success" : presence === "viewing" ? "bg-accent" : "bg-faint")}
        />
      )}
    </span>
  );
}
