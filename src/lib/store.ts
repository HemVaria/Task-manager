"use client";

import { useSyncExternalStore } from "react";
import { createId, createSeedData, defaultPeople, defaultTags, PERSON_COLORS, PROJECT_COLORS, TAG_COLORS } from "./seed";
import type { AppData, Person, Priority, Project, Status, Subtask, Tag, Task } from "./types";

const STORAGE_KEY = "taskmanager:data:v1";

let data: AppData | null = null;
const listeners = new Set<() => void>();

function isValid(value: unknown): value is Pick<AppData, "tasks" | "projects"> {
  if (!value || typeof value !== "object") return false;
  const v = value as AppData;
  return Array.isArray(v.tasks) && Array.isArray(v.projects);
}

/**
 * Fills in fields added after the first release so older saved data keeps working.
 * Data from before people and tags existed gets the starter lists, unassigned.
 */
function normalize(value: Pick<AppData, "tasks" | "projects"> & Partial<AppData>): AppData {
  return {
    projects: value.projects,
    people: Array.isArray(value.people) ? value.people : defaultPeople(),
    tags: Array.isArray(value.tags) ? value.tags : defaultTags(),
    tasks: value.tasks.map((t) => ({
      ...t,
      assigneeIds: Array.isArray(t.assigneeIds) ? t.assigneeIds : [],
      tagIds: Array.isArray(t.tagIds) ? t.tagIds : [],
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    })),
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValid(parsed)) return normalize(parsed);
    }
  } catch {
    // Corrupt or unavailable storage: fall through to seed data.
  }
  const seed = createSeedData();
  save(seed);
  return seed;
}

function save(next: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked; keep working in memory.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep several open tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    data = load();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppData {
  if (data === null) data = load();
  return data;
}

const getServerSnapshot = () => null;

/** Returns null during server render and hydration, then the stored data. */
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function update(recipe: (current: AppData) => AppData) {
  data = recipe(getSnapshot());
  save(data);
  emit();
}

export interface NewTask {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  status?: Status;
  projectId?: string | null;
  assigneeIds?: string[];
  tagIds?: string[];
}

export function addTask(input: NewTask): Task {
  const task: Task = {
    id: createId(),
    title: input.title.trim(),
    description: input.description ?? "",
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? "medium",
    status: input.status ?? "todo",
    projectId: input.projectId ?? null,
    assigneeIds: input.assigneeIds ?? [],
    tagIds: input.tagIds ?? [],
    subtasks: [],
    createdAt: new Date().toISOString(),
  };
  update((d) => ({ ...d, tasks: [...d.tasks, task] }));
  return task;
}

export function updateTask(id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) {
  update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
}

export function deleteTask(id: string): Task | undefined {
  const removed = getSnapshot().tasks.find((t) => t.id === id);
  update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  return removed;
}

export function restoreTask(task: Task) {
  update((d) => ({ ...d, tasks: [...d.tasks.filter((t) => t.id !== task.id), task] }));
}

export function addProject(name: string): Project {
  const { projects } = getSnapshot();
  const project: Project = {
    id: createId(),
    name: name.trim(),
    color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length],
    createdAt: new Date().toISOString(),
  };
  update((d) => ({ ...d, projects: [...d.projects, project] }));
  return project;
}

export function renameProject(id: string, name: string) {
  update((d) => ({
    ...d,
    projects: d.projects.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
  }));
}

/** Deleting a project keeps its tasks; they simply become unassigned. */
export function deleteProject(id: string) {
  update((d) => ({
    ...d,
    projects: d.projects.filter((p) => p.id !== id),
    tasks: d.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
  }));
}

// ---- people & tags --------------------------------------------------------

export function addPerson(name: string): Person {
  const { people } = getSnapshot();
  const person: Person = { id: createId(), name: name.trim(), color: PERSON_COLORS[people.length % PERSON_COLORS.length] };
  update((d) => ({ ...d, people: [...d.people, person] }));
  return person;
}

export function deletePerson(id: string) {
  update((d) => ({
    ...d,
    people: d.people.filter((p) => p.id !== id),
    tasks: d.tasks.map((t) => (t.assigneeIds.includes(id) ? { ...t, assigneeIds: t.assigneeIds.filter((a) => a !== id) } : t)),
  }));
}

export function addTag(name: string): Tag {
  const { tags } = getSnapshot();
  const clean = name.trim().replace(/^#/, "").toLowerCase();
  const existing = tags.find((t) => t.name === clean);
  if (existing) return existing;
  const tag: Tag = { id: createId(), name: clean, color: TAG_COLORS[tags.length % TAG_COLORS.length] };
  update((d) => ({ ...d, tags: [...d.tags, tag] }));
  return tag;
}

export function deleteTag(id: string) {
  update((d) => ({
    ...d,
    tags: d.tags.filter((t) => t.id !== id),
    tasks: d.tasks.map((t) => (t.tagIds.includes(id) ? { ...t, tagIds: t.tagIds.filter((x) => x !== id) } : t)),
  }));
}

// ---- subtasks -------------------------------------------------------------

function updateSubtasks(taskId: string, recipe: (subtasks: Subtask[]) => Subtask[]) {
  update((d) => ({
    ...d,
    tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: recipe(t.subtasks) } : t)),
  }));
}

export function addSubtask(taskId: string, title: string) {
  updateSubtasks(taskId, (list) => [...list, { id: createId(), title: title.trim(), done: false }]);
}

export function updateSubtask(taskId: string, subtaskId: string, patch: Partial<Omit<Subtask, "id">>) {
  updateSubtasks(taskId, (list) => list.map((s) => (s.id === subtaskId ? { ...s, ...patch } : s)));
}

export function deleteSubtask(taskId: string, subtaskId: string) {
  updateSubtasks(taskId, (list) => list.filter((s) => s.id !== subtaskId));
}
