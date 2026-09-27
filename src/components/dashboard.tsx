"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

export type DashboardCard = "all" | "today" | "in_progress" | "completed" | "overdue";

const CARDS: { id: DashboardCard; label: string; valueClass: string }[] = [
  { id: "all", label: "All tasks", valueClass: "text-fg" },
  { id: "today", label: "Due today", valueClass: "text-accent" },
  { id: "in_progress", label: "In progress", valueClass: "text-[var(--progress)]" },
  { id: "completed", label: "Completed", valueClass: "text-fg-faint" },
  { id: "overdue", label: "Overdue", valueClass: "text-danger" },
];

/** Counts up from 0 on first render and springs to each new value after that. */
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 180, damping: 24 });
  const display = useTransform(spring, (v) => Math.round(v));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return (
    <>
      <motion.span aria-hidden>{display}</motion.span>
      <span className="sr-only">{value}</span>
    </>
  );
}

export function Dashboard({
  counts,
  active,
  onSelect,
}: {
  counts: Record<DashboardCard, number>;
  active: DashboardCard | null;
  onSelect: (card: DashboardCard) => void;
}) {
  return (
    <section
      aria-label="Summary"
      data-tour="dashboard"
      className="-mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pt-0.5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5"
    >
      {CARDS.map((card, index) => {
        const alert = card.id === "overdue" && counts.overdue > 0;
        const isActive = active === card.id;
        return (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            aria-pressed={isActive}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30, delay: index * 0.04 } }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "relative flex min-w-[124px] shrink-0 snap-start flex-col items-start overflow-hidden rounded-xl border px-4 py-3 text-left shadow-soft transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:min-w-0",
              alert ? "border-danger/25 bg-danger-soft hover:border-danger/40" : "border-line bg-bg hover:border-line-strong",
              isActive && !alert && "border-accent/50 ring-1 ring-accent/30",
              isActive && alert && "ring-1 ring-danger/40",
            )}
          >
            {alert && (
              <motion.span
                aria-hidden
                className="absolute top-3 right-3 size-2 rounded-full bg-danger"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span className={cn("text-[13px]", alert ? "text-danger" : "text-fg-muted")}>{card.label}</span>
            <span
              className={cn(
                "mt-1 text-[28px] leading-none font-semibold tracking-tight tabular-nums",
                card.id === "overdue" && !alert ? "text-fg-faint" : card.valueClass,
              )}
            >
              <AnimatedNumber value={counts[card.id]} />
            </span>
            {isActive && (
              <motion.span
                layoutId="dashboard-active"
                aria-hidden
                className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full", alert ? "bg-danger" : "bg-accent")}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
          </motion.button>
        );
      })}
    </section>
  );
}
