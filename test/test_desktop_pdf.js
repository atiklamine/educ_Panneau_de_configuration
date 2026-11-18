const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('os');
const os = require('os');

const exePath = 'D:\\enseignement\\dev_tools\\settings_projects\\003\\dist\\Win11_Simulator_1AS.exe';
const port = 9876;
const desktop = 'C:\\Users\\myPC\\Desktop';

console.log('Starting launcher in headless mode on port', port);
const proc = spawn(exePath, ['--no-browser', `--port=${port}`], { stdio: ['ignore', 'pipe', 'pipe'] });

let started = false;
proc.stdout.on('data', (d) => {
    const text = d.toString();
    console.log('[stdout]', text.trim());
    if (text.includes('WIN11_SIM_HOST_READY')) {
        started = true;
        runTest();
    }
});

proc.stderr.on('data', (d) => {
    console.log('[stderr]', d.toString().trim());
});

proc.on('close', (code) => {
    console.log('Launcher exited with code', code);
});

function runTest() {
    console.log('Sending test report to /api/save-to-desktop...');
    const testHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Test Report</title></head><body><h1>بطاقة تقويم الأعمال التطبيقية</h1><p>التلميذ: بن علي محمد</p></body></html>';
    const b64 = Buffer.from(testHtml, 'utf8').toString('base64');
    const filename = '1AS_Rapport_TEST_' + Date.now() + '.pdf';

    const reqData = JSON.stringify({
        filename: filename,
        base64: b64,
        html: testHtml
    });

    const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/api/save-to-desktop',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(reqData)
        }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log('Response status:', res.statusCode);
            console.log('Response body:', body);
            try {
                const json = JSON.parse(body);
                if (json.ok && json.path) {
                    console.log('File generated at:', json.path);
                    if (fs.existsSync(json.path)) {
                        const stat = fs.statSync(json.path);
                        const buf = fs.readFileSync(json.path);
                        const magic = buf.slice(0, 4).toString('ascii');
                        console.log('File size:', stat.size, 'bytes');
                        console.log('File magic:', magic);
                        if (magic === '%PDF' && json.path.endsWith('.pdf')) {
                            console.log('TEST PASSED! Valid non-editable PDF generated successfully!');
                        } else {
                            console.log('TEST FAILED: File is not a PDF or has wrong header');
                        }
                        // Clean up test file
                        try { fs.unlinkSync(json.path); } catch (e) {}
                    } else {
                        console.log('TEST FAILED: Target file does not exist');
                    }
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
            // Terminate launcher
            proc.kill();
            process.exit(0);
        });
    });

    req.on('error', (err) => {
        console.error('Request error:', err);
        proc.kill();
        process.exit(1);
    });

    req.write(reqData);
    req.end();
}

setTimeout(() => {
    if (!started) {
        console.error('Launcher timed out starting up');
        proc.kill();
        process.exit(1);
    }
}, 10000);
