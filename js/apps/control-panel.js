/**
 * Classic Windows Control Panel (Categories & Large Icons Views)
 * Routes directly to equivalent modules via Win11Registry for seamless multi-path parity.
 */
(function (global) {
    'use strict';

    var WIN_ID = 'win-control-panel';
    var fallbackCpUi = { viewMode: 'category' };

    function uiState() {
        var sess = global.Win11Sessions ? global.Win11Sessions.getActiveSession() : null;
        if (sess && sess.appUi) {
            if (!sess.appUi.controlPanel) sess.appUi.controlPanel = { viewMode: 'category' };
            return sess.appUi.controlPanel;
        }
        return fallbackCpUi;
    }

    function getHostBody() {
        var w = global.Win11WM.getWindow(WIN_ID);
        return w ? w.bodyEl : null;
    }

    function getCategories() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        return [
            {
                icon: 'navSystem',
                title: t('controlPanel.catSystem'),
                target: 'system.about',
                links: [
                    { label: t('settings.system.aboutTitle'), target: 'system.about' },
                    { label: t('settings.system.powerTitle'), target: 'system.power' },
                    { label: t('settings.privacy.firewall'), target: 'privacy.security' }
                ]
            },
            {
                icon: 'navNetwork',
                title: t('controlPanel.catNetwork'),
                target: 'network.status',
                links: [
                    { label: t('settings.network.wifiTitle'), target: 'network.status' }
                ]
            },
            {
                icon: 'mouse',
                title: t('controlPanel.catHardware'),
                target: 'devices.mouse',
                links: [
                    { label: t('controlPanel.linkMouse'), target: 'devices.mouse' },
                    { label: t('settings.devices.printersTitle'), target: 'devices.printers' },
                    { label: t('settings.system.soundTitle'), target: 'system.sound' }
                ]
            },
            {
                icon: 'navApps',
                title: t('controlPanel.catPrograms'),
                target: 'apps.installed',
                links: [
                    { label: t('controlPanel.linkUninstall'), target: 'apps.installed' },
                    { label: t('settings.apps.defaultsTitle'), target: 'apps.defaults' }
                ]
            },
            {
                icon: 'navAccounts',
                title: t('controlPanel.catAccounts'),
                target: 'accounts.users',
                links: [
                    { label: t('controlPanel.linkAddUser'), target: 'accounts.users' }
                ]
            },
            {
                icon: 'navPersonalization',
                title: t('controlPanel.catAppearance'),
                target: 'personalization.background',
                links: [
                    { label: t('controlPanel.linkBg'), target: 'personalization.background' },
                    { label: t('settings.personalization.colorsTitle'), target: 'personalization.colors' },
                    { label: t('settings.personalization.taskbarTitle'), target: 'personalization.taskbar' }
                ]
            },
            {
                icon: 'navTime',
                title: t('controlPanel.catClock'),
                target: 'time.language',
                links: [
                    { label: t('controlPanel.linkTimeZone'), target: 'time.datetime' },
                    { label: t('settings.time.addLangBtn'), target: 'time.language' }
                ]
            },
            {
                icon: 'navAccessibility',
                title: t('controlPanel.catEase'),
                target: 'accessibility.vision',
                links: [
                    { label: t('settings.accessibility.textSize'), target: 'accessibility.vision' },
                    { label: t('settings.accessibility.pointerLink'), target: 'devices.mouse' }
                ]
            }
        ];
    }

    function render() {
        var hostBody = getHostBody();
        if (!hostBody) return;
        var viewMode = uiState().viewMode;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var cats = getCategories();

        global.Win11WM.setTitle(WIN_ID, t('controlPanel.title'));

        var html =
            '<div class="cp-container">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--win-border-divider);padding-bottom:12px;flex-wrap:wrap;gap:10px">' +
                    '<div style="font-size:18px;font-weight:700">' + bidi(t('controlPanel.title')) + '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px">' +
                        '<span style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t('controlPanel.viewBy')) + '</span>' +
                        '<select class="win-select" id="cp-view-select" style="width:170px">' +
                            '<option value="category"' + (viewMode === 'category' ? ' selected' : '') + '>' + global.Win11Compat.escapeHtml(t('controlPanel.viewCategory')) + '</option>' +
                            '<option value="icons"' + (viewMode === 'icons' ? ' selected' : '') + '>' + global.Win11Compat.escapeHtml(t('controlPanel.viewIcons')) + '</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="cp-grid">';

        if (viewMode === 'category') {
            for (var i = 0; i < cats.length; i++) {
                var c = cats[i];
                html +=
                    '<div class="cp-category">' +
                        global.Win11Icons.get(c.icon, 36) +
                        '<div>' +
                            '<button type="button" class="cp-cat-title" data-cp-target="' + c.target + '">' + bidi(c.title) + '</button>';
                for (var j = 0; j < c.links.length; j++) {
                    html += '<button type="button" class="cp-link" data-cp-target="' + c.links[j].target + '">' + bidi(c.links[j].label) + '</button>';
                }
                html += '</div></div>';
            }
        } else {
            // Large Icons Flat View
            var allLinks = [];
            for (var x = 0; x < cats.length; x++) {
                for (var y = 0; y < cats[x].links.length; y++) {
                    allLinks.push({ icon: cats[x].icon, label: cats[x].links[y].label, target: cats[x].links[y].target });
                }
            }
            for (var k = 0; k < allLinks.length; k++) {
                html +=
                    '<button type="button" class="cp-category" data-cp-target="' + allLinks[k].target + '" style="text-align:start">' +
                        global.Win11Icons.get(allLinks[k].icon, 28) +
                        '<span style="font-size:13.5px;font-weight:500">' + bidi(allLinks[k].label) + '</span>' +
                    '</button>';
            }
        }

        html += '</div></div>';
        hostBody.innerHTML = html;

        hostBody.querySelector('#cp-view-select').onchange = function () {
            uiState().viewMode = this.value;
            render();
        };

        var btns = hostBody.querySelectorAll('[data-cp-target]');
        for (var m = 0; m < btns.length; m++) {
            btns[m].onclick = function () {
                global.Win11Registry.open(this.getAttribute('data-cp-target'));
            };
        }
    }

    function open() {
        var win = global.Win11WM.getWindow(WIN_ID);
        if (!win) {
            global.Win11WM.open({
                id: WIN_ID,
                appId: 'control-panel',
                title: global.Win11I18N.t('controlPanel.title'),
                icon: 'controlPanel',
                width: 860,
                height: 560,
                render: function () { render(); }
            });
        } else {
            global.Win11WM.focus(WIN_ID);
            render();
        }
    }

    global.Win11I18N.onChange(render);

    global.Win11ControlPanel = { open: open };
})(window);

