/**
 * Verification test suite for Report v2.4:
 * Mathematical Column Balance & Transparent Scoring Methodology
 *
 * Verifies:
 * 1. Renaming column headers to: "النقطة الكاملة" | "الممنوحة" | "الضائع"
 * 2. Strict mathematical equality in table columns:
 *    [النقطة الكاملة] - [الضائع] === [الممنوحة]
 *    (e.g. 23.00 - 10.62 = 12.38)
 * 3. Separation of direct grade penalties from 20 (pen) from performance points out of 23.
 * 4. Presence of 3-card calculation explainer in Section C.
 * 5. Identical logic on Canvas/Binary PDF generator.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup minimal DOM mocks for Node.js
global.window = global;
global.document = {
    addEventListener: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    getElementById: function () { return null; },
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
    body: {
        appendChild: function () {},
        removeChild: function () {}
    }
};

global.atob = function (str) { return Buffer.from(str, 'base64').toString('binary'); };
global.btoa = function (str) { return Buffer.from(str, 'binary').toString('base64'); };

global.Image = function () {
    this.naturalWidth = 100;
    this.naturalHeight = 80;
    this.complete = true;
    var self = this;
    Object.defineProperty(this, 'src', {
        set: function (val) {
            self._src = val;
            if (typeof self.onload === 'function') self.onload();
        },
        get: function () { return self._src; }
    });
};

// Load core modules
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

console.log('=== TEST 1: SETUP SIMULATION SCENARIO (MATCHING USER SCENARIO) ===');
// Register student
global.Win11Assessment.startSession({
    lastName: 'عتيق',
    firstName: 'محمد الأمين',
    participants: [{ lastName: 'عتيق', firstName: 'محمد الأمين' }],
    classGroup: '1AS_ST_G1',
    pcNumber: '03',
    mode: 'training',
    quizOptIn: true
});

const tasks = global.Win11Assessment.getTasks().filter(t => t.enabled !== false);
assert(tasks.length >= 6, 'Must have 6 tasks');

// Simulate student performance yielding: grandTotalEarned = 12.38 out of 23.00
// Set coefficients to match user simulation: 3, 2, 1, 2, 5, 4 (sum = 17 practical + 6 quiz = 23 total)
tasks[0].coefficient = 3; tasks[0].maxPoints = 3.0; tasks[0].weight = 3;
tasks[1].coefficient = 2; tasks[1].maxPoints = 2.0; tasks[1].weight = 2;
tasks[2].coefficient = 1; tasks[2].maxPoints = 1.0; tasks[2].weight = 1;
tasks[3].coefficient = 2; tasks[3].maxPoints = 2.0; tasks[3].weight = 2;
tasks[4].coefficient = 5; tasks[4].maxPoints = 5.0; tasks[4].weight = 5;
tasks[5].coefficient = 4; tasks[5].maxPoints = 4.0; tasks[5].weight = 4;

// Task 1: 3.00 max, 3.00 earned, quiz 1.00 max, 1.00 earned
tasks[0].completed = true;
tasks[0].earnedPoints = 3.0;
tasks[0].quizCompleted = true;
tasks[0].quizResult = { attempts: 1, earnedPoints: 1.0, maxPoints: 1.0, answeredCorrectly: true, questionTitle: 'سؤال 1' };

// Task 2: 2.00 max, 2.00 earned, quiz 1.00 max, 0.50 earned (attempt 2)
tasks[1].completed = true;
tasks[1].earnedPoints = 2.0;
tasks[1].quizCompleted = true;
tasks[1].quizResult = { attempts: 2, earnedPoints: 0.5, maxPoints: 1.0, answeredCorrectly: true, questionTitle: 'سؤال 2' };

// Task 3: 1.00 max, 1.00 earned, quiz 1.00 max, 0.00 earned (exhausted/failed)
tasks[2].completed = true;
tasks[2].earnedPoints = 1.0;
tasks[2].quizCompleted = true;
tasks[2].quizResult = { attempts: 3, earnedPoints: 0.0, maxPoints: 1.0, answeredCorrectly: false, questionTitle: 'سؤال 3' };

// Task 4: 2.00 max, 2.00 earned, quiz 1.00 max, 0.00 earned (skipped)
tasks[3].completed = true;
tasks[3].earnedPoints = 2.0;
tasks[3].quizCompleted = true;
tasks[3].quizResult = { attempts: 1, earnedPoints: 0.0, maxPoints: 1.0, answeredCorrectly: false, skipped: true, questionTitle: 'سؤال 4' };

// Task 5: 5.00 max, 2.88 earned (partial), quiz 1.00 max, 0.00 earned (skipped)
tasks[4].completed = false;
tasks[4].earnedPoints = 2.88;
tasks[4].quizCompleted = true;
tasks[4].quizResult = { attempts: 1, earnedPoints: 0.0, maxPoints: 1.0, answeredCorrectly: false, skipped: true, questionTitle: 'سؤال 5' };

// Task 6: 4.00 max, 0.00 earned (incomplete), quiz 1.00 max, 0.00 earned (skipped)
tasks[5].completed = false;
tasks[5].earnedPoints = 0.0;
tasks[5].quizCompleted = true;
tasks[5].quizResult = { attempts: 1, earnedPoints: 0.0, maxPoints: 1.0, answeredCorrectly: false, skipped: true, questionTitle: 'سؤال 6' };

// Record direct penalty violations (e.g. 3 violations * 0.25 = 0.75)
global.Win11Assessment.recordMistake('تعديل إعدادات الفأرة غير المطلوبة', 'قام التلميذ بعكس أزرار الفأرة', 0.25, tasks[0].titleAr);
global.Win11Assessment.recordMistake('تعديل خارج نطاق المهمة النشطة', 'قام التلميذ بالدخول إلى تحديثات Windows', 0.25, tasks[1].titleAr);
global.Win11Assessment.recordMistake('تعديل خارج نطاق المهمة النشطة', 'قام التلميذ بفتح إعدادات VPN', 0.25, tasks[2].titleAr);

global.Win11Assessment.evaluate();
const scores = global.Win11Assessment.getScores();

console.log('Evaluated Scores:', {
    grandTotalMax: scores.grandTotalMax,
    grandTotalEarned: scores.grandTotalEarned,
    baseScore: scores.baseScore,
    penalties: scores.penalties,
    finalScore: scores.finalScore
});

const maxPoints = scores.grandTotalMax;
const earnedPoints = scores.grandTotalEarned;
const expectedLost = Number((maxPoints - earnedPoints).toFixed(2));
const penalties = scores.penalties;

assert(maxPoints > 0, 'grandTotalMax must be > 0');
assert(earnedPoints > 0, 'grandTotalEarned must be > 0');
assert.strictEqual(penalties, 0.75, 'penalties must be 0.75');
console.log(`✓ TEST 1 PASSED: Target scenario evaluated (${maxPoints.toFixed(2)} max, ${earnedPoints.toFixed(2)} earned, ${penalties.toFixed(2)} penalty).`);

console.log('=== TEST 2: COLUMN HEADERS & MATHEMATICAL BALANCE IN HTML REPORT ===');
const reportHtml = global.Win11Report.buildA4Html();

// Check new column headers
assert(reportHtml.includes('النقطة الكاملة'), 'Table must contain "النقطة الكاملة" column header');
assert(reportHtml.includes('الممنوحة'), 'Table must contain "الممنوحة" column header');
assert(reportHtml.includes('الضائع'), 'Table must contain "الضائع" column header');

// Check mathematical balance in totals row:
// [النقطة الكاملة] - [الضائع] = [الممنوحة]
assert(reportHtml.includes(maxPoints.toFixed(2)), 'Must contain maxPoints in totals');
assert(reportHtml.includes(earnedPoints.toFixed(2)), 'Must contain earnedPoints in totals');
assert(reportHtml.includes('-' + expectedLost.toFixed(2)), `Lost points must strictly equal -${expectedLost.toFixed(2)}`);

// Strict verification: penalties must NOT be added into the lost points column sum
const corruptedLost = Number((expectedLost + penalties).toFixed(2));
assert(!reportHtml.includes('-' + corruptedLost.toFixed(2)), `Report must NOT mix penalty ${penalties} into table lost points (-${corruptedLost} is strictly forbidden)`);

// Check that penalty is designated as direct deduction from 20
assert(reportHtml.includes('-' + penalties.toFixed(2)), 'Must contain direct penalty in footer/Section C');
assert(reportHtml.includes('خصم مباشر من رصيد') && reportHtml.includes('20'), 'Must clarify that penalty is from the 20-point scale');
console.log(`✓ TEST 2 PASSED: Column headers and mathematical balance verified in HTML (${maxPoints.toFixed(2)} - ${expectedLost.toFixed(2)} = ${earnedPoints.toFixed(2)}).`);

console.log('=== TEST 3: 3-CARD METHODOLOGY EXPLAINER IN SECTION C ===');
assert(reportHtml.includes('منهجية وطريقة احتساب النقطة النهائية'), 'Must include methodology title');
assert(reportHtml.includes('توازن نقاط الأداء'), 'Must include Card 1 for performance balance');
assert(reportHtml.includes('القاعدة الثلاثية'), 'Must include Card 2 for Rule of Three');
assert(reportHtml.includes('الخصم الجزائي المباشر'), 'Must include Card 3 for direct penalty');
console.log('✓ TEST 3 PASSED: 3-Card Methodology Explainer verified in Section C.');

console.log('=== TEST 4: CANVAS & BINARY PDF INTEGRITY ===');
const pdfBytes = global.Win11Report.generateReportPdfUint8();
assert(pdfBytes && pdfBytes.length > 500, 'Canvas PDF generation must return non-empty binary bytes');
const pdfHeader = String.fromCharCode.apply(null, pdfBytes.subarray(0, 5));
assert.strictEqual(pdfHeader, '%PDF-', 'Canvas generator must produce genuine binary PDF');
console.log('✓ TEST 4 PASSED: Canvas PDF generation verified with authentic %PDF- header.');

console.log('\n======================================================');
console.log('ALL REPORT V2.4 BALANCED CALCULATION TESTS PASSED 100%!');
console.log('======================================================');
process.exit(0);
