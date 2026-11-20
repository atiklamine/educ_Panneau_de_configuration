/**
 * Central Reactive Virtual System State (Windows 11 Build 22631 + 1AS Lab Defaults)
 * Bridges machine-wide shared configuration with isolated per-user session namespaces (RAM-only).
 */
(function (global) {
    'use strict';

    var LEGACY_STUDENT_KEYS = ['win11_sim_v2_state'];

    var USER_PROFILE_KEYS = [
        'displayLanguage', 'uiLanguage', 'hasChangedDisplayLanguage', 'numerals', 'themeMode', 'accentColor', 'transparency',
        'highContrast', 'reducedMotion', 'textScale', 'brightness', 'nightLight',
        'resolution', 'orientation', 'snapWindowsEnabled', 'wallpaperId', 'customWallpaper', 'wallpaperBrowseMeta',
        'hasChosenPresetWallpaper', 'hasChosenPicturesWallpaper',
        'desktopIconSize', 'desktopSort', 'taskbarAlign', 'taskbarShowSearch',
        'taskbarShowTaskView', 'startShowRecommended', 'screenSaver', 'screenSaverWait',
        'soundEnabled', 'volume', 'muted', 'mouseButtonsInverted', 'mouseDoubleClickSpeed',
        'pointerScheme', 'activeInputLang', 'powerMode', 'gameMode', 'dnd',
        'notifications', 'userApps', 'userFiles', 'browserHistory', 'tempData'
    ];

    var WALLPAPERS = [
        { id: 'bg_00', file: 'bg/000.jpg', labelKey: 'settings.personalization.defaultTag' },
        { id: 'bg_01', file: 'bg/001.jpeg', label: '001' },
        { id: 'bg_02', file: 'bg/002.png',  label: '002' },
        { id: 'bg_03', file: 'bg/003.jpeg', label: '003' },
        { id: 'bg_04', file: 'bg/004.jpeg', label: '004' },
        { id: 'bg_05', file: 'bg/005.jpeg', label: '005' },
        { id: 'bg_06', file: 'bg/006.jpeg', label: '006' },
        { id: 'bg_07', file: 'bg/007.jpeg', label: '007' },
        { id: 'bg_08', file: 'bg/008.jpeg', label: '008' },
        { id: 'bg_09', file: 'bg/009.jpeg', label: '009' },
        { id: 'bg_10', file: 'bg/010.jpg',  label: '010' },
        { id: 'bg_11', file: 'bg/011.jpg',  label: '011' },
        { id: 'bg_12', file: 'bg/012.jpg',  label: '012' }
    ];

    var ACCENT_PALETTE = [
        { hex: '#0067C0', hover: '#187AD7', pressed: '#004C91', lightText: '#005FB8', darkText: '#60CDFF', tint: 'rgba(0, 103, 192, 0.14)' },
        { hex: '#8764B8', hover: '#9B79CC', pressed: '#634292', lightText: '#744DA9', darkText: '#C7A6FF', tint: 'rgba(135, 100, 184, 0.14)' },
        { hex: '#107C41', hover: '#18914E', pressed: '#0B5A2F', lightText: '#0E6D39', darkText: '#6CCB5F', tint: 'rgba(16, 124, 65, 0.14)' },
        { hex: '#D83B01', hover: '#EA4F17', pressed: '#A82D00', lightText: '#C13400', darkText: '#FF8C61', tint: 'rgba(216, 59, 1, 0.14)' },
        { hex: '#D13438', hover: '#DF4B4F', pressed: '#9F2225', lightText: '#B8292D', darkText: '#FF7A7E', tint: 'rgba(209, 52, 56, 0.14)' },
        { hex: '#008272', hover: '#0D9B8A', pressed: '#005E52', lightText: '#006F61', darkText: '#5EEAD4', tint: 'rgba(0, 130, 114, 0.14)' }
    ];

    var LANGUAGE_CATALOG = [
        { id: 'AR_DZ', code: 'AR', trayTag: 'ARA\nDZ', nameAr: 'العربية (الجزائر)', nameOther: 'Arabe (Algérie) — Arabic', keyboard: 'Clavier Arabe 101' },
        { id: 'AR_SA', code: 'AR', trayTag: 'ARA\nSA', nameAr: 'العربية (السعودية)', nameOther: 'Arabic (Saudi Arabia)', keyboard: 'Clavier Arabe 101' },
        { id: 'AR_EG', code: 'AR', trayTag: 'ARA\nEG', nameAr: 'العربية (مصر)', nameOther: 'Arabic (Egypt)', keyboard: 'Clavier Arabe 101' },
        { id: 'FR_FR', code: 'FR', trayTag: 'FRA\nFR', nameAr: 'الفرنسية (فرنسا)', nameOther: 'Français (France)', keyboard: 'AZERTY Français' },
        { id: 'FR_CA', code: 'FR', trayTag: 'FRA\nCA', nameAr: 'الفرنسية (كندا)', nameOther: 'Français (Canada)', keyboard: 'Canadien Français' },
        { id: 'EN_US', code: 'EN', trayTag: 'ENG\nUS', nameAr: 'الإنجليزية (الولايات المتحدة)', nameOther: 'English (United States)', keyboard: 'QWERTY US' },
        { id: 'EN_GB', code: 'EN', trayTag: 'ENG\nGB', nameAr: 'الإنجليزية (المملكة المتحدة)', nameOther: 'English (United Kingdom)', keyboard: 'QWERTY UK' },
        { id: 'ES_ES', code: 'ES', trayTag: 'ESP\nES', nameAr: 'الإسبانية (إسبانيا)', nameOther: 'Español (España)', keyboard: 'QWERTY Español' },
        { id: 'DE_DE', code: 'DE', trayTag: 'DEU\nDE', nameAr: 'الألمانية (ألمانيا)', nameOther: 'Deutsch (Deutschland)', keyboard: 'QWERTZ Deutsch' }
    ];

    function makeSvgAvatar(bgHex, accentHex, shapeSvg) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
            '<rect width="64" height="64" rx="32" fill="' + bgHex + '"/>' +
            '<circle cx="32" cy="32" r="28" fill="' + accentHex + '" opacity="0.22"/>' +
            shapeSvg +
            '</svg>';
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    var AVATAR_GALLERY = [
        { id: 'avatar_admin',   labelAr: 'درع الحاسوب',   src: makeSvgAvatar('#0067C0', '#93C5FD', '<circle cx="32" cy="23" r="10" fill="#FFFFFF"/><path d="M16 51c1-9 8-14 16-14s15 5 16 14" fill="#FFFFFF"/>') },
        { id: 'avatar_student', labelAr: 'تلميذ Info',    src: makeSvgAvatar('#107C41', '#86EFAC', '<polygon points="32,12 10,23 32,34 54,23" fill="#FFFFFF"/><path d="M18 29v10c0 5 6 9 14 9s14-4 14-9V29" fill="#DCFCE7"/>') },
        { id: 'avatar_violet',  labelAr: 'نجمة رقمية',   src: makeSvgAvatar('#7C3AED', '#DDD6FE', '<polygon points="32,12 37,25 51,26 40,35 44,49 32,41 20,49 24,35 13,26 27,25" fill="#FFFFFF"/>') },
        { id: 'avatar_amber',   labelAr: 'شمس التفاؤل',  src: makeSvgAvatar('#D97706', '#FDE68A', '<circle cx="32" cy="32" r="12" fill="#FFFFFF"/><circle cx="32" cy="32" r="6" fill="#F59E0B"/>') },
        { id: 'avatar_teal',    labelAr: 'موج أزرق',     src: makeSvgAvatar('#0F766E', '#99F6E4', '<path d="M12 36q10-12 20 0t20 0v12H12z" fill="#FFFFFF"/><circle cx="24" cy="21" r="6" fill="#CCFBF1"/>') },
        { id: 'avatar_rose',    labelAr: 'إبداع هندسي',  src: makeSvgAvatar('#BE123C', '#FECDD3', '<rect x="19" y="19" width="26" height="26" rx="6" transform="rotate(15 32 32)" fill="#FFFFFF"/>') }
    ];

    function createDefaultData() {
        return {
            displayLanguage: 'ar',
            uiLanguage: 'ar',
            hasChangedDisplayLanguage: false,
            numerals: 'latin',
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
            deviceName: 'LABO-PC05',
            wallpaperId: 'bg_00',
            customWallpaper: null,
            wallpaperBrowseMeta: { usedBrowse: false, selectedFolder: null, selectedPath: '' },
            hasChosenPresetWallpaper: false,
            hasChosenPicturesWallpaper: false,
            userWallpapers: { 'MENIAI': 'bg_00' },
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
            wifiEnabled: true,
            activeWifi: 'Labo-Informatique-1AS',
            bluetoothEnabled: true,
            airplaneMode: false,
            batterySaver: false,
            batteryPercent: 86,
            vpnEnabled: false,
            proxyEnabled: false,
            mouseButtonsInverted: false,
            mouseDoubleClickSpeed: 'Moyenne',
            pointerScheme: 'Standard',
            installedLanguages: [
                { id: 'FR_FR', code: 'FR', trayTag: 'FRA\nFR', display: 'Français (France)', keyboard: 'AZERTY Français' }
            ],
            activeInputLang: 'FR_FR',
            timeZoneOffset: 0,
            timeZoneId: 'GMT+0',
            autoTime: true,
            powerMode: 'balanced',
            gameMode: true,
            privacy: { location: true, camera: true, microphone: true },
            dnd: false,
            notifications: [
                { id: 'n1', titleKey: 'notif.welcomeTitle', bodyKey: 'notif.welcomeBody', time: '10:00' },
                { id: 'n2', titleKey: 'notif.securityTitle', bodyKey: 'notif.securityBody', time: '10:02' }
            ],
            installedPrograms: [
                { id: 'adobe_flash', name: 'Adobe Flash Player 16 ActiveX', publisher: 'Adobe Systems Incorporated', date: '2015/01/05', size: '18.5 MB', color: '#D9381E', startupIds: [] },
                { id: 'adobe_reader', name: 'Adobe Reader 9.3 - Français', publisher: 'Adobe Systems Incorporated', date: '2015/01/04', size: '112 MB', color: '#E53935', startupIds: [] },
                { id: 'avast_antivirus', name: 'AVAST! Internet Security', publisher: 'AVAST Software', date: '2015/01/05', size: '240 MB', color: '#EA580C', startupIds: ['avast_tray'] },
                { id: 'ms_office', name: 'Microsoft Office Professionnel Plus 2010', publisher: 'Microsoft Corporation', date: '2015/01/04', size: '850 MB', color: '#D83B01', startupIds: [] },
                { id: 'vlc_player', name: 'VLC media player 2.0.5', publisher: 'VideoLAN', date: '2015/01/04', size: '42 MB', color: '#F59E0B', startupIds: [] },
                { id: 'winrar', name: 'WinRAR 4.01 (32-bit)', publisher: 'win.rar GmbH', date: '2015/01/04', size: '4.8 MB', color: '#107C41', startupIds: [] }
            ],
            startupApps: [
                { id: 'onedrive', appId: 'onedrive', name: 'Microsoft OneDrive', publisher: 'Microsoft Corporation', enabled: true },
                { id: 'edge_boot', appId: 'edge', name: 'Microsoft Edge Background Helper', publisher: 'Microsoft Corporation', enabled: true },
                { id: 'avast_tray', appId: 'avast_antivirus', name: 'AVAST! Tray Shield', publisher: 'AVAST Software', enabled: false }
            ],
            userAccounts: [
                { name: 'MENIAI', type: 'Administrateur', hasPassword: false, password: '', enabled: true, customAvatar: false, avatarId: 'avatar_admin', avatarSrc: '', color: '#0067C0', isOriginalAdmin: true, createdSeq: 0 },
                { name: 'Invité', type: 'Invité', hasPassword: false, password: '', enabled: false, customAvatar: false, avatarId: '', avatarSrc: '', color: '#64748B', isOriginalAdmin: false, createdSeq: 0 }
            ],
            optionalFeatures: [
                { id: 'paint', name: 'Paint', nameAr: 'الرسام (Paint)', nameFr: 'Paint', nameEn: 'Paint', icon: 'paint', color: '#E11D48', installed: false },
                { id: 'notepad', name: 'Notepad', nameAr: 'المفكرة (Notepad)', nameFr: 'Bloc-notes (Notepad)', nameEn: 'Notepad', icon: 'notepad', color: '#0284C7', installed: false },
                { id: 'games', name: 'Windows Games', nameAr: 'ألعاب Windows الكلاسيكية (Games)', nameFr: 'Jeux Windows', nameEn: 'Windows Games', icon: 'games', color: '#7C3AED', installed: false }
            ],
            setupFlow: {
                installed: false,
                openedApp: false,
                closedApp: false,
                verifiedInstalled: false,
                uninstalled: false,
                verifiedUninstalled: false,
                verifiedGoneInStart: false
            },
            featureFlow: {
                enabledOnce: false,
                openedApp: false,
                closedApp: false,
                lastOpenedFeatId: null,
                verifiedInStart: false,
                disabledAfterEnable: false,
                verifiedGoneInStart: false
            },
            accountActionLog: [],
            accountScenario: {
                seqCounter: 0,
                standardCreatedNames: [],
                standardDeletedNames: [],
                adminCreatedNames: [],
                adminDeletedNames: [],
                guestEnabledOnce: false,
                guestSwitchedOnce: false,
                guestBlockedTriggered: false,
                pwStandardUser: null,
                pwStandardInitial: '',
                pwChangedTargetUser: null,
                originalAdminDeleted: false,
                loggedInStdInitial: false,
                signedOutStdAfterInitial: false,
                adminChangedStdPw: false,
                loggedInStdNewPw: false,
                avatarChangedOnce: false,
                stepA: false,
                stepB: false,
                stepC: false,
                stepD: false,
                stepE: false,
                stepF: false,
                stepG: false,
                stepH: false
            },
            currentUser: 'MENIAI',
            hasSwitchedUser: false,
            hasChangedWallpaperInNewAccount: false,
            hasReturnedToAdminAccount: false
        };
    }

    var data = createDefaultData();
    var subscribers = {};

    function purgeLegacyStudentPersistence() {
        for (var i = 0; i < LEGACY_STUDENT_KEYS.length; i++) {
            try {
                if (global.Win11Compat) global.Win11Compat.storageRemove(LEGACY_STUDENT_KEYS[i]);
                if (global.localStorage) global.localStorage.removeItem(LEGACY_STUDENT_KEYS[i]);
                if (global.sessionStorage) global.sessionStorage.removeItem(LEGACY_STUDENT_KEYS[i]);
            } catch (e) { }
        }
    }

    function syncDataToSession(sess) {
        if (!sess || !sess.profile) return;
        for (var i = 0; i < USER_PROFILE_KEYS.length; i++) {
            var k = USER_PROFILE_KEYS[i];
            if (Object.prototype.hasOwnProperty.call(data, k)) {
                sess.profile[k] = data[k];
            }
        }
    }

    function syncSessionToData(sess) {
        if (!sess || !sess.profile) return;
        for (var i = 0; i < USER_PROFILE_KEYS.length; i++) {
            var k = USER_PROFILE_KEYS[i];
            if (Object.prototype.hasOwnProperty.call(sess.profile, k)) {
                data[k] = sess.profile[k];
            }
        }
    }

    function seedInitialUserFields() {
        if (global.__WIN11_INLINE_BG__) {
            for (var w = 0; w < WALLPAPERS.length; w++) {
                var rawPath = WALLPAPERS[w].file;
                if (global.__WIN11_INLINE_BG__[rawPath]) {
                    WALLPAPERS[w].file = global.__WIN11_INLINE_BG__[rawPath];
                }
            }
        }
        var acc = null;
        for (var i = 0; i < data.userAccounts.length; i++) {
            if (data.userAccounts[i].name.toLowerCase() === String(data.currentUser).toLowerCase()) {
                acc = data.userAccounts[i];
                break;
            }
        }
        var uType = acc ? acc.type : 'Administrateur';
        if (global.Win11Sessions) {
            var sess = global.Win11Sessions.init(data.currentUser, uType);
            syncSessionToData(sess);
        }
    }

    function persist() {
        // Strictly RAM-only per student launch: sync active user's profile without disk persistence
        if (global.Win11Sessions) {
            syncDataToSession(global.Win11Sessions.getActiveSession());
        }
    }

    function emit(eventName, payload) {
        var list = (subscribers[eventName] || []).slice();
        for (var i = 0; i < list.length; i++) {
            try {
                list[i](payload, data);
            } catch (e) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Win11State.emit]', eventName, e);
                }
            }
        }
        var all = (subscribers['*'] || []).slice();
        for (var j = 0; j < all.length; j++) {
            try {
                all[j](eventName, payload, data);
            } catch (e2) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Win11State.emit:*]', eventName, e2);
                }
            }
        }
    }

    function findAccountByName(username) {
        var low = String(username || '').toLowerCase();
        var list = data.userAccounts || [];
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].name || '').toLowerCase() === low) return list[i];
        }
        return null;
    }

    function evaluateAccountScenarioB(sc) {
        if (!sc || !Array.isArray(sc.adminCreatedNames) || sc.adminCreatedNames.length < 2) return false;
        var hasOrigAdmin = (data.userAccounts || []).some(function (u) {
            return !!(u.isOriginalAdmin || String(u.name || '').toLowerCase() === 'meniai');
        });
        if (hasOrigAdmin) return false;
        var aliveAdmins = (data.userAccounts || []).filter(function (u) { return u.type === 'Administrateur'; });
        if (aliveAdmins.length !== 1) return false;
        var soleAdmin = aliveAdmins[0];
        if (soleAdmin.isOriginalAdmin || String(soleAdmin.name || '').toLowerCase() === 'meniai') return false;
        var soleLow = String(soleAdmin.name || '').toLowerCase();
        var isCreatedAdmin = sc.adminCreatedNames.some(function (n) {
            return String(n || '').toLowerCase() === soleLow;
        });
        if (!isCreatedAdmin) return false;
        var delAdmins = (sc.adminDeletedNames || []).length;
        var enoughDeletions = (delAdmins >= 2) || (!!sc.originalAdminDeleted && delAdmins >= 1);
        if (!enoughDeletions) return false;
        if (String(data.currentUser || '').toLowerCase() !== soleLow) return false;
        if (!sc.stepB && global.console && typeof global.console.info === 'function') {
            global.console.info('[Scenario6B] stepB=true soleAdmin=' + soleAdmin.name + ' deletedAdmins=' + JSON.stringify(sc.adminDeletedNames));
        }
        sc.stepB = true;
        return true;
    }

    function applyVisualTokensToDom() {
        var root = document.documentElement;
        if (!root) return;

        root.setAttribute('data-theme', data.themeMode === 'dark' ? 'dark' : 'light');
        if (data.highContrast) root.setAttribute('data-contrast', 'high');
        else root.removeAttribute('data-contrast');

        if (data.transparency) root.classList.add('win-transparency');
        else root.classList.remove('win-transparency');

        if (data.reducedMotion) root.classList.add('win-reduced-motion');
        else root.classList.remove('win-reduced-motion');

        // Apply Accent tokens
        var swatch = ACCENT_PALETTE[0];
        for (var i = 0; i < ACCENT_PALETTE.length; i++) {
            if (ACCENT_PALETTE[i].hex.toUpperCase() === String(data.accentColor).toUpperCase()) {
                swatch = ACCENT_PALETTE[i];
                break;
            }
        }
        if (!data.highContrast) {
            root.style.setProperty('--win-accent', swatch.hex);
            root.style.setProperty('--win-accent-hover', swatch.hover);
            root.style.setProperty('--win-accent-pressed', swatch.pressed);
            root.style.setProperty('--win-accent-text', data.themeMode === 'dark' ? swatch.darkText : swatch.lightText);
            root.style.setProperty('--win-accent-tint', swatch.tint);
        }

        // Apply Font Scaling (base 14px * textScale / 100)
        var scaledPx = Math.round((14 * (Number(data.textScale) || 100)) / 100);
        root.style.setProperty('--win-font-size', scaledPx + 'px');

        // Apply Pointer Scheme
        root.classList.remove('cursor-scheme-noir', 'cursor-scheme-limegreen');
        if (data.pointerScheme === 'Noir') root.classList.add('cursor-scheme-noir');
        else if (data.pointerScheme === 'LimeGreen') root.classList.add('cursor-scheme-limegreen');

        // Apply Wallpaper & Optical Display Filters
        var desk = document.getElementById('desktop-root');
        var wp = getWallpaperObj(data.wallpaperId);
        if (desk && wp) {
            desk.style.backgroundImage = 'url("' + wp.file + '")';
        }
        var lock = document.getElementById('lock-screen');
        if (lock && wp) {
            lock.style.backgroundImage = 'url("' + wp.file + '")';
        }
        var brightEl = document.getElementById('display-brightness-overlay');
        if (brightEl) {
            var bVal = global.Win11Compat.clamp(Number(data.brightness) || 100, 30, 100);
            brightEl.style.opacity = String(((100 - bVal) / 100) * 0.72);
        }
        var nightEl = document.getElementById('night-light-overlay');
        if (nightEl) {
            if (data.nightLight) nightEl.classList.add('is-active');
            else nightEl.classList.remove('is-active');
        }
    }

    function resolveMediaUrl(relPath) {
        if (!relPath) return '';
        if (global.__WIN11_INLINE_BG__ && global.__WIN11_INLINE_BG__[relPath]) {
            return global.__WIN11_INLINE_BG__[relPath];
        }
        return relPath;
    }

    function getWallpaperObj(id) {
        if (data.customWallpaper && (id === data.customWallpaper.id || (!id && data.customWallpaper.id === data.wallpaperId))) {
            return {
                id: data.customWallpaper.id,
                file: resolveMediaUrl(data.customWallpaper.file),
                label: data.customWallpaper.label,
                isCustomPicture: true
            };
        }
        if (id && String(id).indexOf('pic_') === 0 && Array.isArray(data.userFiles)) {
            for (var f = 0; f < data.userFiles.length; f++) {
                if (data.userFiles[f].id === id && data.userFiles[f].imgPath) {
                    return {
                        id: data.userFiles[f].id,
                        file: resolveMediaUrl(data.userFiles[f].imgPath),
                        label: data.userFiles[f].name,
                        isCustomPicture: true
                    };
                }
            }
        }
        var wp = WALLPAPERS[0];
        for (var i = 0; i < WALLPAPERS.length; i++) {
            if (WALLPAPERS[i].id === id) { wp = WALLPAPERS[i]; break; }
        }
        return { id: wp.id, file: resolveMediaUrl(wp.file), labelKey: wp.labelKey, label: wp.label };
    }

    var State = {
        WALLPAPERS: WALLPAPERS,
        ACCENT_PALETTE: ACCENT_PALETTE,
        LANGUAGE_CATALOG: LANGUAGE_CATALOG,
        AVATAR_GALLERY: AVATAR_GALLERY,
        resolveMediaUrl: resolveMediaUrl,

        getAvatarInnerHtml: function (acc) {
            if (acc && acc.avatarSrc) {
                return '<img class="win-avatar-img" src="' + global.Win11Compat.escapeHtml(acc.avatarSrc) + '" alt="' + global.Win11Compat.escapeHtml(acc.name || 'User') + '">';
            }
            var ch = (acc && acc.name) ? String(acc.name).charAt(0).toUpperCase() : 'U';
            return global.Win11Compat.escapeHtml(ch);
        },

        triggerElementShake: function (el) {
            if (!el || !el.classList) return;
            el.classList.remove('win-shake');
            void el.offsetWidth;
            el.classList.add('win-shake');
        },

        getWallTimestamp: function () {
            var d = new Date();
            var hh = String(d.getHours()), mm = String(d.getMinutes()), ss = String(d.getSeconds());
            if (hh.length < 2) hh = '0' + hh;
            if (mm.length < 2) mm = '0' + mm;
            if (ss.length < 2) ss = '0' + ss;
            return hh + ':' + mm + ':' + ss;
        },

        logAccountEvent: function (type, detailAr, targetUser, explicitRole) {
            if (!data.accountActionLog) data.accountActionLog = [];
            var elapsed = (global.Win11Assessment && typeof global.Win11Assessment.getElapsedString === 'function')
                ? global.Win11Assessment.getElapsedString()
                : '00:00:00';
            var wallTime = this.getWallTimestamp();
            var resolvedTarget = targetUser || data.currentUser;
            var targetAcc = findAccountByName(resolvedTarget);
            var role = explicitRole || (targetAcc ? targetAcc.type : '-');
            var timeVal = wallTime || elapsed || '00:00:00';
            data.accountActionLog.push({
                index: data.accountActionLog.length + 1,
                type: type,
                event: type,
                actor: data.currentUser,
                target: resolvedTarget,
                targetUser: resolvedTarget,
                accountType: role,
                detailAr: detailAr,
                details: detailAr,
                elapsed: elapsed,
                wallTime: wallTime,
                time: timeVal
            });
            emit('accountlog:changed', data.accountActionLog);
        },

        init: function () {
            purgeLegacyStudentPersistence();
            data = createDefaultData();
            seedInitialUserFields();
            applyVisualTokensToDom();
        },

        get: function () { return data; },

        getWallpaper: getWallpaperObj,

        set: function (patch, eventTopic) {
            if (!patch) return;
            for (var k in patch) {
                if (Object.prototype.hasOwnProperty.call(patch, k)) {
                    data[k] = patch[k];
                }
            }
            if (patch.wallpaperId) {
                if (!data.userWallpapers) data.userWallpapers = {};
                data.userWallpapers[data.currentUser] = patch.wallpaperId;
            }
            persist();
            applyVisualTokensToDom();
            emit(eventTopic || 'state:changed', patch);
        },

        update: function (mutatorFn, eventTopic) {
            if (typeof mutatorFn === 'function') {
                mutatorFn(data);
            }
            persist();
            applyVisualTokensToDom();
            emit(eventTopic || 'state:changed', data);
        },

        persist: function () {
            persist();
        },

        reset: function () {
            purgeLegacyStudentPersistence();
            data = createDefaultData();
            var defLang = (global.Win11Assessment && global.Win11Assessment.getConfig && global.Win11Assessment.getConfig().ui_language_default) || 'ar';
            data.displayLanguage = defLang;
            data.uiLanguage = defLang;
            seedInitialUserFields();
            if (global.Win11I18N && global.Win11I18N.getLang() !== defLang) {
                global.Win11I18N.setLanguage(defLang);
            }
            if (global.Win11WM && typeof global.Win11WM.syncSession === 'function') {
                global.Win11WM.syncSession();
            }
            if (global.Win11Permissions && typeof global.Win11Permissions.resetMistakeDedupe === 'function') {
                global.Win11Permissions.resetMistakeDedupe();
            }
            applyVisualTokensToDom();
            emit('users:changed', data.currentUser);
            emit('state:changed', data);
        },

        on: function (eventName, fn) {
            if (!subscribers[eventName]) subscribers[eventName] = [];
            subscribers[eventName].push(fn);
        },

        emit: emit,
        applyVisualTokensToDom: applyVisualTokensToDom,

        // User Account & UAC Domain Helpers
        getAccount: function (name) {
            for (var i = 0; i < data.userAccounts.length; i++) {
                if (data.userAccounts[i].name.toLowerCase() === String(name).toLowerCase()) {
                    return data.userAccounts[i];
                }
            }
            return null;
        },

        getCurrentAccount: function () {
            return this.getAccount(data.currentUser) || data.userAccounts[0];
        },

        isCurrentGuest: function () {
            var cur = this.getCurrentAccount();
            return !!(cur && cur.type === 'Invité');
        },

        isCurrentStandard: function () {
            var cur = this.getCurrentAccount();
            return !!(cur && cur.type === 'Standard');
        },

        isCurrentAdmin: function () {
            var cur = this.getCurrentAccount();
            return !!(cur && cur.type === 'Administrateur');
        },

        getAdminCount: function () {
            var count = 0;
            for (var i = 0; i < data.userAccounts.length; i++) {
                if (data.userAccounts[i].type === 'Administrateur') count++;
            }
            return count;
        },

        canDeleteAccount: function (account) {
            var t = global.Win11I18N.t.bind(global.Win11I18N);
            if (!account) return { ok: false, reason: 'Account not found' };
            if (account.type === 'Invité') return { ok: false, reason: t('settings.accounts.cannotDeleteGuest') };
            if (account.name.toLowerCase() === data.currentUser.toLowerCase()) {
                return { ok: false, reason: t('settings.accounts.cannotDeleteSelf') };
            }
            if (account.type === 'Administrateur' && this.getAdminCount() <= 1) {
                return { ok: false, reason: t('settings.accounts.uacLastAdmin') };
            }
            return { ok: true, reason: '' };
        },

        switchUser: function (username) {
            var prevUser = data.currentUser;
            var prevAcc = this.getAccount(prevUser);
            var prevType = prevAcc ? prevAcc.type : '-';
            var targetAcc = this.getAccount(username);
            var targetType = targetAcc ? targetAcc.type : 'Standard';

            var sc = data.accountScenario;
            if (sc && sc.pwStandardUser && sc.loggedInStdInitial &&
                String(prevUser).toLowerCase() === String(sc.pwStandardUser).toLowerCase() &&
                String(username).toLowerCase() !== String(prevUser).toLowerCase()) {
                sc.signedOutStdAfterInitial = true;
                sc.stepE = true;
                this.logAccountEvent('logout_standard', 'تسجيل الخروج من الحساب القياسي (' + prevUser + ') إلى (' + username + ')', prevUser, prevType);
                if (global.console && typeof global.console.info === 'function') {
                    global.console.info('[Scenario6E] stepE=true signedOut=' + prevUser + ' -> ' + username);
                }
            }
            if (targetType === 'Invité' && sc) {
                sc.guestSwitchedOnce = true;
                this.logAccountEvent('switch_guest', 'تبديل الجلسة إلى حساب الضيف (Invité)', 'Invité', 'Invité');
            } else if (String(username).toLowerCase() !== String(prevUser).toLowerCase()) {
                this.logAccountEvent('switch_user', 'تبديل المستخدم من ' + prevUser + ' إلى ' + username, username, targetType);
            }

            if (global.Win11Sessions) {
                syncDataToSession(global.Win11Sessions.getActiveSession());
                var sw = global.Win11Sessions.switchUser(prevUser, username, targetType);
                data.currentUser = username;
                if (sw && sw.to) {
                    syncSessionToData(sw.to);
                }
            } else {
                data.currentUser = username;
                if (!data.userWallpapers) data.userWallpapers = {};
                if (!data.userWallpapers[username]) data.userWallpapers[username] = 'bg_00';
                data.wallpaperId = data.userWallpapers[username];
            }

            if (!data.userWallpapers) data.userWallpapers = {};
            data.userWallpapers[username] = data.wallpaperId;
            data.hasSwitchedUser = true;
            if (username.toLowerCase() === 'meniai' && data.hasChangedWallpaperInNewAccount) {
                data.hasReturnedToAdminAccount = true;
            }
            if (global.Win11Permissions && typeof global.Win11Permissions.resetMistakeDedupe === 'function') {
                global.Win11Permissions.resetMistakeDedupe();
            }
            if (global.Win11WM && typeof global.Win11WM.syncSession === 'function') {
                global.Win11WM.syncSession();
            }
            if (global.Win11SettingsApp && typeof global.Win11SettingsApp.getOptimalRect === 'function' && global.Win11WM) {
                var setWin = global.Win11WM.getWindow('win-settings');
                if (setWin) {
                    var sArea = global.Win11WM.getWorkArea();
                    var sOpt = global.Win11SettingsApp.getOptimalRect(sArea);
                    setWin.rect.x = sOpt.x;
                    setWin.rect.y = sOpt.y;
                    setWin.rect.w = sOpt.w;
                    setWin.rect.h = sOpt.h;
                    if (typeof global.Win11WM.applyRect === 'function') {
                        global.Win11WM.applyRect(setWin);
                    }
                }
            }
            if (global.Win11I18N && data.numerals) {
                global.Win11I18N.setNumerals(data.numerals);
            }
            var uiLang = data.displayLanguage || data.uiLanguage || 'ar';
            data.displayLanguage = uiLang;
            data.uiLanguage = uiLang;
            if (global.Win11I18N && global.Win11I18N.getLang() !== uiLang) {
                global.Win11I18N.setLanguage(uiLang);
            }
            applyVisualTokensToDom();
            evaluateAccountScenarioB(data.accountScenario);
            persist();
            emit('users:changed', username);
            emit('state:changed', data);
        },

        recordLoginSuccess: function (username, usedPassword) {
            var acc = this.getAccount(username);
            var sc = data.accountScenario;
            if (!acc || !sc) return;
            var lowTarget = String(username || '').toLowerCase();
            var lowPwUser = sc.pwStandardUser ? String(sc.pwStandardUser).toLowerCase() : '';
            var lowChangedUser = sc.pwChangedTargetUser ? String(sc.pwChangedTargetUser).toLowerCase() : '';
            var isTargetPwStd = (lowChangedUser && lowTarget === lowChangedUser) || (lowPwUser && lowTarget === lowPwUser);
            if (isTargetPwStd && usedPassword) {
                if (sc.stepF && sc.adminChangedStdPw && (!lowChangedUser || lowTarget === lowChangedUser)) {
                    sc.loggedInStdNewPw = true;
                    sc.stepG = true;
                    this.logAccountEvent('login_new_pw', 'تسجيل دخول ناجح إلى الحساب (' + username + ') بكلمة المرور الجديدة', username, acc.type);
                    if (global.console && typeof global.console.info === 'function') {
                        global.console.info('[Scenario6G] stepG=true user=' + username);
                    }
                } else if (!sc.loggedInStdInitial) {
                    sc.loggedInStdInitial = true;
                    this.logAccountEvent('login_initial_pw', 'تسجيل دخول ناجح إلى الحساب (' + username + ') بكلمة المرور الأولى', username, acc.type);
                    if (global.console && typeof global.console.info === 'function') {
                        global.console.info('[Scenario6E-login] loggedInStdInitial=true user=' + username);
                    }
                } else {
                    this.logAccountEvent('login', 'تسجيل الدخول إلى الحساب: ' + username, username, acc.type);
                }
            } else {
                this.logAccountEvent('login', 'تسجيل الدخول إلى الحساب: ' + username, username, acc.type);
            }
            persist();
            emit('state:changed', data);
        },

        createAccount: function (opts) {
            var name = String((opts && opts.name) || '').trim();
            var type = (opts && opts.type === 'Administrateur') ? 'Administrateur' : 'Standard';
            var password = String((opts && opts.password) || '');
            var sc = data.accountScenario;
            sc.seqCounter += 1;
            var accObj = {
                name: name,
                type: type,
                hasPassword: !!password,
                password: password,
                enabled: true,
                customAvatar: false,
                avatarId: type === 'Administrateur' ? 'avatar_admin' : 'avatar_student',
                avatarSrc: '',
                color: type === 'Administrateur' ? '#8764B8' : '#107C41',
                isOriginalAdmin: false,
                createdSeq: sc.seqCounter
            };
            data.userAccounts.push(accObj);

            if (type === 'Standard') {
                sc.standardCreatedNames.push(name);
                if (password.length > 0) {
                    sc.pwStandardUser = name;
                    sc.pwStandardInitial = password;
                    sc.loggedInStdInitial = false;
                    sc.signedOutStdAfterInitial = false;
                    sc.adminChangedStdPw = false;
                    sc.loggedInStdNewPw = false;
                    sc.stepD = true;
                }
            } else if (type === 'Administrateur') {
                sc.adminCreatedNames.push(name);
            }
            this.logAccountEvent('account_create', 'إنشاء حساب ' + type + ': ' + name + (password ? ' (محمي بكلمة مرور)' : ' (بدون كلمة مرور)'), name);
            persist();
            emit('users:changed', name);
            emit('state:changed', data);
            return accObj;
        },

        updateAccountType: function (username, newType) {
            var acc = this.getAccount(username);
            if (!acc || acc.type === 'Invité') return false;
            var oldType = acc.type;
            acc.type = newType;
            var sc = data.accountScenario;
            if (sc && newType === 'Administrateur' && !acc.isOriginalAdmin && String(acc.name || '').toLowerCase() !== 'meniai') {
                if (!Array.isArray(sc.adminCreatedNames)) sc.adminCreatedNames = [];
                var alreadyTracked = sc.adminCreatedNames.some(function (n) {
                    return String(n || '').toLowerCase() === String(acc.name || '').toLowerCase();
                });
                if (!alreadyTracked) sc.adminCreatedNames.push(acc.name);
            }
            if (global.Win11Sessions) global.Win11Sessions.updateSessionType(acc.name, newType);
            this.logAccountEvent('account_type', 'تغيير نوع حساب (' + acc.name + ') من ' + oldType + ' إلى ' + newType, acc.name, newType);
            evaluateAccountScenarioB(sc);
            persist();
            emit('users:changed', acc.name);
            emit('state:changed', data);
            return true;
        },

        setAccountPassword: function (username, newPassword) {
            var acc = this.getAccount(username);
            if (!acc || acc.type === 'Invité') return false;
            var pw = String(newPassword || '');
            var oldPw = acc.password || '';
            acc.password = pw;
            acc.hasPassword = !!pw;
            var sc = data.accountScenario;
            if (sc && acc.type === 'Standard' && pw.length > 0 && pw !== oldPw) {
                var hadPwUserAlive = !!(sc.pwStandardUser && this.getAccount(sc.pwStandardUser));
                if (!hadPwUserAlive && oldPw.length === 0 && !sc.stepD) {
                    sc.pwStandardUser = acc.name;
                    sc.pwStandardInitial = pw;
                    sc.stepD = true;
                    if (global.console && typeof global.console.info === 'function') {
                        global.console.info('[Scenario6D] stepD=true via initial password set for ' + acc.name);
                    }
                } else if (this.isCurrentAdmin() && (oldPw.length > 0 || sc.stepE || sc.stepD)) {
                    sc.adminChangedStdPw = true;
                    sc.stepF = true;
                    sc.pwChangedTargetUser = acc.name;
                    if (!sc.pwStandardUser || !this.getAccount(sc.pwStandardUser)) {
                        sc.pwStandardUser = acc.name;
                    }
                    if (global.console && typeof global.console.info === 'function') {
                        global.console.info('[Scenario6F] stepF=true adminChangedStdPw user=' + acc.name);
                    }
                }
            }
            this.logAccountEvent('password_change', 'تعديل كلمة مرور الحساب: ' + acc.name, acc.name, acc.type);
            persist();
            emit('users:changed', acc.name);
            emit('state:changed', data);
            return true;
        },

        setUserAvatar: function (username, avatarSrc, avatarId) {
            var acc = this.getAccount(username || data.currentUser);
            if (!acc || acc.type === 'Invité') return false;
            acc.avatarSrc = avatarSrc || '';
            acc.avatarId = avatarId || 'custom';
            acc.customAvatar = !!avatarSrc;
            if (data.accountScenario) {
                data.accountScenario.avatarChangedOnce = true;
                data.accountScenario.stepH = true;
            }
            this.logAccountEvent('avatar_change', 'تغيير الصورة الرمزية للحساب: ' + acc.name, acc.name);
            persist();
            emit('users:changed', acc.name);
            emit('state:changed', data);
            return true;
        },

        toggleGuestEnabled: function (enabled) {
            var gAcc = this.getAccount('Invité');
            if (!gAcc) return false;
            gAcc.enabled = !!enabled;
            if (enabled) {
                if (data.accountScenario) data.accountScenario.guestEnabledOnce = true;
                this.logAccountEvent('guest_enable', 'تفعيل حساب الضيف (Invité)', 'Invité');
            } else {
                this.resetGuestAccount();
                this.logAccountEvent('guest_disable', 'تعطيل حساب الضيف وإعادة تعيين ملفاته المؤقتة', 'Invité');
            }
            persist();
            emit('users:changed', 'Invité');
            emit('state:changed', data);
            return true;
        },

        resetGuestAccount: function () {
            var gAcc = this.getAccount('Invité');
            if (gAcc) {
                gAcc.avatarSrc = '';
                gAcc.avatarId = '';
                gAcc.customAvatar = false;
            }
            if (data.userWallpapers) data.userWallpapers['Invité'] = 'bg_00';
            if (global.Win11Sessions && typeof global.Win11Sessions.resetGuestSession === 'function') {
                global.Win11Sessions.resetGuestSession('Invité');
            }
            if (data.currentUser && data.currentUser.toLowerCase() === 'invité') {
                if (global.Win11Sessions) syncSessionToData(global.Win11Sessions.getActiveSession());
            }
            this.logAccountEvent('guest_reset', 'إعادة تعيين وتصفية ملفات الضيف C:\\Users\\Invite', 'Invité');
            persist();
            emit('state:changed', data);
        },

        recordGuestBlockedAction: function (actionId, actionText) {
            var sc = data.accountScenario;
            if (!sc) return;
            sc.guestBlockedTriggered = true;
            if (sc.guestEnabledOnce || sc.guestSwitchedOnce || this.isCurrentGuest()) {
                sc.stepC = true;
            }
            this.logAccountEvent('guest_uac_denied', 'حظر إجراء إداري بحساب الضيف (UAC): ' + (actionText || actionId), 'Invité', 'Invité');
            if (global.console && typeof global.console.info === 'function') {
                global.console.info('[Scenario6C] stepC=' + sc.stepC + ' blocked=' + actionId);
            }
            persist();
            emit('state:changed', data);
        },

        deleteAccount: function (username) {
            try {
                var victim = this.getAccount(username);
                var victimRole = victim ? victim.type : '-';
                var sc = data.accountScenario;
                if (victim && sc) {
                    if (victim.isOriginalAdmin || String(victim.name || '').toLowerCase() === 'meniai') {
                        sc.originalAdminDeleted = true;
                    }
                    if (victim.type === 'Standard') {
                        sc.standardDeletedNames.push(victim.name);
                        var createdStdRemaining = data.userAccounts.filter(function (a) {
                            return a.name.toLowerCase() !== victim.name.toLowerCase() &&
                                a.type === 'Standard' &&
                                sc.standardCreatedNames.indexOf(a.name) !== -1;
                        }).length;
                        if (sc.standardCreatedNames.length >= 2 && sc.standardDeletedNames.length >= 2 && createdStdRemaining === 0) {
                            sc.stepA = true;
                        }
                    } else if (victim.type === 'Administrateur') {
                        sc.adminDeletedNames.push(victim.name);
                    }
                }
                data.userAccounts = data.userAccounts.filter(function (u) {
                    return u.name.toLowerCase() !== String(username).toLowerCase();
                });
                evaluateAccountScenarioB(sc);
                if (data.userWallpapers) delete data.userWallpapers[username];
                if (global.Win11Sessions) global.Win11Sessions.deleteSession(username);
                this.logAccountEvent('account_delete', 'حذف حساب ' + (victim ? victim.type : '') + ': ' + username, username, victimRole);
                persist();
                emit('users:changed', data.currentUser);
                emit('state:changed', data);
                return true;
            } catch (err) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Win11State.deleteAccount]', err);
                }
                return false;
            }
        },

        setUserWallpaper: function (wpId, customMeta) {
            data.wallpaperId = wpId;
            if (customMeta && customMeta.file) {
                data.customWallpaper = {
                    id: wpId,
                    file: customMeta.file,
                    label: customMeta.label || wpId,
                    folder: customMeta.folder || 'pictures',
                    path: customMeta.path || ''
                };
                if (customMeta.folder === 'pictures' || (customMeta.browseMeta && customMeta.browseMeta.selectedFolder === 'pictures')) {
                    data.hasChosenPicturesWallpaper = true;
                }
            } else {
                data.customWallpaper = null;
                if (wpId !== 'bg_00') {
                    data.hasChosenPresetWallpaper = true;
                }
            }
            if (customMeta && customMeta.browseMeta) {
                data.wallpaperBrowseMeta = customMeta.browseMeta;
            }
            if (!data.userWallpapers) data.userWallpapers = {};
            data.userWallpapers[data.currentUser] = wpId;
            if (data.currentUser.toLowerCase() === 'eleve' || data.currentUser === 'تلميذ') {
                data.hasChangedWallpaperInNewAccount = true;
            }
            persist();
            applyVisualTokensToDom();
            emit('wallpaper:changed', wpId);
            emit('state:changed', data);
        },

        recordWallpaperBrowse: function (folderName, pathStr, fileObj) {
            data.wallpaperBrowseMeta = {
                usedBrowse: true,
                selectedFolder: folderName || (data.wallpaperBrowseMeta && data.wallpaperBrowseMeta.selectedFolder) || null,
                selectedPath: pathStr || (data.wallpaperBrowseMeta && data.wallpaperBrowseMeta.selectedPath) || '',
                selectedFileId: fileObj ? fileObj.id : null
            };
            persist();
        },

        uninstallProgram: function (progId) {
            try {
                if (!progId) return false;
                var removed = null;
                for (var i = 0; i < data.installedPrograms.length; i++) {
                    if (data.installedPrograms[i].id === progId) {
                        removed = data.installedPrograms[i];
                        break;
                    }
                }
                if (!removed) return false;
                data.installedPrograms = data.installedPrograms.filter(function (p) { return p.id !== progId; });
                var startupIds = (removed && Array.isArray(removed.startupIds)) ? removed.startupIds : [];
                data.startupApps = data.startupApps.filter(function (sa) {
                    if (sa.appId && sa.appId === progId) return false;
                    if (startupIds.indexOf(sa.id) !== -1) return false;
                    if (progId === 'avast_antivirus' && String(sa.id).indexOf('avast') !== -1) return false;
                    return true;
                });
                if (progId === 'labtools_app' && data.setupFlow && data.setupFlow.installed) {
                    data.setupFlow.uninstalled = true;
                }
                persist();
                emit('apps:changed', { uninstalledId: progId });
                emit('state:changed', data);
                return true;
            } catch (err) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Win11State.uninstallProgram]', err);
                }
                return false;
            }
        },

        installSetupApp: function (opts) {
            try {
                var desktopShortcut = !(opts && opts.desktopShortcut === false);
                var exists = null;
                for (var ip = 0; ip < data.installedPrograms.length; ip++) {
                    if (data.installedPrograms[ip].id === 'labtools_app') {
                        exists = data.installedPrograms[ip];
                        break;
                    }
                }
                if (!exists) {
                    data.installedPrograms.unshift({
                        id: 'labtools_app',
                        name: 'LabTools 1AS (Setup)',
                        publisher: '1AS Education Suite',
                        date: '2026/11/12',
                        size: '28.4 MB',
                        color: '#0067C0',
                        startupIds: [],
                        fromSetupExe: true,
                        desktopShortcut: desktopShortcut
                    });
                } else {
                    exists.desktopShortcut = desktopShortcut;
                }
                if (data.setupFlow) {
                    data.setupFlow.installed = true;
                    data.setupFlow.desktopShortcut = desktopShortcut;
                    data.setupFlow.uninstalled = false;
                    data.setupFlow.verifiedUninstalled = false;
                }
                persist();
                emit('apps:changed', { installedId: 'labtools_app', desktopShortcut: desktopShortcut });
                emit('state:changed', data);
                return true;
            } catch (err) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Win11State.installSetupApp]', err);
                }
                return false;
            }
        },

        markInstalledAppsViewed: function () {
            try {
                if (!data.setupFlow) return;
                var hasLabTools = data.installedPrograms.some(function (p) { return p.id === 'labtools_app'; });
                if (data.setupFlow.installed && hasLabTools && !data.setupFlow.uninstalled && !data.setupFlow.verifiedInstalled) {
                    data.setupFlow.verifiedInstalled = true;
                    persist();
                    emit('apps:changed', { verifiedInstalled: true });
                    emit('state:changed', data);
                } else if (data.setupFlow.uninstalled && !hasLabTools && !data.setupFlow.verifiedUninstalled) {
                    data.setupFlow.verifiedUninstalled = true;
                    persist();
                    emit('apps:changed', { verifiedUninstalled: true });
                    emit('state:changed', data);
                }
            } catch (err) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Win11State.markInstalledAppsViewed]', err);
                }
            }
        },

        setOptionalFeatureEnabled: function (featureId, enabled) {
            try {
                var target = null;
                for (var i = 0; i < (data.optionalFeatures || []).length; i++) {
                    if (data.optionalFeatures[i].id === featureId) {
                        target = data.optionalFeatures[i];
                        break;
                    }
                }
                if (!target) return false;
                target.installed = !!enabled;
                if (data.featureFlow) {
                    if (target.installed) {
                        data.featureFlow.enabledOnce = true;
                    } else if (data.featureFlow.enabledOnce) {
                        data.featureFlow.disabledAfterEnable = true;
                    }
                }
                persist();
                emit('features:changed', { id: featureId, installed: target.installed });
                emit('state:changed', data);
                return true;
            } catch (err) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[Win11State.setOptionalFeatureEnabled]', err);
                }
                return false;
            }
        },

        markStartMenuFeaturesViewed: function () {
            var changed = false;
            if (data.featureFlow) {
                var anyEnabled = (data.optionalFeatures || []).some(function (f) { return !!f.installed; });
                if (data.featureFlow.enabledOnce && anyEnabled && !data.featureFlow.verifiedInStart) {
                    data.featureFlow.verifiedInStart = true;
                    changed = true;
                }
                if (data.featureFlow.disabledAfterEnable && !anyEnabled && !data.featureFlow.verifiedGoneInStart) {
                    data.featureFlow.verifiedGoneInStart = true;
                    changed = true;
                }
            }
            if (data.setupFlow) {
                var hasLab = (data.installedPrograms || []).some(function (p) { return p.id === 'labtools_app'; });
                if (data.setupFlow.installed && hasLab && !data.setupFlow.verifiedInStart) {
                    data.setupFlow.verifiedInStart = true;
                    changed = true;
                }
                if (data.setupFlow.uninstalled && !hasLab && !data.setupFlow.verifiedGoneInStart) {
                    data.setupFlow.verifiedGoneInStart = true;
                    changed = true;
                }
            }
            if (changed) {
                persist();
                emit('features:changed', { startMenuVerified: true });
                emit('state:changed', data);
            }
        },

        getDefaultApps: function () {
            var hasAdobe = data.installedPrograms.some(function (p) { return p.id === 'adobe_reader'; });
            return {
                browser: 'Microsoft Edge',
                pdfViewer: hasAdobe ? 'Adobe Reader 9.3' : 'Microsoft Edge'
            };
        },

        getActiveInputLangObj: function () {
            var list = data.installedLanguages || [];
            if (list.length === 0) {
                return { id: 'FR_FR', code: 'FR', trayTag: 'FRA\nFR', display: 'Français (France)', keyboard: 'AZERTY Français' };
            }
            var cur = String(data.activeInputLang || '');
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === cur || list[i].code === cur) return list[i];
            }
            return list[0];
        },

        addInputLanguage: function (langItem, displayLabel) {
            if (!langItem || !langItem.id) return;
            var exists = data.installedLanguages.some(function (x) { return x.id === langItem.id; });
            if (!exists) {
                data.installedLanguages.push({
                    id: langItem.id,
                    code: langItem.code,
                    trayTag: langItem.trayTag || (langItem.code + '\n' + langItem.id.slice(-2)),
                    display: displayLabel || langItem.nameAr || langItem.nameOther,
                    keyboard: langItem.keyboard
                });
            }
            persist();
            emit('language:installed', langItem.id);
            emit('inputlang:changed', data.activeInputLang);
            emit('state:changed', data);
        },

        removeInputLanguage: function (langId) {
            if (!data.installedLanguages || data.installedLanguages.length <= 1) return false;
            data.installedLanguages = data.installedLanguages.filter(function (x) { return x.id !== langId; });
            var cur = this.getActiveInputLangObj();
            data.activeInputLang = cur.id;
            persist();
            emit('inputlang:changed', data.activeInputLang);
            emit('state:changed', data);
            return true;
        },

        setActiveInputLang: function (langId) {
            var found = null;
            for (var i = 0; i < data.installedLanguages.length; i++) {
                if (data.installedLanguages[i].id === langId || data.installedLanguages[i].code === langId) {
                    found = data.installedLanguages[i];
                    break;
                }
            }
            if (!found) return;
            data.activeInputLang = found.id;
            persist();
            emit('inputlang:changed', found.id);
            emit('state:changed', data);
        },

        cycleInputLang: function () {
            var list = data.installedLanguages || [];
            if (list.length < 2) return null;
            var curObj = this.getActiveInputLangObj();
            var idx = list.indexOf(curObj);
            var next = list[(idx + 1) % list.length];
            this.setActiveInputLang(next.id);
            return next;
        },

        setDisplayLanguage: function (langCode, fromSettings) {
            var target = (langCode === 'fr' || langCode === 'en' || langCode === 'ar') ? langCode : 'ar';
            data.displayLanguage = target;
            data.uiLanguage = target;
            if (fromSettings) {
                data.hasChangedDisplayLanguage = true;
            }
            persist();
            if (global.Win11I18N) {
                global.Win11I18N.setLanguage(target);
            } else {
                emit('ui:language', target);
            }
        },

        setBluetoothEnabled: function (enabled) {
            data.bluetoothEnabled = !!enabled;
            if (enabled) data.airplaneMode = false;
            persist();
            emit('devices:changed', data);
            emit('state:changed', data);
        },

        setWifiEnabled: function (enabled) {
            data.wifiEnabled = !!enabled;
            if (enabled) data.airplaneMode = false;
            persist();
            emit('network:changed', data);
            emit('state:changed', data);
        },

        setAirplaneMode: function (enabled) {
            data.airplaneMode = !!enabled;
            if (enabled) {
                data.wifiEnabled = false;
                data.bluetoothEnabled = false;
            }
            persist();
            emit('network:changed', data);
            emit('state:changed', data);
        },

        addNotification: function (titleKey, bodyKey, isRawText) {
            var now = this.getSimulatedNow();
            var hh = String(now.getHours());
            var mm = String(now.getMinutes());
            if (hh.length < 2) hh = '0' + hh;
            if (mm.length < 2) mm = '0' + mm;
            data.notifications.unshift({
                id: 'n_' + Date.now(),
                titleKey: titleKey,
                bodyKey: bodyKey,
                raw: !!isRawText,
                time: hh + ':' + mm
            });
            if (data.notifications.length > 15) data.notifications.pop();
            persist();
            emit('notifications:changed', data.notifications);
        },

        getSimulatedNow: function () {
            var now = new Date();
            // Shift clock relative to configured timezone offset delta (default browser tz vs virtual offset)
            if (data.timeZoneId === 'GMT+1') {
                // Virtual UTC+1 computation from UTC
                var utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
                return new Date(utcMs + 3600000);
            } else if (data.timeZoneId === 'GMT+0') {
                var utcMs0 = now.getTime() + (now.getTimezoneOffset() * 60000);
                return new Date(utcMs0);
            } else if (data.timeZoneId === 'GMT+2') {
                var utcMs2 = now.getTime() + (now.getTimezoneOffset() * 60000);
                return new Date(utcMs2 + 7200000);
            }
            return now;
        }
    };

    global.Win11State = State;
})(window);

