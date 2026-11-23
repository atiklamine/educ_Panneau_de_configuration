/**
 * Teacher Configuration Console (Hidden Ctrl+Shift+S Only)
 * Enforces encrypted v2 binary inf.dll unlock, first-time setup, tamper recovery,
 * failed-attempt cooldown, full Stage 6 Settings Panel UI, and live filename token builder.
 */
(function (global) {
    'use strict';

    var MAX_ATTEMPTS = 5;
    var COOLDOWN_MS = 30000;
    var failedAttempts = 0;
    var lockoutUntilMs = 0;

    var ALL_TOKENS = [
        { token: '{class}', label: 'الفوج ({class})' },
        { token: '{score}', label: 'العلامة ({score})' },
        { token: '{time}', label: 'الزمن ({time})' },
        { token: '{student_lastname}', label: 'اللقب ({student_lastname})' },
        { token: '{student_firstname}', label: 'الاسم ({student_firstname})' },
        { token: '{date}', label: 'التاريخ ({date})' }
    ];

    function triggerBinaryDownload(bytes, filename) {
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'inf.dll';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        }, 900);
    }

    function validateFilenamePattern(pat) {
        var s = String(pat || '').trim();
        if (!s) return { ok: false, reason: 'يجب كتابة نمط اسم ملف غير فارغ.' };
        if (/[^\x20-\x7E]/.test(s)) {
            return { ok: false, reason: 'يجب أن يحتوي نمط اسم الملف على أحرف إنجليزية (ASCII) فقط بدون حروف عربية.' };
        }
        if (/[\\/:*?"<>|]/.test(s)) {
            return { ok: false, reason: 'النمط يحتوي على رموز ممنوعة في أسماء ملفات Windows (\\ / : * ? " < > |).' };
        }
        if (s.indexOf('{') === -1) {
            return { ok: false, reason: 'يجب تضمين رمز متغير واحد على الأقل مثل {score} أو {student_lastname}.' };
        }
        return { ok: true, reason: '' };
    }

    function renderTokenPreview(pat) {
        var now = new Date();
        var yyyy = now.getFullYear();
        var mm = String(now.getMonth() + 1);
        var dd = String(now.getDate());
        if (mm.length < 2) mm = '0' + mm;
        if (dd.length < 2) dd = '0' + dd;
        var out = String(pat || '');
        var sampleMap = {
            '{class}': '1AS_ST_G1',
            '{score}': '20.00',
            '{time}': '00-15-30',
            '{student_lastname}': 'BENALI',
            '{student_firstname}': 'Mohamed',
            '{date}': yyyy + '-' + mm + '-' + dd
        };
        for (var k in sampleMap) {
            if (Object.prototype.hasOwnProperty.call(sampleMap, k)) {
                out = out.split(k).join(sampleMap[k]);
            }
        }
        if (global.Win11Report && typeof global.Win11Report.cleanFileToken === 'function') {
            return global.Win11Report.cleanFileToken(out) + '.pdf';
        }
        return out.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/_+/g, '_') + '.pdf';
    }

    function openCreateOrRecoverModal(mode) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var isTampered = (mode === 'tampered');

        global.Win11Dialogs.showCustom({
            title: isTampered ? t('pedagogy.infTamperTitle') : t('pedagogy.infMissingSetupTitle'),
            tone: isTampered ? 'warning' : 'info',
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:10px">' +
                        '<div class="win-card" style="background:' + (isTampered ? 'var(--win-warning-bg)' : 'var(--win-surface-subtle)') + ';margin:0;padding:10px 12px;font-size:13px">' +
                            bidi(isTampered ? t('pedagogy.infTamperMsg') : t('pedagogy.infMissingSetupMsg')) +
                        '</div>' +
                        '<div>' +
                            '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.infPassNew')) + '</label>' +
                            '<input type="password" id="tc-setup-pass1" class="win-input" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                        '</div>' +
                        '<div>' +
                            '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.infPassConfirm')) + '</label>' +
                            '<input type="password" id="tc-setup-pass2" class="win-input" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                        '</div>' +
                        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                            '<label class="win-btn win-btn-secondary" style="cursor:pointer">' +
                                bidi(t('pedagogy.infRecoverBtn')) +
                                '<input type="file" id="tc-setup-import" style="display:none">' +
                            '</label>' +
                            '<span id="tc-setup-err" style="color:var(--win-danger);font-size:12px"></span>' +
                        '</div>' +
                    '</div>';

                var imp = wrap.querySelector('#tc-setup-import');
                if (imp) {
                    imp.onchange = function () {
                        var f = this.files && this.files[0];
                        if (!f) return;
                        var reader = new FileReader();
                        reader.onload = function () {
                            try {
                                var bytes = new Uint8Array(reader.result);
                                var res = global.Win11Assessment.loadInfBytes(bytes);
                                if (!res.ok) {
                                    var err = wrap.querySelector('#tc-setup-err');
                                    if (err) err.innerHTML = bidi(t('pedagogy.infTamperTitle'));
                                    return;
                                }
                                global.Win11Dialogs.close(false);
                                openAuth();
                            } catch (e) { }
                        };
                        reader.readAsArrayBuffer(f);
                    };
                }
                setTimeout(function () {
                    var p1 = wrap.querySelector('#tc-setup-pass1');
                    if (p1) p1.focus();
                }, 40);
            },
            buttons: [
                {
                    label: t('app.save'),
                    primary: true,
                    onClick: function (closeDlg) {
                        var p1 = document.getElementById('tc-setup-pass1');
                        var p2 = document.getElementById('tc-setup-pass2');
                        var err = document.getElementById('tc-setup-err');
                        var v1 = p1 ? p1.value : '';
                        var v2 = p2 ? p2.value : '';
                        if (v1.length < 4 || v1 !== v2) {
                            if (err) err.innerHTML = bidi(t('pedagogy.infPassMismatch'));
                            return true;
                        }
                        global.Win11Assessment.setActivePasswordInRam(v1);
                        global.Win11Assessment.saveSidecarToHost(v1, function (res) {
                            if (res && res.savedToHost) {
                                if (global.Win11Dialogs && typeof global.Win11Dialogs.showToast === 'function') {
                                    global.Win11Dialogs.showToast('تم حفظ ملف الإعدادات المشفر (inf.dll) بنجاح بجانب البرنامج.');
                                }
                            } else if (res && !res.savedToHost && res.bytes) {
                                triggerBinaryDownload(res.bytes, 'inf.dll');
                            }
                            closeDlg(true);
                            openTeacherPanel();
                        });
                        return true;
                    }
                },
                { label: t('app.cancel'), primary: false, value: false }
            ]
        });
    }

    function openAuth() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var infStatus = global.Win11Assessment.getInfStatus ? global.Win11Assessment.getInfStatus() : { status: 'missing' };

        if (infStatus.status === 'missing') {
            openTeacherPanel({ firstTimeSetup: false, isPasswordless: true });
            return;
        }
        if (infStatus.status === 'tampered') {
            openCreateOrRecoverModal('tampered');
            return;
        }

        global.Win11Dialogs.showCustom({
            title: t('pedagogy.teacherModalTitle'),
            tone: 'info',
            renderBody: function (wrap) {
                var remMs = Math.max(0, lockoutUntilMs - Date.now());
                wrap.innerHTML =
                    '<label style="display:block;margin-bottom:6px;font-weight:600">' + bidi(t('pedagogy.teacherPassPrompt')) + '</label>' +
                    '<input type="password" id="teacher-auth-pass" class="win-input" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                    '<div id="teacher-auth-err" style="color:var(--win-danger);font-size:12px;margin-top:6px;min-height:16px">' +
                        (remMs > 0 ? bidi(t('pedagogy.infCooldownMsg')) + ' <bdi dir="ltr">' + Math.ceil(remMs / 1000) + 's</bdi>' : '') +
                    '</div>';
                setTimeout(function () {
                    var inp = wrap.querySelector('#teacher-auth-pass');
                    if (inp) inp.focus();
                }, 40);
            },
            onClose: function (authOk) {
                if (authOk !== true && global.Win11Assessment && global.Win11Assessment.getStudent && !global.Win11Assessment.getStudent().activeSession) {
                    if (global.Win11Report && typeof global.Win11Report.openStudentRegistration === 'function') {
                        setTimeout(function () {
                            if (!global.Win11Dialogs.isOpen() && !global.Win11Assessment.getStudent().activeSession) {
                                global.Win11Report.openStudentRegistration({ mandatory: true });
                            }
                        }, 40);
                    }
                }
            },
            buttons: [
                {
                    label: t('app.ok'),
                    primary: true,
                    onClick: function (closeDlg) {
                        var inp = document.getElementById('teacher-auth-pass');
                        var err = document.getElementById('teacher-auth-err');
                        var now = Date.now();
                        if (lockoutUntilMs > now) {
                            var secs = Math.ceil((lockoutUntilMs - now) / 1000);
                            if (err) err.innerHTML = bidi(t('pedagogy.infCooldownMsg')) + ' <bdi dir="ltr">' + secs + 's</bdi>';
                            return true;
                        }
                        var entered = inp ? inp.value : '';
                        var ver = global.Win11Assessment.verifyTeacherPassword(entered);
                        if (!ver.ok) {
                            failedAttempts += 1;
                            if (failedAttempts >= MAX_ATTEMPTS) {
                                lockoutUntilMs = Date.now() + COOLDOWN_MS;
                                failedAttempts = 0;
                                if (err) err.innerHTML = bidi(t('pedagogy.infCooldownMsg')) + ' <bdi dir="ltr">' + Math.ceil(COOLDOWN_MS / 1000) + 's</bdi>';
                            } else {
                                if (err) err.innerHTML = bidi(t('pedagogy.infWrongGeneric'));
                            }
                            if (inp) { inp.value = ''; inp.focus(); }
                            return true;
                        }
                        failedAttempts = 0;
                        lockoutUntilMs = 0;
                        closeDlg(true);
                        openTeacherPanel();
                    }
                },
                { label: t('app.cancel'), primary: false, value: false }
            ]
        });
    }

    function openTeacherPanel(opts) {
        opts = opts || {};
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var esc = global.Win11Compat.escapeHtml;
        var cfg = global.Win11Compat.deepClone(global.Win11Assessment.getConfig());
        if (!Array.isArray(cfg.tasks_config) || cfg.tasks_config.length === 0) {
            cfg.tasks_config = global.Win11Assessment.getDefaultConfig().tasks_config;
        }
        var activeTab = 'general';
        var isDirty = false;
        var pendingNewPass = '';
        var setupPass1 = '';
        var setupPass2 = '';
        var setupErrMsg = '';
        var passMismatchMsg = '';
        var quizTaskFilter = 0;
        var showAddQuestionForm = false;
        var openDistractorCards = {};
        var editingQuestionId = null;
        var needsInitialPass = !!(opts.firstTimeSetup && !(global.Win11Assessment.getActivePasswordInRam && global.Win11Assessment.getActivePasswordInRam()));

        // Track current token order for the visual builder
        function parseOrderedTokens() {
            var pat = String(cfg.filename_template || '');
            var enabledList = [];
            var idxPairs = [];
            for (var i = 0; i < ALL_TOKENS.length; i++) {
                var pos = pat.indexOf(ALL_TOKENS[i].token);
                if (pos !== -1) idxPairs.push({ pos: pos, def: ALL_TOKENS[i] });
            }
            idxPairs.sort(function (a, b) { return a.pos - b.pos; });
            for (var j = 0; j < idxPairs.length; j++) enabledList.push({ def: idxPairs[j].def, on: true });
            for (var k = 0; k < ALL_TOKENS.length; k++) {
                var exists = enabledList.some(function (x) { return x.def.token === ALL_TOKENS[k].token; });
                if (!exists) enabledList.push({ def: ALL_TOKENS[k], on: false });
            }
            return enabledList;
        }

        function rebuildPatternFromTokens(orderedTokens) {
            var active = [];
            for (var i = 0; i < orderedTokens.length; i++) {
                if (orderedTokens[i].on) active.push(orderedTokens[i].def.token);
            }
            cfg.filename_template = active.join('_');
        }

        var tokenOrderState = parseOrderedTokens();

        global.Win11Dialogs.showCustom({
            title: t('pedagogy.teacherModalTitle'),
            tone: 'info',
            wide: true,
            renderBody: function (wrap) {
                function markDirty() {
                    isDirty = true;
                    var b = wrap.querySelector('#tc-dirty-flag');
                    if (b) b.style.display = 'block';
                }

                function saveVisibleFields() {
                    var iEl = wrap.querySelector('#tc-inst');
                    var tEl = wrap.querySelector('#tc-teacher');
                    var lEl = wrap.querySelector('#tc-level');
                    var yEl = wrap.querySelector('#tc-year');
                    var wfEl = wrap.querySelector('#tc-wp-folder');
                    var uEl = wrap.querySelector('#tc-ui-lang');
                    var ddEl = wrap.querySelector('#tc-def-dev');
                    var dvEl = wrap.querySelector('#tc-devices');
                    if (iEl) cfg.institution_name = iEl.value;
                    if (tEl) cfg.teacher_name = tEl.value;
                    if (lEl) cfg.target_level = lEl.value;
                    if (yEl) cfg.academic_year = yEl.value;
                    if (wfEl) cfg.wallpaper_source_folder = wfEl.value;
                    if (uEl) cfg.ui_language_default = uEl.value;

                    var sp1 = wrap.querySelector('#tc-setup-pass1');
                    var sp2 = wrap.querySelector('#tc-setup-pass2');
                    if (sp1) setupPass1 = sp1.value;
                    if (sp2) setupPass2 = sp2.value;
                    if (ddEl) cfg.default_device = ddEl.value;
                    if (dvEl) {
                        var list = dvEl.value.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
                        if (list.length > 0) cfg.device_numbers = list;
                    }

                    var mEl = wrap.querySelector('#tc-mode');
                    var tlEl = wrap.querySelector('#tc-time-limit');
                    var ptEl = wrap.querySelector('#tc-pass-threshold');
                    var phEl = wrap.querySelector('#tc-pen-hint');
                    var peEl = wrap.querySelector('#tc-pen-error');
                    var psEl = wrap.querySelector('#tc-pen-skip');
                    if (mEl) cfg.mode = mEl.value;
                    if (tlEl) cfg.exam_time_limit_min = Math.max(0, Number(tlEl.value) || 0);
                    if (ptEl) cfg.pass_threshold = Math.max(0, Math.min(20, Number(ptEl.value) || 10));
                    if (phEl) cfg.penalty_hint = Math.max(0, Number(phEl.value) || 0);
                    if (peEl) cfg.penalty_error = Math.max(0, Number(peEl.value) || 0);
                    if (psEl) cfg.penalty_skip = Math.max(0, Number(psEl.value) || 0);

                    var qeEl = wrap.querySelector('#tc-quiz-enabled');
                    var qoEl = wrap.querySelector('#tc-quiz-options-count');
                    var qnEl = wrap.querySelector('#tc-quiz-show-note');
                    if (qeEl) cfg.quiz_enabled = qeEl.checked;
                    if (qoEl) cfg.quiz_options_count = Number(qoEl.value) || 4;
                    if (qnEl) cfg.show_no_quiz_note = qnEl.checked;

                    var fpEl = wrap.querySelector('#tc-fname-pattern');
                    var smEl = wrap.querySelector('#tc-sm');
                    var spEl = wrap.querySelector('#tc-sp');
                    var stEl = wrap.querySelector('#tc-st');
                    var scEl = wrap.querySelector('#tc-sc');
                    var spsEl = wrap.querySelector('#tc-sps');
                    var srkEl = wrap.querySelector('#tc-srk');
                    if (fpEl) cfg.filename_template = fpEl.value;
                    if (smEl) cfg.show_mistakes = smEl.checked;
                    if (spEl) cfg.show_penalties = spEl.checked;
                    if (stEl) cfg.show_time = stEl.checked;
                    if (scEl) cfg.show_competency = scEl.checked;
                    if (spsEl) cfg.show_partial_scores = spsEl.checked;
                    if (srkEl) cfg.show_ranking_criteria = srkEl.checked;

                    var lfsEl = wrap.querySelector('#tc-lock-fs');
                    var tlkEl = wrap.querySelector('#tc-theme-lock');
                    var nsEl = wrap.querySelector('#tc-netsupport-offset');
                    var mulEl = wrap.querySelector('#tc-multi-user');
                    var p1El = wrap.querySelector('#tc-pass');
                    var p2El = wrap.querySelector('#tc-pass-confirm');
                    if (lfsEl) cfg.lock_fullscreen_in_exam = lfsEl.checked;
                    if (tlkEl) cfg.theme_lock = tlkEl.checked;
                    if (nsEl) {
                        cfg.netsupport_offset = nsEl.checked;
                        if (cfg.netsupport_offset) {
                            document.documentElement.classList.add('has-netsupport-offset');
                            document.body.classList.add('has-netsupport-offset');
                        } else {
                            document.documentElement.classList.remove('has-netsupport-offset');
                            document.body.classList.remove('has-netsupport-offset');
                        }
                    }
                    if (mulEl) cfg.multi_user_mode = (mulEl.value === 'multi');
                    if (p1El && p1El.value.length > 0) {
                        var p2v = p2El ? p2El.value : '';
                        if (p1El.value.length >= 4 && p1El.value === p2v) {
                            pendingNewPass = p1El.value;
                            passMismatchMsg = '';
                        } else {
                            passMismatchMsg = t('pedagogy.infPassMismatch');
                        }
                    }
                }

                function draw() {
                    var tabs = [
                        { id: 'general', label: 'المؤسسة والأفواج' },
                        { id: 'exam', label: 'النشاط والمهام' },
                        { id: 'questions', label: 'إدارة الأسئلة' },
                        { id: 'report', label: 'التسمية والتقرير' },
                        { id: 'security', label: 'الأمان والملف' }
                    ];
                    var tabsHtml = '<div class="teacher-tabs">';
                    for (var ti = 0; ti < tabs.length; ti++) {
                        tabsHtml += '<button type="button" class="teacher-tab-btn' + (activeTab === tabs[ti].id ? ' is-active' : '') + '" data-ttab="' + tabs[ti].id + '">' + bidi(tabs[ti].label) + '</button>';
                    }
                    tabsHtml += '</div>';

                    var dirtyBanner = '<div class="tc-dirty-banner" id="tc-dirty-flag" style="display:' + (isDirty ? 'block' : 'none') + '">' +
                        bidi('تغييرات غير محفوظة — اضغط "حفظ" لتطبيق الإعدادات وتشفيرها في inf.dll.') +
                        '</div>';

                    var setupBanner = '';
                    if (needsInitialPass) {
                        setupBanner =
                            '<div class="tc-section-card" id="tc-first-setup-card" style="border-color:var(--win-accent);background:var(--win-surface-subtle)">' +
                                '<div style="font-weight:700;margin-bottom:6px;color:var(--win-accent-text)">' + bidi(t('pedagogy.infMissingSetupTitle')) + '</div>' +
                                '<div style="font-size:12px;margin-bottom:8px">' + bidi(t('pedagogy.infMissingSetupMsg')) + '</div>' +
                                '<div class="tc-field-grid">' +
                                    '<label><strong>' + bidi(t('pedagogy.infPassNew')) + '</strong><input type="password" id="tc-setup-pass1" class="win-input" value="' + esc(setupPass1) + '" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off"></label>' +
                                    '<label><strong>' + bidi(t('pedagogy.infPassConfirm')) + '</strong><input type="password" id="tc-setup-pass2" class="win-input" value="' + esc(setupPass2) + '" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off"></label>' +
                                '</div>' +
                                '<div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap">' +
                                    '<label class="win-btn win-btn-secondary" style="cursor:pointer;min-height:28px">' +
                                        bidi(t('pedagogy.infRecoverBtn')) +
                                        '<input type="file" id="tc-setup-import" style="display:none">' +
                                    '</label>' +
                                    '<span id="tc-setup-err" style="color:var(--win-danger);font-size:12px">' + (setupErrMsg ? bidi(setupErrMsg) : '') + '</span>' +
                                '</div>' +
                            '</div>';
                    }

                    var bodyHtml = '';
                    if (activeTab === 'general') {
                        var devOpts = '';
                        var devs = cfg.device_numbers || [];
                        for (var di = 0; di < devs.length; di++) {
                            devOpts += '<option value="' + esc(devs[di]) + '"' + (devs[di] === cfg.default_device ? ' selected' : '') + '>' + esc(devs[di]) + '</option>';
                        }
                        var groupsHtml = '';
                        for (var gi = 0; gi < cfg.class_groups.length; gi++) {
                            groupsHtml +=
                                '<div class="setting-row" style="min-height:38px;padding:4px 10px">' +
                                    '<div class="setting-row-text">' + bidi(cfg.class_groups[gi]) + '</div>' +
                                    '<button type="button" class="win-btn win-btn-danger" data-del-grp="' + gi + '" style="min-height:24px;padding:2px 8px">' + bidi(t('app.delete')) + '</button>' +
                                '</div>';
                        }
                        bodyHtml =
                            '<div class="tc-section-card">' +
                                '<div class="tc-field-grid">' +
                                    '<label><strong>' + bidi('اسم المؤسسة:') + '</strong><input class="win-input" id="tc-inst" value="' + esc(cfg.institution_name) + '"></label>' +
                                    '<label><strong>' + bidi('اسم الأستاذ ولقبه:') + '</strong><input class="win-input" id="tc-teacher" value="' + esc(cfg.teacher_name) + '"></label>' +
                                    '<label><strong>' + bidi('المستوى والشعبة:') + '</strong><input class="win-input" id="tc-level" value="' + esc(cfg.target_level) + '"></label>' +
                                    '<label><strong>' + bidi('السنة الدراسية:') + '</strong><input class="win-input" id="tc-year" value="' + esc(cfg.academic_year) + '" dir="ltr"></label>' +
                                    '<label><strong>' + bidi('لغة الواجهة الافتراضية:') + '</strong><select class="win-select" id="tc-ui-lang">' +
                                        '<option value="ar"' + (cfg.ui_language_default === 'ar' ? ' selected' : '') + '>العربية (RTL)</option>' +
                                        '<option value="fr"' + (cfg.ui_language_default === 'fr' ? ' selected' : '') + '>Français (LTR)</option>' +
                                        '<option value="en"' + (cfg.ui_language_default === 'en' ? ' selected' : '') + '>English (LTR)</option>' +
                                    '</select></label>' +
                                    '<label><strong>' + bidi('رقم الحاسوب الافتراضي:') + '</strong><select class="win-select" id="tc-def-dev" dir="ltr">' + devOpts + '</select></label>' +
                                '</div>' +
                                '<label style="display:block;margin-top:8px"><strong>' + bidi('مسار مجلد مصدر الخلفيات (Section 2):') + '</strong>' +
                                '<input class="win-input" id="tc-wp-folder" value="' + esc(cfg.wallpaper_source_folder || 'C:\\Users\\<user>\\Pictures\\') + '" dir="ltr"></label>' +
                                '<label style="display:block;margin-top:8px"><strong>' + bidi('قائمة أرقام الأجهزة (مفصولة بفاصلة):') + '</strong>' +
                                '<input class="win-input" id="tc-devices" value="' + esc((cfg.device_numbers || []).join(', ')) + '" dir="ltr"></label>' +
                            '</div>' +
                            '<div class="tc-section-card">' +
                                '<div style="font-weight:700;margin-bottom:6px">' + bidi('الأفواج الدراسية والأقسام:') + '</div>' +
                                '<div id="ctrl-tc-groups" style="max-height:140px;overflow-y:auto;margin-bottom:8px">' + groupsHtml + '</div>' +
                                '<div style="display:flex;gap:8px">' +
                                    '<input class="win-input" id="tc-new-grp" placeholder="' + esc('أدخل اسم الفوج الجديد...') + '">' +
                                    '<button type="button" class="win-btn win-btn-accent" id="tc-add-grp">' + bidi(t('app.add')) + '</button>' +
                                '</div>' +
                            '</div>';
                    } else if (activeTab === 'exam') {
                        var tasksRef = global.Win11Assessment.getTasks();
                        var titleById = {};
                        for (var tti = 0; tti < tasksRef.length; tti++) titleById[tasksRef[tti].id] = tasksRef[tti].titleAr;

                        function getTierMeta(w) {
                            var nw = Number(w) || 0;
                            if (nw <= 2) return { label: 'بسيطة (1–2)', color: '#065F46', bg: '#ECFDF5' };
                            if (nw <= 5) return { label: 'متوسطة (3–5)', color: '#0369A1', bg: '#EFF6FF' };
                            return { label: 'معقدة (6–10)', color: '#B45309', bg: '#FFFBEB' };
                        }

                        var totalWeight = 0;
                        var tasksHtml = '';
                        var catMap = (global.Win11Assessment && typeof global.Win11Assessment.getSubstepsCatalog === 'function')
                            ? global.Win11Assessment.getSubstepsCatalog()
                            : {};

                        for (var tkIdx = 0; tkIdx < cfg.tasks_config.length; tkIdx++) {
                            var tcItem = cfg.tasks_config[tkIdx];
                            var curCoef = (tcItem.coefficient !== undefined && tcItem.coefficient !== null)
                                ? Number(tcItem.coefficient)
                                : (Number(tcItem.weight) || (tcItem.complexity === 'complex' ? 3 : 1));
                            curCoef = Math.floor(Math.max(1, curCoef));
                            tcItem.coefficient = curCoef;
                            tcItem.weight = curCoef;

                            if (tcItem.enabled !== false) totalWeight += curCoef;
                            var tier = getTierMeta(curCoef);

                            var cat = catMap[tcItem.id];
                            var subtasksHtml = '';
                            if (cat && cat.length > 0) {
                                var disabledSubs = Array.isArray(tcItem.disabled_subtasks) ? tcItem.disabled_subtasks : [];
                                var subOrder = [];
                                if (Array.isArray(tcItem.subtasks_order) && tcItem.subtasks_order.length > 0) {
                                    for (var soi = 0; soi < tcItem.subtasks_order.length; soi++) {
                                        var sidVal = Number(tcItem.subtasks_order[soi]);
                                        if (!isNaN(sidVal) && sidVal >= 0 && sidVal < cat.length && subOrder.indexOf(sidVal) === -1) {
                                            subOrder.push(sidVal);
                                        }
                                    }
                                }
                                for (var csi = 0; csi < cat.length; csi++) {
                                    if (subOrder.indexOf(csi) === -1) subOrder.push(csi);
                                }
                                tcItem.subtasks_order = subOrder;

                                subtasksHtml += '<div style="margin:4px 32px 8px 12px;padding:6px 10px;background:rgba(0,0,0,0.025);border-radius:4px;border-right:3px solid #0078D4">';
                                subtasksHtml += '<div style="font-size:11px;font-weight:700;color:#555;margin-bottom:4px">' + bidi('الخطوات الفرعية (إلغاء التحديد يُعفي التلميذ منها، والأسهم للتحكم في ترتيبها):') + '</div>';
                                for (var si = 0; si < subOrder.length; si++) {
                                    var subId = subOrder[si];
                                    var sub = cat[subId] || { id: subId, labelAr: 'خطوة ' + (subId + 1) };
                                    var isSubEn = disabledSubs.indexOf(sub.id) === -1;
                                    subtasksHtml +=
                                        '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin:3px 0' + (tcItem.enabled === false ? ';opacity:0.5' : '') + '">' +
                                            '<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;flex:1">' +
                                                '<input type="checkbox" data-subtask-en="' + tkIdx + ':' + sub.id + '"' + (isSubEn ? ' checked' : '') + (tcItem.enabled === false ? ' disabled' : '') + '>' +
                                                '<span style="color:#0067C0;font-weight:600"><bdi dir="ltr">' + (si + 1) + '.</bdi></span> ' +
                                                '<span>' + bidi(sub.labelAr) + '</span>' +
                                            '</label>' +
                                            '<div style="display:inline-flex;gap:2px">' +
                                                '<button type="button" class="win-btn win-btn-secondary" data-subtask-up="' + tkIdx + ':' + si + '" style="min-height:20px;padding:1px 6px;font-size:10.5px"' + (si === 0 || tcItem.enabled === false ? ' disabled' : '') + ' title="تحريك لأعلى">' + (global.Win11Icons ? global.Win11Icons.get('chevronUp', 11) : '▲') + '</button>' +
                                                '<button type="button" class="win-btn win-btn-secondary" data-subtask-dn="' + tkIdx + ':' + si + '" style="min-height:20px;padding:1px 6px;font-size:10.5px"' + (si === subOrder.length - 1 || tcItem.enabled === false ? ' disabled' : '') + ' title="تحريك لأسفل">' + (global.Win11Icons ? global.Win11Icons.get('chevronDown', 11) : '▼') + '</button>' +
                                            '</div>' +
                                        '</div>';
                                }
                                subtasksHtml += '</div>';
                            }

                            tasksHtml +=
                                '<div style="margin-bottom:8px;border:1px solid #E2E8F0;border-radius:6px;padding:6px 8px;background:#FFF">' +
                                    '<div class="tc-token-row" style="margin-bottom:2px">' +
                                        '<label style="display:flex;align-items:center;gap:8px;flex:1;cursor:pointer">' +
                                            '<input type="checkbox" data-task-en="' + tkIdx + '"' + (tcItem.enabled !== false ? ' checked' : '') + '>' +
                                            '<strong>' + bidi(titleById[tcItem.id] || ('مهمة ' + tcItem.id)) + '</strong>' +
                                        '</label>' +
                                        '<span class="win-badge" data-task-tier="' + tkIdx + '" style="background:' + tier.bg + ';color:' + tier.color + ';font-size:11px">' + bidi(tier.label) + '</span>' +
                                        '<label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;cursor:pointer" title="الكل أو لا شيء">' +
                                            '<input type="checkbox" data-task-crit="' + tkIdx + '"' + (tcItem.critical ? ' checked' : '') + '>' +
                                            '<span>' + bidi('حرج') + '</span>' +
                                        '</label>' +
                                        '<label style="display:inline-flex;align-items:center;gap:4px"><span>' + bidi('المعامل:') + '</span>' +
                                            '<input type="number" class="win-input" data-task-coef="' + tkIdx + '" data-task-w="' + tkIdx + '" value="' + esc(curCoef) + '" min="1" max="20" step="1" style="width:58px;min-height:26px;padding:2px 6px" dir="ltr"' + (tcItem.enabled === false ? ' disabled' : '') + '>' +
                                        '</label>' +
                                        '<button type="button" class="win-btn win-btn-secondary" data-task-up="' + tkIdx + '" style="min-height:24px;padding:2px 8px"' + (tkIdx === 0 ? ' disabled' : '') + '>' + (global.Win11Icons ? global.Win11Icons.get('chevronUp', 12) : '▲') + '</button>' +
                                        '<button type="button" class="win-btn win-btn-secondary" data-task-dn="' + tkIdx + '" style="min-height:24px;padding:2px 8px"' + (tkIdx === cfg.tasks_config.length - 1 ? ' disabled' : '') + '>' + (global.Win11Icons ? global.Win11Icons.get('chevronDown', 12) : '▼') + '</button>' +
                                    '</div>' +
                                    subtasksHtml +
                                '</div>';
                        }
                        var isBalanced20 = Math.abs(totalWeight - 20) < 0.01;

                        bodyHtml =
                            '<div class="tc-section-card">' +
                                '<div class="tc-field-grid">' +
                                    '<label><strong>' + bidi('نمط المحاكاة الافتراضي:') + '</strong><select class="win-select" id="tc-mode">' +
                                        '<option value="training"' + (cfg.mode !== 'exam' ? ' selected' : '') + '>' + bidi('استطلاع وتدريب (مع المساعدة والتلميحات)') + '</option>' +
                                        '<option value="exam"' + (cfg.mode === 'exam' ? ' selected' : '') + '>' + bidi('امتحان رسمي (عناوين فقط بدون تلميحات)') + '</option>' +
                                    '</select></label>' +
                                    '<label><strong>' + bidi('الحد الزمني للامتحان (دقيقة، 0 = مفتوح):') + '</strong>' +
                                        '<input type="number" class="win-input" id="tc-time-limit" min="0" max="240" value="' + esc(cfg.exam_time_limit_min || 0) + '" dir="ltr"></label>' +
                                    '<label><strong>' + bidi('عتبة النجاح (من 20):') + '</strong>' +
                                        '<input type="number" class="win-input" id="tc-pass-threshold" min="0" max="20" step="0.5" value="' + esc(cfg.pass_threshold !== undefined ? cfg.pass_threshold : 10) + '" dir="ltr"></label>' +
                                    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">' +
                                        '<label><strong>' + bidi('خصم التلميح:') + '</strong><input type="number" class="win-input" id="tc-pen-hint" min="0" max="5" step="0.25" value="' + esc(cfg.penalty_hint) + '" dir="ltr"></label>' +
                                        '<label><strong>' + bidi('خصم الخطأ:') + '</strong><input type="number" class="win-input" id="tc-pen-error" min="0" max="5" step="0.25" value="' + esc(cfg.penalty_error) + '" dir="ltr"></label>' +
                                        '<label><strong>' + bidi('خصم التخطي:') + '</strong><input type="number" class="win-input" id="tc-pen-skip" min="0" max="5" step="0.25" value="' + esc(cfg.penalty_skip || 0) + '" dir="ltr"></label>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="tc-section-card">' +
                                '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">' +
                                    '<div style="font-weight:700">' + bidi('تخصيص المهام (التفعيل، التعقيد، التنقيط والترتيب):') + '</div>' +
                                    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                                        '<button type="button" class="win-btn win-btn-secondary" id="tc-equal-weights" style="min-height:24px;padding:2px 8px;font-size:11.5px">' + bidi('توزيع متساوٍ للمهام') + '</button>' +
                                        '<button type="button" class="win-btn win-btn-secondary" id="tc-balance-20" style="min-height:24px;padding:2px 8px;font-size:11.5px">' + bidi('موازنة النقاط على 20') + '</button>' +
                                        '<span id="tc-weights-summary" class="win-badge" style="background:' + (isBalanced20 ? '#ECFDF5' : '#FEF3C7') + ';color:' + (isBalanced20 ? '#065F46' : '#B45309') + '">' +
                                            bidi('مجموع علامات المهام:') + ' <bdi dir="ltr">' + totalWeight.toFixed(2) + ' / 20.00</bdi>' + (!isBalanced20 ? (' (' + bidi('غير متطابق مع 20') + ')') : '') +
                                        '</span>' +
                                    '</div>' +
                                '</div>' +
                                '<div id="ctrl-tc-tasks">' + tasksHtml + '</div>' +
                            '</div>';
                    } else if (activeTab === 'questions') {
                        var bank = global.Win11QuizBank;
                        var allQuestions = bank ? bank.getAllQuestions() : [];
                        var filteredQuestions = allQuestions;
                        if (quizTaskFilter > 0) {
                            filteredQuestions = allQuestions.filter(function (q) {
                                return q.taskId === quizTaskFilter;
                            });
                        }

                        // Task selector options
                        var taskFilterOpts = '<option value="0"' + (quizTaskFilter === 0 ? ' selected' : '') + '>' + bidi('كافة المهام (جميع المراحل والمجالات)') + '</option>';
                        var taskCatalog = [
                            { id: 1, title: 'المهمة 1: تغيير لغة عرض واجهة Windows' },
                            { id: 2, title: 'المهمة 2: ضبط خصائص الفأرة' },
                            { id: 3, title: 'المهمة 3: إضافة لغة إدخال وضبط المنطقة الزمنية' },
                            { id: 4, title: 'المهمة 4: تخصيص الخلفية ولون التمييز' },
                            { id: 5, title: 'المهمة 5: تثبيت وإزالة البرامج والميزات' },
                            { id: 6, title: 'المهمة 6: إدارة حسابات المستخدمين والصلاحيات' }
                        ];
                        for (var tci = 0; tci < taskCatalog.length; tci++) {
                            var tcItem = taskCatalog[tci];
                            taskFilterOpts += '<option value="' + tcItem.id + '"' + (quizTaskFilter === tcItem.id ? ' selected' : '') + '>' + bidi(tcItem.title) + '</option>';
                        }

                        var disabledTasks = Array.isArray(cfg.quiz_disabled_tasks) ? cfg.quiz_disabled_tasks : [];
                        var isCurrentTaskQuizEnabled = (quizTaskFilter === 0) || (disabledTasks.indexOf(quizTaskFilter) === -1);

                        // Question cards HTML
                        var questionsCardsHtml = '';
                        if (filteredQuestions.length === 0) {
                            questionsCardsHtml = '<div style="text-align:center;padding:24px;color:var(--win-text-secondary);font-size:12.5px;">' + bidi('لا توجد أسئلة متطابقة مع التصفية الحالية.') + '</div>';
                        } else {
                            for (var qi = 0; qi < filteredQuestions.length; qi++) {
                                var qObj = filteredQuestions[qi];
                                var isQEnabled = (qObj.enabled !== false);
                                var qTaskTitle = 'المهمة ' + qObj.taskId;
                                for (var tkI = 0; tkI < taskCatalog.length; tkI++) {
                                    if (taskCatalog[tkI].id === qObj.taskId) {
                                        qTaskTitle = taskCatalog[tkI].title;
                                        break;
                                    }
                                }

                                var dPool = Array.isArray(qObj.distractorsAr) ? qObj.distractorsAr : [];
                                var disabledDistractors = Array.isArray(qObj.disabledDistractors) ? qObj.disabledDistractors : [];

                                // If this question is being edited / rephrased
                                if (editingQuestionId === qObj.id) {
                                    var editDistRowsHtml = '';
                                    for (var edi = 0; edi < dPool.length; edi++) {
                                        var edText = dPool[edi];
                                        var isEdActive = (disabledDistractors.indexOf(edText) === -1);
                                        editDistRowsHtml +=
                                            '<div class="tc-editq-dist-row" style="display:flex;align-items:center;gap:6px;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:4px;padding:4px 6px;">' +
                                                '<input type="text" class="win-input tc-editq-dist-input" value="' + esc(edText) + '" style="flex:1;font-size:11.5px;min-height:26px;padding:2px 6px;">' +
                                                '<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;white-space:nowrap;">' +
                                                    '<input type="checkbox" class="tc-editq-dist-active" ' + (isEdActive ? 'checked' : '') + '> ' +
                                                    '<span>' + bidi('مفعّل') + '</span>' +
                                                '</label>' +
                                                '<button type="button" class="win-btn win-btn-danger tc-editq-del-dist" style="min-height:24px;padding:1px 6px;font-size:11px;" title="' + esc('حذف هذا المموّه') + '">' + (global.Win11Icons ? global.Win11Icons.get('trash', 12) : 'حذف') + '</button>' +
                                            '</div>';
                                    }

                                    questionsCardsHtml +=
                                        '<div class="tc-section-card" id="tc-editq-container" style="margin-bottom:12px;border:2px solid var(--win-accent);background:#F0F7FF;padding:12px 14px;">' +
                                            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">' +
                                                '<div style="display:flex;align-items:center;gap:8px;">' +
                                                    '<span class="win-badge" style="background:#DBEAFE;color:#1E40AF;font-weight:700;font-size:11px;">' + bidi(qTaskTitle) + '</span>' +
                                                    '<strong style="color:var(--win-accent);font-size:13px;display:inline-flex;align-items:center;gap:6px;">' + (global.Win11Icons ? global.Win11Icons.get('edit', 14) : '') + '<span>' + bidi('إعادة صياغة السؤال والمموهات — تحرير شامل') + '</span></strong>' +
                                                '</div>' +
                                                '<div style="display:flex;align-items:center;gap:6px;">' +
                                                    (!qObj.isCustom ? '<button type="button" class="win-btn win-btn-secondary" id="tc-editq-revert" style="min-height:22px;padding:2px 8px;font-size:11px;">' + (global.Win11Icons ? global.Win11Icons.get('revert', 12) + ' ' : '') + bidi('استعادة الأصل') + '</button>' : '') +
                                                    '<button type="button" class="win-btn win-btn-secondary" id="tc-editq-cancel" style="min-height:22px;padding:2px 8px;font-size:11px;">' + (global.Win11Icons ? global.Win11Icons.get('winClose', 10) + ' ' : '') + bidi('إلغاء') + '</button>' +
                                                '</div>' +
                                            '</div>' +
                                            '<div class="tc-field-grid" style="margin-bottom:8px;">' +
                                                '<label><strong>' + bidi('عنوان السؤال / الكفاءة المستهدفة:') + '</strong>' +
                                                    '<input class="win-input" id="tc-editq-title" value="' + esc(qObj.titleAr || '') + '" style="font-size:12px;">' +
                                                '</label>' +
                                            '</div>' +
                                            '<div style="margin-bottom:8px;">' +
                                                '<label style="display:block;margin-bottom:4px;"><strong>' + bidi('نص السؤال كاملاً (يمكنك حذف أو إضافة أي كلمات بدقة):') + '</strong></label>' +
                                                '<textarea class="win-input" id="tc-editq-text" rows="3" style="width:100%;font-size:12px;line-height:1.5;resize:vertical;">' + esc(qObj.questionAr || '') + '</textarea>' +
                                            '</div>' +
                                            '<div style="margin-bottom:8px;">' +
                                                '<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' + (global.Win11Icons ? global.Win11Icons.get('check', 13) : '') + '<strong>' + bidi('الإجابة الصحيحة النموذجية:') + '</strong></label>' +
                                                '<textarea class="win-input" id="tc-editq-answer" rows="2" style="width:100%;font-size:12px;line-height:1.5;resize:vertical;border:1.5px solid #16A34A;background:#F0FDF4;">' + esc(qObj.correctAnswerAr || '') + '</textarea>' +
                                            '</div>' +
                                            '<div style="margin-bottom:8px;">' +
                                                '<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' + (global.Win11Icons ? global.Win11Icons.get('bulb', 13) : '') + '<strong>' + bidi('التلميح البيداغوجي الذكي:') + '</strong></label>' +
                                                '<textarea class="win-input" id="tc-editq-hint" rows="2" style="width:100%;font-size:12px;line-height:1.5;resize:vertical;">' + esc(qObj.hintAr || '') + '</textarea>' +
                                            '</div>' +
                                            '<div style="margin-bottom:8px;">' +
                                                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                                                    '<strong>' + bidi('قائمة الخيارات والمموهات الخاطئة المتاحة في المخزن:') + '</strong>' +
                                                    '<button type="button" class="win-btn win-btn-secondary" id="tc-editq-add-dist" style="min-height:22px;padding:2px 8px;font-size:11px;">' + (global.Win11Icons ? global.Win11Icons.get('plus', 12) + ' ' : '') + bidi('إضافة مموّه جديد') + '</button>' +
                                                '</div>' +
                                                '<div id="tc-editq-dist-list" style="display:flex;flex-direction:column;gap:5px;max-height:220px;overflow-y:auto;border:1px solid var(--win-border-control);border-radius:4px;padding:6px;background:#F8FAFC;">' +
                                                    editDistRowsHtml +
                                                '</div>' +
                                            '</div>' +
                                            '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">' +
                                                '<button type="button" class="win-btn win-btn-secondary" id="tc-editq-cancel-btn">' + bidi('إلغاء التعديل') + '</button>' +
                                                '<button type="button" class="win-btn win-btn-accent" id="tc-editq-save-btn" style="font-weight:700;">' + (global.Win11Icons ? global.Win11Icons.get('save', 13) + ' ' : '') + bidi('حفظ التعديلات في بنك الأسئلة') + '</button>' +
                                            '</div>' +
                                        '</div>';
                                    continue;
                                }

                                var distractorsListHtml = '';
                                for (var di = 0; di < dPool.length; di++) {
                                    var dText = dPool[di];
                                    var isDistractorActive = (disabledDistractors.indexOf(dText) === -1);
                                    distractorsListHtml +=
                                        '<label style="display:flex;align-items:center;gap:6px;font-size:11.5px;padding:3px 6px;border-radius:4px;background:' + (isDistractorActive ? 'transparent' : '#FEE2E2') + ';cursor:pointer;">' +
                                            '<input type="checkbox" data-q-distractor-toggle="' + esc(qObj.id) + '" data-distractor-idx="' + di + '" ' + (isDistractorActive ? 'checked' : '') + ' style="cursor:pointer;">' +
                                            '<span style="' + (isDistractorActive ? 'color:#334155;' : 'color:#991B1B;text-decoration:line-through;') + '">' + bidi(dText) + '</span>' +
                                        '</label>';
                                }

                                questionsCardsHtml +=
                                    '<div class="tc-section-card" style="margin-bottom:10px;border-right:3px solid ' + (isQEnabled ? 'var(--win-accent)' : '#94A3B8') + ';background:' + (isQEnabled ? '#FFFFFF' : '#F8FAFC') + ';">' +
                                        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
                                            '<div style="display:flex;align-items:center;gap:8px;">' +
                                                '<span class="win-badge" style="background:#EFF6FF;color:#1D4ED8;font-weight:700;font-size:11px;">' + bidi(qTaskTitle) + '</span>' +
                                                '<strong style="font-size:12.5px;color:#0F172A;">' + bidi(qObj.titleAr || '') + '</strong>' +
                                                (qObj.isCustom ? ' <span class="win-badge" style="background:#ECFDF5;color:#065F46;font-size:10px;">' + bidi('سؤال مخصص') + '</span>' : '') +
                                                (qObj.isCustomized ? ' <span class="win-badge" style="background:#FEF3C7;color:#92400E;font-size:10px;">' + bidi('مُعدّل الصياغة') + '</span>' : '') +
                                            '</div>' +
                                            '<div style="display:flex;align-items:center;gap:8px;">' +
                                                '<button type="button" class="win-btn win-btn-secondary" data-q-edit="' + esc(qObj.id) + '" style="min-height:22px;padding:1px 8px;font-size:11px;display:inline-flex;align-items:center;gap:4px;">' + (global.Win11Icons ? global.Win11Icons.get('edit', 12) + ' ' : '') + '<span>' + bidi('تعديل الصياغة والمموهات') + '</span></button>' +
                                                '<label style="display:flex;align-items:center;gap:4px;font-size:11.5px;cursor:pointer;">' +
                                                    '<input type="checkbox" data-q-toggle="' + esc(qObj.id) + '" ' + (isQEnabled ? 'checked' : '') + '> ' +
                                                    '<span>' + bidi(isQEnabled ? 'مفعّل' : 'معطّل') + '</span>' +
                                                '</label>' +
                                                '<button type="button" class="win-btn win-btn-danger" data-q-del="' + esc(qObj.id) + '" style="min-height:22px;padding:1px 8px;font-size:11px;">' + bidi('حذف') + '</button>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div style="font-weight:700;font-size:12.5px;color:#0F172A;margin-bottom:8px;line-height:1.5;">' +
                                            bidi(qObj.questionAr) +
                                        '</div>' +
                                        '<div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:6px 10px;margin-bottom:8px;font-size:11.5px;color:#065F46;display:flex;align-items:flex-start;gap:6px;">' +
                                            (global.Win11Icons ? global.Win11Icons.get('check', 13) : '') + '<div><strong>' + bidi('الإجابة الصحيحة:') + '</strong> ' + bidi(qObj.correctAnswerAr) + '</div>' +
                                        '</div>' +
                                        '<details data-q-details="' + esc(qObj.id) + '" ' + (openDistractorCards[qObj.id] ? 'open' : '') + ' style="margin-bottom:8px;font-size:11.5px;">' +
                                            '<summary style="cursor:pointer;color:var(--win-accent);font-weight:700;">' + bidi('قائمة المموهات البديلة المتاحة في المخزن (' + dPool.length + ' مموهات) — انقر للإظهار والتعطيل/التفعيل') + '</summary>' +
                                            '<div style="margin-top:6px;display:grid;grid-template-columns:1fr;gap:4px;max-height:160px;overflow-y:auto;border:1px solid var(--win-border-control);border-radius:4px;padding:6px;">' +
                                                distractorsListHtml +
                                            '</div>' +
                                        '</details>' +
                                        '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:6px 10px;font-size:11.5px;color:#475569;display:flex;align-items:flex-start;gap:6px;">' +
                                            (global.Win11Icons ? global.Win11Icons.get('bulb', 13) : '') + '<div><strong>' + bidi('التلميح البيداغوجي الذكي:') + '</strong> ' + bidi(qObj.hintAr || '') + '</div>' +
                                        '</div>' +
                                    '</div>';
                            }
                        }

                        // Add question form HTML
                        var addFormHtml = '';
                        if (showAddQuestionForm) {
                            addFormHtml =
                                '<div class="tc-section-card" style="border:1.5px solid var(--win-accent);background:#F0F7FF;margin-bottom:12px;padding:12px 14px;">' +
                                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                                        '<strong style="color:var(--win-accent);font-size:13px;">' + bidi('إضافة سؤال تقويمي جديد إلى بنك الأسئلة') + '</strong>' +
                                        '<button type="button" class="win-btn win-btn-secondary" id="tc-addq-cancel" style="min-height:22px;padding:2px 8px;font-size:11px;">' + (global.Win11Icons ? global.Win11Icons.get('winClose', 10) + ' ' : '') + bidi('إلغاء') + '</button>' +
                                    '</div>' +
                                    '<div class="tc-field-grid" style="margin-bottom:8px;">' +
                                        '<label><strong>' + bidi('المهمة / المرحلة:') + '</strong>' +
                                            '<select class="win-select" id="tc-addq-task">' +
                                                '<option value="1">المهمة 1: تغيير لغة عرض واجهة Windows</option>' +
                                                '<option value="2">المهمة 2: ضبط خصائص الفأرة</option>' +
                                                '<option value="3">المهمة 3: إضافة لغة إدخال وضبط المنطقة الزمنية</option>' +
                                                '<option value="4">المهمة 4: تخصيص الخلفية ولون التمييز</option>' +
                                                '<option value="5">المهمة 5: تثبيت وإزالة البرامج والميزات</option>' +
                                                '<option value="6">المهمة 6: إدارة حسابات المستخدمين والصلاحيات</option>' +
                                            '</select>' +
                                        '</label>' +
                                        '<label><strong>' + bidi('عنوان السؤال / الكفاءة المستهدفة:') + '</strong>' +
                                            '<input class="win-input" id="tc-addq-title" placeholder="مثال: التمييز بين لغة العرض ولغة الإدخال">' +
                                        '</label>' +
                                    '</div>' +
                                    '<label style="display:block;margin-bottom:8px;"><strong>' + bidi('نص السؤال باللغة العربية:') + '</strong>' +
                                        '<textarea class="win-input" id="tc-addq-text" rows="2" style="resize:vertical;" placeholder="اكتب نص السؤال التقويمي هنا..."></textarea>' +
                                    '</label>' +
                                    '<label style="display:block;margin-bottom:8px;"><strong>' + bidi('الإجابة الصحيحة الواحدة (المطابقة للمنهاج):') + '</strong>' +
                                        '<input class="win-input" id="tc-addq-correct" placeholder="نص الإجابة الصحيحة بدقة...">' +
                                    '</label>' +
                                    '<label style="display:block;margin-bottom:8px;"><strong>' + bidi('مخزن المموهات والإجابات الخاطئة (أدخل كل مموه في سطر مستقل — على الأقل 3 مموهات، ويفضل 10):') + '</strong>' +
                                        '<textarea class="win-input" id="tc-addq-distractors" rows="4" style="resize:vertical;" placeholder="مموه 1&#10;مموه 2&#10;مموه 3&#10;مموه 4&#10;..."></textarea>' +
                                    '</label>' +
                                    '<label style="display:block;margin-bottom:10px;"><strong>' + bidi('التلميح البيداغوجي المساعد (يظهر عند الخطأ دون كشف الإجابة):') + '</strong>' +
                                        '<input class="win-input" id="tc-addq-hint" placeholder="تلميح توجيهي دون ذكر كلمات الإجابة الصريحة...">' +
                                    '</label>' +
                                    '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
                                        '<button type="button" class="win-btn win-btn-accent" id="tc-addq-submit" style="padding:4px 14px;font-weight:700;">' + (global.Win11Icons ? global.Win11Icons.get('check', 13) + ' ' : '') + bidi('إضافة السؤال وحفظه') + '</button>' +
                                    '</div>' +
                                '</div>';
                        }

                        bodyHtml =
                            '<div class="tc-section-card">' +
                                '<div style="font-weight:700;margin-bottom:8px;color:#0F172A;font-size:13px;">' + bidi('الإعدادات العامة للأسئلة التقويمية التفاعلية:') + '</div>' +
                                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
                                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
                                        '<input type="checkbox" id="tc-quiz-enabled" ' + (cfg.quiz_enabled !== false ? 'checked' : '') + '> ' +
                                        '<strong>' + bidi('تفعيل التقويم التفاعلي عند إتمام كل مهمة') + '</strong>' +
                                    '</label>' +
                                    '<label style="display:flex;align-items:center;gap:8px;">' +
                                        '<strong>' + bidi('عدد الخيارات المعروضة لكل سؤال:') + '</strong> ' +
                                        '<select class="win-select" id="tc-quiz-options-count" style="flex:1;">' +
                                            '<option value="4"' + (cfg.quiz_options_count !== 3 ? ' selected' : '') + '>' + bidi('4 خيارات (1 صحيحة + 3 مموهات عشوائية)') + '</option>' +
                                            '<option value="3"' + (cfg.quiz_options_count === 3 ? ' selected' : '') + '>' + bidi('3 خيارات (1 صحيحة + 2 مموهان عشوائيان)') + '</option>' +
                                        '</select>' +
                                    '</label>' +
                                '</div>' +
                                '<div style="margin-bottom:10px;">' +
                                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;">' +
                                        '<input type="checkbox" id="tc-quiz-show-note" ' + (cfg.show_no_quiz_note !== false ? 'checked' : '') + '> ' +
                                        '<span>' + bidi('إظهار ملاحظة «تقييم بدون أسئلة» في التقرير النهائي عند تعطيل الأسئلة') + '</span>' +
                                    '</label>' +
                                '</div>' +
                                '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:8px 12px;font-size:12px;color:#475569;line-height:1.5;display:flex;align-items:flex-start;gap:8px;">' +
                                    (global.Win11Icons ? global.Win11Icons.get('info', 14) : '') +
                                    '<div><strong>' + bidi('نظام مكافحة التخمين وتدرج العلامات:') + '</strong> ' +
                                    bidi('يتم اختيار سؤال واحد عشوائياً لكل مهمة من بنك الأسئلة، مع اختيار مموهات عشوائية وخلط مواقع الخيارات تماماً. تُمنح العلامة كاملة (100%) في المحاولة الأولى، ونصف العلامة (50%) في المحاولة الثانية، و0 نقطة في المحاولات اللاحقة مع إلزام التلميذ بالوصول للإجابة الصحيحة لمواصلة المحاكاة.') + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="tc-section-card">' +
                                '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' +
                                    '<div style="display:flex;align-items:center;gap:10px;flex:1;">' +
                                        '<strong>' + bidi('تصفية الأسئلة حسب المهمة:') + '</strong> ' +
                                        '<select class="win-select" id="tc-quiz-task-filter" style="max-width:280px;">' +
                                            taskFilterOpts +
                                        '</select>' +
                                    '</div>' +
                                    '<div style="display:flex;align-items:center;gap:8px;">' +
                                        (quizTaskFilter > 0 ? (
                                            '<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;background:#F1F5F9;padding:3px 8px;border-radius:4px;">' +
                                                '<input type="checkbox" id="tc-quiz-stage-toggle" ' + (isCurrentTaskQuizEnabled ? 'checked' : '') + '> ' +
                                                '<span>' + bidi('تفعيل الأسئلة لهذه المهمة') + '</span>' +
                                            '</label>'
                                        ) : '') +
                                        (!showAddQuestionForm ? (
                                            '<button type="button" class="win-btn win-btn-accent" id="tc-quiz-add-btn" style="min-height:26px;padding:2px 12px;font-size:12px;font-weight:700;">' +
                                                (global.Win11Icons ? global.Win11Icons.get('plus', 12) + ' ' : '') + bidi('إضافة سؤال جديد') +
                                            '</button>'
                                        ) : '') +
                                    '</div>' +
                                '</div>' +
                                addFormHtml +
                                '<div style="max-height:480px;overflow-y:auto;padding-right:4px;">' +
                                    questionsCardsHtml +
                                '</div>' +
                            '</div>';
                    } else if (activeTab === 'report') {
                        var tokRows = '';
                        for (var tk = 0; tk < tokenOrderState.length; tk++) {
                            var tEntry = tokenOrderState[tk];
                            tokRows +=
                                '<div class="tc-token-row">' +
                                    '<label style="display:flex;align-items:center;gap:8px;flex:1;cursor:pointer">' +
                                        '<input type="checkbox" data-tok-chk="' + tk + '"' + (tEntry.on ? ' checked' : '') + '>' +
                                        '<span>' + bidi(tEntry.def.label) + '</span>' +
                                    '</label>' +
                                    '<button type="button" class="win-btn win-btn-secondary" data-tok-up="' + tk + '" style="min-height:24px;padding:2px 8px"' + (tk === 0 ? ' disabled' : '') + '>' + (global.Win11Icons ? global.Win11Icons.get('chevronUp', 12) : '▲') + '</button>' +
                                    '<button type="button" class="win-btn win-btn-secondary" data-tok-dn="' + tk + '" style="min-height:24px;padding:2px 8px"' + (tk === tokenOrderState.length - 1 ? ' disabled' : '') + '>' + (global.Win11Icons ? global.Win11Icons.get('chevronDown', 12) : '▼') + '</button>' +
                                '</div>';
                        }
                        var fCheck = validateFilenamePattern(cfg.filename_template);
                        bodyHtml =
                            '<div class="tc-section-card">' +
                                '<div style="font-weight:700;margin-bottom:6px">' + bidi('منشئ نمط اسم ملف التقييم (تفعيل وترتيب الرموز):') + '</div>' +
                                '<div id="tc-fname-tokens">' + tokRows + '</div>' +
                                '<label style="display:block;margin-top:8px"><strong>' + bidi('النمط الفعلي:') + '</strong>' +
                                    '<input class="win-input" id="tc-fname-pattern" value="' + esc(cfg.filename_template) + '" dir="ltr"></label>' +
                                '<div id="tc-fname-err" style="color:var(--win-danger);font-size:12px;margin-top:4px;min-height:16px">' + (fCheck.ok ? '' : bidi(fCheck.reason)) + '</div>' +
                                '<div style="font-size:12px;background:var(--win-surface-card);padding:6px 10px;border-radius:4px;border:1px dashed var(--win-border-control)">' +
                                    '<strong>' + bidi('معاينة حية:') + '</strong> <bdi dir="ltr" id="tc-fname-preview">' + esc(renderTokenPreview(cfg.filename_template)) + '</bdi>' +
                                '</div>' +
                            '</div>' +
                            '<div class="tc-section-card">' +
                                '<div style="font-weight:700;margin-bottom:6px">' + bidi('عناصر التقرير وشعار المؤسسة:') + '</div>' +
                                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">' +
                                    '<label><input type="checkbox" id="tc-sm"' + (cfg.show_mistakes ? ' checked' : '') + '> ' + bidi('إظهار الأخطاء في التقرير') + '</label>' +
                                    '<label><input type="checkbox" id="tc-sp"' + (cfg.show_penalties ? ' checked' : '') + '> ' + bidi('إظهار الخصومات') + '</label>' +
                                    '<label><input type="checkbox" id="tc-st"' + (cfg.show_time ? ' checked' : '') + '> ' + bidi('إظهار الأوقات التفصيلية') + '</label>' +
                                    '<label><input type="checkbox" id="tc-sc"' + (cfg.show_competency ? ' checked' : '') + '> ' + bidi('إظهار التقدير العام ومستوى الأداء') + '</label>' +
                                    '<label><input type="checkbox" id="tc-sps"' + (cfg.show_partial_scores ? ' checked' : '') + '> ' + bidi('احتساب النقاط الجزئية') + '</label>' +
                                '</div>' +
                                '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
                                    '<label class="win-btn win-btn-secondary" style="cursor:pointer">' + bidi('إدراج شعار المؤسسة في التقرير') +
                                        '<input type="file" id="tc-logo-file" accept="image/png,image/jpeg,image/webp" style="display:none">' +
                                    '</label>' +
                                    (cfg.report_logo_b64 ? '<img src="' + cfg.report_logo_b64 + '" style="height:34px;border-radius:4px;border:1px solid var(--win-border-card)"><button type="button" class="win-btn win-btn-danger" id="tc-logo-clear" style="min-height:26px">' + bidi('إزالة الشعار') + '</button>' : '') +
                                '</div>' +
                            '</div>';
                    } else {
                        var vaultObj = (global.Win11Assessment.getVault) ? global.Win11Assessment.getVault() : { audit_log: [] };
                        var audits = (vaultObj && Array.isArray(vaultObj.audit_log)) ? vaultObj.audit_log : [];
                        var auditHtml = audits.length === 0
                            ? '<div style="font-size:12px;color:var(--win-text-secondary)">' + bidi('لا توجد عمليات مسجلة بعد.') + '</div>'
                            : '<div style="max-height:90px;overflow-y:auto;font-size:11.5px">' + audits.map(function (a) {
                                return '<div><bdi dir="ltr">' + esc(a.at) + '</bdi> — ' + bidi(a.action === 'unlock' ? 'فتح وحدة الأستاذ' : a.action) + '</div>';
                            }).join('') + '</div>';
                        var infSt = global.Win11Assessment.getInfStatus ? global.Win11Assessment.getInfStatus() : { status: 'missing' };

                        bodyHtml =
                            '<div class="tc-section-card">' +
                                '<div class="tc-field-grid">' +
                                    '<label><input type="checkbox" id="tc-lock-fs"' + (cfg.lock_fullscreen_in_exam ? ' checked' : '') + '> <strong>' + bidi('قفل ملء الشاشة في وضع الامتحان') + '</strong></label>' +
                                    '<label><input type="checkbox" id="tc-theme-lock"' + (cfg.theme_lock ? ' checked' : '') + '> <strong>' + bidi('قفل تغيير المظهر والألوان') + '</strong></label>' +
                                    '<label><input type="checkbox" id="tc-netsupport-offset"' + (cfg.netsupport_offset ? ' checked' : '') + '> <strong>' + bidi('إزاحة شريط NetSupport School (38px)') + '</strong></label>' +
                                '</div>' +
                                '<label style="display:block;margin-top:8px"><strong>' + bidi('تعدد المستخدمين على الجهاز:') + '</strong>' +
                                    '<select class="win-select" id="tc-multi-user">' +
                                        '<option value="multi"' + (cfg.multi_user_mode !== false ? ' selected' : '') + '>' + bidi('حسابات متعددة (Administrateur / Standard / Invité)') + '</option>' +
                                        '<option value="single"' + (cfg.multi_user_mode === false ? ' selected' : '') + '>' + bidi('وضع حاسوب طالب واحد') + '</option>' +
                                    '</select>' +
                                '</label>' +
                                '<div class="tc-field-grid" style="margin-top:8px">' +
                                    '<label><strong>' + bidi('تغيير كلمة المرور (اختياري):') + '</strong><input type="password" class="win-input" id="tc-pass" value="' + esc(pendingNewPass) + '" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off"></label>' +
                                    '<label><strong>' + bidi('تأكيد كلمة المرور الجديدة:') + '</strong><input type="password" class="win-input" id="tc-pass-confirm" value="' + esc(pendingNewPass) + '" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off"></label>' +
                                '</div>' +
                                (passMismatchMsg ? '<div style="color:var(--win-danger);font-size:12px;margin-top:4px">' + bidi(passMismatchMsg) + '</div>' : '') +
                            '</div>' +
                            '<div class="tc-section-card">' +
                                '<div style="font-weight:700;margin-bottom:6px">' + bidi('إدارة ملف inf.dll والنسخ الاحتياطي والتهيئة:') + ' (<bdi dir="ltr">' + esc(infSt.status) + '</bdi>)</div>' +
                                '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                                    '<label class="win-btn win-btn-secondary" style="cursor:pointer">' + bidi(t('pedagogy.importInfBtn')) + '<input type="file" id="tc-import-file" style="display:none"></label>' +
                                    '<button type="button" class="win-btn win-btn-accent" id="tc-export-btn">' + bidi(t('pedagogy.exportInfBtn')) + '</button>' +
                                    '<button type="button" class="win-btn win-btn-secondary" id="tc-backup-btn">' + bidi('نسخة احتياطية مشفرة') + '</button>' +
                                    '<button type="button" class="win-btn win-btn-secondary" id="tc-reset-demo">' + bidi('تصفير بيانات العرض (Reset Demo)') + '</button>' +
                                    '<button type="button" class="win-btn win-btn-danger" id="tc-reset-defaults">' + bidi('استعادة الإعدادات الافتراضية') + '</button>' +
                                '</div>' +
                                '<div id="tc-inf-msg" style="margin-top:6px;font-size:12px;color:var(--win-success)"></div>' +
                            '</div>' +
                            '<div class="tc-section-card">' +
                                '<div style="font-weight:700;margin-bottom:4px">' + bidi('سجل دخول الأستاذ المشفر (Vault Audit Log):') + '</div>' +
                                auditHtml +
                            '</div>';
                    }

                    wrap.innerHTML = setupBanner + tabsHtml + dirtyBanner + bodyHtml;

                    var setupImp = wrap.querySelector('#tc-setup-import');
                    if (setupImp) {
                        setupImp.onchange = function () {
                            var f = this.files && this.files[0];
                            if (!f) return;
                            var reader = new FileReader();
                            reader.onload = function () {
                                try {
                                    var bytes = new Uint8Array(reader.result);
                                    var res = global.Win11Assessment.loadInfBytes(bytes);
                                    if (!res.ok) {
                                        setupErrMsg = t('pedagogy.infTamperTitle');
                                        draw();
                                        return;
                                    }
                                    global.Win11Dialogs.close(false);
                                    openAuth();
                                } catch (e) { }
                            };
                            reader.readAsArrayBuffer(f);
                        };
                    }

                    // Bind shared input dirty detection
                    var allInputs = wrap.querySelectorAll('input, select');
                    for (var ii = 0; ii < allInputs.length; ii++) {
                        allInputs[ii].addEventListener('change', markDirty);
                        if (allInputs[ii].type === 'text' || allInputs[ii].type === 'number' || allInputs[ii].type === 'password') {
                            allInputs[ii].addEventListener('input', markDirty);
                        }
                    }

                    // Tab switching
                    var tBtns = wrap.querySelectorAll('[data-ttab]');
                    for (var k = 0; k < tBtns.length; k++) {
                        tBtns[k].onclick = function () {
                            saveVisibleFields();
                            activeTab = this.getAttribute('data-ttab');
                            draw();
                        };
                    }

                    // Class Groups CRUD
                    var delBtns = wrap.querySelectorAll('[data-del-grp]');
                    for (var d = 0; d < delBtns.length; d++) {
                        delBtns[d].onclick = function () {
                            saveVisibleFields();
                            cfg.class_groups.splice(Number(this.getAttribute('data-del-grp')), 1);
                            isDirty = true;
                            draw();
                        };
                    }
                    var addGrpBtn = wrap.querySelector('#tc-add-grp');
                    if (addGrpBtn) {
                        addGrpBtn.onclick = function () {
                            var inp = wrap.querySelector('#tc-new-grp');
                            if (inp && inp.value.trim()) {
                                saveVisibleFields();
                                cfg.class_groups.push(inp.value.trim());
                                isDirty = true;
                                draw();
                            }
                        };
                    }

                    function refreshTaskWeightSummary() {
                        var sum = 0;
                        for (var x = 0; x < cfg.tasks_config.length; x++) {
                            var row = cfg.tasks_config[x];
                            var curC = (row.coefficient !== undefined && row.coefficient !== null)
                                ? Number(row.coefficient)
                                : (Number(row.weight) || (row.complexity === 'complex' ? 3 : 1));
                            curC = Math.floor(Math.max(1, curC));
                            if (row.enabled !== false) sum += curC;
                            var badge = wrap.querySelector('[data-task-tier="' + x + '"]');
                            if (badge) {
                                var nw = curC;
                                var tLbl = nw <= 2 ? 'بسيطة (1–2)' : (nw <= 5 ? 'متوسطة (3–5)' : 'معقدة (6–10)');
                                var tBg = nw <= 2 ? '#ECFDF5' : (nw <= 5 ? '#EFF6FF' : '#FFFBEB');
                                var tCol = nw <= 2 ? '#065F46' : (nw <= 5 ? '#0369A1' : '#B45309');
                                badge.style.background = tBg;
                                badge.style.color = tCol;
                                badge.innerHTML = bidi(tLbl);
                            }
                        }
                        var sumEl = wrap.querySelector('#tc-weights-summary');
                        if (sumEl) {
                            var isBalanced = (sum === 20);
                            sumEl.style.background = isBalanced ? '#ECFDF5' : '#FEF3C7';
                            sumEl.style.color = isBalanced ? '#065F46' : '#B45309';
                            sumEl.innerHTML = bidi('مجموع علامات المهام:') + ' <bdi dir="ltr">' + sum + ' / 20.00</bdi>' + (!isBalanced ? (' (' + bidi('غير متطابق مع 20') + ')') : '');
                        }
                    }

                    // Tasks Customizer events
                    var eqBtn = wrap.querySelector('#tc-equal-weights');
                    if (eqBtn) {
                        eqBtn.onclick = function () {
                            for (var ei = 0; ei < cfg.tasks_config.length; ei++) {
                                var row = cfg.tasks_config[ei];
                                var defC = (row.complexity === 'complex') ? 3 : 1;
                                row.coefficient = defC;
                                row.weight = defC;
                            }
                            isDirty = true;
                            draw();
                        };
                    }
                    var balBtn = wrap.querySelector('#tc-balance-20');
                    if (balBtn) {
                        balBtn.onclick = function () {
                            var enabledIdxs = [];
                            var curSum = 0;
                            for (var bi = 0; bi < cfg.tasks_config.length; bi++) {
                                if (cfg.tasks_config[bi].enabled !== false) {
                                    enabledIdxs.push(bi);
                                    curSum += (Number(cfg.tasks_config[bi].coefficient) || 1);
                                }
                            }
                            if (enabledIdxs.length === 0) return;
                            var remaining = 20;
                            for (var bj = 0; bj < enabledIdxs.length; bj++) {
                                var eIdx = enabledIdxs[bj];
                                var oldC = Number(cfg.tasks_config[eIdx].coefficient) || 1;
                                var newC = (bj === enabledIdxs.length - 1)
                                    ? Math.max(1, remaining)
                                    : Math.max(1, Math.round((oldC / curSum) * 20));
                                if (newC > remaining - (enabledIdxs.length - 1 - bj)) {
                                    newC = Math.max(1, remaining - (enabledIdxs.length - 1 - bj));
                                }
                                remaining -= newC;
                                cfg.tasks_config[eIdx].coefficient = newC;
                                cfg.tasks_config[eIdx].weight = newC;
                            }
                            isDirty = true;
                            draw();
                        };
                    }
                    var tkEns = wrap.querySelectorAll('[data-task-en]');
                    for (var eIdx = 0; eIdx < tkEns.length; eIdx++) {
                        tkEns[eIdx].onchange = function () {
                            var idx = Number(this.getAttribute('data-task-en'));
                            cfg.tasks_config[idx].enabled = this.checked;
                            isDirty = true;
                            draw();
                        };
                    }
                    var tkCrits = wrap.querySelectorAll('[data-task-crit]');
                    for (var cIdx = 0; cIdx < tkCrits.length; cIdx++) {
                        tkCrits[cIdx].onchange = function () {
                            cfg.tasks_config[Number(this.getAttribute('data-task-crit'))].critical = this.checked;
                            isDirty = true;
                        };
                    }
                    var tkCoefs = wrap.querySelectorAll('[data-task-coef]');
                    for (var wIdx = 0; wIdx < tkCoefs.length; wIdx++) {
                        tkCoefs[wIdx].oninput = function () {
                            var v = Math.floor(Math.max(1, parseInt(this.value, 10) || 1));
                            var idx = Number(this.getAttribute('data-task-coef'));
                            cfg.tasks_config[idx].coefficient = v;
                            cfg.tasks_config[idx].weight = v;
                            isDirty = true;
                            refreshTaskWeightSummary();
                        };
                    }
                    var subEns = wrap.querySelectorAll('[data-subtask-en]');
                    for (var sIdx = 0; sIdx < subEns.length; sIdx++) {
                        subEns[sIdx].onchange = function () {
                            var parts = this.getAttribute('data-subtask-en').split(':');
                            var tIdx = Number(parts[0]);
                            var subId = Number(parts[1]);
                            if (!Array.isArray(cfg.tasks_config[tIdx].disabled_subtasks)) {
                                cfg.tasks_config[tIdx].disabled_subtasks = [];
                            }
                            var arr = cfg.tasks_config[tIdx].disabled_subtasks;
                            if (this.checked) {
                                cfg.tasks_config[tIdx].disabled_subtasks = arr.filter(function (x) { return x !== subId; });
                            } else {
                                if (arr.indexOf(subId) === -1) arr.push(subId);
                            }
                            isDirty = true;
                        };
                    }
                    var tkUps = wrap.querySelectorAll('[data-task-up]');
                    for (var uIdx = 0; uIdx < tkUps.length; uIdx++) {
                        tkUps[uIdx].onclick = function () {
                            var idx = Number(this.getAttribute('data-task-up'));
                            if (idx > 0) {
                                var tmp = cfg.tasks_config[idx - 1];
                                cfg.tasks_config[idx - 1] = cfg.tasks_config[idx];
                                cfg.tasks_config[idx] = tmp;
                                isDirty = true;
                                draw();
                            }
                        };
                    }
                    var tkDns = wrap.querySelectorAll('[data-task-dn]');
                    for (var dnIdx = 0; dnIdx < tkDns.length; dnIdx++) {
                        tkDns[dnIdx].onclick = function () {
                            var idx = Number(this.getAttribute('data-task-dn'));
                            if (idx < cfg.tasks_config.length - 1) {
                                var tmp = cfg.tasks_config[idx + 1];
                                cfg.tasks_config[idx + 1] = cfg.tasks_config[idx];
                                cfg.tasks_config[idx] = tmp;
                                isDirty = true;
                                draw();
                            }
                        };
                    }
                    var subUps = wrap.querySelectorAll('[data-subtask-up]');
                    for (var suIdx = 0; suIdx < subUps.length; suIdx++) {
                        subUps[suIdx].onclick = function () {
                            var parts = this.getAttribute('data-subtask-up').split(':');
                            var tIdx = Number(parts[0]);
                            var sPos = Number(parts[1]);
                            var tItem = cfg.tasks_config[tIdx];
                            if (tItem && Array.isArray(tItem.subtasks_order) && sPos > 0) {
                                var tmp = tItem.subtasks_order[sPos - 1];
                                tItem.subtasks_order[sPos - 1] = tItem.subtasks_order[sPos];
                                tItem.subtasks_order[sPos] = tmp;
                                isDirty = true;
                                draw();
                            }
                        };
                    }
                    var subDns = wrap.querySelectorAll('[data-subtask-dn]');
                    for (var sdnIdx = 0; sdnIdx < subDns.length; sdnIdx++) {
                        subDns[sdnIdx].onclick = function () {
                            var parts = this.getAttribute('data-subtask-dn').split(':');
                            var tIdx = Number(parts[0]);
                            var sPos = Number(parts[1]);
                            var tItem = cfg.tasks_config[tIdx];
                            if (tItem && Array.isArray(tItem.subtasks_order) && sPos < tItem.subtasks_order.length - 1) {
                                var tmp = tItem.subtasks_order[sPos + 1];
                                tItem.subtasks_order[sPos + 1] = tItem.subtasks_order[sPos];
                                tItem.subtasks_order[sPos] = tmp;
                                isDirty = true;
                                draw();
                            }
                        };
                    }

                    // Token Filename Builder events
                    var tokChks = wrap.querySelectorAll('[data-tok-chk]');
                    for (var tc = 0; tc < tokChks.length; tc++) {
                        tokChks[tc].onchange = function () {
                            tokenOrderState[Number(this.getAttribute('data-tok-chk'))].on = this.checked;
                            rebuildPatternFromTokens(tokenOrderState);
                            isDirty = true;
                            draw();
                        };
                    }
                    var tokUps = wrap.querySelectorAll('[data-tok-up]');
                    for (var tu = 0; tu < tokUps.length; tu++) {
                        tokUps[tu].onclick = function () {
                            var idx = Number(this.getAttribute('data-tok-up'));
                            if (idx > 0) {
                                var tmp = tokenOrderState[idx - 1];
                                tokenOrderState[idx - 1] = tokenOrderState[idx];
                                tokenOrderState[idx] = tmp;
                                rebuildPatternFromTokens(tokenOrderState);
                                isDirty = true;
                                draw();
                            }
                        };
                    }
                    var tokDns = wrap.querySelectorAll('[data-tok-dn]');
                    for (var td = 0; td < tokDns.length; td++) {
                        tokDns[td].onclick = function () {
                            var idx = Number(this.getAttribute('data-tok-dn'));
                            if (idx < tokenOrderState.length - 1) {
                                var tmp = tokenOrderState[idx + 1];
                                tokenOrderState[idx + 1] = tokenOrderState[idx];
                                tokenOrderState[idx] = tmp;
                                rebuildPatternFromTokens(tokenOrderState);
                                isDirty = true;
                                draw();
                            }
                        };
                    }
                    var fnameInp = wrap.querySelector('#tc-fname-pattern');
                    if (fnameInp) {
                        fnameInp.oninput = function () {
                            cfg.filename_template = this.value;
                            var chk = validateFilenamePattern(this.value);
                            var errBox = wrap.querySelector('#tc-fname-err');
                            var prevBox = wrap.querySelector('#tc-fname-preview');
                            if (errBox) errBox.innerHTML = chk.ok ? '' : bidi(chk.reason);
                            if (prevBox) prevBox.textContent = chk.ok ? renderTokenPreview(this.value) : '—';
                            markDirty();
                        };
                    }

                    // Report Logo Upload/Clear
                    var logoInp = wrap.querySelector('#tc-logo-file');
                    if (logoInp) {
                        logoInp.onchange = function () {
                            var f = this.files && this.files[0];
                            if (!f) return;
                            var reader = new FileReader();
                            reader.onload = function () {
                                cfg.report_logo_b64 = String(reader.result || '');
                                isDirty = true;
                                draw();
                            };
                            reader.readAsDataURL(f);
                        };
                    }
                    var logoClr = wrap.querySelector('#tc-logo-clear');
                    if (logoClr) {
                        logoClr.onclick = function () {
                            cfg.report_logo_b64 = '';
                            isDirty = true;
                            draw();
                        };
                    }

                    // Security / inf.dll / Reset actions
                    var expBtn = wrap.querySelector('#tc-export-btn');
                    if (expBtn) {
                        expBtn.onclick = function () {
                            saveVisibleFields();
                            if (!validateFilenamePattern(cfg.filename_template).ok) return;
                            global.Win11Assessment.saveConfig(cfg);
                            var pwd = pendingNewPass || global.Win11Assessment.getActivePasswordInRam();
                            if (!pwd) return;
                            triggerBinaryDownload(global.Win11Assessment.exportBinaryInfDll(pwd), 'inf.dll');
                            if (global.Win11Dialogs && typeof global.Win11Dialogs.showToast === 'function') {
                                global.Win11Dialogs.showToast('جاري تصدير inf.dll. إذا ظهر تنبيه أمان بالمتصفح، اختر الاحتفاظ (Conserver).');
                            }
                        };
                    }
                    var bkpBtn = wrap.querySelector('#tc-backup-btn');
                    if (bkpBtn) {
                        bkpBtn.onclick = function () {
                            saveVisibleFields();
                            var pwd = pendingNewPass || global.Win11Assessment.getActivePasswordInRam();
                            if (!pwd) return;
                            global.Win11Assessment.saveConfig(cfg);
                            var stamp = new Date().toISOString().slice(0, 10);
                            triggerBinaryDownload(global.Win11Assessment.exportBinaryInfDll(pwd), 'backup_' + stamp + '_inf.dll');
                        };
                    }
                    var impFile = wrap.querySelector('#tc-import-file');
                    if (impFile) {
                        impFile.onchange = function () {
                            var f = this.files && this.files[0];
                            if (!f) return;
                            var reader = new FileReader();
                            reader.onload = function () {
                                var m = wrap.querySelector('#tc-inf-msg');
                                try {
                                    var bytes = new Uint8Array(reader.result);
                                    var res = global.Win11Assessment.loadInfBytes(bytes);
                                    if (!res.ok) throw new Error(res.reason || 'Tampered');
                                    cfg = global.Win11Compat.deepClone(global.Win11Assessment.getConfig());
                                    tokenOrderState = parseOrderedTokens();
                                    isDirty = false;
                                    draw();
                                    var mAfter = wrap.querySelector('#tc-inf-msg');
                                    if (mAfter) { mAfter.style.color = 'var(--win-success)'; mAfter.innerHTML = bidi('تم استيراد ملف inf.dll المشفر والتحقق من سلامته بنجاح.'); }
                                } catch (err) {
                                    if (m) { m.style.color = 'var(--win-danger)'; m.innerHTML = bidi(t('pedagogy.infTamperMsg')); }
                                }
                            };
                            reader.readAsArrayBuffer(f);
                        };
                    }
                    var rstDemoBtn = wrap.querySelector('#tc-reset-demo');
                    if (rstDemoBtn) {
                        rstDemoBtn.onclick = function () {
                            if (typeof global.Win11Assessment.resetDemoSession === 'function') {
                                global.Win11Assessment.resetDemoSession();
                                var m = wrap.querySelector('#tc-inf-msg');
                                if (m) { m.style.color = 'var(--win-success)'; m.innerHTML = bidi('تم تصفير جلسة الطالب والمؤقت والأخطاء بنجاح.'); }
                            }
                        };
                    }
                    var rstDefBtn = wrap.querySelector('#tc-reset-defaults');
                    if (rstDefBtn) {
                        rstDefBtn.onclick = function () {
                            cfg = global.Win11Compat.deepClone(global.Win11Assessment.getDefaultConfig());
                            tokenOrderState = parseOrderedTokens();
                            isDirty = true;
                            draw();
                        };
                    }

                    // Quiz Bank Management Events
                    var qeEl = wrap.querySelector('#tc-quiz-enabled');
                    if (qeEl) {
                        qeEl.onchange = function () {
                            cfg.quiz_enabled = this.checked;
                            isDirty = true;
                            draw();
                        };
                    }
                    var qoEl = wrap.querySelector('#tc-quiz-options-count');
                    if (qoEl) {
                        qoEl.onchange = function () {
                            cfg.quiz_options_count = Number(this.value) || 4;
                            isDirty = true;
                        };
                    }
                    var qnEl = wrap.querySelector('#tc-quiz-show-note');
                    if (qnEl) {
                        qnEl.onchange = function () {
                            cfg.show_no_quiz_note = this.checked;
                            isDirty = true;
                        };
                    }
                    var qtfEl = wrap.querySelector('#tc-quiz-task-filter');
                    if (qtfEl) {
                        qtfEl.onchange = function () {
                            quizTaskFilter = Number(this.value) || 0;
                            draw();
                        };
                    }
                    var qstEl = wrap.querySelector('#tc-quiz-stage-toggle');
                    if (qstEl) {
                        qstEl.onchange = function () {
                            cfg.quiz_disabled_tasks = Array.isArray(cfg.quiz_disabled_tasks) ? cfg.quiz_disabled_tasks : [];
                            var idx = cfg.quiz_disabled_tasks.indexOf(quizTaskFilter);
                            if (this.checked && idx !== -1) {
                                cfg.quiz_disabled_tasks.splice(idx, 1);
                            } else if (!this.checked && idx === -1) {
                                cfg.quiz_disabled_tasks.push(quizTaskFilter);
                            }
                            isDirty = true;
                            draw();
                        };
                    }
                    var addQBtn = wrap.querySelector('#tc-quiz-add-btn');
                    if (addQBtn) {
                        addQBtn.onclick = function () {
                            showAddQuestionForm = true;
                            draw();
                        };
                    }
                    var addQCancel = wrap.querySelector('#tc-addq-cancel');
                    if (addQCancel) {
                        addQCancel.onclick = function () {
                            showAddQuestionForm = false;
                            draw();
                        };
                    }
                    var addQSubmit = wrap.querySelector('#tc-addq-submit');
                    if (addQSubmit) {
                        addQSubmit.onclick = function () {
                            var tId = Number(wrap.querySelector('#tc-addq-task').value) || 1;
                            var title = wrap.querySelector('#tc-addq-title').value.trim();
                            var text = wrap.querySelector('#tc-addq-text').value.trim();
                            var corr = wrap.querySelector('#tc-addq-correct').value.trim();
                            var rawDist = wrap.querySelector('#tc-addq-distractors').value.trim();
                            var hint = wrap.querySelector('#tc-addq-hint').value.trim();

                            if (!text || !corr) {
                                if (global.Win11Dialogs && typeof global.Win11Dialogs.showMessage === 'function') {
                                    global.Win11Dialogs.showMessage('بيانات ناقصة', 'يرجى كتابة نص السؤال والإجابة الصحيحة على الأقل.', 'warning');
                                }
                                return;
                            }
                            var distList = rawDist.split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
                            if (distList.length < 2) {
                                if (global.Win11Dialogs && typeof global.Win11Dialogs.showMessage === 'function') {
                                    global.Win11Dialogs.showMessage('المموهات غير كافية', 'يرجى إدخال مموهين اثنين على الأقل (ويفضل 3 إلى 10 مموهات).', 'warning');
                                }
                                return;
                            }

                            if (global.Win11QuizBank) {
                                global.Win11QuizBank.addQuestion({
                                    taskId: tId,
                                    titleAr: title || ('سؤال مخصص للمهمة ' + tId),
                                    questionAr: text,
                                    correctAnswerAr: corr,
                                    distractorsAr: distList,
                                    hintAr: hint || 'راجع خطوات النشاط بعناية.'
                                });
                            }
                            isDirty = true;
                            showAddQuestionForm = false;
                            draw();
                        };
                    }

                    // Wire <details> expansion states so dropdowns never collapse unexpectedly
                    var detailsList = wrap.querySelectorAll('[data-q-details]');
                    for (var dli = 0; dli < detailsList.length; dli++) {
                        detailsList[dli].ontoggle = function () {
                            var qId = this.getAttribute('data-q-details');
                            openDistractorCards[qId] = this.open;
                        };
                    }

                    // Wire question edit buttons
                    var qEdits = wrap.querySelectorAll('[data-q-edit]');
                    for (var qei = 0; qei < qEdits.length; qei++) {
                        qEdits[qei].onclick = function () {
                            var qId = this.getAttribute('data-q-edit');
                            editingQuestionId = (editingQuestionId === qId) ? null : qId;
                            draw();
                        };
                    }

                    // Wire question editor controls if active
                    if (editingQuestionId) {
                        var cancelEditBtn = wrap.querySelector('#tc-editq-cancel');
                        var cancelEditBtn2 = wrap.querySelector('#tc-editq-cancel-btn');
                        var doCancelEdit = function () {
                            editingQuestionId = null;
                            draw();
                        };
                        if (cancelEditBtn) cancelEditBtn.onclick = doCancelEdit;
                        if (cancelEditBtn2) cancelEditBtn2.onclick = doCancelEdit;

                        var revertEditBtn = wrap.querySelector('#tc-editq-revert');
                        if (revertEditBtn) {
                            revertEditBtn.onclick = function () {
                                if (global.Win11QuizBank && editingQuestionId) {
                                    global.Win11QuizBank.resetQuestionToDefault(editingQuestionId);
                                    isDirty = true;
                                    editingQuestionId = null;
                                    draw();
                                    if (global.Win11Dialogs && typeof global.Win11Dialogs.showToast === 'function') {
                                        global.Win11Dialogs.showToast('تمت استعادة الصياغة والمموهات الأصلية للسؤال بنجاح.');
                                    }
                                }
                            };
                        }

                        var addDistBtn = wrap.querySelector('#tc-editq-add-dist');
                        if (addDistBtn) {
                            addDistBtn.onclick = function () {
                                var distListEl = wrap.querySelector('#tc-editq-dist-list');
                                if (distListEl) {
                                    var newRow = document.createElement('div');
                                    newRow.className = 'tc-editq-dist-row';
                                    newRow.style.cssText = 'display:flex;align-items:center;gap:6px;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:4px;padding:4px 6px;';
                                    newRow.innerHTML =
                                        '<input type="text" class="win-input tc-editq-dist-input" value="" placeholder="' + esc('اكتب نص المموّه البديل الجديد...') + '" style="flex:1;font-size:11.5px;min-height:26px;padding:2px 6px;">' +
                                        '<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;white-space:nowrap;">' +
                                            '<input type="checkbox" class="tc-editq-dist-active" checked> ' +
                                            '<span>' + bidi('مفعّل') + '</span>' +
                                        '</label>' +
                                        '<button type="button" class="win-btn win-btn-danger tc-editq-del-dist" style="min-height:24px;padding:1px 6px;font-size:11px;" title="' + esc('حذف هذا المموّه') + '">' + (global.Win11Icons ? global.Win11Icons.get('trash', 12) : 'حذف') + '</button>';
                                    distListEl.appendChild(newRow);
                                    var delBtn = newRow.querySelector('.tc-editq-del-dist');
                                    if (delBtn) {
                                        delBtn.onclick = function () { newRow.remove(); };
                                    }
                                    var inp = newRow.querySelector('.tc-editq-dist-input');
                                    if (inp) inp.focus();
                                }
                            };
                        }

                        var delDistBtns = wrap.querySelectorAll('.tc-editq-del-dist');
                        for (var ddbi = 0; ddbi < delDistBtns.length; ddbi++) {
                            delDistBtns[ddbi].onclick = function () {
                                var row = this.closest('.tc-editq-dist-row');
                                if (row) row.remove();
                            };
                        }

                        var saveEditBtn = wrap.querySelector('#tc-editq-save-btn');
                        if (saveEditBtn) {
                            saveEditBtn.onclick = function () {
                                var titleVal = (wrap.querySelector('#tc-editq-title') ? wrap.querySelector('#tc-editq-title').value : '').trim();
                                var textVal = (wrap.querySelector('#tc-editq-text') ? wrap.querySelector('#tc-editq-text').value : '').trim();
                                var ansVal = (wrap.querySelector('#tc-editq-answer') ? wrap.querySelector('#tc-editq-answer').value : '').trim();
                                var hintVal = (wrap.querySelector('#tc-editq-hint') ? wrap.querySelector('#tc-editq-hint').value : '').trim();

                                if (!textVal || !ansVal) {
                                    if (global.Win11Dialogs && typeof global.Win11Dialogs.showMessage === 'function') {
                                        global.Win11Dialogs.showMessage('بيانات غير مكتملة', 'يرجى التأكد من كتابة نص السؤال والإجابة النموذجية.', 'warning');
                                    }
                                    return;
                                }

                                var distRows = wrap.querySelectorAll('.tc-editq-dist-row');
                                var newDistList = [];
                                var newDisabled = [];
                                for (var dri = 0; dri < distRows.length; dri++) {
                                    var inpVal = (distRows[dri].querySelector('.tc-editq-dist-input') ? distRows[dri].querySelector('.tc-editq-dist-input').value : '').trim();
                                    var chkActive = distRows[dri].querySelector('.tc-editq-dist-active');
                                    if (inpVal.length > 0) {
                                        newDistList.push(inpVal);
                                        if (chkActive && !chkActive.checked) {
                                            newDisabled.push(inpVal);
                                        }
                                    }
                                }

                                if (newDistList.length < 2) {
                                    if (global.Win11Dialogs && typeof global.Win11Dialogs.showMessage === 'function') {
                                        global.Win11Dialogs.showMessage('المموهات غير كافية', 'يرجى إبقاء أو إدخال خيارين مموهين اثنين على الأقل.', 'warning');
                                    }
                                    return;
                                }

                                if (global.Win11QuizBank && editingQuestionId) {
                                    global.Win11QuizBank.updateQuestion(editingQuestionId, {
                                        titleAr: titleVal,
                                        questionAr: textVal,
                                        correctAnswerAr: ansVal,
                                        hintAr: hintVal,
                                        distractorsAr: newDistList,
                                        disabledDistractors: newDisabled
                                    });
                                }

                                editingQuestionId = null;
                                isDirty = true;
                                draw();
                                if (global.Win11Dialogs && typeof global.Win11Dialogs.showToast === 'function') {
                                    global.Win11Dialogs.showToast('تم حفظ صياغة السؤال والمموهات وتحديث بنك الأسئلة بنجاح.');
                                }
                            };
                        }
                    }

                    // Toggles & deletes for questions
                    var qToggles = wrap.querySelectorAll('[data-q-toggle]');
                    for (var qti = 0; qti < qToggles.length; qti++) {
                        qToggles[qti].onchange = function () {
                            var qId = this.getAttribute('data-q-toggle');
                            if (global.Win11QuizBank) {
                                global.Win11QuizBank.toggleQuestionEnabled(qId, this.checked);
                            }
                            isDirty = true;
                            draw();
                        };
                    }
                    var qDels = wrap.querySelectorAll('[data-q-del]');
                    for (var qdi = 0; qdi < qDels.length; qdi++) {
                        qDels[qdi].onclick = function () {
                            var qId = this.getAttribute('data-q-del');
                            if (global.Win11Dialogs && typeof global.Win11Dialogs.confirm === 'function') {
                                global.Win11Dialogs.confirm('حذف السؤال', 'هل أنت متأكد من حذف هذا السؤال من بنك الأسئلة نهائياً؟', function (yes) {
                                    if (yes) {
                                        if (global.Win11QuizBank) {
                                            global.Win11QuizBank.deleteQuestion(qId);
                                        }
                                        isDirty = true;
                                        draw();
                                    }
                                });
                            } else {
                                if (global.Win11QuizBank) {
                                    global.Win11QuizBank.deleteQuestion(qId);
                                }
                                isDirty = true;
                                draw();
                            }
                        };
                    }
                    var distToggles = wrap.querySelectorAll('[data-q-distractor-toggle]');
                    for (var dti = 0; dti < distToggles.length; dti++) {
                        distToggles[dti].onchange = function () {
                            var qId = this.getAttribute('data-q-distractor-toggle');
                            var dIdx = Number(this.getAttribute('data-distractor-idx'));
                            if (global.Win11QuizBank) {
                                var q = global.Win11QuizBank.getQuestionById(qId);
                                if (q && Array.isArray(q.distractorsAr) && q.distractorsAr[dIdx]) {
                                    var dVal = q.distractorsAr[dIdx];
                                    q.disabledDistractors = Array.isArray(q.disabledDistractors) ? q.disabledDistractors : [];
                                    var exIdx = q.disabledDistractors.indexOf(dVal);
                                    if (this.checked && exIdx !== -1) {
                                        q.disabledDistractors.splice(exIdx, 1);
                                    } else if (!this.checked && exIdx === -1) {
                                        q.disabledDistractors.push(dVal);
                                    }
                                    q.isCustomized = true;
                                }
                            }
                            openDistractorCards[qId] = true;
                            isDirty = true;
                            // Seamless in-place UI update without collapsing details or destroying DOM
                            var parentLabel = this.closest('label');
                            var textSpan = parentLabel ? parentLabel.querySelector('span') : null;
                            if (this.checked) {
                                if (parentLabel) parentLabel.style.background = 'transparent';
                                if (textSpan) {
                                    textSpan.style.color = '#334155';
                                    textSpan.style.textDecoration = 'none';
                                }
                            } else {
                                if (parentLabel) parentLabel.style.background = '#FEE2E2';
                                if (textSpan) {
                                    textSpan.style.color = '#991B1B';
                                    textSpan.style.textDecoration = 'line-through';
                                }
                            }
                        };
                    }
                }

                wrap.__saveTeacherCfg = function (doneCb) {
                    saveVisibleFields();
                    if (needsInitialPass) {
                        if (!setupPass1 || setupPass1.length < 4 || setupPass1 !== setupPass2) {
                            setupErrMsg = t('pedagogy.infPassMismatch');
                            draw();
                            return false;
                        }
                        setupErrMsg = '';
                        pendingNewPass = setupPass1;
                        global.Win11Assessment.setActivePasswordInRam(setupPass1);
                    }
                    if (passMismatchMsg) {
                        activeTab = 'security';
                        draw();
                        return false;
                    }
                    var fnChk = validateFilenamePattern(cfg.filename_template);
                    if (!fnChk.ok) {
                        activeTab = 'report';
                        draw();
                        return false;
                    }
                    global.Win11Assessment.saveConfig(cfg);
                    if (cfg.ui_language_default && global.Win11I18N && global.Win11I18N.getLang() !== cfg.ui_language_default) {
                        global.Win11I18N.setLanguage(cfg.ui_language_default);
                    }
                    if (global.Win11HUD) global.Win11HUD.refresh();
                    isDirty = false;
                    var pwd = pendingNewPass || global.Win11Assessment.getActivePasswordInRam();
                    if (pwd) {
                        global.Win11Assessment.saveSidecarToHost(pwd, function (res) {
                            if (res && res.savedToHost) {
                                if (global.Win11Dialogs && typeof global.Win11Dialogs.showToast === 'function') {
                                    global.Win11Dialogs.showToast('تم حفظ ملف الإعدادات المشفر (inf.dll) بنجاح بجانب البرنامج.');
                                }
                            } else if (res && !res.savedToHost && res.bytes) {
                                triggerBinaryDownload(res.bytes, 'inf.dll');
                            }
                            if (typeof doneCb === 'function') doneCb();
                        });
                    } else if (typeof doneCb === 'function') {
                        doneCb();
                    }
                    return true;
                };
                draw();
            },
            onClose: function () {
                if (typeof opts.onDone === 'function') {
                    setTimeout(function () { opts.onDone(); }, 40);
                } else if (global.Win11Assessment && global.Win11Assessment.getStudent && !global.Win11Assessment.getStudent().activeSession) {
                    if (global.Win11Report && typeof global.Win11Report.openStudentRegistration === 'function') {
                        setTimeout(function () {
                            if (!global.Win11Dialogs.isOpen() && !global.Win11Assessment.getStudent().activeSession) {
                                global.Win11Report.openStudentRegistration({ mandatory: true });
                            }
                        }, 40);
                    }
                }
            },
            buttons: [
                {
                    id: 'tc-save-btn',
                    label: t('app.save'),
                    primary: true,
                    onClick: function (closeDlg) {
                        var body = document.querySelector('#dialog-backdrop .win-dialog-body');
                        if (body && typeof body.__saveTeacherCfg === 'function') {
                            body.__saveTeacherCfg(function () { closeDlg(true); });
                            return true;
                        }
                        closeDlg(true);
                    }
                },
                { label: t('app.close'), primary: false, value: false }
            ]
        });
    }

    global.Win11Teacher = {
        openAuth: openAuth,
        openPanel: openTeacherPanel,
        validateFilenamePattern: validateFilenamePattern
    };
})(window);
