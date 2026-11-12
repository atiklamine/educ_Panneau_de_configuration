# Test & Verification Report — Windows 11 Arabic Simulator (Stages 2–8)

Automated verification covers headless Chrome DevTools Protocol (`node test/verify.js`) over `file://` (`1280x800` and `1024x768 @ 2x DPR`), Node OpenSSL parity & 1-bit tamper verification (`node test/test-crypto.js`), and isolated temporary-folder portable `.exe` + encrypted binary `inf.dll` execution (`node test/test-stage5-portable.js`). All entries follow the per-stage discipline schema.

---

## Cleanup Verification (Post `_archive_to_delete/` Move) — 2026-11-11
### Tests run
- Archive legacy WPF/EXE/Zip/debug files to `_archive_to_delete/` without permanent deletion → **PASS** → `index.html` launches directly over `file://`; 16 legacy items moved; 4 ambiguous items untouched.
- `node test/verify.js` baseline run → **PASS** → `29 / 29 PASS` (0 console/CORS errors).
### Regressions checked
- Default Arabic launch, 48px taskbar, 15 wallpapers (`bg/000`–`bg/014`), Settings sections, UTF-8 `inf.dll` Arabic roundtrip → **PASS**.
### Arabic/RTL audit
- Desktop, Start Menu, Search, Personalization (`bg/000`–`014`) → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- Student state previously persisted to `localStorage` → Planned & fixed in Stage 4.

---

## Stage 2 — Architecture Refinement & Shortcut Hygiene — 2026-11-11
### Tests run
- Recursive shortcut/UI exposure search (`teacherSettings`, `F12`, `Shift+P`) across runtime `index.html`, `js/`, `css/`, `i18n` → **PASS** → `0 matches`.
- CDP shortcut test (`F12`, `Ctrl+Shift+P`, `Ctrl+Shift+S` with `KeyS` / Arabic `س`) → **PASS** → `F12 -> false`, `Ctrl+Shift+P -> false`, `Ctrl+Shift+S -> true` (`#teacher-auth-pass` rendered).
- Desktop context menu count after removing teacher entry → **PASS** → reduced cleanly from `12` to `11`.
### Regressions checked
- Core modules `Win11Sessions` (`session-manager.js`) & `Win11Permissions` (`permission-gate.js`) load cleanly without script errors → **PASS**.
- `node test/verify.js` full baseline → **PASS** (`29 / 29`).
### Arabic/RTL audit
- Teacher password authentication modal & right-click desktop menu (`11` items) → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- Account isolation DOM partitioning queued for Stage 3 → Fixed in Stage 3.

---

## Stage 3 — Real User Accounts, Privileges & Session Isolation — 2026-11-11
### Tests run
- `node test/verify.js` (Stage 3 multi-user suite) → **PASS** → `35 / 35 PASS` (`0` console errors).
- Switch User `MENIAI` (Admin) → `Eleve` (Standard) isolation check → **PASS** → `#windows-layer .win-window` drops to `0`, theme resets to `light`, `bg_00`, `paintInstalled: false`, `Secret_MENIAI.txt` absent.
- Switch Back `Eleve` → `MENIAI` restoration check → **PASS** → restores `2` live windows, Settings route, `dark` theme, `bg_03`, `u_paint`, and `Secret_MENIAI.txt`.
- Standard user clicking Uninstall system app (`AVAST`) → **PASS** → Arabic UAC Admin Elevation modal opens (`#uac-admin-select`).
- Guest (`Invité`) restriction + ephemerality → **PASS** → blocks uninstall & self-disable, logs mistake (`mistakesAfter: 3`), wipes Guest windows/session completely on sign-out.
### Regressions checked
- Quick Settings Dark Mode toggle, Multi-path Control Panel → Accounts parity, UAC last-Admin & built-in Guest protection → **PASS**.
### Arabic/RTL audit
- `test/screenshots/06_stage3_uac_guest_ar_rtl.png` (Arabic UAC prompt, Guest read-only banner, `<bdi dir="ltr">Invité</bdi>`) → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- Ephemeral storage purge & report layout/filename fixes queued for Stage 4 → Fixed in Stage 4.

---

## Stage 4 — Fresh-Start Guarantee, Time-Based Evaluation & Report Fixes — 2026-11-11
### Tests run
- `node test/verify.js` (Stage 4 persistence purge, timing, and report suite) → **PASS** → `42 / 42 PASS`.
- Seeded `win11_sim_v2_state` & `win11_sim_v2_teacher_cfg`, cookies, and `sessionStorage` reload purge → **PASS** → `verifyCleanStartup()` wipes all student keys; boots clean (`MENIAI`, `bg_00`, `netScore: 0`, `timerAutoStarted: true`).
- Lock Screen / Switch User timer suspension → **PASS** → pauses active clock and increments `suspendedSeconds`.
- Per-task `HH:MM:SS` formatting & `compareStudents()` shortest-active-time tie-breaker → **PASS** → `durFmt: 01:01:05`, shorter active duration wins tie.
- Token filename builder with Arabic class group (`1_ثانوي_جذع_مشترك_علوم_وتكنولوجيا_فوج_1_...`) & unique suffix `_2.html` → **PASS** → zero `1_-_1` mangling.
- Modal bounds check (`1280x800` & `1024x768`) + standalone `.html` download → **PASS** → `top=16`, `bottom=784 <= 800`, `scrollTop=0`, zero escaped `<bdi>` on PDF/HTML/JSON buttons.
### Regressions checked
- Stages 2 & 3 assertions (RTL Chrome, all 15 wallpapers, account isolation, UAC) → **PASS**.
### Arabic/RTL audit
- `test/screenshots/07_stage4_report_dialog_ar_rtl.png` (unclipped header/footer, clean PDF/HTML/JSON buttons, BiDi isolated filename preview, `0.00` zero penalty) → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- Single-file `.exe` packaging & binary `inf.dll` encryption queued for Stage 5 → Fixed in Stage 5.

---

## Stage 5 — Portable Single-File Executable & Encrypted `inf.dll` — 2026-11-11
### Tests run
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30501 KB`), `build/Win11_Simulator_1AS.html.gz` (`22357 KB`), `dist/Win11_Simulator_1AS.exe` (`21.86 MB`, `.NET Framework v3.5 csc.exe` CLR `2.0.50727`).
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED` (byte parity vs Node OpenSSL `PBKDF2-HMAC-SHA256`/`AES-256-CTR`/`HMAC-SHA256`, 1-bit tamper failure across 6 binary header/vault/MAC offsets).
- `node test/test-stage5-portable.js` (isolated temp directory) → **PASS** → `6 / 6 PASS`:
  - Standalone HTML over `file://` loads all `15/15` inline wallpapers with `0` console errors.
  - Isolated EXE without `inf.dll` boots with safe defaults and zero extra files created beside `.exe`.
  - `#tc-save-btn` writes binary `W11S\x02\x01` `inf.dll` beside EXE with zero plaintext/password leakage.
  - Restarting with encrypted `inf.dll` auto-loads institution config, strips password hints, enforces 5-attempt 30s cooldown, and decrypts vault on valid password.
  - 1-bit flip in `inf.dll` triggers tamper refusal, Arabic startup security warning dialog, and safe defaults fallback.
### Regressions checked
- `node test/verify.js` full shell, UAC, session, and report checks → **PASS**.
### Arabic/RTL audit
- Tamper warning dialog, missing-file setup modal, cooldown alert, and inline wallpapers inside standalone HTML → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- Expanded 4-tab Teacher Console & Fullscreen-First Exam lock queued for Stages 6–7 → Fixed in Stages 6–7.

---

## Stage 6 & Stage 7 — Full Teacher Console, Exam HUD & Fullscreen-First Behavior — 2026-11-11
### Tests run
- Student registration device `<select>` `#stu-reg-pc` (`01`–`20`) → **PASS** (`isSelect: true, count: 20, first: "01"`).
- Teacher Panel 4 tabs (`المؤسسة والأفواج`, `النشاط والمهام`, `التسمية والتقرير`, `الأمان والملف`) rendering `2026 / 2027` & live `#tc-dirty-flag` → **PASS**.
- Interactive Filename Pattern Builder live forbidden-char rejection (`\ / : * ? " < > |`) & token reorder preview (`18.50_1_ثانوي_فوج_1_04m12s_BENALI_Mohammed_2026-11-11.pdf`) → **PASS**.
- Exam mode HUD (hides hints & detailed instructions; headlines + `HH:MM:SS` timer only) → **PASS**.
- Teacher `theme_lock` enforcement during exam (`stillBg00: true, lockDlgOpen: true`) → **PASS**.
- Fullscreen-First startup (`enterFullscreenSafely`), taskbar `#tray-fullscreen-btn` + `F11`, Exam `Alt+Tab` lock, Window Maximize ↔ Windowed transitions (`maxToggled: true, taskbarIntact: true`), and `Ctrl+Shift+S` bypass under Exam Lock → **PASS**.
- Encrypted `inf.dll` Backup Export (`exportBinaryInfDll`) & Import Restore (`loadInfBytes`), `#tc-reset-defaults` (`2026 / 2027`), and `resetDemoSession()` (`net === 0, mistakes === 0`) → **PASS**.
### Regressions checked
- Taskbar height `48px`, Start Menu, Settings navigation, Window snapping, and multi-user sessions under fullscreen/exam locks → **PASS**.
### Arabic/RTL audit
- Inspected `test/screenshots/08_stage6_teacher_panel_ar_rtl.png` & `test/screenshots/09_stage6_exam_hud_ar_rtl.png` → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- None (Critical: `0`, Medium: `0`).

---

## Continuation Phase — Truthfulness, Classroom Workflow & Single Source of Truth (Sections 0–8) — 2026-11-11
### Tests run (Post-Final-Edit Execution, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30557 KB`), `build/Win11_Simulator_1AS.html.gz` (`22368 KB`), `dist/Win11_Simulator_1AS.exe` (`21.87 MB`), preserving `dist/inf.dll` (`1350` bytes) untouched.
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=382ms, unlock=398ms)`.
- `node test/verify.js` → **PASS** → **`61 / 61 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`):
  - **Missing `inf.dll` Auto-Setup & Silent Load**: Opening without `inf.dll` launches straight into Teacher Panel (`teacherOpenOnMissing: true`); loaded `inf.dll` enters non-skippable Student Info Form with `Escape` blocked and clock held at `00:00:00` until form submit.
  - **Wallpaper Split & Browse Picker (`Section 2`)**: `13` built-in gallery wallpapers (`bg/000..012`) + `2` `Pictures` folder wallpapers (`bg/013`, `bg/014`); Browse picker logs mistake on `.txt` non-image and applies `pic_sahara` (`Sahara_Sunset.jpg`).
  - **Language Separation (`Section 4`)**: Taskbar shows initial `FRA FR` (`1` matching language), updates to `2` after Arabic input add (`ARA DZ`) without changing Arabic UI display language, and Task 4 tracks Windows display language change separately.
  - **Uninstall Cascade (`Section 6`)**: Removing `avast_antivirus` removes `AVAST! Tray Shield` (`avast_tray`) from Startup Apps cleanly; removing `adobe_reader` falls back `getDefaultApps().pdfViewer` to `Microsoft Edge`.
  - **6-Task Grading & Certificate (`Section 5`)**: Exact `20.00 / 20` across all 6 tasks (`3.0 + 2.5 + 3.0 + 2.5 + 3.0 + 6.0`), rich 9-column report table + mistakes section.
  - **New Simulation (`Section 1.3`)**: `#hud-new-sim-btn` confirmation wipes settings/score to `0.00` and resets timers while retaining `KHELIFI Amine`, PC `07`, and `inf.dll`.
  - **Single Source of Truth (`Section 7`)**: Lock screen preview clock (`#ctrl-lockscreen-preview`) matches `Win11State.getSimulatedNow()`, Settings Home Language card shows `العربية (الجزائر)`, and Default PDF viewer updates dynamically.
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** in isolated temporary directory (single HTML `13` gallery + `2` Pictures inline wallpapers decoded with `0` errors; isolated EXE missing `inf.dll` auto-opens Teacher Panel; `#tc-save-btn` writes binary `W11S\x02\x01` `inf.dll` with zero hints; 5-attempt cooldown; vault unlock; 1-bit tamper recovery).
- Recursive leakage scan across `index.html`, `js/`, `css/`, `docs/RUN_GUIDE.md`, `docs/STAGE8_ERROR_REPORT.md` → **PASS** → `0` teacher shortcut/UI leakage matches.
### Regressions checked
- Stages 2–7 features re-verified inside `test/verify.js` (`61 / 61`) and `test/test-stage5-portable.js` (`6 / 6`) → **PASS**.
### Arabic/RTL audit
- Inspected `test/screenshots/07_stage4_report_dialog_ar_rtl.png`, `08_stage6_teacher_panel_ar_rtl.png`, and `09_stage6_exam_hud_ar_rtl.png` → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**; `Alt+L`, `Alt+*` equivalents, `Alt+Shift`, `F11`, and `Ctrl+Shift+S` operate normally).
- 5 optional Windows 11 locale/UX questions documented in [`TRUTHFULNESS_AUDIT.md`](file:///d:/enseignement/dev_tools/settings_projects/003/TRUTHFULNESS_AUDIT.md) Section 4 (`UNCERTAIN — needs human verification`).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Continuation Phase II — Logical, Pedagogical & UI Refinements (Sections 1–11) — 2026-11-12
### Tests run (Post-Final Code & Doc Edit Execution, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30644 KB`), `build/Win11_Simulator_1AS.html.gz` (`22387 KB`), `dist/Win11_Simulator_1AS.exe` (`21.89 MB`), preserving `dist/inf.dll` (`1350` bytes) untouched.
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED` (PBKDF2-HMAC-SHA256 100k + AES-256-CTR + HMAC-SHA256 + 1-bit tamper parity).
- `node test/verify.js` → **PASS** → **`62 / 62 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), verifying:
  - **Guest Temporary Files (`Section 1`)**: Guest banner warns files are temporary; `C:\Users\Invite\` allows file creation & editing persisting across `switchUser`, cleared ONLY when an Administrator resets Guest (`resetGuestAccount`).
  - **Strict Sequential Active Task & Exam Titles-Only (`Section 2`)**: Premature Task 2 change while Task 1 is active earns `0`, leaves `activeTaskIndex === 0`, logs `"إجراء مبكر"`, and HUD locks future tabs while highlighting `.is-current-active`; Exam Mode hides hints and step instructions.
  - **Balanced Weights & Setup / Optional Features (`Sections 3 & 9`)**: Sequential completion across Tasks 1–5 (`1.0 + 1.0 + 3.0 + 3.0 + 6.0 = 14.00`), Desktop `LabTools_Setup.exe` install/uninstall, and `Settings -> Apps` Optional Features (`Paint`, `Games`) synced live to Start All Apps & Search (`paintOn: true, paintOff: false`).
  - **Accounts A–G + Avatars + Guest Disabled Password + Lock Shake (`Sections 4, 5, 7`)**: Full Accounts scenario with Guest avatar block, Standard self-avatar edit, Admin full avatar edit, disabled Guest password UI (`[data-guest-no-pass]`), `.win-shake` + `"كلمة المرور غير صحيحة. حاول مرة أخرى."` on invalid Sign-In password, `6/6` global cross-user freeze yielding `20.00 / 20`, strict block preventing `20.00/20` when any mistake exists, and `net >= 0` floor clamping.
  - **Report Cleanup, ASCII Filenames & Shutdown Export Guard (`Sections 6, 8, 10`)**: Removed `"عدد الزيارات"` and `Start/End` columns (kept `"المدة المستغرقة"` `HH:MM:SS`), verified `"جدول الخصومات والمخالفات التفصيلي"` & Account Events audit log, removed `.json` export (PDF & `.html` only), transliterated Arabic inputs into pure-ASCII filenames, rejected non-ASCII pattern characters in Teacher Console (`#tc-pattern-error`), and verified Start -> `"إيقاف التشغيل"` unfinished-tasks & missing-PDF warnings with inline `#btn-shutdown-export-pdf` + `#shutdown-screen` + delayed close.
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** in isolated temporary directory.
- Recursive leakage & `TODO`/`FIXME` scan across `js/`, `css/`, `launcher/`, `index.html` → **PASS** → **`0`** leakage matches, **`0`** case-sensitive `TODO`/`FIXME` hits.
### Arabic/RTL audit
- Inspected headless Chrome RTL metrics, bi-directional filename patterns, unescaped HTML buttons (`noDoubleBdiPdf`, `noDoubleBdiHtml`), Deductions Table, Lock Screen shake alert, and Shutdown Guard modal across `1280x800` and `1024x768` viewports → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**; `Alt+L`, `Alt+*` equivalents, `Alt+Shift`, `F11`, and `Ctrl+Shift+S` operate normally).
- 5 optional Windows 11 locale/UX questions remain listed in [`TRUTHFULNESS_AUDIT.md`](file:///d:/enseignement/dev_tools/settings_projects/003/TRUTHFULNESS_AUDIT.md) Section 4 (`UNCERTAIN — needs human verification`).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Continuation Phase III — Bug Fixes, Scoring Balance & Truthful UI (Sections 1–4) — 2026-11-12
### Root Cause Analysis & Documented Fixes
1. **Bug 1.1 (`#btn-setup-install` in `LabTools_Setup.exe` wizard did nothing)**:
   - *Root Cause*: `ContentDialog.showCustom()` in `js/core/dialogs.js` invoked `opts.renderBody()` before creating `.win-dialog-footer` buttons, so `document.getElementById('btn-setup-install')` returned `null` while the button definition only returned `true`.
   - *Fix*: Removed the dead `renderBody` lookup, moved install orchestration directly into `#btn-setup-install`'s `onClick(closeDlg)` with double-click guard, progress bar animation, `Win11State.installSetupApp()`, `Win11SettingsApp.refresh()`, `apps:changed` listener in `settings-app.js`, and completion modal.
2. **Bug 1.2 (`Settings -> Apps -> Optional Features` rendered a blank white page)**:
   - *Root Cause*: `js/apps/settings/apps.js` (`sub === 'optional'`) called non-existent `ctx.ui.groupHeader(...)` (valid helper is `ctx.ui.groupLabel`), throwing `TypeError` before appending `#ctrl-apps-optional`, and used undefined `.win-row*` CSS classes.
   - *Fix*: Replaced with `ctx.ui.groupLabel(...)`, live search filter (`#opt-features-filter`), `.setting-row*` Fluent UI cards for `Paint` & `Games`, and UAC-guarded `Install / Enable` & `Uninstall / Disable` actions.
3. **`Win11I18N.setLanguage` Rapid-Toggle Async Race**:
   - *Root Cause*: Asynchronous `<script src="js/i18n/fr.js">` callbacks could complete after a subsequent synchronous `'ar'` selection and overwrite the active UI locale.
   - *Fix*: Added `langReqSeq` request token guard in `js/i18n/i18n.js` so stale script loads cancel cleanly.

### Tests run (Post-Code Edit Build & Verification, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30677 KB`), `build/Win11_Simulator_1AS.html.gz` (`22390 KB`), `dist/Win11_Simulator_1AS.exe` (`21.89 MB`), preserving `dist/inf.dll` (`1350` bytes) untouched.
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=393ms, unlock=399ms)`.
- `node test/verify.js` → **PASS** → **`65 / 65 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), verifying:
  - **Bug 1.1 & 1.2 Real UI Clicks**: Real click on `#btn-setup-install` installs `LabTools 1AS` (`flowInstalled: true`, completion message displayed); navigating to `apps -> optional` renders `Paint` & `Games` rows and enables `Paint` on `[data-opt-feat="paint"]` click.
  - **Section 2.1 Skip Task (`#hud-skip-btn`)**: Skipping Task 1 (0 work) sets `skipped: true`, `completed: false`, `earnedPoints: 0`, `.is-skipped-task` tab; skipping Task 2 after partial work preserves `1.00 / 2.00`, displays `"غير منجزة"` in `buildA4Html()`, advances active task (`activeIdx === 3`), and applies `penalty_skip` only when `> 0`.
  - **Section 2.2 Rebalanced `20.00` Scale**: Verified sequential cumulative totals `1 -> 3 -> 6 -> 10 -> 14 -> 20.00` across `1.0 + 2.0 + 3.0 + 4.0 + 4.0 + 6.0`, `penalty_hint = 0.25`, and Teacher Console `#tc-pen-skip`.
  - **Sections 3.1 & 3.2 Accounts UI & Background Guest Reset**: Verified `Start -> Sign out` resets Guest files/windows automatically in background (`hasCustomFileAfterReset: false`), zero `[data-guest-reset]` / `"إعادة تعيين الملفات"` button in Accounts UI, and exact 3-section Windows 11 layout (`#acc-section-your-info`, `#acc-section-settings [Verify, Sign-in options]`, `#acc-section-other-users`).
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** in isolated temporary directory.
- Recursive scan across `54` source files (`index.html`, `js/`, `css/`, `launcher/`) → **PASS** → `0` `TODO`/`FIXME`, `0` teacher UI/shortcut leakage hits, `0` stale `data-guest-reset`/`groupHeader` references.
### Arabic/RTL audit
- Verified Arabic RTL layout on Optional Features, Accounts 3-section hierarchy, Skip confirmation/badge `"غير منجزة"`, Report table, and Lock Screen wrong-password shake (`"كلمة المرور غير صحيحة. حاول مرة أخرى."`) → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**; `Alt+L`, `Alt+*` equivalents, `Alt+Shift`, `F11`, and `Ctrl+Shift+S` operate normally).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Continuation Phase IV — UX Overhaul, Performance & Data Safety (Sections 1–7) — 2026-11-12
### Root Cause Analysis & Documented Fixes
1. **Start Evaluation Data Loss & Non-Destructive Edit Info (Section 1)**:
   - *Root Cause*: `#hud-start-exam-btn` invoked `Win11Report.openStudentRegistration()`, whose submit handler unconditionally called `Win11Assessment.startSession()`, wiping mistakes, task progress, and elapsed time silently.
   - *Fix*: Guarded `openStudentRegistration()` when `stu.activeSession` is true with an Arabic confirmation prompt (`"بدء جلسة جديدة سيقوم بمسح كل تقدمك الحالي. هل أنت متأكد؟"`) preserving all state on Cancel, and added non-destructive **`تعديل البيانات`** (`#hud-edit-info-btn`, `editOnly: true`) backed by `Win11Assessment.updateStudentInfo()` with `#stu-mode-training`/`#stu-mode-exam` locked mid-session.
2. **Apps List Render Freeze & Synchronous Loop (Section 2)**:
   - *Root Cause*: Opening `Settings -> Apps` synchronously called `Win11State.markInstalledAppsViewed()`, emitting `apps:changed`, which triggered an overlapping `renderMainContent()` pass in `settings-app.js`, while `apps.js` built unbounded row nodes with per-row click closures.
   - *Fix*: Coalesced `apps:changed` refreshes via `requestAnimationFrame` (`isRenderingMain` + `scheduleAppsRefresh()` in `settings-app.js`), deferred `markInstalledAppsViewed()`, rewrote `apps.js` with `PAGE_SIZE = 12` pagination (`#apps-load-more-btn`, `#apps-show-all-btn`), debounced search (`60ms`), batched HTML joins, and single delegated click handlers across Installed Apps, User Apps, and Optional Features.
3. **LabTools Desktop Shortcut & Interactive Optional Features (Section 3)**:
   - *Root Cause*: `LabTools_Setup.exe` installed into `installedPrograms` & Start Menu without creating an optional Desktop shortcut; `Optional Features` lacked `Notepad`, async install/remove feedback, and interactive app windows beyond basic stubs.
   - *Fix*: Added `#setup-desktop-shortcut` checkbox in `launchSetupWizard()`, dynamic `labtools-shortcut` icon on Desktop (`taskbar.js`) + `openLabToolsApp()`, added `Notepad` (`المفكرة`) alongside `Paint` & `Games` with Windows 11 Installed/Available grouping and `280ms` progress bars, and built functional HTML5 Canvas `Paint`, `Notepad` (`#win-notepad-editor` with Save to `Documents`), and 8-card Memory Match `Games` (`#game-mem-grid`).
4. **Assistant Window UX, Step Checklist & Substep Progress Bars (Sections 4–6)**:
   - *Root Cause*: `#pedagogy-hud` lacked Maximize/Restore and height resizing, rendered plain instructions without visual `✔`/`○` substep tracking or task/overall progress bars, and coupled substep progress unevenly to task weights.
   - *Fix*: Added `#hud-maximize-btn` (`.is-maximized`), 2D resize corner (`width` + `height`), scrollable `.hud-body`, `#hud-overall-progress-bar`, `#hud-task-progress-bar` (`0% -> 50% -> 100%`), `#hud-steps-list` green `✔` / grey `○` substep checklist (hidden in Exam mode), uniform substep `progressPercent` calculation across Tasks 1–6 while retaining configurable `20.00` task weights, and Teacher Console `#tc-equal-weights` (`3.33..3.35` totaling `20.00`).

### Tests run (Post-Final Edit Verification, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30703 KB`), `build/Win11_Simulator_1AS.html.gz` (`22399 KB`), `dist/Win11_Simulator_1AS.exe` (`21.90 MB`), preserving `dist/inf.dll` (`1350` bytes).
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=354ms, unlock=326ms)`.
- `node test/verify.js` → **PASS** → **`69 / 69 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), including:
  - **Phase IV Sec 1**: `"بدء جلسة تقييم"` confirmation Cancel preserves `net: 1, activeIdx: 1`, and `#hud-edit-info-btn` (`editModeLocked: true`) updates student name while keeping score and active index intact.
  - **Phase IV Sec 2**: `Settings -> Apps` renders `50+` programs in **`0.90ms`** (`< 100ms`), paginates `12 -> 24` rows in **`0.60ms`**, and handles delegated clicks smoothly.
  - **Phase IV Sec 3**: `LabTools_Setup.exe` creates/removes `#desktop-icons [data-desk-id="labtools-shortcut"]`; Optional Features (`Paint`, `Notepad`, `Games`) show inline progress bars on Add/Remove and launch interactive Canvas Paint (`#win-paint-canvas`), Notepad (`#win-notepad-editor`), and Memory Match (`#game-mem-grid` 8 cards).
  - **Phase IV Sec 4–6**: HUD `#hud-maximize-btn` toggle, `#hud-resize-handle` 2D width+height resize, `✔`/`○` substep checklist, `0% -> 50%` smooth `#hud-task-progress-bar`, `#hud-overall-progress-bar`, and Teacher `#tc-equal-weights` (`20.00`).
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** (`75 / 75 PASS` combined across browser suites).
- Recursive source scan (`51` files across `index.html`, `js/`, `css/`, `launcher/`) → **PASS** → `0` `TODO`/`FIXME`, `0` leakage hits, `0` stale refs.
### Arabic/RTL audit
- Verified Arabic RTL layout on confirmation warning dialog, `#pedagogy-hud` maximized & 2D-resized states, `✔`/`○` checklist, Apps pagination bar, Optional Features Installed/Available sections, Canvas Paint, Notepad, and Games → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Emergency Hotfix — App Freezing, UI Glitches & Logic Failures (Sections 1–7) — 2026-11-12
### Root Cause Analysis & Documented Fixes
1. **Installed Apps Freeze / Deadlock on `Install -> Remove -> Install Paint` (Sections 1 & 6)**:
   - *Root Cause*: `markInstalledAppsViewed()` unconditionally emitted `apps:changed` + `state:changed` even when already verified, creating a re-entrant `setTimeout(0) -> rAF -> renderMainContent()` loop; `launchUninstallWizard()` used invalid `html`/`wire` properties on `Win11Dialogs.showCustom()` (missing `renderBody`/`buttons`), lacked modal close interval cancellation, and state mutations were unguarded against runtime exceptions.
   - *Fix*: Emitted `markInstalledAppsViewed()` strictly on state change (`!verifiedInstalled` / `!verifiedUninstalled`), wrapped `emit()`, `uninstallProgram()`, `installSetupApp()`, and `setOptionalFeatureEnabled()` in `try/catch` with error logging and Arabic error dialogs (`settings.apps.opErrorTitle`), switched `launchUninstallWizard()` to `renderBody` + `buttons` + `onClose` interval cleanup, added `__onUnmount` / `__syncAppsView` lifecycle hooks in `settings-app.js`, and rewrote `apps.js` with **keyed incremental DOM reconciliation** (`[data-prog-row]`) so row installs/removals never wipe `#apps-filter-input` or recreate row listeners (`emitCount` stays `<= 3` across install+uninstall).
2. **Partial Sub-Step Skipping (`تخطي هذه الخطوة`) (Section 2)**:
   - *Fix*: Added `Win11Assessment.skipSubStep(taskId, stepIndex)` tracking skipped sub-steps per task (`0` pts for skipped step), keeping remaining sub-steps active and completable, advancing cleanly via `allStepsResolved`, and wiring delegated `[data-skip-step-idx]` buttons in `hud.js` Training mode.
3. **HUD Drag/2D-Resize & Header Stability (Section 3)**:
   - *Fix*: Locked `.hud-header` to single-line `height: 42px; flex-wrap: nowrap; white-space: nowrap`, added `font-variant-numeric: tabular-nums` and fixed min-widths on `#hud-score-pill` & `#hud-time-pill`, upgraded `.hud-resize-corner`, and added `buildHudStateSig` inside `updateLiveStatsOnly()` so HUD progress bars and green checkmarks update immediately without wrapping the header (`hdrH === 42` before and after `3665s` tick).
4. **User Accounts Scenario 2B Progress & Green Checkmarks (Section 4)**:
   - *Root Cause*: `deleteAccount()` only evaluated `stepB = true` when the sole remaining Admin matched `adminCreatedNames[length - 1]`, failing when switching into the first created Admin, and `switchUser()` did not re-evaluate Scenario 2B.
   - *Fix*: Extracted `evaluateAccountScenarioB(sc)` invoked on both `deleteAccount()` and `switchUser()`, matching any surviving sole created Admin while `MENIAI` is deleted and `currentUser` matches that Admin, and ensured `hud.js` reflects green `✔` (`is-done`) and progress bar jumps immediately (`13%`).
5. **Redesigned Lightweight Installed Apps & 1-Second Optional Features Spinner (Section 5)**:
   - *Fix*: Replaced nested chrome with clean Windows 11 flat `.apps-win11-row` cards (`Icon + Name + Publisher/Date + Size + إزالة`), added `1000ms` rotating `.win-spinner` indicator + `"مثبّت"` / `"غير مثبّت"` badges on Optional Features, and fixed `js/i18n/{ar,fr,en}.js` pre-registration onto `window.__WIN11_I18N__`.

### Tests run (Post-Final Code Edit Execution, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30720 KB`), `build/Win11_Simulator_1AS.html.gz` (`22402 KB`), `dist/Win11_Simulator_1AS.exe` (`21.90 MB`), preserving `dist/inf.dll`.
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED`.
- `node test/verify.js` → **PASS** → **`72 / 72 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), including new end-to-end Hotfix checks (`Hotfix Sec 1/5/6`, `Hotfix Sec 2-3`, `Hotfix Sec 4`), updated `1000ms` `.win-spinner` check in Bug 1.2, and captured proof screenshot `test/screenshots/10_hotfix_installed_apps.png`.
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** in isolated temporary directory (`78 / 78` combined across automated browser suites).
- Recursive source scan (`54` runtime files across `index.html`, `js/`, `css/`, `launcher/`) → **PASS** → `0` `TODO`/`FIXME`, `0` leakage hits, `0` stale refs.
### Arabic/RTL audit
- Inspected `test/screenshots/10_hotfix_installed_apps.png` in headless Chrome (`1280x800` RTL): lightweight Installed Apps rows, RTL search bar, `إزالة` alignment, `#pedagogy-hud` single-line nowrap header (`00:00:02` / `0.00 / 20`), and sub-step badges render cleanly without clipping or wrapping → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Report Export Escaping & Evaluation Logic Fix (Sections 1–5) — 2026-11-12
### Root Cause Analysis & Documented Fixes
1. **HTML Double-Escaping in Report Section Header (Section 1)**:
   - *Root Cause*: `renderAccountLogHtml()` in `js/pedagogy/report.js` wrapped a string already containing `<bdi dir="ltr">...</bdi>` inside `bidi(...)` (`Win11I18N.bidiHtml`), escaping `<bdi>` into literal `&lt;bdi dir="ltr"&gt;`.
   - *Fix*: Concatenated `bidi('سجل أحداث الحسابات والتدقيق الزمني') + ' (<bdi dir="ltr">' + validEvents.length + '</bdi>):'` and verified across all `js/` files via regex audit that zero other HTML tags are passed inside `bidi(...)`.
2. **Audit Log Dashed / `00:00:00` Rows & Empty Table Bug (Section 2)**:
   - *Root Cause*: Property mismatch between `Win11State.logAccountEvent()` (`{ elapsed, wallTime, type, target, detailAr }`, lacking `accountType`) and `renderAccountLogHtml()` (`{ e.time, e.event, e.targetUser, e.accountType, e.details }`), causing every logged event row to fall back to `00:00:00 | '' | - | - | -`.
   - *Fix*: Rendered `"لا توجد أحداث مسجلة."` without a `<table>` when the log is empty; enriched `logAccountEvent(type, detailAr, targetUser, explicitRole)` to store real `wallTime`, `accountType`, `target`, and `detailAr` (including resolving `victimRole` before array deletion in `deleteAccount`); mapped event keys (`ACCOUNT_EVENT_LABELS_AR`) and roles (`ACCOUNT_ROLE_LABELS_AR`) cleanly in `report.js`.
3. **Evaluation Logic for Scenarios `6B`, `6F`, and `6G` (Section 3)**:
   - *Root Cause*: `updateAccountType()` did not track promoted Administrators in `adminCreatedNames`, `evaluateAccountScenarioB()` did not handle demotion-before-deletion (`originalAdminDeleted`), `setAccountPassword()` silently ignored Admin password edits whenever `sc.stepE` or `sc.pwStandardUser` hadn't aligned, and `recordLoginSuccess()` ordered `!sc.loggedInStdInitial` ahead of `sc.stepF && sc.adminChangedStdPw`.
   - *Fix*: Updated `updateAccountType()` & `deleteAccount()` (`originalAdminDeleted`) + `evaluateAccountScenarioB()` for `6B`, updated `setAccountPassword()` (`pwChangedTargetUser`, decoupled from brittle ordering blocks) for `6F`, checked updated password transitions FIRST in `recordLoginSuccess()` for `6G`, and added `[Scenario6B]`/`[Scenario6E]`/`[Scenario6F]`/`[Scenario6G]` `console.info` traces.
4. **A4 Report Table `nowrap` Formatting & Instant Generation (Section 4)**:
   - *Fix*: Added `.col-time`, `.col-num`, `.col-status`, `.col-event`, `.col-account`, `.col-role`, `.col-details`, `th { white-space: nowrap; }`, and `font-variant-numeric: tabular-nums` in both `css/pedagogical.css` and `buildStandaloneHtmlDoc()` in `js/pedagogy/report.js`.

### Tests run (Post-Final Code Edit Execution, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30729 KB`), `build/Win11_Simulator_1AS.html.gz` (`22404 KB`), `dist/Win11_Simulator_1AS.exe` (`21.90 MB`), preserving `dist/inf.dll`.
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=347ms, unlock=328ms)`.
- `node test/verify.js` → **PASS** → **`75 / 75 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), including:
  - **Report Hotfix Sec 1+2 (empty log)**: renders `"لا توجد أحداث مسجلة."` with zero `<table class="a4-account-log-table">`, zero literal `<bdi>`, in `0.80ms` (`< 500ms`).
  - **Report Hotfix Sec 3 (Scenarios 6B, 6F, 6G)**: rejects old password on Lock Screen, accepts new password (`StdPass`), lights HUD `✔`, sets `stepB=true, stepF=true, stepG=true`.
  - **Report Hotfix Sec 1+2+4 (Certificate + Populated Audit Log + Nowrap)**: opens certificate in `1.70ms` (`< 500ms`), zero `<bdi>` escaping, `13` populated audit log rows (`0` dash rows), `whiteSpace === 'nowrap'` headers, standalone HTML contains `white-space:nowrap`.
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** (`81 / 81` combined across automated browser suites).
- Recursive source & hygiene scan across `index.html`, `js/`, `css/`, `launcher/` → **PASS** → `0` `TODO`/`FIXME`, `0` teacher UI/shortcut leakage hits.
### Arabic/RTL audit
- Inspected `test/screenshots/11_report_hotfix_ar_rtl.png` in headless Chrome (`1280x800` RTL): `"سجل أحداث الحسابات والتدقيق الزمني"` renders clean BiDi isolation, real `HH:MM:SS` timestamps (`13:24:48`), Arabic event labels, account roles (`مسؤول (Administrateur)` / `قياسي (Standard)`), zero dash rows, and crisp single-line headers → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Final Pedagogical Polish & UX Fixes (Sections 1–5) — 2026-11-12
### Root Cause Analysis & Documented Fixes
1. **Report Cleanup — Remove Duplicate Mistake Log (Section 1)**:
   - *Fix*: Deleted the redundant `"سجل الأخطاء والملاحظات"` table block and unused `mistakes` local variable from `buildA4Html()` in `js/pedagogy/report.js`, retaining strictly `"جدول الخصومات والمخالفات التفصيلي"` with task name, deduction reason, and exact deducted points (`totalDed`).
2. **Fair Guest Permissions Exploration — Zero Penalty + Discovery Credit (Section 2)**:
   - *Root Cause*: `showGuestDeniedDialog()` in `js/core/permission-gate.js` deducted points via `logUnauthorizedMistake()` on Guest UAC/Access Denied probes, even though testing Guest restrictions is required by Scenario 6C.
   - *Fix*: Removed `logUnauthorizedMistake()` from `showGuestDeniedDialog()` (`0` penalty for Guest Access Denied probes) and wired `Win11State.recordGuestBlockedAction()` to award `sc.stepC = true`, persist state, log `guest_uac_denied`, and emit `state:changed` immediately.
3. **Reactive Real-Time UI & Immediate Task 5 Evaluation (Section 3)**:
   - *Fix*: Added guarded `runAppsRefreshNow()` in `js/apps/settings/settings-app.js` for synchronous UI updates on `apps:changed`/`features:changed`; triggered `markInstalledAppsViewed()` from `syncAppsRows()` in `js/apps/settings/apps.js` without leaving Installed Apps; evaluated Task 5 Optional Features steps (`step4EnableFeat`, `step5DisableFeat`) directly on `ff.enabledOnce` / `ff.disabledAfterEnable` without leaving Optional Features for Start Menu; omitted unused `verifiedInStart`/`verifiedGoneInStart` from `getTaskSignature(5, st)` and exempted immediate Arabic restore right after Task 1 from false off-task penalties.
4. **Contextual Off-Task Warning Toast & Commit-Only Penalties (Section 4)**:
   - *Fix*: Added dismissible `.off-task-warning-toast` styling (`css/pedagogical.css`) and `showOffTaskToast()` / `dismissOffTaskToast()` inside `js/pedagogy/assessment.js`; visiting an off-task Settings section (`enterSection`) now shows a non-blocking Arabic warning with `0` points deducted, deducting `-0.25` and recording in the Deductions Table only if the off-task edit is committed.

### Tests run (Post-Final Code Edit Execution, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30733 KB`), `build/Win11_Simulator_1AS.html.gz` (`22405 KB`), `dist/Win11_Simulator_1AS.exe` (`21.90 MB`), preserving `dist/inf.dll`.
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=397ms, unlock=367ms)`.
- `node test/verify.js` → **PASS** → **`78 / 78 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), including:
  - **Final Polish Sec 3**: Immediate live DOM sync and Task 5 scoring on Setup install (`1.6`), Setup remove (`2.4`), and Optional Features Paint toggle (`مثبّت` -> `غير مثبّت`, Task 5 `4/4` completed, `activeIdxNow: 5`) without navigating away.
  - **Final Polish Sec 2**: Time Zone probe as Guest opens Access Denied modal, keeps `tzStillDefault: true`, sets `stepC: true` (`subStepC_ok: true`), and incurs `0` deductions (`mistakesAfter: 0`).
  - **Final Polish Sec 1+4**: Visiting Personalization during Task 6 renders contextual warning toast with `mistakesAfterVisitOnly: 0`; committing off-task wallpaper deducts `-0.25`, updates Deductions Table (`hasDeductionRow: true`, `hasDeductionsTable: true`), and verifies Mistake Log removal (`noDuplicateMistakeLog: true`).
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** (`84 / 84` combined across automated browser suites).
- Recursive source & hygiene scan across `index.html`, `js/`, `css/`, `launcher/` → **PASS** → `SCAN_HITS=0` (`0` `TODO`/`FIXME`, `0` teacher UI/shortcut leakage hits).
### Arabic/RTL audit
- Inspected `test/screenshots/12_final_polish_ar_rtl.png` in headless Chrome (`1280x800` RTL): certificate modal shows `"جدول الخصومات والمخالفات التفصيلي"` without any duplicate Mistake Log table, lists the committed `-0.25` off-task deduction cleanly with `-15.50` total, and displays the bottom Arabic `.off-task-warning-toast` cleanly without layout overflow → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Final Polish II — Export Filename Suggestion & HUD Directional Resize (Sections 1–3) — 2026-11-12
### Root Cause Analysis & Documented Fixes
1. **Auto-Suggested Highlighted Evaluation Filename Dialog (Section 1)**:
   - *Fix*: Added `openExportSaveDialog(ext, opts)`, `previewNextFilename(ext)`, and `normalizeExportFilename()` (bundle-safe suffix check avoiding `$'` in `String.replace`) inside `js/pedagogy/report.js`, wired `#btn-export-pdf` and `#btn-export-html` in `openCertificate()` to open `#export-filename-input` pre-populated with the exact teacher `filename_template`, focused, and fully highlighted (`select()` + `setSelectionRange`) while staying freely editable (or returning cleanly to the Certificate on Cancel).
2. **Pedagogical Assistant Directional Window Resizing (Section 2)**:
   - *Root Cause*: Dragging `#hud-drag-bar` pinned `el.style.left` and set `el.style.right = 'auto'`, causing subsequent bottom-left grip drags in RTL (`width += -dx`) to expand the opposite right edge outward instead of expanding leftwards/downwards.
   - *Fix*: Updated `#hud-resize-handle` `mousedown` in `js/pedagogy/hud.js` to capture `getBoundingClientRect()` and anchor `top` + `right` (`left: 'auto'`) in RTL and `top` + `left` (`right: 'auto'`) in LTR, enforcing exact `320px` × `240px` minimums and viewport workspace maximums; aligned RTL `45deg` vs LTR `135deg` diagonal corner lines in `css/pedagogical.css` and saved `bottom` in `toggleMaximize()`.

### Tests run (Post-Final Code Edit Execution, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30741 KB`), `build/Win11_Simulator_1AS.html.gz` (`22406 KB`), `dist/Win11_Simulator_1AS.exe` (`21.91 MB`), preserving `dist/inf.dll`.
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=419ms, unlock=391ms)`.
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`** (zero syntax/runtime errors in bundled HTML or isolated EXE).
- `node test/verify.js` → **PASS** → **`81 / 81 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), including:
  - **Final Polish II Sec 2**: HUD bottom-left resize in RTL (after bar drag) keeps top-right anchored, expands left & down cleanly, clamps at `320×240`, and expands outwards & down in LTR (`dir="ltr"`).
  - **Final Polish II Sec 1 & 1b**: `#btn-export-pdf` & `#btn-export-html` open `#export-filename-input` pre-populated with the teacher pattern, fully highlighted (`selectionStart === 0 && selectionEnd === length`), return to Certificate on Cancel, and accept custom edited filenames (`Custom_Final_Eval_File`).
- Recursive source & hygiene scan across `index.html`, `js/`, `css/`, `launcher/` → **PASS** → `SCAN_HITS=0`.
### Arabic/RTL audit
- Inspected `test/screenshots/13_export_filename_hud_resize.png` in headless Chrome (`1280x800` RTL): expanded RTL `#pedagogy-hud` keeps clean layout and nowrap header (`4.00 / 20`, `00:00:03`), while `"حفظ ملف التقييم النهائي (PDF)"` displays the full teacher-rule filename pre-selected/highlighted inside `"اسم الملف:"` → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.

---

## Feature Addition — "About" (`حول التطبيق`) Window & Teacher's Message — 2026-11-12
### Implementation Summary
1. **Multiple Entry Points (Section 1)**:
   - Added `#sys-about-modal-btn` (`"حول التطبيق"`) inside `Settings -> System -> About` (`js/apps/settings/system.js`), `#start-about-btn` in the Start Menu footer (`js/core/start-menu.js`), and `#ctx-about-app` / `#ctx-start-about-app` in Desktop and Start `Win+X` context menus (`js/core/context-menu.js`).
2. **Windows 11 RTL About Dialog & Verbatim Pedagogical Message (Sections 2–3)**:
   - Updated `Win11Dialogs.showAbout()` / `showAboutModal()` in `js/core/dialogs.js` with `v1.0.0` pill badge, `win11` icon, RTL typography (`line-height: 1.75`), metadata card (`أستاذ الإعلام الآلي - السنة الأولى ثانوي (الجزائر)`, `1.0.0`), verbatim Teacher's Message, 4 Educational Vision principles, highlighted Roadmap card (`<em>خطوة أولى</em>`), and `#btn-about-close`.

### Tests run (Post-Final Code Edit Execution, Exit Code `0`)
- `node scripts/build-portable.js` → **PASS** → `dist/Win11_Simulator_1AS.html` (`30747 KB`), `build/Win11_Simulator_1AS.html.gz` (`22408 KB`), `dist/Win11_Simulator_1AS.exe` (`21.91 MB`).
- `node test/test-crypto.js` → **PASS** → `ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=398ms, unlock=356ms)`.
- `node test/test-stage5-portable.js` → **PASS** → **`6 / 6 PASS`**.
- `node test/verify.js` → **PASS** → **`83 / 83 PASS`** (`0` failures, `0` console/runtime/CORS errors over `file://`), including:
  - **Feature Addition About Sec 1–3**: `#sys-about-modal-btn` opens `#about-app-modal-body` (`dir="rtl"`, `1.0.0`, `"رسالة الأستاذ:"`, all 4 Educational Vision bullets, `"خارطة الطريق (Roadmap):"` with `"خطوة أولى"`).
  - **Feature Addition About Sec 4**: `#btn-about-close` closes cleanly without freezing; re-opening succeeds from both Desktop context menu (`#ctx-about-app`) and Start Menu (`#start-about-btn`).
- Recursive case-sensitive hygiene scan across `index.html`, `js/`, `css/`, `launcher/` → **PASS** → `SCAN_HITS=0`.
### Arabic/RTL audit
- Inspected `test/screenshots/14_about_window_ar_rtl.png` in headless Chrome (`1280x800` RTL): `"حول التطبيق"` dialog renders crisp Arabic RTL typography, `v1.0.0` pill badge, Windows 11 icon, subtle metadata & Roadmap cards, all 4 bullet points, and `"إغلاق"` button without clipping → **shaping OK / bidi OK / UTF-8 encoding OK / RTL alignment OK**.
### Known issues carried forward
- OS/browser interception of hardware `Win+L` inside unprivileged browser tabs (**Low / Known Limitation**).
- Critical Errors Open: **`0`** | Medium Errors Open: **`0`**.
