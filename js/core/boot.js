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
                    // Section 7.2: Fail-safe fallback if form fails to mount in DOM after 400ms
                    setTimeout(function () {
                        var stu = (global.Win11Assessment && global.Win11Assessment.getStudent) ? global.Win11Assessment.getStudent() : null;
                        if (stu && !stu.activeSession && !document.getElementById('stu-reg-lastname') && !document.getElementById('plain-student-fallback-form')) {
                            if (global.Win11Report && typeof global.Win11Report.injectPlainStudentFormFallback === 'function') {
                                global.Win11Report.injectPlainStudentFormFallback();
                            }
                        }
                    }, 400);
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

    function boot() {
        if (global.Win11Compat && typeof global.Win11Compat.purgeLegacyPersistence === 'function') {
            global.Win11Compat.purgeLegacyPersistence();
            var selfCheck = global.Win11Compat.verifyCleanStartup();
            if (!selfCheck.clean && global.console && global.console.warn) {
                global.console.warn('[Win11Sim] Residual storage detected:', selfCheck.remaining);
            }
        }
        global.Win11State.init();

        if (global.Win11Assessment && typeof global.Win11Assessment.fetchSidecarFromHost === 'function') {
            global.Win11Assessment.fetchSidecarFromHost(finishBoot);
        } else {
            finishBoot();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(window);

