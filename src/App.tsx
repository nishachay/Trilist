import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Command, Sun, Moon, Monitor } from "lucide-react";

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

// ─── Tab Config ─────────────────────────────────
const TABS: { id: ListKey; label: string }[] = [
  { id: "rough", label: "Rough" },
  { id: "todo",  label: "Todo"  },
  { id: "watch", label: "Watch" },
  { id: "later", label: "Later" },
];

const PLACEHOLDERS: Record<ListKey, string> = {
  rough: "Dump anything here...",
  todo:  "What are you committing to today?",
  watch: "What are you keeping an eye on?",
  later: "Something for later...",
};

const EMPTY: Record<ListKey, { title: string; hint: string }> = {
  rough: { title: "Clean slate.",         hint: "/rg to add · hover to delete"     },
  todo:  { title: "Nothing committed.",   hint: "/td to commit · check to complete" },
  watch: { title: "Nothing on radar.",    hint: "/wt to track · Resolved to remove" },
  later: { title: "The future is clear.", hint: "/lt to defer · /lt /wk for a week" },
};

// ─── Initial Demo Tasks ─────────────────────────
const DEMO: Task[] = [
  { id: "d1", text: "idea: dark mode for the settings page",       list: "rough", done: false, createdAt: Date.now() },
  { id: "d2", text: "Ship the new onboarding flow",                list: "todo",  done: false, createdAt: Date.now() },
  { id: "d3", text: "Review the investor deck before Wednesday",   list: "todo",  done: false, createdAt: Date.now() },
  { id: "d4", text: "Competitor X pricing change — watch closely", list: "watch", done: false, createdAt: Date.now() },
  { id: "d5", text: "Write annual strategy document",              list: "later", done: false, createdAt: Date.now(), dueAt: Date.now() + 7  * 24 * 60 * 60 * 1000 },
  { id: "d6", text: "Explore new infrastructure providers",        list: "later", done: false, createdAt: Date.now(), dueAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
];

// ─── Helpers ────────────────────────────────────
function daysUntil(ts: number) {
  return Math.max(0, Math.round((ts - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ─── App ────────────────────────────────────────
export default function App() {
  // Core state
  const [tasks,     setTasks]     = useState<Task[]>(DEMO);
  const [activeTab, setActiveTab] = useState<ListKey>("todo");
  const [theme,     setTheme]     = useState<Theme>("system");
  const [showHelp,  setShowHelp]  = useState(false);

  // Input state
  const [input,         setInput]         = useState("");
  const [extractedList, setExtractedList] = useState<{ key: ListKey; label: string } | null>(null);
  const [extractedDate, setExtractedDate] = useState<{ days: number; label: string } | null>(null);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [menuQuery,     setMenuQuery]     = useState("");
  const [selIdx,        setSelIdx]        = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Theme sync ─────────────────────────────
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

  // ─── Global keyboard shortcuts ──────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = document.activeElement === inputRef.current;

      // Esc: layered dismissal
      if (e.key === "Escape") {
        if (showHelp)  { setShowHelp(false);  return; }
        if (menuOpen)  { setMenuOpen(false);  return; }
        setInput(""); setExtractedList(null); setExtractedDate(null);
        inputRef.current?.blur();
        return;
      }

      // When NOT in input: number keys, ?, /
      if (!inInput) {
        if (e.key === "1") { setActiveTab("rough"); return; }
        if (e.key === "2") { setActiveTab("todo");  return; }
        if (e.key === "3") { setActiveTab("watch"); return; }
        if (e.key === "4") { setActiveTab("later"); return; }
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

  // ─── Autocomplete detection ─────────────────
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

  // ─── Filtered + constrained commands ────────
  const { visibleCmds, enabledCmds, disabledSet } = useMemo(() => {
    const q = menuQuery;

    // Match by cmd or alias prefix
    const visible = ALL_CMDS.filter(c =>
      q === "/" || c.cmd.startsWith(q) || c.alias.startsWith(q)
    );

    // Date tags are disabled unless /lt is already extracted
    const disabled = new Set<string>();
    visible.forEach(c => {
      if (c.type === "date" && extractedList?.key !== "later") {
        disabled.add(c.cmd);
      }
    });

    const enabled = visible.filter(c => !disabled.has(c.cmd));

    return { visibleCmds: visible, enabledCmds: enabled, disabledSet: disabled };
  }, [menuQuery, extractedList]);

  // ─── Apply a command ────────────────────────
  const applyCommand = useCallback((cmd: Cmd) => {
    if (disabledSet.has(cmd.cmd)) return;

    if (cmd.type === "view") {
      setShowHelp(true);
      setInput("");
      setMenuOpen(false);
      return;
    }

    // Strip the /... token from input
    const words = input.split(" ");
    words.pop();
    setInput(words.length ? words.join(" ") + " " : "");

    if (cmd.type === "list") {
      // "Where" tags replace each other
      setExtractedList({ key: cmd.target!, label: cmd.desc });
    } else if (cmd.type === "date") {
      // "When" tag (only /lt already extracted)
      setExtractedDate({ days: cmd.days!, label: cmd.desc });
    }

    setMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [input, disabledSet]);

  // ─── Input keyboard handler ─────────────────
  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace on empty → remove last pill
    if (e.key === "Backspace" && input === "") {
      e.preventDefault();
      if (extractedDate) { setExtractedDate(null); return; }
      if (extractedList) { setExtractedList(null); return; }
      return;
    }

    // Menu navigation
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

    // Submit task
    if (e.key === "Enter" && !menuOpen) {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;

      const targetList = extractedList?.key ?? activeTab;
      const dueAt      = extractedDate
        ? Date.now() + extractedDate.days * 24 * 60 * 60 * 1000
        : undefined;

      const task: Task = {
        id:        Math.random().toString(36).slice(2, 9),
        text,
        list:      targetList,
        done:      false,
        createdAt: Date.now(),
        dueAt,
      };

      setTasks(ts => [task, ...ts]);
      setInput(""); setExtractedList(null); setExtractedDate(null);
      if (targetList !== activeTab) setActiveTab(targetList);
    }
  };

  // ─── Task actions ────────────────────────────
  const toggleTask = (id: string) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const deleteTask = (id: string) =>
    setTasks(ts => ts.filter(t => t.id !== id));

  const resolveTask = (id: string) => {
    // Green flash → then remove
    setTasks(ts => ts.map(t => t.id === id ? { ...t, resolving: true } : t));
    setTimeout(() => setTasks(ts => ts.filter(t => t.id !== id)), 600);
  };

  // ─── Derived ─────────────────────────────────
  const visibleTasks = tasks.filter(t => t.list === activeTab);
  const emptyState   = EMPTY[activeTab];
  const placeholder  = extractedList || extractedDate
    ? "Type task and press Enter…"
    : PLACEHOLDERS[activeTab];

  // ─── Animated Checkbox ───────────────────────
  const AnimCheckbox = ({ done, onToggle }: { done: boolean; onToggle: () => void }) => (
    <motion.button
      className="cb"
      whileTap={{ scale: 0.82 }}
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

  // ─── Render ───────────────────────────────────
  return (
    <div className="page">
      <div className="window">

        {/* ── Tab Bar ─────────────────────────── */}
        <div className="tabbar">
          <div className="tabs">
            {TABS.map(tab => (
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
                    transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                  />
                )}
                <span className="tab-label">{tab.label}</span>
              </div>
            ))}
          </div>

          <div className="tabbar-space" />

          <div className="tabbar-right">
            {/* Help button */}
            <button
              className="tbtn"
              onClick={() => setShowHelp(true)}
              title="Help (?)"
              aria-label="Help"
            >
              ?
            </button>

            {/* Theme toggle */}
            <button
              className="tbtn"
              onClick={cycleTheme}
              title={`Theme: ${theme}`}
              aria-label="Toggle theme"
            >
              <ThemeIcon size={14} />
            </button>
          </div>
        </div>

        {/* ── Content ──────────────────────────── */}
        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {visibleTasks.length === 0 ? (
                <div className="empty">
                  <div className="empty-title">{emptyState.title}</div>
                  <div className="empty-hint">{emptyState.hint}</div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {visibleTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12, transition: { duration: 0.18 } }}
                      className={`row${task.resolving ? " resolving" : ""}`}
                    >
                      {/* Left indicator — per list */}
                      {activeTab === "rough" && <div className="rough-dot" />}
                      {activeTab === "todo"  && <AnimCheckbox done={task.done} onToggle={() => toggleTask(task.id)} />}
                      {activeTab === "watch" && <div className="watch-dot" />}
                      {activeTab === "later" && <AnimCheckbox done={task.done} onToggle={() => toggleTask(task.id)} />}

                      {/* Task text */}
                      <span
                        className="row-text"
                        data-done={task.done && activeTab !== "rough"}
                      >
                        {task.text}
                      </span>

                      {/* Later: time badge */}
                      {activeTab === "later" && task.dueAt && !task.done && (
                        <span className="time-badge">
                          {daysUntil(task.dueAt) === 0
                            ? "today"
                            : `${daysUntil(task.dueAt)}d`}
                        </span>
                      )}

                      {/* Watch: Resolved action */}
                      {activeTab === "watch" && !task.resolving && (
                        <button
                          className="resolve-btn"
                          onClick={() => resolveTask(task.id)}
                        >
                          Resolved ✓
                        </button>
                      )}

                      {/* Rough: delete × */}
                      {activeTab === "rough" && (
                        <button
                          className="del-btn"
                          onClick={() => deleteTask(task.id)}
                          aria-label="Delete"
                        >
                          ×
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Omnibar ──────────────────────────── */}
        <div className="omnibar-wrap">

          {/* Context-aware command menu */}
          <AnimatePresence>
            {menuOpen && visibleCmds.length > 0 && (
              <motion.div
                className="cmd-menu"
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* WHERE section */}
                {visibleCmds.some(c => c.type === "list") && (
                  <>
                    <div className="cmd-section">Where</div>
                    {visibleCmds.filter(c => c.type === "list").map(cmd => (
                      <div
                        key={cmd.cmd}
                        className="cmd-item"
                        data-selected={enabledCmds[selIdx]?.cmd === cmd.cmd}
                        data-disabled={disabledSet.has(cmd.cmd)}
                        onMouseEnter={() => {
                          const idx = enabledCmds.indexOf(cmd);
                          if (idx !== -1) setSelIdx(idx);
                        }}
                        onClick={() => applyCommand(cmd)}
                      >
                        <span className="cmd-label">{cmd.desc}</span>
                        <span className="cmd-alias">{cmd.alias}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* WHEN section */}
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
                        onMouseEnter={() => {
                          const idx = enabledCmds.indexOf(cmd);
                          if (idx !== -1) setSelIdx(idx);
                        }}
                        onClick={() => applyCommand(cmd)}
                      >
                        <span className="cmd-label">{cmd.desc}</span>
                        <span className="cmd-alias">{cmd.alias}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* SYSTEM section */}
                {visibleCmds.some(c => c.type === "view") && (
                  <>
                    <div className="cmd-section">Help</div>
                    {visibleCmds.filter(c => c.type === "view").map(cmd => (
                      <div
                        key={cmd.cmd}
                        className="cmd-item"
                        data-selected={enabledCmds[selIdx]?.cmd === cmd.cmd}
                        onMouseEnter={() => {
                          const idx = enabledCmds.indexOf(cmd);
                          if (idx !== -1) setSelIdx(idx);
                        }}
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

          {/* Input bar */}
          <div className="omnibar">
            <Command size={16} className="omnibar-cmd-icon" />

            {/* Extracted tag pills */}
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
              transition={{ duration: 0.2 }}
              onClick={e => { if (e.target === e.currentTarget) setShowHelp(false); }}
            >
              <div className="help-title">Trilist · Help &amp; Shortcuts</div>

              {/* Navigation */}
              <div className="help-block">
                <div className="help-section-label">Navigation</div>
                <div className="help-rule" />
                {[
                  { keys: ["1"], desc: "Switch to Rough" },
                  { keys: ["2"], desc: "Switch to Todo" },
                  { keys: ["3"], desc: "Switch to Watch" },
                  { keys: ["4"], desc: "Switch to Later" },
                  { keys: ["?"], desc: "Open this help screen" },
                  { keys: ["Esc"], desc: "Close overlay / clear input" },
                ].map(r => (
                  <div key={r.keys.join()} className="help-row">
                    <div className="help-keys">
                      {r.keys.map(k => <span key={k} className="key">{k}</span>)}
                    </div>
                    <span className="help-desc">{r.desc}</span>
                  </div>
                ))}
              </div>

              {/* Composing */}
              <div className="help-block">
                <div className="help-section-label">Composing</div>
                <div className="help-rule" />
                {[
                  { keys: ["Enter"],     desc: "Submit task to active list (or tagged list)" },
                  { keys: ["/"],         desc: "Open command palette (works anywhere in text)" },
                  { keys: ["↑", "↓"],   desc: "Navigate autocomplete menu" },
                  { keys: ["Tab"],       desc: "Select highlighted command" },
                  { keys: ["⌫"],        desc: "Delete last tag pill (when input is empty)" },
                ].map(r => (
                  <div key={r.keys.join()} className="help-row">
                    <div className="help-keys">
                      {r.keys.map(k => <span key={k} className="key">{k}</span>)}
                    </div>
                    <span className="help-desc">{r.desc}</span>
                  </div>
                ))}
              </div>

              {/* Where tags */}
              <div className="help-block">
                <div className="help-section-label">Tags — Where</div>
                <div className="help-rule" />
                {LIST_CMDS.map(c => (
                  <div key={c.cmd} className="help-row">
                    <div className="help-keys">
                      <span className="key">{c.alias}</span>
                      <span style={{ color: "var(--text-faint)", fontSize: 11 }}>or</span>
                      <span className="key">{c.cmd}</span>
                    </div>
                    <span className="help-desc">{c.desc}</span>
                  </div>
                ))}
              </div>

              {/* When tags */}
              <div className="help-block">
                <div className="help-section-label">Tags — When (only after /lt)</div>
                <div className="help-rule" />
                {DATE_CMDS.map(c => (
                  <div key={c.cmd} className="help-row">
                    <div className="help-keys">
                      <span className="key">{c.alias}</span>
                      <span style={{ color: "var(--text-faint)", fontSize: 11 }}>or</span>
                      <span className="key">{c.cmd}</span>
                    </div>
                    <span className="help-desc">{c.desc}</span>
                  </div>
                ))}
              </div>

              {/* Rules callout */}
              <div className="help-block">
                <div className="help-section-label">Rules</div>
                <div className="help-rule" />
                <div className="help-row">
                  <span className="help-desc">Where tags are mutually exclusive — last one typed wins.</span>
                </div>
                <div className="help-row">
                  <span className="help-desc">When tags are only valid after <span className="key" style={{display:"inline"}}>  /lt  </span></span>
                </div>
                <div className="help-row">
                  <span className="help-desc">Rough items cannot be completed — only deleted on hover.</span>
                </div>
                <div className="help-row">
                  <span className="help-desc">Watch items resolve with the <strong>Resolved ✓</strong> hover action.</span>
                </div>
              </div>

              <div className="help-note">Press Esc or click outside to close.</div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
