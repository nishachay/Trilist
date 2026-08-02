import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Monitor, CheckSquare2, Eye, Clock, Pencil, Download, Upload, Sparkles, Command, Zap, ArrowRight, Trash2, Check, X, ChevronDown } from "lucide-react";

import { getStoredTasks, saveStoredTasks, getStoredSetting, saveStoredSetting } from "./lib/db";

// ─── Types ──────────────────────────────────────
type ListKey = "rough" | "todo" | "watch" | "later";
type Theme   = "system" | "light" | "dark";

type Task = {
  id:         string;
  text:       string;
  list:       ListKey;
  done:       boolean;
  resolving?: boolean;
  createdAt:  number;
  dueAt?:     number;
};

type CmdType = "list" | "date" | "view";

type Cmd = {
  cmd:     string;
  alias:   string;
  desc:    string;
  type:    CmdType;
  target?: ListKey;
  days?:   number;
};

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

const SYS_CMDS: Cmd[] = [
  { cmd: "/help", alias: "/h", desc: "Help & Shortcuts", type: "view" },
];

const ALL_CMDS: Cmd[] = [...LIST_CMDS, ...DATE_CMDS, ...SYS_CMDS];

// ─── The 3 main lists (Rough is separate)
const MAIN_TABS: { id: ListKey; label: string }[] = [
  { id: "todo",  label: "Todo"  },
  { id: "watch", label: "Watch" },
  { id: "later", label: "Later" },
];

const PLACEHOLDERS: Record<ListKey, string> = {
  rough: "Capture anything: idea, note, thought...",
  todo:  "What are you committing to today?",
  watch: "What are you keeping an eye on?",
  later: "Something to revisit later...",
};

const EMPTY: Record<ListKey, { title: string; hint: string }> = {
  rough: { title: "Nothing captured.",    hint: "Type anything and press Enter" },
  todo:  { title: "Nothing committed.",   hint: "Type task and press Enter" },
  watch: { title: "Nothing on radar.",    hint: "/wt to track or Resolved to close" },
  later: { title: "The future is clear.", hint: "/lt to defer or /lt /wk for a week" },
};

function daysUntil(ts: number) {
  return Math.max(0, Math.round((ts - Date.now()) / 86400000));
}

function timeAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── App ────────────────────────────────────────
export default function App() {
  const [tasks,          setTasks]          = useState<Task[]>([]);
  const [activeTab,      setActiveTab]      = useState<ListKey>("todo");
  const [theme,          setTheme]          = useState<Theme>("system");
  const [accentColor,    setAccentColor]    = useState<string>("#ff6b4a");
  const [fontFamily,     setFontFamily]     = useState<string>(FONT_OPTIONS[0].value);
  const [showHelp,       setShowHelp]       = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep,    setOnboardStep]    = useState(1);
  const [isLoaded,       setIsLoaded]       = useState(false);
  const [focusedIdx,     setFocusedIdx]     = useState<number | null>(null);

  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editText,       setEditText]       = useState<string>("");
  const [moveMenuTaskId, setMoveMenuTaskId] = useState<string | null>(null);

  const [input,         setInput]         = useState("");
  const [extractedList, setExtractedList] = useState<{ key: ListKey; label: string } | null>(null);
  const [extractedDate, setExtractedDate] = useState<{ days: number; label: string } | null>(null);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [menuQuery,     setMenuQuery]     = useState("");
  const [selIdx,        setSelIdx]        = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── IndexedDB Storage Persistence ──────────
  useEffect(() => {
    async function loadData() {
      const savedTasks = await getStoredTasks<Task>();
      if (savedTasks) {
        const cleanTasks = savedTasks.filter(t =>
          !t.id.startsWith("d") &&
          !t.text.toLowerCase().includes("onboarding flow") &&
          !t.text.toLowerCase().includes("investor deck") &&
          !t.text.toLowerCase().includes("competitor x") &&
          !t.text.toLowerCase().includes("infrastructure providers") &&
          !t.text.toLowerCase().includes("strategy document")
        );
        setTasks(cleanTasks);
        if (cleanTasks.length !== savedTasks.length) {
          await saveStoredTasks(cleanTasks);
        }
      }

      const savedTheme = await getStoredSetting<Theme>("theme");
      if (savedTheme) setTheme(savedTheme);

      const savedAccent = await getStoredSetting<string>("accentColor");
      if (savedAccent) setAccentColor(savedAccent);

      const savedFont = await getStoredSetting<string>("fontFamily");
      if (savedFont) setFontFamily(savedFont);

      const hasOnboarded = await getStoredSetting<boolean>("onboarded");
      if (!hasOnboarded) setShowOnboarding(true);

      setIsLoaded(true);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveStoredTasks(tasks);
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveStoredSetting("theme", theme);
  }, [theme, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveStoredSetting("accentColor", accentColor);
  }, [accentColor, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveStoredSetting("fontFamily", fontFamily);
  }, [fontFamily, isLoaded]);

  // Apply Root CSS Customizations
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", accentColor);
    root.style.setProperty("--accent-bg", `${accentColor}1c`);
    root.style.setProperty("--accent-ring", `${accentColor}40`);
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-sans", fontFamily);
  }, [fontFamily]);

  // Reset row selection when tab changes
  useEffect(() => {
    setFocusedIdx(null);
  }, [activeTab]);

  // ─── Theme ──────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      root.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme(t => t === "system" ? "light" : t === "light" ? "dark" : "system");
  };

  const switchTab = (key: ListKey) => {
    setActiveTab(key);
  };

  const completeOnboarding = () => {
    saveStoredSetting("onboarded", true);
    setShowOnboarding(false);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  // ─── Derived ─────────────────────────────────
  const visibleTasks = useMemo(() => tasks.filter(t => t.list === activeTab), [tasks, activeTab]);

  const taskCounts = useMemo(() => {
    const counts: Record<ListKey, number> = { rough: 0, todo: 0, watch: 0, later: 0 };
    tasks.forEach(t => {
      if (counts[t.list] !== undefined) counts[t.list]++;
    });
    return counts;
  }, [tasks]);

  // ─── Task Actions ────────────────────────────
  const toggleTask = (id: string) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  const resolveTask = (id: string) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, resolving: true } : t));
    setTimeout(() => setTasks(ts => ts.filter(t => t.id !== id)), 600);
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEditing = (id: string) => {
    const trimmed = editText.trim();
    if (trimmed) {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, text: trimmed } : t));
    }
    setEditingId(null);
  };

  const moveTask = (id: string, newList: ListKey) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, list: newList } : t));
  };

  const clearCompleted = () => {
    setTasks(ts => ts.filter(t => !(t.list === activeTab && t.done)));
  };

  // ─── Export / Import Backup ─────────────────
  const handleExportData = () => {
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      tasks,
      theme,
      accentColor,
      fontFamily,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trilist-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed.tasks)) {
          setTasks(parsed.tasks);
          if (parsed.theme) setTheme(parsed.theme);
          if (parsed.accentColor) setAccentColor(parsed.accentColor);
          if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
          alert("Backup successfully restored!");
        }
      } catch {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
  };

  // ─── Keyboard Shortcuts & Navigation ────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = Boolean(
        activeEl && (
          activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable
        )
      );

      if (e.key === "Escape") {
        if (moveMenuTaskId) { setMoveMenuTaskId(null); return; }
        if (showOnboarding) { completeOnboarding(); return; }
        if (showHelp)       { setShowHelp(false);   return; }
        if (menuOpen)       { setMenuOpen(false);   return; }
        setInput(""); setExtractedList(null); setExtractedDate(null);
        setFocusedIdx(null);
        inputRef.current?.blur();
        return;
      }

      if (!isTyping && !showOnboarding) {
        if (e.key === "0") { switchTab("rough"); return; }
        if (e.key === "1") { switchTab("todo");  return; }
        if (e.key === "2") { switchTab("watch"); return; }
        if (e.key === "3") { switchTab("later"); return; }
        if (e.key === "?") { setShowHelp(true);  return; }
        if (e.key === "/") {
          e.preventDefault();
          setInput("/");
          requestAnimationFrame(() => inputRef.current?.focus());
          return;
        }

        // Vim / Arrow task list navigation
        if (visibleTasks.length > 0) {
          if (e.key === "j" || e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIdx(i => i === null ? 0 : Math.min(i + 1, visibleTasks.length - 1));
            return;
          }
          if (e.key === "k" || e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIdx(i => i === null ? visibleTasks.length - 1 : Math.max(i - 1, 0));
            return;
          }
          if (e.key === " " && focusedIdx !== null && visibleTasks[focusedIdx]) {
            e.preventDefault();
            const target = visibleTasks[focusedIdx];
            if (activeTab === "watch") {
              resolveTask(target.id);
            } else if (activeTab === "rough") {
              deleteTask(target.id);
            } else {
              toggleTask(target.id);
            }
            return;
          }
          if ((e.key === "x" || e.key === "d") && focusedIdx !== null && visibleTasks[focusedIdx]) {
            e.preventDefault();
            const target = visibleTasks[focusedIdx];
            if (activeTab === "watch") {
              resolveTask(target.id);
            } else {
              deleteTask(target.id);
            }
            return;
          }
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showHelp, menuOpen, showOnboarding, visibleTasks, focusedIdx, activeTab, moveMenuTaskId]);

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

  // ─── Command filtering ───────────────────────
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

  // ─── Apply command ───────────────────────────
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
    setInput(words.length ? words.join(" ") + " " : "");

    if (cmd.type === "list") {
      setExtractedList({ key: cmd.target!, label: cmd.desc });
    } else if (cmd.type === "date") {
      setExtractedDate({ days: cmd.days!, label: cmd.desc });
    }

    setMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [input, disabledSet]);

  // ─── Input keyboard ──────────────────────────
  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && input === "") {
      e.preventDefault();
      if (extractedDate) { setExtractedDate(null); return; }
      if (extractedList) { setExtractedList(null); return; }
      return;
    }

    if (menuOpen && enabledCmds.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelIdx(i => (i + 1) % enabledCmds.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelIdx(i => (i - 1 + enabledCmds.length) % enabledCmds.length);
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        const cmd = enabledCmds[selIdx] ?? enabledCmds[0];
        if (cmd) applyCommand(cmd);
        return;
      }
    }

    if (e.key === "Enter" && !menuOpen) {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;

      const targetList = extractedList?.key ?? activeTab;
      const dueAt = extractedDate
        ? Date.now() + extractedDate.days * 86400000
        : undefined;

      setTasks(ts => [{
        id:        Math.random().toString(36).slice(2, 9),
        text,
        list:      targetList,
        done:      false,
        createdAt: Date.now(),
        dueAt,
      }, ...ts]);

      setInput(""); setExtractedList(null); setExtractedDate(null);
      if (targetList !== activeTab) switchTab(targetList);
    }
  };

  const emptyState  = EMPTY[activeTab];
  const placeholder = extractedList || extractedDate
    ? "Type task and press Enter…"
    : PLACEHOLDERS[activeTab];

  // ─── Animated Checkbox ───────────────────────
  const AnimCheckbox = ({ done, onToggle }: { done: boolean; onToggle: () => void }) => (
    <motion.button
      className="cb"
      whileTap={{ scale: 0.80 }}
      initial={false}
      animate={{
        backgroundColor: done ? "var(--accent)" : "transparent",
        borderColor:     done ? "var(--accent)" : "var(--border-mid)",
      }}
      onClick={onToggle}
    >
      <motion.svg width="10" height="10" viewBox="0 0 12 12" fill="none" overflow="visible">
        <motion.path
          d="M2 6.5L4.8 9L10 3"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </motion.svg>
    </motion.button>
  );

  // ─── Empty state icon ────────────────────────
  const EmptyIcon = () => {
    const props = { className: "empty-icon", strokeWidth: 1.2 };
    if (activeTab === "rough") return <Pencil {...props} />;
    if (activeTab === "todo")  return <CheckSquare2 {...props} />;
    if (activeTab === "watch") return <Eye {...props} />;
    return <Clock {...props} />;
  };

  // ─── Render ───────────────────────────────────
  return (
    <div className="page">
      <div className="window">

        {/* ── Header ───────────────────────────── */}
        <header className="header">
          {/* Left: Clean standalone brand logo & wordmark */}
          <div className="brand" onClick={() => switchTab("todo")} title="Trilist Home">
            <svg className="brand-mark" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="0" y="0"  width="20" height="3" rx="1.5" fill="var(--accent)"/>
              <rect x="0" y="6"  width="14" height="3" rx="1.5" fill="currentColor" opacity="0.85"/>
              <rect x="0" y="12" width="8"  height="3" rx="1.5" fill="currentColor" opacity="0.50"/>
            </svg>
            <span className="brand-name">trilist</span>
          </div>

          {/* Center: main tabs */}
          <div className="header-center">
            <div className="tabs">
              {MAIN_TABS.map(tab => (
                <div
                  key={tab.id}
                  className="tab"
                  data-active={activeTab === tab.id}
                  onClick={() => switchTab(tab.id)}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-bg"
                      className="tab-bg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.38 }}
                    />
                  )}
                  <span className="tab-label">
                    {tab.label}
                    {taskCounts[tab.id] > 0 && (
                      <span className="tab-count">{taskCounts[tab.id]}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Rough + controls */}
          <div className="header-right">
            <button
              className="rough-btn"
              data-active={activeTab === "rough"}
              onClick={() => switchTab("rough")}
              title="Rough (0)"
              aria-label="Open Rough"
            >
              <Pencil size={12} strokeWidth={2} />
              Rough
              {taskCounts.rough > 0 && <span className="tab-count">{taskCounts.rough}</span>}
            </button>

            {visibleTasks.some(t => t.done) && (
              <button
                className="rough-btn"
                onClick={clearCompleted}
                title="Clear completed tasks in this view"
              >
                Clear Done ({visibleTasks.filter(t => t.done).length})
              </button>
            )}

            <div className="header-divider" />

            <button
              className="tbtn"
              onClick={() => setShowHelp(true)}
              title="Settings & Help (?)"
              aria-label="Help"
            >
              ?
            </button>
            <button
              className="tbtn"
              onClick={cycleTheme}
              title={`Theme: ${theme}`}
              aria-label="Toggle theme"
            >
              <ThemeIcon size={14} />
            </button>
          </div>
        </header>

        {/* ── Content ──────────────────────────── */}
        <main className="content">
          <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {visibleTasks.length === 0 ? (
                  <motion.div
                    className="empty"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <EmptyIcon />
                    <p className="empty-title">{emptyState.title}</p>
                    <p className="empty-hint">{emptyState.hint}</p>
                  </motion.div>
                ) : (
                  <AnimatePresence initial={false}>
                    {visibleTasks.map((task, index) => {
                      const isEditing = editingId === task.id;
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -12, transition: { duration: 0.16 } }}
                          transition={{ duration: 0.18, delay: index * 0.035, ease: "easeOut" }}
                          className={`row${task.resolving ? " resolving" : ""}`}
                          data-focused={focusedIdx === index}
                          onClick={() => setFocusedIdx(index)}
                        >
                          {activeTab === "rough" && <div className="rough-dot" />}
                          {activeTab === "todo"  && <AnimCheckbox done={task.done} onToggle={() => toggleTask(task.id)} />}
                          {activeTab === "watch" && <div className="watch-dot" />}
                          {activeTab === "later" && <AnimCheckbox done={task.done} onToggle={() => toggleTask(task.id)} />}

                          {isEditing ? (
                            <input
                              className="row-edit-input"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") saveEditing(task.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="row-text"
                              data-done={task.done && activeTab !== "rough"}
                              onDoubleClick={() => startEditing(task)}
                              title="Double click to edit inline"
                            >
                              {task.text}
                            </span>
                          )}

                          {/* Due Date badge for Later or Watch list */}
                          {(activeTab === "later" || activeTab === "watch") && task.dueAt && !task.done && (
                            <span className="time-badge">
                              {daysUntil(task.dueAt) === 0 ? "today" : `${daysUntil(task.dueAt)}d`}
                            </span>
                          )}

                          {/* Created Relative Time Ago */}
                          {!isEditing && (
                            <span className="row-time-ago">{timeAgo(task.createdAt)}</span>
                          )}

                          {/* Row Actions Toolbar */}
                          {isEditing ? (
                            <div className="row-actions" style={{ opacity: 1, transform: "none" }}>
                              <button className="row-action-btn" onClick={() => saveEditing(task.id)} title="Save (Enter)">
                                <Check size={14} />
                              </button>
                              <button className="row-action-btn" onClick={() => setEditingId(null)} title="Cancel (Esc)">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="row-actions">
                              {activeTab === "watch" && !task.resolving && (
                                <button className="resolve-btn" onClick={() => resolveTask(task.id)}>
                                  Resolved
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                className="row-action-btn"
                                onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                                title="Edit item"
                                aria-label="Edit item"
                              >
                                <Pencil size={13} />
                              </button>

                              {/* Quick Move List Custom Popover Dropdown */}
                              <div className="move-pill-wrap">
                                <button
                                  className="move-pill-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMoveMenuTaskId(moveMenuTaskId === task.id ? null : task.id);
                                  }}
                                  title="Move to another list"
                                >
                                  → {task.list.charAt(0).toUpperCase() + task.list.slice(1)}
                                  <ChevronDown size={11} />
                                </button>
                                <AnimatePresence>
                                  {moveMenuTaskId === task.id && (
                                    <motion.div
                                      className="move-popover"
                                      initial={{ opacity: 0, scale: 0.94, y: -4 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.94, y: -4 }}
                                      transition={{ duration: 0.12 }}
                                    >
                                      {[
                                        { id: "todo",  label: "Todo"  },
                                        { id: "watch", label: "Watch" },
                                        { id: "later", label: "Later" },
                                        { id: "rough", label: "Rough" },
                                      ].map(l => (
                                        <button
                                          key={l.id}
                                          className="move-popover-item"
                                          data-active={task.list === l.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveTask(task.id, l.id as ListKey);
                                            setMoveMenuTaskId(null);
                                          }}
                                        >
                                          <span
                                            className="move-item-dot"
                                            style={{ background: task.list === l.id ? "var(--accent)" : "rgba(255,255,255,0.18)" }}
                                          />
                                          {l.label}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Delete Button */}
                              <button
                                className="row-action-btn del"
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                title="Delete item"
                                aria-label="Delete item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </motion.div>
            </AnimatePresence>
        </main>

        {/* ── Omnibar ──────────────────────────── */}
        <div className="omnibar-wrap">
          <AnimatePresence>
            {menuOpen && visibleCmds.length > 0 && (
              <motion.div
                className="cmd-menu"
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
              >
                {visibleCmds.some(c => c.type === "list") && (
                  <>
                    <div className="cmd-section">Where</div>
                    {visibleCmds.filter(c => c.type === "list").map(cmd => (
                      <div
                        key={cmd.cmd}
                        className="cmd-item"
                        data-selected={enabledCmds[selIdx]?.cmd === cmd.cmd}
                        data-disabled={disabledSet.has(cmd.cmd)}
                        onMouseEnter={() => { const i = enabledCmds.indexOf(cmd); if (i !== -1) setSelIdx(i); }}
                        onClick={() => applyCommand(cmd)}
                      >
                        <span className="cmd-label">{cmd.desc}</span>
                        <span className="cmd-alias">{cmd.alias}</span>
                      </div>
                    ))}
                  </>
                )}
                {visibleCmds.some(c => c.type === "date") && (
                  <>
                    <div className="cmd-section">When</div>
                    {visibleCmds.filter(c => c.type === "date").map(cmd => (
                      <div
                        key={cmd.cmd}
                        className="cmd-item"
                        data-selected={enabledCmds[selIdx]?.cmd === cmd.cmd}
                        data-disabled={disabledSet.has(cmd.cmd)}
                        title={disabledSet.has(cmd.cmd) ? "Select /later first" : undefined}
                        onMouseEnter={() => { const i = enabledCmds.indexOf(cmd); if (i !== -1) setSelIdx(i); }}
                        onClick={() => applyCommand(cmd)}
                      >
                        <span className="cmd-label">{cmd.desc}</span>
                        <span className="cmd-alias">{cmd.alias}</span>
                      </div>
                    ))}
                  </>
                )}
                {visibleCmds.some(c => c.type === "view") && (
                  <>
                    <div className="cmd-section">Help</div>
                    {visibleCmds.filter(c => c.type === "view").map(cmd => (
                      <div
                        key={cmd.cmd}
                        className="cmd-item"
                        data-selected={enabledCmds[selIdx]?.cmd === cmd.cmd}
                        onMouseEnter={() => { const i = enabledCmds.indexOf(cmd); if (i !== -1) setSelIdx(i); }}
                        onClick={() => applyCommand(cmd)}
                      >
                        <span className="cmd-label">{cmd.desc}</span>
                        <span className="cmd-alias">{cmd.alias}</span>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="omnibar">
            <svg className="omnibar-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {extractedList && (
              <span className="pill">
                {extractedList.label}
                <button className="pill-x" onClick={() => setExtractedList(null)} aria-label="Remove tag">×</button>
              </span>
            )}
            {extractedDate && (
              <span className="pill">
                {extractedDate.label}
                <button className="pill-x" onClick={() => setExtractedDate(null)} aria-label="Remove time">×</button>
              </span>
            )}

            <input
              ref={inputRef}
              className="omnibar-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onInputKey}
              placeholder={placeholder}
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>

        {/* ── 1-Time Onboarding Modal ───────────── */}
        <AnimatePresence>
          {showOnboarding && (
            <motion.div
              className="onboarding-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="onboarding-card"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <button
                  className="onboarding-close-btn"
                  onClick={completeOnboarding}
                  title="Skip onboarding"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
                {onboardStep === 1 && (
                  <>
                    <div className="onboarding-badge">
                      <Sparkles size={24} />
                    </div>
                    <h2 className="onboarding-title">The 3-List Philosophy</h2>
                    <p className="onboarding-body">
                      Trilist is built on Marc Andreessen's classic essay,{" "}
                      <a
                        href="https://pmarchive.com/guide_to_personal_productivity.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent)", textDecoration: "underline", fontWeight: 600 }}
                      >
                        Guide to Personal Productivity
                      </a>.
                      Instead of overwhelming lists, focus on 3 core lists: <strong>Todo</strong> (3 to 5 commitments per day), <strong>Watch</strong> (radar items), and <strong>Later</strong> (deferred tasks).
                    </p>
                  </>
                )}

                {onboardStep === 2 && (
                  <>
                    <div className="onboarding-badge">
                      <Pencil size={24} />
                    </div>
                    <h2 className="onboarding-title">The Rough Scratchpad</h2>
                    <p className="onboarding-body">
                      Unverified thoughts and raw notes shouldn't pollute your daily commitments. Use <strong>Rough</strong> (press <code>0</code>) as your fast scratchpad to capture ideas before promoting them to your core lists.
                    </p>
                  </>
                )}

                {onboardStep === 3 && (
                  <>
                    <div className="onboarding-badge">
                      <Command size={24} />
                    </div>
                    <h2 className="onboarding-title">Instant Tag Routing</h2>
                    <p className="onboarding-body">
                      Type <strong>/wt</strong> (Watch) or <strong>/lt</strong> (Later) anywhere in your text input to route items to different lists without breaking your typing rhythm. Add <strong>/wk</strong> or <strong>/mn</strong> to set future due dates.
                    </p>
                  </>
                )}

                {onboardStep === 4 && (
                  <>
                    <div className="onboarding-badge">
                      <Zap size={24} />
                    </div>
                    <h2 className="onboarding-title">Keyboard Mastery</h2>
                    <p className="onboarding-body">
                      Press <strong>0–3</strong> to switch lists, <strong>j</strong> and <strong>k</strong> to navigate items, <strong>Space</strong> to complete, and <strong>?</strong> anytime for your preferences and shortcut overlay.
                    </p>
                  </>
                )}

                <div className="onboarding-footer">
                  <div className="onboarding-dots">
                    <div className="onboarding-dot" data-active={onboardStep === 1} />
                    <div className="onboarding-dot" data-active={onboardStep === 2} />
                    <div className="onboarding-dot" data-active={onboardStep === 3} />
                    <div className="onboarding-dot" data-active={onboardStep === 4} />
                  </div>

                  {onboardStep < 4 ? (
                    <button className="primary-btn" onClick={() => setOnboardStep(s => s + 1)}>
                      Next <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button className="primary-btn" onClick={completeOnboarding}>
                      Get Started
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Help & Settings Overlay ─────────────────────── */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              className="help-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={e => { if (e.target === e.currentTarget) setShowHelp(false); }}
            >
              <div className="help-header">
                <p className="help-title">Help &amp; Preferences</p>
                <button
                  className="help-close-btn"
                  onClick={() => setShowHelp(false)}
                  title="Close help (Esc)"
                  aria-label="Close help"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Customization Options */}
              <div className="help-block">
                <p className="help-section-label">Accent Color</p>
                <div className="help-rule" />
                <div className="swatch-group">
                  {ACCENT_SWATCHES.map(s => (
                    <button
                      key={s.color}
                      className="swatch-btn"
                      style={{ backgroundColor: s.color }}
                      title={s.name}
                      data-selected={accentColor === s.color}
                      onClick={() => setAccentColor(s.color)}
                    />
                  ))}
                </div>
              </div>

              <div className="help-block">
                <p className="help-section-label">Typography</p>
                <div className="help-rule" />
                <div className="font-btn-group">
                  {FONT_OPTIONS.map(f => (
                    <button
                      key={f.label}
                      className="font-btn"
                      style={{ fontFamily: f.value }}
                      data-selected={fontFamily === f.value}
                      onClick={() => setFontFamily(f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="help-block">
                <p className="help-section-label">Navigation &amp; Task Selection</p>
                <div className="help-rule" />
                {[
                  { keys: ["0"],             desc: "Open Rough (capture)" },
                  { keys: ["1", "2", "3"],   desc: "Switch to Todo / Watch / Later" },
                  { keys: ["j", "k"],        desc: "Navigate task items up / down (Vim)" },
                  { keys: ["Space"],         desc: "Toggle completion on focused task" },
                  { keys: ["x", "d"],        desc: "Delete / Resolve focused task" },
                  { keys: ["?"],             desc: "Open this help screen" },
                  { keys: ["Esc"],           desc: "Close overlay / clear input" },
                ].map(r => (
                  <div key={r.keys.join()} className="help-row">
                    <div className="help-keys">{r.keys.map(k => <span key={k} className="key">{k}</span>)}</div>
                    <span className="help-desc">{r.desc}</span>
                  </div>
                ))}
              </div>

              <div className="help-block">
                <p className="help-section-label">Composing</p>
                <div className="help-rule" />
                {[
                  { keys: ["Enter"],   desc: "Add task to active or tagged list" },
                  { keys: ["/"],       desc: "Open command palette" },
                  { keys: ["↑", "↓"], desc: "Navigate autocomplete" },
                  { keys: ["Tab"],     desc: "Select highlighted command" },
                  { keys: ["⌫"],      desc: "Remove last tag pill" },
                ].map(r => (
                  <div key={r.keys.join()} className="help-row">
                    <div className="help-keys">{r.keys.map(k => <span key={k} className="key">{k}</span>)}</div>
                    <span className="help-desc">{r.desc}</span>
                  </div>
                ))}
              </div>

              <div className="help-block">
                <p className="help-section-label">Where tags</p>
                <div className="help-rule" />
                {LIST_CMDS.map(c => (
                  <div key={c.cmd} className="help-row">
                    <div className="help-keys">
                      <span className="key">{c.alias}</span>
                      <span className="key-or">or</span>
                      <span className="key">{c.cmd}</span>
                    </div>
                    <span className="help-desc">{c.desc}</span>
                  </div>
                ))}
              </div>

              <div className="help-block">
                <p className="help-section-label">When tags (available for /watch and /later)</p>
                <div className="help-rule" />
                {DATE_CMDS.map(c => (
                  <div key={c.cmd} className="help-row">
                    <div className="help-keys">
                      <span className="key">{c.alias}</span>
                      <span className="key-or">or</span>
                      <span className="key">{c.cmd}</span>
                    </div>
                    <span className="help-desc">{c.desc}</span>
                  </div>
                ))}
              </div>

              {/* Data Ownership / Backup */}
              <div className="help-block">
                <p className="help-section-label">Data Ownership &amp; Backup</p>
                <div className="help-rule" />
                <p className="help-desc">All data is stored locally in your browser using non-blocking IndexedDB.</p>
                <div className="backup-actions">
                  <button className="backup-btn" onClick={handleExportData}>
                    <Download size={13} /> Export Backup (.json)
                  </button>
                  <button className="backup-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={13} /> Import Backup (.json)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: "none" }}
                    onChange={handleImportData}
                  />
                </div>
              </div>

              {/* Creator & Inspiration Signature Card */}
              <div className="credits-card">
                <div className="credits-header">
                  <span className="credits-title">Crafted with precision by</span>
                  <span className="credits-name">Nishachay</span>
                </div>

                <div className="credits-links">
                  <a
                    href="https://x.com/nishachayy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="credit-pill"
                    title="Follow Nishachay on X (Twitter)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>@nishachayy</span>
                  </a>

                  <a
                    href="https://github.com/nishachay"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="credit-pill"
                    title="View Nishachay on GitHub"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                      <path d="M9 18c-4.51 2-5-2-7-2"/>
                    </svg>
                    <span>github</span>
                  </a>

                  <a
                    href="mailto:nishachayshelke@gmail.com"
                    className="credit-pill"
                    title="Email Nishachay"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <span>email</span>
                  </a>
                </div>

                <p className="credits-inspiration">
                  Inspired by Marc Andreessen's{" "}
                  <a
                    href="https://pmarchive.com/guide_to_personal_productivity.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="credits-link"
                  >
                    Guide to Personal Productivity
                  </a>
                </p>
              </div>

              <p className="help-note">Press Esc or click outside to close.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient Canvas Signature */}
        <div className="canvas-signature">
          crafted by <a href="https://x.com/nishachayy" target="_blank" rel="noopener noreferrer">Nishachay</a>
        </div>
      </div>
    </div>
  );
}
