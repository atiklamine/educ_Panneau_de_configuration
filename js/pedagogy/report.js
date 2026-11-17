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
                '<span>' + bidi('تم حفظ التقرير على سطح المكتب باسم:') + ' </span>' +
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

        global.Win11Dialogs.showCustom({
            title: bidi('تأكيد حفظ ملف التقييم'),
            tone: 'info',
            wide: false,
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:12px;text-align:center;padding:4px 0">' +
                        '<div style="font-size:36px;color:#107C41;line-height:1">✓</div>' +
                        '<div style="font-size:14.5px;font-weight:700;color:var(--win-text-primary)">' +
                            bidi('تم حفظ بطاقة التقييم بنجاح بصيغة PDF على سطح المكتب.') +
                        '</div>' +
                        '<div style="background:var(--win-surface-subtle);border:1px solid var(--win-border-control);border-radius:8px;padding:10px 14px;direction:ltr;text-align:center">' +
                            '<div style="font-size:11px;color:var(--win-text-secondary);margin-bottom:3px;direction:rtl">' + bidi('اسم الملف المحفوظ:') + '</div>' +
                            '<div id="export-success-filename" style="font-family:Consolas,monospace;font-size:13px;font-weight:700;color:#0F172A;word-break:break-all;user-select:all">' +
                                esc(filename) +
                            '</div>' +
                        '</div>' +
                        '<div style="font-size:12px;color:var(--win-text-secondary)">' +
                            bidi('يمكنك الآن فتح الملف لمعاينته أو فتح مكانه في مجلد سطح المكتب.') +
                        '</div>' +
                    '</div>';
            },
            buttons: [
                {
                    id: 'btn-open-file-direct',
                    label: bidi('فتح الملف'),
                    primary: true,
                    onClick: function (closeDlg) {
                        var targetPath = desktopPath || '';
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
                    label: bidi('فتح مكان الملف'),
                    primary: false,
                    onClick: function (closeDlg) {
                        var targetPath = desktopPath || '';
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
                }
            ]
        });
    }

    function saveReportToDesktop(filename, onComplete, opts) {
        opts = opts || {};
        var htmlContent = buildStandaloneHtmlDoc();
        var cleanName = normalizeExportFilename(filename, 'pdf', formatSuggestedFilename('pdf'));
        hasExportedPdfFlag = true;

        function handleSuccess(finalName, finalPath) {
            showExportSuccessToast(finalName, finalPath);
            if (!opts.skipDialog) {
                showExportSuccessDialog(finalName, finalPath);
            }
            if (onComplete) onComplete(null, { ok: true, filename: finalName, path: finalPath });
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
                return r.json();
            }).then(function (data) {
                if (data && data.ok) {
                    handleSuccess(data.filename || cleanName, data.path || null);
                } else {
                    handleSuccess(cleanName, null);
                }
            }).catch(function () {
                handleSuccess(cleanName, null);
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
        }

        // 3. Fallback: Browser downloadTextFile (download clean HTML document rather than broken raw HTML disguised as PDF)
        var htmlFallbackName = cleanName.replace(/\.pdf$/i, '.html');
        downloadTextFile(htmlFallbackName, 'text/html; charset=utf-8', htmlContent);
        handleSuccess(htmlFallbackName, null);
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
        var digital = pad(h) + ':' + pad(m) + ':' + pad(rem);
        if (h > 0) {
            return digital + ' (' + h + ' ساعة و ' + m + ' دقيقة و ' + rem + ' ثانية)';
        }
        if (m > 0) {
            return digital + ' (' + m + ' دقيقة و ' + rem + ' ثانية)';
        }
        return digital + ' (' + rem + ' ثانية)';
    }

    function buildA4Html() {
        var bidi = global.Win11I18N.bidiHtml;
        var cfg = global.Win11Assessment.getConfig();
        var stu = global.Win11Assessment.getStudent();
        var scores = global.Win11Assessment.getScores();
        var tasks = global.Win11Assessment.getTasks();

        var enabledTasks = [];
        var doneTasksCount = 0;
        var totalMaxPoints = 0;
        var totalEarnedPoints = 0;

        for (var t = 0; t < tasks.length; t++) {
            if (tasks[t].enabled !== false) {
                enabledTasks.push(tasks[t]);
                totalMaxPoints += (Number(tasks[t].maxPoints) || 0);
                totalEarnedPoints += (Number(tasks[t].earnedPoints) || 0);
                if (tasks[t].completed) doneTasksCount++;
            }
        }

        var completionPct = enabledTasks.length > 0 ? Math.round((doneTasksCount / enabledTasks.length) * 100) : 0;
        var totalDurationStr = formatArabicDuration(stu.elapsedSeconds || 0);
        var dateFormatted = formatArabicDate();
        var isExam = (stu.mode === 'exam');
        var sessionLabel = isExam ? 'امتحان تطبيقي رسمي' : 'نشاط تطبيقي تدريبي';
        var isPassed = (scores.passed !== false);
        var finalScoreNum = (scores.finalScore !== undefined ? scores.finalScore : scores.net);
        var finalScoreStr = Number(finalScoreNum || 0).toFixed(2);

        var rowsHtml = '';
        for (var i = 0; i < enabledTasks.length; i++) {
            var tk = enabledTasks[i];
            var isDone = !!tk.completed;
            var isSkip = !!tk.skipped;
            var isPart = (!isDone && !isSkip && (Number(tk.earnedPoints) > 0));

            var badgeCls = isDone ? 'is-done' : (isPart ? 'is-partial' : (isSkip ? 'is-skipped' : 'is-fail'));
            var badgeText = isDone ? 'مكتملة ✔' : (isPart ? 'منجزة جزئياً ◐' : (isSkip ? 'تم تخطيها ⏭' : 'غير منجزة ✘'));

            var tDur = global.Win11Assessment.formatDuration(tk.durationSeconds || 0);
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

            rowsHtml +=
                '<tr>' +
                    '<td style="text-align:center;font-weight:700;color:#64748B;">' + (i + 1) + '</td>' +
                    '<td><strong>' + bidi(tk.titleAr) + '</strong>' + (tk.critical ? ' <span style="color:#DC2626;font-size:11px;font-weight:700;">(مهمة أساسية)</span>' : '') + '</td>' +
                    (cfg.show_time ? ('<td style="text-align:center;font-variant-numeric:tabular-nums;"><bdi dir="ltr">' + tDur + '</bdi></td>') : '') +
                    '<td style="text-align:center;font-weight:600;"><bdi dir="ltr">' + Number(tk.maxPoints || 0).toFixed(2) + '</bdi></td>' +
                    '<td style="text-align:center;font-weight:700;color:#1E3A8A;"><bdi dir="ltr">' + Number(tk.earnedPoints || 0).toFixed(2) + '</bdi></td>' +
                    '<td style="text-align:center;"><span class="a4-badge ' + badgeCls + '">' + bidi(badgeText) + '</span></td>' +
                    '<td style="font-size:11.5px;color:#334155;line-height:1.45;">' + bidi(reasonTxt) + '</td>' +
                '</tr>';
        }

        // Summary row for general penalties (if any)
        var penaltiesRowHtml = '';
        if (scores.penalties > 0 && cfg.show_penalties) {
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
                    '<td style="text-align:center;">-</td>' +
                    '<td colspan="' + (cfg.show_time ? 2 : 1) + '"><strong>خصومات عامة (مخالفة تسلسل المهام النشطة)</strong></td>' +
                    '<td style="text-align:center;">-</td>' +
                    '<td style="text-align:center;font-weight:700;color:#DC2626;"><bdi dir="ltr">-' + Number(scores.penalties).toFixed(2) + '</bdi></td>' +
                    '<td style="text-align:center;"><span class="a4-badge is-fail">خصم نقاط</span></td>' +
                    '<td style="font-size:11.5px;line-height:1.45;">' + bidi(penaltyReason) + '</td>' +
                '</tr>';
        }

        var logoHtml = (cfg.report_logo_b64 && String(cfg.report_logo_b64).indexOf('data:image/') === 0)
            ? '<img src="' + cfg.report_logo_b64 + '" alt="logo" style="max-height:50px;max-width:85px;object-fit:contain;">'
            : '';

        var rubricHtml = '';
        if (cfg.show_ranking_criteria !== false) {
            rubricHtml =
                '<div class="a4-rubric-card">' +
                    '<div style="font-weight:700;margin-bottom:4px;color:#1E3A8A;font-size:11.5px;">' + bidi('شبكة تقدير المستويات والتحكم في المهارات العملية المعتمدة:') + '</div>' +
                    '<div class="a4-rubric-grid">' +
                        '<div class="a4-rubric-item' + (finalScoreNum >= 16 ? ' is-active' : '') + '">' +
                            '<div style="font-weight:700;color:#15803D;">[16.00 – 20.00] ممتاز</div>' +
                            '<div style="font-size:10px;color:#475569;margin-top:1px;">مكتسب بجدارة (تحكم شامل)</div>' +
                        '</div>' +
                        '<div class="a4-rubric-item' + (finalScoreNum >= 14 && finalScoreNum < 16 ? ' is-active' : '') + '">' +
                            '<div style="font-weight:700;color:#1D4ED8;">[14.00 – 15.99] جيد جداً</div>' +
                            '<div style="font-size:10px;color:#475569;margin-top:1px;">مكتسب (تحكم جيد)</div>' +
                        '</div>' +
                        '<div class="a4-rubric-item' + (finalScoreNum >= 12 && finalScoreNum < 14 ? ' is-active' : '') + '">' +
                            '<div style="font-weight:700;color:#0284C7;">[12.00 – 13.99] جيد</div>' +
                            '<div style="font-size:10px;color:#475569;margin-top:1px;">مكتسب (تحكم مقبول)</div>' +
                        '</div>' +
                        '<div class="a4-rubric-item' + (finalScoreNum >= 10 && finalScoreNum < 12 ? ' is-active' : '') + '">' +
                            '<div style="font-weight:700;color:#D97706;">[10.00 – 11.99] متوسط</div>' +
                            '<div style="font-size:10px;color:#475569;margin-top:1px;">في طريق الاكتساب (تحكم جزئي)</div>' +
                        '</div>' +
                        '<div class="a4-rubric-item' + (finalScoreNum < 10 ? ' is-active' : '') + '">' +
                            '<div style="font-weight:700;color:#DC2626;">[أقل من 10.00] دون المتوسط</div>' +
                            '<div style="font-size:10px;color:#475569;margin-top:1px;">غير مكتسب (بحاجة لدعم ومراجعة)</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

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
                            '<div>Année scolaire: <strong>' + global.Win11Compat.escapeHtml(cfg.academic_year) + '</strong></div>' +
                            '<div>Niveau: <strong>' + global.Win11Compat.escapeHtml(cfg.target_level) + '</strong></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="a4-banner">' +
                        '<div class="a4-banner-title">' + bidi('بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي') + '</div>' +
                        '<div class="a4-banner-sub">' + bidi('المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)') + '</div>' +
                    '</div>' +
                '</div>' +

                // Student & Session Details
                '<table class="a4-info-table">' +
                    '<tr>' +
                        '<td style="width:50%;"><strong>اسم ولقب التلميذ:</strong> <span style="font-size:13.5px;font-weight:700;color:#0F172A;">' + bidi((stu.lastName || '') + ' ' + (stu.firstName || stu.fullName || '')) + '</span></td>' +
                        '<td style="width:50%;"><strong>الفوج التربوي:</strong> <span style="font-weight:700;color:#2563EB;">' + bidi(stu.classGroup) + '</span> &nbsp;|&nbsp; <strong>رقم الجهاز:</strong> <span>حاسوب <bdi dir="ltr">#' + global.Win11Compat.escapeHtml(String(stu.pcNumber || cfg.default_device || '01')) + '</bdi></span></td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td><strong>طبيعة النشاط:</strong> ' + bidi(sessionLabel) + ' &nbsp;|&nbsp; <strong>التاريخ:</strong> <bdi dir="ltr">' + bidi(dateFormatted) + '</bdi></td>' +
                        '<td><strong>الوقت الإجمالي المستغرق:</strong> <span style="font-weight:700;color:#0F172A;"><bdi dir="ltr">' + bidi(totalDurationStr) + '</bdi></span></td>' +
                    '</tr>' +
                '</table>' +

                // Prominent Score & Level Card
                '<div class="a4-summary-card" style="border-color:' + (isPassed ? '#107C41' : '#D97706') + ';">' +
                    '<div class="a4-score-box">' +
                        '<div style="font-size:12px;font-weight:700;color:#64748B;margin-bottom:2px;">' + bidi('العلامة الإجمالية المستحقة') + '</div>' +
                        '<div class="a4-score-val"><bdi dir="ltr">' + finalScoreStr + '</bdi> <span class="a4-score-max">/ 20</span></div>' +
                        '<div><span class="a4-pass-badge ' + (isPassed ? 'is-pass' : 'is-fail') + '">' + bidi(isPassed ? '✔ مستوفٍ لمعيار النجاح' : '✘ دون المعدل المطلوب') + '</span></div>' +
                    '</div>' +
                    '<div class="a4-level-box">' +
                        (cfg.show_competency !== false ? (
                            '<div><strong>التقدير العام:</strong> <span style="display:inline-block;margin-right:4px;padding:1px 10px;border-radius:4px;font-weight:700;font-size:13px;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;">' + bidi(scores.appreciation || 'متوسط') + '</span></div>' +
                            '<div><strong>مستوى التحكم في المهارات:</strong> <span style="font-weight:700;color:#0F172A;">' + bidi(scores.performanceLevel || 'في طريق الاكتساب') + '</span></div>'
                        ) : '') +
                        '<div style="font-size:12px;color:#475569;">' +
                            '<strong>نسبة الإنجاز العملي:</strong> ' +
                            '<span>تم استيفاء <bdi dir="ltr">' + doneTasksCount + '</bdi> من أصل <bdi dir="ltr">' + enabledTasks.length + '</bdi> مهام مطلوبة (نسبة النجاح: <bdi dir="ltr">' + completionPct + '%</bdi>)</span>' +
                            (scores.penalties > 0 ? (' &nbsp;|&nbsp; <span style="color:#DC2626;font-weight:600;">الخصومات المطبقة: <bdi dir="ltr">-' + Number(scores.penalties).toFixed(2) + '</bdi></span>') : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +

                // Single Unified Detailed Tasks Table
                '<table class="a4-report-table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th style="width:28px;text-align:center;">#</th>' +
                            '<th style="text-align:right;">المهمة التطبيقية المطلوبة</th>' +
                            (cfg.show_time ? '<th style="width:75px;text-align:center;">المدة</th>' : '') +
                            '<th style="width:65px;text-align:center;">العلامة القصوى</th>' +
                            '<th style="width:65px;text-align:center;">الممنوحة</th>' +
                            '<th style="width:85px;text-align:center;">حالة الإنجاز</th>' +
                            '<th style="text-align:right;">الملاحظات وتفاصيل الإنجاز</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        rowsHtml +
                        penaltiesRowHtml +
                    '</tbody>' +
                    '<tfoot>' +
                        '<tr style="background:#F8FAFC;font-weight:700;border-top:2px solid #CBD5E1;">' +
                            '<td colspan="' + (cfg.show_time ? 3 : 2) + '" style="text-align:left;padding:6px 10px;">المجموع الكلي:</td>' +
                            '<td style="text-align:center;"><bdi dir="ltr">' + totalMaxPoints.toFixed(2) + '</bdi></td>' +
                            '<td style="text-align:center;color:#1E3A8A;font-size:13px;"><bdi dir="ltr">' + totalEarnedPoints.toFixed(2) + '</bdi></td>' +
                            '<td colspan="2" style="text-align:right;padding:6px 10px;font-size:12px;color:#1E293B;">' +
                                (scores.penalties > 0
                                    ? ('العلامة الصافية بعد الخصم: <bdi dir="ltr"><strong style="color:#1E3A8A;font-size:13px;">' + finalScoreStr + ' / 20</strong></bdi>')
                                    : ('العلامة النهائية: <bdi dir="ltr"><strong style="color:#1E3A8A;font-size:13px;">' + finalScoreStr + ' / 20</strong></bdi>')
                                ) +
                            '</td>' +
                        '</tr>' +
                    '</tfoot>' +
                '</table>' +

                // Rubric reference
                rubricHtml +

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
            '.a4-report-sheet{max-width:820px;margin:0 auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:22px 26px;box-shadow:0 4px 16px rgba(0,0,0,0.06);box-sizing:border-box;}\n' +
            '.a4-header{border-bottom:2px solid #1E3A8A;padding-bottom:8px;margin-bottom:10px;}\n' +
            '.a4-header-republic{text-align:center;font-size:13.5px;font-weight:700;color:#0F172A;margin-bottom:6px;}\n' +
            '.a4-header-grid{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#334155;margin-bottom:8px;line-height:1.4;}\n' +
            '.a4-banner{text-align:center;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:6px 12px;}\n' +
            '.a4-banner-title{font-size:15.5px;font-weight:800;color:#1E3A8A;}\n' +
            '.a4-banner-sub{font-size:11.5px;color:#475569;margin-top:2px;}\n' +
            '.a4-info-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px;}\n' +
            '.a4-info-table td{padding:6px 10px;border:1px solid #E2E8F0;vertical-align:middle;}\n' +
            '.a4-summary-card{display:flex;align-items:stretch;background:#FFFFFF;border:2px solid #2563EB;border-radius:8px;padding:10px 14px;margin-bottom:10px;gap:14px;}\n' +
            '.a4-score-box{flex:0 0 170px;text-align:center;border-left:1px solid #E2E8F0;padding-left:14px;display:flex;flex-direction:column;justify-content:center;}\n' +
            '.a4-score-val{font-size:27px;font-weight:900;color:#1E3A8A;line-height:1.1;}\n' +
            '.a4-score-max{font-size:15px;font-weight:700;color:#64748B;}\n' +
            '.a4-pass-badge{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:700;}\n' +
            '.a4-pass-badge.is-pass{background:#DCFCE7;color:#15803D;}\n' +
            '.a4-pass-badge.is-fail{background:#FEE2E2;color:#B91C1C;}\n' +
            '.a4-level-box{flex:1;display:flex;flex-direction:column;justify-content:center;gap:4px;font-size:12px;}\n' +
            '.a4-report-table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11.5px;}\n' +
            '.a4-report-table th,.a4-report-table td{border:1px solid #CBD5E1;padding:6px 8px;text-align:right;vertical-align:middle;}\n' +
            '.a4-report-table th{background:#F1F5F9;color:#0F172A;font-weight:700;white-space:nowrap;}\n' +
            '.a4-badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;white-space:nowrap;}\n' +
            '.a4-badge.is-done{background:#DCFCE7;color:#15803D;}\n' +
            '.a4-badge.is-partial{background:#FEF3C7;color:#D97706;}\n' +
            '.a4-badge.is-fail{background:#FEE2E2;color:#B91C1C;}\n' +
            '.a4-badge.is-skipped{background:#E2E8F0;color:#475569;}\n' +
            '.a4-rubric-card{margin:8px 0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:6px 10px;font-size:10.5px;}\n' +
            '.a4-rubric-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;text-align:center;margin-top:4px;}\n' +
            '.a4-rubric-item{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:4px;padding:4px 2px;}\n' +
            '.a4-rubric-item.is-active{border:2px solid #2563EB;background:#EFF6FF;}\n' +
            '.a4-footer-sig{margin-top:10px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #CBD5E1;padding-top:8px;font-size:11.5px;}\n' +
            '@media print{@page{size:A4 portrait;margin:8mm 10mm;}body{background:#FFFFFF;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.a4-report-sheet{border:none;box-shadow:none;padding:0;max-width:none;width:100%;}}\n' +
            '</style>\n</head>\n<body>\n' + a4Inner + '\n</body>\n</html>';
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
        global.Win11Assessment.evaluate();
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
                    label: t('pedagogy.exportPdfBtn'),
                    primary: true,
                    onClick: function (closeDlg) {
                        closeDlg('export_pdf');
                        // Zero-prompt: instantly export PDF to Desktop without asking for filename confirmation
                        setTimeout(function () {
                            var pdfFilename = allocateUniqueFilename('pdf');
                            saveReportToDesktop(pdfFilename);
                        }, 0);
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
                    style: 'display:none',
                    onClick: function (closeDlg) {
                        closeDlg('export_html');
                        setTimeout(function () {
                            openExportSaveDialog('html', { fromCertificate: true });
                        }, 0);
                    }
                },
                { label: t('app.close'), primary: false, value: false }
            ]
        });
    }

    global.Win11Report = {
        openStudentRegistration: openStudentRegistration,
        injectPlainStudentFormFallback: injectPlainStudentFormFallback,
        saveReportToDesktop: saveReportToDesktop,
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
