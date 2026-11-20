/**
 * Algerian 1AS Evaluation Certificate, Token Filename Builder & Offline Report Exporters
 */
(function (global) {
    'use strict';

    var issuedExportCounts = {};
    var hasExportedPdfFlag = false;
    var exportToastTimer = null;

    function dismissExportSuccessToast() {
        if (exportToastTimer) {
            clearTimeout(exportToastTimer);
            exportToastTimer = null;
        }
        var old = document.getElementById('export-success-toast');
        if (old && old.parentNode) {
            old.parentNode.removeChild(old);
        }
    }

    function showExportSuccessToast(filename, desktopPath) {
        dismissExportSuccessToast();
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var esc = global.Win11Compat ? global.Win11Compat.escapeHtml : function (s) { return s; };

        var toast = document.createElement('div');
        toast.id = 'export-success-toast';
        toast.className = 'export-success-toast';
        toast.setAttribute('role', 'alert');

        var pathAttr = desktopPath ? (' data-folder-path="' + esc(desktopPath) + '"') : '';
        var locMsg = desktopPath ? 'تم حفظ تقرير PDF الرسمي على سطح المكتب باسم:' : 'تم استخراج وحفظ تقرير PDF الرسمي باسم:';

        toast.innerHTML =
            '<span class="export-toast-icon">✓</span>' +
            '<div class="export-toast-body">' +
                '<span>' + bidi(locMsg) + ' </span>' +
                '<bdi dir="ltr" class="export-toast-filename">' + esc(filename) + '</bdi>' +
            '</div>' +
            '<button type="button" class="win-btn win-btn-accent export-toast-open-btn" id="export-toast-open-file"' + pathAttr + '>' + bidi('فتح الملف') + '</button>' +
            (desktopPath ? ('<button type="button" class="win-btn win-btn-secondary export-toast-open-btn" id="export-toast-open-folder"' + pathAttr + '>' + bidi('فتح المجلد') + '</button>') : '') +
            '<button type="button" class="export-toast-close" aria-label="Close">&times;</button>';

        var openFileBtn = toast.querySelector('#export-toast-open-file');
        if (openFileBtn) {
            openFileBtn.onclick = function () {
                var targetPath = openFileBtn.getAttribute('data-folder-path') || '';
                if (targetPath) {
                    if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                        global.fetch('/api/open-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: targetPath })
                        }).catch(function () {});
                    } else if (global.external && typeof global.external.OpenFile === 'function') {
                        try { global.external.OpenFile(targetPath); } catch (e) {}
                    }
                } else {
                    window.print();
                }
            };
        }

        var openBtn = toast.querySelector('#export-toast-open-folder');
        if (openBtn) {
            openBtn.onclick = function () {
                var targetPath = openBtn.getAttribute('data-folder-path') || '';
                if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                    global.fetch('/api/open-folder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: targetPath })
                    }).catch(function () {});
                } else if (global.external && typeof global.external.OpenFolder === 'function') {
                    try { global.external.OpenFolder(targetPath); } catch (e) {}
                }
            };
        }

        var closeBtn = toast.querySelector('.export-toast-close');
        if (closeBtn) {
            closeBtn.onclick = dismissExportSuccessToast;
        }

        document.body.appendChild(toast);
        exportToastTimer = setTimeout(dismissExportSuccessToast, 12000);
    }

    function showExportSuccessDialog(filename, desktopPath) {
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var esc = global.Win11Compat ? global.Win11Compat.escapeHtml : function (s) { return s; };

        var scores = global.Win11Assessment ? global.Win11Assessment.getScores() : { net: 0 };
        var currentScore = (scores && scores.finalScore !== undefined) ? scores.finalScore : (scores ? scores.net : 0);
        var scoreStr = Number(currentScore || 0).toFixed(2);

        var allTasks = (global.Win11Assessment && typeof global.Win11Assessment.getTasks === 'function')
            ? global.Win11Assessment.getTasks().filter(function (tk) { return tk.enabled !== false; })
            : [];
        var uncompletedTasks = allTasks.filter(function (tk) { return !tk.completed; });
        var isAllDone = (allTasks.length > 0 && uncompletedTasks.length === 0);

        var statusNoteHtml = '';
        if (isAllDone) {
            statusNoteHtml =
                '<div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:8px 12px;font-size:12px;color:#065F46;text-align:right;line-height:1.5;">' +
                    '✔ <strong>' + bidi('تهانينا! تم إنجاز كافة المهام بنجاح (100%) وتثبيت وقت إنجازك النهائي.') + '</strong>' +
                '</div>';
        } else {
            var doneCount = allTasks.length - uncompletedTasks.length;
            statusNoteHtml =
                '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:8px 12px;font-size:12px;color:#92400E;text-align:right;line-height:1.5;">' +
                    '💡 <strong>' + bidi('تنبيه بيداغوجي:') + '</strong> ' +
                    bidi('تم استيفاء ') + '<strong dir="ltr">' + doneCount + '</strong>' + bidi(' من أصل ') + '<strong dir="ltr">' + allTasks.length + '</strong>' + bidi(' مهام. تم حفظ هذا التقرير كمعاينة مرحلية؛ يمكنك الضغط على «مواصلة المحاكاة» لإتمام ما تبقى ورفع علامتك المستحقة.') +
                '</div>';
        }

        var mainMsg = desktopPath
            ? bidi('تم حفظ بطاقة تقويم الأعمال التطبيقية بنجاح كملف PDF رسمي غير قابل للتعديل على سطح المكتب.')
            : bidi('تم استخراج وحفظ بطاقة تقويم الأعمال التطبيقية بنجاح.');

        var dlgButtons = [
            {
                id: 'btn-open-file-direct',
                label: 'فتح الملف',
                primary: true,
                onClick: function (closeDlg) {
                    var targetPath = desktopPath || '';
                    if (targetPath) {
                        if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                            global.fetch('/api/open-file', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: targetPath })
                            }).catch(function () {});
                        } else if (global.external && typeof global.external.OpenFile === 'function') {
                            try { global.external.OpenFile(targetPath); } catch (e) {}
                        }
                    } else {
                        var pBlob = generateReportPdfBlob(); if (pBlob) { downloadPdfFile(filename, pBlob); } else { window.print(); }
                    }
                    closeDlg(true);
                }
            },
            {
                id: 'btn-open-folder-direct',
                label: 'فتح مكان الملف',
                primary: false,
                onClick: function (closeDlg) {
                    var targetPath = desktopPath || '';
                    if (targetPath) {
                        if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                            global.fetch('/api/open-folder', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: targetPath })
                            }).catch(function () {});
                        } else if (global.external && typeof global.external.OpenFolder === 'function') {
                            try { global.external.OpenFolder(targetPath); } catch (e) {}
                        }
                    }
                    closeDlg(true);
                }
            },
            {
                id: 'btn-print-direct',
                label: 'طباعة',
                primary: false,
                onClick: function (closeDlg) {
                    var printEl = document.getElementById('print-report-container');
                    if (printEl) printEl.innerHTML = buildA4Html();
                    var prevTitle = document.title;
                    document.title = (filename || '1AS_Report').replace(/\.pdf$/i, '');
                    setTimeout(function () {
                        window.print();
                        setTimeout(function () { document.title = prevTitle; }, 3000);
                    }, 150);
                    closeDlg(true);
                }
            },
            {
                id: 'btn-resume-sim-dlg',
                label: 'مواصلة المحاكاة',
                primary: false,
                value: false
            }
        ];

        global.Win11Dialogs.showCustom({
            title: 'تأكيد استخراج وحفظ بطاقة التقييم',
            tone: 'info',
            wide: false,
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:12px;text-align:center;padding:4px 0">' +
                        '<div style="font-size:38px;color:#107C41;line-height:1">✓</div>' +
                        '<div style="font-size:14.5px;font-weight:700;color:var(--win-text-primary)">' +
                            mainMsg +
                        '</div>' +
                        '<div style="background:var(--win-surface-subtle);border:1px solid var(--win-border-control);border-radius:8px;padding:10px 14px;text-align:right">' +
                            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                                '<span style="font-size:12px;color:var(--win-text-secondary);">' + bidi('العلامة الحالية:') + '</span>' +
                                '<span style="font-size:15px;font-weight:800;color:#15803D;" dir="ltr">' + scoreStr + ' / 20.00</span>' +
                            '</div>' +
                            '<div style="font-size:11px;color:var(--win-text-secondary);margin-bottom:3px;">' + bidi('اسم الملف على سطح المكتب:') + '</div>' +
                            '<div id="export-success-filename" style="font-family:Consolas,monospace;font-size:12px;font-weight:700;color:#0F172A;word-break:break-all;user-select:all;direction:ltr;text-align:left;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:4px;padding:4px 8px;">' +
                                esc(filename) +
                            '</div>' +
                        '</div>' +
                        statusNoteHtml +
                    '</div>';
            },
            buttons: dlgButtons
        });
    }

    function showExportErrorDialog(errorMessage) {
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var msg = errorMessage || 'فشل حفظ الملف. يرجى التحقق من صلاحيات الكتابة على سطح المكتب أو إعدادات المتصفح.';
        if (global.Win11Dialogs && typeof global.Win11Dialogs.showAlert === 'function') {
            global.Win11Dialogs.showAlert(bidi('خطأ في استخراج التقرير'), bidi(msg), 'error');
        } else {
            alert(msg);
        }
    }

    function saveReportToDesktop(filename, onComplete, opts) {
        opts = opts || {};
        var htmlContent = buildStandaloneHtmlDoc();
        var cleanName = normalizeExportFilename(filename, 'pdf', formatSuggestedFilename('pdf'));

        function handleSuccess(finalName, finalPath) {
            hasExportedPdfFlag = true;
            showExportSuccessToast(finalName, finalPath);
            if (!opts.skipDialog) {
                showExportSuccessDialog(finalName, finalPath);
            }
            if (onComplete) onComplete(null, { ok: true, filename: finalName, path: finalPath, format: 'pdf' });
        }

        function handleFailure(errText) {
            showExportErrorDialog(errText);
            if (onComplete) onComplete(new Error(errText));
        }

        function triggerBrowserPrintFallback() {
            try {
                var printEl = document.getElementById('print-report-container');
                if (printEl) {
                    printEl.innerHTML = buildA4Html();
                }
                hasExportedPdfFlag = true;

                // STRICT GUARANTEE: NEVER DOWNLOAD HTML! ALWAYS DOWNLOAD PDF!
                var pdfBlob = generateReportPdfBlob();
                if (pdfBlob) {
                    var finalPdfName = cleanName.replace(/\.(html?|txt)$/i, '') + '.pdf';
                    downloadPdfFile(finalPdfName, pdfBlob);
                    handleSuccess(finalPdfName, null);
                } else {
                    // Fallback to window print if canvas completely blocked
                    var prevTitle = document.title;
                    document.title = cleanName.replace(/\.(pdf|html?)$/i, '');
                    setTimeout(function () {
                        window.print();
                        setTimeout(function () { document.title = prevTitle; }, 3000);
                        handleSuccess(cleanName, null);
                    }, 150);
                }
            } catch (pErr) {
                handleFailure('تعذر تصدير ملف التقرير: ' + (pErr && pErr.message ? pErr.message : pErr));
            }
        }

        // 1. Host TCP server loopback (/api/save-to-desktop)
        if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
            var b64 = '';
            try {
                b64 = global.btoa(unescape(encodeURIComponent(htmlContent)));
            } catch (e) {
                b64 = '';
            }

            global.fetch('/api/save-to-desktop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({
                    filename: cleanName,
                    base64: b64,
                    html: htmlContent
                })
            }).then(function (r) {
                if (!r.ok) {
                    throw new Error('Server returned HTTP ' + r.status);
                }
                return r.json();
            }).then(function (data) {
                if (data && data.ok && data.path) {
                    handleSuccess(data.filename || cleanName, data.path);
                } else {
                    triggerBrowserPrintFallback();
                }
            }).catch(function (fetchErr) {
                triggerBrowserPrintFallback();
            });
            return;
        }

        // 2. Embedded WebBrowser COM ObjectForScripting (NativeSimulatorBridge)
        if (global.external && typeof global.external.SaveToDesktop === 'function') {
            try {
                var b64COM = global.btoa(unescape(encodeURIComponent(htmlContent)));
                var savedPath = global.external.SaveToDesktop(cleanName, b64COM);
                if (savedPath && savedPath.indexOf('ERROR:') !== 0) {
                    var finalName = savedPath.replace(/^.*[\\\/]/, '');
                    handleSuccess(finalName, savedPath);
                    return;
                }
            } catch (ex) {}
            triggerBrowserPrintFallback();
            return;
        }

        // 3. Fallback: Browser print to PDF
        triggerBrowserPrintFallback();
    }

    function injectPlainStudentFormFallback(opts) {
        opts = opts || {};
        var existing = document.getElementById('plain-student-fallback-form');
        if (existing) return;
        var stu = global.Win11Assessment ? global.Win11Assessment.getStudent() : null;
        if (!opts.force && stu && stu.activeSession) return;

        var cfg = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : {};
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var esc = global.Win11Compat ? global.Win11Compat.escapeHtml : function (s) { return s; };

        var groups = cfg.class_groups || ['1AS-1', '1AS-2', '1AS-3', '1AS-4', '1AS-5'];
        var grpOpts = '';
        for (var i = 0; i < groups.length; i++) {
            grpOpts += '<option value="' + esc(groups[i]) + '">' + esc(groups[i]) + '</option>';
        }

        var devList = (cfg.device_numbers && cfg.device_numbers.length > 0) ? cfg.device_numbers : ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20'];
        var devOpts = '';
        for (var d = 0; d < devList.length; d++) {
            devOpts += '<option value="' + esc(devList[d]) + '">' + esc(devList[d]) + '</option>';
        }

        var wrap = document.createElement('div');
        wrap.id = 'plain-student-fallback-form';
        wrap.setAttribute('dir', 'rtl');
        wrap.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(15,23,42,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Segoe UI,Tahoma,sans-serif;color:#1e293b;padding:16px;box-sizing:border-box;';

        wrap.innerHTML =
            '<div style="background:#ffffff;border-radius:12px;padding:24px 28px;max-width:520px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.4);border:1px solid #cbd5e1">' +
                '<div style="text-align:center;margin-bottom:16px;border-bottom:2px solid #0067C0;padding-bottom:12px">' +
                    '<h2 style="margin:0 0 4px;font-size:18px;color:#0067C0">' + bidi('تسجيل بيانات التلميذ — لوحة التحكم 1AS') + '</h2>' +
                    '<p style="margin:0;font-size:12.5px;color:#64748b">' + bidi('يرجى إدخال اسمك ولقبك وفوجك للبدء في إنجاز الأنشطة التطبيقية') + '</p>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
                    '<div>' +
                        '<label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:4px">' + bidi('اللقب (Nom):') + '</label>' +
                        '<input type="text" id="fallback-stu-ln" class="win-input" style="width:100%;box-sizing:border-box;padding:7px 10px;font-size:13px;border:1px solid #94a3b8;border-radius:6px" placeholder="مثال: بن علي">' +
                    '</div>' +
                    '<div>' +
                        '<label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:4px">' + bidi('الاسم (Prénom):') + '</label>' +
                        '<input type="text" id="fallback-stu-fn" class="win-input" style="width:100%;box-sizing:border-box;padding:7px 10px;font-size:13px;border:1px solid #94a3b8;border-radius:6px" placeholder="مثال: أمين">' +
                    '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:14px">' +
                    '<div>' +
                        '<label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:4px">' + bidi('الفوج التربوي:') + '</label>' +
                        '<select id="fallback-stu-grp" style="width:100%;box-sizing:border-box;padding:7px 10px;font-size:13px;border:1px solid #94a3b8;border-radius:6px">' + grpOpts + '</select>' +
                    '</div>' +
                    '<div>' +
                        '<label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:4px">' + bidi('رقم الحاسوب:') + '</label>' +
                        '<select id="fallback-stu-pc" dir="ltr" style="width:100%;box-sizing:border-box;padding:7px 10px;font-size:13px;border:1px solid #94a3b8;border-radius:6px">' + devOpts + '</select>' +
                    '</div>' +
                '</div>' +
                '<div style="margin-bottom:14px">' +
                    '<label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:4px">' + bidi('نمط الجلسة:') + '</label>' +
                    '<div style="display:flex;gap:16px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
                        '<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">' +
                            '<input type="radio" name="fallback-stu-mode" value="training" checked> ' + bidi('استطلاع وتدريب') +
                        '</label>' +
                        '<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">' +
                            '<input type="radio" name="fallback-stu-mode" value="exam"> ' + bidi('امتحان رسمي (تقييمي)') +
                        '</label>' +
                    '</div>' +
                '</div>' +
                '<div style="margin-bottom:14px">' +
                    '<label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:4px">' + bidi('التقويم البيداغوجي:') + '</label>' +
                    '<div style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
                        '<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">' +
                            '<input type="checkbox" id="fallback-stu-quiz" checked> ' +
                            '<span style="font-weight:500;">' + bidi('تفعيل الأسئلة التقويمية المرحلية (كفاءات لوحة التحكم)') + '</span>' +
                        '</label>' +
                        '<div style="font-size:11px;color:#64748b;margin-top:4px;">' +
                            bidi('* ملاحظة: تعطيل الأسئلة يخصم نقاطها من العلامة القصوى (لا يمكن نيل 20/20 دون الإجابة على الأسئلة).') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="fallback-stu-err" style="color:#dc2626;font-size:12px;min-height:18px;margin-bottom:12px"></div>' +
                '<button type="button" id="fallback-stu-submit" class="win-btn win-btn-accent" style="width:100%;padding:10px;font-size:14px;font-weight:700;border-radius:6px;background:#0067C0;color:#fff;border:none;cursor:pointer">' +
                    bidi('بدء الجلسة والمحاكاة') +
                '</button>' +
            '</div>';

        document.body.appendChild(wrap);

        var submitBtn = wrap.querySelector('#fallback-stu-submit');
        var lnInp = wrap.querySelector('#fallback-stu-ln');
        var fnInp = wrap.querySelector('#fallback-stu-fn');
        var grpSel = wrap.querySelector('#fallback-stu-grp');
        var pcSel = wrap.querySelector('#fallback-stu-pc');
        var errBox = wrap.querySelector('#fallback-stu-err');

        submitBtn.onclick = function () {
            var ln = lnInp ? lnInp.value.trim() : '';
            var fn = fnInp ? fnInp.value.trim() : '';
            if (ln.length < 2 || fn.length < 2 || !/[A-Za-z\u0600-\u06FF]/.test(ln + fn)) {
                if (errBox) errBox.textContent = 'يرجى إدخال لقب واسم صالحين (حرفان على الأقل).';
                return;
            }
            var modeRadio = wrap.querySelector('input[name="fallback-stu-mode"]:checked');
            var chosenMode = modeRadio ? modeRadio.value : 'training';
            var quizChk = wrap.querySelector('#fallback-stu-quiz');
            var isQuizOptIn = quizChk ? quizChk.checked : true;

            if (global.Win11Assessment && typeof global.Win11Assessment.startSession === 'function') {
                global.Win11Assessment.startSession({
                    lastName: ln,
                    firstName: fn,
                    fullName: ln + ' ' + fn,
                    classGroup: grpSel ? grpSel.value : (groups[0] || '1AS-1'),
                    pcNumber: pcSel ? pcSel.value : '01',
                    mode: chosenMode,
                    quizOptIn: isQuizOptIn
                });
            }
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            if (global.Win11HUD && typeof global.Win11HUD.open === 'function') {
                global.Win11HUD.open();
            }
        };
    }

    var SECTION_LABELS_AR = {
        home: 'الصفحة الرئيسية',
        system: 'النظام والعرض',
        devices: 'الأجهزة والفأرة',
        network: 'الشبكة والإنترنت',
        personalization: 'التخصيص والمظهر',
        apps: 'التطبيقات والبرامج',
        accounts: 'الحسابات والأمان',
        timeLanguage: 'الوقت واللغة',
        gaming: 'الألعاب',
        accessibility: 'إمكانية الوصول',
        privacy: 'الخصوصية والأمان',
        update: 'تحديثات Windows'
    };

    var ARABIC_ASCII_MAP = {
        'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ى': 'a', 'ء': '',
        'ب': 'b', 'ت': 't', 'ة': 't', 'ث': 'th',
        'ج': 'j', 'ح': 'h', 'خ': 'kh',
        'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
        'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
        'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
        'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
        'م': 'm', 'ن': 'n', 'ه': 'h',
        'و': 'w', 'ؤ': 'w', 'ي': 'y', 'ئ': 'y',
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        'À': 'A', 'Á': 'A', 'Â': 'A', 'Ä': 'A', 'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a',
        'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Ö': 'O', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'ö': 'o',
        'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'Ç': 'C', 'ç': 'c', 'Ñ': 'N', 'ñ': 'n'
    };

    function transliterateToAscii(str) {
        var src = String(str || '');
        var out = '';
        for (var i = 0; i < src.length; i++) {
            var ch = src.charAt(i);
            if (Object.prototype.hasOwnProperty.call(ARABIC_ASCII_MAP, ch)) {
                out += ARABIC_ASCII_MAP[ch];
            } else {
                var code = src.charCodeAt(i);
                // Strip Arabic diacritics/tatweel (\u0640, \u064B-\u065F, \u0670)
                if (code === 0x0640 || (code >= 0x064B && code <= 0x065F) || code === 0x0670) {
                    continue;
                }
                out += ch;
            }
        }
        return out;
    }

    function cleanFileToken(str) {
        if (!str) return 'NA';
        var ascii = transliterateToAscii(String(str).trim());
        var cleaned = ascii
            .replace(/[^A-Za-z0-9.-]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^[_.-]+|[_.-]+$/g, '');
        return cleaned || 'NA';
    }

    function formatFilenamePreviewHtml(fname) {
        var escaped = global.Win11Compat.escapeHtml(fname);
        return '<bdi dir="ltr" style="unicode-bidi:isolate;display:inline-block">' + escaped + '</bdi>';
    }

    function splitStudentName(fullName) {
        var parts = String(fullName || 'Eleve Demo').trim().split(/\s+/);
        if (parts.length === 1) {
            return { lastname: cleanFileToken(parts[0]), firstname: '_' };
        }
        return {
            lastname: cleanFileToken(parts[0]),
            firstname: cleanFileToken(parts.slice(1).join('_'))
        };
    }

    function formatIsoDate(dt) {
        var d = dt || new Date();
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1);
        var dd = String(d.getDate());
        if (mm.length < 2) mm = '0' + mm;
        if (dd.length < 2) dd = '0' + dd;
        return yyyy + '-' + mm + '-' + dd;
    }

    function buildFilenameCore(ext) {
        var stu = global.Win11Assessment.getStudent();
        var scores = global.Win11Assessment.getScores();
        var cfg = global.Win11Assessment.getConfig();
        var tpl = (cfg && cfg.filename_template)
            ? String(cfg.filename_template)
            : 'Class_{class}_Score_{score}_Time_{time}_Student_{student_lastname}_{student_firstname}';

        var nameParts = (stu.lastName && stu.firstName)
            ? { lastname: cleanFileToken(stu.lastName), firstname: cleanFileToken(stu.firstName) }
            : splitStudentName(stu.fullName);
        var timeTok = (typeof global.Win11Assessment.formatDurationToken === 'function')
            ? global.Win11Assessment.formatDurationToken(stu.elapsedSeconds)
            : (String(stu.elapsedSeconds || 0) + 's');
        var nowDt = (global.Win11State && typeof global.Win11State.getSimulatedNow === 'function')
            ? global.Win11State.getSimulatedNow()
            : new Date();

        var tokens = {
            '{class}': cleanFileToken(stu.classGroup),
            '{score}': scores.net.toFixed(2),
            '{time}': cleanFileToken(timeTok),
            '{student_lastname}': nameParts.lastname,
            '{student_firstname}': nameParts.firstname,
            '{date}': formatIsoDate(nowDt)
        };

        var base = tpl;
        for (var tok in tokens) {
            if (Object.prototype.hasOwnProperty.call(tokens, tok)) {
                base = base.split(tok).join(tokens[tok]);
            }
        }
        base = transliterateToAscii(base)
            .replace(/[^A-Za-z0-9.-]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^[_.-]+|[_.-]+$/g, '') || '1AS_Report';
        return { base: base, ext: ext || 'pdf' };
    }

    function formatSuggestedFilename(ext) {
        var built = buildFilenameCore(ext || 'pdf');
        return built.base + '.' + built.ext;
    }

    function previewNextFilename(ext) {
        var built = buildFilenameCore(ext || 'pdf');
        var baseExt = built.base + '.' + built.ext;
        var key = baseExt.toLowerCase();
        var nextCount = (issuedExportCounts[key] || 0) + 1;
        return nextCount === 1 ? baseExt : (built.base + '_' + nextCount + '.' + built.ext);
    }

    function normalizeExportFilename(rawName, ext, fallbackName) {
        var cleanExt = String(ext || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
        var txt = String(rawName || '').trim().replace(/[\\/:*?"<>|]+/g, '_').replace(/^_+|_+$/g, '');
        if (!txt) txt = String(fallbackName || ('1AS_Report.' + cleanExt));
        var suffix = '.' + cleanExt;
        if (txt.length < suffix.length || txt.slice(-suffix.length).toLowerCase() !== suffix) {
            txt = txt.replace(/\.(pdf|html?)$/i, '') + suffix;
        }
        return txt;
    }

    function allocateUniqueFilename(ext) {
        var built = buildFilenameCore(ext || 'html');
        var key = (built.base + '.' + built.ext).toLowerCase();
        var count = (issuedExportCounts[key] || 0) + 1;
        issuedExportCounts[key] = count;
        return count === 1 ? (built.base + '.' + built.ext) : (built.base + '_' + count + '.' + built.ext);
    }

    function confirmNewSimulation() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        global.Win11Dialogs.showConfirm(
            t('pedagogy.newSimTitle'),
            t('pedagogy.newSimConfirmMsg'),
            function (ok) {
                if (!ok) return;
                hasExportedPdfFlag = false;
                if (global.Win11Assessment && typeof global.Win11Assessment.startNewSimulation === 'function') {
                    global.Win11Assessment.startNewSimulation();
                }
                if (global.Win11HUD && typeof global.Win11HUD.open === 'function') {
                    global.Win11HUD.open();
                }
            },
            'warning'
        );
    }

    function openStudentRegistration(opts) {
        opts = opts || {};
        var isMandatory = !!opts.mandatory;
        var isEditOnly = !!opts.editOnly;
        var isConfirmedNew = !!opts.confirmedNew;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var cfg = global.Win11Assessment.getConfig();
        var stu = global.Win11Assessment.getStudent();

        // Section 1: Protect active student progress from silent overwrite on "Start Evaluation Session"
        if (!isMandatory && !isEditOnly && !isConfirmedNew && stu.activeSession) {
            global.Win11Dialogs.showConfirm(
                t('pedagogy.loginBtn'),
                t('pedagogy.startNewConfirmWarn') || 'بدء جلسة جديدة سيقوم بمسح كل تقدمك الحالي. هل أنت متأكد؟',
                function (yes) {
                    if (!yes) return;
                    openStudentRegistration({ confirmedNew: true });
                },
                'warning'
            );
            return;
        }

        var submitLabel = isEditOnly ? (t('pedagogy.saveInfoBtn') || 'حفظ البيانات') : t('pedagogy.startSession');
        var btns = [
            {
                id: 'stu-reg-submit-btn',
                label: submitLabel,
                primary: true,
                onClick: function (closeDlg) {
                    var lnEl = document.getElementById('stu-reg-lastname');
                    var fnEl = document.getElementById('stu-reg-firstname');
                    var grpEl = document.getElementById('stu-reg-grp');
                    var pcEl = document.getElementById('stu-reg-pc');
                    var modeChecked = document.querySelector('input[name="stu-reg-mode"]:checked');
                    var quizEl = document.getElementById('stu-reg-quiz');
                    var isQuizOptIn = quizEl ? quizEl.checked : true;
                    var errEl = document.getElementById('stu-reg-err');

                    var ln = lnEl ? lnEl.value.trim() : '';
                    var fn = fnEl ? fnEl.value.trim() : '';
                    if (ln.length < 2 || fn.length < 2 || !/[A-Za-z\u0600-\u06FF]/.test(ln + fn)) {
                        if (errEl) errEl.innerHTML = bidi(t('pedagogy.invalidStudentFieldsMsg'));
                        return true;
                    }
                    if (isEditOnly) {
                        if (typeof global.Win11Assessment.updateStudentInfo === 'function') {
                            global.Win11Assessment.updateStudentInfo({
                                lastName: ln,
                                firstName: fn,
                                fullName: ln + ' ' + fn,
                                classGroup: grpEl ? grpEl.value : '',
                                pcNumber: pcEl ? pcEl.value : '01',
                                quizOptIn: isQuizOptIn
                            });
                        }
                        closeDlg(true);
                        if (global.Win11HUD) global.Win11HUD.open();
                        return;
                    }
                    if (isConfirmedNew) {
                        hasExportedPdfFlag = false;
                        if (typeof global.Win11Assessment.startNewSimulation === 'function') {
                            global.Win11Assessment.startNewSimulation();
                        }
                    } else if (!stu.activeSession) {
                        hasExportedPdfFlag = false;
                    }
                    global.Win11Assessment.startSession({
                        lastName: ln,
                        firstName: fn,
                        fullName: ln + ' ' + fn,
                        classGroup: grpEl ? grpEl.value : '',
                        pcNumber: pcEl ? pcEl.value : '01',
                        mode: modeChecked ? modeChecked.value : (cfg.mode || 'training'),
                        quizOptIn: isQuizOptIn
                    });
                    closeDlg(true);
                    if (global.Win11HUD) global.Win11HUD.open();
                }
            }
        ];
        if (!isMandatory) {
            btns.push({ label: t('app.cancel'), primary: false, value: false });
        }

        global.Win11Dialogs.showCustom({
            title: isEditOnly ? (t('pedagogy.editInfoHeader') || 'تعديل بيانات التلميذ') : t('pedagogy.loginHeader'),
            tone: 'info',
            persistent: isMandatory,
            renderBody: function (wrap) {
                var grpOpts = '';
                var groups = cfg.class_groups || [];
                for (var i = 0; i < groups.length; i++) {
                    var sel = (groups[i] === stu.classGroup) ? ' selected' : '';
                    grpOpts += '<option value="' + global.Win11Compat.escapeHtml(groups[i]) + '"' + sel + '>' + global.Win11Compat.escapeHtml(groups[i]) + '</option>';
                }
                var devList = (cfg.device_numbers && cfg.device_numbers.length > 0) ? cfg.device_numbers : ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20'];
                var curDev = String(stu.pcNumber || cfg.default_device || devList[0]).replace(/^0+/, '') || '1';
                var devOpts = '';
                for (var dIdx = 0; dIdx < devList.length; dIdx++) {
                    var dv = String(devList[dIdx]);
                    var dvNorm = dv.replace(/^0+/, '') || '1';
                    var dSel = (dvNorm === curDev || dv === String(cfg.default_device)) ? ' selected' : '';
                    devOpts += '<option value="' + global.Win11Compat.escapeHtml(dv) + '"' + dSel + '>' + global.Win11Compat.escapeHtml(dv) + '</option>';
                }
                var defaultMode = stu.activeSession && stu.mode ? stu.mode : (cfg.mode || 'training');
                var initLn = (stu.activeSession && stu.lastName) ? stu.lastName : '';
                var initFn = (stu.activeSession && stu.firstName) ? stu.firstName : '';
                var lockModeAttr = (isEditOnly && stu.activeSession) ? ' disabled' : '';
                var lockQuizAttr = (isEditOnly && stu.activeSession) ? ' disabled' : '';
                var lockQuizNote = (isEditOnly && stu.activeSession) ? ('<div style="font-size:11px;color:var(--win-text-secondary);margin-top:4px;">' + bidi('لا يمكن تعديل خيار الأسئلة التقويمية أثناء الجلسة النشطة.') + '</div>') : '';
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:10px">' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.lastNameLabel')) + '</label>' +
                                '<input type="text" id="stu-reg-lastname" class="win-input" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.lastNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(initLn) + '" autocomplete="off" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                            '</div>' +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.firstNameLabel')) + '</label>' +
                                '<input type="text" id="stu-reg-firstname" class="win-input" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.firstNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(initFn) + '" autocomplete="off" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                            '</div>' +
                        '</div>' +
                        '<div style="display:grid;grid-template-columns:2fr 1fr;gap:10px">' +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.groupLabel')) + '</label>' +
                                '<select id="stu-reg-grp" class="win-select">' + grpOpts + '</select>' +
                            '</div>' +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.pcLabel')) + '</label>' +
                                '<select id="stu-reg-pc" class="win-select" dir="ltr">' + devOpts + '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div style="font-weight:600;margin-bottom:6px">' + bidi(t('pedagogy.modeLabel')) + '</div>' +
                            '<div style="display:flex;flex-direction:column;gap:6px;padding:8px 10px;border:1px solid var(--win-border-control);border-radius:6px;background:var(--win-surface-subtle)">' +
                                '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
                                    '<input type="radio" name="stu-reg-mode" id="stu-mode-training" value="training"' + (defaultMode !== 'exam' ? ' checked' : '') + lockModeAttr + '>' +
                                    '<span>' + bidi(t('pedagogy.modeTrainingRadio')) + '</span>' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
                                    '<input type="radio" name="stu-reg-mode" id="stu-mode-exam" value="exam"' + (defaultMode === 'exam' ? ' checked' : '') + lockModeAttr + '>' +
                                    '<span>' + bidi(t('pedagogy.modeExamRadio')) + '</span>' +
                                '</label>' +
                                (lockModeAttr ? ('<div style="font-size:11.5px;color:var(--win-text-secondary)">' + bidi(t('pedagogy.modeLockedEditNote')) + '</div>') : '') +
                            '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div style="font-weight:600;margin-bottom:6px">' + bidi('التقويم البيداغوجي (الأسئلة):') + '</div>' +
                            '<div style="padding:8px 10px;border:1px solid var(--win-border-control);border-radius:6px;background:var(--win-surface-subtle)">' +
                                '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
                                    '<input type="checkbox" id="stu-reg-quiz"' + (stu.quizOptIn !== false ? ' checked' : '') + lockQuizAttr + '>' +
                                    '<span style="font-size:13px;font-weight:600;">' + bidi('تفعيل الأسئلة التقويمية المرحلية (كفاءات لوحة التحكم)') + '</span>' +
                                '</label>' +
                                '<div style="font-size:11.5px;color:var(--win-text-secondary);margin-top:4px;line-height:1.4;">' +
                                    bidi('* ملاحظة هامة: تعطيل الأسئلة التقويمية سيؤدي إلى خصم نقاطها من المجموع الأقصى للعلامة ولن تتمكن من نيل العلامة الكاملة (20/20).') +
                                '</div>' +
                                lockQuizNote +
                            '</div>' +
                        '</div>' +
                        '<div id="stu-reg-err" style="color:var(--win-danger);font-size:12px;min-height:16px"></div>' +
                    '</div>';
            },
            buttons: btns
        });
    }

    function formatArabicDate(dt) {
        var d = dt || (global.Win11State && typeof global.Win11State.getSimulatedNow === 'function' ? global.Win11State.getSimulatedNow() : new Date());
        var yyyy = d.getFullYear();
        var mm = d.getMonth();
        var dd = d.getDate();
        var hh = d.getHours();
        var min = d.getMinutes();
        var monthsAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
        return dd + ' ' + (monthsAr[mm] || (mm + 1)) + ' ' + yyyy + ' — ' + pad(hh) + ':' + pad(min);
    }

    function formatArabicDuration(secs) {
        var s = Math.max(0, Math.floor(Number(secs) || 0));
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var rem = s % 60;
        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
        return pad(h) + ':' + pad(m) + ':' + pad(rem);
    }

    function buildA4Html() {
        var bidi = global.Win11I18N.bidiHtml;
        var esc = global.Win11Compat.escapeHtml;
        var cfg = global.Win11Assessment.getConfig();
        var stu = global.Win11Assessment.getStudent();
        var scores = global.Win11Assessment.getScores();
        var tasks = global.Win11Assessment.getTasks();

        var enabledTasks = [];
        var doneTasksCount = 0;
        var practicalMaxPoints = 0;
        var practicalEarnedPoints = 0;

        for (var t = 0; t < tasks.length; t++) {
            if (tasks[t].enabled !== false) {
                enabledTasks.push(tasks[t]);
                var tMax = Math.floor(Math.max(1, Number(tasks[t].coefficient) || Number(tasks[t].maxPoints) || 1));
                tasks[t].coefficient = tMax;
                tasks[t].maxPoints = tMax;
                practicalMaxPoints += tMax;
                practicalEarnedPoints += Math.min(tMax, Math.max(0, Number(tasks[t].earnedPoints) || 0));
                if (tasks[t].completed) doneTasksCount++;
            }
        }

        var completionPct = enabledTasks.length > 0 ? Math.round((doneTasksCount / enabledTasks.length) * 100) : 0;
        var effectiveSec = (stu.allCompleted && stu.completionElapsedSeconds !== null && stu.completionElapsedSeconds !== undefined)
            ? stu.completionElapsedSeconds
            : (stu.elapsedSeconds || 0);
        var totalDurationStr = formatArabicDuration(effectiveSec);
        var dateFormatted = formatArabicDate();
        var isExam = (stu.mode === 'exam');
        var sessionLabel = isExam ? 'امتحان رسمي (تقييمي)' : 'نشاط تطبيقي تدريبي (استطلاع وتدريب)';
        var isPassed = (scores.passed !== false);
        var finalScoreNum = (scores.finalScore !== undefined ? scores.finalScore : scores.net);
        var finalScoreStr = Number(finalScoreNum || 0).toFixed(2);

        var isQuizGloballyDisabled = (cfg.quiz_enabled === false);
        var isQuizOptedOut = (stu.quizOptIn === false);
        var showQuizzes = !isQuizGloballyDisabled;

        // Weights & Rule of Three calculation values
        var practicalMax = Number(scores.practicalMax || practicalMaxPoints || 0);
        var practicalEarned = Number(scores.practicalEarned !== undefined ? scores.practicalEarned : practicalEarnedPoints);
        var quizMax = Number(scores.quizMax !== undefined ? scores.quizMax : 0);
        var quizEarned = Number(scores.quizEarned !== undefined ? scores.quizEarned : 0);
        var grandTotalMax = Number(scores.grandTotalMax || (practicalMax + (showQuizzes ? quizMax : 0)));
        var grandTotalEarned = Number(scores.grandTotalEarned !== undefined ? scores.grandTotalEarned : (practicalEarned + (showQuizzes ? quizEarned : 0)));
        var baseScoreOutOf20 = Number(scores.baseScore !== undefined ? scores.baseScore : (grandTotalMax > 0 ? ((grandTotalEarned / grandTotalMax) * 20) : 0));
        var pen = Number(scores.penalties || 0);

        // Calculate max possible practical score when quiz is disabled or opted out
        var maxPossibleScore = 20.0;
        if (isQuizOptedOut && grandTotalMax > 0) {
            maxPossibleScore = Number(((practicalMax / grandTotalMax) * 20).toFixed(2));
        } else {
            maxPossibleScore = 20.0;
        }

        // ==========================================
        // SECTION B: DETAILED BREAKDOWN TABLE ROWS
        // Columns:
        // [# | Task/Question Name | Type | Status | Attempts | Max Weight/Points | Points Earned | Deduction | Notes]
        // ==========================================
        var rowsHtml = '';
        var totalDeductionsInTable = 0;

        for (var i = 0; i < enabledTasks.length; i++) {
            var tk = enabledTasks[i];
            var isDone = !!tk.completed;
            var isSkip = !!tk.skipped;
            var isPart = (!isDone && !isSkip && (Number(tk.earnedPoints) > 0));

            var badgeCls = isDone ? 'is-done' : (isPart ? 'is-partial' : (isSkip ? 'is-skipped' : 'is-fail'));
            var badgeText = isDone ? 'مكتملة ✔' : (isPart ? 'منجزة جزئياً ◐' : (isSkip ? 'تم تخطيها ⏭' : 'غير منجزة ✘'));

            var tkMax = Number(tk.maxPoints || tk.coefficient || 1);
            var tkEarned = Number(tk.earnedPoints || 0);
            var tkDeduct = Number((tkMax - tkEarned).toFixed(2));
            if (tkDeduct > 0) totalDeductionsInTable += tkDeduct;

            var reasonTxt = '';
            if (isDone) {
                reasonTxt = 'تم إنجاز كافة خطوات المهمة بنجاح.';
            } else if (isSkip) {
                reasonTxt = 'تم تخطي المهمة من قبل التلميذ.';
            } else if (tk.deductReasons && tk.deductReasons.length > 0) {
                reasonTxt = tk.deductReasons.join('؛ ');
            } else {
                reasonTxt = 'لم يتم استيفاء الخطوات العملية المطلوبة.';
            }

            // Practical Task Row
            rowsHtml +=
                '<tr>' +
                    '<td style="text-align:center;font-weight:700;color:#64748B;">' + (i + 1) + '</td>' +
                    '<td><strong>' + bidi(tk.titleAr) + '</strong>' + (tk.critical ? ' <span class="a4-crit-badge">(أساسية)</span>' : '') + '</td>' +
                    '<td style="text-align:center;"><span class="a4-type-badge is-task">مهمة عملية</span></td>' +
                    '<td style="text-align:center;"><span class="a4-badge ' + badgeCls + '">' + bidi(badgeText) + '</span></td>' +
                    '<td style="text-align:center;">' + (isDone ? '<bdi dir="ltr">1</bdi>' : '-') + '</td>' +
                    '<td style="text-align:center;font-weight:600;"><bdi dir="ltr">' + tkMax.toFixed(2) + '</bdi></td>' +
                    '<td style="text-align:center;font-weight:700;color:#1E3A8A;"><bdi dir="ltr">' + tkEarned.toFixed(2) + '</bdi></td>' +
                    '<td style="text-align:center;' + (tkDeduct > 0 ? 'color:#DC2626;font-weight:700;' : 'color:#64748B;') + '">' +
                        (tkDeduct > 0 ? ('<bdi dir="ltr">-' + tkDeduct.toFixed(2) + '</bdi>') : '<bdi dir="ltr">0.00</bdi>') +
                    '</td>' +
                    '<td style="font-size:11px;color:#334155;">' + bidi(reasonTxt) + '</td>' +
                '</tr>';

            // Quiz Row (only if quizzes active and not disabled for this task)
            var isTaskQuizDisabled = Array.isArray(cfg.quiz_disabled_tasks) && cfg.quiz_disabled_tasks.indexOf(tk.id) !== -1;
            if (showQuizzes && !isTaskQuizDisabled) {
                var qRes = tk.quizResult;
                var qMax = Number(qRes && qRes.maxPoints ? qRes.maxPoints : 1.0);
                var qEarned = Number(qRes && typeof qRes.earnedPoints === 'number' ? qRes.earnedPoints : 0);
                var qAttempts = (qRes && qRes.attempts) ? qRes.attempts : (isDone ? 1 : 0);
                var qDeduct = Number((qMax - qEarned).toFixed(2));

                var qStatusCls = '';
                var qStatusText = '';
                var qNameText = '';
                var qAttemptsLabel = '';
                var qEarnedDisplay = '';
                var qNotes = '';

                if (isQuizOptedOut) {
                    qEarned = 0;
                    qAttempts = 0;
                    qDeduct = qMax;
                    totalDeductionsInTable += qDeduct;
                    qStatusCls = 'is-skipped';
                    qStatusText = 'معطّل بطلب التلميذ ✘';
                    qNameText = 'سؤال تقويم الكفاءة المرحلية (' + tk.titleAr + ')';
                    qAttemptsLabel = '0 (معطّل)';
                    qEarnedDisplay = '0.00 (0%)';
                    qNotes = 'تم إلغاء تفعيل الأسئلة بطلب من التلميذ؛ خصم كامل علامة السؤال (' + qMax.toFixed(2) + ' نقطة).';
                } else {
                    if (qDeduct > 0) totalDeductionsInTable += qDeduct;
                    qStatusCls = (qRes && qRes.answeredCorrectly) ? 'is-done' : (isSkip ? 'is-skipped' : 'is-skipped');
                    qStatusText = (qRes && qRes.answeredCorrectly) ? 'إجابة صحيحة ✔' : (isSkip ? 'تم تخطيه ⏭' : 'في الانتظار ⏳');

                    if (qRes && qRes.questionText) {
                        var fullQ = qRes.questionText.trim();
                        qNameText = fullQ.length > 70 ? (fullQ.substring(0, 68) + '...') : fullQ;
                    } else if (qRes && qRes.questionTitle) {
                        qNameText = qRes.questionTitle;
                    } else {
                        qNameText = 'سؤال تقويم الكفاءة المرحلية (' + tk.titleAr + ')';
                    }

                    qAttemptsLabel = qRes ? ('محاولة ' + qAttempts) : '-';
                    var qEarnedPct = (qAttempts === 1) ? ' (100%)' : ((qAttempts === 2) ? ' (50%)' : ' (0%)');
                    qEarnedDisplay = qRes ? (qEarned.toFixed(2) + qEarnedPct) : '0.00 (0%)';

                    if (qRes) {
                        if (qAttempts === 1) {
                            qNotes = 'إجابة صحيحة من المحاولة الأولى (كامل العلامة 100%)';
                        } else if (qAttempts === 2) {
                            qNotes = 'إجابة صحيحة من المحاولة الثانية (خصم 50% من علامة السؤال)';
                        } else {
                            qNotes = 'استنفاد المحاولات (0% من النقاط — بعد إظهار التلميح)';
                        }
                    } else if (isSkip) {
                        qNotes = 'تم تخطي السؤال التقويمي لتخطي المهمة العملية';
                    } else {
                        qNotes = 'السؤال التقويمي مرتبط باستكمال إنجاز المهمة';
                    }
                }

                rowsHtml +=
                    '<tr style="background:#FAF5FF;">' +
                        '<td style="text-align:center;font-weight:700;color:#7C3AED;">س' + (i + 1) + '</td>' +
                        '<td><span style="color:#581C87;">' + bidi(qNameText) + '</span></td>' +
                        '<td style="text-align:center;"><span class="a4-type-badge is-quiz">سؤال تقويمي</span></td>' +
                        '<td style="text-align:center;"><span class="a4-badge ' + qStatusCls + '">' + bidi(qStatusText) + '</span></td>' +
                        '<td style="text-align:center;font-size:10.5px;">' + bidi(qAttemptsLabel) + '</td>' +
                        '<td style="text-align:center;font-weight:600;"><bdi dir="ltr">' + qMax.toFixed(2) + '</bdi></td>' +
                        '<td style="text-align:center;font-weight:700;color:#6D28D9;"><bdi dir="ltr">' + qEarnedDisplay + '</bdi></td>' +
                        '<td style="text-align:center;' + (qDeduct > 0 ? 'color:#DC2626;font-weight:700;' : 'color:#64748B;') + '">' +
                            (qDeduct > 0 ? ('<bdi dir="ltr">-' + qDeduct.toFixed(2) + '</bdi>') : '<bdi dir="ltr">0.00</bdi>') +
                        '</td>' +
                        '<td style="font-size:11px;color:#4C1D95;">' + bidi(qNotes) + '</td>' +
                    '</tr>';
            }
        }

        // System General Penalties Row (if any)
        var penaltiesRowHtml = '';
        if (pen > 0 && cfg.show_penalties) {
            totalDeductionsInTable += pen;
            var mistakesList = (global.Win11Assessment && typeof global.Win11Assessment.getMistakes === 'function')
                ? global.Win11Assessment.getMistakes()
                : [];
            var mistDesc = [];
            for (var m = 0; m < mistakesList.length; m++) {
                if (mistakesList[m] && mistakesList[m].title && mistDesc.indexOf(mistakesList[m].title) === -1) {
                    mistDesc.push(mistakesList[m].title);
                }
            }
            var penaltyReason = mistDesc.length > 0 ? mistDesc.join('؛ ') : 'تعديلات أو أفعال خارج نطاق المهمة النشطة';

            penaltiesRowHtml =
                '<tr style="background:#FFF5F5;color:#991B1B;">' +
                    '<td style="text-align:center;font-weight:700;">-</td>' +
                    '<td><strong>خصومات عامة (مخالفة تسلسل المهام النشطة)</strong></td>' +
                    '<td style="text-align:center;"><span class="a4-type-badge is-penalty">مخالفة نظام</span></td>' +
                    '<td style="text-align:center;"><span class="a4-badge is-fail">خصم نقاط</span></td>' +
                    '<td style="text-align:center;">-</td>' +
                    '<td style="text-align:center;">-</td>' +
                    '<td style="text-align:center;">-</td>' +
                    '<td style="text-align:center;font-weight:700;color:#DC2626;"><bdi dir="ltr">-' + pen.toFixed(2) + '</bdi></td>' +
                    '<td style="font-size:11px;line-height:1.45;">' + bidi(penaltyReason) + '</td>' +
                '</tr>';
        }

        // Table Footer Row
        var tableFooterHtml =
            '<tr style="background:#F8FAFC;font-weight:700;border-top:2px solid #CBD5E1;">' +
                '<td colspan="5" style="text-align:left;padding:6px 10px;font-size:11.5px;">' + bidi('المجموع الكلي لأوزان ونقاط المهام والأسئلة:') + '</td>' +
                '<td style="text-align:center;"><bdi dir="ltr">' + grandTotalMax.toFixed(2) + '</bdi></td>' +
                '<td style="text-align:center;color:#1E3A8A;font-size:12.5px;"><bdi dir="ltr">' + grandTotalEarned.toFixed(2) + '</bdi></td>' +
                '<td style="text-align:center;color:#DC2626;"><bdi dir="ltr">-' + totalDeductionsInTable.toFixed(2) + '</bdi></td>' +
                '<td style="font-size:11px;color:#334155;padding:6px 10px;">' +
                    bidi('استيفاء ') + '<bdi dir="ltr"><strong>' + grandTotalEarned.toFixed(2) + '</strong></bdi>' + bidi(' من أصل ') + '<bdi dir="ltr"><strong>' + grandTotalMax.toFixed(2) + '</strong></bdi>' + bidi(' نقطة مطلوبة') +
                '</td>' +
            '</tr>';

        // ==========================================
        // SECTION C: THE MATH BREAKDOWN (STEP-BY-STEP)
        // ==========================================
        var quizDisabledNoticeHtml = '';
        if (isQuizGloballyDisabled) {
            if (cfg.show_no_quiz_note !== false) {
                quizDisabledNoticeHtml =
                    '<div class="a4-quiz-disabled-notice">' +
                        '<strong>' + bidi('ملاحظة:') + '</strong> ' +
                        bidi('تقييم بدون أسئلة بناءً على رغبة الأستاذ (تم تعطيل الأسئلة التقويمية؛ تم احتساب العلامة على المهام العملية فقط، والعلامة القصوى الممكنة هي ') +
                        '<bdi dir="ltr"><strong>' + maxPossibleScore.toFixed(2) + '</strong></bdi>/20).' +
                    '</div>';
            }
        } else if (isQuizOptedOut) {
            quizDisabledNoticeHtml =
                '<div class="a4-quiz-disabled-notice is-warning" style="background:#FEF2F2;border-right-color:#DC2626;color:#991B1B;">' +
                    '<strong>' + bidi('تنبيه بيداغوجي:') + '</strong> ' +
                    bidi('قام التلميذ بإلغاء تفعيل الأسئلة التقويمية عند بدء الجلسة؛ تم تصفير نقاط الأسئلة وخصمها بالكامل من العلامة الإجمالية (أقصى علامة ممكنة: ') +
                    '<bdi dir="ltr"><strong>' + maxPossibleScore.toFixed(2) + '</strong></bdi>/20).' +
                '</div>';
        }

        var mathBreakdownHtml =
            '<div class="a4-section-c">' +
                '<div class="a4-section-title">' +
                    '<span>' + bidi('القسم (ج): التفكيك الحسابي للعلامة (كيف تم احتساب المعدل خطوة بخطوة)') + '</span>' +
                    '<span style="font-size:11px;color:#475569;font-weight:normal;">' + bidi('تطبيق القاعدة الثلاثية الرسمية (Rule of Three)') + '</span>' +
                '</div>' +
                quizDisabledNoticeHtml +
                '<div class="a4-math-grid">' +
                    '<div class="a4-math-steps">' +
                        '<div class="a4-math-step">' +
                            '<span class="a4-step-num">1</span>' +
                            '<span class="a4-step-lbl">' + bidi('مجموع معاملات المهام العملية:') + '</span>' +
                            '<span class="a4-step-val"><bdi dir="ltr"><strong>' + practicalMax.toFixed(2) + '</strong></bdi> ' + bidi('نقطة') + '</span>' +
                            '<span class="a4-step-sub">(' + bidi('حصلت على:') + ' <bdi dir="ltr"><strong>' + practicalEarned.toFixed(2) + '</strong></bdi>)</span>' +
                        '</div>' +

                        '<div class="a4-math-step">' +
                            '<span class="a4-step-num">2</span>' +
                            '<span class="a4-step-lbl">' + bidi('مجموع معاملات الأسئلة:') + '</span>' +
                            '<span class="a4-step-val"><bdi dir="ltr"><strong>' + (showQuizzes ? quizMax.toFixed(2) : '0.00') + '</strong></bdi> ' + bidi('نقطة') + '</span>' +
                            '<span class="a4-step-sub">' +
                                (isQuizGloballyDisabled
                                    ? bidi('معطّلة بناءً على رغبة الأستاذ')
                                    : (isQuizOptedOut
                                        ? ('<span style="color:#DC2626;">' + bidi('حصلت على: 0.00 (معطّل بطلب التلميذ)') + '</span>')
                                        : (bidi('حصلت على:') + ' <bdi dir="ltr"><strong>' + quizEarned.toFixed(2) + '</strong></bdi>'))) +
                            '</span>' +
                        '</div>' +

                        '<div class="a4-math-step">' +
                            '<span class="a4-step-num">3</span>' +
                            '<span class="a4-step-lbl">' + bidi('مجموع النقاط التي حصلت عليها (أوزان):') + '</span>' +
                            '<span class="a4-step-val" style="color:#1E3A8A;"><bdi dir="ltr"><strong>' + grandTotalEarned.toFixed(2) + '</strong> / <strong>' + grandTotalMax.toFixed(2) + '</strong></bdi> ' + bidi('نقطة') + '</span>' +
                            '<span class="a4-step-sub">(' +
                                (isQuizGloballyDisabled
                                    ? ('<bdi dir="ltr">' + practicalEarned.toFixed(2) + '</bdi> ' + bidi('عملي (فقط)'))
                                    : ('<bdi dir="ltr">' + practicalEarned.toFixed(2) + '</bdi> ' + bidi('عملي') + ' + <bdi dir="ltr">' + quizEarned.toFixed(2) + '</bdi> ' + bidi('أسئلة') + ' = <bdi dir="ltr">' + grandTotalEarned.toFixed(2) + '</bdi>')) +
                            ')</span>' +
                        '</div>' +

                        '<div class="a4-math-step highlight-rule3">' +
                            '<span class="a4-step-num">4</span>' +
                            '<span class="a4-step-lbl">' + bidi('العلامة قبل الخصم (من 20):') + '</span>' +
                            '<span class="a4-step-val" style="color:#0284C7;"><bdi dir="ltr"><strong>' + baseScoreOutOf20.toFixed(2) + ' / 20</strong></bdi></span>' +
                            '<span class="a4-step-sub">' + bidi('القاعدة الثلاثية: (') + '<bdi dir="ltr">' + grandTotalEarned.toFixed(2) + '</bdi> ÷ <bdi dir="ltr">' + grandTotalMax.toFixed(2) + '</bdi>' + bidi(') × 20') + '</span>' +
                        '</div>' +

                        '<div class="a4-math-step">' +
                            '<span class="a4-step-num">5</span>' +
                            '<span class="a4-step-lbl">' + bidi('مجموع الخصومات:') + '</span>' +
                            '<span class="a4-step-val" style="color:' + (pen > 0 ? '#DC2626' : '#15803D') + ';"><bdi dir="ltr"><strong>' + (pen > 0 ? ('-' + pen.toFixed(2)) : '0.00') + '</strong></bdi> ' + bidi('نقطة') + '</span>' +
                            '<span class="a4-step-sub">' + (pen > 0 ? bidi('مخالفات تسلسل المهام النشطة') : bidi('أداء نظامي سليم بدون خصومات')) + '</span>' +
                        '</div>' +

                        '<div class="a4-math-step final-formula">' +
                            '<span class="a4-step-num">6</span>' +
                            '<span class="a4-step-lbl">' + bidi('العلامة النهائية:') + '</span>' +
                            '<span class="a4-step-val" style="color:#15803D;"><bdi dir="ltr"><strong>' + finalScoreStr + ' / 20</strong></bdi></span>' +
                            '<span class="a4-step-sub"><bdi dir="ltr">' + baseScoreOutOf20.toFixed(2) + ' - ' + pen.toFixed(2) + ' = ' + finalScoreStr + '</bdi></span>' +
                        '</div>' +
                    '</div>' +

                    // Highlighted Final Score Box (Green Box)
                    '<div class="a4-final-score-card ' + (isPassed ? 'is-pass' : 'is-fail') + '">' +
                        '<div class="a4-fsc-title">' + bidi('العلامة النهائية المستحقة') + '</div>' +
                        '<div class="a4-fsc-grade"><bdi dir="ltr">' + finalScoreStr + '</bdi> <span class="a4-fsc-out">/ 20</span></div>' +
                        '<div class="a4-fsc-badge"><span class="a4-pass-badge ' + (isPassed ? 'is-pass' : 'is-fail') + '">' + bidi(isPassed ? '✔ مستوفٍ لمعيار النجاح' : '✘ دون المعدل المطلوب') + '</span></div>' +
                        '<div class="a4-fsc-appreciation">' + bidi('التقدير العام: ') + '<strong>' + bidi(scores.appreciation || 'متوسط') + '</strong></div>' +
                        '<div class="a4-fsc-level">' + bidi(scores.performanceLevel || 'في طريق الاكتساب') + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var logoHtml = (cfg.report_logo_b64 && String(cfg.report_logo_b64).indexOf('data:image/') === 0)
            ? '<img src="' + cfg.report_logo_b64 + '" alt="logo" style="max-height:50px;max-width:85px;object-fit:contain;">'
            : '';
        var studentName = (stu.lastName || '') + ' ' + (stu.firstName || stu.fullName || '');
        var pcNum = global.Win11Compat.escapeHtml(String(stu.pcNumber || cfg.default_device || '01'));

        // ==========================================
        // SECTION A: HEADER & STUDENT INFO
        // ==========================================
        var sectionAHtml =
            '<div class="a4-section-a">' +
                '<div class="a4-section-title">' +
                    '<span>' + bidi('القسم (أ): بيانات التلميذ والجلسة التقويمية') + '</span>' +
                    '<span style="font-size:11px;color:#475569;font-weight:normal;">' + bidi('بيانات رسمية معتمدة') + '</span>' +
                '</div>' +
                '<table class="a4-info-table">' +
                    '<tbody>' +
                        '<tr>' +
                            '<td style="width:36%;">' +
                                '<div class="a4-cell-lbl">' + bidi('اسم ولقب التلميذ:') + '</div>' +
                                '<div class="a4-cell-val" style="font-size:13.5px;font-weight:700;color:#0F172A;">' + bidi(studentName) + '</div>' +
                            '</td>' +
                            '<td style="width:32%;">' +
                                '<div class="a4-cell-lbl">' + bidi('الفوج التربوي ورقم الجهاز:') + '</div>' +
                                '<div class="a4-cell-val"><strong>' + bidi(stu.classGroup) + '</strong> &nbsp;|&nbsp; <span>حاسوب <bdi dir="ltr">#' + pcNum + '</bdi></span></div>' +
                            '</td>' +
                            '<td style="width:32%;">' +
                                '<div class="a4-cell-lbl">' + bidi('طبيعة النشاط ونمط المحاكاة:') + '</div>' +
                                '<div class="a4-cell-val"><strong>' + bidi(sessionLabel) + '</strong></div>' +
                            '</td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td>' +
                                '<div class="a4-cell-lbl">' + bidi('المشرف البيداغوجي والمؤسسة (inf.dll):') + '</div>' +
                                '<div class="a4-cell-val"><strong>' + bidi(cfg.teacher_name) + '</strong> &nbsp;|&nbsp; <span>' + bidi(cfg.institution_name) + '</span></div>' +
                            '</td>' +
                            '<td>' +
                                '<div class="a4-cell-lbl">' + bidi('تاريخ وتوقيت الإنجاز:') + '</div>' +
                                '<div class="a4-cell-val"><bdi dir="ltr">' + bidi(dateFormatted) + '</bdi></div>' +
                            '</td>' +
                            '<td>' +
                                '<div class="a4-cell-lbl">' + bidi('الوقت الإجمالي المستغرق:') + '</div>' +
                                '<div class="a4-cell-val" style="font-family:Consolas,monospace;font-weight:700;color:#1E3A8A;font-size:13px;"><bdi dir="ltr">' + bidi(totalDurationStr) + '</bdi></div>' +
                            '</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>';

        // ==========================================
        // TOP SCORE & DURATION HIGHLIGHT CARD
        // ==========================================
        var topSummaryCardHtml =
            '<div class="a4-top-summary-card">' +
                '<div class="a4-tsc-score ' + (isPassed ? 'is-pass' : 'is-fail') + '">' +
                    '<div class="a4-tsc-title">' + bidi('العلامة النهائية المستحقة:') + '</div>' +
                    '<div class="a4-tsc-grade"><bdi dir="ltr">' + finalScoreStr + '</bdi> <span class="a4-tsc-out">/ 20.00</span></div>' +
                    '<div class="a4-tsc-badge"><span class="a4-pass-badge ' + (isPassed ? 'is-pass' : 'is-fail') + '">' + bidi(isPassed ? '✔ مستوفٍ لمعيار النجاح' : '✘ دون المعدل المطلوب') + ' — <strong>' + bidi(scores.appreciation || 'متوسط') + '</strong></span></div>' +
                '</div>' +
                '<div class="a4-tsc-time">' +
                    '<div class="a4-tsc-title">' + bidi('الوقت الإجمالي المستغرق:') + '</div>' +
                    '<div class="a4-tsc-grade"><bdi dir="ltr">' + bidi(totalDurationStr) + '</bdi></div>' +
                    '<div class="a4-tsc-badge"><span class="a4-badge is-done">' + bidi(stu.allCompleted ? 'تم تثبيت وقت الإنجاز النهائي ✔' : 'جلسة قيد الإنجاز ⏳') + '</span></div>' +
                '</div>' +
            '</div>';

        // ==========================================
        // SECTION B: BREAKDOWN TABLE CONTAINER
        // ==========================================
        var sectionBHtml =
            '<div class="a4-section-b">' +
                '<div class="a4-section-title">' +
                    '<span>' + bidi('القسم (ب): جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية') + '</span>' +
                    '<span style="font-size:11px;color:#475569;font-weight:normal;">' + bidi('تفصيل النقاط والأوزان والمحاولات') + '</span>' +
                '</div>' +
                '<table class="a4-report-table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th style="width:4%;text-align:center;">#</th>' +
                            '<th style="width:27%;text-align:right;">المهمة التطبيقية أو السؤال التقويمي</th>' +
                            '<th style="width:9%;text-align:center;">النوع</th>' +
                            '<th style="width:10%;text-align:center;">الحالة</th>' +
                            '<th style="width:8%;text-align:center;">المحاولات</th>' +
                            '<th style="width:7%;text-align:center;">الوزن الأقصى</th>' +
                            '<th style="width:7%;text-align:center;">الممنوحة</th>' +
                            '<th style="width:7%;text-align:center;">الخصم</th>' +
                            '<th style="width:21%;text-align:right;">الملاحظات وتفاصيل الإنجاز</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        rowsHtml +
                        penaltiesRowHtml +
                    '</tbody>' +
                    '<tfoot>' +
                        tableFooterHtml +
                    '</tfoot>' +
                '</table>' +
            '</div>';

        return (
            '<div class="a4-report-sheet" dir="rtl" lang="ar">' +
                // Header
                '<div class="a4-header">' +
                    '<div class="a4-header-republic">' + bidi('الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية') + '</div>' +
                    '<div class="a4-header-grid">' +
                        '<div style="text-align:right;">' +
                            '<div>المؤسسة: <strong>' + bidi(cfg.institution_name) + '</strong></div>' +
                            '<div>الأستاذ المشرف: <strong>' + bidi(cfg.teacher_name) + '</strong></div>' +
                        '</div>' +
                        (logoHtml ? '<div>' + logoHtml + '</div>' : '') +
                        '<div style="text-align:left;" dir="ltr">' +
                            '<div>Année scolaire: <strong>' + esc(cfg.academic_year) + '</strong></div>' +
                            '<div>Niveau: <strong>' + esc(cfg.target_level) + '</strong></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="a4-banner">' +
                        '<div class="a4-banner-title">' + bidi('بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي') + '</div>' +
                        '<div class="a4-banner-sub">' + bidi('المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)') + '</div>' +
                    '</div>' +
                '</div>' +

                sectionAHtml +
                topSummaryCardHtml +
                sectionBHtml +
                mathBreakdownHtml +

                // Teacher Observations & Official Seal
                '<div class="a4-footer-sig">' +
                    '<div style="flex:1;padding-left:24px;">' +
                        '<div style="font-weight:700;margin-bottom:4px;color:#0F172A;">' + bidi('ملاحظات وتوجيهات الأستاذ(ة):') + '</div>' +
                        '<div style="border-bottom:1px dotted #94A3B8;height:20px;"></div>' +
                        '<div style="border-bottom:1px dotted #94A3B8;height:20px;margin-top:4px;"></div>' +
                    '</div>' +
                    '<div style="flex:0 0 210px;text-align:center;">' +
                        '<div style="font-size:11px;color:#64748B;margin-bottom:3px;">حرر في: <bdi dir="ltr">' + bidi(dateFormatted.split('—')[0].trim()) + '</bdi></div>' +
                        '<div style="border:1px dashed #64748B;border-radius:6px;padding:8px 12px;min-height:55px;display:flex;flex-direction:column;justify-content:space-between;background:#FAFAFA;">' +
                            '<span style="font-weight:700;font-size:11.5px;color:#475569;">' + bidi('توقيع وختم الأستاذ(ة)') + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }

    function buildStandaloneHtmlDoc() {
        var stu = global.Win11Assessment.getStudent();
        var title = 'بطاقة تقويم الأعمال التطبيقية - ' + stu.fullName;
        var a4Inner = buildA4Html();
        return '<!DOCTYPE html>\n' +
            '<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n' +
            '<title>' + global.Win11Compat.escapeHtml(title) + '</title>\n' +
            '<style>\n' +
            'body{margin:20px auto;background:#F1F5F9;font-family:"Segoe UI",Tahoma,Arial,"Noto Sans Arabic",sans-serif;color:#0F172A;direction:rtl;line-height:1.5;}\n' +
            '.a4-report-sheet{max-width:880px;margin:0 auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:18px 22px;box-shadow:0 4px 16px rgba(0,0,0,0.06);box-sizing:border-box;overflow-x:auto;}\n' +
            '.a4-header{border-bottom:2px solid #1E3A8A;padding-bottom:8px;margin-bottom:8px;}\n' +
            '.a4-header-republic{text-align:center;font-size:13.5px;font-weight:700;color:#0F172A;margin-bottom:6px;}\n' +
            '.a4-header-grid{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#334155;margin-bottom:8px;line-height:1.4;}\n' +
            '.a4-banner{text-align:center;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:6px 12px;}\n' +
            '.a4-banner-title{font-size:15px;font-weight:800;color:#1E3A8A;}\n' +
            '.a4-banner-sub{font-size:11.5px;color:#475569;margin-top:2px;}\n' +
            '.a4-section-title{font-size:12.5px;font-weight:700;color:#1E3A8A;background:#F1F5F9;border:1px solid #CBD5E1;border-right:4px solid #1E3A8A;padding:4px 10px;margin:10px 0 6px 0;border-radius:4px;display:flex;align-items:center;justify-content:space-between;}\n' +
            '.a4-info-table{width:100%;border-collapse:collapse;margin:4px 0 8px 0;font-size:11px;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:6px;overflow:hidden;}\n' +
            '.a4-info-table td{padding:5px 8px;border:1px solid #CBD5E1;vertical-align:middle;text-align:right;}\n' +
            '.a4-cell-lbl{font-size:10px;color:#64748B;font-weight:600;display:block;margin-bottom:2px;}\n' +
            '.a4-cell-val{color:#0F172A;}\n' +
            '.a4-type-badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;white-space:nowrap;}\n' +
            '.a4-type-badge.is-task{background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;}\n' +
            '.a4-type-badge.is-quiz{background:#F5F3FF;color:#6D28D9;border:1px solid #DDD6FE;}\n' +
            '.a4-type-badge.is-penalty{background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA;}\n' +
            '.a4-crit-badge{color:#DC2626;font-size:10px;font-weight:700;}\n' +
            '.a4-badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;white-space:nowrap;}\n' +
            '.a4-badge.is-done{background:#DCFCE7;color:#15803D;border:1px solid #86EFAC;}\n' +
            '.a4-badge.is-partial{background:#FEF3C7;color:#D97706;border:1px solid #FDE68A;}\n' +
            '.a4-badge.is-fail{background:#FEE2E2;color:#B91C1C;border:1px solid #FCA5A5;}\n' +
            '.a4-badge.is-skipped{background:#E2E8F0;color:#475569;border:1px solid #CBD5E1;}\n' +
            '.a4-pass-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;}\n' +
            '.a4-pass-badge.is-pass{background:#DCFCE7;color:#15803D;border:1px solid #86EFAC;}\n' +
            '.a4-pass-badge.is-fail{background:#FEE2E2;color:#B91C1C;border:1px solid #FCA5A5;}\n' +
            '.a4-top-summary-card{display:flex;gap:10px;margin:8px 0 10px 0;align-items:stretch;box-sizing:border-box;}\n' +
            '.a4-tsc-score{flex:1 1 50%;background:#F0FDF4;border:2px solid #16A34A;border-radius:6px;padding:8px 10px;text-align:center;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;}\n' +
            '.a4-tsc-score.is-fail{background:#FFFBEB;border-color:#D97706;}\n' +
            '.a4-tsc-time{flex:1 1 50%;background:#EFF6FF;border:2px solid #2563EB;border-radius:6px;padding:8px 10px;text-align:center;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;}\n' +
            '.a4-tsc-title{font-size:11.5px;font-weight:700;color:#475569;margin-bottom:2px;}\n' +
            '.a4-tsc-grade{font-size:26px;font-weight:900;color:#15803D;line-height:1.15;margin:2px 0;}\n' +
            '.a4-tsc-score.is-fail .a4-tsc-grade{color:#B45309;}\n' +
            '.a4-tsc-time .a4-tsc-grade{color:#1D4ED8;font-family:Consolas,monospace;}\n' +
            '.a4-tsc-out{font-size:14px;color:#64748B;font-weight:700;}\n' +
            '.a4-tsc-badge{margin-top:3px;}\n' +
            '.a4-report-table{width:100% !important;table-layout:fixed !important;border-collapse:collapse;margin:6px 0 8px 0;font-size:10.5px;box-sizing:border-box;}\n' +
            '.a4-report-table th,.a4-report-table td{border:1px solid #CBD5E1;padding:5px 4px;text-align:right;vertical-align:middle;word-wrap:break-word;overflow-wrap:break-word;word-break:break-word;white-space:normal;box-sizing:border-box;}\n' +
            '.a4-report-table th{background:#F1F5F9;color:#0F172A;font-weight:700;font-size:10px;line-height:1.35;}\n' +
            '.a4-quiz-disabled-notice{background:#FFFBEB;border:1.5px solid #F59E0B;border-radius:6px;padding:6px 10px;margin:6px 0;color:#92400E;font-size:11px;line-height:1.5;}\n' +
            '.a4-math-grid{display:flex;gap:10px;margin-top:6px;align-items:stretch;}\n' +
            '.a4-math-steps{flex:1 1 65%;display:flex;flex-direction:column;gap:4px;}'+
            '.a4-math-step{display:flex;align-items:center;gap:6px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:4px;padding:4px 8px;font-size:11px;color:#334155;}\n' +
            '.a4-math-step.highlight-rule3{background:#F0F9FF;border-color:#BAE6FD;}\n' +
            '.a4-math-step.final-formula{background:#F0FDF4;border-color:#BBF7D0;font-weight:700;}\n' +
            '.a4-step-num{width:16px;height:16px;background:#1E3A8A;color:#FFFFFF;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;flex-shrink:0;}\n' +
            '.a4-step-lbl{font-weight:600;color:#1E293B;}\n' +
            '.a4-step-val{margin-right:auto;font-weight:700;color:#0F172A;}\n' +
            '.a4-step-sub{font-size:10px;color:#64748B;}\n' +
            '.a4-final-score-card{flex:0 0 210px;border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;box-sizing:border-box;}\n' +
            '.a4-final-score-card.is-pass{background:#F0FDF4;border:2px solid #16A34A;box-shadow:0 2px 6px rgba(22,163,74,0.12);}\n' +
            '.a4-final-score-card.is-fail{background:#FFFBEB;border:2px solid #D97706;box-shadow:0 2px 6px rgba(217,119,6,0.12);}\n' +
            '.a4-fsc-title{font-size:11.5px;font-weight:700;color:#475569;margin-bottom:2px;}\n' +
            '.a4-fsc-grade{font-size:28px;font-weight:900;color:#15803D;line-height:1.1;margin:3px 0;}\n' +
            '.a4-final-score-card.is-fail .a4-fsc-grade{color:#B45309;}\n' +
            '.a4-fsc-out{font-size:15px;color:#64748B;font-weight:700;}'+
            '.a4-fsc-badge{margin:3px 0;}\n' +
            '.a4-fsc-appreciation{font-size:11.5px;margin-top:3px;color:#1E293B;}\n' +
            '.a4-fsc-level{font-size:10px;font-weight:600;color:#64748B;margin-top:2px;line-height:1.3;}\n' +
            '.a4-footer-sig{margin-top:8px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #CBD5E1;padding-top:6px;font-size:11px;}\n' +
            '@media print{@page{size:A4 portrait;margin:6mm 6mm;}body{background:#FFFFFF;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.a4-report-sheet{border:none;box-shadow:none;padding:0;max-width:none;width:100%;}.a4-top-summary-card{page-break-inside:avoid;break-inside:avoid;}.a4-section-title{page-break-after:avoid;break-after:avoid;}.a4-report-table{width:100% !important;table-layout:fixed !important;}.a4-report-table tr{page-break-inside:avoid;break-inside:avoid;}.a4-section-c,.a4-footer-sig{page-break-inside:avoid;break-inside:avoid;}}\n' +
            '</style>\n</head>\n<body>\n' + a4Inner + '\n</body>\n</html>';
    }

    
    function buildPdfFromJpegBytes(jpegBytes, width, height) {
        var a4W = 595.28;
        var a4H = 841.89;

        function strToBytes(str) {
            var arr = new Uint8Array(str.length);
            for (var i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xFF;
            return arr;
        }

        function concatBuffers(bufs) {
            var total = 0;
            for (var i = 0; i < bufs.length; i++) total += bufs[i].length;
            var res = new Uint8Array(total);
            var offset = 0;
            for (var j = 0; j < bufs.length; j++) {
                res.set(bufs[j], offset);
                offset += bufs[j].length;
            }
            return res;
        }

        var header = strToBytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
        var offsets = [];
        var currentOffset = header.length;

        function makeObj(num, bodyBytes) {
            offsets[num] = currentOffset;
            var oHead = strToBytes(num + ' 0 obj\n');
            var oFoot = strToBytes('\nendobj\n');
            currentOffset += oHead.length + bodyBytes.length + oFoot.length;
            return concatBuffers([oHead, bodyBytes, oFoot]);
        }

        var o1 = makeObj(1, strToBytes('<< /Type /Catalog /Pages 2 0 R >>'));
        var o2 = makeObj(2, strToBytes('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
        var o3 = makeObj(3, strToBytes('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + a4W + ' ' + a4H + '] /Resources << /XObject << /Im1 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>'));

        var imgDict = strToBytes('<< /Type /XObject /Subtype /Image /Width ' + width + ' /Height ' + height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\nstream\n');
        var imgFoot = strToBytes('\nendstream');
        var o4 = makeObj(4, concatBuffers([imgDict, jpegBytes, imgFoot]));

        var streamStr = 'q\n' + a4W + ' 0 0 ' + a4H + ' 0 0 cm\n/Im1 Do\nQ\n';
        var o5 = makeObj(5, strToBytes('<< /Length ' + streamStr.length + ' >>\nstream\n' + streamStr + 'endstream'));

        var xrefOffset = currentOffset;
        var xref = 'xref\n0 6\n0000000000 65535 f \n';
        for (var k = 1; k <= 5; k++) {
            var offStr = String(offsets[k]);
            while (offStr.length < 10) offStr = '0' + offStr;
            xref += offStr + ' 00000 n \n';
        }
        var trailer = 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
        var trailBytes = strToBytes(xref + trailer);

        return concatBuffers([header, o1, o2, o3, o4, o5, trailBytes]);
    }

    function generateReportPdfBlob() {
        try {
            var canvas = document.createElement('canvas');
            canvas.width = 1240;
            canvas.height = 1754;
            var ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 1240, 1754);

            // Double border
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#1E3A8A';
            ctx.strokeRect(40, 40, 1160, 1674);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#94A3B8';
            ctx.strokeRect(46, 46, 1148, 1662);

            var cfg = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : {};
            var stu = (global.Win11Assessment && global.Win11Assessment.getStudent) ? global.Win11Assessment.getStudent() : {};
            var scores = (global.Win11Assessment && global.Win11Assessment.getScores) ? global.Win11Assessment.getScores() : {};
            var tasks = (global.Win11Assessment && global.Win11Assessment.getTasks) ? global.Win11Assessment.getTasks() : [];

            var enabledTasks = [];
            var doneTasksCount = 0;
            var practicalMaxPoints = 0;
            var practicalEarnedPoints = 0;

            for (var t = 0; t < tasks.length; t++) {
                if (tasks[t].enabled !== false) {
                    enabledTasks.push(tasks[t]);
                    var tMax = Math.floor(Math.max(1, Number(tasks[t].coefficient) || Number(tasks[t].maxPoints) || 1));
                    tasks[t].coefficient = tMax;
                    tasks[t].maxPoints = tMax;
                    practicalMaxPoints += tMax;
                    practicalEarnedPoints += Math.min(tMax, Math.max(0, Number(tasks[t].earnedPoints) || 0));
                    if (tasks[t].completed) doneTasksCount++;
                }
            }

            var completionPct = enabledTasks.length > 0 ? Math.round((doneTasksCount / enabledTasks.length) * 100) : 0;
            var effectiveSec = (stu.allCompleted && stu.completionElapsedSeconds !== null && stu.completionElapsedSeconds !== undefined)
                ? stu.completionElapsedSeconds
                : (stu.elapsedSeconds || 0);
            var totalDurationStr = formatArabicDuration(effectiveSec);
            var dateFormatted = formatArabicDate();
            var isExam = (stu.mode === 'exam');
            var isPassed = (scores.passed !== false);
            var finalScoreNum = (scores.finalScore !== undefined ? scores.finalScore : scores.net);
            var finalScoreStr = Number(finalScoreNum || 0).toFixed(2);

            var isQuizGloballyDisabled = (cfg.quiz_enabled === false);
            var isQuizOptedOut = (stu.quizOptIn === false);
            var showQuizzes = !isQuizGloballyDisabled;

            var practicalMax = Number(scores.practicalMax || practicalMaxPoints || 0);
            var practicalEarned = Number(scores.practicalEarned !== undefined ? scores.practicalEarned : practicalEarnedPoints);
            var quizMax = Number(scores.quizMax !== undefined ? scores.quizMax : 0);
            var quizEarned = Number(scores.quizEarned !== undefined ? scores.quizEarned : 0);
            var grandTotalMax = Number(scores.grandTotalMax || (practicalMax + (showQuizzes ? quizMax : 0)));
            var grandTotalEarned = Number(scores.grandTotalEarned !== undefined ? scores.grandTotalEarned : (practicalEarned + (showQuizzes ? quizEarned : 0)));
            var baseScoreOutOf20 = Number(scores.baseScore !== undefined ? scores.baseScore : (grandTotalMax > 0 ? ((grandTotalEarned / grandTotalMax) * 20) : 0));
            var pen = Number(scores.penalties || 0);

            // 1. Republic Header text
            ctx.direction = 'rtl';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 16px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية', 620, 72);

            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#475569';
            var instStr = (cfg.institution_name || 'ثانوية الشهيد قورين محمد الأغواط');
            var teachStr = (cfg.teacher_name || 'أستاذ مادة المعلوماتية');
            ctx.fillText('المؤسسة: ' + instStr + '      |      الأستاذ المشرف: ' + teachStr, 620, 98);

            // Main Title Banner
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(80, 114, 1080, 58);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#CBD5E1';
            ctx.strokeRect(80, 114, 1080, 58);

            ctx.fillStyle = '#1E3A8A';
            ctx.font = 'bold 20px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي', 620, 142);

            ctx.fillStyle = '#475569';
            ctx.font = '13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)', 620, 163);

            // 2. Top Summary Cards (Y = 182..258)
            // Card 1: Score Card (80, 182, 345, 76)
            ctx.fillStyle = isPassed ? '#F0FDF4' : '#FEF2F2';
            ctx.fillRect(80, 182, 345, 76);
            ctx.strokeStyle = isPassed ? '#16A34A' : '#DC2626';
            ctx.lineWidth = 2;
            ctx.strokeRect(80, 182, 345, 76);

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = isPassed ? '#166534' : '#991B1B';
            ctx.fillText('العلامة الإجمالية المستحقة:', 252, 204);

            // Draw Score strictly LTR
            ctx.save();
            ctx.direction = 'ltr';
            ctx.font = 'bold 26px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = isPassed ? '#15803D' : '#DC2626';
            ctx.fillText(finalScoreStr + ' / 20.00', 252, 240);
            ctx.restore();

            // Card 2: Duration Card (445, 182, 350, 76)
            ctx.fillStyle = '#EFF6FF';
            ctx.fillRect(445, 182, 350, 76);
            ctx.strokeStyle = '#2563EB';
            ctx.lineWidth = 2;
            ctx.strokeRect(445, 182, 350, 76);

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#1E40AF';
            ctx.fillText('الوقت الإجمالي المستغرق:', 620, 204);

            ctx.save();
            ctx.direction = 'ltr';
            ctx.font = 'bold 24px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#1D4ED8';
            ctx.fillText(totalDurationStr, 620, 240);
            ctx.restore();

            // Card 3: Completion / Mode Card (815, 182, 345, 76)
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(815, 182, 345, 76);
            ctx.strokeStyle = '#64748B';
            ctx.lineWidth = 2;
            ctx.strokeRect(815, 182, 345, 76);

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#334155';
            ctx.fillText('التقدم الكلي والنمط:', 987, 204);

            ctx.font = 'bold 17px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            var modeLbl = isExam ? 'امتحان رسمي' : 'استطلاع وتدريب';
            ctx.fillText(completionPct + '% (' + modeLbl + ')', 987, 238);

            // 3. Section A: Student Metadata Box (Y = 268..338)
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(80, 268, 1080, 70);
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = '#E2E8F0';
            ctx.strokeRect(80, 268, 1080, 70);

            ctx.textAlign = 'right';
            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            var sFullName = ((stu.lastName || '') + ' ' + (stu.firstName || stu.fullName || 'تلميذ')).trim();
            ctx.fillText('اسم التلميذ(ة): ' + sFullName + '      |      الفوج: ' + (stu.classGroup || '1AS') + '      |      رقم الجهاز: ' + (stu.pcNumber || '01'), 1140, 296);

            ctx.font = '13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText('المستوى: السنة الأولى ثانوي (1AS) — الوحدة 3: لوحة التحكم وإعدادات النظام      |      تاريخ الإنجاز: ' + dateFormatted, 1140, 323);

            // 4. Section B: Table Header (Y = 348..378)
            var curY = 348;
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(80, curY, 1080, 30);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('القسم (ب): جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية', 1140, curY + 20);
            curY += 30;

            // Column Headers (Y = 378..408)
            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(80, curY, 1080, 30);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1;
            ctx.strokeRect(80, curY, 1080, 30);

            ctx.fillStyle = '#334155';
            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';

            ctx.textAlign = 'center';
            ctx.fillText('#', 1137, curY + 20); // col 0: 1115..1160
            ctx.textAlign = 'right';
            ctx.fillText('المهمة التطبيقية أو السؤال التقويمي', 1100, curY + 20); // col 1: 765..1115
            ctx.textAlign = 'center';
            ctx.fillText('النوع', 717, curY + 20); // col 2: 670..765
            ctx.fillText('الحالة', 615, curY + 20); // col 3: 560..670
            ctx.fillText('المحاولات', 525, curY + 20); // col 4: 490..560
            ctx.fillText('الوزن الأقصى', 450, curY + 20); // col 5: 410..490
            ctx.fillText('الممنوحة', 370, curY + 20); // col 6: 330..410
            ctx.fillText('الخصم', 295, curY + 20); // col 7: 260..330
            ctx.textAlign = 'right';
            ctx.fillText('الملاحظات وتفاصيل التقييم', 250, curY + 20); // col 8: 80..260
            curY += 30;

            var totalDeductionsInTable = 0;

            // Render Table Rows
            for (var rIdx = 0; rIdx < enabledTasks.length; rIdx++) {
                var tk = enabledTasks[rIdx];
                var isDone = !!tk.completed;
                var isSkip = !!tk.skipped;
                var isPart = (!isDone && !isSkip && (Number(tk.earnedPoints) > 0));

                var tkMax = Number(tk.maxPoints || tk.coefficient || 1);
                var tkEarned = Number(tk.earnedPoints || 0);
                var tkDeduct = Number((tkMax - tkEarned).toFixed(2));
                if (tkDeduct > 0) totalDeductionsInTable += tkDeduct;

                var rowBg = (rIdx % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
                ctx.fillStyle = rowBg;
                ctx.fillRect(80, curY, 1080, 32);
                ctx.strokeStyle = '#E2E8F0';
                ctx.lineWidth = 1;
                ctx.strokeRect(80, curY, 1080, 32);

                ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#64748B';
                ctx.fillText(String(rIdx + 1), 1137, curY + 21);

                ctx.textAlign = 'right';
                ctx.fillStyle = '#0F172A';
                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                var tkTitle = tk.titleAr || ('مهمة ' + (rIdx + 1));
                if (tkTitle.length > 40) tkTitle = tkTitle.substring(0, 38) + '...';
                ctx.fillText(tkTitle, 1100, curY + 21);

                // Type Badge: مهمة عملية
                ctx.font = '11px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#0369A1';
                ctx.fillText('مهمة عملية', 717, curY + 21);

                // Status Badge
                if (isDone) {
                    ctx.fillStyle = '#15803D';
                    ctx.fillText('مكتملة ✔', 615, curY + 21);
                } else if (isPart) {
                    ctx.fillStyle = '#B45309';
                    ctx.fillText('منجزة جزئياً ◐', 615, curY + 21);
                } else if (isSkip) {
                    ctx.fillStyle = '#64748B';
                    ctx.fillText('تم تخطيها ⏭', 615, curY + 21);
                } else {
                    ctx.fillStyle = '#DC2626';
                    ctx.fillText('غير منجزة ✘', 615, curY + 21);
                }

                // Attempts
                ctx.fillStyle = '#334155';
                ctx.fillText(isDone ? '1' : '-', 525, curY + 21);

                // Max Weight
                ctx.fillText(tkMax.toFixed(2), 450, curY + 21);

                // Earned
                ctx.fillStyle = '#1E3A8A';
                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                ctx.fillText(tkEarned.toFixed(2), 370, curY + 21);

                // Deduct
                ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
                if (tkDeduct > 0) {
                    ctx.fillStyle = '#DC2626';
                    ctx.fillText('-' + tkDeduct.toFixed(2), 295, curY + 21);
                } else {
                    ctx.fillStyle = '#64748B';
                    ctx.fillText('0.00', 295, curY + 21);
                }

                // Notes
                ctx.textAlign = 'right';
                ctx.font = '10.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#475569';
                var rNote = isDone ? 'تم إنجاز كافة خطوات المهمة بنجاح.' : (isSkip ? 'تم تخطي المهمة من قبل التلميذ.' : 'لم يتم استيفاء الخطوات العملية.');
                ctx.fillText(rNote, 250, curY + 21);

                curY += 32;

                // Quiz Row (if applicable)
                var isTaskQuizDisabled = Array.isArray(cfg.quiz_disabled_tasks) && cfg.quiz_disabled_tasks.indexOf(tk.id) !== -1;
                if (showQuizzes && !isTaskQuizDisabled) {
                    var qRes = tk.quizResult;
                    var qMax = Number(qRes && qRes.maxPoints ? qRes.maxPoints : 1.0);
                    var qEarned = Number(qRes && typeof qRes.earnedPoints === 'number' ? qRes.earnedPoints : 0);
                    var qAttempts = (qRes && qRes.attempts) ? qRes.attempts : (isDone ? 1 : 0);
                    var qDeduct = Number((qMax - qEarned).toFixed(2));

                    if (isQuizOptedOut) {
                        qEarned = 0;
                        qAttempts = 0;
                        qDeduct = qMax;
                        totalDeductionsInTable += qDeduct;
                    } else {
                        if (qDeduct > 0) totalDeductionsInTable += qDeduct;
                    }

                    ctx.fillStyle = '#FAFAFA';
                    ctx.fillRect(80, curY, 1080, 28);
                    ctx.strokeStyle = '#E2E8F0';
                    ctx.strokeRect(80, curY, 1080, 28);

                    ctx.font = 'bold 11px "Segoe UI", Tahoma, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#7C3AED';
                    ctx.fillText('س' + (rIdx + 1), 1137, curY + 18);

                    ctx.textAlign = 'right';
                    ctx.font = '11px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#334155';
                    var qTitle = (qRes && qRes.questionTitle) ? qRes.questionTitle : ('سؤال تقويمي للمهمة ' + (rIdx + 1));
                    if (qTitle.length > 42) qTitle = qTitle.substring(0, 40) + '...';
                    ctx.fillText(qTitle, 1100, curY + 18);

                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#6D28D9';
                    ctx.fillText('سؤال تقويمي', 717, curY + 18);

                    // Quiz Status
                    if (isQuizOptedOut) {
                        ctx.fillStyle = '#DC2626';
                        ctx.fillText('معطل بطلب التلميذ ✘', 615, curY + 18);
                    } else if (qRes && qRes.answeredCorrectly) {
                        ctx.fillStyle = '#15803D';
                        ctx.fillText('إجابة صحيحة ✔', 615, curY + 18);
                    } else if (qRes && qRes.attempts >= 3) {
                        ctx.fillStyle = '#DC2626';
                        ctx.fillText('استنفاد محاولات ✘', 615, curY + 18);
                    } else {
                        ctx.fillStyle = '#B45309';
                        ctx.fillText('قيد التقويم ◐', 615, curY + 18);
                    }

                    // Attempts
                    ctx.fillStyle = '#475569';
                    var attText = isQuizOptedOut ? '0 (معطل)' : ('محاولة ' + qAttempts);
                    ctx.fillText(attText, 525, curY + 18);

                    // Max
                    ctx.fillText(qMax.toFixed(2), 450, curY + 18);

                    // Earned
                    ctx.fillStyle = '#6D28D9';
                    ctx.font = 'bold 11px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillText(qEarned.toFixed(2), 370, curY + 18);

                    // Deduct
                    ctx.font = '11px "Segoe UI", Tahoma, sans-serif';
                    if (qDeduct > 0) {
                        ctx.fillStyle = '#DC2626';
                        ctx.fillText('-' + qDeduct.toFixed(2), 295, curY + 18);
                    } else {
                        ctx.fillStyle = '#64748B';
                        ctx.fillText('0.00', 295, curY + 18);
                    }

                    // Notes
                    ctx.textAlign = 'right';
                    ctx.font = '10px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#64748B';
                    var qNote = isQuizOptedOut ? 'تم إلغاء تفعيل الأسئلة وتصفير علامتها.' : (qAttempts === 1 ? 'إجابة صحيحة من المحاولة الأولى (100%).' : (qAttempts === 2 ? 'إجابة صحيحة من المحاولة الثانية (50%).' : 'استنفاد المحاولات (0%).'));
                    ctx.fillText(qNote, 250, curY + 18);

                    curY += 28;
                }
            }

            // Totals Footer Row
            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(80, curY, 1080, 32);
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(80, curY, 1080, 32);

            ctx.textAlign = 'right';
            ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText('المجموع الكلي لأوزان ونقاط المهام والأسئلة:', 1100, curY + 21);

            ctx.textAlign = 'center';
            ctx.fillText(grandTotalMax.toFixed(2), 450, curY + 21);

            ctx.fillStyle = '#1E3A8A';
            ctx.fillText(grandTotalEarned.toFixed(2), 370, curY + 21);

            ctx.fillStyle = '#DC2626';
            ctx.fillText('-' + totalDeductionsInTable.toFixed(2), 295, curY + 21);

            ctx.textAlign = 'right';
            ctx.font = '11px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText('استيفاء ' + grandTotalEarned.toFixed(2) + ' من أصل ' + grandTotalMax.toFixed(2) + ' نقطة مطلوبة', 250, curY + 21);
            curY += 40;

            // 5. Section C: The Math Breakdown Steps
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(80, curY, 1080, 28);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('القسم (ج): التفكيك الحسابي للعلامة (كيف تم احتساب المعدل خطوة بخطوة وفق المنهاج)', 1140, curY + 19);
            curY += 32;

            var mathSteps = [
                { num: '1', lbl: 'مجموع النقاط العملية المستحقة:', val: practicalEarned.toFixed(2) + ' / ' + practicalMax.toFixed(2), sub: 'مجموع النقاط المكتسبة من الخطوات العملية المنجزة', bg: '#F8FAFC' },
                { num: '2', lbl: 'مجموع نقاط الأسئلة التقويمية:', val: (showQuizzes ? (quizEarned.toFixed(2) + ' / ' + quizMax.toFixed(2)) : 'معطلة من الأستاذ'), sub: (showQuizzes ? 'نقاط الأسئلة بحسب عدد المحاولات المستهلكة' : 'تم اعتماد تقييم المهام العملية فقط'), bg: '#F8FAFC' },
                { num: '3', lbl: 'المجموع الإجمالي الخام المكتسب:', val: grandTotalEarned.toFixed(2) + ' / ' + grandTotalMax.toFixed(2), sub: 'مجموع النقاط العملية + نقاط الأسئلة التقويمية', bg: '#F8FAFC' },
                { num: '4', lbl: 'تطبيق القاعدة الثلاثية الرسمية (على 20):', val: baseScoreOutOf20.toFixed(2) + ' / 20.00', sub: '(' + grandTotalEarned.toFixed(2) + ' ÷ ' + grandTotalMax.toFixed(2) + ') × 20', bg: '#F0F9FF' },
                { num: '5', lbl: 'خصم استهلاك التلميحات المساعدة:', val: '-' + pen.toFixed(2) + ' نقطة', sub: 'خصم بيداغوجي وفق معايير سلم التنقيط', bg: '#FEF2F2' },
                { num: '6', lbl: 'العلامة الإجمالية الصافية المستحقة:', val: finalScoreStr + ' / 20.00', sub: 'العلامة النهائية الرسمية المعتمدة لبطاقة التقييم', bg: '#F0FDF4' }
            ];

            for (var mIdx = 0; mIdx < mathSteps.length; mIdx++) {
                var ms = mathSteps[mIdx];
                ctx.fillStyle = ms.bg;
                ctx.fillRect(80, curY, 1080, 28);
                ctx.strokeStyle = '#E2E8F0';
                ctx.lineWidth = 1;
                ctx.strokeRect(80, curY, 1080, 28);

                // Step circle
                ctx.fillStyle = '#2563EB';
                ctx.beginPath();
                ctx.arc(1142, curY + 14, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 11px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ms.num, 1142, curY + 18);

                // Label
                ctx.textAlign = 'right';
                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#0F172A';
                ctx.fillText(ms.lbl, 1120, curY + 19);

                // Value
                ctx.save();
                ctx.direction = 'ltr';
                ctx.textAlign = 'center';
                ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = (mIdx === 5) ? '#15803D' : ((mIdx === 4 && pen > 0) ? '#DC2626' : '#1E3A8A');
                ctx.fillText(ms.val, 550, curY + 19);
                ctx.restore();

                // Subtext / Formula
                ctx.textAlign = 'right';
                ctx.font = '11px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#64748B';
                ctx.fillText(ms.sub, 440, curY + 19);

                curY += 32;
            }

            // 6. Signature & Seal + Teacher Observations (Anchored at Y = 1530)
            var ySig = 1530;
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#64748B';
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(100, ySig, 340, 120);
            ctx.setLineDash([]);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('توقيع وختم الأستاذ(ة)', 270, ySig + 35);

            ctx.textAlign = 'right';
            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText('ملاحظات وتوجيهات الأستاذ(ة):', 1140, ySig + 20);

            ctx.fillStyle = '#94A3B8';
            ctx.fillText('............................................................................................................................................', 1140, ySig + 50);
            ctx.fillText('............................................................................................................................................', 1140, ySig + 80);

            ctx.font = '11.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('حرر في: ' + dateFormatted, 1140, ySig + 110);
            ctx.fillText('وثيقة تقييم رسمية غير قابلة للتعديل صالحة لتقويم الأعمال التطبيقية', 1140, ySig + 128);

            // Convert to JPEG bytes and build PDF
            var dataUrl = canvas.toDataURL('image/jpeg', 0.94);
            var b64Data = dataUrl.split(',')[1];
            var binStr = atob(b64Data);
            var jpegBytes = new Uint8Array(binStr.length);
            for (var bIdx = 0; bIdx < binStr.length; bIdx++) {
                jpegBytes[bIdx] = binStr.charCodeAt(bIdx) & 0xFF;
            }

            var pdfUint8 = buildPdfFromJpegBytes(jpegBytes, 1240, 1754);
            return new Blob([pdfUint8], { type: 'application/pdf' });
        } catch (e) {
            return null;
        }
    }

    function downloadPdfFile(filename, blob) {
        var cleanPdfName = filename.replace(/\.(html?|txt)$/i, '') + '.pdf';
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = cleanPdfName;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1200);
    }
function downloadTextFile(filename, mimeType, content) {
        var blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        }, 800);
    }

    function exportEvaluationCard(opts) {
        opts = opts || {};
        global.Win11Assessment.evaluate();
        var pdfFilename = formatSuggestedFilename('pdf');
        saveReportToDesktop(pdfFilename, null, opts);
        return pdfFilename;
    }

    function triggerPdfExport(customFilename, opts) {
        opts = opts || {};
        var printEl = document.getElementById('print-report-container');
        global.Win11Assessment.evaluate();
        var freshHtml = buildA4Html();
        if (printEl) printEl.innerHTML = freshHtml;
        var prevTitle = document.title;
        var pdfName = customFilename
            ? normalizeExportFilename(customFilename, 'pdf', formatSuggestedFilename('pdf'))
            : allocateUniqueFilename('pdf');
        if (customFilename) {
            var baseKey = (buildFilenameCore('pdf').base + '.pdf').toLowerCase();
            issuedExportCounts[baseKey] = (issuedExportCounts[baseKey] || 0) + 1;
        }
        document.title = pdfName.replace(/\.pdf$/i, '');
        hasExportedPdfFlag = true;

        // Auto-save evaluation report directly to user's Windows Desktop as genuine PDF
        saveReportToDesktop(pdfName, null, opts);
        setTimeout(function () { document.title = prevTitle; }, 1200);
        return pdfName;
    }

    function executeCleanShutdown() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var screenEl = document.getElementById('shutdown-screen');
        if (screenEl) {
            screenEl.innerHTML =
                '<div style="text-align:center;max-width:460px;padding:24px">' +
                    '<div class="shutdown-spinner" style="margin:0 auto 20px"></div>' +
                    '<div style="font-size:18px;font-weight:600;margin-bottom:10px">' + bidi(t('pedagogy.shutDownCompleteText')) + '</div>' +
                    '<button type="button" class="win-btn win-btn-secondary" id="shutdown-restart-btn" style="margin-top:14px">' + bidi(t('pedagogy.newSimBtn')) + '</button>' +
                '</div>';
            screenEl.style.display = 'flex';
            var restartBtn = document.getElementById('shutdown-restart-btn');
            if (restartBtn) {
                restartBtn.onclick = function () {
                    screenEl.style.display = 'none';
                    hasExportedPdfFlag = false;
                    if (global.Win11Assessment && typeof global.Win11Assessment.startNewSimulation === 'function') {
                        global.Win11Assessment.startNewSimulation();
                    }
                    if (global.Win11HUD && typeof global.Win11HUD.open === 'function') {
                        global.Win11HUD.open();
                    }
                };
            }
        }
        if (global.Win11Dialogs && typeof global.Win11Dialogs.close === 'function') {
            global.Win11Dialogs.close(false);
        }
        setTimeout(function () {
            if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                try {
                    global.fetch('/api/shutdown', { method: 'POST' }).catch(function () { });
                } catch (e) { }
            }
            try {
                if (typeof global.close === 'function') global.close();
            } catch (e2) { }
        }, 700);
    }

    function confirmShutdown() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        global.Win11Assessment.evaluate();
        var tasks = global.Win11Assessment.getTasks().filter(function (tk) { return tk.enabled !== false; });
        var unfinished = tasks.filter(function (tk) { return !tk.completed; });

        var unfinishedHtml = '';
        if (unfinished.length > 0) {
            var items = '';
            for (var i = 0; i < unfinished.length; i++) {
                items += '<li style="margin:2px 0">' + bidi(unfinished[i].titleAr + (unfinished[i].skipped ? ' (غير منجزة / متخطاة)' : '')) + '</li>';
            }
            unfinishedHtml =
                '<div class="shutdown-warning-card">' +
                    '<div style="font-weight:700;margin-bottom:4px">' + bidi(t('pedagogy.shutdownUnfinishedWarn')) + '</div>' +
                    '<ul style="margin:4px 0 0;padding-inline-start:20px;font-size:12.5px">' + items + '</ul>' +
                '</div>';
        }

        function renderPdfCardInner(done) {
            return done
                ? ('<div style="font-weight:700">' + bidi(t('pedagogy.shutdownPdfDone')) + '</div>')
                : ('<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
                       '<span style="font-weight:700">' + bidi(t('pedagogy.shutdownPdfWarn')) + '</span>' +
                       '<button type="button" class="win-btn win-btn-accent" id="btn-shutdown-export-pdf">' + bidi(t('pedagogy.shutdownExportPdfBtn')) + '</button>' +
                   '</div>');
        }

        global.Win11Dialogs.showCustom({
            title: t('pedagogy.shutdownTitle'),
            tone: (!hasExportedPdfFlag || unfinished.length > 0) ? 'warning' : 'info',
            wide: true,
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="font-size:13.5px;margin-bottom:12px">' + bidi(t('pedagogy.shutdownAsk')) + '</div>' +
                    unfinishedHtml +
                    '<div class="shutdown-warning-card' + (hasExportedPdfFlag ? ' shutdown-pdf-exported' : '') + '" id="shutdown-pdf-status">' +
                        renderPdfCardInner(hasExportedPdfFlag) +
                    '</div>';
                function wirePdfBtn() {
                    var pdfBtn = wrap.querySelector('#btn-shutdown-export-pdf');
                    if (pdfBtn) {
                        pdfBtn.onclick = function () {
                            triggerPdfExport(null, { skipDialog: true });
                            var box = wrap.querySelector('#shutdown-pdf-status');
                            if (box) {
                                box.className = 'shutdown-warning-card shutdown-pdf-exported';
                                box.innerHTML = renderPdfCardInner(true);
                            }
                        };
                    }
                }
                wirePdfBtn();
            },
            buttons: [
                {
                    id: 'btn-shutdown-confirm',
                    label: t('pedagogy.shutdownConfirmBtn'),
                    primary: true,
                    onClick: function () {
                        executeCleanShutdown();
                        return false;
                    }
                },
                {
                    id: 'btn-shutdown-cancel',
                    label: t('pedagogy.shutdownCancelBtn'),
                    primary: false,
                    value: false
                }
            ]
        });
    }

    function openExportSaveDialog(ext, opts) {
        opts = opts || {};
        var cleanExt = 'pdf'; // STRICT PDF ONLY
        var lang = global.Win11I18N.getLang();
        var bidi = global.Win11I18N.bidiHtml;
        var esc = global.Win11Compat.escapeHtml;
        global.Win11Assessment.evaluate();
        var suggestedName = previewNextFilename('pdf');

        var titleText = (lang === 'fr')
            ? 'Enregistrer le rapport final (PDF)'
            : (lang === 'en'
                ? 'Save Final Evaluation Report (PDF)'
                : 'حفظ ملف تقويم الأعمال التطبيقية (PDF)');
        var labelText = (lang === 'fr') ? 'Nom du fichier :' : (lang === 'en' ? 'File Name:' : 'اسم الملف:');
        var hintText = (lang === 'fr')
            ? 'Le nom généré selon les règles de l\'enseignant est sélectionné. Le document sera exporté au format PDF non modifiable.'
            : (lang === 'en'
                ? 'The teacher-defined filename is pre-selected. The report will be exported as a non-editable PDF.'
                : 'تم اقتراح اسم الملف تلقائياً وفق القواعد الرسمية للأستاذ؛ سيتم استخراج التقرير بصيغة PDF غير قابلة للتعديل.');
        var saveLabel = (lang === 'fr') ? 'Enregistrer PDF' : (lang === 'en' ? 'Save PDF' : 'حفظ بصيغة PDF');
        var cancelLabel = global.Win11I18N.t('app.cancel');

        global.Win11Dialogs.showCustom({
            title: titleText,
            tone: 'info',
            renderBody: function (wrap, dialog) {
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:10px">' +
                        '<label for="export-filename-input" style="font-weight:600;font-size:13px">' + bidi(labelText) + '</label>' +
                        '<input type="text" id="export-filename-input" class="win-input" dir="ltr" style="font-family:Consolas,monospace;font-size:13px" value="' + esc(suggestedName) + '">' +
                        '<div style="font-size:12px;color:var(--win-text-secondary);line-height:1.55">' + bidi(hintText) + '</div>' +
                        '<div id="export-filename-err" style="color:var(--win-danger);font-size:12px;min-height:16px"></div>' +
                    '</div>';
                var inp = wrap.querySelector('#export-filename-input');
                if (inp) {
                    inp.onkeydown = function (ev) {
                        if (ev.key === 'Enter') {
                            ev.preventDefault();
                            var saveBtn = dialog.querySelector('#btn-confirm-export-save');
                            if (saveBtn) saveBtn.click();
                        }
                    };
                    setTimeout(function () {
                        if (document.body.contains(inp)) {
                            inp.focus();
                            inp.select();
                            try { inp.setSelectionRange(0, inp.value.length); } catch (e) { }
                        }
                    }, 0);
                }
            },
            buttons: [
                {
                    id: 'btn-confirm-export-save',
                    label: saveLabel,
                    primary: true,
                    onClick: function (closeDlg) {
                        var inp = document.getElementById('export-filename-input');
                        var errEl = document.getElementById('export-filename-err');
                        var raw = inp ? inp.value.trim() : '';
                        if (!raw) {
                            if (errEl) {
                                errEl.innerHTML = bidi((lang === 'fr') ? 'Veuillez saisir un nom de fichier valide.' : (lang === 'en' ? 'Please enter a valid file name.' : 'يرجى إدخال اسم ملف صالح.'));
                            }
                            if (inp) inp.focus();
                            return true;
                        }
                        var chosenFilename = normalizeExportFilename(raw, 'pdf', suggestedName);
                        closeDlg(true);
                        triggerPdfExport(chosenFilename);
                        if (typeof opts.onExported === 'function') {
                            opts.onExported(chosenFilename);
                        }
                    }
                },
                {
                    id: 'btn-cancel-export-save',
                    label: cancelLabel,
                    primary: false,
                    onClick: function (closeDlg) {
                        closeDlg(false);
                        if (opts.fromCertificate) {
                            setTimeout(function () { openCertificate(); }, 0);
                        }
                    }
                }
            ]
        });
    }

    function openCertificate() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        global.Win11Assessment.evaluate();
        var html = buildA4Html();
        var allTasks = global.Win11Assessment.getTasks().filter(function (tk) { return tk.enabled !== false; });
        var uncompletedTasks = allTasks.filter(function (tk) { return !tk.completed; });
        var doneTasksCount = allTasks.length - uncompletedTasks.length;

        var guidanceBannerHtml = '';
        if (uncompletedTasks.length > 0) {
            var taskListItems = '';
            for (var u = 0; u < uncompletedTasks.length; u++) {
                var utk = uncompletedTasks[u];
                var missingNote = utk.skipped
                    ? 'تم تخطيها — يمكنك العودة وإنجازها'
                    : (utk.doneStepsCount > 0 ? ('منجزة جزئياً: استيفاء ' + utk.doneStepsCount + ' من ' + utk.totalStepsCount + ' خطوات') : 'لم تُنجز بعد — بحاجة للتنفيذ');
                taskListItems +=
                    '<div style="background:#FFFFFF;border:1px solid #FDE68A;border-radius:6px;padding:7px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;">' +
                        '<div style="text-align:right;">' +
                            '<strong style="color:#B45309;font-size:12.5px;">' + bidi(utk.titleAr) + '</strong>' +
                            '<div style="color:#64748B;font-size:11.5px;margin-top:2px;">' + bidi(missingNote) + '</div>' +
                        '</div>' +
                        '<button type="button" class="win-btn win-btn-secondary a4-goto-pending-btn" data-task-id="' + utk.id + '" style="min-height:26px;padding:2px 10px;font-size:11.5px;color:#0067C0;flex-shrink:0;">' +
                            bidi('الانتقال للمهمة ↩') +
                        '</button>' +
                    '</div>';
            }

            guidanceBannerHtml =
                '<div class="a4-guidance-card" style="margin-bottom:16px;background:#FFFBEB;border:1.5px solid #F59E0B;border-radius:8px;padding:12px 16px;text-align:right;box-shadow:0 2px 8px rgba(245,158,11,0.08);">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
                        '<span style="font-size:20px;color:#D97706;line-height:1;">💡</span>' +
                        '<strong style="font-size:14px;color:#92400E;">' + bidi('توجيه تربوي — استكمال مسار الأنشطة العملية:') + '</strong>' +
                    '</div>' +
                    '<div style="font-size:12.5px;color:#78350F;line-height:1.6;margin-bottom:10px;">' +
                        bidi('أحسنت صنعاً بما أنجزته حتى الآن (استيفاء ') + '<strong><bdi dir="ltr">' + doneTasksCount + '</bdi></strong>' + bidi(' من أصل ') + '<strong><bdi dir="ltr">' + allTasks.length + '</bdi></strong>' + bidi(' مهام). لتحقيق التحكم التام في الكفاءات المقررة ورفع علامتك المستحقة، نوصيك باستكمال المهام المتبقية التالية:') +
                    '</div>' +
                    taskListItems +
                    '<div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap;">' +
                        '<button type="button" class="win-btn win-btn-accent" id="a4-btn-resume-all" style="padding:5px 16px;font-weight:700;">' +
                            bidi('مواصلة إنجاز المهام الآن ↩') +
                        '</button>' +
                        '<span style="font-size:11.5px;color:#92400E;">' +
                            bidi('(ملاحظة: يمكنك تصدير بطاقة التقييم الحالية كمعاينة مرحلية، أو إتمام ما تبقى لرفع علامتك).') +
                        '</span>' +
                    '</div>' +
                '</div>';
        } else {
            guidanceBannerHtml =
                '<div class="a4-guidance-card" style="margin-bottom:16px;background:#ECFDF5;border:1.5px solid #107C41;border-radius:8px;padding:12px 16px;text-align:right;box-shadow:0 2px 8px rgba(16,124,65,0.08);">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span style="font-size:22px;color:#107C41;line-height:1;">✔</span>' +
                        '<div>' +
                            '<strong style="font-size:14px;color:#065F46;">' + bidi('مبارك! تم إنجاز كافة المهام المقررة بنجاح وبتحكم تام (100%).') + '</strong>' +
                            '<div style="font-size:12px;color:#166534;margin-top:2px;">' + bidi('لقد تم تثبيت وقت إنجازك النهائي، ويمكنك الآن تصدير بطاقة تقييمك الرسمية كملف PDF على سطح المكتب.') + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        var dialogButtons = [];
        if (uncompletedTasks.length > 0) {
            dialogButtons.push({
                id: 'btn-resume-tasks',
                label: 'مواصلة إنجاز المهام ↩',
                primary: true,
                onClick: function (closeDlg) {
                    closeDlg();
                    if (global.Win11HUD) global.Win11HUD.open();
                }
            });
            dialogButtons.push({
                id: 'btn-export-pdf',
                label: t('pedagogy.exportPdfBtn') + ' (الوضع الحالي)',
                primary: false,
                onClick: function (closeDlg) {
                    closeDlg('export_pdf');
                    setTimeout(function () {
                        var pdfFilename = allocateUniqueFilename('pdf');
                        triggerPdfExport(pdfFilename);
                    }, 0);
                }
            });
        } else {
            dialogButtons.push({
                id: 'btn-export-pdf',
                label: t('pedagogy.exportPdfBtn'),
                primary: true,
                onClick: function (closeDlg) {
                    closeDlg('export_pdf');
                    setTimeout(function () {
                        var pdfFilename = allocateUniqueFilename('pdf');
                        triggerPdfExport(pdfFilename);
                    }, 0);
                }
            });
        }
        dialogButtons.push({
            id: 'btn-print-paper',
            label: 'طباعة فورية',
            primary: false,
            onClick: function () {
                triggerPdfExport();
            }
        });
        dialogButtons.push({ label: t('app.close'), primary: false, value: false });

        global.Win11Dialogs.showCustom({
            title: t('pedagogy.reportBtn'),
            tone: 'info',
            wide: true,
            renderBody: function (wrap) {
                wrap.innerHTML = guidanceBannerHtml + html;
                setTimeout(function () {
                    var contentBox = document.querySelector('#dialog-backdrop .win-dialog-content');
                    if (contentBox) contentBox.scrollTop = 0;
                }, 0);

                var resumeBtns = wrap.querySelectorAll('.a4-goto-pending-btn, #a4-btn-resume-all');
                for (var rb = 0; rb < resumeBtns.length; rb++) {
                    resumeBtns[rb].onclick = function () {
                        var tid = this.getAttribute('data-task-id');
                        if (global.Win11Dialogs && typeof global.Win11Dialogs.close === 'function') {
                            global.Win11Dialogs.close(false);
                        }
                        if (global.Win11HUD) {
                            global.Win11HUD.open();
                            if (tid) {
                                var allOrdered = global.Win11Assessment.getTasks().filter(function (x) { return x.enabled !== false; });
                                for (var oi = 0; oi < allOrdered.length; oi++) {
                                    if (allOrdered[oi].id === Number(tid)) {
                                        var tabBtn = document.querySelector('[data-hud-tab="' + oi + '"]');
                                        if (tabBtn && tabBtn.getAttribute('data-hud-locked') !== '1') {
                                            tabBtn.click();
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    };
                }
            },
            buttons: dialogButtons
        });
    }

    global.Win11Report = {
        openStudentRegistration: openStudentRegistration,
        injectPlainStudentFormFallback: injectPlainStudentFormFallback,
        saveReportToDesktop: saveReportToDesktop,
        exportEvaluationCard: exportEvaluationCard,
        showExportSuccessToast: showExportSuccessToast,
        showExportSuccessDialog: showExportSuccessDialog,
        dismissExportSuccessToast: dismissExportSuccessToast,
        confirmNewSimulation: confirmNewSimulation,
        confirmShutdown: confirmShutdown,
        triggerPdfExport: triggerPdfExport,
        openExportSaveDialog: openExportSaveDialog,
        hasExportedPdf: function () { return hasExportedPdfFlag; },
        setExportedPdf: function (v) { hasExportedPdfFlag = !!v; },
        cleanFileToken: cleanFileToken,
        openCertificate: openCertificate,
        formatSuggestedFilename: formatSuggestedFilename,
        allocateUniqueFilename: allocateUniqueFilename,
        buildA4Html: buildA4Html,
        buildStandaloneHtmlDoc: buildStandaloneHtmlDoc
    };
})(window);
