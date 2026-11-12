(function (global) {
    'use strict';

    global.Win11SettingsApp.register('network', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var connected = (st.wifiEnabled && !st.airplaneMode);

        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.network')));

        var banner = document.createElement('div');
        banner.className = 'system-hero';
        banner.innerHTML =
            '<div class="system-hero-pc">' +
                global.Win11Icons.get(st.airplaneMode ? 'airplane' : (connected ? 'wifi' : 'ethernet'), 34) +
                '<div>' +
                    '<div style="font-size:17px;font-weight:700"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(connected ? st.activeWifi : 'Ethernet (Labo 1AS)') + '</bdi></div>' +
                    '<div style="font-size:13px;color:var(--win-text-secondary)">' + bidi(st.airplaneMode ? t('network.statusOffline') : t('settings.network.statusConnected')) + '</div>' +
                '</div>' +
            '</div>' +
            '<span class="win-badge ' + (st.airplaneMode ? 'win-badge-warning' : 'win-badge-success') + '">' +
                bidi(st.airplaneMode ? t('app.disconnected') : t('app.connected')) +
            '</span>';
        ctx.container.appendChild(banner);

        ctx.container.appendChild(ctx.ui.rowToggle({
            id: 'ctrl-wifi-toggle',
            icon: 'wifi',
            title: t('settings.network.wifiTitle'),
            desc: t('settings.network.wifiDesc'),
            checked: st.wifiEnabled && !st.airplaneMode,
            permAction: 'network.wifi',
            onChange: function (v) {
                global.Win11State.setWifiEnabled(v);
                ctx.navigate('network', 'main');
            }
        }));

        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'airplane',
            title: t('settings.network.airplaneTitle'),
            desc: t('settings.network.airplaneDesc'),
            checked: st.airplaneMode,
            permAction: 'network.admin',
            onChange: function (v) {
                global.Win11State.setAirplaneMode(v);
                ctx.navigate('network', 'main');
            }
        }));

        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'shield',
            title: t('settings.network.vpnTitle'),
            desc: t('settings.network.vpnDesc'),
            checked: st.vpnEnabled,
            permAction: 'network.admin',
            onChange: function (v) { global.Win11State.set({ vpnEnabled: v }); }
        }));

        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'globe',
            title: t('settings.network.proxyTitle'),
            desc: t('settings.network.proxyDesc'),
            checked: st.proxyEnabled,
            permAction: 'network.admin',
            onChange: function (v) { global.Win11State.set({ proxyEnabled: v }); }
        }));

        var ethCard = document.createElement('div');
        ethCard.className = 'win-card';
        ethCard.innerHTML =
            '<div style="font-weight:600;margin-bottom:6px">' + bidi(t('settings.network.ethernetTitle')) + '</div>' +
            '<div style="font-size:13px;color:var(--win-text-secondary);margin-bottom:8px">' + bidi(t('settings.network.ethernetDesc')) + '</div>' +
            '<div style="font-size:12.5px">' + bidi(t('settings.network.ipAddress')) + ' <bdi dir="ltr">192.168.1.105</bdi> &nbsp;|&nbsp; ' + bidi(t('settings.network.gateway')) + ' <bdi dir="ltr">192.168.1.1</bdi></div>';
        ctx.container.appendChild(ethCard);
    });
})(window);

