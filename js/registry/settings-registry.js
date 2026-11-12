/**
 * Central Settings & Multi-Path Access Registry (Single Source of Truth)
 * Links every setting ID to its Settings section, subpage, target control anchor,
 * search keywords (AR/FR/EN), and real Windows 11 access paths.
 */
(function (global) {
    'use strict';

    var ENTRIES = [
        {
            id: 'home',
            section: 'home',
            subpage: 'main',
            icon: 'navHome',
            titleKey: 'settings.nav.home',
            keywords: 'home accueil رئيسية',
            paths: ['Settings -> Home', 'Win+I']
        },
        {
            id: 'system.overview',
            section: 'system',
            subpage: 'main',
            icon: 'navSystem',
            titleKey: 'settings.nav.system',
            keywords: 'system système نظام جهاز',
            paths: ['Settings -> System', 'Win+I', 'Win+X -> System']
        },
        {
            id: 'system.display',
            section: 'system',
            subpage: 'display',
            icon: 'navSystem',
            titleKey: 'settings.system.displayTitle',
            parentKey: 'settings.nav.system',
            anchor: 'ctrl-display-brightness',
            keywords: 'display resolution scale brightness night light شاشة عرض دقة سطوع إضاءة ليلية مقياس',
            paths: ['Desktop Right-Click -> Display settings', 'Settings -> System -> Display', 'Quick Settings (Alt+A) -> Night light / Brightness', 'Search']
        },
        {
            id: 'system.sound',
            section: 'system',
            subpage: 'sound',
            icon: 'volume',
            titleKey: 'settings.system.soundTitle',
            parentKey: 'settings.nav.system',
            anchor: 'ctrl-sound-output',
            keywords: 'sound volume audio mute speaker صوت مستوى الصوت سماعات كتم',
            paths: ['Quick Settings (Alt+A) -> Sound arrow', 'Settings -> System -> Sound', 'Control Panel -> Hardware & Sound', 'Search']
        },
        {
            id: 'system.notifications',
            section: 'system',
            subpage: 'notifications',
            icon: 'bell',
            titleKey: 'settings.system.notifTitle',
            parentKey: 'settings.nav.system',
            anchor: 'ctrl-notif-dnd',
            keywords: 'notifications alerts dnd إشعارات تنبيهات عدم الإزعاج',
            paths: ['Notification Center (Alt+N) -> Settings', 'Settings -> System -> Notifications', 'Search']
        },
        {
            id: 'system.power',
            section: 'system',
            subpage: 'power',
            icon: 'battery',
            titleKey: 'settings.system.powerTitle',
            parentKey: 'settings.nav.system',
            anchor: 'ctrl-power-mode',
            keywords: 'power battery sleep energy طاقة بطارية سكون أداء',
            paths: ['Quick Settings (Alt+A) -> Battery %', 'Settings -> System -> Power & battery', 'Search']
        },
        {
            id: 'system.storage',
            section: 'system',
            subpage: 'storage',
            icon: 'drive',
            titleKey: 'settings.system.storageTitle',
            parentKey: 'settings.nav.system',
            anchor: 'ctrl-storage-bar',
            keywords: 'storage disk space drive c d تخزين قرص مساحة',
            paths: ['File Explorer -> This PC -> Storage', 'Settings -> System -> Storage', 'Search']
        },
        {
            id: 'system.multitasking',
            section: 'system',
            subpage: 'multitasking',
            icon: 'taskView',
            titleKey: 'settings.system.multitaskingTitle',
            parentKey: 'settings.nav.system',
            anchor: 'ctrl-snap-windows',
            keywords: 'snap windows multitasking desktops تعدد مهام محاذاة نوافذ',
            paths: ['Settings -> System -> Multitasking', 'Search']
        },
        {
            id: 'system.about',
            section: 'system',
            subpage: 'about',
            icon: 'info',
            titleKey: 'settings.system.aboutTitle',
            parentKey: 'settings.nav.system',
            anchor: 'ctrl-about-specs',
            keywords: 'about pc name specs processor ram حول مواصفات اسم الحاسوب إعادة تسمية',
            paths: ['Desktop This PC Right-Click -> Properties', 'Settings -> System -> About', 'Control Panel -> System', 'Search']
        },
        {
            id: 'devices.bluetooth',
            section: 'devices',
            subpage: 'main',
            icon: 'navBluetooth',
            titleKey: 'settings.nav.devices',
            anchor: 'ctrl-bt-toggle',
            keywords: 'bluetooth devices printers usb بلوتوث أجهزة طابعات',
            paths: ['Quick Settings -> Bluetooth arrow', 'Settings -> Bluetooth & devices', 'Search']
        },
        {
            id: 'devices.mouse',
            section: 'devices',
            subpage: 'mouse',
            icon: 'mouse',
            titleKey: 'settings.devices.mouseTitle',
            parentKey: 'settings.nav.devices',
            anchor: 'ctrl-mouse-speed',
            keywords: 'mouse pointer double click speed noir limegreen souris فأرة مؤشر سرعة النقر أزرار',
            paths: ['Settings -> Bluetooth & devices -> Mouse', 'Settings -> Accessibility -> Mouse pointer', 'Control Panel -> Mouse Properties', 'Search']
        },
        {
            id: 'devices.printers',
            section: 'devices',
            subpage: 'printers',
            icon: 'printer',
            titleKey: 'settings.devices.printersTitle',
            parentKey: 'settings.nav.devices',
            anchor: 'ctrl-printers-list',
            keywords: 'printer scanner hp laserjet طابعة ماسح ضوئي طباعة',
            paths: ['Settings -> Bluetooth & devices -> Printers', 'Control Panel -> Hardware & Sound', 'Search']
        },
        {
            id: 'network.status',
            section: 'network',
            subpage: 'main',
            icon: 'navNetwork',
            titleKey: 'settings.nav.network',
            anchor: 'ctrl-wifi-toggle',
            keywords: 'network wifi internet ethernet vpn airplane proxy شبكة واي فاي إنترنت وضع الطيران',
            paths: ['Quick Settings -> Wi-Fi arrow', 'Settings -> Network & internet', 'Control Panel -> Network & Sharing', 'Search']
        },
        {
            id: 'personalization.overview',
            section: 'personalization',
            subpage: 'main',
            icon: 'navPersonalization',
            titleKey: 'settings.nav.personalization',
            keywords: 'personalization تخصيص مظهر',
            paths: ['Desktop Right-Click -> Personalize', 'Settings -> Personalization']
        },
        {
            id: 'personalization.background',
            section: 'personalization',
            subpage: 'background',
            icon: 'wallpaper',
            titleKey: 'settings.personalization.bgTitle',
            parentKey: 'settings.nav.personalization',
            anchor: 'ctrl-wallpaper-grid',
            keywords: 'background wallpaper bg000 bg خلفية صورة سطح المكتب',
            paths: ['Desktop Right-Click -> Personalize -> Background', 'Settings -> Personalization -> Background', 'Control Panel -> Appearance', 'Search']
        },
        {
            id: 'personalization.colors',
            section: 'personalization',
            subpage: 'colors',
            icon: 'palette',
            titleKey: 'settings.personalization.colorsTitle',
            parentKey: 'settings.nav.personalization',
            anchor: 'ctrl-accent-colors',
            keywords: 'colors dark mode light theme accent transparency ألوان لون التمييز الوضع الداكن فاتح شفافية',
            paths: ['Settings -> Personalization -> Colors', 'Desktop Right-Click -> Personalize', 'Quick Settings -> Dark mode', 'Search']
        },
        {
            id: 'personalization.themes',
            section: 'personalization',
            subpage: 'themes',
            icon: 'navPersonalization',
            titleKey: 'settings.personalization.themesTitle',
            parentKey: 'settings.nav.personalization',
            anchor: 'ctrl-screensaver-select',
            keywords: 'themes screen saver bubbles ribbons نسق سمة شاشة التوقف',
            paths: ['Desktop Right-Click -> Personalize', 'Settings -> Personalization -> Themes', 'Search']
        },
        {
            id: 'personalization.lockscreen',
            section: 'personalization',
            subpage: 'lockscreen',
            icon: 'lock',
            titleKey: 'settings.personalization.lockscreenTitle',
            parentKey: 'settings.nav.personalization',
            anchor: 'ctrl-lockscreen-preview',
            keywords: 'lock screen شاشة القفل قفل',
            paths: ['Settings -> Personalization -> Lock screen', 'Search']
        },
        {
            id: 'personalization.start',
            section: 'personalization',
            subpage: 'start',
            icon: 'win11',
            titleKey: 'settings.personalization.startTitle',
            parentKey: 'settings.nav.personalization',
            anchor: 'ctrl-start-recommended',
            keywords: 'start menu pinned recommended قائمة ابدأ',
            paths: ['Settings -> Personalization -> Start', 'Search']
        },
        {
            id: 'personalization.taskbar',
            section: 'personalization',
            subpage: 'taskbar',
            icon: 'sliders',
            titleKey: 'settings.personalization.taskbarTitle',
            parentKey: 'settings.nav.personalization',
            anchor: 'ctrl-taskbar-align',
            keywords: 'taskbar alignment search center شريط المهام توسيط محاذاة',
            paths: ['Taskbar Right-Click -> Taskbar settings', 'Settings -> Personalization -> Taskbar', 'Search']
        },
        {
            id: 'apps.installed',
            section: 'apps',
            subpage: 'main',
            icon: 'navApps',
            titleKey: 'settings.apps.installedTitle',
            parentKey: 'settings.nav.apps',
            anchor: 'ctrl-apps-list',
            keywords: 'apps programs uninstall avast office vlc winrar flash تطبيقات برامج إزالة تثبيت',
            paths: ['Settings -> Apps -> Installed apps', 'Control Panel -> Uninstall a program', 'Start -> Apps', 'Search']
        },
        {
            id: 'apps.defaults',
            section: 'apps',
            subpage: 'defaults',
            icon: 'globe',
            titleKey: 'settings.apps.defaultsTitle',
            parentKey: 'settings.nav.apps',
            anchor: 'ctrl-apps-defaults',
            keywords: 'default apps browser pdf edge برامج افتراضية متصفح',
            paths: ['Settings -> Apps -> Default apps', 'Search']
        },
        {
            id: 'apps.startup',
            section: 'apps',
            subpage: 'startup',
            icon: 'refresh',
            titleKey: 'settings.apps.startupTitle',
            parentKey: 'settings.nav.apps',
            anchor: 'ctrl-apps-startup',
            keywords: 'startup boot onedrive بدء التشغيل إقلاع',
            paths: ['Settings -> Apps -> Startup', 'Search']
        },
        {
            id: 'apps.optional',
            section: 'apps',
            subpage: 'optional',
            icon: 'paint',
            titleKey: 'settings.apps.optionalTitle',
            parentKey: 'settings.nav.apps',
            anchor: 'ctrl-apps-optional',
            keywords: 'optional features paint games ميزات اختيارية الرسام ألعاب',
            paths: ['Settings -> Apps -> Optional features', 'Search']
        },
        {
            id: 'accounts.users',
            section: 'accounts',
            subpage: 'main',
            icon: 'navAccounts',
            titleKey: 'settings.nav.accounts',
            anchor: 'ctrl-accounts-list',
            keywords: 'accounts users eleve guest standard admin password avatar uac حسابات مستخدمون ضيف قياسي مسؤول كلمة مرور',
            paths: ['Settings -> Accounts', 'Settings Sidebar Profile Card', 'Start -> User Avatar -> Change settings', 'Control Panel -> User Accounts', 'Search']
        },
        {
            id: 'time.language',
            section: 'timeLanguage',
            subpage: 'language',
            icon: 'navTime',
            titleKey: 'settings.time.languageTitle',
            parentKey: 'settings.nav.timeLanguage',
            anchor: 'ctrl-lang-add',
            keywords: 'language region arabic algeria keyboard add language numerals لغة منطقة عربية جزائر إضافة لغة لوحة مفاتيح أرقام',
            paths: ['Settings -> Time & language -> Language & region', 'Tray Language Indicator -> Keyboard settings', 'Control Panel -> Clock and Region', 'Search']
        },
        {
            id: 'time.datetime',
            section: 'timeLanguage',
            subpage: 'datetime',
            icon: 'clock',
            titleKey: 'settings.time.dateTimeTitle',
            parentKey: 'settings.nav.timeLanguage',
            anchor: 'ctrl-timezone-select',
            keywords: 'date time timezone gmt clock ساعة وقت تاريخ منطقة زمنية الجزائر',
            paths: ['Tray Clock Right-Click -> Adjust date and time', 'Settings -> Time & language -> Date & time', 'Control Panel -> Set time zone', 'Search']
        },
        {
            id: 'gaming.mode',
            section: 'gaming',
            subpage: 'main',
            icon: 'navGaming',
            titleKey: 'settings.nav.gaming',
            anchor: 'ctrl-gaming-toggle',
            keywords: 'gaming xbox game mode ألعاب وضع الألعاب',
            paths: ['Settings -> Gaming', 'Search']
        },
        {
            id: 'accessibility.vision',
            section: 'accessibility',
            subpage: 'main',
            icon: 'navAccessibility',
            titleKey: 'settings.nav.accessibility',
            anchor: 'ctrl-access-textsize',
            keywords: 'accessibility text size contrast reduced motion mouse pointer إمكانية الوصول حجم النص تباين عالي تقليل الحركة',
            paths: ['Settings -> Accessibility', 'Quick Settings -> Accessibility', 'Control Panel -> Ease of Access', 'Search']
        },
        {
            id: 'privacy.security',
            section: 'privacy',
            subpage: 'main',
            icon: 'navPrivacy',
            titleKey: 'settings.nav.privacy',
            anchor: 'ctrl-privacy-security',
            keywords: 'privacy security firewall camera microphone location خصوصية أمان جدار حماية كاميرا ميكروفون موقع',
            paths: ['Settings -> Privacy & security', 'Control Panel -> System and Security', 'Search']
        },
        {
            id: 'update.windows',
            section: 'update',
            subpage: 'main',
            icon: 'navUpdate',
            titleKey: 'settings.nav.update',
            anchor: 'ctrl-update-check',
            keywords: 'windows update check history تحديثات تحديث النظام',
            paths: ['Settings -> Windows Update', 'Settings -> System -> Windows Update hero', 'Search']
        }
    ];

    function findById(id) {
        for (var i = 0; i < ENTRIES.length; i++) {
            if (ENTRIES[i].id === id) return ENTRIES[i];
        }
        return null;
    }

    function openSetting(id) {
        var entry = findById(id) || ENTRIES[0];
        if (global.Win11SettingsApp) {
            global.Win11SettingsApp.openTo(entry.section, entry.subpage, entry.anchor);
        }
        if (global.Win11Shell) {
            global.Win11Shell.closeAllFlyouts();
        }
    }

    function search(query) {
        var q = String(query || '').trim().toLowerCase();
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var out = [];
        for (var i = 0; i < ENTRIES.length; i++) {
            var e = ENTRIES[i];
            var title = t(e.titleKey);
            var parent = e.parentKey ? t(e.parentKey) : '';
            var hay = (title + ' ' + parent + ' ' + e.keywords + ' ' + e.paths.join(' ')).toLowerCase();
            if (!q || hay.indexOf(q) !== -1) {
                out.push({
                    entry: e,
                    title: title,
                    breadcrumb: parent ? (parent + ' > ' + title) : title
                });
            }
        }
        return out;
    }

    global.Win11Registry = {
        ENTRIES: ENTRIES,
        findById: findById,
        open: openSetting,
        search: search
    };
})(window);

