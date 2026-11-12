# Decision Log — Windows 11 Arabic Educational Simulator

This log records every non-trivial technical and architectural decision taken during autonomous execution across Stages 2–9 under the Stage 1 Baseline and Autonomous Execution Safeguards. Every entry follows the mandatory 8-field decision structure.

---

### [DEC-CLEANUP] Workspace Cleanup & Ambiguous Asset Preservation
- **Stage**: 0 / Cleanup
- **Context**: The workspace originally mixed the abandoned C#/WPF solution (`Simulator_Project/`, `.exe`, `.zip`, root debug PNGs) with the authoritative HTML/JS/CSS simulator (`index.html`). Autonomous safeguards forbid permanent file deletion and require preserving ambiguous assets untouched.
- **Options considered**:
  1. Delete `Simulator_Project/`, `.exe`, and `.zip` immediately with `Remove-Item`.
  2. Leave all legacy projects beside `index.html` and rely on documentation.
  3. Archive all 16 confirmed legacy WPF/build/screenshot items safely into `_archive_to_delete/` preserving structure, while keeping ambiguous items untouched.
- **Chosen option**: Option 3. Moved 16 legacy items (`Simulator_Project/`, `Distribution/`, `build.ps1`, `Win11ControlPanelSimulator.exe`, `Simulateur_Win11_Education.zip`, `Simulateur_Win11_Web_Portable.zip`, `align_left.png`, `align_right.png`, `fixed_dialog1.png`, `fixed_dialog2.png`, `preview_report.jpg`, `preview_report.png`, `rendered_dialog.png`, `test_fixed_dialog.png`, `test_modern_dialog.png`, `test_msgbox.png`) into `_archive_to_delete/`; kept `Consulter_Resultats.bat`, root `inf.dll`, `win11screenshots/`, and `ملفات وزارية/` untouched.
- **Rationale**: Eliminates confusion with abandoned deliverables and keeps the active tree focused on `index.html`, while guaranteeing 100% reversibility until manual review at STOP 3.
- **Risks**: Slightly larger repository size until `_archive_to_delete/` is manually deleted after STOP 3; minor risk that legacy root `inf.dll` could be mistaken for a v2 binary sidecar.
- **Reversible?**: Yes — every archived file can be moved back out of `_archive_to_delete/` without loss.
- **Files affected**: Workspace root -> `_archive_to_delete/`.

---

### [DEC-001] Teacher Console Shortcut Hygiene (`Ctrl+Shift+S` Only)
- **Stage**: 2
- **Context**: Previously, `js/core/taskbar.js` listened for `F12` and `Ctrl+Shift+P`, `js/core/context-menu.js` exposed a clickable `إعدادات الأستاذ (F12)` entry on desktop right-click, and `js/i18n/{ar,fr,en}.{json,js}` shipped `desktop.teacherSettings`. Stage 2 requires zero student-facing exposure and `Ctrl+Shift+S` only.
- **Options considered**:
  1. Keep `F12` alongside `Ctrl+Shift+S` and only hide the context menu label.
  2. Listen solely for `e.key === 's'` on `Ctrl+Shift+S`.
  3. Remove `F12`, `Ctrl+Shift+P`, and `desktop.teacherSettings` everywhere, and bind strictly to `Ctrl+Shift+S` checking both `e.key` (`S`/`s`) and physical `e.code === 'KeyS'` (with `!e.altKey`).
- **Chosen option**: Option 3.
- **Rationale**: Checking physical `e.code === 'KeyS'` guarantees `Ctrl+Shift+S` works even when the user's keyboard is switched to Arabic (`س`), while keeping zero discoverable UI references or student triggers.
- **Risks**: If a third-party browser extension intercepts `Ctrl+Shift+S`, the page may not receive the key event unless using an isolated app/window launch.
- **Reversible?**: Yes — single listener condition inside `bindGlobalShortcuts()` in `js/core/taskbar.js`.
- **Files affected**: `js/core/taskbar.js`, `js/core/context-menu.js`, `js/pedagogy/teacher.js`, `js/i18n/{ar,fr,en}.{json,js}`.

---

### [DEC-002] Per-User Memory Freeze/Isolation vs Machine Registry Split
- **Stage**: 2
- **Context**: Multi-user simulation (`Administrateur`, `Standard`, `Invité`) requires realistic isolation so switching users suspends User A's windows, navigation, theme, files, and timers cleanly without leaking into User B or resetting User A.
- **Options considered**:
  1. Single global `state.js` object that only stores wallpaper per user and tears down windows on switch.
  2. Deep-serialize entire DOM HTML snapshots into temporary RAM objects on every user switch.
  3. Partition `Win11Sessions` into shared machine registries (`userAccounts`, `deviceName`, `installedPrograms`, `startupApps`, `installedLanguages`, `timeZoneId`, system hardware toggles) vs per-user RAM HKCU namespaces (`windows`, `appUi`, theme/wallpaper/mouse/sound/accessibility, `userFiles`, `userApps`, notifications, session timers), keeping dormant users' windows frozen in detached DOM layers while tearing down ephemeral `Invité` profiles on sign-out.
- **Chosen option**: Option 3.
- **Rationale**: Mirrors authentic Windows `HKLM`/`HKCU` semantics (admin software/account changes persist machine-wide; personal desktops, open windows, files, and apps remain strictly isolated and frozen per user) and implements ephemeral Guest teardown automatically.
- **Risks**: Requires all apps/settings modules to read session state via `Win11Sessions`/`Win11State` instead of module-level cached variables.
- **Reversible?**: Partially — core state routing spans `js/core/session-manager.js`, `js/core/state.js`, and `js/core/window-manager.js`.
- **Files affected**: `js/core/session-manager.js`, `index.html`.

---

### [DEC-003] Windows 11 Capability Matrix & Arabic UAC Elevation Semantics
- **Stage**: 2–3
- **Context**: `Invité` (Guest) and `Standard` users previously had flat restrictions only inside `accounts.js`, leaving system settings, program uninstallation, startup apps, network adapters, and language packs unprotected.
- **Options considered**:
  1. Disable or hide all Settings/Control Panel links for non-admin users.
  2. Guard only `accounts.js` and `apps.js` with hardcoded `if (user === 'Guest')` blocks.
  3. Centralize capability enforcement in `js/core/permission-gate.js` (`Win11Permissions`) using a shared `CAPABILITY_MATRIX` (`allow` vs `uac` vs `deny`) with an interactive Admin Credential Elevation modal for `Standard` users and hard Arabic denial + mistake logging for `Invité`.
- **Chosen option**: Option 3.
- **Rationale**: Allows students in `Standard` accounts to encounter realistic Windows 11 UAC elevation dialogs, respects built-in `Administrateur` safety invariants (cannot delete Guest or demote/delete the last Administrator), and enforces `Invité` read-only limits consistently across every path.
- **Risks**: Unmapped action keys default strictly or must be added to `CAPABILITY_MATRIX` as new features are introduced.
- **Reversible?**: Yes — centralized inside `CAPABILITY_MATRIX` and `Win11Permissions.guard()` in `js/core/permission-gate.js`.
- **Files affected**: `js/core/permission-gate.js`, `index.html`.

---

### [DEC-004] Per-User DOM Layering & Shared State/Settings Public API Updates
- **Stage**: 3
- **Context**: Storing `windows`, `currentRoute`, or `hostBody` in module singletons caused User B to overwrite User A's live DOM containers on Switch User, and duplicating permission checks across 12 Settings modules risked drift.
- **Options considered**:
  1. Reconstruct open windows from scratch on every Switch User and duplicate `Win11Permissions.guard` inside every click handler.
  2. Partition `#windows-layer` in `js/core/window-manager.js` into per-user `.user-session-layer` containers (`Win11WM.syncSession()`), move app UI navigation into `Win11Sessions.getActiveSession().appUi`, extend `Win11State` with `deleteAccount`/`switchUser`/per-user proxy getters, and add a declarative `permAction` option to `Win11SettingsApp` controls (`rowToggle`, `rowSelect`, `rowSlider`).
- **Chosen option**: Option 2.
- **Rationale**: Preserves exact scroll, route, and multi-window Z-order instantaneously on user switch with zero DOM churn, keeps shared `Win11State`/`Win11WM` APIs backward-compatible, and automatically reverts unauthorized toggles/sliders in one shared UI layer.
- **Risks**: Direct DOM mutations outside `Win11SettingsApp` builders must still invoke `Win11Permissions.guard()` explicitly (done for buttons in `apps.js`, `accounts.js`, `system.js`).
- **Reversible?**: Yes — isolated inside `window-manager.js`, `state.js`, and `settings-app.js`.
- **Files affected**: `js/core/state.js`, `js/core/window-manager.js`, `js/core/quick-settings.js`, `js/apps/settings/*.js`, `js/apps/file-explorer.js`, `js/apps/control-panel.js`, `js/apps/edge-browser.js`.

---

### [DEC-005] Fresh-Start Active Purge & Time-Based Evaluation Engine
- **Stage**: 4
- **Context**: Previously, `state.js` stored `win11_sim_v2_state` and `assessment.js` stored `win11_sim_v2_teacher_cfg` in `localStorage`, leaking prior students' progress across browser restarts, while timers started manually at `00:00`.
- **Options considered**:
  1. Clear `localStorage` only when clicking "Restart Session" inside the Start menu.
  2. Keep student scores in `sessionStorage` so page reload keeps state.
  3. Force strict RAM-only execution in `Win11Compat`/`Win11State`/`Win11Assessment`, execute `purgeLegacyPersistence()` + `verifyCleanStartup()` on boot (clearing legacy keys, `sessionStorage`, cookies, IndexedDB), auto-start `HH:MM:SS` timers on session launch, pause + count `suspendedSeconds` on Lock Screen / Switch User, track per-task & `sectionTimings`, and rank ties by `compareStudents()` shortest active time.
- **Chosen option**: Option 3.
- **Rationale**: Enforces deterministic clean desks across every relaunch regardless of prior leftover storage, tracks full competitive `HH:MM:SS` active vs suspended timings transparently, and logs student clean-start checks cleanly.
- **Risks**: Refreshing `F5` accidentally mid-exam wipes student RAM progress (mitigated by suppressing casual reload cues in fullscreen/app mode; intentional per Fresh-Start guarantee).
- **Reversible?**: Yes — controlled in `js/compat/compat.js`, `js/core/boot.js`, `js/core/lock-screen.js`, and `js/pedagogy/assessment.js`.
- **Files affected**: `js/compat/compat.js`, `js/core/state.js`, `js/core/boot.js`, `js/core/lock-screen.js`, `js/apps/settings/settings-app.js`, `js/pedagogy/assessment.js`.

---

### [DEC-006] Report Modal Fixes (`safeHtml`), Arabic/Latin Filename Builder & Offline Exports
- **Stage**: 4
- **Context**: Certificate screenshots (`media_1794413537088_50f9f6c9.jpg`) showed double-escaped `<bdi>` buttons (`dialogs.js:75` escaping `report.js` pre-formatted labels), viewport header/footer clipping at `1280x800`, and ASCII sanitization turning Arabic group names into `1_-_1`.
- **Options considered**:
  1. Strip Arabic characters from exported filenames using ASCII transliteration.
  2. Always pass raw unescaped HTML through `Win11Dialogs` button labels globally.
  3. Add opt-in `btnDef.safeHtml` in `js/core/dialogs.js` (keeping all other callers safely auto-escaped via `bidiHtml`), fix flexbox bounds in `css/shell.css` + `@media print` in `css/pedagogical.css`, preserve Arabic Unicode (`\u0600-\u06FF`) alongside safe Latin/ASCII tokens in `{class}_{score}_{time}_{student_lastname}_{student_firstname}_{date}` with Windows forbidden-char sanitization (`\ / : * ? " < > |`) and `_2`/`_3` collision suffixes, isolate mixed segments in `<bdi>` previews, and provide standalone UTF-8 RTL `.html`, `.json`, and `window.print()` PDF exports.
- **Chosen option**: Option 3.
- **Rationale**: Prevents XSS/escaping bugs globally while letting explicit buttons opt in safely, eliminates all `1_-_1` filename mangling while keeping valid Windows NTFS/FAT32 filenames, and guarantees readable unclipped certificates at `1280x800` and `1024x768`.
- **Risks**: Browsers without a PDF printer configured rely on the bundled standalone `.html` download fallback for offline archiving.
- **Reversible?**: Yes — isolated inside `js/core/dialogs.js`, `js/pedagogy/report.js`, `css/shell.css`, and `css/pedagogical.css`.
- **Files affected**: `css/shell.css`, `css/pedagogical.css`, `js/core/dialogs.js`, `js/pedagogy/report.js`, `js/i18n/{ar,fr,en}.{json,js}`.

---

### [DEC-007] Portable Single-File Executable Packaging (.NET 3.5 Win7 SP1+ Loopback Host)
- **Stage**: 5
- **Context**: Stage 5 requires ONE offline executable (`Win11_Simulator_1AS.exe`) runnable on clean Windows 7 SP1 machines with zero external DLLs, zero internet, embedding all HTML/CSS/JS/i18n/wallpapers (`__WIN11_INLINE_BG__`) and at most one optional `inf.dll` sidecar.
- **Options considered**:
  1. Edge WebView2 native EXE wrapper (requires WebView2 Runtime — unsupported/absent on many offline Windows 7 machines).
  2. Legacy `mshta.exe` / HTA wrapper (Trident IE engine breaks modern Flexbox/CSS Grid/SVG Arabic layout).
  3. Electron / NW.js Chromium bundle (~120+ MB unzipped multi-file directory or slow self-extractor).
  4. Bundle everything into one HTML file (`scripts/build-portable.js`), GZip-compress it into a native `.NET Framework v3.5` loopback host (`launcher/Win11SimLauncher.cs` -> `dist/Win11_Simulator_1AS.exe`) targeting `CLR 2.0.50727` (pre-installed on Windows 7 RTM/SP1).
- **Chosen option**: Option 4.
- **Rationale**: Produces a `21.86 MB` single EXE with zero external dependencies on Windows 7 SP1+, renders in Chromium `--app` or the default modern browser over `127.0.0.1` (`file://` double-click on `dist/Win11_Simulator_1AS.html` also works), handles `/api/inf` atomic sidecar R/W, and cleans up its temporary `%TEMP%` profile on exit.
- **Risks**: Requires a Windows 7-compatible browser (e.g. Firefox ESR 115 or Chrome/Edge 109) to exist on the target PC for HTML5 rendering.
- **Reversible?**: Partially — changing packaging changes `launcher/` and `scripts/build-portable.js`, while the core `index.html` web app stays framework-independent.
- **Files affected**: `scripts/build-portable.js`, `launcher/Win11SimLauncher.cs`, `js/core/state.js`, `dist/Win11_Simulator_1AS.html`, `dist/Win11_Simulator_1AS.exe`.

---

### [DEC-008] Dual-Layer Binary Encrypted `inf.dll` Protocol & Modal Replacement Guard
- **Stage**: 5
- **Context**: Classroom computers need zero-login startup reading configured institution/task settings from `inf.dll` offline, while preventing students from inspecting or altering teacher passwords, detecting 1-bit tampering, and avoiding `Win11Dialogs` race conditions when transitioning from password prompt to Teacher Console.
- **Options considered**:
  1. Legacy Base64 JSON with obfuscated XOR password field in `inf.dll`.
  2. Browser `window.crypto.subtle` WebCrypto API (unavailable in plain HTTP `127.0.0.1` or `file://` origins in several browsers, and absent on older Win7 engines).
  3. Zero-dependency pure-JS `js/core/config-crypto.js` (`SHA-256`, `HMAC-SHA256`, `PBKDF2-HMAC-SHA256` 100,000 iterations, `AES-256-CTR`, constant-time MAC check) using binary header `W11S\x02\x01` + `runtimeConfig` (password stripped permanently) + password-locked `teacherVault`, paired with `activeDialogToken` modal replacement guard in `dialogs.js`.
- **Chosen option**: Option 3.
- **Rationale**: Works deterministically across `file://`, HTTP loopback, and Node OpenSSL tests with zero WebCrypto origin restrictions, ensures neither password nor key touches disk, enforces a 5-attempt / 30s cooldown, strips UI hints, detects 1-bit tampering, and prevents closing modals from dismissing newly opened child modals.
- **Risks**: Pure-JS 100k-iteration PBKDF2 takes ~360–450 ms on password unlock/save (imperceptible interactively; negligible during student startup).
- **Reversible?**: Yes — backward-compatible reader keeps legacy v1 import support while upgrading saves to v2 binary `W11S\x02\x01`.
- **Files affected**: `js/core/config-crypto.js`, `js/core/dialogs.js`, `js/core/boot.js`, `js/pedagogy/assessment.js`, `js/pedagogy/teacher.js`, `js/i18n/{ar,fr,en}.{json,js}`, `index.html`.

---

### [DEC-009] Teacher Console 4-Tab Architecture, Normalized Weights & Exam Mode HUD
- **Stage**: 6
- **Context**: Stage 6 requires a complete Arabic RTL Teacher Panel covering institution info, `2026 / 2027`, PCs `01`–`20`, class groups CRUD, Training vs Exam mode, task activation/weights/order, interactive filename builder, report logo/visibility, `theme_lock`, `multi_user_mode`, `resetDemoSession`, `reset_defaults`, backup/restore, `audit_log`, and unsaved indicator.
- **Options considered**:
  1. Render all ~25 configuration controls inside one long scrollable vertical modal list.
  2. Group controls into four structured Windows 11 Fluent tabs (`المؤسسة والأفواج`, `النشاط والمهام`, `التسمية والتقرير`, `الأمان والملف`) with live state binding, normalized score scaling, `#tc-dirty-flag` indicator, and immediate Exam HUD / `PermissionGate` enforcement.
- **Chosen option**: Option 2.
- **Rationale**: Keeps complex controls scannable without clipping on `1024x768` / `1280x800`, enforces instant forbidden-character validation on filenames and password confirmation, hides HUD hints/steps in Exam mode (headlines + `HH:MM:SS` only), and locks themes/users dynamically.
- **Risks**: Closing the modal without clicking Save discards unsaved in-memory edits (mitigated explicitly by the live amber `#tc-dirty-flag` banner).
- **Reversible?**: Yes — self-contained inside `js/pedagogy/teacher.js` and `css/pedagogical.css`.
- **Files affected**: `js/pedagogy/teacher.js`, `js/pedagogy/assessment.js`, `js/pedagogy/hud.js`, `js/pedagogy/report.js`, `js/core/permission-gate.js`, `css/pedagogical.css`, `js/i18n/{ar,fr,en}.{json,js}`.

---

### [DEC-010] Fullscreen-First Startup, Safe Gesture Retry & Exam Fullscreen Lock
- **Stage**: 7
- **Context**: Classroom exams benefit from starting fullscreen without browser chrome (`Fullscreen-First`) and optionally locking Exam mode (`lock_fullscreen_in_exam`), yet browsers reject unprompted `requestFullscreen()` on initial `file://` load unless triggered cleanly and `Ctrl+Shift+S` must remain usable by the teacher.
- **Options considered**:
  1. Call `document.documentElement.requestFullscreen()` directly on `DOMContentLoaded` and leave unhandled rejections.
  2. Implement `enterFullscreenSafely()` with promise `.catch()` handling plus first-user-gesture attach in `boot.js`, taskbar `#tray-fullscreen-btn` + `F11` transitions, `fullscreenchange` re-sync, `isExamFullscreenLocked()` (blocking fullscreen exit and `Alt+Tab`/`Alt+Q`), while keeping `Ctrl+Shift+S` unconditionally active.
- **Chosen option**: Option 2.
- **Rationale**: Prevents unhandled console promise errors across strict browsers/automation, activates fullscreen reliably on first student interaction (or inside Chromium `--app`), fulfills discoverable `F11`/tray transitions, and lets teachers intervene anytime via `Ctrl+Shift+S`.
- **Risks**: Browser security guarantees let users force browser exit via holding `Esc`; re-entry triggers on the next student click while `lock_fullscreen_in_exam` is active.
- **Reversible?**: Yes — toggled via `lock_fullscreen_in_exam` in `inf.dll` and handled in `js/core/taskbar.js` / `js/core/boot.js`.
- **Files affected**: `js/core/taskbar.js`, `js/core/boot.js`, `docs/RUN_GUIDE.md`.

---

### [DEC-011] Windows 7 Legacy Compatibility Layer & CSS/Font/SVG Fallbacks
- **Stage**: 2–7 (Baseline Cross-Cutting)
- **Context**: Older classroom PCs running Windows 7 SP1 (`2 GB RAM`) lack Windows 11 `Segoe UI Variable`, `Segoe Fluent Icons`, Tailwind CDN access, ES2020 APIs (`replaceAll`, `Element.closest`, `CSS.escape`), and WebCrypto on `file://`.
- **Options considered**:
  1. Rely on online Google Fonts / icon CDNs and modern ES2021 JS features.
  2. Build a zero-dependency ES5/ES2017 compatibility runtime (`js/compat/compat.js`), fallback font stack (`"Segoe UI Variable Text", "Segoe UI", Tahoma, Arial, sans-serif`), solid high-contrast translucent card styling instead of fragile backdrop-blur dependencies, and offline inline SVG sprite helpers (`assets/icons/icons.js`).
- **Chosen option**: Option 2.
- **Rationale**: Guarantees identical crisp Arabic glyph shaping (`Tahoma` fallback on Windows 7) and 100% vector icon rendering offline with minimal GPU/RAM footprint.
- **Risks**: Minor visual flatness on systems lacking CSS `backdrop-filter`; readable contrast is maintained via explicit surface opacity tokens in `css/themes.css`.
- **Reversible?**: Yes — isolated inside `js/compat/compat.js`, `css/base.css`, `css/themes.css`, and `assets/icons/icons.js`.
- **Files affected**: `js/compat/compat.js`, `css/base.css`, `css/themes.css`, `assets/icons/icons.js`.

---

### [DEC-012] Teacher Console UX Format (Modal Overlay vs Settings App Page)
- **Stage**: 6
- **Context**: The Teacher Panel could either live as a route inside the student Settings window (`Win11SettingsApp`) or open as a dedicated privileged `ContentDialog` modal overlay independent of student windows and user accounts.
- **Options considered**:
  1. Add a hidden route inside `Win11SettingsApp` accessible via Settings search or URL hash.
  2. Render the 4-tab Teacher Console inside a wide high-priority `Win11Dialogs.showCustom` overlay triggered strictly by `Ctrl+Shift+S` + password unlock.
- **Chosen option**: Option 2.
- **Rationale**: Completely decouples administrative configuration from the student's virtual Windows OS session (`Invité`/`Standard` account restrictions or search indexing never leak or block the teacher), and guarantees immediate access even while the Lock Screen or Exam Fullscreen Lock is active.
- **Risks**: Cannot be dragged beside Settings windows simultaneously; acceptable because teachers adjust exam settings before or outside student work.
- **Reversible?**: Yes — `openTeacherPanel()` can mount its root DOM element into either `Win11Dialogs` or a dedicated shell window if ever needed.
- **Files affected**: `js/pedagogy/teacher.js`, `css/pedagogical.css`.

---

### [DEC-013] Kiosk Launcher Flags & First-Run Teacher / Student Classroom Startup Flow
- **Stage**: Continuation Phase (Sections 1 & 3)
- **Context**: Classroom browser sessions previously surfaced Chromium Translate/Sync prompts, required students to navigate to an optional login dialog before starting, and booted onto an already-ticking `"Eleve Demo"` timer even when `inf.dll` was missing or loaded.
- **Options considered**:
  1. Keep browser `--app` mode with optional Demo desktop boot and require `Ctrl+Shift+S` manually on unconfigured lab PCs.
  2. Pass quiet kiosk suppression flags (`--kiosk`, `--app`, `--noerrdialogs`, `--disable-sync`, `--disable-translate`, `--disable-features=Translate,msAccountSync,ChromeWhatsNewUI`) in `Win11SimLauncher.cs`, auto-launch the Teacher Panel when `inf.dll` is missing, silently load `inf.dll` into a mandatory non-skippable Student Registration Form when present (freezing session timers at `00:00:00` until submitted), and provide `"محاكاة جديدة"` (`startNewSimulation`) to wipe settings/score cleanly while retaining student info and `inf.dll`.
- **Chosen option**: Option 2.
- **Rationale**: Eliminates Chromium distraction popups, lets a teacher prepare `inf.dll` on first launch in one click, keeps `inf.dll` invisible to students (`Ctrl+Shift+S` only), and guarantees every timed attempt starts at `00:00:00` with verified student identity, class group, PC number, and mode.
- **Risks**: Unattended browser tabs over `file://` may still respect OS fullscreen policies; mitigated by `enterFullscreenSafely()` and Chromium Kiosk EXE packaging.
- **Reversible?**: Yes — isolated inside `launcher/Win11SimLauncher.cs`, `js/core/boot.js`, `js/core/dialogs.js`, and `js/pedagogy/{assessment,hud,teacher}.js`.
- **Files affected**: `launcher/Win11SimLauncher.cs`, `js/core/boot.js`, `js/core/dialogs.js`, `js/pedagogy/assessment.js`, `js/pedagogy/hud.js`, `js/pedagogy/teacher.js`.

---

### [DEC-014] Personalization Gallery Split & Arabic RTL Explorer Image Picker
- **Stage**: Continuation Phase (Section 2)
- **Context**: Displaying all 15 built-in backgrounds flat inside Personalization omitted the core Windows 11 workflow of browsing a folder (`Pictures`) via `"Browse photos"` (`استعراض صور`).
- **Options considered**:
  1. Keep all 15 wallpapers inside the gallery grid and open a simulated stub confirmation.
  2. Retain 13 built-in gallery wallpapers (`bg_00`–`bg_12`), relocate `bg/013.jpg` and `bg/014.jpg` into each user's virtual `C:\Users\<user>\Pictures\` (`Sahara_Sunset.jpg`, `Casbah_Alger.jpg`) via `Win11State.resolveMediaUrl()`, add a File Explorer `Pictures` view and interactive RTL `openImagePicker` modal triggered by `#btn-browse-wallpaper`, and log pedagogical mistakes when picking wrong folders or non-image files.
- **Chosen option**: Option 2.
- **Rationale**: Teaches authentic Windows 11 path navigation (`C:\Users\<user>\Pictures\`) while supporting both loose `file://` and inline Base64 single-HTML portable builds via `resolveMediaUrl()`.
- **Risks**: Increases Task 1 complexity slightly for students if they browse Desktop/Documents; mitigated by explicit task wording, configurable `wallpaper_source_folder` in Teacher Console, and clear Arabic feedback.
- **Reversible?**: Yes — controlled via `WALLPAPERS`, `session-manager.js`, `personalization.js`, and `file-explorer.js`.
- **Files affected**: `js/core/state.js`, `js/core/session-manager.js`, `js/apps/file-explorer.js`, `js/apps/settings/personalization.js`, `js/pedagogy/{assessment,teacher}.js`.

---

### [DEC-015] Strict Separation Between Windows Display Language & Keyboard Input Language
- **Stage**: Continuation Phase (Section 4 & Section 7)
- **Context**: Clicking `#tray-lang-btn` on the taskbar previously switched the UI `displayLanguage` across 3 hardcoded languages while Settings listed only `1` language (`FR_FR`), creating a direct truthfulness contradiction.
- **Options considered**:
  1. Synchronize `#tray-lang-btn` with UI display language so clicking taskbar translates Windows menus.
  2. Separate `displayLanguage` (`ar`/`fr`/`en`, changed exclusively via Settings -> Time & Language and evaluated in Task 4) from `installedLanguages[]` / `activeInputLang` (starting with `1` `FR_FR` keyboard matching Settings, synced live to `#tray-lang-btn` and `Alt+Shift` input cycling on Add/Remove without altering UI text).
- **Chosen option**: Option 2.
- **Rationale**: Matches real Windows 11 architecture 100%, removes the Settings ↔ Taskbar mismatch, and isolates the "Change Windows Display Language" evaluation competency cleanly from "Add/Switch Input Language".
- **Risks**: Users expecting the tray button to translate the UI must use Settings -> Time & Language -> Windows display language (matching real Windows 11).
- **Reversible?**: Yes — encapsulated in `Win11State` (`displayLanguage`, `installedLanguages`, `activeInputLang`), `time-language.js`, `home.js`, and `taskbar.js`.
- **Files affected**: `js/core/state.js`, `js/core/session-manager.js`, `js/core/taskbar.js`, `js/apps/settings/{time-language,home}.js`, `js/pedagogy/assessment.js`.

---

### [DEC-016] 6-Task Partial Credit / Critical Scoring & Uninstall Single-Source Cascade
- **Stage**: Continuation Phase (Sections 5, 6, 7)
- **Context**: Uninstalling programs previously left orphaned entries (`avast_tray` in Startup, hardcoded `Adobe Reader 9.3` in Default PDF viewer, stale entries in Start/Search), Quick Settings Bluetooth muted `airplaneMode` inconsistently, and grading lacked per-criterion partial credit and toggleable Critical (`all-or-nothing`) rules.
- **Options considered**:
  1. Keep binary full-score/zero tasks and patch UI lists individually.
  2. Implement a 6-task partial-credit & configurable Critical task engine (`3.0 + 2.5 + 3.0 + 2.5 + 3.0(critical) + 6.0 = 20.00`) with a timestamped Mistakes Log and rich Certificate breakdowns (`report.js`), and centralize `uninstallProgram()`, `getDefaultApps()`, radio helpers, Lock preview clock, and DND event emission in `Win11State` as the Single Source of Truth.
- **Chosen option**: Option 2.
- **Rationale**: Eliminates all orphaned OS/UI states (`avast_tray`, stale Default PDF, static `12:00` Lock preview, Settings Home `GMT+0` badge, Quick Settings radio desync) and delivers fair, auditable `20/20` classroom grading.
- **Risks**: Requires maintaining explicit `linkedStartupIds` metadata for any future preinstalled programs added to `session-manager.js`.
- **Reversible?**: Yes — all domain transitions run through `Win11State` APIs and `Win11Assessment` task definitions.
- **Files affected**: `js/core/{state,quick-settings,notifications,search,start-menu}.js`, `js/apps/settings/{apps,devices,network,personalization,home}.js`, `js/pedagogy/{assessment,teacher,report}.js`.

---

### [DEC-017] Ephemeral Guest (`Invité`) File Persistence During Session vs Explicit Admin Reset
- **Stage**: Continuation Phase II (Section 1)
- **Context**: File Explorer previously implied Guest (`Invité`) could not save files at all, and switching users discarded Guest session context ambiguously.
- **Options considered**:
  1. Block Guest file creation completely and erase Guest folder on every user switch.
  2. Allow Guest to create/save/modify files under `C:\Users\Invite\` during the active simulation, update the Arabic warning banner (`ملفات هذا الحساب مؤقتة وقد تُحذف عند تسجيل الخروج`), preserve Guest files/windows across `switchUser`, and purge Guest files only when an Administrator explicitly resets/disables the Guest account (`resetGuestAccount()` / `resetGuestSession()`).
- **Chosen option**: Option 2.
- **Rationale**: Accurately reflects real Windows Guest temporary-profile semantics during a single session while preserving predictable admin cleanup semantics.
- **Risks**: Unreset Guest files remain visible if switching back to Guest during the same simulation; intentional per spec.
- **Reversible?**: Yes — governed by `Win11Explorer` (`normalizeUserFolder`), `Win11Sessions`, and `Win11State.resetGuestAccount`.
- **Files affected**: `js/apps/file-explorer.js`, `js/core/session-manager.js`, `js/core/state.js`.

---

### [DEC-018] Sequential Active-Task Enforcement, Exam Titles-Only Mode & Balanced 20.00 Scoring
- **Stage**: Continuation Phase II (Sections 2, 3, 7)
- **Context**: Students could complete future tasks out of order randomly, Exam Mode exposed step hints, task weights were unbalanced (`3/2.5/3/2.5/3/6`), and mistakes could coexist with a `20.00/20` score or negative totals.
- **Options considered**:
  1. Allow arbitrary task execution order and clamp only the final weighted score.
  2. Enforce strict sequential `activeTaskIndex` progression in `Win11Assessment.evaluate()`, log premature future changes as `"إجراء مبكر"`, lock future HUD tabs (`.is-locked-task`) while marking only `.is-current-active`, hide step instructions and hints in Exam Mode (titles + `HH:MM:SS` only), balance default weights by complexity tier (`1.0 + 1.0 + 3.0 + 3.0 + 6.0 + 6.0 = 20.00`) with live complexity badges in Teacher Console, enforce global cross-user completion locking, prevent `20.00/20` whenever any mistake exists, and clamp net score `>= 0`.
- **Chosen option**: Option 2.
- **Rationale**: Enforces genuine pedagogical progression, eliminates guessing/jumping ahead, matches Baccalaureate exam integrity rules, and produces a mathematically clean `20.00` scale.
- **Risks**: Students cannot earn points out of sequence; clearly communicated via `"المهمة النشطة حالياً"` pill and Arabic early-action warnings.
- **Reversible?**: Yes — configured via `Win11Assessment`, `hud.js`, and `teacher.js`.
- **Files affected**: `js/pedagogy/{assessment,hud,teacher}.js`, `css/pedagogical.css`, `js/core/{permission-gate,lock-screen}.js`.

---

### [DEC-019] Accounts A–G Scenario, Avatar Permissions, Disabled Guest Password UI & Lock Shake
- **Stage**: Continuation Phase II (Sections 4, 5, 7)
- **Context**: Task 6 required end-to-end Windows account lifecycle grading (`A–G` plus optional `H` Avatar changes), Guest password buttons needed visual disablement, and wrong Sign-In passwords needed authentic Windows feedback.
- **Options considered**:
  1. Keep simple account creation + password check and silent modal error text.
  2. Support full A–G (+H Avatar) account lifecycle tracking with timestamped Account Events audit logging, block Guest avatar changes while allowing Standard self-avatar and Admin all-avatar edits, render Guest password controls explicitly disabled (`[data-guest-no-pass]`), fix numeric `getActiveTaskId() === 6` checks in `permission-gate.js`, and trigger `.win-shake` head-shake + `"كلمة المرور غير صحيحة. حاول مرة أخرى."` on invalid Sign-In passwords.
- **Chosen option**: Option 2.
- **Rationale**: Mirrors real Windows 11 Sign-In feedback, standard-vs-admin avatar authorization, and auditable user-management grading without false-positive `-0.25` UAC penalties during Scenario C.
- **Risks**: None; numeric task ID matching handles both `6` and `'task_accounts'` cleanly.
- **Reversible?**: Yes — isolated inside `state.js`, `accounts.js`, `permission-gate.js`, `lock-screen.js`, and `assessment.js`.
- **Files affected**: `js/core/{state,permission-gate,lock-screen}.js`, `js/apps/settings/accounts.js`, `js/pedagogy/assessment.js`.

---

### [DEC-020] Installer (`LabTools_Setup.exe`) & Optional Features Synced to Start/Search
- **Stage**: Continuation Phase II (Section 9)
- **Context**: Software setup previously lacked a Desktop installer wizard and Windows Optional Features toggle flow synced across Start Menu and Search.
- **Options considered**:
  1. Keep only preinstalled program uninstallation inside `Settings -> Apps`.
  2. Add Desktop `LabTools_Setup.exe` (`setup.exe`) wizard installation -> Installed Apps verification -> Uninstall cascade, plus Windows Optional Features (`الميزات الاختيارية`: `Paint`, `Games`) inside `Settings -> Apps` synchronized live with Start Menu `All apps` and `Win11Search`.
- **Chosen option**: Option 2.
- **Rationale**: Covers full Windows 11 application provisioning/de-provisioning competencies cleanly across `Settings -> Apps`, `Start`, and `Search`.
- **Risks**: Requires keeping `installedPrograms` and `optionalFeatures` unified in `Win11State`.
- **Reversible?**: Yes — managed through `Win11State`, `apps.js`, `start-menu.js`, and `search.js`.
- **Files affected**: `js/core/{state,start-menu,search,session-manager}.js`, `js/apps/settings/apps.js`.

---

### [DEC-021] Report Cleanup, Strict ASCII Export Filenames, JSON Removal & Shutdown Export Guard
- **Stage**: Continuation Phase II (Sections 6, 8, 10)
- **Context**: Evaluation reports exposed ambiguous Visit Counts and Start/End columns, generated non-ASCII/Arabic characters in exported filenames, offered unnecessary `.json` downloads, and exited without reminding students to export their PDF certificate.
- **Options considered**:
  1. Keep `.json` export and dual-column timestamps with raw Unicode filenames.
  2. Remove `"عدد الزيارات"` and `Start/End` columns (keeping ONLY `"المدة المستغرقة"` `HH:MM:SS`), add a dedicated `"جدول الخصومات والمخالفات التفصيلي"` (`+ إجمالي الخصومات`) and Account Events audit log, remove JSON export completely (`PDF` & `.html` only), transliterate Arabic tokens via `ARABIC_ASCII_MAP` / `transliterateToAscii()` / `cleanFileToken()` into strict ASCII (`[A-Za-z0-9.-]`), enforce ASCII-only pattern validation in Teacher Console, and wire Start Power `"إيقاف التشغيل"` through a confirmation warning (unfinished tasks + missing PDF export with inline `#btn-shutdown-export-pdf`) followed by `#shutdown-screen` and a 700ms delayed `/api/shutdown` + `window.close()`.
- **Chosen option**: Option 2.
- **Rationale**: Prevents filesystem/LMS encoding glitches on school servers, eliminates student distraction formats (`.json`), prevents accidental data loss at shutdown, and avoids aborting synchronous browser hooks prior to `#shutdown-screen` paint.
- **Risks**: Requires maintaining transliteration coverage in `ARABIC_ASCII_MAP` for Arabic class names/names.
- **Reversible?**: Yes — encapsulated in `report.js` and `teacher.js`.
- **Files affected**: `js/pedagogy/{report,teacher}.js`, `js/core/start-menu.js`, `css/pedagogical.css`.

---

### [DEC-022] Setup.exe Footer DOM Binding Fix, Optional Features UI & `i18n.setLanguage` Async Race Guard
- **Stage**: Continuation Phase III (Section 1.1 & 1.2)
- **Context**: `ContentDialog.showCustom()` rendered the modal body before appending footer buttons, causing `document.getElementById('btn-setup-install')` in `launchSetupWizard()` to evaluate `null`; `Settings -> Apps -> Optional Features` threw `TypeError: ctx.ui.groupHeader is not a function` and used undefined `.win-row` CSS classes; rapid synchronous language switching could settle stale async `fr.js` callbacks over `'ar'`.
- **Options considered**:
  1. Attach a delayed `setTimeout` DOM query in `launchSetupWizard` and alias `groupHeader` on `uiHelpers`.
  2. Bind installation directly in `#btn-setup-install`'s `onClick(closeDlg)` with progress animation, double-click guard, `Win11State.installSetupApp()`, live `apps:changed` refresh in `settings-app.js`; update `apps.js` (`sub === 'optional'`) to use `ctx.ui.groupLabel`, `.setting-row*` Fluent markup, and live filter input; add monotonic `langReqSeq` stale-callback cancellation in `Win11I18N.setLanguage`.
- **Chosen option**: Option 2.
- **Rationale**: Eliminates DOM creation order coupling, matches Windows 11 Optional Features card styling cleanly, and eliminates async race conditions on quick language changes.
- **Risks**: None; all existing dialog handlers remain compatible.
- **Reversible?**: Yes — localized in `js/core/dialogs.js`, `js/apps/settings/{apps,settings-app}.js`, and `js/i18n/i18n.js`.
- **Files affected**: `js/core/dialogs.js`, `js/apps/settings/apps.js`, `js/apps/settings/settings-app.js`, `js/i18n/i18n.js`.

---

### [DEC-023] Manual Task Skipping (`#hud-skip-btn`) & Equilibrium `20.00`-Point Rebalancing
- **Stage**: Continuation Phase III (Sections 2.1 & 2.2)
- **Context**: Students unable to finish an active task were blocked by sequential progression without a skip escape hatch, and default weights (`1.0 + 1.0 + 3.0 + 3.0 + 6.0 + 6.0`) over-weighted Task 5 (`6.00`) relative to its difficulty while `penalty_hint = 0.50` heavily penalized `1.00`-point tasks.
- **Options considered**:
  1. Unlock all future tasks unconditionally or award zero for the entire skipped task even when sub-steps were completed.
  2. Add `#hud-skip-btn` (`"تخطي المهمة"`) with confirmation modal -> `Win11Assessment.skipActiveTask()`, marking skipped tasks `"غير منجزة"` (`skipped: true, completed: false, lockedDone: true`) while preserving pre-skip partial points for completed sub-steps, applying optional Teacher `penalty_skip` (`#tc-pen-skip`, default `0.00`), and rebalancing tasks strictly to difficulty tiers (`1.00 + 2.00 + 3.00 + 4.00 + 4.00 + 6.00 = 20.00`) with `penalty_hint: 0.25`.
- **Chosen option**: Option 2.
- **Rationale**: Preserves strict sequential anti-skipping fairness, rewards partial student work honestly without rewarding uncompleted steps, keeps every section balanced (`Simple 1–2`, `Medium 3–5`, `Complex 6–10`), and protects against stale task unlocks on reload/switch.
- **Risks**: None; `evaluate()` and `startTickLoop()` explicitly exclude `tk.skipped` from auto-completion and ongoing timers.
- **Reversible?**: Yes — configurable through `Win11Assessment` defaults and the Teacher Console Activity tab.
- **Files affected**: `js/pedagogy/{assessment,hud,report,teacher}.js`, `css/pedagogical.css`, `js/i18n/{ar,fr,en}.{json,js}`.

---

### [DEC-024] Truthful 3-Section Windows 11 Accounts Layout & Background Guest Auto-Reset on Sign Out
- **Stage**: Continuation Phase III (Sections 3.1 & 3.2)
- **Context**: `Settings -> Accounts` displayed an invented `"إعادة تعيين الملفات"` (`[data-guest-reset]`) button and grouped `Add account` inside the top user hero card instead of matching Windows 11's `Your info` / `Account settings` / `Other users` hierarchy.
- **Options considered**:
  1. Keep manual Admin Reset button inside Accounts alongside flat user rows.
  2. Delete `[data-guest-reset]` completely from UI, trigger `Win11State.resetGuestAccount()` silently in the background on Guest Start Menu `Sign out` (`start-menu.js`, in addition to Admin `toggleGuestEnabled(false)` — never on `Switch user`), and restructure `accounts.js` into **Top** (`#acc-section-your-info`), **Middle** (`#acc-section-settings`: `Your info / Verify` + `Sign-in options`), and **Bottom** (`#acc-section-other-users`: `Add other user` + users list & Guest enable/disable toggle).
- **Chosen option**: Option 2.
- **Rationale**: Mirrors authentic Windows 11 Settings -> Accounts UX while preserving temporary session isolation during fast user switching (`switchUser`) and automatic cleanup at Guest logout.
- **Risks**: None; all UAC and `A–G + H` grading checks continue to pass via standard Controls.
- **Reversible?**: Yes — confined to `js/apps/settings/accounts.js` and `js/core/start-menu.js`.
- **Files affected**: `js/apps/settings/accounts.js`, `js/core/start-menu.js`, `js/i18n/{ar,fr,en}.{json,js}`.

---

### [DEC-025] Non-Destructive Student Info Editing (`Edit Info`) & Confirmation Guard on `بدء جلسة تقييم`
- **Stage**: Continuation Phase IV — UX Overhaul, Performance & Data Safety (Section 1)
- **Context**: Clicking `"بدء جلسة تقييم"` (`#hud-start-exam-btn` / `openStudentRegistration()`) mid-simulation opened the registration form and silently called `Win11Assessment.startSession()`, erasing all task progress, scores, mistakes, and timers without warning.
- **Options considered**:
  1. Disable `"بدء جلسة تقييم"` permanently once a session starts.
  2. Keep `#hud-start-exam-btn` guarded by an explicit confirmation dialog (`"بدء جلسة جديدة سيقوم بمسح كل تقدمك الحالي. هل أنت متأكد؟"`) whenever `student.activeSession === true`, returning cleanly to the intact simulation if canceled (and resetting cleanly only on confirmation + submit), while adding a dedicated non-destructive `#hud-edit-info-btn` (`"تعديل البيانات"`) wired to `Win11Assessment.updateStudentInfo()` (`editOnly: true`, mode radios disabled mid-session) so learners can fix their name, group, or PC number without losing any progress.
- **Chosen option**: Option 2.
- **Rationale**: Prevents accidental progress loss while still enabling both intentional session restarts and safe profile corrections mid-activity.
- **Risks**: None; startup mandatory prompt (`mandatory: true`, `activeSession === false`) bypasses the restart warning automatically.
- **Reversible?**: Yes — isolated to `js/pedagogy/{report,hud,assessment}.js` and i18n catalogs.
- **Files affected**: `js/pedagogy/{report,hud,assessment}.js`, `js/i18n/{ar,fr,en}.{json,js}`.

---

### [DEC-026] Apps List Pagination + Delegated Events, Coalesced Refresh, Setup.exe Desktop/Start Sync & Real Optional Features
- **Stage**: Continuation Phase IV — UX Overhaul, Performance & Data Safety (Sections 2 & 3)
- **Context**: `Settings -> Apps` rebuilt full DOM trees synchronously on re-entrant `apps:changed` emissions (`markInstalledAppsViewed()` inside `render` + duplicate `Win11SettingsApp.refresh()`), bound per-row closure click handlers without pagination, did not add a `LabTools 1AS` Desktop shortcut on `LabTools_Setup.exe` install, and displayed minimal placeholders for Optional Features without a realistic async Install loading state.
- **Options considered**:
  1. Keep eager DOM rendering with static placeholders.
  2. Coalesce `apps:changed` Settings refreshes via `requestAnimationFrame`, defer `markInstalledAppsViewed()` out of synchronous render, paginate `#ctrl-apps-list` (`PAGE_SIZE = 12` + `"عرض المزيد"`), convert `#ctrl-apps-list`, `#ctrl-user-apps-list`, and `#ctrl-apps-optional` to batch HTML + single delegated click handlers, add a Desktop Shortcut toggle + dynamic Desktop icon & Start All Apps / launchable window for `LabTools 1AS`, and provide three genuinely simulated interactive Optional Features (`Paint` `<canvas>` drawer, `Notepad` document editor, and interactive `Games` Memory Match) with realistic async Add/Remove loading indicators (`~350ms`) synced live to Start Menu & Search.
- **Chosen option**: Option 2.
- **Rationale**: Eliminates freeze/jank loops (< 100ms render even on large catalogs), fulfills Windows 11 OS install fidelity, and removes non-interactive placeholders in favor of authentic mini-apps.
- **Risks**: Async Optional Feature toggle completes in ~350ms; automated tests must wait ~450ms after clicking Add/Remove.
- **Reversible?**: Yes — localized in `js/apps/settings/{apps,settings-app}.js`, `js/core/{state,dialogs,taskbar,start-menu,search}.js`.
- **Files affected**: `js/apps/settings/{apps,settings-app}.js`, `js/core/{state,dialogs,taskbar,start-menu,search}.js`.

---

### [DEC-027] Maximizable/Resizable Assistant Window, Multi-Step Sub-Stage Progress Bars & Equal-Step Scoring Balance
- **Stage**: Continuation Phase IV — UX Overhaul, Performance & Data Safety (Sections 4, 5 & 6)
- **Context**: `#pedagogy-hud` supported width-only resizing without maximize/restore, rendered instructions as a dense paragraph without sub-task visual progress bars or `✔`/`○` step breakdown, and some multi-step tasks used uneven internal substep weights (`1.0+1.5+1.5`, `1.0+0.5+1.0+0.75+0.75`) causing irregular progress percentages.
- **Options considered**:
  1. Replace the `1+2+3+4+4+6=20.00` task difficulty weights with `3.33` per task (which leaves rounding remainder `19.98 != 20.00` and contradicts Section 2.2 of the previous phase).
  2. Upgrade `#pedagogy-hud` with draggable header, 2D corner resize (`width` + `height` + `.hud-body` scroll), `#hud-maximize-btn` (`Maximize`/`Restore` state preservation), top Session Overall Progress bar + Active Task Multi-Step Progress bar (`#hud-task-progress-bar`, `0%..100%`) + green `✔` / grey `○` formatted substep checklist in Training/Survey mode (keeping Exam steps hidden); normalize every multi-step task's internal sub-stages (`subSteps`) to **equal substep weights (`weight: 1`)** for exact uniform progress jumps (e.g. `25%->50%->75%->100%` across a 4-step flow) while preserving the `1+2+3+4+4+6=20.00` difficulty rubric, `penalty_hint: 0.25`, `penalty_skip: 0` (no penalty to other tasks on skip), and adding a one-click **"توزيع متساوٍ للمهام"** option in Teacher Console.
- **Chosen option**: Option 2.
- **Rationale**: Reconciles the previous phase's difficulty rubric (`1+2+3+4+4+6=20.00`) with Section 6's equal-stage weighting and Section 5's uniform step progress bars (`25%/50%/75%/100%`) without fractional rounding errors on `20.00`.
- **Risks**: None; instructors wanting flat equal task weights can click **"توزيع متساوٍ للمهام"** directly in Teacher Console.
- **Reversible?**: Yes — encapsulated in `js/pedagogy/{assessment,hud,teacher}.js` and `css/pedagogical.css`.
- **Files affected**: `js/pedagogy/{assessment,hud,teacher}.js`, `css/pedagogical.css`.

---

### [DEC-028] Emergency Hotfix: Incremental Keyed Apps Reconciliation, Partial Sub-Step Skip, HUD Header Nowrap & Scenario 2B Admin Fix
- **Stage**: Emergency Hotfix — App Freezing, UI Glitches & Logic Failures (Sections 1–7)
- **Context**: Installing `LabTools_Setup.exe` then clicking `إزالة` or toggling Optional Features could freeze the UI via a re-entrant `markInstalledAppsViewed() -> emit('apps:changed') -> rAF -> renderMainContent()` 60fps DOM-wipe loop, lacked unmount timer cancellation and `try/catch` error isolation, passed `html`/`wire` instead of `Win11Dialogs.showCustom`'s `renderBody`/`buttons` contract inside `launchUninstallWizard()`, lacked partial sub-step skipping (`تخطي هذه الخطوة`), jittered `#pedagogy-hud`'s header across timer ticks, and failed Scenario 2B if switching into the first created Admin instead of the last created Admin.
- **Options considered**:
  1. Throttle `apps:changed` blindly with a long `setTimeout` while continuing full innerHTML rewrites and leaving whole-task skip as the only escape hatch.
  2. Guard `markInstalledAppsViewed()` to emit **only on state transitions**, add `try/catch` + `console.error` + Arabic error dialogs across install/uninstall/feature state mutations, convert Installed Apps & Optional Features (`1000ms` real `.win-spinner`) to **keyed incremental DOM reconciliation** (`__syncAppsView`, `__onUnmount`, canceled modal intervals, single delegated handlers) without nested chrome, add `Win11Assessment.skipSubStep(taskId, stepIdx)` (`0` pts for skipped sub-step while remaining steps stay completable), stabilize `.hud-header` with `white-space: nowrap; flex-wrap: nowrap; font-variant-numeric: tabular-nums` + `lastRenderedStepSig` live refresh, generalize `evaluateAccountScenarioB(sc)` across any sole surviving created Admin (`switchUser` & `deleteAccount`), and ensure `js/i18n/{ar,fr,en}.js` pre-register onto `window.__WIN11_I18N__` even when loaded before `i18n.js`.
- **Chosen option**: Option 2.
- **Rationale**: Eliminates the root-cause re-entrant render loop cleanly (`emitCount: 2->3`, zero UI freeze), guarantees UI controls stay mounted across install/remove cycles, supports granular pedagogical skipping without discarding completed sub-steps, prevents HUD jitter, and evaluates Admin Scenario 2B deterministically regardless of which newly created Admin stays active.
- **Risks**: Optional Feature toggles simulate a genuine `1000ms` `.win-spinner` load; automated UI tests must wait `>= 1050ms` after click.
- **Reversible?**: Yes — cleanly modularized in `js/core/state.js`, `js/apps/settings/{apps,settings-app}.js`, `js/pedagogy/{assessment,hud}.js`, `css/{settings,pedagogical}.css`, and `js/i18n/{ar,fr,en}.{json,js}`.
- **Files affected**: `js/core/state.js`, `js/apps/settings/{apps,settings-app}.js`, `js/pedagogy/{assessment,hud}.js`, `css/{settings,pedagogical}.css`, `js/i18n/{ar,fr,en}.{json,js}`, `test/verify.js`.

---

### [DEC-029] Report Export Double-Escaping, Audit Log Field Alignment, Scenarios 6B/6F/6G & Nowrap A4 Table Styling
- **Stage**: Critical Bug Fix — Report Export Escaping & Evaluation Logic (Sections 1–5)
- **Context**: Exported reports displayed literal raw `<bdi dir="ltr">34</bdi>` inside the `"سجل أحداث الحسابات والتدقيق الزمني"` section heading due to wrapping pre-formatted HTML inside `Win11I18N.bidiHtml()`, rendered all logged audit events as `00:00:00 | '' | - | - | -` rows because `report.js` read `{ time, event, targetUser, accountType, details }` while `Win11State.logAccountEvent()` pushed `{ elapsed, wallTime, type, target, detailAr }` (and omitted `accountType` / omitted an empty-log message), and Tasks `6B`/`6F`/`6G` failed silently on Admin promotion via `updateAccountType`, original admin demotion before delete, out-of-order/edit-modal Standard password resets (`sc.stepE`), and re-login validation against the updated password.
- **Options considered**:
  1. Strip `<bdi>` from the heading and map aliases exclusively inside `report.js` while leaving `state.js` strict sequential checks unchanged.
  2. Keep `<bdi dir="ltr">` outside `bidiHtml()` concatenation, return `"لا توجد أحداث مسجلة."` without a `<table>` when `log.length === 0`, align both `Win11State.logAccountEvent()` (storing canonical + report fields and resolving `accountType` prior to deletion) and `renderAccountLogHtml()` (Arabic event labels + role labels, zero blank rows), enforce `white-space: nowrap` and `font-variant-numeric: tabular-nums` column rules across `css/pedagogical.css` and `buildStandaloneHtmlDoc()`, generalize `evaluateAccountScenarioB(sc)` + `updateAccountType()` (`originalAdminDeleted` + promoted Admins) and `setAccountPassword()` / `recordLoginSuccess()` (`pwChangedTargetUser`, decoupled from brittle ordering blocks) with `[Scenario6B]`/`[Scenario6E]`/`[Scenario6F]`/`[Scenario6G]` structured `console.info` traces.
- **Chosen option**: Option 2.
- **Rationale**: Fixes the double-escaping and property-mismatch root causes on both producer and consumer sides, prevents broken empty-dash tables, ensures consistent table layout in both screen modals and A4 print/standalone HTML, and makes Scenarios `6B`, `6F`, and `6G` deterministic across standard and out-of-order workflows.
- **Risks**: None; all existing report consumers and sequential scenario flows remain fully compatible.
- **Reversible?**: Yes — isolated to `js/core/state.js`, `js/core/start-menu.js`, `js/pedagogy/report.js`, and `css/pedagogical.css`.
- **Files affected**: `js/core/state.js`, `js/core/start-menu.js`, `js/pedagogy/report.js`, `css/pedagogical.css`, `test/verify.js`.

---

### [DEC-030] Final Pedagogical Polish: Single Deductions Table, Penalty-Free Guest Exploration, Live Apps Evaluation & Non-Blocking Off-Task Toast
- **Stage**: Final Pedagogical Polish & UX Fixes (Sections 1–5)
- **Context**: The final report rendered both `"سجل الأخطاء والملاحظات"` and `"جدول الخصومات والمخالفات التفصيلي"` redundantly; Guest (`Invité`) exploration of Access Denied / UAC limits logged a mistake penalty instead of awarding discovery points (`stepC`); completing Task 5 Optional Features required leaving Settings to view Start Menu while Installed Apps relied on deferred callbacks; and navigating into an unrelated Settings section during an active task either lacked immediate guidance or risked penalizing harmless navigation before any commit.
- **Options considered**:
  1. Keep both report tables, suppress Guest penalties without awarding discovery, leave Task 5 Start-Menu verification mandatory, and deduct immediately on off-task section navigation.
  2. Remove the duplicate `"سجل الأخطاء والملاحظات"` table from `js/pedagogy/report.js` (retaining only `"جدول الخصومات والمخالفات التفصيلي"` with task name, deduction reason, and deducted points); remove `logUnauthorizedMistake()` from `showGuestDeniedDialog()` and wire `Win11State.recordGuestBlockedAction()` to award `sc.stepC = true` across all Guest UAC/Access Denied probes (zero penalties in Guest mode); trigger `runAppsRefreshNow()` + `markInstalledAppsViewed()` synchronously while on Installed Apps and score Task 5 Optional Features immediately from `enabledOnce`/`disabledAfterEnable` (dropping non-scoring Start-Menu visit flags from `getTaskSignature(5, st)` and skipping false off-task penalties on immediate Arabic restore right after Task 1); and display a dismissible bottom-centered `.off-task-warning-toast` on off-task `enterSection()` navigation with `0` penalty on visit (deducting `-0.25` and logging in Deductions Table only upon committed off-task edits).
- **Chosen option**: Option 2.
- **Rationale**: Keeps the evaluation fair for exploration-based security learning (Guest account limits), avoids redundant report clutter, gives real-time reactive feedback inside Settings, and warns students contextually before penalizing committed off-task changes.
- **Risks**: None; verified across full sequential 6-task simulation, Guest UAC probes, live Installed Apps / Optional Features transitions, and off-task visit-vs-commit tests.
- **Reversible?**: Yes — localized in `js/pedagogy/{report,assessment}.js`, `js/core/{permission-gate,state}.js`, `js/apps/settings/{settings-app,apps}.js`, and `css/pedagogical.css`.
- **Files affected**: `js/pedagogy/{report,assessment}.js`, `js/core/{permission-gate,state}.js`, `js/apps/settings/{settings-app,apps}.js`, `css/pedagogical.css`, `test/verify.js`.

---

### [DEC-031] Auto-Suggested Highlighted Export Filename Dialog & Opposite-Corner Anchored HUD Resize
- **Stage**: Final Polish II — Filename Suggestion & Window Resizing UX (Sections 1–3)
- **Context**: Clicking PDF/HTML export in `openCertificate()` triggered immediate `window.print()` / `<a download>` without presenting an interactive editable File Name box pre-populated and highlighted with the teacher-defined `filename_template`; meanwhile, dragging `#pedagogy-hud`'s bottom-left resize handle in RTL after dragging the header (`el.style.left` pinned) expanded the opposite edge rather than expanding downwards and outwards, and constructing `'$'` inside a RegExp literal in `report.js` collided with `String.prototype.replace` `$'` semantics in `build-portable.js`.
- **Options considered**:
  1. Rely only on `document.title` for browser Print-to-PDF and keep RTL/LTR resize hardcoded to `offsetWidth` + `left` pinning.
  2. Add `openExportSaveDialog(ext, { fromCertificate })` in `js/pedagogy/report.js` opening before PDF/HTML export with `#export-filename-input` pre-populated via teacher rules (`previewNextFilename`), focused and fully highlighted (`select()` + `setSelectionRange(0, len)`), remaining freely editable (`normalizeExportFilename` using `slice` instead of RegExp `'$'` to stay bundle-safe); and anchor the true opposite corner in `#hud-resize-handle` `mousedown` (`top` + `right` anchored in RTL for bottom-left drag; `top` + `left` anchored in LTR for bottom-right drag) while keeping `320x240` minimum and viewport-clamped maximum bounds and matching diagonal grip styling in `css/pedagogical.css`.
- **Chosen option**: Option 2.
- **Rationale**: Gives students direct review/edit control with 1-keystroke overwrite or 1-click Save using the exact teacher naming scheme, ensures natural Windows resize behavior in both RTL and LTR even after moving the HUD window, and avoids `String.replace` `$'` replacement corruption during single-HTML packaging.
- **Risks**: None; verified in both loose `file://` mode and packaged single-HTML / `.exe` offline mode.
- **Reversible?**: Yes — isolated to `js/pedagogy/{report,hud}.js` and `css/pedagogical.css`.
- **Files affected**: `js/pedagogy/{report,hud}.js`, `css/pedagogical.css`, `test/verify.js`.

---

### [DEC-032] Windows 11 "About" (`حول التطبيق`) Window & Teacher Pedagogical Message
- **Stage**: Feature Addition — "About" (`حول التطبيق`) Window & Teacher's Message (Sections 1–4)
- **Context**: To conclude the simulator for 1AS secondary-school teachers and students in Algeria, the project needed a clean Windows 11-styled `"حول التطبيق"` dialog introducing the simulator, attributing the creator (`أستاذ الإعلام الآلي - السنة الأولى ثانوي (الجزائر)`), and sharing the pedagogical vision and roadmap verbatim.
- **Options considered**:
  1. Render the Teacher's Message inline inside `Settings -> System -> About` only.
  2. Implement `Win11Dialogs.showAbout()` (`showAboutModal()`) inside `js/core/dialogs.js` with authentic Windows 11 RTL typography (`line-height: 1.75`), `v1.0.0` pill badge, app metadata card, verbatim Teacher's Message, 4-principle Educational Vision list (`Autonomy`, `Interaction`, `Helping Each Other`, `Encouragement`), highlighted Roadmap card with italicized `خطوة أولى`, and `#btn-about-close` button; and wire entry points into `Settings -> System -> About` (`#sys-about-modal-btn`), Start Menu footer (`#start-about-btn`), Start right-click `Win+X` menu (`#ctx-start-about-app`), and Desktop right-click context menu (`#ctx-about-app`).
- **Chosen option**: Option 2.
- **Rationale**: Keeps `Settings -> System -> About` faithful to Windows 11 device specifications while exposing `"حول التطبيق"` from Settings, Start Menu, and Desktop context menus without interfering with task evaluation or Start power menu ordering.
- **Risks**: None; verified open, Arabic RTL rendering, close, and re-open across all entry points with zero errors.
- **Reversible?**: Yes — isolated to `js/core/{dialogs,context-menu,start-menu}.js` and `js/apps/settings/system.js`.
- **Files affected**: `js/core/{dialogs,context-menu,start-menu}.js`, `js/apps/settings/system.js`, `test/verify.js`.
