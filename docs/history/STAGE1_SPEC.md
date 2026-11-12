# Stage 1: Baseline Specification (Single Source of Truth)

## 1.1 Target Operating System Build
- **Simulated OS**: Microsoft Windows 11 Pro Education (23H2)
- **OS Build Number**: `22631.3007` (Windows Feature Experience Pack `1000.22684.1000.0`)
- **Primary Target Context**: Algerian Secondary Education (1AS Computer Science — بيئة التعامل مع الحاسوب ولوحة التحكم) + General High-Fidelity Windows 11 Simulation.

---

## 1.2 Visual Design System Specification

### Typography
- **Primary Font Stack**:
  ```css
  font-family: "Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", Tahoma, Arial, sans-serif;
  ```
- **Legacy Windows 7 Arabic Fallback**: `Tahoma` and `Arial` are explicitly positioned immediately after `Segoe UI` so Arabic shaping, diacritics, and mixed-script punctuation render crisply on Windows 7 + Chrome 109 / Firefox 115 ESR without relying on `Segoe UI Variable`.
- **Arabic Type Tuning**:
  - Body text size: `14px` (nav labels `14px`, secondary captions `12px`, page headers `28px`, section subheaders `14px` bold).
  - Line-height: Minimum `1.55` across UI controls and `1.65` for multi-line Arabic prose/descriptions (`line-height: 1.6`).
  - Letter-spacing: Strictly `0` (`normal`) for Arabic runs to preserve mandatory ligature joining (`letter-spacing > 0` breaks Arabic shaping in older renderers; isolated CSS rule `[dir="rtl"]` enforces `letter-spacing: 0`).

### Color Palette Tokens (HEX / RGBA)

#### Light Theme (`data-theme="light"`, Default)
- `--win-bg-base`: `#F3F3F3` (Mica solid fallback)
- `--win-bg-mica`: `rgba(243, 243, 243, 0.86)`
- `--win-bg-acrylic`: `rgba(252, 252, 252, 0.78)`
- `--win-surface-card`: `#FFFFFF` (`rgba(255, 255, 255, 0.85)`)
- `--win-surface-card-secondary`: `#F9F9F9`
- `--win-surface-subtle`: `rgba(0, 0, 0, 0.038)`
- `--win-surface-hover`: `rgba(0, 0, 0, 0.055)`
- `--win-surface-active`: `rgba(0, 0, 0, 0.08)`
- `--win-border-card`: `rgba(0, 0, 0, 0.065)`
- `--win-border-control`: `rgba(0, 0, 0, 0.14)`
- `--win-border-window`: `rgba(0, 0, 0, 0.16)`
- `--win-text-primary`: `#1B1B1B`
- `--win-text-secondary`: `#5F5F5F`
- `--win-text-disabled`: `#9E9E9E`
- `--win-taskbar-bg`: `rgba(243, 243, 243, 0.82)`
- `--win-taskbar-solid`: `#EEEEEE`

#### Dark Theme (`data-theme="dark"`)
- `--win-bg-base`: `#202020` (Mica Dark solid fallback)
- `--win-bg-mica`: `rgba(32, 32, 32, 0.88)`
- `--win-bg-acrylic`: `rgba(44, 44, 44, 0.82)`
- `--win-surface-card`: `rgba(255, 255, 255, 0.055)`
- `--win-surface-card-secondary`: `rgba(255, 255, 255, 0.035)`
- `--win-surface-subtle`: `rgba(255, 255, 255, 0.045)`
- `--win-surface-hover`: `rgba(255, 255, 255, 0.075)`
- `--win-surface-active`: `rgba(255, 255, 255, 0.10)`
- `--win-border-card`: `rgba(255, 255, 255, 0.08)`
- `--win-border-control`: `rgba(255, 255, 255, 0.16)`
- `--win-border-window`: `rgba(0, 0, 0, 0.45)`
- `--win-text-primary`: `#FFFFFF`
- `--win-text-secondary`: `#CFCFCF`
- `--win-text-disabled`: `#7A7A7A`
- `--win-taskbar-bg`: `rgba(28, 28, 28, 0.84)`
- `--win-taskbar-solid`: `#1C1C1C`

#### System Accent Colors (Live Instant Switching)
| Name (AR) | Accent Base (`--win-accent`) | Light Text/Link (`--win-accent-text`) | Hover (`--win-accent-hover`) | Dark Shade (`--win-accent-pressed`) |
| :--- | :--- | :--- | :--- | :--- |
| الأزرق الكلاسيكي | `#0067C0` | `#005FB8` (Light) / `#60CDFF` (Dark) | `#187AD7` | `#004C91` |
| البنفسجي الزاهي | `#8764B8` | `#744DA9` (Light) / `#C7A6FF` (Dark) | `#9B79CC` | `#634292` |
| الأخضر الماسي | `#107C41` | `#0E6D39` (Light) / `#6CCB5F` (Dark) | `#18914E` | `#0B5A2F` |
| البرتقالي الدافئ | `#D83B01` | `#C13400` (Light) / `#FF8C61` (Dark) | `#EA4F17` | `#A82D00` |
| الأحمر القرمزي | `#D13438` | `#B8292D` (Light) / `#FF7A7E` (Dark) | `#DF4B4F` | `#9F2225` |
| الأخضر الفيروزي | `#008272` | `#006F61` (Light) / `#5EEAD4` (Dark) | `#0D9B8A` | `#005E52` |

### Element Metrics & Radii
- Window Title Bar height: `32px` (Settings window header bar `40px` to house back button + title + caption buttons cleanly while caption buttons stay `46px × 32px`)
- Taskbar height: `48px` (`z-index: 1000`)
- Desktop icon grid cell: `80px × 92px`, icon visual `40px`
- Taskbar icon slot: `40px × 40px` with `22px`–`24px` icon graphic and `4px` corner radius
- Standard Icon Sizes: `16px` (inline/breadcrumb/caption), `20px` (sidebar/card icon), `24px` (taskbar/start)
- Corner Radius:
  - Desktop App Windows: `8px` (`0px` when maximized or snapped cleanly)
  - Flyouts (Start Menu, Quick Settings, Notification Center, Context Menu): `8px` (`12px` for Start Menu)
  - Setting Cards & Controls: `4px`–`6px`
  - Active Nav Pill & Search Bar: `4px` (nav item), `9999px` (pill search / toggle switch track)
- Shadows:
  - Active Window: `0 16px 48px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.12)`
  - Inactive Window: `0 8px 24px rgba(0, 0, 0, 0.16)`
  - Flyout Menu: `0 12px 32px rgba(0, 0, 0, 0.22), 0 0 0 1px var(--win-border-card)`

### Mica & Acrylic CSS With Legacy Fallback
```css
.win-surface-acrylic {
  background-color: var(--win-bg-acrylic-fallback);
}
@supports ((backdrop-filter: blur(20px)) or (-webkit-backdrop-filter: blur(20px))) {
  .win-surface-acrylic {
    background-color: var(--win-bg-acrylic);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    backdrop-filter: blur(28px) saturate(160%);
  }
}
```
When running in browsers without `backdrop-filter`, solid/nearly-opaque tint (`--win-bg-base` / `--win-taskbar-solid`) guarantees legible contrast with zero visual artifacts.

---

## 1.3 Behavioral & Keyboard Shortcut Specification
*(Note: Browser security restricts OS-level interception of `Meta+L` and `Win` key on Windows itself; every shortcut supports BOTH standard key detection where allowed AND safe cross-browser `Alt+*` / `Ctrl+Shift+*` aliases + UI shell triggers)*:
- `Start Button` / `Ctrl+Esc` / `Alt+Space`: Toggle Start Menu
- `Win+I` (where interceptable) / `Alt+I`: Open Settings App (or focus if open)
- `Win+A` / `Alt+A`: Toggle Quick Settings flyout
- `Win+N` / `Alt+N`: Toggle Notification Center & Calendar flyout
- `Win+D` / `Alt+D`: Toggle Show Desktop (minimize all windows / restore previous state)
- `Win+S` / `Alt+S`: Open Start Search with cursor focused in query box
- `Win+L` / `Alt+L`: Open Windows 11 Lock / Sign-In Screen
- `Win+X` / `Alt+X`: Open Power User Quick Link Menu
- `Alt+Tab` / `Alt+Q`: Cycle/display Task View & Window Switcher
- `Alt+Left` / `Backspace` (outside inputs): Settings History Back
- `F11`: Toggle browser fullscreen mode cleanly
- `F12` or `Ctrl+Shift+P`: Teacher Configuration Auth Dialog (preserved 1AS feature)
- `Esc`: Close topmost Context Menu -> Modal Dialog -> Flyout (Start / Quick Settings / Notifications / Snap Menu / Task View)

---

## 1.4 Arabic & RTL Specification
- **Default UI Language**: Arabic (`ar`), `<html lang="ar" dir="rtl">`, `<meta charset="utf-8">` (UTF-8 without BOM).
- **Language Externalization**: All UI strings live in `/js/i18n/ar.json` (default), `/js/i18n/fr.json`, and `/js/i18n/en.json`, accompanied by local UTF-8 JS wrappers (`ar.js`, `fr.js`, `en.js`) so loading works identically under both `file://` (without CORS failures) and `http://`. Single global resolver `window.I18N.t(key, vars)`.
- **Window Chrome Mirroring Under RTL**:
  - Title Bar flex container flows from `inline-start` (Right in RTL) to `inline-end` (Left in RTL).
  - App Icon + Window Title sit on TOP-RIGHT (`inline-start`).
  - Window Controls (`Min`, `Max/Restore`, `Close`) sit on TOP-LEFT (`inline-end`), with `Close` as the outermost button on the top-left corner, matching native Arabic Windows 11 chrome!
  - Settings Sidebar sits on the RIGHT side (`inline-start`), active selection bar sits on `inset-inline-start: 0`.
  - Taskbar keeps center-aligned app icons (`justify-content: center`); Tray sits at `inset-inline-end` (Left in RTL); Tray Start Chevron `^`, Keyboard Layout indicator, Quick Settings pill, Clock & Date align logically.
- **Logical Properties Rule**: CSS stylesheets strictly avoid physical `margin-left`, `padding-right`, `left`, `right`, `text-align: left/right` for directional chrome, using CSS logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-start`, `text-align: start`) paired with an explicit `rtl.css` safety layer for older legacy browsers.
- **BiDi Mixed Text & Numerals**:
  - Default numerals: Latin digits `0-9` (standard in modern Algerian & Windows 11 numeric readouts), with an option in `Time & Language -> Region` to inspect regional format previews.
  - Times (`13:05`), dates (`2026/11/11`), IP addresses (`192.168.1.105`), technical identifiers (`AVAST! Internet Security`, `GMT+1`, `Windows 11 Pro`), and shortcuts (`Ctrl + Shift + P`) wrapped cleanly with `<bdi dir="ltr">` / Unicode Isolate `\u2066...\u2069` via `I18N.bidi(text)` so punctuation never flips!

---

## 1.5 Multi-Path Access Matrix (Settings Registry Paths)

| Setting ID | Page / Action | Valid Access Paths in Simulator |
| :--- | :--- | :--- |
| `system.display` | النظام > شاشة العرض | Settings Sidebar -> System -> Display; Desktop Right-Click -> Display Settings; Search (`"شاشة العرض"`, `"سطوع"`, `"الوضع الليلي"`); Quick Settings Brightness Gear / Night Light link; Win+X -> System |
| `system.sound` | النظام > الصوت | Settings Sidebar -> System -> Sound; Quick Settings Volume chevron (`>`); Search (`"الصوت"`, `"ميكروفون"`); Classic Control Panel -> Sound |
| `system.notifications` | النظام > الإشعارات | Settings -> System -> Notifications; Notification Center Header Gear icon; Search (`"إشعارات"`) |
| `system.power` | النظام > الطاقة والبطارية | Settings -> System -> Power; Quick Settings Battery % click; Search (`"طاقة"`, `"بطارية"`) |
| `system.storage` | النظام > التخزين | Settings -> System -> Storage; File Explorer This PC toolbar -> Storage settings; Search (`"التخزين"`, `"قرص"`) |
| `system.about` | النظام > حول النظام | Settings -> System -> About; Desktop `This PC` right-click -> Properties; File Explorer -> About; Settings -> About App modal |
| `devices.bluetooth` | Bluetooth والأجهزة | Settings Sidebar -> Bluetooth & devices; Quick Settings Bluetooth tile right-click / arrow; Search (`"بلوتوث"`) |
| `devices.mouse` | Bluetooth والأجهزة > الفأرة | Settings -> Bluetooth & devices -> Mouse; Settings -> Accessibility -> Mouse pointer link; Classic Control Panel -> Hardware & Sound -> Mouse; Search (`"الفأرة"`, `"مؤشر"`, `"Mouse"`) |
| `devices.printers` | Bluetooth والأجهزة > الطابعات والماسحات | Settings -> Bluetooth & devices -> Printers; Classic Control Panel -> Devices & Printers; Search (`"طابعة"`) |
| `network.status` / `network.wifi` | الشبكة والإنترنت | Settings Sidebar -> Network & internet -> Wi-Fi / Ethernet / Airplane / VPN / Proxy; Quick Settings Wi-Fi chevron (`>`) / Network settings link; Search (`"Wi-Fi"`, `"الشبكة"`, `"VPN"`); Control Panel -> Network & Sharing |
| `personalization.background` | التخصيص > الخلفية | Settings Sidebar -> Personalization -> Background; Desktop Right-Click -> Personalize; Search (`"خلفية"`, `"تخصيص"`); Control Panel -> Appearance |
| `personalization.colors` | التخصيص > الألوان | Settings -> Personalization -> Colors (Light/Dark + Accent Color); Quick Settings Night/Theme shortcut; Search (`"ألوان"`, `"الوضع الداكن"`) |
| `personalization.themes` | التخصيص > النسق وشاشة التوقف | Settings -> Personalization -> Themes & Screen Saver; Desktop Right-Click -> Personalize -> Themes; Search (`"شاشة التوقف"`, `"نسق"`) |
| `personalization.lockscreen` | التخصيص > شاشة القفل | Settings -> Personalization -> Lock screen; Lock screen preview settings; Search (`"شاشة القفل"`) |
| `personalization.start` / `personalization.taskbar` | التخصيص > شريط المهام / ابدأ | Right-Click Taskbar -> Taskbar Settings; Settings -> Personalization -> Taskbar / Start; Search (`"شريط المهام"`) |
| `apps.installed` | التطبيقات > التطبيقات المثبتة | Settings Sidebar -> Apps -> Installed apps; Start Menu app context menu -> Uninstall; Classic Control Panel -> Programs & Features; Search (`"إزالة"`, `"تطبيقات"`) |
| `apps.default` / `apps.startup` | التطبيقات > الافتراضية / بدء التشغيل | Settings -> Apps -> Default apps / Startup; Search (`"تطبيقات بدء التشغيل"`) |
| `accounts.users` | الحسابات > المستخدمون الآخرون | Settings Sidebar -> Accounts; Start Menu User Avatar -> Change account settings; Lock Screen hint; Classic Control Panel -> User Accounts; Search (`"حساب"`, `"Eleve"`, `"مستخدم"`) |
| `time.language` | الوقت واللغة > اللغة والمنطقة | Settings Sidebar -> Time & language -> Language & region; System Tray Language indicator -> More keyboard settings; Search (`"اللغة"`, `"إضافة لغة"`) |
| `time.datetime` | الوقت واللغة > التاريخ والوقت | Settings -> Time & language -> Date & time; Right-click System Tray Clock -> Adjust date and time; Search (`"المنطقة الزمنية"`, `"ساعة"`) |
| `gaming.mode` | الألعاب > وضع الألعاب | Settings Sidebar -> Gaming; Search (`"الألعاب"`, `"Xbox"`) |
| `accessibility.vision` | إمكانية الوصول | Settings Sidebar -> Accessibility; Quick Settings Accessibility chevron (`>`); Search (`"إمكانية الوصول"`, `"حجم النص"`) |
| `privacy.security` | الخصوصية والأمان | Settings Sidebar -> Privacy & security; Search (`"أمان"`, `"خصوصية"`, `"حماية"`) |
| `update.windows` | Windows Update | Settings Sidebar -> Windows Update; Settings Hero pill "Windows Update"; Search (`"تحديث"`) |

---

## 1.6 Compatibility & Performance Matrix
- **Operating Systems**: Windows 7 SP1+, Windows 8.1, Windows 10, Windows 11, Linux, macOS.
- **Browsers**: Chrome 109+ (last Windows 7 version), Firefox 115 ESR+ (last Windows 7 version), Edge 109+, modern Chrome/Firefox/Edge.
- **Display & Accessibility**: `1024×768` minimum viewport (with responsive narrow sidebar collapse below `820px` window width), `100%` / `150%` / `200%` browser zoom tested cleanly.
- **JS Compatibility Standard**: Strict ES5/ES2017 compatible vanilla JavaScript — zero ES2020 optional chaining (`?.`), zero nullish coalescing (`??`), zero `backdrop-filter`-only dependencies, zero runtime network calls (`file://` runs cleanly with zero CORS errors).
- **Performance Target**: Core JS+CSS bundle under `200 KB`; lazy on-demand loading of individual Settings section renderers; GPU-composited `transform`/`opacity` transitions honoring `@media (prefers-reduced-motion: reduce)`.

