"use client";

import { motion, useReducedMotion } from "motion/react";

/* All artwork is drawn with the theme's CSS variables, so it follows light and dark mode. */

export type IllustrationKind = "tasks" | "calendar" | "celebrate" | "search" | "done";

function Float({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.g
      animate={reduce ? undefined : { y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.g>
  );
}

function Sparkle({ x, y, size = 6, delay = 0 }: { x: number; y: number; size?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.path
      d={`M${x} ${y - size}L${x + size * 0.28} ${y - size * 0.28}L${x + size} ${y}L${x + size * 0.28} ${y + size * 0.28}L${x} ${y + size}L${x - size * 0.28} ${y + size * 0.28}L${x - size} ${y}L${x - size * 0.28} ${y - size * 0.28}Z`}
      fill="var(--accent)"
      animate={reduce ? undefined : { scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

/** The soft blob every illustration sits on. */
function Backdrop() {
  return (
    <>
      <ellipse cx="80" cy="112" rx="46" ry="6" fill="var(--muted)" />
      <circle cx="80" cy="62" r="46" fill="var(--accent-soft)" />
    </>
  );
}

export function Illustration({ kind }: { kind: IllustrationKind }) {
  return (
    <svg viewBox="0 0 160 124" className="h-28 w-36" aria-hidden>
      <Backdrop />
      {kind === "tasks" && <TasksArt />}
      {kind === "calendar" && <CalendarArt />}
      {kind === "celebrate" && <CelebrateArt />}
      {kind === "search" && <SearchArt />}
      {kind === "done" && <DoneArt />}
    </svg>
  );
}

function TasksArt() {
  return (
    <>
      <Float>
        <rect x="52" y="26" width="56" height="70" rx="8" fill="var(--bg)" stroke="var(--line-strong)" strokeWidth="1.5" />
        <rect x="68" y="21" width="24" height="10" rx="4" fill="var(--accent)" />
        {[44, 60, 76].map((y, i) => (
          <g key={y}>
            <circle cx="64" cy={y} r="4.5" fill={i === 0 ? "var(--accent)" : "none"} stroke={i === 0 ? "none" : "var(--line-strong)"} strokeWidth="1.5" />
            {i === 0 && <path d={`M61.8 ${y}l1.6 1.6 3-3.2`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="73" y={y - 2} width={i === 0 ? 20 : 26 - i * 4} height="4" rx="2" fill="var(--line-strong)" />
          </g>
        ))}
      </Float>
      <Sparkle x={118} y={30} delay={0.2} />
      <Sparkle x={40} y={50} size={4} delay={1.1} />
    </>
  );
}

function CalendarArt() {
  return (
    <>
      <Float>
        <rect x="48" y="30" width="64" height="62" rx="9" fill="var(--bg)" stroke="var(--line-strong)" strokeWidth="1.5" />
        <path d="M48 39a9 9 0 0 1 9-9h46a9 9 0 0 1 9 9v7H48z" fill="var(--accent)" />
        <rect x="62" y="24" width="4" height="12" rx="2" fill="var(--fg-faint)" />
        <rect x="94" y="24" width="4" height="12" rx="2" fill="var(--fg-faint)" />
        {[0, 1, 2, 3].map((col) =>
          [0, 1].map((row) => (
            <rect key={`${col}-${row}`} x={58 + col * 12} y={54 + row * 12} width="7" height="7" rx="2" fill="var(--muted)" />
          )),
        )}
        <circle cx="94" cy="81" r="9" fill="var(--success)" />
        <path d="M90 81l2.6 2.6 5-5.2" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Float>
      <Sparkle x={122} y={40} size={5} delay={0.4} />
    </>
  );
}

function CelebrateArt() {
  return (
    <>
      <Float>
        <path d="M66 36h28v14a14 14 0 0 1-28 0z" fill="var(--warning)" />
        <path d="M66 40h-6a6 6 0 0 0 6 10M94 40h6a6 6 0 0 1-6 10" stroke="var(--warning)" strokeWidth="3" fill="none" />
        <rect x="76" y="63" width="8" height="12" fill="var(--warning)" />
        <rect x="66" y="75" width="28" height="7" rx="3" fill="var(--fg-muted)" />
        <path d="M74 44l4 4 8-8" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Float>
      <Sparkle x={46} y={34} delay={0} />
      <Sparkle x={116} y={28} size={7} delay={0.6} />
      <Sparkle x={120} y={72} size={4} delay={1.2} />
      <circle cx="40" cy="74" r="3" fill="var(--success)" />
      <circle cx="110" cy="50" r="2.5" fill="var(--danger)" />
    </>
  );
}

function SearchArt() {
  return (
    <>
      <Float>
        <circle cx="74" cy="56" r="20" fill="var(--bg)" stroke="var(--fg-muted)" strokeWidth="5" />
        <path d="M89 71l14 14" stroke="var(--fg-muted)" strokeWidth="7" strokeLinecap="round" />
        <path d="M67 49l14 14M81 49l-14 14" stroke="var(--fg-faint)" strokeWidth="3" strokeLinecap="round" />
      </Float>
      <Sparkle x={118} y={36} size={4} delay={0.3} />
    </>
  );
}

function DoneArt() {
  return (
    <>
      <Float>
        <circle cx="80" cy="60" r="26" fill="var(--success)" />
        <path d="M68 60l8 8 16-16" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Float>
      <Sparkle x={44} y={36} size={5} delay={0.2} />
      <Sparkle x={118} y={44} delay={0.9} />
    </>
  );
}

/** Donut that fills with the share of completed tasks. */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : done / total;
  const percent = Math.round(ratio * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-12">
        <svg viewBox="0 0 48 48" className="size-12 -rotate-90" aria-hidden>
          <circle cx="24" cy="24" r="19" fill="none" stroke="var(--muted)" strokeWidth="5" />
          <motion.circle
            cx="24"
            cy="24"
            r="19"
            fill="none"
            stroke="var(--done)"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.max(ratio, 0.0001) }}
            transition={{ type: "spring", stiffness: 60, damping: 16 }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums">{percent}%</span>
      </div>
      <div className="hidden text-sm leading-tight sm:block">
        <div className="font-medium">
          {done} of {total} done
        </div>
        <div className="text-fg-faint">{total - done === 0 ? "Everything's done" : `${total - done} to go`}</div>
      </div>
      <span className="sr-only">
        {done} of {total} tasks completed
      </span>
    </div>
  );
}

const BURST_COLORS = ["var(--done)", "var(--accent)", "var(--warning)", "var(--progress)"];

/** Small particle pop shown when a task is ticked off. */
export function CompletionBurst() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-[var(--done)]"
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: BURST_COLORS[i % BURST_COLORS.length] }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 16, y: Math.sin(angle) * 16, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          />
        );
      })}
    </span>
  );
}
