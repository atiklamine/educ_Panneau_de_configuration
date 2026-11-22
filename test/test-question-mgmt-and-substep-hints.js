/**
 * Unit Test: Question Management, Distractor Bank Persistence, and Step-Specific HUD Hints
 */
var assert = require('assert');

// Mock browser window and DOM
global.window = global;
global.document = {
    getElementById: function () { return null; },
    createElement: function () { return { style: {}, appendChild: function () {} }; }
};
global.btoa = function (str) { return Buffer.from(str, 'binary').toString('base64'); };
global.atob = function (b64) { return Buffer.from(b64, 'base64').toString('binary'); };

require('../js/compat/compat.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../js/core/state.js');
require('../js/core/config-crypto.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/assessment.js');
require('../js/pedagogy/report.js');

console.log('--- Testing Win11QuizBank Updates & Defaults ---');
var qBank = global.Win11QuizBank;
assert(qBank, 'Win11QuizBank must exist');

var q1 = qBank.getQuestionById('q1_1');
assert(q1, 'q1_1 must exist in the bank');
var origTitle = q1.titleAr;
var origText = q1.questionAr;
var origAns = q1.correctAnswerAr;
var origDistCount = q1.distractorsAr.length;

// Test updating question
var updateOk = qBank.updateQuestion('q1_1', {
    titleAr: 'صياغة جديدة للعنوان',
    questionAr: 'ما هو الفرق الدقيق والمفصل بين لغة العرض ولغة الإدخال بعد التعديل؟',
    correctAnswerAr: 'إجابة نموذجية دقيقة معدلة من طرف الأستاذ.',
    distractorsAr: ['مموه تجريبي معدل 1', 'مموه تجريبي معدل 2', 'مموه تجريبي معدل 3'],
    disabledDistractors: ['مموه تجريبي معدل 2']
});
assert.strictEqual(updateOk, true, 'updateQuestion must return true');

var updatedQ = qBank.getQuestionById('q1_1');
assert.strictEqual(updatedQ.titleAr, 'صياغة جديدة للعنوان');
assert.strictEqual(updatedQ.questionAr, 'ما هو الفرق الدقيق والمفصل بين لغة العرض ولغة الإدخال بعد التعديل؟');
assert.strictEqual(updatedQ.correctAnswerAr, 'إجابة نموذجية دقيقة معدلة من طرف الأستاذ.');
assert.strictEqual(updatedQ.distractorsAr.length, 3);
assert.strictEqual(updatedQ.disabledDistractors.length, 1);
assert.strictEqual(updatedQ.isCustomized, true);
console.log('✔ Question update verified successfully.');

// Test restoring defaults
var revertOk = qBank.resetQuestionToDefault('q1_1');
assert.strictEqual(revertOk, true, 'resetQuestionToDefault must return true');
var revertedQ = qBank.getQuestionById('q1_1');
assert.strictEqual(revertedQ.titleAr, origTitle);
assert.strictEqual(revertedQ.questionAr, origText);
assert.strictEqual(revertedQ.correctAnswerAr, origAns);
assert.strictEqual(revertedQ.distractorsAr.length, origDistCount);
assert.strictEqual(revertedQ.isCustomized, false);
console.log('✔ Question revert to default verified successfully.');

console.log('--- Testing inf.dll Persistence of Customized Questions ---');
// Modify q1_1 again to test inf.dll saving
qBank.updateQuestion('q1_1', {
    titleAr: 'عنوان مخصص محفوظ في inf.dll',
    questionAr: 'سؤال معدل الصياغة للاختبار في inf.dll',
    correctAnswerAr: 'إجابة الأستاذ المحفوظة',
    distractorsAr: ['خيار 1', 'خيار 2', 'خيار 3'],
    disabledDistractors: ['خيار 2']
});

var cfg = global.Win11Assessment.getConfig();
global.Win11Assessment.saveConfig(cfg);

var exportedCfg = global.Win11Assessment.getConfig();
assert(Array.isArray(exportedCfg.edited_quiz_questions), 'edited_quiz_questions must be an array');
assert(exportedCfg.edited_quiz_questions.length >= 1, 'edited_quiz_questions must contain q1_1');
assert.strictEqual(exportedCfg.edited_quiz_questions[0].id, 'q1_1');
assert(exportedCfg.quiz_disabled_distractors, 'quiz_disabled_distractors must exist');
assert(Array.isArray(exportedCfg.quiz_disabled_distractors['q1_1']), 'q1_1 disabled distractors must be saved');
assert.strictEqual(exportedCfg.quiz_disabled_distractors['q1_1'][0], 'خيار 2');
console.log('✔ inf.dll serialization of edited questions & disabled distractors verified.');

console.log('--- Testing Step-Specific Real-Time Hints ---');
var assess = global.Win11Assessment;
assert(typeof assess.getActiveSubStepHint === 'function', 'getActiveSubStepHint must be a function');

// Test Task 1 sub-step hint
var hintT1 = assess.getActiveSubStepHint(1);
assert(hintT1.hasSubStep, 'Task 1 must have active sub-step');
assert.strictEqual(hintT1.stepNum, 1);
assert(hintT1.hintText.indexOf('الوقت واللغة') !== -1, 'Task 1 hint must guide to Time & Language');
console.log('✔ Task 1 step-specific hint:', hintT1.hintText);

// Test Task 4 sub-step hint (Task 4 has 3 steps)
var hintT4 = assess.getActiveSubStepHint(4);
assert(hintT4.hasSubStep, 'Task 4 must have active sub-step');
assert.strictEqual(hintT4.stepNum, 1);
assert(hintT4.hintText.indexOf('التخصيص') !== -1, 'Task 4 hint must guide to Personalization');
console.log('✔ Task 4 step-specific hint:', hintT4.hintText);

// Test Task 6 sub-step hint
var hintT6 = assess.getActiveSubStepHint(6);
assert(hintT6.hasSubStep, 'Task 6 must have active sub-step');
assert.strictEqual(hintT6.stepNum, 1);
assert(hintT6.hintText.indexOf('الحسابات') !== -1, 'Task 6 hint must guide to Accounts');
console.log('✔ Task 6 step-specific hint:', hintT6.hintText);

console.log('--- Testing Report Table Formatting ---');
var report = global.Win11Report;
global.Win11Assessment.evaluate();
var fullDoc = report.buildStandaloneHtmlDoc();
assert(fullDoc.indexOf('<colgroup>') !== -1, 'Report must contain colgroup');
assert(fullDoc.indexOf('width:25%') !== -1, 'Colgroup must contain refined width 25%');
assert(fullDoc.indexOf('width:8%') !== -1, 'Colgroup must contain earned width 8%');
assert(fullDoc.indexOf('overflow:hidden !important;') !== -1, 'Table cells must have overflow hidden');
console.log('✔ Report table formatting verified successfully.');

console.log('\nALL UNIT TESTS PASSED SUCCESSFULLY!');
