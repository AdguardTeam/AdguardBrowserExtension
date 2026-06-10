(function () {
function spoofCSS(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[r] !== n) {
        var o = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, n, r) {
                if (t) {
                    var o = !("debug" !== n || !r), a = new Map;
                    if ([ "spoof-css.js", "ubo-spoof-css.js", "ubo-spoof-css" ].includes(e.name)) {
                        var {args: u} = e, c = [];
                        c = "debug" === u.at(-2) ? u.slice(1, -2) : u.slice(1);
                        for (var f = 0; f < c.length && "" !== c[f]; f += 2) a.set(w(c[f]), c[f + 1]);
                    } else n && r && !o && a.set(w(n), r);
                    var g = function(e, t) {
                        return a.has(e) ? a.get(e) : t;
                    }, l = function(e, t, n) {
                        var r = function() {
                            return `function ${n}() { [native code] }`;
                        }, o = function() {
                            return "function toString() { [native code] }";
                        };
                        o.toString = o;
                        r.toString = o;
                        var i = e.bind(t);
                        Object.defineProperty(i, "name", {
                            value: n
                        });
                        Object.defineProperty(i, "toString", {
                            value: r
                        });
                        return i;
                    }, p = function(e, t, n) {
                        Object.defineProperty(e, t, {
                            value: parseFloat(n)
                        });
                    }, s = new Set([ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__" ]), d = function(t, n, r) {
                        i(e);
                        if ("toString" === n) return function(e) {
                            var t = function() {
                                return `function ${e}() { [native code] }`;
                            }, n = function() {
                                return "function toString() { [native code] }";
                            };
                            n.toString = n;
                            t.toString = n;
                            return t;
                        }(t.name || "getComputedStyle");
                        if (s.has(n)) {
                            var o = t[n];
                            if ("function" == typeof o) return o.bind(t);
                        }
                        return Reflect.get(t, n, r);
                    }, y = {
                        apply: function(n, r, o) {
                            var u = Reflect.apply(n, r, o);
                            if (!o[0].matches(t)) return u;
                            var c = new Proxy(u, {
                                get(e, t) {
                                    var n = e[t];
                                    return "function" != typeof n ? g(t, n || "") : "getPropertyValue" !== t ? l(n, e, t) : l((function(t) {
                                        var n = e[t] || "";
                                        return g(t, n);
                                    }), e, "getPropertyValue");
                                },
                                getOwnPropertyDescriptor: (e, t) => a.has(t) ? {
                                    configurable: !0,
                                    enumerable: !0,
                                    value: a.get(t),
                                    writable: !0
                                } : Reflect.getOwnPropertyDescriptor(e, t)
                            });
                            i(e);
                            return c;
                        },
                        get: d
                    };
                    window.getComputedStyle = new Proxy(window.getComputedStyle, y);
                    var h = {
                        apply: function(n, r, o) {
                            var u = Reflect.apply(n, r, o);
                            if (!r.matches(t)) return u;
                            var {x: c, y: f, height: g, width: l} = u, s = new window.DOMRect(c, f, l, g);
                            a.has("top") && p(s, "top", a.get("top"));
                            a.has("bottom") && p(s, "bottom", a.get("bottom"));
                            a.has("left") && p(s, "left", a.get("left"));
                            a.has("right") && p(s, "right", a.get("right"));
                            a.has("height") && p(s, "height", a.get("height"));
                            a.has("width") && p(s, "width", a.get("width"));
                            i(e);
                            return s;
                        },
                        get: d
                    };
                    window.Element.prototype.getBoundingClientRect = new Proxy(window.Element.prototype.getBoundingClientRect, h);
                }
                function w(e) {
                    if (!e.includes("-")) return e;
                    var t = e.split("-"), n = t[0], r = t[1];
                    return `${n}${r[0].toUpperCase()}${r.slice(1)}`;
                }
            }).apply(this, o);
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
    function i(e) {
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
}
try {
    const e = "done";
    if (Window.prototype.toString["20575c5badea9bf12baa17a57f93aacc"] === e) return;
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "article[itemid] ~ article:not([itemid])", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "article[itemid] ~ article:not([itemid])", "display", "block" ]));
    Object.defineProperty(Window.prototype.toString, "20575c5badea9bf12baa17a57f93aacc", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "20575c5badea9bf12baa17a57f93aacc" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["25ea3f733bf858c686ee0e11414c865d"] === e) return;
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > div[id][class]", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > div[id][class]", "display", "block" ]));
    Object.defineProperty(Window.prototype.toString, "25ea3f733bf858c686ee0e11414c865d", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "25ea3f733bf858c686ee0e11414c865d" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["05b593431a0eb578e8a475732b149dec"] === e) return;
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "height", "149px" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "height", "149px" ]));
    Object.defineProperty(Window.prototype.toString, "05b593431a0eb578e8a475732b149dec", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "05b593431a0eb578e8a475732b149dec" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["608a05dd30583cadf9c55260a0ce89f8"] === e) return;
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article > article", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article > article", "display", "block" ]));
    Object.defineProperty(Window.prototype.toString, "608a05dd30583cadf9c55260a0ce89f8", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "608a05dd30583cadf9c55260a0ce89f8" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["21b1da7577720e40d1b5fb4ce79fd98a"] === e) return;
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "display", "block" ]));
    Object.defineProperty(Window.prototype.toString, "21b1da7577720e40d1b5fb4ce79fd98a", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "21b1da7577720e40d1b5fb4ce79fd98a" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["45b2db56be65a44f28c5e1de582e9b40"] === e) return;
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ 'body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] [style^="overflow: hidden; height:"] > *', "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ 'body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] [style^="overflow: hidden; height:"] > *', "display", "block" ]));
    Object.defineProperty(Window.prototype.toString, "45b2db56be65a44f28c5e1de582e9b40", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "45b2db56be65a44f28c5e1de582e9b40" due to: ' + e);
}
})();
