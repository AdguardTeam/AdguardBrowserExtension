(function () {
var _b = new Set(), _c = {};
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
    var _k = "5b00820c08e881d45196cdb82be5e1b6";
    if (_b.has(_k)) return;
    _b.add(_k);
    trustedClickElement.apply(this, [ {
        name: "trusted-click-element",
        args: [ '.ytm-bottom-sheet-overlay-renderer-container > .ytm-bottom-sheet-overlay-renderer-header[style*="m.youtube.com/static/open-app."] > ytm-button-renderer.icon-close button.yt-spec-button-shape-next', "", "2000" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ '.ytm-bottom-sheet-overlay-renderer-container > .ytm-bottom-sheet-overlay-renderer-header[style*="m.youtube.com/static/open-app."] > ytm-button-renderer.icon-close button.yt-spec-button-shape-next', "", "2000" ]));
} catch (e) {}
})();
