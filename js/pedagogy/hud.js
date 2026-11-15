/**
 * Draggable, Collapsible, 2D-Resizable, Maximizable 1AS Pedagogical Assistant HUD
 * Includes Overall Progress Bar, Multi-Step Task Progress Bar & Formatted ✔/○ Substeps.
 */
(function (global) {
    'use strict';

    var currentTaskIdx = 0;
    var lastRenderedActiveIdx = -1;
    var lastRenderedStepSig = '';

    function buildHudStateSig(tasks, activeIdx, currentIdx, scores) {
        var tk = tasks[currentIdx] || tasks[0];
        if (!tk) return '';
        var steps = Array.isArray(tk.subSteps) ? tk.subSteps : [];
        var sFlags = '';
        for (var i = 0; i < steps.length; i++) {
            sFlags += steps[i].ok ? '1' : (steps[i].skipped ? 's' : '0');
        }
        return activeIdx + '|' + currentIdx + '|' + (tk.completed ? 1 : 0) + '|' + (tk.skipped ? 1 : 0) + '|' + tk.earnedPoints + '|' + sFlags + '|' + scores.net.toFixed(2);
    }
    var hudInitialized = false;
    var activeHintTaskId = null;
    var savedRestoreRect = null;
    var renderQueued = false;

    function getEl() {
        return document.getElementById('pedagogy-hud');
    }

    function isOpen() {
        var el = getEl();
        return !!(el && el.classList.contains('is-open'));
    }

    function getTaskField(task, fieldPrefix) {
        var lang = global.Win11I18N.getLang();
        if (lang === 'fr') return task[fieldPrefix + 'Fr'];
        if (lang === 'en') return task[fieldPrefix + 'En'];
        return task[fieldPrefix + 'Ar'];
    }

    function getStepLabel(step) {
        var lang = global.Win11I18N.getLang();
        if (lang === 'fr') return step.labelFr || step.labelAr || '';
        if (lang === 'en') return step.labelEn || step.labelAr || '';
        return step.labelAr || '';
    }

    function scheduleRender() {
        if (renderQueued) return;
        renderQueued = true;
        var run = function () {
            renderQueued = false;
            if (isOpen()) renderContent();
        };
        if (typeof global.requestAnimationFrame === 'function') {
            global.requestAnimationFrame(run);
        } else {
            setTimeout(run, 16);
        }
    }

    function toggleMaximize() {
        var el = getEl();
        if (!el) return;
        el.classList.remove('is-collapsed');
        if (el.classList.contains('is-maximized')) {
            el.classList.remove('is-maximized');
            if (savedRestoreRect) {
                el.style.left = savedRestoreRect.left || '';
                el.style.top = savedRestoreRect.top || '';
                el.style.right = savedRestoreRect.right || '';
                el.style.bottom = savedRestoreRect.bottom || '';
                el.style.width = savedRestoreRect.width || '';
                el.style.height = savedRestoreRect.height || '';
            }
        } else {
            savedRestoreRect = {
                left: el.style.left,
                top: el.style.top,
                right: el.style.right,
                bottom: el.style.bottom,
                width: el.style.width,
                height: el.style.height
            };
            el.classList.add('is-maximized');
        }
        renderContent();
    }

    function renderContent() {
        var el = getEl();
        if (!el) return;

        var prevBody = el.querySelector('.hud-body');
        var prevScrollTop = prevBody ? prevBody.scrollTop : 0;

        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var allTasks = global.Win11Assessment.getTasks();
        var tasks = allTasks.filter(function (item) { return item.enabled !== false; });
        if (tasks.length === 0) tasks = allTasks;
        var activeIdx = (typeof global.Win11Assessment.getActiveTaskIndex === 'function') ? global.Win11Assessment.getActiveTaskIndex() : 0;
        var clampedActive = (activeIdx < tasks.length) ? activeIdx : Math.max(0, tasks.length - 1);
        if (activeIdx !== lastRenderedActiveIdx) {
            currentTaskIdx = clampedActive;
            lastRenderedActiveIdx = activeIdx;
        }
        if (currentTaskIdx >= tasks.length || currentTaskIdx < 0) currentTaskIdx = clampedActive;
        if (currentTaskIdx > clampedActive) currentTaskIdx = clampedActive;

        var task = tasks[currentTaskIdx] || tasks[0];
        var cfg = global.Win11Assessment.getConfig();
        var scores = global.Win11Assessment.getScores();
        var stu = global.Win11Assessment.getStudent();
        var overallProg = (typeof global.Win11Assessment.getOverallProgress === 'function')
            ? global.Win11Assessment.getOverallProgress()
            : { doneTasks: 0, totalTasks: tasks.length, percent: 0 };
        var isExamMode = ((stu.mode || cfg.mode) === 'exam');
        var showHintBox = (!isExamMode && activeHintTaskId === task.id);
        var isMaximized = el.classList.contains('is-maximized');

        var tabsHtml = '';
        for (var i = 0; i < tasks.length; i++) {
            var tk = tasks[i];
            var isDone = !!tk.completed;
            var isSkipped = !!tk.skipped;
            var isCurActive = (i === activeIdx && activeIdx < tasks.length);
            var isLocked = (!isDone && !isSkipped && i > activeIdx);
            var tabCls = 'hud-task-tab' +
                (isCurActive ? ' is-current-active' : '') +
                (isDone ? ' is-done-task' : '') +
                (isSkipped ? ' is-skipped-task' : '') +
                (isLocked ? ' is-locked-task' : '') +
                (i === currentTaskIdx ? ' is-active' : '');
            var prefix = isLocked ? '🔒 ' : (isDone ? '✓ ' : (isSkipped ? '⏭ ' : ''));
            tabsHtml += '<button type="button" class="' + tabCls + '" data-hud-tab="' + i + '" data-hud-locked="' + (isLocked ? '1' : '0') + '" title="' + global.Win11Compat.escapeHtml(getTaskField(tk, 'title')) + '"><bdi dir="ltr">' + prefix + (i + 1) + '</bdi></button>';
        }

        var isViewingActive = (currentTaskIdx === activeIdx && activeIdx < tasks.length);
        var activeBadgeHtml = isViewingActive
            ? '<span class="hud-active-pill">' + bidi('المهمة النشطة حالياً') + '</span>'
            : (activeIdx >= tasks.length ? '<span class="hud-active-pill" style="background:#107C41">' + bidi('انتهت المهام') + '</span>' : '');

        var taskSteps = Array.isArray(task.subSteps) ? task.subSteps : [];
        var taskPct = (typeof task.progressPercent === 'number')
            ? task.progressPercent
            : (task.maxPoints > 0 ? Math.min(100, Math.round((task.earnedPoints / task.maxPoints) * 100)) : 0);
        var doneStepsCount = 0;
        for (var sc = 0; sc < taskSteps.length; sc++) {
            if (taskSteps[sc].ok) doneStepsCount += 1;
        }
        var taskProgCountLabel = taskSteps.length > 0
            ? (doneStepsCount + ' / ' + taskSteps.length + ' (' + taskPct + '%)')
            : (taskPct + '%');
        var taskProgressBarHtml =
            '<div class="hud-progress-card" id="hud-task-progress-card" style="margin:6px 0 8px">' +
                '<div class="hud-progress-meta">' +
                    '<span>' + bidi(t('pedagogy.taskProgressLabel')) + '</span>' +
                    '<span id="hud-task-progress-pct"><bdi dir="ltr">' + taskProgCountLabel + '</bdi></span>' +
                '</div>' +
                '<div class="hud-progress-track">' +
                    '<div class="hud-progress-fill' + (taskPct >= 100 ? ' is-complete' : '') + '" id="hud-task-progress-bar" style="width:' + taskPct + '%"></div>' +
                '</div>' +
            '</div>';

        var bodyBoxHtml = '';
        if (isExamMode) {
            var examListHtml = '';
            for (var ei = 0; ei < tasks.length; ei++) {
                var et = tasks[ei];
                var eDone = !!et.completed;
                var eSkip = !!et.skipped;
                var eAct = (ei === activeIdx && activeIdx < tasks.length);
                var eLock = (!eDone && !eSkip && ei > activeIdx);
                var stText = eDone ? t('pedagogy.taskCompleted') : (eSkip ? t('pedagogy.taskSkippedShort') : (eAct ? 'المهمة النشطة' : 'مقفلة'));
                var stCls = eDone ? 'win-badge-success' : (eSkip ? 'win-badge-danger' : (eAct ? 'win-badge-info' : 'win-badge-warning'));
                examListHtml +=
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:4px 6px;border-radius:6px;' + (eAct ? 'background:rgba(0,103,192,0.10);border:1px solid rgba(0,103,192,0.35);font-weight:700;' : (eLock ? 'opacity:0.6;' : '')) + 'margin-top:4px">' +
                        '<span style="font-size:12px">' + '<bdi dir="ltr">' + (eLock ? '🔒 ' : (eDone ? '✓ ' : (eSkip ? '⏭ ' : '▶ '))) + (ei + 1) + '.</bdi> ' + bidi(getTaskField(et, 'title')) + '</span>' +
                        '<span class="win-badge ' + stCls + '" style="font-size:10.5px;white-space:nowrap">' + bidi(stText) + ' (<bdi dir="ltr">' + et.earnedPoints + '/' + et.maxPoints + '</bdi>)</span>' +
                    '</div>';
            }
            bodyBoxHtml =
                '<div class="hud-instruction-box">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">' +
                        '<strong style="font-size:13px">' + bidi(getTaskField(task, 'title')) + '</strong>' +
                        activeBadgeHtml +
                    '</div>' +
                    taskProgressBarHtml +
                    '<div style="margin-top:6px">' + examListHtml + '</div>' +
                '</div>';
        } else {
            var badgeClass = task.completed ? 'win-badge-success' : (task.skipped ? 'win-badge-danger' : 'win-badge-warning');
            var badgeLabel = task.completed ? t('pedagogy.taskCompleted') : (task.skipped ? t('pedagogy.taskSkippedBadge') : t('pedagogy.taskPending'));

            var stepsHtml = '';
            if (taskSteps.length > 0) {
                stepsHtml = '<div style="font-size:12px;font-weight:700;margin-top:6px;color:var(--win-text-primary)">' + bidi(t('pedagogy.stepsChecklistTitle')) + '</div><ol class="hud-steps-list" id="hud-steps-list">';
                for (var si = 0; si < taskSteps.length; si++) {
                    var stepObj = taskSteps[si];
                    var doneStep = !!stepObj.ok;
                    var skippedStep = !doneStep && !!stepObj.skipped;
                    var liCls = doneStep ? 'is-done' : (skippedStep ? 'is-skipped' : 'is-pending');
                    var iconCh = doneStep ? '✔' : (skippedStep ? '⏭' : '○');
                    var stepRightHtml = '';
                    if (skippedStep) {
                        stepRightHtml = '<span class="win-badge win-badge-neutral" style="font-size:10.5px;flex-shrink:0">' + bidi(t('pedagogy.subStepSkippedBadge')) + ' (<bdi dir="ltr">0</bdi>)</span>';
                    } else if (!doneStep && !isExamMode && isViewingActive && taskSteps.length > 1) {
                        stepRightHtml = '<button type="button" class="win-btn win-btn-subtle hud-skip-step-btn" data-skip-task-id="' + task.id + '" data-skip-step-idx="' + si + '">' + bidi(t('pedagogy.skipSubStepBtn')) + '</button>';
                    }
                    stepsHtml +=
                        '<li class="hud-step-item ' + liCls + '">' +
                            '<div class="hud-step-main">' +
                                '<span class="hud-step-icon" aria-hidden="true">' + iconCh + '</span>' +
                                '<span>' + bidi((si + 1) + '. ' + getStepLabel(stepObj)) + '</span>' +
                            '</div>' +
                            stepRightHtml +
                        '</li>';
                }
                stepsHtml += '</ol>';
            }

            bodyBoxHtml =
                '<div class="hud-instruction-box">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px">' +
                        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                            '<strong style="font-size:13.5px">' + bidi(getTaskField(task, 'title')) + '</strong>' +
                            activeBadgeHtml +
                        '</div>' +
                        '<span class="win-badge ' + badgeClass + '">' +
                            bidi(badgeLabel) + ' (<bdi dir="ltr">' + task.earnedPoints + '/' + task.maxPoints + '</bdi>)' +
                        '</span>' +
                    '</div>' +
                    taskProgressBarHtml +
                    '<div style="font-size:12.5px;color:var(--win-text-secondary);line-height:1.62;margin-bottom:4px">' + bidi(getTaskField(task, 'instr')) + '</div>' +
                    stepsHtml +
                '</div>';
        }

        var limitSuffix = '';
        if (cfg.exam_time_limit_min && Number(cfg.exam_time_limit_min) > 0) {
            var remSec = Math.max(0, (Number(cfg.exam_time_limit_min) * 60) - stu.elapsedSeconds);
            limitSuffix = ' / ' + global.Win11Assessment.formatDuration(remSec);
        }

        var overallBarHtml =
            '<div class="hud-progress-card" id="hud-overall-progress-card">' +
                '<div class="hud-progress-meta">' +
                    '<span>' + bidi(t('pedagogy.overallProgressLabel')) + ' (<bdi dir="ltr">' + overallProg.doneTasks + ' / ' + overallProg.totalTasks + '</bdi>)</span>' +
                    '<span id="hud-overall-progress-pct"><bdi dir="ltr">' + overallProg.percent + '%</bdi></span>' +
                '</div>' +
                '<div class="hud-progress-track">' +
                    '<div class="hud-progress-fill' + (overallProg.percent >= 100 ? ' is-complete' : '') + '" id="hud-overall-progress-bar" style="width:' + overallProg.percent + '%"></div>' +
                '</div>' +
            '</div>';

        el.innerHTML =
            '<div class="hud-header" id="hud-drag-bar">' +
                '<div class="hud-header-title">' +
                    global.Win11Icons.get('graduation', 16) +
                    '<span>' + bidi(t('pedagogy.title')) + '</span>' +
                '</div>' +
                '<div class="hud-header-stats">' +
                    '<span class="win-badge win-badge-info" id="hud-score-pill"><bdi dir="ltr">' + scores.net.toFixed(2) + ' / 20</bdi></span>' +
                    '<span class="win-badge" style="background:var(--win-surface-card)" id="hud-time-pill"><bdi dir="ltr">' + global.Win11Assessment.formatDuration(stu.elapsedSeconds) + limitSuffix + '</bdi></span>' +
                    '<button type="button" class="win-caption-btn" id="hud-collapse-btn" style="width:26px;height:24px;border-radius:4px">' + global.Win11Icons.get('winMin', 11) + '</button>' +
                    '<button type="button" class="win-caption-btn" id="hud-maximize-btn" title="' + global.Win11Compat.escapeHtml(isMaximized ? t('pedagogy.restoreBtn') : t('pedagogy.maximizeBtn')) + '" style="width:26px;height:24px;border-radius:4px">' + global.Win11Icons.get(isMaximized ? 'winRestore' : 'winMax', 11) + '</button>' +
                    '<button type="button" class="win-caption-btn is-close" id="hud-close-btn" style="width:26px;height:24px;border-radius:4px">' + global.Win11Icons.get('winClose', 11) + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="hud-body">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px">' +
                    '<span><bdi dir="ltr">' + global.Win11Compat.escapeHtml(stu.fullName) + '</bdi> &bull; ' + bidi(isExamMode ? 'امتحان رسمي' : 'استطلاع وتدريب') + '</span>' +
                    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                        '<button type="button" class="win-btn win-btn-secondary" id="hud-edit-info-btn" style="min-height:24px;height:24px;padding:2px 8px;font-size:11.5px">' + bidi(t('pedagogy.editInfoBtn')) + '</button>' +
                        '<button type="button" class="win-btn win-btn-subtle" id="hud-start-exam-btn" style="min-height:24px;height:24px;padding:2px 8px;font-size:11.5px;color:var(--win-accent-text)">' + bidi(t('pedagogy.loginBtn')) + '</button>' +
                    '</div>' +
                '</div>' +
                overallBarHtml +
                '<div class="hud-task-tabs">' + tabsHtml + '</div>' +
                bodyBoxHtml +
                (showHintBox ? (
                    '<div class="hud-hint-callout" id="hud-inline-hint">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
                            '<span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px">' + global.Win11Icons.get('bulb', 14) + '<span>' + bidi(t('pedagogy.hintBtn')) + '</span></span>' +
                            '<button type="button" class="win-caption-btn" id="hud-hide-hint-btn" style="width:22px;height:22px;border-radius:4px">' + global.Win11Icons.get('winClose', 10) + '</button>' +
                        '</div>' +
                        '<div style="font-size:12.5px;line-height:1.58">' + bidi(getTaskField(task, 'hint')) + '</div>' +
                    '</div>'
                ) : '') +
                '<div class="hud-actions">' +
                    (isExamMode ? '' : '<button type="button" class="win-btn win-btn-secondary" id="hud-hint-btn">' + global.Win11Icons.get('bulb', 14) + '<span>' + bidi(t('pedagogy.hintBtn')) + '</span></button>') +
                    '<button type="button" class="win-btn win-btn-secondary" id="hud-check-btn">' + global.Win11Icons.get('check', 14) + '<span>' + bidi(t('pedagogy.checkBtn')) + '</span></button>' +
                    '<button type="button" class="win-btn win-btn-secondary" id="hud-skip-btn"' + (isViewingActive ? '' : ' disabled') + '><span>⏭ ' + bidi(t('pedagogy.skipBtn')) + '</span></button>' +
                    '<button type="button" class="win-btn win-btn-secondary" id="hud-summary-btn" title="طباعة ورقة ملخص الدرس (الكراس)"><span>📄 ' + bidi('ورقة الملخص') + '</span></button>' +
                    '<button type="button" class="win-btn win-btn-secondary" id="hud-new-sim-btn">' + global.Win11Icons.get('refresh', 14) + '<span>' + bidi(t('pedagogy.newSimBtn')) + '</span></button>' +
                    '<button type="button" class="win-btn win-btn-accent" id="hud-report-btn" style="margin-inline-start:auto">' + global.Win11Icons.get('trophy', 14) + '<span>' + bidi(t('pedagogy.reportBtn')) + '</span></button>' +
                '</div>' +
            '</div>' +
            '<div class="hud-resize-corner" id="hud-resize-handle" title="' + global.Win11Compat.escapeHtml('تغيير الحجم') + '"></div>';

        var nextBody = el.querySelector('.hud-body');
        if (nextBody && prevScrollTop > 0) nextBody.scrollTop = prevScrollTop;
        lastRenderedStepSig = buildHudStateSig(tasks, activeIdx, currentTaskIdx, scores);

        wireEvents(el, task);
    }

    function wireEvents(el, task) {
        var tabs = el.querySelectorAll('[data-hud-tab]');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].onclick = function () {
                if (this.getAttribute('data-hud-locked') === '1') {
                    global.Win11Dialogs.showMessage(
                        global.Win11I18N.t('pedagogy.title'),
                        'هذه المهمة مقفلة حالياً. يجب إتمام المهمة النشطة الحالية بالترتيب أولاً.',
                        'warning'
                    );
                    return;
                }
                currentTaskIdx = Number(this.getAttribute('data-hud-tab'));
                renderContent();
            };
        }

        el.querySelector('#hud-collapse-btn').onclick = function (e) {
            e.stopPropagation();
            el.classList.toggle('is-collapsed');
        };
        var maxBtn = el.querySelector('#hud-maximize-btn');
        if (maxBtn) {
            maxBtn.onclick = function (e) {
                e.stopPropagation();
                toggleMaximize();
            };
        }
        el.querySelector('#hud-close-btn').onclick = function (e) {
            e.stopPropagation();
            el.classList.remove('is-open');
        };
        var editInfoBtn = el.querySelector('#hud-edit-info-btn');
        if (editInfoBtn) {
            editInfoBtn.onclick = function () {
                if (global.Win11Report) global.Win11Report.openStudentRegistration({ editOnly: true });
            };
        }
        el.querySelector('#hud-start-exam-btn').onclick = function () {
            if (global.Win11Report) global.Win11Report.openStudentRegistration();
        };
        var hideHintBtn = el.querySelector('#hud-hide-hint-btn');
        if (hideHintBtn) {
            hideHintBtn.onclick = function () {
                activeHintTaskId = null;
                renderContent();
            };
        }
        var hintBtn = el.querySelector('#hud-hint-btn');
        if (hintBtn) {
            hintBtn.onclick = function () {
                if (activeHintTaskId === task.id) {
                    activeHintTaskId = null;
                    renderContent();
                    return;
                }
                var cfg = global.Win11Assessment.getConfig();
                global.Win11Assessment.recordMistake(task.id, 'استخدام تلميح', getTaskField(task, 'title'), cfg.penalty_hint);
                activeHintTaskId = task.id;
                renderContent();
            };
        }
        el.querySelector('#hud-check-btn').onclick = function () {
            global.Win11Assessment.evaluate();
            var list = global.Win11Assessment.getTasks().filter(function (item) { return item.enabled !== false; });
            if (list.length === 0) list = global.Win11Assessment.getTasks();
            var tObj = null;
            for (var k = 0; k < list.length; k++) {
                if (list[k].id === task.id) { tObj = list[k]; break; }
            }
            if (!tObj) tObj = list[currentTaskIdx] || list[0];
            global.Win11Dialogs.showMessage(
                global.Win11I18N.t('pedagogy.checkBtn'),
                getTaskField(tObj, 'title') + ' — ' + tObj.earnedPoints + ' / ' + tObj.maxPoints,
                tObj.completed ? 'info' : 'warning'
            );
            renderContent();
        };
        var skipBtn = el.querySelector('#hud-skip-btn');
        if (skipBtn) {
            skipBtn.onclick = function () {
                if (skipBtn.disabled) return;
                global.Win11Dialogs.showConfirm(
                    global.Win11I18N.t('pedagogy.skipConfirmTitle'),
                    global.Win11I18N.t('pedagogy.skipConfirmMsg'),
                    function (yes) {
                        if (!yes) return;
                        activeHintTaskId = null;
                        if (global.Win11Assessment && typeof global.Win11Assessment.skipActiveTask === 'function') {
                            global.Win11Assessment.skipActiveTask();
                        }
                        renderContent();
                    },
                    'warning'
                );
            };
        }
        var newSimBtn = el.querySelector('#hud-new-sim-btn');
        if (newSimBtn) {
            newSimBtn.onclick = function () {
                if (global.Win11Report && typeof global.Win11Report.confirmNewSimulation === 'function') {
                    global.Win11Report.confirmNewSimulation();
                }
            };
        }
        var summaryBtn = el.querySelector('#hud-summary-btn');
        if (summaryBtn) {
            summaryBtn.onclick = function () {
                if (global.Win11Report && typeof global.Win11Report.openSummarySheet === 'function') {
                    global.Win11Report.openSummarySheet();
                } else if (typeof window !== 'undefined' && window.open) {
                    window.open('summary.html', '_blank');
                }
            };
        }

        el.querySelector('#hud-report-btn').onclick = function () {
            if (global.Win11Report) global.Win11Report.openCertificate();
        };

        var stepsList = el.querySelector('#hud-steps-list');
        if (stepsList) {
            stepsList.onclick = function (ev) {
                var btn = global.Win11Compat.closest(ev.target, '[data-skip-step-idx]');
                if (!btn) return;
                ev.stopPropagation();
                var tid = Number(btn.getAttribute('data-skip-task-id'));
                var sIdx = Number(btn.getAttribute('data-skip-step-idx'));
                if (global.Win11Assessment && typeof global.Win11Assessment.skipSubStep === 'function') {
                    if (global.Win11Assessment.skipSubStep(tid, sIdx)) {
                        renderContent();
                    }
                }
            };
        }

        // Dragging with strict viewport bounds clamping
        var bar = el.querySelector('#hud-drag-bar');
        bar.addEventListener('dblclick', function (e) {
            if (global.Win11Compat.closest(e.target, 'button')) return;
            toggleMaximize();
        });
        bar.addEventListener('mousedown', function (e) {
            if (e.button !== 0 || global.Win11Compat.closest(e.target, 'button')) return;
            if (el.classList.contains('is-maximized')) return;
            e.preventDefault();
            var sx = e.clientX;
            var sy = e.clientY;
            var ox = el.offsetLeft;
            var oy = el.offsetTop;

            function onMove(ev) {
                var nx = global.Win11Compat.clamp(ox + (ev.clientX - sx), 8, Math.max(8, global.innerWidth - el.offsetWidth - 8));
                var ny = global.Win11Compat.clamp(oy + (ev.clientY - sy), 8, Math.max(8, global.innerHeight - 96));
                el.style.left = nx + 'px';
                el.style.top = ny + 'px';
                el.style.right = 'auto';
            }
            function onUp() {
                global.removeEventListener('mousemove', onMove);
                global.removeEventListener('mouseup', onUp);
            }
            global.addEventListener('mousemove', onMove);
            global.addEventListener('mouseup', onUp);
        });

        // 2D Corner Resize Handle (Anchor opposite corner so dragging bottom-left in RTL / bottom-right in LTR expands outwards & down cleanly)
        var grip = el.querySelector('#hud-resize-handle');
        grip.addEventListener('mousedown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (el.classList.contains('is-maximized')) {
                el.classList.remove('is-maximized');
            }
            var isRtl = global.Win11I18N.isRtl();
            var rect = el.getBoundingClientRect();
            var clampedTop = Math.max(8, rect.top);
            el.style.top = clampedTop + 'px';
            el.style.bottom = 'auto';

            var maxW;
            if (isRtl) {
                // Grip is at bottom-left -> anchor top-right edge so dragging left expands leftwards
                var anchoredRight = Math.max(8, global.innerWidth - rect.right);
                el.style.right = anchoredRight + 'px';
                el.style.left = 'auto';
                maxW = Math.max(320, rect.right - 8);
            } else {
                // Grip is at bottom-right -> anchor top-left edge so dragging right expands rightwards
                var anchoredLeft = Math.max(8, rect.left);
                el.style.left = anchoredLeft + 'px';
                el.style.right = 'auto';
                maxW = Math.max(320, global.innerWidth - anchoredLeft - 8);
            }
            var maxH = Math.max(240, global.innerHeight - clampedTop - 56);

            var sx = e.clientX;
            var sy = e.clientY;
            var sw = rect.width;
            var sh = rect.height;

            function onMove(ev) {
                var dx = ev.clientX - sx;
                var dy = ev.clientY - sy;
                var nw = global.Win11Compat.clamp(sw + (isRtl ? -dx : dx), 320, maxW);
                var nh = global.Win11Compat.clamp(sh + dy, 240, maxH);
                el.style.width = nw + 'px';
                el.style.height = nh + 'px';
            }
            function onUp() {
                global.removeEventListener('mousemove', onMove);
                global.removeEventListener('mouseup', onUp);
            }
            global.addEventListener('mousemove', onMove);
            global.addEventListener('mouseup', onUp);
        });
    }

    function updateLiveStatsOnly() {
        var el = getEl();
        if (!el || !el.classList.contains('is-open')) return;
        var allTasks = global.Win11Assessment.getTasks();
        var tasks = allTasks.filter(function (item) { return item.enabled !== false; });
        if (tasks.length === 0) tasks = allTasks;
        var activeIdx = (typeof global.Win11Assessment.getActiveTaskIndex === 'function') ? global.Win11Assessment.getActiveTaskIndex() : 0;
        var scores = global.Win11Assessment.getScores();
        var nextSig = buildHudStateSig(tasks, activeIdx, currentTaskIdx, scores);
        if (activeIdx !== lastRenderedActiveIdx || nextSig !== lastRenderedStepSig) {
            scheduleRender();
            return;
        }
        var sPill = el.querySelector('#hud-score-pill');
        var tPill = el.querySelector('#hud-time-pill');
        if (sPill && tPill) {
            var stu = global.Win11Assessment.getStudent();
            var cfg = global.Win11Assessment.getConfig();
            var limitSuffix = '';
            if (cfg.exam_time_limit_min && Number(cfg.exam_time_limit_min) > 0) {
                var remSec = Math.max(0, (Number(cfg.exam_time_limit_min) * 60) - stu.elapsedSeconds);
                limitSuffix = ' / ' + global.Win11Assessment.formatDuration(remSec);
            }
            sPill.innerHTML = '<bdi dir="ltr">' + scores.net.toFixed(2) + ' / 20</bdi>';
            tPill.innerHTML = '<bdi dir="ltr">' + global.Win11Assessment.formatDuration(stu.elapsedSeconds) + limitSuffix + '</bdi>';
        }
    }

    function initOnce() {
        if (hudInitialized) return;
        hudInitialized = true;
        global.Win11Assessment.onUpdate(function () {
            if (!isOpen()) return;
            updateLiveStatsOnly();
        });
        global.Win11State.on('*', function () {
            if (isOpen()) scheduleRender();
        });
        global.Win11I18N.onChange(function () {
            if (isOpen()) scheduleRender();
        });
    }

    function open() {
        initOnce();
        renderContent();
        var el = getEl();
        if (el) el.classList.add('is-open');
    }

    function toggle() {
        if (isOpen()) {
            getEl().classList.remove('is-open');
        } else {
            open();
        }
    }

    global.Win11HUD = { open: open, toggle: toggle, isOpen: isOpen, refresh: renderContent, toggleMaximize: toggleMaximize };
})(window);
