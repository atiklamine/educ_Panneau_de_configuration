/**
 * Stage 5 End-to-End Verification:
 * - Isolated Single EXE (Win11_Simulator_1AS.exe copied to clean temp dir, zero external files)
 * - Missing inf.dll -> safe defaults -> first Ctrl+Shift+S creates encrypted v2 inf.dll
 * - Raw inf.dll hex & plaintext leakage checks
 * - Restart with encrypted inf.dll -> loads institution without password, Ctrl+Shift+S unlock & 5-attempt cooldown
 * - 1-bit inf.dll tamper detection -> refused load, Arabic security alert, safe defaults
 * - Self-contained Single HTML (dist/Win11_Simulator_1AS.html) over file:// check
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const EXE_SRC = path.join(ROOT, 'dist', 'Win11_Simulator_1AS.exe');
const HTML_SRC = path.join(ROOT, 'dist', 'Win11_Simulator_1AS.html');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class CdpClient {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.id = 1;
        this.pending = new Map();
        this.events = [];
        this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
        this.ws.onmessage = (ev) => {
            const m = JSON.parse(ev.data);
            if (m.id && this.pending.has(m.id)) {
                const { resolve, reject } = this.pending.get(m.id);
                this.pending.delete(m.id);
                if (m.error) reject(new Error(m.error.message));
                else resolve(m.result);
            } else if (m.method) this.events.push(m);
        };
    }
    send(method, params = {}) {
        const id = this.id++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }
    async eval(expression) {
        const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (res.exceptionDetails) throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
        return res.result ? res.result.value : undefined;
    }
    close() { try { this.ws.close(); } catch (e) {} }
}

async function openChrome(cdpPort, url) {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'win11-s5-chr-'));
    const chrome = spawn(CHROME_PATH, [
        '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
        `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userDataDir}`, '--window-size=1280,800', url
    ], { stdio: 'ignore' });
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
        await sleep(250);
        try {
            const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
            const page = list.find(t => t.type === 'page');
            if (page && page.webSocketDebuggerUrl) { wsUrl = page.webSocketDebuggerUrl; break; }
        } catch (e) {}
    }
    if (!wsUrl) throw new Error('Chrome failed to start for ' + url);
    const cdp = new CdpClient(wsUrl);
    await cdp.ready;
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Page.enable');
    await sleep(900);
    return {
        cdp,
        cleanup: () => {
            cdp.close();
            try { chrome.kill(); } catch (e) {}
            try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
        }
    };
}

async function main() {
    assert(fs.existsSync(EXE_SRC), 'Missing compiled EXE: ' + EXE_SRC);
    assert(fs.existsSync(HTML_SRC), 'Missing bundled single HTML: ' + HTML_SRC);

    // Part A: Test single-file HTML over file://
    const htmlUrl = 'file:///' + HTML_SRC.replace(/\\/g, '/');
    const htmlSession = await openChrome(9355, htmlUrl);
    try {
        await htmlSession.cdp.eval(`Win11SettingsApp.openTo('personalization', 'background')`);
        await sleep(700);
        const singleHtmlCheck = await htmlSession.cdp.eval(`(function(){
            var imgs = Array.from(document.querySelectorAll('.wallpaper-tile img'));
            var inlineMap = window.__WIN11_INLINE_BG__ || {};
            var pic13 = Win11State.resolveMediaUrl('bg/013.jpg');
            var pic14 = Win11State.resolveMediaUrl('bg/014.jpg');
            return {
                lang: document.documentElement.getAttribute('lang'),
                dir: document.documentElement.getAttribute('dir'),
                bgCount: imgs.length,
                bgLoaded: imgs.filter(function(im){ return im.complete && im.naturalWidth > 0; }).length,
                picturesInlineCount: (pic13.indexOf('data:image/') === 0 ? 1 : 0) + (pic14.indexOf('data:image/') === 0 ? 1 : 0),
                totalInlineAssets: Object.keys(inlineMap).length,
                hasCrypto: !!window.Win11Crypto
            };
        })()`);
        assert(singleHtmlCheck.lang === 'ar' && singleHtmlCheck.dir === 'rtl', 'Single HTML RTL failed');
        assert(singleHtmlCheck.bgCount === 13 && singleHtmlCheck.bgLoaded === 13 && singleHtmlCheck.picturesInlineCount === 2, 'Single HTML wallpapers failed: ' + JSON.stringify(singleHtmlCheck));
        assert(singleHtmlCheck.hasCrypto, 'Win11Crypto missing in single HTML');
        const errs = htmlSession.cdp.events.filter(e =>
            e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
        );
        assert(errs.length === 0, 'Console errors in single HTML: ' + JSON.stringify(errs));
        console.log('[PASS] Single HTML file:// bundle verified (13 gallery + 2 Pictures inline wallpapers decoded, 0 errors)');
    } finally {
        htmlSession.cleanup();
    }

    // Part B: Copy ONLY Win11_Simulator_1AS.exe to a completely isolated directory (zero sibling files)
    const isoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'win11-isolated-exe-'));
    const isoExe = path.join(isoDir, 'Win11_Simulator_1AS.exe');
    fs.copyFileSync(EXE_SRC, isoExe);

    const hostPort = 19445;
    const hostProc = spawn(isoExe, [`--port=${hostPort}`, '--no-browser'], {
        cwd: isoDir,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let exeReady = false;
    for (let i = 0; i < 40; i++) {
        await sleep(200);
        try {
            const r = await fetch(`http://127.0.0.1:${hostPort}/`);
            if (r.ok) { exeReady = true; break; }
        } catch (e) {}
    }
    assert(exeReady, 'Isolated EXE failed to answer on 127.0.0.1:' + hostPort);

    try {
        // B1: Teacher explicitly launches in Teacher Mode (--teacher / ?teacher=1) with NO inf.dll -> opens Teacher Settings Panel directly
        const filesBeforeSave = fs.readdirSync(isoDir);
        assert.deepStrictEqual(filesBeforeSave, ['Win11_Simulator_1AS.exe'], 'Unexpected files next to EXE: ' + filesBeforeSave);

        const s1 = await openChrome(9356, `http://127.0.0.1:${hostPort}/?teacher=1`);
        let first64Hex = '';
        try {
            // Section 1.1: EXE with NO inf.dll must automatically launch directly into Teacher Settings Panel (no password prompt!)
            await sleep(250);
            const missingState = await s1.cdp.eval(`({
                infStatus: Win11Assessment.getInfStatus(),
                inst: Win11Assessment.getConfig().institution_name,
                hasPasswordInCfg: ('password' in Win11Assessment.getConfig()),
                autoOpenedTeacherPanel: !!document.getElementById('tc-inst') && !!document.getElementById('tc-setup-pass1') && !document.getElementById('teacher-auth-pass')
            })`);
            assert(missingState.infStatus.status === 'missing', 'Expected missing status: ' + JSON.stringify(missingState));
            assert(missingState.inst === 'ثانوية الشهيد أحمد رضا حوحو', 'Safe defaults mismatch');
            assert(missingState.hasPasswordInCfg === false, 'Password must NEVER sit inside runtime config!');
            assert(missingState.autoOpenedTeacherPanel === true, 'Missing inf.dll must auto-open Teacher Settings Panel directly: ' + JSON.stringify(missingState));
            console.log('[PASS] Isolated EXE without inf.dll auto-opens Teacher Panel directly with safe defaults & zero external files');

            // Teacher enters password + institution and clicks Save -> writes inf.dll beside EXE and exits to Student Form
            await s1.cdp.eval(`
                document.getElementById('tc-setup-pass1').value = 'Prof1AS#2026';
                document.getElementById('tc-setup-pass2').value = 'Prof1AS#2026';
                document.getElementById('tc-inst').value = 'ثانوية الاختبار المشفرة';
                document.getElementById('tc-save-btn').click();
            `);
            await sleep(900);
            const exitedToStudentForm = await s1.cdp.eval(`!document.getElementById('tc-inst') && !!document.getElementById('stu-reg-lastname') && !!document.getElementById('stu-reg-firstname')`);
            assert(exitedToStudentForm, 'Saving Teacher Panel when inf.dll missing should exit settings & open Student Form');
        } finally {
            s1.cleanup();
        }

        // Verify STRICTLY ONLY EXE + inf.dll exist beside EXE, and inspect raw encrypted bytes
        const filesAfterSave = fs.readdirSync(isoDir).sort();
        assert.deepStrictEqual(filesAfterSave, ['Win11_Simulator_1AS.exe', 'inf.dll'], 'Sidecar mismatch: ' + filesAfterSave);
        const infPath = path.join(isoDir, 'inf.dll');
        const rawInf = fs.readFileSync(infPath);
        first64Hex = Array.from(rawInf.subarray(0, 64)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        assert(rawInf.slice(0, 5).toString('ascii') === 'W11S\x02', 'Expected W11S v2 encrypted header');
        assert(!rawInf.includes(Buffer.from('Prof1AS#2026')), 'Password leaked in inf.dll!');
        assert(!rawInf.includes(Buffer.from('ثانوية الاختبار المشفرة', 'utf8')), 'Plaintext Arabic leaked in inf.dll!');
        assert(!rawInf.includes(Buffer.from('institution_name')), 'Plaintext JSON key leaked in inf.dll!');
        console.log('[PASS] Encrypted inf.dll written beside EXE; zero plaintext/passwords leaked');
        console.log('RAW_INF_FIRST_64_HEX:', first64Hex);

        // B2: Reopen simulator WITH encrypted inf.dll -> loads silently (NO teacher prompt) straight to Student Form; Ctrl+Shift+S prompts & verifies cooldown
        const s2 = await openChrome(9357, `http://127.0.0.1:${hostPort}/`);
        try {
            await sleep(250);
            const loadedState = await s2.cdp.eval(`({
                infStatus: Win11Assessment.getInfStatus(),
                inst: Win11Assessment.getConfig().institution_name,
                hasPassInDomOrCfg: ('password' in Win11Assessment.getConfig()),
                noTeacherPassOnStart: !document.getElementById('teacher-auth-pass') && !document.getElementById('tc-inst'),
                studentFormOpen: !!document.getElementById('stu-reg-lastname') && !!document.getElementById('stu-reg-firstname')
            })`);
            assert(loadedState.infStatus.status === 'loaded' && loadedState.infStatus.format === 'v2', JSON.stringify(loadedState));
            assert(loadedState.inst === 'ثانوية الاختبار المشفرة', 'Loaded encrypted institution mismatch: ' + loadedState.inst);
            assert(loadedState.hasPassInDomOrCfg === false, 'Password exposed in loaded config');
            assert(loadedState.noTeacherPassOnStart && loadedState.studentFormOpen, 'Expected direct silent student launch with Student Info Form: ' + JSON.stringify(loadedState));

            // Ctrl+Shift+S -> check zero hint + 5 wrong attempts triggers cooldown
            await s2.cdp.eval(`
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'S', code: 'KeyS', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true }));
            `);
            await sleep(250);
            const promptText = await s2.cdp.eval(`document.querySelector('#dialog-backdrop .win-dialog').textContent`);
            assert(promptText.indexOf('admin123') === -1, 'Password hint leaked in prompt!');

            for (let attempt = 1; attempt <= 5; attempt++) {
                await s2.cdp.eval(`
                    document.getElementById('teacher-auth-pass').value = 'wrong_${attempt}';
                    document.querySelector('#dialog-backdrop .win-btn-accent').click();
                `);
                await sleep(300);
            }
            const cooldownText = await s2.cdp.eval(`document.getElementById('teacher-auth-err').textContent`);
            assert(cooldownText.indexOf('s') !== -1, '5 failed attempts should trigger cooldown timer: ' + cooldownText);
            console.log('[PASS] Encrypted inf.dll auto-loaded, zero password hints, and 5-attempt cooldown enforced');
        } finally {
            s2.cleanup();
        }

        // B2b: Valid unlock works cleanly in fresh launch
        const s2b = await openChrome(9358, `http://127.0.0.1:${hostPort}/`);
        try {
            await s2b.cdp.eval(`
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'S', code: 'KeyS', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true }));
            `);
            await sleep(250);
            await s2b.cdp.eval(`
                document.getElementById('teacher-auth-pass').value = 'Prof1AS#2026';
                document.querySelector('#dialog-backdrop .win-btn-accent').click();
            `);
            await sleep(600);
            const panelOpen = await s2b.cdp.eval(`!!document.getElementById('tc-inst') && document.getElementById('tc-inst').value === 'ثانوية الاختبار المشفرة'`);
            assert(panelOpen, 'Valid teacher password failed to decrypt & open Teacher Panel');
            console.log('[PASS] Valid teacher password decrypts inf.dll vault and opens Teacher Panel');
        } finally {
            s2b.cleanup();
        }

        // B3: Tamper 1 bit inside inf.dll -> EXE refuses tampered config, warns in Arabic, restores safe defaults
        const tamperedBytes = fs.readFileSync(infPath);
        tamperedBytes[90] ^= 0x55;
        fs.writeFileSync(infPath, tamperedBytes);

        const s3 = await openChrome(9359, `http://127.0.0.1:${hostPort}/`);
        try {
            await sleep(300);
            const tamperState = await s3.cdp.eval(`({
                infStatus: Win11Assessment.getInfStatus(),
                inst: Win11Assessment.getConfig().institution_name,
                dlgOpen: Win11Dialogs.isOpen()
            })`);
            assert(tamperState.infStatus.status === 'tampered', 'Expected tampered status: ' + JSON.stringify(tamperState));
            assert(tamperState.inst === 'ثانوية الشهيد أحمد رضا حوحو', 'Tampered inf.dll must fall back to safe defaults');
            assert(tamperState.dlgOpen === true, 'Expected Arabic security tamper warning dialog on startup');
            console.log('[PASS] 1-bit inf.dll tamper detected, refused, Arabic alert shown, and safe defaults active');
        } finally {
            s3.cleanup();
        }
    } finally {
        try { hostProc.kill(); } catch (e) {}
        await sleep(300);
        try { fs.rmSync(isoDir, { recursive: true, force: true }); } catch (e) {}
    }

    console.log('\n=== STAGE 5 PORTABLE & ENCRYPTION VERIFICATION COMPLETE ===');
}

main().catch(err => {
    console.error('STAGE 5 FAILED:', err);
    process.exit(1);
});

