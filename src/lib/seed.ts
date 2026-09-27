import { addDays, todayKey } from "./dates";
import type { AppData } from "./types";

export const PROJECT_COLORS = [
  "#7b68ee",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
];

export const PERSON_COLORS = ["#6c5ce7", "#0ea5e9", "#f97316", "#10b981", "#ec4899", "#eab308", "#14b8a6", "#ef4444"];

export const TAG_COLORS = ["#0ea5e9", "#a855f7", "#f97316", "#10b981", "#ec4899", "#eab308", "#64748b", "#ef4444"];

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function defaultPeople() {
  return [
    { id: createId(), name: "Me", color: PERSON_COLORS[0] },
    { id: createId(), name: "Alex Kim", color: PERSON_COLORS[1] },
    { id: createId(), name: "Sam Rivera", color: PERSON_COLORS[2] },
  ];
}

export function defaultTags() {
  return [
    { id: createId(), name: "design", color: TAG_COLORS[0] },
    { id: createId(), name: "research", color: TAG_COLORS[1] },
    { id: createId(), name: "errand", color: TAG_COLORS[3] },
    { id: createId(), name: "urgent", color: TAG_COLORS[7] },
  ];
}

/** Seed dates are relative to today so every view has something in it on first run. */
export function createSeedData(): AppData {
  const today = todayKey();
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

  const website = { id: createId(), name: "Website Redesign", color: PROJECT_COLORS[0], createdAt: hoursAgo(240) };
  const personal = { id: createId(), name: "Personal", color: PROJECT_COLORS[1], createdAt: hoursAgo(230) };
  const planning = { id: createId(), name: "Q4 Planning", color: PROJECT_COLORS[2], createdAt: hoursAgo(220) };

  const people = defaultPeople();
  const [me, alex, sam] = people;
  const tags = defaultTags();
  const [design, research, errand, urgent] = tags;

  const sub = (title: string, done = false) => ({ id: createId(), title, done });

  return {
    projects: [website, personal, planning],
    people,
    tags,
    tasks: [
      {
        id: createId(),
        title: "Draft homepage wireframes",
        description: "Low-fidelity layouts for the hero, features and pricing sections.",
        dueDate: today,
        priority: "high",
        status: "in_progress",
        projectId: website.id,
        assigneeIds: [me.id, alex.id],
        tagIds: [design.id, urgent.id],
        subtasks: [sub("Hero section", true), sub("Features grid", true), sub("Pricing table"), sub("Footer")],
        createdAt: hoursAgo(72),
      },
      {
        id: createId(),
        title: "Review brand color palette",
        description: "",
        dueDate: addDays(today, 3),
        priority: "medium",
        status: "todo",
        projectId: website.id,
        assigneeIds: [alex.id],
        tagIds: [design.id],
        subtasks: [],
        createdAt: hoursAgo(60),
      },
      {
        id: createId(),
        title: "Book dentist appointment",
        description: "Ask about the Saturday morning slots.",
        dueDate: addDays(today, -2),
        priority: "low",
        status: "todo",
        projectId: personal.id,
        assigneeIds: [me.id],
        tagIds: [errand.id],
        subtasks: [],
        createdAt: hoursAgo(120),
      },
      {
        id: createId(),
        title: "Renew gym membership",
        description: "",
        dueDate: addDays(today, -5),
        priority: "medium",
        status: "completed",
        projectId: personal.id,
        assigneeIds: [me.id],
        tagIds: [errand.id],
        subtasks: [],
        createdAt: hoursAgo(168),
      },
      {
        id: createId(),
        title: "Outline Q4 goals",
        description: "Three outcomes, each with a measurable target.",
        dueDate: addDays(today, 1),
        priority: "high",
        status: "in_progress",
        projectId: planning.id,
        assigneeIds: [me.id, sam.id],
        tagIds: [research.id],
        subtasks: [sub("Review last quarter", true), sub("Draft three outcomes"), sub("Share with team")],
        createdAt: hoursAgo(48),
      },
      {
        id: createId(),
        title: "Collect budget numbers from finance",
        description: "",
        dueDate: null,
        priority: "medium",
        status: "todo",
        projectId: planning.id,
        assigneeIds: [sam.id],
        tagIds: [],
        subtasks: [],
        createdAt: hoursAgo(24),
      },
    ],
  };
}
