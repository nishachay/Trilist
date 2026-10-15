// One icon system. Sizes mirror the --icon-* tokens in styles/index.css.
//   ICON     16 · 1.5 stroke  inline: menus, slash commands, buttons, disclosure
//   ICON_LG  18 · 1.5 stroke  chrome: header buttons, row "more"
//   GLYPH    12 · 2 stroke    small marks on a filled control: checkbox, chip ×, swatch
//   GLYPH_LG 18 · 2 stroke    the send arrow on the round accent button
// absoluteStrokeWidth keeps the stroke identical at every size.

const base = { absoluteStrokeWidth: true, "aria-hidden": true } as const;

export const ICON = { ...base, size: 16, strokeWidth: 1.5 } as const;
export const ICON_LG = { ...base, size: 18, strokeWidth: 1.5 } as const;
export const GLYPH = { ...base, size: 12, strokeWidth: 2 } as const;
export const GLYPH_LG = { ...base, size: 18, strokeWidth: 2 } as const;
