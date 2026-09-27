export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in_progress" | "completed";

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

/** A name you can assign tasks to. Local only: there are no accounts. */
export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** Local calendar date, formatted YYYY-MM-DD. */
  dueDate: string | null;
  priority: Priority;
  status: Status;
  projectId: string | null;
  assigneeIds: string[];
  tagIds: string[];
  subtasks: Subtask[];
  createdAt: string;
}

export interface AppData {
  tasks: Task[];
  projects: Project[];
  people: Person[];
  tags: Tag[];
}

/** Id lookups shared by the list, board and detail panel. */
export interface Lookup {
  projects: Map<string, Project>;
  people: Map<string, Person>;
  tags: Map<string, Tag>;
}

export type ViewId = "all" | "today" | "upcoming" | "overdue" | "completed";
export type SortKey = "due" | "priority" | "created" | "title";
export type Layout = "list" | "board";

/** "all" = any project, "none" = tasks without a project, otherwise a project id. */
export type ProjectFilter = "all" | "none" | string;

export interface TaskFilters {
  view: ViewId;
  projectId: ProjectFilter;
  priority: Priority | "all";
  status: Status | "all";
  /** "all", "none" (unassigned) or a person id. */
  assigneeId: string;
  /** "all" or a tag id. */
  tagId: string;
  query: string;
}
