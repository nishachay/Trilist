import React, { useEffect, useRef, useState } from "react";
import { Check, Download, Upload, X } from "lucide-react";
import type { Cmd } from "@/types";
import { ACTION_CMDS, DATE_CMDS, LIST_CMDS, PRIORITY_CMDS } from "@/lib/commands";
import { ACCENT_SWATCHES, FONT_OPTIONS, type FontKey } from "@/lib/preferences";
import { Button } from "./ui/Button";
import { GLYPH, ICON } from "@/lib/icons";

type Section = "shortcuts" | "commands" | "appearance" | "data";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "shortcuts", label: "Shortcuts" },
  { id: "commands", label: "Commands" },
  { id: "appearance", label: "Appearance" },
  { id: "data", label: "Data" },
];

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  font: FontKey;
  setFont: (font: FontKey) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SHORTCUTS: { keys: string[]; desc: string }[] = [
  { keys: ["1", "2", "3"], desc: "Todo, Watch, Later" },
  { keys: ["0"], desc: "Rough scratchpad" },
  { keys: ["J", "K"], desc: "Move down, up" },
  { keys: ["Space"], desc: "Done, resolve or clear" },
  { keys: ["P"], desc: "Pin to Focus (up to 5)" },
  { keys: ["X"], desc: "Delete, with undo" },
  { keys: ["/"], desc: "Start a command" },
  { keys: ["?"], desc: "Open this window" },
  { keys: ["Esc"], desc: "Close, clear or deselect" },
];

const COMMAND_GROUPS: { label: string; cmds: Cmd[]; note?: (c: Cmd) => string }[] = [
  { label: "Send to", cmds: LIST_CMDS },
  { label: "When", cmds: DATE_CMDS },
  { label: "Priority", cmds: PRIORITY_CMDS, note: c => `P${c.priority} · ${c.desc}` },
  { label: "Actions", cmds: ACTION_CMDS },
];

const XLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GitHubLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

export const HelpDialog: React.FC<HelpDialogProps> = ({
  open,
  onClose,
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  font,
  setFont,
  onExport,
  onImport,
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<Section>("shortcuts");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.getElementById(`help-tab-${section}`)?.focus();
    }
    if (!open && d.open) d.close();
  }, [open, section]);

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = SECTIONS.findIndex(s => s.id === section);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % SECTIONS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + SECTIONS.length) % SECTIONS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = SECTIONS.length - 1;
    else return;
    e.preventDefault();
    setSection(SECTIONS[next].id);
    document.getElementById(`help-tab-${SECTIONS[next].id}`)?.focus();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="help-title"
      onClose={onClose}
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dialog-panel">
        <div className="dialog-head">
          <h2 id="help-title" className="dialog-title">Help &amp; preferences</h2>
          <Button variant="quiet" icon size="sm" onClick={onClose} aria-label="Close">
            <X {...ICON} />
          </Button>
        </div>

        <div className="dialog-tabs segmented" role="tablist" aria-label="Help sections" onKeyDown={onTabKey}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              id={`help-tab-${s.id}`}
              type="button"
              role="tab"
              className="segment"
              aria-selected={section === s.id}
              aria-controls={`help-panel-${s.id}`}
              tabIndex={section === s.id ? 0 : -1}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="dialog-body" role="tabpanel" id={`help-panel-${section}`} aria-labelledby={`help-tab-${section}`}>
          {section === "shortcuts" && (
            <dl className="kv">
              {SHORTCUTS.map(r => (
                <div key={r.desc} className="kv-row">
                  <dt>{r.desc}</dt>
                  <dd className="keys">{r.keys.map(k => <kbd key={k}>{k}</kbd>)}</dd>
                </div>
              ))}
              <div className="kv-row">
                <dt>Edit an item</dt>
                <dd className="keys"><span className="keys-text">Double-click</span></dd>
              </div>
            </dl>
          )}

          {section === "commands" && (
            <div className="stack">
              <p className="lede">
                Type commands anywhere in the input. They become chips, and the rest becomes the item.
              </p>
              {COMMAND_GROUPS.map(g => (
                <section key={g.label} className="group">
                  <h3 className="group-label">{g.label}</h3>
                  <dl className="kv">
                    {g.cmds.map(c => (
                      <div key={c.cmd} className="kv-row">
                        <dt>{g.note ? g.note(c) : c.desc}</dt>
                        <dd className="keys" translate="no">
                          <kbd>{c.alias}</kbd>
                          {c.alias !== c.cmd && <kbd>{c.cmd}</kbd>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <p className="lede">
                Example: <code translate="no">Call the bank /wt /p1</code> adds a high-priority Watch item.
              </p>
            </div>
          )}

          {section === "appearance" && (
            <div className="stack">
              <section className="field">
                <h3 className="group-label" id="theme-label">Theme</h3>
                <div className="segmented" role="radiogroup" aria-labelledby="theme-label">
                  {(["light", "dark"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      className="segment"
                      aria-checked={theme === t}
                      onClick={() => setTheme(t)}
                    >
                      {t === "light" ? "Light" : "Dark"}
                    </button>
                  ))}
                </div>
              </section>

              <section className="field">
                <h3 className="group-label" id="accent-label">Accent</h3>
                <div className="swatches" role="radiogroup" aria-labelledby="accent-label">
                  {ACCENT_SWATCHES.map(s => {
                    const selected = accentColor.toLowerCase() === s.color;
                    return (
                      <button
                        key={s.color}
                        type="button"
                        role="radio"
                        className="swatch"
                        aria-checked={selected}
                        aria-label={s.name}
                        title={s.name}
                        style={{ "--swatch": s.color } as React.CSSProperties}
                        onClick={() => setAccentColor(s.color)}
                      >
                        {selected && <Check {...GLYPH} />}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="field">
                <h3 className="group-label" id="font-label">Typeface</h3>
                <div className="segmented" role="radiogroup" aria-labelledby="font-label">
                  {FONT_OPTIONS.map(f => (
                    <button
                      key={f.key}
                      type="button"
                      role="radio"
                      className="segment"
                      aria-checked={font === f.key}
                      style={{ fontFamily: f.stack }}
                      onClick={() => setFont(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {section === "data" && (
            <div className="stack">
              <section className="field">
                <h3 className="group-label">Backup</h3>
                <p className="lede">
                  Everything stays in this browser. Export a JSON backup to move it or keep it safe.
                </p>
                <div className="row-buttons">
                  <Button onClick={onExport}>
                    <Download {...ICON} />
                    Export backup
                  </Button>
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload {...ICON} />
                    Import backup…
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={e => { onImport(e); e.target.value = ""; }}
                  />
                </div>
                <p className="fine">Importing replaces the items in this browser. You can undo it right after.</p>
              </section>

              <section className="field">
                <h3 className="group-label">About</h3>
                <p className="lede">
                  Based on Marc Andreessen’s{" "}
                  <a href="https://pmarchive.com/guide_to_personal_productivity.html" target="_blank" rel="noopener noreferrer">
                    Guide to Personal Productivity
                  </a>
                  . Built by Nishachay.
                </p>
                <div className="row-buttons">
                  <a className="btn btn-ghost" href="https://x.com/ni5hachay" target="_blank" rel="noopener noreferrer">
                    <XLogo /> @ni5hachay
                  </a>
                  <a className="btn btn-ghost" href="https://github.com/nishachay" target="_blank" rel="noopener noreferrer">
                    <GitHubLogo /> GitHub
                  </a>
                  <a className="btn btn-ghost" href="mailto:nishachayshelke@gmail.com">
                    Email
                  </a>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
