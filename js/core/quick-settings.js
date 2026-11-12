/**
 * Windows 11 Quick Settings Flyout (Win+A / Alt+A / System Tray Pill)
 */
(function (global) {
    'use strict';

    var subview = null; // null | 'wifi'

    function getEl() {
        return document.getElementById('quick-settings-flyout');
    }

    function isOpen() {
        var el = getEl();
        return !!(el && el.classList.contains('is-open'));
    }

    function close() {
        var el = getEl();
        if (el) el.classList.remove('is-open');
        subview = null;
    }

    function renderWifiSubview(el) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();

        var html =
            '<div class="quick-subview">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
                    '<button type="button" class="win-btn win-btn-subtle win-nav-back" id="qs-wifi-back" style="width:32px;padding:0">' +
                        global.Win11Icons.get('arrowBack', 16) +
                    '</button>' +
                    '<span style="font-weight:600;font-size:14px">' + bidi(t('quick.networksTitle')) + '</span>' +
                '</div>';

        var nets = [
            { name: t('quick.labWifi'), signal: '5G' },
            { name: t('quick.teachersWifi'), signal: '2.4G' },
            { name: 'Edunet-Algeria-Fiber', signal: '2.4G' }
        ];
        for (var i = 0; i < nets.length; i++) {
            var active = st.wifiEnabled && !st.airplaneMode && st.activeWifi === nets[i].name;
            html +=
                '<button type="button" class="setting-row is-clickable qs-net-row" data-net="' + global.Win11Compat.escapeHtml(nets[i].name) + '" style="min-height:48px;margin-bottom:6px">' +
                    global.Win11Icons.get('wifi', 16) +
                    '<div class="setting-row-text">' +
                        '<div class="setting-row-title">' + bidi(nets[i].name) + '</div>' +
                        '<div class="setting-row-desc">' + (active ? bidi(t('app.connected')) : bidi(t('app.available'))) + '</div>' +
                    '</div>' +
                '</button>';
        }
        html +=
                '<button type="button" class="win-btn win-btn-subtle" id="qs-more-wifi" style="margin-top:8px;width:100%;justify-content:flex-start">' +
                    bidi(t('quick.moreNetworkSettings')) +
                '</button>' +
            '</div>';

        el.innerHTML = html;

        el.querySelector('#qs-wifi-back').onclick = function () {
            subview = null;
            render();
        };
        el.querySelector('#qs-more-wifi').onclick = function () {
            close();
            global.Win11Registry.open('network.status');
        };
        var rows = el.querySelectorAll('.qs-net-row');
        for (var j = 0; j < rows.length; j++) {
            rows[j].onclick = function () {
                var name = this.getAttribute('data-net');
                var applyNet = function () {
                    global.Win11State.set({ wifiEnabled: true, airplaneMode: false, activeWifi: name }, 'network:changed');
                    render();
                };
                if (global.Win11Permissions) {
                    global.Win11Permissions.guard('network.wifi', applyNet, { targetLabel: name });
                } else {
                    applyNet();
                }
            };
        }
    }

    function render() {
        var el = getEl();
        if (!el) return;
        if (subview === 'wifi') {
            renderWifiSubview(el);
            return;
        }

        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();

        var tiles = [
            {
                id: 'wifi',
                active: st.wifiEnabled && !st.airplaneMode,
                icon: 'wifi',
                label: st.wifiEnabled && !st.airplaneMode ? st.activeWifi : t('quick.wifi'),
                split: true
            },
            {
                id: 'bluetooth',
                active: st.bluetoothEnabled && !st.airplaneMode,
                icon: 'bluetooth',
                label: t('quick.bluetooth'),
                split: true
            },
            {
                id: 'airplane',
                active: st.airplaneMode,
                icon: 'airplane',
                label: t('quick.airplane'),
                split: false
            },
            {
                id: 'battery',
                active: st.batterySaver,
                icon: 'battery',
                label: t('quick.batterySaver'),
                split: false
            },
            {
                id: 'night',
                active: st.nightLight,
                icon: 'moon',
                label: t('quick.nightLight'),
                split: false
            },
            {
                id: 'theme',
                active: st.themeMode === 'dark',
                icon: 'palette',
                label: t('quick.darkTheme'),
                split: false
            }
        ];

        var html = '<div class="quick-grid">';
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            html += '<div class="quick-tile-wrap">';
            if (tile.split) {
                html +=
                    '<div class="quick-tile-btn ' + (tile.active ? 'is-active' : '') + '">' +
                        '<div class="quick-tile-split">' +
                            '<button type="button" class="quick-tile-main" data-qt-main="' + tile.id + '">' + global.Win11Icons.get(tile.icon, 18) + '</button>' +
                            '<button type="button" class="quick-tile-arrow win-dir-arrow" data-qt-more="' + tile.id + '">' + global.Win11Icons.get('chevronRight', 13) + '</button>' +
                        '</div>' +
                    '</div>';
            } else {
                html +=
                    '<button type="button" class="quick-tile-btn ' + (tile.active ? 'is-active' : '') + '" data-qt-main="' + tile.id + '">' +
                        global.Win11Icons.get(tile.icon, 18) +
                    '</button>';
            }
            html += '<div class="quick-tile-label" title="' + global.Win11Compat.escapeHtml(tile.label) + '">' + bidi(tile.label) + '</div>';
            html += '</div>';
        }
        html += '</div>';

        // Sliders (Brightness + Volume)
        html +=
            '<div class="quick-sliders">' +
                '<div class="quick-slider-row">' +
                    '<span title="' + global.Win11Compat.escapeHtml(t('quick.brightness')) + '">' + global.Win11Icons.get('brightness', 18) + '</span>' +
                    '<input type="range" min="30" max="100" value="' + st.brightness + '" class="win-slider" id="qs-brightness-slider" aria-label="' + global.Win11Compat.escapeHtml(t('quick.brightness')) + '">' +
                    '<span style="font-size:12px;min-width:34px;text-align:end"><bdi dir="ltr">' + st.brightness + '%</bdi></span>' +
                '</div>' +
                '<div class="quick-slider-row">' +
                    '<button type="button" id="qs-mute-btn" title="' + global.Win11Compat.escapeHtml(t('quick.volume')) + '">' +
                        global.Win11Icons.get((st.muted || st.volume === 0) ? 'volumeMute' : 'volume', 18) +
                    '</button>' +
                    '<input type="range" min="0" max="100" value="' + (st.muted ? 0 : st.volume) + '" class="win-slider" id="qs-volume-slider" aria-label="' + global.Win11Compat.escapeHtml(t('quick.volume')) + '">' +
                    '<button type="button" class="win-dir-arrow" id="qs-sound-more" title="' + global.Win11Compat.escapeHtml(t('quick.moreSoundSettings')) + '">' +
                        global.Win11Icons.get('chevronRight', 14) +
                    '</button>' +
                '</div>' +
            '</div>';

        // Footer (Battery % + All Settings Gear)
        html +=
            '<div class="quick-footer">' +
                '<button type="button" class="win-btn win-btn-subtle" id="qs-battery-link" style="height:28px;min-height:28px;padding:2px 6px">' +
                    global.Win11Icons.get('battery', 16) +
                    '<span><bdi dir="ltr">' + st.batteryPercent + '%</bdi></span>' +
                '</button>' +
                '<div style="display:flex;gap:4px">' +
                    '<button type="button" class="win-btn win-btn-subtle" id="qs-access-btn" title="' + global.Win11Compat.escapeHtml(t('quick.accessibility')) + '" style="width:30px;padding:0;min-height:28px">' +
                        global.Win11Icons.get('navAccessibility', 16) +
                    '</button>' +
                    '<button type="button" class="win-btn win-btn-subtle" id="qs-settings-btn" title="' + global.Win11Compat.escapeHtml(t('quick.moreSettings')) + '" style="width:30px;padding:0;min-height:28px">' +
                        global.Win11Icons.get('settings', 16) +
                    '</button>' +
                '</div>' +
            '</div>';

        el.innerHTML = html;

        // Wire events cleanly
        var mainBtns = el.querySelectorAll('[data-qt-main]');
        for (var j = 0; j < mainBtns.length; j++) {
            mainBtns[j].onclick = function () {
                var id = this.getAttribute('data-qt-main');
                var permMap = {
                    wifi: 'network.wifi',
                    bluetooth: 'devices.bluetooth',
                    airplane: 'network.admin',
                    battery: 'system.power',
                    night: 'system.display',
                    theme: 'personalization.theme'
                };
                var applyTile = function () {
                    var cur = global.Win11State.get();
                    if (id === 'wifi') {
                        global.Win11State.setWifiEnabled(!cur.wifiEnabled);
                    } else if (id === 'bluetooth') {
                        global.Win11State.setBluetoothEnabled(!cur.bluetoothEnabled);
                    } else if (id === 'airplane') {
                        global.Win11State.setAirplaneMode(!cur.airplaneMode);
                    } else if (id === 'battery') {
                        global.Win11State.set({ batterySaver: !cur.batterySaver });
                    } else if (id === 'night') {
                        global.Win11State.set({ nightLight: !cur.nightLight });
                    } else if (id === 'theme') {
                        global.Win11State.set({ themeMode: cur.themeMode === 'dark' ? 'light' : 'dark' }, 'theme:changed');
                    }
                    render();
                };
                if (global.Win11Permissions && permMap[id]) {
                    global.Win11Permissions.guard(permMap[id], applyTile, { targetLabel: t('quick.' + (id === 'theme' ? 'darkTheme' : (id === 'night' ? 'nightLight' : (id === 'battery' ? 'batterySaver' : id)))) });
                } else {
                    applyTile();
                }
            };
        }

        var moreBtns = el.querySelectorAll('[data-qt-more]');
        for (var k = 0; k < moreBtns.length; k++) {
            moreBtns[k].onclick = function () {
                var id = this.getAttribute('data-qt-more');
                if (id === 'wifi') {
                    subview = 'wifi';
                    render();
                } else if (id === 'bluetooth') {
                    close();
                    global.Win11Registry.open('devices.bluetooth');
                }
            };
        }

        el.querySelector('#qs-brightness-slider').oninput = function () {
            if (global.Win11Permissions && !global.Win11Permissions.can('system.display')) {
                this.value = global.Win11State.get().brightness;
                return;
            }
            global.Win11State.set({ brightness: Number(this.value) });
            var label = el.querySelector('#qs-brightness-slider').nextElementSibling;
            if (label) label.innerHTML = '<bdi dir="ltr">' + this.value + '%</bdi>';
        };

        el.querySelector('#qs-volume-slider').oninput = function () {
            if (global.Win11Permissions && !global.Win11Permissions.can('system.sound')) {
                var curSt = global.Win11State.get();
                this.value = curSt.muted ? 0 : curSt.volume;
                return;
            }
            var v = Number(this.value);
            global.Win11State.set({ volume: v, muted: (v === 0) }, 'sound:changed');
            var mb = el.querySelector('#qs-mute-btn');
            if (mb) mb.innerHTML = global.Win11Icons.get(v === 0 ? 'volumeMute' : 'volume', 18);
        };

        el.querySelector('#qs-mute-btn').onclick = function () {
            var toggleMute = function () {
                var cur = global.Win11State.get();
                global.Win11State.set({ muted: !cur.muted }, 'sound:changed');
                render();
            };
            if (global.Win11Permissions) {
                global.Win11Permissions.guard('system.sound', toggleMute, { targetLabel: t('quick.volume') });
            } else {
                toggleMute();
            }
        };

        el.querySelector('#qs-sound-more').onclick = function () {
            close();
            global.Win11Registry.open('system.sound');
        };
        el.querySelector('#qs-battery-link').onclick = function () {
            close();
            global.Win11Registry.open('system.power');
        };
        el.querySelector('#qs-access-btn').onclick = function () {
            close();
            global.Win11Registry.open('accessibility.vision');
        };
        el.querySelector('#qs-settings-btn').onclick = function () {
            close();
            global.Win11Registry.open('home');
        };
    }

    function open() {
        if (global.Win11Shell) global.Win11Shell.closeAllFlyouts('quick');
        render();
        var el = getEl();
        if (el) el.classList.add('is-open');
    }

    function toggle() {
        if (isOpen()) close();
        else open();
    }

    global.Win11QuickSettings = {
        open: open,
        close: close,
        toggle: toggle,
        isOpen: isOpen,
        refresh: function () { if (isOpen()) render(); }
    };
})(window);

