/**
 * Windows 11 Settings Application Shell & Lazy Section Loader
 * Uses Win11Registry for multi-path deep-linking, maintains Back history,
 * and loads section modules on demand cleanly over file:// and http://.
 */
(function (global) {
    'use strict';

    var WIN_ID = 'win-settings';
    var SECTION_MODULES = {};
    var SECTION_FILES = {
        home: 'js/apps/settings/home.js',
        system: 'js/apps/settings/system.js',
        devices: 'js/apps/settings/devices.js',
        network: 'js/apps/settings/network.js',
        personalization: 'js/apps/settings/personalization.js',
        apps: 'js/apps/settings/apps.js',
        accounts: 'js/apps/settings/accounts.js',
        timeLanguage: 'js/apps/settings/time-language.js',
        gaming: 'js/apps/settings/gaming.js',
        accessibility: 'js/apps/settings/accessibility.js',
        privacy: 'js/apps/settings/privacy.js',
        update: 'js/apps/settings/windows-update.js'
    };

    var NAV_ORDER = [
        { id: 'home', icon: 'navHome', labelKey: 'settings.nav.home' },
        { id: 'system', icon: 'navSystem', labelKey: 'settings.nav.system' },
        { id: 'devices', icon: 'navBluetooth', labelKey: 'settings.nav.devices' },
        { id: 'network', icon: 'navNetwork', labelKey: 'settings.nav.network' },
        { id: 'personalization', icon: 'navPersonalization', labelKey: 'settings.nav.personalization' },
        { id: 'apps', icon: 'navApps', labelKey: 'settings.nav.apps' },
        { id: 'accounts', icon: 'navAccounts', labelKey: 'settings.nav.accounts' },
        { id: 'timeLanguage', icon: 'navTime', labelKey: 'settings.nav.timeLanguage' },
        { id: 'gaming', icon: 'navGaming', labelKey: 'settings.nav.gaming' },
        { id: 'accessibility', icon: 'navAccessibility', labelKey: 'settings.nav.accessibility' },
        { id: 'privacy', icon: 'navPrivacy', labelKey: 'settings.nav.privacy' },
        { id: 'update', icon: 'navUpdate', labelKey: 'settings.nav.update' }
    ];

    var fallbackUi = {
        currentRoute: { section: 'system', subpage: 'main', anchor: null },
        historyStack: []
    };
    var isRenderingMain = false;
    var isSyncingApps = false;
    var pendingAppsRefresh = false;

    function runAppsRefreshNow() {
        if (isSyncingApps) return;
        var hostBody = getHostBody();
        if (hostBody && global.Win11WM.getWindow(WIN_ID) && getUiState().currentRoute.section === 'apps') {
            var mainEl = hostBody.querySelector('.settings-main');
            isSyncingApps = true;
            try {
                if (mainEl && typeof mainEl.__syncAppsView === 'function') {
                    mainEl.__syncAppsView();
                } else if (mainEl && !isRenderingMain) {
                    renderMainContent(mainEl);
                }
            } catch (err) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Settings.syncAppsView]', err);
                }
            } finally {
                isSyncingApps = false;
            }
        }
    }

    function scheduleAppsRefresh() {
        if (!isRenderingMain && !isSyncingApps) {
            runAppsRefreshNow();
            return;
        }
        if (pendingAppsRefresh) return;
        pendingAppsRefresh = true;
        var run = function () {
            pendingAppsRefresh = false;
            runAppsRefreshNow();
        };
        if (typeof global.requestAnimationFrame === 'function') {
            global.requestAnimationFrame(run);
        } else {
            setTimeout(run, 16);
        }
    }

    function getUiState() {
        var sess = global.Win11Sessions ? global.Win11Sessions.getActiveSession() : null;
        if (sess && sess.appUi) {
            if (!sess.appUi.settings) {
                sess.appUi.settings = {
                    currentRoute: { section: 'system', subpage: 'main', anchor: null },
                    historyStack: []
                };
            }
            return sess.appUi.settings;
        }
        return fallbackUi;
    }

    function getHostBody() {
        var win = global.Win11WM.getWindow(WIN_ID);
        return win ? win.bodyEl : null;
    }

    function registerSection(sectionId, handlerFn) {
        SECTION_MODULES[sectionId] = handlerFn;
    }

    function openTo(section, subpage, anchor, pushHistory) {
        var ui = getUiState();
        var next = { section: section || 'home', subpage: subpage || 'main', anchor: anchor || null };
        if (pushHistory !== false && ui.currentRoute &&
            (ui.currentRoute.section !== next.section || ui.currentRoute.subpage !== next.subpage)) {
            ui.historyStack.push({ section: ui.currentRoute.section, subpage: ui.currentRoute.subpage });
            if (ui.historyStack.length > 25) ui.historyStack.shift();
        }
        ui.currentRoute = next;
        if (global.Win11Assessment && typeof global.Win11Assessment.enterSection === 'function') {
            global.Win11Assessment.enterSection(next.section);
        }

        var win = global.Win11WM.getWindow(WIN_ID);
        if (!win) {
            var area = (global.Win11WM && typeof global.Win11WM.getWorkArea === 'function')
                ? global.Win11WM.getWorkArea()
                : { width: 980, height: 660 };
            var defW = Math.min(980, Math.max(460, (area.width || 980) - 32));
            var defH = Math.min(660, Math.max(340, (area.height || 660) - 32));
            global.Win11WM.open({
                id: WIN_ID,
                appId: 'settings',
                title: global.Win11I18N.t('settings.windowTitle'),
                icon: 'settings',
                hasBack: true,
                width: defW,
                height: defH,
                minWidth: 420,
                minHeight: 320,
                onBack: goBack,
                onClose: function () {
                    var hb = getHostBody();
                    var m = hb ? hb.querySelector('.settings-main') : null;
                    if (m && typeof m.__onUnmount === 'function') {
                        try { m.__onUnmount(); } catch (e) { }
                    }
                },
                render: function () {
                    renderShellAndRoute();
                }
            });
        } else {
            global.Win11WM.focus(WIN_ID);
            renderShellAndRoute();
        }
        global.Win11WM.setBackEnabled(WIN_ID, ui.historyStack.length > 0);
    }

    function goBack() {
        var ui = getUiState();
        if (ui.historyStack.length === 0) return;
        var prev = ui.historyStack.pop();
        openTo(prev.section, prev.subpage, null, false);
    }

    function renderSidebar(sidebarEl) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var acc = global.Win11State.getCurrentAccount();
        var roleLabel = (acc && acc.type === 'Administrateur')
            ? t('settings.accounts.adminRole')
            : ((acc && acc.type === 'Invité') ? t('settings.accounts.guestRole') : t('settings.accounts.standardRole'));
        var initial = st.currentUser ? st.currentUser.charAt(0).toUpperCase() : 'U';

        var avatarStyle = (acc && acc.avatarSrc) ? ' style="background:transparent"' : (' style="background:' + global.Win11Compat.escapeHtml((acc && acc.color) || 'var(--win-accent)') + '"');
        var avatarInner = global.Win11State.getAvatarInnerHtml ? global.Win11State.getAvatarInnerHtml(acc) : global.Win11Compat.escapeHtml(initial);

        var html =
            '<button type="button" class="settings-user-card" id="set-user-profile">' +
                '<div class="settings-user-avatar"' + avatarStyle + '>' + avatarInner + '</div>' +
                '<div class="settings-user-meta">' +
                    '<div class="settings-user-name"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.currentUser) + '</bdi></div>' +
                    '<div class="settings-user-sub">' + bidi(roleLabel) + '</div>' +
                '</div>' +
            '</button>' +
            '<div class="settings-search-box">' +
                '<input type="text" class="win-input" id="set-search-input" placeholder="' + global.Win11Compat.escapeHtml(t('settings.searchPlaceholder')) + '">' +
                '<span class="settings-search-icon">' + global.Win11Icons.get('search', 15) + '</span>' +
                '<div class="settings-search-dropdown" id="set-search-drop"></div>' +
            '</div>' +
            '<div class="settings-nav-list">';

        var ui = getUiState();
        for (var i = 0; i < NAV_ORDER.length; i++) {
            var nav = NAV_ORDER[i];
            var active = (ui.currentRoute.section === nav.id);
            html +=
                '<button type="button" class="settings-nav-item' + (active ? ' is-active' : '') + '" data-set-nav="' + nav.id + '">' +
                    global.Win11Icons.get(nav.icon, 18) +
                    '<span>' + bidi(t(nav.labelKey)) + '</span>' +
                '</button>';
        }
        html += '</div>';
        sidebarEl.innerHTML = html;

        var userProfBtn = sidebarEl.querySelector('#set-user-profile');
        if (userProfBtn) {
            userProfBtn.onclick = function () {
                openTo('accounts', 'main');
            };
        }

        var navBtns = sidebarEl.querySelectorAll('[data-set-nav]');
        for (var j = 0; j < navBtns.length; j++) {
            navBtns[j].onclick = function () {
                openTo(this.getAttribute('data-set-nav'), 'main');
            };
        }

        // Settings live search
        var sInput = sidebarEl.querySelector('#set-search-input');
        var sDrop = sidebarEl.querySelector('#set-search-drop');
        if (sInput && sDrop) {
            sInput.oninput = function () {
                var q = this.value.trim();
                if (!q) {
                    sDrop.classList.remove('is-open');
                    sDrop.innerHTML = '';
                    return;
                }
                var matches = global.Win11Registry.search(q).slice(0, 8);
                if (matches.length === 0) {
                    sDrop.innerHTML = '<div style="padding:10px;font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t('search.noResults')) + '</div>';
                } else {
                    var dh = '';
                    for (var m = 0; m < matches.length; m++) {
                        dh +=
                            '<button type="button" class="search-result-row" data-drop-id="' + matches[m].entry.id + '">' +
                                global.Win11Icons.get(matches[m].entry.icon || 'settings', 16) +
                                '<div class="search-result-meta">' +
                                    '<span class="search-result-title">' + bidi(matches[m].title) + '</span>' +
                                    '<span class="search-result-path">' + bidi(matches[m].breadcrumb) + '</span>' +
                                '</div>' +
                            '</button>';
                    }
                    sDrop.innerHTML = dh;
                    var dBtns = sDrop.querySelectorAll('[data-drop-id]');
                    for (var x = 0; x < dBtns.length; x++) {
                        dBtns[x].onclick = function () {
                            sDrop.classList.remove('is-open');
                            sInput.value = '';
                            global.Win11Registry.open(this.getAttribute('data-drop-id'));
                        };
                    }
                }
                sDrop.classList.add('is-open');
            };
        }
    }

    function renderMainContent(mainEl) {
        var bidi = global.Win11I18N.bidiHtml;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var ui = getUiState();
        var sectionId = ui.currentRoute.section;
        var renderer = SECTION_MODULES[sectionId];

        if (!renderer) {
            mainEl.innerHTML = '<div style="padding:24px;color:var(--win-text-secondary)">...</div>';
            var src = SECTION_FILES[sectionId];
            if (!src) return;
            global.Win11Compat.loadScript(src, function (err) {
                if (err || !SECTION_MODULES[sectionId]) {
                    mainEl.innerHTML = '<div class="win-card">' + bidi(t('search.noResults')) + '</div>';
                    return;
                }
                if (getUiState().currentRoute.section === sectionId) {
                    renderMainContent(mainEl);
                }
            });
            return;
        }

        if (typeof mainEl.__onUnmount === 'function') {
            try { mainEl.__onUnmount(); } catch (eUnm) { }
        }
        mainEl.__onUnmount = null;
        mainEl.__syncAppsView = null;
        mainEl.innerHTML = '';
        if (global.Win11Permissions && global.Win11Permissions.isGuest()) {
            var guestBar = document.createElement('div');
            guestBar.id = 'settings-guest-uac-banner';
            guestBar.className = 'win-card';
            guestBar.style.cssText = 'background:var(--win-warning-bg);color:var(--win-warning);padding:10px 14px;margin-bottom:12px;font-size:13px;font-weight:600';
            guestBar.innerHTML = bidi(t('uac.settingsGuestBanner'));
            mainEl.appendChild(guestBar);
        }
        isRenderingMain = true;
        try {
            renderer({
                container: mainEl,
                subpage: ui.currentRoute.subpage,
                navigate: function (sec, sub, anc) { openTo(sec, sub, anc); },
                ui: uiHelpers
            });
        } catch (err) {
            if (global.console && global.console.error) {
                global.console.error('[Settings.renderMainContent]', err);
            }
            mainEl.innerHTML = '<div class="win-card" style="padding:16px;color:var(--win-danger)">' +
                '<div style="font-weight:700;margin-bottom:8px">' + bidi(t('search.noResults')) + '</div>' +
                '<div style="font-size:12px;color:var(--win-text-secondary)">' + global.Win11Compat.escapeHtml(err && err.message ? err.message : String(err)) + '</div>' +
            '</div>';
        } finally {
            isRenderingMain = false;
        }

        if (ui.currentRoute.anchor) {
            setTimeout(function () {
                var target = mainEl.querySelector('#' + ui.currentRoute.anchor);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.add('setting-highlight');
                    setTimeout(function () { target.classList.remove('setting-highlight'); }, 1800);
                }
            }, 60);
        }
    }

    function renderShellAndRoute() {
        var hostBody = getHostBody();
        if (!hostBody) return;
        var ui = getUiState();
        global.Win11WM.setTitle(WIN_ID, global.Win11I18N.t('settings.windowTitle'));
        global.Win11WM.setBackEnabled(WIN_ID, ui.historyStack.length > 0);

        var shell = hostBody.querySelector('.settings-shell');
        if (!shell) {
            hostBody.innerHTML =
                '<div class="settings-shell">' +
                    '<aside class="settings-sidebar"></aside>' +
                    '<main class="settings-main"></main>' +
                '</div>';
            shell = hostBody.querySelector('.settings-shell');
        }
        var sideEl = shell ? shell.querySelector('.settings-sidebar') : null;
        var mainEl = shell ? shell.querySelector('.settings-main') : null;
        if (sideEl) renderSidebar(sideEl);
        if (mainEl) renderMainContent(mainEl);
    }

    // Shared UI Builders for Settings Pages
    var uiHelpers = {
        breadcrumbs: function (parentLabel, parentAction, childLabel) {
            var bidi = global.Win11I18N.bidiHtml;
            var el = document.createElement('div');
            el.className = 'settings-breadcrumbs';
            if (childLabel) {
                el.innerHTML =
                    '<button type="button" class="breadcrumb-parent">' + bidi(parentLabel) + '</button>' +
                    '<span class="breadcrumb-sep win-dir-arrow">' + global.Win11Icons.get('chevronRight', 18) + '</span>' +
                    '<span>' + bidi(childLabel) + '</span>';
                el.querySelector('.breadcrumb-parent').onclick = parentAction;
            } else {
                el.innerHTML = '<span>' + bidi(parentLabel) + '</span>';
            }
            return el;
        },

        groupLabel: function (text) {
            var d = document.createElement('div');
            d.className = 'settings-group-label';
            d.innerHTML = global.Win11I18N.bidiHtml(text);
            return d;
        },

        rowLink: function (opts) {
            var bidi = global.Win11I18N.bidiHtml;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'setting-row is-clickable';
            if (opts.id) btn.id = opts.id;
            btn.innerHTML =
                (opts.icon ? '<span class="setting-row-icon">' + global.Win11Icons.get(opts.icon, 20) + '</span>' : '') +
                '<div class="setting-row-text">' +
                    '<div class="setting-row-title">' + bidi(opts.title) + '</div>' +
                    (opts.desc ? '<div class="setting-row-desc">' + bidi(opts.desc) + '</div>' : '') +
                '</div>' +
                '<div class="setting-row-action">' +
                    (opts.value ? '<span style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(opts.value) + '</span>' : '') +
                    '<span class="win-row-chevron">' + global.Win11Icons.get('chevronRight', 16) + '</span>' +
                '</div>';
            btn.onclick = opts.onClick;
            return btn;
        },

        rowToggle: function (opts) {
            var t = global.Win11I18N.t.bind(global.Win11I18N);
            var bidi = global.Win11I18N.bidiHtml;
            var row = document.createElement('div');
            row.className = 'setting-row';
            if (opts.id) row.id = opts.id;

            var checked = !!opts.checked;
            row.innerHTML =
                (opts.icon ? '<span class="setting-row-icon">' + global.Win11Icons.get(opts.icon, 20) + '</span>' : '') +
                '<div class="setting-row-text">' +
                    '<div class="setting-row-title">' + bidi(opts.title) + '</div>' +
                    (opts.desc ? '<div class="setting-row-desc">' + bidi(opts.desc) + '</div>' : '') +
                '</div>' +
                '<div class="setting-row-action">' +
                    '<label class="win-switch-wrap">' +
                        '<span class="win-switch-state">' + bidi(checked ? t('app.on') : t('app.off')) + '</span>' +
                        '<span class="win-switch">' +
                            '<input type="checkbox"' + (checked ? ' checked' : '') + '>' +
                            '<span class="win-switch-track"><span class="win-switch-thumb"></span></span>' +
                        '</span>' +
                    '</label>' +
                '</div>';

            var input = row.querySelector('input[type="checkbox"]');
            var stateLabel = row.querySelector('.win-switch-state');
            var lastCommitted = checked;
            input.onchange = function () {
                var nextVal = !!this.checked;
                var applyToggle = function () {
                    lastCommitted = nextVal;
                    stateLabel.innerHTML = bidi(nextVal ? t('app.on') : t('app.off'));
                    if (typeof opts.onChange === 'function') opts.onChange(nextVal);
                };
                if (opts.permAction && global.Win11Permissions) {
                    global.Win11Permissions.guard(opts.permAction, applyToggle, {
                        targetLabel: opts.title,
                        onDenied: function () {
                            input.checked = lastCommitted;
                            stateLabel.innerHTML = bidi(lastCommitted ? t('app.on') : t('app.off'));
                        }
                    });
                } else {
                    applyToggle();
                }
            };
            return row;
        },

        rowSelect: function (opts) {
            var bidi = global.Win11I18N.bidiHtml;
            var row = document.createElement('div');
            row.className = 'setting-row';
            if (opts.id) row.id = opts.id;
            var optHtml = '';
            for (var i = 0; i < opts.options.length; i++) {
                var o = opts.options[i];
                var sel = (String(o.value) === String(opts.value)) ? ' selected' : '';
                optHtml += '<option value="' + global.Win11Compat.escapeHtml(o.value) + '"' + sel + '>' + global.Win11Compat.escapeHtml(o.label) + '</option>';
            }
            row.innerHTML =
                (opts.icon ? '<span class="setting-row-icon">' + global.Win11Icons.get(opts.icon, 20) + '</span>' : '') +
                '<div class="setting-row-text">' +
                    '<div class="setting-row-title">' + bidi(opts.title) + '</div>' +
                    (opts.desc ? '<div class="setting-row-desc">' + bidi(opts.desc) + '</div>' : '') +
                '</div>' +
                '<div class="setting-row-action" style="min-width:190px;max-width:260px">' +
                    '<select class="win-select">' + optHtml + '</select>' +
                '</div>';
            var selEl = row.querySelector('select');
            var lastSelected = String(opts.value);
            selEl.onchange = function () {
                var nextVal = this.value;
                var applySelect = function () {
                    lastSelected = nextVal;
                    if (typeof opts.onChange === 'function') opts.onChange(nextVal);
                };
                if (opts.permAction && global.Win11Permissions) {
                    global.Win11Permissions.guard(opts.permAction, applySelect, {
                        targetLabel: opts.title,
                        onDenied: function () { selEl.value = lastSelected; }
                    });
                } else {
                    applySelect();
                }
            };
            return row;
        },

        rowSlider: function (opts) {
            var bidi = global.Win11I18N.bidiHtml;
            var row = document.createElement('div');
            row.className = 'setting-row';
            if (opts.id) row.id = opts.id;
            row.innerHTML =
                (opts.icon ? '<span class="setting-row-icon">' + global.Win11Icons.get(opts.icon, 20) + '</span>' : '') +
                '<div class="setting-row-text">' +
                    '<div class="setting-row-title">' + bidi(opts.title) + '</div>' +
                    (opts.desc ? '<div class="setting-row-desc">' + bidi(opts.desc) + '</div>' : '') +
                '</div>' +
                '<div class="setting-row-action" style="width:210px">' +
                    '<input type="range" class="win-slider" min="' + opts.min + '" max="' + opts.max + '" step="' + (opts.step || 1) + '" value="' + opts.value + '">' +
                    '<span style="font-size:12.5px;min-width:44px;text-align:end" class="slider-val"><bdi dir="ltr">' + opts.value + (opts.unit || '') + '</bdi></span>' +
                '</div>';
            var inp = row.querySelector('input[type="range"]');
            var valEl = row.querySelector('.slider-val');
            var lastVal = opts.value;
            inp.oninput = function () {
                if (opts.permAction && global.Win11Permissions && !global.Win11Permissions.can(opts.permAction)) {
                    inp.value = lastVal;
                    valEl.innerHTML = '<bdi dir="ltr">' + lastVal + (opts.unit || '') + '</bdi>';
                    return;
                }
                valEl.innerHTML = '<bdi dir="ltr">' + this.value + (opts.unit || '') + '</bdi>';
                if (typeof opts.onChange === 'function') opts.onChange(Number(this.value));
            };
            inp.onchange = function () {
                var targetV = Number(this.value);
                if (opts.permAction && global.Win11Permissions) {
                    global.Win11Permissions.guard(opts.permAction, function () {
                        lastVal = targetV;
                        valEl.innerHTML = '<bdi dir="ltr">' + lastVal + (opts.unit || '') + '</bdi>';
                        if (typeof opts.onChange === 'function') opts.onChange(lastVal);
                    }, {
                        targetLabel: opts.title,
                        onDenied: function () {
                            inp.value = lastVal;
                            valEl.innerHTML = '<bdi dir="ltr">' + lastVal + (opts.unit || '') + '</bdi>';
                        }
                    });
                } else {
                    lastVal = targetV;
                }
            };
            return row;
        }
    };

    global.Win11I18N.onChange(function () {
        if (getHostBody() && global.Win11WM.getWindow(WIN_ID)) {
            renderShellAndRoute();
        }
    });

    if (global.Win11State && typeof global.Win11State.on === 'function') {
        global.Win11State.on('users:changed', function () {
            if (getHostBody() && global.Win11WM.getWindow(WIN_ID)) {
                renderShellAndRoute();
            }
        });
        var onAppsOrFeatures = function () {
            if (isRenderingMain) {
                scheduleAppsRefresh();
                return;
            }
            var hostBody = getHostBody();
            if (hostBody && global.Win11WM.getWindow(WIN_ID) && getUiState().currentRoute.section === 'apps') {
                scheduleAppsRefresh();
            }
        };
        global.Win11State.on('apps:changed', onAppsOrFeatures);
        global.Win11State.on('features:changed', onAppsOrFeatures);
    }

    global.Win11SettingsApp = {
        register: registerSection,
        openTo: openTo,
        goBack: goBack,
        refresh: function () {
            var hostBody = getHostBody();
            if (hostBody && global.Win11WM.getWindow(WIN_ID)) {
                renderMainContent(hostBody.querySelector('.settings-main'));
            }
        }
    };
})(window);

