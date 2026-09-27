import type { Priority, SortKey, Status, Task, TaskFilters, ViewId } from "./types";

export const STATUSES: Status[] = ["todo", "in_progress", "completed"];
export const PRIORITIES: Priority[] = ["high", "medium", "low"];

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  todo: { label: "To do", color: "var(--todo)" },
  in_progress: { label: "In progress", color: "var(--progress)" },
  completed: { label: "Completed", color: "var(--done)" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; rank: number }> = {
  high: { label: "High", color: "var(--danger)", rank: 0 },
  medium: { label: "Medium", color: "var(--warning)", rank: 1 },
  low: { label: "Low", color: "var(--fg-faint)", rank: 2 },
};

export const VIEW_META: Record<ViewId, { label: string; shortcut: string }> = {
  all: { label: "All tasks", shortcut: "1" },
  today: { label: "Today", shortcut: "2" },
  upcoming: { label: "Upcoming", shortcut: "3" },
  overdue: { label: "Overdue", shortcut: "4" },
  completed: { label: "Completed", shortcut: "5" },
};

export const VIEWS = Object.keys(VIEW_META) as ViewId[];

export const SORT_LABELS: Record<SortKey, string> = {
  due: "Due date",
  priority: "Priority",
  created: "Created date",
  title: "A to Z",
};

export const isDone = (task: Task) => task.status === "completed";

export function isOverdue(task: Task, today: string): boolean {
  return !isDone(task) && task.dueDate !== null && task.dueDate < today;
}

export function matchesView(task: Task, view: ViewId, today: string): boolean {
  switch (view) {
    case "all":
      return true;
    case "today":
      return !isDone(task) && task.dueDate === today;
    case "upcoming":
      return !isDone(task) && task.dueDate !== null && task.dueDate > today;
    case "overdue":
      return isOverdue(task, today);
    case "completed":
      return isDone(task);
  }
}

export function filterTasks(
  tasks: Task[],
  filters: TaskFilters,
  today: string,
  /** Lets search match tag names, e.g. "design". */
  tagNames?: (task: Task) => string[],
): Task[] {
  const query = filters.query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (!matchesView(task, filters.view, today)) return false;
    if (filters.projectId === "none" && task.projectId !== null) return false;
    if (filters.projectId !== "all" && filters.projectId !== "none" && task.projectId !== filters.projectId) {
      return false;
    }
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.assigneeId === "none" && task.assigneeIds.length > 0) return false;
    if (filters.assigneeId !== "all" && filters.assigneeId !== "none" && !task.assigneeIds.includes(filters.assigneeId)) {
      return false;
    }
    if (filters.tagId !== "all" && !task.tagIds.includes(filters.tagId)) return false;
    if (query) {
      const haystack = [task.title, task.description, ...task.subtasks.map((s) => s.title), ...(tagNames?.(task) ?? [])]
        .join("\n")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

const byCreatedDesc = (a: Task, b: Task) => b.createdAt.localeCompare(a.createdAt);

export function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  const sorted = [...tasks];
  switch (sort) {
    case "due":
      // Tasks without a due date go last.
      sorted.sort((a, b) => {
        if (a.dueDate === b.dueDate) return byCreatedDesc(a, b);
        if (a.dueDate === null) return 1;
        if (b.dueDate === null) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      break;
    case "priority":
      sorted.sort(
        (a, b) => PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank || byCreatedDesc(a, b),
      );
      break;
    case "created":
      sorted.sort(byCreatedDesc);
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
      break;
  }
  return sorted;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function viewCounts(tasks: Task[], today: string): Record<ViewId, number> {
  const counts: Record<ViewId, number> = { all: 0, today: 0, upcoming: 0, overdue: 0, completed: 0 };
  for (const task of tasks) {
    for (const view of VIEWS) if (matchesView(task, view, today)) counts[view]++;
  }
  return counts;
}
