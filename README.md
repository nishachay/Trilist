# Trilist

> High-velocity task capture and management built with Notion-style inline tag parsing, Apple glassmorphic aesthetics, and instant keyboard workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

---

## ✨ Features

- ⚡ **Notion-Style Inline Tag Engine**: Type `/` anywhere in your input to trigger context-aware destination (`/td`, `/wt`, `/lt`, `/rg`) and time tags (`/wk`, `/mn`).
- 🎨 **Apple Glassmorphic UI**: Floating window container, smooth spring physics, micro-interactions, and dark/light system theme support.
- 🎯 **3 Core Lists + Scratchpad**:
  - **Todo**: Active daily commitments with circular animated checkmarks.
  - **Watch**: Items on your radar with pulsing live indicators and hover resolution.
  - **Later**: Deferred items with smart relative time badges (`7d`, `30d`).
  - **Rough**: Dedicated scratchpad for fast thoughts and notes.
- 💾 **Native IndexedDB Storage**: Asynchronous, non-blocking, transactional client storage with zero external dependencies.
- ⌨️ **Keyboard First**: Navigate entire app without touching the mouse (`0-3` view switching, `/` command focus, `?` help overlay, `Esc` layered dismissal).

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS v4 + Vanilla Design System Tokens |
| **Animations** | Motion (`motion/react`) |
| **Icons** | Lucide React |
| **Storage Engine** | Native IndexedDB API |
| **Linter** | Oxlint |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `pnpm` or `yarn`

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

## 📦 Scripts

- `npm run dev` — Launch Vite local development server
- `npm run build` — Run TypeScript type-check (`tsc -b`) and Vite production bundle
- `npm run lint` — Run Oxlint linter
- `npm run preview` — Locally preview production build

---

## 🌐 Deploying to Vercel

Trilist includes out-of-the-box Vercel deployment support.

1. Fork or push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. Vercel will automatically detect **Vite** and use:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**!

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `0` | Switch to **Rough** scratchpad |
| `1` | Switch to **Todo** list |
| `2` | Switch to **Watch** list |
| `3` | Switch to **Later** list |
| `/` | Open command palette / Focus omnibar |
| `?` | Open Help & Shortcuts overlay |
| `Enter` | Submit task to active or tagged list |
| `Tab` / `↑` `↓` | Navigate autocomplete menu |
| `Backspace` | Remove last tag pill (when input is empty) |
| `Esc` | Dismiss overlay / Close menu / Clear input |

---

## 🏷️ Command Tags

### Where Tags (Mutually Exclusive)
- `/todo` or `/td` — Route to **Todo**
- `/watch` or `/wt` — Route to **Watch**
- `/later` or `/lt` — Route to **Later**
- `/rough` or `/rg` — Route to **Rough**

### When Tags (Requires `/lt`)
- `/week` or `/wk` — Defer for 7 days
- `/month` or `/mn` — Defer for 30 days

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) to understand expectations for participating in this open-source project.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
