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
                var launchStudentForm = function () {
                    if (global.Win11Report && typeof global.Win11Report.openStudentRegistration === 'function') {
                        global.Win11Report.openStudentRegistration({ mandatory: true });
                    }
                };
                if (infSt && infSt.status === 'tampered' && global.Win11Dialogs) {
                    setTimeout(function () {
                        global.Win11Dialogs.showMessage(
                            global.Win11I18N.t('pedagogy.infTamperTitle'),
                            global.Win11I18N.t('pedagogy.infTamperMsg'),
                            'warning',
                            launchStudentForm
                        );
                    }, 90);
                } else if (infSt && infSt.status === 'missing') {
                    // Section 1.1: If inf.dll is not found next to the app, launch directly into Teacher Settings Panel
                    setTimeout(function () {
                        if (global.Win11Teacher && typeof global.Win11Teacher.openPanel === 'function') {
                            global.Win11Teacher.openPanel({
                                firstTimeSetup: true,
                                onDone: function () {
                                    if (!global.Win11Assessment.getStudent().activeSession) {
                                        launchStudentForm();
                                    }
                                }
                            });
                        }
                    }, 90);
                } else {
                    // Section 1.1 & Section 3: inf.dll loaded silently -> mandatory non-skippable Student Info Form before timers begin
                    setTimeout(launchStudentForm, 90);
                }
            }

            // Stage 7 Fullscreen-First behavior (gracefully arms on first user pointer interaction if browser blocks non-gestured requestFullscreen)
            if (global.Win11Shell && typeof global.Win11Shell.enterFullscreen === 'function') {
                global.Win11Shell.enterFullscreen();
                var onceFs = function () {
                    document.removeEventListener('pointerdown', onceFs, true);
                    var cfgNow = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : null;
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

