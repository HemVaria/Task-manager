import { AlertCircle, Check, CheckSquare, Flag } from "lucide-react";
import { cn } from "@/lib/cn";
import { describeDue } from "@/lib/dates";
import { initials, PRIORITY_META, STATUS_META } from "@/lib/tasks";
import type { Person, Priority, Project, Status, Subtask, Tag } from "@/lib/types";

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold tracking-wide text-white uppercase",
        className,
      )}
      style={{ backgroundColor: meta.color }}
    >
      <StatusIcon status={status} inverted />
      {meta.label}
    </span>
  );
}

/** Ring that fills in as the task moves from to do, to in progress, to completed. */
export function StatusIcon({ status, inverted = false }: { status: Status; inverted?: boolean }) {
  const color = inverted ? "#fff" : STATUS_META[status].color;
  if (status === "completed") {
    return (
      <span
        className="grid size-3.5 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        <Check className="size-2.5" strokeWidth={3.5} style={{ color: inverted ? STATUS_META.completed.color : "#fff" }} />
      </span>
    );
  }
  return (
    <span
      className="relative inline-block size-3.5 shrink-0 rounded-full border-[1.5px]"
      style={{ borderColor: color }}
      aria-hidden
    >
      {status === "in_progress" && (
        <span
          className="absolute inset-[2px] rounded-full"
          style={{ background: `conic-gradient(${color} 0 50%, transparent 50% 100%)` }}
        />
      )}
    </span>
  );
}

export function PriorityFlag({ priority, showLabel = true }: { priority: Priority; showLabel?: boolean }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
      <Flag className="size-3.5 shrink-0" style={{ color: meta.color, fill: meta.color }} aria-hidden />
      {showLabel ? meta.label : <span className="sr-only">{meta.label} priority</span>}
    </span>
  );
}

export function ProjectChip({ project, className }: { project: Project; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-sm text-fg-muted", className)}>
      <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: project.color }} aria-hidden />
      <span className="truncate">{project.name}</span>
    </span>
  );
}

const DUE_TONE_CLASS = {
  overdue: "text-danger font-medium",
  today: "text-accent font-medium",
  soon: "text-fg-muted",
  later: "text-fg-muted",
  done: "text-fg-faint",
} as const;

export function DueLabel({ dueDate, today, completed }: { dueDate: string; today: string; completed: boolean }) {
  const { label, tone } = describeDue(dueDate, today, completed);
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm whitespace-nowrap", DUE_TONE_CLASS[tone])}>
      {tone === "overdue" && <AlertCircle className="size-3.5" aria-hidden />}
      {label}
      {tone === "overdue" && <span className="sr-only">(overdue)</span>}
    </span>
  );
}

export function Avatar({ person, size = "sm", className }: { person: Person; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      title={person.name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-bg select-none",
        size === "sm" ? "size-6 text-[10px]" : "size-7 text-[11px]",
        className,
      )}
      style={{ backgroundColor: person.color }}
    >
      {initials(person.name)}
    </span>
  );
}

/** Overlapping avatars, capped with a "+N" bubble. */
export function AvatarStack({ people, max = 3 }: { people: Person[]; max?: number }) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="inline-flex items-center -space-x-1.5" aria-label={`Assigned to ${people.map((p) => p.name).join(", ")}`}>
      {shown.map((p) => (
        <Avatar key={p.id} person={p} />
      ))}
      {extra > 0 && (
        <span className="inline-grid size-6 place-items-center rounded-full bg-muted text-[10px] font-semibold text-fg-muted ring-2 ring-bg">
          +{extra}
        </span>
      )}
    </span>
  );
}

export function TagChip({ tag, className }: { tag: Tag; className?: string }) {
  return (
    <span
      className={cn("inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[11px] font-medium", className)}
      style={{ color: tag.color, backgroundColor: `color-mix(in srgb, ${tag.color} 14%, transparent)` }}
    >
      {tag.name}
    </span>
  );
}

export function SubtaskProgress({ subtasks }: { subtasks: Subtask[] }) {
  if (subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.done).length;
  const complete = done === subtasks.length;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1 text-xs tabular-nums", complete ? "text-[var(--done)]" : "text-fg-faint")}
      title={`${done} of ${subtasks.length} subtasks done`}
    >
      <CheckSquare className="size-3.5" aria-hidden />
      {done}/{subtasks.length}
    </span>
  );
}
