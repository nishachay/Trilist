// Appearance preferences: accent and typeface. Stored in localStorage.

export const DEFAULT_ACCENT = "#e8542f";

/** Stored values stay hex strings so older saved picks keep working. */
export const ACCENT_SWATCHES = [
  { name: "Coral",   color: "#e8542f" },
  { name: "Violet",  color: "#a855f7" },
  { name: "Blue",    color: "#2997ff" },
  { name: "Green",   color: "#22c55e" },
  { name: "Amber",   color: "#f59e0b" },
] as const;

export type FontKey = "geist" | "inter" | "serif" | "mono";

export const FONT_OPTIONS: { key: FontKey; label: string; stack: string }[] = [
  { key: "geist", label: "Geist", stack: '"Geist Sans", ui-sans-serif, system-ui, sans-serif' },
  { key: "inter", label: "Inter", stack: '"Inter Tight", ui-sans-serif, system-ui, sans-serif' },
  { key: "serif", label: "Serif", stack: '"Newsreader", ui-serif, Georgia, serif' },
  { key: "mono",  label: "Mono",  stack: '"Geist Mono", ui-monospace, SFMono-Regular, monospace' },
];

/**
 * Older builds stored the whole CSS font stack. Map anything we find
 * (key or legacy stack) to a FontKey, defaulting to Geist.
 */
export function normalizeFont(stored: string | null): FontKey {
  if (!stored) return "geist";
  if (FONT_OPTIONS.some(f => f.key === stored)) return stored as FontKey;
  const s = stored.toLowerCase();
  if (s.includes("mono")) return "mono";
  if (s.includes("newsreader") || s.includes("serif\"") || s.startsWith("\"newsreader")) return "serif";
  if (s.includes("inter")) return "inter";
  return "geist";
}

export function fontStack(key: FontKey): string {
  return (FONT_OPTIONS.find(f => f.key === key) ?? FONT_OPTIONS[0]).stack;
}
