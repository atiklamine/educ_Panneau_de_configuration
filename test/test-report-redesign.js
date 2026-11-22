/**
 * Test Suite: Report Redesign — Transparent Scoring, 3-Section Structure & Clear Breakdown
 */
const assert = require('assert');

// Mock browser environment
global.window = global;
global.document = {
    createElement: function (tag) {
        return {
            tagName: tag,
            setAttribute: function () {},
            appendChild: function () {},
            classList: { add: function () {}, remove: function () {} },
            style: {}
        };
    },
    body: {
        appendChild: function () {},
        removeChild: function () {}
    },
    getElementById: function () { return null; },
    title: 'Win11 Test'
};

require('../js/compat/compat.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../js/core/state.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');
require('../js/pedagogy/assessment.js');
require('../js/pedagogy/report.js');

console.log('--- TEST 1: SETUP STUDENT & SIMULATE TASKS WITH 3 QUIZZES ---');

// Register student
global.Win11Assessment.startSession({
    lastName: 'بوزيان',
    firstName: 'إكرام',
    classGroup: '1AS_ST_G1',
    pcNumber: '04',
    mode: 'training',
    quizOptIn: true
});

const student = global.Win11Assessment.getStudent();
assert.strictEqual(student.lastName, 'بوزيان');
assert.strictEqual(student.firstName, 'إكرام');
assert.strictEqual(student.pcNumber, '04');

// Simulate completing Task 1, 2, 3 with different quiz attempts:
// Task 1: Answered on 1st attempt (100% = 1.00 pt)
// Task 2: Answered on 2nd attempt (50% = 0.50 pt)
// Task 3: Answered on 3rd attempt (0% = 0.00 pt)
const tasks = global.Win11Assessment.getTasks();

// Task 1
tasks[0].completed = true;
tasks[0].earnedPoints = tasks[0].maxPoints; // e.g. 1.0
tasks[0].quizCompleted = true;
tasks[0].quizResult = {
    taskId: 1,
    questionId: 101,
    questionTitle: 'سؤال لغة واجهة Windows',
    questionText: 'ما هي النتيجة المباشرة لتغيير لغة عرض واجهة Windows؟',
    attempts: 1,
    earnedPoints: 1.0,
    maxPoints: 1.0,
    answeredCorrectly: true
};

// Task 2
tasks[1].completed = true;
tasks[1].earnedPoints = tasks[1].maxPoints; // e.g. 2.0
tasks[1].quizCompleted = true;
tasks[1].quizResult = {
    taskId: 2,
    questionId: 201,
    questionTitle: 'سؤال سرعة النقر المزدوج',
    questionText: 'ما هي وظيفة ضبط سرعة النقر المزدوج للفأرة؟',
    attempts: 2,
    earnedPoints: 0.5,
    maxPoints: 1.0,
    answeredCorrectly: true
};

// Task 3
tasks[2].completed = true;
tasks[2].earnedPoints = tasks[2].maxPoints; // e.g. 3.0
tasks[2].quizCompleted = true;
tasks[2].quizResult = {
    taskId: 3,
    questionId: 301,
    questionTitle: 'سؤال المنطقة الزمنية',
    questionText: 'لماذا يعتبر الضبط الدقيق لتوقيت الحاسوب والمنطقة الزمنية أمراً حاسماً؟',
    attempts: 3,
    earnedPoints: 0.0,
    maxPoints: 1.0,
    answeredCorrectly: true
};

// Complete tasks 4, 5, 6 with 1st attempt quiz
for (let i = 3; i < tasks.length; i++) {
    tasks[i].completed = true;
    tasks[i].earnedPoints = tasks[i].maxPoints;
    tasks[i].quizCompleted = true;
    tasks[i].quizResult = {
        taskId: tasks[i].id,
        questionId: 400 + i,
        questionTitle: 'سؤال كفاءة ' + tasks[i].id,
        questionText: 'نص السؤال التقويمي للمهمة ' + tasks[i].id,
        attempts: 1,
        earnedPoints: 1.0,
        maxPoints: 1.0,
        answeredCorrectly: true
    };
}

// Add a mistake penalty of 0.25
global.Win11Assessment.recordMistake(
    'تعديل خارج نطاق المهمة النشطة',
    'قام التلميذ بتعديل لغة العرض أثناء إنجاز مهمة أخرى',
    0.25,
    tasks[0].titleAr
);

// Evaluate
global.Win11Assessment.evaluate();
const scores = global.Win11Assessment.getScores();
console.log('Evaluated Scores:', {
    totalWeight: scores.totalWeight,
    practicalEarned: scores.practicalEarned,
    totalQuizMax: scores.totalQuizMax,
    totalQuizEarned: scores.totalQuizEarned,
    grandTotalMax: scores.grandTotalMax,
    grandTotalEarned: scores.grandTotalEarned,
    baseScore: scores.baseScore,
    penalties: scores.penalties,
    finalScore: scores.finalScore
});

// Generate Report HTML
const reportHtml = global.Win11Report.buildA4Html();
assert(reportHtml && reportHtml.length > 500, 'Report HTML must not be empty');

console.log('--- TEST 2: VERIFY SECTION A (HEADER & STUDENT INFO) ---');
assert(reportHtml.includes('القسم (أ): بيانات التلميذ والجلسة التقويمية'), 'Must contain Section A title');
assert(reportHtml.includes('بوزيان إكرام'), 'Must contain student full name');
assert(reportHtml.includes('1AS_ST_G1'), 'Must contain class group');
assert(reportHtml.includes('#04'), 'Must contain PC number');
assert(reportHtml.includes('الأستاذ حاج عيسى'), 'Must contain teacher name from inf.dll');
assert(reportHtml.includes('ثانوية الشهيد أحمد رضا حوحو'), 'Must contain institution name from inf.dll');
assert(reportHtml.includes('نشاط تطبيقي تدريبي'), 'Must contain simulation mode');
console.log('[PASS] Section A headers and student metadata verified.');

console.log('--- TEST 3: VERIFY SECTION B (DETAILED BREAKDOWN TABLE) ---');
assert(reportHtml.includes('القسم (ب): جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية'), 'Must contain Section B title');

// Check 9 column headers
assert(reportHtml.includes('المهمة التطبيقية أو السؤال التقويمي'), 'Column 2 header');
assert(reportHtml.includes('النوع'), 'Column 3 header');
assert(reportHtml.includes('الحالة'), 'Column 4 header');
assert(reportHtml.includes('المحاولات'), 'Column 5 header');
assert(reportHtml.includes('المعامل الأقصى'), 'Column 6 header');
assert(reportHtml.includes('الممنوحة'), 'Column 7 header');
assert(reportHtml.includes('الخصم'), 'Column 8 header');
assert(reportHtml.includes('الملاحظات وتفاصيل الإنجاز'), 'Column 9 header');

// Check badges
assert(reportHtml.includes('مهمة عملية'), 'Type badge: مهمة عملية');
assert(reportHtml.includes('سؤال تقويمي'), 'Type badge: سؤال تقويمي');

// Check Quiz 1: 1st attempt, 100% points, 0.00 deduction
assert(reportHtml.includes('محاولة') && reportHtml.includes('>1<'), 'Quiz 1 attempt');
assert(reportHtml.includes('1.00') && reportHtml.includes('100%'), 'Quiz 1 earned points 100%');
assert(reportHtml.includes('إجابة صحيحة من المحاولة الأولى') && reportHtml.includes('100'), 'Quiz 1 notes');

// Check Quiz 2: 2nd attempt, 50% points, -0.50 deduction
assert(reportHtml.includes('محاولة') && reportHtml.includes('>2<'), 'Quiz 2 attempt');
assert(reportHtml.includes('0.50') && reportHtml.includes('50'), 'Quiz 2 earned points 50%');
assert(reportHtml.includes('-0.50'), 'Quiz 2 deduction');
assert(reportHtml.includes('إجابة صحيحة من المحاولة الثانية') && reportHtml.includes('50'), 'Quiz 2 notes');

// Check Quiz 3: 3rd attempt, 0% points, -1.00 deduction
assert(reportHtml.includes('محاولة') && reportHtml.includes('>3<'), 'Quiz 3 attempt');
assert(reportHtml.includes('0.00') && reportHtml.includes('0'), 'Quiz 3 earned points 0%');
assert(reportHtml.includes('-1.00'), 'Quiz 3 deduction');
assert(reportHtml.includes('استنفاد المحاولات') && reportHtml.includes('التلميح'), 'Quiz 3 notes');

// Check General Penalties row for 0.25
assert(reportHtml.includes('خصومات عامة (مخالفة تسلسل المهام النشطة)'), 'Penalties row title');
assert(reportHtml.includes('-0.25'), 'Penalties row deduction');
console.log('[PASS] Section B table, 9 columns, quiz rows, attempts, points and deductions verified.');

console.log('--- TEST 4: VERIFY SECTION C (MATH BREAKDOWN & RULE OF THREE) ---');
assert(reportHtml.includes('القسم (ج): التفكيك الحسابي للعلامة (كيف تم احتساب المعدل خطوة بخطوة)'), 'Must contain Section C title');
assert(reportHtml.includes('مجموع معاملات المهام العملية:'), 'Step 1 label');
assert(reportHtml.includes('مجموع معاملات الأسئلة:'), 'Step 2 label');
assert(reportHtml.includes('مجموع النقاط التي حصلت عليها (معاملات):'), 'Step 3 label');
assert(reportHtml.includes('العلامة قبل الخصم') && reportHtml.includes('20'), 'Step 4 label');
assert(reportHtml.includes('القاعدة الثلاثية:'), 'Step 4 Rule of Three mention');
assert(reportHtml.includes('مجموع الخصومات:'), 'Step 5 label');
assert(!reportHtml.includes('a4-final-score-card'), 'Must not duplicate score card at bottom');
assert(reportHtml.includes('a4-top-summary-card'), 'Must display primary score card at top');
assert(reportHtml.includes(scores.finalScore.toFixed(2)), 'Must display exact final score');
console.log('[PASS] Section C step-by-step math breakdown verified.');

console.log('--- TEST 5: VERIFY ZERO HTML ESCAPING BUGS (NO RAW TAGS VISIBLE) ---');
assert(!reportHtml.includes('&lt;div'), 'Must not contain escaped &lt;div');
assert(!reportHtml.includes('&lt;bdi'), 'Must not contain escaped &lt;bdi');
assert(!reportHtml.includes('&lt;strong'), 'Must not contain escaped &lt;strong');
assert(!reportHtml.includes('&lt;span'), 'Must not contain escaped &lt;span');
console.log('[PASS] Clean HTML confirmed with zero escaped tags in table/prose.');

console.log('--- TEST 6: VERIFY SECTION 3 (TEACHER DISABLED QUIZZES) ---');
// Case A: Teacher disables quizzes in config (with show_no_quiz_note: true)
const cfg = global.Win11Assessment.getConfig();
cfg.quiz_enabled = false;
cfg.show_no_quiz_note = true;
global.Win11Assessment.evaluate();
const reportDisabledHtml = global.Win11Report.buildA4Html();

// When teacher disabled quizzes:
// Section B must NOT show any quiz rows ("سؤال تقويمي")
assert(!reportDisabledHtml.includes('a4-type-badge is-quiz'), 'Section B must not show quiz rows when teacher disabled');
// Section C must show the dedicated teacher note:
assert(
    reportDisabledHtml.includes('ملاحظة:') &&
    reportDisabledHtml.includes('تقييم بدون أسئلة') &&
    reportDisabledHtml.includes('العلامة القصوى الممكنة هي'),
    'Section C must show dedicated disabled notice with max possible score'
);
console.log('[PASS] Teacher disabled quizzes with note: Quizzes omitted from Section B, note displayed in Section C.');

// Case A.2: Teacher disables note display (show_no_quiz_note: false)
cfg.show_no_quiz_note = false;
const reportNoNoteHtml = global.Win11Report.buildA4Html();
assert(!reportNoNoteHtml.includes('a4-quiz-disabled-notice'), 'Section C must NOT show notice when show_no_quiz_note is false');
console.log('[PASS] Teacher disabled note: Note correctly omitted from Section C.');

console.log('--- TEST 7: VERIFY SECTION 3 (STUDENT OPTED OUT OF QUIZZES) ---');
// Case B: Student opted out of quizzes (quiz_enabled is true, but quizOptIn is false)
cfg.quiz_enabled = true;
cfg.show_no_quiz_note = true;
const stu = global.Win11Assessment.getStudent();
stu.quizOptIn = false;
const optOutScores = global.Win11Assessment.evaluate();
const reportOptOutHtml = global.Win11Report.buildA4Html(optOutScores);

// Section B MUST show quiz rows because points were zeroed/deducted!
assert(reportOptOutHtml.includes('a4-type-badge is-quiz'), 'Section B must show quiz rows when student opted out');
assert(reportOptOutHtml.includes('معطّل ✘'), 'Section B must show opted-out badge');
assert(reportOptOutHtml.includes('تم إلغاء تفعيل الأسئلة بطلب من التلميذ'), 'Section B notes must explain student opted out');
assert(reportOptOutHtml.includes('معطّل'), 'Section B must show opted out status');
assert(reportOptOutHtml.includes('0.00') && reportOptOutHtml.includes('(0%)'), 'Section B must show 0.00 earned');
assert(reportOptOutHtml.includes('-1.00'), 'Section B must show deduction for opted out quiz');
// Section C must show pedagogical warning alert:
assert(reportOptOutHtml.includes('تنبيه بيداغوجي:'), 'Section C must show warning alert when student opted out');
assert(reportOptOutHtml.includes('تم تصفير نقاط الأسئلة وخصمها بالكامل'), 'Section C must explain zeroing and deduction');

// Restore clean state
stu.quizOptIn = true;
global.Win11Assessment.evaluate();
console.log('[PASS] Student opted out: Section B shows zeroed/deducted rows, Section C displays pedagogical warning.');

console.log('\n=========================================');
console.log('ALL REPORT REDESIGN TESTS PASSED 100%!');
console.log('=========================================');
process.exit(0);
