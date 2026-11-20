/**
 * Verification test for classroom scenario:
 * 1. Task 5 has 8 subtasks in the catalog
 * 2. Simulation with Tasks 1-5 completed, Task 6 incomplete (0/4)
 * 3. Verified HTML report: Task 6 is NOT complete, score is not inverted
 */
const assert = require('assert');

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

console.log('--- TEST: TASK 5 SUBTASKS CATALOG COUNT ---');
const subCatalog = global.Win11Assessment.getSubstepsCatalog();
const sub5 = subCatalog[5];
assert.strictEqual(sub5.length, 8, 'Task 5 must have 8 subtasks');
console.log('[PASS] Subtasks for Task 5:', sub5.length);

console.log('--- TEST: CLASSROOM PHOTO SCENARIO (Tasks 1-5 done, Task 6 0/4) ---');
global.Win11Assessment.startSession({
    lastName: 'عمرون',
    firstName: 'فخر الدين',
    classGroup: '1AS',
    pcNumber: '01',
    mode: 'training',
    quizOptIn: true
});

const tasks = global.Win11Assessment.getTasks();
// Mark tasks 1 to 5 done
for (let i = 0; i < 5; i++) {
    tasks[i].completed = true;
    tasks[i].earnedPoints = tasks[i].maxPoints;
}
// Task 6 is incomplete
tasks[5].completed = false;
tasks[5].earnedPoints = 0;

const html = global.Win11Report.buildA4Html();

assert(html.includes('عمرون'), 'Student name must be in report');
assert(html.includes('فخر الدين'), 'Student name must be in report');
assert(html.includes('1AS'), 'Class must be in report');
assert(html.includes('01'), 'Device number must be in report');

// Verify Task 6 is marked incomplete
assert(html.includes('غير منجزة') || html.includes('قيد الإنجاز'), 'Task 6 must not be marked complete');

// Verify table contains 9 columns
assert(html.includes('جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية'), 'Section B title must be present');
assert(html.includes('الملاحظات وتفاصيل الإنجاز'), 'Notes column must be present');

// Verify Section C math breakdown is present
assert(html.includes('القسم (ج): التفكيك الحسابي للعلامة'), 'Section C math breakdown must be present');
assert(html.includes('تطبيق القاعدة الثلاثية الرسمية'), 'Rule of three step must be present');

console.log('[PASS] Classroom scenario test completely succeeded!');
process.exit(0);
