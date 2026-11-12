# Portable Run, Build & Classroom Deployment Guide (Windows 7+ & Modern OS)

## 1. Zero-Dependency Classroom Launch (Windows 7 SP1 – Windows 11 Offline)
1. Copy `dist/Win11_Simulator_1AS.exe` (or download from GitHub **Releases**) onto a USB flash drive or classroom PC folder.
   - Optionally place an encrypted teacher sidecar named strictly **`inf.dll`** in the **exact same folder** beside the executable. Zero other files, DLLs, or internet connection are needed.
2. Double-click **`Win11_Simulator_1AS.exe`**:
   - Starts an isolated local loopback server (`http://127.0.0.1:<free_port>/`) in RAM.
   - Launches Chrome/Edge in quiet kiosk mode (`--kiosk --app --noerrdialogs --disable-sync --disable-translate --disable-features=Translate,msAccountSync,ChromeWhatsNewUI`) using an isolated `%TEMP%` profile (automatically deleted on exit) or falls back cleanly to Firefox ESR / default browser on Windows 7.
   - **Startup Workflow (`inf.dll` check)**:
     - If **`inf.dll` is missing** beside the `.exe` (initial teacher setup), the app opens directly into the **Teacher Settings Panel** so the teacher sets the password, institution metadata, class groups, PC list, tasks, and clicks **حفظ (`Save`)** to generate `inf.dll` beside the executable before entering the Student Registration Form.
     - If **`inf.dll` is present** beside the `.exe` (classroom workstation mode), it loads silently with zero teacher password prompt and displays the **mandatory non-skippable Student Registration Form** (`اللقب / الإسم / الفوج / رقم الحاسوب / استطلاع أو امتحان`). Timers remain paused at `00:00:00` until submission.
   - During any active simulation, clicking **`محاكاة جديدة`** (`New Simulation`) in the HUD resets all settings, windows, score (`0.00`), and timer (`00:00:00`) cleanly while keeping student identity and `inf.dll` intact.
   - Tasks follow a strict sequential **Active Task** flow (future actions performed prematurely are logged as early-action mistakes without points). Students may also click **`تخطي المهمة`** (Skip Task) in the HUD to mark the current task as `"غير منجزة"` (retaining any partial credit earned before skipping, applying the configured skip penalty if any, and advancing to the next task). In Exam mode, the HUD displays task titles and `HH:MM:SS` timers only.
   - Guest (`Invité`) files and open windows persist across **`Switch user`** during the session, and reset automatically and silently in the background when the Guest signs out (`Sign out` / `تسجيل الخروج`) or when an Administrator disables/removes Guest access.
   - Reports export strictly as **PDF** or **standalone HTML** using ASCII-safe filenames; **Start -> Power -> إيقاف التشغيل** warns about unfinished tasks or unexported PDF before closing cleanly.
   - Alternative zero-binary mode: open `dist/Win11_Simulator_1AS.html` (or `index.html`) directly over `file://`.

## 2. Launching on Low-Spec Windows 7 / 2 GB RAM Lab Computers
- **Prerequisites**: Windows 7 SP1 ships `.NET Framework 3.5 SP1` (`CLR 2.0`) and Arabic `Tahoma` / `Arial` fonts out of the box (Chrome 109+ or Firefox 115 ESR+ recommended for rendering).
- **Visual Performance**:
  - Open **Settings (`الإعدادات`) -> Accessibility (`إمكانية الوصول`) -> Animation effects (`تقليل تأثيرات الحركة والانتقالات`)** to disable transitions on weak GPUs.
  - Open **Settings -> Personalization -> Colors (`الألوان`)** and turn off **Transparency effects** (`Mica / Acrylic`) if needed.

## 3. Keyboard Shortcuts Reference
| Action | Shortcut |
| :--- | :--- |
| Start Menu | `Alt + Space` or Start button |
| Settings App | `Alt + I` |
| Quick Settings (Wi-Fi, Volume, Brightness, Dark Mode) | `Alt + A` |
| Notification Center & Calendar | `Alt + N` |
| Windows Search | `Alt + S` |
| Show Desktop / Restore Windows | `Alt + D` |
| Task View & Virtual Desktops | `Alt + Tab` or `Alt + Q` |
| Power User Quick Link Menu | `Alt + X` |
| Lock Screen / Switch User | `Alt + L` |
| Settings Back History | `Alt + Left Arrow` or `Backspace` |
| Fullscreen Toggle | `F11` (locked during Exam mode when enabled by teacher) |
| Dismiss Active Flyout / Modal | `Esc` |

> *(Teacher Configuration Console access uses **`Ctrl + Shift + S`** with teacher password — intentionally excluded from student UI.)*

## 4. Teacher Workflow & Encrypted `inf.dll`
1. Press **`Ctrl + Shift + S`** inside the simulator:
   - On first setup (if no `inf.dll` exists beside the EXE), create a teacher password (`>= 4` chars) to encrypt & generate `inf.dll`.
   - On lab workstations where `inf.dll` already exists, enter the teacher password (`PBKDF2-HMAC-SHA256` 100k + `AES-256-CTR` + `HMAC-SHA256`).
2. Configure Institution Name, Teacher Name, Academic Year (`2026 / 2027`), Class Groups, Device Numbers (`01–20`), Exam vs. Exploration Mode, Time Limit, Pass Threshold, Penalties (`hint`, `error`, `skip`), Task Weights/Order (`1+2+3+4+4+6 = 20.00` default), Live Filename Builder Tokens, Theme Lock, Report Logo, and Fullscreen Exam Lock.
3. Click **حفظ (`Save`)** to atomically write encrypted binary **`inf.dll`** beside `Win11_Simulator_1AS.exe`, then copy `[Win11_Simulator_1AS.exe + inf.dll]` to all classroom PCs.

## 5. Build from Source
```powershell
# 1. Regenerate trilingual JS bundles if i18n JSON changed
# 2. Bundle single-file HTML, GZip payload, and compile .NET 3.5 SP1 EXE
node scripts/build-portable.js

# 3. Verify cryptography, core stages & isolated single-EXE offline run
node test/test-crypto.js
node test/verify.js
node test/test-stage5-portable.js
```
