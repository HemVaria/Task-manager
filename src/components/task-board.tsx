"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AlignLeft, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { isOverdue, STATUS_META } from "@/lib/tasks";
import type { Lookup, Status, Task } from "@/lib/types";
import { AvatarStack, DueLabel, PriorityFlag, ProjectChip, StatusIcon, StatusPill, SubtaskProgress, TagChip } from "./badges";
import { resolve, type TaskGroup } from "./task-list";

interface BoardProps {
  groups: TaskGroup[];
  lookup: Lookup;
  today: string;
  selectedId: string | null;
  onOpen: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onMove: (task: Task, status: Status) => void;
  onAdd: (title: string, status: Status) => void;
}

export function TaskBoard({ groups, lookup, today, selectedId, onOpen, onToggleComplete, onMove, onAdd }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const allTasks = groups.flatMap((g) => g.tasks);
  const activeTask = activeId ? allTasks.find((t) => t.id === activeId) : undefined;

  const titleOf = (id: string | number) => allTasks.find((t) => t.id === id)?.title ?? "Task";
  const columnOf = (id?: string | number) => (id ? STATUS_META[id as Status]?.label : undefined);

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const task = allTasks.find((t) => t.id === event.active.id);
    const target = event.over?.id as Status | undefined;
    if (task && target && target !== task.status) onMove(task, target);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up "${titleOf(active.id)}".`,
          onDragOver: ({ active, over }) =>
            columnOf(over?.id) ? `"${titleOf(active.id)}" is over ${columnOf(over?.id)}.` : `"${titleOf(active.id)}" is not over a column.`,
          onDragEnd: ({ active, over }) =>
            columnOf(over?.id) ? `"${titleOf(active.id)}" moved to ${columnOf(over?.id)}.` : `"${titleOf(active.id)}" was dropped.`,
          onDragCancel: ({ active }) => `Moving "${titleOf(active.id)}" was cancelled.`,
        },
        screenReaderInstructions: {
          draggable: "Press space to pick up a task, use the arrow keys to move it to another column, then press space to drop it.",
        },
      }}
    >
      <div
        className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 md:grid md:overflow-visible"
        style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}
      >
        {groups.map((group) => (
          <Column
            key={group.status}
            group={group}
            lookup={lookup}
            today={today}
            selectedId={selectedId}
            draggingId={activeId}
            onOpen={onOpen}
            onToggleComplete={onToggleComplete}
            onAdd={onAdd}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
        {activeTask && (
          <motion.div initial={{ rotate: 0, scale: 1 }} animate={{ rotate: 2.5, scale: 1.03 }} className="cursor-grabbing">
            <Card task={activeTask} lookup={lookup} today={today} lifted />
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  group,
  lookup,
  today,
  selectedId,
  draggingId,
  onOpen,
  onToggleComplete,
  onAdd,
}: {
  group: TaskGroup;
  lookup: Lookup;
  today: string;
  selectedId: string | null;
  draggingId: string | null;
  onOpen: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onAdd: (title: string, status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.status });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), group.status);
    setTitle("");
  };

  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_META[group.status].label}
      className={cn(
        "flex w-[82vw] max-w-sm shrink-0 snap-start flex-col rounded-2xl border p-2.5 transition-colors sm:w-80 md:w-auto md:max-w-none",
        isOver ? "border-accent/50 bg-accent-soft/60" : "border-line bg-subtle",
      )}
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        <StatusPill status={group.status} />
        <span className="text-sm text-fg-faint tabular-nums">{group.tasks.length}</span>
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label={`Add task to ${STATUS_META[group.status].label}`}
          className="ml-auto rounded-md p-1 text-fg-faint hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Plus className="size-4" />
        </button>
      </header>

      <div className="flex min-h-24 flex-1 flex-col gap-2">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.form
              key="add"
              onSubmit={submit}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border border-accent/50 bg-bg p-2 shadow-soft ring-2 ring-accent/15"
            >
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => !title.trim() && setAdding(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setTitle("");
                    setAdding(false);
                  }
                }}
                placeholder="Task title, then Enter"
                aria-label={`New task in ${STATUS_META[group.status].label}`}
                maxLength={200}
                className="w-full bg-transparent px-1 text-sm outline-none placeholder:text-fg-faint"
              />
            </motion.form>
          )}
          {group.tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              lookup={lookup}
              today={today}
              selected={task.id === selectedId}
              hidden={task.id === draggingId}
              onOpen={() => onOpen(task)}
              onToggleComplete={() => onToggleComplete(task)}
            />
          ))}
        </AnimatePresence>
        {group.tasks.length === 0 && !adding && (
          <p className="grid flex-1 place-items-center rounded-xl border border-dashed border-line-strong py-6 text-center text-xs text-fg-faint">
            Drop tasks here
          </p>
        )}
      </div>
    </section>
  );
}

function DraggableCard({
  task,
  lookup,
  today,
  selected,
  hidden,
  onOpen,
  onToggleComplete,
}: {
  task: Task;
  lookup: Lookup;
  today: string;
  selected: boolean;
  hidden: boolean;
  onOpen: () => void;
  onToggleComplete: () => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: hidden ? 0.35 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        role="button"
        data-task-row={task.id}
        aria-label={`${task.title}. Press Enter to open, Space to drag.`}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen();
          else listeners?.onKeyDown?.(e);
        }}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Card task={task} lookup={lookup} today={today} selected={selected} onToggleComplete={onToggleComplete} />
      </div>
    </motion.div>
  );
}

function Card({
  task,
  lookup,
  today,
  selected = false,
  lifted = false,
  onToggleComplete,
}: {
  task: Task;
  lookup: Lookup;
  today: string;
  selected?: boolean;
  lifted?: boolean;
  onToggleComplete?: () => void;
}) {
  const done = task.status === "completed";
  const project = task.projectId ? lookup.projects.get(task.projectId) : undefined;
  const assignees = resolve(task.assigneeIds, lookup.people);
  const tags = resolve(task.tagIds, lookup.tags);
  const overdue = isOverdue(task, today);

  return (
    <article
      className={cn(
        "group relative cursor-grab rounded-xl border bg-bg p-3 text-left shadow-soft transition-[border-color,box-shadow] hover:border-line-strong active:cursor-grabbing",
        selected ? "border-accent/50 ring-1 ring-accent/30" : "border-line",
        lifted && "shadow-float",
        overdue && "border-l-2 border-l-danger",
      )}
    >
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? `Reopen "${task.title}"` : `Complete "${task.title}"`}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.();
          }}
          className="-m-1 grid size-6 shrink-0 place-items-center rounded-full hover:bg-line focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <StatusIcon status={task.status} />
        </button>
        <h3 className={cn("min-w-0 flex-1 text-sm leading-snug font-medium", done && "text-fg-faint line-through")}>
          {task.title}
          {task.description && <AlignLeft className="ml-1.5 inline size-3.5 align-[-2px] text-fg-faint" aria-label="Has description" />}
        </h3>
      </div>

      <div className={cn("mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5", done && "opacity-60")}>
        {project && <ProjectChip project={project} className="text-xs" />}
        {task.dueDate && <DueLabel dueDate={task.dueDate} today={today} completed={done} />}
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <PriorityFlag priority={task.priority} showLabel={false} />
        <SubtaskProgress subtasks={task.subtasks} />
        <span className="ml-auto">
          <AvatarStack people={assignees} />
        </span>
      </div>
    </article>
  );
}
