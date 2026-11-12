(function (global) {
    'use strict';

    global.Win11SettingsApp.register('home', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var wp = global.Win11State.getWallpaper(st.wallpaperId);

        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.home')));

        var hero = document.createElement('div');
        hero.className = 'system-hero';
        hero.innerHTML =
            '<div class="system-hero-pc">' +
                '<div class="system-hero-thumb" style="background-image:url(\'' + wp.file + '\')"></div>' +
                '<div>' +
                    '<div style="font-size:18px;font-weight:700"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.deviceName) + '</bdi></div>' +
                    '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t('settings.home.subtitle')) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="system-hero-pills">' +
                '<button type="button" class="hero-pill-btn" id="home-net-pill">' +
                    global.Win11Icons.get('navNetwork', 20) +
                    '<div><div style="font-size:12.5px;font-weight:600"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.wifiEnabled && !st.airplaneMode ? st.activeWifi : t('quick.wifi')) + '</bdi></div><div style="font-size:11px;color:var(--win-text-secondary)">' + bidi(st.wifiEnabled && !st.airplaneMode ? t('app.connected') : t('app.disconnected')) + '</div></div>' +
                '</button>' +
                '<button type="button" class="hero-pill-btn" id="home-upd-pill">' +
                    global.Win11Icons.get('navUpdate', 20) +
                    '<div><div style="font-size:12.5px;font-weight:600">Windows Update</div><div style="font-size:11px;color:var(--win-text-secondary)">' + bidi(t('settings.update.upToDate')) + '</div></div>' +
                '</button>' +
            '</div>';
        ctx.container.appendChild(hero);

        hero.querySelector('#home-net-pill').onclick = function () { ctx.navigate('network', 'main'); };
        hero.querySelector('#home-upd-pill').onclick = function () { ctx.navigate('update', 'main'); };

        ctx.container.appendChild(ctx.ui.groupLabel(t('settings.home.recommended')));

        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'navPersonalization',
            title: t('settings.home.persoCard'),
            desc: t('settings.home.persoDesc'),
            value: t('settings.home.tryPersonalize'),
            onClick: function () { ctx.navigate('personalization', 'background'); }
        }));

        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'mouse',
            title: t('settings.home.btCard'),
            desc: t('settings.home.btDesc'),
            value: t('settings.home.tryMouse'),
            onClick: function () { ctx.navigate('devices', 'mouse'); }
        }));

        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'navAccounts',
            title: t('settings.nav.accounts'),
            desc: t('settings.accounts.otherUsersTitle'),
            value: t('settings.home.tryAccounts'),
            onClick: function () { ctx.navigate('accounts', 'main'); }
        }));

        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'navTime',
            title: t('settings.time.languageTitle'),
            desc: t('settings.time.languageDesc'),
            value: global.Win11I18N.getMeta().name,
            onClick: function () { ctx.navigate('timeLanguage', 'language'); }
        }));

        var sessionCard = document.createElement('div');
        sessionCard.className = 'win-card';
        sessionCard.style.marginTop = '14px';
        sessionCard.innerHTML =
            '<div style="font-weight:600;margin-bottom:4px">' + bidi(t('settings.home.cloudCard')) + '</div>' +
            '<div style="font-size:13px;color:var(--win-text-secondary)">' + bidi(t('settings.home.cloudDesc')) + '</div>';
        ctx.container.appendChild(sessionCard);
    });
})(window);

