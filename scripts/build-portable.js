/**
 * Reproducible Zero-Dependency Single-File Build Script
 * Bundles HTML, CSS, JS, Icons, Trilingual i18n, Lazy Settings, and 15 Wallpapers
 * into a self-contained single HTML + GZip asset, then compiles Win11_Simulator_1AS.exe (.NET 3.5 / Win7+).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const DIST_DIR = path.join(ROOT, 'dist');

if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

function readUtf8(relPath) {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function escapeScriptClose(code) {
    // Prevent premature </script> termination inside inlined JS
    return code.replace(/<\/script>/gi, '<\\/script>');
}

const CSS_FILES = [
    'css/themes.css',
    'css/base.css',
    'css/rtl.css',
    'css/windows.css',
    'css/shell.css',
    'css/settings.css',
    'css/pedagogical.css'
];

const CORE_AND_APP_SCRIPTS = [
    'js/compat/compat.js',
    'assets/icons/icons.js',
    'js/i18n/ar.js',
    'js/i18n/fr.js',
    'js/i18n/en.js',
    'js/i18n/i18n.js',
    'js/core/session-manager.js',
    'js/core/state.js',
    'js/registry/settings-registry.js',
    'js/core/dialogs.js',
    'js/core/permission-gate.js',
    'js/core/snap-manager.js',
    'js/core/window-manager.js',
    'js/core/context-menu.js',
    'js/core/quick-settings.js',
    'js/core/notifications.js',
    'js/core/search.js',
    'js/core/start-menu.js',
    'js/core/task-view.js',
    'js/core/lock-screen.js',
    'js/core/taskbar.js',
    'js/apps/settings/settings-app.js',
    // Lazy-loaded Settings sections pre-bundled cleanly for single-file runtime
    'js/apps/settings/home.js',
    'js/apps/settings/system.js',
    'js/apps/settings/devices.js',
    'js/apps/settings/network.js',
    'js/apps/settings/personalization.js',
    'js/apps/settings/apps.js',
    'js/apps/settings/accounts.js',
    'js/apps/settings/time-language.js',
    'js/apps/settings/gaming.js',
    'js/apps/settings/accessibility.js',
    'js/apps/settings/privacy.js',
    'js/apps/settings/windows-update.js',
    'js/apps/control-panel.js',
    'js/apps/file-explorer.js',
    'js/apps/edge-browser.js',
    'js/core/config-crypto.js',
    'js/pedagogy/assessment.js',
    'js/pedagogy/hud.js',
    'js/pedagogy/teacher.js',
    'js/pedagogy/report.js',
    'js/core/boot.js'
];

const BG_FILES = fs.readdirSync(path.join(ROOT, 'bg')).sort();
const inlineBgMap = {};
for (const name of BG_FILES) {
    const ext = path.extname(name).toLowerCase();
    const mime = (ext === '.png') ? 'image/png' : 'image/jpeg';
    const b64 = fs.readFileSync(path.join(ROOT, 'bg', name)).toString('base64');
    inlineBgMap['bg/' + name] = 'data:' + mime + ';base64,' + b64;
}

const inlineImagesMap = {};
const aboutHeroPath = path.join(ROOT, 'assets', 'images', 'teacher_about.jpg');
if (fs.existsSync(aboutHeroPath)) {
    inlineImagesMap['assets/images/teacher_about.jpg'] =
        'data:image/jpeg;base64,' + fs.readFileSync(aboutHeroPath).toString('base64');
}

const cssBundle = CSS_FILES.map(f => '/* ' + f + ' */\n' + readUtf8(f)).join('\n\n');

const lazyPreMarkScript =
    '(function(){if(window.Win11Compat){' +
    CORE_AND_APP_SCRIPTS
        .filter(s => s.startsWith('js/apps/settings/') && s !== 'js/apps/settings/settings-app.js')
        .map(s => 'window.Win11Compat.markLoaded(' + JSON.stringify(s) + ');')
        .join('') +
    '}})();';

const scriptTags = [
    '<script>\nwindow.__WIN11_INLINE_BG__ = ' + JSON.stringify(inlineBgMap) + ';\nwindow.__WIN11_INLINE_IMAGES__ = ' + JSON.stringify(inlineImagesMap) + ';\n</script>'
];

for (const jsFile of CORE_AND_APP_SCRIPTS) {
    scriptTags.push('<script>\n/* ' + jsFile + ' */\n' + escapeScriptClose(readUtf8(jsFile)) + '\n</script>');
    if (jsFile === 'js/compat/compat.js') {
        scriptTags.push('<script>\n' + lazyPreMarkScript + '\n</script>');
    }
}

const indexRaw = readUtf8('index.html');
const bodyMatch = indexRaw.match(/<body[\s\S]*<\/body>/i);
if (!bodyMatch) throw new Error('Could not parse <body> from index.html');

const singleHtml =
    '<!DOCTYPE html>\n' +
    '<html lang="ar" dir="rtl">\n' +
    '<head>\n' +
    '    <meta charset="utf-8">\n' +
    '    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '    <title>محاكي وحدة لوحة التحكم (Windows 11) — المجال 1: بيئة التعامل مع الحاسوب (1AS)</title>\n' +
    '    <style>\n' + cssBundle + '\n    </style>\n' +
    '</head>\n' +
    bodyMatch[0].replace('</body>', scriptTags.join('\n') + '\n</body>') + '\n' +
    '</html>\n';

const outHtmlPath = path.join(DIST_DIR, 'Win11_Simulator_1AS.html');
const outGzPath = path.join(BUILD_DIR, 'Win11_Simulator_1AS.html.gz');
const outExePath = path.join(DIST_DIR, 'Win11_Simulator_1AS.exe');

fs.writeFileSync(outHtmlPath, singleHtml, 'utf8');
const gzBytes = zlib.gzipSync(Buffer.from(singleHtml, 'utf8'), { level: 9 });
fs.writeFileSync(outGzPath, gzBytes);

console.log('Single HTML written:', outHtmlPath, '(' + Math.round(singleHtml.length / 1024) + ' KB)');
console.log('GZip resource written:', outGzPath, '(' + Math.round(gzBytes.length / 1024) + ' KB)');

const cscCandidates = [
    'C:\\Windows\\Microsoft.NET\\Framework\\v3.5\\csc.exe',
    'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe'
];
const cscPath = cscCandidates.find(p => fs.existsSync(p));
if (!cscPath) throw new Error('No .NET csc.exe found to compile portable EXE');

const csSource = path.join(ROOT, 'launcher', 'Win11SimLauncher.cs');
const manifestPath = path.join(ROOT, 'launcher', 'app.manifest');
const cscArgs = [
    '/nologo',
    '/target:winexe',
    '/platform:anycpu',
    '/optimize+',
    '/utf8output',
    '/r:System.dll',
    '/r:System.Core.dll',
    '/r:System.Drawing.dll',
    '/r:System.Windows.Forms.dll'
];
if (fs.existsSync(manifestPath)) {
    cscArgs.push('/win32manifest:' + manifestPath);
}
cscArgs.push('/resource:' + outGzPath + ',Win11_Simulator_1AS.html.gz');
cscArgs.push('/out:' + outExePath);
cscArgs.push(csSource);

execFileSync(cscPath, cscArgs, { stdio: 'inherit' });

const exeStat = fs.statSync(outExePath);
console.log('Portable EXE compiled:', outExePath, '(' + (exeStat.size / (1024 * 1024)).toFixed(2) + ' MB)');

