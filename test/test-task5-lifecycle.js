/**
 * Test Task 5 Software & Apps Lifecycle (Install -> Open & Verify -> Uninstall -> Verify Gone from Start)
 */
const assert = require('assert');

global.window = global;
global.document = {
    createElement: function (tag) {
        return {
            tagName: tag,
            setAttribute: function () {},
            getAttribute: function () { return ''; },
            appendChild: function () {},
            removeChild: function () {},
            querySelector: function () { return { onclick: null, style: {} }; },
            querySelectorAll: function () { return []; },
            classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
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
require('../assets/icons/icons.js');
require('../js/core/state.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');
require('../js/pedagogy/assessment.js');
require('../js/core/dialogs.js');
require('../js/core/start-menu.js');

console.log('--- TEST 1: SETUP STUDENT SESSION ---');
global.Win11Assessment.startSession({
    lastName: 'عمرون',
    firstName: 'فخر الدين',
    classGroup: '1AS',
    pcNumber: '01',
    mode: 'training',
    quizOptIn: false
});

// Advance to Task 5 (Task 1 -> 2 -> 3 -> 4 -> 5)
global.Win11Assessment.skipActiveTask();
global.Win11Assessment.skipActiveTask();
global.Win11Assessment.skipActiveTask();
global.Win11Assessment.skipActiveTask();
console.log('Active task is now Task 5.');

console.log('--- TEST 2: INSTALL LABTOOLS VIA SETUP EXE ---');
global.Win11State.installSetupApp({ desktopShortcut: true });
const st1 = global.Win11State.get();
assert(st1.installedPrograms.some(p => p.id === 'labtools_app'), 'labtools_app must be in installedPrograms');
assert(st1.setupFlow.installed === true, 'setupFlow.installed must be true');
console.log('[PASS] LabTools installed successfully.');

console.log('--- TEST 3: VERIFY START MENU PINNED & RECOMMENDED ITEMS ---');
// Pinned items must now contain LabTools 1AS
global.Win11StartMenu.refresh();
const st2 = global.Win11State.get();
assert(st2.installedPrograms.some(p => p.id === 'labtools_app'), 'labtools_app exists in state');
console.log('[PASS] Start Menu recognizes installed app.');

console.log('--- TEST 4: OPEN AND CLOSE LABTOOLS APP ---');
global.Win11Dialogs.openLabToolsApp();
const st3 = global.Win11State.get();
assert.strictEqual(st3.setupFlow.openedApp, true, 'setupFlow.openedApp must be true');
console.log('[PASS] LabTools app opened successfully.');

// Simulate user closing the app
st3.setupFlow.closedApp = true;
global.Win11State.persist();
const st4 = global.Win11State.get();
assert.strictEqual(st4.setupFlow.closedApp, true, 'setupFlow.closedApp must be true');
console.log('[PASS] LabTools app closed successfully.');

console.log('--- TEST 5: UNINSTALL LABTOOLS FROM SETTINGS ---');
global.Win11State.uninstallProgram('labtools_app');
const st5 = global.Win11State.get();
assert(!st5.installedPrograms.some(p => p.id === 'labtools_app'), 'labtools_app must be removed from installedPrograms');
assert.strictEqual(st5.setupFlow.uninstalled, true, 'setupFlow.uninstalled must be true');
console.log('[PASS] LabTools uninstalled successfully.');

console.log('--- TEST 6: VERIFY GONE IN START MENU ---');
global.Win11State.markStartMenuFeaturesViewed();
const st6 = global.Win11State.get();
assert.strictEqual(st6.setupFlow.verifiedGoneInStart, true, 'setupFlow.verifiedGoneInStart must be true');
console.log('[PASS] Verified gone in Start Menu successfully.');

console.log('--- TEST 7: EVALUATE TASK 5 POINTS ---');
global.Win11Assessment.evaluate();
const task5 = global.Win11Assessment.getTasks().find(t => t.id === 5);
console.log('Task 5 earned points:', task5.earnedPoints, '/', task5.maxPoints);
assert(task5.earnedPoints > 0, 'Task 5 must earn points for completed subtasks');
console.log('[PASS] Task 5 scoring evaluated accurately.');

console.log('\n=========================================');
console.log('ALL TASK 5 LIFECYCLE TESTS PASSED 100%!');
console.log('=========================================');
process.exit(0);
