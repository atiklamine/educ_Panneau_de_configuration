/**
 * Windows 11 Simulator - Pedagogical Assessment & Quiz Engine (v2.0)
 * Handles:
 *  - Visual dimming & blur separation (Evaluation Mode vs Simulation Mode)
 *  - Randomized question & distractor selection from Question Bank
 *  - Shuffled options (Anti-gaming)
 *  - Decreasing score penalty (Attempt 1 = 100%, Attempt 2 = 50%, Attempt 3+ = 0%)
 *  - Scaffolding intelligent hints on wrong answers without revealing the answer
 *  - Blocking progression until the correct answer is selected
 */
(function (global) {
    'use strict';

    var activeQuizSession = null;

    /**
     * Fisher-Yates array shuffle.
     */
    function shuffleArray(arr) {
        var copy = arr.slice();
        for (var i = copy.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy;
    }

    /**
     * Builds options list: 1 correct + 2 or 3 random distractors.
     */
    function prepareQuestionOptions(question, optionsCount) {
        var count = (optionsCount === 3) ? 3 : 4;
        var neededDistractors = count - 1;
        var pool = (Array.isArray(question.distractorsAr) && question.distractorsAr.length > 0)
            ? question.distractorsAr.slice()
            : [
                'خيار غير صحيح 1',
                'خيار غير صحيح 2',
                'خيار غير صحيح 3'
            ];

        // Filter out any disabled distractors if specified
        if (Array.isArray(question.disabledDistractors)) {
            pool = pool.filter(function (d) {
                return question.disabledDistractors.indexOf(d) === -1;
            });
        }

        var targetLen = (question.correctAnswerAr || '').length;
        // Prioritize distractors whose character count closely matches the correct answer (anti-length guessing)
        pool.sort(function (a, b) {
            var diffA = Math.abs((a || '').length - targetLen);
            var diffB = Math.abs((b || '').length - targetLen);
            return (diffA - diffB) + (Math.random() * 8 - 4);
        });
        var chosenDistractors = pool.slice(0, Math.min(neededDistractors, pool.length));

        var combined = [];
        combined.push({
            id: 'opt_correct',
            text: question.correctAnswerAr,
            isCorrect: true
        });

        for (var i = 0; i < chosenDistractors.length; i++) {
            combined.push({
                id: 'opt_distractor_' + i,
                text: chosenDistractors[i],
                isCorrect: false
            });
        }

        // Shuffle the combined options so correct answer is at a completely random position
        return shuffleArray(combined);
    }

    /**
     * Calculates earned points according to Decreasing Score Penalty:
     * - Attempt 1: 100%
     * - Attempt 2: 50%
     * - Attempt 3+: 0%
     */
    function calculateEarnedPoints(attempts, maxPoints) {
        var maxP = Number(maxPoints) || 1.0;
        if (attempts <= 1) return maxP;
        if (attempts === 2) return Number((maxP * 0.5).toFixed(2));
        return 0;
    }

    /**
     * Gets or creates the DOM container for the Quiz Modal.
     */
    function getBackdropEl() {
        var el = document.getElementById('pedagogy-quiz-backdrop');
        if (!el) {
            el = document.createElement('div');
            el.id = 'pedagogy-quiz-backdrop';
            el.className = 'pedagogy-quiz-backdrop';
            el.setAttribute('dir', 'rtl');
            document.body.appendChild(el);
        }
        return el;
    }

    /**
     * Removes the Quiz Modal from the DOM.
     */
    function removeBackdrop() {
        var el = document.getElementById('pedagogy-quiz-backdrop');
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
        activeQuizSession = null;
    }

    /**
     * Presents a quiz modal for a completed task.
     * @param {number} taskId 
     * @param {Object} opts { taskTitle, maxPoints, optionsCount }
     * @param {Function} onResolved Callback when correctly answered
     */
    function presentQuizForTask(taskId, opts, onResolved) {
        opts = opts || {};
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var esc = global.Win11Compat ? global.Win11Compat.escapeHtml : function (s) { return s; };

        // Check if teacher has disabled quizzes
        var cfg = (global.Win11Assessment && typeof global.Win11Assessment.getConfig === 'function')
            ? global.Win11Assessment.getConfig()
            : {};
        if (cfg.quiz_enabled === false) {
            if (typeof onResolved === 'function') onResolved(null);
            return;
        }

        var bank = global.Win11QuizBank;
        if (!bank) {
            if (typeof onResolved === 'function') onResolved(null);
            return;
        }

        var questions = bank.getQuestionsForTask(taskId);
        if (!questions || questions.length === 0) {
            if (typeof onResolved === 'function') onResolved(null);
            return;
        }

        // Pick 1 question at random
        var qIdx = Math.floor(Math.random() * questions.length);
        var question = questions[qIdx];
        var maxPoints = (typeof opts.maxPoints === 'number' && opts.maxPoints > 0) ? opts.maxPoints : 1.0;
        var optionsCount = (opts.optionsCount === 3) ? 3 : 4;
        var options = prepareQuestionOptions(question, optionsCount);

        var session = {
            taskId: taskId,
            taskTitle: opts.taskTitle || ('المهمة ' + taskId),
            question: question,
            options: options,
            maxPoints: maxPoints,
            attempts: 0,
            selectedOptionIndex: -1,
            eliminatedIndexes: [],
            isResolved: false,
            onResolved: onResolved
        };

        activeQuizSession = session;
        renderQuizModal(session);
    }

    /**
     * Renders the Quiz Modal with Part 5 visual separation & Part 6 scaffolding hints.
     */
    function renderQuizModal(session) {
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var esc = global.Win11Compat ? global.Win11Compat.escapeHtml : function (s) { return s; };
        var backdrop = getBackdropEl();

        var q = session.question;
        var opts = session.options;
        var attempts = session.attempts;
        var isResolved = session.isResolved;

        // Attempt indicator badge
        var attemptBadgeText = '';
        var attemptBadgeClass = '';
        if (isResolved) {
            if (attempts <= 1) {
                attemptBadgeText = 'تم الاجتياز من المحاولة الأولى: كامل العلامة (100%)';
                attemptBadgeClass = 'quiz-badge-full';
            } else if (attempts === 2) {
                attemptBadgeText = 'تم الاجتياز من المحاولة الثانية: نصف العلامة (50%)';
                attemptBadgeClass = 'quiz-badge-half';
            } else {
                attemptBadgeText = 'تم استيفاء شرط التقويم: 0.00 نقطة (محاولة للتعلم)';
                attemptBadgeClass = 'quiz-badge-zero';
            }
        } else {
            if (attempts === 0) {
                attemptBadgeText = 'المحاولة الأولى: كامل العلامة (100%)';
                attemptBadgeClass = 'quiz-badge-full';
            } else if (attempts === 1) {
                attemptBadgeText = 'المحاولة الثانية: نصف العلامة (50%)';
                attemptBadgeClass = 'quiz-badge-half';
            } else {
                attemptBadgeText = 'المحاولة ' + (attempts + 1) + ': 0 نقطة (محاولة للتعلم والاستيعاب)';
                attemptBadgeClass = 'quiz-badge-zero';
            }
        }

        var optionsHtml = '';
        for (var i = 0; i < opts.length; i++) {
            var opt = opts[i];
            var isEliminated = session.eliminatedIndexes.indexOf(i) !== -1;
            var isSelected = (session.selectedOptionIndex === i);
            var isCorrectReveal = isResolved && opt.isCorrect;

            var cardCls = 'quiz-option-card';
            if (isEliminated) cardCls += ' is-eliminated';
            if (isSelected) cardCls += ' is-selected';
            if (isCorrectReveal) cardCls += ' is-correct';

            var disabledAttr = (isEliminated || isResolved) ? 'disabled' : '';

            optionsHtml +=
                '<label class="' + cardCls + '" data-opt-idx="' + i + '">' +
                    '<input type="radio" name="quiz-radio-opt" value="' + i + '" ' + (isSelected ? 'checked' : '') + ' ' + disabledAttr + ' style="margin-top:2px;cursor:pointer;">' +
                    '<div class="quiz-option-text">' +
                        bidi(opt.text) +
                    '</div>' +
                '</label>';
        }

        // Pedagogical Scaffolding Hint (appears only after a wrong attempt)
        var hintBoxHtml = '';
        if (session.eliminatedIndexes.length > 0 && !isResolved) {
            hintBoxHtml =
                '<div class="quiz-hint-box" style="margin-top:12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;color:#1E3A8A;display:flex;align-items:flex-start;gap:10px;animation:quizFadeIn 0.3s ease;">' +
                    '<span style="color:#D97706;flex-shrink:0;display:inline-flex;">' + (global.Win11Icons ? global.Win11Icons.get('bulb', 22) : '') + '</span>' +
                    '<div style="font-size:12.5px;line-height:1.6;">' +
                        '<strong>' + bidi('تلميح للمساعدة:') + '</strong> ' +
                        bidi(q.hintAr) +
                    '</div>' +
                '</div>';
        }

        // Success Box when resolved
        var successBoxHtml = '';
        if (isResolved) {
            var earnedP = calculateEarnedPoints(session.attempts, session.maxPoints);
            successBoxHtml =
                '<div class="quiz-success-box" style="margin-top:12px;background:#ECFDF5;border:1.5px solid #107C41;border-radius:8px;padding:12px 16px;color:#065F46;display:flex;align-items:center;gap:10px;animation:quizBounceIn 0.3s ease;">' +
                    '<span style="color:#107C41;flex-shrink:0;display:inline-flex;">' + (global.Win11Icons ? global.Win11Icons.get('check', 24) : '✓') + '</span>' +
                    '<div style="font-size:13px;line-height:1.5;">' +
                        '<strong>' + bidi('إجابة صحيحة وممتازة!') + '</strong> ' +
                        bidi('النقاط المكتسبة: ') + '<bdi dir="ltr"><strong>' + earnedP.toFixed(2) + ' / ' + Number(session.maxPoints).toFixed(2) + '</strong></bdi>' +
                        ' &bull; ' + bidi('عدد المحاولات: ') + '<bdi dir="ltr">' + session.attempts + '</bdi>' +
                    '</div>' +
                '</div>';
        }

        var btnText = isResolved
            ? ('<span>' + bidi('مواصلة المحاكاة') + '</span>' + (global.Win11Icons ? ' ' + global.Win11Icons.get('arrowForward', 14) : ''))
            : bidi('تأكيد الإجابة');
        var btnCls = isResolved ? 'win-btn win-btn-accent' : 'win-btn win-btn-primary';

        backdrop.innerHTML =
            '<div class="pedagogy-quiz-modal" id="pedagogy-quiz-modal">' +
                // Header
                '<div class="quiz-modal-header">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<div class="quiz-header-icon">' +
                            global.Win11Icons.get('graduation', 20) +
                        '</div>' +
                        '<div>' +
                            '<div style="font-size:11px;font-weight:700;color:var(--win-accent);letter-spacing:0.5px;">' +
                                bidi('وضع التقويم والأسئلة — كفاءات لوحة التحكم (1AS)') +
                            '</div>' +
                            '<div style="font-size:14px;font-weight:800;color:#0F172A;">' +
                                bidi('تقويم مرحلي: ') + bidi(session.taskTitle) +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="quiz-attempt-badge ' + attemptBadgeClass + '">' +
                        bidi(attemptBadgeText) +
                    '</div>' +
                '</div>' +

                // Body
                '<div class="quiz-modal-body">' +
                    '<div class="quiz-question-box">' +
                        '<div class="quiz-q-num">' + bidi('سؤال تقويم الكفاءة:') + '</div>' +
                        '<div class="quiz-question-text">' +
                            bidi(q.questionAr) +
                        '</div>' +
                    '</div>' +

                    '<div class="quiz-options-list">' +
                        optionsHtml +
                    '</div>' +

                    hintBoxHtml +
                    successBoxHtml +
                '</div>' +

                // Footer
                '<div class="quiz-modal-footer">' +
                    '<div style="font-size:11.5px;color:#64748B;">' +
                        (isResolved
                            ? bidi('تم استيفاء شرط التقويم بنجاح. يمكنك الآن مواصلة المهام التطبيقية.')
                            : bidi('يشترط الإجابة الصحيحة أو اختيار التخطي لمتابعة مسار المحاكاة.')) +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                        (!isResolved
                            ? ('<button type="button" class="win-btn win-btn-secondary" id="quiz-btn-skip-current" style="padding:6px 14px;font-size:12px;font-weight:600;color:#92400E;background:#FEF3C7;border:1px solid #FCD34D;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">' +
                                  (global.Win11Icons ? global.Win11Icons.get('skip', 12) : '>>') +
                                  ' <span>' + bidi('تخطي هذا السؤال') + '</span>' +
                              '</button>' +
                              '<button type="button" class="win-btn win-btn-secondary" id="quiz-btn-skip-all" style="padding:6px 14px;font-size:12px;font-weight:600;color:#B91C1C;background:#FEE2E2;border:1px solid #FCA5A5;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">' +
                                  '<span>' + bidi('تخطي كل الأسئلة') + '</span>' +
                              '</button>')
                            : '') +
                        '<button type="button" class="' + btnCls + '" id="quiz-btn-confirm" style="padding:6px 20px;font-weight:700;font-size:13px;">' +
                            btnText +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        wireQuizEvents(backdrop, session);
    }

    /**
     * Wires click and radio selection events inside the Quiz Modal.
     */
    function wireQuizEvents(backdrop, session) {
        var cards = backdrop.querySelectorAll('.quiz-option-card:not(.is-eliminated)');
        for (var c = 0; c < cards.length; c++) {
            cards[c].onclick = function () {
                if (session.isResolved) return;
                var idx = Number(this.getAttribute('data-opt-idx'));
                if (session.eliminatedIndexes.indexOf(idx) !== -1) return;

                session.selectedOptionIndex = idx;
                var allCards = backdrop.querySelectorAll('.quiz-option-card');
                for (var j = 0; j < allCards.length; j++) {
                    allCards[j].classList.remove('is-selected');
                    var radio = allCards[j].querySelector('input[type="radio"]');
                    if (radio) radio.checked = false;
                }
                this.classList.add('is-selected');
                var curRadio = this.querySelector('input[type="radio"]');
                if (curRadio) curRadio.checked = true;
            };
        }

        var skipCurBtn = backdrop.querySelector('#quiz-btn-skip-current');
        if (skipCurBtn) {
            skipCurBtn.onclick = function () {
                var executeSkipCurrent = function () {
                    var resData = {
                        taskId: session.taskId,
                        questionId: session.question ? session.question.id : ('q_' + session.taskId),
                        questionTitle: session.question ? session.question.titleAr : ('سؤال المهمة ' + session.taskId),
                        questionText: session.question ? session.question.questionAr : '',
                        attempts: Math.max(1, session.attempts || 1),
                        earnedPoints: 0.0,
                        maxPoints: session.maxPoints || 1.0,
                        answeredCorrectly: false,
                        skipped: true,
                        skippedAll: false
                    };
                    activeQuizSession = null;
                    removeBackdrop();
                    if (typeof session.onResolved === 'function') {
                        session.onResolved(resData);
                    }
                };

                if (global.Win11Dialogs && typeof global.Win11Dialogs.showConfirm === 'function') {
                    global.Win11Dialogs.showConfirm(
                        'تأكيد تخطي السؤال الحالي',
                        'هل أنت متأكد من رغبتك في تخطي هذا السؤال؟ سيتم تصفير علامته (0.00 من 1.00 نقطة) ومتابعة المحاكاة مباشرة.',
                        function (confirmed) {
                            if (confirmed) executeSkipCurrent();
                        },
                        'warning'
                    );
                } else {
                    if (confirm('هل أنت متأكد من رغبتك في تخطي هذا السؤال؟')) executeSkipCurrent();
                }
            };
        }

        var skipAllBtn = backdrop.querySelector('#quiz-btn-skip-all');
        if (skipAllBtn) {
            skipAllBtn.onclick = function () {
                var executeSkipAll = function () {
                    var resData = {
                        taskId: session.taskId,
                        questionId: session.question ? session.question.id : ('q_' + session.taskId),
                        questionTitle: session.question ? session.question.titleAr : ('سؤال المهمة ' + session.taskId),
                        questionText: session.question ? session.question.questionAr : '',
                        attempts: Math.max(1, session.attempts || 1),
                        earnedPoints: 0.0,
                        maxPoints: session.maxPoints || 1.0,
                        answeredCorrectly: false,
                        skipped: true,
                        skippedAll: true
                    };
                    if (global.Win11Assessment) {
                        var stu = global.Win11Assessment.getStudent();
                        if (stu) {
                            stu.quizSkippedAll = true;
                        }
                    }
                    activeQuizSession = null;
                    removeBackdrop();
                    if (typeof session.onResolved === 'function') {
                        session.onResolved(resData);
                    }
                };

                if (global.Win11Dialogs && typeof global.Win11Dialogs.showConfirm === 'function') {
                    global.Win11Dialogs.showConfirm(
                        'تأكيد تخطي كافة الأسئلة',
                        'هل أنت متأكد من رغبتك في تخطي كافة الأسئلة التقويمية المتبقية؟ سيتم تصفير علامات الأسئلة وتخطيها تلقائياً لمواصلة الجانب التطبيقي فقط.',
                        function (confirmed) {
                            if (confirmed) executeSkipAll();
                        },
                        'warning'
                    );
                } else {
                    if (confirm('هل أنت متأكد من رغبتك في تخطي كافة الأسئلة؟')) executeSkipAll();
                }
            };
        }

        var confirmBtn = backdrop.querySelector('#quiz-btn-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = function () {
                if (session.isResolved) {
                    // Quiz was already answered correctly, now proceed
                    var earnedPoints = calculateEarnedPoints(session.attempts, session.maxPoints);
                    var resData = {
                        taskId: session.taskId,
                        questionId: session.question.id,
                        questionTitle: session.question.titleAr,
                        questionText: session.question.questionAr,
                        attempts: session.attempts,
                        earnedPoints: earnedPoints,
                        maxPoints: session.maxPoints,
                        answeredCorrectly: true
                    };

                    removeBackdrop();

                    if (typeof session.onResolved === 'function') {
                        session.onResolved(resData);
                    }
                    return;
                }

                if (session.selectedOptionIndex === -1) {
                    if (global.Win11Dialogs && typeof global.Win11Dialogs.showMessage === 'function') {
                        global.Win11Dialogs.showMessage(
                            'تنبيه',
                            'يرجى تحديد أحد الخيارات قبل النقر على تأكيد الإجابة.',
                            'warning'
                        );
                    }
                    return;
                }

                var selectedOpt = session.options[session.selectedOptionIndex];
                session.attempts += 1;

                if (selectedOpt.isCorrect) {
                    // Correct! Mark resolved
                    session.isResolved = true;
                    renderQuizModal(session);
                } else {
                    // Incorrect! Eliminate this option, trigger hint
                    if (session.eliminatedIndexes.indexOf(session.selectedOptionIndex) === -1) {
                        session.eliminatedIndexes.push(session.selectedOptionIndex);
                    }
                    session.selectedOptionIndex = -1;
                    renderQuizModal(session);

                    // Shake animation on wrong answer
                    var modalEl = document.getElementById('pedagogy-quiz-modal');
                    if (modalEl) {
                        modalEl.classList.remove('quiz-shake');
                        void modalEl.offsetWidth; // trigger reflow
                        modalEl.classList.add('quiz-shake');
                    }
                }
            };
        }
    }

    global.Win11Quiz = {
        presentQuizForTask: presentQuizForTask,
        calculateEarnedPoints: calculateEarnedPoints,
        isQuizActive: function () { return !!activeQuizSession; }
    };

})(window);
