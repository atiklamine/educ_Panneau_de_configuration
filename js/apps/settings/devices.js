(function (global) {
    'use strict';

    global.Win11SettingsApp.register('devices', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var sub = ctx.subpage || 'main';
        var goRoot = function () { ctx.navigate('devices', 'main'); };

        if (sub === 'mouse') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.devices'), goRoot, t('settings.devices.mouseTitle')));

            ctx.container.appendChild(ctx.ui.rowSelect({
                icon: 'mouse',
                title: t('settings.devices.primaryBtn'),
                value: st.mouseButtonsInverted ? 'right' : 'left',
                permAction: 'devices.mouse',
                options: [
                    { value: 'left', label: t('settings.devices.left') },
                    { value: 'right', label: t('settings.devices.right') }
                ],
                onChange: function (v) { global.Win11State.set({ mouseButtonsInverted: (v === 'right') }); }
            }));

            ctx.container.appendChild(ctx.ui.groupLabel(t('settings.devices.classicMouseHeader')));

            ctx.container.appendChild(ctx.ui.rowSelect({
                id: 'ctrl-mouse-speed',
                icon: 'sliders',
                title: t('settings.devices.doubleClickSpeed'),
                value: st.mouseDoubleClickSpeed,
                permAction: 'devices.mouse',
                options: [
                    { value: 'Lente', label: t('settings.devices.slow') },
                    { value: 'Moyenne', label: t('settings.devices.medium') },
                    { value: 'Rapide', label: t('settings.devices.fast') }
                ],
                onChange: function (v) { global.Win11State.set({ mouseDoubleClickSpeed: v }); }
            }));

            // Double-click interactive test card
            var testCard = document.createElement('div');
            testCard.className = 'win-card';
            testCard.innerHTML =
                '<div style="font-weight:600;margin-bottom:8px">' + bidi(t('settings.devices.testFolderTitle')) + '</div>' +
                '<div id="mouse-test-zone" tabindex="0" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:6px;background:var(--win-surface-subtle);border:1px dashed var(--win-border-control);cursor:pointer">' +
                    '<span id="mouse-folder-icon">' + global.Win11Icons.get('folderClosed', 34) + '</span>' +
                    '<span id="mouse-folder-msg" style="font-size:13px">' + bidi(t('settings.devices.testFolderClosed')) + '</span>' +
                '</div>';
            ctx.container.appendChild(testCard);

            var isOpened = false;
            testCard.querySelector('#mouse-test-zone').ondblclick = function () {
                isOpened = !isOpened;
                testCard.querySelector('#mouse-folder-icon').innerHTML = global.Win11Icons.get(isOpened ? 'folderOpen' : 'folderClosed', 34);
                testCard.querySelector('#mouse-folder-msg').innerHTML = bidi(isOpened ? t('settings.devices.testFolderOpened') : t('settings.devices.testFolderClosed'));
            };

            ctx.container.appendChild(ctx.ui.rowSelect({
                icon: 'palette',
                title: t('settings.devices.pointerScheme'),
                value: st.pointerScheme,
                permAction: 'devices.mouse',
                options: [
                    { value: 'Standard', label: t('settings.devices.schemeStandard') },
                    { value: 'Noir', label: t('settings.devices.schemeNoir') },
                    { value: 'LimeGreen', label: t('settings.devices.schemeLimeGreen') }
                ],
                onChange: function (v) { global.Win11State.set({ pointerScheme: v }); }
            }));
            return;
        }

        if (sub === 'printers') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.devices'), goRoot, t('settings.devices.printersTitle')));
            var pCard = document.createElement('div');
            pCard.id = 'ctrl-printers-list';
            pCard.className = 'win-card';
            pCard.innerHTML =
                '<div style="display:flex;align-items:center;gap:12px">' +
                    global.Win11Icons.get('printer', 26) +
                    '<div><div style="font-weight:600">' + bidi(t('settings.devices.printerLab')) + '</div><div class="win-badge win-badge-success" style="margin-top:4px">' + bidi(t('app.default')) + '</div></div>' +
                '</div>';
            ctx.container.appendChild(pCard);
            return;
        }

        // Main Bluetooth & Devices Page
        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.devices')));
        ctx.container.appendChild(ctx.ui.rowToggle({
            id: 'ctrl-bt-toggle',
            icon: 'bluetooth',
            title: t('settings.devices.btToggle'),
            desc: t('settings.devices.btDesc'),
            checked: st.bluetoothEnabled && !st.airplaneMode,
            permAction: 'devices.bluetooth',
            onChange: function (v) { global.Win11State.setBluetoothEnabled(v); }
        }));
        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'mouse',
            title: t('settings.devices.mouseTitle'),
            desc: t('settings.devices.mouseDesc'),
            onClick: function () { ctx.navigate('devices', 'mouse'); }
        }));
        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'printer',
            title: t('settings.devices.printersTitle'),
            desc: t('settings.devices.printersDesc'),
            onClick: function () { ctx.navigate('devices', 'printers'); }
        }));
        ctx.container.appendChild(ctx.ui.rowLink({
            icon: 'keyboard',
            title: t('settings.devices.keyboardTitle'),
            desc: t('settings.devices.keyboardDesc'),
            onClick: function () { ctx.navigate('timeLanguage', 'language'); }
        }));
    });
})(window);

