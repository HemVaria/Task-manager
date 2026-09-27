"use client";

import { CalendarDays, Check, CheckCircle2, CircleDot, Flag, Folder, ListChecks, Plus, RotateCcw, Tag as TagIcon, Trash2, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatTimestamp } from "@/lib/dates";
import { PRIORITIES, PRIORITY_META, STATUS_META, STATUSES } from "@/lib/tasks";
import { addPerson, addSubtask, addTag, deletePerson, deleteSubtask, deleteTag, updateSubtask } from "@/lib/store";
import type { Person, Priority, Project, Subtask, Tag, Task } from "@/lib/types";
import { Avatar, DueLabel, StatusIcon, TagChip } from "./badges";
import { Kbd } from "./dialog";
import { MultiPicker, Placeholder } from "./picker";
import { Select } from "./select";
import { ProjectSwatch } from "./toolbar";
import { useToast } from "./toast";

type Patch = Partial<Omit<Task, "id" | "createdAt">>;

/**
 * Side panel for viewing and editing a task. Text fields write through on every
 * keystroke (as long as the title isn't empty), so closing never loses work.
 * Render it inside <AnimatePresence> so it can slide out.
 */
export function TaskDrawer({
  task,
  projects,
  people,
  tags,
  today,
  onChange,
  onToggleComplete,
  onDelete,
  onClose,
}: {
  task: Task;
  projects: Project[];
  people: Person[];
  tags: Tag[];
  today: string;
  onChange: (patch: Patch, announce?: string) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(task.title);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const done = task.status === "completed";
  const project = projects.find((p) => p.id === task.projectId);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    titleRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.();
  }, []);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-[var(--backdrop)] lg:bg-transparent"
        onClick={onClose}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        initial={{ x: "100%", opacity: 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.6, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-bg shadow-float sm:w-[440px]"
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-fg-muted">
            {project ? (
              <>
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: project.color }} aria-hidden />
                <span className="truncate">{project.name}</span>
              </>
            ) : (
              <span className="text-fg-faint">No project</span>
            )}
          </span>
          <button
            type="button"
            onClick={onToggleComplete}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
              done
                ? "border-line text-fg-muted hover:bg-hover"
                : "border-[var(--done)]/40 text-[var(--done)] hover:bg-[var(--done)]/10",
            )}
          >
            {done ? <RotateCcw className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
            {done ? "Reopen" : "Complete"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete task"
            title="Delete task"
            className="rounded-lg p-2 text-fg-muted hover:bg-danger-soft hover:text-danger focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
            className="rounded-lg p-2 text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        </header>

        <motion.div
          className="flex-1 overflow-y-auto px-6 py-5"
          initial="hidden"
          animate="shown"
          variants={{ shown: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } } }}
        >
          <label htmlFor="task-title" className="sr-only">
            Title
          </label>
          <textarea
            id="task-title"
            ref={titleRef}
            value={title}
            spellCheck={false}
            rows={1}
            maxLength={200}
            onChange={(e) => {
              const next = e.target.value.replace(/\n/g, " ");
              setTitle(next);
              if (next.trim()) onChange({ title: next.trim() });
            }}
            onBlur={() => {
              if (!title.trim()) setTitle(task.title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder="Task title"
            className={cn(
              "field-sizing-content w-full resize-none bg-transparent text-xl leading-snug font-semibold outline-none placeholder:text-fg-faint",
              done && "text-fg-muted line-through decoration-fg-faint",
            )}
          />
          {!title.trim() && <p className="mt-1 text-xs text-danger">A title is required.</p>}

          <motion.dl variants={item} className="mt-5 grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 text-sm">
            <Property icon={<CircleDot className="size-4" />} label="Status">
              <Select
                label="Status"
                value={task.status}
                onChange={(status) => onChange({ status }, `Status set to ${STATUS_META[status].label}`)}
                options={STATUSES.map((st) => ({ value: st, label: STATUS_META[st].label, icon: <StatusIcon status={st} /> }))}
              />
            </Property>

            <Property icon={<Flag className="size-4" />} label="Priority">
              <div role="radiogroup" aria-label="Priority" className="inline-flex rounded-lg border border-line p-0.5">
                {[...PRIORITIES].reverse().map((p: Priority) => {
                  const active = task.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => !active && onChange({ priority: p }, `Priority set to ${PRIORITY_META[p].label}`)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                        active ? "bg-muted font-medium text-fg" : "text-fg-muted hover:text-fg",
                      )}
                    >
                      <Flag
                        className="size-3"
                        style={{ color: PRIORITY_META[p].color, fill: active ? PRIORITY_META[p].color : "none" }}
                        aria-hidden
                      />
                      {PRIORITY_META[p].label}
                    </button>
                  );
                })}
              </div>
            </Property>

            <Property icon={<CalendarDays className="size-4" />} label="Due date">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  aria-label="Due date"
                  value={task.dueDate ?? ""}
                  onChange={(e) => onChange({ dueDate: e.target.value || null }, e.target.value ? "Due date updated" : "Due date cleared")}
                  className={cn(inputClass, "w-auto px-2.5")}
                />
                {task.dueDate && (
                  <>
                    <DueLabel dueDate={task.dueDate} today={today} completed={done} />
                    <button
                      type="button"
                      onClick={() => onChange({ dueDate: null }, "Due date cleared")}
                      className="text-xs text-fg-faint hover:text-fg"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </Property>

            <Property icon={<Folder className="size-4" />} label="Project">
              <Select
                label="Project"
                value={task.projectId ?? ""}
                onChange={(value) => {
                  const id = value || null;
                  const name = projects.find((p) => p.id === id)?.name;
                  onChange({ projectId: id }, name ? `Moved to ${name}` : "Removed from project");
                }}
                icon={<Folder className="size-3.5" />}
                options={[
                  { value: "", label: "No project", icon: <Folder className="size-3.5" /> },
                  ...projects.map((p) => ({ value: p.id, label: p.name, icon: <ProjectSwatch color={p.color} /> })),
                ]}
              />
            </Property>

            <Property icon={<Users className="size-4" />} label="Assignees">
              <MultiPicker
                label="Assignees"
                placeholder="Find or add a person"
                selected={task.assigneeIds}
                options={people.map((p) => ({ id: p.id, label: p.name, icon: <Avatar person={p} className="ring-0" /> }))}
                onToggle={(id) => {
                  const on = task.assigneeIds.includes(id);
                  const name = people.find((p) => p.id === id)?.name;
                  onChange(
                    { assigneeIds: on ? task.assigneeIds.filter((a) => a !== id) : [...task.assigneeIds, id] },
                    on ? `Unassigned ${name}` : `Assigned to ${name}`,
                  );
                }}
                onCreate={(name) => {
                  const person = addPerson(name);
                  onChange({ assigneeIds: [...task.assigneeIds, person.id] }, `Added ${person.name} and assigned them`);
                }}
                onRemove={(option) => {
                  deletePerson(option.id);
                  toast(`Removed ${option.label} from everyone's tasks`);
                }}
                trigger={
                  task.assigneeIds.length === 0 ? (
                    <Placeholder>Unassigned</Placeholder>
                  ) : (
                    people
                      .filter((p) => task.assigneeIds.includes(p.id))
                      .map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2 pl-0.5 text-xs">
                          <Avatar person={p} className="size-5 text-[9px] ring-0" />
                          {p.name}
                        </span>
                      ))
                  )
                }
              />
            </Property>

            <Property icon={<TagIcon className="size-4" />} label="Tags">
              <MultiPicker
                label="Tags"
                placeholder="Find or create a tag"
                selected={task.tagIds}
                options={tags.map((t) => ({ id: t.id, label: t.name, icon: <span className="size-2.5 rounded-full" style={{ backgroundColor: t.color }} /> }))}
                onToggle={(id) => {
                  const on = task.tagIds.includes(id);
                  onChange({ tagIds: on ? task.tagIds.filter((t) => t !== id) : [...task.tagIds, id] });
                }}
                onCreate={(name) => {
                  const tag = addTag(name);
                  if (!task.tagIds.includes(tag.id)) onChange({ tagIds: [...task.tagIds, tag.id] }, `Tag "${tag.name}" added`);
                }}
                onRemove={(option) => {
                  deleteTag(option.id);
                  toast(`Deleted tag "${option.label}"`);
                }}
                trigger={
                  task.tagIds.length === 0 ? (
                    <Placeholder>No tags</Placeholder>
                  ) : (
                    tags.filter((t) => task.tagIds.includes(t.id)).map((t) => <TagChip key={t.id} tag={t} />)
                  )
                }
              />
            </Property>
          </motion.dl>

          <motion.div variants={item}>
            <Subtasks taskId={task.id} subtasks={task.subtasks} />
          </motion.div>

          <motion.div variants={item} className="mt-6">
            <label htmlFor="task-description" className="mb-1.5 block text-xs font-medium text-fg-faint">
              Description
            </label>
            <textarea
              id="task-description"
              defaultValue={task.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Add more detail…"
              rows={5}
              className="field-sizing-content min-h-28 w-full resize-none rounded-lg border border-line bg-subtle px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-fg-faint focus:border-accent/50 focus:bg-bg focus:ring-2 focus:ring-accent/15"
            />
          </motion.div>
        </motion.div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-6 py-3 text-xs text-fg-faint">
          <span>Created {formatTimestamp(task.createdAt)}</span>
          <span className="hidden sm:inline">
            Saved automatically · <Kbd>Esc</Kbd> to close
          </span>
        </footer>
      </motion.aside>
    </>
  );
}

const item = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 34 } },
} as const;

const inputClass =
  "h-8 rounded-lg border border-line bg-bg text-sm outline-none hover:border-line-strong focus:border-accent/50 focus:ring-2 focus:ring-accent/15";

function Subtasks({ taskId, subtasks }: { taskId: string; subtasks: Subtask[] }) {
  const [draft, setDraft] = useState("");
  const done = subtasks.filter((s) => s.done).length;
  const ratio = subtasks.length ? done / subtasks.length : 0;

  return (
    <section className="mt-6" aria-label="Subtasks">
      <div className="mb-2 flex items-center gap-2">
        <ListChecks className="size-4 text-fg-faint" aria-hidden />
        <h3 className="text-xs font-medium text-fg-faint">Subtasks</h3>
        {subtasks.length > 0 && (
          <span className="text-xs text-fg-faint tabular-nums">
            {done}/{subtasks.length}
          </span>
        )}
      </div>
      {subtasks.length > 0 && (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-[var(--done)]"
            initial={false}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>
      )}
      <ul>
        <AnimatePresence initial={false}>
          {subtasks.map((sub) => (
            <motion.li
              key={sub.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="group/sub flex items-center gap-2 overflow-hidden rounded-lg px-1 hover:bg-hover"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={sub.done}
                aria-label={sub.done ? `Mark "${sub.title}" not done` : `Mark "${sub.title}" done`}
                onClick={() => updateSubtask(taskId, sub.id, { done: !sub.done })}
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded border transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                  sub.done ? "border-[var(--done)] bg-[var(--done)] text-white" : "border-line-strong hover:border-fg-faint",
                )}
              >
                <AnimatePresence>
                  {sub.done && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="size-3" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <input
                defaultValue={sub.title}
                aria-label="Subtask title"
                maxLength={120}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== sub.title) updateSubtask(taskId, sub.id, { title: next });
                  else e.target.value = sub.title;
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className={cn(
                  "h-8 min-w-0 flex-1 bg-transparent text-sm outline-none",
                  sub.done && "text-fg-faint line-through",
                )}
              />
              <button
                type="button"
                onClick={() => deleteSubtask(taskId, sub.id)}
                aria-label={`Delete subtask "${sub.title}"`}
                className="rounded-md p-1 text-fg-faint opacity-0 group-hover/sub:opacity-100 hover:text-danger focus-visible:opacity-100 focus-visible:outline-none"
              >
                <X className="size-3.5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          addSubtask(taskId, draft);
          setDraft("");
        }}
        className="mt-1 flex items-center gap-2 px-1"
      >
        <Plus className="size-4 text-fg-faint" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a subtask"
          aria-label="Add a subtask"
          maxLength={120}
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-faint"
        />
      </form>
    </section>
  );
}

function Property({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex items-center gap-2 text-fg-muted">
        <span className="text-fg-faint" aria-hidden>
          {icon}
        </span>
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}
