"use client";

import { CalendarDays, Folder, Plus, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { PRIORITIES, PRIORITY_META } from "@/lib/tasks";
import type { Person, Priority, Project } from "@/lib/types";
import { Kbd } from "./dialog";
import { Select } from "./select";
import { PersonIcon, PriorityIcon, ProjectSwatch } from "./toolbar";

export interface QuickAddValues {
  title: string;
  priority: Priority;
  dueDate: string | null;
  projectId: string | null;
  assigneeIds: string[];
}

const fieldClass =
  "inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-bg px-2 text-xs text-fg-muted focus-within:ring-2 focus-within:ring-accent hover:border-line-strong";

/**
 * One-line capture. The title is all that's needed; the property row lets you
 * set priority, date and project without leaving the keyboard.
 */
export function QuickAdd({
  inputRef,
  projects,
  people,
  defaultProjectId,
  defaultDueDate,
  onAdd,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  projects: Project[];
  people: Person[];
  defaultProjectId: string | null;
  defaultDueDate: string | null;
  onAdd: (values: QuickAddValues) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  // null means "follow the current view's default".
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [focused, setFocused] = useState(false);
  const [settled, setSettled] = useState(false);

  const effectiveDue = dueDate ?? defaultDueDate ?? "";
  const effectiveProject = projectId ?? defaultProjectId ?? "";
  const expanded = focused || title.length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      priority,
      dueDate: effectiveDue || null,
      projectId: effectiveProject || null,
      assigneeIds: assigneeId ? [assigneeId] : [],
    });
    setTitle("");
    setPriority("medium");
    setDueDate(null);
    setProjectId(null);
    setAssigneeId("");
  };

  return (
    <form
      data-tour="quick-add"
      onSubmit={submit}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      className={cn(
        "rounded-xl border bg-bg transition-shadow",
        expanded ? "border-accent/50 shadow-soft ring-2 ring-accent/15" : "border-line hover:border-line-strong",
      )}
    >
      <div className="flex h-11 items-center gap-2.5 px-3.5">
        <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Plus className={cn("size-4 shrink-0", expanded ? "text-accent" : "text-fg-faint")} aria-hidden />
        </motion.span>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setTitle("");
              e.currentTarget.blur();
            }
          }}
          placeholder="Add a task…"
          aria-label="New task title"
          maxLength={200}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-faint"
        />
        {!expanded && <Kbd className="hidden sm:inline-flex">N</Kbd>}
        {expanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!title.trim()}
            className="h-7 rounded-md bg-accent px-3 text-xs font-medium text-accent-fg hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none disabled:opacity-40"
          >
            Add task
          </motion.button>
        )}
      </div>

      <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          // Clip only while animating so the dropdown menus can overflow afterwards.
          onAnimationStart={() => setSettled(false)}
          onAnimationComplete={() => setSettled(true)}
          className={settled ? "overflow-visible" : "overflow-hidden"}
        >
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3.5 py-2">
          <Select
            variant="mini"
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label, icon: <PriorityIcon priority={p} /> }))}
          />

          <label className={fieldClass}>
            <CalendarDays className="size-3" aria-hidden />
            <span className="sr-only">Due date</span>
            <input
              type="date"
              value={effectiveDue}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent outline-none"
            />
          </label>

          <Select
            variant="mini"
            label="Project"
            value={effectiveProject}
            onChange={setProjectId}
            icon={<Folder className="size-3" />}
            options={[
              { value: "", label: "No project", icon: <Folder className="size-3.5" /> },
              ...projects.map((p) => ({ value: p.id, label: p.name, icon: <ProjectSwatch color={p.color} /> })),
            ]}
          />

          <Select
            variant="mini"
            label="Assignee"
            value={assigneeId}
            onChange={setAssigneeId}
            icon={<User className="size-3" />}
            options={[
              { value: "", label: "Unassigned", icon: <User className="size-3.5" /> },
              ...people.map((p) => ({ value: p.id, label: p.name, icon: <PersonIcon person={p} /> })),
            ]}
          />

          <span className="ml-auto hidden text-xs text-fg-faint sm:inline">
            <Kbd>Enter</Kbd> to add · <Kbd>Esc</Kbd> to cancel
          </span>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </form>
  );
}
