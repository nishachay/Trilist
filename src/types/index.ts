export type ListKey = "rough" | "todo" | "watch" | "later";
export type PriorityLevel = 1 | 2 | 3;

export interface Task {
  id: string;
  text: string;
  list: ListKey;
  done: boolean;
  priority?: PriorityLevel;
  scheduledDate?: string;
  /** Pinned into the Todo "Focus" shelf (max 5). */
  pinned?: boolean;
  /** ISO timestamp of when a Todo item was ticked. Drives "Done today". */
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  resolving?: boolean;
}

export interface Cmd {
  cmd: string;
  alias: string;
  desc: string;
  type: "list" | "date" | "priority" | "view" | "action";
  target?: ListKey;
  days?: number;
  priority?: PriorityLevel;
  action?: "pin" | "did";
}

export interface ExtractedInfo {
  list?: { raw: string; key: ListKey; label: string };
  date?: { raw: string; label: string; days: number };
  priority?: { raw: string; level: PriorityLevel; label: string };
  pin?: { raw: string };
  did?: { raw: string };
  cleanText: string;
}

/** Whole days between an ISO timestamp and now. */
export function ageInDays(iso: string, now = Date.now()): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((now - then) / 86_400_000));
}

/** Compact Watch age: "today", "2d", "3w". */
export function ageLabel(iso: string, now = Date.now()): string {
  const d = ageInDays(iso, now);
  if (d <= 0) return "today";
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

/** True when the ISO timestamp falls on the local calendar day. */
export function isTodayLocal(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export type TodoSection = "today" | "week" | "nextweek" | "month";

/** Map a Todo item to its quiet section. No date = Today. */
export function todoSection(scheduledDate: string | undefined, now = new Date()): TodoSection {
  if (!scheduledDate) return "today";
  const target = new Date(scheduledDate);
  if (Number.isNaN(target.getTime())) return "today";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((target.getTime() - startOfToday) / 86_400_000);
  if (diffDays <= 0) return "today";
  if (diffDays <= 7) return "week";
  if (diffDays <= 14) return "nextweek";
  return "month";
}
