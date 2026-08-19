# Changelog

All notable changes to **GitPilot** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-08-19

### Fixed
- **Clean Installation & Workspace Isolation**: Removed development project seeding defaults so new users start with a clean workspace without developer projects showing.
- **Dynamic Version Tracking**: Synchronized application version across frontend settings, device tracking, admin views, and build packaging.

---

## [1.1.0] - 2026-08-19

### Added
- **Cloud User Management (Supabase)**: Integrated official Supabase authentication, profile management, and device tracking without custom backends.
- **Owner Admin Console**: Full administrative dashboard with user search, status/plan filtering, device inspection, and profile management.
- **Automated Update System**: Production-ready differential auto-updates powered by `electron-updater`, `electron-builder`, and GitHub Releases.
- **Application Updates Tab**: Manage update channels (`stable`, `beta`), periodic background checks, and automated downloads in Settings.
- **Command Palette Actions**: Added "Check for Updates", "View Release Changelog", and "Restart and Update GitPilot".
- **Local Privacy Guarantee**: Clear privacy assurances across all modals and settings ensuring 100% of Git code, diffs, and credentials remain private on user machines.

### Improved
- **Port Binding Persistence**: Fixed embedded local server port to ensure `localStorage` and first-launch state are safely preserved across launches.
- **Windows System Tray**: Notification balloons on update availability and downloads.
- **Safe Timing Guard**: Auto-update installation pauses if Git scans, commits, or pushes are currently executing.

### Security
- **Row Level Security (RLS)**: True database-level authorization for profiles and devices using Supabase security definer functions.
- **Offline Resilience**: Seamless fallback to local repository monitoring if internet or cloud services are disconnected.

---

## [1.0.0] - 2026-08-15

### Added
- **Autonomous Git Workspace**: Multi-repository monitoring with branch and change tracking.
- **Secret Scanner**: High-entropy token, private key, and `.env` detection before staging or committing.
- **Smart Conventional Commits**: Clean commit message generation with conventional commits standard.
- **Automation Queue & Scheduler**: Background interval scheduler and execution queue.
- **System Tray & Desktop Bridge**: Native Windows integration with system notifications.
