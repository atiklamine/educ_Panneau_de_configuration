(function (global) {
    'use strict';

    global.Win11SettingsApp.register('privacy', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();

        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.privacy')));

        var card = document.createElement('div');
        card.id = 'ctrl-privacy-security';
        card.className = 'system-hero';
        card.innerHTML =
            '<div class="system-hero-pc">' +
                '<span style="color:var(--win-success)">' + global.Win11Icons.get('shield', 34) + '</span>' +
                '<div>' +
                    '<div style="font-size:16px;font-weight:700">' + bidi(t('settings.privacy.securityStatus')) + '</div>' +
                    '<div style="font-size:13px;color:var(--win-text-secondary)">' + bidi(t('settings.privacy.securityOk')) + '</div>' +
                    '<div style="font-size:12px;color:var(--win-success);margin-top:4px">' + bidi(t('settings.privacy.firewall')) + ': ' + bidi(t('settings.privacy.firewallOk')) + '</div>' +
                '</div>' +
            '</div>';
        ctx.container.appendChild(card);

        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'globe',
            title: t('settings.privacy.location'),
            desc: t('settings.privacy.locationDesc'),
            checked: st.privacy.location,
            permAction: 'privacy.security',
            onChange: function (v) {
                if (global.Win11Assessment && typeof global.Win11Assessment.recordUnrequestedChange === 'function') {
                    global.Win11Assessment.recordUnrequestedChange('أذونات الموقع Location');
                }
                global.Win11State.update(function (d) { d.privacy.location = v; });
            }
        }));
        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'navGaming',
            title: t('settings.privacy.camera'),
            desc: t('settings.privacy.cameraDesc'),
            checked: st.privacy.camera,
            permAction: 'privacy.security',
            onChange: function (v) {
                if (global.Win11Assessment && typeof global.Win11Assessment.recordUnrequestedChange === 'function') {
                    global.Win11Assessment.recordUnrequestedChange('أذونات الكاميرا Camera');
                }
                global.Win11State.update(function (d) { d.privacy.camera = v; });
            }
        }));
        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'volume',
            title: t('settings.privacy.microphone'),
            desc: t('settings.privacy.microphoneDesc'),
            checked: st.privacy.microphone,
            permAction: 'privacy.security',
            onChange: function (v) {
                if (global.Win11Assessment && typeof global.Win11Assessment.recordUnrequestedChange === 'function') {
                    global.Win11Assessment.recordUnrequestedChange('أذونات الميكروفون Microphone');
                }
                global.Win11State.update(function (d) { d.privacy.microphone = v; });
            }
        }));
    });
})(window);

