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
import { Header } from "./components/Header";
import { TaskRow } from "./components/TaskRow";
import { Omnibar } from "./components/Omnibar";
import { HelpModal } from "./components/HelpModal";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// ─── Customization Options ──────────────────────
const ACCENT_SWATCHES = [
  { name: "Coral",   color: "#ff6b4a" },
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
  { cmd: "/week",  alias: "/wk", desc: "This week",  type: "date", days: 7  },
  { cmd: "/month", alias: "/mn", desc: "This month", type: "date", days: 30 },
];

const PRIORITY_CMDS: Cmd[] = [
  { cmd: "/p1", alias: "/high", desc: "P1 — High",   type: "priority", priority: 1 },
  { cmd: "/p2", alias: "/med",  desc: "P2 — Medium", type: "priority", priority: 2 },
  { cmd: "/p3", alias: "/low",  desc: "P3 — Low",    type: "priority", priority: 3 },
];

const SYS_CMDS: Cmd[] = [
  { cmd: "/help", alias: "/h", desc: "Help & Shortcuts", type: "view" },
];

const ALL_CMDS: Cmd[] = [...LIST_CMDS, ...DATE_CMDS, ...PRIORITY_CMDS, ...SYS_CMDS];

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
  rough: { title: "Scratchpad is empty",       hint: "Type anything in the input bar below to capture raw notes." },
  todo:  { title: "No active commitments",     hint: "Type a task below to commit for today." },
  watch: { title: "Nothing on your radar",     hint: "Add items you're waiting on using /watch or /wt." },
  later: { title: "No deferred tasks",         hint: "Defer future commitments using /later or /lt." },
};

function parseOmnibarInput(input: string): ExtractedInfo {
  let listMatch: ExtractedInfo["list"];
  let dateMatch: ExtractedInfo["date"];
  let priorityMatch: ExtractedInfo["priority"];

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

    cleanWords.push(w);
  }

  return {
    list: listMatch,
    date: dateMatch,
    priority: priorityMatch,
    cleanText: cleanWords.join(" "),
  };
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

  // Theme & Preferences
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("trilist_theme") as "dark" | "light") || "dark";
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem("trilist_accent") || "#ff6b4a";
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
    document.documentElement.style.setProperty(
      "--accent-bg",
      accentColor === "#ff6b4a" ? "rgba(255, 107, 74, 0.15)" : `${accentColor}22`
    );
    localStorage.setItem("trilist_accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-sans", selectedFont);
    localStorage.setItem("trilist_font", selectedFont);
  }, [selectedFont]);

  // ─── DB Initialization & Seed ────────────────
  useEffect(() => {
    initDB()
      .then(() => getAllTasks())
      .then(loaded => {
        if (loaded.length === 0) {
          const now = new Date().toISOString();
          const seeds: Task[] = SEED_TASKS.map((s, i) => ({
            ...s,
            id: `seed-${i + 1}`,
            createdAt: now,
            updatedAt: now,
          }));
          Promise.all(seeds.map(addTaskToDB)).then(() => setTasks(seeds));
          setShowOnboarding(true);
        } else {
          setTasks(loaded);
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
  }, []);

  // ─── Task Actions ────────────────────────────
  const addTask = useCallback((
    text: string,
    targetList?: ListKey,
    priority?: PriorityLevel,
    days?: number
  ) => {
    if (!text.trim()) return;
    const dest = targetList || activeTab;
    const now = new Date().toISOString();
    let scheduledDate: string | undefined;

    if (days) {
      scheduledDate = addDays(new Date(), days).toISOString();
    }

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: text.trim(),
      list: dest,
      done: false,
      priority,
      scheduledDate,
      createdAt: now,
      updatedAt: now,
    };

    setTasks(prev => [newTask, ...prev]);
    addTaskToDB(newTask).catch(console.error);

    if (dest !== activeTab) {
      switchTab(dest);
    }
  }, [activeTab, switchTab]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, done: !t.done, updatedAt: new Date().toISOString() };
        updateTaskInDB(updated).catch(console.error);
        return updated;
      })
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteTaskFromDB(id).catch(console.error);
  }, []);

  const resolveTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, resolving: true } : t))
    );
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== id));
      deleteTaskFromDB(id).catch(console.error);
    }, 450);
  }, []);

  const moveTask = useCallback((id: string, toList: ListKey) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, list: toList, updatedAt: new Date().toISOString() };
        updateTaskInDB(updated).catch(console.error);
        return updated;
      })
    );
  }, []);

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

  const cycleTaskPriority = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nextP: PriorityLevel | undefined =
          t.priority === 1 ? 2 : t.priority === 2 ? 3 : t.priority === 3 ? undefined : 1;
        const updated = { ...t, priority: nextP, updatedAt: new Date().toISOString() };
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
  const extractedList = extracted.list;

  const { visibleCmds, enabledCmds, disabledSet } = useMemo(() => {
    const q = menuQuery;
    const visible = ALL_CMDS.filter(c =>
      q === "/" || c.cmd.startsWith(q) || c.alias.startsWith(q)
    );
    const disabled = new Set<string>();
    const isWatchOrLater = extractedList
      ? (extractedList.key === "later" || extractedList.key === "watch")
      : (activeTab === "later" || activeTab === "watch");

    visible.forEach(c => {
      if (c.type === "date" && !isWatchOrLater) {
        disabled.add(c.cmd);
      }
    });
    const enabled = visible.filter(c => !disabled.has(c.cmd));
    return { visibleCmds: visible, enabledCmds: enabled, disabledSet: disabled };
  }, [menuQuery, extractedList, activeTab]);

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
    } else {
      setInput(prefix ? `${prefix} ${cmd.alias} ` : `${cmd.alias} `);
    }

    setMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [disabledSet, input]);

  // ─── Keyboard Shortcuts Hook ────────────────
  useKeyboardShortcuts({
    showHelp,
    setShowHelp,
    menuOpen,
    showOnboarding,
    visibleTasks: useMemo(() => {
      const list = tasks.filter(t => t.list === activeTab);
      return list.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    }, [tasks, activeTab]),
    focusedIdx,
    setFocusedIdx,
    activeTab,
    switchTab,
    toggleTask,
    deleteTask,
    resolveTask,
    cycleTaskPriority,
    setTaskPriority,
    setActionMenuTaskId,
    setPriorityPopoverTaskId,
    inputRef,
    setInput,
  });

  const clearTag = useCallback((type: "list" | "date" | "priority") => {
    const { list, date, priority } = parseOmnibarInput(input);
    const words = input.split(" ");
    const targetRaw = type === "list" ? list?.raw : type === "date" ? date?.raw : priority?.raw;

    if (!targetRaw) return;
    const filtered = words.filter(w => w !== targetRaw).join(" ");
    setInput(filtered ? `${filtered} ` : "");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [input]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const { list, date, priority, cleanText } = parseOmnibarInput(input);
    if (!cleanText.trim()) return;

    const targetList = list?.key || activeTab;
    const days = date?.days;
    const p = priority?.level;

    addTask(cleanText, targetList, p, days);
    setInput("");
    setMenuOpen(false);
  }, [input, activeTab, addTask]);

  // Filter tasks & counts
  const visibleTasks = useMemo(() => {
    const list = tasks.filter(t => t.list === activeTab);
    return list.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [tasks, activeTab]);

  const counts = useMemo(() => ({
    rough: tasks.filter(t => t.list === "rough").length,
    todo:  tasks.filter(t => t.list === "todo" && !t.done).length,
    watch: tasks.filter(t => t.list === "watch").length,
    later: tasks.filter(t => t.list === "later").length,
  }), [tasks]);

  const omnibarPlaceholder = useMemo(() => {
    switch (activeTab) {
      case "todo":  return "Add to Todo... (or use /wt, /lt, /rg)";
      case "watch": return "Something you are watching... (or use /td, /lt)";
      case "later": return "Something to revisit later... (e.g. /wk, /mn)";
      case "rough": return "Quick rough note... (type /td to send to todo)";
    }
  }, [activeTab]);

  // Data Export & Import
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
          {visibleTasks.length === 0 ? (
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
                const isNearBottom = index >= visibleTasks.length - 3;
                return (
                  <TaskRow
                    key={task.id}
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
                    actionMenuTaskId={actionMenuTaskId}
                    toggleActionMenu={toggleActionMenu}
                    setActionMenuTaskId={setActionMenuTaskId}
                    priorityPopoverTaskId={priorityPopoverTaskId}
                    togglePriorityPopover={togglePriorityPopover}
                    setPriorityPopoverTaskId={setPriorityPopoverTaskId}
                    isNearBottom={isNearBottom}
                  />
                );
              })}
            </AnimatePresence>
          )}

          <Omnibar
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            inputRef={inputRef}
            placeholder={omnibarPlaceholder}
            extractedList={extracted.list}
            extractedDate={extracted.date}
            extractedPriority={extracted.priority}
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
        </main>
      </div>

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
        handleExportData={handleExportData}
        handleImportData={handleImportData}
      />
    </div>
  );
}
