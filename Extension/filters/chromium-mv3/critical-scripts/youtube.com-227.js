(function () {
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
    if (Window.prototype.toString["172c7211a64472a81aeb5b3ab3a43e3e"] === e) return;
    preventAddEventListener.apply(this, [ {
        name: "prevent-addEventListener",
        args: [ "click", "popMagic" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "click", "popMagic" ]));
    Object.defineProperty(Window.prototype.toString, "172c7211a64472a81aeb5b3ab3a43e3e", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "172c7211a64472a81aeb5b3ab3a43e3e" due to: ' + e);
}
function adjustSetTimeout(e, n) {
    var t = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(n) ? n.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== t) {
        var i = n ? [].concat(e).concat(n) : [ e ];
        try {
            (function(e, n, t, r) {
                var i = window.setTimeout, a = function(e) {
                    var n = e || "", t = "/";
                    if ("" === n) return new RegExp(".?");
                    var r, i, o = n.lastIndexOf(t), a = n.substring(o + 1), u = n.substring(0, o + 1), c = (i = a, 
                    (r = u).startsWith(t) && r.endsWith(t) && !r.endsWith("\\/") && function(e) {
                        if (!e) return !1;
                        try {
                            return new RegExp("", e), !0;
                        } catch (e) {
                            return !1;
                        }
                    }(i) ? i : "");
                    if (n.startsWith(t) && n.endsWith(t) || c) return new RegExp((c ? u : n).slice(1, -1), c);
                    var s = n.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    return new RegExp(s);
                }(n);
                window.setTimeout = function(n, u) {
                    if ((d = n) instanceof Function || "string" == typeof d) {
                        if (a.test(n.toString()) && (l = u, function(e) {
                            return "*" === e;
                        }(s = t) || l === function(e) {
                            var n = parseInt(e, 10);
                            return o(n) ? 1e3 : n;
                        }(s))) {
                            u *= function(e) {
                                var n = parseFloat(e), t = o(n) || !function(e) {
                                    return (Number.isFinite || window.isFinite)(e);
                                }(n) ? .05 : n;
                                return t < .001 && (t = .001), t > 50 && (t = 50), t;
                            }(r);
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
                    } else {
                        var c = `Scriptlet can't be applied because of invalid callback: '${String(n)}'`;
                        !function(e, n) {
                            var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: o} = e;
                            if (t || o) {
                                var a = console.log;
                                r ? a(`${i}: ${n}`) : Array.isArray(n) ? a(`${i}:`, ...n) : a(`${i}:`, n);
                            }
                        }(e, c);
                    }
                    for (var s, l, d, f = arguments.length, g = new Array(f > 2 ? f - 2 : 0), p = 2; p < f; p++) g[p - 2] = arguments[p];
                    return i.apply(window, [ n, u, ...g ]);
                };
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
        return (Number.isNaN || window.isNaN)(e);
    }
}
try {
    const e = "done";
    if (Window.prototype.toString["4162c07c8ed796eae074a4b76ca45e43"] === e) return;
    adjustSetTimeout.apply(this, [ {
        name: "adjust-setTimeout",
        args: [ "closeBtn.innerHTML", "*", "0.001" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "closeBtn.innerHTML", "*", "0.001" ]));
    Object.defineProperty(Window.prototype.toString, "4162c07c8ed796eae074a4b76ca45e43", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "4162c07c8ed796eae074a4b76ca45e43" due to: ' + e);
}
})();
