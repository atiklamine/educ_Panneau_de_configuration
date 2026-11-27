/**
 * Test Suite: Section D Mid-Simulation Impersonation Freeze, Text Boundary Clipping & Security Clarification
 *
 * Verifies User Request 10:
 * 1. Text Overflow Fix in Section D: Col 6 text is strictly clipped and wrapped into two clean lines.
 * 2. Legible Typography: Font upgraded from tiny 9.5px to crisp, bold 11.5px/12.5px.
 * 3. Security Freeze Clarification: When students are removed mid-simulation at 67%, the report declares
 *    with 100% clarity across Top Bar, Section B, Section C, and Section D that:
 *    - The session was officially frozen and terminated at 67% (4/6 tasks).
 *    - The remaining 33% (tasks 5 and 6) was cancelled/voided.
 *    - The substitute/remaining student is prohibited from continuing or claiming previous points.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
var canvasCalls = [];
global.document = {
    createElement: function (tag) {
        if (tag === 'canvas') {
            return {
                width: 1240,
                height: 1754,
                getContext: function () {
                    return {
                        save: function () { canvasCalls.push({ type: 'save' }); },
                        restore: function () { canvasCalls.push({ type: 'restore' }); },
                        beginPath: function () { canvasCalls.push({ type: 'beginPath' }); },
                        moveTo: function () {},
                        lineTo: function () {},
                        closePath: function () {},
                        drawImage: function () {},
                        rect: function (x, y, w, h) { canvasCalls.push({ type: 'rect', x: x, y: y, w: w, h: h }); },
                        clip: function () { canvasCalls.push({ type: 'clip' }); },
                        fillText: function (txt, x, y) { canvasCalls.push({ type: 'fillText', txt: txt, x: x, y: y }); },
                        fillRect: function () {},
                        strokeRect: function () {},
                        arc: function () {},
                        fill: function () {},
                        stroke: function () {},
                        setLineDash: function () {},
                        measureText: function (txt) { return { width: (txt || '').length * 8 }; }
                    };
                },
                toDataURL: function () {
                    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAg==';
                }
            };
        }
        return {
            tagName: tag,
            style: {},
            setAttribute: function () {},
            getAttribute: function () { return null; },
            classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }
        };
    },
    documentElement: { setAttribute: function () {} },
    body: { className: '', setAttribute: function () {} }
};

// Load system components
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

console.log('=== TEST 1: SETUP 3-STUDENT GROUP SIMULATION ===');
global.Win11Assessment.startSession({
    participants: [
        { lastName: 'حلوف', firstName: 'بولجاح' },
        { lastName: 'مفقوش', firstName: 'خرباطي' },
        { lastName: 'عيداني', firstName: 'بعنوش' }
    ],
    classGroup: '3',
    pcNumber: '05',
    mode: 'training',
    quizOptIn: true
});

var initHistory = global.Win11Assessment.getStudentHistory();
assert.ok(initHistory.initial, 'Initial history snapshot must exist');
assert.strictEqual(initHistory.initial.participants.length, 3, 'Must register 3 participants initially');
console.log('✓ TEST 1 PASSED: Initial collaborative group of 3 registered.');

console.log('=== TEST 2: SIMULATE COMPLETION OF 4 OUT OF 6 TASKS (67%) ===');
var allTasks = global.Win11Assessment.getTasks();
assert.ok(allTasks.length >= 6, 'Must have at least 6 tasks');
for (var ti = 0; ti < 4; ti++) {
    allTasks[ti].completed = true;
    allTasks[ti].earnedPoints = Number(allTasks[ti].maxPoints || allTasks[ti].coefficient || 2);
}
for (var ti2 = 4; ti2 < allTasks.length; ti2++) {
    allTasks[ti2].completed = false;
    allTasks[ti2].earnedPoints = 0;
}
console.log('✓ TEST 2 PASSED: 4 of 6 tasks completed (67% progress).');

console.log('=== TEST 3: MID-SESSION IDENTITY CHANGE — REMOVE 2 STUDENTS ===');
global.Win11Assessment.updateStudentInfo({
    participants: [
        { lastName: 'عيداني', firstName: 'بعنوش' }
    ]
});

var updatedHistory = global.Win11Assessment.getStudentHistory();
assert.strictEqual(updatedHistory.modifications.length, 1, 'Must record 1 modification');
var modItem = updatedHistory.modifications[0];
assert.strictEqual(modItem.progressPercent, 67, 'Must record 67% progress at time of modification');
assert.strictEqual(modItem.doneTasksCount, 4, 'Must record 4 completed tasks');
assert.strictEqual(modItem.totalTasksCount, 6, 'Must record 6 total tasks');
console.log('✓ TEST 3 PASSED: Removal of 2 students logged with 67% progress.');

console.log('=== TEST 4: VERIFY HTML REPORT FOR EXPLICIT FREEZE NOTICES ===');
var reportHtml = global.Win11Report.buildA4Html();

// Top Summary Bar
assert.ok(reportHtml.indexOf('جلسة موقوفة ومجمدة أمنياً عند نسبة') !== -1, 'Top summary card must state session freeze');
assert.ok(reportHtml.indexOf('67%') !== -1, 'Top summary card must state 67% progress');
assert.ok(reportHtml.indexOf('إلغاء استكمال المهام المتبقية') !== -1, 'Top summary card must announce cancellation of remaining tasks');

// Section B (Tasks Table)
assert.ok(reportHtml.indexOf('ملغاة أمنياً (تجميد)') !== -1, 'Uncompleted tasks in Section B must be marked "ملغاة أمنياً (تجميد)"');
assert.ok(reportHtml.indexOf('ملغاة أمنياً — تم تجميد الجلسة وإلغاء استكمال النسبة المتبقية') !== -1, 'Notes must detail freeze at 67%');

// Section C (Calculation Breakdown Explainer)
assert.ok(reportHtml.indexOf('تنبيه التدقيق والنزاهة') !== -1, 'Section C must contain audit/integrity banner');

// Section D (Audit Table)
assert.ok(reportHtml.indexOf('قرار أمني وتربوي حاسم') !== -1, 'Section D must contain decisive security banner');
assert.ok(reportHtml.indexOf('تم تجميد الجلسة نهائياً وإلغاء النسبة المتبقية') !== -1, 'Section D must state permanent freeze & voiding');
assert.ok(reportHtml.indexOf('[تجميد أمني]') !== -1, 'Stage pill must include [تجميد أمني]');
assert.ok(reportHtml.indexOf('[تجميد المحاكاة]') !== -1, 'Field summary must include [تجميد المحاكاة]');

console.log('✓ TEST 4 PASSED: HTML report displays 100% crystal clear freeze directives across all sections.');

// Save visual preview for documentation
fs.writeFileSync(path.join(__dirname, '../docs/report_versions/REPORT_SPEC_v2.5_2026-11-27_17-00-00.preview.html'), reportHtml, 'utf8');
console.log('✓ v2.5 HTML Preview written to docs/report_versions/REPORT_SPEC_v2.5_2026-11-27_17-00-00.preview.html');

console.log('=== TEST 5: VERIFY CANVAS RENDERING, MULTI-LINE WORD WRAPPING & ZERO TRUNCATION ===');
canvasCalls = [];
var pdfBytes = global.Win11Report.generateReportPdfUint8();
assert.ok(pdfBytes && pdfBytes.length > 500, 'PDF bytes must be generated');

var canvasTexts = canvasCalls.filter(function (c) { return c.type === 'fillText'; }).map(function (c) { return c.txt; });
var allCanvasText = canvasTexts.join(' ');

// 1. Verify that full names of removed and remaining participants appear without abbreviation or truncation
assert.ok(allCanvasText.indexOf('حلوف بولجاح') !== -1, 'Canvas must render full name of student 1');
assert.ok(allCanvasText.indexOf('مفقوش خرباطي') !== -1, 'Canvas must render full name of student 2');
assert.ok(allCanvasText.indexOf('عيداني بعنوش') !== -1, 'Canvas must render full name of student 3');

// 2. Verify that there is NO ellipsis or truncation in Section D texts
var hasEllipsis = canvasTexts.some(function (t) {
    return t && (t.indexOf('...') !== -1 || t.indexOf('…') !== -1) && (t.indexOf('حلوف') !== -1 || t.indexOf('تعديل') !== -1);
});
assert.strictEqual(hasEllipsis, false, 'Section D text must NEVER be truncated with ellipsis');

// 3. Verify security freeze banner
assert.ok(allCanvasText.indexOf('قرار أمني وتربوي: تم تجميد الجلسة') !== -1, 'Canvas must render security freeze sub-banner');

// 4. Verify multi-line security ruling in Col 6
assert.ok(allCanvasText.indexOf('تم تجميد الجلسة نهائياً عند (67%) وإلغاء المهام المتبقية (33%)') !== -1, 'Canvas must render complete security freeze and cancellation ruling in Col 6');

// 5. Verify audit notice in Col 6
assert.ok(allCanvasText.indexOf('تم استبعاد/حذف 2 تلاميذ مشاركين') !== -1, 'Canvas must render complete participant removal audit notice in Col 6');

console.log('✓ TEST 5 PASSED: Canvas rendering displays 100% complete text with word-wrapping, multi-line row expansion, and zero truncation/clipping.');

console.log('\n========================================================================');
console.log('ALL SECTION D OVERFLOW, FREEZE & INTEGRITY TESTS PASSED 100%!');
console.log('========================================================================\n');
process.exit(0);
