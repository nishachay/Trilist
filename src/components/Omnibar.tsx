import React, { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUp,
  CalendarDays,
  CalendarRange,
  Calendar,
  CheckCheck,
  CircleCheck,
  CircleHelp,
  Clock,
  Eye,
  Flag,
  PenLine,
  Pin,
  X,
} from "lucide-react";
import type { Cmd, ExtractedInfo } from "@/types";
import { CMD_GROUPS } from "@/lib/commands";
import { Button } from "./ui/Button";

interface OmnibarProps {
  input: string;
  setInput: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  extracted: ExtractedInfo;
  clearTag: (type: "list" | "date" | "priority" | "action") => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  visibleCmds: Cmd[];
  selIdx: number;
  setSelIdx: React.Dispatch<React.SetStateAction<number>>;
  applyCommand: (cmd: Cmd) => void;
}

const ICON = { size: 16, strokeWidth: 1.5, absoluteStrokeWidth: true, "aria-hidden": true } as const;

function cmdIcon(cmd: Cmd) {
  switch (cmd.cmd) {
    case "/todo": return <CircleCheck {...ICON} />;
    case "/watch": return <Eye {...ICON} />;
    case "/later": return <Clock {...ICON} />;
    case "/rough": return <PenLine {...ICON} />;
    case "/week": return <Calendar {...ICON} />;
    case "/nextweek": return <CalendarDays {...ICON} />;
    case "/month": return <CalendarRange {...ICON} />;
    case "/pin": return <Pin {...ICON} />;
    case "/did": return <CheckCheck {...ICON} />;
    case "/help": return <CircleHelp {...ICON} />;
    default: return <Flag {...ICON} />;
  }
}

const optionId = (cmd: Cmd) => `cmd-${cmd.cmd.slice(1)}`;

export const Omnibar: React.FC<OmnibarProps> = ({
  input,
  setInput,
  handleSubmit,
  inputRef,
  placeholder,
  extracted,
  clearTag,
  menuOpen,
  setMenuOpen,
  visibleCmds,
  selIdx,
  setSelIdx,
  applyCommand,
}) => {
  const { list, date, priority, pin, did } = extracted;
  const rawTags = useMemo(
    () => [list?.raw, date?.raw, priority?.raw, pin?.raw, did?.raw].filter(Boolean) as string[],
    [list, date, priority, pin, did],
  );

  // Recognised tags render as chips; the field shows only the remaining words.
  const displayValue = useMemo(() => {
    if (rawTags.length === 0) return input;
    const lowered = new Set(rawTags.map(r => r.toLowerCase()));
    return input.split(" ").filter(w => !lowered.has(w.toLowerCase())).join(" ");
  }, [input, rawTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (rawTags.length > 0) setInput(next ? `${rawTags.join(" ")} ${next}` : rawTags.join(" "));
    else setInput(next);
  };

  const showMenu = menuOpen && visibleCmds.length > 0;
  // Options in the order they render (grouped), so arrow keys follow the eye.
  const ordered = useMemo(
    () => CMD_GROUPS.flatMap(g => visibleCmds.filter(c => c.type === g.type)),
    [visibleCmds],
  );
  const active = showMenu ? ordered[Math.min(selIdx, ordered.length - 1)] : undefined;

  // An exact command or alias ("/h") wins over prefix matches ("/high").
  const query = input.split(" ").pop()?.toLowerCase() ?? "";
  const exactIdx = ordered.findIndex(c => c.cmd === query || c.alias === query);
  useEffect(() => {
    if (exactIdx > 0) setSelIdx(exactIdx);
  }, [exactIdx, setSelIdx]);

  useEffect(() => {
    if (active) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMenu) {
      const n = ordered.length;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx(i => (Math.min(i, n - 1) + 1) % n); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelIdx(i => (Math.min(i, n - 1) - 1 + n) % n); return; }
      if ((e.key === "Enter" || e.key === "Tab") && active) { e.preventDefault(); applyCommand(active); return; }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); return; }
    }
    if (e.key === "Backspace" && displayValue === "" && (e.currentTarget.selectionStart ?? 0) === 0) {
      if (priority) clearTag("priority");
      else if (date) clearTag("date");
      else if (list) clearTag("list");
      else if (pin || did) clearTag("action");
    }
  };

  const chips: { key: string; label: string; clear: () => void; priority?: number }[] = [];
  if (list) chips.push({ key: "list", label: `To ${list.label}`, clear: () => clearTag("list") });
  if (date) chips.push({ key: "date", label: date.label, clear: () => clearTag("date") });
  if (priority) chips.push({ key: "priority", label: priority.label, priority: priority.level, clear: () => clearTag("priority") });
  if (pin) chips.push({ key: "pin", label: "Pin", clear: () => clearTag("action") });
  if (did) chips.push({ key: "did", label: "Done today", clear: () => clearTag("action") });

  // Ready only once there is real text, not just a half-typed command.
  const hasText = extracted.cleanText.split(" ").some(w => w && !w.startsWith("/"));

  return (
    <div className="dock">
      <div className="dock-inner">
        <AnimatePresence>
          {showMenu && (
            <motion.div
              className="cmd-menu"
              id="cmd-menu"
              role="listbox"
              aria-label="Commands"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
              onMouseDown={e => e.preventDefault()}
            >
              {CMD_GROUPS.map(g => {
                const items = visibleCmds.filter(c => c.type === g.type);
                if (items.length === 0) return null;
                return (
                  <div key={g.type} role="group" aria-labelledby={`grp-${g.type}`} className="cmd-group">
                    <div className="cmd-heading" id={`grp-${g.type}`}>{g.label}</div>
                    {items.map(cmd => (
                      <div
                        key={cmd.cmd}
                        id={optionId(cmd)}
                        role="option"
                        aria-selected={active?.cmd === cmd.cmd}
                        className="cmd-item"
                        data-priority={cmd.priority}
                        onMouseMove={() => { const i = ordered.indexOf(cmd); if (i !== selIdx) setSelIdx(i); }}
                        onClick={() => applyCommand(cmd)}
                      >
                        <span className="cmd-icon">{cmdIcon(cmd)}</span>
                        <span className="cmd-label">
                          {cmd.type === "priority" ? `P${cmd.priority} · ${cmd.desc}` : cmd.desc}
                        </span>
                        <span className="cmd-alias" translate="no">{cmd.alias}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="omnibar" onClick={() => inputRef.current?.focus()}>
          {chips.length > 0 && (
            <span className="chips">
              {chips.map(c => (
                <span key={c.key} className="chip" data-priority={c.priority}>
                  {c.label}
                  <button
                    type="button"
                    className="chip-x"
                    aria-label={`Remove ${c.label}`}
                    onClick={e => { e.stopPropagation(); c.clear(); }}
                  >
                    <X size={12} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                  </button>
                </span>
              ))}
            </span>
          )}

          <input
            ref={inputRef}
            className="omnibar-input"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={chips.length ? "" : placeholder}
            aria-label="New item. Type / for commands."
            role="combobox"
            aria-expanded={showMenu}
            aria-controls="cmd-menu"
            aria-autocomplete="list"
            aria-activedescendant={active ? optionId(active) : undefined}
            autoComplete="off"
            enterKeyHint="done"
          />

          {!hasText && !showMenu && chips.length === 0 && (
            <span className="omnibar-hint" aria-hidden="true">
              <kbd>/</kbd> commands
            </span>
          )}

          <Button
            type="submit"
            variant={hasText ? "solid" : "ghost"}
            icon
            className="send"
            aria-label="Add item"
            title="Add (Enter)"
          >
            <ArrowUp size={16} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
};
