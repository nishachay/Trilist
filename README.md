# Trilist

A minimalist, keyboard-driven productivity app based on Marc Andreessen's classic 3x5 index card system.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite 6](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-ff6b4a.svg)](https://oxc.rs/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

![Trilist Dark Mode](public/trilist-darkmode.png#gh-dark-mode-only)
![Trilist Light Mode](public/trilist-lightmode.png#gh-light-mode-only)

---

## Table of contents

- [Motivation](#motivation)
- [The 3-list system](#the-3-list-system)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Inline tags](#inline-tags)
- [Data privacy](#data-privacy)
- [Testing](#testing)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

---

## Motivation

Most task management apps encourage giant backlogs. You create dozens of lists, tag everything, and watch tasks pile up until you abandon the app.

Trilist limits your focus to 3 to 5 tasks a day.

Inspired by Marc Andreessen's essay, [Guide to Personal Productivity](https://pmarchive.com/guide_to_personal_productivity.html), Trilist brings physical 3x5 index card habits to a fast web app.

---

## The 3-list system

1. **Todo**: Core commitments for today. Capped at 3 to 5 items.
2. **Watch**: Radar items, including replies you're waiting on or projects you're tracking.
3. **Later**: Tasks scheduled for future weeks or months.
4. **Rough**: A scratchpad for quick notes and unverified ideas.

---

## Features

- **Inline tag routing**: Route tasks while typing using `/td`, `/wt`, `/lt`, or `/rg` in the omnibar.
- **Priority flags**: Set priority with `/p1` (High Red), `/p2` (Medium Amber), or `/p3` (Low Blue). Flags align along the right margin.
- **Relative scheduling**: Combine `/lt` with `/wk` (1 week) or `/mn` (1 month) to defer tasks to future dates.
- **Context menu (`...`)**: Right-aligned 3-dots menu for priority shifts, list moves, editing, and deletion.
- **Themes & typography**: Light and dark themes, 5 accent colors, and 4 fonts (Geist, JetBrains Mono, Inter Tight, Newsreader).
- **Offline local storage**: Data stays in your browser using IndexedDB. Includes JSON export and import backups.

---

## Tech stack

- **Framework**: React 19 + TypeScript
- **Build tool**: Vite 6
- **Styling**: Vanilla CSS with design tokens
- **Animations**: Motion (`motion/react`)
- **Icons**: Lucide React
- **Database**: Browser IndexedDB API
- **Linter**: Oxlint

---

## Quick start

### Prerequisites

- Node.js v18.0 or higher
- npm v9.0 or higher

### Local setup

```bash
git clone https://github.com/Nishachay/Trilist.git
cd Trilist
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `0` | Switch to **Rough** scratchpad |
| `1` | Switch to **Todo** list |
| `2` | Switch to **Watch** list |
| `3` | Switch to **Later** list |
| `j` / `k` | Navigate items up / down |
| `Space` | Toggle completion / resolve task |
| `p` | Cycle priority (`P1` -> `P2` -> `P3` -> `Clear`) |
| `x` or `d` | Delete selected task |
| `...` | Open row context menu |
| `/` | Focus input bar |
| `?` | Open Help and Preferences overlay |
| `Esc` | Clear input or close popovers |

---

## Inline tags

### Destination tags

- `/todo` or `/td`: Route task to **Todo**
- `/watch` or `/wt`: Route task to **Watch**
- `/later` or `/lt`: Route task to **Later**
- `/rough` or `/rg`: Route task to **Rough**

### Priority tags

- `/p1` or `/high`: High Priority (Red)
- `/p2` or `/med`: Medium Priority (Amber)
- `/p3` or `/low`: Low Priority (Blue)

### Date tags (Available for `/later`)

- `/week` or `/wk`: Defer task for 7 days
- `/month` or `/mn`: Defer task for 30 days

---

## Data privacy

Your tasks stay on your device:
- **Local storage**: Tasks save locally using IndexedDB. No external servers or user accounts.
- **Backup & export**: Export your data to `.json` or import a previous backup from the Preferences menu (`?`).

---

## Testing

Run linting and build commands locally:

```bash
npm run lint
npm run build
npm run preview
```

---

## Contributing

1. Fork the repository (`https://github.com/Nishachay/Trilist/fork`)
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

Run `npm run lint` before submitting code.

---

## Credits

Concept based on Marc Andreessen's 2007 essay, [Guide to Personal Productivity](https://pmarchive.com/guide_to_personal_productivity.html).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
