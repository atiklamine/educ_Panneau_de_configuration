/**
 * Windows 11 Context Menus (Desktop, Taskbar, Tray, Icons & Win+X Power User)
 * Supports nested hover/click submenus and viewport clamping.
 */
(function (global) {
    'use strict';

    function getMenuEl() {
        return document.getElementById('context-menu');
    }

    function hide() {
        var el = getMenuEl();
        if (el) {
            el.classList.remove('is-open');
            el.innerHTML = '';
        }
    }

    function buildItems(container, items) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.separator) {
                var sep = document.createElement('div');
                sep.className = 'ctx-sep';
                container.appendChild(sep);
                continue;
            }
            (function (def) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ctx-item';
                if (def.id) btn.id = def.id;

                var iconSpan = document.createElement('span');
                iconSpan.style.width = '18px';
                iconSpan.style.display = 'inline-flex';
                iconSpan.style.justifyContent = 'center';
                if (def.checked) {
                    iconSpan.innerHTML = global.Win11Icons.get('check', 14);
                } else if (def.icon) {
                    iconSpan.innerHTML = global.Win11Icons.get(def.icon, 15);
                }
                btn.appendChild(iconSpan);

                var label = document.createElement('span');
                label.className = 'ctx-item-label';
                label.innerHTML = global.Win11I18N.bidiHtml(def.label);
                btn.appendChild(label);

                if (def.children && def.children.length > 0) {
                    var arrow = document.createElement('span');
                    arrow.className = 'win-dir-arrow';
                    arrow.innerHTML = global.Win11Icons.get('chevronRight', 13);
                    btn.appendChild(arrow);

                    var sub = document.createElement('div');
                    sub.className = 'ctx-submenu win-acrylic';
                    buildItems(sub, def.children);
                    btn.appendChild(sub);

                    function positionSubmenu() {
                        sub.style.insetInlineStart = '100%';
                        sub.style.insetInlineEnd = 'auto';
                        var sr = sub.getBoundingClientRect();
                        if (sr.width > 0 && (sr.left < 6 || sr.right > global.innerWidth - 6)) {
                            sub.style.insetInlineStart = 'auto';
                            sub.style.insetInlineEnd = '100%';
                        }
                    }

                    btn.addEventListener('mouseenter', positionSubmenu);
                    btn.onclick = function (e) {
                        e.stopPropagation();
                        sub.style.display = (sub.style.display === 'block') ? '' : 'block';
                        if (sub.style.display === 'block') positionSubmenu();
                    };
                } else {
                    btn.onclick = function (e) {
                        e.stopPropagation();
                        hide();
                        if (typeof def.onClick === 'function') def.onClick();
                    };
                }

                container.appendChild(btn);
            })(item);
        }
    }

    function show(x, y, items) {
        var el = getMenuEl();
        if (!el) return;
        el.innerHTML = '';
        buildItems(el, items);
        el.classList.add('is-open');

        // Clamp within screen viewport cleanly
        var mw = el.offsetWidth || 230;
        var mh = el.offsetHeight || 220;
        var left = global.Win11Compat.clamp(x, 6, Math.max(6, global.innerWidth - mw - 6));
        var top = global.Win11Compat.clamp(y, 6, Math.max(6, global.innerHeight - mh - 54));
        el.style.left = left + 'px';
        el.style.top = top + 'px';
    }

    function showDesktopMenu(x, y) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var st = global.Win11State.get();
        show(x, y, [
            {
                icon: 'wallpaper',
                label: t('desktop.view'),
                children: [
                    { label: t('desktop.viewLarge'), checked: st.desktopIconSize === 'large', onClick: function () { global.Win11State.set({ desktopIconSize: 'large' }); } },
                    { label: t('desktop.viewMedium'), checked: st.desktopIconSize === 'medium', onClick: function () { global.Win11State.set({ desktopIconSize: 'medium' }); } },
                    { label: t('desktop.viewSmall'), checked: st.desktopIconSize === 'small', onClick: function () { global.Win11State.set({ desktopIconSize: 'small' }); } }
                ]
            },
            {
                icon: 'sliders',
                label: t('desktop.sortBy'),
                children: [
                    { label: t('desktop.sortName'), checked: st.desktopSort === 'name', onClick: function () { global.Win11State.set({ desktopSort: 'name' }); } },
                    { label: t('desktop.sortType'), checked: st.desktopSort === 'type', onClick: function () { global.Win11State.set({ desktopSort: 'type' }); } }
                ]
            },
            {
                icon: 'refresh',
                label: t('desktop.refresh'),
                onClick: function () {
                    var desk = document.getElementById('desktop-icons');
                    if (desk) {
                        desk.style.opacity = '0.45';
                        setTimeout(function () { desk.style.opacity = '1'; }, 110);
                    }
                }
            },
            { separator: true },
            {
                icon: 'navSystem',
                label: t('desktop.displaySettings'),
                onClick: function () { global.Win11Registry.open('system.display'); }
            },
            {
                icon: 'navPersonalization',
                label: t('desktop.personalize'),
                onClick: function () { global.Win11Registry.open('personalization.background'); }
            },
            { separator: true },
            {
                icon: 'fullscreen',
                label: t('desktop.toggleFullscreen'),
                onClick: function () { if (global.Win11Shell) global.Win11Shell.toggleFullscreen(); }
            },
            { separator: true },
            {
                id: 'ctx-about-app',
                icon: 'info',
                label: 'حول التطبيق',
                onClick: function () { if (global.Win11Dialogs && global.Win11Dialogs.showAbout) global.Win11Dialogs.showAbout(); }
            }
        ]);
    }

    function showTaskbarMenu(x, y) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        show(x, y, [
            {
                icon: 'sliders',
                label: t('desktop.taskbarSettings'),
                onClick: function () { global.Win11Registry.open('personalization.taskbar'); }
            },
            {
                icon: 'taskView',
                label: t('desktop.taskManager'),
                onClick: function () { if (global.Win11TaskView) global.Win11TaskView.open(); }
            }
        ]);
    }

    function showPowerUserMenu() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var isRtl = global.Win11I18N.isRtl();
        var x = isRtl ? (global.innerWidth - 240) : 12;
        var y = Math.max(20, global.innerHeight - 360);
        show(x, y, [
            { icon: 'navApps', label: t('settings.apps.installedTitle'), onClick: function () { global.Win11Registry.open('apps.installed'); } },
            { icon: 'battery', label: t('settings.system.powerTitle'), onClick: function () { global.Win11Registry.open('system.power'); } },
            { icon: 'navSystem', label: t('settings.nav.system'), onClick: function () { global.Win11Registry.open('system.about'); } },
            { icon: 'navNetwork', label: t('settings.nav.network'), onClick: function () { global.Win11Registry.open('network.status'); } },
            { icon: 'sliders', label: t('desktop.controlPanel'), onClick: function () { if (global.Win11ControlPanel) global.Win11ControlPanel.open(); } },
            { icon: 'settings', label: t('desktop.settings'), onClick: function () { global.Win11Registry.open('home'); } },
            { icon: 'fileExplorer', label: t('taskbar.fileExplorer'), onClick: function () { if (global.Win11Explorer) global.Win11Explorer.open(); } },
            { separator: true },
            { id: 'ctx-start-about-app', icon: 'info', label: 'حول التطبيق', onClick: function () { if (global.Win11Dialogs && global.Win11Dialogs.showAbout) global.Win11Dialogs.showAbout(); } },
            { icon: 'lock', label: t('start.lockPc'), onClick: function () { if (global.Win11LockScreen) global.Win11LockScreen.open(); } }
        ]);
    }

    global.Win11ContextMenu = {
        show: show,
        hide: hide,
        showDesktopMenu: showDesktopMenu,
        showTaskbarMenu: showTaskbarMenu,
        showPowerUserMenu: showPowerUserMenu
    };
})(window);

