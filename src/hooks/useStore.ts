import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

export type ListKey = "todo" | "watch" | "later" | "done";
export const LISTS: ListKey[] = ["todo", "watch", "later", "done"];

export type TabKey = ListKey | "calendar";
export const TABS: TabKey[] = ["todo", "watch", "later", "done", "calendar"];

export type Item = {
  id: string;
  text: string;
  list: ListKey;
  createdAt: number;
  doneAt?: number;
  dueAt?: number; // start-of-day ms
};

export type Theme = "system" | "light" | "dark";

export type Prefs = {
  theme: Theme;
  onboarded: boolean;
  activeTab: TabKey;
  lastOpen?: string;
};

export type State = {
  items: Record<string, Item>;
  order: Record<ListKey, string[]>;
  archive: Item[];
  prefs: Prefs;
};

const STORAGE_KEY = "pmarca.v4";
const LEGACY_KEYS = ["pmarca.v3"];

const seedItems: Item[] = [
  { id: "s1", text: "Type below and hit Enter. That is how you add things.", list: "todo", createdAt: 0 },
  { id: "s2", text: "Try:  buy milk /today   or   ship draft /tomorrow", list: "todo", createdAt: 0 },
  { id: "s3", text: "Slash commands route: /todo /watch /later /week /month /on jul 20", list: "todo", createdAt: 0 },
];

function blank(): State {
  return {
    items: {},
    order: { todo: [], watch: [], later: [], done: [] },
    archive: [],
    prefs: { theme: "system", onboarded: false, activeTab: "todo" },
  };
}

function seeded(): State {
  return {
    items: Object.fromEntries(seedItems.map((i) => [i.id, i])),
    order: { todo: seedItems.map((i) => i.id), watch: [], later: [], done: [] },
    archive: [],
    prefs: { theme: "system", onboarded: false, activeTab: "todo" },
  };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function loadRaw(): State {
  if (typeof window === "undefined") return blank();
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        const legacy = window.localStorage.getItem(k);
        if (legacy) { raw = legacy; break; }
      }
    }
    if (!raw) return seeded();
    const parsed = JSON.parse(raw) as State;
    const merged: State = {
      ...blank(),
      ...parsed,
      order: { ...blank().order, ...(parsed.order || {}) },
      prefs: { ...blank().prefs, ...(parsed.prefs || {}) },
    };
    if (!TABS.includes(merged.prefs.activeTab as TabKey)) merged.prefs.activeTab = "todo";
    const cutoff = startOfTodayMs();
    const staleIds = merged.order.done.filter((id) => {
      const it = merged.items[id];
      return it && (it.doneAt ?? 0) < cutoff;
    });
    if (staleIds.length) {
      const stale = staleIds.map((id) => merged.items[id]).filter(Boolean);
      merged.archive = [...stale, ...merged.archive].slice(0, 500);
      merged.order.done = merged.order.done.filter((id) => !staleIds.includes(id));
      for (const id of staleIds) delete merged.items[id];
    }
    merged.prefs.lastOpen = todayISO();
    return merged;
  } catch {
    return seeded();
  }
}

let state: State = blank();
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

function set(next: State) { state = next; persist(); emit(); }

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  state = loadRaw();
  hydrated = true;
  emit();
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;
const SERVER_STATE = blank();
const getServerSnapshot = () => SERVER_STATE;

function uid() { return Math.random().toString(36).slice(2, 10); }

function _add(list: ListKey, text: string, dueAt?: number) {
  const t = text.trim();
  if (!t) return;
  const id = uid();
  const item: Item = {
    id, text: t, list, createdAt: Date.now(),
    ...(list === "done" ? { doneAt: Date.now() } : {}),
    ...(dueAt ? { dueAt } : {}),
  };
  set({
    ...state,
    items: { ...state.items, [id]: item },
    order: { ...state.order, [list]: [id, ...state.order[list]] },
  });
}

function _schedule(id: string, dueAt?: number) {
  const it = state.items[id];
  if (!it) return;
  const next = { ...it };
  if (dueAt) next.dueAt = dueAt; else delete next.dueAt;
  set({ ...state, items: { ...state.items, [id]: next } });
}

function _edit(id: string, text: string) {
  const it = state.items[id];
  if (!it) return;
  set({ ...state, items: { ...state.items, [id]: { ...it, text } } });
}

function _remove(id: string) {
  const it = state.items[id];
  if (!it) return;
  const nextItems = { ...state.items };
  delete nextItems[id];
  set({
    ...state,
    items: nextItems,
    order: { ...state.order, [it.list]: state.order[it.list].filter((x) => x !== id) },
  });
}

function _move(id: string, to: ListKey) {
  const it = state.items[id];
  if (!it || it.list === to) return;
  const nextItem: Item = {
    ...it,
    list: to,
    doneAt: to === "done" ? Date.now() : undefined,
  };
  const from = it.list;
  set({
    ...state,
    items: { ...state.items, [id]: nextItem },
    order: {
      ...state.order,
      [from]: state.order[from].filter((x) => x !== id),
      [to]: [id, ...state.order[to]],
    },
  });
}

function _toggle(id: string) {
  const it = state.items[id];
  if (!it) return;
  if (it.list === "todo") _move(id, "done");
  else if (it.list === "done") _move(id, "todo");
}

function _setActive(tab: TabKey) {
  if (state.prefs.activeTab === tab) return;
  set({ ...state, prefs: { ...state.prefs, activeTab: tab } });
}

function _setTheme(theme: Theme) {
  set({ ...state, prefs: { ...state.prefs, theme } });
}

function _dismissOnboarding() {
  const seedIds = ["s1", "s2", "s3"];
  const items = { ...state.items };
  const order = {
    ...state.order,
    todo: state.order.todo.filter((id) => !seedIds.includes(id)),
    done: state.order.done.filter((id) => !seedIds.includes(id)),
  };
  for (const id of seedIds) delete items[id];
  set({ ...state, items, order, prefs: { ...state.prefs, onboarded: true } });
}

function _clearAll() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  state = seeded();
  persist();
  emit();
}

function _exportJSON(): string {
  return JSON.stringify(state, null, 2);
}

export function useStore() {
  useEffect(() => { ensureHydrated(); }, []);
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const counts = useMemo(() => ({
    todo: s.order.todo.length,
    watch: s.order.watch.length,
    later: s.order.later.length,
    done: s.order.done.length,
  }), [s.order]);
  return {
    state: s,
    counts,
    add: useCallback(_add, []),
    edit: useCallback(_edit, []),
    remove: useCallback(_remove, []),
    move: useCallback(_move, []),
    toggle: useCallback(_toggle, []),
    schedule: useCallback(_schedule, []),
    setActive: useCallback(_setActive, []),
    setTheme: useCallback(_setTheme, []),
    dismissOnboarding: useCallback(_dismissOnboarding, []),
    clearAll: useCallback(_clearAll, []),
    exportJSON: useCallback(_exportJSON, []),
  };
}

export function useHydrated() {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function itemsFor(state: State, list: ListKey): Item[] {
  return state.order[list].map((id) => state.items[id]).filter(Boolean);
}

export const LIST_META: Record<ListKey, { label: string; hint: string; empty: string }> = {
  todo:  { label: "Todo",  hint: "must do",     empty: "Nothing to do. Add something you actually must do." },
  watch: { label: "Watch", hint: "waiting on",  empty: "Nothing pending. Add what you are waiting on someone else for." },
  later: { label: "Later", hint: "someday",     empty: "Empty. Add ideas you might get to someday." },
  done:  { label: "Done",  hint: "today",       empty: "Nothing done yet today. Tick a Todo item to log it here." },
};
