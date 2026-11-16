/**
 * Windows 11 Desktop Shell, Taskbar, System Tray, Screen Saver & Keyboard Shortcuts
 */
(function (global) {
    'use strict';

    var clockTimer = null;
    var selectedDesktopIcon = null;

    function getDesktopIconsData() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var list = [
            {
                id: 'this-pc',
                type: 'system',
                icon: 'thisPc',
                label: t('desktop.thisPc'),
                onOpen: function () { if (global.Win11Explorer) global.Win11Explorer.open('this-pc'); },
                onProperties: function () { global.Win11Registry.open('system.about'); }
            },
            {
                id: 'recycle-bin',
                type: 'system',
                icon: 'recycleBin',
                label: t('desktop.recycleBin'),
                onOpen: function () { if (global.Win11Explorer) global.Win11Explorer.open('recycle-bin'); }
            },
            {
                id: 'settings-app',
                type: 'settings',
                icon: 'settings',
                label: t('desktop.settings'),
                onOpen: function () { global.Win11Registry.open('home'); }
            },
            {
                id: 'control-panel',
                type: 'settings',
                icon: 'controlPanel',
                label: t('desktop.controlPanel'),
                onOpen: function () { if (global.Win11ControlPanel) global.Win11ControlPanel.open(); }
            },
            {
                id: 'lab-edge',
                type: 'app',
                icon: 'edge',
                label: t('desktop.labPortal'),
                onOpen: function () { if (global.Win11Edge) global.Win11Edge.open(); }
            },
            {
                id: 'setup-exe',
                type: 'app',
                icon: 'installer',
                label: t('desktop.setupExe') || 'LabTools_Setup.exe',
                onOpen: function () {
                    if (global.Win11Dialogs && typeof global.Win11Dialogs.launchSetupWizard === 'function') {
                        global.Win11Dialogs.launchSetupWizard();
                    }
                }
            }
        ];

        var curState = global.Win11State.get();
        var installedProgs = (curState && curState.installedPrograms) || [];
        for (var ip = 0; ip < installedProgs.length; ip++) {
            var pItem = installedProgs[ip];
            if (pItem.id === 'labtools_app' && pItem.desktopShortcut !== false) {
                list.push({
                    id: 'labtools-shortcut',
                    type: 'app',
                    icon: 'labtools',
                    label: t('desktop.labToolsShortcut') || 'LabTools 1AS',
                    onOpen: function () {
                        if (global.Win11Dialogs && typeof global.Win11Dialogs.openLabToolsApp === 'function') {
                            global.Win11Dialogs.openLabToolsApp();
                        }
                    }
                });
                break;
            }
        }

        var sortMode = curState.desktopSort;
        if (sortMode === 'name') {
            list.sort(function (a, b) { return a.label.localeCompare(b.label); });
        } else if (sortMode === 'type') {
            list.sort(function (a, b) { return a.type.localeCompare(b.type); });
        }
        return list;
    }

    var lastIconClickTime = 0;
    var lastIconClickId = null;

    function updateDesktopIconSelection(targetId) {
        selectedDesktopIcon = targetId;
        var container = document.getElementById('desktop-icons');
        if (!container) return;
        var all = container.querySelectorAll('.desktop-icon');
        for (var a = 0; a < all.length; a++) {
            if (targetId && all[a].getAttribute('data-desk-id') === targetId) {
                all[a].classList.add('is-selected');
            } else {
                all[a].classList.remove('is-selected');
            }
        }
    }

    function renderDesktopIcons() {
        var container = document.getElementById('desktop-icons');
        if (!container) return;
        var st = global.Win11State.get();
        container.className = 'size-' + (st.desktopIconSize || 'medium');

        var icons = getDesktopIconsData();
        var html = '';
        for (var i = 0; i < icons.length; i++) {
            var ic = icons[i];
            html +=
                '<button type="button" class="desktop-icon' + (selectedDesktopIcon === ic.id ? ' is-selected' : '') + '" data-desk-id="' + ic.id + '" tabindex="0">' +
                    global.Win11Icons.get(ic.icon, 42) +
                    '<span class="desktop-icon-label">' + global.Win11I18N.bidiHtml(ic.label) + '</span>' +
                '</button>';
        }
        container.innerHTML = html;

        var btns = container.querySelectorAll('.desktop-icon');
        for (var j = 0; j < btns.length; j++) {
            (function (btn) {
                var id = btn.getAttribute('data-desk-id');
                var def = null;
                for (var k = 0; k < icons.length; k++) {
                    if (icons[k].id === id) { def = icons[k]; break; }
                }

                function triggerOpen() {
                    if (def && typeof def.onOpen === 'function') {
                        try {
                            def.onOpen();
                        } catch (err) {
                            if (global.console && global.console.error) {
                                global.console.error('[DesktopIcon.onOpen]', err);
                            }
                        }
                    }
                }

                btn.onclick = function (e) {
                    e.stopPropagation();
                    var now = Date.now();
                    var isRapidSecondClick = (lastIconClickId === id && (now - lastIconClickTime) < 550);
                    lastIconClickTime = now;
                    lastIconClickId = id;

                    updateDesktopIconSelection(id);

                    if (isRapidSecondClick) {
                        lastIconClickTime = 0;
                        lastIconClickId = null;
                        triggerOpen();
                    }
                };

                btn.ondblclick = function (e) {
                    e.stopPropagation();
                    triggerOpen();
                };

                btn.onkeydown = function (e) {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerOpen();
                    }
                };

                btn.oncontextmenu = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    updateDesktopIconSelection(id);
                    var t = global.Win11I18N.t.bind(global.Win11I18N);
                    var menuItems = [
                        { icon: def.icon, label: t('app.open'), onClick: triggerOpen }
                    ];
                    if (def.onProperties) {
                        menuItems.push({ separator: true });
                        menuItems.push({ icon: 'info', label: t('app.properties'), onClick: def.onProperties });
                    }
                    global.Win11ContextMenu.show(e.clientX, e.clientY, menuItems);
                };
            })(btns[j]);
        }
    }

    function formatClockDate(now) {
        var fmtDigits = global.Win11I18N.formatDigits;
        var hh = String(now.getHours());
        var mm = String(now.getMinutes());
        var dd = String(now.getDate());
        var mo = String(now.getMonth() + 1);
        if (hh.length < 2) hh = '0' + hh;
        if (mm.length < 2) mm = '0' + mm;
        if (dd.length < 2) dd = '0' + dd;
        if (mo.length < 2) mo = '0' + mo;
        return {
            time: fmtDigits(hh + ':' + mm),
            date: fmtDigits(now.getFullYear() + '/' + mo + '/' + dd)
        };
    }

    function updateClockOnly() {
        var tEl = document.getElementById('tray-time-text');
        var dEl = document.getElementById('tray-date-text');
        if (!tEl || !dEl) return;
        var formatted = formatClockDate(global.Win11State.getSimulatedNow());
        tEl.textContent = formatted.time;
        dEl.textContent = formatted.date;
    }

    function renderTaskbar() {
        var bar = document.getElementById('taskbar');
        if (!bar) return;

        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var activeInput = global.Win11State.getActiveInputLangObj
            ? global.Win11State.getActiveInputLangObj()
            : { trayTag: 'FRA\nFR' };
        bar.className = 'win-taskbar-surface' + (st.taskbarAlign === 'start' ? ' align-start' : '');

        var openWins = global.Win11WM.getAllWindows();
        var topWin = global.Win11WM.getTopWindow();
        var isAppOpen = function (appId) {
            for (var i = 0; i < openWins.length; i++) {
                if (openWins[i].appId === appId) return true;
            }
            return false;
        };
        var isAppTop = function (appId) {
            return !!(topWin && topWin.appId === appId);
        };

        var clockFormatted = formatClockDate(global.Win11State.getSimulatedNow());
        var netIcon = st.airplaneMode ? 'airplane' : (st.wifiEnabled ? 'wifi' : 'ethernet');
        var volIcon = (st.muted || st.volume === 0) ? 'volumeMute' : 'volume';

        var html =
            '<div class="taskbar-start-slot">' +
                '<button type="button" class="taskbar-pedagogy-pill" id="tb-pedagogy-btn" title="' + global.Win11Compat.escapeHtml(t('pedagogy.title')) + '">' +
                    global.Win11Icons.get('graduation', 15) +
                    '<span>' + bidi(t('pedagogy.freeModeBtn')) + '</span>' +
                '</button>' +
            '</div>' +
            '<div class="taskbar-center">' +
                '<button type="button" class="taskbar-btn" id="tb-start-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.start')) + '">' +
                    global.Win11Icons.get('win11', 23) +
                '</button>';

        if (st.taskbarShowSearch) {
            html +=
                '<button type="button" class="taskbar-search-pill" id="tb-search-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.searchPlaceholder')) + '">' +
                    global.Win11Icons.get('search', 15) +
                    '<span class="pill-text">' + bidi(t('taskbar.searchPlaceholder')) + '</span>' +
                '</button>';
        }
        if (st.taskbarShowTaskView) {
            html +=
                '<button type="button" class="taskbar-btn" id="tb-taskview-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.taskView')) + '">' +
                    global.Win11Icons.get('taskView', 20) +
                '</button>';
        }

        html +=
                '<button type="button" class="taskbar-btn' + (isAppOpen('settings') ? ' is-open' : '') + (isAppTop('settings') ? ' is-active' : '') + '" id="tb-settings-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.settings')) + '">' +
                    global.Win11Icons.get('settings', 23) +
                '</button>' +
                '<button type="button" class="taskbar-btn' + (isAppOpen('control-panel') ? ' is-open' : '') + (isAppTop('control-panel') ? ' is-active' : '') + '" id="tb-cp-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.controlPanel')) + '">' +
                    global.Win11Icons.get('controlPanel', 22) +
                '</button>' +
                '<button type="button" class="taskbar-btn' + (isAppOpen('explorer') ? ' is-open' : '') + (isAppTop('explorer') ? ' is-active' : '') + '" id="tb-explorer-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.fileExplorer')) + '">' +
                    global.Win11Icons.get('fileExplorer', 23) +
                '</button>' +
                '<button type="button" class="taskbar-btn' + (isAppOpen('edge') ? ' is-open' : '') + (isAppTop('edge') ? ' is-active' : '') + '" id="tb-edge-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.edge')) + '">' +
                    global.Win11Icons.get('edge', 23) +
                '</button>' +
            '</div>' +
            '<div class="taskbar-tray">' +
                '<button type="button" class="tray-btn" id="tray-lang-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.inputLangTip')) + '">' +
                    '<span class="tray-lang-tag">' + global.Win11Compat.escapeHtml(activeInput.trayTag || 'FRA\nFR') + '</span>' +
                '</button>' +
                '<button type="button" class="tray-btn" id="tray-quick-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.quickSettingsTip')) + '">' +
                    global.Win11Icons.get(netIcon, 15) +
                    global.Win11Icons.get(volIcon, 15) +
                    global.Win11Icons.get('battery', 15) +
                '</button>' +
                '<button type="button" class="tray-btn" id="tray-fullscreen-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.fullscreenTip')) + '">' +
                    global.Win11Icons.get('fullscreen', 14) +
                '</button>' +
                '<button type="button" class="tray-btn tray-clock-btn" id="tray-clock-btn" title="' + global.Win11Compat.escapeHtml(t('taskbar.notificationsTip')) + '">' +
                    '<span class="tray-clock-time" id="tray-time-text">' + clockFormatted.time + '</span>' +
                    '<span class="tray-clock-date" id="tray-date-text">' + clockFormatted.date + '</span>' +
                '</button>' +
                '<button type="button" class="tray-show-desktop" id="tray-desktop-sliver" title="' + global.Win11Compat.escapeHtml(t('taskbar.showDesktopTip')) + '"></button>' +
            '</div>';

        bar.innerHTML = html;

        // Wire click handlers
        bar.querySelector('#tb-pedagogy-btn').onclick = function (e) {
            e.stopPropagation();
            if (global.Win11HUD) global.Win11HUD.toggle();
        };
        bar.querySelector('#tb-start-btn').onclick = function (e) {
            e.stopPropagation();
            global.Win11StartMenu.toggle();
        };
        var sBtn = bar.querySelector('#tb-search-btn');
        if (sBtn) sBtn.onclick = function (e) { e.stopPropagation(); global.Win11Search.toggle(); };

        var tvBtn = bar.querySelector('#tb-taskview-btn');
        if (tvBtn) tvBtn.onclick = function (e) { e.stopPropagation(); global.Win11TaskView.toggle(); };

        bar.querySelector('#tb-settings-btn').onclick = function () {
            global.Win11WM.toggleAppWindow('win-settings', function () { global.Win11Registry.open('home'); });
        };
        bar.querySelector('#tb-cp-btn').onclick = function () {
            global.Win11WM.toggleAppWindow('win-control-panel', function () { if (global.Win11ControlPanel) global.Win11ControlPanel.open(); });
        };
        bar.querySelector('#tb-explorer-btn').onclick = function () {
            global.Win11WM.toggleAppWindow('win-explorer', function () { if (global.Win11Explorer) global.Win11Explorer.open(); });
        };
        bar.querySelector('#tb-edge-btn').onclick = function () {
            global.Win11WM.toggleAppWindow('win-edge', function () { if (global.Win11Edge) global.Win11Edge.open(); });
        };

        bar.querySelector('#tray-quick-btn').onclick = function (e) {
            e.stopPropagation();
            global.Win11QuickSettings.toggle();
        };
        bar.querySelector('#tray-clock-btn').onclick = function (e) {
            e.stopPropagation();
            global.Win11Notifications.toggle();
        };
        bar.querySelector('#tray-clock-btn').oncontextmenu = function (e) {
            e.preventDefault();
            e.stopPropagation();
            global.Win11ContextMenu.show(e.clientX, e.clientY - 80, [
                { icon: 'clock', label: t('controlPanel.linkTimeZone'), onClick: function () { global.Win11Registry.open('time.datetime'); } },
                { icon: 'bell', label: t('notif.title'), onClick: function () { global.Win11Notifications.open(); } }
            ]);
        };
        bar.querySelector('#tray-fullscreen-btn').onclick = toggleFullscreen;
        bar.querySelector('#tray-desktop-sliver').onclick = function () { global.Win11WM.toggleShowDesktop(); };

        bar.querySelector('#tray-lang-btn').onclick = function (e) {
            e.stopPropagation();
            var r = this.getBoundingClientRect();
            var curSt = global.Win11State.get();
            var curInput = global.Win11State.getActiveInputLangObj ? global.Win11State.getActiveInputLangObj() : null;
            var installed = curSt.installedLanguages || [];
            var menuItems = [];
            for (var li = 0; li < installed.length; li++) {
                (function (langItem) {
                    menuItems.push({
                        label: (langItem.display || langItem.code) + ' — ' + (langItem.keyboard || langItem.code),
                        checked: !!(curInput && curInput.id === langItem.id),
                        onClick: function () { global.Win11State.setActiveInputLang(langItem.id); }
                    });
                })(installed[li]);
            }
            menuItems.push({ separator: true });
            menuItems.push({ icon: 'keyboard', label: t('taskbar.moreKeyboardSettings'), onClick: function () { global.Win11Registry.open('time.language'); } });
            global.Win11ContextMenu.show(r.left, Math.max(8, r.top - (menuItems.length * 34 + 16)), menuItems);
        };
    }

    function closeAllFlyouts(exceptName) {
        if (exceptName !== 'start' && global.Win11StartMenu) global.Win11StartMenu.close();
        if (exceptName !== 'search' && global.Win11Search) global.Win11Search.close();
        if (exceptName !== 'quick' && global.Win11QuickSettings) global.Win11QuickSettings.close();
        if (exceptName !== 'notifications' && global.Win11Notifications) global.Win11Notifications.close();
        if (exceptName !== 'taskview' && global.Win11TaskView) global.Win11TaskView.close();
        if (exceptName !== 'menu' && global.Win11ContextMenu) global.Win11ContextMenu.hide();
        if (global.Win11Snap) global.Win11Snap.closePopover();
    }

    function enterFullscreenSafely() {
        var docEl = document.documentElement;
        if (!docEl || document.fullscreenElement || document.webkitFullscreenElement) return;
        var fn = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen;
        if (fn) {
            try {
                var p = fn.call(docEl);
                if (p && typeof p.catch === 'function') p.catch(function () { });
            } catch (e) { }
        }
    }

    function isExamFullscreenLocked() {
        if (!global.Win11Assessment || !global.Win11Assessment.getConfig) return false;
        var cfg = global.Win11Assessment.getConfig();
        var stu = global.Win11Assessment.getStudent ? global.Win11Assessment.getStudent() : null;
        var mode = (stu && stu.activeSession && stu.mode) ? stu.mode : cfg.mode;
        return !!(cfg.lock_fullscreen_in_exam && mode === 'exam');
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            enterFullscreenSafely();
        } else {
            if (isExamFullscreenLocked()) {
                if (global.Win11Dialogs && !global.Win11Dialogs.isOpen()) {
                    global.Win11Dialogs.showMessage(
                        global.Win11I18N.t('pedagogy.title'),
                        'تم قفل وضع ملء الشاشة تلقائياً خلال وضع الامتحان الرسمي.',
                        'warning'
                    );
                }
                return;
            }
            var ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
            if (ex) {
                try {
                    var ep = ex.call(document);
                    if (ep && typeof ep.catch === 'function') ep.catch(function () { });
                } catch (e) { }
            }
        }
    }

    function isFullscreenActive() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function previewScreenSaver(styleName) {
        var ov = document.getElementById('screensaver-overlay');
        if (!ov) return;
        var st = global.Win11State.get();
        var s = styleName || st.screenSaver;
        ov.innerHTML =
            '<div style="text-align:center">' +
                '<div style="font-size:44px;font-weight:700;color:var(--win-accent);letter-spacing:2px">' + global.Win11Compat.escapeHtml(s === 'bubbles' ? '○ ○ ○ Windows 11 ○ ○ ○' : (s === 'ribbons' ? '~~~ Windows 11 Pro ~~~' : 'Windows 11 — 1AS')) + '</div>' +
                '<div style="margin-top:14px;opacity:0.7;font-size:14px">' + global.Win11I18N.bidiHtml(global.Win11I18N.t('app.close') + ' (Click / Esc)') + '</div>' +
            '</div>';
        ov.classList.add('is-open');
        ov.onclick = function () { ov.classList.remove('is-open'); };
    }

    function bindGlobalShortcuts() {
        document.addEventListener('keydown', function (e) {
            var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
            var inInput = (tag === 'input' || tag === 'textarea' || tag === 'select');

            // Escape closes ScreenSaver -> Dialogs -> ContextMenu -> Flyouts -> TaskView
            if (e.key === 'Escape') {
                var ss = document.getElementById('screensaver-overlay');
                if (ss && ss.classList.contains('is-open')) {
                    ss.classList.remove('is-open');
                    return;
                }
                if (global.Win11Dialogs.isOpen()) {
                    if (typeof global.Win11Dialogs.isPersistent === 'function' && global.Win11Dialogs.isPersistent()) {
                        return;
                    }
                    global.Win11Dialogs.close(null);
                    return;
                }
                closeAllFlyouts();
                return;
            }

            if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === 'Shift' || e.key === 'Alt')) {
                e.preventDefault();
                if (global.Win11State && typeof global.Win11State.cycleInputLang === 'function') {
                    global.Win11State.cycleInputLang();
                }
                return;
            }

            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
                return;
            }

            // Hidden Teacher Console shortcut strictly bound to Ctrl+Shift+S
            var isSKey = (e.key === 'S' || e.key === 's' || e.code === 'KeyS');
            if (e.ctrlKey && e.shiftKey && !e.altKey && isSKey) {
                e.preventDefault();
                e.stopPropagation();
                if (global.Win11Teacher) global.Win11Teacher.openAuth();
                return;
            }

            // Exam fullscreen lock suppresses distracting navigation shortcuts while keeping Ctrl+Shift+S intact
            if (isExamFullscreenLocked() && ((e.altKey && e.key === 'Tab') || (e.altKey && String(e.key || '').toLowerCase() === 'q'))) {
                e.preventDefault();
                return;
            }

            // Alt+ / Meta+ Windows Shell Shortcuts (safe inside Win7/modern browsers)
            var mod = e.altKey || e.metaKey;
            if (!mod) {
                if (!inInput && e.key === 'Backspace' && global.Win11SettingsApp) {
                    var top = global.Win11WM.getTopWindow();
                    if (top && top.id === 'win-settings') {
                        global.Win11SettingsApp.goBack();
                    }
                }
                return;
            }

            var k = String(e.key || '').toLowerCase();
            if (k === 'i') { e.preventDefault(); global.Win11Registry.open('home'); }
            else if (k === 'a') { e.preventDefault(); global.Win11QuickSettings.toggle(); }
            else if (k === 'n') { e.preventDefault(); global.Win11Notifications.toggle(); }
            else if (k === 'd') { e.preventDefault(); closeAllFlyouts(); global.Win11WM.toggleShowDesktop(); }
            else if (k === 's') { e.preventDefault(); global.Win11Search.toggle(); }
            else if (k === 'l') { e.preventDefault(); global.Win11LockScreen.open(); }
            else if (k === 'x') { e.preventDefault(); global.Win11ContextMenu.showPowerUserMenu(); }
            else if (k === 'q' || (e.altKey && e.key === 'Tab')) { e.preventDefault(); global.Win11TaskView.toggle(); }
            else if (e.altKey && e.key === ' ') { e.preventDefault(); global.Win11StartMenu.toggle(); }
            else if (e.altKey && e.key === 'ArrowLeft' && global.Win11SettingsApp) {
                global.Win11SettingsApp.goBack();
            }
        });
    }

    function init() {
        var desktop = document.getElementById('desktop-root');
        var taskbar = document.getElementById('taskbar');

        if (desktop) {
            desktop.addEventListener('click', function (e) {
                if (e.target === desktop || e.target.id === 'desktop-icons') {
                    updateDesktopIconSelection(null);
                    closeAllFlyouts();
                }
            });
            desktop.addEventListener('contextmenu', function (e) {
                if (global.Win11Compat.closest(e.target, '#desktop-icons button, .win-window, #taskbar, .win-flyout, #pedagogy-hud')) return;
                e.preventDefault();
                closeAllFlyouts('menu');
                global.Win11ContextMenu.showDesktopMenu(e.clientX, e.clientY);
            });
        }

        if (taskbar) {
            taskbar.addEventListener('contextmenu', function (e) {
                if (global.Win11Compat.closest(e.target, '#tray-clock-btn')) return;
                e.preventDefault();
                closeAllFlyouts('menu');
                global.Win11ContextMenu.showTaskbarMenu(e.clientX, e.clientY - 75);
            });
        }

        // Suppress native browser context menu across all simulated OS surfaces
        // (allow standard edit menu only inside editable text/password inputs)
        document.addEventListener('contextmenu', function (e) {
            var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea') {
                var tp = (e.target.getAttribute('type') || 'text').toLowerCase();
                if (tp !== 'checkbox' && tp !== 'radio' && tp !== 'range') return;
            }
            e.preventDefault();
        });

        // Prevent internal flyout clicks (including re-rendered child buttons) from closing the active flyout
        var flyoutIds = ['start-menu-flyout', 'search-flyout', 'quick-settings-flyout', 'notifications-flyout'];
        for (var fi = 0; fi < flyoutIds.length; fi++) {
            var fEl = document.getElementById(flyoutIds[fi]);
            if (fEl) {
                fEl.addEventListener('click', function (e) { e.stopPropagation(); });
            }
        }

        document.addEventListener('click', function (e) {
            if (!global.Win11Compat.closest(e.target, '#context-menu')) {
                global.Win11ContextMenu.hide();
            }
            if (!global.Win11Compat.closest(e.target, '#start-menu-flyout, #search-flyout, #quick-settings-flyout, #notifications-flyout, #taskbar, #context-menu')) {
                closeAllFlyouts('taskview');
            }
        });

        bindGlobalShortcuts();
        renderDesktopIcons();
        renderTaskbar();

        global.Win11WM.onChange(renderTaskbar);
        global.Win11State.on('*', function () {
            renderDesktopIcons();
            renderTaskbar();
            if (global.Win11StartMenu) global.Win11StartMenu.refresh();
            if (global.Win11Search) global.Win11Search.refresh();
            if (global.Win11QuickSettings) global.Win11QuickSettings.refresh();
            if (global.Win11Notifications) global.Win11Notifications.refresh();
        });
        global.Win11I18N.onChange(function () {
            renderDesktopIcons();
            renderTaskbar();
            if (global.Win11StartMenu) global.Win11StartMenu.refresh();
            if (global.Win11Search) global.Win11Search.refresh();
            if (global.Win11QuickSettings) global.Win11QuickSettings.refresh();
            if (global.Win11Notifications) global.Win11Notifications.refresh();
        });

        if (clockTimer) clearInterval(clockTimer);
        clockTimer = setInterval(updateClockOnly, 1000);

        var syncFsUi = function () {
            var fsBtn = document.getElementById('tray-fullscreen-btn');
            if (fsBtn) fsBtn.classList.toggle('is-open', isFullscreenActive());
        };
        document.addEventListener('fullscreenchange', syncFsUi);
        document.addEventListener('webkitfullscreenchange', syncFsUi);
    }

    global.Win11Shell = {
        init: init,
        closeAllFlyouts: closeAllFlyouts,
        toggleFullscreen: toggleFullscreen,
        enterFullscreen: enterFullscreenSafely,
        isFullscreen: isFullscreenActive,
        previewScreenSaver: previewScreenSaver,
        renderDesktopIcons: renderDesktopIcons,
        renderTaskbar: renderTaskbar
    };
})(window);
