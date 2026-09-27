"use client";

import { AlignLeft, Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { isOverdue, STATUS_META } from "@/lib/tasks";
import type { Lookup, Person, Project, Status, Tag, Task } from "@/lib/types";
import { AvatarStack, DueLabel, PriorityFlag, ProjectChip, StatusIcon, StatusPill, SubtaskProgress, TagChip } from "./badges";
import { CompletionBurst } from "./graphics";

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_140px_76px_92px_96px]";

/** How long the tick animation plays before the task actually moves to Completed. */
const COMPLETE_DELAY = 420;

const spring = { type: "spring", stiffness: 500, damping: 40 } as const;

export interface TaskGroup {
  status: Status;
  tasks: Task[];
}

export function TaskList({
  groups,
  lookup,
  today,
  selectedId,
  onOpen,
  onToggleComplete,
}: {
  groups: TaskGroup[];
  lookup: Lookup;
  today: string;
  selectedId: string | null;
  onOpen: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}) {
  const [collapsed, setCollapsed] = useState<Partial<Record<Status, boolean>>>({});
  // The tour points at the first visible checkbox.
  const firstTaskId = groups.find((g) => g.tasks.length > 0 && !collapsed[g.status])?.tasks[0]?.id;

  return (
    <div className="space-y-6">
      {groups.map(({ status, tasks }) => {
        const isCollapsed = collapsed[status] ?? false;
        return (
          <motion.section key={status} layout="position" transition={spring} aria-label={STATUS_META[status].label}>
            <div className="mb-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [status]: !isCollapsed }))}
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${STATUS_META[status].label}`}
                className="rounded-md p-1 text-fg-faint hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <motion.span className="block" animate={{ rotate: isCollapsed ? -90 : 0 }} transition={spring}>
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>
              <StatusPill status={status} />
              <motion.span
                key={tasks.length}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-sm text-fg-faint tabular-nums"
              >
                {tasks.length}
              </motion.span>
            </div>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="ml-8">
                    {tasks.length > 0 && (
                      <div
                        className={cn(
                          "hidden border-b border-line pb-1.5 text-xs text-fg-faint md:grid md:gap-4 md:pr-3 md:pl-9",
                          COLUMNS,
                        )}
                        aria-hidden
                      >
                        <span>Name</span>
                        <span>Project</span>
                        <span>Assignee</span>
                        <span>Priority</span>
                        <span>Due date</span>
                      </div>
                    )}
                    <ul>
                      <AnimatePresence initial={false}>
                        {tasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            project={task.projectId ? lookup.projects.get(task.projectId) : undefined}
                            assignees={resolve(task.assigneeIds, lookup.people)}
                            tags={resolve(task.tagIds, lookup.tags)}
                            today={today}
                            selected={task.id === selectedId}
                            tourAnchor={task.id === firstTaskId}
                            onOpen={() => onOpen(task)}
                            onToggleComplete={() => onToggleComplete(task)}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                    {tasks.length === 0 && (
                      <p className="border-b border-line py-2.5 pl-9 text-sm text-fg-faint">No tasks</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        );
      })}
    </div>
  );
}

export function resolve<T>(ids: string[], map: Map<string, T>): T[] {
  return ids.flatMap((id) => {
    const item = map.get(id);
    return item ? [item] : [];
  });
}

function TaskRow({
  task,
  project,
  assignees,
  tags,
  today,
  selected,
  tourAnchor,
  onOpen,
  onToggleComplete,
}: {
  task: Task;
  project?: Project;
  assignees: Person[];
  tags: Tag[];
  today: string;
  selected: boolean;
  tourAnchor: boolean;
  onOpen: () => void;
  onToggleComplete: () => void;
}) {
  const [completing, setCompleting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const done = task.status === "completed";
  const checked = done || completing;
  const overdue = isOverdue(task, today) && !completing;

  const handleCheck = () => {
    if (completing) return;
    if (done) {
      onToggleComplete();
      return;
    }
    // Let the tick play before the row moves to Completed.
    setCompleting(true);
    timer.current = setTimeout(() => {
      setCompleting(false);
      onToggleComplete();
    }, COMPLETE_DELAY);
  };

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ ...spring, opacity: { duration: 0.18 } }}
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer overflow-hidden border-b border-line transition-colors hover:bg-hover",
        selected && "bg-accent-soft hover:bg-accent-soft",
      )}
    >
      <AnimatePresence>
        {overdue && (
          <motion.span
            className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-danger"
            aria-hidden
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3 py-2.5 pr-3 pl-1 md:items-center">
        <motion.button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={done ? `Reopen "${task.title}"` : `Complete "${task.title}"`}
          data-tour={tourAnchor ? "task-check" : undefined}
          onClick={(e) => {
            e.stopPropagation();
            handleCheck();
          }}
          whileTap={{ scale: 0.8 }}
          className="relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full hover:bg-line focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none md:mt-0"
        >
          {completing ? (
            <motion.span
              className="grid size-3.5 place-items-center rounded-full bg-[var(--done)]"
              initial={{ scale: 0.4 }}
              animate={{ scale: [0.4, 1.25, 1] }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Check className="size-2.5 text-white" strokeWidth={3.5} />
            </motion.span>
          ) : (
            <StatusIcon status={task.status} />
          )}
          {completing && <CompletionBurst />}
          {!checked && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
              <Check className="size-2.5 text-fg-faint" strokeWidth={3} />
            </span>
          )}
        </motion.button>

        <div className={cn("grid min-w-0 flex-1 gap-1 md:items-center md:gap-4", COLUMNS)}>
          <button
            type="button"
            data-task-row={task.id}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="flex min-w-0 items-center gap-2 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
          >
            <span className="relative min-w-0 truncate text-sm">
              <span className={cn("transition-colors duration-300", checked ? "text-fg-faint" : "text-fg", done && "line-through")}>
                {task.title}
              </span>
              {completing && (
                <motion.span
                  aria-hidden
                  className="absolute top-1/2 left-0 h-px w-full origin-left bg-fg-faint"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
            </span>
            {task.description && <AlignLeft className="size-3.5 shrink-0 text-fg-faint" aria-label="Has description" />}
            <SubtaskProgress subtasks={task.subtasks} />
            <span className="hidden min-w-0 items-center gap-1 overflow-hidden sm:flex">
              {tags.slice(0, 2).map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
              {tags.length > 2 && <span className="text-[11px] text-fg-faint">+{tags.length - 2}</span>}
            </span>
          </button>

          {/* On small screens the columns collapse into one meta line under the title. */}
          <div
            className={cn(
              "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 transition-opacity duration-300 md:contents",
              checked && "opacity-60",
            )}
          >
            <span className="min-w-0 md:block">
              {project ? <ProjectChip project={project} /> : <span className="hidden text-sm text-fg-faint md:inline">—</span>}
            </span>
            <span className="md:block">
              {assignees.length > 0 ? (
                <AvatarStack people={assignees} />
              ) : (
                <span className="hidden text-sm text-fg-faint md:inline">—</span>
              )}
            </span>
            <span>
              <PriorityFlag priority={task.priority} />
            </span>
            <span>
              {task.dueDate ? (
                <DueLabel dueDate={task.dueDate} today={today} completed={checked} />
              ) : (
                <span className="hidden text-sm text-fg-faint md:inline">—</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
