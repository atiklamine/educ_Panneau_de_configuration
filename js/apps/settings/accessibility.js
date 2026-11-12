(function (global) {
    'use strict';

    global.Win11SettingsApp.register('accessibility', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var st = global.Win11State.get();

        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.accessibility')));
        ctx.container.appendChild(ctx.ui.rowSlider({
            id: 'ctrl-access-textsize',
            icon: 'navAccessibility',
            title: t('settings.accessibility.textSize'),
            desc: t('settings.accessibility.textSizeDesc'),
            min: 85,
            max: 150,
            step: 5,
            value: st.textScale,
            unit: '%',
            permAction: 'accessibility.change',
            onChange: function (v) { global.Win11State.set({ textScale: v }, 'theme:changed'); }
        }));
        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'palette',
            title: t('settings.accessibility.highContrast'),
            desc: t('settings.accessibility.highContrastDesc'),
            checked: st.highContrast,
            permAction: 'accessibility.change',
            onChange: function (v) { global.Win11State.set({ highContrast: v }, 'theme:changed'); }
        }));
        ctx.container.appendChild(ctx.ui.rowToggle({
            icon: 'sliders',
            title: t('settings.accessibility.reducedMotion'),
            desc: t('settings.accessibility.reducedMotionDesc'),
            checked: st.reducedMotion,
            permAction: 'accessibility.change',
            onChange: function (v) { global.Win11State.set({ reducedMotion: v }, 'theme:changed'); }
        }));
        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'mouse',
            title: t('settings.accessibility.pointerLink'),
            desc: t('settings.accessibility.pointerLinkDesc'),
            onClick: function () { ctx.navigate('devices', 'mouse'); }
        }));
    });
})(window);

