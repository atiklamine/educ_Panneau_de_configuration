/**
 * Application Bootstrapper
 */
(function (global) {
    'use strict';

    function finishBoot() {
        var st = global.Win11State.get();
        if (global.Win11Assessment && global.Win11Assessment.getConfig) {
            var bootCfg = global.Win11Assessment.getConfig();
            if (bootCfg.ui_language_default && (!st.displayLanguage || bootCfg.ui_language_default !== 'ar')) {
                st.displayLanguage = bootCfg.ui_language_default;
                st.uiLanguage = bootCfg.ui_language_default;
            }
            if (bootCfg.netsupport_offset) {
                document.documentElement.classList.add('has-netsupport-offset');
                document.body.classList.add('has-netsupport-offset');
            }
        }
        global.Win11I18N.setNumerals(st.numerals || 'latin');
        global.Win11I18N.setLanguage(st.displayLanguage || st.uiLanguage || 'ar', function () {
            if (global.Win11Shell) global.Win11Shell.init();
            if (global.Win11Assessment) {
                if (typeof global.Win11Assessment.initSessionLifecycle === 'function') {
                    global.Win11Assessment.initSessionLifecycle();
                } else {
                    global.Win11Assessment.evaluate();
                }
                var infSt = global.Win11Assessment.getInfStatus ? global.Win11Assessment.getInfStatus() : null;
                var isTeacherExplicit = !!(
                    global.__WIN11_TEACHER_MODE__ ||
                    (global.location && /[?&](teacher(=1)?|mode=teacher)(&|$)/i.test(global.location.search))
                );

                var launchStudentForm = function () {
                    if (global.Win11Report && typeof global.Win11Report.openStudentRegistration === 'function') {
                        global.Win11Report.openStudentRegistration({ mandatory: true });
                    }
                    var ensureFormMounted = function () {
                        var stu = (global.Win11Assessment && global.Win11Assessment.getStudent) ? global.Win11Assessment.getStudent() : null;
                        if (stu && !stu.activeSession && !document.getElementById('stu-reg-lastname') && !document.getElementById('plain-student-fallback-form')) {
                            if (global.Win11Report && typeof global.Win11Report.injectPlainStudentFormFallback === 'function') {
                                global.Win11Report.injectPlainStudentFormFallback();
                            }
                        }
                    };
                    setTimeout(ensureFormMounted, 200);
                    setTimeout(ensureFormMounted, 600);
                };

                if (isTeacherExplicit || (infSt && infSt.status === 'missing')) {
                    setTimeout(function () {
                        if (global.Win11Teacher && typeof global.Win11Teacher.openPanel === 'function') {
                            global.Win11Teacher.openPanel({
                                firstTimeSetup: (infSt && infSt.status === 'missing'),
                                onDone: function () {
                                    if (!global.Win11Assessment.getStudent().activeSession) {
                                        launchStudentForm();
                                    }
                                }
                            });
                        }
                    }, 90);
                } else if (infSt && infSt.status === 'tampered' && global.Win11Dialogs) {
                    setTimeout(function () {
                        global.Win11Dialogs.showMessage(
                            global.Win11I18N.t('pedagogy.infTamperTitle'),
                            global.Win11I18N.t('pedagogy.infTamperMsg'),
                            'warning',
                            launchStudentForm
                        );
                    }, 90);
                } else {
                    // Mandatory non-skippable Student Info Form on EVERY launch before simulation and timers begin
                    setTimeout(launchStudentForm, 90);
                }
            }

            // Windowed / Maximized co-existence with NetSupport School (only enter exclusive fullscreen if teacher locked it and no NetSupport)
            var cfgNow = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : null;
            if (cfgNow && cfgNow.lock_fullscreen_in_exam && !cfgNow.netsupport_offset && global.Win11Shell && typeof global.Win11Shell.enterFullscreen === 'function') {
                global.Win11Shell.enterFullscreen();
                var onceFs = function () {
                    document.removeEventListener('pointerdown', onceFs, true);
                    if (cfgNow && cfgNow.lock_fullscreen_in_exam && !document.fullscreenElement && !document.webkitFullscreenElement) {
                        global.Win11Shell.enterFullscreen();
                    }
                };
                document.addEventListener('pointerdown', onceFs, true);
            }

            // Persist display language changes cleanly
            global.Win11I18N.onChange(function (lang) {
                global.Win11State.set({ displayLanguage: lang, uiLanguage: lang }, 'ui:language');
            });
        });
    }

    function startServerHeartbeat() {
        if (!global.location || !global.location.protocol || global.location.protocol.indexOf('http') !== 0) {
            return;
        }
        function sendPing() {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/ping', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send('{}');
            } catch (e) { }
        }
        sendPing();
        setInterval(sendPing, 2500);

        try {
            global.addEventListener('beforeunload', function () {
                try {
                    if (global.navigator && global.navigator.sendBeacon) {
                        global.navigator.sendBeacon('/api/goodbye');
                    }
                } catch (e) { }
            });
        } catch (e2) { }
    }

    function suppressBrowserAutofillAndCredentialPrompts() {
        function sanitizeInputs(root) {
            if (!root || !root.querySelectorAll) return;
            var inps = root.querySelectorAll('input, select, textarea');
            for (var i = 0; i < inps.length; i++) {
                var inp = inps[i];
                if (inp.type === 'password') {
                    if (!inp.hasAttribute('autocomplete')) inp.setAttribute('autocomplete', 'new-password');
                    inp.setAttribute('data-lpignore', 'true');
                    inp.setAttribute('data-form-type', 'other');
                } else if (inp.type === 'text') {
                    if (!inp.hasAttribute('autocomplete')) inp.setAttribute('autocomplete', 'off');
                    inp.setAttribute('data-lpignore', 'true');
                }
                inp.setAttribute('spellcheck', 'false');
            }
            var forms = root.querySelectorAll('form');
            for (var f = 0; f < forms.length; f++) {
                forms[f].setAttribute('autocomplete', 'off');
                forms[f].onsubmit = function () { return false; };
            }
        }

        sanitizeInputs(document);

        if (global.MutationObserver) {
            var obs = new MutationObserver(function (mutations) {
                for (var m = 0; m < mutations.length; m++) {
                    var added = mutations[m].addedNodes;
                    for (var n = 0; n < added.length; n++) {
                        if (added[n].nodeType === 1) {
                            sanitizeInputs(added[n]);
                        }
                    }
                }
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    var didFinishBoot = false;
    function safeFinishBoot() {
        if (didFinishBoot) return;
        didFinishBoot = true;
        finishBoot();
    }

    function boot() {
        suppressBrowserAutofillAndCredentialPrompts();
        startServerHeartbeat();
        if (global.Win11Compat && typeof global.Win11Compat.purgeLegacyPersistence === 'function') {
            global.Win11Compat.purgeLegacyPersistence();
            var selfCheck = global.Win11Compat.verifyCleanStartup();
            if (!selfCheck.clean && global.console && global.console.warn) {
                global.console.warn('[Win11Sim] Residual storage detected:', selfCheck.remaining);
            }
        }
        global.Win11State.init();

        var bootWatchdog = setTimeout(function () {
            if (!didFinishBoot) {
                safeFinishBoot();
            }
        }, 2800);

        if (global.Win11Assessment && typeof global.Win11Assessment.fetchSidecarFromHost === 'function') {
            global.Win11Assessment.fetchSidecarFromHost(function () {
                clearTimeout(bootWatchdog);
                safeFinishBoot();
            });
        } else {
            clearTimeout(bootWatchdog);
            safeFinishBoot();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(window);

