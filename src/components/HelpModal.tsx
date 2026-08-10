import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Upload } from "lucide-react";
import type { Cmd } from "@/types";

interface HelpModalProps {
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  accentSwatches: { name: string; color: string }[];
  fontOptions: { label: string; value: string }[];
  priorityCmds: Cmd[];
  listCmds: Cmd[];
  dateCmds: Cmd[];
  handleExportData: () => void;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  showHelp,
  setShowHelp,
  accentColor,
  setAccentColor,
  selectedFont,
  setSelectedFont,
  accentSwatches,
  fontOptions,
  priorityCmds,
  listCmds,
  dateCmds,
  handleExportData,
  handleImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <AnimatePresence>
      {showHelp && (
        <motion.div
          className="help-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHelp(false); }}
        >
          <div className="help-header">
            <p className="help-title">Help &amp; Preferences</p>
            <button
              className="help-close-btn"
              onClick={() => setShowHelp(false)}
              title="Close help (Esc)"
              aria-label="Close help"
            >
              <X size={16} />
            </button>
          </div>

          {/* Customization Options */}
          <div className="help-block">
            <p className="help-section-label">Accent Color</p>
            <div className="help-rule" />
            <div className="swatch-group">
              {accentSwatches.map(s => (
                <button
                  key={s.color}
                  className="swatch-btn"
                  style={{ backgroundColor: s.color }}
                  title={s.name}
                  data-selected={accentColor === s.color}
                  onClick={() => setAccentColor(s.color)}
                />
              ))}
            </div>
          </div>

          <div className="help-block">
            <p className="help-section-label">Typography</p>
            <div className="help-rule" />
            <div className="font-btn-group">
              {fontOptions.map(f => (
                <button
                  key={f.label}
                  className="font-btn"
                  style={{ fontFamily: f.value }}
                  data-selected={selectedFont === f.value}
                  onClick={() => setSelectedFont(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="help-block">
            <p className="help-section-label">Navigation &amp; Task Selection</p>
            <div className="help-rule" />
            {[
              { keys: ["0..3"],        desc: "Switch active tab (0=Rough, 1=Todo…)" },
              { keys: ["j", "k"],      desc: "Navigate task rows up / down" },
              { keys: ["Space"],       desc: "Toggle completion / resolve task" },
              { keys: ["p"],           desc: "Cycle priority (P1 / P2 / P3 / Clear)" },
              { keys: ["x"],           desc: "Delete selected task" },
              { keys: ["•••"],         desc: "Open row context menu (Priority, Move, Edit, Delete)" },
              { keys: ["/"],           desc: "Focus omnibar" },
              { keys: ["?"],           desc: "Toggle this help view" },
              { keys: ["Esc"],         desc: "Blur input / close popovers" },
            ].map(r => (
              <div key={r.keys.join()} className="help-row">
                <div className="help-keys">{r.keys.map(k => <span key={k} className="key">{k}</span>)}</div>
                <span className="help-desc">{r.desc}</span>
              </div>
            ))}
          </div>

          <div className="help-block">
            <p className="help-section-label">Priority tags</p>
            <div className="help-rule" />
            {priorityCmds.map(c => (
              <div key={c.cmd} className="help-row">
                <div className="help-keys">
                  <span className="key">{c.alias}</span>
                  <span className="key-or">or</span>
                  <span className="key">{c.cmd}</span>
                </div>
                <span className="help-desc">{c.desc}</span>
              </div>
            ))}
          </div>

          <div className="help-block">
            <p className="help-section-label">Where tags</p>
            <div className="help-rule" />
            {listCmds.map(c => (
              <div key={c.cmd} className="help-row">
                <div className="help-keys">
                  <span className="key">{c.alias}</span>
                  <span className="key-or">or</span>
                  <span className="key">{c.cmd}</span>
                </div>
                <span className="help-desc">{c.desc}</span>
              </div>
            ))}
          </div>

          <div className="help-block">
            <p className="help-section-label">When tags (available for /watch and /later)</p>
            <div className="help-rule" />
            {dateCmds.map(c => (
              <div key={c.cmd} className="help-row">
                <div className="help-keys">
                  <span className="key">{c.alias}</span>
                  <span className="key-or">or</span>
                  <span className="key">{c.cmd}</span>
                </div>
                <span className="help-desc">{c.desc}</span>
              </div>
            ))}
          </div>

          {/* Data Ownership / Backup */}
          <div className="help-block">
            <p className="help-section-label">Data Ownership &amp; Backup</p>
            <div className="help-rule" />
            <p className="help-desc">All data is stored locally in your browser using non-blocking IndexedDB.</p>
            <div className="backup-actions">
              <button className="backup-btn" onClick={handleExportData}>
                <Download size={13} /> Export Backup (.json)
              </button>
              <button className="backup-btn" onClick={() => fileInputRef.current?.click()}>
                <Upload size={13} /> Import Backup (.json)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImportData}
              />
            </div>
          </div>

          {/* Credits & Philosophy Block */}
          <div className="help-block">
            <p className="help-section-label">Credits &amp; Philosophy</p>
            <div className="help-rule" />

            <p className="inspiration-banner">
              Inspired by Marc Andreessen's{" "}
              <a
                href="https://pmarchive.com/guide_to_personal_productivity.html"
                target="_blank"
                rel="noopener noreferrer"
                className="credits-link"
              >
                Guide to Personal Productivity
              </a>
            </p>

            <div className="credits-card">
              <div className="credits-header">
                <span className="credits-title">Built by</span>
                <span className="credits-name">Nishachay</span>
              </div>

              <div className="credits-links">
                <a
                  href="https://x.com/nishachayy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="credit-pill"
                  title="Follow Nishachay on X (@nishachayy)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>@nishachayy</span>
                </a>

                <a
                  href="https://github.com/nishachay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="credit-pill"
                  title="View Nishachay on GitHub (@nishachay)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                    <path d="M9 18c-4.51 2-5-2-7-2"/>
                  </svg>
                  <span>@nishachay</span>
                </a>

                <a
                  href="mailto:nishachayshelke@gmail.com"
                  className="credit-pill"
                  title="Email Nishachay (nishachayshelke@gmail.com)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span>nishachayshelke@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          <p className="help-note">Press Esc or click outside to close.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
