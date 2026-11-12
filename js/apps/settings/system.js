(function (global) {
    'use strict';

    global.Win11SettingsApp.register('system', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var sub = ctx.subpage || 'main';
        var goRoot = function () { ctx.navigate('system', 'main'); };

        if (sub === 'display') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system'), goRoot, t('settings.system.displayTitle')));
            ctx.container.appendChild(ctx.ui.rowSlider({
                id: 'ctrl-display-brightness',
                icon: 'brightness',
                title: t('quick.brightness'),
                min: 30,
                max: 100,
                value: st.brightness,
                unit: '%',
                permAction: 'system.display',
                onChange: function (v) { global.Win11State.set({ brightness: v }); }
            }));
            ctx.container.appendChild(ctx.ui.rowToggle({
                icon: 'moon',
                title: t('settings.system.nightLight'),
                desc: t('settings.system.nightLightDesc'),
                checked: st.nightLight,
                permAction: 'system.display',
                onChange: function (v) { global.Win11State.set({ nightLight: v }); }
            }));
            ctx.container.appendChild(ctx.ui.groupLabel(t('settings.system.scale')));
            ctx.container.appendChild(ctx.ui.rowSelect({
                icon: 'navSystem',
                title: t('settings.system.scale'),
                value: String(st.textScale),
                permAction: 'system.display',
                options: [
                    { value: '100', label: '100% (' + t('app.default') + ')' },
                    { value: '115', label: '115%' },
                    { value: '125', label: '125%' },
                    { value: '150', label: '150%' }
                ],
                onChange: function (v) { global.Win11State.set({ textScale: Number(v) }); }
            }));
            ctx.container.appendChild(ctx.ui.rowSelect({
                title: t('settings.system.resolution'),
                value: st.resolution,
                permAction: 'system.display',
                options: [
                    { value: '1920 x 1080', label: '1920 x 1080 (' + t('app.default') + ')' },
                    { value: '1366 x 768', label: '1366 x 768' },
                    { value: '1280 x 720', label: '1280 x 720' },
                    { value: '1024 x 768', label: '1024 x 768' }
                ],
                onChange: function (v) { global.Win11State.set({ resolution: v }); }
            }));
            ctx.container.appendChild(ctx.ui.rowSelect({
                title: t('settings.system.orientation'),
                value: st.orientation,
                permAction: 'system.display',
                options: [
                    { value: 'landscape', label: t('settings.system.landscape') },
                    { value: 'portrait', label: t('settings.system.portrait') }
                ],
                onChange: function (v) { global.Win11State.set({ orientation: v }); }
            }));
            return;
        }

        if (sub === 'sound') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system'), goRoot, t('settings.system.soundTitle')));
            ctx.container.appendChild(ctx.ui.rowSelect({
                id: 'ctrl-sound-output',
                icon: 'volume',
                title: t('settings.system.outputDevice'),
                value: 'realtek',
                options: [{ value: 'realtek', label: t('settings.system.speakerDefault') }],
                onChange: function () { }
            }));
            ctx.container.appendChild(ctx.ui.rowSlider({
                icon: st.muted ? 'volumeMute' : 'volume',
                title: t('quick.volume'),
                min: 0,
                max: 100,
                value: st.muted ? 0 : st.volume,
                unit: '%',
                permAction: 'system.sound',
                onChange: function (v) { global.Win11State.set({ volume: v, muted: (v === 0) }, 'sound:changed'); }
            }));
            ctx.container.appendChild(ctx.ui.rowToggle({
                title: t('settings.system.systemSounds'),
                checked: st.soundEnabled,
                permAction: 'system.sound',
                onChange: function (v) { global.Win11State.set({ soundEnabled: v }, 'sound:changed'); }
            }));
            return;
        }

        if (sub === 'notifications') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system'), goRoot, t('settings.system.notifTitle')));
            ctx.container.appendChild(ctx.ui.rowToggle({
                id: 'ctrl-notif-dnd',
                icon: 'moon',
                title: t('notif.dnd'),
                desc: t('settings.system.notifDesc'),
                checked: st.dnd,
                permAction: 'system.notifications',
                onChange: function (v) { global.Win11State.set({ dnd: v }); }
            }));
            return;
        }

        if (sub === 'power') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system'), goRoot, t('settings.system.powerTitle')));
            var batCard = document.createElement('div');
            batCard.className = 'win-card';
            batCard.innerHTML =
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
                    '<span style="font-weight:600">' + bidi(t('settings.system.batteryLevel')) + '</span>' +
                    '<span style="font-weight:700;font-size:18px"><bdi dir="ltr">' + st.batteryPercent + '%</bdi></span>' +
                '</div>' +
                '<div class="win-progress"><div class="win-progress-fill" style="width:' + st.batteryPercent + '%"></div></div>';
            ctx.container.appendChild(batCard);

            ctx.container.appendChild(ctx.ui.rowSelect({
                id: 'ctrl-power-mode',
                icon: 'battery',
                title: t('settings.system.powerMode'),
                value: st.powerMode,
                permAction: 'system.power',
                options: [
                    { value: 'balanced', label: t('settings.system.powerBalanced') },
                    { value: 'best', label: t('settings.system.powerBestPerf') },
                    { value: 'efficiency', label: t('settings.system.powerEfficiency') }
                ],
                onChange: function (v) { global.Win11State.set({ powerMode: v }); }
            }));
            ctx.container.appendChild(ctx.ui.rowToggle({
                title: t('quick.batterySaver'),
                checked: st.batterySaver,
                permAction: 'system.power',
                onChange: function (v) { global.Win11State.set({ batterySaver: v }); }
            }));
            return;
        }

        if (sub === 'storage') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system'), goRoot, t('settings.system.storageTitle')));
            var sCard = document.createElement('div');
            sCard.id = 'ctrl-storage-bar';
            sCard.className = 'win-card';
            sCard.innerHTML =
                '<div style="font-weight:600;margin-bottom:8px">' + bidi(t('settings.system.storageUsed')) + '</div>' +
                '<div class="win-progress"><div class="win-progress-fill" style="width:25%"></div></div>';
            ctx.container.appendChild(sCard);
            return;
        }

        if (sub === 'multitasking') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system'), goRoot, t('settings.system.multitaskingTitle')));
            ctx.container.appendChild(ctx.ui.rowToggle({
                id: 'ctrl-snap-windows',
                icon: 'taskView',
                title: t('settings.system.snapWindows'),
                desc: t('settings.system.snapWindowsDesc'),
                checked: st.snapWindowsEnabled,
                onChange: function (v) { global.Win11State.set({ snapWindowsEnabled: v }); }
            }));
            return;
        }

        if (sub === 'about') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system'), goRoot, t('settings.system.aboutTitle')));
            var specCard = document.createElement('div');
            specCard.id = 'ctrl-about-specs';
            specCard.className = 'win-card';
            specCard.innerHTML =
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
                    '<div style="font-weight:700;font-size:15px">' + bidi(t('settings.system.specsHeader')) + '</div>' +
                    '<button type="button" class="win-btn win-btn-secondary" id="sys-rename-btn">' + bidi(t('settings.system.heroRename')) + '</button>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:160px 1fr;gap:8px;font-size:13px">' +
                    '<div style="color:var(--win-text-secondary)">' + bidi(t('settings.system.deviceNameLabel')) + '</div><div><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.deviceName) + '</bdi></div>' +
                    '<div style="color:var(--win-text-secondary)">Processor</div><div><bdi dir="ltr">Intel(R) Core(TM) i3 @ 2.40GHz</bdi></div>' +
                    '<div style="color:var(--win-text-secondary)">RAM</div><div><bdi dir="ltr">2.00 GB</bdi></div>' +
                    '<div style="color:var(--win-text-secondary)">' + bidi(t('settings.system.winSpecsHeader')) + '</div><div><bdi dir="ltr">Windows 11 Pro Education (23H2 — Build 22631.3007)</bdi></div>' +
                '</div>' +
                '<div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--win-border-divider)">' +
                    '<div style="display:flex;align-items:center;gap:10px">' +
                        global.Win11Icons.get('graduation', 22) +
                        '<div>' +
                            '<div style="font-weight:600;font-size:13.5px">' + bidi('حول التطبيق — محاكي Windows 11 التعليمي (v1.0.0)') + '</div>' +
                            '<div style="font-size:12px;color:var(--win-text-secondary)">' + bidi('رسالة الأستاذ، الرؤية التعليمية، وخارطة الطريق') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="win-btn win-btn-accent" id="sys-about-modal-btn">' + bidi('حول التطبيق') + '</button>' +
                '</div>';
            ctx.container.appendChild(specCard);

            specCard.querySelector('#sys-rename-btn').onclick = function () { openRenamePcModal(ctx); };
            specCard.querySelector('#sys-about-modal-btn').onclick = function () { global.Win11Dialogs.showAbout(); };
            return;
        }

        // System Overview Page (Main)
        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.system')));
        var wp = global.Win11State.getWallpaper(st.wallpaperId);
        var hero = document.createElement('div');
        hero.className = 'system-hero';
        hero.innerHTML =
            '<div class="system-hero-pc">' +
                '<div class="system-hero-thumb" style="background-image:url(\'' + wp.file + '\')"></div>' +
                '<div>' +
                    '<div style="font-size:18px;font-weight:700"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.deviceName) + '</bdi></div>' +
                    '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t('settings.system.deviceModel')) + '</div>' +
                    '<button type="button" class="win-btn win-btn-subtle" id="sys-hero-rename" style="padding:2px 6px;color:var(--win-accent-text);min-height:24px;margin-top:4px">' + bidi(t('app.rename')) + '</button>' +
                '</div>' +
            '</div>';
        ctx.container.appendChild(hero);
        hero.querySelector('#sys-hero-rename').onclick = function () { openRenamePcModal(ctx); };

        var subItems = [
            { sub: 'display', icon: 'navSystem', title: t('settings.system.displayTitle'), desc: t('settings.system.displayDesc') },
            { sub: 'sound', icon: 'volume', title: t('settings.system.soundTitle'), desc: t('settings.system.soundDesc') },
            { sub: 'notifications', icon: 'bell', title: t('settings.system.notifTitle'), desc: t('settings.system.notifDesc') },
            { sub: 'power', icon: 'battery', title: t('settings.system.powerTitle'), desc: t('settings.system.powerDesc') },
            { sub: 'storage', icon: 'drive', title: t('settings.system.storageTitle'), desc: t('settings.system.storageDesc') },
            { sub: 'multitasking', icon: 'taskView', title: t('settings.system.multitaskingTitle'), desc: t('settings.system.multitaskingDesc') },
            { sub: 'about', icon: 'info', title: t('settings.system.aboutTitle'), desc: t('settings.system.aboutDesc') }
        ];
        for (var i = 0; i < subItems.length; i++) {
            (function (item) {
                ctx.container.appendChild(ctx.ui.rowLink({
                    icon: item.icon,
                    title: item.title,
                    desc: item.desc,
                    onClick: function () { ctx.navigate('system', item.sub); }
                }));
            })(subItems[i]);
        }
    });

    function openRenamePcModal(ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var doOpen = function () {
            var st = global.Win11State.get();
            global.Win11Dialogs.showCustom({
                title: t('settings.system.heroRename'),
                tone: 'info',
                renderBody: function (wrap) {
                    wrap.innerHTML =
                        '<label style="display:block;margin-bottom:6px;font-weight:500">' + global.Win11I18N.bidiHtml(t('settings.system.deviceNameLabel')) + '</label>' +
                        '<input type="text" id="dlg-pc-name" class="win-input" value="' + global.Win11Compat.escapeHtml(st.deviceName) + '" dir="ltr">';
                },
                buttons: [
                    {
                        label: t('app.save'),
                        primary: true,
                        onClick: function (closeFn) {
                            var inp = document.getElementById('dlg-pc-name');
                            var val = inp ? inp.value.trim() : '';
                            if (!val) return true;
                            global.Win11State.set({ deviceName: val });
                            closeFn(true);
                            ctx.navigate('system', ctx.subpage);
                        }
                    },
                    { label: t('app.cancel'), primary: false, value: false }
                ]
            });
        };
        if (global.Win11Permissions) {
            global.Win11Permissions.guard('system.rename', doOpen, { targetLabel: t('settings.system.heroRename') });
        } else {
            doOpen();
        }
    }
})(window);

