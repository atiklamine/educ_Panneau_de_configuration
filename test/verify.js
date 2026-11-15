/**
 * Automated Headless Chrome CDP End-to-End Verification Harness (file:// protocol)
 * Verifies Stages 3-8: console errors, RTL chrome geometry, multi-path registry,
 * all 12 lazy Settings pages, UAC account rules, snap/multi-window/1024x768,
 * zoom 200%, and captures real visual screenshots.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROJECT_DIR = path.resolve(__dirname, '..');
const INDEX_URL = 'file:///' + path.join(PROJECT_DIR, 'index.html').replace(/\\/g, '/');
const SHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class CdpClient {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.id = 1;
        this.pending = new Map();
        this.events = [];
        this.ready = new Promise((resolve, reject) => {
            this.ws.onopen = resolve;
            this.ws.onerror = reject;
        });
        this.ws.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(msg.error.message));
                else resolve(msg.result);
            } else if (msg.method) {
                this.events.push(msg);
            }
        };
    }
    send(method, params = {}) {
        const id = this.id++;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                if (this.pending.has(id)) {
                    this.pending.delete(id);
                    reject(new Error('CDP timeout on ' + method));
                }
            }, 12000);
            this.pending.set(id, {
                resolve: (v) => { clearTimeout(timer); resolve(v); },
                reject: (e) => { clearTimeout(timer); reject(e); }
            });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }
    async eval(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
    }
    async shot(filename) {
        const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(SHOT_DIR, filename), Buffer.from(data, 'base64'));
    }
    close() {
        try { this.ws.close(); } catch (e) {}
    }
}

async function main() {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'win11-cdp-'));
    const port = 9333;
    const chrome = spawn(CHROME_PATH, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--allow-file-access-from-files',
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${userDataDir}`,
        '--window-size=1280,800',
        INDEX_URL
    ], { stdio: 'ignore' });

    const errors = [];
    const results = [];
    const assert = (name, cond, detail = '') => {
        results.push({ name, pass: !!cond, detail });
        if (!cond) console.error('FAIL:', name, detail);
    };

    try {
        let targets = null;
        for (let i = 0; i < 30; i++) {
            await sleep(250);
            try {
                const resp = await fetch(`http://127.0.0.1:${port}/json/list`);
                const list = await resp.json();
                const page = list.find(t => t.type === 'page');
                if (page && page.webSocketDebuggerUrl) { targets = page; break; }
            } catch (e) {}
        }
        if (!targets) throw new Error('Chrome CDP failed to start');

        const cdp = new CdpClient(targets.webSocketDebuggerUrl);
        await cdp.ready;
        await cdp.send('Runtime.enable');
        await cdp.send('Log.enable');
        await cdp.send('Page.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1280, height: 800, deviceScaleFactor: 1, mobile: false
        });

        await sleep(950);

        // Section 1.1 & Section 3: With missing inf.dll on file://, startup opens Teacher Setup Panel -> closing launches non-skippable Student Registration Form with timer paused at 00:00:00
        const startupSetupState = await cdp.eval(`({
            teacherOpenOnMissing: !!document.getElementById('tc-inst') && !!document.getElementById('tc-setup-pass1'),
            infMissing: Win11Assessment.getInfStatus().status === 'missing'
        })`);
        assert('Startup with missing inf.dll opens Teacher Settings Panel directly',
            startupSetupState.teacherOpenOnMissing && startupSetupState.infMissing, JSON.stringify(startupSetupState));

        await cdp.eval(`Win11Dialogs.close(false)`);
        await sleep(200);
        await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
        await sleep(150);
        const mandatoryStudentForm = await cdp.eval(`({
            hasLastName: !!document.getElementById('stu-reg-lastname'),
            hasFirstName: !!document.getElementById('stu-reg-firstname'),
            hasRadios: document.querySelectorAll('input[name="stu-reg-mode"]').length === 2,
            stillOpenAfterEsc: Win11Dialogs.isOpen(),
            preSubmitTimerZero: Win11Assessment.getStudent().elapsedSeconds === 0 && !Win11Assessment.getStudent().activeSession
        })`);
        assert('Mandatory Student Info Form collects last/first name + radios, blocks Escape & holds timer at 00:00:00 until submit',
            mandatoryStudentForm.hasLastName && mandatoryStudentForm.hasFirstName && mandatoryStudentForm.hasRadios && mandatoryStudentForm.stillOpenAfterEsc && mandatoryStudentForm.preSubmitTimerZero,
            JSON.stringify(mandatoryStudentForm));

        // Submit mandatory student form and close HUD temporarily for clean desktop screenshot & right-click checks
        await cdp.eval(`
            document.getElementById('stu-reg-lastname').value = 'BENALI';
            document.getElementById('stu-reg-firstname').value = 'Mohammed';
            document.getElementById('stu-reg-submit-btn').click();
            if (document.getElementById('hud-close-btn')) document.getElementById('hud-close-btn').click();
        `);
        await sleep(200);

        // Collect console errors / exceptions
        for (const ev of cdp.events) {
            if (ev.method === 'Runtime.exceptionThrown') {
                errors.push('Exception: ' + JSON.stringify(ev.params.exceptionDetails.text));
            } else if (ev.method === 'Log.entryAdded' && ev.params.entry.level === 'error') {
                errors.push('LogError: ' + ev.params.entry.text);
            }
        }

        // 1. Arabic Default & Document Direction
        const docMeta = await cdp.eval(`({
            lang: document.documentElement.getAttribute('lang'),
            dir: document.documentElement.getAttribute('dir'),
            charset: document.characterSet,
            lineHeight: getComputedStyle(document.body).lineHeight,
            fontFamily: getComputedStyle(document.body).fontFamily,
            taskbarHeight: document.getElementById('taskbar').getBoundingClientRect().height,
            iconCount: document.querySelectorAll('#desktop-icons .desktop-icon').length,
            bgImage: document.getElementById('desktop-root').style.backgroundImage
        })`);
        assert('Default UI is Arabic RTL', docMeta.lang === 'ar' && docMeta.dir === 'rtl', JSON.stringify(docMeta));
        assert('UTF-8 Charset verified', docMeta.charset.toUpperCase() === 'UTF-8', docMeta.charset);
        assert('Tahoma fallback included for Win7 Arabic', docMeta.fontFamily.toLowerCase().includes('tahoma'), docMeta.fontFamily);
        assert('Taskbar exact height 48px', Math.round(docMeta.taskbarHeight) === 48, docMeta.taskbarHeight);
        assert('Desktop uses bg/000.jpg default', docMeta.bgImage.includes('bg/000.jpg'), docMeta.bgImage);

        // 2. Capture Desktop RTL Screenshot
        await cdp.shot('01_desktop_ar_rtl.png');

        // 2b. Verify Non-Blocking HUD Hint + Real Browser Right-Click Context Menu on Desktop
        await cdp.eval(`
            window.__lastCtxDefaultPrevented = null;
            document.addEventListener('contextmenu', function(ev) { window.__lastCtxDefaultPrevented = ev.defaultPrevented; });
            Win11HUD.open();
            document.getElementById('hud-hint-btn').click();
        `);
        await sleep(200);
        const hintState = await cdp.eval(`({
            inlineHintVisible: !!document.getElementById('hud-inline-hint'),
            dialogBlocking: Win11Dialogs.isOpen()
        })`);
        assert('HUD Hint opens inline without blocking desktop', hintState.inlineHintVisible && !hintState.dialogBlocking, JSON.stringify(hintState));

        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 600, y: 350, button: 'right', clickCount: 1 });
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 600, y: 350, button: 'right', clickCount: 1 });
        await sleep(250);
        const ctxState = await cdp.eval(`({
            open: document.getElementById('context-menu').classList.contains('is-open'),
            items: document.querySelectorAll('#context-menu .ctx-item').length,
            hasPersonalize: document.getElementById('context-menu').textContent.indexOf('تخصيص') !== -1,
            preventedNative: window.__lastCtxDefaultPrevented
        })`);
        assert('Real right-click opens Windows 11 Desktop Context Menu & blocks native browser menu', ctxState.open && ctxState.items >= 6 && ctxState.hasPersonalize && ctxState.preventedNative, JSON.stringify(ctxState));
        await cdp.shot('05_desktop_context_menu_ar_rtl.png');

        // Right-click inside HUD / Window never leaks browser context menu
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 250, y: 120, button: 'right', clickCount: 1 });
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 250, y: 120, button: 'right', clickCount: 1 });
        await sleep(150);
        const hudRightClickPrevented = await cdp.eval(`window.__lastCtxDefaultPrevented === true`);
        assert('Right-click inside HUD/Chrome suppresses native browser menu', hudRightClickPrevented);
        await cdp.eval(`document.getElementById('hud-close-btn').click(); Win11ContextMenu.hide();`);
        await sleep(150);

        // 3. Test Start Menu & Live Search & Multi-Path Navigation
        await cdp.eval(`document.getElementById('tb-start-btn').click()`);
        await sleep(250);
        const startOpen = await cdp.eval(`document.getElementById('start-menu-flyout').classList.contains('is-open')`);
        assert('Start Menu opens on click', startOpen);
        await cdp.shot('02_start_menu_ar_rtl.png');

        // Search -> "الفأرة"
        await cdp.eval(`Win11Search.open('الفأرة')`);
        await sleep(250);
        const searchMatches = await cdp.eval(`document.querySelectorAll('#win-search-results [data-setting-id]').length`);
        assert('Search returns matches for الفأرة', searchMatches > 0, searchMatches);
        await cdp.eval(`document.querySelector('#win-search-results [data-setting-id="devices.mouse"]').click()`);
        await sleep(500);

        // 4. Inspect Settings Window RTL Chrome Geometry + Lazy-loaded section
        const settingsGeom = await cdp.eval(`(function(){
            var win = document.querySelector('[data-win-id="win-settings"]');
            var title = win.querySelector('.win-titlebar-title').getBoundingClientRect();
            var controls = win.querySelector('.win-titlebar-controls').getBoundingClientRect();
            var closeBtn = win.querySelector('.win-caption-btn.is-close').getBoundingClientRect();
            var minBtn = win.querySelector('[data-cap="min"]').getBoundingClientRect();
            var sidebar = win.querySelector('.settings-sidebar').getBoundingClientRect();
            var main = win.querySelector('.settings-main').getBoundingClientRect();
            return {
                winOpen: !!win,
                controlsLeftOfTitle: controls.right <= title.left + 2,
                closeOutermostLeft: closeBtn.left < minBtn.left,
                sidebarOnRightInRtl: sidebar.left >= main.right - 2,
                titleBarHeight: win.querySelector('.win-titlebar').getBoundingClientRect().height,
                mouseSectionRendered: !!document.getElementById('ctrl-mouse-speed')
            };
        })()`);
        assert('Settings window opened via Search -> devices.mouse', settingsGeom.winOpen && settingsGeom.mouseSectionRendered, JSON.stringify(settingsGeom));
        assert('RTL Window Chrome controls on TOP-LEFT, Close outermost', settingsGeom.controlsLeftOfTitle && settingsGeom.closeOutermostLeft, JSON.stringify(settingsGeom));
        assert('RTL Settings Sidebar mirrored to RIGHT side', settingsGeom.sidebarOnRightInRtl, JSON.stringify(settingsGeom));
        assert('Title Bar height is 32px', Math.round(settingsGeom.titleBarHeight) === 32, settingsGeom.titleBarHeight);

        // Navigate through all 12 Settings sections (triggers every lazy-load module over file://)
        const sectionsToLoad = ['home','system','devices','network','personalization','apps','accounts','timeLanguage','gaming','accessibility','privacy','update'];
        for (const sec of sectionsToLoad) {
            await cdp.eval(`Win11SettingsApp.openTo('${sec}', 'main')`);
            await sleep(250);
        }
        await cdp.eval(`Win11SettingsApp.openTo('personalization', 'background')`);
        await sleep(900);
        const wpInfo = await cdp.eval(`(function(){
            var imgs = Array.from(document.querySelectorAll('.wallpaper-tile img'));
            var hasBrowseBtn = !!document.getElementById('btn-browse-wallpaper');
            return {
                count: imgs.length,
                loaded: imgs.filter(function(im){ return im.complete && im.naturalWidth > 0; }).length,
                hasBrowseBtn: hasBrowseBtn,
                navBackTransform: getComputedStyle(document.querySelector('.win-nav-back svg')).transform
            };
        })()`);
        assert('Built-in 13 wallpapers (bg/000..012) decoded & Browse Photos button present in Personalization',
            wpInfo.count === 13 && wpInfo.loaded === 13 && wpInfo.hasBrowseBtn, JSON.stringify(wpInfo));
        assert('RTL Back arrow mirrored cleanly via CSS transform', wpInfo.navBackTransform && wpInfo.navBackTransform !== 'none', wpInfo.navBackTransform);
        await cdp.shot('03_settings_personalization_ar_rtl.png');

        // Section 2: Test Personalization > Browse > File Picker -> wrong file error -> Pictures > Sahara_Sunset.jpg
        await cdp.eval(`document.getElementById('btn-browse-wallpaper').click()`);
        await sleep(250);
        await cdp.eval(`
            var docFile = document.querySelector('[data-user-file="doc_tp_1as"]');
            if (docFile) docFile.click();
        `);
        await sleep(120);
        await cdp.eval(`document.getElementById('pk-confirm-btn').click()`);
        await sleep(150);
        const wrongPickCheck = await cdp.eval(`({
            errMsg: document.getElementById('pk-error-msg') ? document.getElementById('pk-error-msg').textContent : '',
            mistakesCount: Win11Assessment.getMistakes().length
        })`);
        await cdp.eval(`document.querySelector('[data-pk-nav="pictures"]').click()`);
        await sleep(180);
        await cdp.eval(`
            var pic = document.querySelector('[data-user-file="pic_sahara"]');
            if (pic) pic.click();
        `);
        await sleep(120);
        await cdp.eval(`document.getElementById('pk-confirm-btn').click()`);
        await sleep(200);
        const picPickOk = await cdp.eval(`({
            wpId: Win11State.get().wallpaperId,
            deskBg: document.getElementById('desktop-root').style.backgroundImage,
            folderMeta: Win11State.get().wallpaperBrowseMeta ? Win11State.get().wallpaperBrowseMeta.selectedFolder : null
        })`);
        assert('Section 2 Browse Picker logs mistake on non-image & sets C:\\Users\\...\\Pictures\\Sahara_Sunset.jpg',
            wrongPickCheck.mistakesCount > 0 && picPickOk.wpId === 'pic_sahara' && picPickOk.folderMeta === 'pictures' && picPickOk.deskBg.indexOf('013.jpg') !== -1,
            JSON.stringify({ wrongPickCheck: wrongPickCheck, picPickOk: picPickOk }));

        // Restore default bg_00 after browse test so downstream isolation tests start cleanly
        await cdp.eval(`Win11State.setUserWallpaper('bg_00')`);

        // 5. Open Control Panel, Explorer, Edge, Quick Settings & Dark Mode
        await cdp.eval(`Win11ControlPanel.open(); Win11Explorer.open(); Win11Edge.open();`);
        await sleep(300);
        const multiWinCount = await cdp.eval(`Win11WM.getAllWindows().length`);
        assert('Multi-window opens cleanly (4 concurrent windows)', multiWinCount === 4, multiWinCount);

        // Multi-path parity test: Control Panel -> Accounts + verify accented BiDi <bdi>Invité</bdi>
        await cdp.eval(`document.querySelector('[data-win-id="win-control-panel"] [data-cp-target="accounts.users"]').click()`);
        await sleep(300);
        const accCheck = await cdp.eval(`(function(){
            var list = document.getElementById('ctrl-accounts-list');
            return {
                loaded: !!list,
                inviteIntact: list ? list.innerHTML.indexOf('<bdi dir="ltr">Invité</bdi>') !== -1 : false
            };
        })()`);
        assert('Multi-path Control Panel -> Accounts opens same Settings route', accCheck.loaded);
        assert('Mixed accented French word Invité isolated intact in <bdi dir="ltr">', accCheck.inviteIntact, JSON.stringify(accCheck));

        // Test Quick Settings Dark Mode Toggle stays open & updates theme + Tray Notifications
        await cdp.eval(`Win11QuickSettings.open()`);
        await sleep(250);
        await cdp.eval(`document.querySelector('[data-qt-main="theme"]').click()`);
        await sleep(250);
        const darkState = await cdp.eval(`({
            dark: document.documentElement.getAttribute('data-theme') === 'dark',
            qsStillOpen: Win11QuickSettings.isOpen()
        })`);
        assert('Quick Settings toggles Dark Mode & remains open after click', darkState.dark && darkState.qsStillOpen, JSON.stringify(darkState));
        await cdp.shot('04_quick_settings_dark_rtl.png');
        // Switch back to Light mode cleanly
        await cdp.eval(`document.querySelector('[data-qt-main="theme"]').click(); Win11QuickSettings.close();`);
        await sleep(150);

        await cdp.eval(`Win11Notifications.open()`);
        await sleep(200);
        const calRendered = await cdp.eval(`document.querySelectorAll('.calendar-day').length >= 28`);
        assert('Notification Center + Monthly Calendar renders cleanly', calRendered);
        await cdp.eval(`Win11Notifications.close()`);

        // 6. Test Accounts UAC Rules & Pedagogical Assessment Engine (20/20 test)
        const uacResult = await cdp.eval(`(function(){
            // Cannot delete Guest or last Admin
            var guest = Win11State.getAccount('Invité');
            var admin = Win11State.getAccount('MENIAI');
            var delGuest = Win11State.canDeleteAccount(guest);
            var delLastAdmin = Win11State.canDeleteAccount(admin);
            // Switch to Guest and verify Guest cannot add/manage accounts
            Win11State.update(function(d){ guest.enabled = true; });
            Win11State.switchUser('Invité');
            var isGuest = Win11State.isCurrentGuest();
            var guestIsAdmin = Win11State.isCurrentAdmin();
            Win11State.switchUser('MENIAI');
            return { delGuestOk: delGuest.ok, delLastAdminOk: delLastAdmin.ok, isGuest: isGuest, guestIsAdmin: guestIsAdmin };
        })()`);
        assert('UAC prevents deleting Guest or last Administrator', !uacResult.delGuestOk && !uacResult.delLastAdminOk, JSON.stringify(uacResult));
        assert('Guest session correctly restricted from Admin rights', uacResult.isGuest && !uacResult.guestIsAdmin, JSON.stringify(uacResult));

        // 6b. Stage 3 End-to-End Tests: Complete Session Isolation, Ephemeral Guest & UI UAC Gates
        await cdp.eval(`Win11State.reset(); Win11WM.syncSession(); Win11HUD.refresh();`);
        await sleep(200);

        // Switch User Complete Isolation (User A -> User B -> User A)
        await cdp.eval(`
            Win11State.update(function(d){
                d.userAccounts.push({ name: 'Eleve', type: 'Standard', hasPassword: false, password: '', enabled: true, customAvatar: true, color: '#107C41' });
                d.userAccounts.find(function(a){ return a.type === 'Invité'; }).enabled = true;
            }, 'users:changed');
            Win11SettingsApp.openTo('personalization', 'background');
            Win11Explorer.open('documents');
        `);
        await sleep(450);
        await cdp.eval(`
            Win11State.set({ themeMode: 'dark' }, 'theme:changed');
            Win11State.setUserWallpaper('bg_03');
            Win11State.update(function(d){
                var p = d.userApps.find(function(x){ return x.id === 'u_paint'; });
                if (p) p.installed = true;
                d.userFiles.push({ id: 'a_secret', name: 'Secret_MENIAI.txt', folder: 'documents', content: 'A' });
            }, 'userapps:changed');
            Win11State.switchUser('Eleve');
        `);
        await sleep(300);
        const userBView = await cdp.eval(`(function(){
            var wins = document.querySelectorAll('#windows-layer .win-window').length;
            var st = Win11State.get();
            var paintB = st.userApps.find(function(x){ return x.id === 'u_paint'; });
            var hasSecret = st.userFiles.some(function(f){ return f.id === 'a_secret'; });
            return {
                winsInDom: wins,
                theme: st.themeMode,
                wallpaper: st.wallpaperId,
                paintInstalled: paintB ? paintB.installed : null,
                hasSecretFile: hasSecret
            };
        })()`);
        assert('Switch User A -> B isolates windows, theme, wallpaper, userApps & userFiles',
            userBView.winsInDom === 0 && userBView.theme === 'light' && userBView.wallpaper === 'bg_00' && userBView.paintInstalled === false && userBView.hasSecretFile === false,
            JSON.stringify(userBView));

        // Open Control Panel & click Uninstall as Standard Eleve -> opens UAC elevation modal
        await cdp.eval(`Win11SettingsApp.openTo('apps', 'main')`);
        await sleep(350);
        await cdp.eval(`
            var btn = document.querySelector('#ctrl-apps-list .setting-row button');
            if (btn) btn.click();
        `);
        await sleep(250);
        const standardUacOpened = await cdp.eval(`({
            uacAdminSelectPresent: !!document.getElementById('uac-admin-select'),
            dlgOpen: Win11Dialogs.isOpen()
        })`);
        assert('Standard user clicking Uninstall triggers UAC Admin Elevation dialog',
            standardUacOpened.uacAdminSelectPresent && standardUacOpened.dlgOpen, JSON.stringify(standardUacOpened));
        await cdp.eval(`Win11Dialogs.close(false)`);
        await sleep(150);

        // Switch User B -> User A restores A's open windows, theme, wallpaper, userApps & userFiles
        await cdp.eval(`Win11State.switchUser('MENIAI')`);
        await sleep(300);
        const userARestored = await cdp.eval(`(function(){
            var wins = document.querySelectorAll('#windows-layer .win-window').length;
            var st = Win11State.get();
            var paintA = st.userApps.find(function(x){ return x.id === 'u_paint'; });
            var hasSecret = st.userFiles.some(function(f){ return f.id === 'a_secret'; });
            var settingsRestored = !!document.querySelector('[data-win-id="win-settings"] #ctrl-wallpaper-grid');
            return {
                winsInDom: wins,
                settingsRestored: settingsRestored,
                theme: st.themeMode,
                wallpaper: st.wallpaperId,
                paintInstalled: paintA ? paintA.installed : null,
                hasSecretFile: hasSecret
            };
        })()`);
        assert('Switch back to User A restores windows, dark theme, wallpaper, userApps & userFiles',
            userARestored.winsInDom === 2 && userARestored.settingsRestored && userARestored.theme === 'dark' && userARestored.wallpaper === 'bg_03' && userARestored.paintInstalled === true && userARestored.hasSecretFile === true,
            JSON.stringify(userARestored));

        // Guest Restriction Tests + Screenshot
        await cdp.eval(`
            Win11State.switchUser('Invité');
            Win11SettingsApp.openTo('apps', 'main');
        `);
        await sleep(350);
        const beforeGuestMistakes = await cdp.eval(`Win11Assessment.getMistakes().length`);
        await cdp.eval(`
            var btn = document.querySelector('#ctrl-apps-list .setting-row button');
            if (btn) btn.click();
        `);
        await sleep(250);
        const guestUninstallRes = await cdp.eval(`({
            bannerVisible: !!document.getElementById('settings-guest-uac-banner'),
            dlgOpen: Win11Dialogs.isOpen(),
            noProgressWizard: !document.getElementById('uninst-bar'),
            mistakesAfter: Win11Assessment.getMistakes().length,
            guestBlockedTriggered: !!(Win11State.get().accountScenario && Win11State.get().accountScenario.guestBlockedTriggered)
        })`);
        assert('Guest Uninstall blocked with Arabic UAC warning and zero exploration penalty',
            guestUninstallRes.bannerVisible && guestUninstallRes.dlgOpen && guestUninstallRes.noProgressWizard &&
            guestUninstallRes.mistakesAfter === beforeGuestMistakes && guestUninstallRes.guestBlockedTriggered,
            JSON.stringify(guestUninstallRes));
        await cdp.shot('06_stage3_uac_guest_ar_rtl.png');
        await cdp.eval(`Win11Dialogs.close(true);`);
        await sleep(150);

        // Ephemeral Guest check + Guest toggle self check
        await cdp.eval(`
            Win11SettingsApp.openTo('accounts', 'main');
        `);
        await sleep(300);
        await cdp.eval(`
            var tgl = document.querySelector('[data-guest-toggle]');
            if (tgl) tgl.click();
        `);
        await sleep(200);
        const guestSelfToggleRes = await cdp.eval(`({
            guestStillEnabled: Win11State.getAccount('Invité').enabled,
            dlgOpen: Win11Dialogs.isOpen()
        })`);
        assert('Guest cannot disable its own account via UAC',
            guestSelfToggleRes.guestStillEnabled === true && guestSelfToggleRes.dlgOpen, JSON.stringify(guestSelfToggleRes));
        // Section 1: Guest CAN create/modify files in C:\Users\Invite\, persists across switchUser, wiped ONLY by Admin reset
        await cdp.eval(`Win11Dialogs.close(true);`);
        await sleep(150);
        await cdp.eval(`
            Win11State.switchUser('Invité');
            Win11Explorer.open('documents');
        `);
        await sleep(250);
        const guestBannerText = await cdp.eval(`document.querySelector('[data-win-id="win-explorer"]').textContent`);
        await cdp.eval(`
            document.getElementById('fe-new-file-btn').click();
        `);
        await sleep(200);
        // Edit the created file (id starts with uf_) & switch Away -> Back to verify persistence across switchUser
        await cdp.eval(`
            var edBtn = document.querySelector('[data-fe-edit-file^="uf_"]');
            if (edBtn) edBtn.click();
        `);
        await sleep(150);
        await cdp.eval(`
            var ta = document.getElementById('fe-edit-area');
            if (ta) ta.value = 'Modified Guest Content 1AS';
            var sv = document.querySelector('#dialog-backdrop .win-btn-accent');
            if (sv) sv.click();
        `);
        await sleep(200);
        await cdp.eval(`Win11State.switchUser('MENIAI'); Win11State.switchUser('Invité');`);
        await sleep(250);
        const guestPersistRes = await cdp.eval(`(function(){
            var files = Win11State.get().userFiles || [];
            var found = files.find(function(f){ return String(f.id || '').indexOf('uf_') === 0; });
            return {
                hasFile: !!found,
                contentModified: found ? (found.content === 'Modified Guest Content 1AS') : false,
                winsRestored: document.querySelectorAll('#windows-layer .win-window').length
            };
        })()`);
        // Switch User should NOT delete Guest files; Signing Out ("تسجيل الخروج") MUST automatically reset Guest in background!
        await cdp.eval(`
            Win11StartMenu.open();
        `);
        await sleep(150);
        await cdp.eval(`
            var uBtn = document.getElementById('start-user-btn');
            if (uBtn) uBtn.click();
        `);
        await sleep(150);
        await cdp.eval(`
            var items = document.querySelectorAll('#context-menu .ctx-item');
            for (var i = 0; i < items.length; i++) {
                if (items[i].textContent.indexOf('تسجيل الخروج') !== -1) { items[i].click(); break; }
            }
        `);
        await sleep(250);
        await cdp.eval(`Win11LockScreen.close(); Win11State.switchUser('Invité');`);
        await sleep(200);
        const guestResetOnLogoutRes = await cdp.eval(`(function(){
            var files = Win11State.get().userFiles || [];
            return {
                hasCustomFileAfterReset: files.some(function(f){ return String(f.id || '').indexOf('uf_') === 0; }),
                winsAfterLogoutReset: document.querySelectorAll('#windows-layer .win-window').length
            };
        })()`);
        assert('Section 1 Guest banner reflects temporary session & allows C:\\Users\\Invite file create/edit across switchUser',
            guestBannerText.indexOf('مؤقتة') !== -1 && guestBannerText.indexOf('لا يسمح بحفظ ملفات دائمة') === -1 &&
            guestPersistRes.hasFile && guestPersistRes.contentModified && guestPersistRes.winsRestored >= 1,
            JSON.stringify({ guestBannerOk: guestBannerText.indexOf('مؤقتة') !== -1, guestPersistRes: guestPersistRes }));
        assert('Section 3.1 Guest files & windows reset automatically in background upon Guest Sign Out (not Switch User)',
            !guestResetOnLogoutRes.hasCustomFileAfterReset && guestResetOnLogoutRes.winsAfterLogoutReset === 0,
            JSON.stringify(guestResetOnLogoutRes));

        await cdp.eval(`Win11State.reset(); Win11SettingsApp.openTo('personalization', 'background');`);
        await sleep(300);

        // Section 2: Strict Sequential Active Task & Early Action Mistake Detection
        const earlyActionRes = await cdp.eval(`(function(){
            Win11Assessment.startSession({ lastName: 'BENALI', firstName: 'Mohamed', fullName: 'BENALI Mohamed', classGroup: '1AS_ST_G1', pcNumber: '04', mode: 'training' });
            Win11HUD.open();
            var idxBefore = Win11Assessment.getActiveTaskIndex();
            // Perform Task 2 action (Mouse speed) BEFORE Task 1 (Display language) is complete!
            Win11State.set({ mouseDoubleClickSpeed: 'Rapide', pointerScheme: 'LimeGreen' });
            Win11Assessment.evaluate();
            var tasks = Win11Assessment.getTasks();
            var mistakes = Win11Assessment.getMistakes();
            var activeTab = document.querySelector('.hud-task-tab.is-current-active');
            var lockedTab = document.querySelector('[data-hud-tab="2"][data-hud-locked="1"]');
            return {
                idxBefore: idxBefore,
                idxAfter: Win11Assessment.getActiveTaskIndex(),
                task2Earned: tasks[1].earnedPoints,
                task2Done: tasks[1].completed,
                hasEarlyMistake: mistakes.some(function(m){ return m.title === 'إجراء مبكر' && m.type === 'early'; }),
                activeTabHighlighted: !!(activeTab && activeTab.getAttribute('data-hud-tab') === '0'),
                futureTabLocked: !!lockedTab
            };
        })()`);
        assert('Section 2 Strict Active Task blocks premature future scoring, logs "إجراء مبكر", and locks future HUD tabs',
            earlyActionRes.idxBefore === 0 && earlyActionRes.idxAfter === 0 && earlyActionRes.task2Earned === 0 &&
            !earlyActionRes.task2Done && earlyActionRes.hasEarlyMistake && earlyActionRes.activeTabHighlighted && earlyActionRes.futureTabLocked,
            JSON.stringify(earlyActionRes));

        // Sections 3, 4, 5, 6, 7, 8, 9 + Bug 1.1 & 1.2 UI Clicks: Balanced 20.00/20 Sequential Run (1+2+3+4+4+6)
        const seqTasks1to4 = await cdp.eval(`(function(){
            Win11State.reset();
            Win11Assessment.startSession({ lastName: 'BENALI', firstName: 'Mohamed', fullName: 'BENALI Mohamed', classGroup: '1AS_ST_G1', pcNumber: '04', mode: 'training' });

            // Task 1 (Weight 1.0, Simple): Display Language Change
            Win11State.setDisplayLanguage('fr', true);
            Win11Assessment.evaluate();
            Win11State.setDisplayLanguage('ar', true);
            Win11Assessment.evaluate();
            var scoreAfter1 = Win11Assessment.getScores().net;

            // Task 2 (Weight 2.0, Simple): Mouse Speed + Pointer
            Win11State.set({ mouseDoubleClickSpeed: 'Rapide', pointerScheme: 'LimeGreen' });
            Win11Assessment.evaluate();
            var scoreAfter2 = Win11Assessment.getScores().net;

            // Task 3 (Weight 3.0, Medium): Input Language Separation & Timezone
            var initialTray = document.getElementById('tray-lang-btn').textContent.trim();
            Win11State.addInputLanguage({ id: 'AR_DZ', code: 'AR', trayTag: 'ARA\\nDZ', keyboard: 'Clavier Arabe 101' }, 'العربية (الجزائر)');
            Win11State.setActiveInputLang('AR_DZ');
            var traySwitchedTag = document.getElementById('tray-lang-btn').textContent.trim();
            Win11State.set({ timeZoneId: 'GMT+1' });
            Win11Assessment.evaluate();
            var scoreAfter3 = Win11Assessment.getScores().net;

            // Task 4 (Weight 4.0, Medium): Personalization (Pictures Browse + Accent)
            Win11State.setUserWallpaper('pic_sahara', {
                file: 'bg/013.jpg', label: 'Sahara_Sunset.jpg', folder: 'pictures', path: 'C:\\\\Users\\\\MENIAI\\\\Pictures\\\\Sahara_Sunset.jpg',
                browseMeta: { usedBrowse: true, selectedFolder: 'pictures', selectedPath: 'C:\\\\Users\\\\MENIAI\\\\Pictures\\\\Sahara_Sunset.jpg', selectedFileId: 'pic_sahara' }
            });
            Win11State.set({ accentColor: '#8764B8' });
            Win11Assessment.evaluate();
            var scoreAfter4 = Win11Assessment.getScores().net;

            return {
                scoreAfter1: scoreAfter1,
                scoreAfter2: scoreAfter2,
                scoreAfter3: scoreAfter3,
                scoreAfter4: scoreAfter4,
                initialTray: initialTray,
                traySwitchedTag: traySwitchedTag
            };
        })()`);

        // Bug 1.1 Real UI Verification: Launch Setup.exe wizard & actually click #btn-setup-install
        await cdp.eval(`Win11Dialogs.launchSetupWizard();`);
        await sleep(150);
        await cdp.eval(`
            var b = document.getElementById('btn-setup-install');
            if (b) b.click();
        `);
        await sleep(600);
        const setupUiRes = await cdp.eval(`(function(){
            var st = Win11State.get();
            var installed = st.installedPrograms.some(function(p){ return p.id === 'labtools_app'; });
            var dlgMsg = document.querySelector('#dialog-backdrop .win-dialog') ? document.querySelector('#dialog-backdrop').textContent : '';
            Win11Dialogs.close(true);
            return {
                installed: installed,
                flowInstalled: !!st.setupFlow.installed,
                doneMsgShown: dlgMsg.indexOf('LabTools 1AS') !== -1
            };
        })()`);
        assert('Bug 1.1 Clicking #btn-setup-install in LabTools_Setup.exe wizard runs progress & installs app',
            setupUiRes.installed && setupUiRes.flowInstalled && setupUiRes.doneMsgShown,
            JSON.stringify(setupUiRes));

        // Bug 1.2 Real UI Verification: Navigate to Settings -> Apps -> Optional Features, verify Paint, Notepad & Games rows, click Paint Add button with async loading
        await cdp.eval(`Win11SettingsApp.openTo('apps', 'optional');`);
        await sleep(250);
        const optPageUiBefore = await cdp.eval(`(function(){
            var card = document.getElementById('ctrl-apps-optional');
            return {
                rendered: !!card && card.querySelectorAll('.setting-row[data-opt-row]').length === 3,
                hasPaint: !!document.querySelector('[data-opt-feat="paint"]'),
                hasNotepad: !!document.querySelector('[data-opt-feat="notepad"]'),
                hasGames: !!document.querySelector('[data-opt-feat="games"]')
            };
        })()`);
        await cdp.eval(`
            var pBtn = document.querySelector('[data-opt-feat="paint"]');
            if (pBtn) pBtn.click();
        `);
        await sleep(80);
        const optPaintBusy = await cdp.eval(`(function(){
            var row = document.querySelector('[data-opt-row="paint"]');
            return !!(row && row.querySelector('.win-spinner'));
        })()`);
        await sleep(1050);
        assert('Bug 1.2 Settings -> Apps -> Optional Features renders Paint/Notepad/Games rows, shows 1s .win-spinner & enables Paint via UI click',
            optPageUiBefore.rendered && optPageUiBefore.hasPaint && optPageUiBefore.hasNotepad && optPageUiBefore.hasGames && optPaintBusy &&
            (await cdp.eval(`Win11State.get().optionalFeatures.find(function(f){ return f.id === 'paint'; }).installed === true`)),
            JSON.stringify({ optPageUiBefore: optPageUiBefore, optPaintBusy: optPaintBusy }));

        // Complete Task 5 & Task 6 after real Setup.exe & Optional Features UI steps
        const fullSeqRes = await cdp.eval(`(function(){
            var hasAvastBefore = Win11State.get().startupApps.some(function(s){ return s.id === 'avast_tray'; });
            Win11State.uninstallProgram('avast_antivirus');
            var hasAvastAfter = Win11State.get().startupApps.some(function(s){ return s.id === 'avast_tray'; });

            Win11State.markInstalledAppsViewed();
            Win11State.uninstallProgram('labtools_app');
            Win11State.markInstalledAppsViewed();
            Win11Search.open('Paint');
            var paintCatalogOn = document.querySelectorAll('#win-search-results [data-app-idx]').length >= 1;
            Win11Search.close();
            Win11StartMenu.open();
            var startAllOn = document.getElementById('start-all-toggle');
            if (startAllOn) startAllOn.click();
            var startHasPaint = (document.getElementById('start-menu-flyout').textContent.indexOf('Paint') !== -1);
            Win11State.setOptionalFeatureEnabled('paint', false);
            Win11Search.open('Paint');
            var paintCatalogOff = document.querySelectorAll('#win-search-results [data-app-idx]').length >= 1;
            Win11Search.close();
            Win11StartMenu.open();
            var startAllOff = document.getElementById('start-all-toggle');
            if (startAllOff) startAllOff.click();
            var startGonePaint = (document.getElementById('start-menu-flyout').textContent.indexOf('Paint') === -1);
            Win11StartMenu.close();
            Win11Assessment.evaluate();
            var scoreAfter5 = Win11Assessment.getScores().net;

            // Task 6 (Weight 6.0, Complex, Section 4 + Section 5 A-G): Full Accounts Scenario + Avatar Management
            // Step A: Create 2 Standard, delete both
            Win11State.createAccount({ name: 'StdOne', type: 'Standard', password: '' });
            Win11State.createAccount({ name: 'StdTwo', type: 'Standard', password: '' });
            Win11State.deleteAccount('StdOne');
            Win11State.deleteAccount('StdTwo');

            // Step B: Create 2 Admins, switch to last Admin, delete MENIAI + first created Admin
            Win11State.createAccount({ name: 'AdmOne', type: 'Administrateur', password: '' });
            Win11State.createAccount({ name: 'AdmTwo', type: 'Administrateur', password: '' });
            Win11State.switchUser('AdmTwo');
            Win11State.deleteAccount('MENIAI');
            Win11State.deleteAccount('AdmOne');

            // Step C: Enable & switch Guest -> trigger Guest UAC denial
            Win11State.toggleGuestEnabled(true);
            Win11State.switchUser('Invité');
            Win11Permissions.guard('system.rename', function(){}, { targetLabel: 'Rename PC' });
            Win11Dialogs.close(true);

            // Step D: Switch back to Admin -> create passworded Standard user
            Win11State.switchUser('AdmTwo');
            Win11State.createAccount({ name: 'EleveStd', type: 'Standard', password: 'Pass#1' });

            // Step E: Login with password -> sign out back to Admin
            Win11State.switchUser('EleveStd');
            Win11State.recordLoginSuccess('EleveStd', true);
            Win11State.switchUser('AdmTwo');

            // Step F: Admin changes Standard user password
            Win11State.setAccountPassword('EleveStd', 'Pass#2');

            // Step G: Login with NEW password
            Win11State.switchUser('EleveStd');
            Win11State.recordLoginSuccess('EleveStd', true);

            // Step H (Section 4): Edit Standard own avatar cleanly; verify Guest cannot edit avatar
            var avSrc = Win11State.AVATAR_GALLERY[1] ? Win11State.AVATAR_GALLERY[1].src : '';
            var stdAvOk = Win11State.setUserAvatar('EleveStd', avSrc, 'avatar_2');
            Win11State.switchUser('Invité');
            var guestAvBlocked = !Win11State.setUserAvatar('Invité', avSrc, 'avatar_2');
            Win11State.switchUser('AdmTwo');

            Win11Assessment.evaluate();
            var finalScores = Win11Assessment.getScores();
            var finalTasks = Win11Assessment.getTasks();
            var reportHtml = Win11Report.buildA4Html();
            var fnameAscii = Win11Report.formatSuggestedFilename('pdf');

            return {
                scoreAfter5: scoreAfter5,
                hasAvastBefore: hasAvastBefore,
                hasAvastAfter: hasAvastAfter,
                paintCatalogOn: paintCatalogOn && startHasPaint,
                paintCatalogOff: paintCatalogOff || !startGonePaint,
                stdAvOk: stdAvOk,
                guestAvBlocked: guestAvBlocked,
                tasksDoneCount: finalTasks.filter(function(t){ return t.completed; }).length,
                tasksLockedAcrossSwitch: finalTasks.slice(0, 5).every(function(t){ return t.completed; }),
                finalScores: finalScores,
                reportHtml: reportHtml,
                fnameAscii: fnameAscii,
                accLogLen: (Win11State.get().accountActionLog || []).length
            };
        })()`);
        assert('Section 2.2 Rebalanced Weights (1+2+3+4+4+6=20) & Setup.exe + Optional Features (Paint Start sync) score step-by-step to 14.00',
            seqTasks1to4.scoreAfter1 === 1 && seqTasks1to4.scoreAfter2 === 3 && seqTasks1to4.scoreAfter3 === 6 &&
            seqTasks1to4.scoreAfter4 === 10 && fullSeqRes.scoreAfter5 === 14 &&
            fullSeqRes.hasAvastBefore && !fullSeqRes.hasAvastAfter && fullSeqRes.paintCatalogOn && !fullSeqRes.paintCatalogOff,
            JSON.stringify({ s1: seqTasks1to4.scoreAfter1, s2: seqTasks1to4.scoreAfter2, s3: seqTasks1to4.scoreAfter3, s4: seqTasks1to4.scoreAfter4, s5: fullSeqRes.scoreAfter5, paintOn: fullSeqRes.paintCatalogOn, paintOff: fullSeqRes.paintCatalogOff }));
        assert('Section 4, 5 & 6.5 Accounts A-G + Avatar Permissions + Cross-User Global Task Completion yield clean 20.00/20',
            fullSeqRes.finalScores.net === 20 && fullSeqRes.tasksDoneCount === 6 && fullSeqRes.tasksLockedAcrossSwitch &&
            fullSeqRes.stdAvOk && fullSeqRes.guestAvBlocked && fullSeqRes.accLogLen >= 8,
            JSON.stringify({ net: fullSeqRes.finalScores.net, done: fullSeqRes.tasksDoneCount, accLog: fullSeqRes.accLogLen }));
        assert('Section 6 & 8 Report removes Visit Count & Start/End columns, adds Deductions Table & Audit Log, and keeps Filename strictly ASCII',
            fullSeqRes.reportHtml.indexOf('عدد الزيارات') === -1 &&
            fullSeqRes.reportHtml.indexOf('<th>البداية</th>') === -1 &&
            fullSeqRes.reportHtml.indexOf('<th>النهاية</th>') === -1 &&
            fullSeqRes.reportHtml.indexOf('المدة المستغرقة') !== -1 &&
            fullSeqRes.reportHtml.indexOf('جدول الخصومات والمخالفات') !== -1 &&
            fullSeqRes.reportHtml.indexOf('سجل أحداث الحسابات والتدقيق الزمني') !== -1 &&
            !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(fullSeqRes.fnameAscii) &&
            /^Class_1AS_ST_G1_Score_20\.00_Time_\d{2}-\d{2}-\d{2}_Student_BENALI_Mohamed\.pdf$/.test(fullSeqRes.fnameAscii),
            fullSeqRes.fnameAscii);

        // Verify Arabic Group Name Transliterates Strictly to ASCII + Zero-Mistake 20/20 Cap + Net>=0 Clamp + Wrong Password Shake + Accounts UI Guest Disabled Password
        const edgeEvalRes = await cdp.eval(`(function(){
            var arGroup = '1 ثانوي - جذع مشترك علوم وتكنولوجيا (فوج 1)';
            Win11Assessment.getStudent().classGroup = arGroup;
            var arAsciiFname = Win11Report.formatSuggestedFilename('pdf');
            var u1 = Win11Report.allocateUniqueFilename('html');
            var u2 = Win11Report.allocateUniqueFilename('html');

            // Record 1 mistake -> MUST block 20.00/20 even when all 6 tasks completed
            Win11Assessment.recordMistake(6, 'خطأ كلمة مرور', 'كلمة مرور خاطئة', 0.25, 'password');
            var cappedScore = Win11Assessment.getScores();

            // Record massive penalty -> Net MUST clamp >= 0
            Win11Assessment.recordMistake(6, 'اختبار الحد الأدنى', 'خصم كبير', 50, 'test');
            var clampedScore = Win11Assessment.getScores();

            return {
                arAsciiHasNoArabic: !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(arAsciiFname),
                arAsciiSample: arAsciiFname,
                uniqueOk: u1 !== u2 && /_2\\.html$/.test(u2),
                cappedBelow20: cappedScore.net < 20 && cappedScore.net === 19.75 && cappedScore.deductions.length >= 1,
                clampedAtZero: clampedScore.net === 0 && clampedScore.totalDeductions >= 50
            };
        })()`);
        assert('Section 7 & 8 Arabic filenames transliterate to pure ASCII, mistakes strictly block 20.00/20, and net clamps >= 0',
            edgeEvalRes.arAsciiHasNoArabic && edgeEvalRes.uniqueOk && edgeEvalRes.cappedBelow20 && edgeEvalRes.clampedAtZero,
            JSON.stringify(edgeEvalRes));

        // Verify Wrong Password triggers Windows head-shake (.win-shake) & exact Arabic error text
        await cdp.eval(`
            Win11LockScreen.open('EleveStd');
            var lpw = document.getElementById('lock-pass-input');
            if (lpw) { lpw.value = 'WRONG'; }
            var lsub = document.getElementById('lock-signin-btn');
            if (lsub) { lsub.click(); }
        `);
        await sleep(100);
        const wrongPwRes = await cdp.eval(`({
            errText: document.getElementById('lock-error-msg') ? document.getElementById('lock-error-msg').textContent.trim() : '',
            hasShake: document.getElementById('lock-pass-input') ? document.getElementById('lock-pass-input').classList.contains('win-shake') : false
        })`);
        assert('Section 7.1 Wrong Lock Screen password triggers head-shake animation and exact Arabic message',
            wrongPwRes.hasShake && wrongPwRes.errText.indexOf('كلمة المرور غير صحيحة') !== -1, JSON.stringify(wrongPwRes));
        await cdp.eval(`Win11LockScreen.close();`);

        // Verify Truthful Win11 Accounts 3-Section Structure, Zero Invented Reset Files Button & Guest Disabled Password UI
        await cdp.eval(`Win11SettingsApp.openTo('accounts', 'main');`);
        await sleep(250);
        const accountsUiAudit = await cdp.eval(`(function(){
            var disBtns = document.querySelectorAll('[data-guest-no-pass]');
            var accMain = document.querySelector('#win-settings .settings-main') || document.body;
            var txt = accMain.textContent || '';
            return {
                guestPwDisabled: disBtns.length >= 1 && disBtns[0].disabled === true,
                hasYourInfoHero: !!document.getElementById('acc-section-your-info'),
                hasAccountSettings: !!document.getElementById('acc-section-settings') && !!document.getElementById('acc-verify-btn') && !!document.getElementById('acc-signin-pass-btn'),
                hasOtherUsersSection: !!document.getElementById('acc-section-other-users') && !!document.getElementById('acc-add-btn') && !!document.getElementById('ctrl-accounts-list'),
                noResetBtnAttr: !document.querySelector('[data-guest-reset]'),
                noResetBtnText: txt.indexOf('إعادة تعيين الملفات') === -1
            };
        })()`);
        assert('Section 3.1 & 3.2 Accounts page matches Windows 11 3-section structure, disables Guest password & has ZERO invented Reset Files button',
            accountsUiAudit.guestPwDisabled && accountsUiAudit.hasYourInfoHero && accountsUiAudit.hasAccountSettings &&
            accountsUiAudit.hasOtherUsersSection && accountsUiAudit.noResetBtnAttr && accountsUiAudit.noResetBtnText,
            JSON.stringify(accountsUiAudit));

        // Lock Screen pauses active timer and tracks suspendedSeconds
        await cdp.eval(`Win11Assessment.resumeTimer(); Win11LockScreen.open();`);
        await sleep(1250);
        const suspendedCheck = await cdp.eval(`(function(){
            var stu = Win11Assessment.getStudent();
            var paused = stu.paused;
            var susp = stu.suspendedSeconds;
            Win11LockScreen.close();
            var resumed = !stu.paused;
            return { paused: paused, susp: susp, resumed: resumed };
        })()`);
        assert('Lock Screen / Switch User pauses active timer and tracks suspendedSeconds',
            suspendedCheck.paused && suspendedCheck.susp >= 1 && suspendedCheck.resumed, JSON.stringify(suspendedCheck));

        // Open Certificate Modal on 1280x800: verify ONLY PDF and HTML exports (ZERO JSON), no double-escaped <bdi>, unclipped header
        await cdp.eval(`Win11Report.openCertificate()`);
        await sleep(250);
        const repModal1280 = await cdp.eval(`(function(){
            var dlg = document.querySelector('#dialog-backdrop .win-dialog');
            var content = dlg.querySelector('.win-dialog-content');
            var sheet = dlg.querySelector('.a4-report-sheet');
            var pdfBtn = document.getElementById('btn-export-pdf');
            var htmlBtn = document.getElementById('btn-export-html');
            var jsonBtn = document.getElementById('btn-export-json');
            var r = dlg.getBoundingClientRect();
            var sr = sheet.getBoundingClientRect();
            return {
                top: r.top,
                bottom: r.bottom,
                vh: window.innerHeight,
                scrollTop: content.scrollTop,
                sheetTopVisible: sr.top >= 0,
                noDoubleBdiPdf: pdfBtn ? pdfBtn.innerHTML.indexOf('&lt;bdi') === -1 : false,
                noDoubleBdiHtml: htmlBtn ? htmlBtn.innerHTML.indexOf('&lt;bdi') === -1 : false,
                noJsonBtn: !jsonBtn,
                hasPdfAndHtml: !!(pdfBtn && htmlBtn)
            };
        })()`);
        assert('Section 8 Report dialog fits 1280x800 with ONLY PDF & HTML exports (JSON forbidden) & crisp unescaped buttons',
            repModal1280.top >= 0 && repModal1280.bottom <= repModal1280.vh && repModal1280.sheetTopVisible && repModal1280.scrollTop === 0 &&
            repModal1280.hasPdfAndHtml && repModal1280.noJsonBtn && repModal1280.noDoubleBdiPdf && repModal1280.noDoubleBdiHtml,
            JSON.stringify(repModal1280));
        await cdp.shot('07_stage4_report_dialog_ar_rtl.png');
        await cdp.eval(`Win11Dialogs.close(false)`);
        await sleep(150);

        // 7. Test Language Switch AR -> FR -> EN -> AR cleanly
        await cdp.eval(`Win11I18N.setLanguage('fr')`);
        await sleep(300);
        const frDir = await cdp.eval(`document.documentElement.getAttribute('dir') + ':' + Win11I18N.t('settings.nav.system')`);
        await cdp.eval(`Win11I18N.setLanguage('en')`);
        await sleep(300);
        const enDir = await cdp.eval(`document.documentElement.getAttribute('dir') + ':' + Win11I18N.t('settings.nav.system')`);
        await cdp.eval(`Win11I18N.setLanguage('ar')`);
        await sleep(300);
        const arDir = await cdp.eval(`document.documentElement.getAttribute('dir') + ':' + Win11I18N.t('settings.nav.system')`);
        assert('Trilingual switch FR/EN/AR updates dir & dictionary', frDir === 'ltr:Système' && enDir === 'ltr:System' && arDir === 'rtl:النظام', [frDir, enDir, arDir].join(' | '));

        // 8. Test Edge Case: 1024x768 viewport + 200% font scale / Maximize / Minimize / TaskView / HUD clamp
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1024, height: 768, deviceScaleFactor: 2, mobile: false
        });
        await sleep(250);
        await cdp.eval(`
            Win11WM.toggleMaximize('win-settings');
            Win11WM.toggleMaximize('win-settings');
            Win11WM.snap('win-settings', { x: 0, y: 0, w: 0.5, h: 1 });
            Win11TaskView.open();
            Win11TaskView.close();
            Win11HUD.open();
        `);
        await sleep(300);
        const smallScreenOk = await cdp.eval(`(function(){
            var win = document.querySelector('[data-win-id="win-settings"]').getBoundingClientRect();
            var hud = document.getElementById('pedagogy-hud').getBoundingClientRect();
            return win.right <= window.innerWidth + 2 && hud.right <= window.innerWidth + 2;
        })()`);
        assert('1024x768 @ 2x DPR window snap & HUD stay within viewport', smallScreenOk);

        // 8b. Report Dialog geometry on constrained 1024x768 viewport
        await cdp.eval(`Win11Report.openCertificate()`);
        await sleep(250);
        const repModal768 = await cdp.eval(`(function(){
            var dlg = document.querySelector('#dialog-backdrop .win-dialog');
            var r = dlg.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, vh: window.innerHeight };
        })()`);
        assert('Report dialog header & footer stay unclipped on 1024x768 viewport',
            repModal768.top >= 0 && repModal768.bottom <= repModal768.vh, JSON.stringify(repModal768));
        await cdp.eval(`Win11Dialogs.close(false)`);

        // 9. Active Startup Purge & Zero Persistence Across Reload
        await cdp.eval(`
            try {
                localStorage.setItem('win11_sim_v2_state', JSON.stringify({ wallpaperId: 'bg_09', currentUser: 'Tampered' }));
                localStorage.setItem('win11_sim_v2_teacher_cfg', JSON.stringify({ password: 'hacked' }));
                sessionStorage.setItem('leftover', '1');
                document.cookie = 'win11_stale=1;path=/';
            } catch (e) {}
        `);
        await cdp.send('Page.reload', { ignoreCache: true });
        await sleep(900);
        const freshAfterReload = await cdp.eval(`(function(){
            var startupChk = Win11Compat.verifyCleanStartup();
            var st = Win11State.get();
            var scores = Win11Assessment.getScores();
            var stu = Win11Assessment.getStudent();
            return {
                clean: startupChk.clean,
                remaining: startupChk.remaining,
                currentUser: st.currentUser,
                wallpaperId: st.wallpaperId,
                netScore: scores.net,
                timerHeldAtZeroUntilSubmit: (!stu.activeSession && stu.elapsedSeconds === 0),
                teacherOpenedOnMissingInf: !!document.getElementById('tc-inst'),
                mode: stu.mode
            };
        })()`);
        assert('Startup actively purges legacy storage/cookies, holds timer at 00:00:00 until submit & opens Teacher Setup when inf.dll missing',
            freshAfterReload.clean && freshAfterReload.currentUser === 'MENIAI' && freshAfterReload.wallpaperId === 'bg_00' &&
            freshAfterReload.netScore === 0 && freshAfterReload.timerHeldAtZeroUntilSubmit && freshAfterReload.teacherOpenedOnMissingInf,
            JSON.stringify(freshAfterReload));
        await cdp.eval(`Win11Dialogs.close(false)`);
        await sleep(150);

        // 10. Stage 6 & Stage 7 End-to-End Tests: Teacher Panel UI, Filename Builder, Exam HUD & Fullscreen Lock
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1280, height: 800, deviceScaleFactor: 1, mobile: false
        });
        await sleep(200);

        // Verify Student Registration device dropdown 01..20
        await cdp.eval(`Win11Report.openStudentRegistration()`);
        await sleep(200);
        const regDevs = await cdp.eval(`(function(){
            var sel = document.getElementById('stu-reg-pc');
            return { isSelect: !!(sel && sel.tagName === 'SELECT'), count: sel ? sel.options.length : 0, first: sel ? sel.options[0].value : '' };
        })()`);
        assert('Student registration uses editable device dropdown 01-20', regDevs.isSelect && regDevs.count === 20 && regDevs.first === '01', JSON.stringify(regDevs));
        await cdp.eval(`Win11Dialogs.close(false)`);
        await sleep(150);

        // Open Full Teacher Console (Stage 6) on General -> Report -> Security
        await cdp.eval(`
            Win11Assessment.setActivePasswordInRam('ProfTest#2026');
            Win11Teacher.openPanel();
        `);
        await sleep(250);
        const tabGeneralOk = await cdp.eval(`!!document.getElementById('tc-inst') && !!document.getElementById('tc-year') && !!document.getElementById('tc-devices') && !!document.getElementById('tc-wp-folder')`);
        assert('Teacher Panel General tab renders institution, academic year 2026/2027, wallpaper source folder & device list', tabGeneralOk);
        await cdp.shot('08_stage6_teacher_panel_ar_rtl.png');

        await cdp.eval(`document.querySelector('[data-ttab="exam"]').click()`);
        await sleep(150);
        const tabExamCriticalOk = await cdp.eval(`document.querySelectorAll('[data-task-crit]').length === 6`);
        assert('Teacher Panel Activity tab exposes per-task critical & weight controls for all 6 tasks', tabExamCriticalOk);

        // Switch to Report tab & verify live token builder + forbidden char validation + dirty banner
        await cdp.eval(`document.querySelector('[data-ttab="report"]').click()`);
        await sleep(200);
        await cdp.eval(`
            var inp = document.getElementById('tc-fname-pattern');
            inp.value = '{score}/{class}';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
        `);
        await sleep(150);
        const badPatErr = await cdp.eval(`({
            errText: document.getElementById('tc-fname-err').textContent.trim(),
            dirtyVisible: document.getElementById('tc-dirty-flag').style.display !== 'none'
        })`);
        assert('Filename pattern builder rejects invalid Windows chars live & flags unsaved state',
            badPatErr.errText.length > 0 && badPatErr.dirtyVisible, JSON.stringify(badPatErr));

        // Restore valid pattern and reorder token up, verify live preview updates cleanly
        await cdp.eval(`
            var chkUp = document.querySelector('[data-tok-dn="0"]');
            if (chkUp) chkUp.click();
        `);
        await sleep(150);
        const validPreview = await cdp.eval(`({
            pattern: document.getElementById('tc-fname-pattern').value,
            preview: document.getElementById('tc-fname-preview').textContent,
            errEmpty: document.getElementById('tc-fname-err').textContent.trim() === ''
        })`);
        assert('Token reorder updates filename pattern & live preview cleanly',
            validPreview.errEmpty && validPreview.pattern.indexOf('{score}_{class}') === 0 && validPreview.preview.indexOf('20.00_') === 0 &&
            !/[\u0600-\u06FF]/.test(validPreview.preview),
            JSON.stringify(validPreview));

        // Close panel & test Exam Mode HUD (no hints, headlines only) + Theme Lock + Fullscreen Exam Lock + Reset Demo
        await cdp.eval(`Win11Dialogs.close(false)`);
        await cdp.eval(`
            Win11Assessment.saveConfig({ mode: 'exam', lock_fullscreen_in_exam: true, theme_lock: true });
            Win11Assessment.startSession({ fullName: 'BENALI Mohammed', classGroup: '1AS_G1', pcNumber: '03', mode: 'exam' });
            Win11HUD.open();
        `);
        await sleep(250);
        const examHudCheck = await cdp.eval(`({
            noHintBtn: !document.getElementById('hud-hint-btn'),
            hasTitle: !!document.querySelector('.hud-instruction-box strong'),
            noStepInstructions: document.getElementById('pedagogy-hud').textContent.indexOf('لغة عرض واجهة Windows" (إلى الفرنسية') === -1,
            timeHudHHMMSS: /^\\d{2}:\\d{2}:\\d{2}/.test(document.getElementById('hud-time-pill').textContent.trim())
        })`);
        assert('Exam mode HUD hides hints & step-by-step instructions (titles + HH:MM:SS only)',
            examHudCheck.noHintBtn && examHudCheck.hasTitle && examHudCheck.noStepInstructions && examHudCheck.timeHudHHMMSS,
            JSON.stringify(examHudCheck));
        await cdp.shot('09_stage6_exam_hud_ar_rtl.png');

        // Verify Theme Lock blocks wallpaper change while Ctrl+Shift+S STILL works during Exam Fullscreen Lock
        await cdp.eval(`
            Win11Permissions.guard('personalization.wallpaper', function(){ Win11State.setUserWallpaper('bg_04'); }, { targetLabel: 'bg' });
        `);
        await sleep(200);
        const themeLockedRes = await cdp.eval(`({
            stillBg00: Win11State.get().wallpaperId === 'bg_00',
            lockDlgOpen: Win11Dialogs.isOpen()
        })`);
        assert('Teacher theme_lock enforces wallpaper/theme protection during exam',
            themeLockedRes.stillBg00 && themeLockedRes.lockDlgOpen, JSON.stringify(themeLockedRes));

        await cdp.eval(`
            Win11Dialogs.close(false);
            Win11Shell.enterFullscreen();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', code: 'KeyS', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true }));
        `);
        await sleep(200);
        const ctrlShiftSUnderLock = await cdp.eval(`Win11Dialogs.isOpen() && (!!document.getElementById('tc-inst') || !!document.getElementById('tc-setup-pass1') || !!document.getElementById('teacher-auth-pass'))`);
        assert('Ctrl+Shift+S stays accessible under Exam Fullscreen Lock with zero errors', ctrlShiftSUnderLock);

        // Stage 8.7: Fullscreen controls (tray button & F11), Alt+Tab lock during exam, and window windowed <-> maximized transitions
        await cdp.eval(`Win11Dialogs.close(false);`);
        await cdp.eval(`
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', altKey: true, bubbles: true, cancelable: true }));
        `);
        await sleep(150);
        const fsAndTransitions = await cdp.eval(`(function(){
            var fsBtn = document.getElementById('tray-fullscreen-btn');
            var tv = document.getElementById('task-view-overlay');
            var altTabBlockedInExam = !tv || !tv.classList.contains('is-open');
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11', bubbles: true, cancelable: true }));
            Win11SettingsApp.openTo('home');
            var winObj = Win11WM.getWindow('win-settings');
            var maxBefore = !!(winObj && winObj.isMaximized);
            Win11WM.toggleMaximize('win-settings');
            var max1 = !!(winObj && winObj.isMaximized);
            Win11WM.toggleMaximize('win-settings');
            var max2 = !!(winObj && winObj.isMaximized);
            var tbRect = document.getElementById('taskbar').getBoundingClientRect();
            return {
                hasTrayFsBtn: !!(fsBtn && fsBtn.getAttribute('title').indexOf('F11') !== -1),
                altTabBlockedInExam: altTabBlockedInExam,
                maxToggled: (!!winObj && max1 !== maxBefore && max2 === maxBefore),
                taskbarIntact: Math.round(tbRect.height) === 48
            };
        })()`);
        assert('Fullscreen affordances (tray/F11), Exam Alt+Tab lock & Window Maximize <-> Windowed transitions work cleanly',
            fsAndTransitions.hasTrayFsBtn && fsAndTransitions.altTabBlockedInExam && fsAndTransitions.maxToggled && fsAndTransitions.taskbarIntact,
            JSON.stringify(fsAndTransitions));

        // Stage 8.6: Encrypted Backup / Restore roundtrip + Teacher Panel Reset-to-Defaults & Reset Demo Session
        const backupRestoreOk = await cdp.eval(`(function(){
            Win11Assessment.saveConfig({ institution_name: 'ثانوية النسخ الاحتياطي التجريبية', mode: 'exam' });
            var backupBytes = Win11Assessment.exportBinaryInfDll('ProfTest#2026');
            Win11Assessment.saveConfig({ institution_name: 'اسم مؤقت متغير', mode: 'training' });
            var loadRes = Win11Assessment.loadInfBytes(backupBytes);
            var unlocked = Win11Assessment.verifyTeacherPassword('ProfTest#2026');
            var restoredName = Win11Assessment.getConfig().institution_name;
            return {
                loadOk: !!(loadRes && loadRes.ok),
                unlockOk: !!(unlocked && unlocked.ok),
                restoredMatch: restoredName === 'ثانوية النسخ الاحتياطي التجريبية'
            };
        })()`);
        assert('Encrypted inf.dll backup export and import restore preserve full config & password vault',
            backupRestoreOk.loadOk && backupRestoreOk.unlockOk && backupRestoreOk.restoredMatch,
            JSON.stringify(backupRestoreOk));

        await cdp.eval(`Win11Teacher.openPanel();`);
        await sleep(200);
        await cdp.eval(`document.querySelector('[data-ttab="security"]').click();`);
        await sleep(150);
        await cdp.eval(`var rb = document.getElementById('tc-reset-defaults'); if (rb) rb.click();`);
        await sleep(150);
        const tcResetDefOk = await cdp.eval(`({
            yearVal: document.getElementById('tc-year') ? document.getElementById('tc-year').value : '',
            dirtyOn: document.getElementById('tc-dirty-flag') && document.getElementById('tc-dirty-flag').style.display !== 'none'
        })`);
        await cdp.eval(`
            document.querySelector('[data-ttab="general"]').click();
        `);
        await sleep(120);
        const genResetYear = await cdp.eval(`document.getElementById('tc-year') ? document.getElementById('tc-year').value : ''`);
        assert('Teacher Panel Reset-to-Defaults restores academic year 2026 / 2027 & marks unsaved state',
            tcResetDefOk.dirtyOn && genResetYear === '2026 / 2027', JSON.stringify({ tcResetDefOk: tcResetDefOk, genResetYear: genResetYear }));

        // Verify Section 1.3 New Simulation ("محاكاة جديدة") retains student info & inf.dll while resetting tasks & timers to 00:00:00
        await cdp.eval(`
            Win11Assessment.saveConfig({ institution_name: 'ثانوية المحاكاة الجديدة' });
            Win11Assessment.startSession({ lastName: 'KHELIFI', firstName: 'Amine', fullName: 'KHELIFI Amine', classGroup: '1 ثانوي - جذع مشترك آداب (فوج 1)', pcNumber: '07', mode: 'training' });
            Win11State.set({ accentColor: '#8764B8' });
            Win11Assessment.evaluate();
            Win11HUD.open();
        `);
        await sleep(200);
        await cdp.eval(`document.getElementById('hud-new-sim-btn').click()`);
        await sleep(200);
        await cdp.eval(`document.querySelector('#dialog-backdrop .win-btn-accent').click()`);
        await sleep(250);
        const newSimRes = await cdp.eval(`(function(){
            var stu = Win11Assessment.getStudent();
            return {
                score: Win11Assessment.getScores().net,
                lastName: stu.lastName,
                firstName: stu.firstName,
                pcNumber: stu.pcNumber,
                inst: Win11Assessment.getConfig().institution_name,
                accentReset: Win11State.get().accentColor.toUpperCase() === '#0067C0',
                timerReset: stu.elapsedSeconds <= 2
            };
        })()`);
        assert('Section 1.3 New Simulation clears settings/score to 0.00 while retaining student info & inf.dll',
            newSimRes.score === 0 && newSimRes.lastName === 'KHELIFI' && newSimRes.firstName === 'Amine' && newSimRes.pcNumber === '07' &&
            newSimRes.inst === 'ثانوية المحاكاة الجديدة' && newSimRes.accentReset && newSimRes.timerReset,
            JSON.stringify(newSimRes));

        // Verify Section 7 Single Source of Truth Lock Screen live clock + Home Language card + Apps Default PDF fallback
        await cdp.eval(`
            Win11State.set({ timeZoneId: 'GMT+1' });
            Win11SettingsApp.openTo('personalization', 'lockscreen');
        `);
        await sleep(250);
        const lockCheck = await cdp.eval(`(function(){
            var lockTxt = document.getElementById('ctrl-lockscreen-preview') ? document.getElementById('ctrl-lockscreen-preview').textContent : '';
            var simNow = Win11State.getSimulatedNow();
            var hh = String(simNow.getHours()); if (hh.length < 2) hh = '0' + hh;
            var mm = String(simNow.getMinutes()); if (mm.length < 2) mm = '0' + mm;
            Win11State.uninstallProgram('adobe_reader');
            var defPdf = Win11State.getDefaultApps().pdfViewer;
            Win11SettingsApp.openTo('home', 'main');
            return {
                expectedClock: hh + ':' + mm,
                lockTxt: lockTxt,
                lockClockSynced: lockTxt.indexOf(hh + ':' + mm) !== -1,
                defPdfUpdated: defPdf === 'Microsoft Edge'
            };
        })()`);
        await sleep(250);
        const homeHasArDisplayName = await cdp.eval(`(document.querySelector('[data-win-id="win-settings"]') ? document.querySelector('[data-win-id="win-settings"]').textContent : '').indexOf('العربية (الجزائر)') !== -1`);
        const ssotCheck = {
            lockClockSynced: lockCheck.lockClockSynced,
            defPdfUpdated: lockCheck.defPdfUpdated,
            homeHasArDisplayName: homeHasArDisplayName,
            expectedClock: lockCheck.expectedClock,
            lockTxt: lockCheck.lockTxt
        };
        assert('Section 7 Single Source of Truth: Lock preview clock, Default PDF after Adobe uninstall & Settings Home language stay synced',
            ssotCheck.lockClockSynced && ssotCheck.defPdfUpdated && ssotCheck.homeHasArDisplayName,
            JSON.stringify(ssotCheck));

        await cdp.eval(`Win11Dialogs.close(false); Win11Assessment.resetDemoSession();`);
        await sleep(200);
        const demoResetOk = await cdp.eval(`Win11Assessment.getScores().net === 0 && Win11Assessment.getMistakes().length === 0`);
        assert('Teacher resetDemoSession restores 0.00 score and clears mistakes cleanly', demoResetOk);

        // Section 2.1 Skip Task Regression: 0-work skip + partial credit preservation + optional skip penalty
        await cdp.eval(`
            Win11State.reset();
            Win11Assessment.startSession({ lastName: 'SKIP', firstName: 'Tester', fullName: 'SKIP Tester', classGroup: '1AS_ST_G1', pcNumber: '03', mode: 'training' });
            Win11HUD.open();
        `);
        await sleep(200);
        // Skip Task 1 cleanly (0 points earned, 0 skip penalty)
        await cdp.eval(`document.getElementById('hud-skip-btn').click();`);
        await sleep(150);
        await cdp.eval(`var y = document.querySelector('#dialog-backdrop .win-btn-accent'); if (y) y.click();`);
        await sleep(200);
        // Perform PARTIAL work on Task 2 (1.00 / 2.00) and then Skip Task 2
        await cdp.eval(`
            Win11State.set({ mouseDoubleClickSpeed: 'Rapide' });
            Win11Assessment.evaluate();
        `);
        await sleep(150);
        await cdp.eval(`document.getElementById('hud-skip-btn').click();`);
        await sleep(150);
        await cdp.eval(`var y = document.querySelector('#dialog-backdrop .win-btn-accent'); if (y) y.click();`);
        await sleep(200);
        const skipRes = await cdp.eval(`(function(){
            var tasks = Win11Assessment.getTasks();
            var t1 = tasks[0], t2 = tasks[1];
            var html = Win11Report.buildA4Html();
            var sBeforePen = Win11Assessment.getScores();
            // Now test optional teacher penalty_skip > 0 on Task 3
            var curCfg = Win11Assessment.getConfig();
            Win11Assessment.saveConfig(Object.assign({}, curCfg, { penalty_skip: 0.50 }));
            Win11Assessment.skipActiveTask();
            var sAfterPen = Win11Assessment.getScores();
            Win11Assessment.saveConfig(Object.assign({}, curCfg, { penalty_skip: 0 }));
            return {
                activeIdx: Win11Assessment.getActiveTaskIndex(),
                t1Skipped: !!t1.skipped && !t1.completed && t1.earnedPoints === 0,
                t2SkippedPartialKept: !!t2.skipped && !t2.completed && t2.earnedPoints === 1,
                reportHasNotDone: html.indexOf('غير منجزة') !== -1,
                tab1SkippedCls: !!document.querySelector('[data-hud-tab="0"].is-skipped-task'),
                tab2SkippedCls: !!document.querySelector('[data-hud-tab="1"].is-skipped-task'),
                zeroPenWhenZeroCfg: sBeforePen.penalties === 0 && sBeforePen.net === 1,
                skipPenApplied: sAfterPen.penalties === 0.5 && sAfterPen.deductions.some(function(d){ return String(d.reason).indexOf('تخطي المهمة') !== -1; })
            };
        })()`);
        assert('Section 2.1 Skip Task button marks skipped tasks "غير منجزة", preserves pre-skip partial credit, advances active task & honors penalty_skip',
            skipRes.activeIdx === 3 && skipRes.t1Skipped && skipRes.t2SkippedPartialKept && skipRes.reportHasNotDone &&
            skipRes.tab1SkippedCls && skipRes.tab2SkippedCls && skipRes.zeroPenWhenZeroCfg && skipRes.skipPenApplied,
            JSON.stringify(skipRes));

        // Phase IV - Section 1: Start Evaluation Confirmation & Edit Info Non-Destructive Preservation
        await cdp.eval(`
            Win11State.reset();
            Win11Assessment.startNewSimulation();
            Win11Assessment.startSession({ lastName: 'KHELIFI', firstName: 'Rania', fullName: 'KHELIFI Rania', classGroup: '1AS_ST_G1', pcNumber: '04', mode: 'training' });
            Win11State.setDisplayLanguage('fr', true);
            Win11Assessment.evaluate();
            Win11State.setDisplayLanguage('ar', true);
            Win11Assessment.evaluate();
            Win11HUD.open();
        `);
        await sleep(200);
        await cdp.eval(`document.getElementById('hud-start-exam-btn').click();`);
        await sleep(150);
        const startWarnText = await cdp.eval(`document.querySelector('#dialog-backdrop') ? document.querySelector('#dialog-backdrop').textContent : ''`);
        await cdp.eval(`var cBtn = document.querySelector('#dialog-backdrop .win-btn-secondary'); if (cBtn) cBtn.click();`);
        await sleep(150);
        const afterCancelState = await cdp.eval(`({
            net: Win11Assessment.getScores().net,
            activeIdx: Win11Assessment.getActiveTaskIndex(),
            name: Win11Assessment.getStudent().fullName
        })`);
        await cdp.eval(`document.getElementById('hud-edit-info-btn').click();`);
        await sleep(150);
        const editModeLocked = await cdp.eval(`!!(document.getElementById('stu-mode-exam') && document.getElementById('stu-mode-exam').disabled)`);
        await cdp.eval(`
            document.getElementById('stu-reg-lastname').value = 'MANSOURI';
            document.getElementById('stu-reg-firstname').value = 'Yacine';
            document.getElementById('stu-reg-submit-btn').click();
        `);
        await sleep(180);
        const afterEditState = await cdp.eval(`({
            net: Win11Assessment.getScores().net,
            activeIdx: Win11Assessment.getActiveTaskIndex(),
            name: Win11Assessment.getStudent().fullName
        })`);
        assert('Phase IV Sec 1: Start Evaluation warns before wipe, Cancel preserves state & Edit Info updates name without losing score',
            startWarnText.indexOf('بدء جلسة جديدة سيقوم بمسح كل تقدمك الحالي') !== -1 &&
            afterCancelState.net === 1 && afterCancelState.activeIdx === 1 &&
            editModeLocked && afterEditState.name === 'MANSOURI Yacine' && afterEditState.net === 1 && afterEditState.activeIdx === 1,
            JSON.stringify({ startWarnOk: startWarnText.length > 0, afterCancelState: afterCancelState, editModeLocked: editModeLocked, afterEditState: afterEditState }));

        // Phase IV - Section 2: Apps List Performance Benchmark (< 100ms), Pagination & Delegation
        await cdp.eval(`Win11SettingsApp.openTo('apps', 'main');`);
        await sleep(220);
        const appsPerfRes = await cdp.eval(`(function(){
            Win11State.update(function(d){
                for (var i = 1; i <= 45; i++) {
                    d.installedPrograms.push({ id: 'bench_' + i, name: 'BenchApp ' + i, publisher: 'PerfSuite', size: '12 MB', date: '2026-11-11', color: '#0067C0' });
                }
            });
            Win11SettingsApp.openTo('home', 'main');
            var t0 = performance.now();
            Win11SettingsApp.openTo('apps', 'main');
            var openMs = performance.now() - t0;
            var initialRows = document.querySelectorAll('#ctrl-apps-list .setting-row').length;
            var loadMoreBtn = document.getElementById('apps-load-more-btn');
            var t1 = performance.now();
            if (loadMoreBtn) loadMoreBtn.click();
            var pageMs = performance.now() - t1;
            var afterMoreRows = document.querySelectorAll('#ctrl-apps-list .setting-row').length;
            Win11State.update(function(d){
                d.installedPrograms = d.installedPrograms.filter(function(p){ return String(p.id).indexOf('bench_') !== 0; });
            });
            return { openMs: openMs, pageMs: pageMs, initialRows: initialRows, afterMoreRows: afterMoreRows };
        })()`);
        assert('Phase IV Sec 2: Apps List paginates at 12->24 rows with zero render-loop freeze (< 100ms)',
            appsPerfRes.openMs < 100 && appsPerfRes.pageMs < 100 && appsPerfRes.initialRows === 12 && appsPerfRes.afterMoreRows === 24,
            JSON.stringify(appsPerfRes));

        // Phase IV - Section 3: Setup.exe Desktop Shortcut & Functional Paint / Notepad / Games Optional Features
        await cdp.eval(`
            Win11State.reset();
            Win11State.update(function(d){ d.setupFlow.installed = false; d.setupFlow.desktopShortcut = false; });
            Win11Dialogs.launchSetupWizard();
        `);
        await sleep(180);
        await cdp.eval(`
            var chk = document.getElementById('setup-desktop-shortcut');
            if (chk) chk.checked = true;
            document.getElementById('btn-setup-install').click();
        `);
        await sleep(520);
        await cdp.eval(`Win11Dialogs.close();`);
        await sleep(150);
        const setupShortcutCreated = await cdp.eval(`(function(){
            var iconEl = document.querySelector('#desktop-icons [data-desk-id="labtools-shortcut"]');
            return !!iconEl;
        })()`);
        await cdp.eval(`Win11Dialogs.openOptionalFeatureApp('paint');`);
        await sleep(120);
        const hasPaintCanvas = await cdp.eval(`!!document.getElementById('win-paint-canvas')`);
        await cdp.eval(`Win11Dialogs.close(); Win11Dialogs.openOptionalFeatureApp('notepad');`);
        await sleep(120);
        const hasNotepadEditor = await cdp.eval(`!!document.getElementById('win-notepad-editor')`);
        await cdp.eval(`Win11Dialogs.close(); Win11Dialogs.openOptionalFeatureApp('games');`);
        await sleep(120);
        const hasGamesGrid = await cdp.eval(`document.querySelectorAll('#game-mem-grid button[data-card-idx]').length === 8`);
        await cdp.eval(`Win11Dialogs.close(); Win11State.uninstallProgram('labtools_app');`);
        await sleep(120);
        const setupShortcutRemoved = await cdp.eval(`!document.querySelector('#desktop-icons [data-desk-id="labtools-shortcut"]')`);
        assert('Phase IV Sec 3: LabTools Setup creates/removes Desktop shortcut and Paint/Notepad/Games functional mini-apps render interactive widgets',
            setupShortcutCreated && setupShortcutRemoved && hasPaintCanvas && hasNotepadEditor && hasGamesGrid,
            JSON.stringify({ setupShortcutCreated: setupShortcutCreated, setupShortcutRemoved: setupShortcutRemoved, hasPaintCanvas: hasPaintCanvas, hasNotepadEditor: hasNotepadEditor, hasGamesGrid: hasGamesGrid }));

        // Phase IV - Section 4, 5 & 6: HUD Maximize / 2D Resize / Smooth Progress Bars / Checklists / Equal Weights
        await cdp.eval(`
            Win11State.reset();
            Win11Assessment.startNewSimulation();
            Win11Assessment.startSession({ lastName: 'HUD', firstName: 'Tester', fullName: 'HUD Tester', classGroup: '1AS_ST_G1', pcNumber: '01', mode: 'training' });
            Win11State.setDisplayLanguage('fr', true);
            Win11Assessment.evaluate();
            Win11State.setDisplayLanguage('ar', true);
            Win11Assessment.evaluate();
            Win11HUD.open();
        `);
        await sleep(200);
        const hudT2Start = await cdp.eval(`({
            taskBarWidth: document.getElementById('hud-task-progress-bar') ? document.getElementById('hud-task-progress-bar').style.width : '',
            doneCount: document.querySelectorAll('#hud-steps-list .hud-step-item.is-done').length,
            pendingCount: document.querySelectorAll('#hud-steps-list .hud-step-item.is-pending').length
        })`);
        await cdp.eval(`
            Win11State.set({ mouseDoubleClickSpeed: 'Rapide' });
            Win11Assessment.evaluate();
        `);
        await sleep(200);
        const hudT2Half = await cdp.eval(`({
            taskBarWidth: document.getElementById('hud-task-progress-bar') ? document.getElementById('hud-task-progress-bar').style.width : '',
            overallWidth: document.getElementById('hud-overall-progress-bar') ? document.getElementById('hud-overall-progress-bar').style.width : '',
            doneCount: document.querySelectorAll('#hud-steps-list .hud-step-item.is-done').length
        })`);
        await cdp.eval(`document.getElementById('hud-maximize-btn').click();`);
        await sleep(150);
        const hudMaxOn = await cdp.eval(`document.getElementById('pedagogy-hud').classList.contains('is-maximized')`);
        await cdp.eval(`document.getElementById('hud-maximize-btn').click();`);
        await sleep(150);
        const hudMaxOff = await cdp.eval(`!document.getElementById('pedagogy-hud').classList.contains('is-maximized')`);
        const hudResize2D = await cdp.eval(`(function(){
            var el = document.getElementById('pedagogy-hud');
            var h = document.getElementById('hud-resize-handle');
            if (!el || !h) return { ok: false };
            var before = el.getBoundingClientRect();
            h.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: before.left + 10, clientY: before.bottom - 5 }));
            document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: before.left - 30, clientY: before.bottom + 35 }));
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            var after = el.getBoundingClientRect();
            return { wChanged: after.width !== before.width, hChanged: after.height !== before.height };
        })()`);
        const equalWeightRes = await cdp.eval(`(function(){
            Win11Assessment.setActivePasswordInRam('ProfTest#2026');
            Win11Teacher.openPanel();
            var tabBtn = document.querySelector('[data-ttab="exam"]');
            if (tabBtn) tabBtn.click();
            var eqBtn = document.getElementById('tc-equal-weights');
            if (eqBtn) eqBtn.click();
            var wInputs = document.querySelectorAll('[data-task-coef]');
            var vals = [];
            for (var wi = 0; wi < wInputs.length; wi++) vals.push(Number(wInputs[wi].value));
            var sum = vals.reduce(function(acc, v){ return acc + v; }, 0);
            var allIntegers = vals.every(function(v){ return Number.isInteger(v) && v >= 1; });
            Win11Dialogs.close(false);
            return { count: vals.length, sum: sum, allIntegers: allIntegers, w0: vals[0], wLast: vals[vals.length - 1] };
        })()`);
        assert('Phase IV Sec 4-6: HUD maximize, 2D resize, ✔/○ substep checklist, 0%->50% task progress bar & Teacher #tc-equal-weights work accurately',
            hudT2Start.taskBarWidth === '0%' && hudT2Start.doneCount === 0 && hudT2Start.pendingCount === 2 &&
            hudT2Half.taskBarWidth === '50%' && hudT2Half.doneCount === 1 && hudMaxOn && hudMaxOff &&
            hudResize2D.wChanged && hudResize2D.hChanged &&
            equalWeightRes.count === 6 && equalWeightRes.sum > 0 && equalWeightRes.allIntegers,
            JSON.stringify({ hudT2Start: hudT2Start, hudT2Half: hudT2Half, hudMaxOn: hudMaxOn, hudMaxOff: hudMaxOff, hudResize2D: hudResize2D, equalWeightRes: equalWeightRes }));

        // Emergency Hotfix Sec 1, 5 & 6: Install Setup.exe -> verify -> Remove without freeze -> Install Paint (1s spinner)
        await cdp.eval(`
            Win11State.reset();
            Win11Assessment.startNewSimulation();
            Win11Assessment.startSession({ lastName: 'Hotfix', firstName: 'Tester', fullName: 'Hotfix Tester', classGroup: '1AS_ST_G1', pcNumber: '01', mode: 'training' });
            window.__hotfixAppsEmitCount = 0;
            Win11State.on('apps:changed', function(){ window.__hotfixAppsEmitCount++; });
            Win11Dialogs.launchSetupWizard();
        `);
        await sleep(120);
        await cdp.eval(`document.getElementById('btn-setup-install').click();`);
        await sleep(2350);
        await cdp.eval(`if (Win11Dialogs.isOpen()) Win11Dialogs.close(true); Win11SettingsApp.openTo('apps', 'main');`);
        await sleep(300);
        await cdp.shot('10_hotfix_installed_apps.png');
        const hotfixAfterInstall = await cdp.eval(`(function(){
            window.__appsSearchRef = document.getElementById('apps-filter-input');
            var row = document.querySelector('[data-prog-row="labtools_app"]');
            var emitCount = window.__hotfixAppsEmitCount || 0;
            return {
                hasRow: !!row,
                isWin11Row: !!(row && row.classList.contains('apps-win11-row')),
                emitCount: emitCount
            };
        })()`);
        await cdp.eval(`
            var btn = document.querySelector('[data-prog-uninstall="labtools_app"]');
            if (btn) btn.click();
        `);
        await sleep(550);
        await cdp.eval(`
            var ok = document.getElementById('uninst-ok-btn');
            if (ok) ok.click();
        `);
        await sleep(220);
        const hotfixAfterRemove = await cdp.eval(`(function(){
            var searchPreserved = (document.getElementById('apps-filter-input') === window.__appsSearchRef);
            var rowGone = !document.querySelector('[data-prog-row="labtools_app"]');
            var stateGone = !Win11State.get().installedPrograms.some(function(p){ return p.id === 'labtools_app'; });
            var invalidRes = Win11State.uninstallProgram('nonexistent_pkg_id');
            Win11StartMenu.open();
            var allBtn = document.getElementById('start-all-toggle');
            if (allBtn) allBtn.click();
            var startGone = (document.getElementById('start-menu-flyout').textContent.indexOf('LabTools') === -1);
            Win11StartMenu.close();
            var emitCountAfter = window.__hotfixAppsEmitCount || 0;
            return {
                searchPreserved: searchPreserved,
                rowGone: rowGone,
                stateGone: stateGone,
                invalidRes: invalidRes,
                startGone: startGone,
                emitCountAfter: emitCountAfter
            };
        })()`);
        await cdp.eval(`document.getElementById('apps-open-optional-btn').click();`);
        await sleep(160);
        await cdp.eval(`
            var pBtn = document.querySelector('[data-opt-feat="paint"]');
            if (pBtn) pBtn.click();
        `);
        await sleep(180);
        const paintLoadingAt180ms = await cdp.eval(`(function(){
            var p = document.getElementById('opt-prog-paint');
            var s = p ? p.querySelector('.win-spinner') : null;
            return !!(p && p.style.display !== 'none' && s && !Win11State.get().optionalFeatures.find(function(f){ return f.id === 'paint'; }).installed);
        })()`);
        await sleep(950);
        const paintInstalledAfter1s = await cdp.eval(`(function(){
            var f = Win11State.get().optionalFeatures.find(function(x){ return x.id === 'paint'; });
            var badge = document.querySelector('[data-opt-status="paint"]');
            Win11StartMenu.open();
            var allBtn = document.getElementById('start-all-toggle');
            if (allBtn) allBtn.click();
            var inStart = (document.getElementById('start-menu-flyout').textContent.indexOf('Paint') !== -1);
            Win11StartMenu.close();
            return {
                installed: !!(f && f.installed),
                badgeText: badge ? badge.textContent.trim() : '',
                inStart: inStart
            };
        })()`);
        assert('Hotfix Sec 1/5/6: Install Setup -> Remove without freeze (incremental reconciliation, 0 infinite loop) -> Install Paint with 1s spinner',
            hotfixAfterInstall.hasRow && hotfixAfterInstall.isWin11Row && hotfixAfterInstall.emitCount <= 4 &&
            hotfixAfterRemove.searchPreserved && hotfixAfterRemove.rowGone && hotfixAfterRemove.stateGone &&
            hotfixAfterRemove.invalidRes === false && hotfixAfterRemove.startGone && hotfixAfterRemove.emitCountAfter <= 6 &&
            paintLoadingAt180ms && paintInstalledAfter1s.installed && paintInstalledAfter1s.inStart,
            JSON.stringify({ hotfixAfterInstall: hotfixAfterInstall, hotfixAfterRemove: hotfixAfterRemove, paintLoadingAt180ms: paintLoadingAt180ms, paintInstalledAfter1s: paintInstalledAfter1s }));

        // Emergency Hotfix Sec 2 & 3: Partial sub-step skip + HUD header nowrap stability across timer ticks
        await cdp.eval(`
            Win11State.reset();
            Win11Assessment.startNewSimulation();
            Win11Assessment.startSession({ lastName: 'Skip', firstName: 'Tester', fullName: 'Skip Tester', classGroup: '1AS_ST_G1', pcNumber: '02', mode: 'training' });
            Win11State.setDisplayLanguage('fr', true);
            Win11Assessment.evaluate();
            Win11State.setDisplayLanguage('ar', true);
            Win11Assessment.evaluate();
            Win11HUD.open();
        `);
        await sleep(160);
        const hudHdrBefore = await cdp.eval(`(function(){
            var h = document.querySelector('#pedagogy-hud .hud-header');
            var t = document.querySelector('#pedagogy-hud .hud-header-title');
            var tp = document.getElementById('hud-time-pill');
            return {
                hdrH: h ? Math.round(h.getBoundingClientRect().height) : 0,
                titleWs: t ? getComputedStyle(t).whiteSpace : '',
                timeWs: tp ? getComputedStyle(tp).whiteSpace : ''
            };
        })()`);
        await cdp.eval(`
            var stu = Win11Assessment.getStudent();
            stu.elapsedSeconds = 3665;
            Win11Assessment.evaluate();
            var skipStepBtn = document.querySelector('[data-skip-step-idx="0"]');
            if (skipStepBtn) skipStepBtn.click();
        `);
        await sleep(160);
        const afterPartialSkip = await cdp.eval(`(function(){
            var tks = Win11Assessment.getTasks();
            var t2 = tks[1];
            var h = document.querySelector('#pedagogy-hud .hud-header');
            Win11State.set({ pointerScheme: 'Noir' });
            Win11Assessment.evaluate();
            var tks2 = Win11Assessment.getTasks();
            return {
                step0Skipped: !!(t2.subSteps && t2.subSteps[0] && t2.subSteps[0].skipped),
                hdrHAfter: h ? Math.round(h.getBoundingClientRect().height) : 0,
                t2EarnedHalf: tks2[1].earnedPoints,
                t2Max: tks2[1].maxPoints,
                advancedIdx: Win11Assessment.getActiveTaskIndex()
            };
        })()`);
        assert('Hotfix Sec 2-3: Partial sub-step skip (0 pts for skipped step, remaining steps earn points & advance) + HUD header nowrap stability',
            hudHdrBefore.titleWs === 'nowrap' && hudHdrBefore.timeWs === 'nowrap' &&
            Math.abs(hudHdrBefore.hdrH - afterPartialSkip.hdrHAfter) <= 1 &&
            afterPartialSkip.step0Skipped && afterPartialSkip.t2EarnedHalf > 0 && afterPartialSkip.t2EarnedHalf < afterPartialSkip.t2Max &&
            afterPartialSkip.advancedIdx === 2,
            JSON.stringify({ hudHdrBefore: hudHdrBefore, afterPartialSkip: afterPartialSkip }));

        // Emergency Hotfix Sec 4: User Accounts Scenario 2B (create 2 Admins, switch to FIRST created Admin, delete MENIAI & other Admin -> green checkmark ✔ + stepB=true)
        await cdp.eval(`
            Win11State.reset();
            Win11Assessment.startNewSimulation();
            Win11Assessment.startSession({ lastName: 'AdminB', firstName: 'Tester', fullName: 'AdminB Tester', classGroup: '1AS_ST_G1', pcNumber: '03', mode: 'training' });
            for (var si = 0; si < 5; si++) Win11Assessment.skipActiveTask();
            Win11HUD.open();
            Win11State.createAccount({ name: 'AdminAlpha', type: 'Administrateur', password: '' });
            Win11State.createAccount({ name: 'AdminBeta', type: 'Administrateur', password: '' });
            Win11State.switchUser('AdminAlpha');
            Win11State.deleteAccount('MENIAI');
            Win11State.deleteAccount('AdminBeta');
            Win11Assessment.evaluate();
        `);
        await sleep(220);
        const scenario2BRes = await cdp.eval(`(function(){
            var st = Win11State.get();
            var t6 = Win11Assessment.getTasks()[5];
            var stepBItem = document.querySelectorAll('#hud-steps-list .hud-step-item')[1];
            var barEl = document.getElementById('hud-task-progress-bar');
            return {
                curUser: st.currentUser,
                stepB: !!(st.accountScenario && st.accountScenario.stepB),
                subStepB_ok: !!(t6 && t6.subSteps && t6.subSteps[1] && t6.subSteps[1].ok),
                hudHasGreenCheck: !!(stepBItem && stepBItem.classList.contains('is-done') && stepBItem.textContent.indexOf('✔') !== -1),
                hudBarWidth: barEl ? barEl.style.width : ''
            };
        })()`);
        assert('Hotfix Sec 4: Scenario 2B (2 Admins, switch to first created Admin, delete MENIAI & other Admin) sets stepB=true & lights green checkmark ✔ in HUD',
            scenario2BRes.curUser === 'AdminAlpha' && scenario2BRes.stepB && scenario2BRes.subStepB_ok && scenario2BRes.hudHasGreenCheck &&
            parseInt(scenario2BRes.hudBarWidth, 10) > 0,
            JSON.stringify(scenario2BRes));

        // Report Export Escaping & Evaluation Logic Hotfix: Empty audit log check + 6D/6E/6F/6G Lock Screen & populated audit log + nowrap + <500ms
        const emptyReportRes = await cdp.eval(`(function(){
            var st = Win11State.get();
            var savedLog = st.accountActionLog ? st.accountActionLog.slice() : [];
            st.accountActionLog = [];
            var t0 = performance.now();
            var html = Win11Report.buildA4Html();
            var dt = performance.now() - t0;
            var host = document.createElement('div');
            host.innerHTML = html;
            var text = host.textContent || '';
            var hasEmptyMsg = text.indexOf('لا توجد أحداث مسجلة.') !== -1;
            var hasAuditTable = !!host.querySelector('.a4-account-log-table');
            var hasLiteralBdi = text.indexOf('<bdi') !== -1 || html.indexOf('&lt;bdi') !== -1;
            st.accountActionLog = savedLog;
            return { dt: dt, hasEmptyMsg: hasEmptyMsg, hasAuditTable: hasAuditTable, hasLiteralBdi: hasLiteralBdi };
        })()`);
        assert('Report Hotfix Sec 1+2 (empty log): shows "لا توجد أحداث مسجلة." without table, no double-escaped <bdi>, <500ms',
            emptyReportRes.hasEmptyMsg && !emptyReportRes.hasAuditTable && !emptyReportRes.hasLiteralBdi && emptyReportRes.dt < 500,
            JSON.stringify(emptyReportRes));

        // Scenario 6D -> 6E -> 6F -> 6G (Standard password user, initial login, sign out to Admin, change password, reject old pw, accept new pw)
        await cdp.eval(`
            Win11State.createAccount({ name: 'StdPass', type: 'Standard', password: 'old111' });
            Win11LockScreen.open();
        `);
        await sleep(180);
        await cdp.eval(`
            var pill = document.querySelector('[data-lock-acc="StdPass"]');
            if (pill) pill.click();
            var inp = document.getElementById('lock-pass-input');
            inp.value = 'old111';
            document.getElementById('lock-signin-btn').click();
        `);
        await sleep(220);
        await cdp.eval(`
            Win11State.switchUser('AdminAlpha');
            Win11State.setAccountPassword('StdPass', 'new222');
            Win11Assessment.evaluate();
            Win11LockScreen.open();
        `);
        await sleep(180);
        // Attempt OLD password first -> must reject and keep lock screen open
        await cdp.eval(`
            var pill = document.querySelector('[data-lock-acc="StdPass"]');
            if (pill) pill.click();
            var inp = document.getElementById('lock-pass-input');
            inp.value = 'old111';
            document.getElementById('lock-signin-btn').click();
        `);
        await sleep(150);
        const lockOldRejected = await cdp.eval(`Win11LockScreen.isOpen() && Win11State.get().currentUser === 'AdminAlpha'`);
        // Attempt NEW password -> must unlock and mark 6G=true
        await cdp.eval(`
            var inp = document.getElementById('lock-pass-input');
            inp.value = 'new222';
            document.getElementById('lock-signin-btn').click();
        `);
        await sleep(240);
        const eval6Res = await cdp.eval(`(function(){
            Win11Assessment.evaluate();
            Win11HUD.refresh();
            var st = Win11State.get();
            var sc = st.accountScenario || {};
            var t6 = Win11Assessment.getTasks()[5] || {};
            var stepItems = document.querySelectorAll('#hud-steps-list .hud-step-item');
            return {
                curUser: st.currentUser,
                lockClosed: !Win11LockScreen.isOpen(),
                lockOldRejected: !!${JSON.stringify(lockOldRejected)},
                stepD: !!sc.stepD,
                stepE: !!sc.stepE,
                stepF: !!sc.stepF,
                stepG: !!sc.stepG,
                subB: !!(t6.subSteps && t6.subSteps[1] && t6.subSteps[1].ok),
                subF: !!(t6.subSteps && t6.subSteps[5] && t6.subSteps[5].ok),
                subG: !!(t6.subSteps && t6.subSteps[6] && t6.subSteps[6].ok),
                hudFCheck: !!(stepItems[5] && stepItems[5].classList.contains('is-done')),
                hudGCheck: !!(stepItems[6] && stepItems[6].classList.contains('is-done'))
            };
        })()`);
        assert('Report Hotfix Sec 3: Scenarios 6B, 6F, 6G complete cleanly (old pw rejected on LockScreen, new pw accepted, HUD ✔)',
            eval6Res.curUser === 'StdPass' && eval6Res.lockClosed && eval6Res.lockOldRejected &&
            eval6Res.stepD && eval6Res.stepE && eval6Res.stepF && eval6Res.stepG &&
            eval6Res.subB && eval6Res.subF && eval6Res.subG && eval6Res.hudFCheck && eval6Res.hudGCheck,
            JSON.stringify(eval6Res));

        // Open certificate & verify populated Audit Log table + no double-escaping + nowrap styles + speed <500ms
        await cdp.eval(`
            window.__repStart = performance.now();
            Win11Report.openCertificate();
            window.__repElapsedMs = performance.now() - window.__repStart;
        `);
        await sleep(220);
        const certReportRes = await cdp.eval(`(function(){
            var dlg = document.querySelector('#dialog-backdrop .a4-report-sheet');
            var html = dlg ? dlg.innerHTML : '';
            var text = dlg ? dlg.textContent : '';
            var logRows = dlg ? dlg.querySelectorAll('.a4-account-log-table tbody tr') : [];
            var firstTh = dlg ? dlg.querySelector('.a4-account-log-table th') : null;
            var badDashRows = 0;
            var sampleRows = [];
            for (var i = 0; i < logRows.length; i++) {
                var cells = logRows[i].querySelectorAll('td');
                var timeTxt = cells[0] ? cells[0].textContent.trim() : '';
                var evTxt = cells[1] ? cells[1].textContent.trim() : '';
                var accTxt = cells[2] ? cells[2].textContent.trim() : '';
                var roleTxt = cells[3] ? cells[3].textContent.trim() : '';
                var detTxt = cells[4] ? cells[4].textContent.trim() : '';
                if (!evTxt || (accTxt === '-' && roleTxt === '-' && detTxt === '-')) badDashRows++;
                if (i < 4) sampleRows.push([timeTxt, evTxt, accTxt, roleTxt, detTxt]);
            }
            return {
                elapsedMs: window.__repElapsedMs,
                standaloneHasNowrap: Win11Report.buildStandaloneHtmlDoc().indexOf('white-space:nowrap') !== -1,
                hasLiteralBdi: text.indexOf('<bdi') !== -1 || html.indexOf('&lt;bdi') !== -1,
                hasAuditHeader: text.indexOf('سجل أحداث الحسابات والتدقيق الزمني') !== -1,
                rowCount: logRows.length,
                badDashRows: badDashRows,
                thWhiteSpace: firstTh ? getComputedStyle(firstTh).whiteSpace : '',
                sampleRows: sampleRows
            };
        })()`);
        await cdp.eval(`
            var tbl = document.querySelector('#dialog-backdrop .a4-account-log-table');
            if (tbl && tbl.scrollIntoView) tbl.scrollIntoView({ block: 'center' });
        `);
        await sleep(120);
        await cdp.shot('11_report_hotfix_ar_rtl.png');
        await cdp.eval(`if (Win11Dialogs.isOpen()) Win11Dialogs.close(false);`);
        await sleep(150);
        assert('Report Hotfix Sec 1+2+4: Certificate opens <500ms, no <bdi> escaping, populated audit log rows (0 dash rows), nowrap headers',
            certReportRes.elapsedMs < 500 && certReportRes.standaloneHasNowrap && !certReportRes.hasLiteralBdi &&
            certReportRes.hasAuditHeader && certReportRes.rowCount >= 5 && certReportRes.badDashRows === 0 &&
            certReportRes.thWhiteSpace === 'nowrap',
            JSON.stringify(certReportRes));

        // FINAL POLISH SEC 3: Real-time Reactive UI & Immediate Evaluation in Installed Apps + Optional Features (No page refresh)
        await cdp.eval(`
            Win11State.reset();
            Win11Assessment.startNewSimulation();
            Win11Assessment.startSession({ lastName: 'POLISH', firstName: 'Nadia', fullName: 'POLISH Nadia', classGroup: '1AS_ST_G1', pcNumber: '06', mode: 'training' });
            for (var si = 0; si < 4; si++) Win11Assessment.skipActiveTask();
            Win11HUD.open();
            Win11SettingsApp.openTo('apps', 'main');
        `);
        await sleep(220);
        // Stay ON Installed Apps page and install LabTools -> row must appear instantly & verify step 1+2 WITHOUT navigating away!
        await cdp.eval(`Win11State.installSetupApp({ desktopShortcut: false });`);
        await sleep(160);
        const rtInstallRes = await cdp.eval(`(function(){
            var sf = Win11State.get().setupFlow || {};
            var t5 = Win11Assessment.getTasks()[4] || {};
            return {
                rowPresentImmediately: !!document.querySelector('[data-prog-row="labtools_app"]'),
                verifiedInstalled: !!sf.verifiedInstalled,
                sub1Ok: !!(t5.subSteps && t5.subSteps[0] && t5.subSteps[0].ok),
                sub2Ok: !!(t5.subSteps && t5.subSteps[1] && t5.subSteps[1].ok),
                earnedAfterInstall: t5.earnedPoints || 0
            };
        })()`);
        // Still ON Installed Apps page -> remove LabTools -> row disappears instantly & step 3 verified immediately
        await cdp.eval(`Win11State.uninstallProgram('labtools_app');`);
        await sleep(160);
        const rtRemoveRes = await cdp.eval(`(function(){
            var sf = Win11State.get().setupFlow || {};
            var t5 = Win11Assessment.getTasks()[4] || {};
            return {
                rowGoneImmediately: !document.querySelector('[data-prog-row="labtools_app"]'),
                verifiedUninstalled: !!sf.verifiedUninstalled,
                sub3Ok: !!(t5.subSteps && t5.subSteps[2] && t5.subSteps[2].ok),
                earnedAfterRemove: t5.earnedPoints || 0
            };
        })()`);
        // Open Optional Features -> enable & disable Paint via UI/state -> UI updates instantly & Task 5 finishes WITHOUT leaving to Start Menu
        await cdp.eval(`Win11SettingsApp.openTo('apps', 'optional');`);
        await sleep(160);
        await cdp.eval(`Win11State.setOptionalFeatureEnabled('paint', true);`);
        await sleep(100);
        const optOnBadge = await cdp.eval(`document.querySelector('[data-opt-status="paint"]') ? document.querySelector('[data-opt-status="paint"]').textContent.trim() : ''`);
        await cdp.eval(`Win11State.setOptionalFeatureEnabled('paint', false);`);
        await sleep(120);
        const rtOptionalRes = await cdp.eval(`(function(){
            var t5 = Win11Assessment.getTasks()[4] || {};
            return {
                optOnBadge: ${JSON.stringify(optOnBadge)},
                optOffBadge: document.querySelector('[data-opt-status="paint"]') ? document.querySelector('[data-opt-status="paint"]').textContent.trim() : '',
                task5Completed: !!t5.completed,
                task5Earned: t5.earnedPoints || 0,
                activeIdxNow: Win11Assessment.getActiveTaskIndex()
            };
        })()`);
        assert('Final Polish Sec 3: Installed Apps & Optional Features update UI and award Task 5 points immediately without leaving page',
            rtInstallRes.rowPresentImmediately && rtInstallRes.verifiedInstalled && rtInstallRes.sub1Ok && rtInstallRes.sub2Ok &&
            rtRemoveRes.rowGoneImmediately && rtRemoveRes.verifiedUninstalled && rtRemoveRes.sub3Ok &&
            rtOptionalRes.optOnBadge === 'مثبّت' && rtOptionalRes.optOffBadge === 'غير مثبّت' &&
            rtOptionalRes.task5Completed && rtOptionalRes.task5Earned === 4 && rtOptionalRes.activeIdxNow === 5,
            JSON.stringify({ rtInstallRes: rtInstallRes, rtRemoveRes: rtRemoveRes, rtOptionalRes: rtOptionalRes }));

        // FINAL POLISH SEC 2 + SEC 4 + SEC 1: Guest TimeZone probe (0 penalty + stepC ✔) -> Off-Task Personalization warning (0 penalty on visit, deduction ONLY on commit) -> Deductions-only Report
        await cdp.eval(`
            Win11State.toggleGuestEnabled(true);
            Win11State.switchUser('Invité');
            Win11SettingsApp.openTo('timeLanguage', 'datetime');
        `);
        await sleep(200);
        const guestTzBeforeMistakes = await cdp.eval(`Win11Assessment.getMistakes().length`);
        await cdp.eval(`
            var tzSel = document.querySelector('#ctrl-timezone-select select');
            if (tzSel) {
                tzSel.value = 'GMT+2';
                tzSel.dispatchEvent(new Event('change'));
            }
        `);
        await sleep(200);
        const guestTzProbeRes = await cdp.eval(`({
            dlgOpen: Win11Dialogs.isOpen(),
            tzStillDefault: Win11State.get().timeZoneId === 'GMT+0',
            mistakesAfter: Win11Assessment.getMistakes().length,
            stepC: !!(Win11State.get().accountScenario && Win11State.get().accountScenario.stepC),
            subStepC_ok: !!(Win11Assessment.getTasks()[5] && Win11Assessment.getTasks()[5].subSteps[2] && Win11Assessment.getTasks()[5].subSteps[2].ok)
        })`);
        await cdp.eval(`if (Win11Dialogs.isOpen()) Win11Dialogs.close(true); Win11State.switchUser('MENIAI');`);
        await sleep(200);
        assert('Final Polish Sec 2: Testing Time Zone as Guest triggers Access Denied, awards stepC ✔, and incurs 0 deductions',
            guestTzProbeRes.dlgOpen && guestTzProbeRes.tzStillDefault && guestTzProbeRes.mistakesAfter === guestTzBeforeMistakes &&
            guestTzProbeRes.stepC && guestTzProbeRes.subStepC_ok,
            JSON.stringify({ guestTzBeforeMistakes: guestTzBeforeMistakes, guestTzProbeRes: guestTzProbeRes }));

        // Now active task is Task 6 (Create/Manage Users). Open Personalization -> MUST warn via #off-task-warning-toast with 0 deduction; changing wallpaper commits deduction!
        const offTaskBeforeMistakes = await cdp.eval(`Win11Assessment.getMistakes().length`);
        await cdp.eval(`Win11SettingsApp.openTo('personalization', 'main');`);
        await sleep(160);
        const offTaskVisitRes = await cdp.eval(`(function(){
            var toast = document.getElementById('off-task-warning-toast');
            return {
                toastVisible: !!toast,
                toastText: toast ? toast.textContent.trim() : '',
                mistakesAfterVisitOnly: Win11Assessment.getMistakes().length
            };
        })()`);
        await cdp.eval(`
            Win11State.setUserWallpaper('bg_04');
            Win11Assessment.evaluate();
        `);
        await sleep(150);
        const offTaskCommitRes = await cdp.eval(`(function(){
            var scores = Win11Assessment.getScores();
            var html = Win11Report.buildA4Html();
            return {
                mistakesAfterCommit: Win11Assessment.getMistakes().length,
                penaltiesTotal: scores.penalties,
                hasDeductionRow: scores.deductions.some(function(d){ return String(d.reason).indexOf('تعديل خارج المهمة النشطة') !== -1; }),
                noDuplicateMistakeLog: html.indexOf('سجل الأخطاء') === -1 && html.indexOf('الخطأ المسجل') === -1,
                hasDeductionsTable: html.indexOf('جدول الخصومات والمخالفات التفصيلي') !== -1 && html.indexOf('تعديل خارج المهمة النشطة') !== -1
            };
        })()`);
        await cdp.eval(`Win11Report.openCertificate();`);
        await sleep(200);
        await cdp.eval(`
            var dedTbl = Array.prototype.slice.call(document.querySelectorAll('#dialog-backdrop .a4-report-table')).pop();
            if (dedTbl && dedTbl.scrollIntoView) dedTbl.scrollIntoView({ block: 'center' });
        `);
        await sleep(120);
        await cdp.shot('12_final_polish_ar_rtl.png');
        await cdp.eval(`if (Win11Dialogs.isOpen()) Win11Dialogs.close(false);`);
        await sleep(150);
        assert('Final Polish Sec 1+4: Off-task warning toast shows with 0 penalty on visit, deducts only on commit, and report keeps ONLY Deductions Table (no Mistake Log)',
            offTaskVisitRes.toastVisible && offTaskVisitRes.toastText.indexOf('تغيير الخلفية الآن سيؤدي إلى خصم نقاط') !== -1 &&
            offTaskVisitRes.mistakesAfterVisitOnly === offTaskBeforeMistakes &&
            offTaskCommitRes.mistakesAfterCommit === offTaskBeforeMistakes + 1 &&
            offTaskCommitRes.penaltiesTotal > 0 && offTaskCommitRes.hasDeductionRow &&
            offTaskCommitRes.noDuplicateMistakeLog && offTaskCommitRes.hasDeductionsTable,
            JSON.stringify({ offTaskBeforeMistakes: offTaskBeforeMistakes, offTaskVisitRes: offTaskVisitRes, offTaskCommitRes: offTaskCommitRes }));

        // FINAL POLISH II SEC 1 & 2: HUD directional resize (RTL bottom-left + LTR bottom-right + min clamp) & Auto-suggest highlighted editable export filename
        const hudRtlResizeRes = await cdp.eval(`(function(){
            Win11HUD.open();
            var el = document.getElementById('pedagogy-hud');
            var bar = document.getElementById('hud-drag-bar');
            var grip = document.getElementById('hud-resize-handle');
            if (!el || !bar || !grip) return { ok: false };

            // Drag header bar first (sets left/right inline state just like real usage)
            var b0 = el.getBoundingClientRect();
            bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: b0.left + 80, clientY: b0.top + 16 }));
            window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: b0.left + 60, clientY: b0.top + 36 }));
            window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

            // RTL: Drag bottom-left grip down & left -> right & top MUST stay anchored, left moves left, bottom moves down
            var rBefore = el.getBoundingClientRect();
            grip.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: rBefore.left + 6, clientY: rBefore.bottom - 6 }));
            window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: rBefore.left - 54, clientY: rBefore.bottom + 49 }));
            window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            var rExpand = el.getBoundingClientRect();

            // RTL: Drag bottom-left grip sharply inward -> clamps at min 320x240 without flipping opposite corner
            grip.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: rExpand.left + 6, clientY: rExpand.bottom - 6 }));
            window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: rExpand.left + 600, clientY: rExpand.bottom - 600 }));
            window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            var rMin = el.getBoundingClientRect();

            return {
                rtlTopRightAnchored: Math.abs(rExpand.right - rBefore.right) <= 2 && Math.abs(rExpand.top - rBefore.top) <= 2,
                rtlExpandedLeftDown: rExpand.left < rBefore.left - 35 && rExpand.bottom > rBefore.bottom + 35,
                rtlMinClampOk: rMin.width >= 319 && rMin.width <= 322 && rMin.height >= 239 && rMin.height <= 242 && Math.abs(rMin.right - rExpand.right) <= 2
            };
        })()`);
        await cdp.eval(`Win11I18N.setLanguage('en');`);
        await sleep(300);
        const hudLtrResizeRes = await cdp.eval(`(function(){
            var el = document.getElementById('pedagogy-hud');
            var grip = document.getElementById('hud-resize-handle');
            var lBefore = el.getBoundingClientRect();
            grip.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: lBefore.right - 6, clientY: lBefore.bottom - 6 }));
            window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: lBefore.right + 50, clientY: lBefore.bottom + 45 }));
            window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            var lExpand = el.getBoundingClientRect();
            return {
                isLtrNow: !Win11I18N.isRtl(),
                ltrTopLeftAnchored: Math.abs(lExpand.left - lBefore.left) <= 2 && Math.abs(lExpand.top - lBefore.top) <= 2,
                ltrExpandedRightDown: lExpand.right > lBefore.right + 30 && lExpand.bottom > lBefore.bottom + 30
            };
        })()`);
        await cdp.eval(`Win11I18N.setLanguage('ar');`);
        await sleep(300);
        await cdp.eval(`(function(){
            var el = document.getElementById('pedagogy-hud');
            var grip = document.getElementById('hud-resize-handle');
            if (!el || !grip) return;
            var cur = el.getBoundingClientRect();
            grip.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: cur.left + 6, clientY: cur.bottom - 6 }));
            window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cur.left - 80, clientY: cur.bottom + 120 }));
            window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        })()`);
        assert('Final Polish II Sec 2: HUD bottom corner resize expands outwards/down cleanly in RTL & LTR and respects 320x240 minimum',
            hudRtlResizeRes.rtlTopRightAnchored && hudRtlResizeRes.rtlExpandedLeftDown && hudRtlResizeRes.rtlMinClampOk &&
            hudLtrResizeRes.isLtrNow && hudLtrResizeRes.ltrTopLeftAnchored && hudLtrResizeRes.ltrExpandedRightDown,
            JSON.stringify({ hudRtlResizeRes: hudRtlResizeRes, hudLtrResizeRes: hudLtrResizeRes }));

        await cdp.eval(`Win11Report.openCertificate();`);
        await sleep(200);
        await cdp.eval(`
            window.__expectedPdfBeforeClick = Win11Report.formatSuggestedFilename('pdf');
            var bPdf = document.getElementById('btn-export-pdf');
            if (bPdf) bPdf.click();
        `);
        await sleep(160);
        const exportPdfDlgRes = await cdp.eval(`(function(){
            var inp = document.getElementById('export-filename-input');
            var expectedBefore = window.__expectedPdfBeforeClick || '';
            var expectedAfter = Win11Report.formatSuggestedFilename('pdf');
            var selStart = inp ? inp.selectionStart : -1;
            var selEnd = inp ? inp.selectionEnd : -1;
            return {
                hasInput: !!inp,
                value: inp ? inp.value : '',
                expectedBefore: expectedBefore,
                expectedAfter: expectedAfter,
                matchesTeacherRule: !!(inp && (inp.value === expectedBefore || inp.value === expectedAfter)),
                editable: !!(inp && !inp.readOnly && !inp.disabled),
                fullyHighlighted: !!(inp && document.activeElement === inp && selStart === 0 && selEnd === inp.value.length)
            };
        })()`);
        await cdp.shot('13_export_filename_hud_resize.png');
        await cdp.eval(`
            var inp = document.getElementById('export-filename-input');
            if (inp) inp.value = 'Edited_Before_Cancel';
            var cancelBtn = document.getElementById('btn-cancel-export-save');
            if (cancelBtn) cancelBtn.click();
        `);
        await sleep(150);
        const returnedToCertRes = await cdp.eval(`!!document.getElementById('btn-export-html')`);
        await cdp.eval(`
            window.__expectedHtmlBeforeClick = Win11Report.formatSuggestedFilename('html');
            var bHtml = document.getElementById('btn-export-html');
            if (bHtml) bHtml.click();
        `);
        await sleep(150);
        const exportHtmlDlgRes = await cdp.eval(`(function(){
            var inp = document.getElementById('export-filename-input');
            var eb = window.__expectedHtmlBeforeClick || '';
            var ea = Win11Report.formatSuggestedFilename('html');
            var ok = !!(inp && (inp.value === eb || inp.value === ea) && document.activeElement === inp && inp.selectionStart === 0 && inp.selectionEnd === inp.value.length);
            if (inp) {
                inp.value = 'Custom_Edited_HTML';
                var saveBtn = document.getElementById('btn-confirm-export-save');
                if (saveBtn) saveBtn.click();
            }
            return { ok: ok, val: inp ? inp.value : '', expectedBefore: eb, expectedAfter: ea };
        })()`);
        await sleep(120);
        assert('Final Polish II Sec 1: Export dialog populates teacher-defined filename, highlights it by default, and allows editing',
            exportPdfDlgRes.hasInput && exportPdfDlgRes.matchesTeacherRule && exportPdfDlgRes.editable &&
            exportPdfDlgRes.fullyHighlighted && returnedToCertRes && exportHtmlDlgRes.ok,
            JSON.stringify({ exportPdfDlgRes: exportPdfDlgRes, returnedToCertRes: returnedToCertRes, exportHtmlDlgRes: exportHtmlDlgRes }));

        // Section 10: Start Menu Power -> Shut down confirmation warning + inline Export PDF + shutdown screen
        await cdp.eval(`
            window.__origPrint = window.print;
            window.__origClose = window.close;
            window.print = function () { window.__printMockCount = (window.__printMockCount || 0) + 1; };
            window.close = function () { window.__closeMockCalled = true; };
            document.getElementById('tb-start-btn').click();
        `);
        await sleep(200);
        await cdp.eval(`document.getElementById('start-power-btn').click();`);
        await sleep(200);
        const shutdownMenuLabel = await cdp.eval(`(function(){
            var items = document.querySelectorAll('#context-menu .ctx-item');
            return items[0] ? items[0].textContent.trim() : '';
        })()`);
        await cdp.eval(`
            var items = document.querySelectorAll('#context-menu .ctx-item');
            if (items[0]) items[0].click();
        `);
        await sleep(250);
        const shutdownWarnState = await cdp.eval(`({
            dlgOpen: Win11Dialogs.isOpen(),
            hasUnfinishedWarn: document.querySelector('#dialog-backdrop').textContent.indexOf('مهام غير مكتملة') !== -1,
            hasPdfWarn: document.querySelector('#dialog-backdrop').textContent.indexOf('PDF') !== -1,
            hasInlineExportBtn: !!document.getElementById('btn-shutdown-export-pdf')
        })`);
        await cdp.eval(`document.getElementById('btn-shutdown-export-pdf').click();`);
        await sleep(150);
        const shutdownAfterPdfExport = await cdp.eval(`({
            exportedFlag: Win11Report.hasExportedPdf(),
            greenCardVisible: !!(document.getElementById('shutdown-pdf-status') && document.getElementById('shutdown-pdf-status').classList.contains('shutdown-pdf-exported')),
            printCalled: (window.__printMockCount || 0) >= 1
        })`);
        await cdp.eval(`document.getElementById('btn-shutdown-confirm').click();`);
        await sleep(850);
        const shutdownScreenVisible = await cdp.eval(`(function(){
            var ok = getComputedStyle(document.getElementById('shutdown-screen')).display === 'flex' && !!window.__closeMockCalled;
            window.print = window.__origPrint;
            window.close = window.__origClose;
            return ok;
        })()`);
        assert('Section 10 Start Shutdown opens unfinished/PDF warnings, inline Export PDF works & triggers clean shutdown screen',
            shutdownMenuLabel === 'إيقاف التشغيل' && shutdownWarnState.dlgOpen && shutdownWarnState.hasUnfinishedWarn &&
            shutdownWarnState.hasInlineExportBtn && shutdownAfterPdfExport.exportedFlag && shutdownAfterPdfExport.greenCardVisible &&
            shutdownAfterPdfExport.printCalled && shutdownScreenVisible,
            JSON.stringify({ shutdownMenuLabel: shutdownMenuLabel, shutdownWarnState: shutdownWarnState, shutdownAfterPdfExport: shutdownAfterPdfExport, shutdownScreenVisible: shutdownScreenVisible }));

        // Confirm custom edited PDF filename flow via Save button after shutdown screen restart
        await cdp.eval(`
            document.getElementById('shutdown-restart-btn').click();
        `);
        await sleep(120);
        await cdp.eval(`
            if (Win11Dialogs.isOpen()) Win11Dialogs.close(false);
            window.__fpOrigPrint2 = window.print;
            window.__fpPrintTitle2 = '';
            window.print = function () { window.__fpPrintTitle2 = document.title; };
            Win11Report.openExportSaveDialog('pdf');
        `);
        await sleep(120);
        const customPdfSaveRes = await cdp.eval(`(function(){
            var inp = document.getElementById('export-filename-input');
            var initVal = inp ? inp.value : '';
            if (inp) inp.value = 'Custom_Final_Eval_File';
            document.getElementById('btn-confirm-export-save').click();
            var used = window.__fpPrintTitle2 || '';
            window.print = window.__fpOrigPrint2;
            return { initVal: initVal, used: used, exportedFlag: Win11Report.hasExportedPdf() };
        })()`);
        assert('Final Polish II Sec 1b: Custom edited filename in Save dialog applies to PDF print title',
            customPdfSaveRes.used === 'Custom_Final_Eval_File' && customPdfSaveRes.exportedFlag,
            JSON.stringify(customPdfSaveRes));

        // ─── Feature Addition: "About" (حول التطبيق) Window & Entry Points ─────────────────────────
        await cdp.eval(`(() => {
            Win11SettingsApp.openTo('system', 'about');
        })()`);
        await sleep(120);
        const sysAboutBtnRes = await cdp.eval(`(() => {
            const btn = document.getElementById('sys-about-modal-btn');
            const specs = document.getElementById('ctrl-about-specs');
            if (!btn) return { found: false };
            btn.click();
            return { found: true, hasSpecs: !!specs };
        })()`);
        await sleep(250);
        const aboutModalState = await cdp.eval(`(async () => {
            const body = document.getElementById('about-app-modal-body');
            const closeBtn = document.getElementById('btn-about-close');
            const heroImg = document.getElementById('about-teacher-hero-img');
            if (heroImg && !heroImg.complete) {
                await new Promise(res => { heroImg.onload = res; heroImg.onerror = res; setTimeout(res, 1500); });
            }
            const txt = body ? body.innerText : '';
            return {
                open: !!(Win11Dialogs && Win11Dialogs.isOpen()),
                hasBody: !!body,
                heroImgLoaded: !!(heroImg && heroImg.complete && heroImg.naturalWidth > 0),
                dir: body ? (body.getAttribute('dir') || getComputedStyle(body).direction) : '',
                hasVersion: txt.includes('1.0.0'),
                hasCurriculum: txt.includes('بيئة التعامل مع الحاسوب') && txt.includes('لوحة التحكم'),
                hasTeacherMsg: txt.includes('رسالة الأستاذ:'),
                hasAutonomy: txt.includes('الاستقلالية (Autonomy):'),
                hasInteraction: txt.includes('التفاعل (Interaction):'),
                hasHelping: txt.includes('المساعدة المتبادلة (Helping Each Other):'),
                hasEncouragement: txt.includes('التشجيع (Encouragement):'),
                hasRoadmap: txt.includes('خارطة الطريق (Roadmap):') && txt.includes('خطوة أولى'),
                hasCloseBtn: !!closeBtn
            };
        })()`);
        await cdp.shot('14_about_window_ar_rtl.png');
        assert('Feature Addition About Sec 1-3: Settings -> System -> About opens RTL About modal with exact Arabic message, hero illustration & version',
            sysAboutBtnRes.found && sysAboutBtnRes.hasSpecs && aboutModalState.open && aboutModalState.hasBody &&
            aboutModalState.heroImgLoaded && aboutModalState.dir === 'rtl' && aboutModalState.hasVersion &&
            aboutModalState.hasCurriculum && aboutModalState.hasTeacherMsg && aboutModalState.hasAutonomy && aboutModalState.hasInteraction &&
            aboutModalState.hasHelping && aboutModalState.hasEncouragement && aboutModalState.hasRoadmap && aboutModalState.hasCloseBtn,
            JSON.stringify({ sysAboutBtnRes, aboutModalState }));

        // Close cleanly via #btn-about-close, then verify Desktop Context Menu & Start Menu entry points
        await cdp.eval(`document.getElementById('btn-about-close')?.click()`);
        await sleep(120);
        const closedAfterBtn = await cdp.eval(`!(Win11Dialogs && Win11Dialogs.isOpen())`);

        await cdp.eval(`Win11ContextMenu.showDesktopMenu(500, 300)`);
        await sleep(100);
        const ctxAboutOpen = await cdp.eval(`(() => {
            const item = document.getElementById('ctx-about-app');
            if (!item) return false;
            item.click();
            return true;
        })()`);
        await sleep(120);
        const ctxModalShown = await cdp.eval(`!!(Win11Dialogs && Win11Dialogs.isOpen() && document.getElementById('about-app-modal-body'))`);
        await cdp.eval(`document.getElementById('btn-about-close')?.click()`);
        await sleep(120);

        await cdp.eval(`document.getElementById('tb-start-btn')?.click()`);
        await sleep(100);
        const startAboutClicked = await cdp.eval(`(() => {
            const btn = document.getElementById('start-about-btn');
            if (!btn) return false;
            btn.click();
            return true;
        })()`);
        await sleep(120);
        const startModalReopen = await cdp.eval(`!!(Win11Dialogs && Win11Dialogs.isOpen() && document.getElementById('about-app-modal-body'))`);
        await cdp.eval(`document.getElementById('btn-about-close')?.click()`);
        await sleep(100);
        assert('Feature Addition About Sec 4: About modal closes cleanly and re-opens via Desktop context menu and Start menu',
            closedAfterBtn && ctxAboutOpen && ctxModalShown && startAboutClicked && startModalReopen,
            JSON.stringify({ closedAfterBtn, ctxAboutOpen, ctxModalShown, startAboutClicked, startModalReopen }));

        // Major Upgrade Part 1: Dynamic Weighted Scoring Engine & Task Toggling
        const scoringEngineRes = await cdp.eval(`(function(){
            Win11State.reset();
            Win11Assessment.startNewSimulation();
            Win11Assessment.startSession({ lastName: 'Test', firstName: 'Weight', fullName: 'Test Weight', classGroup: '1AS_ST_G1', pcNumber: '01', mode: 'training' });
            var defScores = Win11Assessment.getScores();
            var defWeight = defScores.totalWeight;

            // Test Rule of Three with custom integer coefficients & Task Toggling
            var prevCfg = Win11Assessment.getConfig();
            Win11Assessment.saveConfig({
                tasks_config: [
                    { id: 1, enabled: true, coefficient: 2, weight: 2, disabled_subtasks: [] },
                    { id: 2, enabled: true, coefficient: 2, weight: 2, disabled_subtasks: [] },
                    { id: 3, enabled: false, coefficient: 0, weight: 0, disabled_subtasks: [] },
                    { id: 4, enabled: false, coefficient: 0, weight: 0, disabled_subtasks: [] },
                    { id: 5, enabled: false, coefficient: 0, weight: 0, disabled_subtasks: [] },
                    { id: 6, enabled: false, coefficient: 0, weight: 0, disabled_subtasks: [] }
                ]
            });

            // Enter section & complete Task 1
            Win11Assessment.enterSection('time_lang');
            Win11State.set({ hasChangedDisplayLanguage: true });
            Win11Assessment.evaluate();
            var partialScores = Win11Assessment.getScores();
            // Total_Weight = 2 + 2 = 4
            // Earned_Weight = 2.0
            // Base_Score_Out_of_20 = (2.0 / 4) * 20 = 10.00
            // Final_Score = 10.00 (0 mistakes)

            // Test negative clamping (penalties > baseScore)
            Win11Assessment.recordMistake(1, 'خطأ تجريبي 1', 'desc', 10.0, 'test');
            Win11Assessment.recordMistake(1, 'خطأ تجريبي 2', 'desc', 10.0, 'test');
            var clampedZeroScores = Win11Assessment.getScores();

            // Test A4 Report includes Total_Weight & Final_Score
            var a4Html = Win11Report.buildA4Html();
            var hasTotalWeight = a4Html.indexOf('مجموع المعاملات (Total Weight)') !== -1;
            var hasFinalScore = a4Html.indexOf('العلامة النهائية (Final Score)') !== -1;

            // Restore configuration
            Win11Assessment.saveConfig(prevCfg);

            return {
                defWeight: defWeight,
                partialTotalWeight: partialScores.totalWeight,
                partialEarnedWeight: partialScores.earnedWeight,
                partialBaseScore: partialScores.baseScore,
                partialFinalScore: partialScores.finalScore,
                clampedZero: clampedZeroScores.finalScore === 0,
                hasTotalWeight: hasTotalWeight,
                hasFinalScore: hasFinalScore
            };
        })()`);
        assert('Major Upgrade Part 1: Weighted Scoring Engine calculates Rule of Three, clamps negative grades, and reports Total_Weight',
            scoringEngineRes.defWeight === 20 &&
            scoringEngineRes.partialTotalWeight === 4 &&
            scoringEngineRes.partialEarnedWeight === 2 &&
            scoringEngineRes.partialBaseScore === 10 &&
            scoringEngineRes.partialFinalScore === 10 &&
            scoringEngineRes.clampedZero &&
            scoringEngineRes.hasTotalWeight &&
            scoringEngineRes.hasFinalScore,
            JSON.stringify(scoringEngineRes));

        // Major Upgrade Part 2: Printable Summary Sheet (summary.html) & Print Button Integration
        const summaryPath = path.join(__dirname, '..', 'summary.html');
        const summaryExists = fs.existsSync(summaryPath);
        let summaryContent = '';
        if (summaryExists) {
            summaryContent = fs.readFileSync(summaryPath, 'utf8');
        }
        const summaryHasHeader = summaryContent.indexOf('بيئة التعامل مع الحاسوب') !== -1 && summaryContent.indexOf('لوحة التحكم') !== -1;
        const summaryHasCorrectedAdmin = summaryContent.indexOf('حساب مسؤول الكمبيوتر') !== -1 && summaryContent.indexOf('له كافة الصلاحيات') !== -1;
        const summaryHasCorrectedLimited = summaryContent.indexOf('الحساب القياسي') !== -1 && summaryContent.indexOf('صلاحياته شخصية ومحدودة') !== -1;
        const summaryHasCorrectedGuest = summaryContent.indexOf('حساب الضيف') !== -1 && summaryContent.indexOf('لا يمكن حمايته بكلمة مرور') !== -1;
        const summaryHasPageBreak = summaryContent.indexOf('page-break') !== -1 || summaryContent.indexOf('page-break-before') !== -1;

        const summaryIntegrationRes = await cdp.eval(`(function(){
            var hasOpenSummaryFn = typeof Win11Report.openSummarySheet === 'function';
            var hudSumBtn = document.getElementById('hud-summary-btn');
            Win11Report.openCertificate();
            var certSumBtn = document.getElementById('btn-print-summary-sheet');
            var certDlgOpen = Win11Dialogs.isOpen();
            Win11Dialogs.close(false);
            return {
                hasOpenSummaryFn: hasOpenSummaryFn,
                hudSumBtnPresent: !!hudSumBtn,
                certSumBtnPresent: !!certSumBtn,
                certDlgOpen: certDlgOpen
            };
        })()`);
        assert('Major Upgrade Part 2: Printable summary.html has official curriculum headers, corrected account table, and 1-click print buttons in HUD & Certificate',
            summaryExists && summaryHasHeader && summaryHasCorrectedAdmin && summaryHasCorrectedLimited && summaryHasCorrectedGuest && summaryHasPageBreak &&
            summaryIntegrationRes.hasOpenSummaryFn && summaryIntegrationRes.hudSumBtnPresent && summaryIntegrationRes.certSumBtnPresent,
            JSON.stringify({ summaryExists, summaryHasHeader, summaryHasCorrectedAdmin, summaryHasCorrectedLimited, summaryHasCorrectedGuest, summaryIntegrationRes }));

        // Final check on Chrome console/log errors across the entire run
        for (const ev of cdp.events) {
            if (ev.method === 'Runtime.exceptionThrown') {
                errors.push('RuntimeException: ' + JSON.stringify(ev.params.exceptionDetails));
            } else if (ev.method === 'Log.entryAdded' && ev.params.entry.level === 'error') {
                errors.push('BrowserLogError: ' + ev.params.entry.text);
            }
        }
        assert('Zero console errors or CORS blocks over file://', errors.length === 0, errors.join(' ; '));

        cdp.close();
    } finally {
        chrome.kill();
        try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }

    console.log('\n=== STAGE 8 VERIFICATION SUMMARY ===');
    let failed = 0;
    for (const r of results) {
        console.log((r.pass ? '[PASS] ' : '[FAIL] ') + r.name + (r.detail ? ' -> ' + r.detail : ''));
        if (!r.pass) failed++;
    }
    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
