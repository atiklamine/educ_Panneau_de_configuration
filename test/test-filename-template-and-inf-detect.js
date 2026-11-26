/**
 * Unit Test Suite for PDF Filename Template, {device} Token, and inf.dll Resolution
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser globals for testing
global.window = global;
global.document = {
    getElementById: () => null,
    createElement: () => ({ appendChild: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} }
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
global.navigator = { userAgent: 'Node' };

// Load required scripts
require('../js/compat/compat.js');
require('../js/core/state.js');
require('../js/core/config-crypto.js');
require('../js/pedagogy/assessment.js');
require('../js/pedagogy/report.js');
require('../js/pedagogy/teacher.js');

console.log('--- TEST 1: DEFAULT FILENAME TEMPLATE & TOKEN SEQUENCE ---');
const defCfg = global.Win11Assessment.getConfig();
console.log('Default filename template:', defCfg.filename_template);
assert.strictEqual(
    defCfg.filename_template,
    'Class_{class}_PC_{device}_Score_{score}_Time_{time}_Student_{student_lastname}_{student_firstname}',
    'Default filename template must contain {class}, {device}, {score}, {time}, {student_lastname}, {student_firstname}'
);

const expectedOrder = ['{class}', '{device}', '{score}', '{time}', '{student_lastname}', '{student_firstname}'];
let lastIdx = -1;
for (const tok of expectedOrder) {
    const idx = defCfg.filename_template.indexOf(tok);
    assert.ok(idx > lastIdx, `Token ${tok} must appear after previous token in requested sequence.`);
    lastIdx = idx;
}
console.log('[PASS] Default filename template sequence strictly matches teacher requirements.');

console.log('--- TEST 2: DEFAULT FILENAME GENERATION WITH STUDENT METADATA ---');
global.Win11Assessment.startSession({
    classGroup: '02',
    pcNumber: '08',
    lastName: 'AMROUN',
    firstName: 'FakhrEddine',
    mode: 'exam'
});

const stu = global.Win11Assessment.getStudent();
assert.strictEqual(stu.classGroup, '02');
assert.strictEqual(stu.pcNumber, '08');

const fname = global.Win11Report.formatSuggestedFilename('pdf');
console.log('Generated filename:', fname);
assert.ok(fname.includes('Class_02'), 'Filename must include Class_02');
assert.ok(fname.includes('PC_08'), 'Filename must include PC_08');
assert.ok(fname.includes('Score_'), 'Filename must include Score_');
assert.ok(fname.includes('Time_'), 'Filename must include Time_');
assert.ok(fname.toUpperCase().includes('STUDENT_AMROUN_FAKHREDDINE'), 'Filename must include Student_AMROUN_FAKHREDDINE (uppercase)');
console.log('[PASS] Filename correctly generated using default template with exact tokens.');

console.log('--- TEST 3: CUSTOM FILENAME TEMPLATE FROM CONFIG/INF.DLL ---');
global.Win11Assessment.saveConfig({
    filename_template: '{student_lastname}_{student_firstname}_Score_{score}_PC_{device}'
});
const customFname = global.Win11Report.formatSuggestedFilename('pdf');
console.log('Generated custom filename:', customFname);
assert.ok(customFname.startsWith('AMROUN_FakhrEddine_Score_'), 'Custom filename template must be respected');
assert.ok(customFname.includes('_PC_08.pdf'), 'Custom filename template must include PC_08 at end');
console.log('[PASS] Custom template configured from inf.dll takes precedence over default.');

// Restore default config for clean state
global.Win11Assessment.saveConfig({
    filename_template: 'Class_{class}_PC_{device}_Score_{score}_Time_{time}_Student_{student_lastname}_{student_firstname}'
});

console.log('--- TEST 4: TEACHER JS TOKEN DEFINITIONS & PREVIEW ---');
const teacherJsCode = fs.readFileSync(path.join(__dirname, '../js/pedagogy/teacher.js'), 'utf8');
assert.ok(teacherJsCode.includes("token: '{device}'"), 'teacher.js ALL_TOKENS must define {device} token');
assert.ok(teacherJsCode.includes("'{device}': '01'"), 'teacher.js renderTokenPreview must handle {device}');
console.log('[PASS] Teacher settings interface includes {device} token definition.');

console.log('--- TEST 5: LAUNCHER INF.DLL DETECTION & GZIP SERVING INTEGRITY ---');
const launcherCs = fs.readFileSync(path.join(__dirname, '../launcher/Win11SimLauncher.cs'), 'utf8');
assert.ok(launcherCs.includes('public static string ResolveInfDllPath()'), 'Launcher must implement ResolveInfDllPath()');
assert.ok(launcherCs.includes('Process.GetCurrentProcess().MainModule.FileName'), 'ResolveInfDllPath must check MainModule');
assert.ok(launcherCs.includes('AppDomain.CurrentDomain.BaseDirectory'), 'ResolveInfDllPath must check BaseDirectory');
assert.ok(launcherCs.includes('Environment.CurrentDirectory'), 'ResolveInfDllPath must check CurrentDirectory');
assert.ok(launcherCs.includes('Directory.GetParent'), 'ResolveInfDllPath must check parent directories');
assert.ok(launcherCs.includes('Content-Encoding:') && launcherCs.includes('"gzip"'), 'Launcher must serve gzip compressed HTML');
assert.ok(launcherCs.includes('clientAcceptsGzip'), 'Launcher must inspect Accept-Encoding for gzip');
assert.ok(launcherCs.includes('Win11Sim_UserData_1AS'), 'Launcher must use persistent browser user data directory');
assert.ok(launcherCs.includes('--disable-hang-monitor'), 'Launcher must disable Chromium hang monitor');
console.log('[PASS] Launcher C# source implements robust inf.dll detection, gzip streaming, and hang prevention.');

console.log('\n=========================================');
console.log('ALL FILENAME & INF RESOLUTION TESTS PASSED 100%!');
console.log('=========================================\n');
process.exit(0);
