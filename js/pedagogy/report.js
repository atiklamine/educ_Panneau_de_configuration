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
        var hasFolderAction = !!desktopPath || (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0);

        toast.innerHTML =
            '<span class="export-toast-icon">✓</span>' +
            '<div class="export-toast-body">' +
                '<span>' + bidi('تم حفظ وثيقة الدرس والتقويم على سطح المكتب باسم:') + ' </span>' +
                '<bdi dir="ltr" class="export-toast-filename">' + esc(filename) + '</bdi>' +
            '</div>' +
            (hasFolderAction ? '<button type="button" class="win-btn win-btn-accent export-toast-open-btn" id="export-toast-open-file"' + pathAttr + '>' + bidi('فتح الملف') + '</button>' : '') +
            (hasFolderAction ? '<button type="button" class="win-btn win-btn-secondary export-toast-open-btn" id="export-toast-open-folder"' + pathAttr + '>' + bidi('فتح المجلد') + '</button>' : '') +
            '<button type="button" class="export-toast-close" aria-label="Close">&times;</button>';

        var openFileBtn = toast.querySelector('#export-toast-open-file');
        if (openFileBtn) {
            openFileBtn.onclick = function () {
                var targetPath = openFileBtn.getAttribute('data-folder-path') || '';
                if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                    global.fetch('/api/open-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: targetPath })
                    }).catch(function () {});
                } else if (global.external && typeof global.external.OpenFile === 'function') {
                    try { global.external.OpenFile(targetPath); } catch (e) {}
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
        var targetPath = desktopPath || '';

        global.Win11Dialogs.showCustom({
            title: 'تم تصدير وحفظ الوثيقة على سطح المكتب بنجاح',
            tone: 'info',
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:12px;font-size:13px;line-height:1.6">' +
                        '<div style="display:flex;align-items:center;gap:10px">' +
                            '<div style="width:36px;height:36px;border-radius:50%;background:#107C41;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;flex-shrink:0">✓</div>' +
                            '<div>' +
                                '<div style="font-weight:700;font-size:14px;color:#107C41">' + bidi('تم حفظ وثيقة الدرس والتقويم كملف PDF على سطح المكتب!') + '</div>' +
                                '<div style="font-size:12px;color:var(--win-text-secondary)">' + bidi('تم التصدير مباشرة وبنجاح دون الحاجة لكتابة اسم الملف.') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="background:var(--win-surface-subtle);border:1px solid var(--win-border-control);border-radius:6px;padding:10px 12px">' +
                            '<div style="margin-bottom:4px"><strong>' + bidi('اسم الملف:') + '</strong> <bdi dir="ltr" style="font-family:Consolas,monospace;font-weight:600">' + esc(filename) + '</bdi></div>' +
                            (targetPath ? ('<div style="font-size:11.5px;color:var(--win-text-secondary)"><strong>' + bidi('المسار الكامل:') + '</strong> <bdi dir="ltr">' + esc(targetPath) + '</bdi></div>') : '') +
                        '</div>' +
                        '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi('يمكنك فتح الملف مباشرة لمعاينته وطباعته، أو فتح مجلد سطح المكتب:') + '</div>' +
                    '</div>';
            },
            buttons: [
                {
                    id: 'btn-open-file-direct',
                    label: 'فتح الملف مباشرة',
                    primary: true,
                    onClick: function (closeDlg) {
                        if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                            global.fetch('/api/open-file', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: targetPath })
                            }).catch(function () {});
                        } else if (global.external && typeof global.external.OpenFile === 'function') {
                            try { global.external.OpenFile(targetPath); } catch (e) {}
                        }
                        closeDlg(true);
                    }
                },
                {
                    id: 'btn-open-folder-direct',
                    label: 'فتح المجلد',
                    primary: false,
                    onClick: function (closeDlg) {
                        if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                            global.fetch('/api/open-folder', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: targetPath })
                            }).catch(function () {});
                        } else if (global.external && typeof global.external.OpenFolder === 'function') {
                            try { global.external.OpenFolder(targetPath); } catch (e) {}
                        }
                        closeDlg(true);
                    }
                },
                {
                    label: global.Win11I18N.t('app.close'),
                    primary: false,
                    value: false
                }
            ]
        });
    }

    function saveReportToDesktop(filename, onComplete) {
        var htmlContent = buildStandaloneHtmlDoc();
        var isPdfReq = filename && /\.pdf$/i.test(filename);
        var targetExt = isPdfReq ? 'pdf' : 'html';
        var cleanName = normalizeExportFilename(filename, targetExt, formatSuggestedFilename(targetExt));

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
                return r.json();
            }).then(function (data) {
                if (data && data.ok) {
                    showExportSuccessToast(data.filename || cleanName, data.path || null);
                    if (onComplete) onComplete(null, data);
                } else {
                    downloadTextFile(cleanName, isPdfReq ? 'application/pdf' : 'text/html', htmlContent);
                    showExportSuccessToast(cleanName, null);
                    if (onComplete) onComplete(null, { ok: true, filename: cleanName });
                }
            }).catch(function () {
                downloadTextFile(cleanName, isPdfReq ? 'application/pdf' : 'text/html', htmlContent);
                showExportSuccessToast(cleanName, null);
                if (onComplete) onComplete(null, { ok: true, filename: cleanName });
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
                    showExportSuccessToast(finalName, savedPath);
                    if (onComplete) onComplete(null, { ok: true, filename: finalName, path: savedPath });
                    return;
                }
            } catch (ex) {}
        }

        // 3. Fallback: Browser downloadTextFile
        downloadTextFile(cleanName, 'text/html', htmlContent);
        showExportSuccessToast(cleanName, null);
        if (onComplete) onComplete(null, { ok: true, filename: cleanName });
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
                    '<p style="margin:0;font-size:12.5px;color:#64748b">' + bidi('يرجى إدخال اسمك ولقبك وفوجك للبدء في إنجاز الأنشطة البيداغوجية') + '</p>' +
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

            if (global.Win11Assessment && typeof global.Win11Assessment.startSession === 'function') {
                global.Win11Assessment.startSession({
                    lastName: ln,
                    firstName: fn,
                    fullName: ln + ' ' + fn,
                    classGroup: grpSel ? grpSel.value : (groups[0] || '1AS-1'),
                    pcNumber: pcSel ? pcSel.value : '01',
                    mode: chosenMode
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
                                pcNumber: pcEl ? pcEl.value : '01'
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
                        mode: modeChecked ? modeChecked.value : (cfg.mode || 'training')
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
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:10px">' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.lastNameLabel')) + '</label>' +
                                '<input type="text" id="stu-reg-lastname" class="win-input" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.lastNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(initLn) + '">' +
                            '</div>' +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('pedagogy.firstNameLabel')) + '</label>' +
                                '<input type="text" id="stu-reg-firstname" class="win-input" placeholder="' + global.Win11Compat.escapeHtml(t('pedagogy.firstNamePlaceholder')) + '" value="' + global.Win11Compat.escapeHtml(initFn) + '">' +
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
                        '<div id="stu-reg-err" style="color:var(--win-danger);font-size:12px;min-height:16px"></div>' +
                    '</div>';
            },
            buttons: btns
        });
    }

    function renderSectionTimingsHtml(timings, bidi) {
        var keys = [];
        for (var k in timings) {
            if (Object.prototype.hasOwnProperty.call(timings, k) && timings[k].activeSeconds > 0) {
                keys.push(k);
            }
        }
        if (keys.length === 0) return '';
        var rows = '';
        for (var i = 0; i < keys.length; i++) {
            var sec = keys[i];
            var lbl = SECTION_LABELS_AR[sec] || sec;
            rows +=
                '<tr>' +
                    '<td>' + bidi(lbl) + '</td>' +
                    '<td><bdi dir="ltr">' + global.Win11Assessment.formatDuration(timings[sec].activeSeconds) + '</bdi></td>' +
                '</tr>';
        }
        return (
            '<div style="font-weight:700;font-size:13px;margin:12px 0 4px">' + bidi('توزيع المدة المستغرقة حسب أقسام النظام:') + '</div>' +
            '<table class="a4-report-table">' +
                '<thead><tr><th>القسم</th><th>المدة المستغرقة</th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
            '</table>'
        );
    }

    function renderDeductionsTableHtml(scores, cfg, bidi) {
        if (!cfg.show_penalties && !cfg.show_mistakes) return '';
        var list = (scores && Array.isArray(scores.deductions)) ? scores.deductions : [];
        var rows = '';
        for (var i = 0; i < list.length; i++) {
            var d = list[i];
            rows +=
                '<tr>' +
                    '<td>' + bidi(d.taskTitle || 'تقييم عام') + '</td>' +
                    '<td>' + bidi(d.reason || '-') + '</td>' +
                    '<td><bdi dir="ltr">-' + Number(d.points || 0).toFixed(2) + '</bdi></td>' +
                '</tr>';
        }
        if (list.length === 0) {
            rows = '<tr><td colspan="3" style="text-align:center;color:#065F46">' + bidi('لا توجد أي خصومات أو مخالفات مسجلة (0.00 نقطة).') + '</td></tr>';
        }
        var tot = Number((scores && scores.totalDeductions !== undefined) ? scores.totalDeductions : (scores ? scores.penalties : 0));
        return (
            '<div style="margin-top:14px">' +
                '<div style="font-weight:700;font-size:13px;margin-bottom:4px">' + bidi('جدول الخصومات والمخالفات التفصيلي:') + '</div>' +
                '<table class="a4-report-table">' +
                    '<thead><tr><th>المهمة</th><th>سبب الخصم / المخالفة</th><th>النقاط المخصومة</th></tr></thead>' +
                    '<tbody>' +
                        rows +
                        '<tr class="ped-deduction-row-total"><td colspan="2">' + bidi('إجمالي الخصومات') + '</td><td><bdi dir="ltr">-' + tot.toFixed(2) + '</bdi></td></tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>'
        );
    }

    var ACCOUNT_EVENT_LABELS_AR = {
        account_create: 'إنشاء حساب',
        account_delete: 'حذف حساب',
        account_type: 'تعديل نوع الحساب',
        password_change: 'تعديل كلمة المرور',
        avatar_change: 'تغيير الصورة الرمزية',
        login: 'تسجيل دخول',
        login_initial_pw: 'دخول بكلمة المرور الأولى',
        login_new_pw: 'دخول بكلمة المرور الجديدة',
        logout_standard: 'تسجيل خروج (قياسي)',
        switch_user: 'تبديل المستخدم',
        switch_guest: 'تبديل إلى حساب الضيف',
        guest_enable: 'تفعيل حساب الضيف',
        guest_disable: 'تعطيل حساب الضيف',
        guest_reset: 'إعادة ضبط الضيف',
        guest_uac_denied: 'حظر إداري (UAC)'
    };

    var ACCOUNT_ROLE_LABELS_AR = {
        Administrateur: 'مسؤول (Administrateur)',
        Standard: 'قياسي (Standard)',
        'Invité': 'ضيف (Invité)'
    };

    function renderAccountLogHtml(bidi) {
        if (!global.Win11State || typeof global.Win11State.get !== 'function') return '';
        var st = global.Win11State.get();
        var rawLog = (st && Array.isArray(st.accountActionLog)) ? st.accountActionLog : [];
        var validEvents = [];
        for (var i = 0; i < rawLog.length; i++) {
            var item = rawLog[i];
            if (item && (item.type || item.event || item.detailAr || item.details)) {
                validEvents.push(item);
            }
        }
        var headerHtml = '<div style="font-weight:700;font-size:13px;margin-bottom:4px">' +
            bidi('سجل أحداث الحسابات والتدقيق الزمني') + ' (<bdi dir="ltr">' + validEvents.length + '</bdi>):</div>';
        if (validEvents.length === 0) {
            return (
                '<div style="margin-top:12px">' +
                    headerHtml +
                    '<div class="a4-empty-log-msg" style="font-size:12.5px;color:#475569;padding:8px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:4px">' +
                        bidi('لا توجد أحداث مسجلة.') +
                    '</div>' +
                '</div>'
            );
        }
        var rows = '';
        for (var j = 0; j < validEvents.length; j++) {
            var e = validEvents[j];
            var timeText = e.wallTime || e.elapsed || e.time || '00:00:00';
            var evKey = e.type || e.event || '';
            var evLabel = ACCOUNT_EVENT_LABELS_AR[evKey] || evKey || 'حدث';
            var targetName = e.target || e.targetUser || e.actor || '-';
            var rawRole = e.accountType || '-';
            var roleLabel = ACCOUNT_ROLE_LABELS_AR[rawRole] || rawRole;
            var detailText = e.detailAr || e.details || '-';
            rows +=
                '<tr>' +
                    '<td class="col-time"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(timeText) + '</bdi></td>' +
                    '<td class="col-event">' + bidi(evLabel) + '</td>' +
                    '<td class="col-account"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(targetName) + '</bdi></td>' +
                    '<td class="col-role">' + bidi(roleLabel) + '</td>' +
                    '<td class="col-details" style="font-size:11.5px">' + bidi(detailText) + '</td>' +
                '</tr>';
        }
        return (
            '<div style="margin-top:12px">' +
                headerHtml +
                '<table class="a4-report-table a4-account-log-table">' +
                    '<thead><tr>' +
                        '<th class="col-time">التوقيت</th>' +
                        '<th class="col-event">الحدث</th>' +
                        '<th class="col-account">اسم الحساب</th>' +
                        '<th class="col-role">النوع</th>' +
                        '<th class="col-details">التفاصيل</th>' +
                    '</tr></thead>' +
                    '<tbody>' + rows + '</tbody>' +
                '</table>' +
            '</div>'
        );
    }

    function buildA4Html() {
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var esc = global.Win11Compat ? global.Win11Compat.escapeHtml : function (s) { return s; };
        var cfg = (global.Win11Assessment && typeof global.Win11Assessment.getConfig === 'function')
            ? global.Win11Assessment.getConfig()
            : {};
        var stu = (global.Win11Assessment && typeof global.Win11Assessment.getStudent === 'function')
            ? global.Win11Assessment.getStudent()
            : {};
        var scores = (global.Win11Assessment && typeof global.Win11Assessment.getScores === 'function')
            ? global.Win11Assessment.getScores()
            : {};

        var institutionName = (cfg && cfg.institution_name) ? cfg.institution_name : 'مدرسة أشبال الأمة الشهيد قورين محمد الأغواط ن.ع4.';
        var academicYear = (cfg && cfg.academic_year) ? cfg.academic_year : '2026 / 2027';

        // Student evaluation values
        var studentName = '';
        if (stu.lastName && stu.firstName) {
            studentName = esc(stu.lastName + ' ' + stu.firstName);
        } else if (stu.fullName && stu.fullName.trim()) {
            studentName = esc(stu.fullName.trim());
        } else {
            studentName = '............................................';
        }

        var classGroup = (stu.classGroup && stu.classGroup.trim()) ? esc(stu.classGroup) : '..................................';
        var pcNumber = stu.pcNumber ? ('#' + esc(String(stu.pcNumber))) : '#..........';

        var finalScoreStr = '';
        if (scores.finalScore !== undefined) {
            finalScoreStr = scores.finalScore.toFixed(2);
        } else if (scores.net !== undefined) {
            finalScoreStr = scores.net.toFixed(2);
        } else {
            finalScoreStr = '................';
        }

        var totalSec = stu.elapsedSeconds || 0;
        var m = Math.floor(totalSec / 60);
        var s = totalSec % 60;
        var mStr = (m < 10 ? '0' : '') + m;
        var sStr = (s < 10 ? '0' : '') + s;
        var timeFormatted = mStr + ' m : ' + sStr + ' sec';

        return (
            '<div class="a4-report-sheet doc-official-summary" dir="rtl" lang="ar">' +
                '<!-- ==================== PAGE 1 ==================== -->' +
                '<div class="page-container">' +
                    '<header class="doc-header">' +
                        '<div class="header-badge-box">' +
                            '<div>' + bidi('وثيقة الدرس للوحدة (4)') + '</div>' +
                            '<div style="font-size:7.5pt;font-weight:normal">' + bidi('السنة الدراسية:') + ' <span class="val-academic-year">' + esc(academicYear) + '</span></div>' +
                        '</div>' +
                        '<div class="header-top">' +
                            '<span style="margin-right:auto;margin-left:auto">' + bidi('الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية') + '</span>' +
                        '</div>' +
                        '<div class="header-institution">' +
                            '<span class="val-institution-name">' + esc(institutionName) + '</span>' +
                        '</div>' +
                        '<div class="header-main">' +
                            '<div class="doc-title">' + bidi('المجال المفاهيمي الأول: بيئة التعامل مع الحاسوب') + '</div>' +
                            '<div class="doc-subtitle">' + bidi('الوحدة التعليمية الرابعة: لوحة التحكم (Panneau de configuration)') + '</div>' +
                        '</div>' +
                        '<div class="header-meta">' +
                            '<div><strong>' + bidi('المستوى:') + '</strong> ' + bidi('الأولى ثانوي جذع مشترك ع / ت') + '</div>' +
                            '<div><strong>' + bidi('المدة الزمنية:') + '</strong> ' + bidi('01 ساعة (حصة تطبيقية)') + '</div>' +
                            '<div><strong>' + bidi('السنة الدراسية:') + '</strong> <span class="val-academic-year">' + esc(academicYear) + '</span></div>' +
                        '</div>' +
                    '</header>' +

                    '<h2 class="sec-title">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' +
                        bidi('1. مفهوم لوحة التحكم (Notion du Panneau de configuration)') +
                    '</h2>' +
                    '<div class="definition-box">' +
                        '<strong>' + bidi('لوحة التحكم:') + '</strong> ' +
                        bidi('هي برنامج تطبيقي مدمج مع نظام التشغيل (Windows)، تسمح للمستخدم بالتحكم في أغلب الميزات والخصائص والإعدادات الأساسية للنظام (عتاداً وبرمجيات) وتخصيصها بالطريقة التي تناسب احتياجاته ومستوى صلاحياته.') +
                    '</div>' +

                    '<h2 class="sec-title">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>' +
                        bidi('2. طرق الوصول إلى لوحة التحكم') +
                    '</h2>' +
                    '<div class="two-cols">' +
                        '<div class="bordered-card">' +
                            '<strong>' + bidi('أ) الطريقة التقليدية (Panneau de configuration):') + '</strong>' +
                            '<ul>' +
                                '<li>' + bidi('النقر على زر') + ' <strong>' + bidi('ابدأ (Démarrer)') + '</strong>.</li>' +
                                '<li>' + bidi('اختيار') + ' <strong>' + bidi('لوحة التحكم (Panneau de configuration)') + '</strong> ' + bidi('من قائمة البرامج أو الأدوات المساعدة.') + '</li>' +
                            '</ul>' +
                        '</div>' +
                        '<div class="bordered-card">' +
                            '<strong>' + bidi('ب) الطريقة الحديثة (Paramètres / Settings):') + '</strong>' +
                            '<ul>' +
                                '<li>' + bidi('النقر على زر') + ' <strong>' + bidi('ابدأ (Démarrer)') + '</strong> &larr; <strong>' + bidi('الإعدادات (Paramètres)') + '</strong>.</li>' +
                                '<li>' + bidi('أو الضغط على اختصار لوحة المفاتيح:') + ' <bdi dir="ltr">[ Win + I ]</bdi>.</li>' +
                            '</ul>' +
                        '</div>' +
                    '</div>' +
                    '<div style="font-size:8.5pt;background:#f9f9f9;border:1px solid #ddd;padding:4px 8px;border-radius:3px;margin-bottom:6px">' +
                        '★ <strong>' + bidi('ملاحظة:') + '</strong> ' + bidi('في نظام التشغيل Windows7 يمكن عرض إعدادات لوحة التحكم وفق نوعين: نمط العرض كفئات ومجموعات وظيفية (Par catégories)، أو نمط العرض الكلاسيكي بالأيقونات الكبيرة أو الصغيرة (Grandes / Petites icônes).') +
                    '</div>' +

                    '<h2 class="sec-title">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>' +
                        bidi('3. من بين أهم وظائف لوحة التحكم') +
                    '</h2>' +
                    '<div class="functions-grid">' +
                        '<div class="bordered-card">' +
                            '<h3 class="sub-title">' + bidi('(1) العرض وخصائصه (Affichage & Personnalisation):') + '</h3>' +
                            '<p>' + bidi('تسمح بتغيير المظهر وإضفاء الطابع الشخصي على بيئة العمل:') + '</p>' +
                            '<ul>' +
                                '<li>' + bidi('تغيير خلفية سطح المكتب (Arrière-plan du bureau) من المعرض أو من مجلد الصور الخاص بالمستخدم.') + '</li>' +
                                '<li>' + bidi('تحديد ألوان النوافذ ولون التمييز (Couleur d\'accentuation).') + '</li>' +
                                '<li><strong>' + bidi('شاشة التوقف (Écran de veille):') + '</strong> ' + bidi('خلفية أو حركة تظهر تلقائياً بعد فترة زمنية محددة من عدم استعمال الحاسوب لتوفير الطاقة وحماية الخصوصية.') + '</li>' +
                            '</ul>' +
                        '</div>' +
                        '<div class="bordered-card">' +
                            '<h3 class="sub-title">' + bidi('(2) الفأرة (Souris):') + '</h3>' +
                            '<p>' + bidi('التحكم في العتاد وسلوك المؤشر:') + '</p>' +
                            '<ul>' +
                                '<li>' + bidi('التحكم في سرعة النقر المزدوج (Vitesse du double-clic: بطيئة / سريعة).') + '</li>' +
                                '<li>' + bidi('تغيير مظهر ونظام مؤشر الفأرة (Curseur / Modèles).') + '</li>' +
                                '<li>' + bidi('تبديل الزر الأساسي للفأرة لاستعمال اليد اليسرى.') + '</li>' +
                            '</ul>' +
                        '</div>' +
                        '<div class="bordered-card">' +
                            '<h3 class="sub-title">' + bidi('(3) الخيارات الإقليمية واللغة (Région et langue):') + '</h3>' +
                            '<p>' + bidi('تكييف الحاسوب مع المحيط الجغرافي واللغوي:') + '</p>' +
                            '<ul>' +
                                '<li>' + bidi('تحديد المنطقة الزمنية (مثل: الجزائر GMT + 1).') + '</li>' +
                                '<li>' + bidi('تعديل تنسيق الوقت، التاريخ، والعملة.') + '</li>' +
                                '<li>' + bidi('إضافة أو إزالة لغات الإدخال في لوحة المفاتيح وتغيير لغة العرض للنظام.') + '</li>' +
                            '</ul>' +
                        '</div>' +
                        '<div class="bordered-card">' +
                            '<h3 class="sub-title">' + bidi('(4) إضافة وإزالة البرامج (Applications et fonctionnalités):') + '</h3>' +
                            '<p>' + bidi('التدبير السليم للبرمجيات والمساحة التخزينية:') + '</p>' +
                            '<ul>' +
                                '<li>' + bidi('تثبيت برامج جديدة عبر معالجات الإعداد (Setup.exe).') + '</li>' +
                                '<li>' + bidi('إلغاء تثبيت البرامج الزائدة لحماية النظام وتسريعه.') + '</li>' +
                                '<li>' + bidi('تفعيل أو تعطيل الميزات الاختيارية للنظام (Fonctionnalités facultatives).') + '</li>' +
                            '</ul>' +
                        '</div>' +
                    '</div>' +

                    '<div class="page-footer-note">' +
                        '<span>' + bidi('منهاج مادة الإعلام الآلي — السنة الأولى ثانوي (المجال 1: بيئة التعامل مع الحاسوب)') + '</span>' +
                        '<span>' + bidi('الصفحة 1 من 2') + '</span>' +
                    '</div>' +
                '</div>' +

                '<!-- ==================== PAGE 2 ==================== -->' +
                '<div class="page-container page-break">' +
                    '<h2 class="sec-title">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' +
                        bidi('4. حسابات المستخدمين (Comptes d\'utilisateurs)') +
                    '</h2>' +
                    '<div class="definition-box">' +
                        '<strong>' + bidi('مفهوم حساب المستخدم:') + '</strong> ' +
                        bidi('هو مساحة شخصية ومستقلة في نظام التشغيل مخصصة لمستخدم محدد، توفر له بيئة عمل خاصة تضم برامجه، ملفاته، مجلداته، وخلفية واجهته، وتفصل بين خصوصيات مختلف مستخدمي نفس الحاسوب.') +
                    '</div>' +

                    '<h3 class="sub-title">' + bidi('أ) مقارنة علمية دقيقة بين أنواع الحسابات وصلاحياتها (جدول مصحح ومعتمد):') + '</h3>' +
                    '<table class="curriculum-table">' +
                        '<thead><tr>' +
                            '<th style="width:22%">' + bidi('نوع الحساب (Type de compte)') + '</th>' +
                            '<th style="width:38%">' + bidi('الصلاحيات والامتيازات (Droits d\'accès)') + '</th>' +
                            '<th style="width:20%">' + bidi('الحماية بكلمة مرور (Mot de passe)') + '</th>' +
                            '<th style="width:20%">' + bidi('إنشاء وإدارة الحساب') + '</th>' +
                        '</tr></thead>' +
                        '<tbody>' +
                            '<tr>' +
                                '<td class="highlight-col"><strong>' + bidi('حساب مسؤول الكمبيوتر') + '</strong><br><span style="font-size:8pt;color:#333">(Administrateur)</span></td>' +
                                '<td><strong>' + bidi('له كافة الصلاحيات والتحكم الكامل:') + '</strong> ' + bidi('تغيير كافة إعدادات النظام، تثبيت وحذف البرامج، إدارة وبناء وتعديل وحذف باقي الحسابات، والوصول إلى كافة الملفات المشتركة.') + '</td>' +
                                '<td><strong>' + bidi('نعم') + '</strong><br>' + bidi('(يُستحسن ويُنصح بشدة حمايته بكلمة مرور قوية).') + '</td>' +
                                '<td>' + bidi('نستطيع إنشاء أكثر من حساب مسؤول في النظام الواحد و لا يمكن حذف آخر حساب من هذا النوع.') + '</td>' +
                            '</tr>' +
                            '<tr>' +
                                '<td class="highlight-col"><strong>' + bidi('الحساب القياسي / المحدود') + '</strong><br><span style="font-size:8pt;color:#333">(Standard / Utilisateur)</span></td>' +
                                '<td><strong>' + bidi('صلاحياته شخصية ومحدودة:') + '</strong> ' + bidi('يمكن التحكم في صلاحيات هذا النوع من الحسابات ، حيث يمكن تحديد وقت استخدامه للحاسوب أو تحديد الصلاحيات الممكنة له.') + '</td>' +
                                '<td><strong>' + bidi('نعم') + '</strong><br>' + bidi('(يمكن حمايته بكلمة مرور خاصة به وتغييرها).') + '</td>' +
                                '<td>' + bidi('يُنشأ ويُدار ويُعدل بواسطة حساب المسؤول فقط. يمكن إنشاء عدة حسابات من هذا النوع و يمكن حذفها جميعا.') + '</td>' +
                            '</tr>' +
                            '<tr>' +
                                '<td class="highlight-col"><strong>' + bidi('حساب الضيف') + '</strong><br><span style="font-size:8pt;color:#333">(Invité / Guest)</span></td>' +
                                '<td><strong>' + bidi('صلاحيات مقيدة جداً:') + '</strong> ' + bidi('يُخصص للاستعمال العابر والمؤقت للحاسوب، ليس له أي صلاحيات إدارية وتُمنع عنه كافة العمليات التي تمس بأمان النظام (حظر UAC).') + '</td>' +
                                '<td><strong>' + bidi('لا يمكن حمايته بكلمة مرور.') + '</strong></td>' +
                                '<td>' + bidi('حساب وحيد ومدمج بالنظام؛ لا نستطيع إنشاء حساب جديد من هذا النوع بل نفعّله أو نعطّله فقط.') + '</td>' +
                            '</tr>' +
                        '</tbody>' +
                    '</table>' +

                    '<h3 class="sub-title">' + bidi('ب) العمليات الأساسية المنجزة على الحسابات:') + '</h3>' +
                    '<div class="operations-grid">' +
                        '<div class="bordered-card">' +
                            '<strong>(1) ' + bidi('إنشاء حساب جديد:') + '</strong>' +
                            '<p style="font-size:8.5pt;margin-top:2px"><bdi dir="ltr">(Créer un nouveau compte)</bdi><br>' + bidi('تحديد اسم الحساب، نوعه (مسؤول أو قياسي)، وكلمة المرور الابتدائية.') + '</p>' +
                        '</div>' +
                        '<div class="bordered-card">' +
                            '<strong>(2) ' + bidi('التعديل في الحساب:') + '</strong>' +
                            '<p style="font-size:8.5pt;margin-top:2px"><bdi dir="ltr">(Modifier un compte)</bdi><br>' + bidi('تغيير الاسم، إنشاء / تغيير كلمة المرور، تعديل نوع الحساب، وتغيير الصورة الرمزية (Avatar).') + '</p>' +
                        '</div>' +
                        '<div class="bordered-card">' +
                            '<strong>(3) ' + bidi('إزالة الحساب:') + '</strong>' +
                            '<p style="font-size:8.5pt;margin-top:2px"><bdi dir="ltr">(Supprimer un compte)</bdi><br>' + bidi('حذف الحساب القياسي نهائياً مع خيار الاحتفاظ بملفاته أو حذفها تماماً.') + '</p>' +
                        '</div>' +
                    '</div>' +

                    '<h2 class="sec-title">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' +
                        bidi('5. شبكة التقييم والتقويم المرحلي للحصة التطبيقية (المخبر)') +
                    '</h2>' +

                    '<div class="eval-grid-container">' +
                        '<div class="eval-col">' +
                            '<div class="eval-col-title">' + bidi('معلومات التلميذ:') + '</div>' +
                            '<div class="eval-field-row"><strong>• ' + bidi('اللقب والاسم:') + '</strong> <span class="val-student-name">' + studentName + '</span></div>' +
                            '<div class="eval-field-row"><strong>• ' + bidi('الفصيلة:') + '</strong> <span class="val-student-group">' + classGroup + '</span></div>' +
                            '<div class="eval-field-row"><strong>• ' + bidi('الحاسوب رقم:') + '</strong> <span class="val-student-pc"><bdi dir="ltr">' + pcNumber + '</bdi></span></div>' +
                        '</div>' +
                        '<div class="eval-col">' +
                            '<div class="eval-col-title">' + bidi('تقييم المحاكاة:') + '</div>' +
                            '<div class="eval-field-row"><strong>' + bidi('العلامة:') + '</strong> <span class="val-sim-score" style="font-weight:700"><bdi dir="ltr">' + finalScoreStr + '</bdi></span> <bdi dir="ltr">/ 20</bdi></div>' +
                            '<div class="eval-field-row"><strong>' + bidi('التوقيت:') + '</strong> <span class="val-sim-time"><bdi dir="ltr">' + timeFormatted + '</bdi></span></div>' +
                        '</div>' +
                        '<div class="eval-col">' +
                            '<div class="eval-col-title">' + bidi('ملاحظة وتوقيع الأستاذ:') + '</div>' +
                            '<div style="font-size:8.5pt;color:#333;margin-top:2px">.......................................................</div>' +
                            '<div class="eval-stamp-box">' + bidi('ختم الأستاذ / المؤسسة') + '</div>' +
                        '</div>' +
                    '</div>' +

                    '<div class="page-footer-note">' +
                        '<span>' + bidi('تطبيق محاكي لوحة التحكم ونظام التشغيل — وثيقة التقييم والملخص المعتمدة للتلميذ') + '</span>' +
                        '<span>' + bidi('الصفحة 2 من 2') + '</span>' +
                    '</div>' +
                '</div>' +
                '<!-- Teacher Audit Appendix (screen only, hidden on print) -->' +
                '<div class="a4-appendix-container no-print" style="max-width:210mm;margin:16px auto 0;padding:10px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px">' +
                    renderAccountLogHtml(bidi) +
                    renderDeductionsTableHtml(scores, cfg, bidi) +
                '</div>' +
            '</div>'
        );
    }

    function buildStandaloneHtmlDoc() {
        var stu = (global.Win11Assessment && typeof global.Win11Assessment.getStudent === 'function')
            ? global.Win11Assessment.getStudent()
            : {};
        var title = 'وثيقة الدرس والتقويم - ' + (stu.fullName || '1AS');
        var bodyHtml = buildA4Html();
        return '<!DOCTYPE html>\n' +
            '<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '<title>' + global.Win11Compat.escapeHtml(title) + '</title>\n' +
            '<style>\n' +
            '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n' +
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Tahoma", sans-serif; font-size: 10pt; line-height: 1.4; color: #000; background: #fff; direction: rtl; }\n' +
            '.page-container { width: 210mm; height: 276mm; max-height: 276mm; margin: 0 auto; background: #fff; padding: 10mm 14mm; position: relative; box-sizing: border-box; overflow: hidden; }\n' +
            '.doc-header { border: 1.5px solid #000; padding: 6px 10px; margin-bottom: 8px; position: relative; }\n' +
            '.header-top { display: flex; justify-content: space-between; align-items: center; font-size: 9pt; font-weight: 700; margin-bottom: 3px; }\n' +
            '.header-institution { text-align: center; font-size: 9.5pt; font-weight: 700; color: #111; margin-bottom: 2px; }\n' +
            '.header-main { text-align: center; margin: 2px 0; }\n' +
            '.doc-title { font-size: 12.5pt; font-weight: 800; margin-bottom: 1px; color: #000; }\n' +
            '.doc-subtitle { font-size: 11.5pt; font-weight: 800; color: #000; }\n' +
            '.header-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #555; font-size: 8.5pt; font-weight: 600; }\n' +
            '.header-badge-box { position: absolute; top: 6px; left: 10px; border: 1px solid #000; padding: 2px 6px; font-size: 8pt; font-weight: bold; background: #fafafa; text-align: center; line-height: 1.25; border-radius: 3px; }\n' +
            'h2.sec-title { font-size: 11pt; font-weight: 800; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin: 8px 0 5px 0; display: flex; align-items: center; gap: 6px; }\n' +
            'h2.sec-title svg { width: 16px; height: 16px; flex-shrink: 0; }\n' +
            'h3.sub-title { font-size: 10pt; font-weight: 700; margin: 4px 0 2px 0; color: #111; }\n' +
            'p, li { font-size: 9.5pt; text-align: justify; line-height: 1.35; }\n' +
            'ul { list-style-type: square; padding-right: 18px; margin: 3px 0 4px 0; }\n' +
            'li { margin-bottom: 2px; }\n' +
            '.definition-box { border: 1px solid #000; border-right: 3.5px solid #000; padding: 5px 8px; margin-bottom: 6px; background: #fafafa; font-size: 9.5pt; line-height: 1.35; }\n' +
            '.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }\n' +
            '.bordered-card { border: 1px solid #333; padding: 5px 8px; border-radius: 3px; background: #fff; }\n' +
            '.functions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n' +
            'table.curriculum-table { width: 100%; border-collapse: collapse; margin: 6px 0 8px 0; font-size: 8.5pt; line-height: 1.3; }\n' +
            'table.curriculum-table th, table.curriculum-table td { border: 1px solid #000; padding: 4px 6px; text-align: right; vertical-align: top; }\n' +
            'table.curriculum-table th { background: #f0f0f0; font-weight: 800; color: #000; }\n' +
            '.highlight-col { font-weight: 700; background: #fafafa; }\n' +
            '.operations-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px; }\n' +
            '.eval-grid-container { border: 1.5px solid #000; padding: 6px 10px; display: grid; grid-template-columns: 1.25fr 1fr 1.15fr; gap: 8px; font-size: 9pt; background: #fff; }\n' +
            '.eval-col { display: flex; flex-direction: column; gap: 4px; }\n' +
            '.eval-col-title { font-weight: 800; font-size: 9.5pt; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px; }\n' +
            '.eval-field-row { display: flex; align-items: center; gap: 4px; font-size: 9pt; }\n' +
            '.eval-stamp-box { border: 1px dashed #555; height: 48px; margin-top: 4px; display: flex; align-items: center; justify-content: center; color: #444; font-size: 8.5pt; font-weight: 600; background: #fafafa; }\n' +
            '.page-footer-note { position: absolute; bottom: 4mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between; font-size: 8pt; color: #333; border-top: 1px solid #888; padding-top: 2px; }\n' +
            '.a4-report-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }\n' +
            '.a4-report-table th, .a4-report-table td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: start; }\n' +
            '.a4-report-table th { background: #f1f5f9; font-weight: 600; white-space:nowrap; }\n' +
            '.a4-report-table .col-time, .a4-report-table .col-event, .a4-report-table .col-account, .a4-report-table .col-role { white-space:nowrap; }\n' +
            '@page { size: A4 portrait; margin: 8mm 10mm; }\n' +
            '@media print {\n' +
            '  html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }\n' +
            '  .no-print, .a4-appendix-container { display: none !important; }\n' +
            '  .page-container { width: 100% !important; height: 276mm !important; max-height: 276mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; page-break-inside: avoid !important; break-inside: avoid !important; overflow: hidden !important; box-sizing: border-box !important; }\n' +
            '  .page-break { page-break-before: always !important; break-before: page !important; }\n' +
            '  .page-footer-note { bottom: 2mm !important; left: 0 !important; right: 0 !important; }\n' +
            '}\n' +
            '</style>\n</head>\n<body>\n' + bodyHtml + '\n</body>\n</html>';
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

    function triggerPdfExport(customFilename) {
        var printEl = document.getElementById('print-report-container');
        if (global.Win11Assessment && typeof global.Win11Assessment.evaluate === 'function') {
            global.Win11Assessment.evaluate();
        }
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

        // Auto-save evaluation report & summary directly to user's Windows Desktop
        saveReportToDesktop(pdfName, function (err, res) {
            showExportSuccessToast(pdfName, res && res.path ? res.path : null);
        });

        try {
            if (global.print) global.print();
        } finally {
            setTimeout(function () { document.title = prevTitle; }, 1200);
        }
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
                            triggerPdfExport();
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
        var cleanExt = (String(ext || 'pdf').toLowerCase() === 'html') ? 'html' : 'pdf';
        var lang = global.Win11I18N.getLang();
        var bidi = global.Win11I18N.bidiHtml;
        var esc = global.Win11Compat.escapeHtml;
        global.Win11Assessment.evaluate();
        var suggestedName = previewNextFilename(cleanExt);

        var titleText = (lang === 'fr')
            ? ('Enregistrer le rapport final (' + cleanExt.toUpperCase() + ')')
            : (lang === 'en'
                ? ('Save Final Evaluation Report (' + cleanExt.toUpperCase() + ')')
                : ('حفظ ملف التقييم النهائي (' + cleanExt.toUpperCase() + ')'));
        var labelText = (lang === 'fr') ? 'Nom du fichier :' : (lang === 'en' ? 'File Name:' : 'اسم الملف:');
        var hintText = (lang === 'fr')
            ? 'Le nom généré selon les règles de l\'enseignant est sélectionné. Vous pouvez l\'enregistrer directement ou le modifier.'
            : (lang === 'en'
                ? 'The teacher-defined filename is pre-selected. Press Save directly or type a new name.'
                : 'تم اقتراح اسم الملف تلقائياً وفق قواعد الأستاذ وتحديده بالكامل؛ يمكنك الضغط على "حفظ" مباشرة أو كتابة اسم جديد.');
        var saveLabel = (lang === 'fr') ? 'Enregistrer' : (lang === 'en' ? 'Save' : 'حفظ');
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
                        var chosenFilename = normalizeExportFilename(raw, cleanExt, suggestedName);
                        closeDlg(true);
                        if (cleanExt === 'pdf') {
                            triggerPdfExport(chosenFilename);
                        } else {
                            var baseKey = (buildFilenameCore('html').base + '.html').toLowerCase();
                            issuedExportCounts[baseKey] = (issuedExportCounts[baseKey] || 0) + 1;
                            saveReportToDesktop(chosenFilename);
                        }
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
        if (global.Win11Assessment && typeof global.Win11Assessment.evaluate === 'function') {
            global.Win11Assessment.evaluate();
        }
        var html = buildA4Html();

        global.Win11Dialogs.showCustom({
            title: t('pedagogy.reportBtn'),
            tone: 'info',
            wide: true,
            renderBody: function (wrap) {
                wrap.innerHTML = html;
                setTimeout(function () {
                    var contentBox = document.querySelector('#dialog-backdrop .win-dialog-content');
                    if (contentBox) contentBox.scrollTop = 0;
                }, 0);
            },
            buttons: [
                {
                    id: 'btn-export-pdf',
                    label: 'تصدير pdf طباعة',
                    primary: true,
                    onClick: function (closeDlg) {
                        closeDlg('export_pdf');
                        var pdfName = allocateUniqueFilename('pdf');
                        hasExportedPdfFlag = true;
                        saveReportToDesktop(pdfName, function (err, res) {
                            showExportSuccessDialog(pdfName, res && res.path ? res.path : null);
                        });
                    }
                },
                {
                    id: 'btn-print-paper',
                    label: 'طباعة فورية',
                    primary: false,
                    onClick: function () {
                        triggerPdfExport();
                    }
                },
                {
                    id: 'btn-export-html',
                    label: t('pedagogy.exportHtmlBtn'),
                    primary: false,
                    onClick: function (closeDlg) {
                        closeDlg('export_html');
                        var htmlName = allocateUniqueFilename('html');
                        saveReportToDesktop(htmlName, function (err, res) {
                            showExportSuccessDialog(htmlName, res && res.path ? res.path : null);
                        });
                    }
                },
                {
                    id: 'btn-print-summary-sheet',
                    label: 'طباعة ملخص الدرس (الكراس)',
                    primary: false,
                    onClick: function () {
                        triggerPdfExport();
                    }
                },
                { label: t('app.close'), primary: false, value: false }
            ]
        });
    }

    function openSummaryModal() {
        openCertificate();
    }

    function openSummarySheet() {
        openCertificate();
    }

    global.Win11Report = {
        openStudentRegistration: openStudentRegistration,
        injectPlainStudentFormFallback: injectPlainStudentFormFallback,
        saveReportToDesktop: saveReportToDesktop,
        showExportSuccessToast: showExportSuccessToast,
        dismissExportSuccessToast: dismissExportSuccessToast,
        confirmNewSimulation: confirmNewSimulation,
        confirmShutdown: confirmShutdown,
        triggerPdfExport: triggerPdfExport,
        openExportSaveDialog: openExportSaveDialog,
        openSummarySheet: openSummarySheet,
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
