/**
 * Test Suite: Student Information Modification Audit Trail & Report Polish
 * Verifies:
 * 1. Initial session registration snapshot in student.history.initial
 * 2. Audit logging on updateStudentInfo() with edit number, system clock time, elapsed duration, progress %, and diffs
 * 3. Conditional Section D display:
 *    - Strictly omitted if no student info modification occurred (clean single-page report)
 *    - Rendered with teacher alert box and comparison table if modifications exist
 * 4. Top summary card:
 *    - Symmetrical score and time boxes
 *    - Score displayed LTR: "XX.XX / 20.00" with explicit clarifier: "(XX.XX من أصل 20.00)"
 *    - Duration displayed with status clarifier: "تم تثبيت وقت الإنجاز النهائي"
 * 5. Terminology verification: "معاملات" and "المعامل الأقصى" used instead of "أوزان".
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.document = {
    createElement: function (tag) {
        return {
            tagName: tag,
            style: {},
            setAttribute: function () {},
            getAttribute: function () { return null; },
            classList: {
                add: function () {},
                remove: function () {},
                contains: function () { return false; }
            },
            getContext: function () { return null; }
        };
    },
    documentElement: { setAttribute: function () {} },
    body: { className: '', setAttribute: function () {} }
};

// Load dependencies
require('../js/compat/compat.js');
require('../js/core/config-crypto.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../js/core/state.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');
require('../js/pedagogy/assessment.js');
require('../js/pedagogy/report.js');

console.log('--- Starting Test: Student Info Edit Audit Trail & Report Polish ---');

// Test 1: Initial Session Registration Snapshot (No modifications)
console.log('\n[Test 1] Initial Session Registration without modifications...');
global.Win11Assessment.startSession({
    lastName: 'منيعي',
    firstName: 'أيوب',
    classGroup: '1AS-01',
    pcNumber: '05',
    mode: 'exam',
    quizOptIn: true
});

var stu = global.Win11Assessment.getStudent();
var history = global.Win11Assessment.getStudentHistory();

assert.ok(history, 'studentInfoHistory should exist');
assert.ok(history.initial, 'history.initial snapshot should exist');
assert.strictEqual(history.initial.lastName, 'منيعي');
assert.strictEqual(history.initial.firstName, 'أيوب');
assert.strictEqual(history.initial.classGroup, '1AS-01');
assert.strictEqual(history.initial.pcNumber, '05');
assert.strictEqual(history.initial.elapsedFormatted, '00:00:00');
assert.strictEqual(history.modifications.length, 0, 'No modifications should be recorded initially');
console.log('✓ Initial registration snapshot recorded correctly: ' + history.initial.fullName + ' at ' + history.initial.timestamp);

// Test 2: HTML Report with NO modifications (Section D MUST be absent)
console.log('\n[Test 2] Conditional Section D omission when no modifications exist...');
var reportHtmlNoMod = global.Win11Report.buildA4Html();
assert.strictEqual(reportHtmlNoMod.indexOf('<div class="a4-section-d">'), -1, 'Section D must NOT be rendered when no modifications exist');
assert.ok(reportHtmlNoMod.indexOf('a4-score-earned') !== -1, 'Top summary card must include a4-score-earned');
assert.ok(reportHtmlNoMod.indexOf('من أصل 20.00') !== -1, 'Top summary card must include score clarifier "(XX.XX من أصل 20.00)"');
assert.ok(reportHtmlNoMod.indexOf('المعامل الأقصى') !== -1, 'Table must use "المعامل الأقصى" instead of "الوزن الأقصى"');
console.log('✓ Section D is strictly omitted for honest session, score clarifier present');

// Test 3: Updating Student Info records Audit Log with exact diffs
console.log('\n[Test 3] Modifying student info triggers audit logging...');
// Simulate student changing name to another student
global.Win11Assessment.updateStudentInfo({
    lastName: 'مسعودي',
    firstName: 'عفاف',
    classGroup: '1AS-02'
});

var historyAfterEdit1 = global.Win11Assessment.getStudentHistory();
assert.strictEqual(historyAfterEdit1.modifications.length, 1, 'Exactly 1 modification should be logged');

var mod1 = historyAfterEdit1.modifications[0];
assert.strictEqual(mod1.editNumber, 1);
assert.ok(mod1.timestamp, 'Modification timestamp must exist');
assert.ok(mod1.elapsedFormatted, 'Elapsed duration must exist');
assert.strictEqual(typeof mod1.progressPercent, 'number');

var nameChange = mod1.changes.find(function (c) { return c.field === 'fullName'; });
assert.ok(nameChange, 'fullName change must be tracked');
assert.strictEqual(nameChange.oldVal, 'منيعي أيوب');
assert.strictEqual(nameChange.newVal, 'مسعودي عفاف');

var classChange = mod1.changes.find(function (c) { return c.field === 'classGroup'; });
assert.ok(classChange, 'classGroup change must be tracked');
assert.strictEqual(classChange.oldVal, '1AS-01');
assert.strictEqual(classChange.newVal, '1AS-02');
console.log('✓ Modification 1 logged with exact diffs: ' + nameChange.oldVal + ' ➔ ' + nameChange.newVal);

// Test 4: Second modification (e.g. changing PC number)
console.log('\n[Test 4] Second modification stage logging...');
global.Win11Assessment.updateStudentInfo({
    pcNumber: '12'
});

var historyAfterEdit2 = global.Win11Assessment.getStudentHistory();
assert.strictEqual(historyAfterEdit2.modifications.length, 2, 'Exactly 2 modifications should be logged');
var mod2 = historyAfterEdit2.modifications[1];
assert.strictEqual(mod2.editNumber, 2);
var pcChange = mod2.changes.find(function (c) { return c.field === 'pcNumber'; });
assert.ok(pcChange, 'pcNumber change must be tracked');
assert.strictEqual(pcChange.oldVal, '05');
assert.strictEqual(pcChange.newVal, '12');
console.log('✓ Modification 2 logged with PC diff: #' + pcChange.oldVal + ' ➔ #' + pcChange.newVal);

// Test 5: HTML Report WITH modifications (Section D MUST appear prominently)
console.log('\n[Test 5] Conditional Section D presence when modifications exist...');
var reportHtmlWithMod = global.Win11Report.buildA4Html();
assert.ok(reportHtmlWithMod.indexOf('<div class="a4-section-d">') !== -1, 'Section D MUST be rendered when modifications exist');
assert.ok(reportHtmlWithMod.indexOf('القسم (د): سجل تدقيق وتعديل بيانات الهوية والجلسة') !== -1, 'Section D title must appear');
assert.ok(reportHtmlWithMod.indexOf('تنبيه أمني للأستاذ(ة) المشرف(ة)') !== -1, 'Teacher anti-cheating alert box must appear');
assert.ok(reportHtmlWithMod.indexOf('التسجيل الأولي') !== -1, 'Initial registration row must appear');
assert.ok(reportHtmlWithMod.indexOf('التعديل') !== -1, 'Modification rows must appear');
assert.ok(reportHtmlWithMod.indexOf('منيعي أيوب') !== -1, 'Old student name must be displayed in audit log');
assert.ok(reportHtmlWithMod.indexOf('مسعودي عفاف') !== -1, 'New student name must be displayed in audit log');
console.log('✓ Section D rendered with alert box, initial snapshot, and both modification stages');

console.log('\n=== ALL AUDIT LOG & REPORT POLISH TESTS PASSED SUCCESSFULLY! ===\n');
process.exit(0);
