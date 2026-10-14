import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { addDays } from "date-fns";
import {
  initDB,
  getAllTasks,
  addTaskToDB,
  updateTaskInDB,
  deleteTaskFromDB,
  exportAllDataJSON,
  importDataJSON,
} from "./lib/db";
import type { Task, ListKey, PriorityLevel, Cmd } from "./types";
import { ageLabel, isTodayLocal, todoSection } from "./types";
import type { TodoSection } from "./types";
import { Header } from "./components/Header";
import { TaskRow } from "./components/TaskRow";
import { Omnibar } from "./components/Omnibar";
import { HelpDialog } from "./components/HelpDialog";
import { Toast, type ToastData } from "./components/Toast";
import {
  ACTION_CMDS,
  ALL_CMDS,
  DATE_CMDS,
  LIST_CMDS,
  LIST_LABEL,
  PRIORITY_CMDS,
  parseOmnibarInput,
} from "./lib/commands";
import { DEFAULT_ACCENT, fontStack, normalizeFont, type FontKey } from "./lib/preferences";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const FOCUS_CAP = 5;

const SECTION_LABELS: Record<TodoSection | "focus" | "done", string> = {
  focus: "Focus",
  today: "Today",
  week: "This week",
  nextweek: "Next week",
  month: "Next month",
  done: "Done today",
};

// ─── Initial Seed Tasks ──────────────────────────
function buildSeedTasks(): Omit<Task, "id" | "createdAt" | "updatedAt">[] {
  const now = new Date();
  const inDays = (n: number) => addDays(now, n).toISOString();
  return [
    { text: "Read Andreessen’s productivity essay", list: "todo", done: false, priority: 1, pinned: true },
    { text: "Sketch the Focus shelf", list: "todo", done: false },
    { text: "Shipped the v3 refresh", list: "todo", done: true, completedAt: now.toISOString() },
    { text: "Plan next week’s demo", list: "todo", done: false, scheduledDate: inDays(4) },
    { text: "Book flights for the offsite", list: "todo", done: false, scheduledDate: inDays(10) },
    { text: "Renew domain", list: "todo", done: false, scheduledDate: inDays(30) },
    { text: "API response from vendor team", list: "watch", done: false },
    { text: "Design review feedback", list: "watch", done: false, priority: 3 },
    { text: "Explore IndexedDB backup options", list: "later", done: false },
    { text: "Draft initial component hierarchy", list: "rough", done: false },
  ];
}

const EMPTY_STATES: Record<ListKey, { title: string; cmd: string; hint: string }> = {
  todo:  { title: "Nothing left for today.", cmd: "/did", hint: "logs something you already did" },
  watch: { title: "Nothing you’re waiting on.", cmd: "/wt", hint: "sends an item here from any list" },
  later: { title: "Nothing parked for later.", cmd: "/lt", hint: "sends an item here from any list" },
  rough: { title: "A blank page.", cmd: "/td", hint: "turns a note into a Todo" },
};

/** Section key used to order + label Todo rows. */
function sectionOf(task: Task, now: Date): TodoSection | "focus" | "done" {
  if (task.done && isTodayLocal(task.completedAt, now)) return "done";
  if (task.pinned && !task.done) return "focus";
  return todoSection(task.scheduledDate, now);
}

/** Swap theme without every colour transition firing at once. */
function withoutTransitions(fn: () => void) {
  const style = document.createElement("style");
  style.append(document.createTextNode("*,*::before,*::after{transition:none!important}"));
  document.head.append(style);
  fn();
  void document.body.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<ListKey>("todo");
  const [input, setInput] = useState("");
  // The slash menu is derived from the input; Escape dismisses it for the current text.
  const [menuDismissedFor, setMenuDismissedFor] = useState<string | null>(null);
  const [selIdx, setSelIdx] = useState(0);

  // Keyboard selection + inline editing
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");

  // Done-today disclosure + clock (watch ages, midnight reset)
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Toast with Undo
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Theme & preferences (light is the default)
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("trilist_theme") as "dark" | "light") || "light"
  );
  const [accentColor, setAccentColor] = useState<string>(() =>
    localStorage.getItem("trilist_accent") || DEFAULT_ACCENT
  );
  const [font, setFont] = useState<FontKey>(() => normalizeFont(localStorage.getItem("trilist_font")));

  // Overlays & popovers
  const [showHelp, setShowHelp] = useState(false);
  const [actionMenuTaskId, setActionMenuTaskId] = useState<string | null>(null);
  const [priorityPopoverTaskId, setPriorityPopoverTaskId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Preferences → document ──────────────────
  useLayoutEffect(() => {
    const root = document.documentElement;
    withoutTransitions(() => {
      root.classList.toggle("dark", theme === "dark");
      root.style.colorScheme = theme;
    });
    const bg = getComputedStyle(root).getPropertyValue("--bg-hex").trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute("content", bg || "#f9fafb"));
    localStorage.setItem("trilist_theme", theme);
  }, [theme]);

  useEffect(() => {
    // Coral lives in the stylesheet per theme; other picks override --accent inline.
    const root = document.documentElement;
    if (accentColor.toLowerCase() === DEFAULT_ACCENT) root.style.removeProperty("--accent");
    else root.style.setProperty("--accent", accentColor);
    localStorage.setItem("trilist_accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-sans", fontStack(font));
    localStorage.setItem("trilist_font", font);
  }, [font]);

  // ─── Clock: refresh ages + roll Done today at local midnight ──
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // ─── Toast ───────────────────────────────────
  const showToast = useCallback((message: string, undoLabel?: string, onUndo?: () => void) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, undoLabel, onUndo });
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  const holdToast = useCallback((hold: boolean) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    if (!hold) toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  // ─── DB initialisation & seed ────────────────
  useEffect(() => {
    initDB()
      .then(() => getAllTasks())
      .then(loaded => {
        if (loaded.length === 0) {
          const nowIso = new Date().toISOString();
          const sixDaysAgo = new Date(Date.now() - 6 * 86_400_000).toISOString();
          const seeds: Task[] = buildSeedTasks().map((s, i) => ({
            ...s,
            id: `seed-${i + 1}`,
            // One watch item arrives aged so the Watch age reads honestly.
            createdAt: s.text.startsWith("API response") ? sixDaysAgo : nowIso,
            updatedAt: nowIso,
          }));
          Promise.all(seeds.map(addTaskToDB)).then(() => setTasks(seeds));
        } else {
          // Migrate: stamp completion time on old done items, strip leaked
          // command tokens (e.g. "/later" left in titles by the old parser).
          const migrated = loaded.map(t => {
            let next = t;
            let dirty = false;
            if (next.done && next.list === "todo" && !next.completedAt) {
              next = { ...next, completedAt: next.updatedAt };
              dirty = true;
            }
            const stripped = parseOmnibarInput(next.text).cleanText || next.text;
            if (stripped !== next.text) {
              next = { ...next, text: stripped };
              dirty = true;
            }
            if (next.resolving) {
              next = { ...next, resolving: undefined };
              dirty = true;
            }
            if (dirty) updateTaskInDB(next).catch(console.error);
            return next;
          });
          setTasks(migrated);
        }
      })
      .catch(console.error);
  }, []);

  const switchTab = useCallback((tab: ListKey) => {
    setActiveTab(tab);
    setFocusedIdx(null);
    setActionMenuTaskId(null);
    setPriorityPopoverTaskId(null);
    setDoneExpanded(false);
  }, []);

  const pinnedCount = useMemo(
    () => tasks.filter(t => t.list === "todo" && t.pinned && !t.done).length,
    [tasks]
  );

  // ─── Task actions ────────────────────────────
  const addTask = useCallback((
    text: string,
    targetList?: ListKey,
    priority?: PriorityLevel,
    days?: number,
    opts?: { pin?: boolean }
  ) => {
    if (!text.trim()) return;
    const dest = targetList || activeTab;
    const nowIso = new Date().toISOString();
    const scheduledDate = days ? addDays(new Date(), days).toISOString() : undefined;

    let pinned = false;
    if (opts?.pin && dest === "todo") {
      if (pinnedCount < FOCUS_CAP) pinned = true;
      else showToast(`Focus holds ${FOCUS_CAP}. Unpin one first.`);
    }

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: text.trim(),
      list: dest,
      done: false,
      priority,
      scheduledDate,
      pinned: pinned || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setTasks(prev => [newTask, ...prev]);
    addTaskToDB(newTask).catch(console.error);

    // Stay on the current tab; confirm cross-list adds with an Undo toast.
    if (dest !== activeTab) {
      showToast(`Added to ${LIST_LABEL[dest]}`, "Undo", () => {
        setTasks(prev => prev.filter(t => t.id !== newTask.id));
        deleteTaskFromDB(newTask.id).catch(console.error);
      });
    }
  }, [activeTab, pinnedCount, showToast]);

  /** /did — log something useful straight into Done today. */
  const logDid = useCallback((text: string) => {
    if (!text.trim()) return;
    const nowIso = new Date().toISOString();
    const entry: Task = {
      id: `did-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: text.trim(),
      list: "todo",
      done: true,
      completedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setTasks(prev => [entry, ...prev]);
    addTaskToDB(entry).catch(console.error);
    showToast("Logged to Done today", "Undo", () => {
      setTasks(prev => prev.filter(t => t.id !== entry.id));
      deleteTaskFromDB(entry.id).catch(console.error);
    });
  }, [showToast]);

  const toggleTask = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    const target = tasks.find(t => t.id === id);
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = t.done
          ? { ...t, done: false, completedAt: undefined, updatedAt: nowIso }
          : { ...t, done: true, completedAt: nowIso, pinned: undefined, updatedAt: nowIso };
        updateTaskInDB(updated).catch(console.error);
        return updated;
      })
    );
    // Ticked Todo items sink into Done today — offer Undo.
    if (target && target.list === "todo" && !target.done) {
      showToast("Moved to Done today", "Undo", () => {
        const restored = { ...target, done: false, completedAt: undefined, updatedAt: new Date().toISOString() };
        setTasks(prev => prev.map(t => (t.id === id ? restored : t)));
        updateTaskInDB(restored).catch(console.error);
      });
    }
  }, [tasks, showToast]);

  const deleteTask = useCallback((id: string) => {
    const target = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteTaskFromDB(id).catch(console.error);
    setFocusedIdx(prev => (prev === null ? null : Math.max(0, prev - 1)));
    if (target) {
      showToast("Deleted", "Undo", () => {
        setTasks(prev => [target, ...prev]);
        addTaskToDB(target).catch(console.error);
      });
    }
  }, [tasks, showToast]);

  const resolveTask = useCallback((id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target || target.resolving) return;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, resolving: true } : t)));
    window.setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== id));
      deleteTaskFromDB(id).catch(console.error);
      setFocusedIdx(prev => (prev === null ? null : Math.max(0, prev - 1)));
    }, 300);
    showToast("Resolved", "Undo", () => {
      const restored = { ...target, resolving: undefined };
      setTasks(prev => [restored, ...prev.filter(t => t.id !== id)]);
      addTaskToDB(restored).catch(console.error);
    });
  }, [tasks, showToast]);

  const moveTask = useCallback((id: string, toList: ListKey) => {
    const target = tasks.find(t => t.id === id);
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, list: toList, updatedAt: new Date().toISOString() };
        updateTaskInDB(updated).catch(console.error);
        return updated;
      })
    );
    if (target && target.list !== toList) {
      const from = target.list;
      showToast(`Moved to ${LIST_LABEL[toList]}`, "Undo", () => {
        const restored = { ...target, list: from, updatedAt: new Date().toISOString() };
        setTasks(prev => prev.map(t => (t.id === id ? restored : t)));
        updateTaskInDB(restored).catch(console.error);
      });
    }
  }, [tasks, showToast]);

  const togglePin = useCallback((id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target || target.list !== "todo" || target.done) return;
    if (!target.pinned) {
      const count = tasks.filter(t => t.list === "todo" && t.pinned && !t.done).length;
      if (count >= FOCUS_CAP) {
        showToast(`Focus holds ${FOCUS_CAP}. Unpin one first.`);
        return;
      }
    }
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, pinned: t.pinned ? undefined : true as const, updatedAt: new Date().toISOString() };
        updateTaskInDB(updated).catch(console.error);
        return updated;
      })
    );
  }, [tasks, showToast]);

  const setTaskPriority = useCallback((id: string, priority?: PriorityLevel) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, priority, updatedAt: new Date().toISOString() };
        updateTaskInDB(updated).catch(console.error);
        return updated;
      })
    );
  }, []);

  const startEditing = useCallback((task: Task) => {
    setEditingId(task.id);
    setEditInput(task.text);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editInput.trim();
    if (trimmed) {
      setTasks(prev =>
        prev.map(t => {
          if (t.id !== editingId) return t;
          const updated = { ...t, text: trimmed, updatedAt: new Date().toISOString() };
          updateTaskInDB(updated).catch(console.error);
          return updated;
        })
      );
    }
    setEditingId(null);
  }, [editingId, editInput]);

  const cancelEdit = useCallback(() => setEditingId(null), []);

  // ─── Slash menu ──────────────────────────────
  const extracted = useMemo(() => parseOmnibarInput(input), [input]);

  const menuQuery = useMemo(() => {
    const last = input.split(" ").pop() ?? "";
    // A token that is already a recognised tag is shown as a chip, not a query.
    const { list, date, priority, pin, did } = extracted;
    const recognised = [list?.raw, date?.raw, priority?.raw, pin?.raw, did?.raw];
    return last.startsWith("/") && !recognised.includes(last) ? last.toLowerCase() : null;
  }, [input, extracted]);

  const menuOpen = menuQuery !== null && menuDismissedFor !== input;
  const setMenuOpen = useCallback((open: boolean) => {
    if (!open) setMenuDismissedFor(input);
  }, [input]);

  // Reset the highlighted command whenever the query changes.
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  if (menuQuery !== lastQuery) {
    setLastQuery(menuQuery);
    setSelIdx(0);
  }

  const visibleCmds = useMemo(() => {
    const q = menuQuery ?? "/";
    return ALL_CMDS.filter(c => q === "/" || c.cmd.startsWith(q) || c.alias.startsWith(q));
  }, [menuQuery]);

  const applyCommand = useCallback((cmd: Cmd) => {
    if (cmd.type === "view") {
      setShowHelp(true);
      setInput("");
      return;
    }

    const words = input.split(" ");
    words.pop();
    const family =
      cmd.type === "list" ? LIST_CMDS
      : cmd.type === "date" ? DATE_CMDS
      : cmd.type === "priority" ? PRIORITY_CMDS
      : ACTION_CMDS;
    // One tag per family: picking a new one replaces the old.
    const remaining = words
      .filter(w => !family.some(c => c.cmd === w.toLowerCase() || c.alias === w.toLowerCase()))
      .join(" ");
    setInput(remaining ? `${remaining} ${cmd.alias} ` : `${cmd.alias} `);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [input]);

  // ─── Rows in display order (Focus → sections → Done today) ──
  const visibleTasks = useMemo(() => {
    if (activeTab !== "todo") {
      const list = tasks.filter(t => t.list === activeTab);
      return list.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    }
    const sectionRank: Record<TodoSection | "focus" | "done", number> = {
      focus: 0, today: 1, week: 2, nextweek: 3, month: 4, done: 5,
    };
    const list = tasks.filter(t =>
      t.list === "todo" && (!t.done || (doneExpanded && isTodayLocal(t.completedAt, now)))
    );
    return list.sort((a, b) => {
      const sa = sectionOf(a, now);
      const sb = sectionOf(b, now);
      if (sa !== sb) return sectionRank[sa] - sectionRank[sb];
      return (a.priority || 99) - (b.priority || 99);
    });
  }, [tasks, activeTab, doneExpanded, now]);

  useKeyboardShortcuts({
    showHelp,
    setShowHelp,
    menuOpen,
    visibleTasks,
    focusedIdx,
    setFocusedIdx,
    activeTab,
    switchTab,
    toggleTask,
    deleteTask,
    resolveTask,
    togglePin,
    setActionMenuTaskId,
    setPriorityPopoverTaskId,
    inputRef,
    setInput,
  });

  const clearTag = useCallback((type: "list" | "date" | "priority" | "action") => {
    const { list, date, priority, pin, did } = parseOmnibarInput(input);
    const words = input.split(" ");
    let targets: (string | undefined)[];
    if (type === "list") targets = [list?.raw];
    else if (type === "date") targets = [date?.raw];
    else if (type === "priority") targets = [priority?.raw];
    else targets = [pin?.raw, did?.raw];

    const targetSet = new Set(targets.filter(Boolean));
    if (targetSet.size === 0) return;
    const filtered = words.filter(w => !targetSet.has(w)).join(" ");
    setInput(filtered ? `${filtered} ` : "");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [input]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const { list, date, priority, pin, did, cleanText } = parseOmnibarInput(input);

    // /did with no text logs nothing.
    if (did && !cleanText.trim()) {
      setInput("");
      return;
    }

    // /did <text> goes straight into Done today.
    if (did) {
      logDid(cleanText);
      setInput("");
      return;
    }

    // A bare list tag (/rg, /wt, /lt, /td) switches to that list.
    if (!cleanText.trim()) {
      if (list?.key) {
        switchTab(list.key);
        setInput("");
      }
      return;
    }

    addTask(cleanText, list?.key || activeTab, priority?.level, date?.days, { pin: !!pin });
    setInput("");
  }, [input, activeTab, addTask, logDid, switchTab]);

  const doneToday = useMemo(() => (
    tasks.filter(t => t.list === "todo" && t.done && isTodayLocal(t.completedAt, now))
  ), [tasks, now]);

  const counts = useMemo(() => ({
    rough: tasks.filter(t => t.list === "rough").length,
    todo:  tasks.filter(t => t.list === "todo" && !t.done).length,
    watch: tasks.filter(t => t.list === "watch").length,
    later: tasks.filter(t => t.list === "later").length,
  }), [tasks]);

  const placeholder = activeTab === "rough" ? "Jot something down…" : `Add to ${LIST_LABEL[activeTab]}…`;

  useEffect(() => {
    document.title = `${LIST_LABEL[activeTab]} · Trilist`;
  }, [activeTab]);

  // ─── Backup ──────────────────────────────────
  const handleExportData = useCallback(() => {
    exportAllDataJSON().then(jsonStr => {
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trilist-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup exported");
    });
  }, [showToast]);

  const handleImportData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (!content) return;
      // Snapshot first so an import that replaces everything can be undone.
      exportAllDataJSON()
        .then(snapshot =>
          importDataJSON(content)
            .then(getAllTasks)
            .then(loaded => {
              setTasks(loaded);
              showToast(`Imported ${loaded.length} items`, "Undo", () => {
                importDataJSON(snapshot).then(getAllTasks).then(setTasks).catch(console.error);
              });
            })
        )
        .catch(() => showToast("Unable to import. Choose a Trilist .json backup."));
    };
    reader.readAsText(file);
  }, [showToast]);

  const toggleActionMenu = useCallback((taskId: string) => {
    setActionMenuTaskId(prev => (prev === taskId ? null : taskId));
    setPriorityPopoverTaskId(null);
  }, []);
  const closeActionMenu = useCallback(() => setActionMenuTaskId(null), []);

  const togglePriorityPopover = useCallback((taskId: string) => {
    setPriorityPopoverTaskId(prev => (prev === taskId ? null : taskId));
    setActionMenuTaskId(null);
  }, []);
  const closePriorityPopover = useCallback(() => setPriorityPopoverTaskId(null), []);

  const toggleTheme = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);

  // ─── Render ──────────────────────────────────
  const showDone = activeTab === "todo" && doneToday.length > 0;
  const isEmpty = visibleTasks.length === 0 && !showDone;

  const doneToggle = (
    <button
      type="button"
      className="disclosure"
      aria-expanded={doneExpanded}
      aria-controls="done-list"
      onClick={() => setDoneExpanded(v => !v)}
    >
      <ChevronRight className="disclosure-icon" size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
      Done today
      <span className="count">{doneToday.length}</span>
    </button>
  );

  // Group the flat, ordered rows into labelled sections.
  type Group = { key: string; label?: string; rows: { task: Task; index: number }[] };
  const groups: Group[] = [];
  visibleTasks.forEach((task, index) => {
    const key = activeTab === "todo" ? sectionOf(task, now) : "all";
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: activeTab === "todo" ? SECTION_LABELS[key as TodoSection | "focus" | "done"] : undefined, rows: [] };
      groups.push(g);
    }
    g.rows.push({ task, index });
  });
  const activeGroups = groups.filter(g => g.key !== "done");
  const doneGroup = groups.find(g => g.key === "done");
  // A lone "Today" heading adds nothing; label sections only when there is more than one.
  const labelSections = activeTab === "todo" && activeGroups.length > 1;

  const renderRow = ({ task, index }: { task: Task; index: number }) => (
    <TaskRow
      key={task.id}
      task={task}
      index={index}
      activeTab={activeTab}
      focused={focusedIdx === index}
      setFocusedIdx={setFocusedIdx}
      isEditing={editingId === task.id}
      editInput={editInput}
      setEditInput={setEditInput}
      saveEdit={saveEdit}
      cancelEdit={cancelEdit}
      startEditing={startEditing}
      toggleTask={toggleTask}
      deleteTask={deleteTask}
      resolveTask={resolveTask}
      setTaskPriority={setTaskPriority}
      moveTask={moveTask}
      togglePin={togglePin}
      watchAge={task.list === "watch" ? ageLabel(task.createdAt, now.getTime()) : undefined}
      menuOpen={actionMenuTaskId === task.id}
      toggleActionMenu={toggleActionMenu}
      closeActionMenu={closeActionMenu}
      priorityOpen={priorityPopoverTaskId === task.id}
      togglePriorityPopover={togglePriorityPopover}
      closePriorityPopover={closePriorityPopover}
    />
  );

  return (
    <div className="app">
      <a className="skip-link" href="#list-panel">Skip to list</a>
      <Header
        activeTab={activeTab}
        switchTab={switchTab}
        counts={counts}
        theme={theme}
        toggleTheme={toggleTheme}
        openHelp={() => setShowHelp(true)}
      />

      <main
        id="list-panel"
        className="list-panel"
        role={activeTab === "rough" ? "region" : "tabpanel"}
        aria-labelledby={activeTab === "rough" ? undefined : `tab-${activeTab}`}
        aria-label={activeTab === "rough" ? "Rough" : undefined}
        tabIndex={-1}
      >
        {activeTab === "rough" && (
          <div className="view-intro">
            <h1 className="view-title">Rough</h1>
            <p className="view-sub">Scratch notes. Send one on with <code translate="no">/td</code>, <code translate="no">/wt</code> or <code translate="no">/lt</code>.</p>
          </div>
        )}
        {activeTab !== "rough" && <h1 className="sr-only">{LIST_LABEL[activeTab]}</h1>}

        {isEmpty ? (
          <motion.div
            className="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="empty-title">{EMPTY_STATES[activeTab].title}</p>
            <p className="empty-hint">
              <code translate="no">{EMPTY_STATES[activeTab].cmd}</code> {EMPTY_STATES[activeTab].hint}
            </p>
          </motion.div>
        ) : (
          <>
            {activeGroups.map(g => (
              <section key={g.key} className="section" aria-label={labelSections ? g.label : undefined}>
                {labelSections && (
                  <h2 className="section-label">
                    {g.label}
                    {g.key === "focus" && <span className="count">{g.rows.length}/{FOCUS_CAP}</span>}
                  </h2>
                )}
                <ul className="rows">{g.rows.map(renderRow)}</ul>
              </section>
            ))}

            {showDone && (
              <section className="section section-done">
                <h2 className="section-label section-label-control">{doneToggle}</h2>
                <AnimatePresence initial={false}>
                  {doneExpanded && doneGroup && (
                    <motion.ul
                      id="done-list"
                      className="rows"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {doneGroup.rows.map(renderRow)}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </section>
            )}
          </>
        )}
      </main>

      <Omnibar
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        inputRef={inputRef}
        placeholder={placeholder}
        extracted={extracted}
        clearTag={clearTag}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        visibleCmds={visibleCmds}
        selIdx={selIdx}
        setSelIdx={setSelIdx}
        applyCommand={applyCommand}
      />

      <Toast toast={toast} onDismiss={dismissToast} onHold={holdToast} />

      <HelpDialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        theme={theme}
        setTheme={setTheme}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        font={font}
        setFont={setFont}
        onExport={handleExportData}
        onImport={handleImportData}
      />
    </div>
  );
}
