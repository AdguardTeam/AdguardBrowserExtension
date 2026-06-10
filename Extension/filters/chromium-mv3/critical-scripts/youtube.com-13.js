(function () {
function preventSetTimeout(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== n) {
        var i = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, n) {
                var r = void 0 === t && void 0 === n, i = {
                    apply: function(i, l, s) {
                        var d = s[0], f = s[1], v = !1;
                        if (r) {
                            a(e);
                            !function(e, t) {
                                var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: a} = e;
                                if (n || a) {
                                    var o = console.log;
                                    r ? o(`${i}: ${t}`) : Array.isArray(t) ? o(`${i}:`, ...t) : o(`${i}:`, t);
                                }
                            }(e, `setTimeout(${String(d)}, ${f})`, !0);
                        } else v = function(e) {
                            var {callback: t, delay: n, matchCallback: r, matchDelay: i} = e;
                            if (!function(e) {
                                return e instanceof Function || "string" == typeof e;
                            }(t)) return !1;
                            if (!function(e) {
                                var t = e;
                                return null != e && e.startsWith("!") && (t = e.slice(1)), function(e) {
                                    var t, n = function(e) {
                                        return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                    }(e);
                                    "/" === e[0] && "/" === e[e.length - 1] && (n = e.slice(1, -1));
                                    try {
                                        t = new RegExp(n), t = !0;
                                    } catch (e) {
                                        t = !1;
                                    }
                                    return t;
                                }(t);
                            }(r) || i && !function(e) {
                                var t = e;
                                null != e && e.startsWith("!") && (t = e.slice(1));
                                var n = parseFloat(t);
                                return !u(n) && function(e) {
                                    return (Number.isFinite || window.isFinite)(e);
                                }(n);
                            }(i)) return !1;
                            var {isInvertedMatch: a, matchRegexp: o} = function(e) {
                                var t = !!e && (null == e ? void 0 : e.startsWith("!")), n = t ? e.slice(1) : e;
                                return {
                                    isInvertedMatch: t,
                                    matchRegexp: c(n),
                                    matchValue: n
                                };
                            }(r), {isInvertedDelayMatch: l, delayMatch: s} = function(e) {
                                var t = null == e ? void 0 : e.startsWith("!"), n = t ? e.slice(1) : e, r = parseInt(n, 10);
                                return {
                                    isInvertedDelayMatch: t,
                                    delayMatch: u(r) ? null : r
                                };
                            }(i), d = function(e) {
                                var t = Math.floor(parseInt(e, 10));
                                return "number" != typeof t || u(t) ? e : t;
                            }(n), f = String(t);
                            return null === s ? o.test(f) !== a : r ? o.test(f) !== a && d === s !== l : d === s !== l;
                        }({
                            callback: d,
                            delay: f,
                            matchCallback: t,
                            matchDelay: n
                        });
                        if (v) {
                            a(e);
                            s[0] = o;
                        }
                        return i.apply(l, s);
                    }
                };
                window.setTimeout = new Proxy(window.setTimeout, i);
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function a(e) {
        if (e.verbose) {
            try {
                var t = console.trace.bind(console), n = "[AdGuard] ";
                "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                e.args ? n += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : n += `#%#//scriptlet('${e.name}')`), 
                t && t(n);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
        }
    }
    function o() {}
    function c(e) {
        var t = e || "", n = "/";
        if ("" === t) return new RegExp(".?");
        var r, i, a = t.lastIndexOf(n), o = t.substring(a + 1), c = t.substring(0, a + 1), u = (i = o, 
        (r = c).startsWith(n) && r.endsWith(n) && !r.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(i) ? i : "");
        if (t.startsWith(n) && t.endsWith(n) || u) return new RegExp((u ? c : t).slice(1, -1), u);
        var l = t.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(l);
    }
    function u(e) {
        return (Number.isNaN || window.isNaN)(e);
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["1f60e745add984b8d682b8e4d2a1eccd"] === e) return;
    preventSetTimeout.apply(this, [ {
        name: "prevent-setTimeout",
        args: [ "offsetHeight === 0" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "offsetHeight === 0" ]));
    Object.defineProperty(Window.prototype.toString, "1f60e745add984b8d682b8e4d2a1eccd", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "1f60e745add984b8d682b8e4d2a1eccd" due to: ' + e);
}
function preventXHR(e, t) {
    var r = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[n] !== r) {
        var a = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, r) {
                if ("undefined" != typeof Proxy) {
                    var n, a = window.XMLHttpRequest.prototype.open, c = window.XMLHttpRequest.prototype.getResponseHeader, f = window.XMLHttpRequest.prototype.getAllResponseHeaders, d = new Map, v = new Map, y = "", g = "", w = {
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
                    }, h = {
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
                            var f = new XMLHttpRequest, w = function(t) {
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
                                d.get(n).shouldFireFirstStage && w(1);
                                var e = new ProgressEvent("loadstart");
                                n.dispatchEvent(e);
                                w(2);
                                w(3);
                                var t = new ProgressEvent("progress");
                                n.dispatchEvent(t);
                                w(4);
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
                    XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, w);
                    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, h);
                    XMLHttpRequest.prototype.getResponseHeader = new Proxy(XMLHttpRequest.prototype.getResponseHeader, b);
                    XMLHttpRequest.prototype.getAllResponseHeaders = new Proxy(XMLHttpRequest.prototype.getAllResponseHeaders, R);
                }
            }).apply(this, a);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, n, {
                value: r,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function o(e) {
        if (e.verbose) {
            try {
                var t = console.trace.bind(console), r = "[AdGuard] ";
                "corelibs" === e.engine ? r += e.ruleText : (e.domainName && (r += `${e.domainName}`), 
                e.args ? r += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : r += `#%#//scriptlet('${e.name}')`), 
                t && t(r);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
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
    const e = "done";
    if (Window.prototype.toString["74335af1e51afde7199c6df8e04dc508"] === e) return;
    preventXHR.apply(this, [ {
        name: "prevent-xhr",
        args: [ "/advert.js" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "/advert.js" ]));
    Object.defineProperty(Window.prototype.toString, "74335af1e51afde7199c6df8e04dc508", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "74335af1e51afde7199c6df8e04dc508" due to: ' + e);
}
function preventAddEventListener(e, n) {
    var t = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== t) {
        var i = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, t, r, i, d) {
                var u, c = o(n), s = o(t);
                if (r) {
                    if ("elements" !== r) {
                        a(e, `Invalid "additionalArgName": ${r}\nOnly "elements" is supported.`);
                        return;
                    }
                    if (!i) {
                        a(e, '"additionalArgValue" is required.');
                        return;
                    }
                    u = i;
                }
                var l = window.EventTarget.prototype.addEventListener;
                function f(n, t) {
                    var r, i, o, a = !1;
                    null != n && (void 0 !== (o = t) && ("function" == typeof o || "object" == typeof o && null !== o && "handleEvent" in o && "function" == typeof o.handleEvent)) && (a = c.test(n.toString()) && s.test(function(e) {
                        return "function" == typeof e ? e.toString() : e.handleEvent.toString();
                    }(t)) && (i = this, void 0 === u || ("window" === u ? i === window : "document" === u ? i === document : !!(i && i.matches && i.matches(u)))));
                    if (!a) {
                        var d = this;
                        this && "Window" === (null === (r = this.constructor) || void 0 === r ? void 0 : r.name) && this !== window && (d = window);
                        for (var f = arguments.length, v = new Array(f > 2 ? f - 2 : 0), p = 2; p < f; p++) v[p - 2] = arguments[p];
                        return l.apply(d, [ n, t, ...v ]);
                    }
                    !function(e) {
                        if (e.verbose) {
                            try {
                                var n = console.trace.bind(console), t = "[AdGuard] ";
                                "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                                e.args ? t += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : t += `#%#//scriptlet('${e.name}')`), 
                                n && n(t);
                            } catch (e) {}
                            "function" == typeof window.__debug && window.__debug(e);
                        }
                    }(e);
                }
                if ("true" === d) window.EventTarget.prototype.addEventListener = f; else {
                    var v = {
                        configurable: !0,
                        set: function() {},
                        get: function() {
                            return f;
                        }
                    };
                    Object.defineProperty(window.EventTarget.prototype, "addEventListener", v);
                    Object.defineProperty(window, "addEventListener", v);
                    Object.defineProperty(document, "addEventListener", v);
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, r, {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function o(e) {
        var n = e || "", t = "/";
        if ("" === n) return new RegExp(".?");
        var r, i, o = n.lastIndexOf(t), a = n.substring(o + 1), d = n.substring(0, o + 1), u = (i = a, 
        (r = d).startsWith(t) && r.endsWith(t) && !r.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(i) ? i : "");
        if (n.startsWith(t) && n.endsWith(t) || u) return new RegExp((u ? d : n).slice(1, -1), u);
        var c = n.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(c);
    }
    function a(e, n) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = e;
        if (t || o) {
            var a = console.log;
            r ? a(`${i}: ${n}`) : Array.isArray(n) ? a(`${i}:`, ...n) : a(`${i}:`, n);
        }
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["402134bb2218a458d93bfc81b7c0a7e1"] === e) return;
    preventAddEventListener.apply(this, [ {
        name: "prevent-addEventListener",
        args: [ "click", "window.open" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "click", "window.open" ]));
    Object.defineProperty(Window.prototype.toString, "402134bb2218a458d93bfc81b7c0a7e1", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "402134bb2218a458d93bfc81b7c0a7e1" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["5192b7a509b7291b5515b20e53db8176"] === e) return;
    preventAddEventListener.apply(this, [ {
        name: "prevent-addEventListener",
        args: [ "DOMContentLoaded", "app_advert" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "DOMContentLoaded", "app_advert" ]));
    Object.defineProperty(Window.prototype.toString, "5192b7a509b7291b5515b20e53db8176", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "5192b7a509b7291b5515b20e53db8176" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["3f2894469bf6842423eb4d8743005269"] === e) return;
    preventAddEventListener.apply(this, [ {
        name: "prevent-addEventListener",
        args: [ "click", "popUnder" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "click", "popUnder" ]));
    Object.defineProperty(Window.prototype.toString, "3f2894469bf6842423eb4d8743005269", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "3f2894469bf6842423eb4d8743005269" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.f75d142a2afdf74ecafae6089a9280e1 === e) return;
    preventAddEventListener.apply(this, [ {
        name: "prevent-addEventListener",
        args: [ "DOMContentLoaded", "promoContainers" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "DOMContentLoaded", "promoContainers" ]));
    Object.defineProperty(Window.prototype.toString, "f75d142a2afdf74ecafae6089a9280e1", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "f75d142a2afdf74ecafae6089a9280e1" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["788127e6e30916b9cb446a659023cbee"] === e) return;
    preventAddEventListener.apply(this, [ {
        name: "prevent-addEventListener",
        args: [ "DOMContentLoaded", "videotutucu" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "DOMContentLoaded", "videotutucu" ]));
    Object.defineProperty(Window.prototype.toString, "788127e6e30916b9cb446a659023cbee", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "788127e6e30916b9cb446a659023cbee" due to: ' + e);
}
function removeNodeText(t, e) {
    var r = "done", n = t.uniqueId + t.name + "_" + (Array.isArray(e) ? e.join("_") : "");
    if (!t.uniqueId || Window.prototype.toString[n] !== r) {
        var i = e ? [].concat(t).concat(e) : [ t ];
        try {
            (function(t, e, r, n) {
                var {selector: i, nodeNameMatch: o, textContentMatch: a} = function(t, e) {
                    var r, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null, i = "/", c = !(t.startsWith(i) && t.endsWith(i)), o = c ? t : "*", a = c ? t : u(t), s = e.startsWith(i) ? u(e) : e;
                    return n && (r = n.startsWith(i) ? u(n) : n), {
                        selector: o,
                        nodeNameMatch: a,
                        textContentMatch: s,
                        patternMatch: r
                    };
                }(e, r), s = function(e) {
                    return e.forEach((function(e) {
                        (function(t, e, r) {
                            var {nodeName: n, textContent: i} = t, c = n.toLowerCase();
                            return null !== i && "" !== i && (e instanceof RegExp ? e.test(c) : e === c) && (r instanceof RegExp ? r.test(i) : i.includes(r));
                        })(e, o, a) && function(t, e, r, n) {
                            var {textContent: i} = e;
                            if (i) {
                                var c = i.replace(r, n);
                                "SCRIPT" === e.nodeName && (c = function(t) {
                                    var e, r = null == t || null === (e = t.api) || void 0 === e ? void 0 : e.policy;
                                    if (r) return r;
                                    var n = "AGPolicy", i = window.trustedTypes, c = !!i, o = {
                                        HTML: "TrustedHTML",
                                        Script: "TrustedScript",
                                        ScriptURL: "TrustedScriptURL"
                                    };
                                    if (!c) return {
                                        name: n,
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
                                        convertAttributeToTrusted: function(t, e, r) {
                                            return r;
                                        },
                                        getPropertyType: function() {
                                            return null;
                                        },
                                        convertPropertyToTrusted: function(t, e, r) {
                                            return r;
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
                                    var u = i.createPolicy(n, {
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
                                    }, d = function(t) {
                                        return u.createScriptURL(t);
                                    }, f = function(t, e) {
                                        switch (t) {
                                          case o.HTML:
                                            return a(e);

                                          case o.Script:
                                            return s(e);

                                          case o.ScriptURL:
                                            return d(e);

                                          default:
                                            return e;
                                        }
                                    }, p = i.getAttributeType.bind(i), l = i.getPropertyType.bind(i), v = i.isHTML.bind(i), T = i.isScript.bind(i), g = i.isScriptURL.bind(i);
                                    return {
                                        name: n,
                                        isSupported: c,
                                        TrustedType: o,
                                        createHTML: a,
                                        createScript: s,
                                        createScriptURL: d,
                                        create: f,
                                        getAttributeType: p,
                                        convertAttributeToTrusted: function(t, e, r, n, i) {
                                            var c = p(t, e, n, i);
                                            return c ? f(c, r) : r;
                                        },
                                        getPropertyType: l,
                                        convertPropertyToTrusted: function(t, e, r, n) {
                                            var i = l(t, e, n);
                                            return i ? f(i, r) : r;
                                        },
                                        isHTML: v,
                                        isScript: T,
                                        isScriptURL: g
                                    };
                                }(t).createScript(c));
                                e.textContent = c, function(t) {
                                    if (t.verbose) {
                                        try {
                                            var e = console.trace.bind(console), r = "[AdGuard] ";
                                            "corelibs" === t.engine ? r += t.ruleText : (t.domainName && (r += `${t.domainName}`), 
                                            t.args ? r += `#%#//scriptlet('${t.name}', '${t.args.join("', '")}')` : r += `#%#//scriptlet('${t.name}')`), 
                                            e && e(r);
                                        } catch (t) {}
                                        "function" == typeof window.__debug && window.__debug(t);
                                    }
                                }(t);
                            }
                        }(t, e, /^[^]*$/, "");
                    }));
                };
                document.documentElement && c(i, s, n);
                !function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {
                        subtree: !0,
                        childList: !0
                    }, r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1e4, n = new MutationObserver((function(r, n) {
                        n.disconnect(), t(r, n), n.observe(document.documentElement, e);
                    }));
                    n.observe(document.documentElement, e), "number" == typeof r && setTimeout((function() {
                        return n.disconnect();
                    }), r);
                }((function(t) {
                    return e = s, r = i, o = n, u = function(t) {
                        for (var e = [], r = 0; r < t.length; r += 1) for (var {addedNodes: n} = t[r], i = 0; i < n.length; i += 1) e.push(n[i]);
                        return e;
                    }(t), void (r && o ? u.forEach((function() {
                        c(r, e, o);
                    })) : e(u));
                    var e, r, o, u;
                }));
            }).apply(this, i);
            t.uniqueId && Object.defineProperty(Window.prototype.toString, n, {
                value: r,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.log(t);
        }
    }
    function c(t, e, r) {
        (r ? document.querySelectorAll(r) : [ document ]).forEach((function(r) {
            return function(r) {
                if ("#text" === t) {
                    var n = o(r.childNodes).filter((function(t) {
                        return t.nodeType === Node.TEXT_NODE;
                    }));
                    e(n);
                } else {
                    var i = o(r.querySelectorAll(t));
                    e(i);
                }
            }(r);
        }));
    }
    function o(t) {
        for (var e = [], r = 0; r < t.length; r += 1) e.push(t[r]);
        return e;
    }
    function u(t) {
        var e = t || "", r = "/";
        if ("" === e) return new RegExp(".?");
        var n, i, c = e.lastIndexOf(r), o = e.substring(c + 1), u = e.substring(0, c + 1), a = (i = o, 
        (n = u).startsWith(r) && n.endsWith(r) && !n.endsWith("\\/") && function(t) {
            if (!t) return !1;
            try {
                return new RegExp("", t), !0;
            } catch (t) {
                return !1;
            }
        }(i) ? i : "");
        if (e.startsWith(r) && e.endsWith(r) || a) return new RegExp((a ? u : e).slice(1, -1), a);
        var s = e.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(s);
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["6c374e6b4d21bdbf41a462ac95f31b2f"] === e) return;
    removeNodeText.apply(this, [ {
        name: "remove-node-text",
        args: [ "script", "popUnder" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "popUnder" ]));
    Object.defineProperty(Window.prototype.toString, "6c374e6b4d21bdbf41a462ac95f31b2f", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "6c374e6b4d21bdbf41a462ac95f31b2f" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.e75d8db5bf3c30821b02ee189b7277a8 === e) return;
    removeNodeText.apply(this, [ {
        name: "remove-node-text",
        args: [ "script", "LAST_POP" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "LAST_POP" ]));
    Object.defineProperty(Window.prototype.toString, "e75d8db5bf3c30821b02ee189b7277a8", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "e75d8db5bf3c30821b02ee189b7277a8" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.b6649c7ba8fadf2d6a3d5477e7f71622 === e) return;
    removeNodeText.apply(this, [ {
        name: "remove-node-text",
        args: [ "script", "window.open" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "window.open" ]));
    Object.defineProperty(Window.prototype.toString, "b6649c7ba8fadf2d6a3d5477e7f71622", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "b6649c7ba8fadf2d6a3d5477e7f71622" due to: ' + e);
}
function abortCurrentInlineScript(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== n) {
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
                }, d = l(), f = function() {
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
                        if (n instanceof HTMLScriptElement && r.length > 0 && n !== d && c.test(r)) {
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var t = console.trace.bind(console), n = "[AdGuard] ";
                                        "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                                        e.args ? n += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : n += `#%#//scriptlet('${e.name}')`), 
                                        t && t(n);
                                    } catch (e) {}
                                    "function" == typeof window.__debug && window.__debug(e);
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
                        var d, g, b, h, v = Object.assign({
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
                                this.isAbortingSuspended || this.isolateCallback(f);
                                return l instanceof Object ? l.get.call(i) : this.currentValue;
                            },
                            set(e) {
                                this.isAbortingSuspended || this.isolateCallback(f);
                                l instanceof Object ? l.set.call(i, e) : this.currentValue = e;
                            }
                        });
                        d = i, g = c, b = {
                            get: () => v.get.call(v),
                            set(e) {
                                v.set.call(v, e);
                            }
                        }, (h = Object.getOwnPropertyDescriptor(d, g)) && !h.configurable || Object.defineProperty(d, g, b);
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
            e.uniqueId && Object.defineProperty(Window.prototype.toString, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
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
    const e = "done";
    if (Window.prototype.toString.d626e74e0151345116c33bdd18aedeca === e) return;
    abortCurrentInlineScript.apply(this, [ {
        name: "abort-current-inline-script",
        args: [ "document.createElement", "'script'" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "document.createElement", "'script'" ]));
    Object.defineProperty(Window.prototype.toString, "d626e74e0151345116c33bdd18aedeca", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "d626e74e0151345116c33bdd18aedeca" due to: ' + e);
}
function trustedDispatchEvent(e, n) {
    var t = "done", o = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[o] !== t) {
        var r = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, t) {
                if (n) {
                    var o = !1, r = document;
                    "window" === t && (r = window);
                    var i = new Set, a = function() {
                        var a = new Event(n);
                        "string" == typeof t && "window" !== t && (r = document.querySelector(t));
                        var c = i.has(n);
                        if (!o && c && r) {
                            o = !0;
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var n = console.trace.bind(console), t = "[AdGuard] ";
                                        "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                                        e.args ? t += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : t += `#%#//scriptlet('${e.name}')`), 
                                        n && n(t);
                                    } catch (e) {}
                                    "function" == typeof window.__debug && window.__debug(e);
                                }
                            }(e);
                            r.dispatchEvent(a);
                        }
                    }, c = {
                        apply: function(e, n, t) {
                            var o = t[0];
                            if (n && o) {
                                i.add(o);
                                setTimeout((function() {
                                    a();
                                }), 1);
                            }
                            return Reflect.apply(e, n, t);
                        }
                    };
                    EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, c);
                }
            }).apply(this, r);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, o, {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["825cac43297bdaf67fe9bf64c058422b"] === e) return;
    trustedDispatchEvent.apply(this, [ {
        name: "trusted-dispatch-event",
        args: [ "ended", "#preroll-video" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "ended", "#preroll-video" ]));
    Object.defineProperty(Window.prototype.toString, "825cac43297bdaf67fe9bf64c058422b", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "825cac43297bdaf67fe9bf64c058422b" due to: ' + e);
}
function trustedClickElement(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== n) {
        var i = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t) {
                var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "", r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : NaN, i = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "", d = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : NaN;
                if (t) {
                    var v = "cookie:", p = "localStorage:", m = "containsText:", h = "clickType:", g = function(e) {
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
                                var d = f.get(c);
                                return d || f.set(c, l), n.call(this, e, d || l, u);
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
                    var y = new WeakMap, w = new Set;
                    if (t.includes(" >>> ")) {
                        var E = {
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
                                w.add(o);
                                return i;
                            }
                        };
                        window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, E);
                    }
                    var b, k = function() {
                        w.forEach((function(e) {
                            return e.disconnect();
                        }));
                        w.clear();
                    }, P = 1e4;
                    if (d) {
                        var T = Number(d);
                        if (!Number.isInteger(T) || T <= 0) {
                            a(e, `Passed observer timeout '${d}' is invalid`);
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
                    var $ = !b, x = [], M = [], S = "", I = "", N = !1, A = !1;
                    n && n.split(/(,\s*){1}(?=!?cookie:|!?localStorage:|containsText:|clickType:)/).map((function(e) {
                        return e.trim();
                    })).forEach((function(t) {
                        if (t.includes(v)) {
                            var {isInvertedMatch: n, matchValue: r} = c(t);
                            N = n;
                            var i = r.replace(v, "");
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
                            S = f;
                        }
                        if (t.includes(h)) {
                            var {isInvertedMatch: d, matchValue: g} = c(t);
                            if (d) {
                                a(e, `Passed click type '${t}' is invalid`);
                                return;
                            }
                            var y = g.replace(h, "");
                            if ("native" !== y) {
                                a(e, `Passed click type '${y}' is invalid`);
                                return;
                            }
                            I = y;
                        }
                    }));
                    if (x.length > 0) {
                        var R = u(x.join(";")), O = u(document.cookie), W = Object.keys(O);
                        if (0 === W.length) return;
                        if (Object.keys(R).every((function(e) {
                            var t = R[e] ? o(R[e]) : null, n = o(e);
                            return W.some((function(e) {
                                if (!n.test(e)) return !1;
                                if (!t) return !0;
                                var r = O[e];
                                return !!r && t.test(r);
                            }));
                        })) === N) return;
                    }
                    if (M.length > 0 && M.every((function(e) {
                        var t = window.localStorage.getItem(e);
                        return t || "" === t;
                    })) === A) return;
                    var j = S ? o(S) : null, C = t.split(",").map((function(e) {
                        return e.trim();
                    })), L = function(e, t) {
                        return {
                            element: e || null,
                            clicked: !1,
                            selectorText: t || null
                        };
                    }, _ = Array(C.length).fill(L(null)), q = function(t) {
                        try {
                            if (!t.selectorText) return;
                            var n = l(t.selectorText, document.documentElement, null, y);
                            if (!n) {
                                a(e, `Could not find element: '${t.selectorText}'`);
                                return;
                            }
                            f(n, I);
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
                    var G = !0, H = async function() {
                        for (var t = 0; t < _.length; t += 1) {
                            var n = _[t];
                            t >= 1 && await g(150);
                            if (!n.element) break;
                            if (!n.clicked) if (n.element.isConnected) {
                                f(n.element, I);
                                n.clicked = !0;
                            } else q(n);
                        }
                        var r = _.every((function(e) {
                            return !0 === e.clicked;
                        }));
                        if (r) {
                            if (F && G) {
                                G = !1;
                                setTimeout((function() {
                                    window.location.reload();
                                }), V);
                            }
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var t = console.trace.bind(console), n = "[AdGuard] ";
                                        "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                                        e.args ? n += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : n += `#%#//scriptlet('${e.name}')`), 
                                        t && t(n);
                                    } catch (e) {}
                                    "function" == typeof window.__debug && window.__debug(e);
                                }
                            }(e);
                        }
                    }, z = function() {
                        var e = [];
                        C.forEach((function(t, n) {
                            if (t) {
                                var r = l(t, document.documentElement, j, y);
                                if (r) {
                                    !function(e, t, n) {
                                        var r = L(e, n);
                                        _[t] = r;
                                        $ && H();
                                    }(r, n, t);
                                    e.push(t);
                                }
                            }
                        }));
                        return C = C.map((function(t) {
                            return t && e.includes(t) ? null : t;
                        }));
                    }, J = function(e, t) {
                        if ((C = z()).every((function(e) {
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
                        if (C.every((function(e) {
                            return !!e && !!l(e, document.documentElement, j, y);
                        }))) {
                            z();
                            k();
                        } else K();
                    }();
                    b && setTimeout((function() {
                        H();
                        $ = !0;
                    }), b);
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
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
            for (var r = e.querySelectorAll(t), i = 0; i < r.length; i += 1) if (d(r[i], n)) return r[i];
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
                    }), d = c(f, "focus", !0);
                    s.onFocus.call(e, d);
                }
                var v = new MouseEvent("click", a), p = c(v, "click", !0);
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
    function d(e, t) {
        var {textContent: n} = e;
        return !!n && t.test(n);
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["6b2951266df639b1f25dd41a34d59873"] === e) return;
    trustedClickElement.apply(this, [ {
        name: "trusted-click-element",
        args: [ "button#preroll-skip", "", "1000" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "button#preroll-skip", "", "1000" ]));
    Object.defineProperty(Window.prototype.toString, "6b2951266df639b1f25dd41a34d59873", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "6b2951266df639b1f25dd41a34d59873" due to: ' + e);
}
function preventWindowOpen(e, n) {
    var t = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== t) {
        var i = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e) {
                var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "*", t = arguments.length > 2 ? arguments[2] : void 0, r = arguments.length > 3 ? arguments[3] : void 0, i = window.open, d = "0" !== n && "1" !== n, f = function(e, n) {
                    return n && n.length > 0 ? `${e} ${n.join(" ")}` : e;
                };
                window.open = d ? function(s) {
                    for (var d = r && r.includes("log"), p = arguments.length, v = new Array(p > 1 ? p - 1 : 0), g = 1; g < p; g++) v[g - 1] = arguments[g];
                    if (d) {
                        var w = v && v.length > 0 ? `, ${v.join(", ")}` : "";
                        u(e, `${s}${w}`, !0);
                        o(e);
                    }
                    var m, y, h, b, $ = !1;
                    if ("*" === n) $ = !0; else if (y = m = n, null != m && m.startsWith("!") && (y = m.slice(1)), 
                    a(y)) {
                        var {isInvertedMatch: W, matchRegexp: j} = function(e) {
                            var n = !!e && (null == e ? void 0 : e.startsWith("!")), t = n ? e.slice(1) : e;
                            return {
                                isInvertedMatch: n,
                                matchRegexp: c(t),
                                matchValue: t
                            };
                        }(n), x = f(s, v);
                        $ = j.test(x) !== W;
                    } else {
                        u(e, `Invalid parameter: ${n}`);
                        $ = !1;
                    }
                    if ($) {
                        var I, O = parseInt(t, 10);
                        if (b = O, (Number.isNaN || window.isNaN)(b)) I = null; else {
                            var E = function(e) {
                                var n, t = function(e) {
                                    return e.Object = "data", e.Iframe = "src", e;
                                }({}), {replacement: r, url: i, delay: o} = e;
                                n = "obj" === r ? "object" : "iframe";
                                var a = document.createElement(n);
                                return a instanceof HTMLObjectElement ? a[t.Object] = i : a instanceof HTMLIFrameElement && (a[t.Iframe] = i), 
                                a.style.setProperty("height", "1px", "important"), a.style.setProperty("position", "fixed", "important"), 
                                a.style.setProperty("top", "-1px", "important"), a.style.setProperty("width", "1px", "important"), 
                                document.body.appendChild(a), setTimeout((function() {
                                    return a.remove();
                                }), 1e3 * o), a;
                            }({
                                replacement: r,
                                url: s,
                                delay: O
                            }), P = E.contentWindow;
                            if ("object" == typeof P && null !== P) {
                                Object.defineProperty(P, "closed", {
                                    value: !1
                                });
                                Object.defineProperty(P, "opener", {
                                    value: window
                                });
                                Object.defineProperty(P, "frameElement", {
                                    value: null
                                });
                            } else {
                                var N = E.contentWindow && E.contentWindow.get;
                                Object.defineProperty(E, "contentWindow", {
                                    get: (h = N, function(e, n) {
                                        return (!n || "closed" !== n) && ("function" == typeof h ? l : n && e[n]);
                                    })
                                });
                                P = E.contentWindow;
                            }
                            I = P;
                        }
                        o(e);
                        return I;
                    }
                    return i.apply(window, [ s, ...v ]);
                } : function(d) {
                    n = Number(n) > 0;
                    for (var p = arguments.length, v = new Array(p > 1 ? p - 1 : 0), g = 1; g < p; g++) v[g - 1] = arguments[g];
                    if (!a(t)) {
                        u(e, `Invalid parameter: ${t}`);
                        return i.apply(window, [ d, ...v ]);
                    }
                    var w = c(t), m = f(d, v);
                    if (n !== w.test(m)) return i.apply(window, [ d, ...v ]);
                    o(e);
                    return function(e) {
                        var n;
                        if (e) {
                            if ("trueFunc" === e) n = s; else if (e.includes("=") && e.startsWith("{") && e.endsWith("}")) {
                                var t = e.slice(1, -1), r = function(e, n) {
                                    if (!e) return e;
                                    var t = e.indexOf(n);
                                    return t < 0 ? e : e.substring(0, t);
                                }(t, "=");
                                "noopFunc" === function(e, n) {
                                    if (!e) return e;
                                    var t = e.indexOf(n);
                                    return t < 0 ? "" : e.substring(t + n.length);
                                }(t, "=") && ((n = {})[r] = l);
                            }
                        } else n = l;
                        return n;
                    }(r);
                };
                window.open.toString = i.toString.bind(i);
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, r, {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function o(e) {
        if (e.verbose) {
            try {
                var n = console.trace.bind(console), t = "[AdGuard] ";
                "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                e.args ? t += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : t += `#%#//scriptlet('${e.name}')`), 
                n && n(t);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
        }
    }
    function a(e) {
        var n, t = function(e) {
            return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }(e);
        "/" === e[0] && "/" === e[e.length - 1] && (t = e.slice(1, -1));
        try {
            n = new RegExp(t), n = !0;
        } catch (e) {
            n = !1;
        }
        return n;
    }
    function c(e) {
        var n = e || "", t = "/";
        if ("" === n) return new RegExp(".?");
        var r, i, o = n.lastIndexOf(t), a = n.substring(o + 1), c = n.substring(0, o + 1), u = (i = a, 
        (r = c).startsWith(t) && r.endsWith(t) && !r.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(i) ? i : "");
        if (n.startsWith(t) && n.endsWith(t) || u) return new RegExp((u ? c : n).slice(1, -1), u);
        var l = n.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(l);
    }
    function u(e, n) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = e;
        if (t || o) {
            var a = console.log;
            r ? a(`${i}: ${n}`) : Array.isArray(n) ? a(`${i}:`, ...n) : a(`${i}:`, n);
        }
    }
    function l() {}
    function s() {
        return !0;
    }
}
try {
    const e = "done";
    if (Window.prototype.toString.fa40c7d2d0029bfcadc41d6c3429cb3f === e) return;
    preventWindowOpen.apply(this, [ {
        name: "prevent-window-open",
        args: [],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([]));
    Object.defineProperty(Window.prototype.toString, "fa40c7d2d0029bfcadc41d6c3429cb3f", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "fa40c7d2d0029bfcadc41d6c3429cb3f" due to: ' + e);
}
function setSessionStorageItem(e, t) {
    var r = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[n] !== r) {
        var i = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, r) {
                if (void 0 !== t) {
                    var n;
                    try {
                        n = function(e) {
                            if ("string" != typeof e) throw new Error("Invalid value");
                            var t, r;
                            if (new Set([ "undefined", "false", "true", "null", "", "yes", "no", "on", "off", "accept", "accepted", "reject", "rejected", "allowed", "denied", "forbidden", "forever" ]).has(e.toLowerCase())) t = e; else if ("emptyArr" === e) t = "[]"; else if ("emptyObj" === e) t = "{}"; else if (/^\d+$/.test(e)) {
                                if (r = t = parseFloat(e), (Number.isNaN || window.isNaN)(r)) throw new Error("Invalid value");
                                if (Math.abs(t) > 32767) throw new Error("Invalid value");
                            } else {
                                if ("$remove$" !== e) throw new Error("Invalid value");
                                t = "$remove$";
                            }
                            return t;
                        }(r);
                    } catch (t) {
                        o(e, `Invalid storage item value: '${r}'`);
                        return;
                    }
                    var {sessionStorage: i} = window;
                    "$remove$" === n ? function(e, t, r) {
                        try {
                            if (r.startsWith("/") && (r.endsWith("/") || r.endsWith("/i")) && function(e) {
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
                            }(r)) {
                                var n = function(e) {
                                    var t = e || "", r = "/";
                                    if ("" === t) return new RegExp(".?");
                                    var n, i, o = t.lastIndexOf(r), a = t.substring(o + 1), s = t.substring(0, o + 1), c = (i = a, 
                                    (n = s).startsWith(r) && n.endsWith(r) && !n.endsWith("\\/") && function(e) {
                                        if (!e) return !1;
                                        try {
                                            return new RegExp("", e), !0;
                                        } catch (e) {
                                            return !1;
                                        }
                                    }(i) ? i : "");
                                    if (t.startsWith(r) && t.endsWith(r) || c) return new RegExp((c ? s : t).slice(1, -1), c);
                                    var l = t.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                    return new RegExp(l);
                                }(r);
                                Object.keys(t).forEach((function(e) {
                                    n.test(e) && t.removeItem(e);
                                }));
                            } else t.removeItem(r);
                        } catch (t) {
                            o(e, `Unable to remove storage item due to: ${t.message}`);
                        }
                    }(e, i, t) : function(e, t, r, n) {
                        try {
                            t.setItem(r, n);
                        } catch (t) {
                            o(e, `Unable to set storage item due to: ${t.message}`);
                        }
                    }(e, i, t, n);
                    !function(e) {
                        if (e.verbose) {
                            try {
                                var t = console.trace.bind(console), r = "[AdGuard] ";
                                "corelibs" === e.engine ? r += e.ruleText : (e.domainName && (r += `${e.domainName}`), 
                                e.args ? r += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : r += `#%#//scriptlet('${e.name}')`), 
                                t && t(r);
                            } catch (e) {}
                            "function" == typeof window.__debug && window.__debug(e);
                        }
                    }(e);
                } else o(e, "Item key should be specified.");
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, n, {
                value: r,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function o(e, t) {
        var r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = e;
        if (r || o) {
            var a = console.log;
            n ? a(`${i}: ${t}`) : Array.isArray(t) ? a(`${i}:`, ...t) : a(`${i}:`, t);
        }
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["4b4a7b2f8bf0e470724ee14537e2e1ab"] === e) return;
    setSessionStorageItem.apply(this, [ {
        name: "set-session-storage-item",
        args: [ "preroll_view_count", "1" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "preroll_view_count", "1" ]));
    Object.defineProperty(Window.prototype.toString, "4b4a7b2f8bf0e470724ee14537e2e1ab", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "4b4a7b2f8bf0e470724ee14537e2e1ab" due to: ' + e);
}
function trustedReplaceNodeText(t, e) {
    var n = "done", r = t.uniqueId + t.name + "_" + (Array.isArray(e) ? e.join("_") : "");
    if (!t.uniqueId || Window.prototype.toString[r] !== n) {
        var i = e ? [].concat(t).concat(e) : [ t ];
        try {
            (function(t, e, n, r, i) {
                for (var a = function(t) {
                    return "string" != typeof t ? t : t.replace(/\\'/g, "'").replace(/\\"/g, '"');
                }, s = a(r), d = a(i), {selector: f, nodeNameMatch: p, textContentMatch: l, patternMatch: v} = function(t, e) {
                    var n, r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null, i = "/", o = !(t.startsWith(i) && t.endsWith(i)), c = o ? t : "*", a = o ? t : u(t), s = e.startsWith(i) ? u(e) : e;
                    return r && (n = r.startsWith(i) ? u(r) : r), {
                        selector: c,
                        nodeNameMatch: a,
                        textContentMatch: s,
                        patternMatch: n
                    };
                }(e, n, s), g = arguments.length, T = new Array(g > 5 ? g - 5 : 0), h = 5; h < g; h++) T[h - 5] = arguments[h];
                var y, b, m = T.includes("verbose"), S = function(e) {
                    return e.forEach((function(e) {
                        if (function(t, e, n) {
                            var {nodeName: r, textContent: i} = t, o = r.toLowerCase();
                            return null !== i && "" !== i && (e instanceof RegExp ? e.test(o) : e === o) && (n instanceof RegExp ? n.test(i) : i.includes(n));
                        }(e, p, l)) {
                            if (m) {
                                var n = e.textContent;
                                n && o(t, `Original text content: ${n}`);
                            }
                            !function(t, e, n, r) {
                                var {textContent: i} = e;
                                if (i) {
                                    var o = i.replace(n, r);
                                    "SCRIPT" === e.nodeName && (o = function(t) {
                                        var e, n = null == t || null === (e = t.api) || void 0 === e ? void 0 : e.policy;
                                        if (n) return n;
                                        var r = "AGPolicy", i = window.trustedTypes, o = !!i, c = {
                                            HTML: "TrustedHTML",
                                            Script: "TrustedScript",
                                            ScriptURL: "TrustedScriptURL"
                                        };
                                        if (!o) return {
                                            name: r,
                                            isSupported: o,
                                            TrustedType: c,
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
                                        }, d = function(t) {
                                            return u.createScriptURL(t);
                                        }, f = function(t, e) {
                                            switch (t) {
                                              case c.HTML:
                                                return a(e);

                                              case c.Script:
                                                return s(e);

                                              case c.ScriptURL:
                                                return d(e);

                                              default:
                                                return e;
                                            }
                                        }, p = i.getAttributeType.bind(i), l = i.getPropertyType.bind(i), v = i.isHTML.bind(i), g = i.isScript.bind(i), T = i.isScriptURL.bind(i);
                                        return {
                                            name: r,
                                            isSupported: o,
                                            TrustedType: c,
                                            createHTML: a,
                                            createScript: s,
                                            createScriptURL: d,
                                            create: f,
                                            getAttributeType: p,
                                            convertAttributeToTrusted: function(t, e, n, r, i) {
                                                var o = p(t, e, r, i);
                                                return o ? f(o, n) : n;
                                            },
                                            getPropertyType: l,
                                            convertPropertyToTrusted: function(t, e, n, r) {
                                                var i = l(t, e, r);
                                                return i ? f(i, n) : n;
                                            },
                                            isHTML: v,
                                            isScript: g,
                                            isScriptURL: T
                                        };
                                    }(t).createScript(o));
                                    e.textContent = o, function(t) {
                                        if (t.verbose) {
                                            try {
                                                var e = console.trace.bind(console), n = "[AdGuard] ";
                                                "corelibs" === t.engine ? n += t.ruleText : (t.domainName && (n += `${t.domainName}`), 
                                                t.args ? n += `#%#//scriptlet('${t.name}', '${t.args.join("', '")}')` : n += `#%#//scriptlet('${t.name}')`), 
                                                e && e(n);
                                            } catch (t) {}
                                            "function" == typeof window.__debug && window.__debug(t);
                                        }
                                    }(t);
                                }
                            }(t, e, v, d);
                            if (m) {
                                var r = e.textContent;
                                r && o(t, `Modified text content: ${r}`);
                            }
                        }
                    }));
                };
                document.documentElement && (y = f, b = S, [ document ].forEach((function(t) {
                    return function(t) {
                        if ("#text" === y) {
                            var e = c(t.childNodes).filter((function(t) {
                                return t.nodeType === Node.TEXT_NODE;
                            }));
                            b(e);
                        } else {
                            var n = c(t.querySelectorAll(y));
                            b(n);
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
            t.uniqueId && Object.defineProperty(Window.prototype.toString, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.log(t);
        }
    }
    function o(t, e) {
        var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = t;
        if (n || o) {
            var c = console.log;
            r ? c(`${i}: ${e}`) : Array.isArray(e) ? c(`${i}:`, ...e) : c(`${i}:`, e);
        }
    }
    function c(t) {
        for (var e = [], n = 0; n < t.length; n += 1) e.push(t[n]);
        return e;
    }
    function u(t) {
        var e = t || "", n = "/";
        if ("" === e) return new RegExp(".?");
        var r, i, o = e.lastIndexOf(n), c = e.substring(o + 1), u = e.substring(0, o + 1), a = (i = c, 
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
    const e = "done";
    if (Window.prototype.toString["7f6e8b220be96db37ca9fe389ed1fc4c"] === e) return;
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "prerollEnabled", "prerollEnabled:true", "prerollEnabled:false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "prerollEnabled", "prerollEnabled:true", "prerollEnabled:false" ]));
    Object.defineProperty(Window.prototype.toString, "7f6e8b220be96db37ca9fe389ed1fc4c", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "7f6e8b220be96db37ca9fe389ed1fc4c" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["72304fae9876186b2587db286c136910"] === e) return;
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "videoSources", "/window\\.app\\.initAdv\\(\\);/", "window.app.initMatch();" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "videoSources", "/window\\.app\\.initAdv\\(\\);/", "window.app.initMatch();" ]));
    Object.defineProperty(Window.prototype.toString, "72304fae9876186b2587db286c136910", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "72304fae9876186b2587db286c136910" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.cfd2bcb56dbd4b5d6bcafe68156737ae === e) return;
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "playAdd", "/manageAds\\(video_urls\\[activeItem\\]\\, video_seconds\\[activeItem\\]\\, ad_urls\\[activeItem]\\,true\\);/", "playVideo();" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "playAdd", "/manageAds\\(video_urls\\[activeItem\\]\\, video_seconds\\[activeItem\\]\\, ad_urls\\[activeItem]\\,true\\);/", "playVideo();" ]));
    Object.defineProperty(Window.prototype.toString, "cfd2bcb56dbd4b5d6bcafe68156737ae", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "cfd2bcb56dbd4b5d6bcafe68156737ae" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["39a5464e1136c5c1969d01e86b30a2b6"] === e) return;
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "money_current", "(money_current+1 == money_vids.length)", "(true)" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "money_current", "(money_current+1 == money_vids.length)", "(true)" ]));
    Object.defineProperty(Window.prototype.toString, "39a5464e1136c5c1969d01e86b30a2b6", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "39a5464e1136c5c1969d01e86b30a2b6" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["907139140a253b880ec60f6433df016a"] === e) return;
    trustedReplaceNodeText.apply(this, [ {
        name: "trusted-replace-node-text",
        args: [ "script", "prerollEnabled", "/prerollEnabled:\\s*true/", "prerollEnabled:false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "script", "prerollEnabled", "/prerollEnabled:\\s*true/", "prerollEnabled:false" ]));
    Object.defineProperty(Window.prototype.toString, "907139140a253b880ec60f6433df016a", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "907139140a253b880ec60f6433df016a" due to: ' + e);
}
function abortOnPropertyRead(e, n) {
    var r = "done", t = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[t] !== r) {
        var o = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n) {
                if (n) {
                    var r, t, o = Math.random().toString(36).slice(2, 9), c = function() {
                        !function(e) {
                            if (e.verbose) {
                                try {
                                    var n = console.trace.bind(console), r = "[AdGuard] ";
                                    "corelibs" === e.engine ? r += e.ruleText : (e.domainName && (r += `${e.domainName}`), 
                                    e.args ? r += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : r += `#%#//scriptlet('${e.name}')`), 
                                    n && n(r);
                                } catch (e) {}
                                "function" == typeof window.__debug && window.__debug(e);
                            }
                        }(e);
                        throw new ReferenceError(o);
                    }, a = function(e, n) {
                        var r = i(e, n), {base: t, prop: o, chain: u} = r;
                        if (u) !function(e, n, r, t) {
                            var o;
                            try {
                                o = e[n];
                            } catch (e) {
                                o = void 0;
                            }
                            Object.defineProperty(e, n, {
                                get: function() {
                                    return o;
                                },
                                set: function(e) {
                                    o = e, e instanceof Object && t(e, r);
                                }
                            });
                        }(e, o, u, a); else {
                            f = t, p = o, d = {
                                get: c,
                                set: function() {}
                            }, (s = Object.getOwnPropertyDescriptor(f, p)) && !s.configurable || Object.defineProperty(f, p, d);
                            var f, p, d, s;
                        }
                    };
                    a(window, n);
                    window.onerror = (r = o, t = window.onerror, function(e) {
                        if ("string" == typeof e && e.includes(r)) return !0;
                        if (t instanceof Function) {
                            for (var n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++) o[i - 1] = arguments[i];
                            return t.apply(window, [ e, ...o ]);
                        }
                        return !1;
                    }).bind();
                }
            }).apply(this, o);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, t, {
                value: r,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function i(e, n) {
        var r = n.indexOf(".");
        if (-1 === r) return {
            base: e,
            prop: n
        };
        var t = n.slice(0, r);
        if (null === e) return {
            base: e,
            prop: t,
            chain: n
        };
        var o = e[t];
        return n = n.slice(r + 1), (e instanceof Object || "object" == typeof e) && function(e) {
            return 0 === Object.keys(e).length && !e.prototype;
        }(e) || null === o ? {
            base: e,
            prop: t,
            chain: n
        } : void 0 !== o ? i(o, n) : (Object.defineProperty(e, t, {
            configurable: !0
        }), {
            base: e,
            prop: t,
            chain: n
        });
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["622ae6d2111f0fe80b390490da2a2377"] === e) return;
    abortOnPropertyRead.apply(this, [ {
        name: "abort-on-property-read",
        args: [ "doOpen" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "doOpen" ]));
    Object.defineProperty(Window.prototype.toString, "622ae6d2111f0fe80b390490da2a2377", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "622ae6d2111f0fe80b390490da2a2377" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.f1071c145f1fea086ebb19884546c83d === e) return;
    abortOnPropertyRead.apply(this, [ {
        name: "abort-on-property-read",
        args: [ "popns" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "popns" ]));
    Object.defineProperty(Window.prototype.toString, "f1071c145f1fea086ebb19884546c83d", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "f1071c145f1fea086ebb19884546c83d" due to: ' + e);
}
function setConstant(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== n) {
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
                    var R = !1, x = function(e) {
                        var {source: t, stack: n, mustCancel: r, trapProp: i, getConstantValue: s, setConstantValue: a} = e, u = function(e, c) {
                            var l = h(e, c), {base: f, prop: d, chain: p} = l, m = {
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
                                                }(e, t)) return n.length && n[0] !== RegExp.$1 && g(n), !0;
                                                var r = v(e), i = t.split("\n").slice(2).map((function(e) {
                                                    return e.trim();
                                                })).join("\n");
                                                return n.length && n[0] !== RegExp.$1 && g(n), function() {
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
                            return R || (R = void 0 !== e && void 0 !== j && typeof e != typeof j && null !== e);
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
                    x(window, t);
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function o(e) {
        if (e.verbose) {
            try {
                var t = console.trace.bind(console), n = "[AdGuard] ";
                "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                e.args ? n += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : n += `#%#//scriptlet('${e.name}')`), 
                t && t(n);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
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
    function g(e) {
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
    function h(e, t) {
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
        } : void 0 !== i ? h(i, t) : (Object.defineProperty(e, r, {
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
    const e = "done";
    if (Window.prototype.toString["8bbafe881f8c4067be52307fdeb292f6"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.advertisement.enabled", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.advertisement.enabled", "false" ]));
    Object.defineProperty(Window.prototype.toString, "8bbafe881f8c4067be52307fdeb292f6", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "8bbafe881f8c4067be52307fdeb292f6" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.aaafef5c5f3d65b03e90086816631292 === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.adv.enabled", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.adv.enabled", "false" ]));
    Object.defineProperty(Window.prototype.toString, "aaafef5c5f3d65b03e90086816631292", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "aaafef5c5f3d65b03e90086816631292" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.eff9c596616271fb311bcd1a0b6997f9 === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.adv.enabled", "0" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.adv.enabled", "0" ]));
    Object.defineProperty(Window.prototype.toString, "eff9c596616271fb311bcd1a0b6997f9", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "eff9c596616271fb311bcd1a0b6997f9" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.e8c00e1afd2246a60b45aa322ecbbcef === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "window.advertisement.states.activate", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "window.advertisement.states.activate", "false" ]));
    Object.defineProperty(Window.prototype.toString, "e8c00e1afd2246a60b45aa322ecbbcef", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "e8c00e1afd2246a60b45aa322ecbbcef" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["28ab96ac124be1c4fb036630638dea7c"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "window.config.adv.enabled", "0" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "window.config.adv.enabled", "0" ]));
    Object.defineProperty(Window.prototype.toString, "28ab96ac124be1c4fb036630638dea7c", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "28ab96ac124be1c4fb036630638dea7c" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.c1c63ffb5d91f7a646dfd1873ae9cc9f === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "puShown", "true" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "puShown", "true" ]));
    Object.defineProperty(Window.prototype.toString, "c1c63ffb5d91f7a646dfd1873ae9cc9f", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "c1c63ffb5d91f7a646dfd1873ae9cc9f" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.f4432af6695d81325d4de4f84fb51857 === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "adscfg.enabled", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "adscfg.enabled", "false" ]));
    Object.defineProperty(Window.prototype.toString, "f4432af6695d81325d4de4f84fb51857", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "f4432af6695d81325d4de4f84fb51857" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["3856fe61cc348f558798057ab731f4a0"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "player.vroll", "noopFunc" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "player.vroll", "noopFunc" ]));
    Object.defineProperty(Window.prototype.toString, "3856fe61cc348f558798057ab731f4a0", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "3856fe61cc348f558798057ab731f4a0" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["00b1e9fcc03571e93bdebdcd18b0932f"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "Object.prototype.adSkipped", "true" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "Object.prototype.adSkipped", "true" ]));
    Object.defineProperty(Window.prototype.toString, "00b1e9fcc03571e93bdebdcd18b0932f", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "00b1e9fcc03571e93bdebdcd18b0932f" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["7c09148dd3eae9d1779aba6d4d6acd6d"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "document.referrer", "" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "document.referrer", "" ]));
    Object.defineProperty(Window.prototype.toString, "7c09148dd3eae9d1779aba6d4d6acd6d", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "7c09148dd3eae9d1779aba6d4d6acd6d" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["203dce156c30ad5430316158e46c7026"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "getFrontVideo", "noopFunc" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "getFrontVideo", "noopFunc" ]));
    Object.defineProperty(Window.prototype.toString, "203dce156c30ad5430316158e46c7026", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "203dce156c30ad5430316158e46c7026" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["7e2a4e30b0fe5806e8660c2ef31ec39c"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "isShow", "true" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "isShow", "true" ]));
    Object.defineProperty(Window.prototype.toString, "7e2a4e30b0fe5806e8660c2ef31ec39c", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "7e2a4e30b0fe5806e8660c2ef31ec39c" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.d535f7ede264829ed6b446d8c8e7c46c === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "config.adv", "emptyObj" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "config.adv", "emptyObj" ]));
    Object.defineProperty(Window.prototype.toString, "d535f7ede264829ed6b446d8c8e7c46c", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "d535f7ede264829ed6b446d8c8e7c46c" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["7f8680dd608a0aa6da1d147dcd229e78"] === e) return;
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "video_shown", "1" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "video_shown", "1" ]));
    Object.defineProperty(Window.prototype.toString, "7f8680dd608a0aa6da1d147dcd229e78", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "7f8680dd608a0aa6da1d147dcd229e78" due to: ' + e);
}
function setCookie(e, n) {
    var o = "done", i = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[i] !== o) {
        var t = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, o) {
                var i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "/", t = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "", a = function(e) {
                    if (!e) return null;
                    var n, o;
                    if (new Set([ "true", "t", "false", "f", "yes", "y", "no", "n", "ok", "on", "off", "accept", "accepted", "notaccepted", "reject", "rejected", "allow", "allowed", "disallow", "deny", "denied", "enable", "enabled", "disable", "disabled", "necessary", "required", "hide", "hidden", "essential", "nonessential", "checked", "unchecked", "forbidden", "forever", "declined", "mandatory", "all" ]).has(e.toLowerCase())) n = e; else if ("emptyArr" === e) n = "[]"; else if ("emptyObj" === e) n = "{}"; else {
                        if (!/^\d+$/.test(e)) return null;
                        if (o = n = parseFloat(e), (Number.isNaN || window.isNaN)(o)) return null;
                        if (Math.abs(n) < 0 || Math.abs(n) > 32767) return null;
                    }
                    return n;
                }(o);
                if (null !== a) if ("/" === (l = i) || "none" === l) {
                    var l;
                    if (document.location.origin.includes(t)) {
                        var d = function(e, n, o) {
                            var i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", t = !(arguments.length > 4 && void 0 !== arguments[4]) || arguments[4];
                            if (!t && `${n}`.includes(";") || e.includes(";")) return null;
                            var r = `${e}=${t ? encodeURIComponent(n) : n}`;
                            if (e.startsWith("__Host-")) return r += "; path=/; secure", i && console.debug(`Domain value: "${i}" has been ignored, because is not allowed for __Host- prefixed cookies`), 
                            r;
                            var a = function(e) {
                                return "/" === e ? "path=/" : "";
                            }(o);
                            return a && (r += `; ${a}`), e.startsWith("__Secure-") && (r += "; secure"), i && (r += `; domain=${i}`), 
                            r;
                        }(n, a, i, t, !1);
                        if (d) {
                            !function(e) {
                                if (e.verbose) {
                                    try {
                                        var n = console.trace.bind(console), o = "[AdGuard] ";
                                        "corelibs" === e.engine ? o += e.ruleText : (e.domainName && (o += `${e.domainName}`), 
                                        e.args ? o += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : o += `#%#//scriptlet('${e.name}')`), 
                                        n && n(o);
                                    } catch (e) {}
                                    "function" == typeof window.__debug && window.__debug(e);
                                }
                            }(e);
                            document.cookie = d;
                        } else r(e, "Invalid cookie name or value");
                    } else r(e, `Cookie domain not matched by origin: '${t}'`);
                } else r(e, `Invalid cookie path: '${i}'`); else r(e, `Invalid cookie value: '${a}'`);
            }).apply(this, t);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, i, {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function r(e, n) {
        var o = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], i = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: t, verbose: r} = e;
        if (o || r) {
            var a = console.log;
            i ? a(`${t}: ${n}`) : Array.isArray(n) ? a(`${t}:`, ...n) : a(`${t}:`, n);
        }
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["15b03fded13fe835ccf191ea43e594d7"] === e) return;
    setCookie.apply(this, [ {
        name: "set-cookie",
        args: [ "reklamgosterimx", "ok" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "reklamgosterimx", "ok" ]));
    Object.defineProperty(Window.prototype.toString, "15b03fded13fe835ccf191ea43e594d7", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "15b03fded13fe835ccf191ea43e594d7" due to: ' + e);
}
function removeAttr(e, t) {
    var n = "done", o = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[o] !== n) {
        var i = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, n) {
                var o = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "asap stay";
                if (t) {
                    t = t.split(/\s*\|\s*/);
                    n || (n = `[${t.join("],[")}]`);
                    var i, a, c, u, l, s, d = function() {
                        var o = [];
                        try {
                            o = [].slice.call(document.querySelectorAll(n));
                        } catch (t) {
                            !function(e, t) {
                                var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], o = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: r} = e;
                                if (n || r) {
                                    var a = console.log;
                                    o ? a(`${i}: ${t}`) : Array.isArray(t) ? a(`${i}:`, ...t) : a(`${i}:`, t);
                                }
                            }(e, `Invalid selector arg: '${n}'`);
                        }
                        var i = !1;
                        o.forEach((function(e) {
                            t.forEach((function(t) {
                                e.removeAttribute(t);
                                i = !0;
                            }));
                        }));
                        i && function(e) {
                            if (e.verbose) {
                                try {
                                    var t = console.trace.bind(console), n = "[AdGuard] ";
                                    "corelibs" === e.engine ? n += e.ruleText : (e.domainName && (n += `${e.domainName}`), 
                                    e.args ? n += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : n += `#%#//scriptlet('${e.name}')`), 
                                    t && t(n);
                                } catch (e) {}
                                "function" == typeof window.__debug && window.__debug(e);
                            }
                        }(e);
                    }, f = (i = o, a = "asap", c = "complete", u = "stay", l = new Set([ a, c, u ]), 
                    s = new Set(i.trim().split(" ").filter((function(e) {
                        return l.has(e);
                    }))), {
                        ASAP: a,
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
                        f.hasFlag(f.STAY) && r(d, !0);
                    }), {
                        once: !0
                    }); else if (f.hasFlag(f.STAY)) {
                        o.includes(" ") || d();
                        r(d, !0);
                    }
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, o, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function r(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : [], o = new MutationObserver(function(e, t) {
            var n, o = !1, i = function() {
                for (var r = arguments.length, a = new Array(r), c = 0; c < r; c++) a[c] = arguments[c];
                o ? n = a : (e(...a), o = !0, setTimeout((function() {
                    o = !1, n && (i(...n), n = null);
                }), t));
            };
            return i;
        }((function() {
            r(), e(), i();
        }), 20)), i = function() {
            n.length > 0 ? o.observe(document.documentElement, {
                childList: !0,
                subtree: !0,
                attributes: t,
                attributeFilter: n
            }) : o.observe(document.documentElement, {
                childList: !0,
                subtree: !0,
                attributes: t
            });
        }, r = function() {
            o.disconnect();
        };
        i();
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["2576627ab8cfd3a405e6bbb39bfb38d9"] === e) return;
    removeAttr.apply(this, [ {
        name: "remove-attr",
        args: [ "loading", 'iframe[loading="lazy"]' ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "loading", 'iframe[loading="lazy"]' ]));
    Object.defineProperty(Window.prototype.toString, "2576627ab8cfd3a405e6bbb39bfb38d9", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "2576627ab8cfd3a405e6bbb39bfb38d9" due to: ' + e);
}
function trustedSetCookie(e, n) {
    var o = "done", i = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[i] !== o) {
        var t = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, o) {
                var i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", t = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "/", a = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : "";
                if (void 0 !== n) if (void 0 !== o) {
                    var u, l, c = (l = u = o, "$now$" === u ? l = Date.now().toString() : "$currentDate$" === u ? l = Date() : "$currentISODate$" === u && (l = (new Date).toISOString()), 
                    l);
                    if ("/" === (d = t) || "none" === d) {
                        var d;
                        if (document.location.origin.includes(a)) {
                            var s = function(e, n, o) {
                                var i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", t = !(arguments.length > 4 && void 0 !== arguments[4]) || arguments[4];
                                if (!t && `${n}`.includes(";") || e.includes(";")) return null;
                                var r = `${e}=${t ? encodeURIComponent(n) : n}`;
                                if (e.startsWith("__Host-")) return r += "; path=/; secure", i && console.debug(`Domain value: "${i}" has been ignored, because is not allowed for __Host- prefixed cookies`), 
                                r;
                                var a = function(e) {
                                    return "/" === e ? "path=/" : "";
                                }(o);
                                return a && (r += `; ${a}`), e.startsWith("__Secure-") && (r += "; secure"), i && (r += `; domain=${i}`), 
                                r;
                            }(n, c, t, a, !1);
                            if (s) {
                                if (i) {
                                    var v = function(e) {
                                        var n;
                                        if ("1year" === e) n = 31536e3; else if ("1day" === e) n = 86400; else if (n = Number.parseInt(e, 10), 
                                        Number.isNaN(n)) return null;
                                        return 1e3 * n;
                                    }(i);
                                    if (!v) {
                                        r(e, `Invalid offsetExpiresSec value: ${i}`);
                                        return;
                                    }
                                    var f = Date.now() + v;
                                    s += `; expires=${new Date(f).toUTCString()}`;
                                }
                                document.cookie = s;
                                !function(e) {
                                    if (e.verbose) {
                                        try {
                                            var n = console.trace.bind(console), o = "[AdGuard] ";
                                            "corelibs" === e.engine ? o += e.ruleText : (e.domainName && (o += `${e.domainName}`), 
                                            e.args ? o += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : o += `#%#//scriptlet('${e.name}')`), 
                                            n && n(o);
                                        } catch (e) {}
                                        "function" == typeof window.__debug && window.__debug(e);
                                    }
                                }(e);
                            } else r(e, "Invalid cookie name or value");
                        } else r(e, `Cookie domain not matched by origin: '${a}'`);
                    } else r(e, `Invalid cookie path: '${t}'`);
                } else r(e, "Cookie value should be specified"); else r(e, "Cookie name should be specified");
            }).apply(this, t);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, i, {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.log(e);
        }
    }
    function r(e, n) {
        var o = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], i = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: t, verbose: r} = e;
        if (o || r) {
            var a = console.log;
            i ? a(`${t}: ${n}`) : Array.isArray(n) ? a(`${t}:`, ...n) : a(`${t}:`, n);
        }
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["77e6173dc430ae530ac895d01091200f"] === e) return;
    trustedSetCookie.apply(this, [ {
        name: "trusted-set-cookie",
        args: [ "fafafafaaaaa", "undefined" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "fafafafaaaaa", "undefined" ]));
    Object.defineProperty(Window.prototype.toString, "77e6173dc430ae530ac895d01091200f", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "77e6173dc430ae530ac895d01091200f" due to: ' + e);
}
})();
