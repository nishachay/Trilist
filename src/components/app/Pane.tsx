import { useEffect, useState } from "react";
import { LIST_META, type Item, type ListKey } from "../../hooks/useStore";
import { Row } from "./Row";

export function Pane({
  list, items, onToggle, onEdit, onRemove, onMove, onSchedule,
}: {
  list: ListKey;
  items: Item[];
  onToggle: (id: string) => void;
  onEdit: (id: string, t: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, to: ListKey) => void;
  onSchedule: (id: string, dueAt?: number) => void;
}) {
  const [focusIdx, setFocusIdx] = useState<number>(-1);

  // Reset focus when list changes
  useEffect(() => { setFocusIdx(-1); }, [list]);

  // Global-ish keys within pane
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

      if (!inField) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusIdx((i) => Math.min(items.length - 1, (i < 0 ? -1 : i) + 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusIdx((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
          return;
        }
        if (focusIdx >= 0 && focusIdx < items.length) {
          const it = items[focusIdx];
          if (e.key === " ") { e.preventDefault(); handleToggleOrArchive(it); return; }
          if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") { e.preventDefault(); onRemove(it.id); return; }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, focusIdx, onRemove]);

  const handleToggleOrArchive = (it: Item) => {
    if (it.list === "todo" || it.list === "done") onToggle(it.id);
  };

  return (
    <section
      role="tabpanel"
      className="pane p-0 relative flex-1 min-h-0 overflow-y-auto"
    >
      {/* Rows */}
      {items.length === 0 ? (
        <div className="px-6 py-20 text-center select-none">
          <p className="font-serif italic text-[15px] text-[var(--ink-faint)] max-w-md mx-auto">
            {LIST_META[list].empty}
          </p>
        </div>
      ) : (
        <div className="pb-32">
          {items.map((it, i) => (
            <Row
              key={it.id}
              item={it}
              focused={i === focusIdx}
              onFocus={() => setFocusIdx(i)}
              onToggle={() => handleToggleOrArchive(it)}
              onEdit={(t) => onEdit(it.id, t)}
              onDelete={() => onRemove(it.id)}
              onMove={(to) => onMove(it.id, to)}
              onSchedule={(d) => onSchedule(it.id, d)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
