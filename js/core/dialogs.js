/**
 * Windows 11 Fluent ContentDialog & Wizards Engine
 * Replaces native browser alert/confirm/prompt with accessible RTL-aware modals.
 */
(function (global) {
    'use strict';

    var activeResolve = null;
    var activeDialogToken = null;
    var activePersistent = false;

    function getBackdrop() {
        var bd = document.getElementById('dialog-backdrop');
        if (!bd) {
            bd = document.createElement('div');
            bd.id = 'dialog-backdrop';
            (document.body || document.documentElement).appendChild(bd);
        }
        return bd;
    }

    function iconForTone(tone) {
        if (tone === 'warning') return global.Win11Icons.get('warning', 20);
        if (tone === 'error') return global.Win11Icons.get('error', 20);
        if (tone === 'question') return global.Win11Icons.get('question', 20);
        return global.Win11Icons.get('info', 20);
    }

    function closeDialog(result) {
        var backdrop = getBackdrop();
        if (backdrop) {
            backdrop.classList.remove('is-open');
            backdrop.innerHTML = '';
        }
        var cb = activeResolve;
        activeResolve = null;
        activeDialogToken = null;
        activePersistent = false;
        if (typeof cb === 'function') cb(result);
    }

    function showCustom(opts) {
        var backdrop = getBackdrop();
        if (!backdrop) return;
        backdrop.innerHTML = '';
        activeResolve = opts.onClose || null;
        activePersistent = !!opts.persistent;
        var myToken = {};
        activeDialogToken = myToken;
        backdrop.onclick = function (ev) {
            if (ev.target === backdrop && !activePersistent) {
                closeThis(null);
            }
        };
        var closeThis = function (res) {
            if (activeDialogToken !== myToken) return;
            closeDialog(res);
        };

        var dialog = document.createElement('div');
        dialog.className = 'win-dialog' + (opts.wide ? ' is-wide' : '');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        var content = document.createElement('div');
        content.className = 'win-dialog-content';

        if (opts.title || opts.tone) {
            var header = document.createElement('div');
            header.className = 'win-dialog-header';
            if (opts.tone) {
                var badge = document.createElement('div');
                badge.className = 'win-dialog-icon ' + opts.tone;
                badge.innerHTML = iconForTone(opts.tone);
                header.appendChild(badge);
            }
            var hTitle = document.createElement('h2');
            hTitle.className = 'win-dialog-title';
            hTitle.innerHTML = global.Win11I18N.bidiHtml(opts.title || '');
            header.appendChild(hTitle);
            content.appendChild(header);
        }

        var bodyWrap = document.createElement('div');
        bodyWrap.className = 'win-dialog-body bidi-prose';
        if (typeof opts.renderBody === 'function') {
            opts.renderBody(bodyWrap, dialog, closeThis);
        } else if (opts.html) {
            bodyWrap.innerHTML = opts.html;
        } else if (opts.message) {
            bodyWrap.innerHTML = global.Win11I18N.bidiHtml(opts.message).replace(/\n/g, '<br>');
        }
        content.appendChild(bodyWrap);
        dialog.appendChild(content);

        if (!opts.hideFooter) {
            var footer = document.createElement('div');
            footer.className = 'win-dialog-footer';
            var buttons = opts.buttons || [
                { label: global.Win11I18N.t('app.ok'), primary: true, value: true }
            ];
            for (var i = 0; i < buttons.length; i++) {
                (function (btnDef) {
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'win-btn ' + (btnDef.primary ? 'win-btn-accent' : (btnDef.danger ? 'win-btn-danger' : 'win-btn-secondary'));
                    btn.innerHTML = btnDef.safeHtml ? String(btnDef.label || '') : global.Win11I18N.bidiHtml(btnDef.label);
                    if (btnDef.id) btn.id = btnDef.id;
                    btn.onclick = function () {
                        if (typeof btnDef.onClick === 'function') {
                            var keepOpen = btnDef.onClick(closeThis);
                            if (keepOpen === true) return;
                        }
                        closeThis(btnDef.value);
                    };
                    footer.appendChild(btn);
                })(buttons[i]);
            }
            dialog.appendChild(footer);
        }

        backdrop.appendChild(dialog);
        backdrop.classList.add('is-open');

        // Focus first interactive element inside dialog cleanly
        setTimeout(function () {
            var firstInput = dialog.querySelector('input, select, button');
            if (firstInput) firstInput.focus();
        }, 20);
    }

    function showMessage(title, message, tone, onOk) {
        showCustom({
            title: title,
            message: message,
            tone: tone || 'info',
            buttons: [{ label: global.Win11I18N.t('app.ok'), primary: true, value: true }],
            onClose: onOk
        });
    }

    function showConfirm(title, message, onResult, tone) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        showCustom({
            title: title,
            message: message,
            tone: tone || 'question',
            buttons: [
                { label: t('app.yes'), primary: true, value: true },
                { label: t('app.no'), primary: false, value: false }
            ],
            onClose: function (res) {
                if (typeof onResult === 'function') onResult(res === true);
            }
        });
    }

    function showAboutModal() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var heroImgSrc = (global.__WIN11_INLINE_IMAGES__ && global.__WIN11_INLINE_IMAGES__['assets/images/teacher_about.jpg']) || 'assets/images/teacher_about.jpg';
        showCustom({
            title: 'حول التطبيق',
            tone: 'info',
            wide: true,
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div id="about-app-modal-body" dir="rtl" style="text-align:start;line-height:1.75;font-size:13.5px;display:flex;flex-direction:column;gap:12px">' +
                        '<div style="border-radius:12px;overflow:hidden;border:1px solid var(--win-border-card);background:var(--win-surface-subtle);box-shadow:0 4px 16px rgba(0,0,0,0.08)">' +
                            '<div style="position:relative;height:225px;background:linear-gradient(135deg,#0f223d 0%,#12355b 100%);overflow:hidden">' +
                                '<img id="about-teacher-hero-img" src="' + heroImgSrc + '" alt="أستاذ الإعلام الآلي والتلاميذ في مخبر المعلوماتية" style="width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block">' +
                                '<span style="position:absolute;top:10px;inset-inline-end:12px;padding:3px 11px;border-radius:999px;background:rgba(0,103,192,0.92);color:#fff;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.28);backdrop-filter:blur(6px)"><bdi dir="ltr">v2.0.0</bdi></span>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:11px 14px;border-top:1px solid var(--win-border-card)">' +
                                '<div style="display:flex;align-items:center;gap:12px">' +
                                    '<div style="width:44px;height:44px;border-radius:10px;background:var(--win-accent-tint);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
                                        global.Win11Icons.get('win11', 28) +
                                    '</div>' +
                                    '<div>' +
                                        '<div style="font-weight:700;font-size:15px">' + bidi('محاكي لوحة التحكم وإعدادات النظام (Windows 11)') + '</div>' +
                                        '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi('المجال المفاهيمي الأول: بيئة التعامل مع الحاسوب — السنة الأولى ثانوي (الجزائر)') + '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +

                        '<div class="win-card" style="background:var(--win-surface-subtle);display:flex;flex-direction:column;gap:5px;font-size:13px">' +
                            '<div style="display:grid;grid-template-columns:130px 1fr;gap:6px;row-gap:4px">' +
                                '<div><strong>' + bidi('المجال المفاهيمي:') + '</strong></div><div>' + bidi('المجال الأول: بيئة التعامل مع الحاسوب') + ' (<bdi dir="ltr">Environnement de l\'ordinateur</bdi>)</div>' +
                                '<div><strong>' + bidi('الوحدة التعليمية:') + '</strong></div><div>' + bidi('وحدة لوحة التحكم وإعدادات النظام') + ' (<bdi dir="ltr">Panneau de configuration</bdi> — ' + bidi('الوحدة 3 في التدرج') + ')</div>' +
                                '<div><strong>' + bidi('المستوى الدراسي:') + '</strong></div><div>' + bidi('السنة الأولى ثانوي (جذع مشترك علوم وتكنولوجيا + جذع مشترك آداب)') + '</div>' +
                                '<div><strong>' + bidi('الكفاءة المستهدفة:') + '</strong></div><div>' + bidi('التحكم في بيئة الحاسوب، تخصيص الواجهة، ضبط الفأرة واللغة، وتسيير البرامج والحسابات بأمان') + '</div>' +
                                '<div><strong>' + bidi('المطور والإشراف:') + '</strong></div><div>' + bidi('أستاذ مادة الإعلام الآلي — التعليم الثانوي (الجزائر)') + '</div>' +
                                '<div><strong>' + bidi('الإصدار الميداني:') + '</strong></div><div><bdi dir="ltr">2.0.0</bdi></div>' +
                                '<div><strong>' + bidi('محطة المخبر:') + '</strong></div><div style="color:var(--win-text-secondary)"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.deviceName) + '</bdi> | <bdi dir="ltr">Windows 11 Pro Education (23H2)</bdi></div>' +
                            '</div>' +
                        '</div>' +

                        '<div>' +
                            '<h4 style="margin:0 0 6px;font-size:14px;font-weight:700;color:var(--win-accent-text)">' + bidi('رسالة الأستاذ:') + '</h4>' +
                            '<p style="margin:0 0 6px">' + bidi('مرحباً بكم في هذا المحاكي البيداغوجي. لقد صُمّم هذا التطبيق خصيصاً لمرافقة أساتذة وتلاميذ السنة الأولى ثانوي في إنجاز الأنشطة التطبيقية المقررة رسمياً لوحدة «لوحة التحكم» ضمن «المجال المفاهيمي الأول: بيئة التعامل مع الحاسوب».') + '</p>' +
                            '<p style="margin:0">' + bidi('يوفر هذا المحاكي بيئة تفاعلية مطابقة لـ Windows 11، تمكّن التلميذ من التدرب العملي الحر على تخصيص العرض، ضبط الفأرة، لغات الإدخال والمنطقة الزمنية، تثبيت وإلغاء البرامج، وإدارة حسابات المستخدمين وصلاحياتهم، دون أي خوف من إلحاق ضرر بأجهزة المخبر الحقيقية أو إرباك شبكتها.') + '</p>' +
                        '</div>' +

                        '<div>' +
                            '<h4 style="margin:0 0 6px;font-size:14px;font-weight:700;color:var(--win-accent-text)">' + bidi('رؤيتنا التعليمية:') + '</h4>' +
                            '<p style="margin:0 0 8px">' + bidi('نحن نؤمن بأن التعليم في العصر الحديث يجب أن يواكب التكنولوجيا. هذا التطبيق يعتمد على مبادئ:') + '</p>' +
                            '<ul style="margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:6px">' +
                                '<li><strong>' + bidi('الاستقلالية (Autonomy):') + '</strong> ' + bidi('أن تعتمد على نفسك في اكتشاف المعلومة وتجربة الخيارات المختلفة.') + '</li>' +
                                '<li><strong>' + bidi('التفاعل (Interaction):') + '</strong> ' + bidi('أن تتعلم من خلال الممارسة الفعلية، وليس فقط التلقي.') + '</li>' +
                                '<li><strong>' + bidi('المساعدة المتبادلة (Helping Each Other):') + '</strong> ' + bidi('أن تشاركوا معارفكم وتدعموا بعضكم البعض داخل الفصل.') + '</li>' +
                                '<li><strong>' + bidi('التشجيع (Encouragement):') + '</strong> ' + bidi('نحن هنا لنحاول، نخطئ، ونتعلم، فكل خطوة هي خطوة نحو الإتقان.') + '</li>' +
                            '</ul>' +
                        '</div>' +

                        '<div style="padding:10px 12px;border-radius:6px;background:var(--win-info-bg);border:1px solid var(--win-border-card);border-inline-start:4px solid var(--win-accent)">' +
                            '<h4 style="margin:0 0 6px;font-size:14px;font-weight:700;color:var(--win-accent-text)">' + bidi('خارطة الطريق (Roadmap):') + '</h4>' +
                            '<p style="margin:0">' +
                                bidi('هذا التطبيق ليس بأفضل نسخة، بل هو ') + '<em>' + bidi('خطوة أولى') + '</em>' + bidi('. نحن نؤمن بأنه سيتطور ويكبر ليصبح الأداة الأمثل التي نطمح إليها جميعاً لخدمة أهدافنا التربوية. كل ملاحظة أو اقتراح منكم هو لبنة في بناء هذا الصرح. لنستمر في التقدم معاً.') +
                            '</p>' +
                        '</div>' +
                    '</div>';
            },
            buttons: [{ id: 'btn-about-close', label: t('app.close') || 'إغلاق', primary: true, value: true }]
        });
    }

    function launchSetupWizard() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var runWizard = function () {
            var st = global.Win11State.get();
            var already = st.installedPrograms.some(function (p) { return p.id === 'labtools_app'; });
            var installStarted = false;
            showCustom({
                title: 'معالج التثبيت — LabTools_Setup.exe',
                tone: 'info',
                renderBody: function (wrap) {
                    if (already) {
                        wrap.innerHTML =
                            '<div style="display:flex;align-items:center;gap:12px">' +
                                global.Win11Icons.get('installer', 40) +
                                '<div>' +
                                    '<div style="font-weight:700">' + bidi('تطبيق LabTools 1AS مثبّت مسبقاً على هذا الحاسوب.') + '</div>' +
                                    '<div style="font-size:12.5px;color:var(--win-text-secondary);margin-top:4px">' + bidi('يمكنك التحقق من التطبيق أو إزالته من: الإعدادات ← التطبيقات ← التطبيقات المثبتة.') + '</div>' +
                                '</div>' +
                            '</div>';
                        return;
                    }
                    wrap.innerHTML =
                        '<div id="setup-wiz-step">' +
                            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
                                global.Win11Icons.get('installer', 44) +
                                '<div>' +
                                    '<div style="font-weight:700;font-size:15px">' + bidi('مرحباً بك في معالج تثبيت LabTools 1AS (v2.4)') + '</div>' +
                                    '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi('سيقوم المعالج بتثبيت حزمة التطبيقات التعليمية 1AS Education Suite.') + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="win-card" style="background:var(--win-surface-subtle);font-size:12.5px">' +
                                '<div><strong>' + bidi('مسار التثبيت:') + '</strong> <bdi dir="ltr">C:\\Program Files\\LabTools_1AS\\</bdi></div>' +
                                '<div><strong>' + bidi('المساحة المطلوبة:') + '</strong> <bdi dir="ltr">28.4 MB</bdi></div>' +
                            '</div>' +
                            '<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12.5px;cursor:pointer">' +
                                '<input type="checkbox" id="setup-desktop-shortcut" checked>' +
                                '<span>' + bidi('إنشاء اختصار للبرنامج على سطح المكتب (Desktop Shortcut)') + '</span>' +
                            '</label>' +
                            '<div id="setup-wiz-progress-wrap" style="display:none;margin-top:10px">' +
                                '<div style="font-weight:600;font-size:13px;margin-bottom:6px">' + bidi('جارٍ استخراج الملفات وتثبيت البرنامج...') + '</div>' +
                                '<div style="height:8px;background:var(--win-border);border-radius:4px;overflow:hidden"><div id="setup-wiz-bar" style="width:0%;height:100%;background:var(--win-accent);transition:width 0.35s ease"></div></div>' +
                            '</div>' +
                        '</div>';
                },
                buttons: already ? [
                    { label: t('app.ok'), primary: true, value: true }
                ] : [
                    {
                        label: 'تثبيت الآن (Install)',
                        id: 'btn-setup-install',
                        primary: true,
                        onClick: function (closeDlg) {
                            if (installStarted) return true;
                            installStarted = true;
                            var shortcutChk = document.getElementById('setup-desktop-shortcut');
                            var wantsShortcut = shortcutChk ? !!shortcutChk.checked : true;
                            if (shortcutChk) shortcutChk.disabled = true;
                            var installBtn = document.getElementById('btn-setup-install');
                            var cancelBtn = document.getElementById('btn-setup-cancel');
                            if (installBtn) {
                                installBtn.disabled = true;
                                installBtn.innerHTML = bidi('جارٍ التثبيت...');
                            }
                            if (cancelBtn) cancelBtn.disabled = true;
                            var progWrap = document.getElementById('setup-wiz-progress-wrap');
                            var bar = document.getElementById('setup-wiz-bar');
                            if (progWrap) progWrap.style.display = 'block';
                            setTimeout(function () {
                                if (bar) bar.style.width = '55%';
                            }, 40);
                            setTimeout(function () {
                                if (bar) bar.style.width = '100%';
                            }, 220);
                            setTimeout(function () {
                                if (!document.getElementById('setup-wiz-step')) return;
                                global.Win11State.installSetupApp({ desktopShortcut: wantsShortcut });
                                closeDlg(true);
                                showMessage(
                                    'اكتمل التثبيت',
                                    'تم تثبيت تطبيق (LabTools 1AS) بنجاح!\nيمكنك فتحه من قائمة ابدأ' + (wantsShortcut ? ' أو من أيقونة سطح المكتب' : '') + ' أو مراجعته في: الإعدادات ← التطبيقات ← التطبيقات المثبتة.',
                                    'info'
                                );
                            }, 420);
                            return true;
                        }
                    },
                    { label: t('app.cancel'), id: 'btn-setup-cancel', primary: false, value: false }
                ]
            });
        };
        if (global.Win11Permissions) {
            global.Win11Permissions.guard('apps.install', runWizard, { targetLabel: 'LabTools_Setup.exe' });
        } else {
            runWizard();
        }
    }

    function openLabToolsApp() {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        showCustom({
            title: t('settings.apps.labToolsAppTitle') || 'LabTools 1AS Education Suite',
            tone: 'info',
            wide: true,
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
                        global.Win11Icons.get('labtools', 40) +
                        '<div>' +
                            '<div style="font-weight:700;font-size:15px">' + bidi('LabTools 1AS v2.4 — حزمة مخبر الإعلام الآلي') + '</div>' +
                            '<div style="font-size:12.5px;color:var(--win-text-secondary)">' + bidi('تم التثبيت بنجاح في: C:\\Program Files\\LabTools_1AS\\') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="win-card" style="background:var(--win-surface-subtle);font-size:13px;line-height:1.7">' +
                        '<div>• ' + bidi('أدوات تهيئة الشبكة المحلية وتحليل التوصيل') + '</div>' +
                        '<div>• ' + bidi('بيئة تدريب مبسطة على صيانة الحاسوب وإدارة البرمجيات') + '</div>' +
                    '</div>';
            },
            buttons: [{ label: t('app.close'), primary: true, value: true }]
        });
    }

    function openOptionalFeatureApp(featId) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        if (featId === 'paint') {
            showCustom({
                title: t('settings.apps.paintAppTitle') || 'Paint',
                tone: 'info',
                wide: true,
                renderBody: function (wrap) {
                    wrap.innerHTML =
                        '<div id="win-paint-app" style="display:flex;flex-direction:column;gap:8px">' +
                            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:6px 10px;border:1px solid var(--win-border-card);border-radius:6px;background:var(--win-surface-subtle)">' +
                                '<div style="display:flex;align-items:center;gap:6px">' +
                                    '<span style="font-size:12px;font-weight:600">' + bidi('الألوان:') + '</span>' +
                                    '<button type="button" class="win-btn" data-paint-col="#0F172A" style="min-height:22px;width:22px;padding:0;background:#0F172A;border:2px solid var(--win-accent)"></button>' +
                                    '<button type="button" class="win-btn" data-paint-col="#DC2626" style="min-height:22px;width:22px;padding:0;background:#DC2626"></button>' +
                                    '<button type="button" class="win-btn" data-paint-col="#0284C7" style="min-height:22px;width:22px;padding:0;background:#0284C7"></button>' +
                                    '<button type="button" class="win-btn" data-paint-col="#16A34A" style="min-height:22px;width:22px;padding:0;background:#16A34A"></button>' +
                                '</div>' +
                                '<button type="button" class="win-btn win-btn-secondary" id="win-paint-clear" style="min-height:26px;font-size:12px">' + bidi('مسح اللوحة') + '</button>' +
                            '</div>' +
                            '<canvas id="win-paint-canvas" width="520" height="210" style="width:100%;height:210px;background:#FFFFFF;border:1px solid var(--win-border-control);border-radius:6px;cursor:crosshair;touch-action:none"></canvas>' +
                        '</div>';
                    var canvas = wrap.querySelector('#win-paint-canvas');
                    var ctx2d = canvas ? canvas.getContext('2d') : null;
                    if (ctx2d) {
                        var brushCol = '#0F172A';
                        var drawing = false;
                        ctx2d.lineWidth = 3;
                        ctx2d.lineCap = 'round';
                        ctx2d.strokeStyle = brushCol;
                        wrap.querySelector('#win-paint-app').onclick = function (ev) {
                            var colBtn = global.Win11Compat.closest(ev.target, '[data-paint-col]');
                            if (colBtn) {
                                brushCol = colBtn.getAttribute('data-paint-col');
                                ctx2d.strokeStyle = brushCol;
                                var allC = wrap.querySelectorAll('[data-paint-col]');
                                for (var ci = 0; ci < allC.length; ci++) allC[ci].style.border = '1px solid rgba(0,0,0,0.2)';
                                colBtn.style.border = '2px solid var(--win-accent)';
                            } else if (ev.target && ev.target.id === 'win-paint-clear') {
                                ctx2d.clearRect(0, 0, canvas.width, canvas.height);
                            }
                        };
                        var getPos = function (ev) {
                            var rect = canvas.getBoundingClientRect();
                            return {
                                x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
                                y: ((ev.clientY - rect.top) / rect.height) * canvas.height
                            };
                        };
                        canvas.onmousedown = function (ev) {
                            drawing = true;
                            var pt = getPos(ev);
                            ctx2d.beginPath();
                            ctx2d.moveTo(pt.x, pt.y);
                        };
                        canvas.onmousemove = function (ev) {
                            if (!drawing) return;
                            var pt = getPos(ev);
                            ctx2d.lineTo(pt.x, pt.y);
                            ctx2d.stroke();
                        };
                        canvas.onmouseup = function () { drawing = false; };
                        canvas.onmouseleave = function () { drawing = false; };
                    }
                },
                buttons: [{ label: t('app.close'), primary: true, value: true }]
            });
        } else if (featId === 'notepad') {
            showCustom({
                title: t('settings.apps.notepadAppTitle') || 'Notepad',
                tone: 'info',
                wide: true,
                renderBody: function (wrap) {
                    wrap.innerHTML =
                        '<div style="display:flex;flex-direction:column;gap:8px">' +
                            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
                                '<span style="font-size:12px;color:var(--win-text-secondary)" id="np-stats">' + bidi('0 حرف') + '</span>' +
                                '<button type="button" class="win-btn win-btn-secondary" id="np-save-doc" style="min-height:26px;font-size:12px">' + bidi('حفظ في المستندات (Note.txt)') + '</button>' +
                            '</div>' +
                            '<textarea id="win-notepad-editor" class="win-input" rows="8" style="width:100%;font-family:Consolas,Tahoma,sans-serif;resize:vertical" placeholder="' + global.Win11Compat.escapeHtml('اكتب ملاحظاتك هنا...') + '"></textarea>' +
                        '</div>';
                    var ed = wrap.querySelector('#win-notepad-editor');
                    var stEl = wrap.querySelector('#np-stats');
                    var saveBtn = wrap.querySelector('#np-save-doc');
                    if (ed && stEl) {
                        ed.oninput = function () {
                            stEl.innerHTML = bidi(String(ed.value.length) + ' حرف');
                        };
                    }
                    if (saveBtn && ed) {
                        saveBtn.onclick = function () {
                            var txt = ed.value || 'مستند فارغ';
                            global.Win11State.update(function (d) {
                                d.userFiles = d.userFiles || [];
                                d.userFiles.push({
                                    id: 'note_' + Date.now(),
                                    name: 'Note_' + (d.userFiles.length + 1) + '.txt',
                                    folder: 'documents',
                                    type: 'text',
                                    content: txt
                                });
                            }, 'files:changed');
                            if (stEl) stEl.innerHTML = '<span style="color:var(--win-success);font-weight:600">' + bidi('تم الحفظ في مجلد Documents!') + '</span>';
                        };
                    }
                },
                buttons: [{ label: t('app.close'), primary: true, value: true }]
            });
        } else {
            showCustom({
                title: t('settings.apps.gamesAppTitle') || 'Windows Games',
                tone: 'info',
                renderBody: function (wrap) {
                    var symbols = ['★', '★', '◆', '◆', '▲', '▲', '●', '●'];
                    var deck = symbols.slice().sort(function () { return Math.random() - 0.5; });
                    var flipped = [];
                    var matched = 0;
                    var moves = 0;
                    wrap.innerHTML =
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
                            '<strong style="font-size:13px">' + bidi('لعبة الذاكرة الكلاسيكية (Memory)') + '</strong>' +
                            '<span id="game-mem-moves" class="win-badge win-badge-info">' + bidi('الحركات: 0') + '</span>' +
                        '</div>' +
                        '<div id="game-mem-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:300px;margin:0 auto">' +
                            deck.map(function (sym, idx) {
                                return '<button type="button" class="win-btn win-btn-secondary" data-card-idx="' + idx + '" data-card-sym="' + sym + '" style="height:54px;font-size:20px;font-weight:700">?</button>';
                            }).join('') +
                        '</div>';
                    var grid = wrap.querySelector('#game-mem-grid');
                    var moveBadge = wrap.querySelector('#game-mem-moves');
                    if (grid) {
                        grid.onclick = function (ev) {
                            var card = global.Win11Compat.closest(ev.target, '[data-card-idx]');
                            if (!card || card.disabled || flipped.indexOf(card) !== -1 || flipped.length >= 2) return;
                            card.textContent = card.getAttribute('data-card-sym');
                            flipped.push(card);
                            if (flipped.length === 2) {
                                moves += 1;
                                if (moveBadge) moveBadge.innerHTML = bidi('الحركات: ' + moves);
                                var a = flipped[0], b = flipped[1];
                                if (a.getAttribute('data-card-sym') === b.getAttribute('data-card-sym')) {
                                    a.disabled = true;
                                    b.disabled = true;
                                    a.className = 'win-btn win-btn-accent';
                                    b.className = 'win-btn win-btn-accent';
                                    matched += 2;
                                    flipped = [];
                                    if (matched === deck.length && moveBadge) {
                                        moveBadge.className = 'win-badge win-badge-success';
                                        moveBadge.innerHTML = bidi('فوز خلال ' + moves + ' حركات!');
                                    }
                                } else {
                                    setTimeout(function () {
                                        a.textContent = '?';
                                        b.textContent = '?';
                                        flipped = [];
                                    }, 420);
                                }
                            }
                        };
                    }
                },
                buttons: [{ label: t('app.close'), primary: true, value: true }]
            });
        }
    }

    global.Win11Dialogs = {
        showCustom: showCustom,
        showMessage: showMessage,
        showConfirm: showConfirm,
        showAbout: showAboutModal,
        launchSetupWizard: launchSetupWizard,
        openLabToolsApp: openLabToolsApp,
        openOptionalFeatureApp: openOptionalFeatureApp,
        close: closeDialog,
        isPersistent: function () { return !!activePersistent; },
        isOpen: function () {
            var b = getBackdrop();
            return !!(b && b.classList.contains('is-open'));
        }
    };
})(window);

