"use client";

import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Keyboard,
  ListTodo,
  MoreHorizontal,
  Sparkles,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { VIEW_META, VIEWS } from "@/lib/tasks";
import type { Project, ProjectFilter, ViewId } from "@/lib/types";
import { Kbd } from "./dialog";

const VIEW_ICONS: Record<ViewId, typeof ListTodo> = {
  all: ListTodo,
  today: CalendarDays,
  upcoming: CalendarClock,
  overdue: AlertCircle,
  completed: CheckCircle2,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  view: ViewId;
  projectFilter: ProjectFilter;
  counts: Record<ViewId, number>;
  projects: Project[];
  projectCounts: Record<string, number>;
  onSelectView: (view: ViewId) => void;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (project: Project) => void;
  onShowShortcuts: () => void;
  onStartTour: () => void;
}

const navItem =
  "group relative isolate flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";
const navItemActive = "font-medium text-fg hover:bg-transparent";

/** One shared pill that glides to whichever view or project is active. */
function ActivePill() {
  return (
    <motion.span
      layoutId="sidebar-active"
      className="absolute inset-0 -z-10 rounded-lg bg-muted"
      transition={{ type: "spring", stiffness: 520, damping: 40 }}
      aria-hidden
    />
  );
}

export function Sidebar(props: SidebarProps) {
  const { open, onClose, view, projectFilter, counts, projects, projectCounts } = props;
  const [creating, setCreating] = useState(false);

  return (
    <>
      {open && (
        <div className="animate-fade-in fixed inset-0 z-30 bg-[var(--backdrop)] md:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        aria-label="Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-subtle transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0 shadow-float md:shadow-none" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-fg">
            <CheckCircle2 className="size-4" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold">Tasks</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto rounded-md p-1.5 text-fg-muted hover:bg-hover md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
          <ul className="space-y-0.5">
            {VIEWS.map((id) => {
              const Icon = VIEW_ICONS[id];
              const active = view === id && projectFilter === "all";
              const alert = id === "overdue" && counts.overdue > 0;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => props.onSelectView(id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(navItem, active && navItemActive)}
                  >
                    {active && <ActivePill />}
                    <Icon className={cn("size-4 shrink-0", alert && "text-danger")} aria-hidden />
                    <span className="flex-1 text-left">{VIEW_META[id].label}</span>
                    <span className={cn("text-xs tabular-nums", alert ? "font-medium text-danger" : "text-fg-faint")}>
                      {counts[id] || ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div data-tour="projects">
          <div className="mt-6 mb-1 flex items-center justify-between px-2.5">
            <h2 className="text-xs font-medium text-fg-faint">Projects</h2>
            <button
              type="button"
              onClick={() => setCreating(true)}
              aria-label="New project"
              title="New project"
              className="rounded-md p-1 text-fg-faint hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <ul className="space-y-0.5">
            {projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                count={projectCounts[project.id] ?? 0}
                active={projectFilter === project.id}
                onSelect={() => props.onSelectProject(project.id)}
                onRename={(name) => props.onRenameProject(project.id, name)}
                onDelete={() => props.onDeleteProject(project)}
              />
            ))}
            {creating && (
              <li>
                <ProjectNameInput
                  placeholder="Project name"
                  onSubmit={(name) => {
                    props.onCreateProject(name);
                    setCreating(false);
                  }}
                  onCancel={() => setCreating(false)}
                />
              </li>
            )}
            {!creating && projects.length === 0 && (
              <li>
                <button type="button" onClick={() => setCreating(true)} className={cn(navItem, "text-fg-faint")}>
                  <Plus className="size-4" aria-hidden />
                  Create your first project
                </button>
              </li>
            )}
          </ul>
          </div>
        </nav>

        <div className="shrink-0 space-y-0.5 border-t border-line p-2.5">
          <button type="button" onClick={props.onStartTour} className={navItem}>
            <Sparkles className="size-4" aria-hidden />
            <span className="flex-1 text-left">Take the tour</span>
          </button>
          <button type="button" onClick={props.onShowShortcuts} className={navItem}>
            <Keyboard className="size-4" aria-hidden />
            <span className="flex-1 text-left">Keyboard shortcuts</span>
            <Kbd>?</Kbd>
          </button>
        </div>
      </aside>
    </>
  );
}

function ProjectItem({
  project,
  count,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  project: Project;
  count: number;
  active: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  if (renaming) {
    return (
      <li>
        <ProjectNameInput
          initial={project.name}
          color={project.color}
          onSubmit={(name) => {
            if (name !== project.name) onRename(name);
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      </li>
    );
  }

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("group/project relative", menuOpen && "z-20")}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "page" : undefined}
        className={cn(navItem, "pr-9", active && navItemActive)}
      >
        {active && <ActivePill />}
        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: project.color }} aria-hidden />
        <span className="flex-1 truncate text-left">{project.name}</span>
        <span className="text-xs text-fg-faint tabular-nums group-hover/project:opacity-0 group-focus-within/project:opacity-0">
          {count || ""}
        </span>
      </button>
      <div ref={menuRef} className="absolute top-1 right-1">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={`Options for ${project.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={cn(
            "rounded-md p-1 text-fg-faint hover:bg-line hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
            menuOpen ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover/project:opacity-100",
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
        <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 520, damping: 32 }}
            style={{ originX: 1, originY: 0 }}
            className="absolute top-8 right-0 z-10 w-40 rounded-xl border border-line bg-bg p-1 shadow-float"
          >
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={() => {
                setMenuOpen(false);
                setRenaming(true);
              }}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
            >
              <Pencil className="size-3.5 text-fg-muted" /> Rename
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-danger hover:bg-danger-soft focus-visible:bg-danger-soft focus-visible:outline-none"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

function ProjectNameInput({
  initial = "",
  placeholder,
  color = "var(--fg-faint)",
  onSubmit,
  onCancel,
}: {
  initial?: string;
  placeholder?: string;
  color?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const name = value.trim();
    if (name) onSubmit(name);
    else onCancel();
  };

  return (
    <form onSubmit={submit} className="flex h-8 items-center gap-2.5 rounded-lg bg-bg px-2.5 ring-2 ring-accent">
      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => submit()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
        }}
        placeholder={placeholder}
        aria-label="Project name"
        maxLength={60}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-faint"
      />
    </form>
  );
}
