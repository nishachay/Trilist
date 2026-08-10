import React from "react";
import { HelpCircle, Sun, Moon } from "lucide-react";
import type { ListKey } from "@/types";

interface HeaderProps {
  activeTab: ListKey;
  switchTab: (tab: ListKey) => void;
  counts: Record<ListKey, number>;
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
  setShowHelp: (show: boolean) => void;
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
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h12M4 18h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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
          onClick={() => setShowHelp(true)}
          title="Help & Preferences (?)"
          aria-label="Help & Preferences"
        >
          <HelpCircle size={15} />
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
