(function (global) {
    'use strict';

    global.Win11SettingsApp.register('personalization', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var sub = ctx.subpage || 'main';
        var goRoot = function () { ctx.navigate('personalization', 'main'); };

        if (sub === 'background') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.personalization'), goRoot, t('settings.personalization.bgTitle')));
            var activeWp = global.Win11State.getWallpaper(st.wallpaperId);

            var bgHero = document.createElement('div');
            bgHero.className = 'system-hero';
            bgHero.innerHTML =
                '<div class="system-hero-pc">' +
                    '<div style="width:200px;height:112px;border-radius:6px;border:3px solid #1E293B;background:url(\'' + activeWp.file + '\') center/cover no-repeat;position:relative">' +
                        '<div style="position:absolute;bottom:10px;right:12px;width:44px;height:30px;background:' + (st.themeMode === 'dark' ? '#202020' : '#ffffff') + ';border-radius:3px;border-top:4px solid ' + st.accentColor + '"></div>' +
                    '</div>' +
                    '<div>' +
                        '<div style="font-weight:700;font-size:15px">' + bidi(t('settings.personalization.choosePhoto')) + '</div>' +
                        '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(activeWp.labelKey ? t(activeWp.labelKey) : (activeWp.label || st.wallpaperId)) + '</div>' +
                        (st.customWallpaper && st.customWallpaper.path ? '<div style="font-size:11.5px;color:var(--win-accent-text);margin-top:4px"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.customWallpaper.path) + '</bdi></div>' : '') +
                    '</div>' +
                '</div>' +
                '<button type="button" class="win-btn win-btn-accent" id="btn-browse-wallpaper">' + bidi(t('settings.personalization.browseBtn')) + '</button>';
            ctx.container.appendChild(bgHero);

            bgHero.querySelector('#btn-browse-wallpaper').onclick = function () {
                var launchPicker = function () {
                    if (global.Win11Explorer && typeof global.Win11Explorer.openImagePicker === 'function') {
                        global.Win11Explorer.openImagePicker(function (fileObj, fullPath) {
                            global.Win11State.setUserWallpaper(fileObj.id, {
                                file: fileObj.imgPath,
                                label: fileObj.name,
                                folder: 'pictures',
                                path: fullPath,
                                browseMeta: {
                                    usedBrowse: true,
                                    selectedFolder: 'pictures',
                                    selectedPath: fullPath,
                                    selectedFileId: fileObj.id
                                }
                            });
                            ctx.navigate('personalization', 'background');
                        });
                    }
                };
                if (global.Win11Permissions) {
                    global.Win11Permissions.guard('personalization.wallpaper', launchPicker, { targetLabel: t('settings.personalization.browseBtn') });
                } else {
                    launchPicker();
                }
            };

            var card = document.createElement('div');
            card.id = 'ctrl-wallpaper-grid';
            card.className = 'win-card';
            card.innerHTML = '<div style="font-weight:600;margin-bottom:6px">' + bidi(t('settings.personalization.recentImages')) + '</div><div class="wallpaper-grid"></div>';

            var grid = card.querySelector('.wallpaper-grid');
            for (var i = 0; i < global.Win11State.WALLPAPERS.length; i++) {
                (function (wp) {
                    var tile = document.createElement('button');
                    tile.type = 'button';
                    tile.className = 'wallpaper-tile' + (st.wallpaperId === wp.id ? ' is-selected' : '');
                    var label = wp.labelKey ? t(wp.labelKey) : wp.label;
                    tile.innerHTML =
                        '<img src="' + global.Win11State.resolveMediaUrl(wp.file) + '" alt="' + global.Win11Compat.escapeHtml(label) + '" decoding="async">' +
                        '<span class="wallpaper-label">' + bidi(label) + '</span>';
                    tile.onclick = function () {
                        var applyWp = function () {
                            global.Win11State.setUserWallpaper(wp.id);
                            ctx.navigate('personalization', 'background');
                        };
                        if (global.Win11Permissions) {
                            global.Win11Permissions.guard('personalization.wallpaper', applyWp, { targetLabel: t('settings.personalization.bgTitle') });
                        } else {
                            applyWp();
                        }
                    };
                    grid.appendChild(tile);
                })(global.Win11State.WALLPAPERS[i]);
            }
            ctx.container.appendChild(card);
            return;
        }

        if (sub === 'colors') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.personalization'), goRoot, t('settings.personalization.colorsTitle')));
            ctx.container.appendChild(ctx.ui.rowSelect({
                icon: 'palette',
                title: t('settings.personalization.modeLabel'),
                value: st.themeMode,
                permAction: 'personalization.theme',
                options: [
                    { value: 'light', label: t('settings.personalization.modeLight') },
                    { value: 'dark', label: t('settings.personalization.modeDark') }
                ],
                onChange: function (v) { global.Win11State.set({ themeMode: v }, 'theme:changed'); }
            }));

            ctx.container.appendChild(ctx.ui.rowToggle({
                title: t('settings.personalization.transparency'),
                desc: t('settings.personalization.transparencyDesc'),
                checked: st.transparency,
                permAction: 'personalization.theme',
                onChange: function (v) { global.Win11State.set({ transparency: v }, 'theme:changed'); }
            }));

            var accCard = document.createElement('div');
            accCard.id = 'ctrl-accent-colors';
            accCard.className = 'win-card';
            accCard.innerHTML = '<div style="font-weight:600;margin-bottom:6px">' + bidi(t('settings.personalization.accentTitle')) + '</div><div class="accent-grid"></div>';
            var swatchBox = accCard.querySelector('.accent-grid');
            for (var j = 0; j < global.Win11State.ACCENT_PALETTE.length; j++) {
                (function (sw) {
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    var selected = (st.accentColor.toUpperCase() === sw.hex.toUpperCase());
                    btn.className = 'accent-swatch' + (selected ? ' is-selected' : '');
                    btn.style.backgroundColor = sw.hex;
                    btn.title = sw.hex;
                    btn.innerHTML = selected ? global.Win11Icons.get('check', 18) : '';
                    btn.onclick = function () {
                        var applyAcc = function () {
                            global.Win11State.set({ accentColor: sw.hex }, 'theme:changed');
                            ctx.navigate('personalization', 'colors');
                        };
                        if (global.Win11Permissions) {
                            global.Win11Permissions.guard('personalization.theme', applyAcc, { targetLabel: t('settings.personalization.accentTitle') });
                        } else {
                            applyAcc();
                        }
                    };
                    swatchBox.appendChild(btn);
                })(global.Win11State.ACCENT_PALETTE[j]);
            }
            ctx.container.appendChild(accCard);
            return;
        }

        if (sub === 'themes') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.personalization'), goRoot, t('settings.personalization.themesTitle')));
            ctx.container.appendChild(ctx.ui.rowSelect({
                id: 'ctrl-screensaver-select',
                icon: 'navPersonalization',
                title: t('settings.personalization.screenSaverStyle'),
                value: st.screenSaver,
                permAction: 'personalization.saver',
                options: [
                    { value: 'none', label: t('settings.personalization.saverNone') },
                    { value: 'text3d', label: t('settings.personalization.saverText3d') },
                    { value: 'bubbles', label: t('settings.personalization.saverBubbles') },
                    { value: 'ribbons', label: t('settings.personalization.saverRibbons') }
                ],
                onChange: function (v) { global.Win11State.set({ screenSaver: v }); }
            }));
            ctx.container.appendChild(ctx.ui.rowSlider({
                title: t('settings.personalization.saverWait'),
                min: 1,
                max: 30,
                value: st.screenSaverWait,
                permAction: 'personalization.saver',
                onChange: function (v) { global.Win11State.set({ screenSaverWait: v }); }
            }));
            var prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'win-btn win-btn-accent';
            prevBtn.innerHTML = bidi(t('settings.personalization.previewScreenSaver'));
            prevBtn.onclick = function () {
                if (global.Win11Shell) global.Win11Shell.previewScreenSaver(global.Win11State.get().screenSaver);
            };
            ctx.container.appendChild(prevBtn);
            return;
        }

        if (sub === 'lockscreen') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.personalization'), goRoot, t('settings.personalization.lockscreenTitle')));
            var wp = global.Win11State.getWallpaper(st.wallpaperId);
            var simNow = global.Win11State.getSimulatedNow();
            var hh = String(simNow.getHours());
            var mm = String(simNow.getMinutes());
            if (hh.length < 2) hh = '0' + hh;
            if (mm.length < 2) mm = '0' + mm;
            var timeStr = global.Win11I18N.formatDigits(hh + ':' + mm);
            var preview = document.createElement('div');
            preview.id = 'ctrl-lockscreen-preview';
            preview.className = 'win-card';
            preview.innerHTML =
                '<div style="height:180px;border-radius:6px;background:url(\'' + wp.file + '\') center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:#fff;flex-direction:column;text-shadow:0 2px 10px rgba(0,0,0,0.75)">' +
                    '<div style="font-size:36px;font-weight:300"><bdi dir="ltr">' + timeStr + '</bdi></div>' +
                    '<div style="font-size:13px">' + bidi(t('settings.personalization.lockscreenDesc')) + '</div>' +
                '</div>' +
                '<div style="margin-top:12px"><button type="button" class="win-btn win-btn-secondary" id="open-lock-now">' + bidi(t('start.lockPc')) + '</button></div>';
            ctx.container.appendChild(preview);
            preview.querySelector('#open-lock-now').onclick = function () { global.Win11LockScreen.open(); };
            return;
        }

        if (sub === 'start') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.personalization'), goRoot, t('settings.personalization.startTitle')));
            ctx.container.appendChild(ctx.ui.rowToggle({
                id: 'ctrl-start-recommended',
                icon: 'win11',
                title: t('settings.personalization.showRecommended'),
                checked: st.startShowRecommended,
                permAction: 'personalization.theme',
                onChange: function (v) { global.Win11State.set({ startShowRecommended: v }); }
            }));
            return;
        }

        if (sub === 'taskbar') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.personalization'), goRoot, t('settings.personalization.taskbarTitle')));
            ctx.container.appendChild(ctx.ui.rowSelect({
                id: 'ctrl-taskbar-align',
                icon: 'sliders',
                title: t('settings.personalization.taskbarAlign'),
                value: st.taskbarAlign,
                permAction: 'personalization.taskbar',
                options: [
                    { value: 'center', label: t('settings.personalization.alignCenter') },
                    { value: 'start', label: t('settings.personalization.alignStart') }
                ],
                onChange: function (v) { global.Win11State.set({ taskbarAlign: v }); }
            }));
            ctx.container.appendChild(ctx.ui.rowToggle({
                icon: 'search',
                title: t('settings.personalization.showSearchPill'),
                checked: st.taskbarShowSearch,
                permAction: 'personalization.taskbar',
                onChange: function (v) { global.Win11State.set({ taskbarShowSearch: v }); }
            }));
            ctx.container.appendChild(ctx.ui.rowToggle({
                icon: 'taskView',
                title: t('settings.personalization.showTaskView'),
                checked: st.taskbarShowTaskView,
                permAction: 'personalization.taskbar',
                onChange: function (v) { global.Win11State.set({ taskbarShowTaskView: v }); }
            }));
            return;
        }

        // Main Personalization Hub
        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.personalization')));
        var curWp = global.Win11State.getWallpaper(st.wallpaperId);
        var heroBox = document.createElement('div');
        heroBox.className = 'system-hero';
        heroBox.innerHTML =
            '<div class="system-hero-pc">' +
                '<div style="width:200px;height:112px;border-radius:6px;border:3px solid #1E293B;background:url(\'' + curWp.file + '\') center/cover no-repeat;position:relative">' +
                    '<div style="position:absolute;bottom:10px;right:12px;width:44px;height:30px;background:' + (st.themeMode === 'dark' ? '#202020' : '#ffffff') + ';border-radius:3px;border-top:4px solid ' + st.accentColor + '"></div>' +
                '</div>' +
                '<div>' +
                    '<div style="font-weight:700;font-size:15px">' + bidi(t('settings.personalization.chooseBg')) + '</div>' +
                    '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t(st.themeMode === 'dark' ? 'settings.personalization.modeDark' : 'settings.personalization.modeLight')) + '</div>' +
                '</div>' +
            '</div>';
        ctx.container.appendChild(heroBox);

        var items = [
            { sub: 'background', icon: 'wallpaper', title: t('settings.personalization.bgTitle'), desc: t('settings.personalization.bgDesc') },
            { sub: 'colors', icon: 'palette', title: t('settings.personalization.colorsTitle'), desc: t('settings.personalization.colorsDesc') },
            { sub: 'themes', icon: 'navPersonalization', title: t('settings.personalization.themesTitle'), desc: t('settings.personalization.themesDesc') },
            { sub: 'lockscreen', icon: 'lock', title: t('settings.personalization.lockscreenTitle'), desc: t('settings.personalization.lockscreenDesc') },
            { sub: 'start', icon: 'win11', title: t('settings.personalization.startTitle'), desc: t('settings.personalization.startDesc') },
            { sub: 'taskbar', icon: 'sliders', title: t('settings.personalization.taskbarTitle'), desc: t('settings.personalization.taskbarDesc') }
        ];
        for (var k = 0; k < items.length; k++) {
            (function (item) {
                ctx.container.appendChild(ctx.ui.rowLink({
                    icon: item.icon,
                    title: item.title,
                    desc: item.desc,
                    onClick: function () { ctx.navigate('personalization', item.sub); }
                }));
            })(items[k]);
        }
    });
})(window);
