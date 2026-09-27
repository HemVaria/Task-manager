"use client";

import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Centered modal. Render it inside <AnimatePresence> so it can animate out.
 * Escape handling lives in TaskApp so layered overlays close in order.
 */
export function Dialog({
  title,
  onClose,
  children,
  className,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  // Return focus to whatever opened the dialog.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-[var(--backdrop)]"
        onClick={onClose}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-sm rounded-2xl border border-line bg-bg p-5 shadow-float",
          className,
        )}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.14 } }}
        transition={{ type: "spring", stiffness: 460, damping: 32 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-1.5 text-sm leading-relaxed text-fg-muted">{message}</div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-line px-3.5 text-sm font-medium hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Cancel
        </button>
        <button
          type="button"
          autoFocus
          onClick={onConfirm}
          className="h-9 rounded-lg bg-danger px-3.5 text-sm font-medium text-white hover:brightness-95 focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-subtle px-1 font-mono text-[11px] leading-none text-fg-faint",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
