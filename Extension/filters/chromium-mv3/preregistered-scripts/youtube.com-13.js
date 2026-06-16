(function () {
var _b = new Set(), _c = {};
function preventXHR(e, t) {
    var r = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || _c[n] !== r) {
        var a = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, r) {
                if ("undefined" != typeof Proxy) {
                    var n, a = window.XMLHttpRequest.prototype.open, c = window.XMLHttpRequest.prototype.getResponseHeader, f = window.XMLHttpRequest.prototype.getAllResponseHeaders, d = new Map, v = new Map, y = "", g = "", h = {
                        apply: function(r, a, p) {
                            n = s.apply(null, p);
                            if (void 0 === t) {
                                u(e, `xhr( ${i(n)} )`, !0);
                                o(e);
                            } else if (function(e, t, r) {
                                if ("" === t || "*" === t) return !0;
                                var n, a = function(e) {
                                    var t = {};
                                    return e.split(" ").forEach((function(e) {
                                        var r = e.indexOf(":"), n = e.slice(0, r);
                                        if (function(e) {
                                            return [ "url", "method", "headers", "body", "credentials", "cache", "redirect", "referrer", "referrerPolicy", "integrity", "keepalive", "signal", "mode" ].includes(e);
                                        }(n)) {
                                            var a = e.slice(r + 1);
                                            t[n] = a;
                                        } else t.url = e;
                                    })), t;
                                }(t);
                                if (function(e) {
                                    return Object.values(e).every((function(e) {
                                        return function(e) {
                                            var t, r = function(e) {
                                                return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                            }(e);
                                            "/" === e[0] && "/" === e[e.length - 1] && (r = e.slice(1, -1));
                                            try {
                                                t = new RegExp(r), t = !0;
                                            } catch (e) {
                                                t = !1;
                                            }
                                            return t;
                                        }(e);
                                    }));
                                }(a)) {
                                    var o = function(e) {
                                        var t = {};
                                        return Object.keys(e).forEach((function(r) {
                                            t[r] = function(e) {
                                                var t = e || "", r = "/";
                                                if ("" === t) return new RegExp(".?");
                                                var n, a, o = t.lastIndexOf(r), i = t.substring(o + 1), s = t.substring(0, o + 1), u = (a = i, 
                                                (n = s).startsWith(r) && n.endsWith(r) && !n.endsWith("\\/") && function(e) {
                                                    if (!e) return !1;
                                                    try {
                                                        return new RegExp("", e), !0;
                                                    } catch (e) {
                                                        return !1;
                                                    }
                                                }(a) ? a : "");
                                                if (t.startsWith(r) && t.endsWith(r) || u) return new RegExp((u ? s : t).slice(1, -1), u);
                                                var p = t.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                                return new RegExp(p);
                                            }(e[r]);
                                        })), t;
                                    }(a);
                                    n = Object.keys(o).every((function(e) {
                                        var t = o[e], n = r[e];
                                        return Object.prototype.hasOwnProperty.call(r, e) && "string" == typeof n && (null == t ? void 0 : t.test(n));
                                    }));
                                } else u(e, `Invalid parameter: ${t}`), n = !1;
                                return n;
                            }(e, t, n)) {
                                "function" == typeof a.onreadystatechange && (n.shouldFireFirstStage = !0);
                                d.set(a, n);
                            }
                            if (d.has(a) && !v.has(a)) {
                                v.set(a, []);
                                var l = {
                                    apply: function(e, t, r) {
                                        var n = v.get(t);
                                        n && n.push(r);
                                        return Reflect.apply(e, t, r);
                                    }
                                };
                                a.setRequestHeader = new Proxy(a.setRequestHeader, l);
                            }
                            return Reflect.apply(r, a, p);
                        }
                    }, w = {
                        apply: function(t, n, i) {
                            if (!d.has(n)) return Reflect.apply(t, n, i);
                            var s = d.get(n);
                            "blob" === n.responseType && (y = new Blob);
                            "arraybuffer" === n.responseType && (y = new ArrayBuffer);
                            if (r) {
                                var c = function(e) {
                                    var t = e;
                                    if ("true" === t) return Math.random().toString(36).slice(-10);
                                    t = t.replace("length:", "");
                                    if (!/^\d+-\d+$/.test(t)) return null;
                                    var r = p(t.split("-")[0]), n = p(t.split("-")[1]);
                                    if (!l(r) || !l(n)) return null;
                                    if (r > n) {
                                        var a = r;
                                        r = n, n = a;
                                    }
                                    if (n > 5e5) return null;
                                    var o = function(e, t) {
                                        return e = Math.ceil(e), t = Math.floor(t), Math.floor(Math.random() * (t - e + 1) + e);
                                    }(r, n);
                                    return function(e) {
                                        for (var t = "", r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=~", n = 0; n < e; n += 1) t += r.charAt(Math.floor(76 * Math.random()));
                                        return t;
                                    }(o);
                                }(r);
                                if (c) {
                                    y = c;
                                    g = c;
                                } else u(e, `Invalid randomize parameter: '${r}'`);
                            }
                            var f = new XMLHttpRequest, h = function(t) {
                                if (2 === t) {
                                    var {responseURL: r} = f;
                                    Object.defineProperties(n, {
                                        responseURL: {
                                            value: r || s.url,
                                            writable: !1
                                        }
                                    });
                                }
                                if (4 === t) {
                                    var {responseXML: a} = f;
                                    Object.defineProperties(n, {
                                        readyState: {
                                            value: 4,
                                            writable: !1
                                        },
                                        statusText: {
                                            value: "OK",
                                            writable: !1
                                        },
                                        responseXML: {
                                            value: a,
                                            writable: !1
                                        },
                                        status: {
                                            value: 200,
                                            writable: !1
                                        },
                                        response: {
                                            value: y,
                                            writable: !1
                                        },
                                        responseText: {
                                            value: g,
                                            writable: !1
                                        }
                                    });
                                    o(e);
                                } else Object.defineProperty(n, "readyState", {
                                    value: t,
                                    writable: !0,
                                    configurable: !0
                                });
                                var i = new Event("readystatechange");
                                n.dispatchEvent(i);
                            };
                            f.addEventListener("readystatechange", (function() {
                                d.get(n).shouldFireFirstStage && h(1);
                                var e = new ProgressEvent("loadstart");
                                n.dispatchEvent(e);
                                h(2);
                                h(3);
                                var t = new ProgressEvent("progress");
                                n.dispatchEvent(t);
                                h(4);
                            }));
                            setTimeout((function() {
                                var e = new ProgressEvent("load");
                                n.dispatchEvent(e);
                                var t = new ProgressEvent("loadend");
                                n.dispatchEvent(t);
                            }), 1);
                            a.apply(f, [ s.method, s.url ]);
                            (v.get(n) || []).forEach((function(e) {
                                var t = e[0], r = e[1];
                                f.setRequestHeader(t, r);
                            }));
                        }
                    }, b = {
                        apply: function(e, t, r) {
                            var n = v.get(t);
                            if (!n) return c.apply(t, r);
                            if (!n.length) return null;
                            var a = r[0].toLowerCase(), o = n.find((function(e) {
                                return e[0].toLowerCase() === a;
                            }));
                            return o ? o[1] : null;
                        }
                    }, R = {
                        apply: function(e, t) {
                            var r = v.get(t);
                            return r ? r.length ? r.map((function(e) {
                                var t = e[0], r = e[1];
                                return `${t.toLowerCase()}: ${r}`;
                            })).join("\r\n") : "" : f.call(t);
                        }
                    };
                    XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, h);
                    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, w);
                    XMLHttpRequest.prototype.getResponseHeader = new Proxy(XMLHttpRequest.prototype.getResponseHeader, b);
                    XMLHttpRequest.prototype.getAllResponseHeaders = new Proxy(XMLHttpRequest.prototype.getAllResponseHeaders, R);
                }
            }).apply(this, a);
            e.uniqueId && Object.defineProperty(_c, n, {
                value: r,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function o(e) {
        if (e.verbose) {
            try {
                var t = console.trace.bind(console), r = "[ext] ";
                "corelibs" === e.engine ? r += e.ruleText : (e.domainName && (r += `${e.domainName}`), 
                e.args ? r += `#%#//s('${e.name}', '${e.args.join("', '")}')` : r += `#%#//s('${e.name}')`), 
                t && t(r);
            } catch (e) {}
            "function" == typeof window._d && window._d(e);
        }
    }
    function i(e) {
        return e && "object" == typeof e ? function(e) {
            return 0 === Object.keys(e).length && !e.prototype;
        }(e) ? "{}" : Object.entries(e).map((function(e) {
            var t = e[0], r = e[1], n = r;
            return r instanceof Object && (n = `{ ${i(r)} }`), `${t}:"${n}"`;
        })).join(" ") : String(e);
    }
    function s(e, t, r, n, a) {
        return {
            method: e,
            url: t,
            async: r,
            user: n,
            password: a
        };
    }
    function u(e, t) {
        var r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: a, verbose: o} = e;
        if (r || o) {
            var i = console.log;
            n ? i(`${a}: ${t}`) : Array.isArray(t) ? i(`${a}:`, ...t) : i(`${a}:`, t);
        }
    }
    function p(e) {
        var t, r = parseInt(e, 10);
        return t = r, (Number.isNaN || window.isNaN)(t) ? null : r;
    }
    function l(e) {
        return (Number.isFinite || window.isFinite)(e);
    }
}
try {
    var _k = "74335af1e51afde7199c6df8e04dc508";
    if (_b.has(_k)) return;
    _b.add(_k);
    preventXHR.apply(this, [ {
        name: "prevent-xhr",
        args: [ "/advert.js" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "/advert.js" ]));
} catch (e) {}
function removeNodeText(t, e) {
    var n = "done", r = t.uniqueId + t.name + "_" + (Array.isArray(e) ? e.join("_") : "");
    if (!t.uniqueId || _c[r] !== n) {
        var i = e ? [].concat(t).concat(e) : [ t ];
        try {
            (function(t, e, n, r) {
                var {selector: i, nodeNameMatch: u, textContentMatch: a} = function(t, e) {
                    var n, r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null, i = "/", c = !(t.startsWith(i) && t.endsWith(i)), u = c ? t : "*", a = c ? t : o(t), s = e.startsWith(i) ? o(e) : e;
                    return r && (n = r.startsWith(i) ? o(r) : r), {
                        selector: u,
                        nodeNameMatch: a,
                        textContentMatch: s,
                        patternMatch: n
                    };
                }(e, n), s = function(e) {
                    return e.forEach((function(e) {
                        (function(t, e, n) {
                            var {nodeName: r, textContent: i} = t, c = r.toLowerCase();
                            return null !== i && "" !== i && (e instanceof RegExp ? e.test(c) : e === c) && (n instanceof RegExp ? n.test(i) : i.includes(n));
                        })(e, u, a) && function(t, e, n, r) {
                            var {textContent: i} = e;
                            if (i) {
                                var c = i.replace(n, r);
                                "SCRIPT" === e.nodeName && (c = function(t) {
                                    var e, n = null == t || null === (e = t.api) || void 0 === e ? void 0 : e.policy;
                                    if (n) return n;
                                    var r = "AGPolicy", i = window.trustedTypes, c = !!i, u = {
                                        HTML: "TrustedHTML",
                                        Script: "TrustedScript",
                                        ScriptURL: "TrustedScriptURL"
                                    };
                                    if (!c) return {
                                        name: r,
                                        isSupported: c,
                                        TrustedType: u,
                                        createHTML: function(t) {
                                            return t;
                                        },
                                        createScript: function(t) {
                                            return t;
                                        },
                                        createScriptURL: function(t) {
                                            return t;
                                        },
                                        create: function(t, e) {
                                            return e;
                                        },
                                        getAttributeType: function() {
                                            return null;
                                        },
                                        convertAttributeToTrusted: function(t, e, n) {
                                            return n;
                                        },
                                        getPropertyType: function() {
                                            return null;
                                        },
                                        convertPropertyToTrusted: function(t, e, n) {
                                            return n;
                                        },
                                        isHTML: function() {
                                            return !1;
                                        },
                                        isScript: function() {
                                            return !1;
                                        },
                                        isScriptURL: function() {
                                            return !1;
                                        }
                                    };
                                    var o = i.createPolicy(r, {
                                        createHTML: function(t) {
                                            return t;
                                        },
                                        createScript: function(t) {
                                            return t;
                                        },
                                        createScriptURL: function(t) {
                                            return t;
                                        }
                                    }), a = function(t) {
                                        return o.createHTML(t);
                                    }, s = function(t) {
                                        return o.createScript(t);
                                    }, d = function(t) {
                                        return o.createScriptURL(t);
                                    }, f = function(t, e) {
                                        switch (t) {
                                          case u.HTML:
                                            return a(e);

                                          case u.Script:
                                            return s(e);

                                          case u.ScriptURL:
                                            return d(e);

                                          default:
                                            return e;
                                        }
                                    }, p = i.getAttributeType.bind(i), l = i.getPropertyType.bind(i), v = i.isHTML.bind(i), T = i.isScript.bind(i), h = i.isScriptURL.bind(i);
                                    return {
                                        name: r,
                                        isSupported: c,
                                        TrustedType: u,
                                        createHTML: a,
                                        createScript: s,
                                        createScriptURL: d,
                                        create: f,
                                        getAttributeType: p,
                                        convertAttributeToTrusted: function(t, e, n, r, i) {
                                            var c = p(t, e, r, i);
                                            return c ? f(c, n) : n;
                                        },
                                        getPropertyType: l,
                                        convertPropertyToTrusted: function(t, e, n, r) {
                                            var i = l(t, e, r);
                                            return i ? f(i, n) : n;
                                        },
                                        isHTML: v,
                                        isScript: T,
                                        isScriptURL: h
                                    };
                                }(t).createScript(c));
                                e.textContent = c, function(t) {
                                    if (t.verbose) {
                                        try {
                                            var e = console.trace.bind(console), n = "[ext] ";
                                            "corelibs" === t.engine ? n += t.ruleText : (t.domainName && (n += `${t.domainName}`), 
                                            t.args ? n += `#%#//s('${t.name}', '${t.args.join("', '")}')` : n += `#%#//s('${t.name}')`), 
                                            e && e(n);
                                        } catch (t) {}
                                        "function" == typeof window._d && window._d(t);
                                    }
                                }(t);
                            }
                        }(t, e, /^[^]*$/, "");
                    }));
                };
                document.documentElement && c(i, s, r);
                !function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {
                        subtree: !0,
                        childList: !0
                    }, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1e4, r = new MutationObserver((function(n, r) {
                        r.disconnect(), t(n, r), r.observe(document.documentElement, e);
                    }));
                    r.observe(document.documentElement, e), "number" == typeof n && setTimeout((function() {
                        return r.disconnect();
                    }), n);
                }((function(t) {
                    return e = s, n = i, u = r, o = function(t) {
                        for (var e = [], n = 0; n < t.length; n += 1) for (var {addedNodes: r} = t[n], i = 0; i < r.length; i += 1) e.push(r[i]);
                        return e;
                    }(t), void (n && u ? o.forEach((function() {
                        c(n, e, u);
                    })) : e(o));
                    var e, n, u, o;
                }));
            }).apply(this, i);
            t.uniqueId && Object.defineProperty(_c, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {}
    }
    function c(t, e, n) {
        (n ? document.querySelectorAll(n) : [ document ]).forEach((function(n) {
            return function(n) {
                if ("#text" === t) {
                    var r = u(n.childNodes).filter((function(t) {
                        return t.nodeType === Node.TEXT_NODE;
                    }));
                    e(r);
                } else {
                    var i = u(n.querySelectorAll(t));
                    e(i);
                }
            }(n);
        }));
    }
    function u(t) {
        for (var e = [], n = 0; n < t.length; n += 1) e.push(t[n]);
        return e;
    }
    function o(t) {
        var e = t || "", n = "/";
        if ("" === e) return new RegExp(".?");
        var r, i, c = e.lastIndexOf(n), u = e.substring(c + 1), o = e.substring(0, c + 1), a = (i = u, 
        (r = o).startsWith(n) && r.endsWith(n) && !r.endsWith("\\/") && function(t) {
            if (!t) return !1;
            try {
                return new RegExp("", t), !0;
            } catch (t) {
                return !1;
            }
        }(i) ? i : "");
        if (e.startsWith(n) && e.endsWith(n) || a) return new RegExp((a ? o : e).slice(1, -1), a);
        var s = e.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(s);
    }
}
try {
    var _k = "6c374e6b4d21bdbf41a462ac95f31b2f";
    if (_b.has(_k)) return;
    _b.add(_k);
    removeNodeText.apply(this, [ {
        name: "remove-node-text",
        args: [ "script", "popUnder" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "popUnder" ]));
} catch (e) {}
try {
    var _k = "e75d8db5bf3c30821b02ee189b7277a8";
    if (_b.has(_k)) return;
    _b.add(_k);
    removeNodeText.apply(this, [ {
        name: "remove-node-text",
        args: [ "script", "LAST_POP" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "LAST_POP" ]));
} catch (e) {}
try {
    var _k = "b6649c7ba8fadf2d6a3d5477e7f71622";
    if (_b.has(_k)) return;
    _b.add(_k);
    removeNodeText.apply(this, [ {
        name: "remove-node-text",
        args: [ "script", "window.open" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "window.open" ]));
} catch (e) {}
function abortCurrentInlineScript(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || _c[r] !== n) {
        var i = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, n) {
                var r, i, c = function(e) {
                    var t = e || "", n = "/";
                    if ("" === t) return new RegExp(".?");
                    var r, i, o = t.lastIndexOf(n), a = t.substring(o + 1), c = t.substring(0, o + 1), s = (i = a, 
                    (r = c).startsWith(n) && r.endsWith(n) && !r.endsWith("\\/") && function(e) {
                        if (!e) return !1;
                        try {
                            return new RegExp("", e), !0;
                        } catch (e) {
                            return !1;
                        }
                    }(i) ? i : "");
                    if (t.startsWith(n) && t.endsWith(n) || s) return new RegExp((s ? c : t).slice(1, -1), s);
                    var u = t.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    return new RegExp(u);
                }(n), s = o(), u = "data:text/javascript;base64,", l = function() {
                    if ("currentScript" in document) return document.currentScript;
                    var e = document.getElementsByTagName("script");
                    return e[e.length - 1];
                }, f = l(), d = function() {
                    var t, n = l();
                    if (n) {
                        var r = n.textContent;
                        try {
                            r = Object.getOwnPropertyDescriptor(Node.prototype, "textContent").get.call(n);
                        } catch (e) {}
                        if (0 === r.length && void 0 !== n.src && null !== (t = n.src) && void 0 !== t && t.startsWith(u)) {
                            var i = n.src.slice(28);
                            r = window.atob(i);
                        }
                        if (n instanceof HTMLScriptElement && r.length > 0 && n !== f && c.test(r)) {
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var t = console.trace.bind(console), n = "[ext] ";
                                        "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                                        e.args ? n += `#%#//s('${e.name}', '${e.args.join("', '")}')` : n += `#%#//s('${e.name}')`), 
                                        t && t(n);
                                    } catch (e) {}
                                    "function" == typeof window._d && window._d(e);
                                }
                            }(e);
                            throw new ReferenceError(s);
                        }
                    }
                }, p = function(t, n) {
                    var r = a(t, n), {base: i, prop: c, chain: s} = r;
                    if (i instanceof Object != 0 || null !== i) if (s) !function(e, t, n, r) {
                        var i;
                        try {
                            i = e[t];
                        } catch (e) {
                            i = void 0;
                        }
                        Object.defineProperty(e, t, {
                            get: function() {
                                return i;
                            },
                            set: function(e) {
                                i = e, e instanceof Object && r(e, n);
                            }
                        });
                    }(t, c, s, p); else {
                        var u = i[c], l = Object.getOwnPropertyDescriptor(i, c);
                        if (l instanceof Object == 0 || l.get instanceof Function == 0) {
                            u = i[c];
                            l = void 0;
                        }
                        var f, b, g, h, v = Object.assign({
                            isAbortingSuspended: !1,
                            isolateCallback(e) {
                                this.isAbortingSuspended = !0;
                                try {
                                    for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
                                    var i = e(...n);
                                    return this.isAbortingSuspended = !1, i;
                                } catch (e) {
                                    var a = o();
                                    throw this.isAbortingSuspended = !1, new ReferenceError(a);
                                }
                            }
                        }, {
                            currentValue: u,
                            get() {
                                this.isAbortingSuspended || this.isolateCallback(d);
                                return l instanceof Object ? l.get.call(i) : this.currentValue;
                            },
                            set(e) {
                                this.isAbortingSuspended || this.isolateCallback(d);
                                l instanceof Object ? l.set.call(i, e) : this.currentValue = e;
                            }
                        });
                        f = i, b = c, g = {
                            get: () => v.get.call(v),
                            set(e) {
                                v.set.call(v, e);
                            }
                        }, (h = Object.getOwnPropertyDescriptor(f, b)) && !h.configurable || Object.defineProperty(f, b, g);
                    } else {
                        var w = n.split("."), y = w.indexOf(c), O = w[y - 1];
                        !function(e, t) {
                            var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = e;
                            if (n || o) {
                                var a = console.log;
                                r ? a(`${i}: ${t}`) : Array.isArray(t) ? a(`${i}:`, ...t) : a(`${i}:`, t);
                            }
                        }(e, `The scriptlet had been executed before the ${O} was loaded.`);
                    }
                };
                p(window, t);
                window.onerror = (r = s, i = window.onerror, function(e) {
                    if ("string" == typeof e && e.includes(r)) return !0;
                    if (i instanceof Function) {
                        for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), o = 1; o < t; o++) n[o - 1] = arguments[o];
                        return i.apply(window, [ e, ...n ]);
                    }
                    return !1;
                }).bind();
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(_c, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function o() {
        return Math.random().toString(36).slice(2, 9);
    }
    function a(e, t) {
        var n = t.indexOf(".");
        if (-1 === n) return {
            base: e,
            prop: t
        };
        var r = t.slice(0, n);
        if (null === e) return {
            base: e,
            prop: r,
            chain: t
        };
        var i = e[r];
        return t = t.slice(n + 1), (e instanceof Object || "object" == typeof e) && function(e) {
            return 0 === Object.keys(e).length && !e.prototype;
        }(e) || null === i ? {
            base: e,
            prop: r,
            chain: t
        } : void 0 !== i ? a(i, t) : (Object.defineProperty(e, r, {
            configurable: !0
        }), {
            base: e,
            prop: r,
            chain: t
        });
    }
}
try {
    var _k = "d626e74e0151345116c33bdd18aedeca";
    if (_b.has(_k)) return;
    _b.add(_k);
    abortCurrentInlineScript.apply(this, [ {
        name: "abort-current-inline-script",
        args: [ "document.createElement", "'script'" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "document.createElement", "'script'" ]));
} catch (e) {}
function trustedDispatchEvent(e, n) {
    var t = "done", a = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || _c[a] !== t) {
        var i = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, t) {
                if (n) {
                    var a = !1, i = document;
                    "window" === t && (i = window);
                    var o = new Set, r = function() {
                        var r = new Event(n);
                        "string" == typeof t && "window" !== t && (i = document.querySelector(t));
                        var c = o.has(n);
                        if (!a && c && i) {
                            a = !0;
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var n = console.trace.bind(console), t = "[ext] ";
                                        "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                                        e.args ? t += `#%#//s('${e.name}', '${e.args.join("', '")}')` : t += `#%#//s('${e.name}')`), 
                                        n && n(t);
                                    } catch (e) {}
                                    "function" == typeof window._d && window._d(e);
                                }
                            }(e);
                            i.dispatchEvent(r);
                        }
                    }, c = {
                        apply: function(e, n, t) {
                            var a = t[0];
                            if (n && a) {
                                o.add(a);
                                setTimeout((function() {
                                    r();
                                }), 1);
                            }
                            return Reflect.apply(e, n, t);
                        }
                    };
                    EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, c);
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(_c, a, {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
}
try {
    var _k = "825cac43297bdaf67fe9bf64c058422b";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedDispatchEvent.apply(this, [ {
        name: "trusted-dispatch-event",
        args: [ "ended", "#preroll-video" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "ended", "#preroll-video" ]));
} catch (e) {}
function trustedClickElement(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || _c[r] !== n) {
        var i = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t) {
                var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "", r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : NaN, i = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "", v = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : NaN;
                if (t) {
                    var d = "cookie:", p = "localStorage:", m = "containsText:", h = "clickType:", g = function(e) {
                        return new Promise((function(t) {
                            setTimeout(t, e);
                        }));
                    };
                    !function() {
                        var e = Symbol.for("adg-spoof-click-isTrusted");
                        if (!EventTarget.prototype[e]) {
                            var t = new Set([ "click", "mousedown", "mouseup", "mouseover", "mouseenter", "pointerdown", "pointerup", "pointerover", "pointerenter" ]), n = EventTarget.prototype.addEventListener, r = EventTarget.prototype.removeEventListener, i = new WeakMap, o = function(e, t) {
                                return `${e}\0${function(e) {
                                    var t;
                                    return "boolean" == typeof e ? e : null !== (t = null == e ? void 0 : e.capture) && void 0 !== t && t;
                                }(t)}`;
                            };
                            EventTarget.prototype.addEventListener = function(e, r, u) {
                                if (!r || !t.has(e)) return n.call(this, e, r, u);
                                var a = "function" == typeof r, c = o(e, u), l = function(e) {
                                    var t = new Proxy(e, {
                                        get(e, t) {
                                            if ("isTrusted" === t) return !0;
                                            var n = Reflect.get(e, t);
                                            return "function" == typeof n ? n.bind(e) : n;
                                        },
                                        set: function(e, t, n) {
                                            return Reflect.set(e, t, n);
                                        }
                                    });
                                    return a ? r.call(this, t) : r.handleEvent.call(r, t);
                                }, s = r, f = i.get(s);
                                f || (f = new Map, i.set(s, f));
                                var v = f.get(c);
                                return v || f.set(c, l), n.call(this, e, v || l, u);
                            }, EventTarget.prototype.removeEventListener = function(e, n, u) {
                                if (!n || !t.has(e)) return r.call(this, e, n, u);
                                var a = n, c = o(e, u), l = i.get(a);
                                if (l && l.has(c)) {
                                    var s = l.get(c);
                                    return l.delete(c), r.call(this, e, s, u);
                                }
                                return r.call(this, e, n, u);
                            }, EventTarget.prototype[e] = !0;
                        }
                    }();
                    var y = new WeakMap, E = new Set;
                    if (t.includes(" >>> ")) {
                        var w = {
                            apply: function(e, t, n) {
                                var r, i = Reflect.apply(e, t, n);
                                "closed" === (null === (r = n[0]) || void 0 === r ? void 0 : r.mode) && y.set(t, i);
                                var o = new MutationObserver((function(e) {
                                    s();
                                    e.forEach((function(e) {
                                        t = e.addedNodes, Array.from(t).forEach((function(e) {
                                            (e instanceof HTMLIFrameElement && e.addEventListener("load", (function() {
                                                s();
                                            })), e instanceof Element) && e.querySelectorAll("iframe").forEach((function(e) {
                                                e.addEventListener("load", (function() {
                                                    s();
                                                }));
                                            }));
                                        }));
                                        var t;
                                    }));
                                }));
                                o.observe(i, {
                                    childList: !0,
                                    subtree: !0
                                });
                                E.add(o);
                                return i;
                            }
                        };
                        window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, w);
                    }
                    var b, k = function() {
                        E.forEach((function(e) {
                            return e.disconnect();
                        }));
                        E.clear();
                    }, P = 1e4;
                    if (v) {
                        var T = Number(v);
                        if (!Number.isInteger(T) || T <= 0) {
                            a(e, `Passed observer timeout '${v}' is invalid`);
                            return;
                        }
                        P = 1e3 * T;
                    }
                    if (r) {
                        b = Number(r);
                        if (!Number.isInteger(b) || b < 0) {
                            a(e, `Passed delay '${r}' is invalid`);
                            return;
                        }
                        if (b >= P) {
                            a(e, `Passed delay '${r}' is bigger than ${P} ms`);
                            return;
                        }
                    }
                    var $ = !b, x = [], M = [], I = "", N = "", S = !1, A = !1;
                    n && n.split(/(,\s*){1}(?=!?cookie:|!?localStorage:|containsText:|clickType:)/).map((function(e) {
                        return e.trim();
                    })).forEach((function(t) {
                        if (t.includes(d)) {
                            var {isInvertedMatch: n, matchValue: r} = c(t);
                            S = n;
                            var i = r.replace(d, "");
                            x.push(i);
                        }
                        if (t.includes(p)) {
                            var {isInvertedMatch: o, matchValue: u} = c(t);
                            A = o;
                            var l = u.replace(p, "");
                            M.push(l);
                        }
                        if (t.includes(m)) {
                            var {matchValue: s} = c(t), f = s.replace(m, "");
                            I = f;
                        }
                        if (t.includes(h)) {
                            var {isInvertedMatch: v, matchValue: g} = c(t);
                            if (v) {
                                a(e, `Passed click type '${t}' is invalid`);
                                return;
                            }
                            var y = g.replace(h, "");
                            if ("native" !== y) {
                                a(e, `Passed click type '${y}' is invalid`);
                                return;
                            }
                            N = y;
                        }
                    }));
                    if (x.length > 0) {
                        var R = u(x.join(";")), O = u(document.cookie), j = Object.keys(O);
                        if (0 === j.length) return;
                        if (Object.keys(R).every((function(e) {
                            var t = R[e] ? o(R[e]) : null, n = o(e);
                            return j.some((function(e) {
                                if (!n.test(e)) return !1;
                                if (!t) return !0;
                                var r = O[e];
                                return !!r && t.test(r);
                            }));
                        })) === S) return;
                    }
                    if (M.length > 0 && M.every((function(e) {
                        var t = window.localStorage.getItem(e);
                        return t || "" === t;
                    })) === A) return;
                    var C = I ? o(I) : null, L = t.split(",").map((function(e) {
                        return e.trim();
                    })), W = function(e, t) {
                        return {
                            element: e || null,
                            clicked: !1,
                            selectorText: t || null
                        };
                    }, _ = Array(L.length).fill(W(null)), q = function(t) {
                        try {
                            if (!t.selectorText) return;
                            var n = l(t.selectorText, document.documentElement, null, y);
                            if (!n) {
                                a(e, `Could not find element: '${t.selectorText}'`);
                                return;
                            }
                            f(n, N);
                            t.clicked = !0;
                        } catch (n) {
                            a(e, `Could not click element: '${t.selectorText}'`);
                        }
                    }, F = !1, V = 500;
                    if (i) {
                        var D = i.split(":"), X = D[0], Y = D[1];
                        if ("reloadAfterClick" !== X) {
                            a(e, `Passed reload option '${i}' is invalid`);
                            return;
                        }
                        if (Y) {
                            var B = Number(Y);
                            if (Number.isNaN(B)) {
                                a(e, `Passed reload delay value '${B}' is invalid`);
                                return;
                            }
                            if (B > P) {
                                a(e, `Passed reload delay value '${B}' is bigger than maximum ${P} ms`);
                                return;
                            }
                            V = B;
                        }
                        F = !0;
                    }
                    var H = !0, z = async function() {
                        for (var t = 0; t < _.length; t += 1) {
                            var n = _[t];
                            t >= 1 && await g(150);
                            if (!n.element) break;
                            if (!n.clicked) if (n.element.isConnected) {
                                f(n.element, N);
                                n.clicked = !0;
                            } else q(n);
                        }
                        var r = _.every((function(e) {
                            return !0 === e.clicked;
                        }));
                        if (r) {
                            if (F && H) {
                                H = !1;
                                setTimeout((function() {
                                    window.location.reload();
                                }), V);
                            }
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var t = console.trace.bind(console), n = "[ext] ";
                                        "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                                        e.args ? n += `#%#//s('${e.name}', '${e.args.join("', '")}')` : n += `#%#//s('${e.name}')`), 
                                        t && t(n);
                                    } catch (e) {}
                                    "function" == typeof window._d && window._d(e);
                                }
                            }(e);
                        }
                    }, G = function() {
                        var e = [];
                        L.forEach((function(t, n) {
                            if (t) {
                                var r = l(t, document.documentElement, C, y);
                                if (r) {
                                    !function(e, t, n) {
                                        var r = W(e, n);
                                        _[t] = r;
                                        $ && z();
                                    }(r, n, t);
                                    e.push(t);
                                }
                            }
                        }));
                        return L = L.map((function(t) {
                            return t && e.includes(t) ? null : t;
                        }));
                    }, J = function(e, t) {
                        if ((L = G()).every((function(e) {
                            return null === e;
                        }))) {
                            t.disconnect();
                            k();
                        }
                    }, K = function() {
                        var e, t, n, r, i, o = new MutationObserver((e = J, t = 20, r = !1, i = function() {
                            for (var o = arguments.length, u = new Array(o), a = 0; a < o; a++) u[a] = arguments[a];
                            r ? n = u : (e(...u), r = !0, setTimeout((function() {
                                r = !1, n && (i(...n), n = null);
                            }), t));
                        }, i));
                        o.observe(document.documentElement, {
                            attributes: !0,
                            childList: !0,
                            subtree: !0
                        });
                        setTimeout((function() {
                            o.disconnect();
                            k();
                        }), P);
                    };
                    !function() {
                        if (L.every((function(e) {
                            return !!e && !!l(e, document.documentElement, C, y);
                        }))) {
                            G();
                            k();
                        } else K();
                    }();
                    b && setTimeout((function() {
                        z();
                        $ = !0;
                    }), b);
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(_c, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function o(e) {
        var t = e || "", n = "/";
        if ("" === t) return new RegExp(".?");
        var r, i, o = t.lastIndexOf(n), u = t.substring(o + 1), a = t.substring(0, o + 1), c = (i = u, 
        (r = a).startsWith(n) && r.endsWith(n) && !r.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(i) ? i : "");
        if (t.startsWith(n) && t.endsWith(n) || c) return new RegExp((c ? a : t).slice(1, -1), c);
        var l = t.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(l);
    }
    function u(e) {
        var t = e.split(";"), n = {};
        return t.forEach((function(e) {
            var t, r = "", i = e.indexOf("=");
            -1 === i ? t = e.trim() : (t = e.slice(0, i).trim(), r = e.slice(i + 1)), n[t] = r || null;
        })), n;
    }
    function a(e, t) {
        var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = e;
        if (n || o) {
            var u = console.log;
            r ? u(`${i}: ${t}`) : Array.isArray(t) ? u(`${i}:`, ...t) : u(`${i}:`, t);
        }
    }
    function c(e) {
        var t = !!e && (null == e ? void 0 : e.startsWith("!")), n = t ? e.slice(1) : e;
        return {
            isInvertedMatch: t,
            matchRegexp: o(n),
            matchValue: n
        };
    }
    function l(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : document.documentElement, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null, r = arguments.length > 3 ? arguments[3] : void 0, i = e.indexOf(" >>> ");
        if (-1 === i) return n ? function(e, t, n) {
            for (var r = e.querySelectorAll(t), i = 0; i < r.length; i += 1) if (v(r[i], n)) return r[i];
            return null;
        }(t, e, n) : t.querySelector(e);
        var o = e.slice(0, i).trim(), u = t.querySelector(o);
        if (!u) return null;
        var a = u.shadowRoot || (null == r ? void 0 : r.get(u));
        return a ? l(e.slice(i + 5).trim(), a, n, r) : null;
    }
    function s() {
        var e = `adg-${Math.random().toString(36).slice(2, 9)}`, t = document.documentElement;
        t.setAttribute(e, ""), t.removeAttribute(e);
    }
    function f(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "", n = e.getBoundingClientRect(), r = n.left + n.width / 2, i = n.top + n.height / 2, o = {
            bubbles: !0,
            cancelable: !0,
            composed: !0,
            view: window,
            clientX: r,
            clientY: i,
            screenX: r + window.screenX,
            screenY: i + window.screenY,
            button: 0,
            buttons: 1
        }, u = Object.assign({}, o, {
            bubbles: !1
        }), a = Object.assign({}, o, {
            buttons: 0
        }), c = function(t, n) {
            var r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], i = t.defaultPrevented, o = !1;
            return new Proxy(t, {
                get(t, u) {
                    if ("isTrusted" === u) return !0;
                    if (!r) {
                        var a = Reflect.get(t, u);
                        return "function" == typeof a ? a.bind(t) : a;
                    }
                    if ("nativeEvent" === u) return t;
                    if ("target" === u || "srcElement" === u || "currentTarget" === u) return e;
                    if ("type" === u) return n;
                    if ("defaultPrevented" === u) return i;
                    if ("persist" === u) return function() {};
                    if ("isDefaultPrevented" === u) return function() {
                        return i;
                    };
                    if ("isPropagationStopped" === u) return function() {
                        return o;
                    };
                    if ("preventDefault" === u) return function() {
                        i = !0, t.preventDefault();
                    };
                    if ("stopPropagation" === u) return function() {
                        o = !0, t.stopPropagation();
                    };
                    if ("stopImmediatePropagation" === u) return function() {
                        o = !0, "function" == typeof t.stopImmediatePropagation && t.stopImmediatePropagation();
                    };
                    var c = Reflect.get(t, u);
                    return "function" == typeof c ? c.bind(t) : c;
                }
            });
        }, l = Object.keys(e).find((function(e) {
            return e.startsWith("__reactProps$");
        }));
        if (l && "native" !== t) {
            var s = e[l];
            if (s && "function" == typeof s.onClick) {
                if ("function" == typeof s.onFocus) {
                    var f = "function" == typeof FocusEvent ? new FocusEvent("focus", {
                        bubbles: !1,
                        cancelable: !1,
                        composed: !0,
                        relatedTarget: null
                    }) : new Event("focus", {
                        bubbles: !1,
                        cancelable: !1,
                        composed: !0
                    }), v = c(f, "focus", !0);
                    s.onFocus.call(e, v);
                }
                var d = new MouseEvent("click", a), p = c(d, "click", !0);
                return void s.onClick.call(e, p);
            }
        }
        !function() {
            var t, n, r, i, l = "function" == typeof PointerEvent, s = new Set([ "click", "mousedown", "mouseup", "mouseover", "mouseenter", "pointerdown", "pointerup", "pointerover", "pointerenter" ]), f = (t = e, 
            n = s, r = new Map, i = t, n.forEach((function(e) {
                var t = `on${e}`, n = i[t];
                "function" != typeof n || r.has(t) || (r.set(t, n), i[t] = function(t) {
                    var r = c(t, e);
                    return n.call(this, r);
                });
            })), function() {
                r.forEach((function(e, t) {
                    i[t] = e;
                }));
            });
            try {
                l && (e.dispatchEvent(new PointerEvent("pointerover", o)), e.dispatchEvent(new PointerEvent("pointerenter", u))), 
                e.dispatchEvent(new MouseEvent("mouseover", o)), e.dispatchEvent(new MouseEvent("mouseenter", u)), 
                l && e.dispatchEvent(new PointerEvent("pointerdown", o)), e.dispatchEvent(new MouseEvent("mousedown", o)), 
                e.focus(), l && e.dispatchEvent(new PointerEvent("pointerup", a)), e.dispatchEvent(new MouseEvent("mouseup", a)), 
                e.dispatchEvent(new MouseEvent("click", a));
            } finally {
                f();
            }
        }();
    }
    function v(e, t) {
        var {textContent: n} = e;
        return !!n && t.test(n);
    }
}
try {
    var _k = "6b2951266df639b1f25dd41a34d59873";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedClickElement.apply(this, [ {
        name: "trusted-click-element",
        args: [ "button#preroll-skip", "", "1000" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "button#preroll-skip", "", "1000" ]));
} catch (e) {}
function setSessionStorageItem(e, r) {
    var t = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(r) ? r.join("_") : "");
    if (!e.uniqueId || _c[n] !== t) {
        var i = r ? [].concat(e).concat(r) : [ e ];
        try {
            (function(e, r, t) {
                if (void 0 !== r) {
                    var n;
                    try {
                        n = function(e) {
                            if ("string" != typeof e) throw new Error("Invalid value");
                            var r, t;
                            if (new Set([ "undefined", "false", "true", "null", "", "yes", "no", "on", "off", "accept", "accepted", "reject", "rejected", "allowed", "denied", "forbidden", "forever" ]).has(e.toLowerCase())) r = e; else if ("emptyArr" === e) r = "[]"; else if ("emptyObj" === e) r = "{}"; else if (/^\d+$/.test(e)) {
                                if (t = r = parseFloat(e), (Number.isNaN || window.isNaN)(t)) throw new Error("Invalid value");
                                if (Math.abs(r) > 32767) throw new Error("Invalid value");
                            } else {
                                if ("$remove$" !== e) throw new Error("Invalid value");
                                r = "$remove$";
                            }
                            return r;
                        }(t);
                    } catch (r) {
                        a(e, `Invalid storage item value: '${t}'`);
                        return;
                    }
                    var {sessionStorage: i} = window;
                    "$remove$" === n ? function(e, r, t) {
                        try {
                            if (t.startsWith("/") && (t.endsWith("/") || t.endsWith("/i")) && function(e) {
                                var r, t = function(e) {
                                    return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                }(e);
                                "/" === e[0] && "/" === e[e.length - 1] && (t = e.slice(1, -1));
                                try {
                                    r = new RegExp(t), r = !0;
                                } catch (e) {
                                    r = !1;
                                }
                                return r;
                            }(t)) {
                                var n = function(e) {
                                    var r = e || "", t = "/";
                                    if ("" === r) return new RegExp(".?");
                                    var n, i, a = r.lastIndexOf(t), o = r.substring(a + 1), s = r.substring(0, a + 1), c = (i = o, 
                                    (n = s).startsWith(t) && n.endsWith(t) && !n.endsWith("\\/") && function(e) {
                                        if (!e) return !1;
                                        try {
                                            return new RegExp("", e), !0;
                                        } catch (e) {
                                            return !1;
                                        }
                                    }(i) ? i : "");
                                    if (r.startsWith(t) && r.endsWith(t) || c) return new RegExp((c ? s : r).slice(1, -1), c);
                                    var u = r.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                    return new RegExp(u);
                                }(t);
                                Object.keys(r).forEach((function(e) {
                                    n.test(e) && r.removeItem(e);
                                }));
                            } else r.removeItem(t);
                        } catch (r) {
                            a(e, `Unable to remove storage item due to: ${r.message}`);
                        }
                    }(e, i, r) : function(e, r, t, n) {
                        try {
                            r.setItem(t, n);
                        } catch (r) {
                            a(e, `Unable to set storage item due to: ${r.message}`);
                        }
                    }(e, i, r, n);
                    !function(e) {
                        if (e.verbose) {
                            try {
                                var r = console.trace.bind(console), t = "[ext] ";
                                "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                                e.args ? t += `#%#//s('${e.name}', '${e.args.join("', '")}')` : t += `#%#//s('${e.name}')`), 
                                r && r(t);
                            } catch (e) {}
                            "function" == typeof window._d && window._d(e);
                        }
                    }(e);
                } else a(e, "Item key should be specified.");
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(_c, n, {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function a(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: a} = e;
        if (t || a) {
            var o = console.log;
            n ? o(`${i}: ${r}`) : Array.isArray(r) ? o(`${i}:`, ...r) : o(`${i}:`, r);
        }
    }
}
try {
    var _k = "4b4a7b2f8bf0e470724ee14537e2e1ab";
    if (_b.has(_k)) return;
    _b.add(_k);
    setSessionStorageItem.apply(this, [ {
        name: "set-session-storage-item",
        args: [ "preroll_view_count", "1" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "preroll_view_count", "1" ]));
} catch (e) {}
function trustedReplaceNodeText(t, e) {
    var n = "done", r = t.uniqueId + t.name + "_" + (Array.isArray(e) ? e.join("_") : "");
    if (!t.uniqueId || _c[r] !== n) {
        var i = e ? [].concat(t).concat(e) : [ t ];
        try {
            (function(t, e, n, r, i) {
                for (var a = function(t) {
                    return "string" != typeof t ? t : t.replace(/\\'/g, "'").replace(/\\"/g, '"');
                }, s = a(r), f = a(i), {selector: d, nodeNameMatch: p, textContentMatch: l, patternMatch: v} = function(t, e) {
                    var n, r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null, i = "/", c = !(t.startsWith(i) && t.endsWith(i)), o = c ? t : "*", a = c ? t : u(t), s = e.startsWith(i) ? u(e) : e;
                    return r && (n = r.startsWith(i) ? u(r) : r), {
                        selector: o,
                        nodeNameMatch: a,
                        textContentMatch: s,
                        patternMatch: n
                    };
                }(e, n, s), T = arguments.length, g = new Array(T > 5 ? T - 5 : 0), h = 5; h < T; h++) g[h - 5] = arguments[h];
                var y, m, b = g.includes("verbose"), S = function(e) {
                    return e.forEach((function(e) {
                        if (function(t, e, n) {
                            var {nodeName: r, textContent: i} = t, c = r.toLowerCase();
                            return null !== i && "" !== i && (e instanceof RegExp ? e.test(c) : e === c) && (n instanceof RegExp ? n.test(i) : i.includes(n));
                        }(e, p, l)) {
                            if (b) {
                                var n = e.textContent;
                                n && c(t, `Original text content: ${n}`);
                            }
                            !function(t, e, n, r) {
                                var {textContent: i} = e;
                                if (i) {
                                    var c = i.replace(n, r);
                                    "SCRIPT" === e.nodeName && (c = function(t) {
                                        var e, n = null == t || null === (e = t.api) || void 0 === e ? void 0 : e.policy;
                                        if (n) return n;
                                        var r = "AGPolicy", i = window.trustedTypes, c = !!i, o = {
                                            HTML: "TrustedHTML",
                                            Script: "TrustedScript",
                                            ScriptURL: "TrustedScriptURL"
                                        };
                                        if (!c) return {
                                            name: r,
                                            isSupported: c,
                                            TrustedType: o,
                                            createHTML: function(t) {
                                                return t;
                                            },
                                            createScript: function(t) {
                                                return t;
                                            },
                                            createScriptURL: function(t) {
                                                return t;
                                            },
                                            create: function(t, e) {
                                                return e;
                                            },
                                            getAttributeType: function() {
                                                return null;
                                            },
                                            convertAttributeToTrusted: function(t, e, n) {
                                                return n;
                                            },
                                            getPropertyType: function() {
                                                return null;
                                            },
                                            convertPropertyToTrusted: function(t, e, n) {
                                                return n;
                                            },
                                            isHTML: function() {
                                                return !1;
                                            },
                                            isScript: function() {
                                                return !1;
                                            },
                                            isScriptURL: function() {
                                                return !1;
                                            }
                                        };
                                        var u = i.createPolicy(r, {
                                            createHTML: function(t) {
                                                return t;
                                            },
                                            createScript: function(t) {
                                                return t;
                                            },
                                            createScriptURL: function(t) {
                                                return t;
                                            }
                                        }), a = function(t) {
                                            return u.createHTML(t);
                                        }, s = function(t) {
                                            return u.createScript(t);
                                        }, f = function(t) {
                                            return u.createScriptURL(t);
                                        }, d = function(t, e) {
                                            switch (t) {
                                              case o.HTML:
                                                return a(e);

                                              case o.Script:
                                                return s(e);

                                              case o.ScriptURL:
                                                return f(e);

                                              default:
                                                return e;
                                            }
                                        }, p = i.getAttributeType.bind(i), l = i.getPropertyType.bind(i), v = i.isHTML.bind(i), T = i.isScript.bind(i), g = i.isScriptURL.bind(i);
                                        return {
                                            name: r,
                                            isSupported: c,
                                            TrustedType: o,
                                            createHTML: a,
                                            createScript: s,
                                            createScriptURL: f,
                                            create: d,
                                            getAttributeType: p,
                                            convertAttributeToTrusted: function(t, e, n, r, i) {
                                                var c = p(t, e, r, i);
                                                return c ? d(c, n) : n;
                                            },
                                            getPropertyType: l,
                                            convertPropertyToTrusted: function(t, e, n, r) {
                                                var i = l(t, e, r);
                                                return i ? d(i, n) : n;
                                            },
                                            isHTML: v,
                                            isScript: T,
                                            isScriptURL: g
                                        };
                                    }(t).createScript(c));
                                    e.textContent = c, function(t) {
                                        if (t.verbose) {
                                            try {
                                                var e = console.trace.bind(console), n = "[ext] ";
                                                "corelibs" === t.engine ? n += t.ruleText : (t.domainName && (n += `${t.domainName}`), 
                                                t.args ? n += `#%#//s('${t.name}', '${t.args.join("', '")}')` : n += `#%#//s('${t.name}')`), 
                                                e && e(n);
                                            } catch (t) {}
                                            "function" == typeof window._d && window._d(t);
                                        }
                                    }(t);
                                }
                            }(t, e, v, f);
                            if (b) {
                                var r = e.textContent;
                                r && c(t, `Modified text content: ${r}`);
                            }
                        }
                    }));
                };
                document.documentElement && (y = d, m = S, [ document ].forEach((function(t) {
                    return function(t) {
                        if ("#text" === y) {
                            var e = o(t.childNodes).filter((function(t) {
                                return t.nodeType === Node.TEXT_NODE;
                            }));
                            m(e);
                        } else {
                            var n = o(t.querySelectorAll(y));
                            m(n);
                        }
                    }(t);
                })));
                !function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {
                        subtree: !0,
                        childList: !0
                    }, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1e4, r = new MutationObserver((function(n, r) {
                        r.disconnect(), t(n, r), r.observe(document.documentElement, e);
                    }));
                    r.observe(document.documentElement, e), "number" == typeof n && setTimeout((function() {
                        return r.disconnect();
                    }), n);
                }((function(t) {
                    return function(t, e) {
                        var n = function(t) {
                            for (var e = [], n = 0; n < t.length; n += 1) for (var {addedNodes: r} = t[n], i = 0; i < r.length; i += 1) e.push(r[i]);
                            return e;
                        }(t);
                        e(n);
                    }(t, S);
                }));
            }).apply(this, i);
            t.uniqueId && Object.defineProperty(_c, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {}
    }
    function c(t, e) {
        var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: c} = t;
        if (n || c) {
            var o = console.log;
            r ? o(`${i}: ${e}`) : Array.isArray(e) ? o(`${i}:`, ...e) : o(`${i}:`, e);
        }
    }
    function o(t) {
        for (var e = [], n = 0; n < t.length; n += 1) e.push(t[n]);
        return e;
    }
    function u(t) {
        var e = t || "", n = "/";
        if ("" === e) return new RegExp(".?");
        var r, i, c = e.lastIndexOf(n), o = e.substring(c + 1), u = e.substring(0, c + 1), a = (i = o, 
        (r = u).startsWith(n) && r.endsWith(n) && !r.endsWith("\\/") && function(t) {
            if (!t) return !1;
            try {
                return new RegExp("", t), !0;
            } catch (t) {
                return !1;
            }
        }(i) ? i : "");
        if (e.startsWith(n) && e.endsWith(n) || a) return new RegExp((a ? u : e).slice(1, -1), a);
        var s = e.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(s);
    }
}
try {
    var _k = "7f6e8b220be96db37ca9fe389ed1fc4c";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "prerollEnabled", "prerollEnabled:true", "prerollEnabled:false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "prerollEnabled", "prerollEnabled:true", "prerollEnabled:false" ]));
} catch (e) {}
try {
    var _k = "72304fae9876186b2587db286c136910";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "videoSources", "/window\\.app\\.initAdv\\(\\);/", "window.app.initMatch();" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "videoSources", "/window\\.app\\.initAdv\\(\\);/", "window.app.initMatch();" ]));
} catch (e) {}
try {
    var _k = "cfd2bcb56dbd4b5d6bcafe68156737ae";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "playAdd", "/manageAds\\(video_urls\\[activeItem\\]\\, video_seconds\\[activeItem\\]\\, ad_urls\\[activeItem]\\,true\\);/", "playVideo();" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "playAdd", "/manageAds\\(video_urls\\[activeItem\\]\\, video_seconds\\[activeItem\\]\\, ad_urls\\[activeItem]\\,true\\);/", "playVideo();" ]));
} catch (e) {}
try {
    var _k = "39a5464e1136c5c1969d01e86b30a2b6";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "money_current", "(money_current+1 == money_vids.length)", "(true)" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "money_current", "(money_current+1 == money_vids.length)", "(true)" ]));
} catch (e) {}
try {
    var _k = "907139140a253b880ec60f6433df016a";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "prerollEnabled", "/prerollEnabled:\\s*true/", "prerollEnabled:false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "prerollEnabled", "/prerollEnabled:\\s*true/", "prerollEnabled:false" ]));
} catch (e) {}
function setConstant(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || _c[r] !== n) {
        var i = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, n) {
                var r, i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", m = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "", $ = arguments.length > 5 && void 0 !== arguments[5] && arguments[5];
                if ([ "set-constant.js", "ubo-set-constant.js", "set.js", "ubo-set.js", "ubo-set-constant", "ubo-set" ].includes(e.name)) {
                    1 === i.length || !p(r = parseInt(i, 10)) && r || (m = i);
                    i = void 0;
                }
                if (t) {
                    var j, w = !1;
                    if ("undefined" === n) j = void 0; else if ("false" === n) j = !1; else if ("true" === n) j = !0; else if ("null" === n) j = null; else if ("emptyArr" === n) j = []; else if ("emptyObj" === n) j = {}; else if ("noopFunc" === n) j = s; else if ("noopCallbackFunc" === n) j = a; else if ("trueFunc" === n) j = u; else if ("falseFunc" === n) j = c; else if ("throwFunc" === n) j = l; else if ("noopPromiseResolve" === n) j = d; else if ("noopPromiseReject" === n) j = f; else if (/^\d+$/.test(n)) {
                        if (p(j = parseFloat(n))) return;
                        if (Math.abs(j) > 32767) return;
                    } else if ("-1" === n) j = -1; else if ("" === n) j = ""; else if ("yes" === n) j = "yes"; else {
                        if ("no" !== n) return;
                        j = "no";
                    }
                    [ "asFunction", "asCallback", "asResolved", "asRejected" ].includes(m) && (j = {
                        asFunction: e => function() {
                            return e;
                        },
                        asCallback: e => function() {
                            return function() {
                                return e;
                            };
                        },
                        asResolved: e => Promise.resolve(e),
                        asRejected: e => Promise.reject(e)
                    }[m](j));
                    var x = !1, R = function(e) {
                        var {source: t, stack: n, mustCancel: r, trapProp: i, getConstantValue: s, setConstantValue: a} = e, u = function(e, c) {
                            var l = g(e, c), {base: f, prop: d, chain: p} = l, m = {
                                factValue: void 0,
                                init(e) {
                                    return this.factValue = e, !0;
                                },
                                get() {
                                    return this.factValue;
                                },
                                set(e) {
                                    this.factValue !== e && (this.factValue = e, e instanceof Object && u(e, p));
                                }
                            }, $ = {
                                factValue: void 0,
                                descriptorAddon: y(),
                                init(e) {
                                    return !r(e) && (this.factValue = e, !0);
                                },
                                get() {
                                    if (!n) return o(t), s();
                                    if (!this.descriptorAddon.isAbortingSuspended) {
                                        this.descriptorAddon.isAbortingSuspended = !0;
                                        var e = !1;
                                        try {
                                            e = function(e, t) {
                                                if (!e || "" === e) return !0;
                                                var n = function() {
                                                    try {
                                                        for (var e = [], t = 1; t < 10; t += 1) {
                                                            var n = `$${t}`;
                                                            if (!RegExp[n]) break;
                                                            e.push(RegExp[n]);
                                                        }
                                                        return e;
                                                    } catch (e) {
                                                        return [];
                                                    }
                                                }();
                                                if (function(e, t) {
                                                    var n = "inlineScript", r = "injectedScript", i = function(e) {
                                                        return e.includes(n);
                                                    }, o = function(e) {
                                                        return e.includes(r);
                                                    };
                                                    if (!i(e) && !o(e)) return !1;
                                                    var s = window.location.href, a = s.indexOf("#");
                                                    -1 !== a && (s = s.slice(0, a));
                                                    var u = t.split("\n").slice(2).map((function(e) {
                                                        return e.trim();
                                                    })).map((function(e) {
                                                        var t, i = /(.*?@)?(\S+)(:\d+)(:\d+)\)?$/.exec(e);
                                                        if (i) {
                                                            var o, a, u = i[2], c = i[3], l = i[4];
                                                            if (null !== (o = u) && void 0 !== o && o.startsWith("(") && (u = u.slice(1)), null !== (a = u) && void 0 !== a && a.startsWith("<anonymous>")) {
                                                                var f;
                                                                u = r;
                                                                var d = void 0 !== i[1] ? i[1].slice(0, -1) : e.slice(0, i.index).trim();
                                                                null !== (f = d) && void 0 !== f && f.startsWith("at") && (d = d.slice(2).trim()), 
                                                                t = `${d} ${u}${c}${l}`.trim();
                                                            } else t = u === s ? `${n}${c}${l}`.trim() : `${u}${c}${l}`.trim();
                                                        } else t = e;
                                                        return t;
                                                    }));
                                                    if (u) for (var c = 0; c < u.length; c += 1) {
                                                        if (i(e) && u[c].startsWith(n) && u[c].match(v(e))) return !0;
                                                        if (o(e) && u[c].startsWith(r) && u[c].match(v(e))) return !0;
                                                    }
                                                    return !1;
                                                }(e, t)) return n.length && n[0] !== RegExp.$1 && h(n), !0;
                                                var r = v(e), i = t.split("\n").slice(2).map((function(e) {
                                                    return e.trim();
                                                })).join("\n");
                                                return n.length && n[0] !== RegExp.$1 && h(n), function() {
                                                    var e = Object.getOwnPropertyDescriptor(RegExp.prototype, "test"), t = null == e ? void 0 : e.value;
                                                    if (e && "function" == typeof e.value) return t;
                                                    throw new Error("RegExp.prototype.test is not a function");
                                                }().call(r, i);
                                            }(n, (new Error).stack || "");
                                        } catch (e) {
                                            return this.descriptorAddon.isAbortingSuspended = !1, this.factValue;
                                        }
                                        if (this.descriptorAddon.isAbortingSuspended = !1, e) return o(t), s();
                                    }
                                    return this.factValue;
                                },
                                set(e) {
                                    r(e) ? a(e) : this.factValue = e;
                                }
                            };
                            if (p) if (void 0 === f || null !== f[d]) {
                                (f instanceof Object || "object" == typeof f) && b(f) && i(f, d, !0, m);
                                var j = e[d];
                                (j instanceof Object || "object" == typeof j && null !== j) && u(j, p), i(f, d, !0, m);
                            } else i(f, d, !0, m); else i(f, d, !1, $);
                        };
                        return u;
                    }({
                        source: e,
                        stack: i,
                        mustCancel: function(e) {
                            return x || (x = void 0 !== e && void 0 !== j && typeof e != typeof j && null !== e);
                        },
                        trapProp: function(n, r, i, o) {
                            if (!o.init(n[r])) return !1;
                            var s, a = Object.getOwnPropertyDescriptor(n, r);
                            if (a instanceof Object) {
                                if (!a.configurable) {
                                    !function(e, t) {
                                        var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = e;
                                        if (n || o) {
                                            var s = console.log;
                                            r ? s(`${i}: ${t}`) : Array.isArray(t) ? s(`${i}:`, ...t) : s(`${i}:`, t);
                                        }
                                    }(e, `Property '${r}' is not configurable`);
                                    return !1;
                                }
                                n[r] && (n[r] = j);
                                a.set instanceof Function && (s = a.set);
                            }
                            Object.defineProperty(n, r, {
                                configurable: i,
                                get: () => o.get(),
                                set(e) {
                                    void 0 !== s && s(e);
                                    if (e instanceof Object) {
                                        var n = t.split(".").slice(1);
                                        if ($ && !w) {
                                            w = !0;
                                            e = new Proxy(e, {
                                                get: function(e, t, r) {
                                                    n.reduce((function(e, t, n, r) {
                                                        var i = null == e ? void 0 : e[t];
                                                        n === r.length - 1 && i !== j && (e[t] = j);
                                                        return i || e;
                                                    }), e);
                                                    return Reflect.get(e, t, r);
                                                }
                                            });
                                        }
                                    }
                                    o.set(e);
                                }
                            });
                            return !0;
                        },
                        getConstantValue: function() {
                            return j;
                        },
                        setConstantValue: function(e) {
                            j = e;
                        }
                    });
                    R(window, t);
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(_c, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function o(e) {
        if (e.verbose) {
            try {
                var t = console.trace.bind(console), n = "[ext] ";
                "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                e.args ? n += `#%#//s('${e.name}', '${e.args.join("', '")}')` : n += `#%#//s('${e.name}')`), 
                t && t(n);
            } catch (e) {}
            "function" == typeof window._d && window._d(e);
        }
    }
    function s() {}
    function a() {
        return s;
    }
    function u() {
        return !0;
    }
    function c() {
        return !1;
    }
    function l() {
        throw new Error;
    }
    function f() {
        return Promise.reject();
    }
    function d() {
        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "{}", t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "", n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "basic";
        if ("undefined" != typeof Response) {
            var r = new Response(e, {
                headers: {
                    "Content-Length": `${e.length}`
                },
                status: 200,
                statusText: "OK"
            });
            return "opaque" === n ? Object.defineProperties(r, {
                body: {
                    value: null
                },
                status: {
                    value: 0
                },
                ok: {
                    value: !1
                },
                statusText: {
                    value: ""
                },
                url: {
                    value: ""
                },
                type: {
                    value: n
                }
            }) : Object.defineProperties(r, {
                url: {
                    value: t
                },
                type: {
                    value: n
                }
            }), Promise.resolve(r);
        }
    }
    function p(e) {
        return (Number.isNaN || window.isNaN)(e);
    }
    function v(e) {
        var t = e || "", n = "/";
        if ("" === t) return new RegExp(".?");
        var r, i, o = t.lastIndexOf(n), s = t.substring(o + 1), a = t.substring(0, o + 1), u = (i = s, 
        (r = a).startsWith(n) && r.endsWith(n) && !r.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(i) ? i : "");
        if (t.startsWith(n) && t.endsWith(n) || u) return new RegExp((u ? a : t).slice(1, -1), u);
        var c = t.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(c);
    }
    function h(e) {
        if (e.length) try {
            var t;
            t = 1 === e.length ? `(${e[0]})` : e.reduce((function(e, t, n) {
                return 1 === n ? `(${e}),(${t})` : `${e},(${t})`;
            }));
            var n = new RegExp(t);
            e.toString().replace(n, "");
        } catch (e) {
            var r = `Failed to restore RegExp values: ${e}`;
            console.log(r);
        }
    }
    function g(e, t) {
        var n = t.indexOf(".");
        if (-1 === n) return {
            base: e,
            prop: t
        };
        var r = t.slice(0, n);
        if (null === e) return {
            base: e,
            prop: r,
            chain: t
        };
        var i = e[r];
        return t = t.slice(n + 1), (e instanceof Object || "object" == typeof e) && b(e) || null === i ? {
            base: e,
            prop: r,
            chain: t
        } : void 0 !== i ? g(i, t) : (Object.defineProperty(e, r, {
            configurable: !0
        }), {
            base: e,
            prop: r,
            chain: t
        });
    }
    function b(e) {
        return 0 === Object.keys(e).length && !e.prototype;
    }
    function y() {
        return {
            isAbortingSuspended: !1,
            isolateCallback(e) {
                this.isAbortingSuspended = !0;
                try {
                    for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
                    var i = e(...n);
                    return this.isAbortingSuspended = !1, i;
                } catch (e) {
                    var o = randomId();
                    throw this.isAbortingSuspended = !1, new ReferenceError(o);
                }
            }
        };
    }
}
try {
    var _k = "8bbafe881f8c4067be52307fdeb292f6";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.advertisement.enabled", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.advertisement.enabled", "false" ]));
} catch (e) {}
try {
    var _k = "aaafef5c5f3d65b03e90086816631292";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.adv.enabled", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.adv.enabled", "false" ]));
} catch (a) {}
try {
    var _k = "eff9c596616271fb311bcd1a0b6997f9";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.adv.enabled", "0" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.adv.enabled", "0" ]));
} catch (e) {}
try {
    var _k = "e8c00e1afd2246a60b45aa322ecbbcef";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "window.advertisement.states.activate", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "window.advertisement.states.activate", "false" ]));
} catch (e) {}
try {
    var _k = "28ab96ac124be1c4fb036630638dea7c";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "window.config.adv.enabled", "0" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "window.config.adv.enabled", "0" ]));
} catch (n) {}
try {
    var _k = "c1c63ffb5d91f7a646dfd1873ae9cc9f";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "puShown", "true" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "puShown", "true" ]));
} catch (e) {}
try {
    var _k = "f4432af6695d81325d4de4f84fb51857";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "adscfg.enabled", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "adscfg.enabled", "false" ]));
} catch (e) {}
try {
    var _k = "3856fe61cc348f558798057ab731f4a0";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "player.vroll", "noopFunc" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "player.vroll", "noopFunc" ]));
} catch (n) {}
try {
    var _k = "00b1e9fcc03571e93bdebdcd18b0932f";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "Object.prototype.adSkipped", "true" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "Object.prototype.adSkipped", "true" ]));
} catch (e) {}
try {
    var _k = "7c09148dd3eae9d1779aba6d4d6acd6d";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "document.referrer", "" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "document.referrer", "" ]));
} catch (e) {}
try {
    var _k = "203dce156c30ad5430316158e46c7026";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "getFrontVideo", "noopFunc" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "getFrontVideo", "noopFunc" ]));
} catch (n) {}
try {
    var _k = "7e2a4e30b0fe5806e8660c2ef31ec39c";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "isShow", "true" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "isShow", "true" ]));
} catch (e) {}
try {
    var _k = "d535f7ede264829ed6b446d8c8e7c46c";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.adv", "emptyObj" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.adv", "emptyObj" ]));
} catch (e) {}
try {
    var _k = "7f8680dd608a0aa6da1d147dcd229e78";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "video_shown", "1" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "video_shown", "1" ]));
} catch (a) {}
function setCookie(e, n) {
    var o = "done", i = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || _c[i] !== o) {
        var a = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, o) {
                var i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "/", a = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "", t = function(e) {
                    if (!e) return null;
                    var n, o;
                    if (new Set([ "true", "t", "false", "f", "yes", "y", "no", "n", "ok", "on", "off", "accept", "accepted", "notaccepted", "reject", "rejected", "allow", "allowed", "disallow", "deny", "denied", "enable", "enabled", "disable", "disabled", "necessary", "required", "hide", "hidden", "essential", "nonessential", "checked", "unchecked", "forbidden", "forever", "declined", "mandatory", "all" ]).has(e.toLowerCase())) n = e; else if ("emptyArr" === e) n = "[]"; else if ("emptyObj" === e) n = "{}"; else {
                        if (!/^\d+$/.test(e)) return null;
                        if (o = n = parseFloat(e), (Number.isNaN || window.isNaN)(o)) return null;
                        if (Math.abs(n) < 0 || Math.abs(n) > 32767) return null;
                    }
                    return n;
                }(o);
                if (null !== t) if ("/" === (l = i) || "none" === l) {
                    var l;
                    if (document.location.origin.includes(a)) {
                        var d = function(e, n, o) {
                            var i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", a = !(arguments.length > 4 && void 0 !== arguments[4]) || arguments[4];
                            if (!a && `${n}`.includes(";") || e.includes(";")) return null;
                            var r = `${e}=${a ? encodeURIComponent(n) : n}`;
                            if (e.startsWith("__Host-")) return r += "; path=/; secure", i && console.debug(`Domain value: "${i}" has been ignored, because is not allowed for __Host- prefixed cookies`), 
                            r;
                            var t = function(e) {
                                return "/" === e ? "path=/" : "";
                            }(o);
                            return t && (r += `; ${t}`), e.startsWith("__Secure-") && (r += "; secure"), i && (r += `; domain=${i}`), 
                            r;
                        }(n, t, i, a, !1);
                        if (d) {
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var n = console.trace.bind(console), o = "[ext] ";
                                        "corelibs" === e.engine ? o += e.ruleText : (e.domainName && (o += `${e.domainName}`), 
                                        e.args ? o += `#%#//s('${e.name}', '${e.args.join("', '")}')` : o += `#%#//s('${e.name}')`), 
                                        n && n(o);
                                    } catch (e) {}
                                    "function" == typeof window._d && window._d(e);
                                }
                            }(e);
                            document.cookie = d;
                        } else r(e, "Invalid cookie name or value");
                    } else r(e, `Cookie domain not matched by origin: '${a}'`);
                } else r(e, `Invalid cookie path: '${i}'`); else r(e, `Invalid cookie value: '${t}'`);
            }).apply(this, a);
            e.uniqueId && Object.defineProperty(_c, i, {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function r(e, n) {
        var o = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], i = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: a, verbose: r} = e;
        if (o || r) {
            var t = console.log;
            i ? t(`${a}: ${n}`) : Array.isArray(n) ? t(`${a}:`, ...n) : t(`${a}:`, n);
        }
    }
}
try {
    var _k = "15b03fded13fe835ccf191ea43e594d7";
    if (_b.has(_k)) return;
    _b.add(_k);
    setCookie.apply(this, [ {
        name: "set-cookie",
        args: [ "reklamgosterimx", "ok" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "reklamgosterimx", "ok" ]));
} catch (e) {}
function removeAttr(e, n) {
    var t = "done", o = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || _c[o] !== t) {
        var a = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, t) {
                var o = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "asap stay";
                if (n) {
                    n = n.split(/\s*\|\s*/);
                    t || (t = `[${n.join("],[")}]`);
                    var a, r, c, u, l, s, d = function() {
                        var o = [];
                        try {
                            o = [].slice.call(document.querySelectorAll(t));
                        } catch (n) {
                            !function(e, n) {
                                var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], o = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: a, verbose: i} = e;
                                if (t || i) {
                                    var r = console.log;
                                    o ? r(`${a}: ${n}`) : Array.isArray(n) ? r(`${a}:`, ...n) : r(`${a}:`, n);
                                }
                            }(e, `Invalid selector arg: '${t}'`);
                        }
                        var a = !1;
                        o.forEach((function(e) {
                            n.forEach((function(n) {
                                e.removeAttribute(n);
                                a = !0;
                            }));
                        }));
                        a && function(e) {
                            if (e.verbose) {
                                try {
                                    var n = console.trace.bind(console), t = "[ext] ";
                                    "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                                    e.args ? t += `#%#//s('${e.name}', '${e.args.join("', '")}')` : t += `#%#//s('${e.name}')`), 
                                    n && n(t);
                                } catch (e) {}
                                "function" == typeof window._d && window._d(e);
                            }
                        }(e);
                    }, f = (a = o, r = "asap", c = "complete", u = "stay", l = new Set([ r, c, u ]), 
                    s = new Set(a.trim().split(" ").filter((function(e) {
                        return l.has(e);
                    }))), {
                        ASAP: r,
                        COMPLETE: c,
                        STAY: u,
                        hasFlag: function(e) {
                            return s.has(e);
                        }
                    });
                    f.hasFlag(f.ASAP) && ("loading" === document.readyState ? window.addEventListener("DOMContentLoaded", d, {
                        once: !0
                    }) : d());
                    if ("complete" !== document.readyState && f.hasFlag(f.COMPLETE)) window.addEventListener("load", (function() {
                        d();
                        f.hasFlag(f.STAY) && i(d, !0);
                    }), {
                        once: !0
                    }); else if (f.hasFlag(f.STAY)) {
                        o.includes(" ") || d();
                        i(d, !0);
                    }
                }
            }).apply(this, a);
            e.uniqueId && Object.defineProperty(_c, o, {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function i(e) {
        var n = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : [], o = new MutationObserver(function(e, n) {
            var t, o = !1, a = function() {
                for (var i = arguments.length, r = new Array(i), c = 0; c < i; c++) r[c] = arguments[c];
                o ? t = r : (e(...r), o = !0, setTimeout((function() {
                    o = !1, t && (a(...t), t = null);
                }), n));
            };
            return a;
        }((function() {
            i(), e(), a();
        }), 20)), a = function() {
            t.length > 0 ? o.observe(document.documentElement, {
                childList: !0,
                subtree: !0,
                attributes: n,
                attributeFilter: t
            }) : o.observe(document.documentElement, {
                childList: !0,
                subtree: !0,
                attributes: n
            });
        }, i = function() {
            o.disconnect();
        };
        a();
    }
}
try {
    var _k = "2576627ab8cfd3a405e6bbb39bfb38d9";
    if (_b.has(_k)) return;
    _b.add(_k);
    removeAttr.apply(this, [ {
        name: "remove-attr",
        args: [ "loading", 'iframe[loading="lazy"]' ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "loading", 'iframe[loading="lazy"]' ]));
} catch (a) {}
function trustedSetCookie(e, n) {
    var i = "done", o = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || _c[o] !== i) {
        var r = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, i) {
                var o = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", r = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "/", a = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : "";
                if (void 0 !== n) if (void 0 !== i) {
                    var u, c, s = (c = u = i, "$now$" === u ? c = Date.now().toString() : "$currentDate$" === u ? c = Date() : "$currentISODate$" === u && (c = (new Date).toISOString()), 
                    c);
                    if ("/" === (l = r) || "none" === l) {
                        var l;
                        if (document.location.origin.includes(a)) {
                            var d = function(e, n, i) {
                                var o = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", r = !(arguments.length > 4 && void 0 !== arguments[4]) || arguments[4];
                                if (!r && `${n}`.includes(";") || e.includes(";")) return null;
                                var t = `${e}=${r ? encodeURIComponent(n) : n}`;
                                if (e.startsWith("__Host-")) return t += "; path=/; secure", o && console.debug(`Domain value: "${o}" has been ignored, because is not allowed for __Host- prefixed cookies`), 
                                t;
                                var a = function(e) {
                                    return "/" === e ? "path=/" : "";
                                }(i);
                                return a && (t += `; ${a}`), e.startsWith("__Secure-") && (t += "; secure"), o && (t += `; domain=${o}`), 
                                t;
                            }(n, s, r, a, !1);
                            if (d) {
                                if (o) {
                                    var v = function(e) {
                                        var n;
                                        if ("1year" === e) n = 31536e3; else if ("1day" === e) n = 86400; else if (n = Number.parseInt(e, 10), 
                                        Number.isNaN(n)) return null;
                                        return 1e3 * n;
                                    }(o);
                                    if (!v) {
                                        t(e, `Invalid offsetExpiresSec value: ${o}`);
                                        return;
                                    }
                                    var f = Date.now() + v;
                                    d += `; expires=${new Date(f).toUTCString()}`;
                                }
                                document.cookie = d;
                                !function(e) {
                                    if (e.verbose) {
                                        try {
                                            var n = console.trace.bind(console), i = "[ext] ";
                                            "corelibs" === e.engine ? i += e.ruleText : (e.domainName && (i += `${e.domainName}`), 
                                            e.args ? i += `#%#//s('${e.name}', '${e.args.join("', '")}')` : i += `#%#//s('${e.name}')`), 
                                            n && n(i);
                                        } catch (e) {}
                                        "function" == typeof window._d && window._d(e);
                                    }
                                }(e);
                            } else t(e, "Invalid cookie name or value");
                        } else t(e, `Cookie domain not matched by origin: '${a}'`);
                    } else t(e, `Invalid cookie path: '${r}'`);
                } else t(e, "Cookie value should be specified"); else t(e, "Cookie name should be specified");
            }).apply(this, r);
            e.uniqueId && Object.defineProperty(_c, o, {
                value: i,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function t(e, n) {
        var i = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], o = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: r, verbose: t} = e;
        if (i || t) {
            var a = console.log;
            o ? a(`${r}: ${n}`) : Array.isArray(n) ? a(`${r}:`, ...n) : a(`${r}:`, n);
        }
    }
}
try {
    var _k = "77e6173dc430ae530ac895d01091200f";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedSetCookie.apply(this, [ {
        name: "trusted-set-cookie",
        args: [ "fafafafaaaaa", "undefined" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "fafafafaaaaa", "undefined" ]));
} catch (a) {}
})();
