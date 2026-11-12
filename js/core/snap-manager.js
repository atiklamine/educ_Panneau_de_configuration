/**
 * Windows 11 Snap Layouts & Edge Drag Snap Engine
 * Supports dragging windows to screen edges/corners + hovering Maximize button.
 */
(function (global) {
    'use strict';

    var activeZone = null;
    var hoverTimer = null;
    var hideTimer = null;
    var popoverEl = null;

    function getGhost() {
        var overlay = document.getElementById('snap-preview-overlay');
        if (!overlay) return null;
        var ghost = overlay.querySelector('.snap-ghost');
        if (!ghost) {
            ghost = document.createElement('div');
            ghost.className = 'snap-ghost';
            overlay.appendChild(ghost);
        }
        return ghost;
    }

    function detectZone(clientX, clientY) {
        var w = global.innerWidth;
        var h = global.innerHeight - 48;
        var edge = 18;
        if (clientY <= 10 && clientX > edge && clientX < w - edge) {
            return { x: 0, y: 0, w: 1, h: 1 }; // Maximize
        }
        if (clientX <= edge) {
            if (clientY <= h * 0.25) return { x: 0, y: 0, w: 0.5, h: 0.5 };
            if (clientY >= h * 0.75) return { x: 0, y: 0.5, w: 0.5, h: 0.5 };
            return { x: 0, y: 0, w: 0.5, h: 1 };
        }
        if (clientX >= w - edge) {
            if (clientY <= h * 0.25) return { x: 0.5, y: 0, w: 0.5, h: 0.5 };
            if (clientY >= h * 0.75) return { x: 0.5, y: 0.5, w: 0.5, h: 0.5 };
            return { x: 0.5, y: 0, w: 0.5, h: 1 };
        }
        return null;
    }

    function showGhost(zone) {
        var ghost = getGhost();
        if (!ghost) return;
        if (!zone) {
            ghost.classList.remove('is-visible');
            return;
        }
        var overlay = document.getElementById('snap-preview-overlay');
        var aw = overlay.clientWidth || global.innerWidth;
        var ah = overlay.clientHeight || (global.innerHeight - 48);
        ghost.style.left = Math.round(zone.x * aw + 6) + 'px';
        ghost.style.top = Math.round(zone.y * ah + 6) + 'px';
        ghost.style.width = Math.round(zone.w * aw - 12) + 'px';
        ghost.style.height = Math.round(zone.h * ah - 12) + 'px';
        ghost.classList.add('is-visible');
    }

    function hidePopover() {
        if (popoverEl && popoverEl.parentNode) {
            popoverEl.parentNode.removeChild(popoverEl);
        }
        popoverEl = null;
    }

    function showSnapPopover(win, anchorBtn) {
        hidePopover();
        if (!global.Win11State.get().snapWindowsEnabled) return;

        var rect = anchorBtn.getBoundingClientRect();
        var pop = document.createElement('div');
        pop.className = 'snap-layouts-popover win-acrylic';
        pop.title = global.Win11I18N.t('taskbar.snapLayoutsTitle');

        var layouts = [
            {
                cls: '',
                zones: [
                    { x: 0, y: 0, w: 0.5, h: 1 },
                    { x: 0.5, y: 0, w: 0.5, h: 1 }
                ]
            },
            {
                cls: 'is-split-wide',
                zones: [
                    { x: 0, y: 0, w: 0.65, h: 1 },
                    { x: 0.65, y: 0, w: 0.35, h: 1 }
                ]
            },
            {
                cls: 'is-grid-4',
                zones: [
                    { x: 0, y: 0, w: 0.5, h: 0.5 },
                    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
                    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
                    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
                ]
            }
        ];

        for (var i = 0; i < layouts.length; i++) {
            var card = document.createElement('div');
            card.className = 'snap-layout-card ' + layouts[i].cls;
            for (var j = 0; j < layouts[i].zones.length; j++) {
                (function (z) {
                    var cell = document.createElement('div');
                    cell.className = 'snap-zone-cell';
                    cell.onclick = function (ev) {
                        ev.stopPropagation();
                        hidePopover();
                        global.Win11WM.snap(win.id, z);
                    };
                    card.appendChild(cell);
                })(layouts[i].zones[j]);
            }
            pop.appendChild(card);
        }

        document.body.appendChild(pop);
        var popW = pop.offsetWidth || 236;
        var left = global.Win11Compat.clamp(rect.left + rect.width / 2 - popW / 2, 8, global.innerWidth - popW - 8);
        var top = Math.min(rect.bottom + 6, global.innerHeight - 130);
        pop.style.left = Math.round(left) + 'px';
        pop.style.top = Math.round(top) + 'px';

        pop.addEventListener('mouseenter', function () {
            if (hideTimer) clearTimeout(hideTimer);
        });
        pop.addEventListener('mouseleave', function () {
            hideTimer = setTimeout(hidePopover, 220);
        });

        popoverEl = pop;
    }

    global.Win11Snap = {
        onWindowDragMove: function (clientX, clientY) {
            activeZone = detectZone(clientX, clientY);
            showGhost(activeZone);
        },

        onWindowDragEnd: function (win, clientX, clientY) {
            var zone = detectZone(clientX, clientY);
            activeZone = null;
            showGhost(null);
            if (zone) {
                global.Win11WM.snap(win.id, zone);
                return true;
            }
            return false;
        },

        bindMaximizeButton: function (win, maxBtn) {
            maxBtn.addEventListener('mouseenter', function () {
                if (hideTimer) clearTimeout(hideTimer);
                if (hoverTimer) clearTimeout(hoverTimer);
                hoverTimer = setTimeout(function () {
                    showSnapPopover(win, maxBtn);
                }, 420);
            });
            maxBtn.addEventListener('mouseleave', function () {
                if (hoverTimer) clearTimeout(hoverTimer);
                hideTimer = setTimeout(hidePopover, 240);
            });
        },

        closePopover: hidePopover
    };
})(window);

