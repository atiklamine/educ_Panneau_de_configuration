(function (global) {
    'use strict';

    function openAddLanguageWizard(ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var curLang = global.Win11I18N.getLang();

        var step = 1;
        var filterQ = '';
        var selectedLang = null;

        global.Win11Dialogs.showCustom({
            title: t('settings.time.wizardTitle'),
            tone: 'info',
            wide: true,
            hideFooter: true,
            renderBody: function (wrap, dlg, closeDlg) {
                function drawStep() {
                    if (step === 1) {
                        var listHtml = '';
                        for (var i = 0; i < global.Win11State.LANGUAGE_CATALOG.length; i++) {
                            var item = global.Win11State.LANGUAGE_CATALOG[i];
                            var displayName = (curLang === 'ar') ? item.nameAr : item.nameOther;
                            if (filterQ && (item.nameAr + ' ' + item.nameOther + ' ' + item.code).toLowerCase().indexOf(filterQ.toLowerCase()) === -1) {
                                continue;
                            }
                            var already = st.installedLanguages.some(function (x) { return x.id === item.id; });
                            var isSel = selectedLang && selectedLang.id === item.id;
                            listHtml +=
                                '<button type="button" class="setting-row' + (already ? '' : ' is-clickable') + (isSel ? ' setting-highlight' : '') + '" data-lang-id="' + item.id + '"' + (already ? ' disabled style="opacity:0.55"' : '') + '>' +
                                    '<span class="win-badge win-badge-info"><bdi dir="ltr">' + item.code + '</bdi></span>' +
                                    '<div class="setting-row-text">' +
                                        '<div class="setting-row-title">' + bidi(displayName) + '</div>' +
                                        '<div class="setting-row-desc"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(item.keyboard) + '</bdi>' + (already ? ' — ' + bidi(t('app.enabled')) : '') + '</div>' +
                                    '</div>' +
                                '</button>';
                        }

                        wrap.innerHTML =
                            '<div style="font-size:13px;color:var(--win-text-secondary);margin-bottom:10px">' + bidi(t('settings.time.wizardSub')) + '</div>' +
                            '<input type="text" id="wiz-lang-search" class="win-input" value="' + global.Win11Compat.escapeHtml(filterQ) + '" placeholder="' + global.Win11Compat.escapeHtml(t('settings.time.wizardSearch')) + '" style="margin-bottom:10px">' +
                            '<div style="max-height:240px;overflow-y:auto">' + listHtml + '</div>' +
                            '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
                                '<button type="button" class="win-btn win-btn-secondary" id="wiz-cancel">' + bidi(t('app.cancel')) + '</button>' +
                                '<button type="button" class="win-btn win-btn-accent" id="wiz-next"' + (selectedLang ? '' : ' disabled') + '>' + bidi(t('app.next')) + '</button>' +
                            '</div>';

                        var sInp = wrap.querySelector('#wiz-lang-search');
                        sInp.oninput = function () {
                            filterQ = this.value;
                            drawStep();
                            var reFocus = wrap.querySelector('#wiz-lang-search');
                            if (reFocus) { reFocus.focus(); reFocus.setSelectionRange(filterQ.length, filterQ.length); }
                        };
                        var rows = wrap.querySelectorAll('[data-lang-id]');
                        for (var r = 0; r < rows.length; r++) {
                            rows[r].onclick = function () {
                                var lid = this.getAttribute('data-lang-id');
                                for (var m = 0; m < global.Win11State.LANGUAGE_CATALOG.length; m++) {
                                    if (global.Win11State.LANGUAGE_CATALOG[m].id === lid) {
                                        selectedLang = global.Win11State.LANGUAGE_CATALOG[m];
                                        break;
                                    }
                                }
                                drawStep();
                            };
                        }
                        wrap.querySelector('#wiz-cancel').onclick = function () { closeDlg(false); };
                        wrap.querySelector('#wiz-next').onclick = function () { step = 2; drawStep(); };
                    } else if (step === 2) {
                        var disp = (curLang === 'ar') ? selectedLang.nameAr : selectedLang.nameOther;
                        wrap.innerHTML =
                            '<div style="font-weight:700;font-size:15px;margin-bottom:10px">' + bidi(t('settings.time.wizardStep2Title')) + ': ' + bidi(disp) + '</div>' +
                            '<div class="win-card" style="display:flex;flex-direction:column;gap:10px">' +
                                '<label><input type="checkbox" checked disabled> ' + bidi(t('settings.time.wizardPackCore')) + '</label>' +
                                '<label><input type="checkbox" checked> ' + bidi(t('settings.time.wizardPackTts')) + '</label>' +
                                '<label><input type="checkbox"> ' + bidi(t('settings.time.wizardPackSpeech')) + '</label>' +
                                '<label><input type="checkbox"> ' + bidi(t('settings.time.wizardPackHandwriting')) + '</label>' +
                            '</div>' +
                            '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
                                '<button type="button" class="win-btn win-btn-secondary" id="wiz-back">' + bidi(t('app.back')) + '</button>' +
                                '<button type="button" class="win-btn win-btn-accent" id="wiz-install">' + bidi(t('app.install')) + '</button>' +
                            '</div>';
                        wrap.querySelector('#wiz-back').onclick = function () { step = 1; drawStep(); };
                        wrap.querySelector('#wiz-install').onclick = function () { step = 3; drawStep(); };
                    } else {
                        wrap.innerHTML =
                            '<div id="wiz-inst-status" style="margin-bottom:12px">' + bidi(t('settings.time.wizardInstalling')) + '</div>' +
                            '<div class="win-progress"><div class="win-progress-fill" id="wiz-inst-bar" style="width:15%"></div></div>' +
                            '<div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" class="win-btn win-btn-accent" id="wiz-finish" disabled>' + bidi(t('app.finish')) + '</button></div>';
                        var bar = wrap.querySelector('#wiz-inst-bar');
                        var msg = wrap.querySelector('#wiz-inst-status');
                        var fin = wrap.querySelector('#wiz-finish');
                        var tick = 0;
                        var tm = setInterval(function () {
                            tick += 1;
                            if (tick === 1) bar.style.width = '55%';
                            else if (tick === 2) bar.style.width = '90%';
                            else {
                                clearInterval(tm);
                                bar.style.width = '100%';
                                msg.innerHTML = '<span style="color:var(--win-success);font-weight:600">' + bidi(t('settings.time.wizardComplete')) + '</span>';
                                fin.disabled = false;
                                var dispLabel = (curLang === 'ar' ? selectedLang.nameAr : selectedLang.nameOther);
                                if (typeof global.Win11State.addInputLanguage === 'function') {
                                    global.Win11State.addInputLanguage(selectedLang, dispLabel);
                                } else {
                                    global.Win11State.update(function (d) {
                                        var exists = d.installedLanguages.some(function (x) { return x.id === selectedLang.id; });
                                        if (!exists) {
                                            d.installedLanguages.push({
                                                id: selectedLang.id,
                                                code: selectedLang.code,
                                                display: dispLabel,
                                                keyboard: selectedLang.keyboard
                                            });
                                        }
                                    }, 'language:installed');
                                }
                                ctx.navigate('timeLanguage', 'language');
                            }
                        }, 360);
                        fin.onclick = function () { closeDlg(true); };
                    }
                }
                drawStep();
            }
        });
    }

    global.Win11SettingsApp.register('timeLanguage', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var sub = ctx.subpage || 'main';
        var goRoot = function () { ctx.navigate('timeLanguage', 'main'); };

        if (sub === 'datetime') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.timeLanguage'), goRoot, t('settings.time.dateTimeTitle')));
            ctx.container.appendChild(ctx.ui.rowSelect({
                id: 'ctrl-timezone-select',
                icon: 'clock',
                title: t('settings.time.timezoneLabel'),
                value: st.timeZoneId,
                permAction: 'time.timezone',
                options: [
                    { value: 'GMT+0', label: '(UTC+00:00) London / Coordinated Universal Time (GMT+0)' },
                    { value: 'GMT+1', label: '(UTC+01:00) Alger / Algérie — الجزائر (GMT+1)' },
                    { value: 'GMT+2', label: '(UTC+02:00) Cairo / Athens (GMT+2)' }
                ],
                onChange: function (v) {
                    global.Win11State.set({ timeZoneId: v }, 'clock:changed');
                }
            }));
            ctx.container.appendChild(ctx.ui.rowToggle({
                title: t('settings.time.autoTimeLabel'),
                checked: st.autoTime,
                permAction: 'time.timezone',
                onChange: function (v) { global.Win11State.set({ autoTime: v }); }
            }));
            return;
        }

        if (sub === 'language' || sub === 'main') {
            ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.timeLanguage'), sub === 'language' ? goRoot : null, sub === 'language' ? t('settings.time.languageTitle') : null));

            if (sub === 'main') {
                ctx.container.appendChild(ctx.ui.rowLink({
                    icon: 'globe',
                    title: t('settings.time.languageTitle'),
                    desc: t('settings.time.languageDesc'),
                    onClick: function () { ctx.navigate('timeLanguage', 'language'); }
                }));
                ctx.container.appendChild(ctx.ui.rowLink({
                    icon: 'clock',
                    title: t('settings.time.dateTimeTitle'),
                    desc: t('settings.time.dateTimeDesc'),
                    value: st.timeZoneId,
                    onClick: function () { ctx.navigate('timeLanguage', 'datetime'); }
                }));
            }

            ctx.container.appendChild(ctx.ui.rowSelect({
                id: 'ctrl-display-lang',
                icon: 'globe',
                title: t('settings.time.displayLangLabel'),
                value: global.Win11I18N.getLang(),
                permAction: 'time.uiLanguage',
                options: [
                    { value: 'ar', label: 'العربية (الجزائر)' },
                    { value: 'fr', label: 'Français (France)' },
                    { value: 'en', label: 'English (United States)' }
                ],
                onChange: function (val) {
                    if (typeof global.Win11State.setDisplayLanguage === 'function') {
                        global.Win11State.setDisplayLanguage(val, true);
                    } else {
                        global.Win11I18N.setLanguage(val);
                    }
                }
            }));

            ctx.container.appendChild(ctx.ui.rowSelect({
                icon: 'sliders',
                title: t('settings.time.numeralsLabel'),
                value: st.numerals,
                permAction: 'time.uiLanguage',
                options: [
                    { value: 'latin', label: t('settings.time.numeralsLatin') },
                    { value: 'indic', label: t('settings.time.numeralsIndic') }
                ],
                onChange: function (val) {
                    global.Win11State.set({ numerals: val });
                    global.Win11I18N.setNumerals(val);
                }
            }));

            var activeInput = global.Win11State.getActiveInputLangObj
                ? global.Win11State.getActiveInputLangObj()
                : null;
            var langCard = document.createElement('div');
            langCard.id = 'ctrl-lang-add';
            langCard.className = 'win-card';
            langCard.innerHTML =
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-wrap:wrap">' +
                    '<div>' +
                        '<div style="font-weight:600">' + bidi(t('settings.time.inputLangsTitle')) + '</div>' +
                        '<div style="font-size:12px;color:var(--win-text-secondary)">' + bidi(t('settings.time.switchKeyboardHint')) + '</div>' +
                    '</div>' +
                    '<button type="button" class="win-btn win-btn-accent" id="btn-add-language">' + bidi(t('settings.time.addLangBtn')) + '</button>' +
                '</div>' +
                '<div id="installed-langs-box"></div>';
            ctx.container.appendChild(langCard);

            var box = langCard.querySelector('#installed-langs-box');
            for (var i = 0; i < st.installedLanguages.length; i++) {
                var l = st.installedLanguages[i];
                var isCurInput = !!(activeInput && activeInput.id === l.id);
                box.innerHTML +=
                    '<div class="setting-row" data-installed-lang="' + global.Win11Compat.escapeHtml(l.id) + '">' +
                        '<span class="win-badge ' + (isCurInput ? 'win-badge-success' : 'win-badge-info') + '"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(l.code) + '</bdi></span>' +
                        '<div class="setting-row-text">' +
                            '<div class="setting-row-title">' + bidi(l.display) + (isCurInput ? ' <span class="win-badge win-badge-success" style="font-size:11px">' + bidi(t('settings.time.activeInputLabel')) + '</span>' : '') + '</div>' +
                            '<div class="setting-row-desc"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(l.keyboard) + '</bdi></div>' +
                        '</div>' +
                        '<div class="setting-row-action">' +
                            (!isCurInput ? '<button type="button" class="win-btn win-btn-secondary" data-use-kbd="' + global.Win11Compat.escapeHtml(l.id) + '">' + bidi(t('settings.time.setKeyboardBtn')) + '</button>' : '') +
                            '<button type="button" class="win-btn win-btn-danger" data-rem-lang="' + global.Win11Compat.escapeHtml(l.id) + '"' + (st.installedLanguages.length <= 1 ? ' disabled' : '') + '>' + bidi(t('settings.time.removeLangBtn')) + '</button>' +
                        '</div>' +
                    '</div>';
            }

            var useBtns = langCard.querySelectorAll('[data-use-kbd]');
            for (var ub = 0; ub < useBtns.length; ub++) {
                useBtns[ub].onclick = function () {
                    global.Win11State.setActiveInputLang(this.getAttribute('data-use-kbd'));
                    ctx.navigate('timeLanguage', sub);
                };
            }
            var remBtns = langCard.querySelectorAll('[data-rem-lang]');
            for (var rb = 0; rb < remBtns.length; rb++) {
                remBtns[rb].onclick = function () {
                    var remId = this.getAttribute('data-rem-lang');
                    var execRem = function () {
                        global.Win11State.removeInputLanguage(remId);
                        ctx.navigate('timeLanguage', sub);
                    };
                    if (global.Win11Permissions) {
                        global.Win11Permissions.guard('time.languageAdd', execRem, { targetLabel: remId });
                    } else {
                        execRem();
                    }
                };
            }

            langCard.querySelector('#btn-add-language').onclick = function () {
                if (global.Win11Permissions) {
                    global.Win11Permissions.guard('time.languageAdd', function () {
                        openAddLanguageWizard(ctx);
                    }, { targetLabel: t('settings.time.addLangBtn') });
                } else {
                    openAddLanguageWizard(ctx);
                }
            };
        }
    });
})(window);

