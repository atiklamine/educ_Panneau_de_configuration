# Stage 2: Technical Architecture & Engineering Decisions

## 2.1 Technology Stack Selection & Rationale
- **Selected Stack**: Pure **HTML5 + CSS3 + Vanilla JavaScript (ES5/ES2017 compatible)** with zero third-party runtime libraries, zero CDN calls, and zero bundler requirement at runtime.
- **Why Vanilla JS + Script Lazy Loading (vs. React / ESM Modules / Tailwind JIT)**:
  1. **Zero `file://` CORS Failures**: Native ES Modules (`<script type="module">`), dynamic `import()`, and runtime `fetch()` of local JSON/HTML fail with CORS blocks in Chrome & Firefox when double-clicking `index.html` over `file://`. Classic deferred `<script>` tags + on-demand `<script>` injection load lazily in both `file://` and `http://` with zero console errors.
  2. **Legacy Windows 7 & Weak Hardware Budget**: Total core JS+CSS stays well below the 200 KB limit with instant startup (<50 ms) on 2 GB RAM dual-core machines.
  3. **No Broken CSS**: Avoids CSS Nesting, `:has()`, container queries, and unprefixed modern rules without fallback.

---

## 2.2 Project Directory Structure
```text
/
├── index.html                        # Entry shell (UTF-8, dir="rtl", lang="ar")
├── bg/                               # Local embedded desktop wallpapers (000.jpg .. 014.jpg)
├── assets/
│   └── icons/
│       └── icons.js                  # Inline SVG icon factory (Fluent UI glyphs, zero emojis)
├── css/
│   ├── base.css                      # Reset, typography stack (Tahoma fallback), scrollbars, focus rings
│   ├── themes.css                    # Light/Dark CSS variables, 6 Accent tokens, Mica/Acrylic + fallbacks
│   ├── rtl.css                       # Logical properties + legacy Win7 RTL compatibility overrides
│   ├── windows.css                   # Window chrome, 8-edge resize handles, Snap Layouts overlay & animations
│   ├── shell.css                     # Desktop, Taskbar, Start Menu, Search, Quick Settings, Notifications, Lock Screen, Context Menu
│   ├── settings.css                  # Settings App 2-pane layout, sidebar nav, cards, switches, sliders, sub-pages
│   └── pedagogical.css               # Floating 1AS Assessment HUD, Student Login card, Teacher Config, Printable A4 Report
├── js/
│   ├── compat/
│   │   └── compat.js                 # Feature checks, safe storage (localStorage + RAM fallback), ES5 helpers, lazy script loader
│   ├── i18n/
│   │   ├── ar.json                   # Canonical Arabic strings (Default)
│   │   ├── fr.json                   # Canonical French strings
│   │   ├── en.json                   # Canonical English strings
│   │   ├── ar.js / fr.js / en.js     # file:// CORS-safe JSONP/window payload mirrors kept 100% synced with *.json
│   │   └── i18n.js                   # t(key, vars), direction switching, Unicode BiDi isolate helper
│   ├── registry/
│   │   └── settings-registry.js      # Single Source of Truth mapping Settings IDs <-> Keywords <-> All Windows 11 Access Paths
│   ├── core/
│   │   ├── state.js                  # VirtualSystemState (wallpaper, dark/light, accent, mouse, clock/tz, wifi/bt, apps, users/UAC)
│   │   ├── window-manager.js         # Central multi-window manager (open, close, focus, z-index, drag, 8-edge resize, minimize/restore)
│   │   ├── snap-manager.js           # Screen edge snap drag + Maximize button Snap Layouts popover + Snap Assist
│   │   ├── dialogs.js                # Fluent Win11 ContentDialogs (UAC, Add/Edit User, Add Language 3-step Wizard, Uninstall, About)
│   │   ├── taskbar.js                # Centered taskbar, running app pills, tray clock/timezone, IME language menu
│   │   ├── start-menu.js             # Pinned apps, All Apps view, instant Search filter, Account/Power menus
│   │   ├── search.js                 # Dedicated Windows Search flyout indexing Apps + Registry Settings + Control Panel applets
│   │   ├── quick-settings.js         # Win+A Quick Settings flyout (Wi-Fi list, Bluetooth, Airplane, Battery, Night Light, Brightness, Volume)
│   │   ├── notifications.js          # Win+N Notification Center + interactive Month Calendar + toast alerts
│   │   ├── task-view.js              # Alt+Tab / Win+Tab Task View + Virtual Desktops manager
│   │   ├── lock-screen.js            # Windows 11 Lock / Switch User screen respecting passwords, standard limits, and guest state
│   │   └── context-menu.js           # Desktop, Taskbar, and Icon context menus with nested View/Sort submenus
│   ├── apps/
│   │   ├── control-panel.js          # Classic Control Panel (Category & Icons view linked via SettingsRegistry)
│   │   ├── file-explorer.js          # Working This PC, drives C:/D:, Recycle Bin, Quick Access
│   │   ├── edge-browser.js           # Offline Intranet Lab Browser (Help & Ministry Curriculum Guide)
│   │   └── settings/
│   │       ├── settings-app.js       # Settings shell, search, clickable breadcrumbs, history stack, lazy section loader
│   │       ├── home.js               # Lazy-loaded Home overview
│   │       ├── system.js             # System + sub-pages (Display, Sound, Notifications, Power, Storage, Multitasking, About)
│   │       ├── devices.js            # Bluetooth & Devices + sub-pages (Bluetooth, Printers, Mouse Properties w/ test folder)
│   │       ├── network.js            # Network & Internet (Wi-Fi, Ethernet, Airplane mode, VPN, Proxy)
│   │       ├── personalization.js    # Background (bg/000..014), Colors (Dark/Light/Accent), Themes/Screensaver, Lock Screen, Start, Taskbar
│   │       ├── apps.js               # Installed apps (6 lab programs + uninstall wizard), Default apps, Startup apps
│   │       ├── accounts.js           # Users management, Standard vs Admin, Guest toggle, last-admin guard, UAC
│   │       ├── time-language.js      # Language & region, Add Language 3-step wizard, Date & time, Timezone offset synced to clock
│   │       ├── gaming.js             # Game Mode, Captures
│   │       ├── accessibility.js      # Text size live scale, Contrast, Mouse pointer shortcut, Visual aids
│   │       ├── privacy.js            # Windows Security status, Permissions (Location, Camera, Mic)
│   │       └── windows-update.js     # Simulated Windows Update check & history
│   └── pedagogy/
│       ├── assessment.js             # 5 Algerian 1AS tasks, scoring, mistakes/penalties, JSON export
│       ├── hud.js                    # Draggable, collapsible, 8-edge-clamped, resizable Floating Pedagogical Assistant
│       ├── teacher.js                # Hidden F12 / Ctrl+Shift+P Teacher Config + Base64 inf.dll importer/exporter
│       └── report.js                 # Student Registration modal + Printable A4 Competency Certificate & Latin PDF filename helper
├── docs/
│   ├── STAGE1_SPEC.md
│   ├── STAGE2_ARCHITECTURE.md
│   └── ...
└── test/
    └── verify.js                     # Automated Playwright/Chrome CDP + Node verification suite
```

## 2.3 Core Architecture Contracts
1. **Central State Event Bus (`Win11State`)**: Every setting change (wallpaper, theme mode, accent color, font scale, brightness, night light, timezone, wifi, sound, installed programs, user accounts, installed languages) updates the centralized observable state, persists safely to `localStorage` (falling back to RAM if blocked), and publishes typed change events (`state:changed`, `theme:changed`, `wallpaper:changed`, `clock:changed`, `users:changed`, `apps:changed`) so Taskbar, Desktop, Quick Settings, Lock Screen, Control Panel, and Pedagogical Assessment stay synchronized instantaneously.
2. **Central Multi-Path Settings Registry (`Win11Registry`)**: All access paths (Start, Taskbar Search, Settings Search, Quick Settings deep links, Tray Right-click, Desktop Right-click, Classic Control Panel applets, Toast Notifications) call `Win11Registry.open(targetId, subParam)` so every entry point navigates to the exact same state and subpage.
3. **Window Manager & Snap Engine**: Every desktop application window (`Settings`, `Control Panel`, `File Explorer`, `Edge`, `Task Manager`) registers inside `Win11WM`, allowing independent dragging, 8-edge resizing, snap-to-left/right/quadrant, Snap Layouts hover popover on Maximize, minimize-to-taskbar, restore, z-index activation, and `Alt+Tab` / `Win+Tab` switching across Virtual Desktops.
4. **Fluent Inline SVG Iconography**: `Win11Icons` renders crisp inline `<svg>` Fluent glyphs for every OS icon, caption button, desktop icon, folder, tray symbol, and settings row — completely eliminating broken emoji glyphs on Windows 7.

