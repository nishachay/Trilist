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
        <svg className="brand-logo" viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M4 6h16M4 12h12M4 18h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span className="brand-title">trilist</span>
      </div>

      <nav className="nav-tabs">
        {MAIN_TABS.map(t => (
          <button
            key={t.id}
            className="tab-btn"
            data-active={activeTab === t.id}
            onClick={() => switchTab(t.id)}
          >
            <span>{t.label}</span>
            {counts[t.id] > 0 && <span className="tab-badge">{counts[t.id]}</span>}
          </button>
        ))}
      </nav>

      <div className="header-right">
        <button
          className="rough-tab-btn"
          data-active={activeTab === "rough"}
          onClick={() => switchTab("rough")}
          title="Rough Scratchpad (Key 0)"
        >
          <span className="rough-label">Rough</span>
          {counts.rough > 0 && <span className="rough-badge">{counts.rough}</span>}
        </button>

        <div className="v-sep" />

        <button
          className="icon-btn"
          onClick={() => setShowHelp(true)}
          title="Help & Preferences (?)"
          aria-label="Help & Preferences"
        >
          <HelpCircle size={15} />
        </button>

        <button
          className="icon-btn"
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
