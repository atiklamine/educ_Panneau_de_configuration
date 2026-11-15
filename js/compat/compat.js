/**
 * Compatibility & Feature Detection Layer (Win7 Chrome 109 / Firefox 115 ESR / Legacy WebView Safe)
 * Provides robust ES5/ES6 polyfills, safe storage fallback, DOM utilities, and CORS-free lazy script loading.
 */
(function (global) {
    'use strict';

    // --------------------------------------------------------------------------
    // Standard Polyfills for Windows 7 & Legacy Browsers
    // --------------------------------------------------------------------------

    // 1. Object helpers
    if (!Object.assign) {
        Object.assign = function (target) {
            if (target === null || target === undefined) target = {};
            for (var i = 1; i < arguments.length; i++) {
                var src = arguments[i];
                if (!src) continue;
                for (var k in src) {
                    if (Object.prototype.hasOwnProperty.call(src, k)) {
                        target[k] = src[k];
                    }
                }
            }
            return target;
        };
    }
    if (!Object.keys) {
        Object.keys = function (obj) {
            var keys = [];
            for (var k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) keys.push(k);
            }
            return keys;
        };
    }
    if (!Object.values) {
        Object.values = function (obj) {
            var vals = [];
            for (var k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) vals.push(obj[k]);
            }
            return vals;
        };
    }
    if (!Object.entries) {
        Object.entries = function (obj) {
            var entries = [];
            for (var k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) entries.push([k, obj[k]]);
            }
            return entries;
        };
    }

    // 2. Array helpers
    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }
    if (!Array.from) {
        Array.from = function (iterable) {
            if (iterable === null || iterable === undefined) return [];
            var res = [];
            for (var i = 0; i < iterable.length; i++) res.push(iterable[i]);
            return res;
        };
    }
    if (!Array.prototype.find) {
        Array.prototype.find = function (predicate) {
            if (this === null || typeof predicate !== 'function') return undefined;
            for (var i = 0; i < this.length; i++) {
                if (predicate(this[i], i, this)) return this[i];
            }
            return undefined;
        };
    }
    if (!Array.prototype.findIndex) {
        Array.prototype.findIndex = function (predicate) {
            if (this === null || typeof predicate !== 'function') return -1;
            for (var i = 0; i < this.length; i++) {
                if (predicate(this[i], i, this)) return i;
            }
            return -1;
        };
    }
    if (!Array.prototype.includes) {
        Array.prototype.includes = function (searchElement, fromIndex) {
            var idx = fromIndex || 0;
            if (idx < 0) idx = Math.max(0, this.length + idx);
            for (var i = idx; i < this.length; i++) {
                if (this[i] === searchElement || (searchElement !== searchElement && this[i] !== this[i])) return true;
            }
            return false;
        };
    }

    // 3. String helpers
    if (!String.prototype.includes) {
        String.prototype.includes = function (search, start) {
            return this.indexOf(search, start || 0) !== -1;
        };
    }
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (search, pos) {
            return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
        };
    }
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (search, thisLen) {
            if (thisLen === undefined || thisLen > this.length) thisLen = this.length;
            return this.substring(thisLen - search.length, thisLen) === search;
        };
    }
    if (!String.prototype.padStart) {
        String.prototype.padStart = function (targetLength, padString) {
            var str = String(this);
            targetLength = targetLength >> 0;
            padString = String((typeof padString !== 'undefined' ? padString : ' '));
            if (str.length > targetLength) return String(str);
            targetLength = targetLength - str.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + str;
        };
    }
    if (!String.prototype.padEnd) {
        String.prototype.padEnd = function (targetLength, padString) {
            var str = String(this);
            targetLength = targetLength >> 0;
            padString = String((typeof padString !== 'undefined' ? padString : ' '));
            if (str.length > targetLength) return String(str);
            targetLength = targetLength - str.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length);
            }
            return str + padString.slice(0, targetLength);
        };
    }
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
    }

    // 4. Number helpers
    if (!Number.isInteger) {
        Number.isInteger = function (val) {
            return typeof val === 'number' && isFinite(val) && Math.floor(val) === val;
        };
    }
    if (!Number.isNaN) {
        Number.isNaN = function (val) {
            return typeof val === 'number' && val !== val;
        };
    }

    // 5. CustomEvent polyfill
    if (typeof global.CustomEvent !== 'function') {
        var CustomEventPolyfill = function (event, params) {
            params = params || { bubbles: false, cancelable: false, detail: null };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };
        CustomEventPolyfill.prototype = (global.Event && global.Event.prototype) || {};
        global.CustomEvent = CustomEventPolyfill;
    }

    // 6. Minimal reliable Promise polyfill if missing
    if (!global.Promise) {
        var PromisePolyfill = function (executor) {
            var self = this;
            self.state = 'pending';
            self.value = undefined;
            self.handlers = [];

            function resolve(val) {
                if (self.state !== 'pending') return;
                if (val && typeof val.then === 'function') {
                    val.then(resolve, reject);
                    return;
                }
                self.state = 'fulfilled';
                self.value = val;
                for (var i = 0; i < self.handlers.length; i++) {
                    self.handlers[i]();
                }
            }

            function reject(err) {
                if (self.state !== 'pending') return;
                self.state = 'rejected';
                self.value = err;
                for (var i = 0; i < self.handlers.length; i++) {
                    self.handlers[i]();
                }
            }

            try {
                executor(resolve, reject);
            } catch (ex) {
                reject(ex);
            }
        };

        PromisePolyfill.prototype.then = function (onFulfilled, onRejected) {
            var self = this;
            return new PromisePolyfill(function (resolve, reject) {
                function execute() {
                    setTimeout(function () {
                        if (self.state === 'fulfilled') {
                            if (typeof onFulfilled === 'function') {
                                try { resolve(onFulfilled(self.value)); } catch (e) { reject(e); }
                            } else {
                                resolve(self.value);
                            }
                        } else if (self.state === 'rejected') {
                            if (typeof onRejected === 'function') {
                                try { resolve(onRejected(self.value)); } catch (e) { reject(e); }
                            } else {
                                reject(self.value);
                            }
                        }
                    }, 0);
                }
                if (self.state === 'pending') {
                    self.handlers.push(execute);
                } else {
                    execute();
                }
            });
        };

        PromisePolyfill.prototype.catch = function (onRejected) {
            return this.then(null, onRejected);
        };

        PromisePolyfill.resolve = function (val) {
            return new PromisePolyfill(function (r) { r(val); });
        };

        PromisePolyfill.reject = function (err) {
            return new PromisePolyfill(function (_, rej) { rej(err); });
        };

        PromisePolyfill.all = function (promises) {
            return new PromisePolyfill(function (resolve, reject) {
                if (!promises || promises.length === 0) { resolve([]); return; }
                var results = [];
                var count = 0;
                for (var i = 0; i < promises.length; i++) {
                    (function (idx) {
                        PromisePolyfill.resolve(promises[idx]).then(function (res) {
                            results[idx] = res;
                            count++;
                            if (count === promises.length) resolve(results);
                        }, reject);
                    })(i);
                }
            });
        };

        global.Promise = PromisePolyfill;
    }

    // 7. Minimal reliable fetch() polyfill using XMLHttpRequest if missing
    if (!global.fetch) {
        global.fetch = function (url, options) {
            options = options || {};
            var method = (options.method || 'GET').toUpperCase();
            return new global.Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                if (options.headers) {
                    for (var h in options.headers) {
                        if (Object.prototype.hasOwnProperty.call(options.headers, h)) {
                            xhr.setRequestHeader(h, options.headers[h]);
                        }
                    }
                }
                if (options.cache === 'no-store' || options.cache === 'no-cache') {
                    xhr.setRequestHeader('Cache-Control', 'no-cache');
                }
                xhr.onload = function () {
                    var status = xhr.status;
                    var ok = (status >= 200 && status < 300);
                    var resp = {
                        status: status,
                        ok: ok,
                        statusText: xhr.statusText,
                        text: function () {
                            return global.Promise.resolve(xhr.responseText || '');
                        },
                        json: function () {
                            try {
                                return global.Promise.resolve(JSON.parse(xhr.responseText));
                            } catch (e) {
                                return global.Promise.reject(e);
                            }
                        },
                        arrayBuffer: function () {
                            // If responseType was arraybuffer or Uint8Array fallback
                            if (xhr.response && xhr.response.byteLength !== undefined) {
                                return global.Promise.resolve(xhr.response);
                            }
                            var str = xhr.responseText || '';
                            var buf = new ArrayBuffer(str.length);
                            var bufView = new Uint8Array(buf);
                            for (var i = 0; i < str.length; i++) {
                                bufView[i] = str.charCodeAt(i) & 0xff;
                            }
                            return global.Promise.resolve(buf);
                        }
                    };
                    resolve(resp);
                };
                xhr.onerror = function () {
                    reject(new TypeError('Network request failed'));
                };
                xhr.ontimeout = function () {
                    reject(new TypeError('Network request timed out'));
                };
                if (options.body) {
                    xhr.send(options.body);
                } else {
                    xhr.send();
                }
            });
        };
    }

    // 8. Element.prototype.matches & closest
    if (typeof Element !== 'undefined') {
        if (!Element.prototype.matches) {
            Element.prototype.matches =
                Element.prototype.msMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function (s) {
                    var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                        i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) {}
                    return i > -1;
                };
        }
        if (!Element.prototype.closest) {
            Element.prototype.closest = function (s) {
                var el = this;
                while (el && el.nodeType === 1) {
                    if (el.matches(s)) return el;
                    el = el.parentElement || el.parentNode;
                }
                return null;
            };
        }
    }

    var ramStore = {};
    var loadedScripts = {};
    var pendingCallbacks = {};

    function checkStorageAvailable() {
        try {
            var testKey = '__win11_test__';
            global.localStorage.setItem(testKey, '1');
            global.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    var hasLocalStorage = checkStorageAvailable();

    var hasBackdropFilter = (function () {
        if (!global.CSS || typeof global.CSS.supports !== 'function') {
            return false;
        }
        return (
            global.CSS.supports('backdrop-filter', 'blur(1px)') ||
            global.CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
        );
    })();

    var Compat = {
        features: {
            localStorage: hasLocalStorage,
            backdropFilter: hasBackdropFilter,
            isFileProtocol: !!(global.location && global.location.protocol === 'file:'),
            reducedMotion: !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches)
        },

        storageGet: function (key, fallback) {
            return Object.prototype.hasOwnProperty.call(ramStore, key) ? ramStore[key] : fallback;
        },

        storageSet: function (key, value) {
            ramStore[key] = String(value);
        },

        storageRemove: function (key) {
            delete ramStore[key];
            try {
                if (hasLocalStorage) global.localStorage.removeItem(key);
                if (global.sessionStorage) global.sessionStorage.removeItem(key);
            } catch (e) { }
        },

        /**
         * Actively purges legacy persisted keys, cookies, sessionStorage & IndexedDB stores on startup
         * so each student launch begins with an authentic, clean OS & evaluation session.
         */
        purgeLegacyPersistence: function (extraKeys) {
            var keys = ['win11_sim_v2_state', 'win11_sim_v2_teacher_cfg'];
            if (Array.isArray(extraKeys)) {
                for (var i = 0; i < extraKeys.length; i++) keys.push(extraKeys[i]);
            }
            for (var k = 0; k < keys.length; k++) {
                delete ramStore[keys[k]];
                try { if (global.localStorage) global.localStorage.removeItem(keys[k]); } catch (e1) { }
                try { if (global.sessionStorage) global.sessionStorage.removeItem(keys[k]); } catch (e2) { }
            }
            try {
                if (global.sessionStorage && typeof global.sessionStorage.clear === 'function') {
                    global.sessionStorage.clear();
                }
            } catch (e3) { }
            try {
                if (typeof document !== 'undefined' && document.cookie) {
                    var cookies = document.cookie.split(';');
                    for (var c = 0; c < cookies.length; c++) {
                        var eq = cookies[c].indexOf('=');
                        var cname = (eq > -1 ? cookies[c].substr(0, eq) : cookies[c]).trim();
                        if (cname) document.cookie = cname + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                    }
                }
            } catch (e4) { }
            try {
                if (global.indexedDB && typeof global.indexedDB.databases === 'function') {
                    global.indexedDB.databases().then(function (dbs) {
                        for (var d = 0; d < dbs.length; d++) {
                            if (dbs[d] && dbs[d].name) {
                                try { global.indexedDB.deleteDatabase(dbs[d].name); } catch (e5) { }
                            }
                        }
                    }).catch(function () { });
                }
            } catch (e6) { }
        },

        verifyCleanStartup: function () {
            var remaining = [];
            var checks = ['win11_sim_v2_state', 'win11_sim_v2_teacher_cfg'];
            try {
                if (global.localStorage) {
                    for (var i = 0; i < checks.length; i++) {
                        if (global.localStorage.getItem(checks[i]) !== null) remaining.push('localStorage:' + checks[i]);
                    }
                }
            } catch (e) { }
            try {
                if (global.sessionStorage && global.sessionStorage.length > 0) remaining.push('sessionStorage');
            } catch (e2) { }
            return { clean: remaining.length === 0, remaining: remaining };
        },

        assign: function (target) {
            if (target === null || target === undefined) target = {};
            for (var i = 1; i < arguments.length; i++) {
                var src = arguments[i];
                if (!src) continue;
                for (var k in src) {
                    if (Object.prototype.hasOwnProperty.call(src, k)) {
                        target[k] = src[k];
                    }
                }
            }
            return target;
        },

        deepClone: function (obj) {
            try {
                return JSON.parse(JSON.stringify(obj));
            } catch (e) {
                return obj;
            }
        },

        closest: function (el, selector) {
            var cur = el;
            while (cur && cur.nodeType === 1) {
                if (cur.matches && cur.matches(selector)) return cur;
                if (cur.msMatchesSelector && cur.msMatchesSelector(selector)) return cur;
                cur = cur.parentElement || cur.parentNode;
            }
            return null;
        },

        escapeHtml: function (str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        clamp: function (val, min, max) {
            return Math.max(min, Math.min(max, val));
        },

        debounce: function (fn, wait) {
            var timer = null;
            return function () {
                var ctx = this;
                var args = arguments;
                if (timer) clearTimeout(timer);
                timer = setTimeout(function () {
                    fn.apply(ctx, args);
                }, wait);
            };
        },

        /**
         * Loads a script dynamically on demand. Works identically on file:// and http://
         * without CORS blocks or dynamic import() syntax requirements on legacy Chromium/Firefox.
         */
        loadScript: function (src, callback) {
            if (loadedScripts[src]) {
                if (typeof callback === 'function') callback(null);
                return;
            }
            if (pendingCallbacks[src]) {
                if (typeof callback === 'function') pendingCallbacks[src].push(callback);
                return;
            }
            pendingCallbacks[src] = [];
            if (typeof callback === 'function') pendingCallbacks[src].push(callback);

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.charset = 'utf-8';
            script.async = true;

            function finish(err) {
                if (!err) loadedScripts[src] = true;
                var cbs = pendingCallbacks[src] || [];
                delete pendingCallbacks[src];
                for (var i = 0; i < cbs.length; i++) {
                    try {
                        cbs[i](err);
                    } catch (cbErr) {
                        if (global.console && global.console.error) {
                            global.console.error('Callback error for ' + src, cbErr);
                        }
                    }
                }
            }

            script.onload = function () { finish(null); };
            script.onerror = function () { finish(new Error('Failed to load module: ' + src)); };
            script.src = src;
            (document.head || document.body || document.documentElement).appendChild(script);
        },

        markLoaded: function (src) {
            loadedScripts[src] = true;
        },

        createEl: function (tag, className, attrs) {
            var el = document.createElement(tag);
            if (className) el.className = className;
            if (attrs) {
                for (var k in attrs) {
                    if (Object.prototype.hasOwnProperty.call(attrs, k)) {
                        if (k === 'text') el.textContent = attrs[k];
                        else if (k === 'html') el.innerHTML = attrs[k];
                        else el.setAttribute(k, attrs[k]);
                    }
                }
            }
            return el;
        }
    };

    // Polyfill Element.prototype.matches if needed on older engines
    if (typeof Element !== 'undefined' && !Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector;
    }

    // Apply capability markers on root html node
    if (document && document.documentElement) {
        var root = document.documentElement;
        root.className += hasBackdropFilter ? ' supports-blur' : ' no-blur';
        if (Compat.features.isFileProtocol) root.className += ' env-file';
    }

    global.Win11Compat = Compat;
})(window);

