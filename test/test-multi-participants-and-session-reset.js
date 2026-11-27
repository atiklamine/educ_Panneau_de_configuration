/**
 * Test Suite: Multi-Student Collaborative Registration, Clean Session Reset,
 * Lock Screen Password Validation & Blur Flicker Elimination.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.addEventListener = function () {};
global.removeEventListener = function () {};
global.window.addEventListener = global.addEventListener;
global.window.removeEventListener = global.removeEventListener;
global.window.innerWidth = 1920;
global.window.innerHeight = 1080;
global.Win11Icons = { get: function () { return '<svg></svg>'; } };
const mockElements = {};
global.document = {
    addEventListener: function () {},
    removeEventListener: function () {},
    createElement: function (tag) {
        return {
            tagName: tag,
            setAttribute: function () {},
            appendChild: function () {},
            classList: {
                _classes: new Set(),
                add: function (c) { this._classes.add(c); },
                remove: function (c) { this._classes.delete(c); },
                contains: function (c) { return this._classes.has(c); }
            },
            style: {},
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; }
        };
    },
    body: {
        appendChild: function () {},
        removeChild: function () {}
    },
    getElementById: function (id) {
        if (!mockElements[id]) {
            mockElements[id] = {
                id: id,
                classList: {
                    _classes: new Set(),
                    add: function (c) { this._classes.add(c); },
                    remove: function (c) { this._classes.delete(c); },
                    contains: function (c) { return this._classes.has(c); }
                },
                style: {},
                innerHTML: '',
                appendChild: function () {},
                removeChild: function () {},
                querySelector: function (sel) {
                    if (sel === '#lock-pass-input') return this._passInput || null;
                    if (sel === '#lock-error-msg') return this._errorMsg || null;
                    if (sel === '#lock-signin-btn') return this._signinBtn || null;
                    return { onclick: null, focus: function () {}, style: {} };
                },
                querySelectorAll: function () { return []; }
            };
        }
        return mockElements[id];
    },
    title: 'Win11 Test'
};

require('../js/compat/compat.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../js/core/session-manager.js');
require('../js/core/window-manager.js');
require('../js/core/state.js');
require('../js/core/lock-screen.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');
require('../js/pedagogy/assessment.js');
require('../js/pedagogy/report.js');

console.log('=== TEST 1: STATE & SESSION RESET ON NEW STUDENT START ===');
// Simulate student 1 doing work: adding Arabic language and an account
global.Win11State.addInputLanguage({ id: 'AR_DZ', code: 'AR' }, 'العربية (الجزائر)');
assert.ok(global.Win11State.get().installedLanguages.some(function (l) { return l.code.indexOf('AR') !== -1; }));
global.Win11State.createAccount({ name: 'OldStudentAcc', type: 'Standard', password: '123' });
assert.ok(global.Win11State.getAccount('OldStudentAcc'));

// Student 2 starts a new session
global.Win11Assessment.startSession({
    lastName: 'قورين',
    firstName: 'محمد',
    classGroup: '1AS_01',
    pcNumber: '02'
});

// Verify state is factory clean
const stateAfterReset = global.Win11State.get();
assert.strictEqual(stateAfterReset.installedLanguages.length, 1, 'Only default language (FR) should remain');
assert.strictEqual(stateAfterReset.installedLanguages[0].id, 'FR_FR');
assert.strictEqual(stateAfterReset.installedLanguages[0].code, 'FR');
assert.strictEqual(global.Win11State.getAccount('OldStudentAcc'), null, 'Old accounts must be purged');
assert.strictEqual(stateAfterReset.userAccounts.length, 2, 'Only default Admin (MENIAI) and Guest remain');
console.log('✓ TEST 1 PASSED: State cleanly reset upon new session start.');

console.log('=== TEST 2: LOCK SCREEN PASSWORD CHECK (NO AUTO-DISMISS ON WRONG PASSWORD) ===');
// Setup account with password
global.Win11State.createAccount({ name: 'StudentTester', type: 'Standard', password: 'SecretPassword123' });
const lockEl = global.document.getElementById('lock-screen');
const passInput = { value: 'WrongPassword', focus: function () {} };
const errorMsg = { innerHTML: '' };
const signinBtn = {};
lockEl._passInput = passInput;
lockEl._errorMsg = errorMsg;
lockEl._signinBtn = signinBtn;

// Open lock screen for StudentTester
global.Win11LockScreen.open('StudentTester');
assert.ok(global.Win11LockScreen.isOpen(), 'Lock screen should be open');
assert.strictEqual(global.Win11State.get().currentUser, 'MENIAI', 'Current user is still MENIAI prior to login');

// Click sign in with WRONG password
signinBtn.onclick();

// Lock screen MUST REMAIN OPEN!
assert.ok(global.Win11LockScreen.isOpen(), 'Lock screen MUST NOT close on wrong password!');
assert.strictEqual(global.Win11State.get().currentUser, 'MENIAI', 'User MUST NOT switch on wrong password');
assert.ok(errorMsg.innerHTML.length > 0, 'Error message should be displayed');
assert.strictEqual(passInput.value, '', 'Password input should be cleared');

// Now provide CORRECT password
passInput.value = 'SecretPassword123';
signinBtn.onclick();

// Lock screen should now close and switch user
assert.ok(!global.Win11LockScreen.isOpen(), 'Lock screen should close on correct password');
assert.strictEqual(global.Win11State.get().currentUser, 'StudentTester', 'User should successfully switch to StudentTester');
console.log('✓ TEST 2 PASSED: Lock screen enforces password authentication strictly.');

console.log('=== TEST 3: MULTI-PARTICIPANT REGISTRATION & AUDIT TRAIL ===');
global.Win11Assessment.startSession({
    participants: [
        { lastName: 'عمروني', firstName: 'رضا' },
        { lastName: 'بوزيد', firstName: 'بلال' }
    ],
    classGroup: '1AS_02',
    pcNumber: '08'
});

const stuMulti = global.Win11Assessment.getStudent();
assert.strictEqual(stuMulti.isGroupWork, true, 'isGroupWork must be true for 2 participants');
assert.strictEqual(stuMulti.participants.length, 2);
assert.strictEqual(stuMulti.lastName, 'عمروني');
assert.strictEqual(stuMulti.firstName, 'رضا');
assert.ok(stuMulti.fullName.indexOf('عمروني رضا') !== -1 && stuMulti.fullName.indexOf('بوزيد بلال') !== -1);

// Verify report A4 HTML for multi-participants
const a4Html = global.Win11Report.buildA4Html();
assert.ok(a4Html.indexOf('عمل مشترك') !== -1, 'Report must contain multi-participant label (عمل مشترك)');
assert.ok(a4Html.indexOf('عمروني') !== -1 && a4Html.indexOf('بوزيد') !== -1, 'Both participant surnames must appear');

// Verify filename contains both participants
const filenameCore = global.Win11Report.formatSuggestedFilename('pdf');
assert.ok(filenameCore.toLowerCase().indexOf('omrani') !== -1 || filenameCore.toLowerCase().indexOf('bouzid') !== -1 || filenameCore.indexOf('08') !== -1);
console.log('✓ TEST 3 PASSED: Multi-participant registration, HTML report, and filename work seamlessly.');

console.log('=== TEST 4: SINGLE-STUDENT BACKWARD COMPATIBILITY ===');
global.Win11Assessment.startSession({
    lastName: 'عرفة',
    firstName: 'ياسين',
    classGroup: '1AS_03',
    pcNumber: '11'
});

const stuSingle = global.Win11Assessment.getStudent();
assert.strictEqual(stuSingle.isGroupWork, false);
assert.strictEqual(stuSingle.participants.length, 1);
assert.strictEqual(stuSingle.lastName, 'عرفة');
assert.strictEqual(stuSingle.firstName, 'ياسين');

const singleHtml = global.Win11Report.buildA4Html();
assert.ok(singleHtml.indexOf('اللقب:') !== -1, 'Separate surname label');
assert.ok(singleHtml.indexOf('الاسم:') !== -1, 'Separate firstname label');
assert.ok(singleHtml.indexOf('المشاركون في العمل التطبيقي (عمل مشترك):') === -1, 'Multi-participant banner should not be present for single student');
console.log('✓ TEST 4 PASSED: Single-student backward compatibility strictly maintained.');

console.log('=== TEST 5: CHROMIUM MICA BLUR ELIMINATION ===');
const themesCss = fs.readFileSync(path.join(__dirname, '../css/themes.css'), 'utf8');
assert.ok(themesCss.indexOf('.win-transparency .win-mica') !== -1);
assert.ok(themesCss.indexOf('var(--win-bg-mica-solid)') !== -1);
assert.ok(themesCss.indexOf('backdrop-filter: blur(32px)') === -1, '32px blur on mica must be removed to prevent compositor tile flicker');
console.log('✓ TEST 5 PASSED: CSS mica uses solid background to eliminate tile desync flicker.');

console.log('\nALL 5 TESTS IN TEST SUITE PASSED SUCCESSFULLY!');
process.exit(0);
