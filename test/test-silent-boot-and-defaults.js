/**
 * Unit Test: Silent Default Startup, Updated Lab Defaults & Conditional Teacher Shortcut Auth
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
            classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
            style: {},
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; }
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
require('../js/pedagogy/teacher.js');

console.log('--- TEST 1: DEFAULT CONFIGURATION VALUES ---');
const defCfg = global.Win11Assessment.getDefaultConfig();
assert.strictEqual(defCfg.institution_name, 'مؤسسة أبي بكر الحاج عيسى (الأغواط)');
assert.strictEqual(defCfg.teacher_name, 'أستاذ مادة المعلوماتية');
assert.deepStrictEqual(defCfg.class_groups, ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
assert.strictEqual(defCfg.device_numbers.length, 20);
assert.strictEqual(defCfg.device_numbers[0], '01');
assert.strictEqual(defCfg.device_numbers[19], '20');
assert.strictEqual(defCfg.default_device, '01');
console.log('[PASS] Default config matches requirements: مؤسسة أبي بكر الحاج عيسى (الأغواط), أستاذ مادة المعلوماتية, groups 01-10, devices 01-20.');

console.log('--- TEST 2: CONDITIONAL TEACHER SHORTCUT AUTH (MISSING INF.DLL) ---');
// Mock dialog system
let openedCustomDialog = null;
let openedPanelOpts = null;
global.Win11Dialogs = {
    showCustom: function (cfg) {
        openedCustomDialog = cfg;
    },
    showToast: function () {},
    isOpen: function () { return false; }
};

// Override openPanel to inspect opts
const origOpenPanel = global.Win11Teacher.openPanel;
global.Win11Teacher.openPanel = function (opts) {
    openedPanelOpts = opts;
};

// When inf.dll is missing:
assert.strictEqual(global.Win11Assessment.getInfStatus().status, 'missing');
global.Win11Teacher.openAuth();

// Must open teacher panel directly without prompting for password!
assert(openedCustomDialog !== null, 'Must open Teacher Settings modal');
assert.strictEqual(openedCustomDialog.title, 'إعدادات الأستاذ وإدارة الأفواج', 'Must open Teacher Settings panel directly without password prompt');
console.log('[PASS] Shortcut with missing inf.dll opens Teacher Settings directly without password.');

console.log('--- TEST 3: CONDITIONAL TEACHER SHORTCUT AUTH (LOADED INF.DLL) ---');
// Now simulate that inf.dll was loaded with a teacher password
openedCustomDialog = null;
const infBytes = global.Win11Assessment.exportBinaryInfDll('SecretPass2026');
global.Win11Assessment.loadInfBytes(infBytes);
assert.strictEqual(global.Win11Assessment.getInfStatus().status, 'loaded');

global.Win11Teacher.openAuth();
// Must show password prompt dialog (not wide panel, has password input)!
assert(openedCustomDialog !== null, 'Must open custom dialog asking for teacher password');
assert.strictEqual(openedCustomDialog.wide, undefined, 'Must be auth modal, not wide settings panel');
const dummyWrap = { innerHTML: '', querySelector: function () { return null; } };
openedCustomDialog.renderBody(dummyWrap);
assert(dummyWrap.innerHTML.includes('teacher-auth-pass'), 'Must contain teacher password input');
console.log('[PASS] Shortcut with loaded inf.dll strictly requires teacher password.');

console.log('--- TEST 4: REPORT GRADE FORMATTING (NO RTL REVERSAL) ---');
// Reset state
global.Win11Teacher.openPanel = origOpenPanel;
global.Win11Assessment.startSession({
    lastName: 'عمرون',
    firstName: 'فخر الدين',
    classGroup: '01',
    pcNumber: '01',
    mode: 'training',
    quizOptIn: false // opted out
});

const scores = global.Win11Assessment.evaluate();
const html = global.Win11Report.buildA4Html(scores);

// Must contain dir="ltr" on .a4-tsc-grade to prevent 20.00 / 11.30 display
assert(html.includes('a4-tsc-grade" dir="ltr"'), 'Score card grade must have dir="ltr"');
// Must contain finalScoreStr followed by / 20.00 inside LTR
assert(html.includes('/ 20.00'), 'Must contain / 20.00');

// Section B table: column attempts must NOT contain "0 (معطل)"
assert(!html.includes('0 (معطّل)'), 'Must not contain squeezed 0 (معطّل)');
assert(!html.includes('0 (معطل)'), 'Must not contain squeezed 0 (معطل)');
assert(html.includes('معطّل ✘'), 'Must contain clean badge معطّل ✘');
console.log('[PASS] Report grade LTR isolation and clean attempts/status confirmed.');

console.log('\n=========================================');
console.log('ALL SILENT BOOT & DEFAULT CONFIG TESTS PASSED 100%!');
console.log('=========================================');
process.exit(0);
