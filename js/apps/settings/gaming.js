(function (global) {
    'use strict';

    global.Win11SettingsApp.register('gaming', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var st = global.Win11State.get();

        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.gaming')));
        ctx.container.appendChild(ctx.ui.rowToggle({
            id: 'ctrl-gaming-toggle',
            icon: 'navGaming',
            title: t('settings.gaming.gameMode'),
            desc: t('settings.gaming.gameModeDesc'),
            checked: st.gameMode,
            permAction: 'system.display',
            onChange: function (v) {
                if (global.Win11Assessment && typeof global.Win11Assessment.recordUnrequestedChange === 'function') {
                    global.Win11Assessment.recordUnrequestedChange('وضع الألعاب Game Mode');
                }
                global.Win11State.set({ gameMode: v });
            }
        }));
        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'folderOpen',
            title: t('settings.gaming.captures'),
            desc: t('settings.gaming.capturesDesc'),
            onClick: function () { if (global.Win11Explorer) global.Win11Explorer.open('this-pc'); }
        }));
    });
})(window);

