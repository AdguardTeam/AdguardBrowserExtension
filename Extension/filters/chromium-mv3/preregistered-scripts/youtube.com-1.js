(function () {
var _b = new Set(), _c = {};
function spoofCSS(e, t) {
    var n = "done", r = e.uniqueId + e.name + "_" + (Array.isArray(t) ? t.join("_") : "");
    if (!e.uniqueId || _c[r] !== n) {
        var o = t ? [].concat(e).concat(t) : [ e ];
        try {
            (function(e, t, n, r) {
                if (t) {
                    var o = !("debug" !== n || !r), a = new Map;
                    if ([ "spoof-css.js", "ubo-spoof-css.js", "ubo-spoof-css" ].includes(e.name)) {
                        var {args: u} = e, c = [];
                        c = "debug" === u.at(-2) ? u.slice(1, -2) : u.slice(1);
                        for (var f = 0; f < c.length && "" !== c[f]; f += 2) a.set(y(c[f]), c[f + 1]);
                    } else n && r && !o && a.set(y(n), r);
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
                    }, s = function(e, t, n) {
                        Object.defineProperty(e, t, {
                            value: parseFloat(n)
                        });
                    }, p = new Set([ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__" ]), d = function(t, n, r) {
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
                        if (p.has(n)) {
                            var o = t[n];
                            if ("function" == typeof o) return o.bind(t);
                        }
                        return Reflect.get(t, n, r);
                    }, h = {
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
                    window.getComputedStyle = new Proxy(window.getComputedStyle, h);
                    var v = {
                        apply: function(n, r, o) {
                            var u = Reflect.apply(n, r, o);
                            if (!r.matches(t)) return u;
                            var {x: c, y: f, height: g, width: l} = u, p = new window.DOMRect(c, f, l, g);
                            a.has("top") && s(p, "top", a.get("top"));
                            a.has("bottom") && s(p, "bottom", a.get("bottom"));
                            a.has("left") && s(p, "left", a.get("left"));
                            a.has("right") && s(p, "right", a.get("right"));
                            a.has("height") && s(p, "height", a.get("height"));
                            a.has("width") && s(p, "width", a.get("width"));
                            i(e);
                            return p;
                        },
                        get: d
                    };
                    window.Element.prototype.getBoundingClientRect = new Proxy(window.Element.prototype.getBoundingClientRect, v);
                }
                function y(e) {
                    if (!e.includes("-")) return e;
                    var t = e.split("-"), n = t[0], r = t[1];
                    return `${n}${r[0].toUpperCase()}${r.slice(1)}`;
                }
            }).apply(this, o);
            e.uniqueId && Object.defineProperty(_c, r, {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function i(e) {
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
}
try {
    var _k = "20575c5badea9bf12baa17a57f93aacc";
    if (_b.has(_k)) return;
    _b.add(_k);
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "article[itemid] ~ article:not([itemid])", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "article[itemid] ~ article:not([itemid])", "display", "block" ]));
} catch (a) {}
try {
    var _k = "25ea3f733bf858c686ee0e11414c865d";
    if (_b.has(_k)) return;
    _b.add(_k);
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > div[id][class]", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > div[id][class]", "display", "block" ]));
} catch (s) {}
try {
    var _k = "05b593431a0eb578e8a475732b149dec";
    if (_b.has(_k)) return;
    _b.add(_k);
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "height", "149px" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "height", "149px" ]));
} catch (s) {}
try {
    var _k = "608a05dd30583cadf9c55260a0ce89f8";
    if (_b.has(_k)) return;
    _b.add(_k);
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article > article", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article > article", "display", "block" ]));
} catch (s) {}
try {
    var _k = "21b1da7577720e40d1b5fb4ce79fd98a";
    if (_b.has(_k)) return;
    _b.add(_k);
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] > *:not(div)[class] article", "display", "block" ]));
} catch (s) {}
try {
    var _k = "45b2db56be65a44f28c5e1de582e9b40";
    if (_b.has(_k)) return;
    _b.add(_k);
    spoofCSS.apply(this, [ {
        name: "spoof-css",
        args: [ 'body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] [style^="overflow: hidden; height:"] > *', "display", "block" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ 'body > * > * > * > *:not(div)[id][class] ~ *:not(div)[id][class] [style^="overflow: hidden; height:"] > *', "display", "block" ]));
} catch (s) {}
})();
