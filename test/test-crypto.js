/**
 * Cryptographic Correctness & inf.dll Tamper/Security Verification
 * Compares Win11Crypto byte-for-byte against Node native OpenSSL crypto.
 */
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

global.window = global;
require(path.resolve(__dirname, '../js/core/config-crypto.js'));
const W = global.Win11Crypto;

function hex(u8) { return Buffer.from(u8).toString('hex'); }

// 1. SHA-256 byte-for-byte vs OpenSSL
const msg1 = Buffer.from('ثانوية الشهيد أحمد رضا حوحو — Windows 11 1AS', 'utf8');
assert.strictEqual(
    hex(W.sha256(new Uint8Array(msg1))),
    crypto.createHash('sha256').update(msg1).digest('hex'),
    'SHA-256 UTF-8 mismatch'
);
assert.strictEqual(
    hex(W.sha256(new Uint8Array(0))),
    crypto.createHash('sha256').update(Buffer.alloc(0)).digest('hex'),
    'SHA-256 empty mismatch'
);

// 2. HMAC-SHA256 byte-for-byte vs OpenSSL (short key & >64B key)
const keyShort = Buffer.from('teacher-key-1as');
const keyLong = Buffer.alloc(90, 0xab);
assert.strictEqual(
    hex(W.hmacSha256(new Uint8Array(keyShort), new Uint8Array(msg1))),
    crypto.createHmac('sha256', keyShort).update(msg1).digest('hex'),
    'HMAC-SHA256 short key mismatch'
);
assert.strictEqual(
    hex(W.hmacSha256(new Uint8Array(keyLong), new Uint8Array(msg1))),
    crypto.createHmac('sha256', keyLong).update(msg1).digest('hex'),
    'HMAC-SHA256 long key mismatch'
);

// 3. PBKDF2-HMAC-SHA256 (1000 iters & 64 bytes) byte-for-byte vs OpenSSL
const salt = Buffer.from('0123456789abcdef', 'utf8');
assert.strictEqual(
    hex(W.pbkdf2Sha256(new Uint8Array(Buffer.from('ProfPass#2026')), new Uint8Array(salt), 1000, 64)),
    crypto.pbkdf2Sync('ProfPass#2026', salt, 1000, 64, 'sha256').toString('hex'),
    'PBKDF2-HMAC-SHA256 mismatch'
);

// 4. AES-256-CTR byte-for-byte vs OpenSSL
const aesKey = crypto.randomBytes(32);
const aesIv = crypto.randomBytes(16);
const plain = Buffer.from('{"institution_name":"ثانوية","group":"فوج 1","test":12345}', 'utf8');
const cipherNode = crypto.createCipheriv('aes-256-ctr', aesKey, aesIv);
const expectedCt = Buffer.concat([cipherNode.update(plain), cipherNode.final()]).toString('hex');
const actualCt = hex(W.aes256Ctr(new Uint8Array(aesKey), new Uint8Array(aesIv), new Uint8Array(plain)));
assert.strictEqual(actualCt, expectedCt, 'AES-256-CTR mismatch');

// 5. Full inf.dll V2 lifecycle: encrypt, verify zero plaintext secrets, unlock, tamper detection
const sampleCfg = {
    password: 'SecretPassword!1AS',
    institution_name: 'ثانوية الشهيد أحمد رضا حوحو',
    teacher_name: 'الأستاذ حاج عيسى',
    academic_year: '2026 / 2027',
    class_groups: ['1AS_TCST_G01']
};
const t0 = Date.now();
const bin = W.encryptInfDll(sampleCfg, 'SecretPassword!1AS');
const encMs = Date.now() - t0;

// Ensure password or plaintext strings never appear in binary inf.dll
const binBuf = Buffer.from(bin);
assert.strictEqual(binBuf.includes(Buffer.from('SecretPassword!1AS')), false, 'Plaintext password leaked!');
assert.strictEqual(binBuf.includes(Buffer.from('institution_name')), false, 'Plaintext JSON key leaked!');
assert.strictEqual(binBuf.includes(Buffer.from('الأستاذ حاج عيسى', 'utf8')), false, 'Plaintext Arabic leaked!');

// Parse runtime section without password
const loaded = W.parseRuntimeInfDll(bin);
assert.strictEqual(loaded.ok, true);
assert.strictEqual(loaded.format, 'v2');
assert.strictEqual(loaded.config.institution_name, 'ثانوية الشهيد أحمد رضا حوحو');
assert.strictEqual(loaded.config.password, undefined, 'Password must not be returned in runtime config!');

// Wrong password rejected; right password unlocks vault
const badUnlock = W.unlockVault(loaded, 'wrong_pass');
assert.strictEqual(badUnlock.ok, false);
const t1 = Date.now();
const goodUnlock = W.unlockVault(loaded, 'SecretPassword!1AS');
const decMs = Date.now() - t1;
assert.strictEqual(goodUnlock.ok, true);
assert.strictEqual(goodUnlock.vault.verifier, 'W11_VAULT_OK_V2');

// Flip 1 bit in header, ciphertext, vault, and MAC -> every position must fail tamper check
for (const pos of [6, 15, 50, 85, bin.length - 40, bin.length - 5]) {
    const tampered = new Uint8Array(bin);
    tampered[pos] ^= 0x01;
    const res = W.parseRuntimeInfDll(tampered);
    assert.strictEqual(res.ok, false, 'Failed to detect tamper at byte ' + pos);
    assert.strictEqual(res.status, 'tampered');
}

// Missing inf.dll returns missing cleanly
assert.strictEqual(W.parseRuntimeInfDll(new Uint8Array(0)).status, 'missing');

console.log('ALL CRYPTO & INF.DLL TAMPER CHECKS PASSED (enc=' + encMs + 'ms, unlock=' + decMs + 'ms)');
console.log('First 64 bytes hex:', W.bytesToHex(bin, 64));
