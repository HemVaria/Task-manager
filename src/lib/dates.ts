const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export type DueTone = "overdue" | "today" | "soon" | "later" | "done";

export function describeDue(
  dueDate: string,
  today: string,
  completed: boolean,
): { label: string; tone: DueTone } {
  let label: string;
  if (dueDate === today) label = "Today";
  else if (dueDate === addDays(today, 1)) label = "Tomorrow";
  else if (dueDate === addDays(today, -1)) label = "Yesterday";
  else {
    const date = fromDateKey(dueDate);
    const sameYear = date.getFullYear() === fromDateKey(today).getFullYear();
    label = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
    });
  }

  let tone: DueTone;
  if (completed) tone = "done";
  else if (dueDate < today) tone = "overdue";
  else if (dueDate === today) tone = "today";
  else if (dueDate <= addDays(today, 7)) tone = "soon";
  else tone = "later";

  return { label, tone };
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function longDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
