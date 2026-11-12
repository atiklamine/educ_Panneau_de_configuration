/**
 * Isolated Per-User OS Session Manager (RAM-only, Zero Disk Persistence)
 * Models Windows 11 multi-user session suspension/restoration and ephemeral Guest profiles.
 */
(function (global) {
    'use strict';

    var sessions = {};
    var activeUserKey = null;

    function normKey(username) {
        return String(username || '').trim().toLowerCase();
    }

    function createDefaultUserFiles(username, isGuest) {
        var uFolder = isGuest ? 'Invite' : (username || 'MENIAI');
        var list = [
            { id: 'doc_tp_1as', name: 'TP_Windows11_1AS.txt', folder: 'documents', type: 'text', content: 'Fiche TP 1AS - Environnement Windows 11 (' + uFolder + ')' },
            { id: 'doc_cours', name: 'Cours_Systeme_Win11.txt', folder: 'documents', type: 'text', content: 'Support de cours informatique 1AS' },
            { id: 'dl_setup', name: 'Guide_Installation.txt', folder: 'downloads', type: 'text', content: 'Note d installation hors-ligne' },
            { id: 'desk_notes', name: 'Notes_' + uFolder + '.txt', folder: 'desktop', type: 'text', content: 'Workspace notes for ' + uFolder },
            { id: 'pic_sahara', name: 'Sahara_Sunset.jpg', folder: 'pictures', type: 'image', imgPath: 'bg/013.jpg', content: 'C:\\Users\\' + uFolder + '\\Pictures\\Sahara_Sunset.jpg' },
            { id: 'pic_casbah', name: 'Casbah_Alger.jpg', folder: 'pictures', type: 'image', imgPath: 'bg/014.jpg', content: 'C:\\Users\\' + uFolder + '\\Pictures\\Casbah_Alger.jpg' },
            { id: 'pic_readme', name: 'LisezMoi.txt', folder: 'pictures', type: 'text', content: 'Sélectionnez une image JPG pour personnaliser le Bureau.' }
        ];
        if (!isGuest) {
            list.push({
                id: 'desk_setup_exe',
                name: 'LabTools_Setup.exe',
                folder: 'desktop',
                type: 'installer',
                size: '14.2 MB',
                content: 'LabTools 1AS v2.4 Setup Package'
            });
        }
        return list;
    }

    function createDefaultUserApps() {
        return [
            { id: 'u_terminal', name: 'Windows Terminal', publisher: 'Microsoft Corporation', size: '14 MB', installed: true },
            { id: 'u_notepad', name: 'Bloc-notes (Notepad 11)', publisher: 'Microsoft Corporation', size: '6 MB', installed: true },
            { id: 'u_calc', name: 'Calculatrice Windows', publisher: 'Microsoft Corporation', size: '8 MB', installed: true },
            { id: 'u_paint', name: 'Paint (Win11)', publisher: 'Microsoft Corporation', size: '24 MB', installed: false }
        ];
    }

    function createDefaultNotifications() {
        return [
            { id: 'n1', titleKey: 'notif.welcomeTitle', bodyKey: 'notif.welcomeBody', time: '10:00' },
            { id: 'n2', titleKey: 'notif.securityTitle', bodyKey: 'notif.securityBody', time: '10:02' }
        ];
    }

    function createProfileDefaults(username, userType) {
        var isGuest = (userType === 'Invité');
        return {
            wallpaperId: 'bg_00',
            customWallpaper: null,
            wallpaperBrowseMeta: { usedBrowse: false, selectedFolder: null, selectedPath: '' },
            themeMode: 'light',
            accentColor: '#0067C0',
            transparency: true,
            highContrast: false,
            reducedMotion: false,
            textScale: 100,
            brightness: 100,
            nightLight: false,
            resolution: '1920 x 1080',
            orientation: 'landscape',
            snapWindowsEnabled: true,
            desktopIconSize: 'medium',
            desktopSort: 'default',
            taskbarAlign: 'center',
            taskbarShowSearch: true,
            taskbarShowTaskView: true,
            startShowRecommended: true,
            screenSaver: 'none',
            screenSaverWait: 5,
            soundEnabled: true,
            volume: 75,
            muted: false,
            mouseButtonsInverted: false,
            mouseDoubleClickSpeed: 'Moyenne',
            pointerScheme: 'Standard',
            activeInputLang: 'FR_FR',
            displayLanguage: 'ar',
            uiLanguage: 'ar',
            hasChangedDisplayLanguage: false,
            numerals: 'latin',
            powerMode: 'balanced',
            gameMode: !isGuest,
            dnd: false,
            notifications: createDefaultNotifications(),
            userApps: createDefaultUserApps(),
            userFiles: createDefaultUserFiles(username, isGuest),
            browserHistory: isGuest ? [] : ['intranet://labo-1as.dz/guide'],
            tempData: {}
        };
    }

    function createSessionLayerEl(key) {
        if (typeof document === 'undefined' || !document.createElement) return null;
        var el = document.createElement('div');
        el.className = 'user-session-layer';
        el.setAttribute('data-session-user', key);
        el.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
        return el;
    }

    function createSessionObject(username, userType, nowMs) {
        var key = normKey(username);
        var isGuest = (userType === 'Invité');
        return {
            key: key,
            username: String(username || ''),
            type: userType || 'Standard',
            isGuestTemp: isGuest,
            profile: createProfileDefaults(username, userType),
            wmState: {
                windows: {},
                windowOrder: [],
                topZ: 210,
                activeDesktop: 0,
                desktops: [{ id: 0 }, { id: 1 }],
                showDesktopSavedIds: null,
                layerEl: createSessionLayerEl(key)
            },
            appUi: {
                settings: { currentRoute: { section: 'system', subpage: 'main', anchor: null }, historyStack: [] },
                explorer: { currentLocation: 'this-pc' },
                controlPanel: { viewMode: 'category' },
                edge: { currentUrl: 'intranet://labo-1as.dz/guide' }
            },
            timers: {
                startedAt: nowMs || Date.now(),
                lastResumedAt: null,
                activeMs: 0,
                suspendedMs: 0,
                lastSuspendedAt: null,
                switchCount: 0
            },
            temporaryFilesWipedCount: 0
        };
    }

    function pauseTimer(sess, nowMs) {
        if (!sess || !sess.timers) return;
        if (sess.timers.lastResumedAt !== null) {
            sess.timers.activeMs += Math.max(0, nowMs - sess.timers.lastResumedAt);
            sess.timers.lastResumedAt = null;
        }
        sess.timers.lastSuspendedAt = nowMs;
    }

    function resumeTimer(sess, nowMs) {
        if (!sess || !sess.timers) return;
        if (sess.timers.lastSuspendedAt !== null) {
            sess.timers.suspendedMs += Math.max(0, nowMs - sess.timers.lastSuspendedAt);
            sess.timers.lastSuspendedAt = null;
        }
        if (sess.timers.lastResumedAt === null) {
            sess.timers.lastResumedAt = nowMs;
        }
    }

    function getLiveActiveMs(sess) {
        if (!sess || !sess.timers) return 0;
        var extra = (sess.timers.lastResumedAt !== null) ? Math.max(0, Date.now() - sess.timers.lastResumedAt) : 0;
        return sess.timers.activeMs + extra;
    }

    function ensureSession(username, userType) {
        var key = normKey(username);
        if (!key) return null;
        if (!sessions[key]) {
            sessions[key] = createSessionObject(username, userType, Date.now());
        } else {
            sessions[key].username = String(username || sessions[key].username);
            if (userType) {
                sessions[key].type = userType;
                sessions[key].isGuestTemp = (userType === 'Invité');
            }
            if (!sessions[key].wmState.layerEl) {
                sessions[key].wmState.layerEl = createSessionLayerEl(key);
            }
        }
        return sessions[key];
    }

    function init(defaultUsername, defaultUserType) {
        var root = (typeof document !== 'undefined') ? document.getElementById('windows-layer') : null;
        if (root) root.innerHTML = '';
        sessions = {};
        activeUserKey = null;
        var s = ensureSession(defaultUsername || 'MENIAI', defaultUserType || 'Administrateur');
        activeUserKey = s.key;
        resumeTimer(s, Date.now());
        if (root && s.wmState.layerEl) {
            root.appendChild(s.wmState.layerEl);
        }
        return s;
    }

    function switchUser(fromUsername, toUsername, toUserType) {
        var now = Date.now();
        var fromKey = normKey(fromUsername || activeUserKey);
        var fromSess = sessions[fromKey] || null;
        var wipedGuest = false;

        if (fromSess) {
            pauseTimer(fromSess, now);
            fromSess.timers.switchCount += 1;
            if (fromSess.wmState.layerEl && fromSess.wmState.layerEl.parentNode) {
                fromSess.wmState.layerEl.parentNode.removeChild(fromSess.wmState.layerEl);
            }
            // Real Windows Guest retains session files in C:\Users\Invite across user switches;
            // only cleared when an Administrator explicitly resets/disables the Guest account via resetGuestSession().
        }

        var toSess = ensureSession(toUsername, toUserType);
        activeUserKey = toSess.key;
        resumeTimer(toSess, now);

        var root = (typeof document !== 'undefined') ? document.getElementById('windows-layer') : null;
        if (root && toSess.wmState.layerEl) {
            root.innerHTML = '';
            root.appendChild(toSess.wmState.layerEl);
        }

        return { from: fromSess, to: toSess, wipedGuest: wipedGuest };
    }

    function resetGuestSession(username) {
        var key = normKey(username || 'Invité');
        var s = sessions[key];
        if (!s) return false;
        s.profile.userFiles = createDefaultUserFiles(s.username, true);
        if (s.wmState && s.wmState.layerEl) {
            s.wmState.layerEl.innerHTML = '';
        }
        if (s.wmState) {
            s.wmState.windows = {};
            s.wmState.windowOrder = [];
            s.wmState.activeWindowId = null;
        }
        return true;
    }

    function deleteSession(username) {
        var key = normKey(username);
        if (!key || key === activeUserKey) return false;
        if (sessions[key]) {
            delete sessions[key];
            return true;
        }
        return false;
    }

    function updateSessionType(username, newType) {
        var s = sessions[normKey(username)];
        if (!s) return;
        s.type = newType;
        s.isGuestTemp = (newType === 'Invité');
    }

    function getStats() {
        var out = {};
        for (var k in sessions) {
            if (Object.prototype.hasOwnProperty.call(sessions, k)) {
                var s = sessions[k];
                out[s.username] = {
                    type: s.type,
                    active: (k === activeUserKey),
                    elapsedSeconds: Math.floor(getLiveActiveMs(s) / 1000),
                    openWindowCount: s.wmState.windowOrder.length,
                    switchCount: s.timers.switchCount
                };
            }
        }
        return out;
    }

    global.Win11Sessions = {
        init: init,
        ensureSession: ensureSession,
        switchUser: switchUser,
        resetGuestSession: resetGuestSession,
        deleteSession: deleteSession,
        updateSessionType: updateSessionType,
        getActiveKey: function () { return activeUserKey; },
        getActiveSession: function () { return activeUserKey ? (sessions[activeUserKey] || null) : null; },
        getSession: function (username) { return sessions[normKey(username)] || null; },
        getStats: getStats,
        createProfileDefaults: createProfileDefaults
    };
})(window);

