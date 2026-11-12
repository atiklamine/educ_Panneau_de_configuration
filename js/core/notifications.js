/**
 * Windows 11 Notification Center & Monthly Calendar Flyout (Win+N / Alt+N)
 */
(function (global) {
    'use strict';

    function getEl() {
        return document.getElementById('notifications-flyout');
    }

    function isOpen() {
        var el = getEl();
        return !!(el && el.classList.contains('is-open'));
    }

    function close() {
        var el = getEl();
        if (el) el.classList.remove('is-open');
    }

    function getWeekdayHeaders(lang) {
        if (lang === 'ar') return ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
        if (lang === 'fr') return ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    }

    function formatMonthYear(dateObj, lang) {
        var monthsAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        var monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        var monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var list = (lang === 'ar') ? monthsAr : ((lang === 'fr') ? monthsFr : monthsEn);
        return list[dateObj.getMonth()] + ' ' + dateObj.getFullYear();
    }

    function render() {
        var el = getEl();
        if (!el) return;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var fmtDigits = global.Win11I18N.formatDigits;
        var lang = global.Win11I18N.getLang();
        var st = global.Win11State.get();
        var now = global.Win11State.getSimulatedNow();

        // 1. Notifications card
        var notifHtml =
            '<div class="notif-panel win-acrylic">' +
                '<div class="notif-header">' +
                    '<span style="font-weight:600;font-size:14px">' + bidi(t('notif.title')) + '</span>' +
                    '<div style="display:flex;gap:6px">' +
                        '<button type="button" class="win-btn win-btn-subtle" id="notif-dnd-btn" style="height:26px;min-height:26px;padding:2px 8px;font-size:12px">' +
                            global.Win11Icons.get('moon', 13) +
                            '<span>' + bidi(t('notif.dnd')) + (st.dnd ? ' (' + bidi(t('app.enabled')) + ')' : '') + '</span>' +
                        '</button>' +
                        '<button type="button" class="win-btn win-btn-subtle" id="notif-clear-btn" style="height:26px;min-height:26px;padding:2px 8px;font-size:12px">' +
                            bidi(t('notif.clearAll')) +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div style="max-height:210px;overflow-y:auto">';

        if (!st.notifications || st.notifications.length === 0) {
            notifHtml += '<div style="text-align:center;color:var(--win-text-secondary);padding:18px 8px;font-size:13px">' + bidi(t('notif.empty')) + '</div>';
        } else {
            for (var i = 0; i < st.notifications.length; i++) {
                var n = st.notifications[i];
                var nTitle = n.raw ? n.titleKey : t(n.titleKey);
                var nBody = n.raw ? n.bodyKey : t(n.bodyKey);
                notifHtml +=
                    '<div class="notif-item">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center">' +
                            '<div class="notif-item-title">' + bidi(nTitle) + '</div>' +
                            '<span style="font-size:11px;color:var(--win-text-tertiary)"><bdi dir="ltr">' + fmtDigits(n.time) + '</bdi></span>' +
                        '</div>' +
                        '<div class="notif-item-body">' + bidi(nBody) + '</div>' +
                    '</div>';
            }
        }
        notifHtml += '</div></div>';

        // 2. Calendar card
        var year = now.getFullYear();
        var month = now.getMonth();
        var today = now.getDate();
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var prevDays = new Date(year, month, 0).getDate();

        var calHtml =
            '<div class="notif-panel win-acrylic">' +
                '<div class="notif-header">' +
                    '<span style="font-weight:600;font-size:14px">' + bidi(formatMonthYear(now, lang)) + '</span>' +
                    '<button type="button" class="win-btn win-btn-subtle" id="notif-time-settings" style="height:26px;min-height:26px;padding:2px 8px;font-size:11.5px">' +
                        global.Win11Icons.get('clock', 13) +
                        '<span><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.timeZoneId) + '</bdi></span>' +
                    '</button>' +
                '</div>' +
                '<div class="calendar-weekdays">';

        var wk = getWeekdayHeaders(lang);
        for (var w = 0; w < 7; w++) {
            calHtml += '<div>' + wk[w] + '</div>';
        }
        calHtml += '</div><div class="calendar-days">';

        for (var p = firstDay - 1; p >= 0; p--) {
            calHtml += '<div class="calendar-day is-muted"><bdi dir="ltr">' + fmtDigits(prevDays - p) + '</bdi></div>';
        }
        for (var d = 1; d <= daysInMonth; d++) {
            calHtml += '<div class="calendar-day' + (d === today ? ' is-today' : '') + '"><bdi dir="ltr">' + fmtDigits(d) + '</bdi></div>';
        }
        var totalCells = firstDay + daysInMonth;
        var trailing = (7 - (totalCells % 7)) % 7;
        for (var nx = 1; nx <= trailing; nx++) {
            calHtml += '<div class="calendar-day is-muted"><bdi dir="ltr">' + fmtDigits(nx) + '</bdi></div>';
        }
        calHtml += '</div></div>';

        el.innerHTML = notifHtml + calHtml;

        el.querySelector('#notif-dnd-btn').onclick = function () {
            global.Win11State.set({ dnd: !global.Win11State.get().dnd }, 'notifications:changed');
            render();
        };
        el.querySelector('#notif-clear-btn').onclick = function () {
            global.Win11State.set({ notifications: [] }, 'notifications:changed');
            render();
        };
        el.querySelector('#notif-time-settings').onclick = function () {
            close();
            global.Win11Registry.open('time.datetime');
        };
    }

    function open() {
        if (global.Win11Shell) global.Win11Shell.closeAllFlyouts('notifications');
        render();
        var el = getEl();
        if (el) el.classList.add('is-open');
    }

    function toggle() {
        if (isOpen()) close();
        else open();
    }

    global.Win11Notifications = {
        open: open,
        close: close,
        toggle: toggle,
        isOpen: isOpen,
        refresh: function () { if (isOpen()) render(); }
    };
})(window);

