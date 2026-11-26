/* Settings Section: Apps, Installed Apps, Default Apps, Startup & Optional Features */
(function (global) {
    'use strict';

    function bidi(str) {
        return global.Win11I18N.bidiHtml(str);
    }

    function getFeatureLabel(f) {
        var lang = global.Win11I18N.getLang();
        if (lang === 'fr') return f.nameFr || f.name || f.id;
        if (lang === 'en') return f.nameEn || f.name || f.id;
        return f.nameAr || f.name || f.id;
    }

    function showOpError(err) {
        if (global.console && typeof global.console.error === 'function') {
            global.console.error('[Settings.Apps]', err);
        }
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var msg = (err && err.message) ? err.message : String(err || 'Operation failed');
        if (global.Win11Dialogs && typeof global.Win11Dialogs.showMessage === 'function') {
            global.Win11Dialogs.showMessage(t('settings.apps.opErrorTitle'), msg, 'error');
        }
    }

    function launchUninstallWizard(prog) {
        if (!prog || !prog.id) return;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var esc = global.Win11Compat.escapeHtml;
        var pct = 0;
        var intervalId = null;
        var closed = false;

        try {
            global.Win11Dialogs.showCustom({
                title: t('settings.apps.confirmUninstallTitle') + ' — ' + prog.name,
                tone: 'warning',
                onClose: function () {
                    closed = true;
                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                },
                renderBody: function (wrap, dialog, closeThis) {
                    wrap.innerHTML =
                        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
                            '<div class="apps-win11-icon" style="width:40px;height:40px;font-size:15px;background:' + esc(prog.color || '#0067C0') + '">' + esc((prog.name || 'A').charAt(0).toUpperCase()) + '</div>' +
                            '<div>' +
                                '<div style="font-weight:600;font-size:14px">' + bidi(prog.name) + '</div>' +
                                '<div style="font-size:12px;color:var(--win-text-secondary)">' + bidi(prog.publisher || '') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div id="uninst-msg" style="font-size:12.5px;margin-bottom:8px;color:var(--win-text-secondary)">' + bidi(t('settings.apps.uninstallProgress')) + '</div>' +
                        '<div class="win-progress"><div class="win-progress-fill" id="uninst-bar" style="width:8%"></div></div>' +
                        '<div id="uninst-done" style="display:none;margin-top:12px;padding:10px;border-radius:6px;background:var(--win-success-bg);color:var(--win-success);font-size:12.5px;font-weight:600">' +
                            bidi(t('settings.apps.uninstallDone')) +
                        '</div>';

                    var bar = wrap.querySelector('#uninst-bar');
                    var msg = wrap.querySelector('#uninst-msg');
                    var done = wrap.querySelector('#uninst-done');

                    intervalId = setInterval(function () {
                        if (closed || !bar || !document.body.contains(bar)) {
                            clearInterval(intervalId);
                            intervalId = null;
                            return;
                        }
                        pct += 25;
                        if (pct >= 100) pct = 100;
                        bar.style.width = pct + '%';

                        if (pct >= 100) {
                            clearInterval(intervalId);
                            intervalId = null;
                            try {
                                var ok = global.Win11State.uninstallProgram(prog.id);
                                if (!ok) {
                                    throw new Error('Unable to remove ' + prog.name);
                                }
                                if (msg) msg.style.display = 'none';
                                if (done) done.style.display = 'block';
                                var okBtn = dialog.querySelector('#uninst-ok-btn');
                                if (okBtn) okBtn.disabled = false;
                            } catch (err) {
                                closeThis(false);
                                showOpError(err);
                            }
                        }
                    }, 90);

                    setTimeout(function () {
                        var okBtn = dialog.querySelector('#uninst-ok-btn');
                        if (okBtn && pct < 100) okBtn.disabled = true;
                    }, 0);
                },
                buttons: [
                    { id: 'uninst-ok-btn', label: t('app.ok'), primary: true, value: true }
                ]
            });
        } catch (err) {
            if (intervalId) clearInterval(intervalId);
            showOpError(err);
        }
    }

    function renderOptionalFeaturesView(ctx) {
        var c = ctx.container;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var esc = global.Win11Compat.escapeHtml;
        var unmounted = false;
        var pendingTimers = {};
        var searchFilter = '';

        c.appendChild(ctx.ui.breadcrumbs(
            t('settings.nav.apps'),
            function () { ctx.navigate('apps', 'main'); },
            t('settings.apps.optionalTitle')
        ));
        c.appendChild(ctx.ui.groupLabel(t('settings.apps.optionalDesc')));

        var card = document.createElement('div');
        card.className = 'win-card';
        card.id = 'ctrl-apps-optional';
        card.innerHTML =
            '<div class="apps-search-toolbar">' +
                '<div class="apps-search-box">' +
                    '<input type="text" class="win-input" id="opt-feat-search" placeholder="' + esc(t('settings.apps.filterPlaceholder')) + '" style="width:100%">' +
                '</div>' +
            '</div>' +
            '<div class="apps-win11-list" id="opt-features-list"></div>';
        c.appendChild(card);

        var listEl = card.querySelector('#opt-features-list');
        var searchInput = card.querySelector('#opt-feat-search');
        var rowNodes = {};

        function createFeatureRow(f) {
            var row = document.createElement('div');
            row.className = 'apps-win11-row setting-row';
            row.setAttribute('data-opt-row', f.id);
            row.innerHTML =
                '<div class="apps-win11-main">' +
                    '<input type="checkbox" class="opt-feat-check" id="opt-feat-check-' + esc(f.id) + '" data-opt-check="' + esc(f.id) + '" style="width:16px;height:16px;accent-color:var(--win-accent);flex-shrink:0">' +
                    '<div class="apps-win11-icon" style="background:' + esc(f.color || '#0067C0') + ';width:30px;height:30px">' + global.Win11Icons.get(f.icon || 'grid', 15) + '</div>' +
                    '<div class="apps-win11-meta">' +
                        '<div class="apps-win11-title">' + bidi(getFeatureLabel(f)) + '</div>' +
                        '<div class="apps-win11-sub" data-opt-sub="' + esc(f.id) + '"></div>' +
                        '<div class="opt-feat-progress" id="opt-prog-' + esc(f.id) + '" style="display:none;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:var(--win-accent-text)">' +
                            '<span class="win-spinner" aria-hidden="true"></span>' +
                            '<span id="opt-prog-txt-' + esc(f.id) + '"></span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="apps-win11-actions">' +
                    '<span class="win-badge apps-feat-status" data-opt-status="' + esc(f.id) + '"></span>' +
                    '<button type="button" class="win-btn" data-opt-feat="' + esc(f.id) + '"></button>' +
                '</div>';
            return row;
        }

        function updateFeatureRowState(row, f) {
            var isBusy = !!pendingTimers[f.id];
            var chk = row.querySelector('[data-opt-check]');
            var subEl = row.querySelector('[data-opt-sub]');
            var statusEl = row.querySelector('[data-opt-status]');
            var btn = row.querySelector('[data-opt-feat]');
            if (chk) {
                chk.checked = !!f.installed;
                chk.disabled = isBusy;
            }
            if (subEl) {
                subEl.innerHTML = bidi(f.installed ? t('settings.apps.featureInstalled') : t('settings.apps.featureNotInstalled'));
            }
            if (statusEl) {
                statusEl.className = 'win-badge apps-feat-status ' + (f.installed ? 'win-badge-success' : 'win-badge-neutral');
                statusEl.innerHTML = bidi(f.installed ? t('settings.apps.installedStatus') : t('settings.apps.notInstalledStatus'));
            }
            if (btn) {
                btn.className = 'win-btn ' + (f.installed ? 'win-btn-secondary' : 'win-btn-primary');
                btn.disabled = isBusy;
                btn.innerHTML = bidi(f.installed ? t('settings.apps.uninstallFeatureBtn') : t('settings.apps.installFeatureBtn'));
            }
        }

        function syncOptionalRows() {
            if (unmounted) return;
            var feats = (global.Win11State.get().optionalFeatures || []);
            var q = String(searchFilter || '').trim().toLowerCase();
            var fragment = document.createDocumentFragment();
            var matched = 0;

            for (var i = 0; i < feats.length; i++) {
                var f = feats[i];
                var labelStr = getFeatureLabel(f).toLowerCase();
                if (q && labelStr.indexOf(q) === -1 && String(f.id).toLowerCase().indexOf(q) === -1 &&
                    String(f.name || '').toLowerCase().indexOf(q) === -1) {
                    continue;
                }
                matched += 1;
                var row = rowNodes[f.id];
                if (!row) {
                    row = createFeatureRow(f);
                    rowNodes[f.id] = row;
                }
                updateFeatureRowState(row, f);
                fragment.appendChild(row);
            }
            listEl.innerHTML = '';
            if (matched === 0) {
                listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--win-text-secondary);font-size:13px">' + bidi(t('settings.apps.noFeaturesMatch')) + '</div>';
            } else {
                listEl.appendChild(fragment);
            }
        }

        function findFeatureById(fid) {
            var feats = (global.Win11State.get().optionalFeatures || []);
            for (var i = 0; i < feats.length; i++) {
                if (feats[i].id === fid) return feats[i];
            }
            return null;
        }

        function toggleFeature(fid, nextState) {
            var f = findFeatureById(fid);
            if (!f || pendingTimers[fid]) return;

            var row = rowNodes[fid];
            var progBox = row ? row.querySelector('#opt-prog-' + fid) : null;
            var progTxt = row ? row.querySelector('#opt-prog-txt-' + fid) : null;
            var btn = row ? row.querySelector('[data-opt-feat="' + fid + '"]') : null;
            var chk = row ? row.querySelector('[data-opt-check="' + fid + '"]') : null;

            if (btn) btn.disabled = true;
            if (chk) chk.disabled = true;
            if (progBox) progBox.style.display = 'flex';
            if (progTxt) progTxt.innerHTML = bidi(nextState ? t('settings.apps.addingFeature') : t('settings.apps.removingFeature'));

            pendingTimers[fid] = setTimeout(function () {
                delete pendingTimers[fid];
                if (unmounted) return;
                if (progBox) progBox.style.display = 'none';
                try {
                    var ok = global.Win11State.setOptionalFeatureEnabled(fid, nextState);
                    if (!ok) {
                        throw new Error('Failed to update optional feature: ' + fid);
                    }
                    syncOptionalRows();
                } catch (err) {
                    if (btn) btn.disabled = false;
                    if (chk) chk.disabled = false;
                    showOpError(err);
                }
            }, 1000);
        }

        function requestToggle(fid, nextState) {
            global.Win11Permissions.guard('apps.uninstall', function () {
                try {
                    toggleFeature(fid, nextState);
                } catch (err) {
                    showOpError(err);
                }
            }, {
                targetLabel: t('settings.apps.optionalTitle'),
                onDenied: function () { syncOptionalRows(); }
            });
        }

        listEl.addEventListener('click', function (ev) {
            var btn = global.Win11Compat.closest(ev.target, '[data-opt-feat]');
            if (!btn) return;
            var fid = btn.getAttribute('data-opt-feat');
            var f = findFeatureById(fid);
            if (!f) return;
            requestToggle(fid, !f.installed);
        });

        listEl.addEventListener('change', function (ev) {
            var chk = global.Win11Compat.closest(ev.target, '[data-opt-check]');
            if (!chk) return;
            var fid = chk.getAttribute('data-opt-check');
            requestToggle(fid, !!chk.checked);
        });

        searchInput.addEventListener('input', function () {
            searchFilter = searchInput.value;
            syncOptionalRows();
        });

        c.__syncAppsView = syncOptionalRows;
        c.__onUnmount = function () {
            unmounted = true;
            var keys = Object.keys(pendingTimers);
            for (var k = 0; k < keys.length; k++) {
                clearTimeout(pendingTimers[keys[k]]);
            }
            pendingTimers = {};
        };

        syncOptionalRows();
    }

    function renderDefaultAppsView(ctx) {
        var c = ctx.container;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var st = global.Win11State.get();

        c.appendChild(ctx.ui.breadcrumbs(
            t('settings.nav.apps'),
            function () { ctx.navigate('apps', 'main'); },
            t('settings.apps.defaultsTitle')
        ));
        c.appendChild(ctx.ui.groupLabel(t('settings.apps.defaultsDesc')));

        var card = document.createElement('div');
        card.className = 'win-card';
        card.id = 'ctrl-apps-defaults';

        card.appendChild(ctx.ui.rowSelect({
            id: 'ctrl-default-browser',
            title: t('settings.apps.defaultBrowser'),
            value: st.defaultBrowser || 'Microsoft Edge',
            options: [
                { value: 'Microsoft Edge', label: 'Microsoft Edge' },
                { value: 'Google Chrome', label: 'Google Chrome' },
                { value: 'Mozilla Firefox', label: 'Mozilla Firefox' }
            ],
            onChange: function (val) {
                try {
                    global.Win11State.update({ defaultBrowser: val });
                } catch (err) {
                    showOpError(err);
                }
            }
        }));

        card.appendChild(ctx.ui.rowSelect({
            id: 'ctrl-default-pdf',
            title: t('settings.apps.defaultPdf'),
            value: st.defaultPdf || 'Microsoft Edge',
            options: [
                { value: 'Microsoft Edge', label: 'Microsoft Edge' },
                { value: 'Adobe Reader', label: 'Adobe Reader 9.3' }
            ],
            onChange: function (val) {
                try {
                    global.Win11State.update({ defaultPdf: val });
                } catch (err) {
                    showOpError(err);
                }
            }
        }));
        c.appendChild(card);
    }

    function renderStartupAppsView(ctx) {
        var c = ctx.container;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var st = global.Win11State.get();

        c.appendChild(ctx.ui.breadcrumbs(
            t('settings.nav.apps'),
            function () { ctx.navigate('apps', 'main'); },
            t('settings.apps.startupTitle')
        ));
        c.appendChild(ctx.ui.groupLabel(t('settings.apps.startupDesc')));

        var box = document.createElement('div');
        box.id = 'ctrl-apps-startup';
        var list = st.startupApps || [];
        for (var i = 0; i < list.length; i++) {
            (function (sa) {
                box.appendChild(ctx.ui.rowToggle({
                    id: 'startup-toggle-' + sa.id,
                    title: sa.name,
                    desc: sa.publisher || '',
                    checked: !!sa.enabled,
                    permAction: 'apps.uninstall',
                    onChange: function (val) {
                        try {
                            global.Win11State.update(function (d) {
                                for (var j = 0; j < d.startupApps.length; j++) {
                                    if (d.startupApps[j].id === sa.id) {
                                        d.startupApps[j].enabled = !!val;
                                    }
                                }
                            });
                        } catch (err) {
                            showOpError(err);
                        }
                    }
                }));
            })(list[i]);
        }
        c.appendChild(box);
    }

    global.Win11SettingsApp.register('apps', function (ctx) {
        var sub = ctx.subpage || 'main';
        if (sub === 'optional') {
            renderOptionalFeaturesView(ctx);
            return;
        }
        if (sub === 'defaults') {
            renderDefaultAppsView(ctx);
            return;
        }
        if (sub === 'startup') {
            renderStartupAppsView(ctx);
            return;
        }

        var c = ctx.container;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var esc = global.Win11Compat.escapeHtml;
        var unmounted = false;
        var verifyTimer = null;
        var PAGE_SIZE = 12;
        var visibleCount = PAGE_SIZE;
        var searchQuery = '';

        c.appendChild(ctx.ui.breadcrumbs(t('settings.nav.apps')));
        c.appendChild(ctx.ui.groupLabel(t('settings.apps.installedTitle')));

        // Lightweight navigation link to Optional Features
        var optLinkCard = document.createElement('div');
        optLinkCard.className = 'win-card';
        optLinkCard.id = 'apps-opt-link-card';
        optLinkCard.innerHTML =
            '<div class="apps-win11-row" style="border:none;padding:2px 4px;background:transparent">' +
                '<div class="apps-win11-main">' +
                    '<div class="apps-win11-icon" style="background:var(--win-accent);width:32px;height:32px">' + global.Win11Icons.get('paint', 16) + '</div>' +
                    '<div class="apps-win11-meta">' +
                        '<div class="apps-win11-title">' + bidi(t('settings.apps.optionalTitle')) + '</div>' +
                        '<div class="apps-win11-sub">' + bidi(t('settings.apps.optionalDesc')) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="apps-win11-actions">' +
                    '<button type="button" class="win-btn win-btn-secondary" id="apps-open-optional-btn">' + bidi(t('app.open')) + '</button>' +
                '</div>' +
            '</div>';
        optLinkCard.querySelector('#apps-open-optional-btn').addEventListener('click', function () {
            ctx.navigate('apps', 'optional');
        });
        c.appendChild(optLinkCard);

        // Main Windows 11 Installed Apps Card
        var appsCard = document.createElement('div');
        appsCard.className = 'win-card';
        appsCard.innerHTML =
            '<div class="apps-search-toolbar">' +
                '<div class="apps-search-box">' +
                    '<input type="text" class="win-input" id="apps-filter-input" placeholder="' + esc(t('settings.apps.searchPlaceholder')) + '" style="width:100%">' +
                '</div>' +
                '<span class="win-badge win-badge-neutral" id="apps-count-badge"></span>' +
            '</div>' +
            '<div class="apps-win11-list" id="ctrl-apps-list"></div>' +
            '<div id="apps-pagination" style="display:flex;justify-content:center;align-items:center;gap:10px;margin-top:12px"></div>';
        c.appendChild(appsCard);

        var listEl = appsCard.querySelector('#ctrl-apps-list');
        var pagEl = appsCard.querySelector('#apps-pagination');
        var countBadge = appsCard.querySelector('#apps-count-badge');
        var filterInput = appsCard.querySelector('#apps-filter-input');
        var rowCache = {};

        function createProgramRow(p) {
            var row = document.createElement('div');
            row.className = 'apps-win11-row setting-row';
            row.setAttribute('data-prog-row', p.id);
            row.innerHTML =
                '<div class="apps-win11-main">' +
                    '<div class="apps-win11-icon" style="background:' + esc(p.color || '#0067C0') + '">' + esc((p.name || 'A').charAt(0).toUpperCase()) + '</div>' +
                    '<div class="apps-win11-meta">' +
                        '<div class="apps-win11-title">' + bidi(p.name) + '</div>' +
                        '<div class="apps-win11-sub"><bdi dir="ltr">' + esc(p.publisher || '') + '</bdi> &bull; <bdi dir="ltr">' + esc(p.date || '') + '</bdi></div>' +
                    '</div>' +
                '</div>' +
                '<div class="apps-win11-actions">' +
                    '<span class="apps-win11-size"><bdi dir="ltr">' + esc(p.size || '') + '</bdi></span>' +
                    '<button type="button" class="win-btn win-btn-secondary" data-prog-uninstall="' + esc(p.id) + '">' + bidi(t('settings.apps.removeBtn')) + '</button>' +
                '</div>';
            return row;
        }

        function syncAppsRows() {
            if (unmounted) return;
            var allProgs = (global.Win11State.get().installedPrograms || []);
            var q = String(searchQuery || '').trim().toLowerCase();
            var filtered = q ? allProgs.filter(function (p) {
                return String(p.name || '').toLowerCase().indexOf(q) !== -1 ||
                    String(p.publisher || '').toLowerCase().indexOf(q) !== -1;
            }) : allProgs;

            if (countBadge) {
                countBadge.innerHTML = '<bdi dir="ltr">' + filtered.length + '</bdi>';
            }

            if (filtered.length === 0) {
                listEl.innerHTML = '<div style="padding:18px;text-align:center;color:var(--win-text-secondary);font-size:13px">' + bidi(t('search.noResults')) + '</div>';
                pagEl.innerHTML = '';
                return;
            }

            var slice = filtered.slice(0, visibleCount);
            var desiredIds = {};
            for (var si = 0; si < slice.length; si++) {
                desiredIds[slice[si].id] = true;
            }

            // Keyed incremental reconciliation: remove only non-visible rows, insert/reorder changed rows
            var existingChildren = Array.prototype.slice.call(listEl.children);
            for (var ei = 0; ei < existingChildren.length; ei++) {
                var child = existingChildren[ei];
                var cid = child.getAttribute('data-prog-row');
                if (!cid || !desiredIds[cid]) {
                    listEl.removeChild(child);
                }
            }

            for (var idx = 0; idx < slice.length; idx++) {
                var prog = slice[idx];
                var row = rowCache[prog.id];
                if (!row) {
                    row = createProgramRow(prog);
                    rowCache[prog.id] = row;
                }
                var curAtIdx = listEl.children[idx] || null;
                if (curAtIdx !== row) {
                    listEl.insertBefore(row, curAtIdx);
                }
            }

            var cacheKeys = Object.keys(rowCache);
            var aliveSet = {};
            for (var ai = 0; ai < allProgs.length; ai++) aliveSet[allProgs[ai].id] = true;
            for (var ck = 0; ck < cacheKeys.length; ck++) {
                if (!aliveSet[cacheKeys[ck]]) {
                    delete rowCache[cacheKeys[ck]];
                }
            }

            var remaining = filtered.length - slice.length;
            if (remaining > 0) {
                pagEl.innerHTML =
                    '<button type="button" class="win-btn win-btn-secondary" id="apps-load-more-btn">' +
                        bidi(t('settings.apps.loadMoreBtn')) + ' (<bdi dir="ltr">' + remaining + '</bdi>)' +
                    '</button>';
            } else {
                pagEl.innerHTML = '';
            }

            // Section 3: Register Installed/Uninstalled verification immediately when app list updates on screen
            var sf = global.Win11State.get().setupFlow;
            if (sf && ((sf.installed && !sf.uninstalled && !sf.verifiedInstalled) || (sf.uninstalled && !sf.verifiedUninstalled))) {
                setTimeout(function () {
                    if (!unmounted && global.Win11State && typeof global.Win11State.markInstalledAppsViewed === 'function') {
                        global.Win11State.markInstalledAppsViewed();
                    }
                }, 0);
            }
        }

        // Single delegated event listener on list container
        listEl.addEventListener('click', function (ev) {
            var btn = global.Win11Compat.closest(ev.target, '[data-prog-uninstall]');
            if (!btn) return;
            var pid = btn.getAttribute('data-prog-uninstall');
            var progs = (global.Win11State.get().installedPrograms || []);
            var prog = null;
            for (var i = 0; i < progs.length; i++) {
                if (progs[i].id === pid) { prog = progs[i]; break; }
            }
            if (!prog) return;
            global.Win11Permissions.guard('apps.uninstall', function () {
                var confirmTitle = bidi('إلغاء تثبيت التطبيق');
                var confirmMsg = bidi('هل أنت متأكد من رغبتك في إلغاء تثبيت «' + prog.name + '»؟ سيتم إلغاء تثبيت هذا التطبيق وكافة بياناته وإعداداته المرتبطة.');
                if (global.Win11Dialogs && typeof global.Win11Dialogs.showCustom === 'function') {
                    global.Win11Dialogs.showCustom({
                        title: confirmTitle,
                        message: confirmMsg,
                        tone: 'warning',
                        buttons: [
                            { label: bidi('إلغاء التثبيت'), primary: true, value: true },
                            { label: bidi('إلغاء الأمر'), primary: false, value: false }
                        ],
                        onClose: function (accepted) {
                            if (accepted === true) {
                                try {
                                    launchUninstallWizard(prog);
                                } catch (err) {
                                    showOpError(err);
                                }
                            }
                        }
                    });
                } else {
                    if (window.confirm('هل أنت متأكد من رغبتك في إلغاء تثبيت «' + prog.name + '»؟')) {
                        try {
                            launchUninstallWizard(prog);
                        } catch (err) {
                            showOpError(err);
                        }
                    }
                }
            }, { targetLabel: prog.name });
        });

        pagEl.addEventListener('click', function (ev) {
            var moreBtn = global.Win11Compat.closest(ev.target, '#apps-load-more-btn');
            if (!moreBtn) return;
            visibleCount += PAGE_SIZE;
            syncAppsRows();
        });

        filterInput.addEventListener('input', function () {
            searchQuery = filterInput.value;
            visibleCount = PAGE_SIZE;
            syncAppsRows();
        });

        c.__syncAppsView = syncAppsRows;
        c.__onUnmount = function () {
            unmounted = true;
            if (verifyTimer) {
                clearTimeout(verifyTimer);
                verifyTimer = null;
            }
        };

        syncAppsRows();
        if (typeof global.Win11State.markInstalledAppsViewed === 'function') {
            verifyTimer = setTimeout(function () {
                verifyTimer = null;
                if (!unmounted && global.Win11State) {
                    global.Win11State.markInstalledAppsViewed();
                }
            }, 0);
        }
    });
})(window);
