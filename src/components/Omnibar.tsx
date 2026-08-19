import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CornerDownLeft, Flag } from "lucide-react";
import type { Cmd, ExtractedInfo } from "@/types";

interface OmnibarProps {
  input: string;
  setInput: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  extractedList: ExtractedInfo["list"];
  extractedDate: ExtractedInfo["date"];
  extractedPriority: ExtractedInfo["priority"];
  clearTag: (type: "list" | "date" | "priority") => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  visibleCmds: Cmd[];
  enabledCmds: Cmd[];
  disabledSet: Set<string>;
  selIdx: number;
  setSelIdx: (idx: number) => void;
  applyCommand: (cmd: Cmd) => void;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  input,
  setInput,
  handleSubmit,
  inputRef,
  placeholder,
  extractedList,
  extractedDate,
  extractedPriority,
  clearTag,
  menuOpen,
  visibleCmds,
  enabledCmds,
  disabledSet,
  selIdx,
  setSelIdx,
  applyCommand,
}) => {
  // Compute display value inside input element by hiding raw tag tokens when pills are active
  const displayValue = useMemo(() => {
    const words = input.split(" ");
    const rawTags = new Set(
      [extractedList?.raw, extractedDate?.raw, extractedPriority?.raw]
        .filter(Boolean)
        .map(r => r!.toLowerCase())
    );
    if (rawTags.size === 0) return input;
    return words.filter(w => !rawTags.has(w.toLowerCase())).join(" ");
  }, [input, extractedList, extractedDate, extractedPriority]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    const rawTagTokens = [extractedList?.raw, extractedDate?.raw, extractedPriority?.raw]
      .filter(Boolean);

    if (rawTagTokens.length > 0) {
      setInput(newText ? `${rawTagTokens.join(" ")} ${newText}` : `${rawTagTokens.join(" ")}`);
    } else {
      setInput(newText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && displayValue === "") {
      if (extractedPriority) clearTag("priority");
      else if (extractedDate) clearTag("date");
      else if (extractedList) clearTag("list");
    }
  };

  return (
    <div className="omnibar-wrap">
      <form onSubmit={handleSubmit} className="omnibar">
        {extractedList && (
          <span className="pill">
            <span>to {extractedList.label}</span>
            <button type="button" className="pill-x" onClick={() => clearTag("list")}>×</button>
          </span>
        )}

        {extractedDate && (
          <span className="pill">
            <span>{extractedDate.label}</span>
            <button type="button" className="pill-x" onClick={() => clearTag("date")}>×</button>
          </span>
        )}

        {extractedPriority && (
          <span className="pill" data-priority={extractedPriority.level}>
            <Flag
              size={11}
              fill={extractedPriority.level === 1 ? "var(--p1-color)" : extractedPriority.level === 2 ? "var(--p2-color)" : "var(--p3-color)"}
              color={extractedPriority.level === 1 ? "var(--p1-color)" : extractedPriority.level === 2 ? "var(--p2-color)" : "var(--p3-color)"}
            />
            <span>{extractedPriority.label}</span>
            <button type="button" className="pill-x" onClick={() => clearTag("priority")}>×</button>
          </span>
        )}

        <input
          ref={inputRef}
          className="omnibar-input"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />

        <button type="submit" className="enter-btn" title="Add item or switch list (Enter)">
          <CornerDownLeft size={13} />
        </button>
      </form>

      {/* Command Autocomplete Palette Dropdown */}
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
                    title={disabledSet.has(cmd.cmd) ? "Available for /watch and /later" : undefined}
                    onMouseEnter={() => { const i = enabledCmds.indexOf(cmd); if (i !== -1) setSelIdx(i); }}
                    onClick={() => applyCommand(cmd)}
                  >
                    <span className="cmd-label">{cmd.desc}</span>
                    <span className="cmd-alias">{cmd.alias}</span>
                  </div>
                ))}
              </>
            )}
            {visibleCmds.some(c => c.type === "priority") && (
              <>
                <div className="cmd-section">Priority</div>
                {visibleCmds.filter(c => c.type === "priority").map(cmd => (
                  <div
                    key={cmd.cmd}
                    className="cmd-item"
                    data-selected={enabledCmds[selIdx]?.cmd === cmd.cmd}
                    onMouseEnter={() => { const i = enabledCmds.indexOf(cmd); if (i !== -1) setSelIdx(i); }}
                    onClick={() => applyCommand(cmd)}
                  >
                    <span className="cmd-label-wrap">
                      <Flag
                        size={13}
                        fill={cmd.priority === 1 ? "var(--p1-color)" : cmd.priority === 2 ? "var(--p2-color)" : "var(--p3-color)"}
                        color={cmd.priority === 1 ? "var(--p1-color)" : cmd.priority === 2 ? "var(--p2-color)" : "var(--p3-color)"}
                      />
                      <span className="cmd-label">{cmd.desc}</span>
                    </span>
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
    </div>
  );
};
