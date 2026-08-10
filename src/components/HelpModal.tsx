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
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
        >
          <div className="help-content">
            <div className="help-header">
              <span className="help-title">Help &amp; Preferences</span>
              <button
                className="help-close"
                onClick={() => setShowHelp(false)}
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            <div className="help-grid">
              {/* Left Column: Visual Customization */}
              <div className="help-block">
                <p className="help-section-label">Accent Swatches</p>
                <div className="help-rule" />
                <div className="accent-swatch-row">
                  {accentSwatches.map(s => (
                    <button
                      key={s.name}
                      className="swatch-btn"
                      style={{ background: s.color }}
                      data-active={accentColor === s.color}
                      onClick={() => setAccentColor(s.color)}
                      title={s.name}
                    />
                  ))}
                </div>

                <p className="help-section-label" style={{ marginTop: "24px" }}>Typography</p>
                <div className="help-rule" />
                <div className="font-selector-col">
                  {fontOptions.map(f => (
                    <button
                      key={f.label}
                      className="font-opt-btn"
                      data-active={selectedFont === f.value}
                      onClick={() => setSelectedFont(f.value)}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Shortcuts & Commands */}
              <div>
                <div className="help-block">
                  <p className="help-section-label">Navigation &amp; Task Selection</p>
                  <div className="help-rule" />
                  {[
                    { keys: ["0..3"], desc: "Switch active tab (0=Rough, 1=Todo…)" },
                    { keys: ["j", "k"], desc: "Navigate task rows up / down" },
                    { keys: ["Space"], desc: "Toggle completion / resolve task" },
                    { keys: ["p"], desc: "Cycle priority (P1 / P2 / P3 / Clear)" },
                    { keys: ["x", "d"], desc: "Delete selected task" },
                    { keys: ["•••"], desc: "Open row context menu (Priority, Move, Edit, Delete)" },
                    { keys: ["/"], desc: "Focus omnibar" },
                    { keys: ["?"], desc: "Toggle this help view" },
                    { keys: ["Esc"], desc: "Blur input / close popovers" },
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
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
