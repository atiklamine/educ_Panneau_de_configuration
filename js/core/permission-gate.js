/**
 * Windows 11 Privilege & UAC Permission Gate (Administrateur / Standard / Invité)
 * Enforces realistic Windows OS capability semantics, Arabic UAC elevation prompts,
 * hard Guest restrictions, and pedagogical mistake logging.
 */
(function (global) {
    'use strict';

    // Capability policy table: 'allow' | 'uac' (Admin elevation prompt for Standard) | 'deny'
    var CAPABILITY_MATRIX = {
        // Applications & Startup (System HKLM vs Per-User HKCU)
        'apps.uninstall':       { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 5, labelAr: 'إزالة تثبيت برنامج نظام' },
        'apps.startup':         { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 5, labelAr: 'تعديل تطبيقات بدء التشغيل' },
        'apps.userApp':         { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: null, labelAr: 'تثبيت أو إزالة تطبيق مستخدم' },

        // User Accounts & Security (System SAM)
        'accounts.create':      { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 6, labelAr: 'إنشاء حساب مستخدم جديد' },
        'accounts.editOther':   { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 6, labelAr: 'تعديل حساب مستخدم آخر' },
        'accounts.changeType':  { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 6, labelAr: 'تغيير نوع الحساب أو صلاحياته' },
        'accounts.delete':      { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 6, labelAr: 'حذف حساب مستخدم' },
        'accounts.toggleGuest': { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 6, labelAr: 'تفعيل أو تعطيل حساب الضيف' },
        'accounts.editSelf':    { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: 6, labelAr: 'تعديل كلمة المرور والصورة الشخصية' },

        // Personalization & Display (HKCU for Standard, Locked in Guest profile)
        'personalization.wallpaper': { admin: 'allow', standard: 'allow', guest: 'deny', taskId: 4, labelAr: 'تغيير خلفية سطح المكتب' },
        'personalization.theme':     { admin: 'allow', standard: 'allow', guest: 'deny', taskId: 4, labelAr: 'تغيير المظهر وألوان التمييز' },
        'personalization.taskbar':   { admin: 'allow', standard: 'allow', guest: 'deny', taskId: 4, labelAr: 'تعديل خصائص شريط المهام' },
        'personalization.saver':     { admin: 'allow', standard: 'allow', guest: 'deny', taskId: 4, labelAr: 'ضبط شاشة التوقف' },

        // System Settings
        'system.display':       { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: null, labelAr: 'تعديل إعدادات العرض والسطوع' },
        'system.sound':         { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: null, labelAr: 'تعديل إعدادات الصوت' },
        'system.notifications': { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: null, labelAr: 'تعديل إعدادات الإشعارات' },
        'system.power':         { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: null, labelAr: 'تعديل خطة الطاقة للنظام' },
        'system.rename':        { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: null, labelAr: 'إعادة تسمية الجهاز' },

        // Devices & Network & Time/Language
        'devices.mouse':        { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: 2, labelAr: 'ضبط خصائص الفأرة والمؤشر' },
        'devices.bluetooth':    { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: 2, labelAr: 'تعديل حالة Bluetooth' },
        'network.wifi':         { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: null, labelAr: 'تغيير إعدادات Wi-Fi' },
        'network.admin':        { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: null, labelAr: 'تعديل VPN أو الوكيل أو وضع الطيران' },
        'time.languageAdd':     { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 3, labelAr: 'تثبيت حزمة لغة جديدة للنظام' },
        'time.timezone':        { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: 3, labelAr: 'تغيير المنطقة الزمنية والتاريخ' },
        'time.uiLanguage':      { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: 1, labelAr: 'تبديل لغة واجهة المستخدم' },
        'accessibility.change': { admin: 'allow', standard: 'allow', guest: 'deny',  taskId: null, labelAr: 'تعديل إعدادات إمكانية الوصول' },
        'privacy.security':     { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: null, labelAr: 'تعديل إعدادات الخصوصية وجدار الحماية' },
        'update.install':       { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: null, labelAr: 'البحث عن تحديثات النظام وتثبيتها' },
        'explorer.modify':      { admin: 'allow', standard: 'allow', guest: 'allow',  taskId: null, labelAr: 'إنشاء أو تعديل الملفات في مجلد المستخدم' },
        'accounts.avatarSelf':  { admin: 'allow', standard: 'allow', guest: 'deny',   taskId: 6, labelAr: 'تغيير الصورة الرمزية للحساب' },
        'accounts.avatarOther': { admin: 'allow', standard: 'deny',  guest: 'deny',   taskId: 6, labelAr: 'تغيير الصورة الرمزية لمستخدم آخر' },
        'apps.install':         { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 5, labelAr: 'تثبيت تطبيقات عبر ملف التثبيت' },
        'apps.optional':        { admin: 'allow', standard: 'uac',   guest: 'deny',  taskId: 5, labelAr: 'إدارة الميزات الاختيارية لنظام Windows' }
    };

    var loggedGuestActionsThisSession = {};

    function getCurrentRole() {
        if (!global.Win11State) return 'Administrateur';
        var acc = global.Win11State.getCurrentAccount();
        return acc && acc.type ? acc.type : 'Standard';
    }

    function isAdmin() { return getCurrentRole() === 'Administrateur'; }
    function isStandard() { return getCurrentRole() === 'Standard'; }
    function isGuest() { return getCurrentRole() === 'Invité'; }

    function getPolicy(actionId) {
        var entry = CAPABILITY_MATRIX[actionId] || { admin: 'allow', standard: 'uac', guest: 'deny', taskId: null, labelAr: actionId };
        var role = getCurrentRole();
        var level = (role === 'Administrateur') ? entry.admin : ((role === 'Invité') ? entry.guest : entry.standard);
        return {
            actionId: actionId,
            role: role,
            level: level,
            allowed: (level === 'allow'),
            needsUac: (level === 'uac'),
            deniedForGuest: (role === 'Invité' && level === 'deny'),
            taskId: entry.taskId || null,
            labelAr: entry.labelAr || actionId
        };
    }

    function getAdminAccounts() {
        var st = global.Win11State ? global.Win11State.get() : null;
        var list = (st && st.userAccounts) ? st.userAccounts : [];
        return list.filter(function (a) { return a.type === 'Administrateur' && a.enabled !== false; });
    }

    function logUnauthorizedMistake(policy, reasonTitle, detailText) {
        if (!global.Win11Assessment) return;
        var dedupeKey = policy.role + '::' + policy.actionId + '::' + reasonTitle;
        if (policy.deniedForGuest && loggedGuestActionsThisSession[dedupeKey]) return;
        if (policy.deniedForGuest) loggedGuestActionsThisSession[dedupeKey] = true;

        var cfg = global.Win11Assessment.getConfig();
        var taskId = policy.taskId || 5;
        global.Win11Assessment.recordMistake(
            taskId,
            reasonTitle,
            detailText,
            cfg ? cfg.penalty_error : 0.25
        );
    }

    function resetMistakeDedupe() {
        loggedGuestActionsThisSession = {};
    }

    function showGuestDeniedDialog(policy, targetLabel, opts) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var actionText = targetLabel || policy.labelAr || policy.actionId;

        var isAvatarGuestAction = (policy.actionId === 'accounts.avatarSelf' || policy.actionId === 'accounts.avatarOther');

        // Section 2 (Fair Permissions Exploration): Exploring Guest limitations (UAC / Access Denied)
        // is a required pedagogical step and NEVER deducts mistake points.
        if (global.Win11State && typeof global.Win11State.recordGuestBlockedAction === 'function') {
            global.Win11State.recordGuestBlockedAction(policy.actionId, actionText);
        }

        if (opts && opts.silent) return;

        var customDeniedBody = isAvatarGuestAction
            ? (t('settings.accounts.uacAvatarGuestDenied') || 'لا يملك حساب الضيف (Invité) صلاحية تغيير الصورة الرمزية.')
            : (t('uac.guestBlockedBody') || 'أنت تستخدم حالياً حساب الضيف (Invité) وهو حساب محدود ومؤقت في نظام Windows 11 ولا يسمح له بإزالة البرامج أو تغيير إعدادات النظام أو إدارة المستخدمين.');

        var msgHtml =
            '<div style="display:flex;flex-direction:column;gap:8px">' +
                '<div style="font-weight:700;color:var(--win-warning)">' + bidi(t('uac.guestBlockedHeading') || 'تم حظر هذا الإجراء بواسطة التحكم في حساب المستخدم (UAC)') + '</div>' +
                '<div>' + bidi(customDeniedBody) + '</div>' +
                '<div class="win-card" style="background:var(--win-surface-subtle);padding:8px 12px;margin:2px 0">' +
                    '<strong>' + bidi(t('uac.actionLabel') || 'الإجراء المطلوب:') + '</strong> ' + bidi(actionText) +
                '</div>' +
                '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t('uac.guestSwitchTip') || 'قم بتبديل المستخدم إلى حساب المدير (Administrateur) لإتمام هذه العملية.') + '</div>' +
            '</div>';

        global.Win11Dialogs.showCustom({
            title: t('settings.accounts.uacDeniedTitle') || 'التحكم في حساب المستخدم (UAC)',
            tone: 'warning',
            renderBody: function (wrap) {
                wrap.innerHTML = msgHtml;
            },
            buttons: [
                {
                    label: t('settings.accounts.switchUserBtn') || 'تبديل المستخدم',
                    primary: false,
                    onClick: function (closeDlg) {
                        closeDlg(false);
                        if (global.Win11LockScreen) global.Win11LockScreen.open();
                    }
                },
                { label: t('app.ok') || 'موافق', primary: true, value: true }
            ]
        });
    }

    function showUacElevationDialog(policy, targetLabel, onAuthorized, opts) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var admins = getAdminAccounts();
        var actionText = targetLabel || policy.labelAr || policy.actionId;

        if (admins.length === 0) {
            showGuestDeniedDialog(policy, actionText, opts);
            if (opts && typeof opts.onDenied === 'function') opts.onDenied();
            return;
        }

        var selectedAdminName = admins[0].name;

        global.Win11Dialogs.showCustom({
            title: t('uac.promptTitle') || 'التحكم في حساب المستخدم (UAC)',
            tone: 'warning',
            renderBody: function (wrap) {
                function draw() {
                    var selectedAdmin = null;
                    for (var i = 0; i < admins.length; i++) {
                        if (admins[i].name === selectedAdminName) { selectedAdmin = admins[i]; break; }
                    }
                    if (!selectedAdmin) selectedAdmin = admins[0];

                    var adminOpts = '';
                    for (var j = 0; j < admins.length; j++) {
                        adminOpts += '<option value="' + global.Win11Compat.escapeHtml(admins[j].name) + '"' + (admins[j].name === selectedAdmin.name ? ' selected' : '') + '>' + global.Win11Compat.escapeHtml(admins[j].name) + '</option>';
                    }

                    var requiresPass = !!(selectedAdmin.hasPassword && selectedAdmin.password);
                    wrap.innerHTML =
                        '<div style="display:flex;flex-direction:column;gap:10px">' +
                            '<div style="font-weight:700">' + bidi(t('uac.elevationQuestion') || 'هل تريد السماح لهذا التطبيق بإجراء تغييرات على جهازك؟') + '</div>' +
                            '<div class="win-card" style="background:var(--win-surface-subtle);padding:8px 12px;margin:0">' +
                                '<div><strong>' + bidi(t('uac.actionLabel') || 'الإجراء المطلوب:') + '</strong> ' + bidi(actionText) + '</div>' +
                                '<div style="font-size:12px;color:var(--win-text-secondary);margin-top:4px">' + bidi(t('uac.standardExplain') || 'أنت مسجل كـ Standard — يتطلب المتابعة تفويض حساب مدير (Administrateur).') + '</div>' +
                            '</div>' +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('uac.selectAdminLabel') || 'حساب المدير المفوّض:') + '</label>' +
                                '<select id="uac-admin-select" class="win-select" dir="ltr">' + adminOpts + '</select>' +
                            '</div>' +
                            (requiresPass ? (
                                '<div>' +
                                    '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('lockScreen.passwordPlaceholder') || 'كلمة مرور المدير:') + '</label>' +
                                    '<input type="password" id="uac-admin-pass" class="win-input" dir="ltr">' +
                                '</div>'
                            ) : (
                                '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi(t('uac.noPassAdminNote') || 'لا يملك هذا المدير كلمة مرور؛ انقر "نعم" لتفويض الإجراء أو "لا" للرفض.') + '</div>'
                            )) +
                            '<div id="uac-err-msg" style="color:var(--win-danger);font-size:12px;min-height:16px"></div>' +
                        '</div>';

                    var sel = wrap.querySelector('#uac-admin-select');
                    if (sel) {
                        sel.onchange = function () {
                            selectedAdminName = this.value;
                            draw();
                        };
                    }
                    var passInp = wrap.querySelector('#uac-admin-pass');
                    if (passInp) {
                        setTimeout(function () { passInp.focus(); }, 30);
                    }
                }
                draw();
            },
            buttons: [
                {
                    label: t('app.yes') || 'نعم',
                    primary: true,
                    onClick: function (closeDlg) {
                        var sel = document.getElementById('uac-admin-select');
                        var passInp = document.getElementById('uac-admin-pass');
                        var errEl = document.getElementById('uac-err-msg');
                        var chosenName = sel ? sel.value : selectedAdminName;
                        var chosenAdmin = null;
                        for (var i = 0; i < admins.length; i++) {
                            if (admins[i].name === chosenName) { chosenAdmin = admins[i]; break; }
                        }
                        if (!chosenAdmin) return true;
                        var needsPass = !!(chosenAdmin.hasPassword && chosenAdmin.password);
                        if (needsPass) {
                            var entered = passInp ? passInp.value : '';
                            if (entered !== chosenAdmin.password) {
                                if (errEl) errEl.innerHTML = bidi(t('uac.wrongPassword') || t('lockScreen.wrongPassword'));
                                if (global.Win11State && typeof global.Win11State.triggerElementShake === 'function') {
                                    global.Win11State.triggerElementShake(passInp);
                                }
                                if (passInp) { passInp.value = ''; passInp.focus(); }
                                logUnauthorizedMistake(policy, 'فشل مصادقة UAC بكلمة مرور خاطئة', 'محاولة رفع الصلاحيات للإجراء: ' + actionText);
                                return true;
                            }
                        }
                        closeDlg(true);
                        if (typeof onAuthorized === 'function') {
                            onAuthorized({ elevated: true, adminName: chosenAdmin.name, role: policy.role });
                        }
                    }
                },
                {
                    label: t('app.no') || 'لا',
                    primary: false,
                    onClick: function (closeDlg) {
                        closeDlg(false);
                        if (opts && opts.recordMistakeOnCancel) {
                            logUnauthorizedMistake(policy, 'رفض تفويض UAC', 'إلغاء الإجراء الإداري: ' + actionText);
                        }
                        if (opts && typeof opts.onDenied === 'function') opts.onDenied();
                    }
                }
            ]
        });
    }

    function guard(actionId, onAuthorized, opts) {
        // Teacher Policy Overrides (theme_lock / multi_user_mode)
        var cfg = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : null;
        if (cfg && cfg.theme_lock && (actionId === 'personalization.theme' || actionId === 'personalization.wallpaper')) {
            if (!opts || !opts.silent) {
                global.Win11Dialogs.showMessage(
                    global.Win11I18N.t('settings.accounts.uacDeniedTitle') || 'UAC',
                    'تم قفل تغيير المظهر والألوان بواسطة إعدادات الأستاذ.',
                    'warning'
                );
            }
            if (opts && typeof opts.onDenied === 'function') opts.onDenied();
            return false;
        }
        if (cfg && cfg.multi_user_mode === false && (actionId === 'accounts.create' || actionId === 'accounts.toggleGuest')) {
            if (!opts || !opts.silent) {
                global.Win11Dialogs.showMessage(
                    global.Win11I18N.t('settings.accounts.uacDeniedTitle') || 'UAC',
                    'تم تعيين هذا الجهاز في وضع المستخدم الواحد بواسطة الأستاذ.',
                    'warning'
                );
            }
            if (opts && typeof opts.onDenied === 'function') opts.onDenied();
            return false;
        }

        var policy = getPolicy(actionId);
        if (policy.allowed) {
            if (typeof onAuthorized === 'function') {
                onAuthorized({ elevated: false, role: policy.role });
            }
            return true;
        }
        if (policy.deniedForGuest) {
            showGuestDeniedDialog(policy, opts && opts.targetLabel, opts);
            if (opts && typeof opts.onDenied === 'function') opts.onDenied();
            return false;
        }
        if (policy.needsUac) {
            if (opts && opts.noPrompt) {
                logUnauthorizedMistake(policy, 'نقص صلاحيات المستخدم القياسي', policy.labelAr);
                if (opts && typeof opts.onDenied === 'function') opts.onDenied();
                return false;
            }
            showUacElevationDialog(policy, opts && opts.targetLabel, onAuthorized, opts);
            return false;
        }
        if (opts && typeof opts.onDenied === 'function') opts.onDenied();
        return false;
    }

    global.Win11Permissions = {
        CAPABILITY_MATRIX: CAPABILITY_MATRIX,
        getCurrentRole: getCurrentRole,
        isAdmin: isAdmin,
        isStandard: isStandard,
        isGuest: isGuest,
        getPolicy: getPolicy,
        can: function (actionId) { return getPolicy(actionId).allowed; },
        isRestrictedForGuest: function (actionId) { return getPolicy(actionId).deniedForGuest; },
        guard: guard,
        resetMistakeDedupe: resetMistakeDedupe
    };
})(window);

