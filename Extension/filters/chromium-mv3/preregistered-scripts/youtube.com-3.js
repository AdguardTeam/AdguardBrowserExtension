(function () {
var _b = new Set(), _c = {};
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
