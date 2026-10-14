import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import type { Task, ListKey, PriorityLevel, Cmd, ExtractedInfo } from "./types";
import { ageLabel, isTodayLocal, todoSection } from "./types";
import type { TodoSection } from "./types";
import { Header } from "./components/Header";
import { TaskRow } from "./components/TaskRow";
import { Omnibar } from "./components/Omnibar";
import { HelpModal } from "./components/HelpModal";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// ─── Customization Options ──────────────────────
const ACCENT_SWATCHES = [
  { name: "Coral",   color: "#e8542f" },
  { name: "Purple",  color: "#a855f7" },
  { name: "Blue",    color: "#2997ff" },
  { name: "Emerald", color: "#22c55e" },
  { name: "Gold",    color: "#f59e0b" },
];

const FONT_OPTIONS = [
  { label: "Geist (Sans)",  value: '"Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { label: "Mono",          value: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
  { label: "Inter (Tight)", value: '"Inter Tight", -apple-system, BlinkMacSystemFont, sans-serif' },
  { label: "Newsreader",    value: '"Newsreader", Georgia, serif' },
];

// ─── Command Definitions ────────────────────────
const LIST_CMDS: Cmd[] = [
  { cmd: "/rough", alias: "/rg", desc: "Rough",  type: "list", target: "rough" },
  { cmd: "/todo",  alias: "/td", desc: "Todo",   type: "list", target: "todo"  },
  { cmd: "/watch", alias: "/wt", desc: "Watch",  type: "list", target: "watch" },
  { cmd: "/later", alias: "/lt", desc: "Later",  type: "list", target: "later" },
];

const DATE_CMDS: Cmd[] = [
  { cmd: "/week",     alias: "/wk", desc: "This week",  type: "date", days: 7  },
  { cmd: "/nextweek", alias: "/nw", desc: "Next week",  type: "date", days: 14 },
  { cmd: "/month",    alias: "/mn", desc: "This month", type: "date", days: 30 },
];

const PRIORITY_CMDS: Cmd[] = [
  { cmd: "/p1", alias: "/high", desc: "P1 — High",   type: "priority", priority: 1 },
  { cmd: "/p2", alias: "/med",  desc: "P2 — Medium", type: "priority", priority: 2 },
  { cmd: "/p3", alias: "/low",  desc: "P3 — Low",    type: "priority", priority: 3 },
];

const ACTION_CMDS: Cmd[] = [
  { cmd: "/pin", alias: "/pin", desc: "Pin to Focus",       type: "action", action: "pin" },
  { cmd: "/did", alias: "/did", desc: "Log to Done today",  type: "action", action: "did" },
];

const SYS_CMDS: Cmd[] = [
  { cmd: "/help", alias: "/h", desc: "Help & Shortcuts", type: "view" },
];

const ALL_CMDS: Cmd[] = [...LIST_CMDS, ...DATE_CMDS, ...PRIORITY_CMDS, ...ACTION_CMDS, ...SYS_CMDS];

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
const SEED_TASKS: Omit<Task, "id" | "createdAt" | "updatedAt">[] = [
  { text: "Read Andreessen's productivity essay", list: "todo",  done: false, priority: 1 },
  { text: "Set up project repo & dependencies",  list: "todo",  done: true  },
  { text: "Design 3x5 index card theme",          list: "todo",  done: false, priority: 2 },
  { text: "API response from vendor team",         list: "watch", done: false },
  { text: "Design review feedback",               list: "watch", done: false, priority: 3 },
  { text: "Explore IndexedDB backup options",     list: "later", done: false },
  { text: "Draft initial component hierarchy",    list: "rough", done: false },
];

// Empty State Info
const EMPTY_STATES: Record<ListKey, { title: string; hint: string }> = {
  rough: { title: "Scratchpad is empty",       hint: "Type anything below, or try /td to send it to Todo." },
  todo:  { title: "Nothing to do",             hint: "Type a task below, or /did to log a win." },
  watch: { title: "Nothing on your radar",     hint: "Add what you're waiting on with /wt." },
  later: { title: "No deferred tasks",         hint: "Defer something with /lt, /nw or /mn." },
};

function parseOmnibarInput(input: string): ExtractedInfo {
  let listMatch: ExtractedInfo["list"];
  let dateMatch: ExtractedInfo["date"];
  let priorityMatch: ExtractedInfo["priority"];
  let pinMatch: ExtractedInfo["pin"];
  let didMatch: ExtractedInfo["did"];

  const words = input.split(" ");
  const cleanWords: string[] = [];

  for (const w of words) {
    const lower = w.toLowerCase();
    const lCmd = LIST_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (lCmd && lCmd.target && !listMatch) {
      listMatch = { raw: w, key: lCmd.target, label: lCmd.desc };
      continue;
    }

    const dCmd = DATE_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (dCmd && dCmd.days && !dateMatch) {
      dateMatch = { raw: w, label: dCmd.desc, days: dCmd.days };
      continue;
    }

    const pCmd = PRIORITY_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (pCmd && pCmd.priority && !priorityMatch) {
      priorityMatch = { raw: w, level: pCmd.priority, label: pCmd.desc };
      continue;
    }

    const aCmd = ACTION_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (aCmd) {
      if (aCmd.action === "pin" && !pinMatch) { pinMatch = { raw: w }; continue; }
      if (aCmd.action === "did" && !didMatch) { didMatch = { raw: w }; continue; }
    }

    // Strip every remaining slash token so no command text ever lands in a title.
    if (w.startsWith("/") && w.length > 1) continue;

    cleanWords.push(w);
  }

  return {
    list: listMatch,
    date: dateMatch,
    priority: priorityMatch,
    pin: pinMatch,
    did: didMatch,
    cleanText: cleanWords.join(" "),
  };
}

/** Section key used to order + label Todo rows. */
function sectionOf(task: Task, now: Date): TodoSection | "focus" | "done" {
  if (task.done && isTodayLocal(task.completedAt, now)) return "done";
  if (task.pinned && !task.done) return "focus";
  return todoSection(task.scheduledDate, now);
}

interface Toast {
  id: number;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<ListKey>("todo");
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [selIdx, setSelIdx] = useState(0);

  // Focus & Selection Navigation
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");

  // Done-today expansion + clock (watch ages, midnight reset)
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Toast with Undo
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Theme & Preferences (light mode default)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("trilist_theme") as "dark" | "light") || "light";
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem("trilist_accent") || "#e8542f";
  });
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    return localStorage.getItem("trilist_font") || FONT_OPTIONS[0].value;
  });

  // Overlays & Popovers
  const [showHelp, setShowHelp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [actionMenuTaskId, setActionMenuTaskId] = useState<string | null>(null);
  const [priorityPopoverTaskId, setPriorityPopoverTaskId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Theme Sync ──────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("trilist_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
    document.documentElement.style.setProperty("--accent-bg", `${accentColor}1f`);
    localStorage.setItem("trilist_accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-sans", selectedFont);
    localStorage.setItem("trilist_font", selectedFont);
  }, [selectedFont]);

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

  const dismissToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  // ─── DB Initialization & Seed ────────────────
  useEffect(() => {
    initDB()
      .then(() => getAllTasks())
      .then(loaded => {
        if (loaded.length === 0) {
          const nowIso = new Date().toISOString();
          const seeds: Task[] = SEED_TASKS.map((s, i) => ({
            ...s,
            id: `seed-${i + 1}`,
            createdAt: nowIso,
            updatedAt: nowIso,
          }));
          Promise.all(seeds.map(addTaskToDB)).then(() => setTasks(seeds));
          setShowOnboarding(true);
        } else {
          // Migrate: stamp completion time on old done items, strip leaked
          // command tokens (e.g. "/later" left in titles by the old parser).
          let dirty = false;
          const migrated = loaded.map(t => {
            let next = t;
            if (next.done && (next.list === "todo") && !next.completedAt) {
              next = { ...next, completedAt: next.updatedAt };
              dirty = true;
            }
            const stripped = parseOmnibarInput(next.text).cleanText || next.text;
            if (stripped !== next.text) {
              next = { ...next, text: stripped };
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

  // Reset focus on tab switch
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

  // ─── Task Actions ────────────────────────────
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
    let scheduledDate: string | undefined;

    if (days) {
      scheduledDate = addDays(new Date(), days).toISOString();
    }

    let pinned = false;
    if (opts?.pin && dest === "todo") {
      if (pinnedCount < FOCUS_CAP) {
        pinned = true;
      } else {
        showToast(`Focus holds ${FOCUS_CAP}`);
      }
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
      const label = dest === "todo" ? "Todo" : dest === "watch" ? "Watch" : dest === "later" ? "Later" : "Rough";
      showToast(`Added to ${label}`, "Undo", () => {
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
      showToast("Done — moved to Done today", "Undo", () => {
        setTasks(prev =>
          prev.map(t => (t.id === id
            ? { ...t, done: false, completedAt: undefined, updatedAt: new Date().toISOString() }
            : t))
        );
        updateTaskInDB({ ...target, done: false, completedAt: undefined, updatedAt: new Date().toISOString() }).catch(console.error);
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
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, resolving: true } : t))
    );
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== id));
      deleteTaskFromDB(id).catch(console.error);
      setFocusedIdx(prev => (prev === null ? null : Math.max(0, prev - 1)));
    }, 450);
  }, []);

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
      const label = toList === "todo" ? "Todo" : toList === "watch" ? "Watch" : toList === "later" ? "Later" : "Rough";
      const from = target.list;
      showToast(`Moved to ${label}`, "Undo", () => {
        setTasks(prev =>
          prev.map(t => (t.id === id ? { ...t, list: from, updatedAt: new Date().toISOString() } : t))
        );
        updateTaskInDB({ ...target, list: from, updatedAt: new Date().toISOString() }).catch(console.error);
      });
    }
  }, [tasks, showToast]);

  const togglePin = useCallback((id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target || target.list !== "todo" || target.done) return;
    if (!target.pinned) {
      const count = tasks.filter(t => t.list === "todo" && t.pinned && !t.done).length;
      if (count >= FOCUS_CAP) {
        showToast(`Focus holds ${FOCUS_CAP}`);
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

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // ─── Autocomplete ────────────────────────────
  useEffect(() => {
    const words = input.split(" ");
    const last  = words[words.length - 1];
    if (last.startsWith("/") && last.length >= 1) {
      setMenuQuery(last.toLowerCase());
      setMenuOpen(true);
      setSelIdx(0);
    } else {
      setMenuOpen(false);
    }
  }, [input]);

  const extracted = useMemo(() => parseOmnibarInput(input), [input]);

  const { visibleCmds, enabledCmds, disabledSet } = useMemo(() => {
    const q = menuQuery;
    const visible = ALL_CMDS.filter(c =>
      q === "/" || c.cmd.startsWith(q) || c.alias.startsWith(q)
    );
    // Date tags now work on every list, including Todo.
    const disabled = new Set<string>();
    const enabled = visible.filter(c => !disabled.has(c.cmd));
    return { visibleCmds: visible, enabledCmds: enabled, disabledSet: disabled };
  }, [menuQuery]);

  const applyCommand = useCallback((cmd: Cmd) => {
    if (disabledSet.has(cmd.cmd)) return;

    if (cmd.type === "view") {
      setShowHelp(true);
      setInput("");
      setMenuOpen(false);
      return;
    }

    const words = input.split(" ");
    words.pop();
    const prefix = words.join(" ");

    if (cmd.type === "list" && cmd.target) {
      const remaining = words.filter(w => !LIST_CMDS.some(lc => lc.cmd === w.toLowerCase() || lc.alias === w.toLowerCase())).join(" ");
      setInput(remaining ? `${remaining} ${cmd.alias} ` : `${cmd.alias} `);
    } else if (cmd.type === "date") {
      const remaining = words.filter(w => !DATE_CMDS.some(dc => dc.cmd === w.toLowerCase() || dc.alias === w.toLowerCase())).join(" ");
      setInput(remaining ? `${remaining} ${cmd.alias} ` : `${cmd.alias} `);
    } else if (cmd.type === "priority") {
      const remaining = words.filter(w => !PRIORITY_CMDS.some(pc => pc.cmd === w.toLowerCase() || pc.alias === w.toLowerCase())).join(" ");
      setInput(remaining ? `${remaining} ${cmd.alias} ` : `${cmd.alias} `);
    } else if (cmd.type === "action") {
      const remaining = words.filter(w => !ACTION_CMDS.some(ac => ac.cmd === w.toLowerCase() || ac.alias === w.toLowerCase())).join(" ");
      setInput(remaining ? `${remaining} ${cmd.alias} ` : `${cmd.alias} `);
    } else {
      setInput(prefix ? `${prefix} ${cmd.alias} ` : `${cmd.alias} `);
    }

    setMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [disabledSet, input]);

  // ─── Keyboard Shortcuts Hook ────────────────
  // Visible rows in display order (Focus → sections → Done today).
  const visibleTasks = useMemo(() => {
    if (activeTab !== "todo") {
      const list = tasks.filter(t => t.list === activeTab);
      return list.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    }
    // Active Todo rows: pinned Focus first, then quiet timeframe sections.
    // Ticked items leave this list for Done today.
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
    showOnboarding,
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
      setMenuOpen(false);
      return;
    }

    // /did <text> goes straight into Done today.
    if (did) {
      logDid(cleanText);
      setInput("");
      setMenuOpen(false);
      return;
    }

    // If no task text was typed but a list tag shortcut was specified (e.g. /rg, /wt, /lt, /td),
    // switch active tab to that list!
    if (!cleanText.trim()) {
      if (list?.key) {
        switchTab(list.key);
        setInput("");
        setMenuOpen(false);
      }
      return;
    }

    const targetList = list?.key || activeTab;
    const days = date?.days;
    const p = priority?.level;

    addTask(cleanText, targetList, p, days, { pin: !!pin });
    setInput("");
    setMenuOpen(false);
  }, [input, activeTab, addTask, logDid, switchTab]);

  // Filter counts (visibleTasks is declared above, next to the shortcuts hook)
  const doneToday = useMemo(() => (
    tasks.filter(t => t.list === "todo" && t.done && isTodayLocal(t.completedAt, now))
  ), [tasks, now]);

  const counts = useMemo(() => ({
    rough: tasks.filter(t => t.list === "rough").length,
    todo:  tasks.filter(t => t.list === "todo" && !t.done).length,
    watch: tasks.filter(t => t.list === "watch").length,
    later: tasks.filter(t => t.list === "later").length,
  }), [tasks]);

  const omnibarPlaceholder = useMemo(() => {
    switch (activeTab) {
      case "todo":  return "Add to Todo… try /pin, /nw, /did";
      case "watch": return "Something you are watching…";
      case "later": return "Something to revisit later… try /nw, /mn";
      case "rough": return "Quick rough note… (type /td to send to todo)";
    }
  }, [activeTab]);

  // Data Export & Import (done history stays in the DB, so exports keep it)
  const handleExportData = useCallback(() => {
    exportAllDataJSON().then(jsonStr => {
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trilist-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  const handleImportData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        importDataJSON(content)
          .then(getAllTasks)
          .then(setTasks)
          .then(() => alert("Data imported successfully!"))
          .catch(err => alert(`Import failed: ${err.message}`));
      }
    };
    reader.readAsText(file);
  }, []);

  const toggleActionMenu = useCallback((taskId: string) => {
    setActionMenuTaskId(prev => (prev === taskId ? null : taskId));
    setPriorityPopoverTaskId(null);
  }, []);

  const togglePriorityPopover = useCallback((taskId: string) => {
    setPriorityPopoverTaskId(prev => (prev === taskId ? null : taskId));
    setActionMenuTaskId(null);
  }, []);

  let lastSection: string | null = null;

  return (
    <div className="page">
      <div className="window">
        <Header
          activeTab={activeTab}
          switchTab={switchTab}
          counts={counts}
          theme={theme}
          setTheme={setTheme}
          setShowHelp={setShowHelp}
        />

        <main className="content">
          {visibleTasks.length === 0 && doneToday.length === 0 ? (
            <motion.div
              className="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="empty-title">{EMPTY_STATES[activeTab].title}</p>
              <p className="empty-hint">{EMPTY_STATES[activeTab].hint}</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {visibleTasks.map((task, index) => {
                const isEditing = editingId === task.id;
                const isNearBottom = index >= visibleTasks.length - 2 && index >= 2;
                const section = activeTab === "todo" ? sectionOf(task, now) : null;
                const showLabel = section !== null && section !== lastSection;
                lastSection = section ?? lastSection;
                return (
                  <React.Fragment key={task.id}>
                    {showLabel && section && (
                      <p className="section-label">{SECTION_LABELS[section]}</p>
                    )}
                    <TaskRow
                      task={task}
                      index={index}
                      activeTab={activeTab}
                      focusedIdx={focusedIdx}
                      setFocusedIdx={setFocusedIdx}
                      isEditing={isEditing}
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
                      nowMs={now.getTime()}
                      watchAge={task.list === "watch" ? ageLabel(task.createdAt, now.getTime()) : undefined}
                      actionMenuTaskId={actionMenuTaskId}
                      toggleActionMenu={toggleActionMenu}
                      setActionMenuTaskId={setActionMenuTaskId}
                      priorityPopoverTaskId={priorityPopoverTaskId}
                      togglePriorityPopover={togglePriorityPopover}
                      setPriorityPopoverTaskId={setPriorityPopoverTaskId}
                      isNearBottom={isNearBottom}
                    />
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          )}

          {activeTab === "todo" && doneToday.length > 0 && (
            <div className="done-today">
              <button
                type="button"
                className="done-toggle"
                aria-expanded={doneExpanded}
                onClick={() => setDoneExpanded(v => !v)}
              >
                ✓ Done today ({doneToday.length})
              </button>
            </div>
          )}
        </main>

        <Omnibar
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          inputRef={inputRef}
          placeholder={omnibarPlaceholder}
          extractedList={extracted.list}
          extractedDate={extracted.date}
          extractedPriority={extracted.priority}
          extractedPin={extracted.pin}
          extractedDid={extracted.did}
          clearTag={clearTag}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          visibleCmds={visibleCmds}
          enabledCmds={enabledCmds}
          disabledSet={disabledSet}
          selIdx={selIdx}
          setSelIdx={setSelIdx}
          applyCommand={applyCommand}
        />

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className="toast"
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <span className="toast-msg">{toast.message}</span>
              {toast.onUndo && (
                <button
                  type="button"
                  className="toast-undo"
                  onClick={() => { toast.onUndo?.(); dismissToast(); }}
                >
                  {toast.undoLabel ?? "Undo"}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <HelpModal
          showHelp={showHelp}
          setShowHelp={setShowHelp}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          selectedFont={selectedFont}
          setSelectedFont={setSelectedFont}
          accentSwatches={ACCENT_SWATCHES}
          fontOptions={FONT_OPTIONS}
          priorityCmds={PRIORITY_CMDS}
          listCmds={LIST_CMDS}
          dateCmds={DATE_CMDS}
          actionCmds={ACTION_CMDS}
          handleExportData={handleExportData}
          handleImportData={handleImportData}
        />
      </div>
    </div>
  );
}
