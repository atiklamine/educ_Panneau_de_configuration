/**
 * Central Window Manager (Win11WM)
 * Handles window lifecycle, focus/z-index, dragging with viewport safety clamping,
 * 8-edge resizing, maximize/minimize/restore, virtual desktops, and Show Desktop.
 */
(function (global) {
    'use strict';

    var fallbackWmState = {
        windows: {},
        windowOrder: [],
        topZ: 310,
        activeDesktop: 0,
        desktops: [{ id: 0 }, { id: 1 }],
        showDesktopSavedIds: null,
        layerEl: null
    };
    var changeListeners = [];

    function S() {
        var sess = (global.Win11Sessions) ? global.Win11Sessions.getActiveSession() : null;
        return (sess && sess.wmState) ? sess.wmState : fallbackWmState;
    }

    function getLayer() {
        var s = S();
        if (s.layerEl) {
            var root = document.getElementById('windows-layer');
            if (root && s.layerEl.parentNode !== root) {
                root.innerHTML = '';
                root.appendChild(s.layerEl);
            }
            return s.layerEl;
        }
        return document.getElementById('windows-layer');
    }

    function getWorkArea() {
        var layer = getLayer();
        var root = (typeof document !== 'undefined') ? document.getElementById('windows-layer') : null;
        var w = 0, h = 0;
        if (layer) {
            w = layer.clientWidth;
            h = layer.clientHeight;
        }
        if (!w && root) w = root.clientWidth;
        if (!h && root) h = root.clientHeight;

        var winW = (typeof window !== 'undefined') ? (window.innerWidth || (window.screen && window.screen.availWidth)) : 0;
        var winH = (typeof window !== 'undefined') ? (window.innerHeight || (window.screen && window.screen.availHeight)) : 0;

        if (!w || isNaN(w) || w < 640) w = Math.max(winW || 0, 1024);
        if (!h || isNaN(h) || h < 400) h = Math.max((winH ? winH - 48 : 0), 720);

        return {
            width: Math.max(800, Math.round(w)),
            height: Math.max(500, Math.round(h))
        };
    }

    function notifyChange() {
        for (var i = 0; i < changeListeners.length; i++) {
            try { changeListeners[i](); } catch (e) { }
        }
    }

    function updateCaptions(win) {
        if (!win) return;
        var maxBtn = win.el.querySelector('[data-cap="max"]');
        if (maxBtn) {
            var isMax = win.isMaximized;
            maxBtn.innerHTML = global.Win11Icons.get(isMax ? 'winRestore' : 'winMax', 12);
            maxBtn.title = global.Win11I18N.t(isMax ? 'taskbar.restore' : 'taskbar.maximize');
        }
    }

    function applyRect(win) {
        if (!win || !win.el) return;
        var area = getWorkArea();
        var minW = Math.max(380, Number(win.minW) || 380);
        var minH = Math.max(260, Number(win.minH) || 280);

        // Enforce inline CSS min-width/min-height to prevent 0x0 window dimensions
        win.el.style.minWidth = minW + 'px';
        win.el.style.minHeight = minH + 'px';
        win.el.style.display = 'flex';
        win.el.style.visibility = 'visible';

        if (win.isMaximized) {
            var maxW = Math.max(minW, area.width);
            var maxH = Math.max(minH, area.height);
            win.el.style.left = '0px';
            win.el.style.top = '0px';
            win.el.style.width = maxW + 'px';
            win.el.style.height = maxH + 'px';
            win.el.classList.add('is-maximized');
        } else if (win.snapRect) {
            var snapW = Math.max(minW, Math.round(win.snapRect.w * area.width));
            var snapH = Math.max(minH, Math.round(win.snapRect.h * area.height));
            var snapX = Math.round(win.snapRect.x * area.width);
            var snapY = Math.round(win.snapRect.y * area.height);
            win.el.style.left = snapX + 'px';
            win.el.style.top = snapY + 'px';
            win.el.style.width = snapW + 'px';
            win.el.style.height = snapH + 'px';
            win.el.classList.remove('is-maximized');
            win.el.classList.add('is-snapped');
        } else {
            win.el.classList.remove('is-maximized', 'is-snapped');
            if (!win.rect || typeof win.rect !== 'object') {
                win.rect = {};
            }
            var targetW = Number(win.rect.w);
            if (!targetW || isNaN(targetW) || targetW < minW) {
                targetW = Math.min(Math.max(minW, 880), area.width - 24);
            }
            var targetH = Number(win.rect.h);
            if (!targetH || isNaN(targetH) || targetH < minH) {
                targetH = Math.min(Math.max(minH, 600), area.height - 20);
            }

            var effMinW = Math.min(minW, Math.max(340, area.width - 24));
            var effMinH = Math.min(minH, Math.max(240, area.height - 24));
            var w = Math.max(minW, global.Win11Compat.clamp(targetW, effMinW, area.width));
            var h = Math.max(minH, global.Win11Compat.clamp(targetH, effMinH, area.height));
            var x = global.Win11Compat.clamp(Number(win.rect.x) || 0, 0, Math.max(0, area.width - w));
            var y = global.Win11Compat.clamp(Number(win.rect.y) || 0, 0, Math.max(0, area.height - h));

            win.rect.w = w;
            win.rect.h = h;
            win.rect.x = x;
            win.rect.y = y;

            win.el.style.left = Math.round(x) + 'px';
            win.el.style.top = Math.round(y) + 'px';
            win.el.style.width = Math.round(w) + 'px';
            win.el.style.height = Math.round(h) + 'px';
        }
        updateCaptions(win);
    }

    function focusWindow(id) {
        var s = S();
        var win = s.windows[id];
        if (!win) return;

        // Switch desktop automatically if window lives on another virtual desktop
        if (win.desktopId !== s.activeDesktop) {
            switchDesktop(win.desktopId);
        }
        if (win.isMinimized) {
            win.isMinimized = false;
            win.el.classList.remove('is-minimized');
            win.el.style.display = 'flex';
            applyRect(win);
        }
        s.topZ += 1;
        if (s.topZ > 800) {
            // Re-normalize stack cleanly to avoid approaching flyout & HUD z-index layers
            var base = 310;
            for (var j = 0; j < s.windowOrder.length; j++) {
                var wObj = s.windows[s.windowOrder[j]];
                if (wObj) wObj.el.style.zIndex = base++;
            }
            s.topZ = base + 1;
        }
        for (var k in s.windows) {
            if (Object.prototype.hasOwnProperty.call(s.windows, k)) {
                s.windows[k].el.classList.remove('is-active');
            }
        }
        win.el.classList.add('is-active');
        win.el.style.zIndex = s.topZ;

        var hud = document.getElementById('pedagogy-hud');
        if (hud) {
            hud.classList.remove('is-active');
            hud.style.zIndex = '850';
        }

        var idx = s.windowOrder.indexOf(id);
        if (idx !== -1) s.windowOrder.splice(idx, 1);
        s.windowOrder.push(id);

        s.showDesktopSavedIds = null;
        notifyChange();
    }

    function createWindowElement(win) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var el = document.createElement('div');
        el.className = 'win-window win-mica';
        el.setAttribute('data-win-id', win.id);
        el.setAttribute('role', 'dialog');
        el.style.display = 'flex';
        el.style.visibility = 'visible';

        // Title Bar (32px)
        var titleBar = document.createElement('div');
        titleBar.className = 'win-titlebar';

        var titleMain = document.createElement('div');
        titleMain.className = 'win-titlebar-main';

        if (win.hasBack) {
            var backBtn = document.createElement('button');
            backBtn.type = 'button';
            backBtn.className = 'win-titlebar-back win-nav-back';
            backBtn.disabled = true;
            backBtn.innerHTML = global.Win11Icons.get('arrowBack', 14);
            backBtn.onclick = function (e) {
                e.stopPropagation();
                if (typeof win.onBack === 'function') win.onBack();
            };
            win.backBtn = backBtn;
            titleMain.appendChild(backBtn);
        }

        var iconEl = document.createElement('span');
        iconEl.className = 'win-titlebar-icon';
        iconEl.innerHTML = global.Win11Icons.get(win.icon || 'settings', 16);
        titleMain.appendChild(iconEl);

        var titleSpan = document.createElement('span');
        titleSpan.className = 'win-titlebar-title';
        titleSpan.innerHTML = global.Win11I18N.bidiHtml(win.title);
        win.titleEl = titleSpan;
        titleMain.appendChild(titleSpan);

        var controls = document.createElement('div');
        controls.className = 'win-titlebar-controls';

        var minBtn = document.createElement('button');
        minBtn.type = 'button';
        minBtn.className = 'win-caption-btn';
        minBtn.setAttribute('data-cap', 'min');
        minBtn.title = t('taskbar.minimize');
        minBtn.innerHTML = global.Win11Icons.get('winMin', 11);
        minBtn.onclick = function (e) {
            e.stopPropagation();
            minimizeWindow(win.id);
        };

        var maxBtn = document.createElement('button');
        maxBtn.type = 'button';
        maxBtn.className = 'win-caption-btn';
        maxBtn.setAttribute('data-cap', 'max');
        maxBtn.title = t('taskbar.maximize');
        maxBtn.innerHTML = global.Win11Icons.get('winMax', 11);
        maxBtn.onclick = function (e) {
            e.stopPropagation();
            toggleMaximize(win.id);
        };

        // Attach Snap Layouts hover trigger onto Maximize button
        if (global.Win11Snap) {
            global.Win11Snap.bindMaximizeButton(win, maxBtn);
        }

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'win-caption-btn is-close';
        closeBtn.setAttribute('data-cap', 'close');
        closeBtn.title = t('taskbar.closeWin');
        closeBtn.innerHTML = global.Win11Icons.get('winClose', 11);
        closeBtn.onclick = function (e) {
            e.stopPropagation();
            closeWindow(win.id);
        };

        controls.appendChild(minBtn);
        controls.appendChild(maxBtn);
        controls.appendChild(closeBtn);

        titleBar.appendChild(titleMain);
        titleBar.appendChild(controls);

        var body = document.createElement('div');
        body.className = 'win-window-body';
        win.bodyEl = body;

        el.appendChild(titleBar);
        el.appendChild(body);

        // 8-edge resize handles
        var edges = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
        for (var i = 0; i < edges.length; i++) {
            (function (edge) {
                var h = document.createElement('div');
                h.className = 'win-resize-handle win-resize-' + edge;
                bindResizeHandle(win, h, edge);
                el.appendChild(h);
            })(edges[i]);
        }

        // Bring to front on pointer down anywhere on window
        el.addEventListener('mousedown', function () {
            focusWindow(win.id);
            if (global.Win11Shell) global.Win11Shell.closeAllFlyouts();
        });

        // Drag title bar & double-click maximize
        bindDragTitleBar(win, titleMain);

        return el;
    }

    function bindDragTitleBar(win, handle) {
        handle.addEventListener('dblclick', function (e) {
            if (global.Win11Compat.closest(e.target, 'button')) return;
            toggleMaximize(win.id);
        });

        handle.addEventListener('mousedown', function (e) {
            if (e.button !== 0 || global.Win11Compat.closest(e.target, 'button')) return;
            e.preventDefault();
            focusWindow(win.id);

            var startX = e.clientX;
            var startY = e.clientY;
            var origRect = { x: win.rect.x, y: win.rect.y, w: win.rect.w, h: win.rect.h };
            var wasMaximizedOrSnapped = win.isMaximized || !!win.snapRect;
            var startedDrag = false;
            var area = getWorkArea();

            function onMove(ev) {
                var dx = ev.clientX - startX;
                var dy = ev.clientY - startY;
                if (!startedDrag && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                    startedDrag = true;
                    win.el.classList.add('is-dragging');
                    if (wasMaximizedOrSnapped) {
                        win.isMaximized = false;
                        win.snapRect = null;
                        origRect.x = global.Win11Compat.clamp(ev.clientX - (origRect.w / 2), 0, area.width - origRect.w);
                        origRect.y = Math.max(0, ev.clientY - 16);
                        startX = ev.clientX;
                        startY = ev.clientY;
                        dx = 0;
                        dy = 0;
                    }
                }
                if (!startedDrag) return;
                win.rect.x = origRect.x + dx;
                win.rect.y = Math.max(0, origRect.y + dy);
                applyRect(win);

                if (global.Win11Snap && global.Win11State.get().snapWindowsEnabled) {
                    global.Win11Snap.onWindowDragMove(ev.clientX, ev.clientY);
                }
            }

            function onUp(ev) {
                global.removeEventListener('mousemove', onMove);
                global.removeEventListener('mouseup', onUp);
                win.el.classList.remove('is-dragging');
                if (startedDrag && global.Win11Snap && global.Win11State.get().snapWindowsEnabled) {
                    var snapped = global.Win11Snap.onWindowDragEnd(win, ev.clientX, ev.clientY);
                    if (snapped) {
                        applyRect(win);
                    }
                }
            }

            global.addEventListener('mousemove', onMove);
            global.addEventListener('mouseup', onUp);
        });
    }

    function bindResizeHandle(win, handle, edge) {
        handle.addEventListener('mousedown', function (e) {
            if (e.button !== 0 || win.isMaximized) return;
            e.preventDefault();
            e.stopPropagation();
            focusWindow(win.id);

            win.snapRect = null;
            win.el.classList.add('is-resizing');

            var startX = e.clientX;
            var startY = e.clientY;
            var area = getWorkArea();
            var startRect = {
                x: win.el.offsetLeft,
                y: win.el.offsetTop,
                w: win.el.offsetWidth,
                h: win.el.offsetHeight
            };

            function onMove(ev) {
                var dx = ev.clientX - startX;
                var dy = ev.clientY - startY;
                var nx = startRect.x;
                var ny = startRect.y;
                var nw = startRect.w;
                var nh = startRect.h;

                if (edge.indexOf('e') !== -1) {
                    nw = global.Win11Compat.clamp(startRect.w + dx, win.minW, area.width - nx);
                }
                if (edge.indexOf('s') !== -1) {
                    nh = global.Win11Compat.clamp(startRect.h + dy, win.minH, area.height - ny);
                }
                if (edge.indexOf('w') !== -1) {
                    var maxLeftShift = startRect.w - win.minW;
                    var shiftX = global.Win11Compat.clamp(dx, -startRect.x, maxLeftShift);
                    nx = startRect.x + shiftX;
                    nw = startRect.w - shiftX;
                }
                if (edge.indexOf('n') !== -1) {
                    var maxTopShift = startRect.h - win.minH;
                    var shiftY = global.Win11Compat.clamp(dy, -startRect.y, maxTopShift);
                    ny = startRect.y + shiftY;
                    nh = startRect.h - shiftY;
                }

                win.rect = { x: nx, y: ny, w: nw, h: nh };
                applyRect(win);
            }

            function onUp() {
                global.removeEventListener('mousemove', onMove);
                global.removeEventListener('mouseup', onUp);
                win.el.classList.remove('is-resizing');
                if (typeof win.onResize === 'function') win.onResize(win);
            }

            global.addEventListener('mousemove', onMove);
            global.addEventListener('mouseup', onUp);
        });
    }

    function openWindow(cfg) {
        var s = S();
        var id = cfg.id;
        if (s.windows[id]) {
            var existingWin = s.windows[id];
            var targetLayer = getLayer();
            if (existingWin.el && targetLayer && existingWin.el.parentNode !== targetLayer) {
                targetLayer.appendChild(existingWin.el);
            }
            if (existingWin.isMinimized) {
                existingWin.isMinimized = false;
                existingWin.el.classList.remove('is-minimized');
                existingWin.el.style.display = 'flex';
            }
            if (cfg.rect && typeof cfg.rect === 'object') {
                existingWin.rect = {
                    x: (typeof cfg.rect.x === 'number') ? cfg.rect.x : existingWin.rect.x,
                    y: (typeof cfg.rect.y === 'number') ? cfg.rect.y : existingWin.rect.y,
                    w: (typeof cfg.rect.w === 'number') ? cfg.rect.w : existingWin.rect.w,
                    h: (typeof cfg.rect.h === 'number') ? cfg.rect.h : existingWin.rect.h
                };
            }
            applyRect(existingWin);
            if (typeof cfg.onReuse === 'function') cfg.onReuse(existingWin);
            focusWindow(id);
            return existingWin;
        }

        var area = getWorkArea();
        var count = s.windowOrder.length;
        var minW = Math.max(380, cfg.minWidth || 380);
        var minH = Math.max(260, cfg.minHeight || 280);
        var defW = Math.max(minW, Math.min(cfg.width || 920, area.width));
        var defH = Math.max(minH, Math.min(cfg.height || 620, area.height));
        var offset = (count % 5) * 26;
        var defX = (typeof cfg.x === 'number') ? cfg.x : Math.max(0, Math.round((area.width - defW) / 2) + offset);
        var defY = (typeof cfg.y === 'number') ? cfg.y : Math.max(0, Math.round((area.height - defH) / 2) + offset);

        if (cfg.rect && typeof cfg.rect === 'object') {
            if (typeof cfg.rect.x === 'number') defX = cfg.rect.x;
            if (typeof cfg.rect.y === 'number') defY = cfg.rect.y;
            if (typeof cfg.rect.w === 'number') defW = cfg.rect.w;
            if (typeof cfg.rect.h === 'number') defH = cfg.rect.h;
        }

        var win = {
            id: id,
            appId: cfg.appId || id,
            title: cfg.title || id,
            titleKey: cfg.titleKey || null,
            icon: cfg.icon || 'settings',
            hasBack: !!cfg.hasBack,
            onBack: cfg.onBack || null,
            onResize: cfg.onResize || null,
            onClose: cfg.onClose || null,
            desktopId: s.activeDesktop,
            rect: { x: defX, y: defY, w: defW, h: defH },
            minW: minW,
            minH: minH,
            isMaximized: !!cfg.maximized,
            isMinimized: false,
            snapRect: null
        };

        win.el = createWindowElement(win);
        s.windows[id] = win;
        s.windowOrder.push(id);
        var curLayer = getLayer();
        if (curLayer) {
            curLayer.appendChild(win.el);
        } else {
            var rootEl = (typeof document !== 'undefined') ? (document.getElementById('windows-layer') || document.body) : null;
            if (rootEl) rootEl.appendChild(win.el);
        }
        applyRect(win);

        if (typeof cfg.render === 'function') {
            try {
                cfg.render(win.bodyEl, win);
            } catch (errRender) {
                if (global.console && global.console.error) {
                    global.console.error('[openWindow.render] Error rendering window ' + id, errRender);
                }
            }
        }

        focusWindow(id);
        notifyChange();
        return win;
    }

    function closeWindow(id) {
        var s = S();
        var win = s.windows[id];
        if (!win) return;
        if (typeof win.onClose === 'function') {
            win.onClose(win);
        }
        if (win.el && win.el.parentNode) {
            win.el.parentNode.removeChild(win.el);
        }
        delete s.windows[id];
        var idx = s.windowOrder.indexOf(id);
        if (idx !== -1) s.windowOrder.splice(idx, 1);

        // Focus next topmost window on active desktop
        for (var i = s.windowOrder.length - 1; i >= 0; i--) {
            var next = s.windows[s.windowOrder[i]];
            if (next && next.desktopId === s.activeDesktop && !next.isMinimized) {
                focusWindow(next.id);
                break;
            }
        }
        notifyChange();
    }

    function minimizeWindow(id) {
        var s = S();
        var win = s.windows[id];
        if (!win) return;
        win.isMinimized = true;
        win.el.classList.add('is-minimized');
        win.el.classList.remove('is-active');
        notifyChange();
    }

    function toggleMaximize(id) {
        var s = S();
        var win = s.windows[id];
        if (!win) return;
        win.isMaximized = !win.isMaximized;
        win.snapRect = null;
        applyRect(win);
        focusWindow(id);
        if (typeof win.onResize === 'function') win.onResize(win);
    }

    function snapWindow(id, snapRect) {
        var s = S();
        var win = s.windows[id];
        if (!win) return;
        win.isMaximized = (snapRect.x === 0 && snapRect.y === 0 && snapRect.w === 1 && snapRect.h === 1);
        win.snapRect = win.isMaximized ? null : snapRect;
        win.isMinimized = false;
        win.el.classList.remove('is-minimized');
        applyRect(win);
        focusWindow(id);
        if (typeof win.onResize === 'function') win.onResize(win);
    }

    function toggleAppWindow(id, factoryFn) {
        var s = S();
        var win = s.windows[id];
        if (!win) {
            factoryFn();
            return;
        }
        if (win.desktopId !== s.activeDesktop) {
            focusWindow(id);
            return;
        }
        var isTopActive = (s.windowOrder[s.windowOrder.length - 1] === id) && !win.isMinimized;
        if (isTopActive) {
            minimizeWindow(id);
        } else {
            focusWindow(id);
        }
    }

    function toggleShowDesktop() {
        var s = S();
        var activeWins = getDesktopWindows(s.activeDesktop);
        if (s.showDesktopSavedIds) {
            for (var i = 0; i < s.showDesktopSavedIds.length; i++) {
                var w = s.windows[s.showDesktopSavedIds[i]];
                if (w) {
                    w.isMinimized = false;
                    w.el.classList.remove('is-minimized');
                }
            }
            var last = s.showDesktopSavedIds[s.showDesktopSavedIds.length - 1];
            s.showDesktopSavedIds = null;
            if (last && s.windows[last]) focusWindow(last);
        } else {
            var saved = [];
            for (var j = 0; j < activeWins.length; j++) {
                if (!activeWins[j].isMinimized) {
                    saved.push(activeWins[j].id);
                    activeWins[j].isMinimized = true;
                    activeWins[j].el.classList.add('is-minimized');
                    activeWins[j].el.classList.remove('is-active');
                }
            }
            if (saved.length > 0) s.showDesktopSavedIds = saved;
        }
        notifyChange();
    }

    function getDesktopWindows(desktopId) {
        var s = S();
        var out = [];
        for (var i = 0; i < s.windowOrder.length; i++) {
            var w = s.windows[s.windowOrder[i]];
            if (w && w.desktopId === desktopId) out.push(w);
        }
        return out;
    }

    function switchDesktop(desktopId) {
        var s = S();
        s.activeDesktop = desktopId;
        for (var k in s.windows) {
            if (Object.prototype.hasOwnProperty.call(s.windows, k)) {
                var w = s.windows[k];
                w.el.style.display = (w.desktopId === s.activeDesktop) ? 'flex' : 'none';
            }
        }
        notifyChange();
    }

    function addDesktop() {
        var s = S();
        var nextId = s.desktops.length > 0 ? s.desktops[s.desktops.length - 1].id + 1 : 0;
        s.desktops.push({ id: nextId });
        notifyChange();
        return nextId;
    }

    function moveWindowToDesktop(winId, targetDesktopId) {
        var s = S();
        var w = s.windows[winId];
        if (!w) return;
        w.desktopId = targetDesktopId;
        switchDesktop(s.activeDesktop);
        notifyChange();
    }

    function setTitle(id, titleText) {
        var w = S().windows[id];
        if (!w) return;
        w.title = titleText;
        if (w.titleEl) w.titleEl.innerHTML = global.Win11I18N.bidiHtml(titleText);
    }

    function setBackEnabled(id, enabled) {
        var w = S().windows[id];
        if (w && w.backBtn) w.backBtn.disabled = !enabled;
    }

    function refreshAllLayouts() {
        var s = S();
        var curLayer = getLayer();
        for (var k in s.windows) {
            if (Object.prototype.hasOwnProperty.call(s.windows, k)) {
                var w = s.windows[k];
                if (w && w.el && curLayer && w.el.parentNode !== curLayer) {
                    try { curLayer.appendChild(w.el); } catch (eAtt) { }
                }
                applyRect(w);
            }
        }
    }

    function closeAllWindows() {
        var s = S();
        if (!s || !s.windows) return;
        var ids = Object.keys(s.windows);
        for (var i = 0; i < ids.length; i++) {
            try {
                closeWindow(ids[i]);
            } catch (eCl) { }
        }
    }

    global.addEventListener('resize', global.Win11Compat.debounce(refreshAllLayouts, 80));

    global.Win11WM = {
        open: openWindow,
        close: closeWindow,
        closeAllWindows: closeAllWindows,
        focus: focusWindow,
        minimize: minimizeWindow,
        toggleMaximize: toggleMaximize,
        snap: snapWindow,
        toggleAppWindow: toggleAppWindow,
        toggleShowDesktop: toggleShowDesktop,
        syncSession: function () { refreshAllLayouts(); notifyChange(); },
        getWindow: function (id) { return S().windows[id] || null; },
        getAllWindows: function () {
            var s = S();
            var res = [];
            for (var i = 0; i < s.windowOrder.length; i++) {
                if (s.windows[s.windowOrder[i]]) res.push(s.windows[s.windowOrder[i]]);
            }
            return res;
        },
        getTopWindow: function () {
            var s = S();
            for (var i = s.windowOrder.length - 1; i >= 0; i--) {
                var w = s.windows[s.windowOrder[i]];
                if (w && w.desktopId === s.activeDesktop && !w.isMinimized) return w;
            }
            return null;
        },
        getDesktops: function () { return S().desktops; },
        getActiveDesktop: function () { return S().activeDesktop; },
        switchDesktop: switchDesktop,
        addDesktop: addDesktop,
        moveWindowToDesktop: moveWindowToDesktop,
        setTitle: setTitle,
        setBackEnabled: setBackEnabled,
        onChange: function (fn) { changeListeners.push(fn); }
    };
})(window);

