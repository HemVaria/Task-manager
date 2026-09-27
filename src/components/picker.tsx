"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PickerOption {
  id: string;
  label: string;
  icon: ReactNode;
}

/**
 * Popover for choosing several items from a list. Typing filters the list;
 * Enter picks the first match or creates a new item with that name.
 */
export function MultiPicker({
  trigger,
  label,
  options,
  selected,
  placeholder,
  onToggle,
  onCreate,
  onRemove,
}: {
  trigger: ReactNode;
  label: string;
  options: PickerOption[];
  selected: string[];
  placeholder: string;
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
  onRemove?: (option: PickerOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = query.trim().toLowerCase();
  const matches = options.filter((o) => o.label.toLowerCase().includes(q));
  const exact = options.some((o) => o.label.toLowerCase() === q);

  const submit = () => {
    if (!q) return;
    if (matches.length > 0 && (exact || matches.length === 1)) {
      onToggle((options.find((o) => o.label.toLowerCase() === q) ?? matches[0]).id);
    } else {
      onCreate(query.trim());
    }
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-transparent px-1.5 py-1 text-left text-sm hover:border-line hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ originY: 0 }}
            className="absolute top-full left-0 z-20 mt-1 w-64 rounded-xl border border-line bg-bg p-1.5 shadow-float"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
              }
            }}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              maxLength={40}
              className="mb-1 h-8 w-full rounded-lg border border-line bg-subtle px-2.5 text-sm outline-none placeholder:text-fg-faint focus:border-accent/50 focus:bg-bg"
            />
            <ul role="listbox" aria-multiselectable="true" aria-label={label} className="max-h-56 overflow-y-auto">
              {matches.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <li key={option.id} className="group/opt flex items-center">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => onToggle(option.id)}
                      className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-sm hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
                    >
                      {option.icon}
                      <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="size-4 text-accent" aria-hidden />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(option)}
                        aria-label={`Remove ${option.label}`}
                        title={`Remove ${option.label} everywhere`}
                        className="ml-0.5 rounded-md p-1.5 text-fg-faint opacity-0 group-hover/opt:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 focus-visible:outline-none"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
              {q && !exact && (
                <li>
                  <button
                    type="button"
                    onClick={submit}
                    className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-accent hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:outline-none"
                  >
                    <Plus className="size-4" aria-hidden />
                    Create “{query.trim()}”
                  </button>
                </li>
              )}
              {!q && options.length === 0 && <li className="px-2 py-2 text-xs text-fg-faint">Type a name to create one.</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <span className={cn("px-1 text-sm text-fg-faint")}>{children}</span>;
}
