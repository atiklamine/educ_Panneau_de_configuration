/**
 * Microsoft Edge Offline Intranet Lab Guide (Zero network calls)
 */
(function (global) {
    'use strict';

    var WIN_ID = 'win-edge';

    function getHostBody() {
        var w = global.Win11WM.getWindow(WIN_ID);
        return w ? w.bodyEl : null;
    }

    function render() {
        var hostBody = getHostBody();
        if (!hostBody) return;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;

        global.Win11WM.setTitle(WIN_ID, t('edge.title'));

        hostBody.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--win-bg-layer);border-bottom:1px solid var(--win-border-divider)">' +
                global.Win11Icons.get('edge', 18) +
                '<div class="win-input" style="min-height:28px;padding:3px 12px;border-radius:9999px;font-size:12.5px" dir="ltr">' + global.Win11Compat.escapeHtml(t('edge.address')) + '</div>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;padding:24px 28px;background:var(--win-surface-card)">' +
                '<h2 style="margin:0 0 8px;font-size:20px">' + bidi(t('edge.heading')) + '</h2>' +
                '<p style="margin:0 0 18px;color:var(--win-text-secondary);font-size:13.5px">' + bidi(t('edge.intro')) + '</p>' +
                '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">' +
                    '<button type="button" class="setting-row is-clickable" data-edge-go="personalization.background">' + global.Win11Icons.get('wallpaper', 20) + '<div class="setting-row-text"><div class="setting-row-title">' + bidi(t('settings.personalization.bgTitle')) + '</div></div></button>' +
                    '<button type="button" class="setting-row is-clickable" data-edge-go="devices.mouse">' + global.Win11Icons.get('mouse', 20) + '<div class="setting-row-text"><div class="setting-row-title">' + bidi(t('settings.devices.mouseTitle')) + '</div></div></button>' +
                    '<button type="button" class="setting-row is-clickable" data-edge-go="time.language">' + global.Win11Icons.get('navTime', 20) + '<div class="setting-row-text"><div class="setting-row-title">' + bidi(t('settings.time.languageTitle')) + '</div></div></button>' +
                    '<button type="button" class="setting-row is-clickable" data-edge-go="apps.installed">' + global.Win11Icons.get('navApps', 20) + '<div class="setting-row-text"><div class="setting-row-title">' + bidi(t('settings.apps.installedTitle')) + '</div></div></button>' +
                    '<button type="button" class="setting-row is-clickable" data-edge-go="accounts.users">' + global.Win11Icons.get('navAccounts', 20) + '<div class="setting-row-text"><div class="setting-row-title">' + bidi(t('settings.nav.accounts')) + '</div></div></button>' +
                '</div>' +
            '</div>';

        var btns = hostBody.querySelectorAll('[data-edge-go]');
        for (var i = 0; i < btns.length; i++) {
            btns[i].onclick = function () {
                global.Win11Registry.open(this.getAttribute('data-edge-go'));
            };
        }
    }

    function open() {
        var win = global.Win11WM.getWindow(WIN_ID);
        if (!win) {
            global.Win11WM.open({
                id: WIN_ID,
                appId: 'edge',
                title: global.Win11I18N.t('edge.title'),
                icon: 'edge',
                width: 820,
                height: 540,
                onClose: function () { },
                render: function () { render(); }
            });
        } else {
            global.Win11WM.focus(WIN_ID);
            render();
        }
    }

    global.Win11I18N.onChange(render);

    global.Win11Edge = { open: open };
})(window);

