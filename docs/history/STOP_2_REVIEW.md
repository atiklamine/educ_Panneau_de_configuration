# STOP 2 REVIEW — Stage 5 Complete (Portable Single-File Build & Encrypted `inf.dll`)

**Status**: Paused at the mandatory **STOP 2 Checkpoint** before Stage 6 (Full Teacher Settings Panel UI).
**Verification Summary**:
- `node scripts/build-portable.js` -> builds single-file `dist/Win11_Simulator_1AS.exe` (21.85 MB) + `dist/Win11_Simulator_1AS.html` (30,459 KB) cleanly.
- `node test/test-crypto.js` -> **PASS** (byte-for-byte OpenSSL match + tamper checks).
- `node test/verify.js` -> **42 / 42 PASS** (Stages 2–4 zero regressions over `file://`).
- `node test/test-stage5-portable.js` -> **PASS** (isolated single-EXE run, missing/loaded/locked/tampered `inf.dll`, zero sibling leftovers).

---

## 1. Proof: Single-File Build Runs on Windows 7 Offline
- **Runtime Target**: Compiled cleanly with `C:\Windows\Microsoft.NET\Framework\v3.5\csc.exe` targeting **.NET Framework 3.5 / CLR 2.0.50727** (`/platform:anycpu /target:winexe`), which ships pre-installed in Windows 7 RTM & SP1 out of the box (verified local execution on `CLR=2.0.50727.9188`).
- **Offline Zero-Dependency Execution**:
  - Embeds ALL CSS, ES5/ES2017 JS modules, SVG icons, `ar`/`fr`/`en` i18n packs, 12 Settings sections, and all 15 `bg/` wallpapers cleanly inside one compressed manifest resource (`Win11_Simulator_1AS.html.gz`) inside [`dist/Win11_Simulator_1AS.exe`](file:///d:/enseignement/dev_tools/settings_projects/003/dist/Win11_Simulator_1AS.exe).
  - Copied `Win11_Simulator_1AS.exe` alone into an empty temporary directory (`test/test-stage5-portable.js`) with zero sibling `bg/`, `js/`, `css/`, or DLL files and zero internet access -> serves `http://127.0.0.1:<port>/` locally, decodes all 15 inline wallpapers, and leaves `['Win11_Simulator_1AS.exe']` only in the folder (browser profile created only in OS `%TEMP%` and deleted on exit).
  - Fallback for Windows 7 systems lacking Chrome/Edge: opens system default browser (e.g., Firefox 115 ESR) alongside a lightweight RTL status window cleanly.
  - Also outputs a pure offline [`dist/Win11_Simulator_1AS.html`](file:///d:/enseignement/dev_tools/settings_projects/003/dist/Win11_Simulator_1AS.html) validated over `file://` (`15/15` inline wallpapers decoded, `0` console/CORS errors).

---

## 2. Proof: `inf.dll` Is Encrypted, Tamper-Detected & Unreadable as Plaintext
- **Cipher & Header Specification** ([`js/core/config-crypto.js`](file:///d:/enseignement/dev_tools/settings_projects/003/js/core/config-crypto.js)):
  - Dual-layer binary format starting with magic `W11S\x02\x01`, big-endian iterations (`100000`), `16B` runtime salt, `16B` runtime IV, `16B` vault salt, `16B` vault IV, `AES-256-CTR` ciphertexts, `32B` vault `HMAC-SHA256` (`PBKDF2-HMAC-SHA256(teacher_password, vaultSalt, 100000, 64)`), and `32B` outer file `HMAC-SHA256` tag.
  - **Zero passwords or keys stored on disk**: `password` is explicitly deleted from runtime config; only PBKDF2 verification against `teacherVault` validates the teacher password at unlock.
- **Raw First 64 Bytes Hex Dump** (captured directly from `inf.dll` written by isolated `Win11_Simulator_1AS.exe` during `task-2491`):
  ```text
  57 31 31 53 02 01 00 01 86 a0 d3 f7 76 3f a8 ed
  af f2 fb fb fc 45 4c d0 06 41 81 08 e2 52 41 1e
  44 80 87 8d 17 a7 f8 3d 5c 65 f7 80 39 17 78 f0
  61 5d ca 65 7e ce 69 0c 77 08 f3 a9 2f ec 3d 73
  ```
  - Plaintext substring scans in both `test/test-crypto.js` and `test/test-stage5-portable.js` confirmed zero occurrences of passwords (`Prof1AS#2026`), Arabic school/teacher strings (`ثانوية الاختبار المشفرة`), or JSON keys (`institution_name`).
- **Tamper Detection**: Flipping 1 bit (`tamperedBytes[90] ^= 0x55`) immediately triggered `status: 'tampered'`, rejected loading, surfaced the Arabic tamper alert (`pedagogy.infTamperMsg`), and fell back safely to defaults.
- **Wrong Password & Hint Removal**: Removed `(الافتراضية: admin123)` hint from `ar`/`fr`/`en` prompts (`pedagogy.teacherPassPrompt`); 5 wrong attempts enforce a 30-second cooldown cleanly.

---

## 3. Proof: Safe Defaults When `inf.dll` Is Missing
- Launching isolated `Win11_Simulator_1AS.exe` with zero `inf.dll` present returns HTTP `204` on `/api/inf`, sets `infStatus.status === 'missing'`, runs cleanly with default classroom settings (`ثانوية الشهيد أحمد رضا حوحو`), and pressing **`Ctrl+Shift+S`** automatically opens the first-time password creation wizard (`tc-setup-pass1` / `tc-setup-pass2`) or backup recovery option.

---

## 4. Exact List of Teacher Settings Wired So Far
In [`js/pedagogy/assessment.js`](file:///d:/enseignement/dev_tools/settings_projects/003/js/pedagogy/assessment.js) `getDefaultConfig()` (encrypted & transported inside `inf.dll`, zero password keys):
- **Core Institution & Exam Metadata**: `institution_name`, `teacher_name`, `target_level`, `academic_year`, `class_groups`, `device_numbers` (`01`–`20`), `default_device`, `mode` (`'training'` Exploration vs `'exam'` Official Exam).
- **Reporting & Naming**: `filename_template` (`{class}_{score}_{time}_{student_lastname}_{student_firstname}_{date}`), `show_mistakes`, `show_penalties`, `show_time`, `show_competency`, `show_partial_scores`, `show_ranking_criteria`, `penalty_hint`, `penalty_error`.
- **Stage 1.5 Expert Schema Ready (UI controls to be wired in Stage 6)**: `exam_time_limit_min`, `pass_threshold`, `tasks_config` (id/enabled/weight), `ui_language_default`, `theme_lock`, `multi_user_mode`, `report_logo_b64`, and encrypted vault `audit_log`.
- **Current Stage 5 Teacher Modal UI**: Existing 3 tabs (`بيانات المؤسسة والتقرير` — Institution/Teacher/Password/ShowMistakes/ShowTime, `الأفواج الدراسية` — Class Groups CRUD, `inf.dll` — Binary Encrypted Import/Export + Save). Full Windows 11-styled Teacher Settings Panel UI with live filename builder, device selector, task customizer, exam timer limit, pass threshold, theme lock, single/multi-user mode, logo embed, audit log viewer, and Reset-to-Defaults is queued for **Stage 6** after your review of STOP 2.

---

## 5. Deviations from Stage 1 Baseline
- **None** against Stage 1 Visual/Arabic/Win7/Privacy/Capability Baseline specifications (note: the compiled `.exe` embeds the pre-bundled single HTML directly inside a `.NET 3.5 SP1` host resource cleanly preserving `index.html` and offline Win7 execution with zero external dependencies).

---

**Reply (`Continue` / approval) to proceed from STOP 2 into Stage 6 (Teacher Panel UI), Stage 7 (Fullscreen-First Behavior), Stage 8 (Comprehensive Testing), and Stage 9 (Final Delivery / STOP 3).**

