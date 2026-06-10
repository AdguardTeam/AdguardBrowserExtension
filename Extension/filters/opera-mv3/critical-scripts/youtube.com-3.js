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
    var _k = "48f96551f17d8f19cbd6c8e003042d7d";
    if (_b.has(_k)) return;
    _b.add(_k);
    preventXHR.apply(this, [ {
        name: "prevent-xhr",
        args: [ "/\\/api\\/stats\\/atr\\?.+?&rt=\\d+\\.\\d+.+?&volume=\\d+&cbr=.+?&fexp=v1%[-%0-9C]{300,}&.+?&muted=\\d(&vis=3)?&docid=/ method:POST" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "/\\/api\\/stats\\/atr\\?.+?&rt=\\d+\\.\\d+.+?&volume=\\d+&cbr=.+?&fexp=v1%[-%0-9C]{300,}&.+?&muted=\\d(&vis=3)?&docid=/ method:POST" ]));
} catch (d) {}
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
    var _k = "b644b79fadb30c57821cf8e3669c00de";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "navigator.getBattery", "noopPromiseResolve" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "navigator.getBattery", "noopPromiseResolve" ]));
} catch (e) {}
try {
    var _k = "29e07e10c4883055d7d8ca248ab298b3";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "navigator.privateAttribution", "undefined" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "navigator.privateAttribution", "undefined" ]));
} catch (t) {}
function noTopics(e, n) {
    var t = "done", o = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || _c[o] !== t) {
        var a = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e) {
                var n = "browsingTopics";
                if (Document instanceof Object != 0 && Object.prototype.hasOwnProperty.call(Document.prototype, n) && Document.prototype[n] instanceof Function != 0) {
                    Document.prototype[n] = function() {
                        return function() {
                            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "{}", n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "", t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "basic";
                            if ("undefined" != typeof Response) {
                                var o = new Response(e, {
                                    headers: {
                                        "Content-Length": `${e.length}`
                                    },
                                    status: 200,
                                    statusText: "OK"
                                });
                                return "opaque" === t ? Object.defineProperties(o, {
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
                                        value: t
                                    }
                                }) : Object.defineProperties(o, {
                                    url: {
                                        value: n
                                    },
                                    type: {
                                        value: t
                                    }
                                }), Promise.resolve(o);
                            }
                        }("[]");
                    };
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
}
try {
    var _k = "7e22a411dfbbe83bfc13ba426c901062";
    if (_b.has(_k)) return;
    _b.add(_k);
    noTopics.apply(this, [ {
        name: "no-topics",
        args: [],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([]));
} catch (e) {}
function noProtectedAudience(e, n) {
    var o = "done", t = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || _c[t] !== o) {
        var r = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e) {
                if (Document instanceof Object != 0) {
                    for (var n = {
                        joinAdInterestGroup: a,
                        runAdAuction: u,
                        leaveAdInterestGroup: a,
                        clearOriginJoinedAdInterestGroups: a,
                        createAuctionNonce: i,
                        updateAdInterestGroups: c
                    }, o = 0, t = Object.keys(n); o < t.length; o++) {
                        var r = t[o], s = Navigator.prototype;
                        Object.prototype.hasOwnProperty.call(s, r) && s[r] instanceof Function != 0 && (s[r] = n[r]);
                    }
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
                }
            }).apply(this, r);
            e.uniqueId && Object.defineProperty(_c, t, {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function i() {
        return "";
    }
    function c() {}
    function a() {
        return Promise.resolve(void 0);
    }
    function u() {
        return Promise.resolve(null);
    }
}
try {
    var _k = "9cc11451c157c4b8aa0e5573c1fa672b";
    if (_b.has(_k)) return;
    _b.add(_k);
    noProtectedAudience.apply(this, [ {
        name: "no-protected-audience",
        args: [],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([]));
} catch (e) {}
})();
