# Trilist

Trilist is a minimalist, keyboard-driven productivity app based on Marc Andreessen's classic 3x5 index card system from his essay, [Guide to Personal Productivity](https://pmarchive.com/guide_to_personal_productivity.html).

It provides a clean, distraction-free environment to manage your daily commitments, track items on your radar, and defer future work without getting bogged down in complex project management tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

![Trilist Dark Mode](public/mockup-dark.png#gh-dark-mode-only)
![Trilist Light Mode](public/mockup-light.png#gh-light-mode-only)

---

## The Philosophy

Traditional to-do apps encourage accumulating giant, overwhelming lists that grow forever. Trilist keeps you focused by structuring your workflow into three active lists plus a scratchpad:

1. **Todo**: Your core commitments for today. Aim to keep this list short (3 to 5 items max).
2. **Watch**: Things you are keeping an eye on, waiting for someone else to respond to, or tracking over time.
3. **Later**: Deferred items to review in future weeks or months.
4. **Rough**: A scratchpad for quick notes, brain dumps, and unverified ideas.

---

## Core Features

- **Inline Tag Routing**: Type `/wt` or `/lt` anywhere in your text input to route items to different lists without breaking your flow.
- **Priority Flags System**: Assign priority tags `/p1` (High Red), `/p2` (Medium Amber), or `/p3` (Low Blue) using Lucide SVG vector flags. Active lists automatically sort items by priority.
- **Relative Scheduling**: Combine `/lt` with `/wk` (1 week) or `/mn` (1 month) to defer tasks to specific time windows.
- **Keyboard Navigation**: Move through your lists using `0-3` for tab switching, `j` and `k` for item navigation, `Space` for completion, `p` to cycle priority, and `Esc` for instant dismissal.
- **Custom Design System**: Full support for system dark/light modes, 5 custom accent color swatches, and 4 font options (Geist, JetBrains Mono, Inter Tight, and Newsreader).
- **Per-Item Actions**: Inline text editing via double-click or hover action, instant list migration popovers, interactive priority popovers, relative time-ago timestamps, and one-click clear completed actions.
- **Local Data Privacy**: All data is saved asynchronously to IndexedDB inside your browser. No external tracking, no cloud lock-in, and full JSON export/import support.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Vanilla CSS Design Tokens
- **Animations**: Motion (`motion/react`)
- **Icons**: Lucide React (100% Unified Vector Icon System)
- **Storage Engine**: Native IndexedDB API
- **Linter**: Oxlint

---

## Quick Start

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Nishachay/Trilist.git

# 2. Change directory
cd Trilist

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

- `npm run dev`: Starts the local Vite dev server.
- `npm run build`: Runs TypeScript compilation (`tsc -b`) and Vite production bundle.
- `npm run lint`: Runs Oxlint for fast code analysis.
- `npm run preview`: Previews the production build locally.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `0` | Switch to **Rough** scratchpad |
| `1` | Switch to **Todo** list |
| `2` | Switch to **Watch** list |
| `3` | Switch to **Later** list |
| `/` | Open command palette or focus input |
| `?` | Open Help and Preferences overlay |
| `j` / `k` | Navigate items up or down |
| `Space` | Toggle completion on selected task |
| `p` | Cycle priority (`P1` → `P2` → `P3` → `Clear`) |
| `x` or `d` | Delete or resolve selected task |
| `Enter` | Submit task to active or tagged list |
| `Esc` | Close overlay, popover, or clear input |

---

## Command Tags

### Destination Tags
- `/todo` or `/td`: Route task to **Todo**
- `/watch` or `/wt`: Route task to **Watch**
- `/later` or `/lt`: Route task to **Later**
- `/rough` or `/rg`: Route task to **Rough**

### Priority Tags
- `/p1` or `/high`: High Priority (Vibrant Red)
- `/p2` or `/med`: Medium Priority (Amber Gold)
- `/p3` or `/low`: Low Priority (Electric Blue)

### Date Tags (Requires `/lt`)
- `/week` or `/wk`: Defer task for 7 days
- `/month` or `/mn`: Defer task for 30 days

---

## Credits & Inspiration

This project is inspired by Marc Andreessen's 2007 essay, [Guide to Personal Productivity](https://pmarchive.com/guide_to_personal_productivity.html).

---

## License

MIT License. Free to use, modify, and distribute.
