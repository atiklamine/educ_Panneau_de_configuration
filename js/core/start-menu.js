/**
 * Windows 11 Start Menu Flyout (Pinned Grid, All Apps List, User Profile, Power Menu)
 */
(function (global) {
    'use strict';

    var showAllApps = false;

    function getEl() {
        return document.getElementById('start-menu-flyout');
    }

    function isOpen() {
        var el = getEl();
        return !!(el && el.classList.contains('is-open'));
    }

    function close() {
        var el = getEl();
        if (el) el.classList.remove('is-open');
        showAllApps = false;
    }

    function getPinnedItems() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var items = [];
        var st = global.Win11State ? global.Win11State.get() : null;

        // If LabTools is installed, place it prominently in Pinned items!
        var hasLab = st && st.installedPrograms && st.installedPrograms.some(function (p) { return p.id === 'labtools_app'; });
        if (hasLab) {
            items.push({
                icon: 'labtools',
                label: 'LabTools 1AS',
                action: function () {
                    if (global.Win11Dialogs && typeof global.Win11Dialogs.openLabToolsApp === 'function') {
                        global.Win11Dialogs.openLabToolsApp();
                    }
                }
            });
        }

        // If Optional Features are enabled, place them in Pinned items too!
        var feats = (st && st.optionalFeatures) || [];
        for (var f = 0; f < feats.length; f++) {
            if (feats[f].installed) {
                (function (featItem) {
                    items.push({
                        icon: featItem.icon || 'paint',
                        label: featItem.nameAr || featItem.name,
                        action: function () {
                            if (global.Win11Dialogs && typeof global.Win11Dialogs.openOptionalFeatureApp === 'function') {
                                global.Win11Dialogs.openOptionalFeatureApp(featItem.id);
                            }
                        }
                    });
                })(feats[f]);
            }
        }

        items.push(
            { icon: 'settings', label: t('desktop.settings'), action: function () { global.Win11Registry.open('home'); } },
            { icon: 'controlPanel', label: t('desktop.controlPanel'), action: function () { if (global.Win11ControlPanel) global.Win11ControlPanel.open(); } },
            { icon: 'fileExplorer', label: t('taskbar.fileExplorer'), action: function () { if (global.Win11Explorer) global.Win11Explorer.open(); } },
            { icon: 'edge', label: t('taskbar.edge'), action: function () { if (global.Win11Edge) global.Win11Edge.open(); } },
            { icon: 'navPersonalization', label: t('settings.nav.personalization'), action: function () { global.Win11Registry.open('personalization.background'); } },
            { icon: 'navApps', label: t('settings.nav.apps'), action: function () { global.Win11Registry.open('apps.installed'); } },
            { icon: 'navAccounts', label: t('settings.nav.accounts'), action: function () { global.Win11Registry.open('accounts.users'); } },
            { icon: 'navTime', label: t('settings.nav.timeLanguage'), action: function () { global.Win11Registry.open('time.language'); } },
            { icon: 'navNetwork', label: t('settings.nav.network'), action: function () { global.Win11Registry.open('network.status'); } },
            { icon: 'mouse', label: t('settings.devices.mouseTitle'), action: function () { global.Win11Registry.open('devices.mouse'); } },
            { icon: 'graduation', label: t('pedagogy.freeModeBtn'), action: function () { if (global.Win11HUD) global.Win11HUD.open(); } },
            { icon: 'info', label: t('settings.system.aboutTitle'), action: function () { global.Win11Registry.open('system.about'); } }
        );

        return items;
    }

    function render() {
        var el = getEl();
        if (!el) return;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var pinned = getPinnedItems();
        var hasLab = st && st.installedPrograms && st.installedPrograms.some(function (p) { return p.id === 'labtools_app'; });
        var feats = st.optionalFeatures || [];

        var html =
            '<div class="start-body">' +
                '<div class="start-search-trigger">' +
                    global.Win11Icons.get('search', 16) +
                    '<input type="text" id="start-search-input" placeholder="' + global.Win11Compat.escapeHtml(t('start.searchBox')) + '">' +
                '</div>';

        if (!showAllApps) {
            html +=
                '<div class="start-section-header">' +
                    '<span class="start-section-title">' + bidi(t('start.pinned')) + '</span>' +
                    '<button type="button" class="start-pill-btn" id="start-all-toggle">' +
                        '<span>' + bidi(t('start.allApps')) + '</span>' +
                        '<span class="win-dir-arrow">' + global.Win11Icons.get('chevronRight', 12) + '</span>' +
                    '</button>' +
                '</div>' +
                '<div class="start-apps-grid">';

            for (var i = 0; i < pinned.length; i++) {
                html +=
                    '<button type="button" class="start-app-tile" data-pin-idx="' + i + '">' +
                        global.Win11Icons.get(pinned[i].icon, 28) +
                        '<span class="start-app-name">' + bidi(pinned[i].label) + '</span>' +
                    '</button>';
            }
            html += '</div>';

            if (st.startShowRecommended) {
                html +=
                    '<div class="start-section-header">' +
                        '<span class="start-section-title">' + bidi(t('start.recommended')) + '</span>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';

                if (hasLab) {
                    html +=
                        '<button type="button" class="start-all-row" data-launch-prog="labtools_app" style="background:rgba(0,120,212,0.08);border:1px solid rgba(0,120,212,0.25)">' +
                            global.Win11Icons.get('labtools', 22) +
                            '<div class="search-result-meta">' +
                                '<span class="search-result-title" style="color:var(--win-accent);font-weight:700">LabTools 1AS</span>' +
                                '<span class="search-result-path">' + bidi('مضاف حديثاً — انقر للفتح والتجربة') + '</span>' +
                            '</div>' +
                        '</button>';
                }

                for (var rft = 0; rft < feats.length; rft++) {
                    if (feats[rft].installed) {
                        html +=
                            '<button type="button" class="start-all-row start-feat-row" data-feat-id="' + global.Win11Compat.escapeHtml(feats[rft].id) + '" style="background:rgba(0,120,212,0.08);border:1px solid rgba(0,120,212,0.25)">' +
                                global.Win11Icons.get(feats[rft].icon || 'paint', 22) +
                                '<div class="search-result-meta">' +
                                    '<span class="search-result-title" style="color:var(--win-accent);font-weight:700">' + bidi(feats[rft].nameAr || feats[rft].name) + '</span>' +
                                    '<span class="search-result-path">' + bidi('ميزة مفعلة حديثاً — انقر للفتح') + '</span>' +
                                '</div>' +
                            '</button>';
                    }
                }

                html +=
                        '<button type="button" class="start-all-row" data-rec-target="apps.installed">' +
                            global.Win11Icons.get('navApps', 20) +
                            '<div class="search-result-meta"><span class="search-result-title">' + bidi(t('settings.apps.installedTitle')) + '</span><span class="search-result-path">' + bidi(t('start.recommendedSub')) + '</span></div>' +
                        '</button>' +
                        '<button type="button" class="start-all-row" data-rec-target="accounts.users">' +
                            global.Win11Icons.get('navAccounts', 20) +
                            '<div class="search-result-meta"><span class="search-result-title">' + bidi(t('settings.nav.accounts')) + '</span><span class="search-result-path">' + bidi(t('start.recommendedSub')) + '</span></div>' +
                        '</button>' +
                    '</div>';
            }
        } else {
            html +=
                '<div class="start-section-header">' +
                    '<span class="start-section-title">' + bidi(t('start.allApps')) + '</span>' +
                    '<button type="button" class="start-pill-btn" id="start-all-toggle">' +
                        '<span class="win-dir-arrow">' + global.Win11Icons.get('chevronLeft', 12) + '</span>' +
                        '<span>' + bidi(t('start.backToPinned')) + '</span>' +
                    '</button>' +
                '</div>' +
                '<div class="start-all-list">';

            for (var j = 0; j < pinned.length; j++) {
                html +=
                    '<button type="button" class="start-all-row" data-pin-idx="' + j + '">' +
                        global.Win11Icons.get(pinned[j].icon, 20) +
                        '<span class="search-result-title">' + bidi(pinned[j].label) + '</span>' +
                    '</button>';
            }

            // Include simulated installed desktop programs in All Apps
            for (var p = 0; p < st.installedPrograms.length; p++) {
                var prog = st.installedPrograms[p];
                var letter = prog.name ? prog.name.charAt(0).toUpperCase() : 'P';
                var progIcon = prog.fromSetupExe
                    ? global.Win11Icons.get('labtools', 20)
                    : '<span class="avatar-badge" style="width:22px;height:22px;border-radius:4px;font-size:11px;background:' + global.Win11Compat.escapeHtml(prog.color) + '">' + letter + '</span>';
                var progTargetAttr = prog.id === 'labtools_app' ? ' data-launch-prog="labtools_app"' : ' data-rec-target="apps.installed"';
                html +=
                    '<button type="button" class="start-all-row"' + progTargetAttr + '>' +
                        progIcon +
                        '<span class="search-result-title">' + bidi(prog.name) + '</span>' +
                    '</button>';
            }
            var feats = st.optionalFeatures || [];
            for (var ft = 0; ft < feats.length; ft++) {
                if (feats[ft].installed) {
                    html +=
                        '<button type="button" class="start-all-row start-feat-row" data-feat-id="' + global.Win11Compat.escapeHtml(feats[ft].id) + '">' +
                            global.Win11Icons.get(feats[ft].icon || 'paint', 20) +
                            '<span class="search-result-title">' + bidi(feats[ft].nameAr || feats[ft].name) + '</span>' +
                        '</button>';
                }
            }
            html += '</div>';
        }
        html += '</div>';

        // Start Menu Footer (User Account + Power Button)
        var curAcc = global.Win11State.getCurrentAccount ? global.Win11State.getCurrentAccount() : null;
        var footerAvStyle = (curAcc && curAcc.avatarSrc) ? ' style="background:transparent;overflow:hidden"' : (' style="background:' + global.Win11Compat.escapeHtml((curAcc && curAcc.color) || 'var(--win-accent)') + ';overflow:hidden"');
        var footerAvInner = global.Win11State.getAvatarInnerHtml ? global.Win11State.getAvatarInnerHtml(curAcc) : global.Win11Compat.escapeHtml(st.currentUser ? st.currentUser.charAt(0).toUpperCase() : 'U');
        html +=
            '<div class="start-footer">' +
                '<button type="button" class="start-user-btn" id="start-user-btn" title="' + global.Win11Compat.escapeHtml(t('start.userTooltip')) + '">' +
                    '<span class="avatar-badge"' + footerAvStyle + '>' + footerAvInner + '</span>' +
                    '<span style="font-size:13px;font-weight:500"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.currentUser) + '</bdi></span>' +
                '</button>' +
                '<div style="display:flex;align-items:center;gap:6px">' +
                    '<button type="button" class="win-btn win-btn-subtle" id="start-about-btn" title="' + global.Win11Compat.escapeHtml('حول التطبيق') + '" style="min-height:34px;padding:4px 10px;gap:6px;font-size:12px">' +
                        global.Win11Icons.get('info', 16) +
                        '<span>' + bidi('حول التطبيق') + '</span>' +
                    '</button>' +
                    '<button type="button" class="taskbar-btn" id="start-power-btn" title="' + global.Win11Compat.escapeHtml(t('start.powerMenu')) + '" style="width:36px;height:36px">' +
                        global.Win11Icons.get('power', 18) +
                    '</button>' +
                '</div>' +
            '</div>';

        el.innerHTML = html;

        if (global.Win11State && typeof global.Win11State.markStartMenuFeaturesViewed === 'function') {
            global.Win11State.markStartMenuFeaturesViewed();
        }

        // Bind live Search hand-off
        var sInput = el.querySelector('#start-search-input');
        sInput.oninput = function () {
            if (this.value.trim().length > 0 && global.Win11Search) {
                var q = this.value;
                close();
                global.Win11Search.open(q);
            }
        };

        el.querySelector('#start-all-toggle').onclick = function () {
            showAllApps = !showAllApps;
            render();
        };

        var pinBtns = el.querySelectorAll('[data-pin-idx]');
        for (var a = 0; a < pinBtns.length; a++) {
            pinBtns[a].onclick = function () {
                var idx = Number(this.getAttribute('data-pin-idx'));
                close();
                if (pinned[idx]) pinned[idx].action();
            };
        }

        var recBtns = el.querySelectorAll('[data-rec-target]');
        for (var b = 0; b < recBtns.length; b++) {
            recBtns[b].onclick = function () {
                var id = this.getAttribute('data-rec-target');
                close();
                global.Win11Registry.open(id);
            };
        }

        var launchProgBtns = el.querySelectorAll('[data-launch-prog]');
        for (var lp = 0; lp < launchProgBtns.length; lp++) {
            launchProgBtns[lp].onclick = function () {
                var pid = this.getAttribute('data-launch-prog');
                close();
                if (pid === 'labtools_app' && global.Win11Dialogs && typeof global.Win11Dialogs.openLabToolsApp === 'function') {
                    global.Win11Dialogs.openLabToolsApp();
                } else {
                    global.Win11Registry.open('apps.installed');
                }
            };
        }

        var featBtns = el.querySelectorAll('.start-feat-row');
        for (var fb = 0; fb < featBtns.length; fb++) {
            featBtns[fb].onclick = function () {
                var fid = this.getAttribute('data-feat-id');
                close();
                if (global.Win11Dialogs && global.Win11Dialogs.openOptionalFeatureApp) {
                    global.Win11Dialogs.openOptionalFeatureApp(fid);
                }
            };
        }

        el.querySelector('#start-user-btn').onclick = function (e) {
            e.stopPropagation();
            var r = this.getBoundingClientRect();
            global.Win11ContextMenu.show(r.left, r.top - 155, [
                { icon: 'navAccounts', label: t('settings.nav.accounts'), onClick: function () { close(); global.Win11Registry.open('accounts.users'); } },
                { icon: 'user', label: t('start.signOut') || 'تسجيل الخروج', onClick: function () {
                    close();
                    if (global.Win11State && global.Win11State.get && global.Win11State.logAccountEvent) {
                        var curU = global.Win11State.get().currentUser;
                        var sc = global.Win11State.get().accountScenario;
                        if (sc && sc.pwStandardUser && sc.loggedInStdInitial && String(curU).toLowerCase() === String(sc.pwStandardUser).toLowerCase()) {
                            sc.signedOutStdAfterInitial = true;
                            sc.stepE = true;
                            global.Win11State.logAccountEvent('logout_standard', 'تسجيل الخروج من الحساب القياسي: ' + curU, curU, 'Standard');
                            if (global.console && typeof global.console.info === 'function') {
                                global.console.info('[Scenario6E] stepE=true via Start signOut user=' + curU);
                            }
                        }
                        if (typeof global.Win11State.isCurrentGuest === 'function' && global.Win11State.isCurrentGuest() &&
                            typeof global.Win11State.resetGuestAccount === 'function') {
                            global.Win11State.resetGuestAccount();
                        }
                    }
                    global.Win11LockScreen.open();
                } },
                { icon: 'lock', label: t('start.lockPc'), onClick: function () { close(); global.Win11LockScreen.open(); } },
                { icon: 'user', label: t('start.switchUser'), onClick: function () { close(); global.Win11LockScreen.open(); } }
            ]);
        };

        var startAboutBtn = el.querySelector('#start-about-btn');
        if (startAboutBtn) {
            startAboutBtn.onclick = function () {
                close();
                if (global.Win11Dialogs && typeof global.Win11Dialogs.showAbout === 'function') {
                    global.Win11Dialogs.showAbout();
                }
            };
        }

        el.querySelector('#start-power-btn').onclick = function (e) {
            e.stopPropagation();
            var r = this.getBoundingClientRect();
            global.Win11ContextMenu.show(r.left - 140, r.top - 130, [
                { icon: 'power', label: t('start.shutdown'), onClick: function () {
                    close();
                    if (global.Win11Report && typeof global.Win11Report.confirmShutdown === 'function') {
                        global.Win11Report.confirmShutdown();
                    } else if (global.Win11LockScreen) {
                        global.Win11LockScreen.open();
                    }
                } },
                {
                    icon: 'graduation',
                    label: t('start.newSimulation'),
                    onClick: function () {
                        close();
                        if (global.Win11Report && typeof global.Win11Report.confirmNewSimulation === 'function') {
                            global.Win11Report.confirmNewSimulation();
                        }
                    }
                },
                {
                    icon: 'refresh',
                    label: t('start.restart'),
                    onClick: function () {
                        close();
                        global.Win11Dialogs.showConfirm(t('start.restart'), t('app.yes') + ' / ' + t('app.no') + '?', function (ok) {
                            if (ok) global.Win11State.reset();
                        });
                    }
                }
            ]);
        };
    }

    function open() {
        if (global.Win11Shell) global.Win11Shell.closeAllFlyouts('start');
        render();
        var el = getEl();
        if (el) {
            el.classList.add('is-open');
        }
    }

    function toggle() {
        if (isOpen()) close();
        else open();
    }

    global.Win11StartMenu = {
        open: open,
        close: close,
        toggle: toggle,
        isOpen: isOpen,
        refresh: function () { if (isOpen()) render(); }
    };
})(window);

