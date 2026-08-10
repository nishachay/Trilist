import React from "react";
import { Sun, Moon } from "lucide-react";
import type { ListKey } from "@/types";

interface HeaderProps {
  activeTab: ListKey;
  switchTab: (tab: ListKey) => void;
  counts: Record<ListKey, number>;
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
}

const MAIN_TABS: { id: ListKey; label: string }[] = [
  { id: "todo",  label: "Todo"  },
  { id: "watch", label: "Watch" },
  { id: "later", label: "Later" },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  switchTab,
  counts,
  theme,
  setTheme,
  setShowHelp,
}) => {
  return (
    <header className="header">
      <div className="brand" onClick={() => switchTab("todo")} title="Trilist Home">
        <svg className="brand-mark" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="0" y="0"    width="22" height="3.5" rx="1.75" fill="var(--accent)" />
          <rect x="0" y="6.75" width="15" height="3.5" rx="1.75" fill="currentColor" opacity="0.85" />
          <rect x="0" y="13.5" width="9"  height="3.5" rx="1.75" fill="currentColor" opacity="0.50" />
        </svg>
        <span className="brand-name">trilist</span>
      </div>

      <div className="header-center">
        <nav className="tabs">
          {MAIN_TABS.map(t => (
            <button
              key={t.id}
              className="tab"
              data-active={activeTab === t.id}
              onClick={() => switchTab(t.id)}
            >
              {activeTab === t.id && <div className="tab-bg" />}
              <span className="tab-label">
                <span>{t.label}</span>
                {counts[t.id] > 0 && <span className="tab-count">{counts[t.id]}</span>}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="header-right">
        <button
          className="rough-btn"
          data-active={activeTab === "rough"}
          onClick={() => switchTab("rough")}
          title="Rough Scratchpad (Key 0)"
        >
          <span>Rough</span>
          {counts.rough > 0 && <span className="tab-count">{counts.rough}</span>}
        </button>

        <div className="header-divider" />

        <button
          className="tbtn"
          onClick={() => setShowHelp(prev => !prev)}
          title="Help & Preferences (?)"
          aria-label="Help & Preferences"
        >
          ?
        </button>

        <button
          className="tbtn"
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          title="Toggle Dark/Light Theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>
    </header>
  );
};
