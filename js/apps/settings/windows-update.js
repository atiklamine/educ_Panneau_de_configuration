(function (global) {
    'use strict';

    global.Win11SettingsApp.register('update', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;

        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.update')));

        var hero = document.createElement('div');
        hero.id = 'ctrl-update-check';
        hero.className = 'system-hero';
        hero.innerHTML =
            '<div class="system-hero-pc">' +
                '<span style="color:var(--win-success)">' + global.Win11Icons.get('navUpdate', 38) + '</span>' +
                '<div>' +
                    '<div id="upd-headline" style="font-size:17px;font-weight:700">' + bidi(t('settings.update.upToDate')) + '</div>' +
                    '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t('settings.update.lastChecked')) + '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="win-btn win-btn-accent" id="btn-check-upd">' + bidi(t('settings.update.checkBtn')) + '</button>';
        ctx.container.appendChild(hero);

        hero.querySelector('#btn-check-upd').onclick = function () {
            var btn = this;
            var runUpdate = function () {
                var hl = hero.querySelector('#upd-headline');
                btn.disabled = true;
                hl.innerHTML = bidi(t('settings.update.checking'));
                setTimeout(function () {
                    btn.disabled = false;
                    hl.innerHTML = bidi(t('settings.update.upToDate'));
                }, 900);
            };
            if (global.Win11Permissions) {
                global.Win11Permissions.guard('update.install', runUpdate, { targetLabel: t('settings.update.checkBtn') });
            } else {
                runUpdate();
            }
        };

        ctx.container.appendChild(ctx.ui.groupLabel(t('settings.update.historyTitle')));
        var hCard = document.createElement('div');
        hCard.className = 'win-card';
        hCard.innerHTML =
            '<div style="padding:6px 0;border-bottom:1px solid var(--win-border-divider);font-size:13px">' + bidi(t('settings.update.historyItem1')) + '</div>' +
            '<div style="padding:8px 0 2px;font-size:13px">' + bidi(t('settings.update.historyItem2')) + '</div>';
        ctx.container.appendChild(hCard);
    });
})(window);

