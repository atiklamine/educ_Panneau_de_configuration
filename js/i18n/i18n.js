/**
 * Internationalization (i18n) & Bidirectional Typography Engine
 * Default language: Arabic ('ar', dir="rtl").
 * Supports Latin-digit default ('0-9') and Unicode Isolate BiDi safety.
 */
(function (global) {
    'use strict';

    var catalogs = global.__WIN11_I18N__ = global.__WIN11_I18N__ || {};
    var currentLang = 'ar';
    var langReqSeq = 0;
    var numeralMode = 'latin'; // 'latin' (0-9 default) | 'indic'
    var listeners = [];

    var INDIC_DIGITS = ['\u0660', '\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];

    function hasArabicChars(str) {
        return /[\u0600-\u06FF]/.test(str);
    }

    function hasLatinOrDigitChars(str) {
        return /[A-Za-z\u00C0-\u024F0-9]/.test(str);
    }

    function resolvePath(obj, path) {
        if (!obj || !path) return undefined;
        var parts = path.split('.');
        var cur = obj;
        for (var i = 0; i < parts.length; i++) {
            if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
            cur = cur[parts[i]];
        }
        return cur;
    }

    function formatDigits(str) {
        if (str === null || str === undefined) return '';
        var s = String(str);
        if (numeralMode === 'indic' && currentLang === 'ar') {
            return s.replace(/[0-9]/g, function (d) { return INDIC_DIGITS[Number(d)]; });
        }
        return s;
    }

    /**
     * Plain-text BiDi isolation using Unicode Directional Isolates (LRI \u2066 .. PDI \u2069).
     */
    function bidiText(str) {
        if (!str) return '';
        var text = String(str);
        if (currentLang !== 'ar' || !hasArabicChars(text) || !hasLatinOrDigitChars(text)) {
            return text;
        }
        // Isolate Latin (including accented French letters), digits, version numbers, IPv4, shortcuts, and GMT tags
        var isolated = text.replace(/([A-Za-z\u00C0-\u024F0-9]+(?:[\s.\-+:\/!&@][A-Za-z\u00C0-\u024F0-9+!]+)*)/g, '\u2066$1\u2069');
        return '\u200F' + isolated;
    }

    /**
     * Escapes plain text and wraps embedded Latin/numeric tokens in <bdi dir="ltr">
     * so browser layout engines preserve crisp direction boundaries in mixed Arabic copy.
     */
    function bidiHtml(str) {
        if (str === null || str === undefined) return '';
        var escaped = global.Win11Compat.escapeHtml(formatDigits(str));
        if (currentLang !== 'ar' || !hasArabicChars(escaped)) {
            return escaped;
        }
        // Tokenize pure Latin (ASCII + Latin Extended accents) & numeric sequences (excluding HTML entities like &amp;)
        return escaped.replace(/(&[a-zA-Z0-9#]+;)|([A-Za-z\u00C0-\u024F0-9]+(?:[.\-+:\/!@][A-Za-z\u00C0-\u024F0-9+!]+)*(?:\s+[A-Za-z\u00C0-\u024F0-9]+(?:[.\-+:\/!@][A-Za-z\u00C0-\u024F0-9+!]+)*)*)/g, function (full, entity, token) {
            if (entity) return entity;
            if (!token) return full;
            return '<bdi dir="ltr">' + token + '</bdi>';
        });
    }

    function applyDocumentDirection(lang) {
        var meta = (catalogs[lang] && catalogs[lang]._meta) ? catalogs[lang]._meta : { dir: (lang === 'ar' ? 'rtl' : 'ltr') };
        var dir = meta.dir || (lang === 'ar' ? 'rtl' : 'ltr');
        if (document && document.documentElement) {
            document.documentElement.setAttribute('lang', lang);
            document.documentElement.setAttribute('dir', dir);
        }
        if (document && document.body) {
            document.body.setAttribute('dir', dir);
            document.body.className = document.body.className.replace(/\blang-\w+\b/g, '').trim() + ' lang-' + lang;
        }
    }

    var I18N = {
        getLang: function () { return currentLang; },
        getDir: function () {
            var meta = catalogs[currentLang] && catalogs[currentLang]._meta;
            return (meta && meta.dir) ? meta.dir : (currentLang === 'ar' ? 'rtl' : 'ltr');
        },
        isRtl: function () { return this.getDir() === 'rtl'; },
        getMeta: function (lang) {
            var l = lang || currentLang;
            return (catalogs[l] && catalogs[l]._meta) ? catalogs[l]._meta : { code: l, dir: (l === 'ar' ? 'rtl' : 'ltr'), name: l };
        },
        setNumerals: function (mode) {
            numeralMode = (mode === 'indic') ? 'indic' : 'latin';
            this.notify();
        },
        getNumerals: function () { return numeralMode; },
        formatDigits: formatDigits,
        bidiText: bidiText,
        bidiHtml: bidiHtml,

        t: function (key, vars) {
            var val = resolvePath(catalogs[currentLang], key);
            if (val === undefined) val = resolvePath(catalogs.ar, key);
            if (val === undefined) val = resolvePath(catalogs.en, key);
            if (val === undefined) return key;
            var out = String(val);
            if (vars) {
                for (var k in vars) {
                    if (Object.prototype.hasOwnProperty.call(vars, k)) {
                        out = out.split('{' + k + '}').join(String(vars[k]));
                    }
                }
            }
            return formatDigits(out);
        },

        tHtml: function (key, vars) {
            return bidiHtml(this.t(key, vars));
        },

        setLanguage: function (lang, callback) {
            var target = (lang === 'fr' || lang === 'en' || lang === 'ar') ? lang : 'ar';
            var self = this;
            langReqSeq += 1;
            var myReq = langReqSeq;

            function activate() {
                if (myReq !== langReqSeq) {
                    if (typeof callback === 'function') callback(null);
                    return;
                }
                currentLang = target;
                applyDocumentDirection(target);
                self.notify();
                if (typeof callback === 'function') callback(null);
            }

            if (catalogs[target]) {
                activate();
                return;
            }

            // Try dynamic script payload first (works identically on file:// and http://)
            global.Win11Compat.loadScript('js/i18n/' + target + '.js', function (err) {
                if (!err && catalogs[target]) {
                    activate();
                    return;
                }
                // Fallback to JSON fetch if running over http(s)
                if (global.fetch && !global.Win11Compat.features.isFileProtocol) {
                    global.fetch('js/i18n/' + target + '.json')
                        .then(function (r) { return r.json(); })
                        .then(function (json) {
                            catalogs[target] = json;
                            activate();
                        })
                        .catch(function () {
                            if (typeof callback === 'function') callback(err);
                        });
                } else if (typeof callback === 'function') {
                    callback(err || new Error('Language bundle missing: ' + target));
                }
            });
        },

        onChange: function (fn) {
            if (typeof fn === 'function') listeners.push(fn);
        },

        notify: function () {
            for (var i = 0; i < listeners.length; i++) {
                try { listeners[i](currentLang); } catch (e) { }
            }
        }
    };

    global.Win11I18N = I18N;
})(window);
