"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Draws a divider above this option. */
  separated?: boolean;
}

type Variant = "pill" | "field" | "mini";

const TRIGGER: Record<Variant, string> = {
  pill: "h-8 rounded-lg border px-2.5 text-sm",
  field: "h-8 rounded-lg border px-2.5 text-sm",
  mini: "h-7 rounded-md border px-2 text-xs",
};

/**
 * Custom listbox dropdown that matches the app (instead of the OS menu).
 * Keyboard: ↑/↓ or type a letter to move, Enter to pick, Esc to close.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  variant = "field",
  icon,
  placeholder,
  active = false,
  onClear,
  align = "start",
  fixedIcon = false,
  className,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name, also shown as the heading inside the menu. */
  label: string;
  variant?: Variant;
  /** Icon shown when the selected option has none (or when showing the placeholder). */
  icon?: ReactNode;
  /** Text shown instead of the selected label, e.g. "Project" for an unfiltered pill. */
  placeholder?: string;
  active?: boolean;
  onClear?: () => void;
  align?: "start" | "end";
  /** Always show `icon` on the trigger, even when the selected option has its own. */
  fixedIcon?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Move focus into the list when it opens (autoFocus only applies to form controls).
  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Keep the highlighted option in view while arrowing through a long list.
  // Scroll only the list itself: scrollIntoView would also scroll clipped ancestors.
  useEffect(() => {
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!open || !list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [open, activeIndex]);

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const pick = (index: number) => {
    const option = options[index];
    if (!option) return;
    if (option.value !== value) onChange(option.value);
    close();
  };

  const onTriggerKey = (event: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      openMenu();
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    const last = options.length - 1;
    // Keys typed in the menu belong to the menu, not the app's global shortcuts.
    if (event.key !== "Tab") event.stopPropagation();
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i >= last ? 0 : i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? last : i - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        pick(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (event.key.length === 1) {
          const letter = event.key.toLowerCase();
          const order = [...options.keys()].map((k) => (activeIndex + 1 + k) % options.length);
          const match = order.find((i) => options[i].label.toLowerCase().startsWith(letter));
          if (match !== undefined) setActiveIndex(match);
        }
    }
  };

  const showPlaceholder = placeholder !== undefined && !active;
  const triggerIcon = showPlaceholder || fixedIcon ? icon : (selected?.icon ?? icon);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${selected?.label ?? ""}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
        className={cn(
          "inline-flex max-w-56 items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
          TRIGGER[variant],
          active
            ? "border-accent/40 bg-accent-soft text-accent"
            : "border-line bg-bg text-fg-muted hover:border-line-strong hover:text-fg",
          variant === "field" && !active && "text-fg",
          open && !active && "border-line-strong text-fg",
          active && onClear && "pr-7",
        )}
      >
        {triggerIcon && <span className="grid shrink-0 place-items-center">{triggerIcon}</span>}
        <span className="truncate">{showPlaceholder ? placeholder : selected?.label}</span>
        {!(active && onClear) && (
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="ml-0.5 shrink-0 opacity-60">
            <ChevronDown className={variant === "mini" ? "size-3" : "size-3.5"} aria-hidden />
          </motion.span>
        )}
      </button>

      {active && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute top-1/2 right-1.5 grid size-5 -translate-y-1/2 place-items-center rounded text-accent/70 hover:bg-accent/15 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 560, damping: 36 }}
            style={{ originY: 0, originX: align === "end" ? 1 : 0 }}
            className={cn(
              "absolute top-full z-30 mt-1.5 w-max max-w-72 min-w-full rounded-xl border border-line bg-bg p-1 shadow-float",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            <div className="px-2 pt-1 pb-1.5 text-[11px] font-medium tracking-wide text-fg-faint uppercase">{label}</div>
            <ul
              ref={listRef}
              id={`${id}-list`}
              role="listbox"
              aria-label={label}
              tabIndex={-1}
              aria-activedescendant={`${id}-opt-${activeIndex}`}
              onKeyDown={onListKey}
              className="max-h-72 overflow-y-auto outline-none"
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return [
                  option.separated && <li key={`${option.value}-sep`} role="separator" className="mx-1 my-1 h-px bg-line" />,
                  <li
                    key={option.value}
                    id={`${id}-opt-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => pick(index)}
                    className={cn(
                      "flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm text-fg",
                      isActive && "bg-hover",
                    )}
                  >
                    <span className="grid w-4 shrink-0 place-items-center text-fg-muted">{option.icon}</span>
                    <span className={cn("min-w-0 flex-1 truncate pr-4", isSelected && "font-medium")}>{option.label}</span>
                    {isSelected && <Check className="size-4 shrink-0 text-accent" aria-hidden />}
                  </li>,
                ];
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
