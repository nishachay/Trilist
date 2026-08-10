# Trilist

> A minimalist, keyboard-driven productivity app based on Marc Andreessen's classic 3x5 index card system.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite 6](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-ff6b4a.svg)](https://oxc.rs/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

![Trilist Dark Mode](public/trilist-darkmode.png#gh-dark-mode-only)
![Trilist Light Mode](public/trilist-lightmode.png#gh-light-mode-only)

---

## 📌 Table of Contents
- [The Story & Motivation](#-the-story--motivation)
- [Why Trilist? (The Problem It Solves)](#-why-trilist-the-problem-it-solves)
- [The 3-List Philosophy](#-the-3-list-philosophy)
- [Core Features](#-core-features)
- [Tech Stack & Engineering Choices](#-tech-stack--engineering-choices)
- [Quick Start & Installation](#-quick-start--installation)
- [How to Use Trilist](#-how-to-use-trilist)
  - [Keyboard Navigation](#keyboard-navigation)
  - [Inline Command Tags](#inline-command-tags)
- [Data Privacy & Ownership](#-data-privacy--ownership)
- [Testing & Quality Control](#-testing--quality-control)
- [Contributing](#-contributing)
- [Credits & Inspiration](#-credits--inspiration)
- [License](#-license)

---

## 💡 The Story & Motivation

Most productivity applications force you into endless nested folders, tag taxonomies, and perpetual list debt. You start with good intentions, but within weeks your to-do app becomes a graveyard of hundreds of overdue tasks that generate guilt instead of clarity.

**Trilist was born out of a desire for extreme simplicity.**

Inspired by Marc Andreessen’s legendary essay, [Guide to Personal Productivity](https://pmarchive.com/guide_to_personal_productivity.html), Trilist replicates the speed and discipline of physical 3x5 index cards inside a modern, keyboard-native web application. 

Instead of accumulating infinite backlogs, Trilist forces you to restrict your active focus to just 3 to 5 core commitments per day.

---

## 🎯 Why Trilist? (The Problem It Solves)

| Traditional Productivity Tools | The Trilist Approach |
|---|---|
| Endless task backlogs that grow forever | Strictly capped daily lists (3–5 items max) |
| Cluttered dropdown menus & popups | Fast inline tag routing (`/td`, `/wt`, `/lt`, `/p1`) |
| Laggy cloud syncing & mandatory sign-ups | Instant offline IndexedDB with 100% local data privacy |
| Cluttered row overlays & hidden actions | Clean 3-dots context menu & 100% right-aligned priority badges |

---

## 🧠 The 3-List Philosophy

1. 📝 **Todo**: Your non-negotiable commitments for today. Keep this list short (3 to 5 items max).
2. 👁️ **Watch**: Items on your radar — responses you are awaiting, long-term tracking, or dependencies on others.
3. ⏳ **Later**: Deferred commitments scheduled for future weeks or months.
4. ✍️ **Rough**: An unconstrained scratchpad for quick notes, brain dumps, and raw ideas before promoting them to core lists.

---

## ⚡ Core Features

- **Inline Tag Routing**: Route tasks instantly on typing — use `/td`, `/wt`, `/lt`, or `/rg` anywhere in the omnibar without leaving your keyboard.
- **Priority Flags System**: Assign high-contrast priority flags `/p1` (High Red), `/p2` (Medium Amber), or `/p3` (Low Blue). Priority badges align cleanly along the far-right margin for instant scanning.
- **Relative Scheduling**: Combine `/lt` with `/wk` (1 week) or `/mn` (1 month) to defer tasks into future time windows automatically.
- **Unified 3-Dots Context Menu (`•••`)**: Clean popover dropdown for priority modification, list migration, inline editing, and deletion without visual hover clutter.
- **Full Custom Design System**: Dark and Light theme engine, 5 custom accent swatches, and 4 curated fonts (Geist, JetBrains Mono, Inter Tight, Newsreader).
- **Zero-Latency Offline Privacy**: Powered by native browser IndexedDB with JSON export/import backup capabilities.

---

## 🛠️ Tech Stack & Engineering Choices

- **Framework**: React 19 + TypeScript (Strict Mode)
- **Build Engine**: Vite 6 (Lightning-fast HMR and bundle compilation)
- **Styling**: Vanilla CSS Design Tokens (No bulky utility frameworks; zero runtime CSS overhead)
- **Animations**: Motion (`motion/react` layout transitions)
- **Icons**: Lucide React (100% Unified SVG Vector System)
- **Database Engine**: Native browser IndexedDB API (Asynchronous, non-blocking storage)
- **Linter**: Oxlint (High-performance code quality analysis)

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0 or higher
- `npm` v9.0 or higher

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Nishachay/Trilist.git

# 2. Navigate to the project directory
cd Trilist

# 3. Install dependencies
npm install

# 4. Start the local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⌨️ How to Use Trilist

### Keyboard Navigation

| Key | Action |
|---|---|
| `0` | Switch to **Rough** scratchpad |
| `1` | Switch to **Todo** list |
| `2` | Switch to **Watch** list |
| `3` | Switch to **Later** list |
| `j` / `k` | Navigate items up / down |
| `Space` | Toggle completion / resolve task |
| `p` | Cycle priority (`P1` → `P2` → `P3` → `Clear`) |
| `x` or `d` | Delete selected task |
| `•••` | Open row context menu |
| `/` | Focus Omnibar input |
| `?` | Open Help & Preferences overlay |
| `Esc` | Blur input or close popovers |

### Inline Command Tags

#### Destination Tags
- `/todo` or `/td`: Route task to **Todo**
- `/watch` or `/wt`: Route task to **Watch**
- `/later` or `/lt`: Route task to **Later**
- `/rough` or `/rg`: Route task to **Rough**

#### Priority Tags
- `/p1` or `/high`: High Priority (Vibrant Red)
- `/p2` or `/med`: Medium Priority (Amber Gold)
- `/p3` or `/low`: Low Priority (Electric Blue)

#### Date Tags (Available for `/later`)
- `/week` or `/wk`: Defer task for 7 days
- `/month` or `/mn`: Defer task for 30 days

---

## 🔐 Data Privacy & Ownership

Your productivity data belongs exclusively to you:
- **100% Local Storage**: All tasks are saved locally inside your browser using IndexedDB. No external servers, no telemetry, no mandatory accounts.
- **Backup & Export**: Easily export your entire database as a structured `.json` backup file or restore from a previous backup via the Preferences menu (`?`).

---

## 🧪 Testing & Quality Control

Trilist maintains strict code health and type safety standards:

```bash
# Run OxLint static analysis
npm run lint

# Run TypeScript compilation & build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository (`https://github.com/Nishachay/Trilist/fork`)
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all lint checks (`npm run lint`) pass cleanly before submitting.

---

## 🙌 Credits & Inspiration

- Concept based on Marc Andreessen's 2007 essay, [Guide to Personal Productivity](https://pmarchive.com/guide_to_personal_productivity.html).
- Built & Designed by **Nishachay** ([GitHub @nishachay](https://github.com/nishachay) | [X @nishachayy](https://x.com/nishachayy)).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
