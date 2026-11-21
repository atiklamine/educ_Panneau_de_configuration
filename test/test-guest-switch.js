/**
 * Test Guest Switch and Return to Admin (MENIAI)
 */
const assert = require('assert');

// DOM Mock
const elements = {};
function createMockEl(id, tag) {
    const el = {
        id: id || '',
        tagName: (tag || 'div').toUpperCase(),
        classList: {
            classes: new Set(),
            add: function (...cls) { cls.forEach(c => this.classes.add(c)); },
            remove: function (...cls) { cls.forEach(c => this.classes.delete(c)); },
            contains: function (c) { return this.classes.has(c); }
        },
        style: {
            setProperty: function () {},
            removeProperty: function () {}
        },
        attributes: {},
        setAttribute: function (k, v) { this.attributes[k] = String(v); },
        getAttribute: function (k) { return this.attributes[k] || null; },
        hasAttribute: function (k) { return k in this.attributes; },
        removeAttribute: function (k) { delete this.attributes[k]; },
        children: [],
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) {
            const idx = this.children.indexOf(c);
            if (idx !== -1) this.children.splice(idx, 1);
            c.parentNode = null;
            return c;
        },
        querySelector: function (sel) {
            if (sel.startsWith('#')) {
                const searchId = sel.slice(1);
                return findById(this, searchId);
            }
            return null;
        },
        querySelectorAll: function (sel) {
            const res = [];
            collectMatching(this, sel, res);
            return res;
        },
        addEventListener: function () {},
        removeEventListener: function () {},
        innerHTML: ''
    };
    if (id) elements[id] = el;
    return el;
}

function findById(node, id) {
    if (node.id === id) return node;
    for (let c of node.children) {
        let f = findById(c, id);
        if (f) return f;
    }
    return null;
}

function collectMatching(node, sel, res) {
    if (sel.startsWith('[') && sel.endsWith(']')) {
        const attr = sel.slice(1, -1);
        if (node.hasAttribute(attr)) res.push(node);
    }
    for (let c of node.children) {
        collectMatching(c, sel, res);
    }
}

global.window = global;
global.addEventListener = function () {};
global.removeEventListener = function () {};
global.document = {
    createElement: function (tag) { return createMockEl('', tag); },
    getElementById: function (id) {
        if (!elements[id]) elements[id] = createMockEl(id, 'div');
        return elements[id];
    },
    body: createMockEl('body', 'body'),
    documentElement: createMockEl('html', 'html')
};

// Setup DOM elements
createMockEl('windows-layer');
createMockEl('lock-screen');
createMockEl('desktop-root');

require('../js/compat/compat.js');
require('../assets/icons/icons.js');
require('../js/i18n/ar.js');
require('../js/i18n/fr.js');
require('../js/i18n/en.js');
require('../js/i18n/i18n.js');
require('../js/core/session-manager.js');
require('../js/core/state.js');
require('../js/core/window-manager.js');
require('../js/core/dialogs.js');
require('../js/core/permission-gate.js');
require('../js/core/lock-screen.js');
require('../js/apps/settings/settings-app.js');
require('../js/pedagogy/quiz-bank.js');
require('../js/pedagogy/quiz.js');
require('../js/pedagogy/assessment.js');

require('../js/apps/settings/accounts.js');
require('../js/apps/file-explorer.js');
require('../js/core/taskbar.js');
require('../js/pedagogy/hud.js');

console.log('Initial user:', global.Win11State.get().currentUser);
assert.strictEqual(global.Win11State.get().currentUser, 'MENIAI');

// Step 0: Open Settings to accounts page in MENIAI
console.log('Opening Settings to accounts page in MENIAI...');
global.Win11SettingsApp.openTo('accounts', 'main');

// Step 1: Enable Guest
console.log('Enabling Guest account...');
global.Win11State.toggleGuestEnabled(true);
const guestAcc = global.Win11State.getAccount('Invité');
assert.ok(guestAcc && guestAcc.enabled, 'Guest account must be enabled');

// Step 2: Switch to Guest
console.log('Switching to Guest account...');
global.Win11State.switchUser('Invité');
assert.strictEqual(global.Win11State.get().currentUser, 'Invité');
assert.strictEqual(global.Win11State.isCurrentGuest(), true);

// Step 3: Trigger Guest blocked action
console.log('Triggering Guest blocked action...');
global.Win11Permissions.guard('accounts.create', function () {
    throw new Error('Should not execute');
});
assert.strictEqual(global.Win11State.get().accountScenario.stepC, true);

// Step 4: Test switchUser('MENIAI') from Guest
console.log('Testing switchUser("MENIAI") from Guest with Settings open in MENIAI...');
try {
    global.Win11State.switchUser('MENIAI');
    console.log('SUCCESS: switchUser("MENIAI") returned without error!');
    console.log('Current user is now:', global.Win11State.get().currentUser);
    assert.strictEqual(global.Win11State.get().currentUser, 'MENIAI');
} catch (err) {
    console.error('ERROR in switchUser("MENIAI"):', err);
    throw err;
}


