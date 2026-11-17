/**
 * Verification test for Version 2.0 Quiz Engine and Pedagogical Assessment
 */
const assert = require('assert');

// Mock browser window globals
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
    getElementById: function () { return null; }
};

require('../js/compat/compat.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../js/core/state.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');

console.log('Testing Win11QuizBank...');
assert(global.Win11QuizBank, 'Win11QuizBank must exist on window');

const allQ = global.Win11QuizBank.getAllQuestions();
console.log('Total questions in question bank:', allQ.length);
assert(allQ.length >= 30, 'Question bank must have at least 30 questions');

for (let taskId = 1; taskId <= 6; taskId++) {
    const taskQuestions = global.Win11QuizBank.getQuestionsForTask(taskId);
    console.log(`Task ${taskId} questions count:`, taskQuestions.length);
    assert(taskQuestions.length >= 5, `Task ${taskId} must have at least 5 questions`);

    taskQuestions.forEach((q, idx) => {
        assert(q.questionAr && q.questionAr.trim().length > 5, `Task ${taskId} Q${idx} must have questionAr`);
        assert(q.correctAnswerAr && q.correctAnswerAr.trim().length > 0, `Task ${taskId} Q${idx} must have correctAnswerAr`);
        assert(Array.isArray(q.distractorsAr) && q.distractorsAr.length >= 10, `Task ${taskId} Q${idx} must have at least 10 distractors`);
        assert(q.hintAr && q.hintAr.trim().length > 5, `Task ${taskId} Q${idx} must have scaffolding hintAr`);
    });
}

// Test Quiz Bank CRUD
const addRes = global.Win11QuizBank.addQuestion({
    taskId: 2,
    titleAr: 'سؤال اختباري',
    questionAr: 'ما هي وظيفة سرعة النقر المزدوج؟',
    correctAnswerAr: 'تحديد الفاصل الزمني المطلوب بين نقرتين متتاليتين لاعتبارهما نقراً مزدوجاً.',
    distractorsAr: [
        'خيار 1', 'خيار 2', 'خيار 3', 'خيار 4', 'خيار 5',
        'خيار 6', 'خيار 7', 'خيار 8', 'خيار 9', 'خيار 10'
    ],
    hintAr: 'تذكر الفارق بين النقر الفردي السريع والنقر البطيء.'
});
assert(addRes.ok, 'addQuestion should succeed');
assert(global.Win11QuizBank.getQuestionById(addRes.question.id), 'Question should be retrievable by ID');

// Test toggle
global.Win11QuizBank.toggleQuestionEnabled(addRes.question.id, false);
assert(global.Win11QuizBank.getQuestionById(addRes.question.id).enabled === false, 'Question should be disabled');

// Test delete
const delRes = global.Win11QuizBank.deleteQuestion(addRes.question.id);
assert(delRes === true, 'deleteQuestion should return true');
assert(!global.Win11QuizBank.getQuestionById(addRes.question.id), 'Deleted question should not exist');

console.log('Testing Win11Quiz decreasing penalties...');
assert.strictEqual(global.Win11Quiz.calculateEarnedPoints(1, 1.0), 1.0, 'Attempt 1 must award 100% (1.0)');
assert.strictEqual(global.Win11Quiz.calculateEarnedPoints(2, 1.0), 0.5, 'Attempt 2 must award 50% (0.5)');
assert.strictEqual(global.Win11Quiz.calculateEarnedPoints(3, 1.0), 0, 'Attempt 3 must award 0% (0)');
assert.strictEqual(global.Win11Quiz.calculateEarnedPoints(4, 1.0), 0, 'Attempt 4 must award 0% (0)');

console.log('ALL V2 QUIZ BANK & PENALTY CHECKS PASSED SUCCESSFULLY!');
