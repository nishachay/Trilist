import React from "react";
import { CircleHelp, Moon, Sun } from "lucide-react";
import type { ListKey } from "@/types";
import { Button } from "./ui/Button";
import { ICON_LG } from "@/lib/icons";

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

/**
 * The trilist mark: three bars stepping 1 : 0.68 : 0.38, the top one in the
 * accent. Bars are flush on the left and round on the right, with tight
 * gaps, so it reads as one glyph rather than a menu icon. Its box is
 * Geist's cap height (0.71em) tall, so baseline-aligned it shares the
 * wordmark's baseline and cap line.
 */
const bar = (y: number, w: number) =>
  `M0 ${y + 1}a1 1 0 0 1 1-1H${w - 2}a2 2 0 0 1 0 4H1a1 1 0 0 1-1-1z`;

export const Mark: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 17.5 14.2" fill="none" aria-hidden="true">
    <path d={bar(0, 17.5)} fill="var(--accent)" />
    <path d={bar(5.1, 12)} fill="currentColor" opacity="0.8" />
    <path d={bar(10.2, 6.75)} fill="currentColor" opacity="0.42" />
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
        <span className="brand-lockup">
          <Mark className="brand-mark" />
          <span className="brand-name" translate="no">trilist</span>
        </span>
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
          <CircleHelp {...ICON_LG} />
        </Button>
        <Button
          variant="quiet"
          icon
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          {theme === "dark" ? <Sun {...ICON_LG} /> : <Moon {...ICON_LG} />}
        </Button>
      </div>
    </header>
  );
};
