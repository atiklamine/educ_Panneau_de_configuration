/**
 * Windows 11 Task View (Win+Tab / Alt+Tab) & Virtual Desktops Manager
 */
(function (global) {
    'use strict';

    function getEl() {
        return document.getElementById('task-view-overlay');
    }

    function isOpen() {
        var el = getEl();
        return !!(el && el.classList.contains('is-open'));
    }

    function close() {
        var el = getEl();
        if (el) {
            el.classList.remove('is-open');
            el.innerHTML = '';
        }
    }

    function render() {
        var el = getEl();
        if (!el) return;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var wp = global.Win11State.getWallpaper(st.wallpaperId);
        var desktops = global.Win11WM.getDesktops();
        var activeD = global.Win11WM.getActiveDesktop();
        var allWins = global.Win11WM.getAllWindows();
        var wins = [];
        for (var i = 0; i < allWins.length; i++) {
            if (allWins[i].desktopId === activeD) wins.push(allWins[i]);
        }

        var html = '<div class="tv-windows-grid">';
        if (wins.length === 0) {
            html += '<div style="font-size:16px;opacity:0.85">' + bidi(t('taskView.noWindows')) + '</div>';
        } else {
            for (var j = 0; j < wins.length; j++) {
                var w = wins[j];
                html +=
                    '<div class="tv-win-card" data-tv-win="' + w.id + '">' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--win-border-divider)">' +
                            '<div style="display:flex;align-items:center;gap:8px;min-width:0">' +
                                global.Win11Icons.get(w.icon, 16) +
                                '<span style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + bidi(w.title) + '</span>' +
                            '</div>' +
                            '<button type="button" class="win-caption-btn is-close" data-tv-close="' + w.id + '" style="width:26px;height:26px;border-radius:4px" title="' + global.Win11Compat.escapeHtml(t('taskView.closeWindow')) + '">' +
                                global.Win11Icons.get('winClose', 10) +
                            '</button>' +
                        '</div>' +
                        '<div style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--win-bg-layer)">' +
                            global.Win11Icons.get(w.icon, 48) +
                        '</div>' +
                    '</div>';
            }
        }
        html += '</div>';

        // Virtual Desktops Strip
        html += '<div class="tv-desktops-bar">';
        for (var d = 0; d < desktops.length; d++) {
            var desk = desktops[d];
            html +=
                '<div class="tv-desktop-thumb' + (desk.id === activeD ? ' is-active' : '') + '" data-tv-desk="' + desk.id + '" style="background-image:url(\'' + wp.file + '\')">' +
                    '<span style="text-shadow:0 1px 4px rgba(0,0,0,0.85)">' + bidi(t('taskView.desktopPrefix') + ' ' + (d + 1)) + '</span>' +
                '</div>';
        }
        html +=
            '<button type="button" class="tv-desktop-thumb" id="tv-add-desktop" style="background:rgba(255,255,255,0.14);align-items:center;justify-content:center;gap:6px">' +
                global.Win11Icons.get('plus', 18) +
                '<span>' + bidi(t('taskView.newDesktop')) + '</span>' +
            '</button>' +
        '</div>';

        el.innerHTML = html;

        // Click background closes Task View
        el.onclick = function (ev) {
            if (ev.target === el || ev.target.classList.contains('tv-windows-grid')) {
                close();
            }
        };

        var cards = el.querySelectorAll('[data-tv-win]');
        for (var c = 0; c < cards.length; c++) {
            cards[c].onclick = function (ev) {
                if (global.Win11Compat.closest(ev.target, '[data-tv-close]')) return;
                var id = this.getAttribute('data-tv-win');
                close();
                global.Win11WM.focus(id);
            };
        }

        var closes = el.querySelectorAll('[data-tv-close]');
        for (var k = 0; k < closes.length; k++) {
            closes[k].onclick = function (ev) {
                ev.stopPropagation();
                var id = this.getAttribute('data-tv-close');
                global.Win11WM.close(id);
                render();
            };
        }

        var desks = el.querySelectorAll('[data-tv-desk]');
        for (var m = 0; m < desks.length; m++) {
            desks[m].onclick = function (ev) {
                ev.stopPropagation();
                var dId = Number(this.getAttribute('data-tv-desk'));
                global.Win11WM.switchDesktop(dId);
                render();
            };
        }

        el.querySelector('#tv-add-desktop').onclick = function (ev) {
            ev.stopPropagation();
            var nid = global.Win11WM.addDesktop();
            global.Win11WM.switchDesktop(nid);
            render();
        };
    }

    function open() {
        if (global.Win11Shell) global.Win11Shell.closeAllFlyouts('taskview');
        render();
        var el = getEl();
        if (el) el.classList.add('is-open');
    }

    function toggle() {
        if (isOpen()) close();
        else open();
    }

    global.Win11TaskView = {
        open: open,
        close: close,
        toggle: toggle,
        isOpen: isOpen
    };
})(window);

