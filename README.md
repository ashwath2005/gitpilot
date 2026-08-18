# GitPilot — Your Autonomous Git Workspace

> **Manage every repository, automate legitimate Git workflows, and keep your projects moving.**

GitPilot is a production-grade, local-first desktop application designed for developers managing multiple Git repositories. It monitors genuine project changes, intelligently analyzes diffs, detects credentials and sensitive files, generates meaningful conventional commit messages, and safely commits and pushes changes according to user-configured schedules.

---

## ⚡ Key Highlights

- **Zero Artificial Commits**: Strictly validates real development activity. Never creates empty commits, fake streaks, or destructive operations (`--force`, `reset --hard`).
- **Autonomous & Manual Modes**: Flexible switch between full autonomous background execution and manual review with commit previews.
- **Built-in Diff Viewer**: Inspect changed files, unstaged and staged diffs with syntax coloring and additions/deletions stats.
- **Secret & Credential Guard**: Automatically scans diffs and file lists to block commits containing `.env`, private keys (`.pem`, `.key`), OpenAI/AWS/GitHub tokens, and passwords.
- **AI-Powered Conventional Commits**: Optional OpenAI integration to generate concise, accurate `feat:`, `fix:`, `refactor:`, `style:` commit messages with smart heuristic fallbacks.
- **Controlled Push Queue**: Sequential processing with exponential retry backoff, preventing network overload and merge race conditions.
- **Workspace Discovery**: Scan parent directories (e.g. `D:\Projects`) to discover and import all Git repositories in one click.
- **Command Palette & Shortcuts**: Instant `⌘K` command center, quick navigation (`⌘1..4`), and rapid push actions (`⌘+Shift+P`).

---

## 🏗 Architecture

```text
GitPilot/
├── src/
│   ├── app/
│   │   ├── App.jsx              # App Shell, shortcuts, modal triggers
│   │   └── routes.jsx           # React Router client navigation
│   ├── components/
│   │   ├── layout/              # Sidebar, Header, StatusBar
│   │   ├── projects/            # ProjectCard, AddModal, ScanModal, DiffViewer, CommitPreview
│   │   ├── command-palette/     # ⌘K Command Palette
│   │   ├── activity/            # Push timeline and history
│   │   └── analytics/           # Contribution matrix heatmap & charts
│   ├── pages/                   # Dashboard, Projects, Details, Activity, Analytics, Schedules, Queue, Settings
│   ├── services/
│   │   ├── git/gitService.js    # Native Git CLI wrapper (status, diff, branch, remote, push)
│   │   ├── security/secretScanner.js # Regex secret and sensitive file detector
│   │   ├── ai/aiService.js      # OpenAI conventional commit prompt engine & heuristic fallback
│   │   ├── scheduler/schedulerEngine.js # Background cron scheduler & queue worker
│   │   ├── database/databaseService.js # Local persistence layer (SQLite/IndexedDB)
│   │   └── desktopBridge.js     # Unified Tauri / dev bridge adapter
│   ├── store/                   # Zustand stores (project, queue, schedule, settings, activity)
│   └── styles/                  # Ultra-dark developer workspace CSS design system
├── src-tauri/                   # Rust backend crate with Git command handlers
├── package.json
└── vite.config.js
```

---

## 🎨 Visual Design Language

GitPilot uses an ultra-dark developer aesthetic:
- **Base Background**: `#050505`
- **Surface**: `#0B0B0D`
- **Elevated**: `#111114`
- **Border**: `#1F1F24`
- **Primary Accent**: `#6366F1` (Indigo) / `#818CF8`
- **Status Accents**: Success `#22C55E`, Warning `#F59E0B`, Danger `#EF4444`
- **Typography**: Inter & JetBrains Mono

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl / ⌘ + K` | Open Command Palette |
| `Ctrl / ⌘ + Shift + P` | Enqueue and push all changed repositories |
| `Ctrl / ⌘ + Shift + S` | Scan all registered repositories |
| `Ctrl / ⌘ + ,` | Open Settings |
| `Ctrl / ⌘ + 1` | Navigate to Overview / Dashboard |
| `Ctrl / ⌘ + 2` | Navigate to Projects |
| `Ctrl / ⌘ + 3` | Navigate to Activity Timeline |
| `Ctrl / ⌘ + 4` | Navigate to Analytics & Heatmap |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (tested on Node v22)
- **Git**: Git 2.20+ installed in PATH
- **Rust / Tauri** (optional for native binary compilation): `cargo` & `rustc`

### Development

```bash
# Install dependencies
npm install

# Start development server with live Git desktop bridge
npm run dev
```

### Production Build

```bash
# Build web app distribution
npm run build
```

---

## 🔒 Security & Safety Principles

1. **Never force push**: Git commands will never execute `git push --force` or destructive file modifications.
2. **Secret Redaction**: Detected secret patterns (`sk-...`, `ghp_...`, `AKIA...`, `BEGIN PRIVATE KEY`) are intercepted and blocked prior to staging. Secrets are never passed to AI services.
3. **Dry Run Mode**: Test your schedule and commit generation without executing commits or pushes to remote servers.

---

## 📜 License

MIT License © 2026 GitPilot Team.
