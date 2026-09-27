"use client";

import { motion } from "motion/react";

/**
 * Start-up loader. Animated with CSS (see globals.css) so it plays from the very
 * first paint, before JavaScript has loaded. Render it inside <AnimatePresence>
 * so it can fade away once the app is ready.
 */
export function Splash() {
  return (
    <motion.div
      initial={false}
      exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
      className="fixed inset-0 z-[70] grid place-items-center bg-bg"
      role="status"
      aria-label="Loading Tasks"
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <span className="splash-glow absolute -inset-6 rounded-[32px] bg-accent/25 blur-2xl" aria-hidden />
          <svg viewBox="0 0 64 64" className="splash-mark relative size-16" aria-hidden>
            <rect width="64" height="64" rx="18" fill="var(--accent)" />
            <circle
              className="splash-ring"
              cx="32"
              cy="32"
              r="15"
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength={100}
              transform="rotate(-90 32 32)"
            />
            <path
              className="splash-check"
              d="M25 32.5l5 5 9.5-10"
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
            />
          </svg>
        </div>
        <span className="splash-word mt-5 text-xl font-semibold tracking-tight">Tasks</span>
        <span className="mt-4 h-1 w-28 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className="splash-bar block h-full w-1/3 rounded-full bg-accent" />
        </span>
      </div>
    </motion.div>
  );
}
