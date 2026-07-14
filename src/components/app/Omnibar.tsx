import { useState, useRef, useEffect, useMemo } from "react";
import { Inbox, Eye, Clock, Check, Calendar as CalendarIcon, CornerDownLeft, ChevronRight } from "lucide-react";
import { type ListKey, type TabKey, LIST_META } from "../../hooks/useStore";
import { startOfDay } from "../../lib/date";

type SlashCommand = {
  type: "todo" | "anti-todo" | "watch" | "later" | "calendar";
  label: string;
  desc: string;
  icon: any;
};

const COMMANDS: SlashCommand[] = [
  { type: "todo",      label: "/todo",      desc: "Add to Todo backlog", icon: Inbox },
  { type: "anti-todo", label: "/anti-todo", desc: "Log distraction avoided / quick win today", icon: Check },
  { type: "watch",     label: "/watch",     desc: "Add to Watch list (waiting/reminders)", icon: Eye },
  { type: "later",     label: "/later",     desc: "Add to Later list (someday/maybe)", icon: Clock },
  { type: "calendar",  label: "/calendar",  desc: "Schedule for today's date", icon: CalendarIcon },
];

export type Parsed = {
  text: string;
  list: ListKey;
  dueAt?: number;
};

// Parser supporting prefix and suffix slash commands
export function parseInput(input: string, activeTab: TabKey): Parsed | null {
  const raw = input.trim();
  if (!raw) return null;

  // 1. Try prefix commands (e.g. "/todo buy milk")
  const prefixMatch = raw.match(/^\/([a-zA-Z\-]+)\s+(.+)$/i);
  if (prefixMatch) {
    const cmd = prefixMatch[1].toLowerCase();
    const body = prefixMatch[2].trim();
    if (body) {
      if (cmd === "todo") return { text: body, list: "todo" };
      if (cmd === "anti-todo" || cmd === "anti") return { text: body, list: "done" };
      if (cmd === "watch") return { text: body, list: "watch" };
      if (cmd === "later") return { text: body, list: "later" };
      if (cmd === "calendar") {
        return { text: body, list: "todo", dueAt: startOfDay(new Date()).getTime() };
      }
    }
  }

  // 2. Try suffix commands (e.g. "buy milk /todo")
  const suffixMatch = raw.match(/^(.+)\s+\/([a-zA-Z\-]+)$/i);
  if (suffixMatch) {
    const body = suffixMatch[1].trim();
    const cmd = suffixMatch[2].toLowerCase();
    if (body) {
      if (cmd === "todo") return { text: body, list: "todo" };
      if (cmd === "anti-todo" || cmd === "anti") return { text: body, list: "done" };
      if (cmd === "watch") return { text: body, list: "watch" };
      if (cmd === "later") return { text: body, list: "later" };
      if (cmd === "calendar") {
        return { text: body, list: "todo", dueAt: startOfDay(new Date()).getTime() };
      }
    }
  }

  // 3. Fallback: default to current tab list
  if (activeTab === "calendar") {
    return { text: raw, list: "todo" };
  }
  return { text: raw, list: activeTab as ListKey };
}

export function Omnibar({
  onSubmit,
  activeTab,
}: {
  onSubmit: (parsed: Parsed) => void;
  activeTab: TabKey;
}) {
  const [value, setValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount + global '/' key trigger
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !inField) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Watch input value changes to detect typing slash commands
  useEffect(() => {
    const trimmed = value.replace(/\s+$/, "");
    const match = trimmed.match(/(?:^|\s)\/([a-zA-Z\-]*)$/);
    if (match) {
      setSlashMenuOpen(true);
      setSlashQuery(match[1].toLowerCase());
    } else {
      setSlashMenuOpen(false);
      setSlashQuery("");
    }
    setSelectedIndex(0);
  }, [value]);

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return COMMANDS;
    return COMMANDS.filter((cmd) => cmd.type.startsWith(slashQuery));
  }, [slashQuery]);

  const preview = useMemo(() => {
    return parseInput(value, activeTab);
  }, [value, activeTab]);

  const executeSelectedCommand = () => {
    const cmd = filteredCommands[selectedIndex];
    if (!cmd) return;
    
    // Replace the slash token with command name
    const replaced = value.replace(/(?:^|\s)\/([a-zA-Z\-]*)$/, ` /${cmd.type} `);
    setValue(replaced.trimStart());
    setSlashMenuOpen(false);
    inputRef.current?.focus();
  };

  const submit = () => {
    const parsed = parseInput(value, activeTab);
    if (parsed) {
      onSubmit(parsed);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (slashMenuOpen && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Tab") {
        e.preventDefault();
        executeSelectedCommand();
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeSelectedCommand();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenuOpen(false);
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    }
  };

  // Compute clean destination label based on command preview
  const previewDestLabel = useMemo(() => {
    if (!preview) return "";
    if (preview.dueAt) return "calendar";
    if (preview.list === "done") return "done";
    return LIST_META[preview.list]?.label?.toLowerCase() || preview.list;
  }, [preview]);

  return (
    <div className="omnibar-wrap select-none">
      
      {/* Opaque Upward Slash Command Menu (Vertical List matching our old version) */}
      {slashMenuOpen && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-3 bg-[var(--card)] border border-[var(--rule-strong)] rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden z-50 py-1 font-sans">
          <div className="px-4 py-2 text-[9px] font-bold text-[var(--ink-faint)] uppercase tracking-wider border-b border-[var(--rule)] mb-1 select-none">
            Select Command
          </div>
          <ul className="p-1 max-h-[250px] overflow-y-auto">
            {filteredCommands.map((cmd, i) => {
              const Icon = cmd.icon;
              const isSelected = i === selectedIndex;
              
              return (
                <li 
                  key={cmd.type}
                  onClick={() => {
                    setSelectedIndex(i);
                    setTimeout(executeSelectedCommand, 0);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors cursor-pointer ${
                    isSelected ? "bg-[var(--pen-soft)] text-[var(--ink)]" : "text-[var(--ink-soft)] hover:bg-[var(--paper-deep)] hover:text-[var(--ink)]"
                  }`}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                    isSelected ? "bg-[var(--pen)] text-[var(--primary-foreground)]" : "bg-[var(--paper-deep)] text-[var(--ink-soft)]"
                  }`}>
                    <Icon size={12} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{cmd.label}</span>
                    <span className="text-[10px] text-[var(--ink-faint)] font-medium">{cmd.desc}</span>
                  </div>
                  {isSelected && (
                    <span className="ml-auto text-[9px] font-mono font-bold text-[var(--pen)] bg-[var(--pen-soft)] px-1.5 py-0.5 rounded">
                      ENTER / TAB
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Input container */}
      <div className="omnibar-custom">
        <ChevronRight size={16} className="text-[var(--ink-faint)] mr-1 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          className="plain-input text-[14px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="commit from here /todo or /anti-todo or /watch or /calendar"
          autoComplete="off"
          spellCheck={false}
          aria-label="Add item or command"
        />
        
        {/* Destination preview and Enter button */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          {preview && (
            <span className="font-mono text-[10px] text-[var(--ink-soft)] bg-[var(--paper-deep)] border border-[var(--rule-strong)] px-2 py-0.5 rounded">
              → {previewDestLabel}
            </span>
          )}
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="px-2.5 py-1 bg-[var(--paper-deep)] hover:bg-[var(--rule)] disabled:opacity-40 disabled:hover:bg-[var(--paper-deep)] text-[var(--ink-soft)] rounded border border-[var(--rule-strong)] text-[10px] font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>Enter</span>
            <CornerDownLeft size={10} className="opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
}
