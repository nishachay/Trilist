export type ListKey = "rough" | "todo" | "watch" | "later";
export type PriorityLevel = 1 | 2 | 3;

export interface Task {
  id: string;
  text: string;
  list: ListKey;
  done: boolean;
  priority?: PriorityLevel;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
  resolving?: boolean;
}

export interface Cmd {
  cmd: string;
  alias: string;
  desc: string;
  type: "list" | "date" | "priority" | "view";
  target?: ListKey;
  days?: number;
  priority?: PriorityLevel;
}

export interface ExtractedInfo {
  list?: { raw: string; key: ListKey; label: string };
  date?: { raw: string; label: string; days: number };
  priority?: { raw: string; level: PriorityLevel; label: string };
  cleanText: string;
}
