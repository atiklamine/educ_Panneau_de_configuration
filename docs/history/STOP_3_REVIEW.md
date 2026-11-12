# STOP 3 — Final Delivery Package Review (Stage 9 + Continuation Phases I–IV + Emergency Hotfix)

**Project**: Arabic-First Windows 11 Educational Simulator (1AS)  
**Delivery Date**: 2026-11-12  
**Workspace**: `d:\enseignement\dev_tools\settings_projects\003`  
**Stage Reached**: Stage 9 + Continuation Phases I–IV + Emergency Hotfix Complete — **STOP 3 (Full Final Delivery Package)**

---

## 1. Executive Summary

All refinement phases (Stages 2–9, **Continuation Phases I–IV**, and **Emergency Hotfix — App Freezing, UI Glitches & Logic Failures Sections 1–7**) are complete, rebuilt into the single-file offline Windows 7-compatible deliverable (`dist/Win11_Simulator_1AS.exe` and `dist/Win11_Simulator_1AS.html`), and verified end-to-end with **0 Critical** and **0 Medium** open defects.

- **Installed Apps Freeze Elimination & Lightweight Windows 11 Redesign (Hotfix Sections 1, 5 & 6)**: Eliminated the re-entrant `markInstalledAppsViewed() -> apps:changed -> renderMainContent()` loop, wrapped all install/uninstall/feature mutations in `try/catch` + Arabic error dialogs, fixed `launchUninstallWizard()` to use `Win11Dialogs.showCustom()`'s `renderBody`/`buttons`/`onClose` contract cleanly, converted `#ctrl-apps-list` and `#ctrl-apps-optional` to keyed incremental DOM reconciliation with clean `.apps-win11-row` cards, and added a real `1000ms` `.win-spinner` indicator + `"مثبّت"` / `"غير مثبّت"` status on Optional Features.
- **Partial Sub-Step Skip (`تخطي هذه الخطوة`) (Hotfix Section 2)**: Added `Win11Assessment.skipSubStep(taskId, stepIndex)` (`0` pts for skipped sub-step while remaining sub-steps stay active and earn points) and delegated `[data-skip-step-idx]` buttons inside `#hud-steps-list`.
- **Assistant HUD Stability & User Accounts Scenario 2B (Hotfix Sections 3 & 4)**: Locked `.hud-header` to single-line `nowrap` (`height: 42px`, `tabular-nums`), added live substep change detection inside `updateLiveStatsOnly()`, and generalized `evaluateAccountScenarioB(sc)` across `deleteAccount()` and `switchUser()` so deleting `MENIAI` and the other created Admin reliably lights green `✔` checkmarks (`stepB = true`) and updates HUD progress bars.
- **Continuation Phase IV & Prior Phases Preserved Cleanly (Phases I–IV)**: Non-destructive `#hud-edit-info-btn`, wipe confirmation guard on `"بدء جلسة تقييم"`, Desktop shortcut for `LabTools 1AS`, interactive Canvas `Paint` / `Notepad` / `Games`, Mandatory Student Info Form (`00:00:00` until submit), Missing `inf.dll` auto-setup, `Alt+Shift` input language separation, Guest `C:\Users\Invite\` persistence until Sign out / Admin reset, 3-section Accounts UI, `.win-shake` wrong-password alert, `#hud-skip-btn` (`غير منجزة`), ASCII-only export filenames, Deductions Table, Zero JSON export, and Start Shutdown Guard (`#shutdown-screen`).

---

## 2. Clean Active Project File Tree

### Core Runtime & Entry
- `index.html` — Main desktop shell entry point (`lang="ar"`, `dir="rtl"`, UTF-8, runs directly over `file://`)
- `assets/icons/icons.js` — Inline vector SVG icon library with unique gradient IDs
- `bg/000.jpg` … `bg/014.jpg` — 15 built-in Windows 11 wallpapers (`000.jpg`–`014.jpg`/`.jpeg`/`.png`)

### Stylesheets (`css/`)
- `css/base.css`, `css/rtl.css`, `css/shell.css`, `css/windows.css`, `css/settings.css`, `css/themes.css`, `css/pedagogical.css`

### JavaScript Architecture (`js/`)
- Compatibility & Startup: `js/compat/compat.js`, `js/core/boot.js`, `js/core/config-crypto.js`
- Session & Privilege Core: `js/core/session-manager.js`, `js/core/permission-gate.js`, `js/core/state.js`
- Shell & Windowing: `js/core/window-manager.js`, `js/core/snap-manager.js`, `js/core/taskbar.js`, `js/core/start-menu.js`, `js/core/context-menu.js`, `js/core/quick-settings.js`, `js/core/notifications.js`, `js/core/search.js`, `js/core/task-view.js`, `js/core/lock-screen.js`, `js/core/dialogs.js`
- Trilingual i18n (`ar` default, `fr`, `en` with `<bdi dir="ltr">` BiDi isolation): `js/i18n/i18n.js`, `js/i18n/{ar,fr,en}.json`, `js/i18n/{ar,fr,en}.js`
- Applications & Settings Modules: `js/registry/settings-registry.js`, `js/apps/file-explorer.js`, `js/apps/control-panel.js`, `js/apps/edge-browser.js`, `js/apps/settings/{settings-app,home,system,devices,network,personalization,apps,accounts,time-language,gaming,accessibility,privacy,windows-update}.js`
- Pedagogy & Teacher Console: `js/pedagogy/{assessment,hud,report,teacher}.js`

### Portable Packaging, Build & Verification (`scripts/`, `launcher/`, `build/`, `dist/`, `test/`)
- `scripts/build-portable.js` — Builds single HTML (`30741 KB`), GZip asset (`22406 KB`), and compiles portable `.exe` (`21.91 MB`) via `.NET Framework v3.5\csc.exe`
- `launcher/Win11SimLauncher.cs` — Native `.NET 3.5` localhost HTTP + `/api/inf` + `/api/shutdown` loopback wrapper with quiet Chromium kiosk suppression flags (`--kiosk`, `--app`, `--noerrdialogs`, `--disable-sync`, `--disable-translate`, `--disable-features=Translate,msAccountSync,ChromeWhatsNewUI`)
- `build/Win11_Simulator_1AS.html.gz` — Compressed single-HTML resource embedded into EXE
- `dist/Win11_Simulator_1AS.html` — Standalone single-file offline web deliverable (`30741 KB`)
- `dist/Win11_Simulator_1AS.exe` — Primary portable Windows 7–11 single-file offline executable (`21.91 MB`)
- `dist/inf.dll` — Active encrypted teacher configuration sidecar (`W11S\x02\x01`, preserved)
- `test/test-crypto.js`, `test/verify.js`, `test/test-stage5-portable.js`, `test/screenshots/01`–`13_*.png`

### Documentation & Logs (`docs/`, root `.md`)
- `TRUTHFULNESS_AUDIT.md` — Surface-by-surface Windows 11 accuracy audit, Continuation Phases I–IV fix log, Single Source of Truth map, and `UNCERTAIN` human-verification items
- `docs/RUN_GUIDE.md` — Classroom & Windows 7 offline launch guide, shortcuts, `inf.dll` workflow, build & test commands
- `docs/STAGE1_SPEC.md`, `docs/STAGE2_ARCHITECTURE.md`, `docs/STAGE8_ERROR_REPORT.md`
- `DECISIONS.md` (`[DEC-CLEANUP]`, `[DEC-001]`–`[DEC-031]`)
- `TEST_REPORT.md` (Stages 2–8 + Continuation Phases I–IV + Emergency & Report/Evaluation Hotfixes automated test logs)
- `STOP_1_REVIEW.md`, `STOP_2_REVIEW.md`, `STOP_3_REVIEW.md`

### Archived Legacy Files (`_archive_to_delete/`, zero permanent deletions)
Contains 16 abandoned WPF/legacy items moved safely during Stage 0 cleanup (`Simulator_Project/`, `Distribution/`, `build.ps1`, `Win11ControlPanelSimulator.exe`, `Simulateur_Win11_Education.zip`, `Simulateur_Win11_Web_Portable.zip`, and 10 legacy root debug PNG/JPG screenshots). Safe to delete whenever you approve.

### Ambiguous Pre-Existing Items Preserved Untouched
As agreed at STOP 1, these four workspace items remain untouched for your manual decision:
- `Consulter_Resultats.bat`
- Root `inf.dll` (pre-existing legacy sample file from before v2 binary upgrade — do **not** treat as a production v2 sidecar without re-saving from Teacher Console)
- `win11screenshots/`
- `ملفات وزارية/` (`livre_panneaux_de_configurations.pdf`, `التدرجات الخاصة بلوحة التحكم.png`)

---

## 3. Diagnosis Report (Broken -> Fixed)

| Original Defect / Gap | Root Cause Identified | Resolution Implemented & Verified |
| :--- | :--- | :--- |
| Teacher Console leaked on `F12`, `Ctrl+Shift+P`, and desktop context menu | Explicit listeners in `taskbar.js` + `desktop.teacherSettings` menu item | Removed `F12`, `Ctrl+Shift+P`, and context menu entry cleanly; bound strictly to `Ctrl+Shift+S` (`e.code === 'KeyS'`) — 0 grep hits across codebase. |
| Switching accounts leaked windows, settings navigation, wallpaper, files, and timers | Global mutable singletons in `state.js`, `window-manager.js`, and `settings-app.js` | Built `Win11Sessions` (`HKLM` vs `HKCU` split), `.user-session-layer` DOM containers, per-session `appUi`, and ephemeral Guest teardown. |
| Standard and Guest accounts bypassed privileges across Apps, System, Network, Languages | Flat inline check only inside `accounts.js` | Implemented `Win11Permissions` matrix, declarative `permAction` UI auto-revert, Arabic UAC Admin Elevation modal, and Guest mistake logging. |
| Student state persisted across browser restarts via `localStorage` | `win11_sim_v2_state` & `win11_sim_v2_teacher_cfg` stored locally | Enforced RAM-only student session + startup `purgeLegacyPersistence()` & `verifyCleanStartup()` deleting storage/cookies/IndexedDB. |
| Evaluation certificate had escaped `<bdi>` buttons, clipped modal header/footer, Visit/Start-End clutter, non-ASCII filenames, and JSON leakage | Unflagged button HTML strings, unbounded modal body height, Arabic export tokens, `.json` button | Added `btnDef.safeHtml`, modal `activeDialogToken` guard, viewport clamping + `@media print`, removed Visit Count & Start/End columns (`HH:MM:SS` Duration only), added Deductions Table + Account Log, transliterated filenames to pure ASCII (`Class_...`), removed `.json` export completely (PDF & `.html` only), and added Shutdown Guard `#btn-shutdown-export-pdf` + `#shutdown-screen`. |
| Teacher `inf.dll` stored Base64 plaintext/password hints & app required loose files | Unencrypted JSON payload + `localStorage` hint + loose folder assets | Built pure-JS `W11S\x02\x01` binary crypto (`PBKDF2-HMAC-SHA256` 100k + `AES-256-CTR` + `HMAC-SHA256`), removed all password hints, added 5-attempt cooldown & tamper recovery, and packaged into `Win11_Simulator_1AS.exe`. |
| Missing Teacher Console controls for 2026/2027, device `01-20`, exam mode, filename pattern builder, fullscreen lock | Single flat modal with limited fields | Implemented 4-tab Fluent Teacher Console (`teacher.js`), Exam mode HUD (no hints/steps + `HH:MM:SS`), `theme_lock`, `multi_user_mode`, live filename pattern validation, `resetDemoSession`, `audit_log`, and Fullscreen-First startup. |

---

## 4. Verification & Error Report Summary

Full details are recorded in [`TEST_REPORT.md`](file:///d:/enseignement/dev_tools/settings_projects/003/TEST_REPORT.md) and [`docs/STAGE8_ERROR_REPORT.md`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/STAGE8_ERROR_REPORT.md).

- **Build (`node scripts/build-portable.js`)**: Exit `0` — `dist/Win11_Simulator_1AS.html` (`30741 KB`), `build/Win11_Simulator_1AS.html.gz` (`22406 KB`), `dist/Win11_Simulator_1AS.exe` (`21.91 MB`), preserving `dist/inf.dll`.
- **Crypto & Tamper Parity (`node test/test-crypto.js`)**: Exit `0` — `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED` (`enc=419ms, unlock=391ms`, PBKDF2-HMAC-SHA256 100k + AES-256-CTR + HMAC-SHA256 + 1-bit tamper detection & OpenSSL parity).
- **Full Browser Simulation Suite (`node test/verify.js`)**: Exit `0` — **`81 / 81 PASS`** (`0` failures, `0` console errors or CORS blocks over `file://`), covering all Stage 2–9 features, Phases I–IV fixes, Emergency Hotfix checks, Report Escaping & Evaluation Logic (`6B`/`6F`/`6G`), **Final Pedagogical Polish**, and **Final Polish II** (highlighted editable teacher-pattern Export Save Dialog + opposite-corner anchored HUD resize in RTL & LTR).
- **Isolated Portable EXE & `inf.dll` Suite (`node test/test-stage5-portable.js`)**: Exit `0` — **`6 / 6 PASS`** (single HTML `13+2` inline wallpapers with `0` console errors, clean EXE auto-opening Teacher Panel without `inf.dll`, encrypted binary `inf.dll` save from `#tc-save-btn` + silent load without hints, 5-attempt cooldown, vault unlock, 1-bit tamper detection).
- **Recursive Leakage & `TODO` Scan**: **`0`** teacher shortcut/UI leakage matches, **`0`** hardcoded credentials, and **`0`** case-sensitive `TODO`/`FIXME` matches across `index.html`, `js/`, `css/`, `launcher/`.
- **Open Defects**: **Critical: `0` | Medium: `0` | Known Limitations / Low: `1`**.

---

## 5. Requirement Compliance Checklist (Stages 0–9)

| Requirement | Status | Verification Evidence |
| :--- | :--- | :--- |
| Cleanup plan & safe archival into `_archive_to_delete/` | **Done** | Verified 16 legacy items archived; zero permanent deletions (`DECISIONS.md` `[DEC-CLEANUP]`). |
| Strict `Ctrl+Shift+S` Teacher shortcut; zero student UI exposure | **Done** | Verified by recursive grep (`0` hits) + `verify.js` (`Ctrl+Shift+S` `KeyS`, 11 context items). |
| Real Windows account isolation (`Administrateur`, `Standard`, `Invité`) & UAC | **Done** | Verified in `verify.js` (per-user windows/themes/files, UAC prompt, ephemeral Guest wipe). |
| Fresh-start guarantee across launches (`purgeLegacyPersistence`) | **Done** | Verified across `Page.reload` in `verify.js` (zero residual cookies/storage). |
| Auto `HH:MM:SS` timers, Lock Screen suspend, per-task timing, shortest-time tie-breaker | **Done** | Verified in `verify.js` (`durFmt: 01:01:05`, `suspendedSeconds`, `compareStudents`). |
| Report card modal fixes (`safeHtml`, viewport fit, ASCII transliterated filenames, `.html`/PDF only, zero JSON) | **Done** | Verified in `verify.js` on `1280x800` & `1024x768` + inspected `07_stage4_report_dialog_ar_rtl.png` (`noJsonBtn: true`, `hasPdfAndHtml: true`). |
| Single portable `.exe` (`Win7 SP1+` `.NET 3.5`) + Single HTML | **Done** | Built `dist/Win11_Simulator_1AS.exe` & `dist/Win11_Simulator_1AS.html`; tested in isolated folder. |
| Binary encrypted `inf.dll` (zero stored password/key, cooldown, tamper detection) | **Done** | Verified in `test-crypto.js` (`W11S\x02\x01`, OpenSSL parity) & `test-stage5-portable.js`. |
| Full 4-tab Teacher Console, `2026/2027`, PCs `01-20`, Exam HUD, Logo, Dirty indicator | **Done** | Verified in `verify.js`, `test-stage5-portable.js`, & inspected `08_` + `09_` screenshots. |
| Fullscreen-First startup & Exam Fullscreen Lock preserving `Ctrl+Shift+S` | **Done** | Verified in `verify.js` (`Ctrl+Shift+S` works under Exam Lock, zero console errors). |
| Complete documentation (`RUN_GUIDE.md`, `DECISIONS.md`, `TEST_REPORT.md`, `TRUTHFULNESS_AUDIT.md`, Error Report) | **Done** | All docs updated to Continuation Phases I & II (Sections 1–11) and post-final-edit counts. |
| Surface-by-surface Windows 11 Truthfulness Audit + Single Source of Truth | **Done** | `TRUTHFULNESS_AUDIT.md` completed; Lock clock, Home language badge, radio/DND sync & 5 `UNCERTAIN` human checks documented. |
| Quiet Kiosk Chromium flags + Direct Teacher setup when `inf.dll` missing + Silent `inf.dll` startup | **Done** | Verified in `Win11SimLauncher.cs`, `verify.js` (`teacherOpenOnMissing: true`), and `test-stage5-portable.js`. |
| Mandatory Student Info Form (`00:00:00` until submit) + `محاكاة جديدة` reset | **Done** | Verified in `verify.js` (`preSubmitTimerZero: true`, `stillOpenAfterEsc: true`, `startNewSimulation`). |
| Wallpaper split (`13` gallery + `2` `C:\Users\<user>\Pictures`) + Browse RTL File Picker | **Done** | Verified in `verify.js` (wrong pick mistake log + `pic_sahara` selection) and `test-stage5-portable.js` (`13+2` inline). |
| Display Language (`Task 4`) vs Input Language (`#tray-lang-btn`, `Alt+Shift`) separation | **Done** | Verified in `verify.js` (`1` initial `FRA FR` -> `2` after AR add, zero UI leak). |
| Installer (`LabTools_Setup.exe`) UI Install button + Optional Features (`Paint`, `Games`) UI cards synced to Start/Search | **Done** | Verified via real `#btn-setup-install` & `[data-opt-feat="paint"]` clicks in `verify.js` (`paintOn: true, paintOff: false`, `defPdfUpdated: true`). |
| Guest temporary `C:\Users\Invite\` persistence vs auto-reset on Sign Out + `#hud-skip-btn` + Balanced `1+2+3+4+4+6=20.00` weights | **Done** | Verified in `verify.js` (`guestPersistRes`, `hasCustomFileAfterReset: false`, `activeIdx === 3`, `t2SkippedPartialKept: true`, `1+2+3+4+4+6=20.00`). |
| Truthful 3-section Windows 11 Accounts layout + ZERO invented Reset Files button + Accounts `A–G` + Avatar RBAC + Disabled Guest password UI + `.win-shake` Lock + Start Shutdown Export Guard (`#shutdown-screen`) | **Done** | Verified in `verify.js` (`noResetBtnAttr: true`, `hasAccountSettings: true`, `net: 20, done: 6`, `hasShake: true`, `shutdownAfterPdfExport`, `shutdownScreenVisible: true`). |
| Continuation Phase IV: Start Evaluation wipe guard & `#hud-edit-info-btn`, `< 100ms` paginated Apps List (`0.90ms`), `LabTools_Setup.exe` Desktop shortcut, Optional Features (`Paint`, `Notepad`, `Games`) mini-apps, HUD maximize/2D-resize, `✔`/`○` substep checklist, `0%->100%` progress bars & `#tc-equal-weights` (`20.00`) | **Done** | Verified in `verify.js` (`Phase IV Sec 1–4-6`), `test-stage5-portable.js`, and 54-file hygiene scan (`0` TODO/leakage, `0` console errors). |
| Emergency Hotfix: Freeze/deadlock fix (`Install Setup -> Remove -> Install Paint` via keyed incremental reconciliation + transition-only `markInstalledAppsViewed`), `try/catch` + Arabic error dialogs, partial sub-step skip (`skipSubStep`), `.hud-header` nowrap stability, Scenario 2B Admin deletion fix, & lightweight Windows 11 Installed Apps + `1000ms` Optional Features `.win-spinner` | **Done** | Verified in `verify.js`, `test-stage5-portable.js`, `test-crypto.js`, and screenshot `10_hotfix_installed_apps.png`. |
| Report Export Escaping & Evaluation Logic Fix: Removed nested `<bdi>` double-escaping in Audit Log header, aligned `logAccountEvent()` & `renderAccountLogHtml()` (`"لا توجد أحداث مسجلة."` without table when empty, populated `HH:MM:SS` / event / user / role / details rows when populated), fixed Scenarios `6B`, `6F`, `6G` + `console.info` traces, and added `white-space: nowrap` A4 table rules | **Done** | Verified in `verify.js`, `test-stage5-portable.js`, `test-crypto.js`, and screenshot `11_report_hotfix_ar_rtl.png`. |
| Final Pedagogical Polish & UX Fixes (Sections 1–5): Removed duplicate `"سجل الأخطاء والملاحظات"` keeping only `"جدول الخصومات والمخالفات التفصيلي"`, removed Guest UAC mistake penalties while crediting `stepC = true`, synced live Installed Apps & Optional Features evaluation without navigating away, and added dismissible `.off-task-warning-toast` deducting only on committed off-task edits | **Done** | Verified in `verify.js`, `test-stage5-portable.js`, `test-crypto.js`, `SCAN_HITS=0`, and screenshot `12_final_polish_ar_rtl.png`. |
| Final Polish II — Export Filename Suggestion & HUD Directional Resize (Sections 1–3): Added `openExportSaveDialog()` pre-filling & fully highlighting teacher-defined editable filenames (`#export-filename-input`), anchored opposite HUD corner during bottom-corner resize in RTL & LTR (`320×240` min), and eliminated bundle `$'` RegExp collision | **Done** | Verified in `verify.js` (`81 / 81 PASS`), `test-stage5-portable.js` (`6 / 6 PASS`), `test-crypto.js`, `SCAN_HITS=0`, and screenshot `13_export_filename_hud_resize.png`. |
| Feature Addition — "About" (`حول التطبيق`) Window & Teacher's Message: Added `Win11Dialogs.showAbout()` (`v1.0.0`, exact verbatim Arabic message, Educational Vision & Roadmap) with entry points in `Settings -> System -> About` (`#sys-about-modal-btn`), Desktop context menu (`#ctx-about-app`), Start `Win+X` (`#ctx-start-about-app`), and Start Menu (`#start-about-btn`) | **Done** | Verified in `verify.js` (`83 / 83 PASS`), `test-stage5-portable.js` (`6 / 6 PASS`), `test-crypto.js`, `SCAN_HITS=0`, and screenshot `14_about_window_ar_rtl.png`. |

---

## 6. Build & Offline Windows 7 Run Guide Reference

See [`docs/RUN_GUIDE.md`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/RUN_GUIDE.md) for full classroom instructions. Quick summary:
- **Classroom Run (Win7 SP1+ / Win10 / Win11)**: Copy `dist/Win11_Simulator_1AS.exe` (optionally alongside configured `inf.dll`) into any lab folder and double-click — zero internet or external dependencies needed.
- **Direct Browser Run**: Double-click `index.html` or standalone `dist/Win11_Simulator_1AS.html`.
- **Teacher Console**: Press `Ctrl+Shift+S` at any time.
- **Rebuild & Re-test Commands**:
  1. `node scripts/build-portable.js`
  2. `node test/test-crypto.js`
  3. `node test/verify.js`
  4. `node test/test-stage5-portable.js`

---

## 7. Known Limitations & Adopted Assumptions

1. **OS-Reserved `Win+*` Shortcuts Inside Browser**: Browsers and Windows intercept hardware `Win+L` before page JavaScript; `Alt+*` equivalents (`Alt+I`, `Alt+A`, `Alt+N`, `Alt+D`, `Alt+S`, `Alt+L`, `Alt+Tab`, `Alt+X`, `Alt+Shift` input language cycling, `F11`) work reliably, while `Ctrl+Shift+S` remains reserved strictly for teachers.
2. **Browser Requirement on Legacy Windows 7**: `.NET Framework 3.5` (built into Windows 7 SP1) powers `Win11_Simulator_1AS.exe`, automatically launching Chromium in quiet kiosk mode (`--kiosk --app --noerrdialogs --disable-sync --disable-translate --disable-features=Translate,msAccountSync,ChromeWhatsNewUI`) or falling back to Firefox/default browser; a Windows 7-compatible browser (e.g., Firefox ESR 115 or Edge/Chrome 109) must be present for HTML5/CSS3 rendering.
3. **Browser Fullscreen Policy**: Standard browsers block unprompted fullscreen without user interaction or `Esc` hold inside browser tabs; `enterFullscreenSafely()` suppresses unhandled promise errors and engages fullscreen cleanly on first student click (and auto-re-engages inside Exam Lock).
4. **Root `inf.dll` Compatibility**: The pre-existing root `inf.dll` (left untouched under Ambiguous Items) is an older pre-v2 artifact; for production classrooms, place a newly saved binary `inf.dll` next to `dist/Win11_Simulator_1AS.exe`.
5. **Adopted Assumptions**: Single active host per student exam session (RAM-only state by design so student A never sees student B's state), default Arabic UI (`ar`) with optional switching, normalized/weighted point scaling managed inside Teacher Settings (`المؤسسة والأفواج` / `النشاط والمهام`), and local PDF generation via the browser Print dialog (`window.print()`).

---

**Decision Requested at STOP 3**: Review the deliverables in `dist/`, `TEST_REPORT.md`, `DECISIONS.md`, and `docs/STAGE8_ERROR_REPORT.md`, and decide whether to permanently delete `_archive_to_delete/` and the four untouched ambiguous items (`Consulter_Resultats.bat`, root `inf.dll`, `win11screenshots/`, `ملفات وزارية/`).

