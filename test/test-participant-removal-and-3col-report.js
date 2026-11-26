/**
 * Test Suite: Participant Removal Audit Trail & Restored 3-Column Report Layout
 *
 * Verifies:
 * 1. Restored Section A 3-column layout (36%, 32%, 32%) for both Row 1 and Row 2 (no 4-col split, no colspan="2")
 * 2. Proper accommodate of single student and multi-students in Surname/Name cell with uppercase formatting
 * 3. Accurate audit trail logging when participants are removed mid-simulation:
 *    - Records exact removed participant count and names
 *    - Records task progression count (e.g. 3 / 6 tasks, 50%) at the exact moment of removal
 *    - Section D displays initial enrolled participants in Initial Registration row
 *    - Section D renders warning notice box for participant removal in Modification row
 * 4. Accurate audit trail logging when participants are added mid-simulation
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

console.log('=== TEST 1: RESTORED 3-COLUMN REPORT LAYOUT (SINGLE STUDENT) ===');

global.Win11Assessment.startSession({
    lastName: 'عرفة',
    firstName: 'ياسين',
    classGroup: '1AS-03',
    pcNumber: '06',
    mode: 'training',
    quizOptIn: true
});

var singleA4Html = global.Win11Report.buildA4Html();

// Check 3-column table
assert.ok(singleA4Html.indexOf('<td style="width:36%;vertical-align:top;">') !== -1, 'Row 1 Cell 1 must have width:36%');
assert.ok(singleA4Html.indexOf('width:18%') === -1, 'Must NOT contain old 18% 4-column split');
assert.ok(singleA4Html.indexOf('colspan="2"') === -1, 'Must NOT contain colspan="2" in info table');
assert.ok(singleA4Html.indexOf('اسم ولقب التلميذ(ة):') !== -1, 'Must have single student label');
assert.ok(singleA4Html.indexOf('اللقب:') !== -1 && singleA4Html.indexOf('الاسم:') !== -1, 'Must display separate labels for surname and name');
assert.ok(singleA4Html.indexOf('عرفة') !== -1 && singleA4Html.indexOf('ياسين') !== -1, 'Student name must appear');
console.log('✓ TEST 1 PASSED: Single-student 3-column layout rendered cleanly without 4-col split.');

console.log('=== TEST 2: RESTORED 3-COLUMN REPORT LAYOUT (MULTI-STUDENTS) ===');

global.Win11Assessment.startSession({
    participants: [
        { lastName: 'arfaoui', firstName: 'mokrane' },
        { lastName: 'atik', firstName: 'mohamed lamine' }
    ],
    classGroup: '1AS-01',
    pcNumber: '06',
    mode: 'training',
    quizOptIn: true
});

var multiA4Html = global.Win11Report.buildA4Html();
assert.ok(multiA4Html.indexOf('<td style="width:36%;vertical-align:top;">') !== -1, 'Multi-student cell must maintain width:36%');
assert.ok(multiA4Html.indexOf('width:18%') === -1, 'Must NOT contain old 18% 4-column split');
assert.ok(multiA4Html.indexOf('colspan="2"') === -1, 'Must NOT contain colspan="2" in info table');
assert.ok(multiA4Html.indexOf('المشاركون في العمل التطبيقي') !== -1, 'Must have multi-participants label');
assert.ok(multiA4Html.indexOf('ARFAOUI') !== -1 && multiA4Html.indexOf('MOKRANE') !== -1, 'First participant must appear uppercase');
assert.ok(multiA4Html.indexOf('ATIK') !== -1 && multiA4Html.indexOf('MOHAMED LAMINE') !== -1, 'Second participant must appear uppercase');
console.log('✓ TEST 2 PASSED: Multi-student 3-column layout comfortably accommodates enrolled participants.');

console.log('=== TEST 3: AUDIT TRAIL FOR PARTICIPANT REMOVAL MID-SIMULATION ===');

// Setup collaborative session with 3 students
global.Win11Assessment.startSession({
    participants: [
        { lastName: 'عرفاوي', firstName: 'مقران' },
        { lastName: 'عتيق', firstName: 'محمد الأمين' },
        { lastName: 'بن علي', firstName: 'أحمد' }
    ],
    classGroup: '1AS-04',
    pcNumber: '06',
    mode: 'training',
    quizOptIn: true
});

var initialHistory = global.Win11Assessment.getStudentHistory();
assert.ok(initialHistory.initial, 'Initial snapshot must exist');
assert.strictEqual(initialHistory.initial.participants.length, 3, 'Initial snapshot must preserve all 3 participants');
assert.strictEqual(initialHistory.modifications.length, 0, 'No modifications at start');

// Simulate completing 3 tasks out of 6
var tasks = global.Win11Assessment.getTasks();
assert.ok(tasks.length >= 6, 'Must have at least 6 tasks');
tasks[0].completed = true;
tasks[0].earnedPoints = 3.0;
tasks[1].completed = true;
tasks[1].earnedPoints = 2.0;
tasks[2].completed = true;
tasks[2].earnedPoints = 1.0;
for (var ti = 3; ti < tasks.length; ti++) {
    tasks[ti].completed = false;
    tasks[ti].earnedPoints = 0;
}

// Student edits registration and REMOVES 2 participants (leaving only the primary student)
global.Win11Assessment.updateStudentInfo({
    participants: [
        { lastName: 'عرفاوي', firstName: 'مقران' }
    ]
});

var updatedHistory = global.Win11Assessment.getStudentHistory();
assert.strictEqual(updatedHistory.modifications.length, 1, 'Exactly 1 modification event should be recorded');

var modRecord = updatedHistory.modifications[0];
assert.strictEqual(modRecord.editNumber, 1);
assert.strictEqual(modRecord.doneTasksCount, 3, 'Must record 3 completed tasks at time of edit');
assert.strictEqual(modRecord.progressPercent, 50, 'Must record 50% progress at time of edit');

var removalDiff = modRecord.changes.find(function (c) { return c.field === 'participantsRemoved'; });
assert.ok(removalDiff, 'participantsRemoved diff must be present');
assert.strictEqual(removalDiff.removedCount, 2, 'Must record 2 removed participants');
assert.ok(removalDiff.isRemoval === true, 'isRemoval flag must be true');
assert.ok(removalDiff.notice.indexOf('تم استبعاد/حذف') !== -1, 'Notice must specify removal');
assert.ok(removalDiff.notice.indexOf('3 من أصل 6 مهام (50%)') !== -1, 'Notice must detail completed tasks count and progress %');
assert.ok(removalDiff.notice.indexOf('عتيق محمد الأمين') !== -1 || removalDiff.notice.indexOf('عَر') !== -1, 'Notice must name removed students');

console.log('✓ Removal diff captured in history:');
console.log('   Notice: ' + removalDiff.notice);

// Verify Section D in A4 HTML Report
var auditReportHtml = global.Win11Report.buildA4Html();
assert.ok(auditReportHtml.indexOf('a4-section-d') !== -1, 'Section D must be rendered');
assert.ok(auditReportHtml.indexOf('المشاركون المسجلون في البداية:') !== -1, 'Initial registration row must list initial participants');
assert.ok(auditReportHtml.indexOf('حذف تلاميذ من المحاكاة (2)') !== -1, 'Modification table must list participant removal');
assert.ok(auditReportHtml.indexOf('تم استبعاد/حذف') !== -1, 'Report must display the removal alert notice');
assert.ok(auditReportHtml.indexOf('3 / 6 مهام') !== -1 || auditReportHtml.indexOf('3 من أصل 6') !== -1, 'Report must display the exact tasks completed at the moment of removal');

console.log('✓ TEST 3 PASSED: Removal of 2 participants mid-simulation recorded in audit trail with exact task progression and warning notice.');

console.log('=== TEST 4: AUDIT TRAIL FOR PARTICIPANT ADDITION MID-SIMULATION ===');

global.Win11Assessment.startSession({
    lastName: 'قادري',
    firstName: 'سمير',
    classGroup: '1AS-02',
    pcNumber: '03'
});

// Add a teammate mid-session
global.Win11Assessment.updateStudentInfo({
    participants: [
        { lastName: 'قادري', firstName: 'سمير' },
        { lastName: 'حمداني', firstName: 'وليد' }
    ]
});

var addHistory = global.Win11Assessment.getStudentHistory();
assert.strictEqual(addHistory.modifications.length, 1);
var addDiff = addHistory.modifications[0].changes.find(function (c) { return c.field === 'participantsAdded'; });
assert.ok(addDiff, 'participantsAdded diff must be present');
assert.strictEqual(addDiff.addedCount, 1);
assert.ok(addDiff.notice.indexOf('تمت إضافة تلميذ مشارك') !== -1);
console.log('✓ TEST 4 PASSED: Mid-simulation participant addition logged accurately.');

console.log('\n======================================================');
console.log('ALL PARTICIPANT REMOVAL & 3-COL REPORT TESTS PASSED!');
console.log('======================================================\n');
process.exit(0);
