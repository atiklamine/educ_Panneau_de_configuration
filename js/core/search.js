/**
 * Windows 11 Search Flyout (Win+S / Alt+S / Taskbar Search Pill)
 * Live searches across Apps, Control Panel applets, and Settings Registry access paths.
 */
(function (global) {
    'use strict';

    var currentQuery = '';

    function getEl() {
        return document.getElementById('search-flyout');
    }

    function isOpen() {
        var el = getEl();
        return !!(el && el.classList.contains('is-open'));
    }

    function close() {
        var el = getEl();
        if (el) el.classList.remove('is-open');
    }

    function getAppsCatalog() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var list = [
            { id: 'app.settings', icon: 'settings', label: t('desktop.settings'), keywords: 'settings paramètres إعدادات لوحة', action: function () { global.Win11Registry.open('home'); } },
            { id: 'app.controlPanel', icon: 'controlPanel', label: t('desktop.controlPanel'), keywords: 'control panel panneau configuration لوحة التحكم', action: function () { if (global.Win11ControlPanel) global.Win11ControlPanel.open(); } },
            { id: 'app.explorer', icon: 'fileExplorer', label: t('taskbar.fileExplorer'), keywords: 'file explorer ce pc files مستكشف الملفات هذا الكمبيوتر الصور', action: function () { if (global.Win11Explorer) global.Win11Explorer.open(); } },
            { id: 'app.edge', icon: 'edge', label: t('taskbar.edge'), keywords: 'edge browser web متصفح دليل', action: function () { if (global.Win11Edge) global.Win11Edge.open(); } },
            { id: 'app.taskView', icon: 'taskView', label: t('taskbar.taskView'), keywords: 'task view virtual desktop عرض المهام نوافذ', action: function () { if (global.Win11TaskView) global.Win11TaskView.open(); } }
        ];
        var st = global.Win11State.get();
        var progs = st.installedPrograms || [];
        for (var i = 0; i < progs.length; i++) {
            (function (progItem) {
                list.push({
                    id: 'prog.' + progItem.id,
                    icon: progItem.fromSetupExe ? 'labtools' : 'navApps',
                    label: progItem.name,
                    keywords: progItem.name + ' ' + progItem.publisher + (progItem.fromSetupExe ? ' labtools setup' : ''),
                    action: function () {
                        if (progItem.id === 'labtools_app' && global.Win11Dialogs && typeof global.Win11Dialogs.openLabToolsApp === 'function') {
                            global.Win11Dialogs.openLabToolsApp();
                        } else {
                            global.Win11Registry.open('apps.installed');
                        }
                    }
                });
            })(progs[i]);
        }
        var feats = st.optionalFeatures || [];
        for (var f = 0; f < feats.length; f++) {
            if (feats[f].installed) {
                (function (feat) {
                    list.push({
                        id: 'feat.' + feat.id,
                        icon: feat.icon || 'paint',
                        label: feat.nameAr || feat.name,
                        keywords: (feat.name || '') + ' ' + (feat.nameAr || '') + ' ' + (feat.nameEn || '') + ' ' + (feat.nameFr || '') + ' paint notepad games الرسام المفكرة ألعاب',
                        action: function () {
                            if (global.Win11Dialogs && global.Win11Dialogs.openOptionalFeatureApp) {
                                global.Win11Dialogs.openOptionalFeatureApp(feat.id);
                            }
                        }
                    });
                })(feats[f]);
            }
        }
        return list;
    }

    function renderResults(container, query) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var q = String(query || '').trim().toLowerCase();

        var apps = getAppsCatalog();
        var matchedApps = [];
        for (var i = 0; i < apps.length; i++) {
            var a = apps[i];
            if (!q || a.label.toLowerCase().indexOf(q) !== -1 || a.keywords.toLowerCase().indexOf(q) !== -1) {
                matchedApps.push(a);
            }
        }

        var settingMatches = global.Win11Registry.search(q).slice(0, 10);

        var html = '<div class="search-columns">';

        // Left column: Apps & Quick Suggestions
        html += '<div class="search-col">' +
            '<div style="font-size:12px;font-weight:600;color:var(--win-text-secondary);margin-bottom:8px">' +
                bidi(q ? t('search.topApps') : t('search.quickSuggestions')) +
            '</div>';
        for (var j = 0; j < matchedApps.length; j++) {
            var ap = matchedApps[j];
            html +=
                '<button type="button" class="search-result-row" data-app-idx="' + j + '">' +
                    global.Win11Icons.get(ap.icon, 24) +
                    '<div class="search-result-meta">' +
                        '<span class="search-result-title">' + bidi(ap.label) + '</span>' +
                    '</div>' +
                '</button>';
        }
        if (matchedApps.length === 0 && settingMatches.length === 0) {
            html += '<div style="font-size:13px;color:var(--win-text-secondary);padding:12px 4px">' + bidi(t('search.noResults')) + '</div>';
        }
        html += '</div>';

        // Right column: Settings matches
        html += '<div class="search-col">' +
            '<div style="font-size:12px;font-weight:600;color:var(--win-text-secondary);margin-bottom:8px">' +
                bidi(t('search.settingsMatches')) +
            '</div>';
        for (var k = 0; k < settingMatches.length; k++) {
            var m = settingMatches[k];
            html +=
                '<button type="button" class="search-result-row" data-setting-id="' + m.entry.id + '">' +
                    global.Win11Icons.get(m.entry.icon || 'settings', 20) +
                    '<div class="search-result-meta">' +
                        '<span class="search-result-title">' + bidi(m.title) + '</span>' +
                        '<span class="search-result-path">' + bidi(m.breadcrumb) + '</span>' +
                    '</div>' +
                '</button>';
        }
        html += '</div></div>';

        container.innerHTML = html;

        var appBtns = container.querySelectorAll('[data-app-idx]');
        for (var x = 0; x < appBtns.length; x++) {
            appBtns[x].onclick = function () {
                var idx = Number(this.getAttribute('data-app-idx'));
                close();
                if (matchedApps[idx]) matchedApps[idx].action();
            };
        }
        var setBtns = container.querySelectorAll('[data-setting-id]');
        for (var y = 0; y < setBtns.length; y++) {
            setBtns[y].onclick = function () {
                var id = this.getAttribute('data-setting-id');
                close();
                global.Win11Registry.open(id);
            };
        }
    }

    function render(initialQuery) {
        var el = getEl();
        if (!el) return;
        if (initialQuery !== undefined) currentQuery = initialQuery;

        var t = global.Win11I18N.t.bind(global.Win11I18N);
        el.innerHTML =
            '<div class="start-body">' +
                '<div class="start-search-trigger">' +
                    global.Win11Icons.get('search', 16) +
                    '<input type="text" id="win-search-input" value="' + global.Win11Compat.escapeHtml(currentQuery) + '" placeholder="' + global.Win11Compat.escapeHtml(t('search.placeholder')) + '">' +
                '</div>' +
                '<div id="win-search-results"></div>' +
            '</div>';

        var input = el.querySelector('#win-search-input');
        var resultsBox = el.querySelector('#win-search-results');
        renderResults(resultsBox, currentQuery);

        input.oninput = function () {
            currentQuery = this.value;
            renderResults(resultsBox, currentQuery);
        };
        input.onkeydown = function (e) {
            if (e.key === 'Enter') {
                var first = resultsBox.querySelector('.search-result-row');
                if (first) first.click();
            }
        };
    }

    function open(initialQuery) {
        if (global.Win11Shell) global.Win11Shell.closeAllFlyouts('search');
        render(initialQuery !== undefined ? initialQuery : '');
        var el = getEl();
        if (el) {
            el.classList.add('is-open');
            setTimeout(function () {
                var inp = el.querySelector('#win-search-input');
                if (inp) inp.focus();
            }, 40);
        }
    }

    function toggle() {
        if (isOpen()) close();
        else open('');
    }

    global.Win11Search = {
        open: open,
        close: close,
        toggle: toggle,
        isOpen: isOpen,
        refresh: function () { if (isOpen()) render(); }
    };
})(window);

