import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { itemsFor, type Item, type ListKey, type State, LIST_META } from "../../hooks/useStore";
import { sameDay, startOfDay } from "../../lib/date";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function Calendar({
  state, onFocusItem, onSchedule, onToggle, onRemove,
}: {
  state: State;
  onFocusItem: (list: ListKey) => void;
  onSchedule: (id: string, dueAt?: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (inField) return;
      if (e.key === "ArrowLeft") { setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)); }
      if (e.key === "ArrowRight") { setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1)); }
      if (e.key.toLowerCase() === "t") { setCursor(startOfDay(new Date())); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const allItems: (Item & { listKey: ListKey })[] = useMemo(() => {
    const out: (Item & { listKey: ListKey })[] = [];
    for (const k of ["todo", "watch", "later", "done"] as ListKey[]) {
      for (const it of itemsFor(state, k)) out.push({ ...it, listKey: k });
    }
    return out.filter((it) => it.dueAt);
  }, [state]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof allItems>();
    for (const it of allItems) {
      const d = new Date(it.dueAt!);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [allItems]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startDow);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    cells.push(d);
  }
  const today = startOfDay(new Date());

  const selectedItems = selected != null ? (allItems.filter((it) => sameDay(it.dueAt!, selected))) : [];

  return (
    <section className="cal" role="tabpanel">
      <div className="cal-header select-none">
        <div className="cal-title">
          <span className="font-serif text-[20px] text-[var(--ink)]">{MONTHS[month]}</span>
          <span className="font-mono text-[12px] text-[var(--ink-faint)]">{year}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="cal-btn cursor-pointer" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
            <ChevronLeft size={14} />
          </button>
          <button className="cal-btn text-[12px] px-3 cursor-pointer" onClick={() => setCursor(startOfDay(new Date()))}>
            Today
          </button>
          <button className="cal-btn cursor-pointer" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="cal-dow select-none">
        {DOW.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const isToday = sameDay(d.getTime(), today.getTime());
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const items = byDay.get(key) ?? [];
          const isSel = selected != null && sameDay(d.getTime(), selected);
          return (
            <button
              key={i}
              className="cal-cell"
              data-in-month={inMonth}
              data-today={isToday}
              data-selected={isSel}
              onClick={() => setSelected(d.getTime())}
            >
              <div className="cal-num select-none">{d.getDate()}</div>
              <div className="cal-chips select-none">
                {items.slice(0, 3).map((it) => (
                  <div key={it.id} className="cal-chip" title={it.text}>
                    <span className="cal-dot" data-list={it.listKey} />
                    <span className="truncate">{it.text}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="cal-more">+{items.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected != null && (
        <div className="cal-sheet" onClick={() => setSelected(null)}>
          <div className="cal-sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cal-sheet-head">
              <div>
                <div className="font-serif text-[17px] text-[var(--ink)]">
                  {new Date(selected).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div className="font-mono text-[11px] text-[var(--ink-faint)] uppercase tracking-wider">
                  {selectedItems.length} scheduled
                </div>
              </div>
              <button className="cal-btn cursor-pointer" onClick={() => setSelected(null)} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            {selectedItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-[var(--ink-faint)] font-serif italic">
                Nothing scheduled for this day.
              </div>
            ) : (
              <ul className="cal-sheet-list">
                {selectedItems.map((it) => (
                  <li key={it.id} className="cal-sheet-item">
                    <span className="cal-dot" data-list={it.listKey} />
                    <span className="flex-1 text-[14px]">{it.text}</span>
                    <span className="font-mono text-[10px] text-[var(--ink-faint)] uppercase">{LIST_META[it.listKey].label}</span>
                    <div className="flex items-center gap-1">
                      <button className="cal-btn text-[11px] px-2 cursor-pointer" onClick={() => { onFocusItem(it.listKey); setSelected(null); }}>Open</button>
                      <button className="cal-btn text-[11px] px-2 cursor-pointer" onClick={() => onSchedule(it.id, undefined)}>Unschedule</button>
                      {(it.listKey === "todo" || it.listKey === "done") && (
                        <button className="cal-btn text-[11px] px-2 cursor-pointer" onClick={() => onToggle(it.id)}>
                          {it.listKey === "done" ? "Untick" : "Tick"}
                        </button>
                      )}
                      <button className="cal-btn text-[11px] px-2 text-[var(--destructive)] cursor-pointer" onClick={() => onRemove(it.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
