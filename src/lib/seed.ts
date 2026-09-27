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
    { id: createId(), name: "research", color: TAG_COLORS[1] },
    { id: createId(), name: "design", color: TAG_COLORS[0] },
    { id: createId(), name: "idea", color: TAG_COLORS[5] },
    { id: createId(), name: "urgent", color: TAG_COLORS[7] },
  ];
}

/**
 * Sample data: an early brainstorm for building a gym app. Dates are relative to
 * today so every view (Today, Upcoming, Overdue, Completed) has something in it.
 */
export function createSeedData(): AppData {
  const today = todayKey();
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

  const discovery = { id: createId(), name: "Discovery", color: PROJECT_COLORS[0], createdAt: hoursAgo(240) };
  const design = { id: createId(), name: "UX & Design", color: PROJECT_COLORS[4], createdAt: hoursAgo(230) };
  const build = { id: createId(), name: "MVP Build", color: PROJECT_COLORS[1], createdAt: hoursAgo(220) };

  const people = defaultPeople();
  const [me, alex, sam] = people;
  const tags = defaultTags();
  const [research, designTag, idea, urgent] = tags;

  const sub = (title: string, done = false) => ({ id: createId(), title, done });

  return {
    projects: [discovery, design, build],
    people,
    tags,
    tasks: [
      {
        id: createId(),
        title: "Interview 5 gym-goers about tracking",
        description: "Focus on what makes them stop logging. Record pain points, not feature requests.",
        dueDate: today,
        priority: "high",
        status: "in_progress",
        projectId: discovery.id,
        assigneeIds: [me.id, alex.id],
        tagIds: [research.id],
        subtasks: [
          sub("Write the interview script", true),
          sub("Recruit participants at the local gym", true),
          sub("Run the interviews"),
          sub("Summarize top 3 pain points"),
        ],
        createdAt: hoursAgo(96),
      },
      {
        id: createId(),
        title: "Brainstorm MVP features",
        description: "Dump every idea first, then vote on the top five for the first release.",
        dueDate: addDays(today, 2),
        priority: "medium",
        status: "todo",
        projectId: discovery.id,
        assigneeIds: [me.id, alex.id, sam.id],
        tagIds: [idea.id],
        subtasks: [
          sub("Workout logging with sets and reps"),
          sub("Class schedule and booking"),
          sub("Progress charts and personal records"),
          sub("Streaks and rest-day reminders"),
          sub("Share workouts with a friend"),
        ],
        createdAt: hoursAgo(72),
      },
      {
        id: createId(),
        title: "Review competitor gym and fitness apps",
        description: "Note onboarding, logging speed and pricing for three or four popular apps.",
        dueDate: addDays(today, -2),
        priority: "medium",
        status: "todo",
        projectId: discovery.id,
        assigneeIds: [sam.id],
        tagIds: [research.id],
        subtasks: [],
        createdAt: hoursAgo(120),
      },
      {
        id: createId(),
        title: "Pick the app name and logo direction",
        description: "",
        dueDate: addDays(today, -4),
        priority: "low",
        status: "completed",
        projectId: design.id,
        assigneeIds: [alex.id],
        tagIds: [designTag.id],
        subtasks: [],
        createdAt: hoursAgo(168),
      },
      {
        id: createId(),
        title: "Wireframe the workout logging flow",
        description: "Logging a set should take one tap. Test it one-handed, as you would between sets.",
        dueDate: addDays(today, 1),
        priority: "high",
        status: "in_progress",
        projectId: design.id,
        assigneeIds: [alex.id, me.id],
        tagIds: [designTag.id, urgent.id],
        subtasks: [
          sub("Start workout screen", true),
          sub("Add exercise and sets"),
          sub("Rest timer"),
          sub("Finish and summary"),
        ],
        createdAt: hoursAgo(48),
      },
      {
        id: createId(),
        title: "Choose the tech stack and set up the repo",
        description: "",
        dueDate: null,
        priority: "medium",
        status: "todo",
        projectId: build.id,
        assigneeIds: [sam.id],
        tagIds: [],
        subtasks: [sub("Compare React Native and Flutter"), sub("Set up CI and linting")],
        createdAt: hoursAgo(24),
      },
    ],
  };
}
