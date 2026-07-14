import { useEffect, useRef, useState } from "react";
import { CalendarPlus, MoreHorizontal, Pencil, Trash2, ArrowRight } from "lucide-react";
import type { Item, ListKey } from "../../hooks/useStore";
import { relLabel, startOfDay } from "../../lib/date";

export function Row({
  item, focused, onFocus, onToggle, onEdit, onDelete, onMove, onSchedule,
}: {
  item: Item;
  focused: boolean;
  onFocus: () => void;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onMove: (to: ListKey) => void;
  onSchedule: (dueAt?: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { if (focused && !editing) rowRef.current?.focus(); }, [focused, editing]);
  useEffect(() => setDraft(item.text), [item.text]);

  const commit = () => {
    const t = draft.trim();
    if (!t) { onDelete(); return; }
    if (t !== item.text) onEdit(t);
    setEditing(false);
  };

  const tickable = item.list === "todo" || item.list === "done";
  const done = item.list === "done";

  const time = item.doneAt
    ? new Date(item.doneAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

  const setToday = () => { const d = startOfDay(new Date()); onSchedule(d.getTime()); setMenuOpen(false); };
  const setTomorrow = () => { const d = startOfDay(new Date()); d.setDate(d.getDate() + 1); onSchedule(d.getTime()); setMenuOpen(false); };
  const setNextWeek = () => { const d = startOfDay(new Date()); d.setDate(d.getDate() + 7); onSchedule(d.getTime()); setMenuOpen(false); };

  return (
    <div
      ref={rowRef}
      className="row group"
      data-focused={focused}
      tabIndex={-1}
      onClick={onFocus}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", item.id); e.dataTransfer.effectAllowed = "move"; }}
    >
      {tickable ? (
        <button
          className="tick"
          data-checked={done}
          aria-label={done ? "Uncheck" : "Mark done"}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5L4.8 9L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary-foreground)" }} />
          </svg>
        </button>
      ) : (
        <span className="tick" style={{ opacity: 0.4, cursor: "default", borderStyle: "dashed" }} aria-hidden />
      )}

      {editing ? (
        <input
          ref={inputRef}
          className="plain-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { setDraft(item.text); setEditing(false); }
          }}
        />
      ) : (
        <div
          className={`flex-1 min-w-0 text-[14px] leading-snug truncate ${done ? "text-done" : ""}`}
          onDoubleClick={() => setEditing(true)}
        >
          {item.text}
        </div>
      )}

      {item.dueAt && !done && (
        <span className="date-badge select-none" title={new Date(item.dueAt).toDateString()}>
          <CalendarPlus size={10} />
          {relLabel(item.dueAt)}
        </span>
      )}

      {done && time && (
        <span className="font-mono text-[10px] text-[var(--ink-faint)] tabular-nums select-none">{time}</span>
      )}

      <div className="relative select-none">
        <button
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[var(--ink-faint)] hover:text-[var(--ink)] p-1 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          aria-label="More"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div
              className="absolute right-0 top-full mt-1 z-20 w-52 rounded-md border border-[var(--rule)] bg-[var(--popover)] shadow-lg py-1 text-[13px] font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem icon={<Pencil size={12} />} onClick={() => { setEditing(true); setMenuOpen(false); }}>Edit</MenuItem>
              <div className="my-1 border-t border-[var(--rule)]" />
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] font-mono">Schedule</div>
              <MenuItem icon={<CalendarPlus size={12} />} onClick={setToday}>Today</MenuItem>
              <MenuItem icon={<CalendarPlus size={12} />} onClick={setTomorrow}>Tomorrow</MenuItem>
              <MenuItem icon={<CalendarPlus size={12} />} onClick={setNextWeek}>In a week</MenuItem>
              {item.dueAt && (
                <MenuItem onClick={() => { onSchedule(undefined); setMenuOpen(false); }}>Clear date</MenuItem>
              )}
              <div className="my-1 border-t border-[var(--rule)]" />
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] font-mono">Move to</div>
              {(["todo","watch","later"] as ListKey[]).filter((k) => k !== item.list).map((k) => (
                <MenuItem key={k} icon={<ArrowRight size={12} />} onClick={() => { onMove(k); setMenuOpen(false); }}>{cap(k)}</MenuItem>
              ))}
              <div className="my-1 border-t border-[var(--rule)]" />
              <MenuItem icon={<Trash2 size={12} />} danger onClick={() => { onDelete(); setMenuOpen(false); }}>Delete</MenuItem>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }

function MenuItem({ children, onClick, danger, icon }: { children: React.ReactNode; onClick: () => void; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 hover:bg-[var(--paper-deep)] flex items-center gap-2 cursor-pointer border-none bg-transparent ${danger ? "text-[var(--destructive)]" : "text-[var(--ink)]"}`}
    >
      {icon}
      {children}
    </button>
  );
}
