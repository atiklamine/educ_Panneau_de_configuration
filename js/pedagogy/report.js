/**
 * Algerian 1AS Evaluation Certificate, Token Filename Builder & Offline Report Exporters
 */
(function (global) {
    'use strict';

    var cachedLogoImg = null;
    var cachedLogoB64 = '';

    function preloadLogo(b64) {
        if (!b64 || typeof Image === 'undefined' || b64 === 'none' || String(b64).indexOf('data:image/') !== 0) {
            cachedLogoImg = null;
            cachedLogoB64 = '';
            return;
        }
        if (cachedLogoImg && cachedLogoB64 === b64 && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
            return;
        }
        try {
            var img = new Image();
            img.onload = function () {
                cachedLogoImg = img;
                cachedLogoB64 = b64;
            };
            img.src = b64;
            if (img.complete && img.naturalWidth > 0) {
                cachedLogoImg = img;
                cachedLogoB64 = b64;
            }
        } catch (e) {}
    }

    function ensureLogoReady(b64, callback) {
        if (!b64 || typeof Image === 'undefined' || b64 === 'none' || String(b64).indexOf('data:image/') !== 0) {
            if (callback) callback();
            return;
        }
        if (cachedLogoImg && cachedLogoB64 === b64 && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
            if (callback) callback();
            return;
        }
        try {
            var img = new Image();
            var called = false;
            function done() {
                if (!called) {
                    called = true;
                    if (img.complete && img.naturalWidth > 0) {
                        cachedLogoImg = img;
                        cachedLogoB64 = b64;
                    }
                    if (callback) callback();
                }
            }
            img.onload = done;
            img.onerror = done;
            img.src = b64;
            if (img.complete && img.naturalWidth > 0) {
                done();
            } else {
                setTimeout(done, 150);
            }
        } catch (e) {
            if (callback) callback();
        }
    }

    var DEFAULT_MINISTRY_LOGO_B64 = "data:image/jpeg;base64,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";
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
            '<span class="export-toast-icon">' + (global.Win11Icons ? global.Win11Icons.get('check', 16) : '✓') + '</span>' +
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
                '<div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:8px 12px;font-size:12px;color:#065F46;text-align:right;line-height:1.5;display:flex;align-items:center;gap:6px;">' +
                    (global.Win11Icons ? global.Win11Icons.get('check', 14) : '') +
                    '<strong>' + bidi('تهانينا! تم إنجاز كافة المهام بنجاح (100%) وتثبيت وقت إنجازك النهائي.') + '</strong>' +
                '</div>';
        } else {
            var doneCount = allTasks.length - uncompletedTasks.length;
            statusNoteHtml =
                '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:8px 12px;font-size:12px;color:#92400E;text-align:right;line-height:1.5;display:flex;align-items:flex-start;gap:6px;">' +
                    (global.Win11Icons ? global.Win11Icons.get('bulb', 14) : '') +
                    '<div><strong>' + bidi('تنبيه توضيحي:') + '</strong> ' +
                    bidi('تم استيفاء ') + '<strong dir="ltr">' + doneCount + '</strong>' + bidi(' من أصل ') + '<strong dir="ltr">' + allTasks.length + '</strong>' + bidi(' مهام. تم حفظ هذا التقرير كمعاينة مرحلية؛ يمكنك الضغط على «مواصلة المحاكاة» لإتمام ما تبقى ورفع علامتك المستحقة.') + '</div>' +
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
                id: 'btn-resume-sim-dlg',
                label: 'مواصلة المحاكاة',
                primary: false,
                value: false
            },
            {
                id: 'btn-new-sim-dlg',
                label: 'محاكاة جديدة',
                primary: false,
                onClick: function (closeDlg) {
                    closeDlg(true);
                    confirmNewSimulation();
                }
            },
            {
                id: 'btn-exit-app-dlg',
                label: 'خروج من البرنامج',
                primary: false,
                onClick: function (closeDlg) {
                    closeDlg(true);
                    confirmShutdown();
                }
            }
        ];

        global.Win11Dialogs.showCustom({
            title: 'تأكيد استخراج وحفظ بطاقة التقييم',
            tone: 'info',
            wide: true,
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:12px;text-align:center;padding:4px 0">' +
                        '<div style="display:flex;justify-content:center;color:#107C41;line-height:1">' + (global.Win11Icons ? global.Win11Icons.get('check', 40) : '✓') + '</div>' +
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
        var cfg = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : {};
        ensureLogoReady(cfg.report_logo_b64, function () {
            saveReportToDesktopInner(filename, onComplete, opts);
        });
    }

    function saveReportToDesktopInner(filename, onComplete, opts) {
        opts = opts || {};
        var cfg = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : {};
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
                var u8 = generateReportPdfUint8();
                if (u8 && u8.length > 0) {
                    b64 = uint8ToBase64(u8);
                }
            } catch (e) {
                b64 = '';
            }
            if (!b64) {
                try {
                    b64 = global.btoa(unescape(encodeURIComponent(htmlContent)));
                } catch (e2) {
                    b64 = '';
                }
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
                    '<label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:4px">' + bidi('نظام التقويم والأسئلة:') + '</label>' +
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
        return (cleaned || 'NA').toUpperCase();
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
            : 'Class_{class}_PC_{device}_Score_{score}_Time_{time}_Student_{student_lastname}_{student_firstname}';

        var nameParts = (stu.lastName && stu.firstName)
            ? { lastname: cleanFileToken(stu.lastName), firstname: cleanFileToken(stu.firstName) }
            : splitStudentName(stu.fullName);
        if (stu.participants && Array.isArray(stu.participants) && stu.participants.length > 1) {
            nameParts.lastname = stu.participants.map(function (p) { return cleanFileToken(p.lastName || ''); }).filter(Boolean).join('_');
            nameParts.firstname = stu.participants.map(function (p) { return cleanFileToken(p.firstName || ''); }).filter(Boolean).join('_');
        }
        var timeTok = (typeof global.Win11Assessment.formatDurationToken === 'function')
            ? global.Win11Assessment.formatDurationToken(stu.elapsedSeconds)
            : (String(stu.elapsedSeconds || 0) + 's');
        var nowDt = (global.Win11State && typeof global.Win11State.getSimulatedNow === 'function')
            ? global.Win11State.getSimulatedNow()
            : new Date();

        var devNum = stu.pcNumber || stu.deviceNumber || (cfg && cfg.default_device) || '01';
        var tokens = {
            '{class}': cleanFileToken(stu.classGroup || (cfg && cfg.class_groups && cfg.class_groups[0]) || '01'),
            '{device}': cleanFileToken(devNum),
            '{score}': scores.net.toFixed(2),
            '{time}': cleanFileToken(timeTok),
            '{student_lastname}': (nameParts.lastname || 'NA').toUpperCase(),
            '{student_firstname}': (nameParts.firstname || 'NA').toUpperCase(),
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

                    // Gather extra participants (if added)
                    var allParticipants = [{ lastName: ln, firstName: fn }];
                    var extraRows = document.querySelectorAll('.stu-extra-participant-row');
                    var extraErr = false;
                    for (var r = 0; r < extraRows.length; r++) {
                        var eLnEl = extraRows[r].querySelector('.stu-extra-ln');
                        var eFnEl = extraRows[r].querySelector('.stu-extra-fn');
                        var eln = eLnEl ? eLnEl.value.trim() : '';
                        var efn = eFnEl ? eFnEl.value.trim() : '';
                        if (eln || efn) {
                            if (eln.length < 2 || efn.length < 2 || !/[A-Za-z\u0600-\u06FF]/.test(eln + efn)) {
                                extraErr = true;
                                break;
                            }
                            allParticipants.push({ lastName: eln, firstName: efn });
                        }
                    }
                    if (extraErr) {
                        if (errEl) errEl.innerHTML = bidi('يرجى إدخال اللقب والاسم بشكل صحيح (حرفين على الأقل) لكل مشارك مضاف.');
                        return true;
                    }

                    var combinedFull = allParticipants.map(function (p) {
                        return ((p.lastName || '') + ' ' + (p.firstName || '')).trim();
                    }).join(' + ');

                    if (isEditOnly) {
                        if (typeof global.Win11Assessment.updateStudentInfo === 'function') {
                            global.Win11Assessment.updateStudentInfo({
                                lastName: ln,
                                firstName: fn,
                                fullName: combinedFull,
                                participants: allParticipants,
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
                        fullName: combinedFull,
                        participants: allParticipants,
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
            title: isEditOnly ? (t('pedagogy.editInfoHeader') || 'تعديل معلومات المشاركين في المحاكاة') : (t('pedagogy.loginHeader') || 'معلومات المشاركين في المحاكاة (عمل تطبيقي)'),
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
                        '<div style="border:1px solid var(--win-border-control);border-radius:6px;padding:8px 10px;background:var(--win-surface-subtle)">' +
                            '<div style="font-weight:700;font-size:12.5px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">' +
                                '<span>' + bidi('المشاركون في العمل التطبيقي (تلميذ فردي أو عمل مشترك):') + '</span>' +
                                '<span style="font-size:11px;font-weight:normal;color:var(--win-text-secondary);">' + bidi('حد أقصى 3 تلاميذ لكل جهاز') + '</span>' +
                            '</div>' +
                            '<div style="display:flex;flex-direction:column;gap:6px" id="stu-participants-list">' +
                                '<div class="stu-participant-row" style="display:flex;flex-direction:column;gap:3px">' +
                                    '<span style="font-size:11.5px;font-weight:600;color:var(--win-accent);">' + bidi('المشارك 1 (الأساسي):') + '</span>' +
                                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
                                        '<div>' +
                                            '<label style="display:block;font-size:11.5px;font-weight:600;margin-bottom:2px">' + bidi(t('pedagogy.lastNameLabel')) + '</label>' +
                                            '<input type="text" id="stu-reg-lastname" class="win-input" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.lastNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(initLn) + '" autocomplete="off" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                                        '</div>' +
                                        '<div>' +
                                            '<label style="display:block;font-size:11.5px;font-weight:600;margin-bottom:2px">' + bidi(t('pedagogy.firstNameLabel')) + '</label>' +
                                            '<input type="text" id="stu-reg-firstname" class="win-input" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.firstNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(initFn) + '" autocomplete="off" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div id="stu-extra-participants" style="display:flex;flex-direction:column;gap:6px;"></div>' +
                            '</div>' +
                            '<div style="margin-top:6px;">' +
                                '<button type="button" id="stu-add-part-btn" class="win-btn win-btn-secondary" style="font-size:11.5px;padding:3px 10px;display:inline-flex;align-items:center;gap:4px;">' +
                                    '<span>+</span> ' + bidi('إضافة تلميذ مشارك (عمل مشترك)') +
                                '</button>' +
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
                            '<div style="font-weight:600;margin-bottom:6px">' + bidi('الأسئلة التقويمية:') + '</div>' +
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

                // Handle dynamic addition of extra participants
                var extraContainer = wrap.querySelector('#stu-extra-participants');
                var addPartBtn = wrap.querySelector('#stu-add-part-btn');

                function updateAddButtonVisibility() {
                    if (!extraContainer || !addPartBtn) return;
                    var currentRows = extraContainer.querySelectorAll('.stu-extra-participant-row').length;
                    if (currentRows >= 2) { // 1 primary + 2 extra = 3 max
                        addPartBtn.style.display = 'none';
                    } else {
                        addPartBtn.style.display = 'inline-flex';
                    }
                }

                function addParticipantRow(extraLastName, extraFirstName) {
                    if (!extraContainer) return;
                    var rowIdx = extraContainer.querySelectorAll('.stu-extra-participant-row').length + 2;
                    var row = document.createElement('div');
                    row.className = 'stu-extra-participant-row';
                    row.style.cssText = 'padding:6px 8px;border:1px dashed var(--win-border-control);border-radius:6px;background:rgba(0,103,192,0.03);display:flex;flex-direction:column;gap:3px;';
                    row.innerHTML =
                        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                            '<span style="font-size:11.5px;font-weight:600;color:var(--win-accent);">' + bidi('المشارك ' + rowIdx + ':') + '</span>' +
                            '<button type="button" class="win-btn win-btn-danger stu-part-del-btn" style="padding:1px 6px;font-size:11px;">' + bidi('حذف') + '</button>' +
                        '</div>' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
                            '<div>' +
                                '<input type="text" class="win-input stu-extra-ln" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.lastNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(extraLastName || '') + '" autocomplete="off">' +
                            '</div>' +
                            '<div>' +
                                '<input type="text" class="win-input stu-extra-fn" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.firstNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(extraFirstName || '') + '" autocomplete="off">' +
                            '</div>' +
                        '</div>';
                    row.querySelector('.stu-part-del-btn').onclick = function () {
                        if (row.parentNode) row.parentNode.removeChild(row);
                        updateAddButtonVisibility();
                    };
                    extraContainer.appendChild(row);
                    updateAddButtonVisibility();
                }

                if (addPartBtn) {
                    addPartBtn.onclick = function () {
                        addParticipantRow('', '');
                    };
                }

                // If editing and student already has extra participants:
                if (stu.participants && Array.isArray(stu.participants) && stu.participants.length > 1) {
                    for (var ep = 1; ep < stu.participants.length; ep++) {
                        addParticipantRow(stu.participants[ep].lastName, stu.participants[ep].firstName);
                    }
                }
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

        // 1. Logo & Identification Metadata (Strict: ONLY teacher logo from inf.dll, NO fallback emblem)
        var activeLogoB64 = '';
        if (cfg.show_logo !== false && cfg.report_logo_b64 && String(cfg.report_logo_b64).indexOf('data:image/') === 0 && cfg.report_logo_b64 !== 'none') {
            activeLogoB64 = cfg.report_logo_b64;
        }

        var logoHtml = activeLogoB64
            ? '<img src="' + activeLogoB64 + '" alt="شعار المؤسسة" style="max-height:58px;max-width:95px;object-fit:contain;vertical-align:middle;display:inline-block;">'
            : '';

        var reportNumber = stu.reportNumber || (function () {
            var d = new Date();
            var yr = d.getFullYear();
            var mo = String(d.getMonth() + 1).padStart(2, '0');
            var da = String(d.getDate()).padStart(2, '0');
            var dev = String(stu.pcNumber || cfg.default_device || '01').padStart(2, '0');
            return 'REP-' + yr + mo + da + '-' + dev;
        })();

        var isAllDone = (enabledTasks.length > 0 && doneTasksCount === enabledTasks.length);
        var isZeroDone = (doneTasksCount === 0);
        var isPartDone = (!isAllDone && !isZeroDone);

        var timeCardCls = isAllDone ? 'is-done' : (isZeroDone ? 'is-fail' : 'is-partial');
        var timeBadgeIcon = isAllDone
            ? (global.Win11Icons ? global.Win11Icons.get('check', 11) : '✔')
            : (isPartDone
                ? (global.Win11Icons ? global.Win11Icons.get('circleHalf', 11) : '⚠️')
                : (global.Win11Icons ? global.Win11Icons.get('fail', 10) : '✘'));

        var timeBadgeText = '';
        var timeClarifierText = '';
        if (isAllDone) {
            timeBadgeText = 'جلسة مكتملة ومستوفاة لكافة المهام (' + doneTasksCount + ' / ' + enabledTasks.length + ' مهام — 100%)';
            timeClarifierText = 'تم تثبيت وقت الإنجاز النهائي لكافة المهام';
        } else if (isPartDone) {
            var remainingTasks = enabledTasks.length - doneTasksCount;
            timeBadgeText = 'جلسة غير مكتملة — منجزة جزئياً (' + doneTasksCount + ' / ' + enabledTasks.length + ' مهام — ' + completionPct + '%)';
            timeClarifierText = 'توقيت استخراج التقرير (الجلسة غير مكتملة — بقيت ' + remainingTasks + ' مهام)';
        } else {
            timeBadgeText = 'جلسة غير منجزة (0 / ' + enabledTasks.length + ' مهام — 0%)';
            timeClarifierText = 'توقيت استخراج التقرير (لم تُنجز أي مهمة عملية)';
        }

        var sessionProgressBadgeHtml = '';
        if (isAllDone) {
            sessionProgressBadgeHtml = '<span class="a4-pass-badge is-pass" style="font-size:10.5px;padding:2px 8px;">✔ ' + bidi('مكتملة بالكامل') + ' (<bdi dir="ltr">' + doneTasksCount + ' / ' + enabledTasks.length + '</bdi> — <bdi dir="ltr">100%</bdi>)</span>';
        } else if (isPartDone) {
            sessionProgressBadgeHtml = '<span class="a4-pass-badge is-partial" style="font-size:10.5px;padding:2px 8px;background:#FFFBEB;color:#B45309;border:1px solid #D97706;">⚠️ ' + bidi('منجزة جزئياً') + ' (<bdi dir="ltr">' + doneTasksCount + ' / ' + enabledTasks.length + '</bdi> — <bdi dir="ltr">' + completionPct + '%</bdi>)</span>';
        } else {
            sessionProgressBadgeHtml = '<span class="a4-pass-badge is-fail" style="font-size:10.5px;padding:2px 8px;">✘ ' + bidi('غير منجزة') + ' (<bdi dir="ltr">0 / ' + enabledTasks.length + '</bdi> — <bdi dir="ltr">0%</bdi>)</span>';
        }

        var studentName = (stu.lastName || '') + ' ' + (stu.firstName || stu.fullName || '');
        var pcNum = global.Win11Compat.escapeHtml(String(stu.pcNumber || cfg.default_device || '01'));

        // ==========================================
        // 2. TOP SCORE & DURATION HIGHLIGHT BAR (HIGHLIGHTED AT VERY TOP BEFORE DETAILS)
        // ==========================================
        var passBadgeIcon = isPassed
            ? (global.Win11Icons ? global.Win11Icons.get('check', 11) : '✔')
            : (global.Win11Icons ? global.Win11Icons.get('fail', 10) : '✕');
        var passBadgeText = isPassed ? 'مستوفٍ لمعيار النجاح — معتمد' : ('دون المعدل المطلوب — ' + (scores.appreciation || 'قريب من المتوسط'));

        var durSubText = isAllDone
            ? 'تم تثبيت وقت الإنجاز النهائي لكافة المهام'
            : timeClarifierText;
        var durBadgeText = isAllDone
            ? ('✔ جلسة مكتملة ومستوفاة لكافة المهام (' + doneTasksCount + ' / ' + enabledTasks.length + ' مهام — 100%)')
            : timeBadgeText;

        var topSummaryCardHtml =
            '<div class="a4-top-summary-card" style="margin:8px 0 12px 0;">' +
                '<div class="a4-tsc-score ' + (isPassed ? 'is-pass' : 'is-fail') + '">' +
                    '<div class="a4-tsc-title">' + bidi('العلامة النهائية المستحقة:') + '</div>' +
                    '<div class="a4-tsc-grade" dir="ltr" style="direction:ltr !important;"><bdi dir="ltr"><span class="a4-score-earned">' + finalScoreStr + '</span> <span class="a4-tsc-out">/ 20.00</span></bdi></div>' +
                    '<div style="font-size:11px;font-weight:700;color:' + (isPassed ? '#15803D' : '#B45309') + ';margin:2px 0;"><bdi dir="ltr">(' + finalScoreStr + ' ' + bidi('من أصل') + ' 20.00)</bdi></div>' +
                    '<div class="a4-tsc-badge"><span class="a4-pass-badge ' + (isPassed ? 'is-pass' : 'is-fail') + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + passBadgeIcon + ' <span>' + bidi(passBadgeText) + '</span></span></div>' +
                '</div>' +
                '<div class="a4-tsc-time ' + (isAllDone ? 'is-done' : 'is-partial') + '">' +
                    '<div class="a4-tsc-title">' + bidi('الوقت الإجمالي المستغرق:') + '</div>' +
                    '<div class="a4-tsc-grade"><bdi dir="ltr">' + bidi(totalDurationStr) + '</bdi></div>' +
                    '<div style="font-size:11px;font-weight:600;color:' + (isAllDone ? '#15803D' : '#B45309') + ';margin:2px 0;">' + bidi(durSubText) + '</div>' +
                    '<div class="a4-tsc-badge"><span class="a4-badge ' + (isAllDone ? 'is-done' : 'is-partial') + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;"><span>' + bidi(durBadgeText) + '</span></span></div>' +
                '</div>' +
            '</div>';

        // ==========================================
        // 3. SECTION A: PARTICIPANTS TABLE & SESSION DETAILS
        // Last names in one column, First names in another column in an organized table!
        // ==========================================
        var isMultiStudent = Array.isArray(stu.participants) && stu.participants.length > 1;
        var participantRowsHtml = '';

        if (isMultiStudent) {
            participantRowsHtml = stu.participants.map(function (p, idx) {
                var l = String(p.lastName || '—').trim().toUpperCase();
                var f = String(p.firstName || '—').trim().toUpperCase();
                return '<tr style="border-bottom:1px solid #E2E8F0;">' +
                    '<td style="padding:4px 6px;text-align:center;font-weight:700;color:#1E3A8A;background:#F8FAFC;">' + (idx + 1) + '</td>' +
                    '<td style="padding:4px 8px;text-align:right;font-weight:700;color:#0F172A;">' + bidi(l) + '</td>' +
                    '<td style="padding:4px 8px;text-align:right;font-weight:700;color:#0F172A;">' + bidi(f) + '</td>' +
                '</tr>';
            }).join('');
        } else {
            var sL = String(stu.lastName || '—').trim().toUpperCase();
            var sF = String(stu.firstName || stu.fullName || '—').trim().toUpperCase();
            participantRowsHtml =
                '<tr style="border-bottom:1px solid #E2E8F0;">' +
                    '<td style="padding:5px 6px;text-align:center;font-weight:700;color:#1E3A8A;background:#F8FAFC;">1</td>' +
                    '<td style="padding:5px 8px;text-align:right;font-weight:700;color:#0F172A;">' + bidi(sL) + '</td>' +
                    '<td style="padding:5px 8px;text-align:right;font-weight:700;color:#0F172A;">' + bidi(sF) + '</td>' +
                '</tr>';
        }

        var studentBoxHtml =
            '<div class="a4-section-title">' +
                '<span>' + bidi('القسم (أ): بيانات التلميذ والجلسة التقويمية') + '</span>' +
                '<span style="font-size:11px;color:#475569;font-weight:normal;">' + bidi('بيانات رسمية معتمدة') + '</span>' +
            '</div>' +
            '<div class="a4-student-box a4-student-box-v2" style="background:#FFFFFF;border:1.2px solid #CBD5E1;border-radius:6px;padding:10px 14px;margin:8px 0 12px 0;box-sizing:border-box;">' +
                '<table style="width:100%;border-collapse:collapse;table-layout:fixed;">' +
                    '<tbody>' +
                        '<tr>' +
                            '<td style="width:52%;vertical-align:top;padding-left:14px;border-left:1.5px solid #E2E8F0;text-align:right;">' +
                                '<div style="font-size:11px;color:#64748B;font-weight:700;margin-bottom:6px;border-bottom:1px solid #F1F5F9;padding-bottom:4px;">' +
                                    bidi(isMultiStudent ? 'المشاركون في العمل التطبيقي (جدول الألقاب والأسماء):' : 'اسم ولقب التلميذ(ة):') +
                                '</div>' +
                                '<table class="a4-part-table" style="width:100%;border-collapse:collapse;border:1px solid #CBD5E1;border-radius:4px;overflow:hidden;font-size:12px;">' +
                                    '<thead>' +
                                        '<tr style="background:#F1F5F9;border-bottom:1.5px solid #CBD5E1;color:#475569;font-size:11px;font-weight:700;">' +
                                            '<th style="padding:4px 6px;width:12%;text-align:center;">#</th>' +
                                            '<th style="padding:4px 8px;width:44%;text-align:right;">' + bidi('اللقب') + '</th>' +
                                            '<th style="padding:4px 8px;width:44%;text-align:right;">' + bidi('الاسم') + '</th>' +
                                        '</tr>' +
                                    '</thead>' +
                                    '<tbody>' +
                                        participantRowsHtml +
                                    '</tbody>' +
                                '</table>' +
                            '</td>' +
                            '<td style="width:48%;vertical-align:top;padding-right:14px;text-align:right;">' +
                                '<div style="font-size:11px;color:#64748B;font-weight:700;margin-bottom:6px;border-bottom:1px solid #F1F5F9;padding-bottom:4px;">' +
                                    bidi('بيانات الفوج والجلسة التقويمية:') +
                                '</div>' +
                                '<div style="margin-bottom:6px;font-size:12px;color:#0F172A;">' +
                                    '<span style="color:#64748B;font-weight:600;">' + bidi('الفوج التربوي ورقم الجهاز:') + '</span> ' +
                                    '<strong>' + bidi(stu.classGroup || '1AS') + '</strong> &nbsp;|&nbsp; <span>' + bidi('حاسوب') + ' <bdi dir="ltr">#' + pcNum + '</bdi></span>' +
                                '</div>' +
                                '<div style="margin-bottom:6px;font-size:12px;color:#0F172A;">' +
                                    '<span style="color:#64748B;font-weight:600;">' + bidi('طبيعة النشاط ونمط المحاكاة:') + '</span> ' +
                                    '<strong>' + bidi(sessionLabel) + '</strong>' + (isMultiStudent ? (' <span style="font-size:10.5px;color:#0284C7;font-weight:700;">(' + bidi('عمل مشترك') + ')</span>') : '') +
                                '</div>' +
                                '<div style="margin-bottom:6px;font-size:12px;color:#0F172A;">' +
                                    '<span style="color:#64748B;font-weight:600;">' + bidi('تاريخ وتوقيت الإنجاز:') + '</span> ' +
                                    '<strong><bdi dir="ltr">' + bidi(dateFormatted) + '</bdi></strong>' +
                                '</div>' +
                                '<div style="font-size:12px;color:#0F172A;">' +
                                    '<span style="color:#64748B;font-weight:600;">' + bidi('رقم التقرير:') + '</span> ' +
                                    '<strong style="color:#1E3A8A;"><bdi dir="ltr">' + esc(reportNumber) + '</bdi></strong> &nbsp;|&nbsp; ' + sessionProgressBadgeHtml +
                                '</div>' +
                            '</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>';

        // ==========================================
        // 4. SECTION B: DETAILED BREAKDOWN TABLE ROWS
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
            var badgeIcon = isDone
                ? (global.Win11Icons ? global.Win11Icons.get('check', 11) : '✓')
                : (isPart
                    ? (global.Win11Icons ? global.Win11Icons.get('circleHalf', 11) : '')
                    : (isSkip
                        ? (global.Win11Icons ? global.Win11Icons.get('skip', 11) : '>>')
                        : (global.Win11Icons ? global.Win11Icons.get('fail', 10) : '✗')));
            var badgeLabel = isDone ? 'مكتملة' : (isPart ? 'منجزة جزئياً' : (isSkip ? 'تم تخطيها' : 'غير منجزة'));
            var badgeHtml = '<span class="a4-badge ' + badgeCls + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + badgeIcon + ' <span>' + bidi(badgeLabel) + '</span></span>';

            var tkMax = Number(tk.maxPoints || tk.coefficient || 1);
            var tkEarned = Number(tk.earnedPoints || 0);
            var tkDeduct = Number((tkMax - tkEarned).toFixed(2));
            if (tkDeduct > 0) totalDeductionsInTable += tkDeduct;

            var reasonTxt = '';
            if (isDone) {
                reasonTxt = 'تم إنجاز كافة خطوات المهمة بنجاح (' + tkMax.toFixed(2) + ' من ' + tkMax.toFixed(2) + ' نقطة).';
            } else if (isSkip) {
                reasonTxt = 'تم تخطي المهمة بطلب من التلميذ؛ خصم كامل علامة المهمة (-' + tkMax.toFixed(2) + ' نقطة).';
            } else if (isPart) {
                var doneSt = (tk.doneStepsCount !== undefined && tk.totalStepsCount) ? ('إنجاز ' + tk.doneStepsCount + ' من ' + tk.totalStepsCount + ' خطوات: ') : '';
                reasonTxt = doneSt + (tk.deductReasons && tk.deductReasons.length > 0 ? tk.deductReasons.join('؛ ') : 'تم استيفاء جزء من الخطوات وخصم المتبقي.');
            } else if (tk.deductReasons && tk.deductReasons.length > 0) {
                reasonTxt = tk.deductReasons.join('؛ ');
            } else {
                reasonTxt = 'لم يتم إنجاز الخطوات العملية المطلوبة للمهمة (خصم -' + tkMax.toFixed(2) + ' نقطة).';
            }

            // Practical Task Row
            rowsHtml +=
                '<tr>' +
                    '<td style="text-align:center;font-weight:700;color:#64748B;">' + (i + 1) + '</td>' +
                    '<td><strong>' + bidi(tk.titleAr) + '</strong>' + (tk.critical ? ' <span class="a4-crit-badge">(أساسية)</span>' : '') + '</td>' +
                    '<td style="text-align:center;"><span class="a4-type-badge is-task">مهمة عملية</span></td>' +
                    '<td style="text-align:center;">' + badgeHtml + '</td>' +
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
                var qStatusHtml = '';
                var qNameText = '';
                var qAttemptsCellHtml = '';
                var qEarnedCellHtml = '';
                var qNotes = '';

                var isQuizSkippedAll = !!(qRes && qRes.skippedAll) || (!qRes && stu.quizSkippedAll);
                var isQuizSkippedCurrent = !!(qRes && qRes.skipped && !qRes.skippedAll);

                if (isQuizSkippedAll) {
                    qEarned = 0;
                    qAttempts = (qRes && qRes.attempts) ? qRes.attempts : 0;
                    qDeduct = qMax;
                    totalDeductionsInTable += qDeduct;
                    qStatusCls = 'is-skipped';
                    qStatusText = 'تم التخطي (الكل)';
                    var qIcon = (global.Win11Icons ? global.Win11Icons.get('skip', 11) : '>>');
                    qStatusHtml = '<span class="a4-badge is-skipped" style="background:#FEF3C7;color:#92400E;border:1px solid #FCD34D;display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + qIcon + ' <span>' + bidi(qStatusText) + '</span></span>';
                    qNotes = 'تم تخطي السؤال تلقائياً بطلب التلميذ (تخطي كافة الأسئلة)؛ خصم علامة السؤال (-' + qMax.toFixed(2) + ' ن).';
                    qNameText = (qRes && qRes.questionTitle) ? qRes.questionTitle : ('سؤال تقويمي للمهمة ' + (i + 1));
                    qAttemptsCellHtml = (qAttempts > 0) ? ('<bdi dir="ltr">' + qAttempts + '</bdi>') : '<span style="color:#64748B;">-</span>';
                    qEarnedCellHtml = '<bdi dir="ltr">0.00</bdi><div style="font-size:8.5px;color:#64748B;line-height:1;">(0%)</div>';
                } else if (isQuizSkippedCurrent) {
                    qEarned = 0;
                    qAttempts = (qRes && qRes.attempts) ? qRes.attempts : 1;
                    qDeduct = qMax;
                    totalDeductionsInTable += qDeduct;
                    qStatusCls = 'is-skipped';
                    qStatusText = 'تم التخطي';
                    var qIcon = (global.Win11Icons ? global.Win11Icons.get('skip', 11) : '>>');
                    qStatusHtml = '<span class="a4-badge is-skipped" style="background:#FEF3C7;color:#92400E;border:1px solid #FCD34D;display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + qIcon + ' <span>' + bidi(qStatusText) + '</span></span>';
                    qNotes = 'تم تخطي هذا السؤال بطلب من التلميذ؛ خصم علامة السؤال (-' + qMax.toFixed(2) + ' ن).';
                    qNameText = (qRes && qRes.questionTitle) ? qRes.questionTitle : ('سؤال تقويمي للمهمة ' + (i + 1));
                    qAttemptsCellHtml = '<bdi dir="ltr">' + qAttempts + '</bdi>';
                    qEarnedCellHtml = '<bdi dir="ltr">0.00</bdi><div style="font-size:8.5px;color:#64748B;line-height:1;">(0%)</div>';
                } else if (isQuizOptedOut) {
                    qEarned = 0;
                    qAttempts = 0;
                    qDeduct = qMax;
                    totalDeductionsInTable += qDeduct;
                    qStatusCls = 'is-skipped';
                    qStatusText = 'معطّل';
                    var qIcon = (global.Win11Icons ? global.Win11Icons.get('fail', 10) : '✗');
                    qStatusHtml = '<span class="a4-badge ' + qStatusCls + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + qIcon + ' <span>' + bidi(qStatusText) + '</span></span>';
                    qNameText = 'سؤال تقويم الكفاءة المرحلية (' + tk.titleAr + ')';
                    qAttemptsCellHtml = '<span style="color:#64748B;">-</span>';
                    qEarnedCellHtml = '<bdi dir="ltr">0.00</bdi><div style="font-size:8.5px;color:#64748B;line-height:1;">(0%)</div>';
                    qNotes = 'تم إلغاء تفعيل الأسئلة بطلب من التلميذ؛ عدم منح نقطة السؤال (0.00 من ' + qMax.toFixed(2) + ') مع إدراج معامله في المقام (انظر القسم ج).';
                } else {
                    if (qDeduct > 0) totalDeductionsInTable += qDeduct;
                    var isQuizPassed = (qRes && qEarned === qMax);
                    var isQuizPartial = (qRes && qEarned > 0 && qEarned < qMax);
                    var isQuizFailed = (qRes && (qAttempts >= 3 || qEarned === 0));

                    if (isQuizPassed) {
                        qStatusCls = 'is-done';
                        qStatusText = 'إجابة صحيحة';
                        var qIcon = (global.Win11Icons ? global.Win11Icons.get('check', 11) : '✓');
                        qStatusHtml = '<span class="a4-badge ' + qStatusCls + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + qIcon + ' <span>' + bidi(qStatusText) + '</span></span>';
                        qNotes = 'إجابة صحيحة من المحاولة الأولى (كامل العلامة 100%).';
                    } else if (isQuizPartial) {
                        qStatusCls = 'is-partial';
                        qStatusText = 'صحيحة بعد محاولات';
                        var qIcon = (global.Win11Icons ? global.Win11Icons.get('circleHalf', 11) : '');
                        qStatusHtml = '<span class="a4-badge ' + qStatusCls + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + qIcon + ' <span>' + bidi(qStatusText) + '</span></span>';
                        var pctTxt = Math.round((qEarned / qMax) * 100);
                        qNotes = 'إجابة صحيحة من المحاولة الثانية (' + pctTxt + '% من العلامة).';
                    } else if (isQuizFailed) {
                        qStatusCls = 'is-fail';
                        qStatusText = 'استنفاد المحاولات';
                        var qIcon = (global.Win11Icons ? global.Win11Icons.get('fail', 10) : '✗');
                        qStatusHtml = '<span class="a4-badge ' + qStatusCls + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + qIcon + ' <span>' + bidi(qStatusText) + '</span></span>';
                        qNotes = 'استنفاد المحاولات (0%).';
                    } else if (isSkip) {
                        qStatusCls = 'is-skipped';
                        qStatusText = 'تم تخطيه';
                        var qIcon = (global.Win11Icons ? global.Win11Icons.get('skip', 11) : '>>');
                        qStatusHtml = '<span class="a4-badge ' + qStatusCls + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + qIcon + ' <span>' + bidi(qStatusText) + '</span></span>';
                        qNotes = 'تم تخطي السؤال تماشياً مع تخطي المهمة.';
                    } else {
                        qStatusCls = 'is-pending';
                        qStatusText = 'في الانتظار';
                        qStatusHtml = '<span class="a4-badge ' + qStatusCls + '">' + bidi(qStatusText) + '</span>';
                        qNotes = 'في انتظار إنجاز المهمة للوصول إلى السؤال.';
                    }

                    qNameText = (qRes && qRes.questionTitle) ? qRes.questionTitle : ('سؤال تقويمي للمهمة ' + (i + 1));
                    qAttemptsCellHtml = (qAttempts > 0) ? ('<bdi dir="ltr">' + qAttempts + '</bdi>') : '<span style="color:#64748B;">-</span>';
                    var pctStr = (qMax > 0) ? Math.round((qEarned / qMax) * 100) : 0;
                    qEarnedCellHtml = '<bdi dir="ltr">' + qEarned.toFixed(2) + '</bdi><div style="font-size:8.5px;color:#64748B;line-height:1;">(' + pctStr + '%)</div>';
                }

                rowsHtml +=
                    '<tr style="background:#FAFAFA;">' +
                        '<td style="text-align:center;font-weight:700;color:#7C3AED;">س' + (i + 1) + '</td>' +
                        '<td style="padding-right:16px;">' + bidi(qNameText) + '</td>' +
                        '<td style="text-align:center;"><span class="a4-type-badge is-quiz">سؤال تقويمي</span></td>' +
                        '<td style="text-align:center;">' + qStatusHtml + '</td>' +
                        '<td style="text-align:center;">' + qAttemptsCellHtml + '</td>' +
                        '<td style="text-align:center;font-weight:600;"><bdi dir="ltr">' + qMax.toFixed(2) + '</bdi></td>' +
                        '<td style="text-align:center;font-weight:700;color:#7C3AED;">' + qEarnedCellHtml + '</td>' +
                        '<td style="text-align:center;' + (qDeduct > 0 ? 'color:#DC2626;font-weight:700;' : 'color:#64748B;') + '">' +
                            (qDeduct > 0 ? ('<bdi dir="ltr">-' + qDeduct.toFixed(2) + '</bdi>') : '<bdi dir="ltr">0.00</bdi>') +
                        '</td>' +
                        '<td style="font-size:11px;color:#64748B;">' + bidi(qNotes) + '</td>' +
                    '</tr>';
            }
        }

        // Dedicated Direct Penalties Row if pen > 0
        var penaltiesRowHtml = '';
        if (pen > 0 && cfg.show_penalties !== false) {
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
                    '<td style="text-align:center;"><span class="a4-type-badge is-penalty">خصم جزائي</span></td>' +
                    '<td style="text-align:center;"><span class="a4-badge is-fail">خصم من الرصيد</span></td>' +
                    '<td style="text-align:center;">-</td>' +
                    '<td style="text-align:center;">-</td>' +
                    '<td style="text-align:center;">-</td>' +
                    '<td style="text-align:center;font-weight:700;color:#DC2626;"><bdi dir="ltr">-' + pen.toFixed(2) + '</bdi></td>' +
                    '<td style="font-size:10.5px;line-height:1.4;color:#991B1B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">' + bidi('خصم جزائي مباشر (انظر تفصيل الخطوة 5 بالأسفل)') + '</td>' +
                '</tr>';
        }

        // Table Footer Row
        var totalUnearnedWeight = Math.max(0, grandTotalMax - grandTotalEarned);
        var tableFooterHtml =
            '<tr style="background:#F8FAFC;font-weight:700;border-top:2px solid #CBD5E1;">' +
                '<td colspan="5" style="text-align:left;padding:6px 10px;font-size:11.5px;">' + bidi('المجموع الكلي لمعاملات ونقاط المهام والأسئلة:') + '</td>' +
                '<td style="text-align:center;"><bdi dir="ltr">' + grandTotalMax.toFixed(2) + '</bdi></td>' +
                '<td style="text-align:center;color:#1E3A8A;font-size:12.5px;"><bdi dir="ltr">' + grandTotalEarned.toFixed(2) + '</bdi></td>' +
                '<td style="text-align:center;color:#DC2626;"><bdi dir="ltr">-' + totalDeductionsInTable.toFixed(2) + '</bdi></td>' +
                '<td style="font-size:11px;color:#334155;padding:6px 10px;">' +
                    bidi('تحصيل ') + '<bdi dir="ltr"><strong>' + grandTotalEarned.toFixed(2) + '</strong></bdi>' + bidi(' من أصل ') + '<bdi dir="ltr"><strong>' + grandTotalMax.toFixed(2) + '</strong></bdi>' + bidi(' نقطة معامل (فارق غير مستوفى: ') + '<bdi dir="ltr"><strong>' + totalUnearnedWeight.toFixed(2) + '</strong></bdi>' + bidi(' نقطة)') +
                    (pen > 0 ? (bidi(' &nbsp;|&nbsp; خصومات جزائية مباشرة: ') + '<bdi dir="ltr" style="color:#DC2626;"><strong>-' + pen.toFixed(2) + '</strong></bdi>' + bidi(' نقطة')) : '') +
                '</td>' +
            '</tr>';

        var sectionBHtml =
            '<div class="a4-section-b">' +
                '<div class="a4-section-title">' +
                    '<span>' + bidi('القسم (ب): جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية') + '</span>' +
                    '<span style="font-size:11px;color:#475569;font-weight:normal;">' + bidi('تفصيل النقاط والمعاملات والمحاولات') + '</span>' +
                '</div>' +
                '<table class="a4-report-table">' +
                    '<colgroup>' +
                        '<col style="width:3.5%;">' +
                        '<col style="width:26%;">' +
                        '<col style="width:8%;">' +
                        '<col style="width:10%;">' +
                        '<col style="width:6.5%;">' +
                        '<col style="width:8%;">' +
                        '<col style="width:8%;">' +
                        '<col style="width:7%;">' +
                        '<col style="width:23%;">' +
                    '</colgroup>' +
                    '<thead>' +
                        '<tr>' +
                            '<th style="width:3.5%;text-align:center;">#</th>' +
                            '<th style="width:26%;text-align:right;">' + bidi('المهمة التطبيقية أو السؤال التقويمي') + '</th>' +
                            '<th style="width:8%;text-align:center;">' + bidi('النوع') + '</th>' +
                            '<th style="width:10%;text-align:center;">' + bidi('الحالة') + '</th>' +
                            '<th style="width:6.5%;text-align:center;">' + bidi('المحاولات') + '</th>' +
                            '<th style="width:8%;text-align:center;">' + bidi('المعامل الأقصى') + '</th>' +
                            '<th style="width:8%;text-align:center;">' + bidi('الممنوحة') + '</th>' +
                            '<th style="width:7%;text-align:center;">' + bidi('الخصم') + '</th>' +
                            '<th style="width:23%;text-align:right;">' + bidi('الملاحظات وتفاصيل الإنجاز') + '</th>' +
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

        // ==========================================
        // 5 & 6. SECTION C: DEDUCTIONS METHODOLOGY & FINAL RESULT CALCULATION
        // Organized table for deductions + 6-step final mathematical breakdown!
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
                    '<strong>' + bidi('تنبيه وتوضيح سلم التنقيط:') + '</strong> ' +
                    bidi('قام التلميذ بإلغاء تفعيل الأسئلة التقويمية عند بدء الجلسة؛ تم احتساب معاملات الأسئلة (' + quizMax.toFixed(2) + ' نقاط) ضمن المقام الكلي (' + grandTotalMax.toFixed(2) + ' نقطة) مع منح 0.00 للتلميذ عنها في البسط، وبذلك أصبحت أقصى علامة ممكنة وفق القاعدة الثلاثية هي (' + practicalMax.toFixed(2) + ' ÷ ' + grandTotalMax.toFixed(2) + ') × 20 = ') +
                    '<bdi dir="ltr"><strong>' + maxPossibleScore.toFixed(2) + '</strong></bdi>/20).' +
                '</div>';
        }

        // Dedicated Deduction Table
        var mistakesList = (global.Win11Assessment && typeof global.Win11Assessment.getMistakes === 'function')
            ? global.Win11Assessment.getMistakes()
            : [];
        var deductionRowsHtml = '';
        if (mistakesList && mistakesList.length > 0) {
            deductionRowsHtml = mistakesList.map(function (m, idx) {
                var tStr = m.time ? ('<bdi dir="ltr">[' + esc(m.time) + ']</bdi>') : '-';
                var tkStr = m.taskTitle ? bidi(m.taskTitle) : '-';
                var pStr = '-' + Number(m.penalty || 0.25).toFixed(2);
                return '<tr style="border-bottom:1px solid #FECACA;background:#FFF5F5;">' +
                    '<td style="text-align:center;font-weight:700;color:#DC2626;padding:4px 6px;">' + (idx + 1) + '</td>' +
                    '<td style="padding:4px 8px;font-weight:700;color:#991B1B;">' + bidi(m.title || 'مخالفة تسلسل المهام') + '</td>' +
                    '<td style="padding:4px 8px;font-size:11px;color:#7F1D1D;">' + tStr + ' ' + tkStr + '</td>' +
                    '<td style="padding:4px 8px;font-size:11px;color:#7F1D1D;">' + bidi(m.desc || '') + '</td>' +
                    '<td style="text-align:center;font-weight:700;color:#DC2626;padding:4px 6px;"><bdi dir="ltr">' + pStr + '</bdi></td>' +
                '</tr>';
            }).join('');
            deductionRowsHtml +=
                '<tr style="background:#FEF2F2;font-weight:700;border-top:1.5px solid #FECACA;">' +
                    '<td colspan="4" style="text-align:left;padding:6px 10px;color:#991B1B;">' + bidi('إجمالي الخصومات الجزائية المباشرة المطروحة من العلامة:') + '</td>' +
                    '<td style="text-align:center;color:#DC2626;font-size:12px;padding:6px 8px;"><bdi dir="ltr">-' + pen.toFixed(2) + '</bdi></td>' +
                '</tr>';
        } else {
            deductionRowsHtml =
                '<tr>' +
                    '<td colspan="5" style="text-align:center;padding:8px 12px;background:#F0FDF4;color:#15803D;font-weight:600;font-size:11.5px;">' +
                        '✔ ' + bidi('لا توجد أي خصومات جزائية — التزام تام بالتعليمات والتسلسل المطلوب (0.00 نقطة خصم).') +
                    '</td>' +
                '</tr>';
        }

        var deductionSectionHtml =
            '<div class="a4-section-deduction" style="margin:8px 0 10px 0;">' +
                '<div style="font-size:12px;font-weight:700;color:#991B1B;background:#FEF2F2;border:1px solid #FECACA;border-right:4px solid #DC2626;padding:4px 10px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                    '<span>' + bidi('جدول تفصيل طريقة الخصم والخصومات الجزائية المرصودة:') + '</span>' +
                    '<span style="font-size:10.5px;color:#B91C1C;font-weight:normal;">' + bidi('خصم مباشر من رصيد الـ 20 نقطة') + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#64748B;margin-bottom:4px;line-height:1.4;">' +
                    bidi('تُطبق الخصومات الجزائية المباشرة عند ارتكاب مخالفات في تسلسل المهام أو تعديل إعدادات غير مطلوبة أثناء الجلسة، وتُطرح قيمتها مباشرة من النقطة النهائية بعد تطبيق القاعدة الثلاثية.') +
                '</div>' +
                '<table style="width:100%;border-collapse:collapse;border:1px solid #CBD5E1;font-size:11px;margin-bottom:8px;">' +
                    '<thead>' +
                        '<tr style="background:#F1F5F9;border-bottom:1px solid #CBD5E1;color:#475569;font-weight:700;">' +
                            '<th style="width:4%;text-align:center;padding:4px 6px;">#</th>' +
                            '<th style="width:26%;text-align:right;padding:4px 8px;">' + bidi('نوع المخالفة وسبب الخصم') + '</th>' +
                            '<th style="width:26%;text-align:right;padding:4px 8px;">' + bidi('توقيت وسياق المخالفة') + '</th>' +
                            '<th style="width:32%;text-align:right;padding:4px 8px;">' + bidi('الإجراء أو الإعداد المرصود') + '</th>' +
                            '<th style="width:12%;text-align:center;padding:4px 6px;">' + bidi('قيمة الخصم') + '</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        deductionRowsHtml +
                    '</tbody>' +
                '</table>' +
            '</div>';

        var mathBreakdownHtml =
            '<div class="a4-section-c">' +
                '<div class="a4-section-title">' +
                    '<span>' + bidi('القسم (ج): التفكيك الحسابي للعلامة (كيف تم احتساب المعدل خطوة بخطوة)') + '</span>' +
                    '<span style="font-size:11px;color:#475569;font-weight:normal;">' + bidi('تطبيق القاعدة الثلاثية الرسمية والنتيجة النهائية') + '</span>' +
                '</div>' +
                quizDisabledNoticeHtml +
                deductionSectionHtml +
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
                                    ? bidi('معطّلة بناءً على رغبة الأستاذ (غير مدرجة في المجموع)')
                                    : (isQuizOptedOut
                                        ? ('<span style="color:#DC2626;">' + bidi('حصلت على: 0.00 (معطل بطلب التلميذ)') + '</span>')
                                        : (stu.quizSkippedAll
                                            ? ('<span style="color:#D97706;">' + bidi('حصلت على: ') + '<bdi dir="ltr"><strong>' + quizEarned.toFixed(2) + '</strong></bdi> ' + bidi('من أصل') + ' <bdi dir="ltr">' + quizMax.toFixed(2) + '</bdi> (' + bidi('تم تخطي كافة الأسئلة وتصفيرها') + ')</span>')
                                            : (bidi('حصلت على:') + ' <bdi dir="ltr"><strong>' + quizEarned.toFixed(2) + '</strong></bdi> ' + bidi('من أصل') + ' <bdi dir="ltr">' + quizMax.toFixed(2) + '</bdi>')))) +
                            '</span>' +
                        '</div>' +

                        '<div class="a4-math-step">' +
                            '<span class="a4-step-num">3</span>' +
                            '<span class="a4-step-lbl">' + bidi('مجموع النقاط التي حصلت عليها (معاملات):') + '</span>' +
                            '<span class="a4-step-val" style="color:#1E3A8A;"><bdi dir="ltr"><strong>' + grandTotalEarned.toFixed(2) + '</strong> / <strong>' + grandTotalMax.toFixed(2) + '</strong></bdi> ' + bidi('نقطة') + '</span>' +
                            '<span class="a4-step-sub">(' +
                                (isQuizGloballyDisabled
                                    ? ('<bdi dir="ltr">' + practicalEarned.toFixed(2) + '</bdi> ' + bidi('عملي'))
                                    : ('<bdi dir="ltr">' + practicalEarned.toFixed(2) + '</bdi> ' + bidi('عملي') + ' + <bdi dir="ltr">' + quizEarned.toFixed(2) + '</bdi> ' + bidi('أسئلة') + ' = <bdi dir="ltr"><strong>' + grandTotalEarned.toFixed(2) + '</strong></bdi>')) +
                            ')</span>' +
                        '</div>' +

                        '<div class="a4-math-step highlight-rule3">' +
                            '<span class="a4-step-num">4</span>' +
                            '<span class="a4-step-lbl">' + bidi('العلامة قبل الخصم (من 20):') + '</span>' +
                            '<span class="a4-step-val" style="color:#0284C7;"><bdi dir="ltr"><strong>' + baseScoreOutOf20.toFixed(2) + ' / 20</strong></bdi></span>' +
                            '<span class="a4-step-sub">' + bidi('القاعدة الثلاثية: (') + '<bdi dir="ltr">' + grandTotalEarned.toFixed(2) + '</bdi> ÷ <bdi dir="ltr">' + grandTotalMax.toFixed(2) + '</bdi>' + bidi(') × 20') + '</span>' +
                        '</div>' +

                        '<div class="a4-math-step" style="' + (pen > 0 ? 'border-color:#FECACA;background:#FFF5F5;' : '') + '">' +
                            '<span class="a4-step-num"' + (pen > 0 ? ' style="background:#DC2626;"' : '') + '>5</span>' +
                            '<span class="a4-step-lbl">' + bidi('مجموع الخصومات الجزائية المباشرة:') + '</span>' +
                            '<span class="a4-step-val" style="color:' + (pen > 0 ? '#DC2626' : '#15803D') + ';"><bdi dir="ltr"><strong>' + (pen > 0 ? ('-' + pen.toFixed(2)) : '0.00') + '</strong></bdi> ' + bidi('نقطة') + '</span>' +
                            '<span class="a4-step-sub">' + (pen > 0 ? bidi('تُطرح مباشرة من العلامة (انظر تفصيل المخالفات في الجدول أعلاه)') : bidi('أداء نظامي سليم بدون أي خصومات')) + '</span>' +
                        '</div>' +

                        '<div class="a4-math-step" style="border:1.5px solid #16A34A;background:#F0FDF4;padding:6px 10px;">' +
                            '<span class="a4-step-num" style="background:#16A34A;">6</span>' +
                            '<span class="a4-step-lbl" style="font-weight:800;color:#0F172A;font-size:12px;">' + bidi('العلامة النهائية المعتمدة المستحقة:') + '</span>' +
                            '<span class="a4-step-val" style="font-size:15px;color:#15803D;"><bdi dir="ltr"><strong>' + finalScoreStr + ' / 20.00</strong></bdi></span>' +
                            '<span class="a4-step-sub" style="color:#15803D;font-weight:700;">' + (pen > 0 ? ('<bdi dir="ltr">' + baseScoreOutOf20.toFixed(2) + ' - ' + pen.toFixed(2) + ' = ' + finalScoreStr + '</bdi>') : bidi('مطابقة للقاعدة الثلاثية دون خصم')) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // ==========================================
        // 7. SECTION D: AUDIT & IDENTITY MODIFICATION LOG
        // Only rendered if student information was modified during active session!
        // ==========================================
        var sectionDHtml = '';
        var stuHistory = (stu && stu.history) || (global.Win11Assessment && typeof global.Win11Assessment.getStudentHistory === 'function' ? global.Win11Assessment.getStudentHistory() : null);
        var hasModifications = !!(stuHistory && stuHistory.modifications && stuHistory.modifications.length > 0);

        if (hasModifications) {
            var initialSnap = stuHistory.initial || {
                timestamp: '00:00:00',
                date: dateFormatted.split('—')[0].trim(),
                elapsedFormatted: '00:00:00',
                fullName: stu.fullName || studentName,
                classGroup: stu.classGroup || '1AS',
                pcNumber: stu.pcNumber || '01',
                quizOptIn: stu.quizOptIn !== false
            };

            var auditRowsHtml = '';

            var initPartsNotice = '';
            if (initialSnap.participants && Array.isArray(initialSnap.participants) && initialSnap.participants.length > 0) {
                var pListInit = initialSnap.participants.map(function (p, idx) {
                    var pl = String(p.lastName || '—').trim().toUpperCase();
                    var pf = String(p.firstName || '—').trim().toUpperCase();
                    return (idx + 1) + ') ' + pl + ' ' + pf;
                }).join(' &nbsp;|&nbsp; ');
                initPartsNotice = '<div style="margin-top:3px;color:#1E3A8A;font-weight:600;">' + bidi('المشاركون المسجلون في البداية:') + ' ' + bidi(pListInit) + '</div>';
            }

            auditRowsHtml +=
                '<tr class="a4-audit-initial-row">' +
                    '<td style="text-align:center;"><span class="a4-stage-pill is-init">' + bidi('التسجيل الأولي') + '</span></td>' +
                    '<td style="text-align:center;"><bdi dir="ltr">' + esc(initialSnap.timestamp) + '</bdi></td>' +
                    '<td style="text-align:center;font-family:Consolas,monospace;"><bdi dir="ltr">00:00:00</bdi></td>' +
                    '<td style="text-align:center;font-weight:600;color:#059669;"><bdi dir="ltr">0%</bdi> ' + bidi('(انطلاق الجلسة)') + '</td>' +
                    '<td style="text-align:center;font-weight:700;color:#1E3A8A;">' + bidi('بيانات التسجيل الأصلية') + '</td>' +
                    '<td style="font-size:10px;line-height:1.4;">' +
                        '<div>' + bidi('الاسم: ') + '<strong>' + bidi(initialSnap.fullName) + '</strong> &nbsp;|&nbsp; ' + bidi('الفوج: ') + '<strong>' + bidi(initialSnap.classGroup) + '</strong> &nbsp;|&nbsp; ' + bidi('الجهاز: ') + '<bdi dir="ltr">#' + esc(initialSnap.pcNumber) + '</bdi></div>' +
                        initPartsNotice +
                    '</td>' +
                '</tr>';

            for (var m = 0; m < stuHistory.modifications.length; m++) {
                var mod = stuHistory.modifications[m];
                var modStageLabel = 'التعديل رقم ' + (mod.editNumber || (m + 1));
                var changesList = mod.changes || [];
                var changesHtml = '';

                for (var c = 0; c < changesList.length; c++) {
                    var ch = changesList[c];
                    var noticeBox = '';
                    if (ch.notice) {
                        var noticeBg = ch.isRemoval ? '#FEF2F2' : '#F0F9FF';
                        var noticeColor = ch.isRemoval ? '#DC2626' : '#0369A1';
                        var noticeBorder = ch.isRemoval ? '#FECACA' : '#BAE6FD';
                        noticeBox =
                            '<div style="margin-top:4px;padding:4px 8px;border-radius:4px;background:' + noticeBg + ';border:1px solid ' + noticeBorder + ';color:' + noticeColor + ';font-size:10px;font-weight:700;line-height:1.4;">' +
                                (ch.isRemoval ? '⚠️ ' : 'ℹ️ ') + bidi(ch.notice) +
                            '</div>';
                    }

                    changesHtml +=
                        '<div style="margin:3px 0;">' +
                            '<strong>' + bidi(ch.labelAr || ch.field) + ':</strong> ' +
                            '<span class="a4-audit-old">' + bidi('سابق: ') + esc(ch.oldVal) + '</span> ' +
                            '➔ <span class="a4-audit-new">' + bidi('جديد: ') + esc(ch.newVal) + '</span>' +
                            noticeBox +
                        '</div>';
                }

                var fieldSummary = changesList.map(function (c) { return c.labelAr; }).join('، ');

                auditRowsHtml +=
                    '<tr class="a4-audit-edit-row">' +
                        '<td style="text-align:center;"><span class="a4-stage-pill is-edit">' + bidi(modStageLabel) + '</span></td>' +
                        '<td style="text-align:center;font-weight:700;color:#B45309;"><bdi dir="ltr">' + esc(mod.timestamp) + '</bdi></td>' +
                        '<td style="text-align:center;font-family:Consolas,monospace;font-weight:700;color:#B45309;"><bdi dir="ltr">' + esc(mod.elapsedFormatted) + '</bdi></td>' +
                        '<td style="text-align:center;font-weight:700;color:#2563EB;">' +
                            '<bdi dir="ltr">' + mod.progressPercent + '%</bdi> ' +
                            '<span style="font-size:9px;color:#64748B;">(' + mod.doneTasksCount + ' / ' + mod.totalTasksCount + ' مهام)</span>' +
                        '</td>' +
                        '<td style="text-align:center;font-weight:700;color:#78350F;">' + bidi(fieldSummary) + '</td>' +
                        '<td style="line-height:1.45;">' + changesHtml + '</td>' +
                    '</tr>';
            }

            sectionDHtml =
                '<div class="a4-section-d">' +
                    '<div class="a4-section-title a4-title-audit">' +
                        '<span>' + bidi('القسم (د): سجل تدقيق وتعديل بيانات الهوية والجلسة (نظام مكافحة الانتحال والتحقق الأمني)') + '</span>' +
                        '<span style="font-size:11px;color:#B45309;font-weight:700;">⚠️ ' + bidi('تم تسجيل ' + stuHistory.modifications.length + ' تعديل(ات) أثناء الجلسة') + '</span>' +
                    '</div>' +
                    '<div class="a4-audit-alert">' +
                        '<div class="a4-audit-alert-icon">⚠️</div>' +
                        '<div class="a4-audit-alert-text">' +
                            '<strong>' + bidi('تنبيه أمني للأستاذ(ة) المشرف(ة):') + '</strong> ' +
                            bidi('تم رصد تعديل على بيانات هوية التلميذ أو الفوج/الجهاز أثناء سير الجلسة العملية بعد انطلاق المحاكاة وإنجاز جزء من المهام. يُرجى مراجعة الجدول الزمني أدناه للتحقق من عدم انتحال الهوية أو تبديل الحسابات بين التلاميذ.') +
                        '</div>' +
                    '</div>' +
                    '<table class="a4-audit-table">' +
                        '<colgroup>' +
                            '<col style="width:13%;">' +
                            '<col style="width:14%;">' +
                            '<col style="width:14%;">' +
                            '<col style="width:17%;">' +
                            '<col style="width:16%;">' +
                            '<col style="width:26%;">' +
                        '</colgroup>' +
                        '<thead>' +
                            '<tr>' +
                                '<th style="width:13%;text-align:center;">' + bidi('المرحلة') + '</th>' +
                                '<th style="width:14%;text-align:center;">' + bidi('توقيت النظام') + '</th>' +
                                '<th style="width:14%;text-align:center;">' + bidi('وقت المحاكاة') + '</th>' +
                                '<th style="width:17%;text-align:center;">' + bidi('نسبة الإنجاز عند التعديل') + '</th>' +
                                '<th style="width:16%;text-align:center;">' + bidi('البيان المعدل') + '</th>' +
                                '<th style="width:26%;text-align:right;">' + bidi('تفاصيل التغيير (سابق ➔ جديد)') + '</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>' +
                            auditRowsHtml +
                        '</tbody>' +
                    '</table>' +
                '</div>';
        }

        // Final Return Assembly in User-Requested Logical Order:
        // 1. Header (الترويسة)
        // 2. Top Highlight Bar (شريط المعلومات العلوي: النقطة النهائية والوقت المستغرق)
        // 3. Section A: Participants Table & Session Details (قسم المشاركين والجلسة)
        // 4. Section B: Grading Methodology (قسم طريقة التنقيط وتفصيل المهام والأسئلة)
        // 5. Section C: Deduction Methodology & Final Result Breakdown (قسم طريقة الخصم والنتيجة النهائية)
        // 6. Section D: Audit (if applicable)
        // 7. Teacher Observations & Official Seal + Page Numbering Footer
        return (
            '<div class="a4-report-sheet" dir="rtl" lang="ar">' +
                // 1. Header
                '<div class="a4-header">' +
                    '<div class="a4-header-republic">' +
                        '<div style="font-size:14px;font-weight:800;color:#0F172A;line-height:1.4;">' + bidi('الجمهورية الجزائرية الديمقراطية الشعبية') + '</div>' +
                        '<div style="font-size:12.5px;font-weight:700;color:#1E3A8A;margin-top:2px;">' + bidi('وزارة التربية الوطنية') + '</div>' +
                    '</div>' +
                    (logoHtml ? (
                        '<div class="a4-header-grid has-logo">' +
                            '<div class="a4-header-right" style="text-align:right;">' +
                                '<div>المؤسسة: <strong>' + bidi(cfg.institution_name) + '</strong></div>' +
                                '<div>الأستاذ المشرف: <strong>' + bidi(cfg.teacher_name) + '</strong></div>' +
                            '</div>' +
                            '<div class="a4-header-logo" style="text-align:center;">' + logoHtml + '</div>' +
                            '<div class="a4-header-left" style="text-align:left;direction:ltr;" dir="ltr">' +
                                '<div>Année scolaire: <strong>' + esc(cfg.academic_year) + '</strong></div>' +
                                '<div>Niveau: <span dir="rtl" style="display:inline-block;"><strong>' + esc(cfg.target_level) + '</strong></span></div>' +
                            '</div>' +
                        '</div>'
                    ) : (
                        '<div class="a4-header-grid no-logo">' +
                            '<div class="a4-header-right" style="text-align:right;">' +
                                '<div>المؤسسة: <strong>' + bidi(cfg.institution_name) + '</strong></div>' +
                                '<div>الأستاذ المشرف: <strong>' + bidi(cfg.teacher_name) + '</strong></div>' +
                            '</div>' +
                            '<div class="a4-header-left" style="text-align:left;direction:ltr;" dir="ltr">' +
                                '<div>Année scolaire: <strong>' + esc(cfg.academic_year) + '</strong></div>' +
                                '<div>Niveau: <span dir="rtl" style="display:inline-block;"><strong>' + esc(cfg.target_level) + '</strong></span></div>' +
                            '</div>' +
                        '</div>'
                    )) +
                    '<div class="a4-banner">' +
                        '<div class="a4-banner-title">' + bidi('بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي') + '</div>' +
                        '<div class="a4-banner-sub">' + bidi('المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)') + '</div>' +
                    '</div>' +
                '</div>' +

                // 2. Top Information Bar (Prominently Highlighted Score & Duration)
                topSummaryCardHtml +

                // 3. Participants Table & Session Details
                studentBoxHtml +

                // 4. Grading Methodology (Detailed Table of Tasks & Questions)
                sectionBHtml +

                // 5 & 6. Deduction Methodology & Final Result Calculation
                mathBreakdownHtml +

                // 7. Audit (if applicable)
                sectionDHtml +

                // 8. Teacher Observations, Official Stamp & Page Footer
                '<div class="a4-footer-sig">' +
                    '<div style="flex:1;padding-left:24px;">' +
                        '<div style="font-weight:700;margin-bottom:4px;color:#0F172A;">' + bidi('ملاحظات وتوجيهات الأستاذ(ة):') + '</div>' +
                        '<div style="border-bottom:1px dotted #94A3B8;height:20px;"></div>' +
                        '<div style="border-bottom:1px dotted #94A3B8;height:20px;margin-top:4px;"></div>' +
                    '</div>' +
                    '<div style="flex:0 0 220px;text-align:center;">' +
                        '<div style="font-size:11px;color:#64748B;margin-bottom:3px;">حرر في: <bdi dir="ltr">' + bidi(dateFormatted.split('—')[0].trim()) + '</bdi></div>' +
                        '<div style="border:1px dashed #64748B;border-radius:6px;padding:8px 12px;min-height:55px;display:flex;flex-direction:column;justify-content:space-between;background:#FAFAFA;">' +
                            '<span style="font-weight:700;font-size:11.5px;color:#475569;">' + bidi('توقيع وختم الأستاذ(ة)') + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:6px;border-top:1px solid #E2E8F0;font-size:10px;color:#94A3B8;">' +
                    '<div>' + bidi('محاكاة بيئة التعامل مع الحاسوب (لوحة التحكم Windows 11) — مادة الإعلام الآلي') + '</div>' +
                    '<div style="font-weight:700;color:#64748B;">' + bidi('صفحة 1 من 1') + '</div>' +
                    '<div>' + bidi('تاريخ الاستخراج: ') + '<bdi dir="ltr">' + bidi(dateFormatted) + '</bdi></div>' +
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
            '.a4-header-right{text-align:right;flex:1 1 35%;}\n' +
            '.a4-header-logo{text-align:center;flex:0 0 100px;display:flex;justify-content:center;align-items:center;}\n' +
            '.a4-header-left{text-align:left;flex:1 1 35%;}\n' +
            '.a4-banner{text-align:center;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:6px 12px;}\n' +
            '.a4-banner-title{font-size:15px;font-weight:800;color:#1E3A8A;}\n' +
            '.a4-banner-sub{font-size:11.5px;color:#475569;margin-top:2px;}\n' +
            '.a4-student-box{background:#F1F5F9;border:1.2px solid #CBD5E1;border-radius:6px;padding:8px 14px;margin:8px 0 10px 0;font-size:12px;color:#0F172A;line-height:1.6;box-sizing:border-box;}\n' +
            '.a4-student-line1{margin-bottom:4px;font-size:12px;color:#0F172A;}\n' +
            '.a4-student-line2{font-size:11.5px;color:#334155;}\n' +
            '.a4-section-title{font-size:12.5px;font-weight:700;color:#1E3A8A;background:#F1F5F9;border:1px solid #CBD5E1;border-right:4px solid #1E3A8A;padding:4px 10px;margin:10px 0 6px 0;border-radius:4px;display:flex;align-items:center;justify-content:space-between;}\n' +
            '.a4-info-table{width:100%;border-collapse:collapse;margin:4px 0 8px 0;font-size:11px;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:6px;overflow:hidden;}\n' +
            '.a4-info-table td{padding:5px 8px;border:1px solid #CBD5E1;vertical-align:middle;text-align:right;}\n' +
            '.a4-cell-lbl{font-size:10px;color:#64748B;font-weight:600;display:block;margin-bottom:2px;}\n' +
            '.a4-cell-val{color:#0F172A;}\n' +
            '.a4-type-badge{display:block;margin:0 auto;padding:2px 2px;border-radius:4px;font-size:9.5px;font-weight:700;text-align:center;width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\n' +
            '.a4-type-badge.is-task{background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;}\n' +
            '.a4-type-badge.is-quiz{background:#F5F3FF;color:#6D28D9;border:1px solid #DDD6FE;}\n' +
            '.a4-type-badge.is-penalty{background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA;}\n' +
            '.a4-crit-badge{color:#DC2626;font-size:10px;font-weight:700;}\n' +
            '.a4-badge{display:block;margin:0 auto;padding:2px 2px;border-radius:4px;font-size:9.5px;font-weight:700;width:100%;max-width:100%;box-sizing:border-box;text-align:center;white-space:normal;word-break:break-word;overflow:hidden;text-overflow:ellipsis;line-height:1.25;}\n' +
            '.a4-badge.is-done{background:#DCFCE7;color:#15803D;border:1px solid #86EFAC;}\n' +
            '.a4-badge.is-partial{background:#FEF3C7;color:#D97706;border:1px solid #FDE68A;}\n' +
            '.a4-badge.is-fail{background:#FEE2E2;color:#B91C1C;border:1px solid #FCA5A5;}\n' +
            '.a4-badge.is-skipped{background:#E2E8F0;color:#475569;border:1px solid #CBD5E1;}\n' +
            '.a4-pass-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;}\n' +
            '.a4-pass-badge.is-pass{background:#DCFCE7;color:#15803D;border:1px solid #86EFAC;}\n' +
            '.a4-pass-badge.is-fail{background:#FEE2E2;color:#B91C1C;border:1px solid #FCA5A5;}\n' +
            '.a4-top-summary-card{display:flex;gap:10px;margin:8px 0 12px 0;align-items:stretch;box-sizing:border-box;}\n' +
            '.a4-tsc-score{flex:1 1 50%;background:#F0FDF4;border:2px solid #16A34A;border-radius:6px;padding:8px 10px;text-align:center;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;}\n' +
            '.a4-tsc-score.is-fail{background:#FFFBEB;border-color:#D97706;}\n' +
            '.a4-tsc-time{flex:1 1 50%;background:#EFF6FF;border:2px solid #2563EB;border-radius:6px;padding:8px 10px;text-align:center;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;}\n' +
            '.a4-tsc-time.is-done{background:#F0FDF4;border-color:#16A34A;}\n' +
            '.a4-tsc-time.is-done .a4-tsc-grade{color:#15803D;}\n' +
            '.a4-tsc-time.is-partial{background:#FFFBEB;border-color:#D97706;}\n' +
            '.a4-tsc-time.is-partial .a4-tsc-grade{color:#B45309;}\n' +
            '.a4-tsc-time.is-fail{background:#FEF2F2;border-color:#DC2626;}\n' +
            '.a4-tsc-time.is-fail .a4-tsc-grade{color:#DC2626;}\n' +
            '.a4-tsc-title{font-size:12px;font-weight:700;color:#475569;margin-bottom:2px;}\n' +
            '.a4-tsc-grade{font-size:28px;font-weight:900;color:#15803D;line-height:1.15;margin:2px 0;}\n' +
            '.a4-tsc-score.is-fail .a4-tsc-grade{color:#B45309;}\n' +
            '.a4-tsc-time .a4-tsc-grade{color:#1D4ED8;font-family:Consolas,monospace;font-size:28px;font-weight:900;}\n' +
            '.a4-tsc-out{font-size:16px;color:#64748B;font-weight:700;}\n' +
            '.a4-tsc-badge{margin-top:3px;}\n' +
            '.a4-report-table{width:100% !important;table-layout:fixed !important;border-collapse:collapse !important;border-spacing:0 !important;margin:6px 0 8px 0;font-size:11px;box-sizing:border-box !important;}\n' +
            '.a4-report-table col{box-sizing:border-box !important;}\n' +
            '.a4-report-table th,.a4-report-table td{border:1px solid #CBD5E1 !important;padding:5px 5px !important;text-align:right;vertical-align:middle;word-wrap:break-word !important;overflow-wrap:break-word !important;word-break:normal !important;white-space:normal !important;box-sizing:border-box !important;line-height:1.4 !important;}\n' +
            '.a4-report-table th{background:#F1F5F9;color:#0F172A;font-weight:700;font-size:10.5px;line-height:1.35;text-align:center;}\n' +
            '.a4-audit-table{width:100% !important;table-layout:fixed !important;border-collapse:collapse !important;margin:6px 0 8px 0;font-size:11px;box-sizing:border-box !important;}\n' +
            '.a4-audit-table th,.a4-audit-table td{border:1px solid #CBD5E1 !important;padding:5px 6px !important;vertical-align:middle;word-wrap:break-word !important;overflow-wrap:break-word !important;line-height:1.45 !important;}\n' +
            '.a4-audit-table th{background:#F8FAFC;color:#334155;font-weight:700;font-size:10.5px;text-align:center;}\n' +
            '.a4-quiz-disabled-notice{background:#FFFBEB;border:1.5px solid #F59E0B;border-radius:6px;padding:6px 10px;margin:6px 0;color:#92400E;font-size:11px;line-height:1.5;}\n' +
            '.a4-math-grid{display:flex;gap:10px;margin-top:6px;align-items:stretch;width:100%;}\n' +
            '.a4-math-steps{flex:1 1 100%;width:100%;display:flex;flex-direction:column;gap:4px;}\n' +
            '.a4-math-step{display:flex;align-items:center;gap:6px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:4px;padding:4px 8px;font-size:11px;color:#334155;}\n' +
            '.a4-math-step.highlight-rule3{background:#F0F9FF;border-color:#BAE6FD;}\n' +
            '.a4-step-num{width:16px;height:16px;background:#1E3A8A;color:#FFFFFF;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;flex-shrink:0;}\n' +
            '.a4-step-lbl{font-weight:600;color:#1E293B;}\n' +
            '.a4-step-val{margin-right:auto;font-weight:700;color:#0F172A;}\n' +
            '.a4-step-sub{font-size:10px;color:#64748B;}\n' +
            '.a4-footer-sig{margin-top:8px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #CBD5E1;padding-top:6px;font-size:11px;}\n' +
            '@media print{@page{size:A4 portrait;margin:6mm 6mm;}body{background:#FFFFFF;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.a4-report-sheet{border:none;box-shadow:none;padding:0;max-width:none;width:100%;}.a4-top-summary-card{page-break-inside:avoid;break-inside:avoid;}.a4-section-title{page-break-after:avoid;break-after:avoid;}.a4-report-table{width:100% !important;table-layout:fixed !important;}.a4-report-table tr{page-break-inside:avoid;break-inside:avoid;}.a4-section-c,.a4-section-d,.a4-footer-sig{page-break-inside:avoid;break-inside:avoid;}}\n' +
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

    function uint8ToBase64(u8) {
        if (!u8 || !u8.length) return '';
        var CHUNK = 0x8000;
        var index = 0;
        var len = u8.length;
        var result = '';
        while (index < len) {
            var slice = u8.subarray(index, Math.min(index + CHUNK, len));
            result += String.fromCharCode.apply(null, slice);
            index += CHUNK;
        }
        return btoa(result);
    }

    function generateReportPdfUint8() {
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

            var isMultiStudent = Array.isArray(stu.participants) && stu.participants.length > 1;
            var numParticipants = isMultiStudent ? stu.participants.length : 1;
            var sLastName = (stu.lastName || '—').trim().toUpperCase();
            var sFirstName = (stu.firstName || stu.fullName || '—').trim().toUpperCase();
            var pcNum = String(stu.pcNumber || cfg.default_device || '01');

            var reportNumber = stu.reportNumber || (function () {
                var d = new Date();
                var yr = d.getFullYear();
                var mo = String(d.getMonth() + 1).padStart(2, '0');
                var da = String(d.getDate()).padStart(2, '0');
                var dev = String(stu.pcNumber || cfg.default_device || '01').padStart(2, '0');
                return 'REP-' + yr + mo + da + '-' + dev;
            })();

            // 1. Republic Header text (Two-line official format, well cleared from top border Y=46)
            ctx.direction = 'rtl';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 18px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('الجمهورية الجزائرية الديمقراطية الشعبية', 620, 78);

            ctx.fillStyle = '#1E3A8A';
            ctx.font = 'bold 15px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('وزارة التربية الوطنية', 620, 99);

            // Official Logo Drawing: ONLY teacher logo from inf.dll (cached image, instant Image fallback, or DOM image); NO fallback seal!
            var hasTeacherLogo = (cfg.show_logo !== false && cfg.report_logo_b64 && String(cfg.report_logo_b64).indexOf('data:image/') === 0 && cfg.report_logo_b64 !== 'none');
            var logoDrawn = false;
            if (hasTeacherLogo) {
                var targetImg = cachedLogoImg;
                if ((!targetImg || !targetImg.complete || targetImg.naturalWidth === 0) && typeof Image !== 'undefined') {
                    try {
                        var instImg = new Image();
                        instImg.src = cfg.report_logo_b64;
                        if (instImg.complete && instImg.naturalWidth > 0) {
                            targetImg = instImg;
                            cachedLogoImg = instImg;
                            cachedLogoB64 = cfg.report_logo_b64;
                        }
                    } catch (eInst) {}
                }
                if (!targetImg && typeof document !== 'undefined') {
                    try {
                        var domLogo = document.querySelector('.a4-header-logo img');
                        if (domLogo && domLogo.complete && domLogo.naturalWidth > 0) {
                            targetImg = domLogo;
                        }
                    } catch (eDom) {}
                }
                if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
                    try {
                        var maxW = 86;
                        var maxH = 54;
                        var natW = targetImg.naturalWidth || targetImg.width || 64;
                        var natH = targetImg.naturalHeight || targetImg.height || 52;
                        var scale = Math.min(maxW / natW, maxH / natH, 1.0);
                        var drawW = Math.round(natW * scale);
                        var drawH = Math.round(natH * scale);
                        var drawX = Math.round(620 - (drawW / 2));
                        var drawY = Math.round(108 + (maxH - drawH) / 2);
                        ctx.drawImage(targetImg, drawX, drawY, drawW, drawH);
                        logoDrawn = true;
                    } catch (eDraw) {}
                }
            }

            // Right Block: Official Institution & Teacher
            var instStr = (cfg.institution_name || 'مدرسة الشهيد قورين محمد الأغواط');
            var teachStr = (cfg.teacher_name || 'أستاذ مادة المعلوماتية');
            ctx.textAlign = 'right';

            ctx.font = '12.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('المؤسسة:', 1150, 115);
            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText(instStr, 1090, 115);

            ctx.font = '12.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('الأستاذ المشرف:', 1150, 137);
            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#1E3A8A';
            ctx.fillText(teachStr, 1060, 137);

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('اسم المحاكاة: بيئة التعامل مع الحاسوب', 1150, 158);

            // Left Block: Academic Year & Level & Report #
            ctx.textAlign = 'left';
            ctx.font = '12.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('Année scolaire:', 95, 115);
            ctx.font = 'bold 13.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText(cfg.academic_year || '2026 / 2027', 185, 115);

            ctx.font = '12.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('Niveau:', 95, 137);
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#334155';
            ctx.fillText(cfg.target_level || 'السنة أولى ثانوي (جذع مشترك)', 142, 137);

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('Unité: لوحة التحكم وإعدادات النظام', 95, 158);

            // Main Title Banner (Y = 170..220)
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(80, 170, 1080, 50);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#CBD5E1';
            ctx.strokeRect(80, 170, 1080, 50);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#1E3A8A';
            ctx.font = 'bold 21px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي', 620, 196);

            ctx.fillStyle = '#475569';
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)', 620, 213);

            // ==========================================
            // 2. TOP INFORMATION BAR (PROMINENT AT TOP, Y = 228..296)
            // ==========================================
            var curY = 228;
            var cardH = 68;

            // Score Card (Right: 630..1160, W = 530)
            ctx.fillStyle = isPassed ? '#F0FDF4' : '#FFFBEB';
            ctx.fillRect(630, curY, 530, cardH);
            ctx.strokeStyle = isPassed ? '#16A34A' : '#D97706';
            ctx.lineWidth = 2;
            ctx.strokeRect(630, curY, 530, cardH);

            ctx.textAlign = 'center';
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = isPassed ? '#166534' : '#92400E';
            ctx.fillText('العلامة النهائية المستحقة:', 895, curY + 18);

            ctx.save();
            ctx.direction = 'ltr';
            ctx.font = '900 28px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = isPassed ? '#15803D' : '#B45309';
            ctx.fillText(finalScoreStr + ' / 20.00', 895, curY + 44);
            ctx.restore();

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            var passAppr = scores.appreciation || 'قريب من المتوسط';
            ctx.fillText(isPassed ? ('✔ مستوفٍ لمعيار النجاح — ' + passAppr) : ('✕ دون المعدل المطلوب — ' + passAppr), 895, curY + 62);

            // Duration Card (Left: 80..610, W = 530)
            var isAllDone = (enabledTasks.length > 0 && doneTasksCount === enabledTasks.length);
            var durBg = isAllDone ? '#F0FDF4' : '#EFF6FF';
            var durBorder = isAllDone ? '#16A34A' : '#2563EB';
            var durTextCol = isAllDone ? '#15803D' : '#1D4ED8';
            var durBadgeTxt = isAllDone
                ? '✔ جلسة مكتملة ومستوفاة لكافة المهام (6 / 6 مهام — 100%)'
                : ('⌛ جلسة قيد الإنجاز (' + doneTasksCount + ' / ' + enabledTasks.length + ' مهام — ' + completionPct + '%)');

            ctx.fillStyle = durBg;
            ctx.fillRect(80, curY, 530, cardH);
            ctx.strokeStyle = durBorder;
            ctx.lineWidth = 2;
            ctx.strokeRect(80, curY, 530, cardH);

            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = durTextCol;
            ctx.fillText('الوقت الإجمالي المستغرق:', 345, curY + 18);

            ctx.save();
            ctx.direction = 'ltr';
            ctx.font = '900 26px Consolas, monospace';
            ctx.fillStyle = durTextCol;
            ctx.fillText(totalDurationStr, 345, curY + 44);
            ctx.restore();

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText(durBadgeTxt, 345, curY + 62);

            curY += cardH + 12;

            // ==========================================
            // 3. SECTION A: PARTICIPANTS TABLE & SESSION DETAILS
            // Guaranteed date clearance: minimum height 142px, date drawn safely inside
            // ==========================================
            // Section Title Bar
            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(80, curY, 1080, 26);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1;
            ctx.strokeRect(80, curY, 1080, 26);

            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(1156, curY, 4, 26);

            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#1E3A8A';
            ctx.textAlign = 'right';
            ctx.fillText('القسم (أ): بيانات التلميذ والجلسة التقويمية', 1145, curY + 18);

            ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'left';
            ctx.fillText('بيانات رسمية معتمدة', 95, curY + 18);

            curY += 26;

            var secAY = curY;
            var secAInnerH = Math.max(142, 44 + (numParticipants * 28) + 20);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(80, secAY, 1080, secAInnerH);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1;
            ctx.strokeRect(80, secAY, 1080, secAInnerH);

            // Vertical divider between right (Participants) and left (Session Metadata)
            ctx.beginPath();
            ctx.moveTo(620, secAY);
            ctx.lineTo(620, secAY + secAInnerH);
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Right Column: Participants Table (X = 630 to 1155, W = 525)
            ctx.textAlign = 'right';
            ctx.fillStyle = '#64748B';
            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText(isMultiStudent ? ('المشاركون في العمل التطبيقي (عمل مشترك — ' + numParticipants + ' تلاميذ):') : 'اسم ولقب التلميذ(ة):', 1145, secAY + 18);

            // Table Header Bar for Participants
            var tblHdrY = secAY + 26;
            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(635, tblHdrY, 510, 24);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1;
            ctx.strokeRect(635, tblHdrY, 510, 24);

            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            ctx.fillText('#', 1125, tblHdrY + 17);
            ctx.textAlign = 'right';
            ctx.fillText('اللقب', 1060, tblHdrY + 17);
            ctx.fillText('الاسم', 860, tblHdrY + 17);

            if (isMultiStudent) {
                for (var pi = 0; pi < stu.participants.length && pi < 4; pi++) {
                    var part = stu.participants[pi];
                    var py = tblHdrY + 24 + (pi * 28);
                    ctx.fillStyle = (pi % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
                    ctx.fillRect(635, py, 510, 28);
                    ctx.strokeStyle = '#E2E8F0';
                    ctx.strokeRect(635, py, 510, 28);

                    ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#1E3A8A';
                    ctx.textAlign = 'center';
                    ctx.fillText(String(pi + 1), 1125, py + 19);

                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#0F172A';
                    ctx.font = 'bold 13.5px "Segoe UI", Tahoma, sans-serif';
                    var pLast = (part.lastName || '—').trim().toUpperCase();
                    ctx.fillText(pLast, 1060, py + 19);

                    var pFirst = (part.firstName || '—').trim().toUpperCase();
                    ctx.fillText(pFirst, 860, py + 19);
                }
            } else {
                var singleRowY = tblHdrY + 24;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(635, singleRowY, 510, 28);
                ctx.strokeStyle = '#E2E8F0';
                ctx.strokeRect(635, singleRowY, 510, 28);

                ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#1E3A8A';
                ctx.textAlign = 'center';
                ctx.fillText('1', 1125, singleRowY + 19);

                ctx.textAlign = 'right';
                ctx.fillStyle = '#0F172A';
                ctx.font = 'bold 13.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillText(sLastName, 1060, singleRowY + 19);
                ctx.fillText(sFirstName, 860, singleRowY + 19);
            }

            // Left Column: Session Details (X = 90 to 610) - Guaranteed strictly within box!
            ctx.textAlign = 'right';
            ctx.fillStyle = '#64748B';
            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('بيانات الفوج والجلسة التقويمية:', 605, secAY + 18);

            ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('الفوج ورقم الجهاز:', 605, secAY + 44);
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText((stu.classGroup || '1AS') + '   |   حاسوب #' + pcNum, 485, secAY + 44);

            ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('طبيعة النشاط:', 605, secAY + 70);
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText((isExam ? 'امتحان رسمي (تقييمي)' : 'نشاط تطبيقي تدريبي') + (isMultiStudent ? ' (عمل مشترك)' : ''), 520, secAY + 70);

            // Date line at secAY + 96: with secAInnerH >= 142, date is 46px inside bottom border!
            ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('تاريخ الإنجاز:', 605, secAY + 96);
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText(dateFormatted, 520, secAY + 96);

            // Report ID line at secAY + 120
            ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('رقم التقرير:', 605, secAY + 120);
            ctx.font = 'bold 12.5px Consolas, monospace';
            ctx.fillStyle = '#1E3A8A';
            ctx.fillText(reportNumber, 520, secAY + 120);

            curY = secAY + secAInnerH + 12;

            // ==========================================
            // 4. SECTION B: TABLE HEADER & ROWS
            // ==========================================
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(80, curY, 1080, 28);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('القسم (ب): جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية', 1140, curY + 19);
            curY += 28;

            // Column Headers
            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(80, curY, 1080, 32);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1;
            ctx.strokeRect(80, curY, 1080, 32);

            ctx.fillStyle = '#334155';
            ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';

            ctx.textAlign = 'center';
            ctx.fillText('#', 1137, curY + 21); // col 0: 1115..1160
            ctx.textAlign = 'right';
            ctx.fillText('المهمة التطبيقية أو السؤال التقويمي', 1100, curY + 21); // col 1: 765..1115
            ctx.textAlign = 'center';
            ctx.fillText('النوع', 717, curY + 21); // col 2: 670..765
            ctx.fillText('الحالة', 615, curY + 21); // col 3: 560..670
            ctx.fillText('المحاولات', 525, curY + 21); // col 4: 490..560
            ctx.fillText('المعامل الأقصى', 450, curY + 21); // col 5: 410..490
            ctx.fillText('الممنوحة', 370, curY + 21); // col 6: 330..410
            ctx.fillText('الخصم', 295, curY + 21); // col 7: 260..330
            ctx.textAlign = 'right';
            ctx.fillText('الملاحظات وتفاصيل الإنجاز', 250, curY + 21); // col 8: 80..260
            curY += 32;

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

                ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#64748B';
                ctx.fillText(String(rIdx + 1), 1137, curY + 21);

                ctx.textAlign = 'right';
                ctx.fillStyle = '#0F172A';
                ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
                var tkTitle = tk.titleAr || ('مهمة ' + (rIdx + 1));
                if (tkTitle.length > 55) tkTitle = tkTitle.substring(0, 53) + '...';
                ctx.fillText(tkTitle, 1100, curY + 21);

                // Type Badge: مهمة عملية
                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#0369A1';
                ctx.fillText('مهمة عملية', 717, curY + 21);

                // Status Badge
                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                if (isDone) {
                    ctx.fillStyle = '#15803D';
                    ctx.fillText('مكتملة', 615, curY + 21);
                } else if (isPart) {
                    ctx.fillStyle = '#B45309';
                    ctx.fillText('منجزة جزئياً', 615, curY + 21);
                } else if (isSkip) {
                    ctx.fillStyle = '#64748B';
                    ctx.fillText('تم تخطيها', 615, curY + 21);
                } else {
                    ctx.fillStyle = '#DC2626';
                    ctx.fillText('غير منجزة', 615, curY + 21);
                }

                // Attempts
                ctx.fillStyle = '#334155';
                ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillText(isDone ? '1' : '-', 525, curY + 21);

                // Max Weight
                ctx.fillText(tkMax.toFixed(2), 450, curY + 21);

                // Earned
                ctx.fillStyle = '#1E3A8A';
                ctx.fillText(tkEarned.toFixed(2), 370, curY + 21);

                // Deduct
                if (tkDeduct > 0) {
                    ctx.fillStyle = '#DC2626';
                    ctx.fillText('-' + tkDeduct.toFixed(2), 295, curY + 21);
                } else {
                    ctx.fillStyle = '#64748B';
                    ctx.fillText('0.00', 295, curY + 21);
                }

                // Notes (Strictly clipped to cell)
                ctx.save();
                ctx.beginPath();
                ctx.rect(80, curY, 175, 32);
                ctx.clip();
                ctx.textAlign = 'right';
                ctx.font = '11.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#475569';
                var rNote = isDone ? 'تم إنجاز كافة خطوات المهمة بنجاح.' : (isSkip ? 'تم تخطي المهمة من قبل التلميذ.' : 'لم يتم استيفاء الخطوات العملية.');
                ctx.fillText(rNote, 250, curY + 21);
                ctx.restore();

                curY += 32;

                // Quiz Row (if applicable)
                var isTaskQuizDisabled = Array.isArray(cfg.quiz_disabled_tasks) && cfg.quiz_disabled_tasks.indexOf(tk.id) !== -1;
                if (showQuizzes && !isTaskQuizDisabled) {
                    var qRes = tk.quizResult;
                    var qMax = Number(qRes && qRes.maxPoints ? qRes.maxPoints : 1.0);
                    var qEarned = Number(qRes && typeof qRes.earnedPoints === 'number' ? qRes.earnedPoints : 0);
                    var qAttempts = (qRes && qRes.attempts) ? qRes.attempts : (isDone ? 1 : 0);
                    var qDeduct = Number((qMax - qEarned).toFixed(2));

                    var isQuizSkippedAll = !!(qRes && qRes.skippedAll) || (!qRes && stu.quizSkippedAll);
                    var isQuizSkippedCurrent = !!(qRes && qRes.skipped && !qRes.skippedAll);

                    if (isQuizSkippedAll || isQuizSkippedCurrent) {
                        qEarned = 0;
                        qDeduct = qMax;
                        totalDeductionsInTable += qDeduct;
                    } else if (isQuizOptedOut) {
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

                    ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#7C3AED';
                    ctx.fillText('س' + (rIdx + 1), 1137, curY + 19);

                    ctx.textAlign = 'right';
                    ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#334155';
                    var qTitle = (qRes && qRes.questionTitle) ? qRes.questionTitle : ('سؤال تقويمي للمهمة ' + (rIdx + 1));
                    if (qTitle.length > 42) qTitle = qTitle.substring(0, 40) + '...';
                    ctx.fillText(qTitle, 1100, curY + 19);

                    ctx.textAlign = 'center';
                    ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#6D28D9';
                    ctx.fillText('سؤال تقويمي', 717, curY + 19);

                    // Quiz Status
                    ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                    if (isQuizSkippedAll) {
                        ctx.fillStyle = '#D97706';
                        ctx.fillText('تم التخطي (الكل)', 615, curY + 19);
                    } else if (isQuizSkippedCurrent) {
                        ctx.fillStyle = '#D97706';
                        ctx.fillText('تم التخطي', 615, curY + 19);
                    } else if (isQuizOptedOut) {
                        ctx.fillStyle = '#DC2626';
                        ctx.fillText('معطّل', 615, curY + 19);
                    } else if (qEarned === qMax) {
                        ctx.fillStyle = '#15803D';
                        ctx.fillText('إجابة صحيحة', 615, curY + 19);
                    } else if (qEarned > 0) {
                        ctx.fillStyle = '#B45309';
                        ctx.fillText('صحيحة بعد محاولات', 615, curY + 19);
                    } else if (qRes && (qAttempts >= 3 || qEarned === 0)) {
                        ctx.fillStyle = '#DC2626';
                        ctx.fillText('استنفاد محاولات', 615, curY + 19);
                    } else if (isSkip) {
                        ctx.fillStyle = '#64748B';
                        ctx.fillText('تم تخطيه', 615, curY + 19);
                    } else {
                        ctx.fillStyle = '#64748B';
                        ctx.fillText('في الانتظار', 615, curY + 19);
                    }

                    // Attempts
                    ctx.fillStyle = '#475569';
                    ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                    var attText = isQuizSkippedAll ? '-' : (isQuizOptedOut ? '-' : (qRes ? String(qAttempts || 1) : '-'));
                    ctx.fillText(attText, 525, curY + 19);

                    // Max
                    ctx.fillText(qMax.toFixed(2), 450, curY + 19);

                    // Earned
                    ctx.fillStyle = '#6D28D9';
                    ctx.fillText(qEarned.toFixed(2), 370, curY + 19);

                    // Deduct
                    if (qDeduct > 0) {
                        ctx.fillStyle = '#DC2626';
                        ctx.fillText('-' + qDeduct.toFixed(2), 295, curY + 19);
                    } else {
                        ctx.fillStyle = '#64748B';
                        ctx.fillText('0.00', 295, curY + 19);
                    }

                    // Notes (Strictly clipped to cell)
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(80, curY, 175, 28);
                    ctx.clip();
                    ctx.textAlign = 'right';
                    ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#64748B';
                    var qNote = '';
                    if (isQuizSkippedAll) {
                        qNote = 'تخطي كل الأسئلة (-' + qMax.toFixed(2) + ' ن)';
                    } else if (isQuizSkippedCurrent) {
                        qNote = 'تخطي هذا السؤال (-' + qMax.toFixed(2) + ' ن)';
                    } else if (isQuizOptedOut) {
                        qNote = 'معطل بطلب التلميذ (-' + qMax.toFixed(2) + ' ن)';
                    } else if (qAttempts === 1) {
                        qNote = 'إجابة صحيحة محاولة 1 (100%)';
                    } else if (qAttempts === 2) {
                        qNote = 'إجابة صحيحة محاولة 2 (50%)';
                    } else {
                        qNote = 'استنفاد المحاولات (0%)';
                    }
                    ctx.fillText(qNote, 250, curY + 19);
                    ctx.restore();

                    curY += 28;
                }
            }

            // Direct Penalties row on Canvas if pen > 0
            if (pen > 0 && cfg.show_penalties !== false) {
                totalDeductionsInTable += pen;
                ctx.fillStyle = '#FFF5F5';
                ctx.fillRect(80, curY, 1080, 28);
                ctx.strokeStyle = '#FECACA';
                ctx.lineWidth = 1;
                ctx.strokeRect(80, curY, 1080, 28);

                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#DC2626';
                ctx.fillText('-', 1137, curY + 19);

                ctx.textAlign = 'right';
                ctx.fillText('خصومات عامة (مخالفة تسلسل المهام النشطة)', 1100, curY + 19);

                ctx.textAlign = 'center';
                ctx.fillText('خصم جزائي', 717, curY + 19);
                ctx.fillText('خصم من الرصيد', 615, curY + 19);
                ctx.fillText('-', 525, curY + 19);
                ctx.fillText('-', 450, curY + 19);
                ctx.fillText('-', 370, curY + 19);
                ctx.fillText('-' + pen.toFixed(2), 295, curY + 19);

                // Col 8: Strictly clipped to 175px
                ctx.save();
                ctx.beginPath();
                ctx.rect(80, curY, 175, 28);
                ctx.clip();
                ctx.textAlign = 'right';
                ctx.font = 'bold 11px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#B91C1C';
                ctx.fillText('خصم جزائي مباشر (انظر الخطوة 5)', 250, curY + 19);
                ctx.restore();
                curY += 28;
            }

            // Totals Footer Row
            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(80, curY, 1080, 34);
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(80, curY, 1080, 34);

            ctx.textAlign = 'right';
            ctx.font = 'bold 13.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText('المجموع الكلي لمعاملات ونقاط المهام والأسئلة:', 1100, curY + 22);

            ctx.textAlign = 'center';
            ctx.font = 'bold 13.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText(grandTotalMax.toFixed(2), 450, curY + 22);

            ctx.fillStyle = '#1E3A8A';
            ctx.fillText(grandTotalEarned.toFixed(2), 370, curY + 22);

            ctx.fillStyle = '#DC2626';
            ctx.fillText('-' + totalDeductionsInTable.toFixed(2), 295, curY + 22);

            // Col 8 Notes: Strictly clipped to 175px (NEVER crosses left border)
            ctx.save();
            ctx.beginPath();
            ctx.rect(80, curY, 175, 34);
            ctx.clip();
            ctx.textAlign = 'right';
            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#475569';
            var totNote = 'استيفاء ' + grandTotalEarned.toFixed(2) + ' من ' + grandTotalMax.toFixed(2) + ' ن';
            ctx.fillText(totNote, 250, curY + 22);
            ctx.restore();
            curY += 40;

            // ==========================================
            // 5 & 6. SECTION C: DEDUCTIONS METHODOLOGY & FINAL RESULT CALCULATION
            // ==========================================
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(80, curY, 1080, 28);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('القسم (ج): التفكيك الحسابي للعلامة (كيف تم احتساب المعدل خطوة بخطوة)', 1140, curY + 19);
            curY += 32;

            // Dedicated Deductions Table on Canvas (Structured 5-Column Table)
            var mList = (global.Win11Assessment && typeof global.Win11Assessment.getMistakes === 'function')
                ? global.Win11Assessment.getMistakes()
                : [];

            if (mList && mList.length > 0) {
                var dHdrY = curY;
                ctx.fillStyle = '#FEF2F2';
                ctx.fillRect(80, dHdrY, 1080, 26);
                ctx.strokeStyle = '#FECACA';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(80, dHdrY, 1080, 26);

                ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#991B1B';
                ctx.textAlign = 'right';
                ctx.fillText('جدول تفصيل طريقة الخصم والخصومات الجزائية المرصودة:', 1145, dHdrY + 18);
                ctx.textAlign = 'left';
                ctx.font = '11.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#B91C1C';
                ctx.fillText('خصم مباشر من رصيد الـ 20 نقطة', 95, dHdrY + 18);
                curY += 26;

                // 5-Column Header
                var tblHdrY = curY;
                ctx.fillStyle = '#F1F5F9';
                ctx.fillRect(80, tblHdrY, 1080, 26);
                ctx.strokeStyle = '#CBD5E1';
                ctx.lineWidth = 1;
                ctx.strokeRect(80, tblHdrY, 1080, 26);

                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#334155';
                ctx.textAlign = 'center';
                ctx.fillText('#', 1140, tblHdrY + 18);
                ctx.textAlign = 'right';
                ctx.fillText('نوع المخالفة وسبب الخصم', 1110, tblHdrY + 18);
                ctx.fillText('توقيت وسياق المخالفة', 760, tblHdrY + 18);
                ctx.fillText('الإجراء أو الإعداد المرصود', 510, tblHdrY + 18);
                ctx.textAlign = 'center';
                ctx.fillText('قيمة الخصم', 140, tblHdrY + 18);
                curY += 26;

                for (var mi = 0; mi < mList.length; mi++) {
                    var m = mList[mi];
                    var my = curY;
                    var rowH = 26;
                    ctx.fillStyle = (mi % 2 === 0) ? '#FFF5F5' : '#FFFFFF';
                    ctx.fillRect(80, my, 1080, rowH);
                    ctx.strokeStyle = '#FEE2E2';
                    ctx.strokeRect(80, my, 1080, rowH);

                    // Col 1 (#): 1120..1160
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(1120, my, 40, rowH);
                    ctx.clip();
                    ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#DC2626';
                    ctx.textAlign = 'center';
                    ctx.fillText(String(mi + 1), 1140, my + 18);
                    ctx.restore();

                    // Col 2 (Title): 770..1120
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(770, my, 350, rowH);
                    ctx.clip();
                    ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#991B1B';
                    ctx.textAlign = 'right';
                    var mTitle = m.title || 'مخالفة تسلسل المهام';
                    if (mTitle.length > 50) mTitle = mTitle.substring(0, 48) + '...';
                    ctx.fillText(mTitle, 1110, my + 18);
                    ctx.restore();

                    // Col 3 (Context & Time): 520..770
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(520, my, 250, rowH);
                    ctx.clip();
                    ctx.font = '11.5px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#7F1D1D';
                    ctx.textAlign = 'right';
                    var ctxStr = (m.time ? ('[' + m.time + '] ') : '') + (m.taskTitle ? ('أثناء ' + m.taskTitle) : '-');
                    if (ctxStr.length > 36) ctxStr = ctxStr.substring(0, 34) + '...';
                    ctx.fillText(ctxStr, 760, my + 18);
                    ctx.restore();

                    // Col 4 (Action / Desc): 200..520
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(200, my, 320, rowH);
                    ctx.clip();
                    ctx.font = '11.5px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#7F1D1D';
                    ctx.textAlign = 'right';
                    var mDesc = m.desc || '';
                    if (mDesc.length > 48) mDesc = mDesc.substring(0, 46) + '...';
                    ctx.fillText(mDesc, 510, my + 18);
                    ctx.restore();

                    // Col 5 (Penalty): 80..200
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(80, my, 120, rowH);
                    ctx.clip();
                    ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                    ctx.fillStyle = '#DC2626';
                    ctx.textAlign = 'center';
                    ctx.fillText('-' + Number(m.penalty || 0.25).toFixed(2), 140, my + 18);
                    ctx.restore();

                    curY += rowH;
                }

                // Total deductions footer row
                ctx.fillStyle = '#FEF2F2';
                ctx.fillRect(80, curY, 1080, 26);
                ctx.strokeStyle = '#FECACA';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(80, curY, 1080, 26);

                ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#991B1B';
                ctx.textAlign = 'right';
                ctx.fillText('إجمالي الخصومات الجزائية المباشرة المطروحة من العلامة:', 1110, curY + 18);

                ctx.fillStyle = '#DC2626';
                ctx.textAlign = 'center';
                ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
                ctx.fillText('-' + pen.toFixed(2), 140, curY + 18);
                curY += 32;
            } else {
                ctx.fillStyle = '#F0FDF4';
                ctx.fillRect(80, curY, 1080, 28);
                ctx.strokeStyle = '#86EFAC';
                ctx.lineWidth = 1;
                ctx.strokeRect(80, curY, 1080, 28);

                ctx.font = 'bold 12.5px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#15803D';
                ctx.textAlign = 'center';
                ctx.fillText('✔ لا توجد أي خصومات جزائية — التزام تام بالتعليمات والتسلسل المطلوب (0.00 نقطة خصم).', 620, curY + 19);
                curY += 34;
            }

            var mathSteps = [
                { num: '1', lbl: 'مجموع معاملات المهام العملية:', val: practicalEarned.toFixed(2) + ' / ' + practicalMax.toFixed(2), sub: 'مجموع النقاط المكتسبة من الخطوات العملية المنجزة', bg: '#F8FAFC' },
                { num: '2', lbl: 'مجموع معاملات الأسئلة التقويمية:', val: (showQuizzes ? (quizEarned.toFixed(2) + ' / ' + quizMax.toFixed(2)) : 'معطلة من الأستاذ'), sub: (showQuizzes ? (stu.quizSkippedAll ? 'تم تخطي كافة الأسئلة بطلب التلميذ وتصفير علاماتها' : 'نقاط الأسئلة بحسب عدد المحاولات المستهلكة') : 'تم اعتماد تقييم المهام العملية فقط'), bg: '#F8FAFC' },
                { num: '3', lbl: 'مجموع النقاط المحصلة من المعاملات:', val: grandTotalEarned.toFixed(2) + ' / ' + grandTotalMax.toFixed(2), sub: 'مجموع النقاط العملية + نقاط الأسئلة التقويمية', bg: '#F8FAFC' },
                { num: '4', lbl: 'تطبيق القاعدة الثلاثية الرسمية (من 20):', val: baseScoreOutOf20.toFixed(2) + ' / 20.00', sub: '(' + grandTotalEarned.toFixed(2) + ' ÷ ' + grandTotalMax.toFixed(2) + ') × 20 = ' + baseScoreOutOf20.toFixed(2), bg: '#F0F9FF' },
                { num: '5', lbl: 'الخصومات الجزائية المباشرة من العلامة:', val: (pen > 0 ? ('-' + pen.toFixed(2)) : '0.00') + ' نقطة', sub: (pen > 0 ? 'خصومات جزائية مباشرة عن مخالفات تسلسل المهام تُطرح من علامة الـ 20' : 'أداء نظامي سليم بدون أي خصومات'), bg: pen > 0 ? '#FEF2F2' : '#F8FAFC' }
            ];

            for (var mIdx = 0; mIdx < mathSteps.length; mIdx++) {
                var ms = mathSteps[mIdx];
                ctx.fillStyle = ms.bg;
                ctx.fillRect(80, curY, 1080, 30);
                ctx.strokeStyle = '#E2E8F0';
                ctx.lineWidth = 1;
                ctx.strokeRect(80, curY, 1080, 30);

                ctx.fillStyle = (mIdx === 4 && pen > 0) ? '#DC2626' : '#2563EB';
                ctx.beginPath();
                ctx.arc(1142, curY + 15, 11, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ms.num, 1142, curY + 19);

                ctx.textAlign = 'right';
                ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = '#0F172A';
                ctx.fillText(ms.lbl, 1120, curY + 20);

                ctx.save();
                ctx.direction = 'ltr';
                ctx.textAlign = 'center';
                ctx.font = 'bold 14px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = (mIdx === 4 && pen > 0) ? '#DC2626' : '#1E3A8A';
                ctx.fillText(ms.val, 550, curY + 20);
                ctx.restore();

                ctx.textAlign = 'right';
                ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
                ctx.fillStyle = (mIdx === 4 && pen > 0) ? '#B91C1C' : '#64748B';
                ctx.fillText(ms.sub, 440, curY + 20);

                curY += 32;
            }

            // Step 6: Final Score
            ctx.fillStyle = '#F0FDF4';
            ctx.fillRect(80, curY, 1080, 34);
            ctx.strokeStyle = '#16A34A';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(80, curY, 1080, 34);

            ctx.fillStyle = '#16A34A';
            ctx.beginPath();
            ctx.arc(1142, curY + 17, 11, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('6', 1142, curY + 21);

            ctx.textAlign = 'right';
            ctx.font = 'bold 13.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText('العلامة النهائية المعتمدة المستحقة:', 1120, curY + 22);

            ctx.save();
            ctx.direction = 'ltr';
            ctx.textAlign = 'center';
            ctx.font = '900 17px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#15803D';
            ctx.fillText(finalScoreStr + ' / 20.00', 550, curY + 22);
            ctx.restore();

            ctx.textAlign = 'right';
            ctx.font = '11px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#15803D';
            ctx.fillText(pen > 0 ? (baseScoreOutOf20.toFixed(2) + ' - ' + pen.toFixed(2) + ' = ' + finalScoreStr) : 'مطابقة للقاعدة الثلاثية دون خصم', 440, curY + 21);

            curY += 38;

            // Section D: Audit & Identity Modification Log (Canvas fallback)
            var stuHistory = (stu && stu.history) || (global.Win11Assessment && typeof global.Win11Assessment.getStudentHistory === 'function' ? global.Win11Assessment.getStudentHistory() : null);
            var hasModifications = !!(stuHistory && stuHistory.modifications && stuHistory.modifications.length > 0);

            if (hasModifications) {
                curY += 10;
                ctx.fillStyle = '#FFFBEB';
                ctx.fillRect(80, curY, 1080, 26);
                ctx.strokeStyle = '#D97706';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(80, curY, 1080, 26);

                ctx.fillStyle = '#D97706';
                ctx.fillRect(1156, curY, 4, 26);

                ctx.fillStyle = '#92400E';
                ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('القسم (د): سجل تدقيق وتعديل بيانات الهوية والجلسة (نظام مكافحة الانتحال والتحقق الأمني)', 1140, curY + 18);

                ctx.font = 'bold 11px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('⚠️ تم تسجيل ' + stuHistory.modifications.length + ' تعديل(ات) أثناء الجلسة', 95, curY + 18);
                curY += 30;

                ctx.fillStyle = '#F8FAFC';
                ctx.fillRect(80, curY, 1080, 24);
                ctx.strokeStyle = '#CBD5E1';
                ctx.lineWidth = 1;
                ctx.strokeRect(80, curY, 1080, 24);

                ctx.fillStyle = '#334155';
                ctx.font = 'bold 10px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('المرحلة', 1100, curY + 16);
                ctx.fillText('توقيت النظام', 980, curY + 16);
                ctx.fillText('وقت المحاكاة', 860, curY + 16);
                ctx.fillText('نسبة الإنجاز', 720, curY + 16);
                ctx.fillText('البيان المعدل', 560, curY + 16);
                ctx.textAlign = 'right';
                ctx.fillText('تفاصيل التغيير (سابق ➔ جديد)', 420, curY + 16);
                curY += 24;

                var initSnap = stuHistory.initial || {};
                ctx.fillStyle = '#F1F5F9';
                ctx.fillRect(80, curY, 1080, 22);
                ctx.strokeStyle = '#E2E8F0';
                ctx.strokeRect(80, curY, 1080, 22);

                ctx.fillStyle = '#475569';
                ctx.font = '9.5px "Segoe UI", Tahoma, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('التسجيل الأولي', 1100, curY + 15);
                ctx.fillText(initSnap.timestamp || '00:00:00', 980, curY + 15);
                ctx.fillText('00:00:00', 860, curY + 15);
                ctx.fillText('0% (انطلاق)', 720, curY + 15);
                ctx.fillText('بيانات أصلية', 560, curY + 15);
                ctx.textAlign = 'right';
                var initDesc = 'الاسم: ' + (initSnap.fullName || stu.fullName) + ' | فوج: ' + (initSnap.classGroup || stu.classGroup) + ' | جهاز #' + (initSnap.pcNumber || stu.pcNumber);
                ctx.fillText(initDesc, 420, curY + 15);
                curY += 22;

                for (var mi = 0; mi < Math.min(3, stuHistory.modifications.length); mi++) {
                    var mItem = stuHistory.modifications[mi];
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(80, curY, 1080, 22);
                    ctx.strokeStyle = '#E2E8F0';
                    ctx.strokeRect(80, curY, 1080, 22);

                    ctx.fillStyle = '#B45309';
                    ctx.font = 'bold 9.5px "Segoe UI", Tahoma, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('تعديل ' + (mItem.editNumber || (mi + 1)), 1100, curY + 15);
                    ctx.fillText(mItem.timestamp, 980, curY + 15);
                    ctx.fillText(mItem.elapsedFormatted, 860, curY + 15);
                    ctx.fillStyle = '#2563EB';
                    ctx.fillText(mItem.progressPercent + '% (' + mItem.doneTasksCount + '/' + mItem.totalTasksCount + ')', 720, curY + 15);

                    var fLabels = (mItem.changes || []).map(function (c) { return c.labelAr; }).join('، ');
                    ctx.fillStyle = '#78350F';
                    ctx.fillText(fLabels, 560, curY + 15);

                    var diffSummary = (mItem.changes || []).map(function (c) {
                        if (c.notice) return (c.isRemoval ? '⚠️ ' : '') + c.labelAr + ': ' + c.notice;
                        return c.labelAr + ': [' + c.oldVal + ' ➔ ' + c.newVal + ']';
                    }).join(' | ');
                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#0F172A';
                    ctx.fillText(diffSummary, 420, curY + 15);
                    curY += 22;
                }
            }

            // 7. Signature & Seal + Teacher Observations
            var ySig = Math.max(1540, curY + 16);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#64748B';
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(100, ySig, 340, 110);
            ctx.setLineDash([]);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 13.5px "Segoe UI", Tahoma, sans-serif';
            ctx.fillText('توقيع وختم الأستاذ(ة)', 270, ySig + 32);

            ctx.textAlign = 'right';
            ctx.font = 'bold 13px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#0F172A';
            ctx.fillText('ملاحظات وتوجيهات الأستاذ(ة):', 1140, ySig + 18);

            ctx.fillStyle = '#94A3B8';
            ctx.fillText('............................................................................................................................................', 1140, ySig + 45);
            ctx.fillText('............................................................................................................................................', 1140, ySig + 72);

            ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.fillText('حرر في: ' + dateFormatted, 1140, ySig + 98);

            // Page Footer
            ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.textAlign = 'center';
            ctx.fillText('صفحة 1 من 1', 620, 1690);

            ctx.font = '11.5px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('محاكاة بيئة التعامل مع الحاسوب (لوحة التحكم Windows 11) — مادة الإعلام الآلي', 1140, 1690);

            ctx.textAlign = 'left';
            ctx.fillText('وثيقة تقييم رسمية غير قابلة للتعديل', 100, 1690);

            // Convert to JPEG bytes and build PDF
            var dataUrl = canvas.toDataURL('image/jpeg', 0.94);
            var b64Data = dataUrl.split(',')[1];
            var binStr = atob(b64Data);
            var jpegBytes = new Uint8Array(binStr.length);
            for (var bIdx = 0; bIdx < binStr.length; bIdx++) {
                jpegBytes[bIdx] = binStr.charCodeAt(bIdx) & 0xFF;
            }

            return buildPdfFromJpegBytes(jpegBytes, 1240, 1754);
        } catch (e) {
            console.error('generateReportPdfUint8 error:', e);
            return null;
        }
    }

    function generateReportPdfBlob() {
        try {
            var pdfUint8 = generateReportPdfUint8();
            if (!pdfUint8) return null;
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
                        '<button type="button" class="win-btn win-btn-secondary a4-goto-pending-btn" data-task-id="' + utk.id + '" style="min-height:26px;padding:2px 10px;font-size:11.5px;color:#0067C0;flex-shrink:0;display:inline-flex;align-items:center;gap:4px;">' +
                            '<span>' + bidi('الانتقال للمهمة') + '</span>' + (global.Win11Icons ? global.Win11Icons.get('arrowBackCurved', 12) : '') +
                        '</button>' +
                    '</div>';
            }

            guidanceBannerHtml =
                '<div class="a4-guidance-card" style="margin-bottom:16px;background:#FFFBEB;border:1.5px solid #F59E0B;border-radius:8px;padding:12px 16px;text-align:right;box-shadow:0 2px 8px rgba(245,158,11,0.08);">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
                        '<span style="color:#D97706;line-height:1;display:inline-flex;">' + (global.Win11Icons ? global.Win11Icons.get('bulb', 20) : '') + '</span>' +
                        '<strong style="font-size:14px;color:#92400E;">' + bidi('توجيه تربوي — استكمال مسار الأنشطة العملية:') + '</strong>' +
                    '</div>' +
                    '<div style="font-size:12.5px;color:#78350F;line-height:1.6;margin-bottom:10px;">' +
                        bidi('أحسنت صنعاً بما أنجزته حتى الآن (استيفاء ') + '<strong><bdi dir="ltr">' + doneTasksCount + '</bdi></strong>' + bidi(' من أصل ') + '<strong><bdi dir="ltr">' + allTasks.length + '</bdi></strong>' + bidi(' مهام). لتحقيق التحكم التام في الكفاءات المقررة ورفع علامتك المستحقة، نوصيك باستكمال المهام المتبقية التالية:') +
                    '</div>' +
                    taskListItems +
                    '<div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap;">' +
                        '<button type="button" class="win-btn win-btn-accent" id="a4-btn-resume-all" style="padding:5px 16px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">' +
                            '<span>' + bidi('مواصلة إنجاز المهام الآن') + '</span>' + (global.Win11Icons ? global.Win11Icons.get('arrowBackCurved', 13) : '') +
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
                        '<span style="color:#107C41;line-height:1;display:inline-flex;">' + (global.Win11Icons ? global.Win11Icons.get('check', 22) : '✓') + '</span>' +
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
                label: 'مواصلة إنجاز المهام',
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
        preloadLogo: preloadLogo,
        ensureLogoReady: ensureLogoReady,
        buildA4Html: buildA4Html,
        buildStandaloneHtmlDoc: buildStandaloneHtmlDoc,
        generateReportPdfUint8: generateReportPdfUint8,
        generateReportPdfBlob: generateReportPdfBlob
    };

    try {
        if (global.Win11Assessment && typeof global.Win11Assessment.getConfig === 'function') {
            var bCfg = global.Win11Assessment.getConfig();
            if (bCfg && bCfg.report_logo_b64) preloadLogo(bCfg.report_logo_b64);
        }
    } catch (eBoot) {}
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('DOMContentLoaded', function () {
            try {
                if (global.Win11Assessment && typeof global.Win11Assessment.getConfig === 'function') {
                    var c = global.Win11Assessment.getConfig();
                    if (c && c.report_logo_b64) preloadLogo(c.report_logo_b64);
                }
            } catch (eDcl) {}
        });
    }
})(window);
