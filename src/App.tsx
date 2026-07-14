import { useEffect, useState } from "react";
import { Inbox, Eye, Clock, Check, Calendar as CalendarIcon, Search, Sun, Moon, Monitor, Settings2, Download, Trash2 } from "lucide-react";
import { TABS, itemsFor, LIST_META, type ListKey, type TabKey, useStore, useHydrated } from "./hooks/useStore";
import { useTheme } from "./hooks/useTheme";
import { Pane } from "./components/app/Pane";
import { Calendar } from "./components/app/Calendar";
import { Omnibar, type Parsed } from "./components/app/Omnibar";
import { CommandPalette } from "./components/app/CommandPalette";

const ICONS: Record<TabKey, any> = {
  todo: Inbox,
  watch: Eye,
  later: Clock,
  done: Check,
  calendar: CalendarIcon,
};

const CAL_META = { label: "Calendar", hint: "scheduled" };

export default function App() {
  const hydrated = useHydrated();
  const { state, counts, add, edit, remove, move, toggle, schedule, setActive, clearAll, exportJSON } = useStore();
  const { theme, cycle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [dropTarget, setDropTarget] = useState<TabKey | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const active: TabKey = state.prefs.activeTab;
  const items = active === "calendar" ? [] : itemsFor(state, active as ListKey);

  // Global shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((v) => !v); return; }
      if (meta && e.shiftKey && e.key.toLowerCase() === "l") { e.preventDefault(); cycle(); return; }
      if (meta && !e.shiftKey && (e.key === "/" || (e.key === "?" && e.shiftKey))) { e.preventDefault(); setPaletteOpen(true); return; }

      if (meta && !inField) {
        const idx = ["1","2","3","4","5"].indexOf(e.key);
        if (idx >= 0) { e.preventDefault(); setActive(TABS[idx]); return; }
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [cycle, setActive]);

  const handleOmnibarSubmit = (p: Parsed) => {
    add(p.list, p.text, p.dueAt);
    if (active !== p.list && active !== "calendar") {
      setActive(p.list);
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trilist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const dateStr = now
    ? now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper-sink)] p-3 md:p-5">
      <div className="frame relative flex-1 flex flex-col bg-[var(--card)]">
        
        {/* Unified Tab bar & Actions Header line (Chrome browser style, scrollable tabs) */}
        <div className="tabbar flex items-end bg-[var(--paper-sink)] px-4 select-none pt-3 gap-2" role="tablist" aria-label="Lists">
          
          {/* Left Logo */}
          <div className="flex items-center gap-2 pb-2.5 pl-1 mr-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--pen)] shrink-0 animate-pulse" aria-hidden />
            <span className="font-serif text-[15px] text-[var(--ink)] leading-none font-semibold">Trilist</span>
            <span className="font-mono text-[9px] text-[var(--ink-faint)] leading-none pt-0.5 tracking-wider whitespace-nowrap hidden sm:inline">
              · {dateStr}
            </span>
          </div>

          {/* Center-Left: Tabs container aligned next to logo, scrollable if screen is narrow */}
          <div className="flex-1 overflow-x-auto scrollbar-none flex items-end gap-0.5 px-1">
            {TABS.map((k, idx) => {
              const Icon = ICONS[k];
              const isCal = k === "calendar";
              const meta = isCal ? CAL_META : LIST_META[k as ListKey];
              const isSelected = active === k;
              
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={isSelected}
                  data-active={isSelected}
                  className={`tab cursor-pointer ${dropTarget === k ? "tab-drop-target" : ""}`}
                  onClick={() => setActive(k)}
                  onDragOver={(e) => { if (!isCal) { e.preventDefault(); setDropTarget(k); } }}
                  onDragLeave={() => setDropTarget((t) => (t === k ? null : t))}
                  onDrop={(e) => {
                    if (isCal) return;
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    setDropTarget(null);
                    if (id) move(id, k as ListKey);
                  }}
                  title={`${meta.label}${idx < 4 ? ` — ⌘${idx + 1}` : " — ⌘5"}`}
                >
                  <Icon size={13} className="opacity-80" />
                  <span>{meta.label}</span>
                  {!isCal && <span className="count">{counts[k as ListKey]}</span>}
                </button>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 pb-2 shrink-0 ml-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper-deep)] rounded transition-colors cursor-pointer border-none bg-transparent"
              title="Search (⌘K)"
              aria-label="Search"
            >
              <Search size={14} />
            </button>
            <button
              onClick={cycle}
              className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper-deep)] rounded transition-colors cursor-pointer border-none bg-transparent"
              title={`Theme: ${theme} (⌘⇧L)`}
              aria-label="Theme switcher"
            >
              <ThemeIcon size={14} />
            </button>
            <div className="relative">
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper-deep)] rounded transition-colors cursor-pointer border-none bg-transparent"
                title="Settings"
                aria-label="Settings"
              >
                <Settings2 size={14} />
              </button>
              {settingsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSettingsOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded border border-[var(--rule)] bg-[var(--popover)] shadow-lg py-1 text-[12px] font-sans">
                    <button
                      onClick={() => { handleExport(); setSettingsOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper-deep)] text-[var(--ink)] flex items-center gap-2 cursor-pointer border-none bg-transparent"
                    >
                      <Download size={12} />
                      Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Reset everything? This cannot be undone.")) { clearAll(); setSettingsOpen(false); }
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper-deep)] text-[var(--destructive)] flex items-center gap-2 cursor-pointer border-none bg-transparent"
                    >
                      <Trash2 size={12} />
                      Reset all data
                    </button>
                    <div className="my-1 border-t border-[var(--rule)]" />
                    <div className="px-3 py-1 text-[10px] text-[var(--ink-faint)] font-mono">
                      Saved locally.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Pane */}
        {active === "calendar" ? (
          <Calendar
            state={state}
            onFocusItem={(k) => setActive(k)}
            onSchedule={schedule}
            onToggle={toggle}
            onRemove={remove}
          />
        ) : (
          <Pane
            list={active as ListKey}
            items={hydrated ? items : []}
            onToggle={toggle}
            onEdit={edit}
            onRemove={remove}
            onMove={move}
            onSchedule={schedule}
          />
        )}

        {/* Floating omnibar with custom rounded border and enter buttons */}
        <Omnibar onSubmit={handleOmnibarSubmit} activeTab={active} />

        {/* Footer shortcuts (pure visual helpers, non-clickable) */}
        <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-[var(--ink-faint)] font-mono tracking-wide select-none">
          <span><span className="kbd">⌘K</span> search</span>
          <span><span className="kbd">⌘1–5</span> switch</span>
          <span><span className="kbd">/</span> commands</span>
          <span><span className="kbd">⌘⇧L</span> theme</span>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        state={state}
        setActive={setActive}
        onAdd={add}
        cycleTheme={cycle}
      />
    </div>
  );
}
