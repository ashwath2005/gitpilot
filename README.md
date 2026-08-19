# GitPilot — Your Autonomous Git Workspace

> **Manage every repository, automate legitimate Git workflows, and keep your projects moving.**

GitPilot is a production-grade, local-first desktop application built with **Tauri 2, React 18, Vite, and Rust**. It monitors genuine project changes, intelligently analyzes diffs, detects credentials and sensitive files, generates meaningful conventional commit messages, and safely commits and pushes changes according to user-configured schedules.

---

## ⚡ Key Highlights

- **Native Tauri 2 / Rust Runtime**: Low-overhead native Windows desktop shell with system tray integration, minimize-to-tray on close, and background scheduling.
- **Zero Artificial Commits**: Strictly validates real development activity. Never creates empty commits, fake streaks, or destructive operations (`--force`, `reset --hard`).
- **Autonomous & Manual Modes**: Flexible switch between full autonomous background execution and manual review with commit previews.
- **Secret & Credential Guard**: Automatically scans diffs and file lists to block commits containing `.env`, private keys (`.pem`, `.key`), OpenAI/AWS/GitHub tokens, and passwords with Shannon entropy heuristics.
- **AI-Powered Conventional Commits**: Optional OpenAI integration to generate concise, accurate `feat:`, `fix:`, `refactor:`, `style:` commit messages with smart offline heuristic fallbacks.
- **Controlled Push Queue**: Sequential processing with exponential retry backoff, preventing network overload and merge race conditions.
- **Workspace Discovery**: Scan parent directories (e.g. `D:\Projects`) to discover and import all Git repositories in one click with a 5-step onboarding wizard.
- **Command Palette & Shortcuts**: Instant `⌘K` command center, quick navigation (`⌘1..4`), and rapid push actions (`⌘+Shift+P`).

---

## 🏗 Architecture

```text
                         GITPILOT DESKTOP
                                │
                         ┌──────▼──────┐
                         │   TAURI 2   │
                         │ Desktop App │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
           React UI          Rust Core        Local Data
              │                 │                 │
           Zustand          Git CLI          Storage
           Router           Filesystem       Settings
           Recharts         Scheduler        History
           Components       Notifications    Queue
              │                 │
              └────────┬────────┘
                       │
                  Local Git
                 Repositories
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
- **Rust & Cargo** (for native binary compilation): Install via [rustup.rs](https://rustup.rs/)

### Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server (with live Git desktop bridge)
npm run dev

# 3. Or launch native Tauri desktop dev environment (requires Rust)
npm run tauri:dev
```

### Production Build & Installer

```bash
# Build frontend web bundle
npm run build

# Build standalone Windows executable & NSIS/MSI installer (requires Rust)
npm run tauri:build
```

The generated standalone installer will be output to:
`src-tauri/target/release/bundle/nsis/GitPilot_1.0.0_x64-setup.exe`

---

## 🔒 Security & Safety Principles

1. **Never force push**: Git commands will never execute `git push --force` or destructive file modifications.
2. **Secret Redaction**: Detected secret patterns (`sk-...`, `ghp_...`, `AKIA...`, `BEGIN PRIVATE KEY`) are intercepted and blocked prior to staging. Secrets are never passed to AI services.
3. **Encrypted Vault Storage**: Sensitive API credentials are saved in the user configuration vault and never transmitted in plaintext.
4. **Dry Run Mode**: Test your schedule and commit generation without executing commits or pushes to remote servers.

---

## 📜 License

MIT License © 2026 GitPilot Team.
