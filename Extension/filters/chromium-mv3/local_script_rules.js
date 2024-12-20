/**
 * By the rules of AMO and Chrome we cannot use remote scripts (and our JS rules can be counted as such). Because of that we use the following approach (that was accepted by AMO/Chrome reviewers):
 *
 * 1. We pre-build JS rules from AdGuard filters into the add-on (see the file called "local_script_rules.json/js").
 * 2. At runtime we check every JS rule if it's included into "local_script_rules.json/js". If it is included we allow this rule to work since it's pre-built. Other rules are discarded.
 * 3. We also allow "User rules" to work since those rules are added manually by the user. This way filters maintainers can test new rules before including them in the filters.
 */
const localScriptRules = {
    'var AG_onLoad=function(func){if(document.readyState==="complete"||document.readyState==="interactive")func();else if(document.addEventListener)document.addEventListener("DOMContentLoaded",func);else if(document.attachEvent)document.attachEvent("DOMContentLoaded",func)};': () => {},
    "var AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};": () => {},
    "var AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };": () => {},
    "var AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };": () => {},
    "var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };": () => {},
    'var AG_removeCookie=function(a){var e=/./;/^\\/.+\\/$/.test(a)?e=new RegExp(a.slice(1,-1)):""!==a&&(e=new RegExp(a.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")));a=function(){for(var a=document.cookie.split(";"),g=a.length;g--;){cookieStr=a[g];var d=cookieStr.indexOf("=");if(-1!==d&&(d=cookieStr.slice(0,d).trim(),e.test(d)))for(var h=document.location.hostname.split("."),f=0;f<h.length-1;f++){var b=h.slice(f).join(".");if(b){var c=d+"=",k="; domain="+b;b="; domain=."+b;document.cookie=c+"; expires=Thu, 01 Jan 1970 00:00:00 GMT";document.cookie=c+k+"; expires=Thu, 01 Jan 1970 00:00:00 GMT";document.cookie=c+b+"; expires=Thu, 01 Jan 1970 00:00:00 GMT";document.cookie=c+"; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";document.cookie=c+k+"; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";document.cookie=c+b+"; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"}}}};a();window.addEventListener("beforeunload",a)};': () => {},
    'var AG_defineProperty=function(){var p,q=Object.defineProperty;if("function"==typeof WeakMap)p=WeakMap;else{var r=0,t=function(){this.a=(r+=Math.random()).toString()};t.prototype.set=function(a,b){var d=a[this.a];d&&d[0]===a?d[1]=b:q(a,this.a,{value:[a,b],writable:!0});return this};t.prototype.get=function(a){var b;return(b=a[this.a])&&b[0]===a?b[1]:void 0};t.prototype.has=function(a){var b=a[this.a];return b?b[0]===a:!1};p=t}function u(a){this.b=a;this.h=Object.create(null)}function v(a,b,d,e){this.a=a;this.i=b;this.c=d;this.f=e}function w(){this.g=/^([^\\\\\\.]|\\\\.)*?\\./;this.j=/\\\\(.)/g;this.a=new p}function x(a,b){var d=b.f;if(d&&!("beforeGet"in d||"beforeSet"in d))return z(d);var e={get:function(){var c=b.f;c&&c.beforeGet&&c.beforeGet.call(this,b.a.b);a:if(c=b.g)c=A(c)?c.value:c.get?c.get.call(this):void 0;else{c=b.a.b;if(b.i in c&&(c=B(c),null!==c)){var d=C.call(c,b.i);c=d?d.call(this):c[b.i];break a}c=void 0}(this===b.a.b||D.call(b.a.b,this))&&E(a,c,b.c);return c},set:function(c){if(this===b.a.b||D.call(b.a.b,this)){b.f&&b.f.beforeSet&&(c=b.f.beforeSet.call(this,c,this));var d=b.g;d&&A(d)&&d.value===c?c=!0:(d=F(b,c,this),G(c)&&(c=H(a,c),I(a,c,b.c)),c=d)}else c=F(b,c,this);return c}};d&&J(d,e,K);return e}function I(a,b,d){for(var e in d.h){var c=d.h[e];if(b.h[e]){var h=a,g=b.h[e],k=c;!k.f||g.f||"undefined"===typeof g.a.b||g.g||(g.g=z(k.f));g.c&&k.c&&g.c!==k.c&&I(h,g.c,k.c)}else{g=h=void 0;k=a;var f=b,l=c.i,m="undefined"!==typeof f.b,y=!1;m&&(g=L(f.b,l))&&!g.configurable&&(y=!0,h=f.b[l]);var n=y?H(k,h):new u(c.c.b);I(k,n,c.c);n=new v(f,l,n,c.f);f.h[l]=n;m&&(n.g=g,m=x(k,n),y?E(k,h,c.c):(q(f.b,l,m),g&&A(g)&&(M(m,g.value,f.b),E(k,g.value,c.c))))}}}function E(a,b,d){G(b)&&(b=H(a,b),I(a,b,d))}function F(a,b,d){var e=a.g;if(!e){e=B(a.a.b);if(null!==e&&(e=N.call(e,a.i)))return e.call(d,b);if(!O(a.a.b))return!1;a.g={value:b,configurable:!0,writable:!0,enumerable:!0};return!0}return M(e,b,d)}function H(a,b){var d=a.a.get(b);d||(d=new u(b),a.a.set(b,d));return d}function A(a){return"undefined"!==typeof a.writable}function J(a,b,d){for(var e=0,c=d.length;e<c;e++){var h=d[e];h in a&&(b[h]=a[h])}}function z(a){if(a){var b={};J(a,b,P);return b}}function M(a,b,d){if(A(a))return a.writable?(a.value=b,!0):!1;if(!a.set)return!1;a.set.call(d,b);return!0}var P="configurable enumerable value get set writable".split(" "),K=P.slice(0,2),L=Object.getOwnPropertyDescriptor,O=Object.isExtensible,B=Object.getPrototypeOf,D=Object.prototype.isPrototypeOf,C=Object.prototype.__lookupGetter__||function(a){return(a=Q(this,a))&&a.get?a.get:void 0},N=Object.prototype.__lookupSetter__||function(a){return(a=Q(this,a))&&a.set?a.set:void 0};function Q(a,b){if(b in a){for(;!w.hasOwnProperty.call(a,b);)a=B(a);return L(a,b)}}function G(a){var b=typeof a;return"function"===b||"object"===b&&null!==a?!0:!1}var R;return function(a,b,d){R||(R=new w);var e=R;d=d||window;var c=new u;a+=".";var h=c||new u;for(var g=e.g,k=e.j,f,l,m;a;){f=g.exec(a);if(null===f)throw 1;f=f[0].length;l=a.slice(0,f-1).replace(k,"$1");a=a.slice(f);(f=h.h[l])?m=f.c:(m=new u,f=new v(h,l,m),h.h[l]=f);h=m}if(!f)throw 1;a=f;a.f=b;E(e,d,c)};}();': () => {
        !function() {
            var e, t = Object.defineProperty;
            if ("function" == typeof WeakMap) e = WeakMap; else {
                var n = 0, o = function() {
                    this.a = (n += Math.random()).toString();
                };
                o.prototype.set = function(e, n) {
                    var o = e[this.a];
                    o && o[0] === e ? o[1] = n : t(e, this.a, {
                        value: [ e, n ],
                        writable: !0
                    });
                    return this;
                };
                o.prototype.get = function(e) {
                    var t;
                    return (t = e[this.a]) && t[0] === e ? t[1] : void 0;
                };
                o.prototype.has = function(e) {
                    var t = e[this.a];
                    return !!t && t[0] === e;
                };
                e = o;
            }
            function i(e) {
                this.b = e;
                this.h = Object.create(null);
            }
            function a(e, t, n, o) {
                this.a = e;
                this.i = t;
                this.c = n;
                this.f = o;
            }
            function r() {
                this.g = /^([^\\\.]|\\.)*?\./;
                this.j = /\\(.)/g;
                this.a = new e;
            }
            function c(e, t) {
                var n = t.f;
                if (n && !("beforeGet" in n) && !("beforeSet" in n)) return h(n);
                var o = {
                    get: function() {
                        var n = t.f;
                        n && n.beforeGet && n.beforeGet.call(this, t.a.b);
                        e: if (n = t.g) n = p(n) ? n.value : n.get ? n.get.call(this) : void 0; else {
                            n = t.a.b;
                            if (t.i in n && null !== (n = _(n))) {
                                var o = S.call(n, t.i);
                                n = o ? o.call(this) : n[t.i];
                                break e;
                            }
                            n = void 0;
                        }
                        (this === t.a.b || k.call(t.a.b, this)) && d(e, n, t.c);
                        return n;
                    },
                    set: function(n) {
                        if (this === t.a.b || k.call(t.a.b, this)) {
                            t.f && t.f.beforeSet && (n = t.f.beforeSet.call(this, n, this));
                            var o = t.g;
                            o && p(o) && o.value === n ? n = !0 : (o = l(t, n, this), T(n) && (n = u(e, n), 
                            s(e, n, t.c)), n = o);
                        } else n = l(t, n, this);
                        return n;
                    }
                };
                n && f(n, o, g);
                return o;
            }
            function s(e, n, o) {
                for (var r in o.h) {
                    var l = o.h[r];
                    if (n.h[r]) {
                        var f = e, y = n.h[r], m = l;
                        !m.f || y.f || void 0 === y.a.b || y.g || (y.g = h(m.f));
                        y.c && m.c && y.c !== m.c && s(f, y.c, m.c);
                    } else {
                        y = f = void 0;
                        m = e;
                        var g = n, v = l.i, _ = void 0 !== g.b, k = !1;
                        _ && (y = b(g.b, v)) && !y.configurable && (k = !0, f = g.b[v]);
                        var S = k ? u(m, f) : new i(l.c.b);
                        s(m, S, l.c);
                        S = new a(g, v, S, l.f);
                        g.h[v] = S;
                        _ && (S.g = y, _ = c(m, S), k ? d(m, f, l.c) : (t(g.b, v, _), y && p(y) && (w(_, y.value, g.b), 
                        d(m, y.value, l.c))));
                    }
                }
            }
            function d(e, t, n) {
                T(t) && s(e, t = u(e, t), n);
            }
            function l(e, t, n) {
                var o = e.g;
                if (!o) {
                    if (null !== (o = _(e.a.b)) && (o = A.call(o, e.i))) return o.call(n, t);
                    if (!v(e.a.b)) return !1;
                    e.g = {
                        value: t,
                        configurable: !0,
                        writable: !0,
                        enumerable: !0
                    };
                    return !0;
                }
                return w(o, t, n);
            }
            function u(e, t) {
                var n = e.a.get(t);
                n || (n = new i(t), e.a.set(t, n));
                return n;
            }
            function p(e) {
                return void 0 !== e.writable;
            }
            function f(e, t, n) {
                for (var o = 0, i = n.length; o < i; o++) {
                    var a = n[o];
                    a in e && (t[a] = e[a]);
                }
            }
            function h(e) {
                if (e) {
                    var t = {};
                    f(e, t, m);
                    return t;
                }
            }
            function w(e, t, n) {
                if (p(e)) return !!e.writable && (e.value = t, !0);
                if (!e.set) return !1;
                e.set.call(n, t);
                return !0;
            }
            var y, m = "configurable enumerable value get set writable".split(" "), g = m.slice(0, 2), b = Object.getOwnPropertyDescriptor, v = Object.isExtensible, _ = Object.getPrototypeOf, k = Object.prototype.isPrototypeOf, S = Object.prototype.__lookupGetter__ || function(e) {
                return (e = E(this, e)) && e.get ? e.get : void 0;
            }, A = Object.prototype.__lookupSetter__ || function(e) {
                return (e = E(this, e)) && e.set ? e.set : void 0;
            };
            function E(e, t) {
                if (t in e) {
                    for (;!r.hasOwnProperty.call(e, t); ) e = _(e);
                    return b(e, t);
                }
            }
            function T(e) {
                var t = typeof e;
                return "function" === t || "object" === t && null !== e;
            }
        }();
    },
    'var AG_abortOnPropertyWrite=function(a,b){var c=Math.random().toString(36).substr(2,8);AG_defineProperty(a,{beforeSet:function(){b&&console.warn("AdGuard aborted property write: "+a);throw new ReferenceError(c);}});var d=window.onerror;window.onerror=function(e){if("string"===typeof e&&-1!==e.indexOf(c))return b&&console.warn("AdGuard has caught window.onerror: "+a),!0;if(d instanceof Function)return d.apply(this,arguments)}};': () => {},
    'var AG_abortOnPropertyRead=function(a,b){var c=Math.random().toString(36).substr(2,8);AG_defineProperty(a,{beforeGet:function(){b&&console.warn("AdGuard aborted property read: "+a);throw new ReferenceError(c);}});var d=window.onerror;window.onerror=function(e){if("string"===typeof e&&-1!==e.indexOf(c))return b&&console.warn("AdGuard has caught window.onerror: "+a),!0;if(d instanceof Function)return d.apply(this,arguments)}};': () => {},
    'var AG_abortInlineScript=function(g,b,c){var d=function(){if("currentScript"in document)return document.currentScript;var a=document.getElementsByTagName("script");return a[a.length-1]},e=Math.random().toString(36).substr(2,8),h=d();AG_defineProperty(b,{beforeGet:function(){var a=d();if(a instanceof HTMLScriptElement&&a!==h&&""===a.src&&g.test(a.textContent))throw c&&console.warn("AdGuard aborted execution of an inline script"),new ReferenceError(e);}});var f=window.onerror;window.onerror=function(a){if("string"===typeof a&&-1!==a.indexOf(e))return c&&console.warn("AdGuard has caught window.onerror: "+b),!0;if(f instanceof Function)return f.apply(this,arguments)}};': () => {},
    'var AG_setConstant=function(e,a){if("undefined"===a)a=void 0;else if("false"===a)a=!1;else if("true"===a)a=!0;else if("noopFunc"===a)a=function(){};else if("trueFunc"===a)a=function(){return!0};else if("falseFunc"===a)a=function(){return!1};else if(/^\\d+$/.test(a)){if(a=parseFloat(a),isNaN(a)||32767<Math.abs(a))return}else return;var b=!1;AG_defineProperty(e,{get:function(){return a},set:function(c){if(b)var d=!0;else void 0!==c&&void 0!==a&&typeof c!==typeof a&&(b=!0),d=b;d&&(a=c)}})};': () => {},
    '(function(){var a=document.currentScript,b=String.prototype.charCodeAt,c=function(){return true;};Object.defineProperty(String.prototype,"charCodeAt",{get:function(){return document.currentScript===a?b:c},set:function(a){}})})();': () => {
        !function() {
            var e = document.currentScript, t = String.prototype.charCodeAt, n = function() {
                return !0;
            };
            Object.defineProperty(String.prototype, "charCodeAt", {
                get: function() {
                    return document.currentScript === e ? t : n;
                },
                set: function(e) {}
            });
        }();
    },
    "(function() { var isSet = false; Object.defineProperty(window, 'vas', { get: function() { return isSet ? false : undefined; }, set: function() { isSet = false; } }); })();": () => {
        !function() {
            var e = !1;
            Object.defineProperty(window, "vas", {
                get: function() {
                    return !e && void 0;
                },
                set: function() {
                    e = !1;
                }
            });
        }();
    },
    "window.trckd = true;": () => {
        window.trckd = !0;
    },
    "window.ab = false;": () => {
        window.ab = !1;
    },
    "window.aadnet = {};": () => {
        window.aadnet = {};
    },
    "var isadblock=1;": () => {},
    "function setTimeout() {};": () => {},
    "window.google_jobrunner = function() {};": () => {
        window.google_jobrunner = function() {};
    },
    "var block = false;": () => {},
    "window.setTimeout=function() {};": () => {
        window.setTimeout = function() {};
    },
    "var canRunAds = true;": () => {},
    "Element.prototype.attachShadow = function(){};": () => {
        Element.prototype.attachShadow = function() {};
    },
    "(function() { var isSet = false; Object.defineProperty(window, 'vPRinfiniteLoopOfChanges', { get: function() { return isSet ? false : undefined; }, set: function() { isSet = false; } }); })();": () => {
        !function() {
            var e = !1;
            Object.defineProperty(window, "vPRinfiniteLoopOfChanges", {
                get: function() {
                    return !e && void 0;
                },
                set: function() {
                    e = !1;
                }
            });
        }();
    },
    "window.atob = function() {};": () => {
        window.atob = function() {};
    },
    "window.Worker = function() { this.postMessage = function() {} };": () => {
        window.Worker = function() {
            this.postMessage = function() {};
        };
    },
    "(function() { var intervalId = 0; var blockAds = function() { try { if (typeof BeSeedRotator != 'undefined' && BeSeedRotator.Container.player) { clearInterval(intervalId); BeSeedRotator.showDismissButton(); BeSeedRotator.reCache(); } } catch (ex) {}  }; intervalId = setInterval(blockAds, 100); })();": () => {
        e = 0, e = setInterval((function() {
            try {
                if ("undefined" != typeof BeSeedRotator && BeSeedRotator.Container.player) {
                    clearInterval(e);
                    BeSeedRotator.showDismissButton();
                    BeSeedRotator.reCache();
                }
            } catch (e) {}
        }), 100);
        var e;
    },
    '(function(){var getElementsByTagName=document.getElementsByTagName;document.getElementsByTagName=function(tagName){if(tagName=="script")return[];return getElementsByTagName.call(this,tagName)}})();': () => {
        e = document.getElementsByTagName, document.getElementsByTagName = function(t) {
            return "script" == t ? [] : e.call(this, t);
        };
        var e;
    },
    '(function(){var b={};(function(a,c,d){"undefined"!==typeof window[a]?window[a][c]=d:Object.defineProperty(window,a,{get:function(){return b[a]},set:function(e){b[a]=e;e[c]=d}})})("authConfig","adfox",[])})();': () => {
        !function() {
            var e, t, n, o = {};
            e = "authConfig", t = "adfox", n = [], void 0 !== window[e] ? window[e][t] = n : Object.defineProperty(window, e, {
                get: function() {
                    return o[e];
                },
                set: function(i) {
                    o[e] = i;
                    i[t] = n;
                }
            });
        }();
    },
    '!function(){const p={apply:(p,e,n)=>{const r=Reflect.apply(p,e,n),s=r?.[0]?.props?.data;return s&&null===s.user&&(r[0].props.data.user="guest"),r}};window.JSON.parse=new Proxy(window.JSON.parse,p)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => {
                    const o = Reflect.apply(e, t, n), i = o?.[0]?.props?.data;
                    return i && null === i.user && (o[0].props.data.user = "guest"), o;
                }
            };
            window.JSON.parse = new Proxy(window.JSON.parse, e);
        }();
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e="div[id^=\'atf\']:empty { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': () => {
        window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, {
            apply: (e, t, n) => {
                const o = Reflect.apply(e, t, n), i = "div[id^='atf']:empty { display: none !important; }";
                if ("adoptedStyleSheets" in document) {
                    const e = new CSSStyleSheet;
                    e.replaceSync(i), o.adoptedStyleSheets = [ e ];
                } else {
                    const e = document.createElement("style");
                    e.innerText = i, o.appendChild(e);
                }
                return o;
            }
        });
    },
    '(()=>{let e="";const a=`GA1.1.${Math.floor(Date.now()/1e3)}.${Math.floor(Date.now()/1e3)}`;let o=!1;const t=()=>{e=e.replace("G-",""),document.cookie=`_ga_${e}=${a}`};window.dataLayer=window.dataLayer||[],dataLayer.push=new Proxy(window.dataLayer.push,{apply:(a,d,n)=>("config"===n[0][0]&&(e=n[0][1],"complete"===document.readyState?t():o||(window.addEventListener("load",t),o=!0)),Reflect.apply(a,d,n))})})();': () => {
        (() => {
            let e = "";
            const t = `GA1.1.${Math.floor(Date.now() / 1e3)}.${Math.floor(Date.now() / 1e3)}`;
            let n = !1;
            const o = () => {
                e = e.replace("G-", ""), document.cookie = `_ga_${e}=${t}`;
            };
            window.dataLayer = window.dataLayer || [], dataLayer.push = new Proxy(window.dataLayer.push, {
                apply: (t, i, a) => ("config" === a[0][0] && (e = a[0][1], "complete" === document.readyState ? o() : n || (window.addEventListener("load", o), 
                n = !0)), Reflect.apply(t, i, a))
            });
        })();
    },
    "window.samDetected = false;": () => {
        window.samDetected = !1;
    },
    "var _amw1 = 1;": () => {},
    "var AdmostClient = 1;": () => {},
    "var advertisement_not_blocked = 1;": () => {},
    "var criteo_medyanet_loaded = 1;": () => {},
    '(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/RTCPeerConnection[\\s\\S]*?new MouseEvent\\("click"/.test(a.toString()))return b(a,c)};})();': () => {
        !function() {
            var e = window.setTimeout;
            window.setTimeout = function(t, n) {
                if (!/RTCPeerConnection[\s\S]*?new MouseEvent\("click"/.test(t.toString())) return e(t, n);
            };
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/?u=aHR0c")){var a=location.href.split("/?u=");if(a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/?u=aHR0c")) {
                var e = location.href.split("/?u=");
                if (e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    'document.cookie="modalads=yes; path=/;";': () => {
        document.cookie = "modalads=yes; path=/;";
    },
    "if(window.sessionStorage) { window.sessionStorage.pageCount = 0; }": () => {
        window.sessionStorage && (window.sessionStorage.pageCount = 0);
    },
    'setTimeout ("HideFloatAdBanner()", 1000);': () => {
        setTimeout("HideFloatAdBanner()", 1e3);
    },
    "!function(){function b(){}function a(a){return{get:function(){return a},set:b}}function c(a){a(!1)}AG_defineProperty('_sp_.config.content_control_callback',a(b)),AG_defineProperty('_sp_.config.spid_control_callback',a(b)),AG_defineProperty('_sp_.config.vid_control_callback',a(b)),AG_defineProperty('_sp_.config.disableBlockerStyleSheets',a(!1)),AG_defineProperty('_sp_.checkState',a(c)),AG_defineProperty('_sp_.isAdBlocking',a(c)),AG_defineProperty('_sp_.isAdblocking',a(c)),AG_defineProperty('_sp_.isContentBlockerPresent',a(c)),AG_defineProperty('_sp_.getSafeUri',a(function(a){return a})),AG_defineProperty('_sp_.pageChange',a(b)),AG_defineProperty('_sp_.setupSmartBeacons',a(b)),AG_defineProperty('_sp_.msg.startMsg',a(b)),document.addEventListener('sp.blocking',function(a){a.stopImmediatePropagation(),a=document.createEvent('Event'),a.initEvent('sp.not_blocking',!0,!1),this.dispatchEvent(a)})}();": () => {
        !function() {
            function e() {}
            function t(t) {
                return {
                    get: function() {
                        return t;
                    },
                    set: e
                };
            }
            function n(e) {
                e(!1);
            }
            AG_defineProperty("_sp_.config.content_control_callback", t(e)), AG_defineProperty("_sp_.config.spid_control_callback", t(e)), 
            AG_defineProperty("_sp_.config.vid_control_callback", t(e)), AG_defineProperty("_sp_.config.disableBlockerStyleSheets", t(!1)), 
            AG_defineProperty("_sp_.checkState", t(n)), AG_defineProperty("_sp_.isAdBlocking", t(n)), 
            AG_defineProperty("_sp_.isAdblocking", t(n)), AG_defineProperty("_sp_.isContentBlockerPresent", t(n)), 
            AG_defineProperty("_sp_.getSafeUri", t((function(e) {
                return e;
            }))), AG_defineProperty("_sp_.pageChange", t(e)), AG_defineProperty("_sp_.setupSmartBeacons", t(e)), 
            AG_defineProperty("_sp_.msg.startMsg", t(e)), document.addEventListener("sp.blocking", (function(e) {
                e.stopImmediatePropagation(), (e = document.createEvent("Event")).initEvent("sp.not_blocking", !0, !1), 
                this.dispatchEvent(e);
            }));
        }();
    },
    '!function(){const e={apply:(e,t,n)=>(n&&n[1]&&"useAdBlockerDetector"===n[1]&&n[2]&&n[2].get&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n))};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => (n && n[1] && "useAdBlockerDetector" === n[1] && n[2] && n[2].get && (n[2].get = function() {
                    return function() {
                        return !1;
                    };
                }), Reflect.apply(e, t, n))
            };
            window.Object.defineProperty = new Proxy(window.Object.defineProperty, e);
        }();
    },
    '(()=>{const n={construct:(n,o,t)=>{const e=o[0];if(e&&e.includes("return typeof"))throw new ReferenceError;return Reflect.construct(n,o,t)}};window.Function=new Proxy(window.Function,n)})();': () => {
        (() => {
            const e = {
                construct: (e, t, n) => {
                    const o = t[0];
                    if (o && o.includes("return typeof")) throw new ReferenceError;
                    return Reflect.construct(e, t, n);
                }
            };
            window.Function = new Proxy(window.Function, e);
        })();
    },
    "!function(){const t={apply:(t,n,o)=>{if(n&&n.match?.(/_\\$_|DklzSoz|_adbn_/))throw Error();return Reflect.apply(t,n,o)}};window.String.prototype.split=new Proxy(window.String.prototype.split,t)}();": () => {
        !function() {
            const e = {
                apply: (e, t, n) => {
                    if (t && t.match?.(/_\$_|DklzSoz|_adbn_/)) throw Error();
                    return Reflect.apply(e, t, n);
                }
            };
            window.String.prototype.split = new Proxy(window.String.prototype.split, e);
        }();
    },
    "window.google_tag_manager = function() {};": () => {
        window.google_tag_manager = function() {};
    },
    '(()=>{window.TATM=window.TATM||{},TATM.init=()=>{},TATM.initAdUnits=()=>{},TATM.pageReady=()=>{},TATM.getVast=function(n){return new Promise((n=>{n()}))},TATM.push=function(n){if("function"==typeof n)try{n()}catch(n){console.debug(n)}};})();': () => {
        window.TATM = window.TATM || {}, TATM.init = () => {}, TATM.initAdUnits = () => {}, 
        TATM.pageReady = () => {}, TATM.getVast = function(e) {
            return new Promise((e => {
                e();
            }));
        }, TATM.push = function(e) {
            if ("function" == typeof e) try {
                e();
            } catch (e) {
                console.debug(e);
            }
        };
    },
    '(()=>{document.location.href.includes("/pop_advisor")&&AG_onLoad((function(){const e=new CustomEvent("visibilitychange"),t=t=>{Object.defineProperty(t.view.top.document,"hidden",{value:!0,writable:!0}),t.view.top.document.dispatchEvent(e),setTimeout((()=>{Object.defineProperty(t.view.top.document,"hidden",{value:!1,writable:!0}),t.view.top.document.dispatchEvent(e)}),100)},n=document.querySelector("button.btn-continu");n&&n.addEventListener("click",t)}));})();': () => {
        document.location.href.includes("/pop_advisor") && AG_onLoad((function() {
            const e = new CustomEvent("visibilitychange"), t = document.querySelector("button.btn-continu");
            t && t.addEventListener("click", (t => {
                Object.defineProperty(t.view.top.document, "hidden", {
                    value: !0,
                    writable: !0
                }), t.view.top.document.dispatchEvent(e), setTimeout((() => {
                    Object.defineProperty(t.view.top.document, "hidden", {
                        value: !1,
                        writable: !0
                    }), t.view.top.document.dispatchEvent(e);
                }), 100);
            }));
        }));
    },
    'AG_onLoad(function(){if(window.pmsCoreAds&&Array.isArray(pmsCoreAds)){window.pmsCoreAds=new Proxy(pmsCoreAds,{set:(a,b,c,d)=>{if("function"==typeof c)try{let a=!1;const b=b=>{var c=document.querySelector(".ads-core-video");c&&a?clearInterval(d):(b(),a=!0)},d=setInterval(b,1e3,c)}catch(a){}return Reflect.set(a,b,c,d)}})}});': () => {
        AG_onLoad((function() {
            window.pmsCoreAds && Array.isArray(pmsCoreAds) && (window.pmsCoreAds = new Proxy(pmsCoreAds, {
                set: (e, t, n, o) => {
                    if ("function" == typeof n) try {
                        let e = !1;
                        const t = setInterval((n => {
                            document.querySelector(".ads-core-video") && e ? clearInterval(t) : (n(), e = !0);
                        }), 1e3, n);
                    } catch (e) {}
                    return Reflect.set(e, t, n, o);
                }
            }));
        }));
    },
    '(function(){var a={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(c,a){if("function"==typeof a)try{if(1===a.length){a({})}}catch(a){}}}};a.cmd.push=function(b){let a=function(){try{"function"==typeof b&&b()}catch(a){}};"complete"===document.readyState?a():window.addEventListener("load",()=>{a()})},window.jad=a})();': () => {
        (e = {
            cmd: [],
            public: {
                getVideoAdUrl: function() {},
                createNewPosition: function() {},
                refreshAds: function() {},
                setTargetingOnPosition: function() {},
                getDailymotionAdsParamsForScript: function(e, t) {
                    if ("function" == typeof t) try {
                        1 === t.length && t({});
                    } catch (t) {}
                }
            }
        }).cmd.push = function(e) {
            let t = function() {
                try {
                    "function" == typeof e && e();
                } catch (e) {}
            };
            "complete" === document.readyState ? t() : window.addEventListener("load", (() => {
                t();
            }));
        }, window.jad = e;
        var e;
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/target_url/.test(a)){ _st(a,b);}};": () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /target_url/.test(t) || e(t, n);
        };
    },
    '(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty("appName")){if(obj.applaunch?.data?.player?.features?.ad?.enabled){obj.applaunch.data.player.features.ad.enabled=false}if(obj.applaunch?.data?.player?.features?.ad?.dai?.enabled){obj.applaunch.data.player.features.ad.dai.enabled=false}}}else{JSON.parse=nativeJSONParse}return obj}};JSON.parse=new Proxy(JSON.parse,handler)})();': () => {
        !function() {
            let e = 0;
            const t = JSON.parse, n = {
                apply() {
                    e++;
                    const n = Reflect.apply(...arguments);
                    if (e <= 10) {
                        if (n.hasOwnProperty("appName")) {
                            n.applaunch?.data?.player?.features?.ad?.enabled && (n.applaunch.data.player.features.ad.enabled = !1);
                            n.applaunch?.data?.player?.features?.ad?.dai?.enabled && (n.applaunch.data.player.features.ad.dai.enabled = !1);
                        }
                    } else JSON.parse = t;
                    return n;
                }
            };
            JSON.parse = new Proxy(JSON.parse, n);
        }();
    },
    "(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty('env')&&obj.env.hasOwnProperty('origin')){if(!obj.hasOwnProperty('ads')){obj.ads={};}obj.ads.enable=false;obj.ads._prerolls=false;obj.ads._midrolls=false;}}else{JSON.parse=nativeJSONParse;}return obj;}};JSON.parse=new Proxy(JSON.parse,handler);})();": () => {
        !function() {
            let e = 0;
            const t = JSON.parse, n = {
                apply() {
                    e++;
                    const n = Reflect.apply(...arguments);
                    if (e <= 10) {
                        if (n.hasOwnProperty("env") && n.env.hasOwnProperty("origin")) {
                            n.hasOwnProperty("ads") || (n.ads = {});
                            n.ads.enable = !1;
                            n.ads._prerolls = !1;
                            n.ads._midrolls = !1;
                        }
                    } else JSON.parse = t;
                    return n;
                }
            };
            JSON.parse = new Proxy(JSON.parse, n);
        }();
    },
    '(()=>{window.patroniteGdprData={google_recaptcha:"allow"}})();': () => {
        window.patroniteGdprData = {
            google_recaptcha: "allow"
        };
    },
    '(()=>{let t;const e=new MutationObserver(((e,o)=>{const n=t?.querySelector(\'button[data-testid="button-agree"]\');n&&(setTimeout((()=>{n.click()}),500),o.disconnect())})),o={apply:(o,n,c)=>{const a=Reflect.apply(o,n,c);return n.matches(".szn-cmp-dialog-container")&&(t=a),e.observe(a,{subtree:!0,childList:!0}),a}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,o)})();': () => {
        (() => {
            let e;
            const t = new MutationObserver(((t, n) => {
                const o = e?.querySelector('button[data-testid="button-agree"]');
                o && (setTimeout((() => {
                    o.click();
                }), 500), n.disconnect());
            })), n = {
                apply: (n, o, i) => {
                    const a = Reflect.apply(n, o, i);
                    return o.matches(".szn-cmp-dialog-container") && (e = a), t.observe(a, {
                        subtree: !0,
                        childList: !0
                    }), a;
                }
            };
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, n);
        })();
    },
    '(function(){var noopFunc=function(){};var tcData={eventStatus:"tcloaded",gdprApplies:!1,listenerId:noopFunc,vendor:{consents:{967:true}},purpose:{consents:[]}};window.__tcfapi=function(command,version,callback){"function"==typeof callback&&"removeEventListener"!==command&&callback(tcData,!0)}})();': () => {
        !function() {
            var e = {
                eventStatus: "tcloaded",
                gdprApplies: !1,
                listenerId: function() {},
                vendor: {
                    consents: {
                        967: !0
                    }
                },
                purpose: {
                    consents: []
                }
            };
            window.__tcfapi = function(t, n, o) {
                "function" == typeof o && "removeEventListener" !== t && o(e, !0);
            };
        }();
    },
    'document.cookie="PostAnalytics=inactive; path=/;";': () => {
        document.cookie = "PostAnalytics=inactive; path=/;";
    },
    "document.cookie='_s.cookie_consent=marketing=0:analytics=0:version=2021-07-01;path=/;';": () => {
        document.cookie = "_s.cookie_consent=marketing=0:analytics=0:version=2021-07-01;path=/;";
    },
    "document.cookie='cmplz_consented_services={\"youtube\":true};path=/;';": () => {
        document.cookie = 'cmplz_consented_services={"youtube":true};path=/;';
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"jysk.nl","consent_domain":"jysk.nl","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': () => {
        !function() {
            if (!document.cookie.includes("CookieInformationConsent=")) {
                var e = encodeURIComponent('{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"jysk.nl","consent_domain":"jysk.nl","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}');
                document.cookie = "CookieInformationConsent=" + e + "; path=/;";
            }
        }();
    },
    'document.cookie=\'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;\';': () => {
        document.cookie = 'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;';
    },
    '(function(){try{var a=location.pathname.split("/")[1],b="dra_cookie_consent_allowed_"+a,c=new RegExp(/[a-z]+_[a-z]+/);if(!document.cookie.includes(b)&&c.test(a)){var d=encodeURIComponent("v=1&t=1&f=1&s=0&m=0");document.cookie=b+"="+d+"; path=/;"}}catch(e){}})();': () => {
        !function() {
            try {
                var e = location.pathname.split("/")[1], t = "dra_cookie_consent_allowed_" + e, n = new RegExp(/[a-z]+_[a-z]+/);
                if (!document.cookie.includes(t) && n.test(e)) {
                    var o = encodeURIComponent("v=1&t=1&f=1&s=0&m=0");
                    document.cookie = t + "=" + o + "; path=/;";
                }
            } catch (e) {}
        }();
    },
    'document.cookie="dw_cookies_accepted=D; path=/;";': () => {
        document.cookie = "dw_cookies_accepted=D; path=/;";
    },
    '(function(){document.cookie.includes("cookies-consents")||(document.cookie=\'cookies-consents={"ad_storage":false,"analytics_storage":false}\')})();': () => {
        document.cookie.includes("cookies-consents") || (document.cookie = 'cookies-consents={"ad_storage":false,"analytics_storage":false}');
    },
    'document.cookie="ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";': () => {
        document.cookie = "ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";
    },
    'document.cookie="cookieconsent_status=allow; path=/;";': () => {
        document.cookie = "cookieconsent_status=allow; path=/;";
    },
    'document.cookie="cookieConsentLevel=functional; path=/;";': () => {
        document.cookie = "cookieConsentLevel=functional; path=/;";
    },
    'document.cookie="cookies_accept=all; path=/;";': () => {
        document.cookie = "cookies_accept=all; path=/;";
    },
    'document.cookie="waconcookiemanagement=min; path=/;";': () => {
        document.cookie = "waconcookiemanagement=min; path=/;";
    },
    'document.cookie="apcAcceptedTrackingCookie3=1111000; path=/;";': () => {
        document.cookie = "apcAcceptedTrackingCookie3=1111000; path=/;";
    },
    'document.cookie="bbDatenstufe=stufe3; path=/;";': () => {
        document.cookie = "bbDatenstufe=stufe3; path=/;";
    },
    'document.cookie="newsletter-signup=viewed; path=/;";': () => {
        document.cookie = "newsletter-signup=viewed; path=/;";
    },
    'document.cookie="user_cookie_consent=essential; path=/";': () => {
        document.cookie = "user_cookie_consent=essential; path=/";
    },
    'document.cookie="cookiebanner=closed; path=/;";': () => {
        document.cookie = "cookiebanner=closed; path=/;";
    },
    'document.cookie=\'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;\';': () => {
        document.cookie = 'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;';
    },
    '(function(){-1==document.cookie.indexOf("GPRD")&&(document.cookie="GPRD=128; path=/;",location.reload())})();': () => {
        -1 == document.cookie.indexOf("GPRD") && (document.cookie = "GPRD=128; path=/;", 
        location.reload());
    },
    'document.cookie="acceptRodoSie=hide; path=/;";': () => {
        document.cookie = "acceptRodoSie=hide; path=/;";
    },
    '(function(){-1==document.cookie.indexOf("cookie-functional")&&(document.cookie="cookie-functional=1; path=/;",document.cookie="popupek=1; path=/;",location.reload())})();': () => {
        -1 == document.cookie.indexOf("cookie-functional") && (document.cookie = "cookie-functional=1; path=/;", 
        document.cookie = "popupek=1; path=/;", location.reload());
    },
    '(function(){-1==document.cookie.indexOf("ccb")&&(document.cookie="ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;",location.reload())})();': () => {
        -1 == document.cookie.indexOf("ccb") && (document.cookie = "ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;", 
        location.reload());
    },
    "(function(){-1===document.cookie.indexOf(\"CookieConsent\")&&(document.cookie='CookieConsent=mandatory|osm; path=/;')})();": () => {
        -1 === document.cookie.indexOf("CookieConsent") && (document.cookie = "CookieConsent=mandatory|osm; path=/;");
    },
    '(function(){-1===document.cookie.indexOf("CookieControl")&&(document.cookie=\'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}\')})();': () => {
        -1 === document.cookie.indexOf("CookieControl") && (document.cookie = 'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}');
    },
    '(function(){if(-1==document.cookie.indexOf("CONSENT")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="CONSENT=301212NN; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        !function() {
            if (-1 == document.cookie.indexOf("CONSENT")) {
                var e = (new Date).getTime(), t = new Date(e + 1314e6);
                document.cookie = "CONSENT=301212NN; path=/; expires=" + t.toUTCString(), location.reload();
            }
        }();
    },
    'document.cookie="dsgvo=basic; path=/;";': () => {
        document.cookie = "dsgvo=basic; path=/;";
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"elkjop.no","consent_domain":"elkjop.no","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': () => {
        !function() {
            if (!document.cookie.includes("CookieInformationConsent=")) {
                var e = encodeURIComponent('{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"elkjop.no","consent_domain":"elkjop.no","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}');
                document.cookie = "CookieInformationConsent=" + e + "; path=/;";
            }
        }();
    },
    '(function(){var a={timestamp:(new Date).getTime(),choice:2,version:"1.0"};document.cookie="mxp="+JSON.stringify(a)+"; path=/"})();': () => {
        e = {
            timestamp: (new Date).getTime(),
            choice: 2,
            version: "1.0"
        }, document.cookie = "mxp=" + JSON.stringify(e) + "; path=/";
        var e;
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("bavarianfootballworks.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        !function() {
            if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("bavarianfootballworks.com")) {
                var e = (new Date).getTime(), t = new Date(e + 1314e6);
                document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + t.toUTCString(), 
                location.reload();
            }
        }();
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("goldenstateofmind.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        !function() {
            if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("goldenstateofmind.com")) {
                var e = (new Date).getTime(), t = new Date(e + 1314e6);
                document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + t.toUTCString(), 
                location.reload();
            }
        }();
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("mmafighting.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        !function() {
            if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("mmafighting.com")) {
                var e = (new Date).getTime(), t = new Date(e + 1314e6);
                document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + t.toUTCString(), 
                location.reload();
            }
        }();
    },
    '(function(){-1==document.cookie.indexOf("cms_cookies")&&(document.cookie="cms_cookies=6; path=/;",document.cookie="cms_cookies_saved=true; path=/;",location.reload())})();': () => {
        -1 == document.cookie.indexOf("cms_cookies") && (document.cookie = "cms_cookies=6; path=/;", 
        document.cookie = "cms_cookies_saved=true; path=/;", location.reload());
    },
    'document.cookie="erlaubte_cookies=1; path=/;";': () => {
        document.cookie = "erlaubte_cookies=1; path=/;";
    },
    'document.cookie="klaviano_police=1; path=/;";': () => {
        document.cookie = "klaviano_police=1; path=/;";
    },
    'document.cookie=\'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;\';': () => {
        document.cookie = 'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;';
    },
    '(function(){if(!document.cookie.includes("trackingPermissionConsentsValue=")){var a=encodeURIComponent(\'"cookies_analytics":false,"cookies_personalization":false,"cookies_advertisement":false\');document.cookie="trackingPermissionConsentsValue={"+a+"}; path=/;"}})();': () => {
        !function() {
            if (!document.cookie.includes("trackingPermissionConsentsValue=")) {
                var e = encodeURIComponent('"cookies_analytics":false,"cookies_personalization":false,"cookies_advertisement":false');
                document.cookie = "trackingPermissionConsentsValue={" + e + "}; path=/;";
            }
        }();
    },
    'document.cookie="allowTracking=false; path=/;"; document.cookie="trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";': () => {
        document.cookie = "allowTracking=false; path=/;";
        document.cookie = "trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";
    },
    'document.cookie="userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";': () => {
        document.cookie = "userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";
    },
    'document.cookie="sendgb_cookiewarning=1; path=/;";': () => {
        document.cookie = "sendgb_cookiewarning=1; path=/;";
    },
    'document.cookie="notice_preferences=[0]; path=/;";': () => {
        document.cookie = "notice_preferences=[0]; path=/;";
    },
    'document.cookie="rodopop=1; path=/;";': () => {
        document.cookie = "rodopop=1; path=/;";
    },
    'document.cookie="eu_cn=1; path=/;";': () => {
        document.cookie = "eu_cn=1; path=/;";
    },
    'document.cookie="gdprAccepted=true; path=/;";': () => {
        document.cookie = "gdprAccepted=true; path=/;";
    },
    '(function(){if(-1==document.cookie.indexOf("BCPermissionLevel")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="BCPermissionLevel=PERSONAL; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        !function() {
            if (-1 == document.cookie.indexOf("BCPermissionLevel")) {
                var e = (new Date).getTime(), t = new Date(e + 1314e6);
                document.cookie = "BCPermissionLevel=PERSONAL; path=/; expires=" + t.toUTCString(), 
                location.reload();
            }
        }();
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        !function() {
            if (-1 == document.cookie.indexOf("_chorus_privacy_consent")) {
                var e = (new Date).getTime(), t = new Date(e + 1314e6);
                document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + t.toUTCString(), 
                location.reload();
            }
        }();
    },
    "!function(a,b,c,f,g,d,e){e=a[c]||a['WebKit'+c]||a['Moz'+c],e&&(d=new e(function(){b[f].contains(g)&&(b[f].remove(g),d.disconnect())}),d.observe(b,{attributes:!0,attributeFilter:['class']}))}(window,document.documentElement,'MutationObserver','classList','layer_cookie__visible');": () => {
        !function(e, t, n, o, i, a, r) {
            (r = e[n] || e["WebKit" + n] || e["Moz" + n]) && (a = new r((function() {
                t[o].contains(i) && (t[o].remove(i), a.disconnect());
            }))).observe(t, {
                attributes: !0,
                attributeFilter: [ "class" ]
            });
        }(window, document.documentElement, "MutationObserver", "classList", "layer_cookie__visible");
    },
    'var cw;Object.defineProperty(window,"cookieWallSettings",{get:function(){return cw},set:function(a){document.cookie="rtlcookieconsent="+a.version.toString()+";";cw=a}});': () => {
        var e;
        Object.defineProperty(window, "cookieWallSettings", {
            get: function() {
                return e;
            },
            set: function(t) {
                document.cookie = "rtlcookieconsent=" + t.version.toString() + ";";
                e = t;
            }
        });
    },
    '(()=>{if(!location.pathname.includes("/search"))return;const t={attributes:!0,childList:!0,subtree:!0},e=(t,e)=>{for(const n of t){const t=n.target.querySelector(".privacy-statement + .get-started-btn-wrapper > button.inline-explicit");t&&(t.click(),e.disconnect())}},n={apply:(n,o,c)=>{const r=Reflect.apply(n,o,c);if(o&&o.matches("cib-muid-consent")){new MutationObserver(e).observe(r,t)}return r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,n)})();': () => {
        (() => {
            if (!location.pathname.includes("/search")) return;
            const e = {
                attributes: !0,
                childList: !0,
                subtree: !0
            }, t = (e, t) => {
                for (const n of e) {
                    const e = n.target.querySelector(".privacy-statement + .get-started-btn-wrapper > button.inline-explicit");
                    e && (e.click(), t.disconnect());
                }
            }, n = {
                apply: (n, o, i) => {
                    const a = Reflect.apply(n, o, i);
                    o && o.matches("cib-muid-consent") && new MutationObserver(t).observe(a, e);
                    return a;
                }
            };
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, n);
        })();
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector(\'button[data-testid="uc-accept-all-button"]\');c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#usercentrics-root")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        (() => {
            let e, t = !1;
            const n = new MutationObserver(((t, n) => {
                const o = e?.querySelector('button[data-testid="uc-accept-all-button"]');
                o && (o.click(), n.disconnect());
            })), o = {
                apply: (o, i, a) => {
                    const r = Reflect.apply(o, i, a);
                    return !t && i.matches("#usercentrics-root") && (t = !0, e = r), n.observe(r, {
                        subtree: !0,
                        childList: !0
                    }), r;
                }
            };
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, o);
        })();
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector("#cmpbox a.cmptxt_btn_yes");c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#cmpwrapper")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        (() => {
            let e, t = !1;
            const n = new MutationObserver(((t, n) => {
                const o = e?.querySelector("#cmpbox a.cmptxt_btn_yes");
                o && (o.click(), n.disconnect());
            })), o = {
                apply: (o, i, a) => {
                    const r = Reflect.apply(o, i, a);
                    return !t && i.matches("#cmpwrapper") && (t = !0, e = r), n.observe(r, {
                        subtree: !0,
                        childList: !0
                    }), r;
                }
            };
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, o);
        })();
    },
    '(function(){window.self!==window.top||document.cookie.includes("visitor=")||(document.cookie="visitor=1; path=/;",document.cookie&&location.reload())})();': () => {
        window.self !== window.top || document.cookie.includes("visitor=") || (document.cookie = "visitor=1; path=/;", 
        document.cookie && location.reload());
    },
    '(function(){try{var time=(new Date).getTime();var cookieDate=new Date(time+1314E6);var hostname=location.host;var locSubString=null;if(!hostname.startsWith("google.")&&!hostname.startsWith("youtube."))locSubString=hostname.substring(hostname.indexOf(".")+1);var loc=locSubString||hostname;if(document.cookie.indexOf("CONSENT=YES")!==-1)return;document.cookie="CONSENT=YES+; domain="+loc+"; path=/; expires="+cookieDate.toUTCString()}catch(ex){console.error("AG: failed to set consent cookie: "+ex)}})();': () => {
        !function() {
            try {
                var e = (new Date).getTime(), t = new Date(e + 1314e6), n = location.host, o = null;
                n.startsWith("google.") || n.startsWith("youtube.") || (o = n.substring(n.indexOf(".") + 1));
                var i = o || n;
                if (-1 !== document.cookie.indexOf("CONSENT=YES")) return;
                document.cookie = "CONSENT=YES+; domain=" + i + "; path=/; expires=" + t.toUTCString();
            } catch (e) {
                console.error("AG: failed to set consent cookie: " + e);
            }
        }();
    },
    '(function(o){function a(a){return{get:function(){return a},set:b}}function b(){}function c(){throw"Adguard: stopped a script execution.";}var d={},e=a(function(a){a(!1)}),f={},g=EventTarget.prototype.addEventListener;o(d,{spid_control_callback:a(b),content_control_callback:a(b),vid_control_callback:a(b)});o(f,{config:a(d),_setSpKey:{get:c,set:c},checkState:e,isAdBlocking:e,getSafeUri:a(function(a){return a}),pageChange:a(b),setupSmartBeacons:a(b)});Object.defineProperty(window,"_sp_",a(f));EventTarget.prototype.addEventListener=function(a){"sp.blocking"!=a&&"sp.not_blocking"!=a&&g.apply(this,arguments)}})(Object.defineProperties);': () => {
        !function(e) {
            function t(e) {
                return {
                    get: function() {
                        return e;
                    },
                    set: n
                };
            }
            function n() {}
            function o() {
                throw "Adguard: stopped a script execution.";
            }
            var i = {}, a = t((function(e) {
                e(!1);
            })), r = {}, c = EventTarget.prototype.addEventListener;
            e(i, {
                spid_control_callback: t(n),
                content_control_callback: t(n),
                vid_control_callback: t(n)
            });
            e(r, {
                config: t(i),
                _setSpKey: {
                    get: o,
                    set: o
                },
                checkState: a,
                isAdBlocking: a,
                getSafeUri: t((function(e) {
                    return e;
                })),
                pageChange: t(n),
                setupSmartBeacons: t(n)
            });
            Object.defineProperty(window, "_sp_", t(r));
            EventTarget.prototype.addEventListener = function(e) {
                "sp.blocking" != e && "sp.not_blocking" != e && c.apply(this, arguments);
            };
        }(Object.defineProperties);
    },
    '(()=>{const e={apply:async(e,t,a)=>{if(a[0]&&a[0]?.match(/adsbygoogle|doubleclick|googlesyndication|static\\.cloudflareinsights\\.com\\/beacon\\.min\\.js/)){const e=(e="{}",t="",a="opaque")=>{const n=new Response(e,{statusText:"OK"}),o=String((s=50800,r=50900,Math.floor(Math.random()*(r-s+1)+s)));var s,r;return n.headers.set("Content-Length",o),Object.defineProperties(n,{type:{value:a},status:{value:0},statusText:{value:""},url:{value:""}}),Promise.resolve(n)};return e("{}",a[0])}return Reflect.apply(e,t,a)}};window.fetch=new Proxy(window.fetch,e)})();': () => {
        (() => {
            const e = {
                apply: async (e, t, n) => {
                    if (n[0] && n[0]?.match(/adsbygoogle|doubleclick|googlesyndication|static\.cloudflareinsights\.com\/beacon\.min\.js/)) {
                        const e = (e = "{}", t = "", n = "opaque") => {
                            const o = new Response(e, {
                                statusText: "OK"
                            }), i = String(Math.floor(101 * Math.random() + 50800));
                            return o.headers.set("Content-Length", i), Object.defineProperties(o, {
                                type: {
                                    value: n
                                },
                                status: {
                                    value: 0
                                },
                                statusText: {
                                    value: ""
                                },
                                url: {
                                    value: ""
                                }
                            }), Promise.resolve(o);
                        };
                        return e("{}", n[0]);
                    }
                    return Reflect.apply(e, t, n);
                }
            };
            window.fetch = new Proxy(window.fetch, e);
        })();
    },
    "window.ad_allowed = true;": () => {
        window.ad_allowed = !0;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/google_ads_frame/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/google_ads_frame/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/var ad = document\\.querySelector\\("ins\\.adsbygoogle"\\);/.test(a)){ _st(a,b);}};': () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /var ad = document\.querySelector\("ins\.adsbygoogle"\);/.test(t) || e(t, n);
        };
    },
    "document.avp_ready = 1;": () => {
        document.avp_ready = 1;
    },
    "window.ADTECH = function() {};": () => {
        window.ADTECH = function() {};
    },
    "fuckAdBlock = function() {};": () => {
        fuckAdBlock = function() {};
    },
    "window.IM = [1,2,3];": () => {
        window.IM = [ 1, 2, 3 ];
    },
    "window.google_jobrunner = function() { };": () => {
        window.google_jobrunner = function() {};
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return !Number.isNaN(g)&&/\\$\\('#l'\\+|#linkdiv/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        !function() {
            var e = window.setTimeout;
            window.setTimeout = function(t, n) {
                return !Number.isNaN(n) && /\$\('#l'\+|#linkdiv/.test(t.toString()) && (n *= .01), 
                e.apply(this, arguments);
            }.bind(window);
        }();
    },
    "window.blockAdBlock = function() {};": () => {
        window.blockAdBlock = function() {};
    },
    '!function(){const e={apply:(e,t,o)=>{const i=o[1];if(!i||"object"!=typeof i.QiyiPlayerProphetData)return Reflect.apply(e,t,o)}};window.Object.defineProperties=new Proxy(window.Object.defineProperties,e)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => {
                    const o = n[1];
                    if (!o || "object" != typeof o.QiyiPlayerProphetData) return Reflect.apply(e, t, n);
                }
            };
            window.Object.defineProperties = new Proxy(window.Object.defineProperties, e);
        }();
    },
    "!function(){const s={apply:(c,e,n)=>(n[0]?.adSlots&&(n[0].adSlots=[]),n[1]?.success&&(n[1].success=new Proxy(n[1].success,s)),Reflect.apply(c,e,n))};window.Object.assign=new Proxy(window.Object.assign,s)}();": () => {
        !function() {
            const e = {
                apply: (t, n, o) => (o[0]?.adSlots && (o[0].adSlots = []), o[1]?.success && (o[1].success = new Proxy(o[1].success, e)), 
                Reflect.apply(t, n, o))
            };
            window.Object.assign = new Proxy(window.Object.assign, e);
        }();
    },
    'document.cookie="popup=9999999999999; path=/;";': () => {
        document.cookie = "popup=9999999999999; path=/;";
    },
    'document.cookie="overlay-geschenk=donotshowfor7days; path=/;";': () => {
        document.cookie = "overlay-geschenk=donotshowfor7days; path=/;";
    },
    'document.cookie="popupSubscription=1; path=/;";': () => {
        document.cookie = "popupSubscription=1; path=/;";
    },
    'document.cookie="hide_footer_login_layer=T; path=/;";': () => {
        document.cookie = "hide_footer_login_layer=T; path=/;";
    },
    '!function(){const t={apply:(t,e,n)=>{if(n[0]&&"function"==typeof n[0])try{if(n[0].toString().includes("LOGIN_FORCE_TIME"))return}catch(t){console.trace(t)}return Reflect.apply(t,e,n)}},e=new Proxy(window.setTimeout,t);Object.defineProperty(window,"setTimeout",{set:function(){},get:function(){return e}})}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => {
                    if (n[0] && "function" == typeof n[0]) try {
                        if (n[0].toString().includes("LOGIN_FORCE_TIME")) return;
                    } catch (e) {
                        console.trace(e);
                    }
                    return Reflect.apply(e, t, n);
                }
            }, t = new Proxy(window.setTimeout, e);
            Object.defineProperty(window, "setTimeout", {
                set: function() {},
                get: function() {
                    return t;
                }
            });
        }();
    },
    "(function(){window.setTimeout=new Proxy(window.setTimeout,{apply:(a,b,c)=>c&&c[0]&&/SkipMsg\\(\\)/.test(c[0].toString())&&c[1]?(c[1]=1,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)})})();": () => {
        window.setTimeout = new Proxy(window.setTimeout, {
            apply: (e, t, n) => n && n[0] && /SkipMsg\(\)/.test(n[0].toString()) && n[1] ? (n[1] = 1, 
            Reflect.apply(e, t, n)) : Reflect.apply(e, t, n)
        });
    },
    'document.cookie="show_share=true; path=/;";': () => {
        document.cookie = "show_share=true; path=/;";
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ips4_bacalltoactionpopup="+b})();': () => {
        e = (new Date).getTime(), document.cookie = "ips4_bacalltoactionpopup=" + e;
        var e;
    },
    "if (window.PushManager) { window.PushManager.prototype.subscribe = function () { return { then: function (func) { } }; }; }": () => {
        window.PushManager && (window.PushManager.prototype.subscribe = function() {
            return {
                then: function(e) {}
            };
        });
    },
    '(()=>{const t={construct:(t,e,n)=>{const r=e[0],o=r?.toString(),c=o?.includes("e[0].intersectionRatio");return c&&(e[0]=()=>{}),Reflect.construct(t,e,n)}};window.IntersectionObserver=new Proxy(window.IntersectionObserver,t)})();': () => {
        (() => {
            const e = {
                construct: (e, t, n) => {
                    const o = t[0], i = o?.toString(), a = i?.includes("e[0].intersectionRatio");
                    return a && (t[0] = () => {}), Reflect.construct(e, t, n);
                }
            };
            window.IntersectionObserver = new Proxy(window.IntersectionObserver, e);
        })();
    },
    '(function(){var b=document.addEventListener;document.addEventListener=function(c,a,d){if(a&&-1==a.toString().indexOf("adsBlocked"))return b(c,a,d)}.bind(window)})();': () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o) {
                if (n && -1 == n.toString().indexOf("adsBlocked")) return e(t, n, o);
            }.bind(window);
        }();
    },
    '(function(b){Object.defineProperty(Element.prototype,"innerHTML",{get:function(){return b.get.call(this)},set:function(a){/^(?:<([abisuq]) id="[^"]*"><\\/\\1>)*$/.test(a)||b.set.call(this,a)},enumerable:!0,configurable:!0})})(Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML"));': () => {
        e = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML"), Object.defineProperty(Element.prototype, "innerHTML", {
            get: function() {
                return e.get.call(this);
            },
            set: function(t) {
                /^(?:<([abisuq]) id="[^"]*"><\/\1>)*$/.test(t) || e.set.call(this, t);
            },
            enumerable: !0,
            configurable: !0
        });
        var e;
    },
    '(function(a){Object.defineProperty(window,"upManager",{get:function(){return{push:a,register:a,fireNow:a,start:a}},set:function(a){if(!(a instanceof Error))throw Error();}})})(function(){});': () => {
        e = function() {}, Object.defineProperty(window, "upManager", {
            get: function() {
                return {
                    push: e,
                    register: e,
                    fireNow: e,
                    start: e
                };
            },
            set: function(e) {
                if (!(e instanceof Error)) throw Error();
            }
        });
        var e;
    },
    "!function(b,a){AG_defineProperty('CloudflareApps.installs',{get:function(){return a instanceof Object&&Object.getOwnPropertyNames(a).forEach(function(c){a[c].appId=='ziT6U3epKObS'&&Object.defineProperty(a[c],'URLPatterns',{value:b})}),a},set:function(b){a=b}})}(Object.seal([/(?!)/]));": () => {
        e = Object.seal([ /(?!)/ ]), AG_defineProperty("CloudflareApps.installs", {
            get: function() {
                return t instanceof Object && Object.getOwnPropertyNames(t).forEach((function(n) {
                    "ziT6U3epKObS" == t[n].appId && Object.defineProperty(t[n], "URLPatterns", {
                        value: e
                    });
                })), t;
            },
            set: function(e) {
                t = e;
            }
        });
        var e, t;
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        e = XMLHttpRequest.prototype.open, t = /[/.@](piguiqproxy\.com|rcdn\.pro|amgload\.net|dsn-fishki\.ru|v6t39t\.ru|greencuttlefish\.com|rgy1wk\.ru|vt4dlx\.ru|d38dub\.ru)[:/]/i, 
        XMLHttpRequest.prototype.open = function(n, o) {
            if ("GET" !== n || !t.test(o)) return e.apply(this, arguments);
            this.send = function() {
                return null;
            }, this.setRequestHeader = function() {
                return null;
            }, console.log("AG has blocked request: ", o);
        };
        var e, t;
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru|csp-oz66pp\\.ru|ok9ydq\\.ru|kingoablc\\.com)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        e = XMLHttpRequest.prototype.open, t = /[/.@](piguiqproxy\.com|rcdn\.pro|amgload\.net|dsn-fishki\.ru|v6t39t\.ru|greencuttlefish\.com|rgy1wk\.ru|vt4dlx\.ru|d38dub\.ru|csp-oz66pp\.ru|ok9ydq\.ru|kingoablc\.com)[:/]/i, 
        XMLHttpRequest.prototype.open = function(n, o) {
            if ("GET" !== n || !t.test(o)) return e.apply(this, arguments);
            this.send = function() {
                return null;
            }, this.setRequestHeader = function() {
                return null;
            }, console.log("AG has blocked request: ", o);
        };
        var e, t;
    },
    '(()=>{const e={breakStatus:"done"},o=["beforeReward","adViewed","adBreakDone"];window.adsbygoogle=window.adsbygoogle||[],window.adsbygoogle.push=function(d){var a;d&&"object"==typeof d&&(a=d,o.every((e=>e in a&&"function"==typeof a[e])))&&(d.beforeReward(),d.adViewed(),d.adBreakDone(e))}})();': () => {
        (() => {
            const e = {
                breakStatus: "done"
            }, t = [ "beforeReward", "adViewed", "adBreakDone" ];
            window.adsbygoogle = window.adsbygoogle || [], window.adsbygoogle.push = function(n) {
                var o;
                n && "object" == typeof n && (o = n, t.every((e => e in o && "function" == typeof o[e]))) && (n.beforeReward(), 
                n.adViewed(), n.adBreakDone(e));
            };
        })();
    },
    '(()=>{const e={apply:(e,n,t)=>{const o=t[1];return o&&["adBlockingDetected","assessAdBlocking"].includes(o)&&t[2]&&"function"==typeof t[2].value&&(t[2].value=()=>{}),Reflect.apply(e,n,t)}};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)})();': () => {
        (() => {
            const e = {
                apply: (e, t, n) => {
                    const o = n[1];
                    return o && [ "adBlockingDetected", "assessAdBlocking" ].includes(o) && n[2] && "function" == typeof n[2].value && (n[2].value = () => {}), 
                    Reflect.apply(e, t, n);
                }
            };
            window.Object.defineProperty = new Proxy(window.Object.defineProperty, e);
        })();
    },
    "(()=>{const e=()=>{};window.powerTag={Init:[]},window.powerTag.Init.push=function(e){try{e()}catch(e){console.debug(e)}},window.powerAPITag={initRewarded:function(e,o){o&&o.onComplete&&setTimeout((()=>{try{o.onComplete()}catch(e){console.debug(e)}}),1e3)},display:e,mobileDetect:e,initStickyBanner:e,getRewardedAd:e}})();": () => {
        (() => {
            const e = () => {};
            window.powerTag = {
                Init: []
            }, window.powerTag.Init.push = function(e) {
                try {
                    e();
                } catch (e) {
                    console.debug(e);
                }
            }, window.powerAPITag = {
                initRewarded: function(e, t) {
                    t && t.onComplete && setTimeout((() => {
                        try {
                            t.onComplete();
                        } catch (e) {
                            console.debug(e);
                        }
                    }), 1e3);
                },
                display: e,
                mobileDetect: e,
                initStickyBanner: e,
                getRewardedAd: e
            };
        })();
    },
    '(()=>{const t={apply:(t,n,e)=>{if(e[0]&&null===e[0].html?.detected&&"function"==typeof e[0].html?.instance?.start&&"function"==typeof e[0].env?.instance?.start&&"function"==typeof e[0].http?.instance?.start){const t=function(){Object.keys(this).forEach((t=>{"boolean"==typeof this[t]&&(this[t]=!1)}))};["html","env","http"].forEach((n=>{e[0][n].instance.start=t}))}return Reflect.apply(t,n,e)}};window.Object.keys=new Proxy(window.Object.keys,t)})();': () => {
        (() => {
            const e = {
                apply: (e, t, n) => {
                    if (n[0] && null === n[0].html?.detected && "function" == typeof n[0].html?.instance?.start && "function" == typeof n[0].env?.instance?.start && "function" == typeof n[0].http?.instance?.start) {
                        const e = function() {
                            Object.keys(this).forEach((e => {
                                "boolean" == typeof this[e] && (this[e] = !1);
                            }));
                        };
                        [ "html", "env", "http" ].forEach((t => {
                            n[0][t].instance.start = e;
                        }));
                    }
                    return Reflect.apply(e, t, n);
                }
            };
            window.Object.keys = new Proxy(window.Object.keys, e);
        })();
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{var el=document.body; var ce=document.createElement('div'); if(el) { el.appendChild(ce); ce.setAttribute(\"id\", \"QGSBETJjtZkYH\"); }})})();": () => {
        document.addEventListener("DOMContentLoaded", (() => {
            var e = document.body, t = document.createElement("div");
            if (e) {
                e.appendChild(t);
                t.setAttribute("id", "QGSBETJjtZkYH");
            }
        }));
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const e=document.querySelector("#widescreen1");if(e){const t=document.createElement("div");t.setAttribute("id","google_ads_iframe_"),e.appendChild(t)}})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            const e = document.querySelector("#widescreen1");
            if (e) {
                const t = document.createElement("div");
                t.setAttribute("id", "google_ads_iframe_"), e.appendChild(t);
            }
        }));
    },
    '(()=>{const e=new Set(["fimg","faimg","fbmg","fcmg","fdmg","femg","ffmg","fgmg","fjmg","fkmg"]),t={apply:(t,c,n)=>{const s=n[2];if(s){const t=Object.keys(s).length;if(t>1&&t<20)for(let t in s)if(e.has(t)&&!0===n[2][t])try{n[2][t]=!1}catch(e){console.trace(e)}else if(!0===s[t])try{const e=(new Error).stack;/NodeList\\.forEach|(<anonymous>|blob):[\\s\\S]{1,500}$/.test(e)&&(s[t]=!1)}catch(e){console.trace(e)}}return Reflect.apply(t,c,n)}};window.Object.assign=new Proxy(window.Object.assign,t)})();': () => {
        (() => {
            const e = new Set([ "fimg", "faimg", "fbmg", "fcmg", "fdmg", "femg", "ffmg", "fgmg", "fjmg", "fkmg" ]), t = {
                apply: (t, n, o) => {
                    const i = o[2];
                    if (i) {
                        const t = Object.keys(i).length;
                        if (t > 1 && t < 20) for (let t in i) if (e.has(t) && !0 === o[2][t]) try {
                            o[2][t] = !1;
                        } catch (e) {
                            console.trace(e);
                        } else if (!0 === i[t]) try {
                            const e = (new Error).stack;
                            /NodeList\.forEach|(<anonymous>|blob):[\s\S]{1,500}$/.test(e) && (i[t] = !1);
                        } catch (e) {
                            console.trace(e);
                        }
                    }
                    return Reflect.apply(t, n, o);
                }
            };
            window.Object.assign = new Proxy(window.Object.assign, t);
        })();
    },
    '(()=>{const e={apply:(e,t,p)=>{const o=p[1];return o&&"string"==typeof o&&o.match(/pagead2\\.googlesyndication\\.com|google.*\\.js|\\/.*?\\/.*?ad.*?\\.js|\\.(shop|quest|autos)\\/.*?\\.(js|php|html)/)&&(t.prevent=!0),Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,e);const t={apply:(e,t,p)=>{if(!t.prevent)return Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,t)})();': () => {
        (() => {
            const e = {
                apply: (e, t, n) => {
                    const o = n[1];
                    return o && "string" == typeof o && o.match(/pagead2\.googlesyndication\.com|google.*\.js|\/.*?\/.*?ad.*?\.js|\.(shop|quest|autos)\/.*?\.(js|php|html)/) && (t.prevent = !0), 
                    Reflect.apply(e, t, n);
                }
            };
            window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, e);
            const t = {
                apply: (e, t, n) => {
                    if (!t.prevent) return Reflect.apply(e, t, n);
                }
            };
            window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, t);
        })();
    },
    '(()=>{const e=()=>{document.querySelectorAll(".chakra-portal").forEach((e=>{e.querySelector(\'.chakra-modal__overlay[style*="opacity"]\')&&e.setAttribute("style","display: none !important;")}))},t=()=>{},a=function(t,a){const r={name:t,listener:a};requestAnimationFrame((()=>{try{"rewardedSlotGranted"===r.name&&setTimeout(e,2e3),r.listener()}catch(e){}}))};window.googletag={cmd:[],pubads:()=>({addEventListener:a,removeEventListener:t,refresh:t,getTargeting:()=>[],setTargeting:t,disableInitialLoad:t,enableSingleRequest:t,collapseEmptyDivs:t,getSlots:t}),defineSlot:()=>({addService(){}}),defineOutOfPageSlot:t,enableServices:t,display:t,enums:{OutOfPageFormat:{REWARDED:1}}},googletag.cmd.push=e=>{try{e()}catch(e){}return 1}})();': () => {
        (() => {
            const e = () => {
                document.querySelectorAll(".chakra-portal").forEach((e => {
                    e.querySelector('.chakra-modal__overlay[style*="opacity"]') && e.setAttribute("style", "display: none !important;");
                }));
            }, t = () => {}, n = function(t, n) {
                const o = {
                    name: t,
                    listener: n
                };
                requestAnimationFrame((() => {
                    try {
                        "rewardedSlotGranted" === o.name && setTimeout(e, 2e3), o.listener();
                    } catch (e) {}
                }));
            };
            window.googletag = {
                cmd: [],
                pubads: () => ({
                    addEventListener: n,
                    removeEventListener: t,
                    refresh: t,
                    getTargeting: () => [],
                    setTargeting: t,
                    disableInitialLoad: t,
                    enableSingleRequest: t,
                    collapseEmptyDivs: t,
                    getSlots: t
                }),
                defineSlot: () => ({
                    addService() {}
                }),
                defineOutOfPageSlot: t,
                enableServices: t,
                display: t,
                enums: {
                    OutOfPageFormat: {
                        REWARDED: 1
                    }
                }
            }, googletag.cmd.push = e => {
                try {
                    e();
                } catch (e) {}
                return 1;
            };
        })();
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(window.CryptoJSAesJson&&window.CryptoJSAesJson.decrypt){const e=document.createElement("link");function t(){const t=document.querySelector(".entry-header.header");return parseInt(t.getAttribute("data-id"))}e.setAttribute("rel","stylesheet"),e.setAttribute("media","all"),e.setAttribute("href","/wp-content/cache/autoptimize/css/autoptimize_92c5b1cf0217cba9b3fab27d39f320b9.css"),document.head.appendChild(e);const r=3,n=5,o=13,a="07";let c="",i="";const d=1,l=6,g=1,s=5,u=2,p=8,m=8,A=(t,e)=>parseInt(t.toString()+e.toString()),b=(t,e,r)=>t.toString()+e.toString()+r.toString(),S=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let c=parseInt((t()+A(o,a))*r-e);return c=A(2*n+1,c),c},h=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let r=parseInt((t()+A(p,m))*(2*d)-e-(2*d*2+1));return r=b(2*l+g+g+1,c,r),r},y=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;return b(t()+2*s*2,i,e*(2*u))},f=(t,e)=>CryptoJSAesJson.decrypt(t,e);let k=document.querySelectorAll(".reading-content .page-break img");k.forEach((t=>{const e=t.getAttribute("id"),r=f(e,S().toString());t.setAttribute("id",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=parseInt(e.replace(/image-(\\d+)[a-z]+/i,"$1"));document.querySelectorAll(".reading-content .page-break")[r].appendChild(t)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=e.slice(-1);c+=r,t.setAttribute("id",e.slice(0,-1))})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta"),r=f(e,h().toString());t.setAttribute("dta",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta").slice(-2);i+=e,t.removeAttribute("dta")})),k.forEach((t=>{var e=t.getAttribute("data-src"),r=f(e,y().toString());t.setAttribute("data-src",r)})),k.forEach((t=>{t.classList.add("wp-manga-chapter-img","img-responsive","lazyload","effect-fade")}))}})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            if (window.CryptoJSAesJson && window.CryptoJSAesJson.decrypt) {
                const t = document.createElement("link");
                function e() {
                    const e = document.querySelector(".entry-header.header");
                    return parseInt(e.getAttribute("data-id"));
                }
                t.setAttribute("rel", "stylesheet"), t.setAttribute("media", "all"), t.setAttribute("href", "/wp-content/cache/autoptimize/css/autoptimize_92c5b1cf0217cba9b3fab27d39f320b9.css"), 
                document.head.appendChild(t);
                const n = 3, o = 5, i = 13, a = "07";
                let r = "", c = "";
                const s = 1, d = 6, l = 1, u = 5, p = 2, f = 8, h = 8, w = (e, t) => parseInt(e.toString() + t.toString()), y = (e, t, n) => e.toString() + t.toString() + n.toString(), m = () => {
                    const t = document.querySelectorAll(".reading-content .page-break img").length;
                    let r = parseInt((e() + w(i, a)) * n - t);
                    return r = w(2 * o + 1, r), r;
                }, g = () => {
                    const t = document.querySelectorAll(".reading-content .page-break img").length;
                    let n = parseInt((e() + w(f, h)) * (2 * s) - t - (2 * s * 2 + 1));
                    return n = y(2 * d + l + l + 1, r, n), n;
                }, b = () => {
                    const t = document.querySelectorAll(".reading-content .page-break img").length;
                    return y(e() + 2 * u * 2, c, t * (2 * p));
                }, v = (e, t) => CryptoJSAesJson.decrypt(e, t);
                let _ = document.querySelectorAll(".reading-content .page-break img");
                _.forEach((e => {
                    const t = e.getAttribute("id"), n = v(t, m().toString());
                    e.setAttribute("id", n);
                })), _ = document.querySelectorAll(".reading-content .page-break img"), _.forEach((e => {
                    const t = e.getAttribute("id"), n = parseInt(t.replace(/image-(\d+)[a-z]+/i, "$1"));
                    document.querySelectorAll(".reading-content .page-break")[n].appendChild(e);
                })), _ = document.querySelectorAll(".reading-content .page-break img"), _.forEach((e => {
                    const t = e.getAttribute("id"), n = t.slice(-1);
                    r += n, e.setAttribute("id", t.slice(0, -1));
                })), _ = document.querySelectorAll(".reading-content .page-break img"), _.forEach((e => {
                    const t = e.getAttribute("dta"), n = v(t, g().toString());
                    e.setAttribute("dta", n);
                })), _ = document.querySelectorAll(".reading-content .page-break img"), _.forEach((e => {
                    const t = e.getAttribute("dta").slice(-2);
                    c += t, e.removeAttribute("dta");
                })), _.forEach((e => {
                    var t = e.getAttribute("data-src"), n = v(t, b().toString());
                    e.setAttribute("data-src", n);
                })), _.forEach((e => {
                    e.classList.add("wp-manga-chapter-img", "img-responsive", "lazyload", "effect-fade");
                }));
            }
        }));
    },
    '(()=>{const e=new Map,t=function(){},o=t;o.prototype.dispose=t,o.prototype.setNetwork=t,o.prototype.resize=t,o.prototype.setServer=t,o.prototype.setLogLevel=t,o.prototype.newContext=function(){return this},o.prototype.setParameter=t,o.prototype.addEventListener=function(t,o){t&&(console.debug(`Type: ${t}, callback: ${o}`),e.set(t,o))},o.prototype.removeEventListener=t,o.prototype.setProfile=t,o.prototype.setCapability=t,o.prototype.setVideoAsset=t,o.prototype.setSiteSection=t,o.prototype.addKeyValue=t,o.prototype.addTemporalSlot=t,o.prototype.registerCustomPlayer=t,o.prototype.setVideoDisplaySize=t,o.prototype.setContentVideoElement=t,o.prototype.registerVideoDisplayBase=t,o.prototype.submitRequest=function(){const t={type:tv.freewheel.SDK.EVENT_SLOT_ENDED},o=e.get("EVENT_SLOT_ENDED");o&&setTimeout((()=>{try{o(t)}catch(e){console.error(e)}}),1)},window.tv={freewheel:{SDK:{Ad:t,AdManager:o,AdListener:t,_instanceQueue:{},setLogLevel:t,EVENT_SLOT_ENDED:"EVENT_SLOT_ENDED"}}}})();': () => {
        (() => {
            const e = new Map, t = function() {}, n = t;
            n.prototype.dispose = t, n.prototype.setNetwork = t, n.prototype.resize = t, n.prototype.setServer = t, 
            n.prototype.setLogLevel = t, n.prototype.newContext = function() {
                return this;
            }, n.prototype.setParameter = t, n.prototype.addEventListener = function(t, n) {
                t && (console.debug(`Type: ${t}, callback: ${n}`), e.set(t, n));
            }, n.prototype.removeEventListener = t, n.prototype.setProfile = t, n.prototype.setCapability = t, 
            n.prototype.setVideoAsset = t, n.prototype.setSiteSection = t, n.prototype.addKeyValue = t, 
            n.prototype.addTemporalSlot = t, n.prototype.registerCustomPlayer = t, n.prototype.setVideoDisplaySize = t, 
            n.prototype.setContentVideoElement = t, n.prototype.registerVideoDisplayBase = t, 
            n.prototype.submitRequest = function() {
                const t = {
                    type: tv.freewheel.SDK.EVENT_SLOT_ENDED
                }, n = e.get("EVENT_SLOT_ENDED");
                n && setTimeout((() => {
                    try {
                        n(t);
                    } catch (e) {
                        console.error(e);
                    }
                }), 1);
            }, window.tv = {
                freewheel: {
                    SDK: {
                        Ad: t,
                        AdManager: n,
                        AdListener: t,
                        _instanceQueue: {},
                        setLogLevel: t,
                        EVENT_SLOT_ENDED: "EVENT_SLOT_ENDED"
                    }
                }
            };
        })();
    },
    '(()=>{const e=window.Promise,o={construct:(o,t,n)=>t[0]&&t[0]?.toString()?.includes("[!1,!1,!1,!1]")&&t[0]?.toString()?.includes(".responseText")?e.resolve(!1):Reflect.construct(o,t,n)},t=new Proxy(window.Promise,o);Object.defineProperty(window,"Promise",{set:e=>{},get:()=>t})})();': () => {
        (() => {
            const e = window.Promise, t = {
                construct: (t, n, o) => n[0] && n[0]?.toString()?.includes("[!1,!1,!1,!1]") && n[0]?.toString()?.includes(".responseText") ? e.resolve(!1) : Reflect.construct(t, n, o)
            }, n = new Proxy(window.Promise, t);
            Object.defineProperty(window, "Promise", {
                set: e => {},
                get: () => n
            });
        })();
    },
    'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError("^.");': () => {
        e = "^.", window.addEventListener("error", (function(t) {
            t.srcElement && t.srcElement.src && new RegExp(e).test(t.srcElement.src) && (t.srcElement.onerror = function() {});
        }), !0);
        var e;
    },
    "(()=>{window.viAPItag={init(){}}})();": () => {
        window.viAPItag = {
            init() {}
        };
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ "function"==typeof ViewModelBase&&"object"==typeof ViewModelBase.prototype&&"function"==typeof ViewModelBase.prototype.LoadBrandAdAsync&&(ViewModelBase.prototype.LoadBrandAdAsync=function(){}) }));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            "function" == typeof ViewModelBase && "object" == typeof ViewModelBase.prototype && "function" == typeof ViewModelBase.prototype.LoadBrandAdAsync && (ViewModelBase.prototype.LoadBrandAdAsync = function() {});
        }));
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var a=document.querySelectorAll("ins.adsbygoogle");a.length&&a.forEach(a=>{var b=document.createElement("iframe");b.style="display: none !important;",a.setAttribute("data-ad-status","filled"),a.appendChild(b)}) }));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            var e = document.querySelectorAll("ins.adsbygoogle");
            e.length && e.forEach((e => {
                var t = document.createElement("iframe");
                t.style = "display: none !important;", e.setAttribute("data-ad-status", "filled"), 
                e.appendChild(t);
            }));
        }));
    },
    "AG_defineProperty('exoDocumentProtocol', { value: window.document.location.protocol });": () => {
        AG_defineProperty("exoDocumentProtocol", {
            value: window.document.location.protocol
        });
    },
    '(function(){window.adnPopConfig={zoneId:"149"}})();': () => {
        window.adnPopConfig = {
            zoneId: "149"
        };
    },
    '!function(){window.adsbygoogle={loaded:!0,push:function(){"undefined"===typeof this.length&&(this.length=0,this.length+=1)}}}();': () => {
        window.adsbygoogle = {
            loaded: !0,
            push: function() {
                void 0 === this.length && (this.length = 0, this.length += 1);
            }
        };
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var b=new MutationObserver(function(){try{for(var a,d=function(c){for(var a="",d=0;d<c;d++)a+="0123456789".charAt(Math.floor(10*Math.random()));return a},e=document.querySelectorAll(".adsbygoogle, script[data-ad-client]"),f=0;f<e.length;f++)if(e[f].getAttribute("data-ad-client")){a=e[f].getAttribute("data-ad-client");break}if(a){var g=`<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${a}&amp;output=html&amp;adk=${d(10)}&amp;adf=${d(10)}&amp;lmt=${d(10)}&amp;plat=${d(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${d(100)}&amp;bpp=2&amp;bdt=${d(3)}&amp;idt=${d(3)}&amp;shv=r${d(8)}&amp;mjsv=m${d(8)}&amp;ptt=${d(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${d(8)}&amp;frm=${d(2)}&amp;pv=2&amp;ga_vid=${d(10)}.${d(10)}&amp;ga_sid=${d(10)}&amp;ga_hid=${d(10)}&amp;ga_fc=0&amp;u_tz=${d(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${d(4)}&amp;u_w=${d(4)}&amp;u_ah=${d(4)}&amp;u_aw=${d(4)}&amp;u_cd=${d(2)}&amp;u_nplug=${d(1)}&amp;u_nmime=${d(1)}&amp;adx=-${d(8)}&amp;ady=-${d(8)}&amp;biw=${d(4)}&amp;bih=${d(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${d(30)}&amp;oid=${d(1)}&amp;pvsid=${d(16)}&amp;pem=${d(3)}&amp;eae=${d(1)}&amp;fc=${d(4)}&amp;brdim=${d(20)}&amp;vis=1&amp;rsz=${d(6)}&amp;abl=NS&amp;fu=${d(4)}&amp;bc=${d(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`,h=document.querySelector("body > *"),j=document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");h&&j.length&&(!h.querySelector("iframe#aswift_0")&&h.insertAdjacentHTML("afterend",g),j.forEach(a=>{a.querySelector("iframe#aswift_0")||(a.parentNode.style.height="200px",a.parentNode.style.width="200px",a.parentNode.innerHTML=g)}))}var k=document.querySelector(".page-body"),l=document.querySelectorAll(".adsbygoogle, .phpbb-ads-center");k&&!k.innerText.includes("deactivating your Ad-Blocker")&&l.length&&(l.forEach(a=>{a.remove()}),b.disconnect())}catch(a){}});b.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){b.disconnect()},1E4) }));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            var e = new MutationObserver((function() {
                try {
                    for (var t, n = function(e) {
                        for (var t = "", n = 0; n < e; n++) t += "0123456789".charAt(Math.floor(10 * Math.random()));
                        return t;
                    }, o = document.querySelectorAll(".adsbygoogle, script[data-ad-client]"), i = 0; i < o.length; i++) if (o[i].getAttribute("data-ad-client")) {
                        t = o[i].getAttribute("data-ad-client");
                        break;
                    }
                    if (t) {
                        var a = `<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${t}&amp;output=html&amp;adk=${n(10)}&amp;adf=${n(10)}&amp;lmt=${n(10)}&amp;plat=${n(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${n(100)}&amp;bpp=2&amp;bdt=${n(3)}&amp;idt=${n(3)}&amp;shv=r${n(8)}&amp;mjsv=m${n(8)}&amp;ptt=${n(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${n(8)}&amp;frm=${n(2)}&amp;pv=2&amp;ga_vid=${n(10)}.${n(10)}&amp;ga_sid=${n(10)}&amp;ga_hid=${n(10)}&amp;ga_fc=0&amp;u_tz=${n(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${n(4)}&amp;u_w=${n(4)}&amp;u_ah=${n(4)}&amp;u_aw=${n(4)}&amp;u_cd=${n(2)}&amp;u_nplug=${n(1)}&amp;u_nmime=${n(1)}&amp;adx=-${n(8)}&amp;ady=-${n(8)}&amp;biw=${n(4)}&amp;bih=${n(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${n(30)}&amp;oid=${n(1)}&amp;pvsid=${n(16)}&amp;pem=${n(3)}&amp;eae=${n(1)}&amp;fc=${n(4)}&amp;brdim=${n(20)}&amp;vis=1&amp;rsz=${n(6)}&amp;abl=NS&amp;fu=${n(4)}&amp;bc=${n(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`, r = document.querySelector("body > *"), c = document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");
                        r && c.length && (!r.querySelector("iframe#aswift_0") && r.insertAdjacentHTML("afterend", a), 
                        c.forEach((e => {
                            e.querySelector("iframe#aswift_0") || (e.parentNode.style.height = "200px", e.parentNode.style.width = "200px", 
                            e.parentNode.innerHTML = a);
                        })));
                    }
                    var s = document.querySelector(".page-body"), d = document.querySelectorAll(".adsbygoogle, .phpbb-ads-center");
                    s && !s.innerText.includes("deactivating your Ad-Blocker") && d.length && (d.forEach((e => {
                        e.remove();
                    })), e.disconnect());
                } catch (t) {}
            }));
            e.observe(document, {
                childList: !0,
                subtree: !0
            }), setTimeout((function() {
                e.disconnect();
            }), 1e4);
        }));
    },
    "AG_abortInlineScript(/adblock/, 'document.createElement');": () => {
        AG_abortInlineScript(/adblock/, "document.createElement");
    },
    "window.adsbygoogle = { loaded: !0 };": () => {
        window.adsbygoogle = {
            loaded: !0
        };
    },
    '!function(){const e={apply:(e,l,t)=>{const o=t[0];return o?.includes(".b_ad,")?t[0]="#b_results":o?.includes(".b_restorableLink")&&(t[0]=".b_algo"),Reflect.apply(e,l,t)}};window.Element.prototype.querySelectorAll=new Proxy(window.Element.prototype.querySelectorAll,e)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => {
                    const o = n[0];
                    return o?.includes(".b_ad,") ? n[0] = "#b_results" : o?.includes(".b_restorableLink") && (n[0] = ".b_algo"), 
                    Reflect.apply(e, t, n);
                }
            };
            window.Element.prototype.querySelectorAll = new Proxy(window.Element.prototype.querySelectorAll, e);
        }();
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\]\\.bab\\(window/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/\]\.bab\(window/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    '(function(){var b=window.addEventListener;window.addEventListener=function(c,a,d){if(a&&-1==a.toString().indexOf("adblocker"))return b(c,a,d)}.bind(window)})();': () => {
        !function() {
            var e = window.addEventListener;
            window.addEventListener = function(t, n, o) {
                if (n && -1 == n.toString().indexOf("adblocker")) return e(t, n, o);
            }.bind(window);
        }();
    },
    "(function(){var b=window.setInterval;window.setInterval=function(a,c){if(!/.\\.display=='hidden'[\\s\\S]*?.\\.visibility=='none'/.test(a.toString()))return b(a,c)}.bind(window)})();": () => {
        !function() {
            var e = window.setInterval;
            window.setInterval = function(t, n) {
                if (!/.\.display=='hidden'[\s\S]*?.\.visibility=='none'/.test(t.toString())) return e(t, n);
            }.bind(window);
        }();
    },
    "(function(){var b=window.setInterval;window.setInterval=function(a,c){if(!/e\\.display=='hidden'[\\s\\S]*?e\\.visibility=='none'/.test(a.toString()))return b(a,c)}.bind(window)})();": () => {
        !function() {
            var e = window.setInterval;
            window.setInterval = function(t, n) {
                if (!/e\.display=='hidden'[\s\S]*?e\.visibility=='none'/.test(t.toString())) return e(t, n);
            }.bind(window);
        }();
    },
    "window.cRAds = !0;": () => {
        window.cRAds = !0;
    },
    "window.spoof_weer2edasfgeefzc = true;": () => {
        window.spoof_weer2edasfgeefzc = !0;
    },
    "window.$tieE3 = true;": () => {
        window.$tieE3 = !0;
    },
    "window.adblock = 'no';": () => {
        window.adblock = "no";
    },
    "window.cRAds = true;": () => {
        window.cRAds = !0;
    },
    "window.Advertisement = 1;": () => {
        window.Advertisement = 1;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/getAdIFrameCount/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/getAdIFrameCount/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "window.check_adblock = true;": () => {
        window.check_adblock = !0;
    },
    "window.isAdsDisplayed = true;": () => {
        window.isAdsDisplayed = !0;
    },
    "window.adBlockDetected = false;": () => {
        window.adBlockDetected = !1;
    },
    "window.adsEnabled = true;": () => {
        window.adsEnabled = !0;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/adblock.html/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/adblock.html/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "window.uabpdl = window.uabInject = true;": () => {
        window.uabpdl = window.uabInject = !0;
    },
    'window.ads = "on";': () => {
        window.ads = "on";
    },
    "window.detector_active = true;": () => {
        window.detector_active = !0;
    },
    "window.adblock = 1;": () => {
        window.adblock = 1;
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.querySelector\\("ins\\.adsbygoogle"\\)/.test(a)){ _st(a,b);}};': () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /document\.querySelector\("ins\.adsbygoogle"\)/.test(t) || e(t, n);
        };
    },
    "window.showAds = 1;": () => {
        window.showAds = 1;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/ad-free subscription/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/ad-free subscription/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "window.popns = true;": () => {
        window.popns = !0;
    },
    "window.adBlock = false;": () => {
        window.adBlock = !1;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\!document\\.getElementById[\\s\\S]*?#updato-overlay/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/\!document\.getElementById[\s\S]*?#updato-overlay/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.getElementById\\('cootent'\\)\\.innerHTML=/.test(a)){ _st(a,b);}};": () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /document\.getElementById\('cootent'\)\.innerHTML=/.test(t) || e(t, n);
        };
    },
    "window.areAdsDisplayed = true;": () => {
        window.areAdsDisplayed = !0;
    },
    "window.Adv_ab = false;": () => {
        window.Adv_ab = !1;
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/isAdsBlocked/.test(a)){ _st(a,b);}};": () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /isAdsBlocked/.test(t) || e(t, n);
        };
    },
    "window.adsEnabled=!0;": () => {
        window.adsEnabled = !0;
    },
    "window.showads=true;": () => {
        window.showads = !0;
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/_detectAdBlocker/.test(a)){ _st(a,b);}};": () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /_detectAdBlocker/.test(t) || e(t, n);
        };
    },
    '(function(o,a){o(window,"FTBAds",{get:function(){return a},set:function(b){a=b;o(a,"ads",{value:!1})}})})(Object.defineProperty);': () => {
        !function(e, t) {
            e(window, "FTBAds", {
                get: function() {
                    return t;
                },
                set: function(n) {
                    e(t = n, "ads", {
                        value: !1
                    });
                }
            });
        }(Object.defineProperty);
    },
    "window.abvertDar = 1;": () => {
        window.abvertDar = 1;
    },
    "(function(c,b){Object.defineProperties(window,{dataLayer:c,dataLayer_gtm:c})})({set:function(a){a&&a[0]&&(a[0].AdBlockerDetected=!1);b=a},get:function(){return b},enumerable:!0});": () => {
        e = {
            set: function(e) {
                e && e[0] && (e[0].AdBlockerDetected = !1);
                b = e;
            },
            get: function() {
                return b;
            },
            enumerable: !0
        }, Object.defineProperties(window, {
            dataLayer: e,
            dataLayer_gtm: e
        });
        var e;
    },
    '(function(a){setTimeout=function(){var b="function"==typeof arguments[0]?Function.prototype.toString.call(arguments[0]):"string"==typeof arguments[0]?arguments[0]:String(arguments[0]);return/\\[(_0x[a-z0-9]{4,})\\[\\d+\\]\\][\\[\\(]\\1\\[\\d+\\]/.test(b)?NaN:a.apply(window,arguments)}.bind();Object.defineProperty(setTimeout,"name",{value:a.name});setTimeout.toString=Function.prototype.toString.bind(a)})(setTimeout);': () => {
        !function(e) {
            setTimeout = function() {
                var t = "function" == typeof arguments[0] ? Function.prototype.toString.call(arguments[0]) : "string" == typeof arguments[0] ? arguments[0] : String(arguments[0]);
                return /\[(_0x[a-z0-9]{4,})\[\d+\]\][\[\(]\1\[\d+\]/.test(t) ? NaN : e.apply(window, arguments);
            }.bind();
            Object.defineProperty(setTimeout, "name", {
                value: e.name
            });
            setTimeout.toString = Function.prototype.toString.bind(e);
        }(setTimeout);
    },
    '(function(b,c){setTimeout=function(){var a=arguments[0];if("function"==typeof a&&/^function [A-Za-z]{1,2}\\(\\)\\s*\\{([A-Za-z])\\|\\|\\(\\1=!0,[\\s\\S]{1,13}\\(\\)\\)\\}$/.test(c.call(a)))throw"Adguard stopped a script execution.";return b.apply(window,arguments)}})(setTimeout,Function.prototype.toString);': () => {
        e = setTimeout, t = Function.prototype.toString, setTimeout = function() {
            var n = arguments[0];
            if ("function" == typeof n && /^function [A-Za-z]{1,2}\(\)\s*\{([A-Za-z])\|\|\(\1=!0,[\s\S]{1,13}\(\)\)\}$/.test(t.call(n))) throw "Adguard stopped a script execution.";
            return e.apply(window, arguments);
        };
        var e, t;
    },
    "window.sessionStorage.loadedAds = 3;": () => {
        window.sessionStorage.loadedAds = 3;
    },
    "window.call_Ad = function() { };": () => {
        window.call_Ad = function() {};
    },
    "window.RunAds = !0;": () => {
        window.RunAds = !0;
    },
    "window._r3z = {}; Object.defineProperties(window._r3z, { jq: { value: undefined }, pub: { value: {} } });": () => {
        window._r3z = {};
        Object.defineProperties(window._r3z, {
            jq: {
                value: void 0
            },
            pub: {
                value: {}
            }
        });
    },
    "(function() { window.xRds = false; window.frg = true; window.frag = true;  })();": () => {
        !function() {
            window.xRds = !1;
            window.frg = !0;
            window.frag = !0;
        }();
    },
    "window.canABP = true;": () => {
        window.canABP = !0;
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/displayAdBlockedVideo/.test(a)){ _st(a,b);}};": () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /displayAdBlockedVideo/.test(t) || e(t, n);
        };
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/adsbygoogle instanceof Array/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/adsbygoogle instanceof Array/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    'window.ad_permission = "OK";': () => {
        window.ad_permission = "OK";
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/new Image\\(\\);s\\.onerror=function/.test(a.toString()))return b(a,c)};})();": () => {
        !function() {
            var e = window.setTimeout;
            window.setTimeout = function(t, n) {
                if (!/new Image\(\);s\.onerror=function/.test(t.toString())) return e(t, n);
            };
        }();
    },
    'document.cookie="popunder=1; path=/;";': () => {
        document.cookie = "popunder=1; path=/;";
    },
    "!function(){if(location.pathname.indexOf(\"/iframe/player\")===-1){Object.defineProperty(Object.prototype, 'kununu_mul', { get: function(){ throw null; }, set: function(){ throw null; }});}}();": () => {
        -1 === location.pathname.indexOf("/iframe/player") && Object.defineProperty(Object.prototype, "kununu_mul", {
            get: function() {
                throw null;
            },
            set: function() {
                throw null;
            }
        });
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("{}")&&(e[0]="<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<vmap:VMAP version=\\"1.0\\" xmlns:vmap=\\"http://www.iab.net/videosuite/vmap\\"><vmap:AdBreak timeOffset=\\"start\\" breakType=\\"linear\\" breakId=\\"4f95e542-9da8-480e-8c2a-7ade1ffdcc3d\\"><vmap:AdSource allowMultipleAds=\\"true\\" followRedirects=\\"true\\"><vmap:VASTAdData></vmap:VASTAdData></vmap:AdSource></vmap:AdBreak></vmap:VMAP>"),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => (n[0]?.includes?.("{}") && (n[0] = '<?xml version="1.0" encoding="UTF-8"?>\n<vmap:VMAP version="1.0" xmlns:vmap="http://www.iab.net/videosuite/vmap"><vmap:AdBreak timeOffset="start" breakType="linear" breakId="4f95e542-9da8-480e-8c2a-7ade1ffdcc3d"><vmap:AdSource allowMultipleAds="true" followRedirects="true"><vmap:VASTAdData></vmap:VASTAdData></vmap:AdSource></vmap:AdBreak></vmap:VMAP>'), 
                Reflect.apply(e, t, n))
            };
            window.DOMParser.prototype.parseFromString = new Proxy(window.DOMParser.prototype.parseFromString, e);
        }();
    },
    '(()=>{window.googletag={apiReady:!0,getVersion:function(){return"202307200101"}};})();': () => {
        window.googletag = {
            apiReady: !0,
            getVersion: function() {
                return "202307200101";
            }
        };
    },
    '!function(){const e={apply:(e,t,n)=>{if("prg"!==t?.id)return Reflect.apply(e,t,n);const o=Reflect.apply(e,t,n);return Object.defineProperty(o,"top",{value:500}),o}};window.Element.prototype.getBoundingClientRect=new Proxy(window.Element.prototype.getBoundingClientRect,e)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => {
                    if ("prg" !== t?.id) return Reflect.apply(e, t, n);
                    const o = Reflect.apply(e, t, n);
                    return Object.defineProperty(o, "top", {
                        value: 500
                    }), o;
                }
            };
            window.Element.prototype.getBoundingClientRect = new Proxy(window.Element.prototype.getBoundingClientRect, e);
        }();
    },
    "window.atob = function() { };": () => {
        window.atob = function() {};
    },
    "Object.defineProperty(window,'trev',{get:function(){return function(){var a=document.currentScript;if(!a){var c=document.getElementsByTagName('script');a=c[c.length-1]}if(a&&/typeof\\sotab\\s==\\s'function'/.test(a.textContent)){var d=a.previousSibling,b=d;while(b=b.previousSibling)if(b.nodeType==Node.COMMENT_NODE&&/\\d{5,}\\s\\d{1,2}/.test(b.data)){d.style.setProperty('display','none','important');return}}}},set:function(){}});": () => {
        Object.defineProperty(window, "trev", {
            get: function() {
                return function() {
                    var e = document.currentScript;
                    if (!e) {
                        var t = document.getElementsByTagName("script");
                        e = t[t.length - 1];
                    }
                    if (e && /typeof\sotab\s==\s'function'/.test(e.textContent)) for (var n = e.previousSibling, o = n; o = o.previousSibling; ) if (o.nodeType == Node.COMMENT_NODE && /\d{5,}\s\d{1,2}/.test(o.data)) {
                        n.style.setProperty("display", "none", "important");
                        return;
                    }
                };
            },
            set: function() {}
        });
    },
    "window.canABP = window.canRunAds = window.canCheckAds = true;": () => {
        window.canABP = window.canRunAds = window.canCheckAds = !0;
    },
    "window.canRun = true;": () => {
        window.canRun = !0;
    },
    'window.googleToken = "no";': () => {
        window.googleToken = "no";
    },
    '(()=>{let t=window?.__iasPET?.queue;Array.isArray(t)||(t=[]);const s=JSON.stringify({brandSafety:{},slots:{}});function e(t){try{t?.dataHandler?.(s)}catch(t){}}for(t.push=e,window.__iasPET={VERSION:"1.16.18",queue:t,sessionId:"",setTargetingForAppNexus(){},setTargetingForGPT(){},start(){}};t.length;)e(t.shift())})();': () => {
        (() => {
            let e = window?.__iasPET?.queue;
            Array.isArray(e) || (e = []);
            const t = JSON.stringify({
                brandSafety: {},
                slots: {}
            });
            function n(e) {
                try {
                    e?.dataHandler?.(t);
                } catch (e) {}
            }
            for (e.push = n, window.__iasPET = {
                VERSION: "1.16.18",
                queue: e,
                sessionId: "",
                setTargetingForAppNexus() {},
                setTargetingForGPT() {},
                start() {}
            }; e.length; ) n(e.shift());
        })();
    },
    "window.my_random_number = 1;": () => {
        window.my_random_number = 1;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\[_0x/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/\[_0x/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "(()=>{window.com_adswizz_synchro_decorateUrl=(a)=>a;})();": () => {
        window.com_adswizz_synchro_decorateUrl = e => e;
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{var a=document.querySelector("body");document.location.hostname.includes("skmedix.pl")&&a&&a.insertAdjacentHTML("beforeend",\'<ins class="adsbygoogle" data-ad-status="filled"><div id="aswift_" style="position: absolute !important; left: -3000px !important;"><iframe id="aswift_"></iframe></div></ins><iframe src="/aframe"></iframe>\')})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            var e = document.querySelector("body");
            document.location.hostname.includes("skmedix.pl") && e && e.insertAdjacentHTML("beforeend", '<ins class="adsbygoogle" data-ad-status="filled"><div id="aswift_" style="position: absolute !important; left: -3000px !important;"><iframe id="aswift_"></iframe></div></ins><iframe src="/aframe"></iframe>');
        }));
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{   setTimeout(function() { if(typeof show_game_iframe === "function") { show_game_iframe(); } }, 1000); }));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            setTimeout((function() {
                "function" == typeof show_game_iframe && show_game_iframe();
            }), 1e3);
        }));
    },
    '(()=>{window.sas_idmnet=window.sas_idmnet||{};Object.assign(sas_idmnet,{releaseVideo:function(a){if("object"==typeof videoInit&&"function"==typeof videoInit.start)try{videoInit.start(a,n)}catch(a){}},release:function(){},placementsList:function(){}});const a=function(a,b){if(a&&a.push)for(a.push=b;a.length;)b(a.shift())},b=function(a){try{a()}catch(a){console.error(a)}};"complete"===document.readyState?a(sas_idmnet.cmd,b):window.addEventListener("load",()=>{a(sas_idmnet.cmd,b)})})();': () => {
        (() => {
            window.sas_idmnet = window.sas_idmnet || {};
            Object.assign(sas_idmnet, {
                releaseVideo: function(e) {
                    if ("object" == typeof videoInit && "function" == typeof videoInit.start) try {
                        videoInit.start(e, n);
                    } catch (e) {}
                },
                release: function() {},
                placementsList: function() {}
            });
            const e = function(e, t) {
                if (e && e.push) for (e.push = t; e.length; ) t(e.shift());
            }, t = function(e) {
                try {
                    e();
                } catch (e) {
                    console.error(e);
                }
            };
            "complete" === document.readyState ? e(sas_idmnet.cmd, t) : window.addEventListener("load", (() => {
                e(sas_idmnet.cmd, t);
            }));
        })();
    },
    "!function(){window.YLHH={bidder:{startAuction:function(){}}};}();": () => {
        window.YLHH = {
            bidder: {
                startAuction: function() {}
            }
        };
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return g===1e3&&/#kam-ban-player/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            return 1e3 === n && /#kam-ban-player/.test(t.toString()) && (n *= .01), e.apply(this, arguments);
        }.bind(window);
        var e;
    },
    '(()=>{const t=Object.getOwnPropertyDescriptor,e={apply:(e,n,r)=>{const o=r[0];if(o?.toString?.()?.includes("EventTarget")){const e=t(o,"addEventListener");e?.set?.toString&&(e.set.toString=function(){}),e?.get?.toString&&(e.get.toString=function(){})}return Reflect.apply(e,n,r)}};window.Object.getOwnPropertyDescriptors=new Proxy(window.Object.getOwnPropertyDescriptors,e)})();': () => {
        (() => {
            const e = Object.getOwnPropertyDescriptor, t = {
                apply: (t, n, o) => {
                    const i = o[0];
                    if (i?.toString?.()?.includes("EventTarget")) {
                        const t = e(i, "addEventListener");
                        t?.set?.toString && (t.set.toString = function() {}), t?.get?.toString && (t.get.toString = function() {});
                    }
                    return Reflect.apply(t, n, o);
                }
            };
            window.Object.getOwnPropertyDescriptors = new Proxy(window.Object.getOwnPropertyDescriptors, t);
        })();
    },
    '(()=>{Object.defineProperty=new Proxy(Object.defineProperty,{apply:(e,t,n)=>{const r=new Set(["VP","w3","JW"]),o=n[1],c=n[2]?.get;return o&&r.has(o)&&"function"==typeof c&&c.toString().includes("()=>i")&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n)}});})();': () => {
        Object.defineProperty = new Proxy(Object.defineProperty, {
            apply: (e, t, n) => {
                const o = new Set([ "VP", "w3", "JW" ]), i = n[1], a = n[2]?.get;
                return i && o.has(i) && "function" == typeof a && a.toString().includes("()=>i") && (n[2].get = function() {
                    return function() {
                        return !1;
                    };
                }), Reflect.apply(e, t, n);
            }
        });
    },
    "window.showAds = true;": () => {
        window.showAds = !0;
    },
    "window.uabpInject = function() {};": () => {
        window.uabpInject = function() {};
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/checkAds\\(\\);/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/checkAds\(\);/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "window.adblock = true;": () => {
        window.adblock = !0;
    },
    "window.ads_unblocked = true;": () => {
        window.ads_unblocked = !0;
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("</VAST>")&&(e[0]=""),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => (n[0]?.includes?.("</VAST>") && (n[0] = ""), Reflect.apply(e, t, n))
            };
            window.DOMParser.prototype.parseFromString = new Proxy(window.DOMParser.prototype.parseFromString, e);
        }();
    },
    "window.adsOk = !0;": () => {
        window.adsOk = !0;
    },
    "window.ads_ok = true;": () => {
        window.ads_ok = !0;
    },
    '(()=>{const t={construct:(t,n,o)=>{const e=n[0],s=e?.toString(),c=s?.includes("await this.whenGDPRClosed()");return c&&(n[0]=t=>t(!0)),Reflect.construct(t,n,o)}};window.Promise=new Proxy(window.Promise,t)})();': () => {
        (() => {
            const e = {
                construct: (e, t, n) => {
                    const o = t[0], i = o?.toString(), a = i?.includes("await this.whenGDPRClosed()");
                    return a && (t[0] = e => e(!0)), Reflect.construct(e, t, n);
                }
            };
            window.Promise = new Proxy(window.Promise, e);
        })();
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/notDetectedBy/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/notDetectedBy/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "window.adBlockTest = true;": () => {
        window.adBlockTest = !0;
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/ib\\.adnxs\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("POST"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        e = XMLHttpRequest.prototype.open, t = /ib\.adnxs\.com/i, XMLHttpRequest.prototype.open = function(n, o) {
            if ("POST" !== n || !t.test(o)) return e.apply(this, arguments);
            this.send = function() {
                return null;
            }, this.setRequestHeader = function() {
                return null;
            }, console.log("AG has blocked request: ", o);
        };
        var e, t;
    },
    '!function(){if(location.pathname.includes("/source/playerads")){var b=new MutationObserver(function(){var a=document.querySelector(\'script[type="text/javascript"]\');a&&a.textContent.includes(\'"ads": [\')&&(b.disconnect(),a.textContent=a.textContent.replace(/("ads": \\[\\{)[\\s\\S]*?(\\}\\])/,"$1$2"))});b.observe(document,{childList:!0,subtree:!0})}}();': () => {
        !function() {
            if (location.pathname.includes("/source/playerads")) {
                var e = new MutationObserver((function() {
                    var t = document.querySelector('script[type="text/javascript"]');
                    t && t.textContent.includes('"ads": [') && (e.disconnect(), t.textContent = t.textContent.replace(/("ads": \[\{)[\s\S]*?(\}\])/, "$1$2"));
                }));
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }
        }();
    },
    "clientSide.player.play(true);": () => {
        clientSide.player.play(!0);
    },
    '(()=>{if(location.href.includes("/embed/?link=")){const i=new URL(location.href).searchParams.get("link");if(i)try{location.assign(i)}catch(i){}}})();': () => {
        (() => {
            if (location.href.includes("/embed/?link=")) {
                const e = new URL(location.href).searchParams.get("link");
                if (e) try {
                    location.assign(e);
                } catch (e) {}
            }
        })();
    },
    "(function(){Object.defineProperty(window, 'ExoLoader', { get: function() { return; } }); var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"getexoloader\"!=a&&-1==b.toString().indexOf('loader')&&c(a,b,d,e)}.bind(document);})();": () => {
        !function() {
            Object.defineProperty(window, "ExoLoader", {
                get: function() {}
            });
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "getexoloader" != t && -1 == n.toString().indexOf("loader") && e(t, n, o, i);
            }.bind(document);
        }();
    },
    'Object.defineProperties(window, { "_impspcabe_alpha": { value: false, writable: false }, "_impspcabe_beta": { value: false, writable: false }, "_impspcabe_path": { value: \'about:blank\', writable: false }, "_impspcabe": { value: false, writable: false } });': () => {
        Object.defineProperties(window, {
            _impspcabe_alpha: {
                value: !1,
                writable: !1
            },
            _impspcabe_beta: {
                value: !1,
                writable: !1
            },
            _impspcabe_path: {
                value: "about:blank",
                writable: !1
            },
            _impspcabe: {
                value: !1,
                writable: !1
            }
        });
    },
    "Object.defineProperties(window, { _wm: { get: function(){ return null; } }, _wm_settings: { get: function(){return{};} } });": () => {
        Object.defineProperties(window, {
            _wm: {
                get: function() {
                    return null;
                }
            },
            _wm_settings: {
                get: function() {
                    return {};
                }
            }
        });
    },
    '(()=>{if(window.self!==window.top)try{if("object"==typeof localStorage)return}catch(a){delete window.localStorage,window.localStorage={setItem(){},getItem(){},removeItem(){},clear(){}}}})();': () => {
        (() => {
            if (window.self !== window.top) try {
                if ("object" == typeof localStorage) return;
            } catch (e) {
                delete window.localStorage, window.localStorage = {
                    setItem() {},
                    getItem() {},
                    removeItem() {},
                    clear() {}
                };
            }
        })();
    },
    '(()=>{window.Bolt={on:(o,n,i)=>{"precontent_ad_video"===o&&"AD_COMPLETE"===n&&"function"==typeof i&&i()},BOLT_AD_COMPLETE:"AD_COMPLETE",BOLT_AD_ERROR:"AD_ERROR"},window.ramp=window.ramp||{},window.ramp.addUnits=()=>Promise.resolve(),window.ramp.displayUnits=()=>{setTimeout((()=>{"function"==typeof window.ramp.onPlayerReady&&window.ramp.onPlayerReady()}),1)};})();': () => {
        window.Bolt = {
            on: (e, t, n) => {
                "precontent_ad_video" === e && "AD_COMPLETE" === t && "function" == typeof n && n();
            },
            BOLT_AD_COMPLETE: "AD_COMPLETE",
            BOLT_AD_ERROR: "AD_ERROR"
        }, window.ramp = window.ramp || {}, window.ramp.addUnits = () => Promise.resolve(), 
        window.ramp.displayUnits = () => {
            setTimeout((() => {
                "function" == typeof window.ramp.onPlayerReady && window.ramp.onPlayerReady();
            }), 1);
        };
    },
    '(()=>{const e={apply:(e,t,o)=>(o[0]=!0,Reflect.apply(e,t,o))};let t,o=!1;Object.defineProperty(window,"ig",{get:function(){return"function"!=typeof t?.RetentionRewardedVideo?.prototype?.rewardedVideoResult||o||(t.RetentionRewardedVideo.prototype.rewardedVideoResult=new Proxy(t.RetentionRewardedVideo.prototype.rewardedVideoResult,e),o=!0),t},set:function(e){t=e}})})();': () => {
        (() => {
            const e = {
                apply: (e, t, n) => (n[0] = !0, Reflect.apply(e, t, n))
            };
            let t, n = !1;
            Object.defineProperty(window, "ig", {
                get: function() {
                    return "function" != typeof t?.RetentionRewardedVideo?.prototype?.rewardedVideoResult || n || (t.RetentionRewardedVideo.prototype.rewardedVideoResult = new Proxy(t.RetentionRewardedVideo.prototype.rewardedVideoResult, e), 
                    n = !0), t;
                },
                set: function(e) {
                    t = e;
                }
            });
        })();
    },
    '(()=>{let e,n=!1;const t=function(){};Object.defineProperty(window,"videojs",{get:function(){return e},set:function(o){e=o,!n&&e&&"function"==typeof e.registerPlugin&&(n=!0,e.registerPlugin("skipIma3Unskippable",t))}}),window.SlotTypeEnum={},window.ANAWeb=function(){},window.ANAWeb.prototype.createVideoSlot=function(){},window.ANAWeb.prototype.createSlot=function(){},window.ANAWeb.VideoPlayerType={},window.addEventListener("load",(function(){document.dispatchEvent(new CustomEvent("ANAReady"))}))})();': () => {
        (() => {
            let e, t = !1;
            const n = function() {};
            Object.defineProperty(window, "videojs", {
                get: function() {
                    return e;
                },
                set: function(o) {
                    e = o, !t && e && "function" == typeof e.registerPlugin && (t = !0, e.registerPlugin("skipIma3Unskippable", n));
                }
            }), window.SlotTypeEnum = {}, window.ANAWeb = function() {}, window.ANAWeb.prototype.createVideoSlot = function() {}, 
            window.ANAWeb.prototype.createSlot = function() {}, window.ANAWeb.VideoPlayerType = {}, 
            window.addEventListener("load", (function() {
                document.dispatchEvent(new CustomEvent("ANAReady"));
            }));
        })();
    },
    '(()=>{const a=function(){};window.apstag={fetchBids(c,a){"function"==typeof a&&a([])},init:a,setDisplayBids:a,targetingKeys:a}})();': () => {
        (() => {
            const e = function() {};
            window.apstag = {
                fetchBids(e, t) {
                    "function" == typeof t && t([]);
                },
                init: e,
                setDisplayBids: e,
                targetingKeys: e
            };
        })();
    },
    '(()=>{window.JSON.parse=new Proxy(JSON.parse,{apply(r,e,t){const s=Reflect.apply(r,e,t),l=s?.results;try{if(l&&Array.isArray(l))s?.results&&(s.results=s.results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})));else for(let r in s){const e=s[r]?.results;e&&Array.isArray(e)&&(s[r].results=s[r].results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})))}}catch(r){}return s}});})();': () => {
        window.JSON.parse = new Proxy(JSON.parse, {
            apply(e, t, n) {
                const o = Reflect.apply(e, t, n), i = o?.results;
                try {
                    if (i && Array.isArray(i)) o?.results && (o.results = o.results.filter((e => {
                        if (!Object.prototype.hasOwnProperty.call(e, "adTitle")) return e;
                    }))); else for (let e in o) {
                        const t = o[e]?.results;
                        t && Array.isArray(t) && (o[e].results = o[e].results.filter((e => {
                            if (!Object.prototype.hasOwnProperty.call(e, "adTitle")) return e;
                        })));
                    }
                } catch (e) {}
                return o;
            }
        });
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){},rp:{requestVideoBids:function(n){if("function"==typeof n?.callback)try{n.callback.call()}catch(n){}}}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': () => {
        (() => {
            const e = function(e) {
                if ("function" == typeof e) try {
                    e.call();
                } catch (e) {}
            }, t = {
                addAdUnits: function() {},
                adServers: {
                    dfp: {
                        buildVideoUrl: function() {
                            return "";
                        }
                    }
                },
                adUnits: [],
                aliasBidder: function() {},
                cmd: [],
                enableAnalytics: function() {},
                getHighestCpmBids: function() {
                    return [];
                },
                libLoaded: !0,
                que: [],
                requestBids: function(e) {
                    if (e instanceof Object && e.bidsBackHandler) try {
                        e.bidsBackHandler.call();
                    } catch (e) {}
                },
                removeAdUnit: function() {},
                setBidderConfig: function() {},
                setConfig: function() {},
                setTargetingForGPTAsync: function() {},
                rp: {
                    requestVideoBids: function(e) {
                        if ("function" == typeof e?.callback) try {
                            e.callback.call();
                        } catch (e) {}
                    }
                }
            };
            t.cmd.push = e, t.que.push = e, window.pbjs = t;
        })();
    },
    '(()=>{const c=function(){[...arguments].forEach((c=>{if("function"==typeof c)try{c(!0)}catch(c){console.debug(c)}}))},n=[];n.push=c,window.PQ={cmd:n,getTargeting:c}})();': () => {
        (() => {
            const e = function() {
                [ ...arguments ].forEach((e => {
                    if ("function" == typeof e) try {
                        e(!0);
                    } catch (e) {
                        console.debug(e);
                    }
                }));
            }, t = [];
            t.push = e, window.PQ = {
                cmd: t,
                getTargeting: e
            };
        })();
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': () => {
        (() => {
            const e = function(e) {
                if ("function" == typeof e) try {
                    e.call();
                } catch (e) {}
            }, t = {
                addAdUnits: function() {},
                adServers: {
                    dfp: {
                        buildVideoUrl: function() {
                            return "";
                        }
                    }
                },
                adUnits: [],
                aliasBidder: function() {},
                cmd: [],
                enableAnalytics: function() {},
                getHighestCpmBids: function() {
                    return [];
                },
                libLoaded: !0,
                que: [],
                requestBids: function(e) {
                    if (e instanceof Object && e.bidsBackHandler) try {
                        e.bidsBackHandler.call();
                    } catch (e) {}
                },
                removeAdUnit: function() {},
                setBidderConfig: function() {},
                setConfig: function() {},
                setTargetingForGPTAsync: function() {}
            };
            t.cmd.push = e, t.que.push = e, window.pbjs = t;
        })();
    },
    '(()=>{const t=[];t.push=function(t){try{t()}catch(t){}};window.headertag={cmd:t,buildGamMvt:function(t,c){const n={[c]:"https://securepubads.g.doubleclick.net/gampad/ads"};return n||{}},retrieveVideoDemand:function(t,c,n){const e=t[0]?.htSlotName;if("function"==typeof c)try{c(e)}catch(t){}}}})();': () => {
        (() => {
            const e = [];
            e.push = function(e) {
                try {
                    e();
                } catch (e) {}
            };
            window.headertag = {
                cmd: e,
                buildGamMvt: function(e, t) {
                    return {
                        [t]: "https://securepubads.g.doubleclick.net/gampad/ads"
                    } || {};
                },
                retrieveVideoDemand: function(e, t, n) {
                    const o = e[0]?.htSlotName;
                    if ("function" == typeof t) try {
                        t(o);
                    } catch (e) {}
                }
            };
        })();
    },
    '(()=>{const e="3.453.0",t=function(){},s={},n=function(e){const t=document.createElement("div");t.style.setProperty("display","none","important"),t.style.setProperty("visibility","collapse","important"),e&&e.appendChild(t)};n.prototype.destroy=t,n.prototype.initialize=t;const i=function(){};i.CompanionBackfillMode={ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},i.VpaidMode={DISABLED:0,ENABLED:1,INSECURE:2},i.prototype={c:!0,f:{},i:!1,l:"",p:"",r:0,t:"",v:"",getCompanionBackfill:t,getDisableCustomPlaybackForIOS10Plus(){return this.i},getDisabledFlashAds:()=>!0,getFeatureFlags(){return this.f},getLocale(){return this.l},getNumRedirects(){return this.r},getPlayerType(){return this.t},getPlayerVersion(){return this.v},getPpid(){return this.p},getVpaidMode(){return this.C},isCookiesEnabled(){return this.c},isVpaidAdapter(){return this.M},setCompanionBackfill:t,setAutoPlayAdBreaks(e){this.K=e},setCookiesEnabled(e){this.c=!!e},setDisableCustomPlaybackForIOS10Plus(e){this.i=!!e},setDisableFlashAds:t,setFeatureFlags(e){this.f=!!e},setIsVpaidAdapter(e){this.M=e},setLocale(e){this.l=!!e},setNumRedirects(e){this.r=!!e},setPageCorrelator(e){this.R=e},setPlayerType(e){this.t=!!e},setPlayerVersion(e){this.v=!!e},setPpid(e){this.p=!!e},setVpaidMode(e){this.C=e},setSessionId:t,setStreamCorrelator:t,setVpaidAllowed:t,CompanionBackfillMode:{ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},VpaidMode:{DISABLED:0,ENABLED:1,INSECURE:2}};const r=function(){this.listeners=new Map,this._dispatch=function(e){let t=this.listeners.get(e.type);t=t?t.values():[];for(const s of Array.from(t))try{s(e)}catch(e){console.trace(e)}},this.addEventListener=function(e,t,s,n){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const i=e[s];this.listeners.has(i)||this.listeners.set(i,new Map),this.listeners.get(i).set(t,t.bind(n||this))}},this.removeEventListener=function(e,t){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const n=e[s];this.listeners.get(n)?.delete(t)}}},o=new r;o.volume=1,o.collapse=t,o.configureAdsManager=t,o.destroy=t,o.discardAdBreak=t,o.expand=t,o.focus=t,o.getAdSkippableState=()=>!1,o.getCuePoints=()=>[0],o.getCurrentAd=()=>h,o.getCurrentAdCuePoints=()=>[],o.getRemainingTime=()=>0,o.getVolume=function(){return this.volume},o.init=t,o.isCustomClickTrackingUsed=()=>!1,o.isCustomPlaybackUsed=()=>!1,o.pause=t,o.requestNextAdBreak=t,o.resize=t,o.resume=t,o.setVolume=function(e){this.volume=e},o.skip=t,o.start=function(){for(const e of [T.Type.LOADED,T.Type.STARTED,T.Type.CONTENT_RESUME_REQUESTED,T.Type.AD_BUFFERING,T.Type.FIRST_QUARTILE,T.Type.MIDPOINT,T.Type.THIRD_QUARTILE,T.Type.COMPLETE,T.Type.ALL_ADS_COMPLETED])try{this._dispatch(new s.AdEvent(e))}catch(e){console.trace(e)}},o.stop=t,o.updateAdsRenderingSettings=t;const a=Object.create(o),d=function(e,t,s){this.type=e,this.adsRequest=t,this.userRequestContext=s};d.prototype={getAdsManager:()=>a,getUserRequestContext(){return this.userRequestContext?this.userRequestContext:{}}},d.Type={ADS_MANAGER_LOADED:"adsManagerLoaded"};const E=r;E.prototype.settings=new i,E.prototype.contentComplete=t,E.prototype.destroy=t,E.prototype.getSettings=function(){return this.settings},E.prototype.getVersion=()=>e,E.prototype.requestAds=function(e,t){requestAnimationFrame((()=>{const{ADS_MANAGER_LOADED:n}=d.Type,i=new s.AdsManagerLoadedEvent(n,e,t);this._dispatch(i)}));const n=new s.AdError("adPlayError",1205,1205,"The browser prevented playback initiated without user interaction.",e,t);requestAnimationFrame((()=>{this._dispatch(new s.AdErrorEvent(n))}))};const A=t,u=function(){};u.prototype={setAdWillAutoPlay:t,setAdWillPlayMuted:t,setContinuousPlayback:t};const l=function(){};l.prototype={getAdPosition:()=>1,getIsBumper:()=>!1,getMaxDuration:()=>-1,getPodIndex:()=>1,getTimeOffset:()=>0,getTotalAds:()=>1};const g=function(){};g.prototype.getAdIdRegistry=function(){return""},g.prototype.getAdIsValue=function(){return""};const p=function(){};p.prototype={pi:new l,getAdId:()=>"",getAdPodInfo(){return this.pi},getAdSystem:()=>"",getAdvertiserName:()=>"",getApiFramework:()=>null,getCompanionAds:()=>[],getContentType:()=>"",getCreativeAdId:()=>"",getDealId:()=>"",getDescription:()=>"",getDuration:()=>8.5,getHeight:()=>0,getMediaUrl:()=>null,getMinSuggestedDuration:()=>-2,getSkipTimeOffset:()=>-1,getSurveyUrl:()=>null,getTitle:()=>"",getTraffickingParametersString:()=>"",getUiElements:()=>[""],getUniversalAdIdRegistry:()=>"unknown",getUniversalAdIds:()=>[new g],getUniversalAdIdValue:()=>"unknown",getVastMediaBitrate:()=>0,getVastMediaHeight:()=>0,getVastMediaWidth:()=>0,getWidth:()=>0,getWrapperAdIds:()=>[""],getWrapperAdSystems:()=>[""],getWrapperCreativeIds:()=>[""],isLinear:()=>!0,isSkippable:()=>!0};const c=function(){};c.prototype={getAdSlotId:()=>"",getContent:()=>"",getContentType:()=>"",getHeight:()=>1,getWidth:()=>1};const C=function(e,t,s,n,i,r){this.errorCode=t,this.message=n,this.type=e,this.adsRequest=i,this.userRequestContext=r,this.getErrorCode=function(){return this.errorCode},this.getInnerError=function(){return null},this.getMessage=function(){return this.message},this.getType=function(){return this.type},this.getVastErrorCode=function(){return this.vastErrorCode},this.toString=function(){return`AdError ${this.errorCode}: ${this.message}`}};C.ErrorCode={},C.Type={};const h=(()=>{try{for(const e of Object.values(window.vidible._getContexts()))if(e.getPlayer()?.div?.innerHTML.includes("www.engadget.com"))return!0}catch(e){}return!1})()?void 0:new p,T=function(e){this.type=e};T.prototype={getAd:()=>h,getAdData:()=>{}},T.Type={AD_BREAK_READY:"adBreakReady",AD_BUFFERING:"adBuffering",AD_CAN_PLAY:"adCanPlay",AD_METADATA:"adMetadata",AD_PROGRESS:"adProgress",ALL_ADS_COMPLETED:"allAdsCompleted",CLICK:"click",COMPLETE:"complete",CONTENT_PAUSE_REQUESTED:"contentPauseRequested",CONTENT_RESUME_REQUESTED:"contentResumeRequested",DURATION_CHANGE:"durationChange",EXPANDED_CHANGED:"expandedChanged",FIRST_QUARTILE:"firstQuartile",IMPRESSION:"impression",INTERACTION:"interaction",LINEAR_CHANGE:"linearChange",LINEAR_CHANGED:"linearChanged",LOADED:"loaded",LOG:"log",MIDPOINT:"midpoint",PAUSED:"pause",RESUMED:"resume",SKIPPABLE_STATE_CHANGED:"skippableStateChanged",SKIPPED:"skip",STARTED:"start",THIRD_QUARTILE:"thirdQuartile",USER_CLOSE:"userClose",VIDEO_CLICKED:"videoClicked",VIDEO_ICON_CLICKED:"videoIconClicked",VIEWABLE_IMPRESSION:"viewable_impression",VOLUME_CHANGED:"volumeChange",VOLUME_MUTED:"mute"};const y=function(e){this.error=e,this.type="adError",this.getError=function(){return this.error},this.getUserRequestContext=function(){return this.error?.userRequestContext?this.error.userRequestContext:{}}};y.Type={AD_ERROR:"adError"};const I=function(){};I.Type={CUSTOM_CONTENT_LOADED:"deprecated-event"};const R=function(){};R.CreativeType={ALL:"All",FLASH:"Flash",IMAGE:"Image"},R.ResourceType={ALL:"All",HTML:"Html",IFRAME:"IFrame",STATIC:"Static"},R.SizeCriteria={IGNORE:"IgnoreSize",SELECT_EXACT_MATCH:"SelectExactMatch",SELECT_NEAR_MATCH:"SelectNearMatch"};const S=function(){};S.prototype={getCuePoints:()=>[],getAdIdRegistry:()=>"",getAdIdValue:()=>""};const D=t;Object.assign(s,{AdCuePoints:S,AdDisplayContainer:n,AdError:C,AdErrorEvent:y,AdEvent:T,AdPodInfo:l,AdProgressData:D,AdsLoader:E,AdsManager:a,AdsManagerLoadedEvent:d,AdsRenderingSettings:A,AdsRequest:u,CompanionAd:c,CompanionAdSelectionSettings:R,CustomContentLoadedEvent:I,gptProxyInstance:{},ImaSdkSettings:i,OmidAccessMode:{DOMAIN:"domain",FULL:"full",LIMITED:"limited"},OmidVerificationVendor:{1:"OTHER",2:"MOAT",3:"DOUBLEVERIFY",4:"INTEGRAL_AD_SCIENCE",5:"PIXELATE",6:"NIELSEN",7:"COMSCORE",8:"MEETRICS",9:"GOOGLE",OTHER:1,MOAT:2,DOUBLEVERIFY:3,INTEGRAL_AD_SCIENCE:4,PIXELATE:5,NIELSEN:6,COMSCORE:7,MEETRICS:8,GOOGLE:9},settings:new i,UiElements:{AD_ATTRIBUTION:"adAttribution",COUNTDOWN:"countdown"},UniversalAdIdInfo:g,VERSION:e,ViewMode:{FULLSCREEN:"fullscreen",NORMAL:"normal"}}),window.google||(window.google={}),window.google.ima?.dai&&(s.dai=window.google.ima.dai),window.google.ima=s})();': () => {
        (() => {
            const e = "3.453.0", t = function() {}, n = {}, o = function(e) {
                const t = document.createElement("div");
                t.style.setProperty("display", "none", "important"), t.style.setProperty("visibility", "collapse", "important"), 
                e && e.appendChild(t);
            };
            o.prototype.destroy = t, o.prototype.initialize = t;
            const i = function() {};
            i.CompanionBackfillMode = {
                ALWAYS: "always",
                ON_MASTER_AD: "on_master_ad"
            }, i.VpaidMode = {
                DISABLED: 0,
                ENABLED: 1,
                INSECURE: 2
            }, i.prototype = {
                c: !0,
                f: {},
                i: !1,
                l: "",
                p: "",
                r: 0,
                t: "",
                v: "",
                getCompanionBackfill: t,
                getDisableCustomPlaybackForIOS10Plus() {
                    return this.i;
                },
                getDisabledFlashAds: () => !0,
                getFeatureFlags() {
                    return this.f;
                },
                getLocale() {
                    return this.l;
                },
                getNumRedirects() {
                    return this.r;
                },
                getPlayerType() {
                    return this.t;
                },
                getPlayerVersion() {
                    return this.v;
                },
                getPpid() {
                    return this.p;
                },
                getVpaidMode() {
                    return this.C;
                },
                isCookiesEnabled() {
                    return this.c;
                },
                isVpaidAdapter() {
                    return this.M;
                },
                setCompanionBackfill: t,
                setAutoPlayAdBreaks(e) {
                    this.K = e;
                },
                setCookiesEnabled(e) {
                    this.c = !!e;
                },
                setDisableCustomPlaybackForIOS10Plus(e) {
                    this.i = !!e;
                },
                setDisableFlashAds: t,
                setFeatureFlags(e) {
                    this.f = !!e;
                },
                setIsVpaidAdapter(e) {
                    this.M = e;
                },
                setLocale(e) {
                    this.l = !!e;
                },
                setNumRedirects(e) {
                    this.r = !!e;
                },
                setPageCorrelator(e) {
                    this.R = e;
                },
                setPlayerType(e) {
                    this.t = !!e;
                },
                setPlayerVersion(e) {
                    this.v = !!e;
                },
                setPpid(e) {
                    this.p = !!e;
                },
                setVpaidMode(e) {
                    this.C = e;
                },
                setSessionId: t,
                setStreamCorrelator: t,
                setVpaidAllowed: t,
                CompanionBackfillMode: {
                    ALWAYS: "always",
                    ON_MASTER_AD: "on_master_ad"
                },
                VpaidMode: {
                    DISABLED: 0,
                    ENABLED: 1,
                    INSECURE: 2
                }
            };
            const a = function() {
                this.listeners = new Map, this._dispatch = function(e) {
                    let t = this.listeners.get(e.type);
                    t = t ? t.values() : [];
                    for (const n of Array.from(t)) try {
                        n(e);
                    } catch (e) {
                        console.trace(e);
                    }
                }, this.addEventListener = function(e, t, n, o) {
                    Array.isArray(e) || (e = [ e ]);
                    for (let n = 0; n < e.length; n += 1) {
                        const i = e[n];
                        this.listeners.has(i) || this.listeners.set(i, new Map), this.listeners.get(i).set(t, t.bind(o || this));
                    }
                }, this.removeEventListener = function(e, t) {
                    Array.isArray(e) || (e = [ e ]);
                    for (let n = 0; n < e.length; n += 1) {
                        const o = e[n];
                        this.listeners.get(o)?.delete(t);
                    }
                };
            }, r = new a;
            r.volume = 1, r.collapse = t, r.configureAdsManager = t, r.destroy = t, r.discardAdBreak = t, 
            r.expand = t, r.focus = t, r.getAdSkippableState = () => !1, r.getCuePoints = () => [ 0 ], 
            r.getCurrentAd = () => m, r.getCurrentAdCuePoints = () => [], r.getRemainingTime = () => 0, 
            r.getVolume = function() {
                return this.volume;
            }, r.init = t, r.isCustomClickTrackingUsed = () => !1, r.isCustomPlaybackUsed = () => !1, 
            r.pause = t, r.requestNextAdBreak = t, r.resize = t, r.resume = t, r.setVolume = function(e) {
                this.volume = e;
            }, r.skip = t, r.start = function() {
                for (const e of [ g.Type.LOADED, g.Type.STARTED, g.Type.CONTENT_RESUME_REQUESTED, g.Type.AD_BUFFERING, g.Type.FIRST_QUARTILE, g.Type.MIDPOINT, g.Type.THIRD_QUARTILE, g.Type.COMPLETE, g.Type.ALL_ADS_COMPLETED ]) try {
                    this._dispatch(new n.AdEvent(e));
                } catch (e) {
                    console.trace(e);
                }
            }, r.stop = t, r.updateAdsRenderingSettings = t;
            const c = Object.create(r), s = function(e, t, n) {
                this.type = e, this.adsRequest = t, this.userRequestContext = n;
            };
            s.prototype = {
                getAdsManager: () => c,
                getUserRequestContext() {
                    return this.userRequestContext ? this.userRequestContext : {};
                }
            }, s.Type = {
                ADS_MANAGER_LOADED: "adsManagerLoaded"
            };
            const d = a;
            d.prototype.settings = new i, d.prototype.contentComplete = t, d.prototype.destroy = t, 
            d.prototype.getSettings = function() {
                return this.settings;
            }, d.prototype.getVersion = () => e, d.prototype.requestAds = function(e, t) {
                requestAnimationFrame((() => {
                    const {ADS_MANAGER_LOADED: o} = s.Type, i = new n.AdsManagerLoadedEvent(o, e, t);
                    this._dispatch(i);
                }));
                const o = new n.AdError("adPlayError", 1205, 1205, "The browser prevented playback initiated without user interaction.", e, t);
                requestAnimationFrame((() => {
                    this._dispatch(new n.AdErrorEvent(o));
                }));
            };
            const l = t, u = function() {};
            u.prototype = {
                setAdWillAutoPlay: t,
                setAdWillPlayMuted: t,
                setContinuousPlayback: t
            };
            const p = function() {};
            p.prototype = {
                getAdPosition: () => 1,
                getIsBumper: () => !1,
                getMaxDuration: () => -1,
                getPodIndex: () => 1,
                getTimeOffset: () => 0,
                getTotalAds: () => 1
            };
            const f = function() {};
            f.prototype.getAdIdRegistry = function() {
                return "";
            }, f.prototype.getAdIsValue = function() {
                return "";
            };
            const h = function() {};
            h.prototype = {
                pi: new p,
                getAdId: () => "",
                getAdPodInfo() {
                    return this.pi;
                },
                getAdSystem: () => "",
                getAdvertiserName: () => "",
                getApiFramework: () => null,
                getCompanionAds: () => [],
                getContentType: () => "",
                getCreativeAdId: () => "",
                getDealId: () => "",
                getDescription: () => "",
                getDuration: () => 8.5,
                getHeight: () => 0,
                getMediaUrl: () => null,
                getMinSuggestedDuration: () => -2,
                getSkipTimeOffset: () => -1,
                getSurveyUrl: () => null,
                getTitle: () => "",
                getTraffickingParametersString: () => "",
                getUiElements: () => [ "" ],
                getUniversalAdIdRegistry: () => "unknown",
                getUniversalAdIds: () => [ new f ],
                getUniversalAdIdValue: () => "unknown",
                getVastMediaBitrate: () => 0,
                getVastMediaHeight: () => 0,
                getVastMediaWidth: () => 0,
                getWidth: () => 0,
                getWrapperAdIds: () => [ "" ],
                getWrapperAdSystems: () => [ "" ],
                getWrapperCreativeIds: () => [ "" ],
                isLinear: () => !0,
                isSkippable: () => !0
            };
            const w = function() {};
            w.prototype = {
                getAdSlotId: () => "",
                getContent: () => "",
                getContentType: () => "",
                getHeight: () => 1,
                getWidth: () => 1
            };
            const y = function(e, t, n, o, i, a) {
                this.errorCode = t, this.message = o, this.type = e, this.adsRequest = i, this.userRequestContext = a, 
                this.getErrorCode = function() {
                    return this.errorCode;
                }, this.getInnerError = function() {
                    return null;
                }, this.getMessage = function() {
                    return this.message;
                }, this.getType = function() {
                    return this.type;
                }, this.getVastErrorCode = function() {
                    return this.vastErrorCode;
                }, this.toString = function() {
                    return `AdError ${this.errorCode}: ${this.message}`;
                };
            };
            y.ErrorCode = {}, y.Type = {};
            const m = (() => {
                try {
                    for (const e of Object.values(window.vidible._getContexts())) if (e.getPlayer()?.div?.innerHTML.includes("www.engadget.com")) return !0;
                } catch (e) {}
                return !1;
            })() ? void 0 : new h, g = function(e) {
                this.type = e;
            };
            g.prototype = {
                getAd: () => m,
                getAdData: () => {}
            }, g.Type = {
                AD_BREAK_READY: "adBreakReady",
                AD_BUFFERING: "adBuffering",
                AD_CAN_PLAY: "adCanPlay",
                AD_METADATA: "adMetadata",
                AD_PROGRESS: "adProgress",
                ALL_ADS_COMPLETED: "allAdsCompleted",
                CLICK: "click",
                COMPLETE: "complete",
                CONTENT_PAUSE_REQUESTED: "contentPauseRequested",
                CONTENT_RESUME_REQUESTED: "contentResumeRequested",
                DURATION_CHANGE: "durationChange",
                EXPANDED_CHANGED: "expandedChanged",
                FIRST_QUARTILE: "firstQuartile",
                IMPRESSION: "impression",
                INTERACTION: "interaction",
                LINEAR_CHANGE: "linearChange",
                LINEAR_CHANGED: "linearChanged",
                LOADED: "loaded",
                LOG: "log",
                MIDPOINT: "midpoint",
                PAUSED: "pause",
                RESUMED: "resume",
                SKIPPABLE_STATE_CHANGED: "skippableStateChanged",
                SKIPPED: "skip",
                STARTED: "start",
                THIRD_QUARTILE: "thirdQuartile",
                USER_CLOSE: "userClose",
                VIDEO_CLICKED: "videoClicked",
                VIDEO_ICON_CLICKED: "videoIconClicked",
                VIEWABLE_IMPRESSION: "viewable_impression",
                VOLUME_CHANGED: "volumeChange",
                VOLUME_MUTED: "mute"
            };
            const b = function(e) {
                this.error = e, this.type = "adError", this.getError = function() {
                    return this.error;
                }, this.getUserRequestContext = function() {
                    return this.error?.userRequestContext ? this.error.userRequestContext : {};
                };
            };
            b.Type = {
                AD_ERROR: "adError"
            };
            const v = function() {};
            v.Type = {
                CUSTOM_CONTENT_LOADED: "deprecated-event"
            };
            const _ = function() {};
            _.CreativeType = {
                ALL: "All",
                FLASH: "Flash",
                IMAGE: "Image"
            }, _.ResourceType = {
                ALL: "All",
                HTML: "Html",
                IFRAME: "IFrame",
                STATIC: "Static"
            }, _.SizeCriteria = {
                IGNORE: "IgnoreSize",
                SELECT_EXACT_MATCH: "SelectExactMatch",
                SELECT_NEAR_MATCH: "SelectNearMatch"
            };
            const k = function() {};
            k.prototype = {
                getCuePoints: () => [],
                getAdIdRegistry: () => "",
                getAdIdValue: () => ""
            };
            const S = t;
            Object.assign(n, {
                AdCuePoints: k,
                AdDisplayContainer: o,
                AdError: y,
                AdErrorEvent: b,
                AdEvent: g,
                AdPodInfo: p,
                AdProgressData: S,
                AdsLoader: d,
                AdsManager: c,
                AdsManagerLoadedEvent: s,
                AdsRenderingSettings: l,
                AdsRequest: u,
                CompanionAd: w,
                CompanionAdSelectionSettings: _,
                CustomContentLoadedEvent: v,
                gptProxyInstance: {},
                ImaSdkSettings: i,
                OmidAccessMode: {
                    DOMAIN: "domain",
                    FULL: "full",
                    LIMITED: "limited"
                },
                OmidVerificationVendor: {
                    1: "OTHER",
                    2: "MOAT",
                    3: "DOUBLEVERIFY",
                    4: "INTEGRAL_AD_SCIENCE",
                    5: "PIXELATE",
                    6: "NIELSEN",
                    7: "COMSCORE",
                    8: "MEETRICS",
                    9: "GOOGLE",
                    OTHER: 1,
                    MOAT: 2,
                    DOUBLEVERIFY: 3,
                    INTEGRAL_AD_SCIENCE: 4,
                    PIXELATE: 5,
                    NIELSEN: 6,
                    COMSCORE: 7,
                    MEETRICS: 8,
                    GOOGLE: 9
                },
                settings: new i,
                UiElements: {
                    AD_ATTRIBUTION: "adAttribution",
                    COUNTDOWN: "countdown"
                },
                UniversalAdIdInfo: f,
                VERSION: e,
                ViewMode: {
                    FULLSCREEN: "fullscreen",
                    NORMAL: "normal"
                }
            }), window.google || (window.google = {}), window.google.ima?.dai && (n.dai = window.google.ima.dai), 
            window.google.ima = n;
        })();
    },
    '(()=>{const t=[];t.push=function(t){"object"==typeof t&&t.events&&Object.values(t.events).forEach((t=>{if("function"==typeof t)try{t()}catch(t){}}))},window.AdBridg={cmd:t}})();': () => {
        (() => {
            const e = [];
            e.push = function(e) {
                "object" == typeof e && e.events && Object.values(e.events).forEach((e => {
                    if ("function" == typeof e) try {
                        e();
                    } catch (e) {}
                }));
            }, window.AdBridg = {
                cmd: e
            };
        })();
    },
    '(()=>{const a=location.href;if(!a.includes("/download?link="))return;const b=new URL(a),c=b.searchParams.get("link");try{location.assign(`${location.protocol}//${c}`)}catch(a){}})();': () => {
        (() => {
            const e = location.href;
            if (!e.includes("/download?link=")) return;
            const t = new URL(e).searchParams.get("link");
            try {
                location.assign(`${location.protocol}//${t}`);
            } catch (e) {}
        })();
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];if("string"!=typeof d||0===d.length)return Reflect.apply(a,b,c);const e=/topaz\\.dai\\.viacomcbs\\.digital\\/ondemand\\/hls\\/.*\\.m3u8/.test(d),f=/dai\\.google\\.com\\/ondemand\\/v.*\\/hls\\/content\\/.*\\/vid\\/.*\\/stream/.test(d);return(e||f)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;if(Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0}),f&&(null!==a&&void 0!==a&&a.ad_breaks&&(a.ad_breaks=[]),null!==a&&void 0!==a&&a.apple_tv&&(a.apple_tv={})),e){const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}}),Reflect.apply(a,b,c)}})})();': () => {
        window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
            apply: async (e, t, n) => {
                const o = n[1];
                if ("string" != typeof o || 0 === o.length) return Reflect.apply(e, t, n);
                const i = /topaz\.dai\.viacomcbs\.digital\/ondemand\/hls\/.*\.m3u8/.test(o), a = /dai\.google\.com\/ondemand\/v.*\/hls\/content\/.*\/vid\/.*\/stream/.test(o);
                return (i || a) && t.addEventListener("readystatechange", (function() {
                    if (4 === t.readyState) {
                        const e = t.response;
                        if (Object.defineProperty(t, "response", {
                            writable: !0
                        }), Object.defineProperty(t, "responseText", {
                            writable: !0
                        }), a && (null != e && e.ad_breaks && (e.ad_breaks = []), null != e && e.apple_tv && (e.apple_tv = {})), 
                        i) {
                            const n = e.replaceAll(/#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, "");
                            t.response = n, t.responseText = n;
                        }
                    }
                })), Reflect.apply(e, t, n);
            }
        });
    },
    "(function(){window.twttr={conversion:{trackPid:function(){}}}})();": () => {
        window.twttr = {
            conversion: {
                trackPid: function() {}
            }
        };
    },
    "(() => { var ReplaceMap = {adBreaks: [], adState: null, currentAdBreak: 'undefined'}; Object.defineProperty = new Proxy(Object.defineProperty, { apply: (target, thisArg, ArgsList) => { var Original = Reflect.apply(target, thisArg, ArgsList); if (ArgsList[1] == 'getAdBreaks' || ArgsList[1] == 'getAdsDisplayStringParams') { return Original[ArgsList[1]] = function() {}; } else if (ArgsList[1] == 'adBreaks' || ArgsList[1] == 'currentAdBreak' || typeof Original['adBreaks'] !== 'undefined') { for (var [key, value] of Object.entries(Original)) { if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] !== 'undefined') { Original[key] = ReplaceMap[key]; } else if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] === 'undefined') { Original[key] = undefined; } } return Original; } else { return Original; }}})})();": () => {
        e = {
            adBreaks: [],
            adState: null,
            currentAdBreak: "undefined"
        }, Object.defineProperty = new Proxy(Object.defineProperty, {
            apply: (t, n, o) => {
                var i = Reflect.apply(t, n, o);
                if ("getAdBreaks" == o[1] || "getAdsDisplayStringParams" == o[1]) return i[o[1]] = function() {};
                if ("adBreaks" == o[1] || "currentAdBreak" == o[1] || void 0 !== i.adBreaks) {
                    for (var [a, r] of Object.entries(i)) void 0 !== e[a] && "undefined" !== e[a] ? i[a] = e[a] : void 0 !== e[a] && "undefined" === e[a] && (i[a] = void 0);
                    return i;
                }
                return i;
            }
        });
        var e;
    },
    '(()=>{const a=window.fetch,b={apply:async(b,c,d)=>{const e=d[0]instanceof Request?d[0].url:d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.includes("uplynk.com/")&&e.includes(".m3u8")){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/#UPLYNK-SEGMENT: \\S*\\,ad\\s[\\s\\S]+?((#UPLYNK-SEGMENT: \\S+\\,segment)|(#EXT-X-ENDLIST))/g,"$1"),new Response(c)}return Reflect.apply(b,c,d)}};try{window.fetch=new Proxy(window.fetch,b)}catch(a){}})();': () => {
        (() => {
            const e = window.fetch, t = {
                apply: async (t, n, o) => {
                    const i = o[0] instanceof Request ? o[0].url : o[0];
                    if ("string" != typeof i || 0 === i.length) return Reflect.apply(t, n, o);
                    if (i.includes("uplynk.com/") && i.includes(".m3u8")) {
                        const t = await e(...o);
                        let n = await t.text();
                        return n = n.replaceAll(/#UPLYNK-SEGMENT: \S*\,ad\s[\s\S]+?((#UPLYNK-SEGMENT: \S+\,segment)|(#EXT-X-ENDLIST))/g, "$1"), 
                        new Response(n);
                    }
                    return Reflect.apply(t, n, o);
                }
            };
            try {
                window.fetch = new Proxy(window.fetch, t);
            } catch (e) {}
        })();
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': () => {
        window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
            apply: async (e, t, n) => {
                const o = n[1];
                return "string" != typeof o || 0 === o.length || o.match(/pubads\.g\.doubleclick.net\/ondemand\/hls\/.*\.m3u8/) && t.addEventListener("readystatechange", (function() {
                    if (4 === t.readyState) {
                        const e = t.response;
                        Object.defineProperty(t, "response", {
                            writable: !0
                        }), Object.defineProperty(t, "responseText", {
                            writable: !0
                        });
                        const n = e.replaceAll(/#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, "");
                        t.response = n, t.responseText = n;
                    }
                })), Reflect.apply(e, t, n);
            }
        });
    },
    '(()=>{const a=window.fetch;window.fetch=new Proxy(window.fetch,{apply:async(b,c,d)=>{const e=d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.match(/pubads\\.g\\.doubleclick\\.net\\/ondemand\\/.*\\/content\\/.*\\/vid\\/.*\\/streams\\/.*\\/manifest\\.mpd|pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/<Period id="(pre|mid|post)-roll-.-ad-[\\s\\S]*?>[\\s\\S]*?<\\/Period>|#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,""),new Response(c)}return Reflect.apply(b,c,d)}})})();': () => {
        (() => {
            const e = window.fetch;
            window.fetch = new Proxy(window.fetch, {
                apply: async (t, n, o) => {
                    const i = o[0];
                    if ("string" != typeof i || 0 === i.length) return Reflect.apply(t, n, o);
                    if (i.match(/pubads\.g\.doubleclick\.net\/ondemand\/.*\/content\/.*\/vid\/.*\/streams\/.*\/manifest\.mpd|pubads\.g\.doubleclick.net\/ondemand\/hls\/.*\.m3u8/)) {
                        const t = await e(...o);
                        let n = await t.text();
                        return n = n.replaceAll(/<Period id="(pre|mid|post)-roll-.-ad-[\s\S]*?>[\s\S]*?<\/Period>|#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, ""), 
                        new Response(n);
                    }
                    return Reflect.apply(t, n, o);
                }
            });
        })();
    },
    "(()=>{window.FAVE=window.FAVE||{};const s={set:(s,e,n,a)=>{if(s?.settings?.ads?.ssai?.prod?.clips?.enabled&&(s.settings.ads.ssai.prod.clips.enabled=!1),s?.player?.instances)for(var i of Object.keys(s.player.instances))s.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled&&(s.player.instances[i].configs.ads.ssai.prod.clips.enabled=!1);return Reflect.set(s,e,n,a)}};window.FAVE=new Proxy(window.FAVE,s)})();": () => {
        (() => {
            window.FAVE = window.FAVE || {};
            const e = {
                set: (e, t, n, o) => {
                    if (e?.settings?.ads?.ssai?.prod?.clips?.enabled && (e.settings.ads.ssai.prod.clips.enabled = !1), 
                    e?.player?.instances) for (var i of Object.keys(e.player.instances)) e.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled && (e.player.instances[i].configs.ads.ssai.prod.clips.enabled = !1);
                    return Reflect.set(e, t, n, o);
                }
            };
            window.FAVE = new Proxy(window.FAVE, e);
        })();
    },
    "(()=>{window.PostRelease={Start(){}}})();": () => {
        window.PostRelease = {
            Start() {}
        };
    },
    '(()=>{window.com_adswizz_synchro_decorateUrl=function(a){if("string"===typeof a&&a.startsWith("http"))return a}})();': () => {
        window.com_adswizz_synchro_decorateUrl = function(e) {
            if ("string" == typeof e && e.startsWith("http")) return e;
        };
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/manifest\\..*\\.theplatform\\.com\\/.*\\/.*\\.m3u8\\?.*|manifest\\..*\\.theplatform\\.com\\/.*\\/*\\.meta.*/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:.*\\n.*tvessaiprod\\.nbcuni\\.com\\/video\\/[\\s\\S]*?#EXT-X-DISCONTINUITY|#EXT-X-VMAP-AD-BREAK[\\s\\S]*?#EXT-X-ENDLIST/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': () => {
        window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
            apply: async (e, t, n) => {
                const o = n[1];
                return "string" != typeof o || 0 === o.length || o.match(/manifest\..*\.theplatform\.com\/.*\/.*\.m3u8\?.*|manifest\..*\.theplatform\.com\/.*\/*\.meta.*/) && t.addEventListener("readystatechange", (function() {
                    if (4 === t.readyState) {
                        const e = t.response;
                        Object.defineProperty(t, "response", {
                            writable: !0
                        }), Object.defineProperty(t, "responseText", {
                            writable: !0
                        });
                        const n = e.replaceAll(/#EXTINF:.*\n.*tvessaiprod\.nbcuni\.com\/video\/[\s\S]*?#EXT-X-DISCONTINUITY|#EXT-X-VMAP-AD-BREAK[\s\S]*?#EXT-X-ENDLIST/g, "");
                        t.response = n, t.responseText = n;
                    }
                })), Reflect.apply(e, t, n);
            }
        });
    },
    '(()=>{let e,t=!1;const n=function(){},o=function(t,n){if("function"==typeof n)try{window.KalturaPlayer?n([]):e=n}catch(e){console.error(e)}};let r;Object.defineProperty(window,"PWT",{value:{requestBids:o,generateConfForGPT:o,addKeyValuePairsToGPTSlots:n,generateDFPURL:n}}),Object.defineProperty(window,"KalturaPlayer",{get:function(){return r},set:function(n){r=n,t||(t=!0,e([]))}})})();': () => {
        (() => {
            let e, t = !1;
            const n = function() {}, o = function(t, n) {
                if ("function" == typeof n) try {
                    window.KalturaPlayer ? n([]) : e = n;
                } catch (e) {
                    console.error(e);
                }
            };
            let i;
            Object.defineProperty(window, "PWT", {
                value: {
                    requestBids: o,
                    generateConfForGPT: o,
                    addKeyValuePairsToGPTSlots: n,
                    generateDFPURL: n
                }
            }), Object.defineProperty(window, "KalturaPlayer", {
                get: function() {
                    return i;
                },
                set: function(n) {
                    i = n, t || (t = !0, e([]));
                }
            });
        })();
    },
    '(()=>{const a=function(){},b=function(c,a){if("function"==typeof a)try{a([])}catch(a){console.error(a)}};Object.defineProperty(window,"PWT",{value:{requestBids:b,generateConfForGPT:b,addKeyValuePairsToGPTSlots:a,generateDFPURL:a}})})();': () => {
        (() => {
            const e = function() {}, t = function(e, t) {
                if ("function" == typeof t) try {
                    t([]);
                } catch (t) {
                    console.error(t);
                }
            };
            Object.defineProperty(window, "PWT", {
                value: {
                    requestBids: t,
                    generateConfForGPT: t,
                    addKeyValuePairsToGPTSlots: e,
                    generateDFPURL: e
                }
            });
        })();
    },
    "(function(){window.setTimeout=new Proxy(window.setTimeout,{apply:(a,b,c)=>c&&c[0]&&/if\\(!/.test(c[0].toString())&&c[1]&&1e4===c[1]?(c[1]*=.01,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)});window.setInterval=new Proxy(window.setInterval,{apply:(a,b,c)=>c&&c[0]&&/initWait/.test(c[0].toString())&&c[1]&&1e3===c[1]?(c[1]*=.01,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)})})();": () => {
        !function() {
            window.setTimeout = new Proxy(window.setTimeout, {
                apply: (e, t, n) => n && n[0] && /if\(!/.test(n[0].toString()) && n[1] && 1e4 === n[1] ? (n[1] *= .01, 
                Reflect.apply(e, t, n)) : Reflect.apply(e, t, n)
            });
            window.setInterval = new Proxy(window.setInterval, {
                apply: (e, t, n) => n && n[0] && /initWait/.test(n[0].toString()) && n[1] && 1e3 === n[1] ? (n[1] *= .01, 
                Reflect.apply(e, t, n)) : Reflect.apply(e, t, n)
            });
        }();
    },
    "(()=>{window.turner_getTransactionId=turner_getGuid=function(){},window.AdFuelUtils={getUMTOCookies(){}}})();": () => {
        window.turner_getTransactionId = turner_getGuid = function() {}, window.AdFuelUtils = {
            getUMTOCookies() {}
        };
    },
    '(function(){window.adsbygoogle={loaded:!0,push:function(a){if(null!==a&&a instanceof Object&&"Object"===a.constructor.name)for(let b in a)if("function"==typeof a[b])try{a[b].call()}catch(a){console.error(a)}}}})();': () => {
        window.adsbygoogle = {
            loaded: !0,
            push: function(e) {
                if (null !== e && e instanceof Object && "Object" === e.constructor.name) for (let t in e) if ("function" == typeof e[t]) try {
                    e[t].call();
                } catch (e) {
                    console.error(e);
                }
            }
        };
    },
    "(function(){window.AdFuel={queueRegistry(){},destroySlots(){}}})();": () => {
        window.AdFuel = {
            queueRegistry() {},
            destroySlots() {}
        };
    },
    "(function(){var a={setConfig:function(){},aliasBidder:function(){},removeAdUnit:function(){},que:[push=function(){}]};window.pbjs=a})();": () => {
        !function() {
            var e = {
                setConfig: function() {},
                aliasBidder: function() {},
                removeAdUnit: function() {},
                que: [ push = function() {} ]
            };
            window.pbjs = e;
        }();
    },
    "window.addEventListener('DOMContentLoaded', function() { document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, \"\"); })": () => {
        window.addEventListener("DOMContentLoaded", (function() {
            document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, "");
        }));
    },
    "!function(){window.rTimer=function(){};window.jitaJS={rtk:{refreshAdUnits:function(){}}};}();": () => {
        !function() {
            window.rTimer = function() {};
            window.jitaJS = {
                rtk: {
                    refreshAdUnits: function() {}
                }
            };
        }();
    },
    '(()=>{const e=new MutationObserver(((e,t)=>{for(let t of e)if(t.target?.matches?.(".loadout-application-main")){t.target.querySelectorAll("div").forEach((e=>{if(e.shadowRoot&&e.shadowRoot.querySelector?.(\'.header > div[data-i18n="#advertisement"]\'))try{e.remove()}catch(e){console.error(e)}}))}})),t={apply:(t,o,r)=>{try{r[0].mode="open"}catch(e){console.error(e)}const a=Reflect.apply(t,o,r);return e.observe(a,{subtree:!0,childList:!0}),a}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,t)})();': () => {
        (() => {
            const e = new MutationObserver(((e, t) => {
                for (let t of e) t.target?.matches?.(".loadout-application-main") && t.target.querySelectorAll("div").forEach((e => {
                    if (e.shadowRoot && e.shadowRoot.querySelector?.('.header > div[data-i18n="#advertisement"]')) try {
                        e.remove();
                    } catch (e) {
                        console.error(e);
                    }
                }));
            })), t = {
                apply: (t, n, o) => {
                    try {
                        o[0].mode = "open";
                    } catch (e) {
                        console.error(e);
                    }
                    const i = Reflect.apply(t, n, o);
                    return e.observe(i, {
                        subtree: !0,
                        childList: !0
                    }), i;
                }
            };
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, t);
        })();
    },
    'document.cookie="vpn=1; path=/;";': () => {
        document.cookie = "vpn=1; path=/;";
    },
    "AG_defineProperty('exoDocumentProtocol', { value: document.location.protocol });": () => {
        AG_defineProperty("exoDocumentProtocol", {
            value: document.location.protocol
        });
    },
    "(()=>{document.addEventListener(\"DOMContentLoaded\",(()=>{ if(typeof jQuery) { jQuery('#SearchButtom').unbind('click'); } }));})();": () => {
        document.addEventListener("DOMContentLoaded", (() => {
            jQuery("#SearchButtom").unbind("click");
        }));
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ if(typeof videofunc) { videofunc(); } }));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            videofunc();
        }));
    },
    'document.cookie="p3006=1; path=/;";': () => {
        document.cookie = "p3006=1; path=/;";
    },
    'document.cookie="rpuShownDesktop=1; path=/;";': () => {
        document.cookie = "rpuShownDesktop=1; path=/;";
    },
    '(function(){var a;Object.defineProperty(window,"initLbjs",{get:function(){return a},set:function(c){a=function(a,b){b.AdPop=!1;return c(a,b)}}})})();': () => {
        !function() {
            var e;
            Object.defineProperty(window, "initLbjs", {
                get: function() {
                    return e;
                },
                set: function(t) {
                    e = function(e, n) {
                        n.AdPop = !1;
                        return t(e, n);
                    };
                }
            });
        }();
    },
    '(function(){var d=(new URL(window.location.href)).searchParams.get("cr");try{var a=atob(d)}catch(b){}try{new URL(a);var c=!0}catch(b){c=!1}if(c)try{window.location=a}catch(b){}})();': () => {
        !function() {
            var e = new URL(window.location.href).searchParams.get("cr");
            try {
                var t = atob(e);
            } catch (e) {}
            try {
                new URL(t);
                var n = !0;
            } catch (e) {
                n = !1;
            }
            if (n) try {
                window.location = t;
            } catch (e) {}
        }();
    },
    '(function(){if(-1!=window.location.href.indexOf("/intro-mm"))for(var c=document.cookie.split(";"),b=0;b<c.length;b++){var a=c[b];a=a.split("=");"redirect_url_to_intro"==a[0]&&window.location.replace(decodeURIComponent(a[1]))}})();': () => {
        !function() {
            if (-1 != window.location.href.indexOf("/intro-mm")) for (var e = document.cookie.split(";"), t = 0; t < e.length; t++) {
                var n = e[t];
                "redirect_url_to_intro" == (n = n.split("="))[0] && window.location.replace(decodeURIComponent(n[1]));
            }
        }();
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf(':!!')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/;if\\(\\!/.test(a.toString()))return b(a,c)};})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "mousedown" != t && -1 == n.toString().indexOf(":!!") && e(t, n, o, i);
            }.bind(document);
            var t = window.setTimeout;
            window.setTimeout = function(e, n) {
                if (!/;if\(\!/.test(e.toString())) return t(e, n);
            };
        }();
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\..4P\\(|=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "mousedown" != t && -1 == n.toString().indexOf("Z4P") && e(t, n, o, i);
            }.bind(document);
            var t = window.setTimeout;
            window.setTimeout = function(e, n) {
                if (!/\..4P\(|=setTimeout\(/.test(e.toString())) return t(e, n);
            };
        }();
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('bi()')&&c(a,b,d,e)}.bind(document);})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "click" != t && -1 == n.toString().indexOf("bi()") && e(t, n, o, i);
            }.bind(document);
        }();
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Z4P/.test(a.toString()))return b(a,c)};})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "mousedown" != t && -1 == n.toString().indexOf("Z4P") && e(t, n, o, i);
            }.bind(document);
            var t = window.setTimeout;
            window.setTimeout = function(e, n) {
                if (!/Z4P/.test(e.toString())) return t(e, n);
            };
        }();
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('checkTarget')&&c(a,b,d,e)}.bind(document);})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "click" != t && -1 == n.toString().indexOf("checkTarget") && e(t, n, o, i);
            }.bind(document);
        }();
    },
    '(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){"mouseup"!=a&&-1==b.toString().indexOf(`var U="click";var R=\'_blank\';var v="href";`)&&c(a,b,d,e)}.bind(document);})();': () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "mouseup" != t && -1 == n.toString().indexOf('var U="click";var R=\'_blank\';var v="href";') && e(t, n, o, i);
            }.bind(document);
        }();
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('span[data-nosnippet] > .q-box');e.forEach(function(e){var i=e.innerText;if(i){if(i!==void 0&&(!0===i.includes('Sponsored')||!0===i.includes('Ad by')||!0===i.includes('Promoted by'))){e.style=\"display:none!important;\"}}})} })();": () => {
        new MutationObserver((function() {
            document.querySelectorAll("span[data-nosnippet] > .q-box").forEach((function(e) {
                var t = e.innerText;
                t && (void 0 === t || !0 !== t.includes("Sponsored") && !0 !== t.includes("Ad by") && !0 !== t.includes("Promoted by") || (e.style = "display:none!important;"));
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('.paged_list_wrapper > .pagedlist_item');e.forEach(function(e){var i=e.innerHTML;if(i){if(i!==void 0&&(!0===i.includes('Hide This Ad<\\/span>'))){e.style=\"display:none!important;\"}}})} })();": () => {
        new MutationObserver((function() {
            document.querySelectorAll(".paged_list_wrapper > .pagedlist_item").forEach((function(e) {
                var t = e.innerHTML;
                t && void 0 !== t && !0 === t.includes("Hide This Ad</span>") && (e.style = "display:none!important;");
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    '!function(){new MutationObserver((function(){document.querySelectorAll("article > div[class] > div[class]").forEach((function(e){Object.keys(e).forEach((function(c){if(c.includes("__reactEvents")||c.includes("__reactProps")){c=e[c];try{c.children?.props?.adFragmentKey?.items&&e.parentNode.remove()}catch(c){}}}))}))})).observe(document,{childList:!0,subtree:!0});}();': () => {
        new MutationObserver((function() {
            document.querySelectorAll("article > div[class] > div[class]").forEach((function(e) {
                Object.keys(e).forEach((function(t) {
                    if (t.includes("__reactEvents") || t.includes("__reactProps")) {
                        t = e[t];
                        try {
                            t.children?.props?.adFragmentKey?.items && e.parentNode.remove();
                        } catch (t) {}
                    }
                }));
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    '!function(){var e=0,r=[];new MutationObserver((function(){document.querySelectorAll("div[role=\'list\'] > div[role=\'listitem\']:not([style*=\'display: none\'])").forEach((function(i){Object.keys(i).forEach((function(s){if(s.includes("__reactFiber")||s.includes("__reactProps")){s=i[s];try{if(s.memoizedProps?.children?.props?.children?.props?.pin?.ad_destination_url||s.memoizedProps?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url||s.memoizedProps?.children?.props?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url){e++,i.style="display: none !important;";var n=i.querySelector(\'a[href] span[class*=" "]:last-child, a[href] div[class*=" "][style*="margin"]:last-child > div[class*=" "][style*="margin"] + div[class*=" "]:last-child\');n&&(r.push(["Ad blocked based on property ["+e+"] -> "+n.innerText]),console.table(r))}}catch(s){}}}))}))})).observe(document,{childList:!0,subtree:!0})}();': () => {
        e = 0, t = [], new MutationObserver((function() {
            document.querySelectorAll("div[role='list'] > div[role='listitem']:not([style*='display: none'])").forEach((function(n) {
                Object.keys(n).forEach((function(o) {
                    if (o.includes("__reactFiber") || o.includes("__reactProps")) {
                        o = n[o];
                        try {
                            if (o.memoizedProps?.children?.props?.children?.props?.pin?.ad_destination_url || o.memoizedProps?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url || o.memoizedProps?.children?.props?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url) {
                                e++, n.style = "display: none !important;";
                                var i = n.querySelector('a[href] span[class*=" "]:last-child, a[href] div[class*=" "][style*="margin"]:last-child > div[class*=" "][style*="margin"] + div[class*=" "]:last-child');
                                i && (t.push([ "Ad blocked based on property [" + e + "] -> " + i.innerText ]), 
                                console.table(t));
                            }
                        } catch (o) {}
                    }
                }));
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
        var e, t;
    },
    '!function(){var e=new MutationObserver(function(){var m=document.querySelectorAll("div[id^=\'mount_\']");{var e;e=0<m.length?document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\'):document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\')}e.forEach(function(e){function n(e,n){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"),socheck=0;socheck<h.length;socheck++)h[socheck].innerText.contains(n)&&(p=["1"],d=["1"],u=["1"],i=r=l=1,socheck=h.length)}function t(e,n,t,c,a){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] div[role="button"][tabindex]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] > span a > [class] [class]"),"0"==h.length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')),socheck=0;socheck<h.length;socheck++){spancheck=0,1<h.length?(spancheck=h[socheck].querySelectorAll("span")[0],0==spancheck&&(spancheck=h[socheck].querySelectorAll("b")[0])):(spancheck=h[0].querySelectorAll("span")[socheck],0==spancheck&&(spancheck=h[0].querySelectorAll("b")[socheck]));var o=h[0];if(0!=spancheck&&spancheck){if(2==spancheck.children.length&&0<m.length)for(spancheck=spancheck.querySelectorAll("span:not([style])"),spcheck=0;spcheck<spancheck.length;spcheck++)spancheck[spcheck].innerText.contains(n)?s=1:!spancheck[spcheck].innerText.contains(t)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(c)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(a)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1);0==m.length&&((!(spancheck.innerText.contains(n)&&0==spancheck.offsetTop||h[0].innerText.contains(n)&&0==h[0].offsetTop)||spancheck.innerText.contains(t)&&!h[0].innerText.contains(t)||spancheck.innerText.contains(c)&&!h[0].innerText.contains(c)||spancheck.innerText.contains(a)&&!h[0].innerText.contains(a))&&(!o.innerText.contains(n)||0!=o.offsetTop||o.innerText.contains(t)||o.innerText.contains(c)||o.innerText.contains(a))?!spancheck.innerText.contains(t)||0!=spancheck.offsetTop||spancheck.innerText.contains(n)||spancheck.innerText.contains(c)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(c)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(n)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(a)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(c)||spancheck.innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1):s=1)}}}function c(e,n,t,c,a){u=0<m.length?(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+n+"]"),p=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+t+"]"),d=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+c+"]"),e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+a+"]")):(h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+n+"]"),p=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+t+"]"),d=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+c+"]"),e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+a+"]"))}var s=0,l=0,r=0,i=0,h=0,p=0,d=0,u=0,a=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),o=document.querySelector("[lang]"),k=document.querySelectorAll("link[rel=\'preload\'][href*=\'/l/\']");o=o?document.querySelector("[lang]").lang:"en";var y,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),f=e.querySelectorAll(\'a[href*="ads/about"]\'),S=e.querySelectorAll(\'a[href*="https://www.facebook.com/business/help"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")&&(0<g.length||0<f.length||0<S.length?(T+=1,0<m.length?(""==(y=e.querySelectorAll("a[href]")[0].innerText)&&(y=e.querySelectorAll("a[href]")[1].innerText),""==y&&(y=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0].getAttribute("aria-label"))):y=e.querySelectorAll("a[href]")[2].innerText,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("F length: "+g.length),console.log("H length: "+f.length),console.log("I length (Paid partnership): "+S.length),console.log("--------"),e.style="display:none!important;"):0<a.length?(T+=1,y="Facebook",console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"):"af"==o?n(e,"Geborg"):"de"==o||"nl"==o?c(e,"G","e","s","n"):"am"==o?n(e,"የተከፈለበት ማስታወቂያ"):"ar"==o?n(e,"مُموَّل"):"as"==o?n(e,"পৃষ্ঠপোষকতা কৰা"):"az"==o?n(e,"Sponsor dəstəkli"):"co"==o?n(e,"Spunsurizatu"):"bs"==o||"sl"==o||"cs"==o?c(e,"S","p","z","n"):"da"==o||"en"==o||"et"==o||"fy"==o||"it"==o||"ku"==o||"nb"==o||"nn"==o||"pl"==o||"sq"==o||"sv"==o||"zz"==o?0<m.length?k[0].href.contains("en_UD")?n(e,"pəɹosuodS"):k[0].href.contains("ja_KS")?n(e,"広告"):k[0].href.contains("tz_MA")?n(e,"ⵉⴷⵍ"):k[0].href.contains("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):k[0].href.contains("cb_IQ")?n(e,"پاڵپشتیکراو"):k[0].href.contains("ar_AR")?n(e,"مُموَّل"):k[0].href.contains("sz_PL")?n(e,"Szpōnzorowane"):k[0].href.contains("eo_EO")?n(e,"Reklamo"):k[0].href.contains("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n"),"0"==h.length&&n(e,"Sponsored")):document.querySelector("body").className.includes("Locale_en_UD")?n(e,"pəɹosuodS"):document.querySelector("body").className.includes("ja_KS")?n(e,"広告"):document.querySelector("body").className.includes("tz_MA")?n(e,"ⵉⴷⵍ"):document.querySelector("body").className.includes("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):document.querySelector("body").className.includes("cb_IQ")?n(e,"پاڵپشتیکراو"):document.querySelector("body").className.includes("ar_AR")?n(e,"مُموَّل"):document.querySelector("body").className.includes("sz_PL")?n(e,"Szpōnzorowane"):document.querySelector("body").className.includes("eo_EO")?n(e,"Reklamo"):document.querySelector("body").className.includes("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n")):"be"==o?n(e,"Рэклама"):"bg"==o?n(e,"Спонсорирано"):"mk"==o?n(e,"Спонзорирано"):"br"==o?n(e,"Paeroniet"):"ca"==o?n(e,"Patrocinat"):"gl"==o||"pt"==o?(n(e,"Patrocinado"),"0"==l&&c(e,"P","a","c","o")):"bn"==o?n(e,"সৌজন্যে"):"cb"==o?n(e,"پاڵپشتیکراو"):"cx"==o?c(e,"G","i","s","n"):"cy"==o?n(e,"Noddwyd"):"el"==o?n(e,"Χορηγούμενη"):"eo"==o?n(e,"Reklamo"):"es"==o?c(e,"P","u","c","d"):"eu"==o?n(e,"Babestua"):"fa"==o?n(e,"دارای پشتیبانی مالی"):"ff"==o?n(e,"Yoɓanaama"):"fi"==o?n(e,"Sponsoroitu"):"fo"==o?n(e,"Stuðlað"):"fr"==o?0<m.length?k[0].href.contains("fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):document.querySelector("body").className.includes("Locale_fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):"ga"==o?n(e,"Urraithe"):"gn"==o?n(e,"Oñepatrosinapyre"):"gu"==o?n(e,"પ્રાયોજિત"):"ha"==o?n(e,"Daukar Nauyi"):"he"==o?n(e,"ממומן"):"hr"==o?n(e,"Plaćeni oglas"):"ht"==o?n(e,"Peye"):"ne"==o||"mr"==o||"hi"==o?n(e,"प्रायोजित"):"hu"==o?c(e,"H","i","r","d"):"hy"==o?n(e,"Գովազդային"):"id"==o?c(e,"B","e","p","n"):"is"==o?n(e,"Kostað"):"ja"==o?n(e,"広告"):"ms"==o?n(e,"Ditaja"):"jv"==o?n(e,"Disponsori"):"ka"==o?n(e,"რეკლამა"):"kk"==o?n(e,"Демеушілік көрсеткен"):"km"==o?n(e,"បានឧបត្ថម្ភ"):"kn"==o?n(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==o?n(e,"Sponsored"):"ky"==o?n(e,"Демөөрчүлөнгөн"):"lo"==o?n(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==o?n(e,"Remiama"):"lv"==o?n(e,"Apmaksāta reklāma"):"mg"==o?n(e,"Misy Mpiantoka"):"ml"==o?n(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==o?n(e,"Ивээн тэтгэсэн"):"mt"==o?n(e,"Sponsorjat"):"my"==o?(n(e,"ပံ့ပိုးထားသည်"),"0"==l&&n(e,"အခပေးကြော်ငြာ")):"or"==o?n(e,"ପ୍ରଯୋଜିତ"):"pa"==o?n(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==o?n(e,"تمويل شوي"):"ro"==o?n(e,"Sponsorizat"):"ru"==o||"uk"==o?n(e,"Реклама"):"rw"==o?n(e,"Icyamamaza ndasukirwaho"):"sc"==o?n(e,"Patronadu de"):"si"==o?n(e,"අනුග්රාහක"):"sk"==o?n(e,"Sponzorované"):"sn"==o?n(e,"Zvabhadharirwa"):"so"==o?n(e,"La maalgeliyey"):"sr"==o?n(e,"Спонзорисано"):"sw"==o?n(e,"Imedhaminiwa"):"sy"==o?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==o?n(e,"Szpōnzorowane"):"ta"==o?n(e,"விளம்பரம்"):"te"==o?n(e,"ప్రాయోజితం చేయబడింది"):"tg"==o?n(e,"Бо сарпарастӣ"):"th"==o?n(e,"ได้รับการสนับสนุน"):"tl"==o?n(e,"May Sponsor"):"tr"==o?n(e,"Sponsorlu"):"tt"==o?n(e,"Хәйрияче"):"tz"==o?n(e,"ⵉⴷⵍ"):"ur"==o?n(e,"سپانسرڈ"):"uz"==o?n(e,"Reklama"):"vi"==o?n(e,"Được tài trợ"):"zh-Hans"==o?n(e,"赞助内容"):"zh-Hant"==o&&n(e,"贊助"),0<h.length&&0<p.length&&0<d.length&&0<u.length)){for(cont=0;cont<h.length;cont++)0<h[cont].offsetHeight&&(cont=h.length,s=1);for(cont1=0;cont1<p.length;cont1++)0<p[cont1].offsetHeight&&(cont1=p.length,l=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,r=1);for(cont3=0;cont3<u.length;cont3++)0<u[cont3].offsetHeight&&(cont3=u.length,i=1);1==s&&1==l&&1==r&&1==i&&(0<m.length&&""!=(y=e.querySelectorAll("a[href]")[1].innerText)||(y=e.querySelectorAll("a[href]")[2].innerText),T+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("--------"),e.style="display:none!important;")}})}),T=0;e.observe(document,{childList:!0,subtree:!0})}();': () => {
        !function() {
            var e = new MutationObserver((function() {
                var e = document.querySelectorAll("div[id^='mount_']");
                (0 < e.length ? document.querySelectorAll('div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])') : document.querySelectorAll('[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]')).forEach((function(n) {
                    function o(t, n) {
                        for (0 < e.length ? "0" == (l = t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span > span > span[data-content]')).length && (l = t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span[aria-label]')) : l = t.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"), 
                        socheck = 0; socheck < l.length; socheck++) l[socheck].innerText.contains(n) && (u = [ "1" ], 
                        p = [ "1" ], f = [ "1" ], d = s = c = 1, socheck = l.length);
                    }
                    function i(t, n, o, i, a) {
                        for (0 < e.length ? "0" == (l = t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span > span > span[data-content]')).length && (l = t.querySelectorAll('div[role="article"] span[dir="auto"] div[role="button"][tabindex]')) : l = t.querySelectorAll(".userContentWrapper h5 + div[data-testid] > span a > [class] [class]"), 
                        "0" == l.length && (l = t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span[aria-label]')), 
                        socheck = 0; socheck < l.length; socheck++) {
                            spancheck = 0, 1 < l.length ? (spancheck = l[socheck].querySelectorAll("span")[0], 
                            0 == spancheck && (spancheck = l[socheck].querySelectorAll("b")[0])) : (spancheck = l[0].querySelectorAll("span")[socheck], 
                            0 == spancheck && (spancheck = l[0].querySelectorAll("b")[socheck]));
                            var h = l[0];
                            if (0 != spancheck && spancheck) {
                                if (2 == spancheck.children.length && 0 < e.length) for (spancheck = spancheck.querySelectorAll("span:not([style])"), 
                                spcheck = 0; spcheck < spancheck.length; spcheck++) spancheck[spcheck].innerText.contains(n) ? r = 1 : !spancheck[spcheck].innerText.contains(o) || 0 != spancheck[spcheck].offsetTop || spancheck[spcheck].innerText.contains(n) || spancheck[spcheck].innerText.contains(i) || spancheck[spcheck].innerText.contains(a) ? !spancheck[spcheck].innerText.contains(i) || 0 != spancheck[spcheck].offsetTop || spancheck[spcheck].innerText.contains(o) || spancheck[spcheck].innerText.contains(n) || spancheck[spcheck].innerText.contains(a) ? !spancheck[spcheck].innerText.contains(a) || 0 != spancheck[spcheck].offsetTop || spancheck[spcheck].innerText.contains(o) || spancheck[spcheck].innerText.contains(i) || spancheck[spcheck].innerText.contains(n) || (f = [ "1" ], 
                                d = 1) : (p = [ "1" ], s = 1) : (u = [ "1" ], c = 1);
                                0 == e.length && ((!(spancheck.innerText.contains(n) && 0 == spancheck.offsetTop || l[0].innerText.contains(n) && 0 == l[0].offsetTop) || spancheck.innerText.contains(o) && !l[0].innerText.contains(o) || spancheck.innerText.contains(i) && !l[0].innerText.contains(i) || spancheck.innerText.contains(a) && !l[0].innerText.contains(a)) && (!h.innerText.contains(n) || 0 != h.offsetTop || h.innerText.contains(o) || h.innerText.contains(i) || h.innerText.contains(a)) ? !spancheck.innerText.contains(o) || 0 != spancheck.offsetTop || spancheck.innerText.contains(n) || spancheck.innerText.contains(i) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(i) || 0 != spancheck.offsetTop || spancheck.innerText.contains(o) || spancheck.innerText.contains(n) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(a) || 0 != spancheck.offsetTop || spancheck.innerText.contains(o) || spancheck.innerText.contains(i) || spancheck.innerText.contains(n) || (f = [ "1" ], 
                                d = 1) : (p = [ "1" ], s = 1) : (u = [ "1" ], c = 1) : r = 1);
                            }
                        }
                    }
                    function a(t, n, o, i, a) {
                        f = 0 < e.length ? (l = t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + n + "]"), 
                        u = t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + o + "]"), 
                        p = t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + i + "]"), 
                        t.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + a + "]")) : (l = t.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + n + "]"), 
                        u = t.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + o + "]"), 
                        p = t.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + i + "]"), 
                        t.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + a + "]"));
                    }
                    var r = 0, c = 0, s = 0, d = 0, l = 0, u = 0, p = 0, f = 0, h = n.querySelectorAll("div[style='width: 100%'] > a[href*='oculus.com/quest'] > div"), w = document.querySelector("[lang]"), y = document.querySelectorAll("link[rel='preload'][href*='/l/']");
                    w = w ? document.querySelector("[lang]").lang : "en";
                    var m, g = n.querySelectorAll('a[ajaxify*="ad_id"] > span'), b = n.querySelectorAll('a[href*="ads/about"]'), v = n.querySelectorAll('a[href*="https://www.facebook.com/business/help"]');
                    if ("display: none !important;" != n.getAttribute("style") && !n.classList.contains("hidden_elem") && (0 < g.length || 0 < b.length || 0 < v.length ? (t += 1, 
                    0 < e.length ? ("" == (m = n.querySelectorAll("a[href]")[0].innerText) && (m = n.querySelectorAll("a[href]")[1].innerText), 
                    "" == m && (m = n.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0].getAttribute("aria-label"))) : m = n.querySelectorAll("a[href]")[2].innerText, 
                    console.log("--------"), console.log("Ad hidden from: " + m), console.log("Total ads hidden: " + t), 
                    console.log("F length: " + g.length), console.log("H length: " + b.length), console.log("I length (Paid partnership): " + v.length), 
                    console.log("--------"), n.style = "display:none!important;") : 0 < h.length ? (t += 1, 
                    m = "Facebook", console.log("--------"), console.log("Ad hidden from: " + m), console.log("Total ads hidden: " + t), 
                    console.log("Non-declared ad"), console.log("--------"), n.style = "display:none!important;") : "af" == w ? o(n, "Geborg") : "de" == w || "nl" == w ? a(n, "G", "e", "s", "n") : "am" == w ? o(n, "የተከፈለበት ማስታወቂያ") : "ar" == w ? o(n, "مُموَّل") : "as" == w ? o(n, "পৃষ্ঠপোষকতা কৰা") : "az" == w ? o(n, "Sponsor dəstəkli") : "co" == w ? o(n, "Spunsurizatu") : "bs" == w || "sl" == w || "cs" == w ? a(n, "S", "p", "z", "n") : "da" == w || "en" == w || "et" == w || "fy" == w || "it" == w || "ku" == w || "nb" == w || "nn" == w || "pl" == w || "sq" == w || "sv" == w || "zz" == w ? 0 < e.length ? y[0].href.contains("en_UD") ? o(n, "pəɹosuodS") : y[0].href.contains("ja_KS") ? o(n, "広告") : y[0].href.contains("tz_MA") ? o(n, "ⵉⴷⵍ") : y[0].href.contains("sy_SY") ? o(n, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : y[0].href.contains("cb_IQ") ? o(n, "پاڵپشتیکراو") : y[0].href.contains("ar_AR") ? o(n, "مُموَّل") : y[0].href.contains("sz_PL") ? o(n, "Szpōnzorowane") : y[0].href.contains("eo_EO") ? o(n, "Reklamo") : y[0].href.contains("es_LA") ? a(n, "P", "u", "c", "d") : (a(n, "S", "p", "s", "n"), 
                    "0" == l.length && i(n, "S", "p", "s", "n"), "0" == l.length && o(n, "Sponsored")) : document.querySelector("body").className.includes("Locale_en_UD") ? o(n, "pəɹosuodS") : document.querySelector("body").className.includes("ja_KS") ? o(n, "広告") : document.querySelector("body").className.includes("tz_MA") ? o(n, "ⵉⴷⵍ") : document.querySelector("body").className.includes("sy_SY") ? o(n, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : document.querySelector("body").className.includes("cb_IQ") ? o(n, "پاڵپشتیکراو") : document.querySelector("body").className.includes("ar_AR") ? o(n, "مُموَّل") : document.querySelector("body").className.includes("sz_PL") ? o(n, "Szpōnzorowane") : document.querySelector("body").className.includes("eo_EO") ? o(n, "Reklamo") : document.querySelector("body").className.includes("es_LA") ? a(n, "P", "u", "c", "d") : (a(n, "S", "p", "s", "n"), 
                    "0" == l.length && i(n, "S", "p", "s", "n")) : "be" == w ? o(n, "Рэклама") : "bg" == w ? o(n, "Спонсорирано") : "mk" == w ? o(n, "Спонзорирано") : "br" == w ? o(n, "Paeroniet") : "ca" == w ? o(n, "Patrocinat") : "gl" == w || "pt" == w ? (o(n, "Patrocinado"), 
                    "0" == c && a(n, "P", "a", "c", "o")) : "bn" == w ? o(n, "সৌজন্যে") : "cb" == w ? o(n, "پاڵپشتیکراو") : "cx" == w ? a(n, "G", "i", "s", "n") : "cy" == w ? o(n, "Noddwyd") : "el" == w ? o(n, "Χορηγούμενη") : "eo" == w ? o(n, "Reklamo") : "es" == w ? a(n, "P", "u", "c", "d") : "eu" == w ? o(n, "Babestua") : "fa" == w ? o(n, "دارای پشتیبانی مالی") : "ff" == w ? o(n, "Yoɓanaama") : "fi" == w ? o(n, "Sponsoroitu") : "fo" == w ? o(n, "Stuðlað") : "fr" == w ? 0 < e.length ? y[0].href.contains("fr_FR") ? a(n, "S", "p", "s", "n") : a(n, "C", "o", "m", "n") : document.querySelector("body").className.includes("Locale_fr_FR") ? a(n, "S", "p", "s", "n") : a(n, "C", "o", "m", "n") : "ga" == w ? o(n, "Urraithe") : "gn" == w ? o(n, "Oñepatrosinapyre") : "gu" == w ? o(n, "પ્રાયોજિત") : "ha" == w ? o(n, "Daukar Nauyi") : "he" == w ? o(n, "ממומן") : "hr" == w ? o(n, "Plaćeni oglas") : "ht" == w ? o(n, "Peye") : "ne" == w || "mr" == w || "hi" == w ? o(n, "प्रायोजित") : "hu" == w ? a(n, "H", "i", "r", "d") : "hy" == w ? o(n, "Գովազդային") : "id" == w ? a(n, "B", "e", "p", "n") : "is" == w ? o(n, "Kostað") : "ja" == w ? o(n, "広告") : "ms" == w ? o(n, "Ditaja") : "jv" == w ? o(n, "Disponsori") : "ka" == w ? o(n, "რეკლამა") : "kk" == w ? o(n, "Демеушілік көрсеткен") : "km" == w ? o(n, "បានឧបត្ថម្ភ") : "kn" == w ? o(n, "ಪ್ರಾಯೋಜಿತ") : "ko" == w ? o(n, "Sponsored") : "ky" == w ? o(n, "Демөөрчүлөнгөн") : "lo" == w ? o(n, "ຜູ້ສະໜັບສະໜູນ") : "lt" == w ? o(n, "Remiama") : "lv" == w ? o(n, "Apmaksāta reklāma") : "mg" == w ? o(n, "Misy Mpiantoka") : "ml" == w ? o(n, "സ്പോൺസർ ചെയ്തത്") : "mn" == w ? o(n, "Ивээн тэтгэсэн") : "mt" == w ? o(n, "Sponsorjat") : "my" == w ? (o(n, "ပံ့ပိုးထားသည်"), 
                    "0" == c && o(n, "အခပေးကြော်ငြာ")) : "or" == w ? o(n, "ପ୍ରଯୋଜିତ") : "pa" == w ? o(n, "ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ") : "ps" == w ? o(n, "تمويل شوي") : "ro" == w ? o(n, "Sponsorizat") : "ru" == w || "uk" == w ? o(n, "Реклама") : "rw" == w ? o(n, "Icyamamaza ndasukirwaho") : "sc" == w ? o(n, "Patronadu de") : "si" == w ? o(n, "අනුග්රාහක") : "sk" == w ? o(n, "Sponzorované") : "sn" == w ? o(n, "Zvabhadharirwa") : "so" == w ? o(n, "La maalgeliyey") : "sr" == w ? o(n, "Спонзорисано") : "sw" == w ? o(n, "Imedhaminiwa") : "sy" == w ? o(n, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : "sz" == w ? o(n, "Szpōnzorowane") : "ta" == w ? o(n, "விளம்பரம்") : "te" == w ? o(n, "ప్రాయోజితం చేయబడింది") : "tg" == w ? o(n, "Бо сарпарастӣ") : "th" == w ? o(n, "ได้รับการสนับสนุน") : "tl" == w ? o(n, "May Sponsor") : "tr" == w ? o(n, "Sponsorlu") : "tt" == w ? o(n, "Хәйрияче") : "tz" == w ? o(n, "ⵉⴷⵍ") : "ur" == w ? o(n, "سپانسرڈ") : "uz" == w ? o(n, "Reklama") : "vi" == w ? o(n, "Được tài trợ") : "zh-Hans" == w ? o(n, "赞助内容") : "zh-Hant" == w && o(n, "贊助"), 
                    0 < l.length && 0 < u.length && 0 < p.length && 0 < f.length)) {
                        for (cont = 0; cont < l.length; cont++) 0 < l[cont].offsetHeight && (cont = l.length, 
                        r = 1);
                        for (cont1 = 0; cont1 < u.length; cont1++) 0 < u[cont1].offsetHeight && (cont1 = u.length, 
                        c = 1);
                        for (cont2 = 0; cont2 < p.length; cont2++) 0 < p[cont2].offsetHeight && (cont2 = p.length, 
                        s = 1);
                        for (cont3 = 0; cont3 < f.length; cont3++) 0 < f[cont3].offsetHeight && (cont3 = f.length, 
                        d = 1);
                        1 == r && 1 == c && 1 == s && 1 == d && (0 < e.length && "" != (m = n.querySelectorAll("a[href]")[1].innerText) || (m = n.querySelectorAll("a[href]")[2].innerText), 
                        t += 1, console.log("--------"), console.log("Ad hidden from: " + m), console.log("Total ads hidden: " + t), 
                        console.log("--------"), n.style = "display:none!important;");
                    }
                }));
            })), t = 0;
            e.observe(document, {
                childList: !0,
                subtree: !0
            });
        }();
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[data-pagelet^=\\"FeedUnit\\"]:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > div:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > span:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div[class] > #ssrb_feed_start ~ div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class] > div:not([class], [id]) div:not([class], [id]):not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class] > div:not([class], [id]) div:not([class], [id], [dir], [data-0], [style]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] h3[dir=\\"auto\\"] + div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes?.("__reactEvents")||a.includes?.("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.category?.includes("SPONSORED")||a.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.feed_story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category_sensitive?.cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.feedUnit?.lbl_sp_data?.ad_id||a.children?.props?.children?.props?.minGapType?.includes("SPONSORED")){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        e = 0, t = [], new MutationObserver((function() {
            document.querySelectorAll('div[data-pagelet^="FeedUnit"]:not([style*="display: none"]), div[role="feed"] > div:not([style*="display: none"]), div[role="feed"] > span:not([style*="display: none"]), #ssrb_feed_start + div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div[class] > #ssrb_feed_start ~ div > h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div > div > div[class]:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div > div > div[class] > div:not([class], [id]) div:not([class], [id]):not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class] > div:not([class], [id]) div:not([class], [id], [dir], [data-0], [style]), div[role="main"] div > h2 ~ div > div[class] > div > div:not([style*="display: none"]), div[role="main"] h3[dir="auto"] + div > div[class]:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div[class] > div > div:not([style*="display: none"]) > div:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div > div > div:not([style*="display: none"]) > div:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div > div > div:not([style*="display: none"]) > div:not([style*="display: none"])').forEach((function(n) {
                Object.keys(n).forEach((function(o) {
                    if (o.includes?.("__reactEvents") || o.includes?.("__reactProps")) {
                        o = n[o];
                        try {
                            if (o.children?.props?.category?.includes("SPONSORED") || o.children?.props?.children?.props?.category?.includes("SPONSORED") || o.children?.props?.feedEdge?.category?.includes("SPONSORED") || o.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || o.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || o.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || o.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.feed_story_category?.includes("SPONSORED") || o.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_category?.includes("SPONSORED") || o.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_cat?.includes("SPONSORED") || o.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category_sensitive?.cat?.includes("SPONSORED") || o.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting || o.children?.props?.children?.props?.children?.props?.children?.props?.feedUnit?.lbl_sp_data?.ad_id || o.children?.props?.children?.props?.minGapType?.includes("SPONSORED")) {
                                e++, n.style = "display: none !important;";
                                var i = n.querySelector("a[href][aria-label]:not([aria-hidden])");
                                i && (t.push([ "Ad blocked based on property [" + e + "] -> " + i.ariaLabel ]), 
                                console.table(t));
                            }
                        } catch (o) {}
                    }
                }));
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
        var e, t;
    },
    '!function(){(new MutationObserver(function(){window.location.href.includes("/watch")&&document.querySelectorAll(\'#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]\').forEach(function(b){Object.keys(b).forEach(function(a){if(a.includes("__reactFiber")){a=b[a];try{var c,d,e,f;if(null==(c=a)?0:null==(d=c["return"])?0:null==(e=d.memoizedProps)?0:null==(f=e.story)?0:f.sponsored_data){var g=b.closest(\'#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])\');g.style="display: none !important;"}}catch(h){}}})})})).observe(document,{childList:!0,subtree:!0,attributeFilter:["style"]})}();': () => {
        new MutationObserver((function() {
            window.location.href.includes("/watch") && document.querySelectorAll('#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]').forEach((function(e) {
                Object.keys(e).forEach((function(t) {
                    if (t.includes("__reactFiber")) {
                        t = e[t];
                        try {
                            var n, o, i, a;
                            null != (n = t) && null != (o = n.return) && null != (i = o.memoizedProps) && null != (a = i.story) && a.sponsored_data && (e.closest('#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])').style = "display: none !important;");
                        } catch (e) {}
                    }
                }));
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0,
            attributeFilter: [ "style" ]
        });
    },
    '!function(){if(location.href.includes("marketplace/item")){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[aria-label=\'Marketplace listing viewer\'] > div div + div + span:not([style*=\'display: none\']), #ssrb_feed_start + div > div div + div + span:not([style*=\'display: none\'])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.children?.props?.adId){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}}();': () => {
        !function() {
            if (location.href.includes("marketplace/item")) {
                var e = 0, t = [];
                new MutationObserver((function() {
                    document.querySelectorAll("div[aria-label='Marketplace listing viewer'] > div div + div + span:not([style*='display: none']), #ssrb_feed_start + div > div div + div + span:not([style*='display: none'])").forEach((function(n) {
                        Object.keys(n).forEach((function(o) {
                            if (o.includes("__reactEvents") || o.includes("__reactProps")) {
                                o = n[o];
                                try {
                                    if (o.children?.props?.children?.props?.adId) {
                                        e++, n.style = "display: none !important;";
                                        var i = n.querySelector("a[href][aria-label]:not([aria-hidden])");
                                        i && (t.push([ "Ad blocked based on property [" + e + "] -> " + i.ariaLabel ]), 
                                        console.table(t));
                                    }
                                } catch (o) {}
                            }
                        }));
                    }));
                })).observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }
        }();
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\').forEach(function(e){function t(e,t){for(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [class] [class]\'),socheck=0;socheck<s.length;socheck++)s[socheck].innerText.contains(t)&&(c=["1"],d=["1"],i=["1"],r=l=a=1,socheck=s.length)}function o(e,t,o,n,a){s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+a+"]"),0==s.length&&(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+a+"]"))}var n=0,a=0,l=0,r=0,s=0,c=0,d=0,i=0,u=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),h=document.querySelector("[lang]").lang,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),p=e.querySelectorAll(\'a[href*="ads/about"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")){if(0<g.length||0<p.length){f+=1;var y=e.querySelectorAll("a[href]")[2].innerText;console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("F length: "+g.length),console.log("H length: "+p.length),console.log("--------"),e.style="display:none!important;"}else if(0<u.length){f+=1;y="Facebook";console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"}else"af"==h?t(e,"Geborg"):"de"==h||"nl"==h?o(e,"G","e","s","n"):"am"==h?t(e,"የተከፈለበት ማስታወቂያ"):"ar"==h?t(e,"مُموَّل"):"as"==h?t(e,"পৃষ্ঠপোষকতা কৰা"):"az"==h?t(e,"Sponsor dəstəkli"):"co"==h?t(e,"Spunsurizatu"):"bs"==h||"sl"==h||"cs"==h?o(e,"S","p","z","n"):"da"==h||"en"==h||"et"==h||"fy"==h||"it"==h||"ku"==h||"nb"==h||"nn"==h||"pl"==h||"sq"==h||"sv"==h||"zz"==h?document.querySelector("body").className.includes("Locale_en_UD")?t(e,"pəɹosuodS"):o(e,"S","p","s","n"):"be"==h?t(e,"Рэклама"):"bg"==h?t(e,"Спонсорирано"):"mk"==h?t(e,"Спонзорирано"):"br"==h?t(e,"Paeroniet"):"ca"==h?t(e,"Patrocinat"):"gl"==h||"pt"==h?t(e,"Patrocinado"):"bn"==h?t(e,"সৌজন্যে"):"cb"==h?t(e,"پاڵپشتیکراو"):"cx"==h?o(e,"G","i","s","n"):"cy"==h?t(e,"Noddwyd"):"el"==h?t(e,"Χορηγούμενη"):"eo"==h?t(e,"Reklamo"):"es"==h?o(e,"P","u","c","d"):"eu"==h?t(e,"Babestua"):"fa"==h?t(e,"دارای پشتیبانی مالی"):"ff"==h?t(e,"Yoɓanaama"):"fi"==h?t(e,"Sponsoroitu"):"fo"==h?t(e,"Stuðlað"):"fr"==h?document.querySelector("body").className.includes("Locale_fr_FR")?o(e,"S","p","s","n"):o(e,"C","o","m","n"):"ga"==h?t(e,"Urraithe"):"gn"==h?t(e,"Oñepatrosinapyre"):"gu"==h?t(e,"પ્રાયોજિત"):"ha"==h?t(e,"Daukar Nauyi"):"he"==h?t(e,"ממומן"):"hr"==h?t(e,"Plaćeni oglas"):"ht"==h?t(e,"Peye"):"ne"==h||"mr"==h||"hi"==h?t(e,"प्रायोजित"):"hu"==h?o(e,"H","i","r","d"):"hy"==h?t(e,"Գովազդային"):"id"==h?o(e,"B","e","p","n"):"is"==h?t(e,"Kostað"):"ja"==h?t(e,"広告"):"ms"==h?t(e,"Ditaja"):"jv"==h?t(e,"Disponsori"):"ka"==h?t(e,"რეკლამა"):"kk"==h?t(e,"Демеушілік көрсеткен"):"km"==h?t(e,"បានឧបត្ថម្ភ"):"kn"==h?t(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==h?t(e,"Sponsored"):"ky"==h?t(e,"Демөөрчүлөнгөн"):"lo"==h?t(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==h?t(e,"Remiama"):"lv"==h?t(e,"Apmaksāta reklāma"):"mg"==h?t(e,"Misy Mpiantoka"):"ml"==h?t(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==h?t(e,"Ивээн тэтгэсэн"):"mt"==h?t(e,"Sponsorjat"):"my"==h?t(e,"ပံ့ပိုးထားသည်"):"or"==h?t(e,"ପ୍ରଯୋଜିତ"):"pa"==h?t(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==h?t(e,"تمويل شوي"):"ro"==h?t(e,"Sponsorizat"):"ru"==h||"uk"==h?t(e,"Реклама"):"rw"==h?t(e,"Icyamamaza ndasukirwaho"):"sc"==h?t(e,"Patronadu de"):"si"==h?t(e,"අනුග්‍රාහක"):"sk"==h?t(e,"Sponzorované"):"sn"==h?t(e,"Zvabhadharirwa"):"so"==h?t(e,"La maalgeliyey"):"sr"==h?t(e,"Спонзорисано"):"sw"==h?t(e,"Imedhaminiwa"):"sy"==h?t(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==h?t(e,"Szpōnzorowane"):"ta"==h?t(e,"விளம்பரம்"):"te"==h?t(e,"ప్రాయోజితం చేయబడింది"):"tg"==h?t(e,"Бо сарпарастӣ"):"th"==h?t(e,"ได้รับการสนับสนุน"):"tl"==h?t(e,"May Sponsor"):"tr"==h?t(e,"Sponsorlu"):"tt"==h?t(e,"Хәйрияче"):"tz"==h?t(e,"ⵉⴷⵍ"):"ur"==h?t(e,"سپانسرڈ"):"uz"==h?t(e,"Reklama"):"vi"==h?t(e,"Được tài trợ"):"zh-Hans"==h?t(e,"赞助内容"):"zh-Hant"==h&&t(e,"贊助");if(0<s.length&&0<c.length&&0<d.length&&0<i.length){for(cont=0;cont<s.length;cont++)0<s[cont].offsetHeight&&(cont=s.length,n=1);for(cont1=0;cont1<c.length;cont1++)0<c[cont1].offsetHeight&&(cont1=c.length,a=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,l=1);for(cont3=0;cont3<i.length;cont3++)0<i[cont3].offsetHeight&&(cont3=i.length,r=1);if(1==n&&1==a&&1==l&&1==r){y=e.querySelectorAll("a[href]")[2].innerText;f+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("--------"),e.style="display:none!important;"}}}})}),f=0;e.observe(document,{childList:!0,subtree:!0,characterData:!0,attributes:!0})}();': () => {
        e = new MutationObserver((function() {
            document.querySelectorAll('[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]').forEach((function(e) {
                function n(e, t) {
                    for (s = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [class] [class]'), 
                    socheck = 0; socheck < s.length; socheck++) s[socheck].innerText.contains(t) && (d = [ "1" ], 
                    l = [ "1" ], u = [ "1" ], c = r = a = 1, socheck = s.length);
                }
                function o(e, t, n, o, i) {
                    s = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + t + "]"), 
                    d = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + n + "]"), 
                    l = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + o + "]"), 
                    u = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + i + "]"), 
                    0 == s.length && (s = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + t + "]"), 
                    d = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + n + "]"), 
                    l = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + o + "]"), 
                    u = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + i + "]"));
                }
                var i = 0, a = 0, r = 0, c = 0, s = 0, d = 0, l = 0, u = 0, p = e.querySelectorAll("div[style='width: 100%'] > a[href*='oculus.com/quest'] > div"), f = document.querySelector("[lang]").lang, h = e.querySelectorAll('a[ajaxify*="ad_id"] > span'), w = e.querySelectorAll('a[href*="ads/about"]');
                if ("display: none !important;" != e.getAttribute("style") && !e.classList.contains("hidden_elem")) {
                    if (0 < h.length || 0 < w.length) {
                        t += 1;
                        var y = e.querySelectorAll("a[href]")[2].innerText;
                        console.log("--------"), console.log("Ad hidden from: " + y), console.log("Total ads hidden: " + t), 
                        console.log("F length: " + h.length), console.log("H length: " + w.length), console.log("--------"), 
                        e.style = "display:none!important;";
                    } else if (0 < p.length) {
                        t += 1;
                        y = "Facebook";
                        console.log("--------"), console.log("Ad hidden from: " + y), console.log("Total ads hidden: " + t), 
                        console.log("Non-declared ad"), console.log("--------"), e.style = "display:none!important;";
                    } else "af" == f ? n(e, "Geborg") : "de" == f || "nl" == f ? o(e, "G", "e", "s", "n") : "am" == f ? n(e, "የተከፈለበት ማስታወቂያ") : "ar" == f ? n(e, "مُموَّل") : "as" == f ? n(e, "পৃষ্ঠপোষকতা কৰা") : "az" == f ? n(e, "Sponsor dəstəkli") : "co" == f ? n(e, "Spunsurizatu") : "bs" == f || "sl" == f || "cs" == f ? o(e, "S", "p", "z", "n") : "da" == f || "en" == f || "et" == f || "fy" == f || "it" == f || "ku" == f || "nb" == f || "nn" == f || "pl" == f || "sq" == f || "sv" == f || "zz" == f ? document.querySelector("body").className.includes("Locale_en_UD") ? n(e, "pəɹosuodS") : o(e, "S", "p", "s", "n") : "be" == f ? n(e, "Рэклама") : "bg" == f ? n(e, "Спонсорирано") : "mk" == f ? n(e, "Спонзорирано") : "br" == f ? n(e, "Paeroniet") : "ca" == f ? n(e, "Patrocinat") : "gl" == f || "pt" == f ? n(e, "Patrocinado") : "bn" == f ? n(e, "সৌজন্যে") : "cb" == f ? n(e, "پاڵپشتیکراو") : "cx" == f ? o(e, "G", "i", "s", "n") : "cy" == f ? n(e, "Noddwyd") : "el" == f ? n(e, "Χορηγούμενη") : "eo" == f ? n(e, "Reklamo") : "es" == f ? o(e, "P", "u", "c", "d") : "eu" == f ? n(e, "Babestua") : "fa" == f ? n(e, "دارای پشتیبانی مالی") : "ff" == f ? n(e, "Yoɓanaama") : "fi" == f ? n(e, "Sponsoroitu") : "fo" == f ? n(e, "Stuðlað") : "fr" == f ? document.querySelector("body").className.includes("Locale_fr_FR") ? o(e, "S", "p", "s", "n") : o(e, "C", "o", "m", "n") : "ga" == f ? n(e, "Urraithe") : "gn" == f ? n(e, "Oñepatrosinapyre") : "gu" == f ? n(e, "પ્રાયોજિત") : "ha" == f ? n(e, "Daukar Nauyi") : "he" == f ? n(e, "ממומן") : "hr" == f ? n(e, "Plaćeni oglas") : "ht" == f ? n(e, "Peye") : "ne" == f || "mr" == f || "hi" == f ? n(e, "प्रायोजित") : "hu" == f ? o(e, "H", "i", "r", "d") : "hy" == f ? n(e, "Գովազդային") : "id" == f ? o(e, "B", "e", "p", "n") : "is" == f ? n(e, "Kostað") : "ja" == f ? n(e, "広告") : "ms" == f ? n(e, "Ditaja") : "jv" == f ? n(e, "Disponsori") : "ka" == f ? n(e, "რეკლამა") : "kk" == f ? n(e, "Демеушілік көрсеткен") : "km" == f ? n(e, "បានឧបត្ថម្ភ") : "kn" == f ? n(e, "ಪ್ರಾಯೋಜಿತ") : "ko" == f ? n(e, "Sponsored") : "ky" == f ? n(e, "Демөөрчүлөнгөн") : "lo" == f ? n(e, "ຜູ້ສະໜັບສະໜູນ") : "lt" == f ? n(e, "Remiama") : "lv" == f ? n(e, "Apmaksāta reklāma") : "mg" == f ? n(e, "Misy Mpiantoka") : "ml" == f ? n(e, "സ്പോൺസർ ചെയ്തത്") : "mn" == f ? n(e, "Ивээн тэтгэсэн") : "mt" == f ? n(e, "Sponsorjat") : "my" == f ? n(e, "ပံ့ပိုးထားသည်") : "or" == f ? n(e, "ପ୍ରଯୋଜିତ") : "pa" == f ? n(e, "ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ") : "ps" == f ? n(e, "تمويل شوي") : "ro" == f ? n(e, "Sponsorizat") : "ru" == f || "uk" == f ? n(e, "Реклама") : "rw" == f ? n(e, "Icyamamaza ndasukirwaho") : "sc" == f ? n(e, "Patronadu de") : "si" == f ? n(e, "අනුග්‍රාහක") : "sk" == f ? n(e, "Sponzorované") : "sn" == f ? n(e, "Zvabhadharirwa") : "so" == f ? n(e, "La maalgeliyey") : "sr" == f ? n(e, "Спонзорисано") : "sw" == f ? n(e, "Imedhaminiwa") : "sy" == f ? n(e, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : "sz" == f ? n(e, "Szpōnzorowane") : "ta" == f ? n(e, "விளம்பரம்") : "te" == f ? n(e, "ప్రాయోజితం చేయబడింది") : "tg" == f ? n(e, "Бо сарпарастӣ") : "th" == f ? n(e, "ได้รับการสนับสนุน") : "tl" == f ? n(e, "May Sponsor") : "tr" == f ? n(e, "Sponsorlu") : "tt" == f ? n(e, "Хәйрияче") : "tz" == f ? n(e, "ⵉⴷⵍ") : "ur" == f ? n(e, "سپانسرڈ") : "uz" == f ? n(e, "Reklama") : "vi" == f ? n(e, "Được tài trợ") : "zh-Hans" == f ? n(e, "赞助内容") : "zh-Hant" == f && n(e, "贊助");
                    if (0 < s.length && 0 < d.length && 0 < l.length && 0 < u.length) {
                        for (cont = 0; cont < s.length; cont++) 0 < s[cont].offsetHeight && (cont = s.length, 
                        i = 1);
                        for (cont1 = 0; cont1 < d.length; cont1++) 0 < d[cont1].offsetHeight && (cont1 = d.length, 
                        a = 1);
                        for (cont2 = 0; cont2 < l.length; cont2++) 0 < l[cont2].offsetHeight && (cont2 = l.length, 
                        r = 1);
                        for (cont3 = 0; cont3 < u.length; cont3++) 0 < u[cont3].offsetHeight && (cont3 = u.length, 
                        c = 1);
                        if (1 == i && 1 == a && 1 == r && 1 == c) {
                            y = e.querySelectorAll("a[href]")[2].innerText;
                            t += 1, console.log("--------"), console.log("Ad hidden from: " + y), console.log("Total ads hidden: " + t), 
                            console.log("--------"), e.style = "display:none!important;";
                        }
                    }
                }
            }));
        })), t = 0, e.observe(document, {
            childList: !0,
            subtree: !0,
            characterData: !0,
            attributes: !0
        });
        var e, t;
    },
    '!function(){var e,o;0<window.location.href.indexOf("marketplace")&&(e=new MutationObserver(function(){document.querySelectorAll(\'div[role="main"] div[class][style^="max-width:"] div[class][style^="max-width:"]\').forEach(function(e){var l,t=e.querySelectorAll(\'a[href*="ads/about"]\');"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||0<t.length&&(o+=1,""==(l=e.querySelectorAll("a[href]")[0].innerText)&&(l=e.querySelectorAll("a[href]")[1].innerText),""==l&&(l=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0]?.getAttribute("aria-label")),console.log("--------"),console.log("Ad hidden from: "+l),console.log("Total ads hidden: "+o),console.log("H length: "+t.length),console.log("--------"),e.style="display:none!important;")})}),o=0,e.observe(document,{childList:!0,subtree:!0}))}();': () => {
        0 < window.location.href.indexOf("marketplace") && (e = new MutationObserver((function() {
            document.querySelectorAll('div[role="main"] div[class][style^="max-width:"] div[class][style^="max-width:"]').forEach((function(e) {
                var n, o = e.querySelectorAll('a[href*="ads/about"]');
                "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || 0 < o.length && (t += 1, 
                "" == (n = e.querySelectorAll("a[href]")[0].innerText) && (n = e.querySelectorAll("a[href]")[1].innerText), 
                "" == n && (n = e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0]?.getAttribute("aria-label")), 
                console.log("--------"), console.log("Ad hidden from: " + n), console.log("Total ads hidden: " + t), 
                console.log("H length: " + o.length), console.log("--------"), e.style = "display:none!important;");
            }));
        })), t = 0, e.observe(document, {
            childList: !0,
            subtree: !0
        }));
        var e, t;
    },
    '!function(){new MutationObserver(function(){document.querySelectorAll("div[role=\\"main\\"] div[class][style^=\\"max-width:\\"] div[class][style*=\\"max-width:\\"]:not([style*=\\"display: none\\"])").forEach(function(c){Object.keys(c).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=c[a];try{a.children?.props?.adSurface?.startsWith("Marketplace")&&(c.style="display: none !important;")}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        new MutationObserver((function() {
            document.querySelectorAll('div[role="main"] div[class][style^="max-width:"] div[class][style*="max-width:"]:not([style*="display: none"])').forEach((function(e) {
                Object.keys(e).forEach((function(t) {
                    if (t.includes("__reactEvents") || t.includes("__reactProps")) {
                        t = e[t];
                        try {
                            t.children?.props?.adSurface?.startsWith("Marketplace") && (e.style = "display: none !important;");
                        } catch (t) {}
                    }
                }));
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    '!function(){if(window.location.href.includes("/marketplace/")){new MutationObserver(function(){document.querySelectorAll(\'div[data-testid="marketplace_home_feed"] div[class][data-testid^="MarketplaceUpsell-"] > div > div\').forEach(function(e){var t=e.outerHTML;t&&void 0!==t&&!0===t.includes("/ads/about/")&&(e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0})}}();': () => {
        window.location.href.includes("/marketplace/") && new MutationObserver((function() {
            document.querySelectorAll('div[data-testid="marketplace_home_feed"] div[class][data-testid^="MarketplaceUpsell-"] > div > div').forEach((function(e) {
                var t = e.outerHTML;
                t && void 0 !== t && !0 === t.includes("/ads/about/") && (e.style = "display:none!important;");
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('about:blank')&&c(a,b,d,e)}.bind(document);})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "click" != t && -1 == n.toString().indexOf("about:blank") && e(t, n, o, i);
            }.bind(document);
        }();
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Object\\[/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/Object\[/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    '(function(){Object.defineProperty(window,"open",{writable:!1,enumerable:!1,configurable:!1,value:window.open})})();': () => {
        Object.defineProperty(window, "open", {
            writable: !1,
            enumerable: !1,
            configurable: !1,
            value: window.open
        });
    },
    "Object.defineProperty(window, 'sas_manager', { get: function() { return { noad: function() {} }; }, set: function() {} });": () => {
        Object.defineProperty(window, "sas_manager", {
            get: function() {
                return {
                    noad: function() {}
                };
            },
            set: function() {}
        });
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/=setTimeout\(/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('.hi()')&&c(a,b,d,e)}.bind(document);})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "click" != t && -1 == n.toString().indexOf(".hi()") && e(t, n, o, i);
            }.bind(document);
        }();
    },
    '(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){"click"!=a&&-1==b.toString().indexOf(\'"dtnoppu"\')&&c(a,b,d,e)}.bind(document);})();': () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "click" != t && -1 == n.toString().indexOf('"dtnoppu"') && e(t, n, o, i);
            }.bind(document);
        }();
    },
    'window["pop_clicked"] = 1;': () => {
        window.pop_clicked = 1;
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('trigerred')&&c(a,b,d,e)}.bind(document);})();": () => {
        !function() {
            var e = document.addEventListener;
            document.addEventListener = function(t, n, o, i) {
                "click" != t && -1 == n.toString().indexOf("trigerred") && e(t, n, o, i);
            }.bind(document);
        }();
    },
    "document.addEventListener('DOMContentLoaded', function() { if (window.location.href.indexOf(\"hpinterstitialnew.html\") != -1) { window.setCookie1('sitecapture_interstitial', 1, 1); window.location.href = \"http://www.ndtv.com/\"; } })": () => {
        document.addEventListener("DOMContentLoaded", (function() {
            if (-1 != window.location.href.indexOf("hpinterstitialnew.html")) {
                window.setCookie1("sitecapture_interstitial", 1, 1);
                window.location.href = "http://www.ndtv.com/";
            }
        }));
    },
    "window.exo99HL3903jjdxtrnLoad = true;": () => {
        window.exo99HL3903jjdxtrnLoad = !0;
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ prerollskip(); setTimeout(function() { prerollskip(); }, 100); setTimeout(function() { prerollskip(); }, 300); }));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            prerollskip();
            setTimeout((function() {
                prerollskip();
            }), 100);
            setTimeout((function() {
                prerollskip();
            }), 300);
        }));
    },
    "!function(a,b){b=new MutationObserver(function(){a.classList.contains('idle')&&a.classList.remove('idle')}),b.observe(a,{attributes:!0,attributeFilter:['class']})}(document.documentElement);": () => {
        e = document.documentElement, new MutationObserver((function() {
            e.classList.contains("idle") && e.classList.remove("idle");
        })).observe(e, {
            attributes: !0,
            attributeFilter: [ "class" ]
        });
        var e;
    },
    'URL.createObjectURL=function(){return"about:blank"};': () => {
        URL.createObjectURL = function() {
            return "about:blank";
        };
    },
    "window.canRunAds = !0;": () => {
        window.canRunAds = !0;
    },
    "window.myatu_bgm = 0;": () => {
        window.myatu_bgm = 0;
    },
    "window.runad = function() {};": () => {
        window.runad = function() {};
    },
    "setTimeout(function() { window.show_popup=false; window.download_inited = true; }, 300);": () => {
        setTimeout((function() {
            window.show_popup = !1;
            window.download_inited = !0;
        }), 300);
    },
    "function setOverlayHTML() {};": () => {},
    "function setOverlayHTML_new() {};": () => {},
    "setTimeout(removeOverlayHTML, 2000);": () => {
        setTimeout(removeOverlayHTML, 2e3);
    },
    '(()=>{const n="loader.min.js",e={includes:String.prototype.includes},o=()=>(new Error).stack,c={construct:(c,l,t)=>{const r=o();return e.includes.call(r,n)&&l[0]&&e.includes.call(l[0],"adshield")&&(l[0]=["(function(){})();"]),Reflect.construct(c,l,t)}};window.Blob=new Proxy(window.Blob,c);const l={apply:(c,l,t)=>{const r=o();return e.includes.call(r,n)&&t[0]&&e.includes.call(t[0],"throw new Error")&&(t[0]=()=>{}),Reflect.apply(c,l,t)}};window.setTimeout=new Proxy(window.setTimeout,l)})();': () => {
        (() => {
            const e = "loader.min.js", t = {
                includes: String.prototype.includes
            }, n = () => (new Error).stack, o = {
                construct: (o, i, a) => {
                    const r = n();
                    return t.includes.call(r, e) && i[0] && t.includes.call(i[0], "adshield") && (i[0] = [ "(function(){})();" ]), 
                    Reflect.construct(o, i, a);
                }
            };
            window.Blob = new Proxy(window.Blob, o);
            const i = {
                apply: (o, i, a) => {
                    const r = n();
                    return t.includes.call(r, e) && a[0] && t.includes.call(a[0], "throw new Error") && (a[0] = () => {}), 
                    Reflect.apply(o, i, a);
                }
            };
            window.setTimeout = new Proxy(window.setTimeout, i);
        })();
    },
    '(()=>{const e={apply:(e,l,o)=>"link"===o[0]||"style"===o[0]?[]:Reflect.apply(e,l,o)};window.document.querySelectorAll=new Proxy(window.document.querySelectorAll,e)})();': () => {
        (() => {
            const e = {
                apply: (e, t, n) => "link" === n[0] || "style" === n[0] ? [] : Reflect.apply(e, t, n)
            };
            window.document.querySelectorAll = new Proxy(window.document.querySelectorAll, e);
        })();
    },
    '(()=>{let t=document.location.href,e=[],n=[],o="",r=!1;const i=Array.prototype.push,a={apply:(t,o,a)=>(window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id&&a[0]&&a[0]!==window&&"number"==typeof a[0].start&&a[0].end&&"ssap"===a[0].namespace&&a[0].id&&(r||0!==a[0]?.start||n.includes(a[0].id)||(e.length=0,n.length=0,r=!0,i.call(e,a[0]),i.call(n,a[0].id)),r&&0!==a[0]?.start&&!n.includes(a[0].id)&&(i.call(e,a[0]),i.call(n,a[0].id))),Reflect.apply(t,o,a))};window.Array.prototype.push=new Proxy(window.Array.prototype.push,a),document.addEventListener("DOMContentLoaded",(function(){if(!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id)return;const i=()=>{const t=document.querySelector("video");if(t&&e.length){const i=Math.round(t.duration),a=Math.round(e.at(-1).end/1e3),c=n.join(",");if(!1===t.loop&&o!==c&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}else if(!0===t.loop&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}}};i();new MutationObserver((()=>{t!==document.location.href&&(t=document.location.href,e.length=0,n.length=0,r=!1),i()})).observe(document,{childList:!0,subtree:!0})}))})();': () => {
        (() => {
            let e = document.location.href, t = [], n = [], o = "", i = !1;
            const a = Array.prototype.push, r = {
                apply: (e, o, r) => (window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id && r[0] && r[0] !== window && "number" == typeof r[0].start && r[0].end && "ssap" === r[0].namespace && r[0].id && (i || 0 !== r[0]?.start || n.includes(r[0].id) || (t.length = 0, 
                n.length = 0, i = !0, a.call(t, r[0]), a.call(n, r[0].id)), i && 0 !== r[0]?.start && !n.includes(r[0].id) && (a.call(t, r[0]), 
                a.call(n, r[0].id))), Reflect.apply(e, o, r))
            };
            window.Array.prototype.push = new Proxy(window.Array.prototype.push, r), document.addEventListener("DOMContentLoaded", (function() {
                if (!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id) return;
                const a = () => {
                    const e = document.querySelector("video");
                    if (e && t.length) {
                        const a = Math.round(e.duration), r = Math.round(t.at(-1).end / 1e3), c = n.join(",");
                        if (!1 === e.loop && o !== c && a && a === r) {
                            const n = t.at(-1).start / 1e3;
                            e.currentTime < n && (e.currentTime = n, i = !1, o = c);
                        } else if (!0 === e.loop && a && a === r) {
                            const n = t.at(-1).start / 1e3;
                            e.currentTime < n && (e.currentTime = n, i = !1, o = c);
                        }
                    }
                };
                a();
                new MutationObserver((() => {
                    e !== document.location.href && (e = document.location.href, t.length = 0, n.length = 0, 
                    i = !1), a();
                })).observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }));
        })();
    },
    '(()=>{window.JSON.parse=new Proxy(JSON.parse,{apply(r,e,t){const n=Reflect.apply(r,e,t);if(!location.pathname.startsWith("/shorts/"))return n;const a=n?.entries;return a&&Array.isArray(a)&&(n.entries=n.entries.filter((r=>{if(!r?.command?.reelWatchEndpoint?.adClientParams?.isAd)return r}))),n}});})();': () => {
        window.JSON.parse = new Proxy(JSON.parse, {
            apply(e, t, n) {
                const o = Reflect.apply(e, t, n);
                if (!location.pathname.startsWith("/shorts/")) return o;
                const i = o?.entries;
                return i && Array.isArray(i) && (o.entries = o.entries.filter((e => {
                    if (!e?.command?.reelWatchEndpoint?.adClientParams?.isAd) return e;
                }))), o;
            }
        });
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'a[href^="https://af.gog.com/game/"]\').forEach((t=>{const e=t.getAttribute("href").replace("https://af.gog.com/","https://www.gog.com/");t.setAttribute("href",e)}))}));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            document.querySelectorAll('a[href^="https://af.gog.com/game/"]').forEach((e => {
                const t = e.getAttribute("href").replace("https://af.gog.com/", "https://www.gog.com/");
                e.setAttribute("href", t);
            }));
        }));
    },
    'window.addEventListener("load",(()=>{window.stop()}));': () => {
        window.addEventListener("load", (() => {
            window.stop();
        }));
    },
    '(()=>{const e={apply:(e,t,n)=>{try{const[e,r]=n,a=r?.toString();if("click"===e&&a?.includes("attached")&&t instanceof HTMLElement&&t.matches(".share-embed-container"))return}catch(e){}return Reflect.apply(e,t,n)}};window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,e)})();': () => {
        (() => {
            const e = {
                apply: (e, t, n) => {
                    try {
                        const [e, o] = n, i = o?.toString();
                        if ("click" === e && i?.includes("attached") && t instanceof HTMLElement && t.matches(".share-embed-container")) return;
                    } catch (e) {}
                    return Reflect.apply(e, t, n);
                }
            };
            window.EventTarget.prototype.addEventListener = new Proxy(window.EventTarget.prototype.addEventListener, e);
        })();
    },
    'document.cookie="dl-mobile-banner=hidden;path=/";': () => {
        document.cookie = "dl-mobile-banner=hidden;path=/";
    },
    'document.cookie="downloadcta-state=hidden;path=/";': () => {
        document.cookie = "downloadcta-state=hidden;path=/";
    },
    '(function(){-1==document.cookie.indexOf("native-app-topper")&&(document.cookie="native-app-topper="+Date.now()+"; path=/;",location.reload())})();': () => {
        -1 == document.cookie.indexOf("native-app-topper") && (document.cookie = "native-app-topper=" + Date.now() + "; path=/;", 
        location.reload());
    },
    '(function(){var a=new Date;a=a.getFullYear()+"-"+(a.getMonth()+1)+"-"+a.getDate();document.cookie="closed="+a})();': () => {
        !function() {
            var e = new Date;
            e = e.getFullYear() + "-" + (e.getMonth() + 1) + "-" + e.getDate();
            document.cookie = "closed=" + e;
        }();
    },
    'document.cookie="com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";': () => {
        document.cookie = "com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";
    },
    'document.cookie="sb-closed=true; path=/;";': () => {
        document.cookie = "sb-closed=true; path=/;";
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/loadAppStoreBanner/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/loadAppStoreBanner/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "(()=>{try{\"undefined\"!=typeof sessionStorage&&sessionStorage.setItem('status_of_app_redirect_half_modal_on_coordinate_list','{\"displayed\":true}')}catch(e){}})();": () => {
        (() => {
            try {
                "undefined" != typeof sessionStorage && sessionStorage.setItem("status_of_app_redirect_half_modal_on_coordinate_list", '{"displayed":true}');
            } catch (e) {}
        })();
    },
    '(()=>{var b=EventTarget.prototype.addEventListener,c=function(a,b){var c=document.querySelector("button.AppHeader-login");c&&b.bind(c)("click",function(){d.disconnect()},{once:!0})},d=new MutationObserver(function(){var a=document.querySelector(".Modal-wrapper .signFlowModal > .Modal-closeButton");a&&(d.disconnect(),e.disconnect(),a.click())});d.observe(document,{childList:!0,subtree:!0});var e=new MutationObserver(a=>{c(a,b)});e.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){e.disconnect(),d.disconnect()},5E3)})();': () => {
        (() => {
            var e = EventTarget.prototype.addEventListener, t = new MutationObserver((function() {
                var e = document.querySelector(".Modal-wrapper .signFlowModal > .Modal-closeButton");
                e && (t.disconnect(), n.disconnect(), e.click());
            }));
            t.observe(document, {
                childList: !0,
                subtree: !0
            });
            var n = new MutationObserver((n => {
                !function(e, n) {
                    var o = document.querySelector("button.AppHeader-login");
                    o && n.bind(o)("click", (function() {
                        t.disconnect();
                    }), {
                        once: !0
                    });
                }(0, e);
            }));
            n.observe(document, {
                childList: !0,
                subtree: !0
            }), setTimeout((function() {
                n.disconnect(), t.disconnect();
            }), 5e3);
        })();
    },
    '(function(){if(!document.cookie.includes("zip_and_city=")){var a=encodeURIComponent(\'{"zip":"","city":""}\');document.cookie="zip_and_city="+a+"; path=/;"}})();': () => {
        !function() {
            if (!document.cookie.includes("zip_and_city=")) {
                var e = encodeURIComponent('{"zip":"","city":""}');
                document.cookie = "zip_and_city=" + e + "; path=/;";
            }
        }();
    },
    "(function(){var b=window.alert;window.alert=function(a){if(!/do geolokalizacji/.test(a.toString()))return b(a)};})();": () => {
        e = window.alert, window.alert = function(t) {
            if (!/do geolokalizacji/.test(t.toString())) return e(t);
        };
        var e;
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=portal.abczdrowie.pl")||decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=parenting.pl"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace("https://"+a)}catch(b){}}();': () => {
        !function() {
            if (decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=portal.abczdrowie.pl") || decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=parenting.pl")) try {
                var e = new URL(window.location.href).searchParams.get("s");
                location.replace("https://" + e);
            } catch (e) {}
        }();
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=https://"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace(a)}catch(b){}}();': () => {
        !function() {
            if (decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=https://")) try {
                var e = new URL(window.location.href).searchParams.get("s");
                location.replace(e);
            } catch (e) {}
        }();
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ucs=lbit="+b})();': () => {
        e = (new Date).getTime(), document.cookie = "ucs=lbit=" + e;
        var e;
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/loginPopup.show/.test(a)){ _st(a,b);}};": () => {
        var e = window.setTimeout;
        window.setTimeout = function(t, n) {
            /loginPopup.show/.test(t) || e(t, n);
        };
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'div[id^="substream_"] div[id^="hyperfeed_story_id"]\').forEach(function(e){var n=e.querySelectorAll(".userContentWrapper > div[class] > div[class] > div[class]"),o=e.querySelectorAll(".userContentWrapper > div[class] > div > div span");if("display: none !important;"!=e.getAttribute("style")){if(0<n.length&&n[0].innerText.contains("Suggested")){console.log("--------"),t+=1;var l=e.querySelectorAll("a[href]")[2].innerText;console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}if(0<o.length&&o[0].innerText.contains("People you may know"))console.log("--------"),t+=1,""==(l=e.querySelectorAll("a[href]")[2].innerText)&&(l="Facebook"),console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}})}),t=0;e.observe(document,{childList:!0,subtree:!0})}();': () => {
        !function() {
            var e = new MutationObserver((function() {
                document.querySelectorAll('div[id^="substream_"] div[id^="hyperfeed_story_id"]').forEach((function(e) {
                    var n = e.querySelectorAll(".userContentWrapper > div[class] > div[class] > div[class]"), o = e.querySelectorAll(".userContentWrapper > div[class] > div > div span");
                    if ("display: none !important;" != e.getAttribute("style")) {
                        if (0 < n.length && n[0].innerText.contains("Suggested")) {
                            console.log("--------"), t += 1;
                            var i = e.querySelectorAll("a[href]")[2].innerText;
                            console.log("Annoyance hidden from: " + i), console.log("Total annoyances Hidden: " + t), 
                            console.log("F length: " + n.length), console.log("--------"), e.style = "display:none!important;";
                        }
                        0 < o.length && o[0].innerText.contains("People you may know") && (console.log("--------"), 
                        t += 1, "" == (i = e.querySelectorAll("a[href]")[2].innerText) && (i = "Facebook"), 
                        console.log("Annoyance hidden from: " + i), console.log("Total annoyances Hidden: " + t), 
                        console.log("F length: " + n.length), console.log("--------"), e.style = "display:none!important;");
                    }
                }));
            })), t = 0;
            e.observe(document, {
                childList: !0,
                subtree: !0
            });
        }();
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': () => {
        new MutationObserver((function() {
            document.querySelectorAll('div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])').forEach((function(e) {
                "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you") && (console.log("--------"), 
                console.log("Annoyances hidden (Suggested for you)"), e.style = "display:none!important;");
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > span\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': () => {
        new MutationObserver((function() {
            document.querySelectorAll('div[role="feed"] > span').forEach((function(e) {
                "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you") && (console.log("--------"), 
                console.log("Annoyances hidden (Suggested for you)"), e.style = "display:none!important;");
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("#ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SHOWCASE")||a.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.feedEdge?.category?.includes("FB_SHORTS")){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["SHOWCASE post blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        e = 0, t = [], new MutationObserver((function() {
            document.querySelectorAll('#ssrb_feed_start + div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class]:not([style*="display: none"])').forEach((function(n) {
                Object.keys(n).forEach((function(o) {
                    if (o.includes("__reactEvents") || o.includes("__reactProps")) {
                        o = n[o];
                        try {
                            if (o.children?.props?.category?.includes("SHOWCASE") || o.children?.props?.children?.props?.category?.includes("SHOWCASE") || o.children?.props?.children?.props?.feedEdge?.category?.includes("SHOWCASE") || o.children?.props?.category?.includes("FB_SHORTS") || o.children?.props?.children?.props?.category?.includes("FB_SHORTS") || o.children?.props?.children?.props?.feedEdge?.category?.includes("FB_SHORTS")) {
                                e++, n.style = "display: none !important;";
                                var i = n.querySelector("a[href][aria-label]:not([aria-hidden])");
                                i && (t.push([ "SHOWCASE post blocked based on property [" + e + "] -> " + i.ariaLabel ]), 
                                console.table(t));
                            }
                        } catch (o) {}
                    }
                }));
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
        var e, t;
    },
    "setInterval(function() { var el = document.querySelector('.howto-video video'); if (el) { el.pause(); el.src = ''; }}, 100);": () => {
        setInterval((function() {
            var e = document.querySelector(".howto-video video");
            if (e) {
                e.pause();
                e.src = "";
            }
        }), 100);
    },
    'document.addEventListener(\'DOMContentLoaded\', function(){setTimeout(function(){var a=document.querySelector(".onp-sl-content");if("function"===typeof jQuery&&"object"===typeof bizpanda.lockerOptions&&a)try{a=0;for(var c=Object.keys(bizpanda.lockerOptions);a<c.length;a++){var d=c[a];if(d.includes("onpLock")){var b=bizpanda.lockerOptions[d];b&&jQuery.ajax({url:b.ajaxUrl,method:"post",data:{lockerId:b.lockerId,action:"opanda_loader",hash:b.contentHash},success:function(a){var b=jQuery(".onp-sl-content"),c=jQuery(".onp-sl-social-locker"); b.append(a);b.css("display","block");c.css("display","none")}})}}}catch(e){}},1E3)});': () => {
        document.addEventListener("DOMContentLoaded", (function() {
            setTimeout((function() {
                var e = document.querySelector(".onp-sl-content");
                if ("function" == typeof jQuery && "object" == typeof bizpanda.lockerOptions && e) try {
                    e = 0;
                    for (var t = Object.keys(bizpanda.lockerOptions); e < t.length; e++) {
                        var n = t[e];
                        if (n.includes("onpLock")) {
                            var o = bizpanda.lockerOptions[n];
                            o && jQuery.ajax({
                                url: o.ajaxUrl,
                                method: "post",
                                data: {
                                    lockerId: o.lockerId,
                                    action: "opanda_loader",
                                    hash: o.contentHash
                                },
                                success: function(e) {
                                    var t = jQuery(".onp-sl-content"), n = jQuery(".onp-sl-social-locker");
                                    t.append(e);
                                    t.css("display", "block");
                                    n.css("display", "none");
                                }
                            });
                        }
                    }
                } catch (e) {}
            }), 1e3);
        }));
    },
    '(async()=>{if(location.href.includes("?slid="))try{const t=new URLSearchParams(location.search).get("slid");if(!t||!t.length)return;const a=await fetch(`https://hotmediahub.com/shorturl/getoriginurl?&surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': () => {
        (async () => {
            if (location.href.includes("?slid=")) try {
                const e = new URLSearchParams(location.search).get("slid");
                if (!e || !e.length) return;
                const t = await fetch(`https://hotmediahub.com/shorturl/getoriginurl?&surl_key=${e}`), n = await t.json();
                n?.data?.origin_url && n.data.origin_url.startsWith("http") && location.assign(n.data.origin_url);
            } catch (e) {
                console.debug(e);
            }
        })();
    },
    '(async()=>{if(location.href.includes("/slmiddlepage/"))try{const t=location.href.split("/").at(-1);if(!t.length)return;const a=await fetch(`https://terabox.fun/api/shortlink/getoriginurl?&encrypt_surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': () => {
        (async () => {
            if (location.href.includes("/slmiddlepage/")) try {
                const e = location.href.split("/").at(-1);
                if (!e.length) return;
                const t = await fetch(`https://terabox.fun/api/shortlink/getoriginurl?&encrypt_surl_key=${e}`), n = await t.json();
                n?.data?.origin_url && n.data.origin_url.startsWith("http") && location.assign(n.data.origin_url);
            } catch (e) {
                console.debug(e);
            }
        })();
    },
    '(async()=>{if(location.href.includes("/sl/"))try{const t=location.href.split("/").at(-1);if(!t.length)return;const a=await fetch(`https://terabox.fun/shorturl/getoriginurl?&surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': () => {
        (async () => {
            if (location.href.includes("/sl/")) try {
                const e = location.href.split("/").at(-1);
                if (!e.length) return;
                const t = await fetch(`https://terabox.fun/shorturl/getoriginurl?&surl_key=${e}`), n = await t.json();
                n?.data?.origin_url && n.data.origin_url.startsWith("http") && location.assign(n.data.origin_url);
            } catch (e) {
                console.debug(e);
            }
        })();
    },
    '(function(){try{var a=location.href.split("/#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        !function() {
            try {
                var e = location.href.split("/#");
                if (e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) {
                        e = atob(e);
                        try {
                            new URL(decodeURIComponent(e));
                            var n = !0;
                        } catch (e) {
                            n = !1;
                        }
                        if (n) try {
                            location.assign(decodeURIComponent(e));
                            break;
                        } catch (e) {}
                    }
                }
            } catch (e) {}
        }();
    },
    '(function(){if(location.href.includes("/aHR0c"))try{let a=location.href.substring(location.href.indexOf("aHR0c"));a=atob(a),location.assign(decodeURIComponent(a))}catch(a){}})();': () => {
        !function() {
            if (location.href.includes("/aHR0c")) try {
                let e = location.href.substring(location.href.indexOf("aHR0c"));
                e = atob(e), location.assign(decodeURIComponent(e));
            } catch (e) {}
        }();
    },
    '(()=>{if(location.href.includes("?s=http")){const a=location.href.split("?s=").slice(1);try{location.assign(a)}catch(a){}}})();': () => {
        (() => {
            if (location.href.includes("?s=http")) {
                const e = location.href.split("?s=").slice(1);
                try {
                    location.assign(e);
                } catch (e) {}
            }
        })();
    },
    '!function(){if(location.href.includes("wpsafelink")){var e=new MutationObserver((function(){try{var t=document.querySelector(\'form#landing > input[name="go"][value]\'),n=document.querySelector("body > script");t&&t.value.startsWith("aHR0c")&&n&&n.textContent.includes("document.getElementById(\'landing\').submit();")&&(n.remove(),e.disconnect(),location.assign(atob(t.value)))}catch(e){}}));e.observe(document,{childList:!0,subtree:!0}),setTimeout((function(){e.disconnect()}),1e4)}}();': () => {
        !function() {
            if (location.href.includes("wpsafelink")) {
                var e = new MutationObserver((function() {
                    try {
                        var t = document.querySelector('form#landing > input[name="go"][value]'), n = document.querySelector("body > script");
                        t && t.value.startsWith("aHR0c") && n && n.textContent.includes("document.getElementById('landing').submit();") && (n.remove(), 
                        e.disconnect(), location.assign(atob(t.value)));
                    } catch (e) {}
                }));
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                }), setTimeout((function() {
                    e.disconnect();
                }), 1e4);
            }
        }();
    },
    '!function(){if(-1<location.href.indexOf("?data=aHR0c")){var a=(new URL(window.location.href)).searchParams.get("data");if(a)try{window.location.assign(atob(a))}catch(b){}}}();': () => {
        !function() {
            if (-1 < location.href.indexOf("?data=aHR0c")) {
                var e = new URL(window.location.href).searchParams.get("data");
                if (e) try {
                    window.location.assign(atob(e));
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<location.href.indexOf("?wpsafelink=http")){var a=(new URL(window.location.href)).searchParams.get("wpsafelink");if(a)try{window.location.assign(a)}catch(b){}}}();': () => {
        !function() {
            if (-1 < location.href.indexOf("?wpsafelink=http")) {
                var e = new URL(window.location.href).searchParams.get("wpsafelink");
                if (e) try {
                    window.location.assign(e);
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/?go=")){var a=location.href.split("?go=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/?go=")) {
                var e = location.href.split("?go=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/?redirect=aHR0c")){var a=location.href.split("/?redirect=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/?redirect=aHR0c")) {
                var e = location.href.split("/?redirect=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<location.href.indexOf("?data=")){var b=(new URL(window.location.href)).searchParams.get("data");if(b)try{var a=atob(b);a=a.split("&ulink=")[1];a.startsWith("http")&&window.location.assign(a)}catch(c){}}}();': () => {
        !function() {
            if (-1 < location.href.indexOf("?data=")) {
                var e = new URL(window.location.href).searchParams.get("data");
                if (e) try {
                    var t = atob(e);
                    (t = t.split("&ulink=")[1]).startsWith("http") && window.location.assign(t);
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=aHR0c")){var a=location.href.split("/?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/?r=aHR0c")) {
                var e = location.href.split("/?r=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '(function(){if(location.href.includes("/to/aHR0c"))try{var a=location.href.split("/to/");a=atob(a[1]).split("url=");location=decodeURIComponent(a[1])}catch(b){}})();': () => {
        !function() {
            if (location.href.includes("/to/aHR0c")) try {
                var e = location.href.split("/to/");
                e = atob(e[1]).split("url=");
                location = decodeURIComponent(e[1]);
            } catch (e) {}
        }();
    },
    '(function(){"function"===typeof fetch&&location.href.includes("/?id=")&&fetch(location.href).then(function(e){e.headers.forEach(function(a,f){if("refresh"===f&&a.includes("url=http"))try{if(a.includes("&url=aHR0c")){var b,c=null==(b=a.split(/&url=/))?void 0:b[1];location=atob(c)}else{var d;location=c=null==(d=a.split(/url=(.+)/))?void 0:d[1]}}catch(g){}})})})();': () => {
        "function" == typeof fetch && location.href.includes("/?id=") && fetch(location.href).then((function(e) {
            e.headers.forEach((function(e, t) {
                if ("refresh" === t && e.includes("url=http")) try {
                    if (e.includes("&url=aHR0c")) {
                        var n, o = null == (n = e.split(/&url=/)) ? void 0 : n[1];
                        location = atob(o);
                    } else {
                        var i;
                        location = o = null == (i = e.split(/url=(.+)/)) ? void 0 : i[1];
                    }
                } catch (e) {}
            }));
        }));
    },
    '!function(){if(-1<window.location.href.indexOf("out/?aHR0c")){var a=location.href.split("out/?");if(a&&a[1])try{window.location=atob(decodeURIComponent(a[1]))}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("out/?aHR0c")) {
                var e = location.href.split("out/?");
                if (e && e[1]) try {
                    window.location = atob(decodeURIComponent(e[1]));
                } catch (e) {}
            }
        }();
    },
    '!function(){if(window.location.href.includes("api")&&window.location.href.includes("&url=")){var b=location.href.split("&url=")[1];a:{try{var a=new URL(b)}catch(c){a=!1;break a}a="http:"===a.protocol||"https:"===a.protocol}if(a)try{window.location=b}catch(c){}}}();': () => {
        !function() {
            if (window.location.href.includes("api") && window.location.href.includes("&url=")) {
                var e = location.href.split("&url=")[1];
                e: {
                    try {
                        var t = new URL(e);
                    } catch (e) {
                        t = !1;
                        break e;
                    }
                    t = "http:" === t.protocol || "https:" === t.protocol;
                }
                if (t) try {
                    window.location = e;
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/download.php?")&&-1<window.location.href.indexOf("link=aHR0c")){var a=location.href.split("link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/download.php?") && -1 < window.location.href.indexOf("link=aHR0c")) {
                var e = location.href.split("link=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const a=function(a){const b=new DOMParser().parseFromString(a,"text/html");return b.documentElement.textContent},b=function(){if("object"==typeof _sharedData&&"string"==typeof _sharedData[0]?.destination){const b=a(_sharedData[0].destination);if(b.startsWith("http"))try{window.location=b}catch(a){}}};if(window._sharedData)b();else{const a=new MutationObserver(function(){window._sharedData&&(a.disconnect(),b())});a.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){a.disconnect()},1E4)}})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            const e = function() {
                if ("object" == typeof _sharedData && "string" == typeof _sharedData[0]?.destination) {
                    const e = function(e) {
                        return (new DOMParser).parseFromString(e, "text/html").documentElement.textContent;
                    }(_sharedData[0].destination);
                    if (e.startsWith("http")) try {
                        window.location = e;
                    } catch (e) {}
                }
            };
            if (window._sharedData) e(); else {
                const t = new MutationObserver((function() {
                    window._sharedData && (t.disconnect(), e());
                }));
                t.observe(document, {
                    childList: !0,
                    subtree: !0
                }), setTimeout((function() {
                    t.disconnect();
                }), 1e4);
            }
        }));
    },
    '!function(){if(-1<window.location.href.indexOf(".html?url=aHR0c")){var a=location.href.split(".html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf(".html?url=aHR0c")) {
                var e = location.href.split(".html?url=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<location.href.indexOf("/aHR0c")){var a=location.href.split("/").pop();if(a&&a.includes("aHR0c"))try{location=decodeURIComponent(atob(a))}catch(b){}}}();': () => {
        !function() {
            if (-1 < location.href.indexOf("/aHR0c")) {
                var e = location.href.split("/").pop();
                if (e && e.includes("aHR0c")) try {
                    location = decodeURIComponent(atob(e));
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/gotothedl.html?url=")){var a=location.href.split("/gotothedl.html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/gotothedl.html?url=")) {
                var e = location.href.split("/gotothedl.html?url=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/link/?link=aHR0c")){var a=location.href.split("/link/?link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/link/?link=aHR0c")) {
                var e = location.href.split("/link/?link=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    "!function(){if(-1<location.search.indexOf(\"=redirect&href=\")){var url=new URL(window.location.href); var dest=url.searchParams.get('href'); if(dest){location=dest;}}}();": () => {
        !function() {
            if (-1 < location.search.indexOf("=redirect&href=")) {
                var e = new URL(window.location.href).searchParams.get("href");
                e && (location = e);
            }
        }();
    },
    '!function(){if(-1<location.pathname.indexOf("/view.php")){var a=(new URL(window.location.href)).searchParams.get("id");if(a&&-1==document.cookie.indexOf(a))try{document.cookie=a+"=user; path=/;";location.reload();}catch(b){}}}();': () => {
        !function() {
            if (-1 < location.pathname.indexOf("/view.php")) {
                var e = new URL(window.location.href).searchParams.get("id");
                if (e && -1 == document.cookie.indexOf(e)) try {
                    document.cookie = e + "=user; path=/;";
                    location.reload();
                } catch (e) {}
            }
        }();
    },
    '(function(){-1==document.cookie.indexOf("exUserId")&&(document.cookie="exUserId=1; domain=.4shared.com; path=/;")})();': () => {
        -1 == document.cookie.indexOf("exUserId") && (document.cookie = "exUserId=1; domain=.4shared.com; path=/;");
    },
    '!function(){if(-1<location.pathname.indexOf("/redirect")){var a=(new URL(window.location.href)).searchParams.get("to");if(a)try{window.location=atob(a)}catch(b){}}}();': () => {
        !function() {
            if (-1 < location.pathname.indexOf("/redirect")) {
                var e = new URL(window.location.href).searchParams.get("to");
                if (e) try {
                    window.location = atob(e);
                } catch (e) {}
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("?url=")){var a=location.href.split("?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("?url=")) {
                var e = location.href.split("?url=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1<location.pathname.indexOf("/go/")){var b=new MutationObserver(function(){if(document.querySelector("#get_link_btn"))try{[].slice.call(document.getElementsByTagName("script")).some(function(a){a.text.match(/goToUrl \\("/)&&(a=a.text.split(/goToUrl \\("([\\s\\S]*?)"\\);/),location=a[1])})}catch(a){}});b.observe(document,{childList:!0,subtree:!0});setTimeout(function(){b.disconnect()},1E4)}})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            if (-1 < location.pathname.indexOf("/go/")) {
                var e = new MutationObserver((function() {
                    if (document.querySelector("#get_link_btn")) try {
                        [].slice.call(document.getElementsByTagName("script")).some((function(e) {
                            e.text.match(/goToUrl \("/) && (e = e.text.split(/goToUrl \("([\s\S]*?)"\);/), location = e[1]);
                        }));
                    } catch (e) {}
                }));
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
                setTimeout((function() {
                    e.disconnect();
                }), 1e4);
            }
        }));
    },
    "document.addEventListener('DOMContentLoad', function() { setTimeout(function() { second = 0; }, 300); });": () => {
        document.addEventListener("DOMContentLoad", (function() {
            setTimeout((function() {
                second = 0;
            }), 300);
        }));
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=")){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/?r=")) {
                var e = location.href.split("?r=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/removeAttr\\('disabled'\\)/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        e = window.setInterval, window.setInterval = function(t, n) {
            return 1e3 === n && /removeAttr\('disabled'\)/.test(t.toString()) && (n *= .01), 
            e.apply(this, arguments);
        }.bind(window);
        var e;
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt(window.location.href.split("#?o=")[1].replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            setTimeout((function() {
                if ("undefined" != typeof aesCrypto && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("#?o=")) try {
                    window.location = aesCrypto.decrypt(window.location.href.split("#?o=")[1].replace(/^\s+/, "").replace(/\s+$/, ""), "root".replace(/^\s+/, "").replace(/\s+$/, ""));
                } catch (e) {}
            }), 300);
        }));
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt($.urlParam("o").replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            setTimeout((function() {
                if ("undefined" != typeof aesCrypto && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("#?o=")) try {
                    window.location = aesCrypto.decrypt($.urlParam("o").replace(/^\s+/, "").replace(/\s+$/, ""), "root".replace(/^\s+/, "").replace(/\s+$/, ""));
                } catch (e) {}
            }), 300);
        }));
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("function"===typeof convertstr&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("html#?o="))try{window.location=aesCrypto.decrypt(convertstr($.urlParam("o")),convertstr("root"))}catch(a){}},300)})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            setTimeout((function() {
                if ("function" == typeof convertstr && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("html#?o=")) try {
                    window.location = aesCrypto.decrypt(convertstr($.urlParam("o")), convertstr("root"));
                } catch (e) {}
            }), 300);
        }));
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/'#timer'/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        e = window.setInterval, window.setInterval = function(t, n) {
            return 1e3 === n && /'#timer'/.test(t.toString()) && (n *= .01), e.apply(this, arguments);
        }.bind(window);
        var e;
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return g===1e3&&/TheLink/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            return 1e3 === n && /TheLink/.test(t.toString()) && (n *= .01), e.apply(this, arguments);
        }.bind(window);
        var e;
    },
    '(()=>{const a=new MutationObserver(function(){const b=document.querySelector("script[src^=\\"/assets/js/unlock.js\\"]");if(b){a.disconnect();let c;for(let a of b.attributes)if(a.textContent.includes("aHR0c")){c=a.textContent;break}c&&setTimeout(function(){location.assign(atob(c))},500)}});a.observe(document,{childList:!0,subtree:!0})})();': () => {
        (() => {
            const e = new MutationObserver((function() {
                const t = document.querySelector('script[src^="/assets/js/unlock.js"]');
                if (t) {
                    e.disconnect();
                    let n;
                    for (let e of t.attributes) if (e.textContent.includes("aHR0c")) {
                        n = e.textContent;
                        break;
                    }
                    n && setTimeout((function() {
                        location.assign(atob(n));
                    }), 500);
                }
            }));
            e.observe(document, {
                childList: !0,
                subtree: !0
            });
        })();
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1!==window.location.href.indexOf("onet.pl/?utm_source=")){const o=new MutationObserver(function(){var e=document.querySelector(\'a[href][onclick*="Nitro_clickmore"][onclick*="czytaj_wiecej"], a[href][class^="NitroCard_sectionLink_"], article[class^="NitroCard_nitroCard__"] > a[href][class^="Common_sectionLink__"]:not([href^="undefined"])\');e&&(o.disconnect(),location.replace(e.href))});o.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){o.disconnect()},1e4)}})})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            if (-1 !== window.location.href.indexOf("onet.pl/?utm_source=")) {
                const e = new MutationObserver((function() {
                    var t = document.querySelector('a[href][onclick*="Nitro_clickmore"][onclick*="czytaj_wiecej"], a[href][class^="NitroCard_sectionLink_"], article[class^="NitroCard_nitroCard__"] > a[href][class^="Common_sectionLink__"]:not([href^="undefined"])');
                    t && (e.disconnect(), location.replace(t.href));
                }));
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                }), setTimeout((function() {
                    e.disconnect();
                }), 1e4);
            }
        }));
    },
    "!function(){if(-1<location.pathname.indexOf(\"/pushredirect/\")){var url=new URL(window.location.href); var dest=url.searchParams.get('dest'); if(dest){location=dest;}}}();": () => {
        !function() {
            if (-1 < location.pathname.indexOf("/pushredirect/")) {
                var e = new URL(window.location.href).searchParams.get("dest");
                e && (location = e);
            }
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("dynamic?r=")&&!/https?:\\/\\/(www\\.)?h-gen\\.xyz\\//.test(document.referrer)){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("dynamic?r=") && !/https?:\/\/(www\.)?h-gen\.xyz\//.test(document.referrer)) {
                var e = location.href.split("?r=");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    "!function(){const t={apply:(t,e,n)=>{const a=Reflect.apply(t,e,n);return a?.data?.getDetailPageContent?.linkCustomAdOffers&&(a.data.getDetailPageContent.linkCustomAdOffers=[]),a}};window.JSON.parse=new Proxy(window.JSON.parse,t)}();": () => {
        !function() {
            const e = {
                apply: (e, t, n) => {
                    const o = Reflect.apply(e, t, n);
                    return o?.data?.getDetailPageContent?.linkCustomAdOffers && (o.data.getDetailPageContent.linkCustomAdOffers = []), 
                    o;
                }
            };
            window.JSON.parse = new Proxy(window.JSON.parse, e);
        }();
    },
    "(() => {document.addEventListener(\"DOMContentLoaded\", (() => {setTimeout(function() { if(typeof player.pause != 'undefined') { player.pause(); } }, 3000);}));})();": () => {
        document.addEventListener("DOMContentLoaded", (() => {
            setTimeout((function() {
                void 0 !== player.pause && player.pause();
            }), 3e3);
        }));
    },
    '(function(){var a="http"+(new URL(window.location.href)).searchParams.get("xurl");try{new URL(a);var b=!0}catch(c){b=!1}if(b)try{window.location=a}catch(c){}})();': () => {
        !function() {
            var e = "http" + new URL(window.location.href).searchParams.get("xurl");
            try {
                new URL(e);
                var t = !0;
            } catch (e) {
                t = !1;
            }
            if (t) try {
                window.location = e;
            } catch (e) {}
        }();
    },
    "window.self = window.top;": () => {
        window.self = window.top;
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0);': () => {
        window.addEventListener("contextmenu", (function(e) {
            e.stopPropagation();
        }), !0);
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{var b=document.getElementById("sm_dl_wait");if(b){var c=document.createElement("a");c.setAttribute("href",b.getAttribute("data-id"));c.innerHTML="<b>"+("function"==typeof window.a?IMSLPGetMsg("js-s"):"Click here to continue your download.")+"</b>";var d=document.createElement("style");d.innerHTML="#sm_dl_wait{display:none!important;}";b.parentNode.insertBefore(c,b);b.parentNode.insertBefore(d,b)}}));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            var e = document.getElementById("sm_dl_wait");
            if (e) {
                var t = document.createElement("a");
                t.setAttribute("href", e.getAttribute("data-id"));
                t.innerHTML = "<b>" + ("function" == typeof window.a ? IMSLPGetMsg("js-s") : "Click here to continue your download.") + "</b>";
                var n = document.createElement("style");
                n.innerHTML = "#sm_dl_wait{display:none!important;}";
                e.parentNode.insertBefore(t, e);
                e.parentNode.insertBefore(n, e);
            }
        }));
    },
    '(()=>{["contextmenu","copy","selectstart"].forEach((o=>{window.addEventListener(o,(o=>{o.stopPropagation()}),!0)}));})();': () => {
        [ "contextmenu", "copy", "selectstart" ].forEach((e => {
            window.addEventListener(e, (e => {
                e.stopPropagation();
            }), !0);
        }));
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0); window.addEventListener("copy",function(a){a.stopPropagation()},!0);': () => {
        window.addEventListener("contextmenu", (function(e) {
            e.stopPropagation();
        }), !0);
        window.addEventListener("copy", (function(e) {
            e.stopPropagation();
        }), !0);
    },
    "Object.defineProperties(window,{sccopytext:{value:function(){}},add_message_to_copied_text:{value:function(){}}});Object.defineProperties(document,{onkeydown:{value:function(){}},onkeypress:{value:function(){}}});": () => {
        Object.defineProperties(window, {
            sccopytext: {
                value: function() {}
            },
            add_message_to_copied_text: {
                value: function() {}
            }
        });
        Object.defineProperties(document, {
            onkeydown: {
                value: function() {}
            },
            onkeypress: {
                value: function() {}
            }
        });
    },
    "(function(){z=self.EventTarget.prototype.addEventListener;self.EventTarget.prototype.addEventListener=function(a,b){if(!/cut|copy|paste/.test(a.toString()))return z.apply(this,arguments)}})();": () => {
        !function() {
            z = self.EventTarget.prototype.addEventListener;
            self.EventTarget.prototype.addEventListener = function(e, t) {
                if (!/cut|copy|paste/.test(e.toString())) return z.apply(this, arguments);
            };
        }();
    },
    '(function(){const b=function(d){const a=Math.pow(10,d-1),b=Math.pow(10,d);return Math.floor(Math.random()*(b-a)+a)}(12);window.addEventListener("load",function(){window.google_image_requests=[],window.google_global_correlator=b,window._hmt=window._hmt||[],_hmt.id=b})})();': () => {
        !function() {
            const e = function() {
                const e = Math.pow(10, 11), t = Math.pow(10, 12);
                return Math.floor(Math.random() * (t - e) + e);
            }();
            window.addEventListener("load", (function() {
                window.google_image_requests = [], window.google_global_correlator = e, window._hmt = window._hmt || [], 
                _hmt.id = e;
            }));
        }();
    },
    'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError(/^(?!.*(rt-error.js)).*$/);': () => {
        e = /^(?!.*(rt-error.js)).*$/, window.addEventListener("error", (function(t) {
            t.srcElement && t.srcElement.src && new RegExp(e).test(t.srcElement.src) && (t.srcElement.onerror = function() {});
        }), !0);
        var e;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/myaaqqbpfun12\\(\\)/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/myaaqqbpfun12\(\)/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "window.ad = window.ads = window.dzad = window.dzads = true;": () => {
        window.ad = window.ads = window.dzad = window.dzads = !0;
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Adblock/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/Adblock/.test(t.toString())) return e(t, n);
        };
        var e;
    },
    "(function(){window._czc={push:function(){}}})();": () => {
        window._czc = {
            push: function() {}
        };
    },
    "(()=>{let e=!1;window.qyMesh=window.qyMesh||{},window.qyMesh=new Proxy(window.qyMesh,{get:function(a,t,d){return!e&&a?.preload?.Page_recommend_1?.response?.items&&(a.preload.Page_recommend_1.response.items.forEach((e=>{e.extData?.dataExtAd&&(e.extData.dataExtAd={}),e.video&&e.video.forEach((e=>{e.adverts&&(e.adverts=[]),e.data&&(e.data=e.data.filter((e=>!e.ad)))}))})),e=!0),Reflect.get(a,t,d)}})})();": () => {
        (() => {
            let e = !1;
            window.qyMesh = window.qyMesh || {}, window.qyMesh = new Proxy(window.qyMesh, {
                get: function(t, n, o) {
                    return !e && t?.preload?.Page_recommend_1?.response?.items && (t.preload.Page_recommend_1.response.items.forEach((e => {
                        e.extData?.dataExtAd && (e.extData.dataExtAd = {}), e.video && e.video.forEach((e => {
                            e.adverts && (e.adverts = []), e.data && (e.data = e.data.filter((e => !e.ad)));
                        }));
                    })), e = !0), Reflect.get(t, n, o);
                }
            });
        })();
    },
    '(function(){window.eval=new Proxy(eval,{apply:(e,c,n)=>{const o=Reflect.apply(e,c,n);if("object"==typeof o&&o.banners)try{o.banners.forEach(((e,c)=>{e.commercial&&(e.commercial={})}))}catch(e){console.debug(e)}return o}})})();': () => {
        (function() {
            window.eval = new Proxy(eval, {
                apply: (e, t, n) => {
                    const o = Reflect.apply(e, t, n);
                    if ("object" == typeof o && o.banners) try {
                        o.banners.forEach(((e, t) => {
                            e.commercial && (e.commercial = {});
                        }));
                    } catch (e) {
                        console.debug(e);
                    }
                    return o;
                }
            });
        })();
    },
    'AG_onLoad(() => { var BuildObs, PlayerObs; let PlayerCall = (mutationList, observer) => { mutationList.forEach((e) => { if (Array.from(e.target.classList).some((e) => { return e === "ntv-ad-playing" })) { player.trigger("adended"); PlayerObs.disconnect() }})}; let BuildCall = (mutationList, observer) => { mutationList.forEach((e) => { Array.from(e.addedNodes).filter((o) => { return o.id === "natePlayer" }).forEach((k) => { PlayerObs = new MutationObserver(PlayerCall); PlayerObs.observe(k, { attributes: true }); BuildObs.disconnect() })})}; BuildObs = new MutationObserver(BuildCall); BuildObs.observe(document.querySelector(".player-wrapper"), { childList: true }) })': () => {
        AG_onLoad((() => {
            var e, t;
            let n = (e, n) => {
                e.forEach((e => {
                    if (Array.from(e.target.classList).some((e => "ntv-ad-playing" === e))) {
                        player.trigger("adended");
                        t.disconnect();
                    }
                }));
            };
            (e = new MutationObserver(((o, i) => {
                o.forEach((o => {
                    Array.from(o.addedNodes).filter((e => "natePlayer" === e.id)).forEach((o => {
                        (t = new MutationObserver(n)).observe(o, {
                            attributes: !0
                        });
                        e.disconnect();
                    }));
                }));
            }))).observe(document.querySelector(".player-wrapper"), {
                childList: !0
            });
        }));
    },
    "AG_onLoad(() => { Array.from(document.querySelectorAll(\"a[href*='dealbada.com/bbs/link']\")).forEach((e) => { e.href = e.innerText })})": () => {
        AG_onLoad((() => {
            Array.from(document.querySelectorAll("a[href*='dealbada.com/bbs/link']")).forEach((e => {
                e.href = e.innerText;
            }));
        }));
    },
    'AG_onLoad(() => { if (document.querySelector("input#SearchTermAdTxt").value === "") { document.querySelector("input#SearchProductKey").value = ""; document.querySelector("input.m_gnb_search_input").value = ""; } })();': () => {
        AG_onLoad((() => {
            if ("" === document.querySelector("input#SearchTermAdTxt").value) {
                document.querySelector("input#SearchProductKey").value = "";
                document.querySelector("input.m_gnb_search_input").value = "";
            }
        }))();
    },
    'AG_onLoad(() => { if (document.querySelector("input[name=SearchProductKey]").value === "") { document.querySelector("input#HeadSearchKeyword").value = ""; document.querySelector("input#fixedSearchKeyword").value = ""; } })();': () => {
        AG_onLoad((() => {
            if ("" === document.querySelector("input[name=SearchProductKey]").value) {
                document.querySelector("input#HeadSearchKeyword").value = "";
                document.querySelector("input#fixedSearchKeyword").value = "";
            }
        }))();
    },
    'AG_onLoad(() => { Array.from(document.querySelectorAll(".market-info-view-wrap table.market-info-view-table tbody > tr")).filter(element => element.querySelector("th").innerText === "링크" ).forEach((element) => { element.querySelector("td > a").href = element.querySelector("td > a").innerText; })})();': () => {
        AG_onLoad((() => {
            Array.from(document.querySelectorAll(".market-info-view-wrap table.market-info-view-table tbody > tr")).filter((e => "링크" === e.querySelector("th").innerText)).forEach((e => {
                e.querySelector("td > a").href = e.querySelector("td > a").innerText;
            }));
        }))();
    },
    "setTimeout(function() { var el = document.querySelector('input[name=\"dfp\"]'); if(el){el.value = '1234567890123456';} }, 300);": () => {
        setTimeout((function() {
            var e = document.querySelector('input[name="dfp"]');
            e && (e.value = "1234567890123456");
        }), 300);
    },
    "(()=>{const n=function(){};window.pa={avInsights:{Media:function(){return{set:n}}},setConfigurations:n,sendEvent:n,refresh:n,getVisitorId:n}})();": () => {
        (() => {
            const e = function() {};
            window.pa = {
                avInsights: {
                    Media: function() {
                        return {
                            set: e
                        };
                    }
                },
                setConfigurations: e,
                sendEvent: e,
                refresh: e,
                getVisitorId: e
            };
        })();
    },
    '(()=>{window.analytics=[],analytics.user=function(){return this},analytics.track=function(){},analytics.anonymousId=function(){},analytics.push=function(){[...arguments].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}Array.isArray(n)&&[...n].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}}))}))};})();': () => {
        window.analytics = [], analytics.user = function() {
            return this;
        }, analytics.track = function() {}, analytics.anonymousId = function() {}, analytics.push = function() {
            [ ...arguments ].forEach((e => {
                if ("function" == typeof e) try {
                    e();
                } catch (e) {
                    console.debug(e);
                }
                Array.isArray(e) && [ ...e ].forEach((e => {
                    if ("function" == typeof e) try {
                        e();
                    } catch (e) {
                        console.debug(e);
                    }
                }));
            }));
        };
    },
    '(()=>{window.ga=function(){const a=arguments.length;if(0===a)return;const b=arguments[a-1];let c;b instanceof Object&&null!==b&&"function"==typeof b.hitCallback?c=b.hitCallback:"function"==typeof b&&(c=()=>{b(ga.create())});try{setTimeout(c,1)}catch(a){}}})();': () => {
        window.ga = function() {
            const e = arguments.length;
            if (0 === e) return;
            const t = arguments[e - 1];
            let n;
            t instanceof Object && null !== t && "function" == typeof t.hitCallback ? n = t.hitCallback : "function" == typeof t && (n = () => {
                t(ga.create());
            });
            try {
                setTimeout(n, 1);
            } catch (e) {}
        };
    },
    "(()=>{const t={getExperimentStates:function(){return[]}};window.optimizely={get:function(){return t}}})();": () => {
        (() => {
            const e = {
                getExperimentStates: function() {
                    return [];
                }
            };
            window.optimizely = {
                get: function() {
                    return e;
                }
            };
        })();
    },
    '(()=>{window.admiral=function(d,a,b){if("function"==typeof b)try{b({})}catch(a){}}})();': () => {
        window.admiral = function(e, t, n) {
            if ("function" == typeof n) try {
                n({});
            } catch (t) {}
        };
    },
    "(()=>{window.google_optimize={get(){}}})();": () => {
        window.google_optimize = {
            get() {}
        };
    },
    "(()=>{window.tC={event:{track(){}}}})();": () => {
        window.tC = {
            event: {
                track() {}
            }
        };
    },
    "(()=>{window.CQ_Analytics={SegmentMgr:{loadSegments(){}},ClientContextUtils:{init(){}}}})();": () => {
        window.CQ_Analytics = {
            SegmentMgr: {
                loadSegments() {}
            },
            ClientContextUtils: {
                init() {}
            }
        };
    },
    "(function(){window.DD_LOGS={onReady:function(){},logger:{log:function(){}}}})();": () => {
        window.DD_LOGS = {
            onReady: function() {},
            logger: {
                log: function() {}
            }
        };
    },
    'AG_defineProperty("navigator.getBattery",{value:function(){return Promise.resolve({addEventListener:EventTarget.prototype.addEventListener.bind(window),removeEventListener:EventTarget.prototype.removeEventListener.bind(window),dispatchEvent:EventTarget.prototype.dispatchEvent.bind(window),charging:!0})}});': () => {
        AG_defineProperty("navigator.getBattery", {
            value: function() {
                return Promise.resolve({
                    addEventListener: EventTarget.prototype.addEventListener.bind(window),
                    removeEventListener: EventTarget.prototype.removeEventListener.bind(window),
                    dispatchEvent: EventTarget.prototype.dispatchEvent.bind(window),
                    charging: !0
                });
            }
        });
    },
    "(function(){window.swua={swEvent:function(){}}})();": () => {
        window.swua = {
            swEvent: function() {}
        };
    },
    "!function(){window.pSUPERFLY={virtualPage:function(){}};}();": () => {
        window.pSUPERFLY = {
            virtualPage: function() {}
        };
    },
    'new MutationObserver(function(){var t=["?fbclid","%3Ffbclid","&fbclid","%26fbclid","&__tn__","%__26tn__","%3Futm","?utm","&fbc=","%26fbc%3D","?share=","%3Fshare%3D","%3F__twitter_impression%3D","?__twitter_impression=","?wtmc=","%3Fwtmc%3D","?originalReferrer=","%3ForiginalReferrer%3D","?wtrid=","%3Fwtrid%3D","?trbo=","%3Ftrbo%3D","?GEPC=","%3FGEPC%3D","?whatsapp=","%3Fwhatsapp%3D","?fbc=","%3Ffbc%3D","?dmcid=","%3Fdmcid%3D"];document.querySelectorAll(\'a[target="_blank"]\').forEach(function(e){for(i=0;i<t.length;i++){var r;e.href.includes(t[i])&&(r=(r=(r=e.href.split("#!")[1])||e.href.split("%23%21")[1])||"",e.href.includes("#!")&&(r="#!"+r),e.href.includes("%23%21")&&(r="%23%21"+r),r=(r=(r=e.href.split("&feature=share&")[1])||e.href.split("%26feature%3Dshare%26")[1])||"",e.href.includes("&feature=share&")&&(r="?"+r),e.href.includes("%26feature%3Dshare%26")&&(r="%3F"+r),r=(r=(r=e.href.split("&h=")[1])||e.href.split("%26h%3D")[1])||"",e.href.includes("&h=")&&(r="&h="+r),e.href.includes("%26h%3D")&&(r="%26h%3D"+r),e.setAttribute("href",e.href.split(t[i])[0]+r))}})}).observe(document,{childList:!0,subtree:!0});': () => {
        new MutationObserver((function() {
            var e = [ "?fbclid", "%3Ffbclid", "&fbclid", "%26fbclid", "&__tn__", "%__26tn__", "%3Futm", "?utm", "&fbc=", "%26fbc%3D", "?share=", "%3Fshare%3D", "%3F__twitter_impression%3D", "?__twitter_impression=", "?wtmc=", "%3Fwtmc%3D", "?originalReferrer=", "%3ForiginalReferrer%3D", "?wtrid=", "%3Fwtrid%3D", "?trbo=", "%3Ftrbo%3D", "?GEPC=", "%3FGEPC%3D", "?whatsapp=", "%3Fwhatsapp%3D", "?fbc=", "%3Ffbc%3D", "?dmcid=", "%3Fdmcid%3D" ];
            document.querySelectorAll('a[target="_blank"]').forEach((function(t) {
                for (i = 0; i < e.length; i++) {
                    var n;
                    t.href.includes(e[i]) && (n = (n = (n = t.href.split("#!")[1]) || t.href.split("%23%21")[1]) || "", 
                    t.href.includes("#!") && (n = "#!" + n), t.href.includes("%23%21") && (n = "%23%21" + n), 
                    n = (n = (n = t.href.split("&feature=share&")[1]) || t.href.split("%26feature%3Dshare%26")[1]) || "", 
                    t.href.includes("&feature=share&") && (n = "?" + n), t.href.includes("%26feature%3Dshare%26") && (n = "%3F" + n), 
                    n = (n = (n = t.href.split("&h=")[1]) || t.href.split("%26h%3D")[1]) || "", t.href.includes("&h=") && (n = "&h=" + n), 
                    t.href.includes("%26h%3D") && (n = "%26h%3D" + n), t.setAttribute("href", t.href.split(e[i])[0] + n));
                }
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    'new MutationObserver(function(){var t=["&eid=","%26eid%3D","?eid=","%3Feid%3D","?__tn__=","%3F%5F%5Ftn%5F%5F%3D","&__tn__=","%26%5F%5Ftn%5F%5F%3D","?source=","%3Fsource%3D","?__xts__","%3F%5F%5Fxts%5F%5F","&__xts__","%26%5F%5Fxts%5F%5F","&amp;__xts__%5B","?ref=","%3Fref%3D","?fref=","%3Ffref%3D","?epa=","%3Fepa%3D","&ifg=","%26ifg%3D","?comment_tracking=","%3Fcomment_tracking%3D","?av=","%3Fav%3D","&av=","%26av%3D","?acontext=","%3Facontext%3D","&session_id=","%26session_id%3D","&amp;session_id=","?hc_location=","%3Fhc_location%3D","&fref=","%26fref%3D","?__cft","%3f__cft"];document.querySelectorAll(\'a:not([target="_blank"]):not([href*="2fac/"])\').forEach(function(e){for(i=0;i<t.length;i++)e.href.includes(t[i])&&e.setAttribute("href",e.href.split(t[i])[0])})}).observe(document,{childList:!0,subtree:!0});': () => {
        new MutationObserver((function() {
            var e = [ "&eid=", "%26eid%3D", "?eid=", "%3Feid%3D", "?__tn__=", "%3F%5F%5Ftn%5F%5F%3D", "&__tn__=", "%26%5F%5Ftn%5F%5F%3D", "?source=", "%3Fsource%3D", "?__xts__", "%3F%5F%5Fxts%5F%5F", "&__xts__", "%26%5F%5Fxts%5F%5F", "&amp;__xts__%5B", "?ref=", "%3Fref%3D", "?fref=", "%3Ffref%3D", "?epa=", "%3Fepa%3D", "&ifg=", "%26ifg%3D", "?comment_tracking=", "%3Fcomment_tracking%3D", "?av=", "%3Fav%3D", "&av=", "%26av%3D", "?acontext=", "%3Facontext%3D", "&session_id=", "%26session_id%3D", "&amp;session_id=", "?hc_location=", "%3Fhc_location%3D", "&fref=", "%26fref%3D", "?__cft", "%3f__cft" ];
            document.querySelectorAll('a:not([target="_blank"]):not([href*="2fac/"])').forEach((function(t) {
                for (i = 0; i < e.length; i++) t.href.includes(e[i]) && t.setAttribute("href", t.href.split(e[i])[0]);
            }));
        })).observe(document, {
            childList: !0,
            subtree: !0
        });
    },
    "window.yaCounter27017517 ={ reachGoal: function() {} };": () => {
        window.yaCounter27017517 = {
            reachGoal: function() {}
        };
    },
    "navigator.getBattery = undefined;": () => {
        navigator.getBattery = void 0;
    },
    '(function() { window.Ya = window.Ya || {}; window.Ya.Metrika = function() { var a = function() {}; this.replacePhones = this.reachGoal = this.params = this.notBounce = this.hit = this.file = this.extLink = clickmap = trackLinks = this.addFileExtension = a }; var a = [], c = a.push; a.push = function(b) { a._init || "function" !== typeof b || (b(), a._init = !0); c.call(a, b) }; window.yandex_metrika_callbacks = a})();': () => {
        !function() {
            window.Ya = window.Ya || {};
            window.Ya.Metrika = function() {
                this.replacePhones = this.reachGoal = this.params = this.notBounce = this.hit = this.file = this.extLink = clickmap = trackLinks = this.addFileExtension = function() {};
            };
            var e = [], t = e.push;
            e.push = function(n) {
                e._init || "function" != typeof n || (n(), e._init = !0);
                t.call(e, n);
            };
            window.yandex_metrika_callbacks = e;
        }();
    },
    "var _gaq = []; var _gat = { _getTracker: function() { return { _initData: function(){}, _trackPageview: function(){}, _trackEvent: function(){}, _setAllowLinker: function() {}, _setCustomVar: function() {} } }, _createTracker: function() { return this._getTracker(); }, _anonymizeIp: function() {} };": () => {},
    "function urchinTracker() {};": () => {},
    "window.yaCounter9890803 = { reachGoal: function() {} };": () => {
        window.yaCounter9890803 = {
            reachGoal: function() {}
        };
    },
    "window.yaCounter14913877={ reachGoal: function() {} };": () => {
        window.yaCounter14913877 = {
            reachGoal: function() {}
        };
    },
    "window.ga = function(){var a = arguments[5];a&&a.hitCallback&&a.hitCallback();}": () => {
        window.ga = function() {
            var e = arguments[5];
            e && e.hitCallback && e.hitCallback();
        };
    },
    "window.ga = function() {};": () => {
        window.ga = function() {};
    },
    "window.google_trackConversion = function() {};": () => {
        window.google_trackConversion = function() {};
    },
    "(()=>{window.a2a={init(){}}})();": () => {
        window.a2a = {
            init() {}
        };
    },
    "var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {}, update: function() {}, toolbox: function() {}, layers: function() {} };": () => {},
    "twttr={events: { bind: function() {} }};": () => {
        twttr = {
            events: {
                bind: function() {}
            }
        };
    },
    "!function(){window.somtag={cmd:function(){}};}();": () => {
        window.somtag = {
            cmd: function() {}
        };
    },
    "window.werbeblocker = true;": () => {
        window.werbeblocker = !0;
    },
    "adet = false;": () => {
        adet = !1;
    },
    '(()=>{Object.defineProperty=new Proxy(Object.defineProperty,{apply:(a,b,c)=>{const[d,e,f]=c;return"createAdPlayer"===e&&"function"==typeof c[2]?.get&&(c[2].get=()=>{}),Reflect.apply(a,b,c)}})})();': () => {
        Object.defineProperty = new Proxy(Object.defineProperty, {
            apply: (e, t, n) => {
                const [o, i, a] = n;
                return "createAdPlayer" === i && "function" == typeof n[2]?.get && (n[2].get = () => {}), 
                Reflect.apply(e, t, n);
            }
        });
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e=".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': () => {
        window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, {
            apply: (e, t, n) => {
                const o = Reflect.apply(e, t, n), i = ".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";
                if ("adoptedStyleSheets" in document) {
                    const e = new CSSStyleSheet;
                    e.replaceSync(i), o.adoptedStyleSheets = [ e ];
                } else {
                    const e = document.createElement("style");
                    e.innerText = i, o.appendChild(e);
                }
                return o;
            }
        });
    },
    "(()=>{const t={construct:(t,n,e)=>{const o=n[0],r=o?.toString();return r&&r.length>500&&r.length<1e3&&/=>[\\s\\S]*?for[\\s\\S]*?\\[.+\\]/.test(r)&&(n[0]=()=>{}),Reflect.construct(t,n,e)}};window.MutationObserver=new Proxy(window.MutationObserver,t)})();": () => {
        (() => {
            const e = {
                construct: (e, t, n) => {
                    const o = t[0], i = o?.toString();
                    return i && i.length > 500 && i.length < 1e3 && /=>[\s\S]*?for[\s\S]*?\[.+\]/.test(i) && (t[0] = () => {}), 
                    Reflect.construct(e, t, n);
                }
            };
            window.MutationObserver = new Proxy(window.MutationObserver, e);
        })();
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{const o=[];[...document.scripts].forEach((c=>{const n=c.innerText,t=/window\\..*\\[\"(.*)\"]/;if(n.includes('\"impr\":')){const c=n.match(t)[1];o.push(c)}})),o.forEach((o=>{const c=document.querySelector(`.${o}`);c&&c.remove()}))})})();": () => {
        document.addEventListener("DOMContentLoaded", (() => {
            const e = [];
            [ ...document.scripts ].forEach((t => {
                const n = t.innerText, o = /window\..*\["(.*)"]/;
                if (n.includes('"impr":')) {
                    const t = n.match(o)[1];
                    e.push(t);
                }
            })), e.forEach((e => {
                const t = document.querySelector(`.${e}`);
                t && t.remove();
            }));
        }));
    },
    '(()=>{window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,{apply:(a,b,c)=>{const d=b.urlCalled;return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):d.match(/\\.damoh\\./)?void 0:Reflect.apply(a,b,c)}})})();': () => {
        window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, {
            apply: (e, t, n) => {
                const o = t.urlCalled;
                return "string" != typeof o || 0 === o.length ? Reflect.apply(e, t, n) : o.match(/\.damoh\./) ? void 0 : Reflect.apply(e, t, n);
            }
        });
    },
    '!function(){var n={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(n,t){if("function"==typeof t)try{1===t.length&&t({preroll:"moviepilot"})}catch(t){}},setConfig:function(){},loadPositions:function(){},displayPositions:function(){}}};n.cmd.push=function(n){let t=function(){try{"function"==typeof n&&n()}catch(n){}};"complete"===document.readyState?t():window.addEventListener("load",(()=>{t()}))},window.jad=n}();': () => {
        !function() {
            var e = {
                cmd: [],
                public: {
                    getVideoAdUrl: function() {},
                    createNewPosition: function() {},
                    refreshAds: function() {},
                    setTargetingOnPosition: function() {},
                    getDailymotionAdsParamsForScript: function(e, t) {
                        if ("function" == typeof t) try {
                            1 === t.length && t({
                                preroll: "moviepilot"
                            });
                        } catch (t) {}
                    },
                    setConfig: function() {},
                    loadPositions: function() {},
                    displayPositions: function() {}
                }
            };
            e.cmd.push = function(e) {
                let t = function() {
                    try {
                        "function" == typeof e && e();
                    } catch (e) {}
                };
                "complete" === document.readyState ? t() : window.addEventListener("load", (() => {
                    t();
                }));
            }, window.jad = e;
        }();
    },
    'var st = ".sidebar > div.widget-container:first-of-type, .sidebar > a[href^=\\"http://future-sale-system.de\\"], #messageList > li.message:not([id]), .sidebar > a[target=\\"_blank\\"] > img {display: none!important; }", a=document.createElement("style");a.type="text/css";a.styleSheet?a.styleSheet.cssText=st:a.innerHTML=st;document.getElementsByTagName("head")[0].appendChild(a);': () => {
        var e = '.sidebar > div.widget-container:first-of-type, .sidebar > a[href^="http://future-sale-system.de"], #messageList > li.message:not([id]), .sidebar > a[target="_blank"] > img {display: none!important; }', t = document.createElement("style");
        t.type = "text/css";
        t.styleSheet ? t.styleSheet.cssText = e : t.innerHTML = e;
        document.getElementsByTagName("head")[0].appendChild(t);
    },
    "window.disablePopUnder = true;": () => {
        window.disablePopUnder = !0;
    },
    "var originalUserAgent = navigator.userAgent; Object.defineProperty(navigator, 'userAgent', { get: function() { return originalUserAgent + ' Edge'; } });": () => {
        var e = navigator.userAgent;
        Object.defineProperty(navigator, "userAgent", {
            get: function() {
                return e + " Edge";
            }
        });
    },
    'setTimeout(function(){var el = document.querySelector(".showitxt"); if(el) { el.innerHTML = el.innerHTML.replace("(Anzeige)",""); }},3000);': () => {
        setTimeout((function() {
            var e = document.querySelector(".showitxt");
            e && (e.innerHTML = e.innerHTML.replace("(Anzeige)", ""));
        }), 3e3);
    },
    '(function(b,d,e){function a(){}b={get:function(){return a},set:a},d={};Object.defineProperties(d,{spid_control_callback:b,content_control_callback:b,vid_control_callback:b});e=new Proxy({},{get:function(a,c){switch(c){case "config":return d;case "_setSpKey":throw Error();default:return a[c]}},set:function(a,c,b){switch(c){case "config":return!0;case "bootstrap":case "mms":return a[c]=b,!0;default:throw Error();}}});Object.defineProperty(window,"_sp_",{get:function(){return e},set:a})})();': () => {
        !function(e, t, n) {
            function o() {}
            e = {
                get: function() {
                    return o;
                },
                set: o
            }, t = {};
            Object.defineProperties(t, {
                spid_control_callback: e,
                content_control_callback: e,
                vid_control_callback: e
            });
            n = new Proxy({}, {
                get: function(e, n) {
                    switch (n) {
                      case "config":
                        return t;

                      case "_setSpKey":
                        throw Error();

                      default:
                        return e[n];
                    }
                },
                set: function(e, t, n) {
                    switch (t) {
                      case "config":
                        return !0;

                      case "bootstrap":
                      case "mms":
                        return e[t] = n, !0;

                      default:
                        throw Error();
                    }
                }
            });
            Object.defineProperty(window, "_sp_", {
                get: function() {
                    return n;
                },
                set: o
            });
        }();
    },
    '!function(){const o={apply:(o,n,r)=>(new Error).stack.includes("refreshad")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();': () => {
        !function() {
            const e = {
                apply: (e, t, n) => (new Error).stack.includes("refreshad") ? 0 : Reflect.apply(e, t, n)
            };
            window.Math.floor = new Proxy(window.Math.floor, e);
        }();
    },
    '(function(){const a=Function.prototype.toString;window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,{apply:(b,c,d)=>{const e=d[1],f=/detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;return e&&"function"==typeof e&&(f.test(a.call(e))||f.test(e.toString()))&&(d[1]=function(){}),Reflect.apply(b,c,d)}});Function.prototype.bind=new Proxy(Function.prototype.bind,{apply:(b,c,d)=>{const e=a.call(c),f=Reflect.apply(b,c,d);return f.toString=function(){return e},f}})})();': () => {
        !function() {
            const e = Function.prototype.toString;
            window.EventTarget.prototype.addEventListener = new Proxy(window.EventTarget.prototype.addEventListener, {
                apply: (t, n, o) => {
                    const i = o[1], a = /detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;
                    return i && "function" == typeof i && (a.test(e.call(i)) || a.test(i.toString())) && (o[1] = function() {}), 
                    Reflect.apply(t, n, o);
                }
            });
            Function.prototype.bind = new Proxy(Function.prototype.bind, {
                apply: (t, n, o) => {
                    const i = e.call(n), a = Reflect.apply(t, n, o);
                    return a.toString = function() {
                        return i;
                    }, a;
                }
            });
        }();
    },
    '!function(){var t={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(t,n){if("function"==typeof n)try{if(1===n.length){const o=t[0];n({[o]:o})}}catch(n){console.debug(n)}}}};t.cmd.push=function(t){let n=function(){try{"function"==typeof t&&t()}catch(t){}};"complete"===document.readyState?n():window.addEventListener("load",(()=>{n()}))},window.jad=t}();': () => {
        (e = {
            cmd: [],
            public: {
                getVideoAdUrl: function() {},
                createNewPosition: function() {},
                refreshAds: function() {},
                setTargetingOnPosition: function() {},
                getDailymotionAdsParamsForScript: function(e, t) {
                    if ("function" == typeof t) try {
                        if (1 === t.length) {
                            const n = e[0];
                            t({
                                [n]: n
                            });
                        }
                    } catch (t) {
                        console.debug(t);
                    }
                }
            }
        }).cmd.push = function(e) {
            let t = function() {
                try {
                    "function" == typeof e && e();
                } catch (e) {}
            };
            "complete" === document.readyState ? t() : window.addEventListener("load", (() => {
                t();
            }));
        }, window.jad = e;
        var e;
    },
    '(function(){if(-1<window.location.href.indexOf("/s.php?i="))try{for(var a=location.href.split("/s.php?i=")[1],c=0;10>c;c++){a=atob(a);try{new URL(a);var d=!0}catch(b){d=!1}if(d)try{a=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});a=decodeURIComponent(a);window.location=a;break}catch(b){}}}catch(b){}})();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/s.php?i=")) try {
                for (var e = location.href.split("/s.php?i=")[1], t = 0; 10 > t; t++) {
                    e = atob(e);
                    try {
                        new URL(e);
                        var n = !0;
                    } catch (e) {
                        n = !1;
                    }
                    if (n) try {
                        e = e.replace(/[a-zA-Z]/g, (function(e) {
                            return String.fromCharCode(("Z" >= e ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26);
                        }));
                        e = decodeURIComponent(e);
                        window.location = e;
                        break;
                    } catch (e) {}
                }
            } catch (e) {}
        }();
    },
    '!function(){if(-1<window.location.href.indexOf("/#aHR0c")){var a=location.href.split("/#");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/#aHR0c")) {
                var e = location.href.split("/#");
                if (e && e[1]) try {
                    window.location = atob(e[1]);
                } catch (e) {}
            }
        }();
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/pagead2\\.googlesyndication\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        e = XMLHttpRequest.prototype.open, t = /pagead2\.googlesyndication\.com/i, XMLHttpRequest.prototype.open = function(n, o) {
            if ("GET" !== n || !t.test(o)) return e.apply(this, arguments);
            this.send = function() {
                return null;
            }, this.setRequestHeader = function() {
                return null;
            }, console.log("AG has blocked request: ", o);
        };
        var e, t;
    },
    '(()=>{let e="";const t="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",o="//widgets.outbrain.com/outbrain.js",n={apply:(n,r,a)=>{const p=a[1];return p&&(p.includes(t)||p.includes(o))&&(r.prevent=!0,e=p),Reflect.apply(n,r,a)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,n);const r={apply:async(n,r,a)=>{if(r.prevent){const n=()=>Promise.resolve(r).then((n=>{try{if(!n.responseText){let r="";e.includes(t)&&(r="google_plmetrics"),e.includes(o)&&(r="outbrain"),Object.defineProperty(n,"responseText",{value:r})}"function"==typeof n.onload&&n.onload(),"function"==typeof n.onreadystatechange&&(Object.defineProperty(n,"status",{value:200}),Object.defineProperty(n,"readyState",{value:4}),n.onreadystatechange())}catch(e){console.trace(e)}}));try{const t=await fetch(e);if((await t.text()).length<2e3)return n()}catch(e){return n()}}return Reflect.apply(n,r,a)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,r)})();': () => {
        (() => {
            let e = "";
            const t = "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", n = "//widgets.outbrain.com/outbrain.js", o = {
                apply: (o, i, a) => {
                    const r = a[1];
                    return r && (r.includes(t) || r.includes(n)) && (i.prevent = !0, e = r), Reflect.apply(o, i, a);
                }
            };
            window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, o);
            const i = {
                apply: async (o, i, a) => {
                    if (i.prevent) {
                        const o = () => Promise.resolve(i).then((o => {
                            try {
                                if (!o.responseText) {
                                    let i = "";
                                    e.includes(t) && (i = "google_plmetrics"), e.includes(n) && (i = "outbrain"), Object.defineProperty(o, "responseText", {
                                        value: i
                                    });
                                }
                                "function" == typeof o.onload && o.onload(), "function" == typeof o.onreadystatechange && (Object.defineProperty(o, "status", {
                                    value: 200
                                }), Object.defineProperty(o, "readyState", {
                                    value: 4
                                }), o.onreadystatechange());
                            } catch (e) {
                                console.trace(e);
                            }
                        }));
                        try {
                            const t = await fetch(e);
                            if ((await t.text()).length < 2e3) return o();
                        } catch (e) {
                            return o();
                        }
                    }
                    return Reflect.apply(o, i, a);
                }
            };
            window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, i);
        })();
    },
    "window.loadingAds = true;": () => {
        window.loadingAds = !0;
    },
    "window.N3CanRunAds = true;": () => {
        window.N3CanRunAds = !0;
    },
    "window.UFads = true;": () => {
        window.UFads = !0;
    },
    "window.pr_okvalida=true;": () => {
        window.pr_okvalida = !0;
    },
    "window.pr_okAd = true;": () => {
        window.pr_okAd = !0;
    },
    "window.adblockDetecter = true;": () => {
        window.adblockDetecter = !0;
    },
    "window.pr_okvalida = true;": () => {
        window.pr_okvalida = !0;
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{try{let t;"function"==typeof decode_link&&"string"==typeof link_out&&(t=decode_link(atob(link_out)),location.assign(t)),"string"==typeof api_key&&(document.cookie=`${api_key}=Wn275; path=/`);const e=document.querySelector("* > .button#contador");e&&t&&setTimeout((()=>{const o=e.cloneNode(!0);e.parentNode.replaceChild(o,e),o.addEventListener("click",(function(){location.assign(t)}),!1)}),500)}catch(t){}}));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            try {
                let e;
                "function" == typeof decode_link && "string" == typeof link_out && (e = decode_link(atob(link_out)), 
                location.assign(e)), "string" == typeof api_key && (document.cookie = `${api_key}=Wn275; path=/`);
                const t = document.querySelector("* > .button#contador");
                t && e && setTimeout((() => {
                    const n = t.cloneNode(!0);
                    t.parentNode.replaceChild(n, t), n.addEventListener("click", (function() {
                        location.assign(e);
                    }), !1);
                }), 500);
            } catch (e) {}
        }));
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'.count > li > a[href*="/#!"]\').forEach((t=>{const e=(t=>{let e=t;for(let t=0;t<10;t++)try{e=atob(e)}catch(t){break}return e})(t.href.split("/#!")[1]);(t=>{let e=t;try{e=new URL(t)}catch(t){return!1}return"http:"===e.protocol||"https:"===e.protocol})(e)&&t.setAttribute("href",e)}))}));})();': () => {
        document.addEventListener("DOMContentLoaded", (() => {
            document.querySelectorAll('.count > li > a[href*="/#!"]').forEach((e => {
                const t = (e => {
                    let t = e;
                    for (let n = 0; n < 10; n++) try {
                        t = atob(t);
                    } catch (e) {
                        break;
                    }
                    return t;
                })(e.href.split("/#!")[1]);
                (e => {
                    let t = e;
                    try {
                        t = new URL(e);
                    } catch (e) {
                        return !1;
                    }
                    return "http:" === t.protocol || "https:" === t.protocol;
                })(t) && e.setAttribute("href", t);
            }));
        }));
    },
    '!function(){if(window.location.href.includes(".php?")&&window.location.href.includes("=")){const o=location.href.split("=");if(o&&o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){const n=decodeURIComponent(t);let c=!1;try{new URL(n),c=!0}catch(o){c=!1}if(c){location.assign(n);break}}}}}();': () => {
        !function() {
            if (window.location.href.includes(".php?") && window.location.href.includes("=")) {
                const e = location.href.split("=");
                if (e && e[1]) {
                    let t = e[1];
                    for (let e = 0; e < 10; e++) try {
                        t = atob(t);
                    } catch (e) {
                        const n = decodeURIComponent(t);
                        let o = !1;
                        try {
                            new URL(n), o = !0;
                        } catch (e) {
                            o = !1;
                        }
                        if (o) {
                            location.assign(n);
                            break;
                        }
                    }
                }
            }
        }();
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);g=g.split("&url=")[1];try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/#")) {
                var e = location.href.split("/#");
                if (e && e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) try {
                        e = atob(e);
                    } catch (t) {
                        var n = decodeURIComponent(e);
                        n = n.split("&url=")[1];
                        try {
                            new URL(n);
                            var o = !0;
                        } catch (e) {
                            o = !1;
                        }
                        if (o) {
                            location.assign(n);
                            break;
                        }
                    }
                }
            }
        }();
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/#")) {
                var e = location.href.split("/#");
                if (e && e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) try {
                        e = atob(e);
                    } catch (t) {
                        var n = decodeURIComponent(e);
                        try {
                            new URL(n);
                            var o = !0;
                        } catch (e) {
                            o = !1;
                        }
                        if (o) {
                            location.assign(n);
                            break;
                        }
                    }
                }
            }
        }();
    },
    '(function(){if(-1<window.location.href.indexOf("/#!")){var b=location.href.split("/#!");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/#!")) {
                var e = location.href.split("/#!");
                if (e && e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) try {
                        e = atob(e);
                    } catch (t) {
                        var n = decodeURIComponent(e);
                        try {
                            new URL(n);
                            var o = !0;
                        } catch (e) {
                            o = !1;
                        }
                        if (o) {
                            location.assign(n);
                            break;
                        }
                    }
                }
            }
        }();
    },
    'AG_onLoad(function(){try{"function"==typeof window.noobBypass&&noobBypass()}catch(b){}});': () => {
        AG_onLoad((function() {
            try {
                "function" == typeof window.noobBypass && noobBypass();
            } catch (e) {}
        }));
    },
    '!function(){const e=e=>{const o=new XMLHttpRequest;o.open("POST","/check.php",!0),o.setRequestHeader("Content-type","application/x-www-form-urlencoded"),o.send("a");const t=atob(window.ext_site).replace(/[a-z]/gi,(e=>String.fromCharCode(e.charCodeAt(0)+(e.toLowerCase()<="m"?13:-13))));let n=e.replaceAll(\'\\\\"\',\'"\');n=n.replace("\'+ api_key+ \'",window.api_key),n=n.replace("\'+ link_out+ \\"",window.link_out),n=n.replace(/action="\'\\+ .*?\\+ \'"/,`action="${t}"`);var a;const i=(a=n,(new DOMParser).parseFromString(a,"text/html")).querySelector("form"),r=new FormData(i),c=new XMLHttpRequest;c.open("POST",t,!0),c.send(r),window.tab2=window,postMessage("_clicked_b",location.origin)},o={apply:(o,t,n)=>{if(n[1]&&n[1].includes("api_key")){const o=window.link_out,t=window.api_key,a=n[1].match(/window\\.open\\(.*?\\(atob\\(main_site\\)\\).*?("\\/.*\\.php\\?.*=").*?("&.*?=").*?(api_key),"view"/),i=a[1].replaceAll(\'"\',""),r=a[2].replaceAll(\'"\',""),c=n[1].match(/<form target=[\\s\\S]*?<\\/form>/)[0];if(n[1]=n[1].replace("window.location.href","var nulled"),n[1]=n[1].replace("window.open(f","location.assign(f"),n[1]=n[1].replace(/(parseInt\\(c\\.split\\("-"\\)\\[0\\]\\)<= 0).*?(\\)\\{)/,"$1$2"),o&&t&&i&&r&&c)try{"loading"===document.readyState?window.addEventListener("load",(()=>{e(c)}),{once:!0}):e(c)}catch(e){console.debug(e)}}return Reflect.apply(o,t,n)}};window.Function.prototype.constructor=new Proxy(window.Function.prototype.constructor,o)}();': () => {
        !function() {
            const e = e => {
                const t = new XMLHttpRequest;
                t.open("POST", "/check.php", !0), t.setRequestHeader("Content-type", "application/x-www-form-urlencoded"), 
                t.send("a");
                const n = atob(window.ext_site).replace(/[a-z]/gi, (e => String.fromCharCode(e.charCodeAt(0) + (e.toLowerCase() <= "m" ? 13 : -13))));
                let o = e.replaceAll('\\"', '"');
                o = o.replace("'+ api_key+ '", window.api_key), o = o.replace("'+ link_out+ \"", window.link_out), 
                o = o.replace(/action="'\+ .*?\+ '"/, `action="${n}"`);
                var i;
                const a = (i = o, (new DOMParser).parseFromString(i, "text/html")).querySelector("form"), r = new FormData(a), c = new XMLHttpRequest;
                c.open("POST", n, !0), c.send(r), window.tab2 = window, postMessage("_clicked_b", location.origin);
            }, t = {
                apply: (t, n, o) => {
                    if (o[1] && o[1].includes("api_key")) {
                        const t = window.link_out, n = window.api_key, i = o[1].match(/window\.open\(.*?\(atob\(main_site\)\).*?("\/.*\.php\?.*=").*?("&.*?=").*?(api_key),"view"/), a = i[1].replaceAll('"', ""), r = i[2].replaceAll('"', ""), c = o[1].match(/<form target=[\s\S]*?<\/form>/)[0];
                        if (o[1] = o[1].replace("window.location.href", "var nulled"), o[1] = o[1].replace("window.open(f", "location.assign(f"), 
                        o[1] = o[1].replace(/(parseInt\(c\.split\("-"\)\[0\]\)<= 0).*?(\)\{)/, "$1$2"), 
                        t && n && a && r && c) try {
                            "loading" === document.readyState ? window.addEventListener("load", (() => {
                                e(c);
                            }), {
                                once: !0
                            }) : e(c);
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    return Reflect.apply(t, n, o);
                }
            };
            window.Function.prototype.constructor = new Proxy(window.Function.prototype.constructor, t);
        }();
    },
    '(()=>{try{const o=location.href.split("/#");if(o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){break}const c=decodeURIComponent(t).split("&url=")[1];c&&location.assign(c)}}catch(o){console.error(o)}})();': () => {
        (() => {
            try {
                const e = location.href.split("/#");
                if (e[1]) {
                    let t = e[1];
                    for (let e = 0; e < 10; e++) try {
                        t = atob(t);
                    } catch (e) {
                        break;
                    }
                    const n = decodeURIComponent(t).split("&url=")[1];
                    n && location.assign(n);
                }
            } catch (e) {
                console.error(e);
            }
        })();
    },
    '(function(){try{var a=location.href.split("out#!");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        !function() {
            try {
                var e = location.href.split("out#!");
                if (e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) {
                        e = atob(e);
                        try {
                            new URL(decodeURIComponent(e));
                            var n = !0;
                        } catch (e) {
                            n = !1;
                        }
                        if (n) try {
                            location.assign(decodeURIComponent(e));
                            break;
                        } catch (e) {}
                    }
                }
            } catch (e) {}
        }();
    },
    "(()=>{document.addEventListener('DOMContentLoaded',function(){if(window.deco_url_b64&&typeof deco_url_b64==='string'&&deco_url_b64.startsWith('http')){location.assign(deco_url_b64);}});})();": () => {
        document.addEventListener("DOMContentLoaded", (function() {
            window.deco_url_b64 && "string" == typeof deco_url_b64 && deco_url_b64.startsWith("http") && location.assign(deco_url_b64);
        }));
    },
    '(function(){try{var a=location.href.split("#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        !function() {
            try {
                var e = location.href.split("#");
                if (e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) {
                        e = atob(e);
                        try {
                            new URL(decodeURIComponent(e));
                            var n = !0;
                        } catch (e) {
                            n = !1;
                        }
                        if (n) try {
                            location.assign(decodeURIComponent(e));
                            break;
                        } catch (e) {}
                    }
                }
            } catch (e) {}
        }();
    },
    '(()=>{window.addEventListener("message",(e=>{e?.data?.includes("__done__")&&e?.data?.length<9&&Object.defineProperty(e,"source",{value:""})}),!0);const e=new MutationObserver((()=>{document.querySelector("a.button#contador")&&(e.disconnect(),setTimeout((()=>{postMessage("__done__")}),100))}));e.observe(document,{childList:!0,subtree:!0})})();': () => {
        (() => {
            window.addEventListener("message", (e => {
                e?.data?.includes("__done__") && e?.data?.length < 9 && Object.defineProperty(e, "source", {
                    value: ""
                });
            }), !0);
            const e = new MutationObserver((() => {
                document.querySelector("a.button#contador") && (e.disconnect(), setTimeout((() => {
                    postMessage("__done__");
                }), 100));
            }));
            e.observe(document, {
                childList: !0,
                subtree: !0
            });
        })();
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var a=location.href.split("/#");if(a&&a[1]){a=a[1];for(var c=0;10>c;c++)try{a=atob(a)}catch(f){var d=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});try{new URL(d);var e=!0}catch(b){e=!1}if(e){window.location=d;break}}}}})();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("/#")) {
                var e = location.href.split("/#");
                if (e && e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) try {
                        e = atob(e);
                    } catch (t) {
                        var n = e.replace(/[a-zA-Z]/g, (function(e) {
                            return String.fromCharCode(("Z" >= e ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26);
                        }));
                        try {
                            new URL(n);
                            var o = !0;
                        } catch (e) {
                            o = !1;
                        }
                        if (o) {
                            window.location = n;
                            break;
                        }
                    }
                }
            }
        }();
    },
    '(function(){if(-1<window.location.href.indexOf("s.php?i=")){var a=location.href.split("s.php?i=");if(a&&a[1]){a=a[1];for(var c=0;10>c;c++)try{a=atob(a)}catch(f){var d=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});try{new URL(d);var e=!0}catch(b){e=!1}if(e){window.location=d;break}}}}})();': () => {
        !function() {
            if (-1 < window.location.href.indexOf("s.php?i=")) {
                var e = location.href.split("s.php?i=");
                if (e && e[1]) {
                    e = e[1];
                    for (var t = 0; 10 > t; t++) try {
                        e = atob(e);
                    } catch (t) {
                        var n = e.replace(/[a-zA-Z]/g, (function(e) {
                            return String.fromCharCode(("Z" >= e ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26);
                        }));
                        try {
                            new URL(n);
                            var o = !0;
                        } catch (e) {
                            o = !1;
                        }
                        if (o) {
                            window.location = n;
                            break;
                        }
                    }
                }
            }
        }();
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\(\\)>0x0\\)\\{fA=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        e = window.setTimeout, window.setTimeout = function(t, n) {
            if (!/\(\)>0x0\)\{fA=setTimeout\(/.test(t.toString())) return e(t, n);
        };
        var e;
    }
};

module.exports = {
    localScriptRules: localScriptRules
};