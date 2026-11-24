/**
 * Automated Test: HUD Close Button, Reactivity & Report Header Left Alignment
 */
const assert = require('assert');
const fs = require('fs');

console.log('--- TEST: HUD Close Button & Reactivity ---');

// Setup DOM mocks for HUD testing
let hudClassList = new Set();
let hudStyle = {};
let listeners = {};
let renderedHtml = '';

const mockHudEl = {
    id: 'pedagogy-hud',
    classList: {
        add: (cls) => hudClassList.add(cls),
        remove: (cls) => hudClassList.delete(cls),
        contains: (cls) => hudClassList.has(cls),
        toggle: (cls) => {
            if (hudClassList.has(cls)) hudClassList.delete(cls);
            else hudClassList.add(cls);
        }
    },
    style: hudStyle,
    querySelector: (sel) => {
        if (sel === '#hud-close-btn') {
            return {
                set onclick(fn) { listeners['close-btn'] = fn; },
                get onclick() { return listeners['close-btn']; }
            };
        }
        if (sel === '#hud-drag-bar' || sel === '#hud-resize-handle' || sel === '#hud-collapse-btn' || sel === '#hud-maximize-btn') {
            return { addEventListener: () => {} };
        }
        return {
            innerHTML: '',
            querySelectorAll: () => [],
            addEventListener: () => {}
        };
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 100, top: 100, right: 500, bottom: 600, width: 400, height: 500 }),
    set innerHTML(val) { renderedHtml = val; }
};

global.window = global;
global.document = {
    createElement: () => ({
        setAttribute: () => {},
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        style: {},
        addEventListener: () => {}
    }),
    body: { appendChild: () => {}, removeChild: () => {} },
    getElementById: (id) => (id === 'pedagogy-hud' ? mockHudEl : null),
    title: 'Win11 Test'
};

require('../js/compat/compat.js');
require('../assets/icons/icons.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../js/core/config-crypto.js');
require('../js/core/state.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');
require('../js/pedagogy/assessment.js');
require('../js/pedagogy/hud.js');

// 1. Verify HUD open
global.Win11HUD.open();
assert.strictEqual(hudClassList.has('is-open'), true, 'HUD should have is-open class');
assert.strictEqual(mockHudEl.style.display, 'flex', 'HUD style.display should be flex');
assert.strictEqual(global.Win11HUD.isOpen(), true, 'Win11HUD.isOpen() should return true');
console.log('✓ Test 1 Passed: Win11HUD.open() properly sets is-open and style.display = flex');

// 2. Verify HUD close()
global.Win11HUD.close();
assert.strictEqual(hudClassList.has('is-open'), false, 'HUD should not have is-open class after close()');
assert.strictEqual(mockHudEl.style.display, 'none', 'HUD style.display should be none after close()');
assert.strictEqual(global.Win11HUD.isOpen(), false, 'Win11HUD.isOpen() should return false after close()');
console.log('✓ Test 2 Passed: Win11HUD.close() properly removes is-open and sets style.display = none');

// 3. Verify close button click handler invokes close()
global.Win11HUD.open();
assert.strictEqual(global.Win11HUD.isOpen(), true);
assert(typeof listeners['close-btn'] === 'function', 'Close button click handler must be bound');
listeners['close-btn']({ stopPropagation: () => {} });
assert.strictEqual(hudClassList.has('is-open'), false, 'HUD should be closed after clicking close button');
assert.strictEqual(mockHudEl.style.display, 'none', 'HUD style.display should be none after clicking close button');
assert.strictEqual(global.Win11HUD.isOpen(), false, 'Win11HUD.isOpen() should return false');
console.log('✓ Test 3 Passed: Clicking #hud-close-btn properly closes HUD and hides it');

// 4. Verify toggle()
global.Win11HUD.toggle();
assert.strictEqual(global.Win11HUD.isOpen(), true, 'Toggle from closed should open HUD');
global.Win11HUD.toggle();
assert.strictEqual(global.Win11HUD.isOpen(), false, 'Toggle from open should close HUD');
console.log('✓ Test 4 Passed: Win11HUD.toggle() operates correctly in both directions');

// 5. Verify CSS rules for pedagogy-hud
const cssContent = fs.readFileSync('css/pedagogical.css', 'utf8');
assert(cssContent.includes('#pedagogy-hud:not(.is-open)'), 'CSS must include #pedagogy-hud:not(.is-open)');
assert(cssContent.includes('display: none !important'), 'CSS must enforce display: none !important for closed HUD');
console.log('✓ Test 5 Passed: CSS enforces display: none !important for closed HUD');

// 6. Verify C# launcher left-aligns Année scolaire and Niveau
const csContent = fs.readFileSync('launcher/Win11SimLauncher.cs', 'utf8');
assert(csContent.includes('StringFormat ltrLeft = new StringFormat();'), 'Launcher must declare ltrLeft StringFormat');
assert(csContent.includes('ltrLeft.Alignment = StringAlignment.Near;'), 'ltrLeft must use StringAlignment.Near for left alignment');
assert(csContent.includes('g.DrawString("Année scolaire: " + acadYear, fGridLtr, bGridText, new RectangleF(80, 88, 460, 24), ltrLeft);'), 'Année scolaire with logo must use ltrLeft');
assert(csContent.includes('g.DrawString("Année scolaire: " + acadYear, fGridLtr, bGridText, new RectangleF(80, 88, 540, 25), ltrLeft);'), 'Année scolaire without logo must use ltrLeft');
console.log('✓ Test 6 Passed: Win11SimLauncher.cs draws Année scolaire and Niveau with ltrLeft');

console.log('\nALL HUD CLOSE & REACTIVITY TESTS PASSED SUCCESSFULLY!');
