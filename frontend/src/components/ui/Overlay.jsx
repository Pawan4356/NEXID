// Styled wrappers around Radix primitives (dialogs, menus, popovers, tooltips).
import {
  DropdownMenu,
  Dialog,
  Popover as RPopover,
  Tooltip as RTooltip,
} from "radix-ui";
import { Check, ChevronRight, X } from "lucide-react";
import { cn } from "../../lib/utils";

const surface = "z-50 rounded-lg bg-elevated text-fg shadow-menu outline-none";

/* ---------- Tooltip ---------- */
export function Tooltip({ content, children, side = "bottom" }) {
  if (!content) return children;
  return (
    <RTooltip.Root delayDuration={350}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="z-60 max-w-64 rounded-md bg-[#0f0f0f] px-2 py-1 text-xs leading-snug text-white/90 shadow-lg"
        >
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}
export const TooltipProvider = RTooltip.Provider;

/* ---------- Dropdown menu ---------- */
export const Menu = DropdownMenu.Root;
export const MenuTrigger = (props) => (
  <DropdownMenu.Trigger asChild {...props} />
);

export function MenuContent({
  className,
  align = "start",
  sideOffset = 4,
  children,
  ...props
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(surface, "min-w-52 p-1", className)}
        {...props}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

const itemCls =
  "flex h-7 cursor-pointer items-center gap-2 rounded px-2 text-sm outline-none select-none data-[highlighted]:bg-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

export function MenuItem({
  icon: Icon,
  children,
  shortcut,
  danger,
  className,
  ...props
}) {
  return (
    <DropdownMenu.Item
      className={cn(itemCls, danger && "text-danger", className)}
      {...props}
    >
      {Icon && (
        <Icon className="size-4 shrink-0 opacity-75" strokeWidth={1.8} />
      )}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="text-xs text-faint">{shortcut}</span>}
    </DropdownMenu.Item>
  );
}

export function MenuCheckboxItem({
  icon: Icon,
  children,
  checked,
  onCheckedChange,
  ...props
}) {
  return (
    <DropdownMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => e.preventDefault()}
      className={itemCls}
      {...props}
    >
      {Icon && (
        <Icon className="size-4 shrink-0 opacity-75" strokeWidth={1.8} />
      )}
      <span className="flex-1">{children}</span>
      <DropdownMenu.ItemIndicator>
        <Check className="size-4" />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.CheckboxItem>
  );
}

export function MenuRadioGroup({ value, onValueChange, options }) {
  return (
    <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
      {options.map((o) => (
        <DropdownMenu.RadioItem
          key={o.value}
          value={o.value}
          onSelect={(e) => e.preventDefault()}
          className={itemCls}
        >
          {o.icon && (
            <o.icon className="size-4 shrink-0 opacity-75" strokeWidth={1.8} />
          )}
          <span className="flex-1">{o.label}</span>
          <DropdownMenu.ItemIndicator>
            <Check className="size-4" />
          </DropdownMenu.ItemIndicator>
        </DropdownMenu.RadioItem>
      ))}
    </DropdownMenu.RadioGroup>
  );
}

export function SubMenu({ icon: Icon, label, children }) {
  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger
        className={cn(itemCls, "data-[state=open]:bg-hover")}
      >
        {Icon && (
          <Icon className="size-4 shrink-0 opacity-75" strokeWidth={1.8} />
        )}
        <span className="flex-1">{label}</span>
        <ChevronRight className="size-3.5 opacity-60" />
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          sideOffset={6}
          className={cn(surface, "min-w-44 p-1")}
        >
          {children}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

export const MenuSeparator = () => (
  <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-line" />
);
export const MenuLabel = ({ children }) => (
  <DropdownMenu.Label className="px-2 pt-1.5 pb-1 text-xs text-faint">
    {children}
  </DropdownMenu.Label>
);

/* ---------- Popover ---------- */
export const Popover = RPopover.Root;
export const PopoverTrigger = (props) => (
  <RPopover.Trigger asChild {...props} />
);
export function PopoverContent({
  className,
  align = "start",
  sideOffset = 6,
  children,
  ...props
}) {
  return (
    <RPopover.Portal>
      <RPopover.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(surface, "p-3", className)}
        {...props}
      >
        {children}
      </RPopover.Content>
    </RPopover.Portal>
  );
}

/* ---------- Modal dialog ---------- */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  hideClose,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60" />
        <Dialog.Content
          className={cn(
            surface,
            "fixed top-[12vh] left-1/2 z-50 flex max-h-[80vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 flex-col overflow-hidden",
            className,
          )}
        >
          {title ? (
            <div className="flex items-start gap-3 border-b border-line px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="font-semibold">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-0.5 text-sm text-muted">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              {!hideClose && (
                <Dialog.Close
                  className="rounded p-1 text-muted hover:bg-hover hover:text-fg"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Dialog.Close>
              )}
            </div>
          ) : (
            <Dialog.Title className="sr-only">Dialog</Dialog.Title>
          )}
          {!description && (
            <Dialog.Description className="sr-only">
              {typeof title === "string" ? title : "Dialog"}
            </Dialog.Description>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
