/**
 * Windows 11 Lock & Sign-In Screen (Win+L / Alt+L / Switch User)
 * Handles multiple user accounts, password checks, Guest access rules, and isolated wallpapers.
 */
(function (global) {
    'use strict';

    var selectedName = null;

    function getEl() {
        return document.getElementById('lock-screen');
    }

    function isOpen() {
        var el = getEl();
        return !!(el && el.classList.contains('is-open'));
    }

    function close() {
        var el = getEl();
        if (el) {
            el.classList.remove('is-open');
            el.style.display = 'none';
        }
        if (global.Win11Assessment && typeof global.Win11Assessment.resumeTimer === 'function') {
            global.Win11Assessment.resumeTimer();
        }
        // Ensure Settings window remains cleanly docked to the left as in Picture 2
        try {
            if (global.Win11WM && typeof global.Win11WM.getWindow === 'function') {
                var setWin = global.Win11WM.getWindow('settings');
                if (setWin && !setWin.isMinimized && global.Win11SettingsApp && typeof global.Win11SettingsApp.getOptimalSettingsRect === 'function') {
                    var area = global.Win11WM.getWorkArea();
                    var optRect = global.Win11SettingsApp.getOptimalSettingsRect(area);
                    setWin.rect.x = optRect.x;
                    setWin.rect.y = optRect.y;
                    setWin.rect.w = optRect.w;
                    setWin.rect.h = optRect.h;
                    if (typeof global.Win11WM.applyRect === 'function') global.Win11WM.applyRect(setWin);
                }
            }
        } catch (eDock) { }
    }

    function formatLockDate(now, lang) {
        var daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        var monthsAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        var daysFr = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        var monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        var daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        if (lang === 'ar') return daysAr[now.getDay()] + ' ' + now.getDate() + ' ' + monthsAr[now.getMonth()] + ' ' + now.getFullYear();
        if (lang === 'fr') return daysFr[now.getDay()] + ' ' + now.getDate() + ' ' + monthsFr[now.getMonth()] + ' ' + now.getFullYear();
        return daysEn[now.getDay()] + ', ' + monthsEn[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    }

    function render() {
        var el = getEl();
        if (!el) return;

        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var fmtDigits = global.Win11I18N.formatDigits;
        var lang = global.Win11I18N.getLang();
        var st = global.Win11State.get();

        // Filter available enabled accounts
        var visibleAccounts = [];
        for (var i = 0; i < st.userAccounts.length; i++) {
            var acc = st.userAccounts[i];
            if (acc.type === 'Invité' && !acc.enabled) continue;
            visibleAccounts.push(acc);
        }

        var selectedAcc = null;
        if (selectedName) {
            for (var j = 0; j < visibleAccounts.length; j++) {
                if (visibleAccounts[j].name === selectedName) {
                    selectedAcc = visibleAccounts[j];
                    break;
                }
            }
        }
        if (!selectedAcc) {
            selectedAcc = global.Win11State.getCurrentAccount() || visibleAccounts[0];
            if (selectedAcc && selectedAcc.type === 'Invité' && !selectedAcc.enabled) {
                selectedAcc = visibleAccounts[0];
            }
        }
        selectedName = selectedAcc ? selectedAcc.name : st.currentUser;

        var now = global.Win11State.getSimulatedNow();
        var hh = String(now.getHours());
        var mm = String(now.getMinutes());
        if (hh.length < 2) hh = '0' + hh;
        if (mm.length < 2) mm = '0' + mm;

        var wp = global.Win11State.getWallpaper(st.wallpaperId);
        el.style.backgroundImage = 'url("' + wp.file + '")';

        var needsPassword = !!(selectedAcc && selectedAcc.type !== 'Invité' && selectedAcc.hasPassword && selectedAcc.password);
        var roleLabel = (selectedAcc && selectedAcc.type === 'Administrateur')
            ? t('settings.accounts.adminRole')
            : ((selectedAcc && selectedAcc.type === 'Invité') ? t('settings.accounts.guestRole') : t('settings.accounts.standardRole'));

        var avatarStyle = (selectedAcc && selectedAcc.avatarSrc) ? ' style="background:transparent;overflow:hidden"' : (' style="background:' + global.Win11Compat.escapeHtml((selectedAcc && selectedAcc.color) || 'var(--win-accent)') + ';overflow:hidden"');
        var avatarHtml = global.Win11State.getAvatarInnerHtml ? global.Win11State.getAvatarInnerHtml(selectedAcc) : global.Win11Icons.get('user', 54);

        var html =
            '<div class="lock-scrim"></div>' +
            '<div class="lock-inner">' +
                '<div style="text-align:center">' +
                    '<div style="font-size:64px;font-weight:300;line-height:1.1"><bdi dir="ltr">' + fmtDigits(hh + ':' + mm) + '</bdi></div>' +
                    '<div style="font-size:17px;opacity:0.9;margin-top:4px">' + bidi(formatLockDate(now, lang)) + '</div>' +
                '</div>' +
                '<div class="lock-card">' +
                    '<div class="lock-avatar"' + avatarStyle + '>' + avatarHtml + '</div>' +
                    '<div style="font-size:22px;font-weight:600"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(selectedName) + '</bdi></div>' +
                    '<div style="font-size:12.5px;opacity:0.85">' + bidi(roleLabel) + '</div>';

        if (needsPassword) {
            html +=
                '<div style="display:flex;gap:6px;width:100%">' +
                    '<input type="password" id="lock-pass-input" class="win-input" style="background:rgba(255,255,255,0.92);color:#1B1B1B" placeholder="' + global.Win11Compat.escapeHtml(t('lockScreen.passwordPlaceholder')) + '" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                    '<button type="button" class="win-btn win-btn-accent" id="lock-signin-btn">' + bidi(t('lockScreen.signIn')) + '</button>' +
                '</div>' +
                '<div id="lock-error-msg" style="font-size:12.5px;color:#FCA5A5;min-height:18px"></div>';
        } else {
            html +=
                '<div style="font-size:12.5px;opacity:0.85">' + bidi(selectedAcc && selectedAcc.type === 'Invité' ? t('lockScreen.guestNote') : t('lockScreen.noPassNote')) + '</div>' +
                '<button type="button" class="win-btn win-btn-accent" id="lock-signin-btn" style="min-width:160px">' + bidi(t('lockScreen.signIn')) + '</button>';
        }

        html +=
                '</div>' +
                '<div style="display:flex;width:100%;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap">' +
                    '<div class="lock-accounts-strip">';

        for (var k = 0; k < visibleAccounts.length; k++) {
            var va = visibleAccounts[k];
            var pillAvatar = va.avatarSrc
                ? '<span style="width:18px;height:18px;border-radius:50%;overflow:hidden;display:inline-flex">' + global.Win11State.getAvatarInnerHtml(va) + '</span>'
                : global.Win11Icons.get('user', 16);
            html +=
                '<button type="button" class="lock-account-pill' + (va.name === selectedName ? ' is-active' : '') + '" data-lock-acc="' + global.Win11Compat.escapeHtml(va.name) + '">' +
                    pillAvatar +
                    '<span><bdi dir="ltr">' + global.Win11Compat.escapeHtml(va.name) + '</bdi></span>' +
                '</button>';
        }
        html +=
                    '</div>' +
                    '<button type="button" class="lock-account-pill" id="lock-cancel-btn">' + bidi(t('lockScreen.backToDesktop')) + '</button>' +
                '</div>' +
            '</div>';

        el.innerHTML = html;

        function attemptSignIn() {
            try {
                if (!selectedAcc) {
                    selectedAcc = (selectedName && global.Win11State && typeof global.Win11State.getAccount === 'function')
                        ? global.Win11State.getAccount(selectedName)
                        : (global.Win11State && typeof global.Win11State.getCurrentAccount === 'function' ? global.Win11State.getCurrentAccount() : null);
                }
                if (!selectedAcc) { close(); return; }

                if (needsPassword) {
                    var inp = el.querySelector('#lock-pass-input');
                    var errEl = el.querySelector('#lock-error-msg');
                    var entered = inp ? inp.value : '';
                    if (entered !== selectedAcc.password) {
                        if (errEl) errEl.innerHTML = bidi(t('lockScreen.wrongPassword'));
                        if (global.Win11State && typeof global.Win11State.triggerElementShake === 'function') {
                            global.Win11State.triggerElementShake(inp);
                        }
                        if (inp) { inp.value = ''; inp.focus(); }
                        if (global.Win11Assessment && typeof global.Win11Assessment.recordMistake === 'function') {
                            global.Win11Assessment.recordMistake(6, 'كلمة مرور خاطئة في شاشة تسجيل الدخول', 'إدخال كلمة مرور خاطئة للحساب: ' + selectedAcc.name, 0.25);
                        }
                        return;
                    }
                }
                if (global.Win11State && typeof global.Win11State.recordLoginSuccess === 'function') {
                    try {
                        global.Win11State.recordLoginSuccess(selectedAcc.name, needsPassword);
                    } catch (eRec) {
                        if (global.console && typeof global.console.warn === 'function') global.console.warn(eRec);
                    }
                }
                if (global.Win11State && typeof global.Win11State.switchUser === 'function') {
                    global.Win11State.switchUser(selectedAcc.name);
                }
                // Close lock screen ONLY on successful authentication and user switch
                close();
            } catch (err) {
                if (global.console && typeof global.console.error === 'function') {
                    global.console.error('[LockScreen.attemptSignIn]', err);
                }
                close();
            }
        }

        el.querySelector('#lock-signin-btn').onclick = attemptSignIn;
        var passInp = el.querySelector('#lock-pass-input');
        if (passInp) {
            passInp.onkeydown = function (e) {
                if (e.key === 'Enter') attemptSignIn();
            };
            setTimeout(function () { passInp.focus(); }, 40);
        }

        var accBtns = el.querySelectorAll('[data-lock-acc]');
        for (var m = 0; m < accBtns.length; m++) {
            accBtns[m].onclick = function () {
                selectedName = this.getAttribute('data-lock-acc');
                render();
            };
        }

        el.querySelector('#lock-cancel-btn').onclick = close;
    }

    function open(preferredAccountName) {
        if (global.Win11Assessment && typeof global.Win11Assessment.pauseTimer === 'function') {
            global.Win11Assessment.pauseTimer('lock_screen');
        }
        if (global.Win11Shell) global.Win11Shell.closeAllFlyouts('lock');
        selectedName = preferredAccountName || null;
        render();
        var el = getEl();
        if (el) {
            el.style.display = 'flex';
            el.classList.add('is-open');
        }
    }

    global.Win11LockScreen = {
        open: open,
        close: close,
        isOpen: isOpen
    };
})(window);

