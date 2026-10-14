import React from "react";
import { CircleHelp, Moon, Sun } from "lucide-react";
import type { ListKey } from "@/types";
import { Button } from "./ui/Button";

interface HeaderProps {
  activeTab: ListKey;
  switchTab: (tab: ListKey) => void;
  counts: Record<ListKey, number>;
  theme: "dark" | "light";
  toggleTheme: () => void;
  openHelp: () => void;
}

const MAIN_TABS: { id: ListKey; label: string; key: string }[] = [
  { id: "todo",  label: "Todo",  key: "1" },
  { id: "watch", label: "Watch", key: "2" },
  { id: "later", label: "Later", key: "3" },
];

export const Mark: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 22 17" fill="none" aria-hidden="true">
    <rect x="0" y="0"    width="22" height="3.5" rx="1.75" fill="var(--accent)" />
    <rect x="0" y="6.75" width="15" height="3.5" rx="1.75" fill="currentColor" opacity="0.85" />
    <rect x="0" y="13.5" width="9"  height="3.5" rx="1.75" fill="currentColor" opacity="0.5" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, switchTab, counts, theme, toggleTheme, openHelp }) => {
  const onTabKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = MAIN_TABS.findIndex(t => t.id === activeTab);
    const last = MAIN_TABS.length - 1;
    let next = i < 0 ? 0 : i;
    if (e.key === "ArrowRight") next = i >= last ? 0 : i + 1;
    if (e.key === "ArrowLeft") next = i <= 0 ? last : i - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    switchTab(MAIN_TABS[next].id);
    requestAnimationFrame(() => document.getElementById(`tab-${MAIN_TABS[next].id}`)?.focus());
  };

  return (
    <header className="header">
      <a
        className="brand"
        href="/"
        onClick={e => { e.preventDefault(); switchTab("todo"); }}
        aria-label="Trilist, go to Todo"
      >
        <Mark className="brand-mark" />
        <span className="brand-name" translate="no">trilist</span>
      </a>

      <div className="tabs" role="tablist" aria-label="Lists" onKeyDown={onTabKey}>
        {MAIN_TABS.map(t => {
          const selected = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              className="tab"
              aria-selected={selected}
              aria-controls="list-panel"
              tabIndex={selected || (activeTab === "rough" && t.id === "todo") ? 0 : -1}
              onClick={() => switchTab(t.id)}
              title={`${t.label} (${t.key})`}
            >
              {t.label}
              <span className="count">{counts[t.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="tab tab-rough"
          aria-pressed={activeTab === "rough"}
          onClick={() => switchTab(activeTab === "rough" ? "todo" : "rough")}
          title="Rough scratchpad (0)"
        >
          Rough
          <span className="count">{counts.rough}</span>
        </button>
        <Button variant="quiet" icon onClick={openHelp} aria-label="Help and preferences" title="Help and preferences (?)">
          <CircleHelp size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
        </Button>
        <Button
          variant="quiet"
          icon
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          {theme === "dark"
            ? <Sun size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
            : <Moon size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />}
        </Button>
      </div>
    </header>
  );
};
