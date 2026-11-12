/**
 * Zero-Dependency Pure-JS Cryptography & Encrypted inf.dll Sidecar Engine
 * Implements RFC 6234 SHA-256, RFC 2104 HMAC-SHA256, RFC 8018 PBKDF2-HMAC-SHA256 (100,000 iters),
 * and NIST FIPS-197 AES-256-CTR + Encrypt-then-MAC container verification.
 * Works identically across file:// (offline Win7 Chrome 109 / Firefox 115) and 127.0.0.1 EXE host.
 */
(function (global) {
    'use strict';

    // ----- 1. UTF-8 & Base64 Binary Helpers -----
    function utf8Encode(str) {
        var s = String(str || '');
        if (global.TextEncoder) {
            return new global.TextEncoder().encode(s);
        }
        var utf8 = unescape(encodeURIComponent(s));
        var out = new Uint8Array(utf8.length);
        for (var i = 0; i < utf8.length; i++) out[i] = utf8.charCodeAt(i);
        return out;
    }

    function utf8Decode(bytes) {
        if (global.TextDecoder) {
            return new global.TextDecoder('utf-8', { fatal: true }).decode(bytes);
        }
        var s = '';
        for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return decodeURIComponent(escape(s));
    }

    function bytesToBase64(bytes) {
        var bin = '';
        var chunk = 0x8000;
        for (var i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
        }
        return global.btoa(bin);
    }

    function base64ToBytes(b64) {
        var bin = global.atob(String(b64).replace(/\s+/g, ''));
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function concatBytes() {
        var total = 0;
        for (var i = 0; i < arguments.length; i++) total += arguments[i].length;
        var out = new Uint8Array(total);
        var pos = 0;
        for (var j = 0; j < arguments.length; j++) {
            out.set(arguments[j], pos);
            pos += arguments[j].length;
        }
        return out;
    }

    function constantTimeEqual(a, b) {
        if (!a || !b || a.length !== b.length) return false;
        var diff = 0;
        for (var i = 0; i < a.length; i++) diff |= (a[i] ^ b[i]);
        return diff === 0;
    }

    function randomBytes(len) {
        var out = new Uint8Array(len);
        if (global.crypto && global.crypto.getRandomValues) {
            global.crypto.getRandomValues(out);
            return out;
        }
        for (var i = 0; i < len; i++) {
            out[i] = (Math.random() * 256) | 0;
        }
        return out;
    }

    // ----- 2. SHA-256 (FIPS 180-4) -----
    var SHA256_K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);

    var SHA256_IV = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);

    var W_BUF = new Uint32Array(64);

    function sha256Compress(H, block, offset) {
        var w = W_BUF;
        for (var i = 0; i < 16; i++) {
            var p = offset + (i << 2);
            w[i] = ((block[p] << 24) | (block[p + 1] << 16) | (block[p + 2] << 8) | block[p + 3]) >>> 0;
        }
        for (var j = 16; j < 64; j++) {
            var s0a = w[j - 15];
            var s0 = ((s0a >>> 7) | (s0a << 25)) ^ ((s0a >>> 18) | (s0a << 14)) ^ (s0a >>> 3);
            var s1a = w[j - 2];
            var s1 = ((s1a >>> 17) | (s1a << 15)) ^ ((s1a >>> 19) | (s1a << 13)) ^ (s1a >>> 10);
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
        }
        var a = H[0], b = H[1], c = H[2], d = H[3];
        var e = H[4], f = H[5], g = H[6], h = H[7];
        for (var k = 0; k < 64; k++) {
            var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
            var ch = (e & f) ^ ((~e) & g);
            var temp1 = (h + S1 + ch + SHA256_K[k] + w[k]) >>> 0;
            var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
            var maj = (a & b) ^ (a & c) ^ (b & c);
            var temp2 = (S0 + maj) >>> 0;
            h = g; g = f; f = e; e = (d + temp1) >>> 0;
            d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
        }
        H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }

    function sha256(msg, initState, prefixBitLen) {
        var H = initState ? new Uint32Array(initState) : new Uint32Array(SHA256_IV);
        var len = msg.length;
        var pos = 0;
        while (pos + 64 <= len) {
            sha256Compress(H, msg, pos);
            pos += 64;
        }
        var rem = len - pos;
        var pad = new Uint8Array(rem + 1 + 8 <= 64 ? 64 : 128);
        pad.set(msg.subarray(pos));
        pad[rem] = 0x80;
        var totalBitsHi = Math.floor(((len + (prefixBitLen || 0)) * 8) / 4294967296);
        var totalBitsLo = ((len + (prefixBitLen || 0)) * 8) >>> 0;
        var end = pad.length;
        pad[end - 8] = (totalBitsHi >>> 24) & 0xff;
        pad[end - 7] = (totalBitsHi >>> 16) & 0xff;
        pad[end - 6] = (totalBitsHi >>> 8) & 0xff;
        pad[end - 5] = totalBitsHi & 0xff;
        pad[end - 4] = (totalBitsLo >>> 24) & 0xff;
        pad[end - 3] = (totalBitsLo >>> 16) & 0xff;
        pad[end - 2] = (totalBitsLo >>> 8) & 0xff;
        pad[end - 1] = totalBitsLo & 0xff;
        for (var p = 0; p < pad.length; p += 64) sha256Compress(H, pad, p);
        var out = new Uint8Array(32);
        for (var i = 0; i < 8; i++) {
            out[i * 4] = (H[i] >>> 24) & 0xff;
            out[i * 4 + 1] = (H[i] >>> 16) & 0xff;
            out[i * 4 + 2] = (H[i] >>> 8) & 0xff;
            out[i * 4 + 3] = H[i] & 0xff;
        }
        return out;
    }

    function makeHmacContext(keyBytes) {
        var key = keyBytes.length > 64 ? sha256(keyBytes) : keyBytes;
        var ipad = new Uint8Array(64);
        var opad = new Uint8Array(64);
        for (var i = 0; i < 64; i++) {
            var kb = i < key.length ? key[i] : 0;
            ipad[i] = kb ^ 0x36;
            opad[i] = kb ^ 0x5c;
        }
        var innerH = new Uint32Array(SHA256_IV);
        sha256Compress(innerH, ipad, 0);
        var outerH = new Uint32Array(SHA256_IV);
        sha256Compress(outerH, opad, 0);
        return { innerH: innerH, outerH: outerH };
    }

    function hmacWithContext(ctx, msgBytes) {
        var innerDigest = sha256(msgBytes, ctx.innerH, 64);
        return sha256(innerDigest, ctx.outerH, 64);
    }

    function hmacSha256(keyBytes, msgBytes) {
        return hmacWithContext(makeHmacContext(keyBytes), msgBytes);
    }

    function pbkdf2Sha256(passwordBytes, saltBytes, iterations, keyLenBytes) {
        var ctx = makeHmacContext(passwordBytes);
        var blocks = Math.ceil(keyLenBytes / 32);
        var dk = new Uint8Array(blocks * 32);
        var saltBlock = new Uint8Array(saltBytes.length + 4);
        saltBlock.set(saltBytes);
        var innerBlock = new Uint8Array(32);

        for (var b = 1; b <= blocks; b++) {
            saltBlock[saltBytes.length] = (b >>> 24) & 0xff;
            saltBlock[saltBytes.length + 1] = (b >>> 16) & 0xff;
            saltBlock[saltBytes.length + 2] = (b >>> 8) & 0xff;
            saltBlock[saltBytes.length + 3] = b & 0xff;

            var u = hmacWithContext(ctx, saltBlock);
            var t = new Uint8Array(u);
            for (var c = 1; c < iterations; c++) {
                innerBlock.set(u);
                u = hmacWithContext(ctx, innerBlock);
                for (var x = 0; x < 32; x++) t[x] ^= u[x];
            }
            dk.set(t, (b - 1) * 32);
        }
        return dk.subarray(0, keyLenBytes);
    }

    // ----- 3. AES-256-CTR (FIPS 197 + NIST SP 800-38A) -----
    var SBOX = new Uint8Array([
        0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
        0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
        0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
        0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
        0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
        0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
        0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
        0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
        0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
        0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
        0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
        0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
        0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
        0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
        0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
        0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
    ]);
    var RCON = new Uint8Array([0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36]);

    function xtime(x) {
        return ((x << 1) ^ ((x & 0x80) ? 0x1b : 0)) & 0xff;
    }

    function aes256ExpandKey(key) {
        var rk = new Uint8Array(240); // 15 * 16 bytes
        rk.set(key.subarray(0, 32));
        var i = 32;
        var r = 0;
        var t = new Uint8Array(4);
        while (i < 240) {
            t[0] = rk[i - 4]; t[1] = rk[i - 3]; t[2] = rk[i - 2]; t[3] = rk[i - 1];
            if ((i % 32) === 0) {
                var tmp = t[0];
                t[0] = SBOX[t[1]] ^ RCON[r++];
                t[1] = SBOX[t[2]];
                t[2] = SBOX[t[3]];
                t[3] = SBOX[tmp];
            } else if ((i % 32) === 16) {
                t[0] = SBOX[t[0]]; t[1] = SBOX[t[1]]; t[2] = SBOX[t[2]]; t[3] = SBOX[t[3]];
            }
            for (var k = 0; k < 4; k++) {
                rk[i] = rk[i - 32] ^ t[k];
                i++;
            }
        }
        return rk;
    }

    function aes256EncryptBlock(rk, block16, out16) {
        var s = new Uint8Array(16);
        for (var i = 0; i < 16; i++) s[i] = block16[i] ^ rk[i];
        for (var round = 1; round <= 14; round++) {
            // SubBytes
            for (var b = 0; b < 16; b++) s[b] = SBOX[s[b]];
            // ShiftRows
            var t1 = s[1]; s[1] = s[5]; s[5] = s[9]; s[9] = s[13]; s[13] = t1;
            var t2a = s[2], t2b = s[6]; s[2] = s[10]; s[6] = s[14]; s[10] = t2a; s[14] = t2b;
            var t3 = s[15]; s[15] = s[11]; s[11] = s[7]; s[7] = s[3]; s[3] = t3;
            // MixColumns (omit in final round)
            if (round < 14) {
                for (var c = 0; c < 16; c += 4) {
                    var a0 = s[c], a1 = s[c + 1], a2 = s[c + 2], a3 = s[c + 3];
                    var xorAll = a0 ^ a1 ^ a2 ^ a3;
                    s[c]     ^= xorAll ^ xtime(a0 ^ a1);
                    s[c + 1] ^= xorAll ^ xtime(a1 ^ a2);
                    s[c + 2] ^= xorAll ^ xtime(a2 ^ a3);
                    s[c + 3] ^= xorAll ^ xtime(a3 ^ a0);
                }
            }
            var rOff = round * 16;
            for (var w = 0; w < 16; w++) s[w] ^= rk[rOff + w];
        }
        out16.set(s);
    }

    function aes256Ctr(key32, iv16, inputBytes) {
        var rk = aes256ExpandKey(key32);
        var counter = new Uint8Array(16);
        counter.set(iv16.subarray(0, 16));
        var keystream = new Uint8Array(16);
        var out = new Uint8Array(inputBytes.length);
        for (var offset = 0; offset < inputBytes.length; offset += 16) {
            aes256EncryptBlock(rk, counter, keystream);
            var end = Math.min(16, inputBytes.length - offset);
            for (var j = 0; j < end; j++) {
                out[offset + j] = inputBytes[offset + j] ^ keystream[j];
            }
            for (var c = 15; c >= 0; c--) {
                counter[c] = (counter[c] + 1) & 0xff;
                if (counter[c] !== 0) break;
            }
        }
        return out;
    }

    // ----- 4. Encrypted inf.dll Sidecar Protocol (Version 2 Binary) -----
    var MAGIC = [0x57, 0x31, 0x31, 0x53]; // "W11S"
    var FORMAT_VERSION = 0x02;
    var FORMAT_FLAGS = 0x01;
    var KDF_ITERATIONS = 100000;
    var HEADER_LEN = 82;

    // Runtime domain material for classroom deployment block (never written to disk; combined with random header salt)
    var RUNTIME_DOMAIN_PARTS = [0x57,0x31,0x31,0x5f,0x31,0x41,0x53,0x5f,0x44,0x5a,0x5f,0x53,0x49,0x4d,0x5f,0x52,0x54,0x5f,0x56,0x32];

    function deriveRuntimeKeys(salt16) {
        var domainBytes = new Uint8Array(RUNTIME_DOMAIN_PARTS);
        var combined = concatBytes(domainBytes, utf8Encode('|WIN11_EDU_23H2|'), salt16);
        var mat = pbkdf2Sha256(combined, salt16, 2000, 64);
        return {
            encKey: mat.subarray(0, 32),
            macKey: mat.subarray(32, 64)
        };
    }

    function deriveVaultKeys(password, salt16, iterations) {
        var passBytes = utf8Encode(password);
        var mat = pbkdf2Sha256(passBytes, salt16, iterations || KDF_ITERATIONS, 64);
        return {
            encKey: mat.subarray(0, 32),
            macKey: mat.subarray(32, 64)
        };
    }

    function writeUInt32BE(buf, pos, val) {
        buf[pos]     = (val >>> 24) & 0xff;
        buf[pos + 1] = (val >>> 16) & 0xff;
        buf[pos + 2] = (val >>> 8) & 0xff;
        buf[pos + 3] = val & 0xff;
    }

    function readUInt32BE(buf, pos) {
        return (((buf[pos] << 24) | (buf[pos + 1] << 16) | (buf[pos + 2] << 8) | buf[pos + 3]) >>> 0);
    }

    function stripSecretsFromConfig(cfg) {
        var clone = global.Win11Compat ? global.Win11Compat.deepClone(cfg) : JSON.parse(JSON.stringify(cfg));
        delete clone.password;
        delete clone.vault;
        return clone;
    }

    function encryptInfDllV2(cfg, password, vaultPayload) {
        if (!password || String(password).length < 1) {
            throw new Error('Password required to encrypt inf.dll');
        }
        var runtimeObj = stripSecretsFromConfig(cfg);
        var vaultObj = vaultPayload || {
            verifier: 'W11_VAULT_OK_V2',
            audit_log: [],
            updated_at: new Date().toISOString()
        };
        vaultObj.verifier = 'W11_VAULT_OK_V2';
        vaultObj.updated_at = new Date().toISOString();

        var rtPlain = utf8Encode(JSON.stringify(runtimeObj));
        var vtPlain = utf8Encode(JSON.stringify(vaultObj));

        var rtSalt = randomBytes(16);
        var rtIv = randomBytes(16);
        var vtSalt = randomBytes(16);
        var vtIv = randomBytes(16);

        var rtKeys = deriveRuntimeKeys(rtSalt);
        var vtKeys = deriveVaultKeys(String(password), vtSalt, KDF_ITERATIONS);

        var rtCipher = aes256Ctr(rtKeys.encKey, rtIv, rtPlain);
        var vtCipher = aes256Ctr(vtKeys.encKey, vtIv, vtPlain);

        var header = new Uint8Array(HEADER_LEN);
        header[0] = MAGIC[0]; header[1] = MAGIC[1]; header[2] = MAGIC[2]; header[3] = MAGIC[3];
        header[4] = FORMAT_VERSION;
        header[5] = FORMAT_FLAGS;
        writeUInt32BE(header, 6, KDF_ITERATIONS);
        header.set(rtSalt, 10);
        header.set(rtIv, 26);
        header.set(vtSalt, 42);
        header.set(vtIv, 58);
        writeUInt32BE(header, 74, rtCipher.length);
        writeUInt32BE(header, 78, vtCipher.length);

        var vaultMac = hmacSha256(vtKeys.macKey, concatBytes(header, vtCipher));
        var preOuterMac = concatBytes(header, rtCipher, vtCipher, vaultMac);
        var outerMac = hmacSha256(rtKeys.macKey, preOuterMac);

        return concatBytes(preOuterMac, outerMac);
    }

    function isV2BinaryHeader(bytes) {
        if (!bytes || bytes.length < HEADER_LEN + 64) return false;
        return bytes[0] === MAGIC[0] && bytes[1] === MAGIC[1] && bytes[2] === MAGIC[2] && bytes[3] === MAGIC[3];
    }

    function parseAndVerifyRuntimeInfDll(rawBytes) {
        if (!rawBytes || rawBytes.length === 0) {
            return { ok: false, status: 'missing' };
        }
        var bytes = (rawBytes instanceof Uint8Array) ? rawBytes : utf8Encode(rawBytes);

        // 1. Check v2 binary container
        if (isV2BinaryHeader(bytes)) {
            if (bytes[4] !== FORMAT_VERSION) {
                return { ok: false, status: 'corrupt', reason: 'Unsupported format version' };
            }
            var iters = readUInt32BE(bytes, 6);
            var rtSalt = bytes.subarray(10, 26);
            var rtIv = bytes.subarray(26, 42);
            var vtSalt = bytes.subarray(42, 58);
            var vtIv = bytes.subarray(58, 74);
            var rtLen = readUInt32BE(bytes, 74);
            var vtLen = readUInt32BE(bytes, 78);

            var expectedLen = HEADER_LEN + rtLen + vtLen + 32 + 32;
            if (iters < 10000 || expectedLen !== bytes.length) {
                return { ok: false, status: 'tampered', reason: 'Header length mismatch' };
            }

            var rtCipher = bytes.subarray(HEADER_LEN, HEADER_LEN + rtLen);
            var vtCipher = bytes.subarray(HEADER_LEN + rtLen, HEADER_LEN + rtLen + vtLen);
            var vaultMac = bytes.subarray(HEADER_LEN + rtLen + vtLen, HEADER_LEN + rtLen + vtLen + 32);
            var outerMac = bytes.subarray(bytes.length - 32);

            var rtKeys = deriveRuntimeKeys(rtSalt);
            var expectedOuter = hmacSha256(rtKeys.macKey, bytes.subarray(0, bytes.length - 32));
            if (!constantTimeEqual(outerMac, expectedOuter)) {
                return { ok: false, status: 'tampered', reason: 'Integrity MAC verification failed' };
            }

            try {
                var rtPlain = aes256Ctr(rtKeys.encKey, rtIv, rtCipher);
                var cfgObj = JSON.parse(utf8Decode(rtPlain));
                delete cfgObj.password;
                return {
                    ok: true,
                    format: 'v2',
                    status: 'loaded',
                    config: cfgObj,
                    envelope: {
                        header: new Uint8Array(bytes.subarray(0, HEADER_LEN)),
                        iters: iters,
                        vtSalt: new Uint8Array(vtSalt),
                        vtIv: new Uint8Array(vtIv),
                        vtCipher: new Uint8Array(vtCipher),
                        vaultMac: new Uint8Array(vaultMac),
                        rawBytes: new Uint8Array(bytes)
                    }
                };
            } catch (e1) {
                return { ok: false, status: 'tampered', reason: 'Corrupted payload structure' };
            }
        }

        // 2. Legacy Base64 JSON migration (root inf.dll v1)
        try {
            var txt = utf8Decode(bytes).trim();
            var legacyBytes = base64ToBytes(txt);
            var legacyObj = JSON.parse(utf8Decode(legacyBytes));
            if (legacyObj && typeof legacyObj === 'object' && legacyObj.institution_name) {
                var legacyPassword = legacyObj.password || null;
                delete legacyObj.password;
                return {
                    ok: true,
                    format: 'legacy_v1',
                    status: 'legacy',
                    config: legacyObj,
                    legacyPassword: legacyPassword,
                    rawBytes: new Uint8Array(bytes)
                };
            }
        } catch (e2) { }

        return { ok: false, status: 'tampered', reason: 'Unrecognized or corrupted inf.dll signature' };
    }

    function unlockTeacherVault(loadedResult, enteredPassword) {
        if (!enteredPassword) return { ok: false, error: 'empty_password' };
        if (!loadedResult || loadedResult.status === 'missing') {
            return { ok: false, error: 'no_inf_dll' };
        }
        if (loadedResult.format === 'legacy_v1') {
            var expected = loadedResult.legacyPassword || 'admin123';
            if (String(enteredPassword) !== String(expected)) {
                return { ok: false, error: 'wrong_password' };
            }
            return {
                ok: true,
                vault: { verifier: 'W11_VAULT_OK_V2', audit_log: [], migrated_from_v1: true }
            };
        }
        var env = loadedResult.envelope;
        if (!env) return { ok: false, error: 'corrupt_envelope' };

        var vtKeys = deriveVaultKeys(String(enteredPassword), env.vtSalt, env.iters);
        var expectedMac = hmacSha256(vtKeys.macKey, concatBytes(env.header, env.vtCipher));
        if (!constantTimeEqual(env.vaultMac, expectedMac)) {
            return { ok: false, error: 'wrong_password' };
        }
        try {
            var vtPlain = aes256Ctr(vtKeys.encKey, env.vtIv, env.vtCipher);
            var vaultObj = JSON.parse(utf8Decode(vtPlain));
            if (!vaultObj || vaultObj.verifier !== 'W11_VAULT_OK_V2') {
                return { ok: false, error: 'wrong_password' };
            }
            return { ok: true, vault: vaultObj };
        } catch (e) {
            return { ok: false, error: 'wrong_password' };
        }
    }

    function bytesToHex(bytes, maxLen) {
        var limit = Math.min(bytes.length, maxLen || bytes.length);
        var parts = [];
        for (var i = 0; i < limit; i++) {
            var h = bytes[i].toString(16);
            parts.push(h.length < 2 ? '0' + h : h);
        }
        return parts.join(' ');
    }

    global.Win11Crypto = {
        sha256: sha256,
        hmacSha256: hmacSha256,
        pbkdf2Sha256: pbkdf2Sha256,
        aes256Ctr: aes256Ctr,
        utf8Encode: utf8Encode,
        utf8Decode: utf8Decode,
        bytesToBase64: bytesToBase64,
        base64ToBytes: base64ToBytes,
        bytesToHex: bytesToHex,
        encryptInfDll: encryptInfDllV2,
        parseRuntimeInfDll: parseAndVerifyRuntimeInfDll,
        unlockVault: unlockTeacherVault
    };
})(window);

