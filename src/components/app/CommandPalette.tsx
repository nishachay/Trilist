import { useEffect, useMemo, useRef, useState } from "react";
import { LIST_META, itemsFor, type ListKey, type TabKey, type State } from "../../hooks/useStore";

type Cmd =
  | { kind: "jump"; label: string; hint: string; run: () => void }
  | { kind: "action"; label: string; hint: string; run: () => void }
  | { kind: "item"; label: string; hint: string; run: () => void };

export function CommandPalette({
  open, onClose, state, setActive, onAdd, cycleTheme,
}: {
  open: boolean;
  onClose: () => void;
  state: State;
  setActive: (k: TabKey) => void;
  onAdd: (k: ListKey, text: string) => void;
  cycleTheme: () => void;
}) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => inputRef.current?.focus(), 10); } }, [open]);

  const commands: Cmd[] = useMemo(() => {
    const base: Cmd[] = [
      { kind: "jump", label: "Go to Todo", hint: "⌘1", run: () => { setActive("todo"); onClose(); } },
      { kind: "jump", label: "Go to Watch", hint: "⌘2", run: () => { setActive("watch"); onClose(); } },
      { kind: "jump", label: "Go to Later", hint: "⌘3", run: () => { setActive("later"); onClose(); } },
      { kind: "jump", label: "Go to Done", hint: "⌘4", run: () => { setActive("done"); onClose(); } },
      { kind: "jump", label: "Go to Calendar", hint: "⌘5", run: () => { setActive("calendar"); onClose(); } },
      { kind: "action", label: "Toggle theme", hint: "⌘⇧L", run: () => { cycleTheme(); onClose(); } },
    ];
    if (q.trim()) {
      const addTargets: ListKey[] = ["todo", "watch", "later"];
      for (const k of addTargets) {
        base.unshift({
          kind: "action",
          label: `Add "${q.trim()}" to ${LIST_META[k].label}`,
          hint: "Enter",
          run: () => { onAdd(k, q.trim()); setActive(k); onClose(); },
        });
      }
    }
    const items: Cmd[] = [];
    for (const k of ["todo", "watch", "later", "done"] as ListKey[]) {
      for (const it of itemsFor(state, k)) {
        items.push({
          kind: "item",
          label: it.text,
          hint: LIST_META[k].label,
          run: () => { setActive(k); onClose(); },
        });
      }
    }
    const query = q.trim().toLowerCase();
    const all = [...base, ...items];
    if (!query) return all;
    return all.filter((c) => c.label.toLowerCase().includes(query) || c.hint.toLowerCase().includes(query));
  }, [q, state, setActive, onAdd, cycleTheme, onClose]);

  useEffect(() => { setI(0); }, [q]);

  if (!open) return null;

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <div className="px-4 py-3 border-b border-[var(--rule)] flex items-center gap-3">
          <span className="text-[var(--ink-faint)]">⌕</span>
          <input
            ref={inputRef}
            className="plain-input text-[15px]"
            placeholder="Search or type to add…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { e.preventDefault(); onClose(); }
              if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(commands.length - 1, x + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
              if (e.key === "Enter") {
                e.preventDefault();
                const c = commands[i];
                if (c) c.run();
              }
            }}
          />
          <span className="kbd select-none">Esc</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {commands.length === 0 && (
            <div className="px-4 py-6 text-center text-[13px] text-[var(--ink-faint)]">No matches.</div>
          )}
          {commands.slice(0, 40).map((c, idx) => (
            <button
              key={idx}
              onClick={c.run}
              onMouseEnter={() => setI(idx)}
              className="w-full text-left px-4 py-2 flex items-center justify-between gap-3 cursor-pointer border-none"
              style={{ background: idx === i ? "var(--pen-soft)" : "transparent", color: idx === i ? "var(--ink)" : "var(--ink-soft)" }}
            >
              <span className="truncate text-[13px]">
                <span className="mr-2 font-mono text-[10px] uppercase text-[var(--ink-faint)]">{c.kind === "item" ? "·" : c.kind === "jump" ? "→" : "◆"}</span>
                {c.label}
              </span>
              <span className="font-mono text-[10px] text-[var(--ink-faint)] shrink-0">{c.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
