"use client";

import { Menu, Moon, Plus, Search, Sun, X } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, greeting, longDate, todayKey } from "@/lib/dates";
import {
  addProject,
  addTask,
  deleteProject,
  deleteTask,
  renameProject,
  restoreTask,
  updateTask,
  useAppData,
} from "@/lib/store";
import { filterTasks, sortTasks, STATUS_META, STATUSES, VIEW_META, VIEWS, viewCounts } from "@/lib/tasks";
import { setTheme, useTheme } from "@/lib/theme";
import { hasSeenTour, isTourActive, startTour } from "@/lib/tour";
import type { Layout, Lookup, Priority, Project, ProjectFilter, SortKey, Status, Task, TaskFilters, ViewId } from "@/lib/types";
import { Dashboard, type DashboardCard } from "./dashboard";
import { ConfirmDialog, Dialog, Kbd } from "./dialog";
import { Illustration, ProgressRing, type IllustrationKind } from "./graphics";
import { QuickAdd, type QuickAddValues } from "./quick-add";
import { Sidebar } from "./sidebar";
import { TaskDrawer } from "./task-drawer";
import { TaskBoard } from "./task-board";
import { TaskList, type TaskGroup } from "./task-list";
import { ToastProvider, useToast } from "./toast";
import { Toolbar } from "./toolbar";

export function TaskApp() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <TaskAppInner />
      </ToastProvider>
    </MotionConfig>
  );
}

type Confirm = { kind: "task"; task: Task } | { kind: "project"; project: Project; taskCount: number };

function useToday() {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

const LAYOUT_KEY = "taskmanager:layout";

function readLayout(): Layout {
  try {
    return typeof window !== "undefined" && localStorage.getItem(LAYOUT_KEY) === "board" ? "board" : "list";
  } catch {
    return "list";
  }
}

function TaskAppInner() {
  const data = useAppData();
  const toast = useToast();
  const theme = useTheme();
  const today = useToday();

  const [view, setView] = useState<ViewId>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [assigneeId, setAssigneeId] = useState("all");
  const [tagId, setTagId] = useState("all");
  const [layout, setLayoutState] = useState<Layout>(readLayout);
  const [sort, setSort] = useState<SortKey>("due");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const projects = useMemo(() => data?.projects ?? [], [data]);
  const people = useMemo(() => data?.people ?? [], [data]);
  const tags = useMemo(() => data?.tags ?? [], [data]);
  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const lookup: Lookup = useMemo(
    () => ({
      projects: projectsById,
      people: new Map(people.map((p) => [p.id, p])),
      tags: new Map(tags.map((t) => [t.id, t])),
    }),
    [projectsById, people, tags],
  );
  const tagNames = (task: Task) => task.tagIds.flatMap((id) => lookup.tags.get(id)?.name ?? []);

  const setLayout = (next: Layout) => {
    setLayoutState(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      // Layout still applies for this session.
    }
  };

  // A deleted project can't stay selected.
  const activeProject = projectFilter !== "all" && projectFilter !== "none" ? projectsById.get(projectFilter) : undefined;
  const effectiveProjectFilter: ProjectFilter =
    projectFilter !== "all" && projectFilter !== "none" && !activeProject ? "all" : projectFilter;
  const effectiveStatus = view === "completed" ? "all" : status;

  // A deleted person or tag can't stay selected either.
  const effectiveAssignee = assigneeId === "all" || assigneeId === "none" || lookup.people.has(assigneeId) ? assigneeId : "all";
  const effectiveTag = tagId === "all" || lookup.tags.has(tagId) ? tagId : "all";

  const filters: TaskFilters = {
    view,
    projectId: effectiveProjectFilter,
    priority,
    status: effectiveStatus,
    assigneeId: effectiveAssignee,
    tagId: effectiveTag,
    query,
  };
  const visible = sortTasks(filterTasks(tasks, filters, today, tagNames), sort);

  const counts = viewCounts(tasks, today);
  const projectCounts: Record<string, number> = {};
  for (const task of tasks) if (task.projectId) projectCounts[task.projectId] = (projectCounts[task.projectId] ?? 0) + 1;

  const groupStatuses: Status[] =
    effectiveStatus !== "all"
      ? [effectiveStatus]
      : view === "completed"
        ? ["completed"]
        : view === "all"
          ? STATUSES
          : ["todo", "in_progress"];
  const groups: TaskGroup[] = groupStatuses.map((s) => ({ status: s, tasks: visible.filter((t) => t.status === s) }));

  const selectedTask = selectedId ? tasks.find((t) => t.id === selectedId) : undefined;
  const hasFilters =
    effectiveProjectFilter !== "all" ||
    priority !== "all" ||
    effectiveStatus !== "all" ||
    effectiveAssignee !== "all" ||
    effectiveTag !== "all" ||
    query.trim() !== "";

  const dashboardActive: DashboardCard | null =
    view === "all" ? (effectiveStatus === "in_progress" ? "in_progress" : effectiveStatus === "all" ? "all" : null) : view === "upcoming" ? null : view;

  // ---- navigation -------------------------------------------------------

  const resetFilters = () => {
    setProjectFilter("all");
    setPriority("all");
    setStatus("all");
    setAssigneeId("all");
    setTagId("all");
    setQuery("");
  };

  const goToView = (next: ViewId) => {
    setView(next);
    setProjectFilter("all");
    setStatus("all");
    setSidebarOpen(false);
  };

  const goToProject = (id: string) => {
    setView("all");
    setProjectFilter(id);
    setStatus("all");
    setSidebarOpen(false);
  };

  const onDashboard = (card: DashboardCard) => {
    if (card === "in_progress") {
      setView("all");
      setStatus("in_progress");
    } else {
      setView(card);
      setStatus("all");
    }
  };

  // ---- actions ----------------------------------------------------------

  const handleAdd = (values: QuickAddValues) => {
    const task = addTask({ ...values, status: effectiveStatus === "in_progress" ? "in_progress" : "todo" });
    if (filterTasks([task], filters, today).length === 0) {
      toast("Task added, but hidden by this view", {
        label: "Show",
        onClick: () => {
          setView("all");
          resetFilters();
        },
      });
    } else {
      toast("Task added");
    }
  };

  const moveTask = (task: Task, next: Status) => {
    const previous = task.status;
    updateTask(task.id, { status: next });
    toast(`Moved to ${STATUS_META[next].label}`, { label: "Undo", onClick: () => updateTask(task.id, { status: previous }) });
  };

  const addToColumn = (title: string, columnStatus: Status) => {
    addTask({
      title,
      status: columnStatus,
      projectId: activeProject?.id ?? null,
      dueDate: view === "today" ? today : view === "upcoming" ? addDays(today, 1) : null,
    });
    toast(`Task added to ${STATUS_META[columnStatus].label}`);
  };

  const toggleComplete = (task: Task) => {
    if (task.status === "completed") {
      updateTask(task.id, { status: "todo" });
      toast("Task reopened");
    } else {
      const previous = task.status;
      updateTask(task.id, { status: "completed" });
      toast("Task completed", { label: "Undo", onClick: () => updateTask(task.id, { status: previous }) });
    }
  };

  const confirmDelete = () => {
    if (!confirm) return;
    if (confirm.kind === "task") {
      const removed = deleteTask(confirm.task.id);
      if (selectedId === confirm.task.id) setSelectedId(null);
      if (removed) toast("Task deleted", { label: "Undo", onClick: () => restoreTask(removed) });
    } else {
      deleteProject(confirm.project.id);
      if (projectFilter === confirm.project.id) setProjectFilter("all");
      toast(`Project "${confirm.project.name}" deleted`);
    }
    setConfirm(null);
  };

  const requestDeleteTask = (task: Task) => setConfirm({ kind: "task", task });

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.select();
  };

  const focusQuickAdd = () => {
    setSelectedId(null);
    setSidebarOpen(false);
    requestAnimationFrame(() => quickAddRef.current?.focus());
  };

  const openTour = () => {
    setSidebarOpen(false);
    setShortcutsOpen(false);
    setSelectedId(null);
    // Give the mobile menu time to slide away before measuring targets.
    setTimeout(startTour, 250);
  };

  // First visit: show the tour once the app has data to point at.
  const loaded = data !== null;
  useEffect(() => {
    if (!loaded || hasSeenTour()) return;
    const id = setTimeout(startTour, 900);
    return () => clearTimeout(id);
  }, [loaded]);

  // ---- keyboard ---------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // driver.js handles its own keys while the tour is running.
      if (isTourActive()) return;
      const target = event.target as HTMLElement;
      const typing = !!target.closest?.("input, textarea, select, [contenteditable='true'], [role='listbox']");

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (event.key === "Escape") {
        if (confirm) setConfirm(null);
        else if (shortcutsOpen) setShortcutsOpen(false);
        else if (selectedId) setSelectedId(null);
        else if (target === searchRef.current) {
          setQuery("");
          target.blur();
        } else if (sidebarOpen) setSidebarOpen(false);
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey || confirm || shortcutsOpen) return;

      const rowId = (document.activeElement as HTMLElement | null)?.dataset?.taskRow;
      const rowTask = rowId ? tasks.find((t) => t.id === rowId) : undefined;

      const moveFocus = (delta: number) => {
        const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-task-row]"));
        if (rows.length === 0) return;
        const index = rows.findIndex((row) => row === document.activeElement);
        const next = index === -1 ? (delta > 0 ? 0 : rows.length - 1) : Math.min(rows.length - 1, Math.max(0, index + delta));
        rows[next].focus();
        rows[next].scrollIntoView({ block: "nearest" });
      };

      const viewIndex = VIEWS.findIndex((v) => VIEW_META[v].shortcut === event.key);
      if (viewIndex !== -1) {
        goToView(VIEWS[viewIndex]);
        return;
      }

      switch (event.key) {
        case "n":
        case "c":
          event.preventDefault();
          focusQuickAdd();
          break;
        case "/":
          event.preventDefault();
          focusSearch();
          break;
        case "?":
          setShortcutsOpen(true);
          break;
        case "b":
          setLayout(layout === "list" ? "board" : "list");
          break;
        case "j":
        case "ArrowDown":
          // Arrow keys only navigate tasks from the list itself, not from other controls.
          if (selectedId || (event.key === "ArrowDown" && !rowId && target !== document.body)) return;
          event.preventDefault();
          moveFocus(1);
          break;
        case "k":
        case "ArrowUp":
          if (selectedId || (event.key === "ArrowUp" && !rowId && target !== document.body)) return;
          event.preventDefault();
          moveFocus(-1);
          break;
        case "x":
          if (rowTask) toggleComplete(rowTask);
          break;
        case "Delete":
        case "Backspace":
          if (rowTask) {
            event.preventDefault();
            requestDeleteTask(rowTask);
          }
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // ---- render -----------------------------------------------------------

  if (!data) return <LoadingShell />;

  const title = activeProject?.name ?? (effectiveProjectFilter === "none" ? "No project" : VIEW_META[view].label);
  const showGreeting = view === "all" && !activeProject && effectiveProjectFilter === "all";

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        view={view}
        projectFilter={effectiveProjectFilter}
        counts={counts}
        projects={projects}
        projectCounts={projectCounts}
        onSelectView={goToView}
        onSelectProject={goToProject}
        onCreateProject={(name) => {
          const project = addProject(name);
          goToProject(project.id);
          toast(`Project "${project.name}" created`);
        }}
        onRenameProject={(id, name) => {
          renameProject(id, name);
          toast("Project renamed");
        }}
        onDeleteProject={(project) =>
          setConfirm({ kind: "project", project, taskCount: projectCounts[project.id] ?? 0 })
        }
        onShowShortcuts={() => {
          setSidebarOpen(false);
          setShortcutsOpen(true);
        }}
        onStartTour={openTour}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-fg-muted hover:bg-hover md:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="relative mx-auto w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-faint" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="h-9 w-full rounded-lg border border-line bg-subtle pr-16 pl-9 text-sm outline-none placeholder:text-fg-faint hover:border-line-strong focus:border-accent/50 focus:bg-bg focus:ring-2 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-fg-faint hover:text-fg"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <Kbd className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 sm:inline-flex">/</Kbd>
            )}
          </div>

          <button
            type="button"
            data-tour="theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="rounded-lg p-2 text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                className="block"
                initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <button
            type="button"
            onClick={focusQuickAdd}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-fg px-3 text-sm font-medium text-bg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">New task</span>
            <span className="sr-only sm:hidden">New task</span>
          </button>
        </header>

        <main className="relative flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <HeaderBackdrop />
          <div className="relative mx-auto w-full max-w-5xl px-4 pt-6 pb-24 sm:px-8 sm:pt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <motion.div
                key={showGreeting ? "greeting" : title}
                className="min-w-0"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              >
                <h1 className="flex items-center gap-2.5 truncate text-2xl font-semibold tracking-tight">
                  {activeProject && (
                    <span className="size-3.5 shrink-0 rounded" style={{ backgroundColor: activeProject.color }} aria-hidden />
                  )}
                  {showGreeting ? greeting() : title}
                </h1>
                <p className="mt-1 text-sm text-fg-muted">
                  {showGreeting ? longDate() : `${visible.length} ${visible.length === 1 ? "task" : "tasks"}`}
                </p>
              </motion.div>
              <ProgressRing done={counts.completed} total={counts.all} />
            </div>

            <Dashboard
              counts={{
                all: counts.all,
                today: counts.today,
                in_progress: tasks.filter((t) => t.status === "in_progress").length,
                completed: counts.completed,
                overdue: counts.overdue,
              }}
              active={activeProject ? null : dashboardActive}
              onSelect={onDashboard}
            />

            <div className="mt-6 space-y-3">
              <QuickAdd
                inputRef={quickAddRef}
                projects={projects}
                people={people}
                defaultProjectId={activeProject?.id ?? null}
                defaultDueDate={view === "today" ? today : view === "upcoming" ? addDays(today, 1) : null}
                onAdd={handleAdd}
              />
              <Toolbar
                projects={projects}
                people={people}
                tags={tags}
                assigneeId={effectiveAssignee}
                tagId={effectiveTag}
                layout={layout}
                onAssignee={setAssigneeId}
                onTag={setTagId}
                onLayout={setLayout}
                projectFilter={effectiveProjectFilter}
                priority={priority}
                status={effectiveStatus}
                sort={sort}
                lockStatus={view === "completed"}
                onProject={setProjectFilter}
                onPriority={setPriority}
                onStatus={setStatus}
                onSort={setSort}
                onClear={resetFilters}
              />
            </div>

            <div className="mt-6">
              {visible.length === 0 ? (
                <EmptyState
                  view={view}
                  filtered={hasFilters}
                  noTasksAtAll={tasks.length === 0}
                  onClear={resetFilters}
                  onAdd={focusQuickAdd}
                />
              ) : layout === "board" ? (
                <TaskBoard
                  groups={groups}
                  lookup={lookup}
                  today={today}
                  selectedId={selectedId}
                  onOpen={(task) => setSelectedId(task.id)}
                  onToggleComplete={toggleComplete}
                  onMove={moveTask}
                  onAdd={addToColumn}
                />
              ) : (
                <TaskList
                  groups={groups}
                  lookup={lookup}
                  today={today}
                  selectedId={selectedId}
                  onOpen={(task) => setSelectedId(task.id)}
                  onToggleComplete={toggleComplete}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
      {selectedTask && (
        <TaskDrawer
          key={selectedTask.id}
          task={selectedTask}
          projects={projects}
          people={people}
          tags={tags}
          today={today}
          onChange={(patch, announce) => {
            updateTask(selectedTask.id, patch);
            if (announce) toast(announce);
          }}
          onToggleComplete={() => toggleComplete(selectedTask)}
          onDelete={() => requestDeleteTask(selectedTask)}
          onClose={() => setSelectedId(null)}
        />
      )}
      </AnimatePresence>

      <AnimatePresence>
      {confirm?.kind === "task" && (
        <ConfirmDialog
          key="confirm-task"
          title="Delete task?"
          message={
            <>
              <span className="font-medium text-fg">“{confirm.task.title}”</span> will be removed.
            </>
          }
          confirmLabel="Delete task"
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.kind === "project" && (
        <ConfirmDialog
          key="confirm-project"
          title="Delete project?"
          message={
            <>
              <span className="font-medium text-fg">“{confirm.project.name}”</span> will be deleted.
              {confirm.taskCount > 0 &&
                ` Its ${confirm.taskCount} ${confirm.taskCount === 1 ? "task stays" : "tasks stay"} in your list without a project.`}
            </>
          }
          confirmLabel="Delete project"
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {shortcutsOpen && <ShortcutsDialog key="shortcuts" onClose={() => setShortcutsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

const EMPTY_COPY: Record<ViewId, { art: IllustrationKind; title: string; hint: string }> = {
  all: { art: "tasks", title: "No tasks yet", hint: "Add your first task above. Press N from anywhere to start typing." },
  today: { art: "calendar", title: "Nothing due today", hint: "Enjoy the space, or add a task for today." },
  upcoming: { art: "calendar", title: "Nothing scheduled ahead", hint: "Give a task a future due date and it shows up here." },
  overdue: { art: "celebrate", title: "You're all caught up", hint: "No overdue tasks. Nice work." },
  completed: { art: "done", title: "No completed tasks yet", hint: "Tick the circle next to a task to complete it." },
};

function EmptyState({
  view,
  filtered,
  noTasksAtAll,
  onClear,
  onAdd,
}: {
  view: ViewId;
  filtered: boolean;
  noTasksAtAll: boolean;
  onClear: () => void;
  onAdd: () => void;
}) {
  const copy = filtered
    ? { art: "search" as const, title: "No matching tasks", hint: "Try a different search or clear the filters." }
    : noTasksAtAll
      ? EMPTY_COPY.all
      : EMPTY_COPY[view];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center"
    >
      <Illustration kind={copy.art} />
      <h2 className="mt-2 text-base font-semibold">{copy.title}</h2>
      <p className="mt-1 max-w-xs text-sm text-fg-muted">{copy.hint}</p>
      <button
        type="button"
        onClick={filtered ? onClear : onAdd}
        className="mt-4 h-9 rounded-lg border border-line px-3.5 text-sm font-medium hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {filtered ? "Clear filters" : "Add a task"}
      </button>
    </motion.div>
  );
}

/** Soft dotted grid and accent glow behind the page header. */
function HeaderBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse 70% 100% at 50% 0%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 100% at 50% 0%, black 20%, transparent 75%)",
        }}
      />
      <div
        className="absolute -top-40 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--accent-soft), transparent)" }}
      />
    </div>
  );
}

const SHORTCUTS: [string[], string][] = [
  [["N"], "New task"],
  [["/"], "Search"],
  [["J", "K"], "Move between tasks"],
  [["Enter"], "Open task"],
  [["X"], "Complete or reopen"],
  [["Del"], "Delete task"],
  [["1–5"], "Switch view"],
  [["B"], "List or board"],
  [["Esc"], "Close panel or dialog"],
  [["?"], "Show shortcuts"],
];

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Keyboard shortcuts</h2>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Close"
          className="rounded-lg p-1.5 text-fg-muted hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {SHORTCUTS.map(([keys, label]) => (
          <li key={label} className="flex items-center justify-between py-2 text-sm">
            <span className="text-fg-muted">{label}</span>
            <span className="flex gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

function LoadingShell() {
  return (
    <div className="flex h-full" aria-busy="true" aria-label="Loading">
      <div className="hidden w-64 border-r border-line bg-subtle md:block" />
      <div className="flex-1">
        <div className="h-14 border-b border-line" />
        <div className="mx-auto max-w-5xl space-y-4 px-8 pt-8">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
