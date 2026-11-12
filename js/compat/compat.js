/**
 * Compatibility & Feature Detection Layer (Win7 Chrome 109 / Firefox 115 ESR Safe)
 * Provides polyfills, safe storage fallback, DOM utilities, and CORS-free lazy script loading.
 */
(function (global) {
    'use strict';

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

