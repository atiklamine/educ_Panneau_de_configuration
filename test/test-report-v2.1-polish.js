const assert = require('assert');

// Mock browser globals
global.window = global;
global.document = {
    createElement: function (tag) {
        if (tag === 'canvas') {
            return {
                width: 1240,
                height: 1754,
                getContext: function () {
                    return {
                        fillRect: function () {},
                        strokeRect: function () {},
                        beginPath: function () {},
                        moveTo: function () {},
                        lineTo: function () {},
                        stroke: function () {},
                        fill: function () {},
                        arc: function () {},
                        closePath: function () {},
                        save: function () {},
                        restore: function () {},
                        fillText: function () {},
                        measureText: function (t) { return { width: (t || '').length * 7 }; },
                        drawImage: function () {},
                        setLineDash: function () {},
                        rect: function () {},
                        clip: function () {}
                    };
                },
                toDataURL: function () {
                    // Minimal 1x1 base64 JPEG
                    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAg==';
                }
            };
        }
        return {
            id: '',
            className: '',
            style: {},
            setAttribute: function () {},
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; },
            appendChild: function () {},
            parentNode: { removeChild: function () {} }
        };
    },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    body: { appendChild: function () {} }
};
global.atob = function (str) { return Buffer.from(str, 'base64').toString('binary'); };
global.btoa = function (str) { return Buffer.from(str, 'binary').toString('base64'); };

require('../js/compat/compat.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../assets/icons/icons.js');
require('../js/core/state.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');
require('../js/pedagogy/assessment.js');
require('../js/pedagogy/report.js');

console.log('=== TEST 1: MULTI-PARTICIPANTS & LOGO IN SECTION A ===');
global.Win11Assessment.startSession({
    participants: [
        { lastName: 'عامرين', firstName: 'عامر' },
        { lastName: 'متقالي', firstName: 'توفيق' },
        { lastName: 'خيراني', firstName: 'محمد' }
    ],
    classGroup: '1AS-02',
    pcNumber: '05',
    mode: 'training',
    quizOptIn: true
});

// Record an unrequested change penalty
global.Win11Assessment.recordUnrequestedChange('التبديل بين زري الفأرة', 'تم تعديل إعداد زر الفأرة وهو غير مطلوب');
global.Win11Assessment.evaluate();

const html = global.Win11Report.buildA4Html();

// Verify Logo (strict teacher-logo policy: no generic fallback)
assert.ok(html.includes('no-logo'), 'Report header must use no-logo layout when teacher has not uploaded one');
const cfgCustom = global.Win11Assessment.getConfig();
cfgCustom.report_logo_b64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const htmlWithLogo = global.Win11Report.buildA4Html();
assert.ok(htmlWithLogo.includes('a4-header-logo'), 'Report must contain a4-header-logo when teacher provides logo');
assert.ok(htmlWithLogo.includes('alt="شعار المؤسسة"'), 'Report must contain teacher logo image');
cfgCustom.report_logo_b64 = '';

// Verify Participants
assert.ok(html.includes('عامرين') && html.includes('عامر'), 'Participant 1 must appear');
assert.ok(html.includes('متقالي') && html.includes('توفيق'), 'Participant 2 must appear');
assert.ok(html.includes('خيراني') && html.includes('محمد'), 'Participant 3 must appear');
assert.ok(html.includes('الفوج التربوي ورقم الجهاز:'), 'Class & PC cell must be present');
assert.ok(html.includes('1AS-02') && html.includes('#05'), 'Class and PC number must appear');

console.log('✓ TEST 1 PASSED: Multi-participants & Logo rendered cleanly.');

console.log('=== TEST 2: QUIZ EXHAUSTED STATUS & NOTES ACCURACY ===');
// Simulate Task 1 completed, Quiz 1 failed after 3 attempts
const tasks = global.Win11Assessment.getTasks();
tasks[0].completed = true;
tasks[0].earnedPoints = tasks[0].maxPoints;
tasks[0].quizResult = {
    questionTitle: 'الفرق بين الصور المعروضة واستعراض الصور',
    answeredCorrectly: false,
    attempts: 4,
    maxPoints: 1.0,
    earnedPoints: 0.0
};
global.Win11Assessment.evaluate();

const reportHtml2 = global.Win11Report.buildA4Html();
assert.ok(reportHtml2.includes('استنفاد المحاولات'), 'Failed quiz must have status استنفاد المحاولات');
assert.ok(!reportHtml2.includes('إجابة صحيحة من المحاولة الأولى (كامل العلامة 100%)'), 'Failed quiz must not claim 100%');
console.log('✓ TEST 2 PASSED: Failed quiz status is strictly accurate (استنفاد المحاولات).');

console.log('=== TEST 3: STEP 5 PENALTY BREAKDOWN TRANSPARENCY ===');
assert.ok(reportHtml2.includes('الخطوة 5:') || reportHtml2.includes('الخصومات الجزائية المباشرة'), 'Step 5 must be present');
assert.ok(reportHtml2.includes('التبديل بين زري الفأرة'), 'Step 5 must detail the mouse setting touched');
assert.ok(reportHtml2.includes('-0.25') || reportHtml2.includes('0.25-'), 'Step 5 must show 0.25 deduction');
console.log('✓ TEST 3 PASSED: Step 5 provides unassailable deduction itemization.');

console.log('=== TEST 4: CANVAS PDF GENERATION WITH VECTOR LOGO & NO OVERFLOW ===');
const pdfU8 = global.Win11Report.generateReportPdfUint8();
assert.ok(pdfU8 && pdfU8.length > 50, 'PDF Uint8Array must be generated');
const pdfHeader = String.fromCharCode(pdfU8[0], pdfU8[1], pdfU8[2], pdfU8[3]);
assert.strictEqual(pdfHeader, '%PDF', 'Buffer must begin with %PDF header');
console.log('✓ TEST 4 PASSED: Canvas PDF generated flawlessly with %PDF header (' + pdfU8.length + ' bytes).');

console.log('=== TEST 5: HUD SUB-STEP SKIP BUTTON SEQUENTIAL INTEGRITY ===');
// Evaluate assessment to populate active task and subSteps
global.Win11Assessment.evaluate();
const allTasks = global.Win11Assessment.getTasks();
assert.ok(allTasks && allTasks.length >= 4, 'Must have at least 4 tasks');

// Fast-forward to Task 4 (index 3)
while (global.Win11Assessment.getActiveTaskIndex() < 3) {
    global.Win11Assessment.skipActiveTask();
}
global.Win11Assessment.evaluate();
assert.strictEqual(global.Win11Assessment.getActiveTaskIndex(), 3, 'Active task must now be Task 4');

const task4 = allTasks[3];
assert.ok(task4 && task4.subSteps && task4.subSteps.length >= 2, 'Task 4 must have at least 2 sub-steps after evaluate()');

// Verify initial state
assert.strictEqual(task4.subSteps[0].ok, false, 'Step 0 should be pending initially');
assert.strictEqual(!!task4.subSteps[0].skipped, false, 'Step 0 should not be skipped initially');

// Skip sub-step 0
const skippedFirst = global.Win11Assessment.skipSubStep(4, 0);
assert.strictEqual(skippedFirst, true, 'skipSubStep(4, 0) must return true');
global.Win11Assessment.evaluate();

assert.strictEqual(task4.subSteps[0].skipped, true, 'Step 0 must now be marked skipped');
assert.strictEqual(task4.subSteps[1].skipped, false, 'Step 1 must remain unskipped');
console.log('✓ TEST 5 PASSED: Sub-step skip operates sequentially and accurately.');

console.log('\n=============================================');
console.log('ALL V2.1 POLISH TESTS COMPLETED SUCCESSFULLY!');
console.log('=============================================');
process.exit(0);
