import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Monitor, CheckSquare2, Eye, Clock, Pencil } from "lucide-react";

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
  rough: "Capture anything — idea, note, thought...",
  todo:  "What are you committing to today?",
  watch: "What are you keeping an eye on?",
  later: "Something to revisit later...",
};

const EMPTY: Record<ListKey, { title: string; hint: string }> = {
  rough: { title: "Nothing captured.",    hint: "Type anything and press Enter"     },
  todo:  { title: "Nothing committed.",   hint: "/td to add · check to complete"    },
  watch: { title: "Nothing on radar.",    hint: "/wt to track · Resolved to close"  },
  later: { title: "The future is clear.", hint: "/lt to defer · /lt /wk for a week" },
};

// ─── Demo data ──────────────────────────────────
const DEMO: Task[] = [
  { id: "d1", text: "idea: rethink the settings layout",             list: "rough", done: false, createdAt: Date.now() },
  { id: "d2", text: "Ship the new onboarding flow",                  list: "todo",  done: false, createdAt: Date.now() },
  { id: "d3", text: "Review the investor deck before Wednesday",     list: "todo",  done: false, createdAt: Date.now() },
  { id: "d4", text: "Competitor X pricing change — watch closely",   list: "watch", done: false, createdAt: Date.now() },
  { id: "d5", text: "Write the annual strategy document",            list: "later", done: false, createdAt: Date.now(), dueAt: Date.now() + 7  * 86400000 },
  { id: "d6", text: "Explore new infrastructure providers",          list: "later", done: false, createdAt: Date.now(), dueAt: Date.now() + 30 * 86400000 },
];

function daysUntil(ts: number) {
  return Math.max(0, Math.round((ts - Date.now()) / 86400000));
}

// ─── App ────────────────────────────────────────
export default function App() {
  const [tasks,     setTasks]     = useState<Task[]>(DEMO);
  const [activeTab, setActiveTab] = useState<ListKey>("todo");
  const [theme,     setTheme]     = useState<Theme>("system");
  const [showHelp,  setShowHelp]  = useState(false);
  const [isLoaded,  setIsLoaded]  = useState(false);

  const [input,         setInput]         = useState("");
  const [extractedList, setExtractedList] = useState<{ key: ListKey; label: string } | null>(null);
  const [extractedDate, setExtractedDate] = useState<{ days: number; label: string } | null>(null);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [menuQuery,     setMenuQuery]     = useState("");
  const [selIdx,        setSelIdx]        = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // ─── IndexedDB Storage Persistence ──────────
  useEffect(() => {
    async function loadData() {
      const savedTasks = await getStoredTasks<Task>();
      if (savedTasks && savedTasks.length > 0) {
        setTasks(savedTasks);
      } else {
        await saveStoredTasks(DEMO);
      }

      const savedTheme = await getStoredSetting<Theme>("theme");
      if (savedTheme) {
        setTheme(savedTheme);
      }
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

  const cycleTheme = () =>
    setTheme(t => t === "system" ? "light" : t === "light" ? "dark" : "system");

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;


  // ─── Keyboard shortcuts ─────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = document.activeElement === inputRef.current;

      if (e.key === "Escape") {
        if (showHelp)  { setShowHelp(false);  return; }
        if (menuOpen)  { setMenuOpen(false);  return; }
        setInput(""); setExtractedList(null); setExtractedDate(null);
        inputRef.current?.blur();
        return;
      }

      if (!inInput) {
        if (e.key === "0") { setActiveTab("rough"); return; }
        if (e.key === "1") { setActiveTab("todo");  return; }
        if (e.key === "2") { setActiveTab("watch"); return; }
        if (e.key === "3") { setActiveTab("later"); return; }
        if (e.key === "?") { setShowHelp(true);     return; }
        if (e.key === "/") {
          e.preventDefault();
          setInput("/");
          requestAnimationFrame(() => inputRef.current?.focus());
          return;
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showHelp, menuOpen]);

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
    visible.forEach(c => {
      if (c.type === "date" && extractedList?.key !== "later") {
        disabled.add(c.cmd);
      }
    });
    const enabled = visible.filter(c => !disabled.has(c.cmd));
    return { visibleCmds: visible, enabledCmds: enabled, disabledSet: disabled };
  }, [menuQuery, extractedList]);

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
      if (targetList !== activeTab) setActiveTab(targetList);
    }
  };

  // ─── Task actions ────────────────────────────
  const toggleTask  = (id: string) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const deleteTask  = (id: string) =>
    setTasks(ts => ts.filter(t => t.id !== id));

  const resolveTask = (id: string) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, resolving: true } : t));
    setTimeout(() => setTasks(ts => ts.filter(t => t.id !== id)), 600);
  };

  // ─── Derived ─────────────────────────────────
  const visibleTasks = tasks.filter(t => t.list === activeTab);
  const emptyState   = EMPTY[activeTab];
  const placeholder  = extractedList || extractedDate
    ? "Type task and press Enter…"
    : PLACEHOLDERS[activeTab];

  // ─── Animated checkbox ───────────────────────
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

          {/* Left: wordmark */}
          <div className="brand">
            <svg className="brand-mark" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect y="0"  width="18" height="2" rx="1" fill="currentColor"/>
              <rect y="6"  width="13" height="2" rx="1" fill="currentColor" opacity="0.6"/>
              <rect y="12" width="8"  height="2" rx="1" fill="currentColor" opacity="0.35"/>
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
                  onClick={() => setActiveTab(tab.id)}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-bg"
                      className="tab-bg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.38 }}
                    />
                  )}
                  <span className="tab-label">{tab.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Rough + controls */}
          <div className="header-right">
            {/* Rough — separate from the 3 lists */}
            <button
              className="rough-btn"
              data-active={activeTab === "rough"}
              onClick={() => setActiveTab("rough")}
              title="Rough (0)"
              aria-label="Open Rough"
            >
              <Pencil size={12} strokeWidth={2} />
              Rough
            </button>

            <div className="header-divider" />

            <button
              className="tbtn"
              onClick={() => setShowHelp(true)}
              title="Help (?)"
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
              <ThemeIcon size={13} />
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
                  {visibleTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12, transition: { duration: 0.16 } }}
                      transition={{ duration: 0.18, delay: index * 0.035, ease: "easeOut" }}
                      className={`row${task.resolving ? " resolving" : ""}`}
                    >
                      {activeTab === "rough" && <div className="rough-dot" />}
                      {activeTab === "todo"  && <AnimCheckbox done={task.done} onToggle={() => toggleTask(task.id)} />}
                      {activeTab === "watch" && <div className="watch-dot" />}
                      {activeTab === "later" && <AnimCheckbox done={task.done} onToggle={() => toggleTask(task.id)} />}

                      <span className="row-text" data-done={task.done && activeTab !== "rough"}>
                        {task.text}
                      </span>

                      {activeTab === "later" && task.dueAt && !task.done && (
                        <span className="time-badge">
                          {daysUntil(task.dueAt) === 0 ? "today" : `${daysUntil(task.dueAt)}d`}
                        </span>
                      )}

                      {activeTab === "watch" && !task.resolving && (
                        <button className="resolve-btn" onClick={() => resolveTask(task.id)}>
                          Resolved
                        </button>
                      )}

                      {activeTab === "rough" && (
                        <button className="del-btn" onClick={() => deleteTask(task.id)} aria-label="Delete">×</button>
                      )}
                    </motion.div>
                  ))}
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

        {/* ── Help Overlay ─────────────────────── */}
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
              <p className="help-title">Help &amp; Shortcuts</p>

              <div className="help-block">
                <p className="help-section-label">Navigation</p>
                <div className="help-rule" />
                {[
                  { keys: ["0"],     desc: "Open Rough (capture)" },
                  { keys: ["1"],     desc: "Switch to Todo" },
                  { keys: ["2"],     desc: "Switch to Watch" },
                  { keys: ["3"],     desc: "Switch to Later" },
                  { keys: ["?"],     desc: "Open this help screen" },
                  { keys: ["Esc"],   desc: "Close overlay / clear input" },
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
                <p className="help-section-label">When tags — only after /lt</p>
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

              <div className="help-block">
                <p className="help-section-label">How it works</p>
                <div className="help-rule" />
                <div className="help-row"><span className="help-desc">Rough is a scratch space — separate from the 3 lists.</span></div>
                <div className="help-row"><span className="help-desc">Where tags are mutually exclusive. Last one typed wins.</span></div>
                <div className="help-row"><span className="help-desc">When tags only unlock after /lt is applied.</span></div>
                <div className="help-row"><span className="help-desc">Rough items hover to delete. Watch items hover to Resolve.</span></div>
              </div>

              <p className="help-note">Press Esc or click outside to close.</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
