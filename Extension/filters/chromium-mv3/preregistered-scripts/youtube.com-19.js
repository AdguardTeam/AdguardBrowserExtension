(function () {
var _b = new Set(), _c = {};
function jsonPrune(e, r) {
    var t = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(r) ? r.join("_") : "");
    if (!e.uniqueId || _c[n] !== t) {
        var a = r ? [].concat(e).concat(r) : [ e ];
        try {
            (function(e, r, t) {
                var n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", a = function(e, r) {
                    var t = "legacy", n = "jsonpath", a = "string" == typeof r ? r.trim().toLowerCase() : "";
                    if (a === t || a === n) return {
                        mode: a
                    };
                    var i = "string" == typeof e ? e.trim() : "";
                    return i.startsWith("$") || i.startsWith("[?") ? {
                        mode: n
                    } : {
                        mode: t
                    };
                }(r, arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : ""), c = "legacy" === a.mode ? l(r) : [], $ = "legacy" === a.mode ? l(t) : [], b = {
                    nativeParse: window.JSON.parse,
                    nativeStringify: window.JSON.stringify
                }, w = function(t) {
                    return "jsonpath" === a.mode ? function(e, r, t, n, a) {
                        var i = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : "", s = arguments.length > 6 && void 0 !== arguments[6] && arguments[6], l = "$", c = ".", $ = "..", b = "", w = "\\", x = ")", A = "[", W = "@", j = "contains", P = "equal", O = "exists", S = "greater_than", E = "greater_than_or_equal", R = "less_than", N = "less_than_or_equal", k = "not_equal", _ = "regex", V = [ "==", "!=", "<=", ">=", "*=", "=~", "<", ">", "=" ], I = /^[A-Za-z_$][\w$]*$/;
                        function J(e) {
                            return null !== e && "object" == typeof e;
                        }
                        function q(e) {
                            if (!J(e) || Array.isArray(e)) return !1;
                            var r = Object.getPrototypeOf(e);
                            return r === Object.prototype || null === r;
                        }
                        function F(e) {
                            return "'" === e || '"' === e;
                        }
                        function M(e, r) {
                            for (var t = 0, n = r - 1; n >= 0 && e[n] === w; ) t += 1, n -= 1;
                            return t % 2 != 0;
                        }
                        function C(e) {
                            var r = e.trim();
                            if (r.length < 2) return r;
                            var t = r[0], n = r[r.length - 1];
                            return F(t) && t === n ? r.slice(1, -1).split("\\'").join("'").split('\\"').join('"').split(w + w).join(w) : r;
                        }
                        function z(e, r) {
                            return "number" == typeof r || /^\d+$/.test(String(r)) ? `${e}[${r}]` : I.test(String(r)) ? `${e}.${r}` : `${e}['${String(r).replace(/'/g, "\\'")}']`;
                        }
                        function L(e, r, t, n) {
                            return {
                                key: t,
                                parent: r,
                                path: n,
                                value: e
                            };
                        }
                        function T(e, r) {
                            for (var t = 0, n = 0, a = 0, i = null, o = 0; o < e.length; o += 1) {
                                var s = e[o];
                                if (i) {
                                    if (s !== i || M(e, o) || (i = null), r(o, !1)) return;
                                } else if (F(s)) {
                                    if (i = s, r(o, !1)) return;
                                } else {
                                    var u = !0;
                                    if (s === A ? t += 1 : "]" === s ? t -= 1 : "{" === s ? n += 1 : "}" === s ? n -= 1 : "(" === s ? a += 1 : s === x ? a -= 1 : u = !1, 
                                    r(o, !u && 0 === t && 0 === n && 0 === a)) return;
                                }
                            }
                        }
                        function D(e, r) {
                            for (var t = 0, n = null, a = r; a < e.length; a += 1) {
                                var i = e[a];
                                if (n) i !== n || M(e, a) || (n = null); else if (F(i)) n = i; else if (i !== A) {
                                    if ("]" === i && 0 == (t -= 1)) return a;
                                } else t += 1;
                            }
                            return -1;
                        }
                        function K(e, r) {
                            var t = [], n = b, a = new Set;
                            return T(e, (function(i, o) {
                                if (!a.has(i)) if (o && e.startsWith(r, i)) {
                                    t.push(n.trim()), n = b;
                                    for (var s = 1; s < r.length; s += 1) a.add(i + s);
                                } else n += e[i];
                            })), n !== b && t.push(n.trim()), t;
                        }
                        function Z(e) {
                            var r = e.trim();
                            return r.startsWith(W) && (r = r.slice(1)), r === b ? l : r.startsWith(l) ? r : r.startsWith(c) || r.startsWith($) || r.startsWith(A) ? `${l}${r}` : `${l}${c}${r}`;
                        }
                        function B(e) {
                            var r = e.trim();
                            if (r.startsWith("(") && r.endsWith(x)) {
                                for (var t = 0, n = null, a = !1, i = 0; i < r.length; i += 1) {
                                    var o = r[i];
                                    if (n) o !== n || M(r, i) || (n = null); else if (F(o)) n = o; else if ("(" === o) t += 1; else if (o === x && 0 == (t -= 1)) {
                                        a = i === r.length - 1;
                                        break;
                                    }
                                }
                                a && (r = r.slice(1, -1).trim());
                            }
                            var s = K(r, "||");
                            if (s.length > 1) return {
                                conditions: s.map((function(e) {
                                    return B(e);
                                })),
                                operator: "or"
                            };
                            var u = K(r, "&&");
                            if (u.length > 1) return {
                                conditions: u.map((function(e) {
                                    return B(e);
                                })),
                                operator: "and"
                            };
                            if (r.startsWith("!") && !r.startsWith("!=")) return {
                                condition: B(r.slice(1).trim()),
                                operator: "not"
                            };
                            var p, v, h = (v = null, T(p = r, (function(e, r) {
                                if (!r) return !1;
                                for (var t = null, n = 0; n < V.length; n += 1) {
                                    var a = V[n];
                                    p.startsWith(a, e) && (null === t || a.length > t.length) && (t = a);
                                }
                                return null !== t && (v = {
                                    index: e,
                                    operator: t
                                }, !0);
                            })), v);
                            if (!h) return {
                                operator: O,
                                selectorPath: Z(r)
                            };
                            var d = r.slice(0, h.index).trim(), g = r.slice(h.index + h.operator.length).trim(), m = P;
                            "!=" === h.operator ? m = k : "<" === h.operator ? m = R : "<=" === h.operator ? m = N : ">" === h.operator ? m = S : ">=" === h.operator ? m = E : "*=" === h.operator ? m = j : ("=~" === h.operator || "=" === h.operator && /^\/.*\/[a-z]*$/i.test(g)) && (m = _);
                            var y, $, b = g.trim(), w = b === l || b.startsWith(l + c) || b.startsWith(l + A), I = b === W || b.startsWith(W + c) || b.startsWith(W + A);
                            return w || I ? {
                                comparisonSelectorPath: Z(b),
                                operator: m,
                                resolveComparisonAgainstRoot: w,
                                selectorPath: Z(d)
                            } : {
                                comparisonValue: (y = g, $ = y.trim(), "true" === $ || "false" !== $ && ("null" === $ ? null : /^-?\d+(?:\.\d+)?$/.test($) ? Number($) : /^\/.*\/[a-z]*$/i.test($) ? f($) : C($))),
                                operator: m,
                                selectorPath: Z(d)
                            };
                        }
                        function G(e, r) {
                            if ("*" === e) return {
                                mode: "wildcard",
                                recursive: r
                            };
                            if (e.startsWith("?")) return {
                                filter: B(e.slice(1)),
                                mode: "filter",
                                recursive: r
                            };
                            if (/^\(@\.length(?:-\d+)?\)$/.test(e)) {
                                var t = e.match(/^\(@\.length(?:-(\d+))?\)$/);
                                return {
                                    mode: "computed-index",
                                    recursive: r,
                                    subtractLength: t && t[1] ? Number(t[1]) : 0
                                };
                            }
                            var n = function(e) {
                                var r = [], t = b;
                                return T(e, (function(n, a) {
                                    a && ":" === e[n] ? (r.push(t.trim()), t = b) : t += e[n];
                                })), r.push(t.trim()), r;
                            }(e);
                            if (n.length > 1) {
                                var a = n[0] === b ? void 0 : Number(n[0]);
                                return {
                                    mode: "slice",
                                    recursive: r,
                                    slice: {
                                        end: n[1] === b ? void 0 : Number(n[1]),
                                        start: a,
                                        step: n.length > 2 && n[2] !== b ? Number(n[2]) : 1
                                    }
                                };
                            }
                            var i = function(e, r) {
                                var t = [], n = b;
                                return T(e, (function(a, i) {
                                    i && e[a] === r ? (t.push(n.trim()), n = b) : n += e[a];
                                })), n !== b && t.push(n.trim()), t;
                            }(e, ",");
                            return i.every((function(e) {
                                return /^-?\d+$/.test(e);
                            })) ? {
                                indexes: i.map((function(e) {
                                    return Number(e);
                                })),
                                mode: "index",
                                recursive: r
                            } : {
                                mode: "property",
                                properties: i.map((function(e) {
                                    return r = e.trim(), /^\/.*\/[a-z]*$/i.test(r) ? f(r) : C(r);
                                    var r;
                                })),
                                recursive: r
                            };
                        }
                        function H(e) {
                            var r = [], t = 0;
                            for (e.startsWith(l) && (t = 1); t < e.length; ) {
                                var n = !1;
                                if (e.startsWith($, t) ? (n = !0, t += 2) : e[t] === c && (t += 1), t >= e.length) break;
                                if (e[t] !== A) if ("*" !== e[t]) {
                                    for (var a = t; a < e.length && e[a] !== c && e[a] !== A; ) a += 1;
                                    var i = e.slice(t, a).trim();
                                    i && r.push({
                                        mode: "property",
                                        properties: [ i ],
                                        recursive: n
                                    }), t = a;
                                } else r.push({
                                    mode: "wildcard",
                                    recursive: n
                                }), t += 1; else {
                                    var o = D(e, t);
                                    if (-1 === o) throw new Error(`Invalid JSONPath expression: ${e}`);
                                    var s = e.slice(t + 1, o).trim();
                                    r.push(G(s, n)), t = o + 1;
                                }
                            }
                            return {
                                steps: r
                            };
                        }
                        function Q(e, r, t) {
                            var n, a = e.trim();
                            if (a.startsWith("{") || a.startsWith(A)) n = r(a); else {
                                var i = t(a);
                                if (!i || i.shouldReplaceArgument) throw new Error(`Invalid append value: ${e}`);
                                n = i.constantValue;
                            }
                            return function(e) {
                                return Array.isArray(e) ? Array.isArray(n) ? e.concat(n) : e.concat([ n ]) : q(e) && q(n) ? Object.assign({}, e, n) : "string" == typeof e && "string" == typeof n ? `${e}${n}` : n;
                            };
                        }
                        function U(e, r, t) {
                            var n = e.trim();
                            if (n.startsWith("replace(") && n.endsWith(x)) return function(e, r) {
                                var t = r(e.slice(8, -1));
                                if ("string" != typeof t.regex || "string" != typeof t.replacement) throw new Error('Invalid replace payload: "regex" and "replacement" must be strings');
                                var n = t.regex.startsWith("/") ? f(t.regex) : new RegExp(t.regex, t.flags || b);
                                return function(e) {
                                    return "string" != typeof e ? e : e.replace(n, t.replacement);
                                };
                            }(n, r);
                            var a = t(n);
                            if (!a) throw new Error(`Invalid set value: ${e}`);
                            return function(e) {
                                return function(e, r) {
                                    return r.shouldReplaceArgument ? "string" == typeof e ? e.replace(r.replaceRegexValue, r.constantValue) : e : !r.shouldMergeJsonValue || null === e || "object" != typeof e || Array.isArray(e) || null === r.constantValue || "object" != typeof r.constantValue || Array.isArray(r.constantValue) ? r.constantValue : Object.assign({}, e, r.constantValue);
                                }(e, a);
                            };
                        }
                        function X(e) {
                            if (!J(e.value)) return [];
                            for (var r = Object.keys(e.value), t = [], n = 0; n < r.length; n += 1) {
                                var a = r[n];
                                t.push(L(e.value[a], e.value, a, z(e.path, a)));
                            }
                            return t;
                        }
                        function Y(e) {
                            for (var r = [ e ], t = X(e), n = 0; n < t.length; n += 1) r.push(t[n]);
                            for (var a = 1; a < r.length; ) {
                                for (var i = X(r[a]), o = 0; o < i.length; o += 1) r.push(i[o]);
                                a += 1;
                            }
                            return r;
                        }
                        function ee(e, r) {
                            return r < 0 ? e + r : r;
                        }
                        function re(e, r) {
                            var t = [];
                            if ("property" === r.mode) {
                                if (!J(e.value) || !r.properties) return t;
                                for (var n = new Set, a = 0; a < r.properties.length; a += 1) {
                                    var i = r.properties[a];
                                    if (i instanceof RegExp) for (var o = Object.keys(e.value), s = 0; s < o.length; s += 1) {
                                        var u = o[s];
                                        i.lastIndex = 0, i.test(u) && !n.has(u) && (n.add(u), t.push(L(e.value[u], e.value, u, z(e.path, u))));
                                    } else !n.has(i) && Object.prototype.hasOwnProperty.call(e.value, i) && (n.add(i), 
                                    t.push(L(e.value[i], e.value, i, z(e.path, i))));
                                }
                                return t;
                            }
                            if ("wildcard" === r.mode) return X(e);
                            if ("index" === r.mode) {
                                if (!Array.isArray(e.value) || !r.indexes) return t;
                                for (var l = 0; l < r.indexes.length; l += 1) {
                                    var f = ee(e.value.length, r.indexes[l]);
                                    f >= 0 && f < e.value.length && t.push(L(e.value[f], e.value, f, z(e.path, f)));
                                }
                                return t;
                            }
                            if ("computed-index" === r.mode) {
                                if (!Array.isArray(e.value)) return t;
                                var c = e.value.length - (r.subtractLength || 0);
                                return c >= 0 && c < e.value.length && t.push(L(e.value[c], e.value, c, z(e.path, c))), 
                                t;
                            }
                            if ("slice" === r.mode) {
                                if (!Array.isArray(e.value) || !r.slice) return t;
                                for (var p = function(e, r) {
                                    var t, n, a = [], i = void 0 === r.step ? 1 : r.step;
                                    if (0 === i) return a;
                                    if (t = void 0 === r.start ? i > 0 ? 0 : e - 1 : ee(e, r.start), n = void 0 === r.end ? i > 0 ? e : -1 : ee(e, r.end), 
                                    i > 0) {
                                        for (var o = Math.max(0, t); o < Math.min(e, n); o += i) a.push(o);
                                        return a;
                                    }
                                    for (var s = Math.min(e - 1, t); s > Math.max(-1, n); s += i) a.push(s);
                                    return a;
                                }(e.value.length, r.slice), v = 0; v < p.length; v += 1) {
                                    var h = p[v];
                                    t.push(L(e.value[h], e.value, h, z(e.path, h)));
                                }
                            }
                            return t;
                        }
                        function te(e, t) {
                            function n(e, t) {
                                if ("conditions" in t) return "and" === t.operator ? t.conditions.every((function(r) {
                                    return n(e, r);
                                })) : t.conditions.some((function(r) {
                                    return n(e, r);
                                }));
                                if ("condition" in t) return !n(e, t.condition);
                                var a = te(e, H(t.selectorPath));
                                if (t.operator === O) return a.length > 0;
                                var i = t.comparisonValue;
                                if (t.comparisonSelectorPath) {
                                    var o = te(t.resolveComparisonAgainstRoot ? r : e, H(t.comparisonSelectorPath));
                                    if (0 === o.length) return !1;
                                    i = o[0].value;
                                }
                                for (var s = 0; s < a.length; s += 1) {
                                    var u = a[s].value;
                                    if (t.operator !== j) {
                                        if (t.operator !== _) {
                                            if (t.operator === P && u === i) return !0;
                                            if (t.operator === k && u !== i) return !0;
                                            if (t.operator === R && u < i) return !0;
                                            if (t.operator === N && u <= i) return !0;
                                            if (t.operator === S && u > i) return !0;
                                            if (t.operator === E && u >= i) return !0;
                                        } else if ("string" == typeof u && i instanceof RegExp && (i.lastIndex = 0, i.test(u))) return !0;
                                    } else if ("string" == typeof u && u.includes(String(i))) return !0;
                                }
                                return !1;
                            }
                            function a(e, r) {
                                for (var t = [], a = 0; a < e.length; a += 1) {
                                    var i = e[a];
                                    if (Array.isArray(i.value)) for (var o = 0; o < i.value.length; o += 1) n(i.value[o], r) && t.push(L(i.value[o], i.value, o, z(i.path, o))); else n(i.value, r) && t.push(i);
                                }
                                return t;
                            }
                            for (var i = [ L(e, null, null, l) ], o = 0; o < t.steps.length; o += 1) {
                                var s = t.steps[o];
                                if ("filter" === s.mode && s.filter) i = a(i, s.filter); else {
                                    for (var u = [], f = 0; f < i.length; f += 1) for (var c = i[f], p = s.recursive ? Y(c) : [ c ], v = 0; v < p.length; v += 1) for (var h = re(p[v], s), d = 0; d < h.length; d += 1) u.push(h[d]);
                                    i = u;
                                }
                            }
                            return i;
                        }
                        var ne = !1;
                        function ae() {
                            ne = !0;
                        }
                        if (!J(r)) return r;
                        var ie, oe = (ie = n) && ie.nativeParse ? ie.nativeParse : JSON.parse, se = function(e) {
                            return e && e.nativeStringify ? e.nativeStringify : JSON.stringify;
                        }(n), ue = (new Error).stack || "";
                        if (i && !o(i, ue)) return r;
                        if (!t) return u(e, `${window.location.hostname}\n${se(r, null, 2)}\nStack trace:\n${ue}`, !0), 
                        u(e, r, !0, !1), r;
                        try {
                            for (var le = function(e, r, t) {
                                var n, a = function(e) {
                                    var r = -1, t = "remove", n = 0;
                                    return T(e, (function(a, i) {
                                        return !!i && (e.startsWith("+=", a) ? (r = a, t = "append", n = 2, !0) : "=" === e[a] && (r = a, 
                                        t = "set", n = 1, !0));
                                    })), -1 === r ? {
                                        mode: "remove",
                                        selectorPart: e.trim(),
                                        valuePart: b
                                    } : {
                                        mode: t,
                                        selectorPart: e.slice(0, r).trim(),
                                        valuePart: e.slice(r + n).trim()
                                    };
                                }(e), i = function(e) {
                                    for (var r = [], t = e.trim(); t.startsWith("[?"); ) {
                                        var n = D(t, 0);
                                        if (-1 === n) break;
                                        var a = t.slice(1, n);
                                        r.push(B(a.slice(1))), t = t.slice(n + 1).trim();
                                    }
                                    return {
                                        guards: r,
                                        selectorPart: t
                                    };
                                }(a.selectorPart), o = H((n = i.selectorPart.trim()) === b ? l : n.startsWith(l) ? n : n.startsWith(c) || n.startsWith(A) || n.startsWith($) ? `${l}${n}` : `${l}${c}${n}`), s = {
                                    mode: a.mode
                                };
                                return "append" === a.mode ? s = {
                                    mode: "append",
                                    updater: Q(a.valuePart, r, t)
                                } : "set" === a.mode && (s = {
                                    mode: "set",
                                    updater: U(a.valuePart, r, t)
                                }), {
                                    guards: i.guards,
                                    mutation: s,
                                    selector: o
                                };
                            }(t, oe, (function(r) {
                                return function(e, r, t) {
                                    var n, a, i = "json:", o = "replace:", s = "", l = !1, f = !1;
                                    if (r.startsWith(o)) {
                                        var c = extractRegexAndReplacement(r);
                                        if (!c) return u(e, `Invalid argument value format: ${r}`), null;
                                        s = c.regexPart, n = c.replacementPart, l = !0;
                                    } else if (r.startsWith(i)) try {
                                        n = t(r.slice(i.length)), f = !0;
                                    } catch (t) {
                                        return u(e, `Invalid JSON argument value: ${r}`), null;
                                    } else if ("undefined" === r) n = void 0; else if ("false" === r) n = !1; else if ("true" === r) n = !0; else if ("null" === r) n = null; else if ("NaN" === r) n = NaN; else if ("emptyArr" === r || "[]" === r) n = []; else if ("emptyObj" === r || "{}" === r) n = {}; else if ("noopFunc" === r) n = v; else if ("noopCallbackFunc" === r) n = p; else if ("trueFunc" === r) n = h; else if ("falseFunc" === r) n = d; else if ("throwFunc" === r) n = g; else if ("noopPromiseResolve" === r) n = y; else if ("noopPromiseReject" === r) n = m; else if (/^-?\d+$/.test(r)) {
                                        if (a = n = parseFloat(r), (Number.isNaN || window.isNaN)(a)) return null;
                                    } else n = r;
                                    return {
                                        constantValue: n,
                                        replaceRegexValue: s,
                                        shouldReplaceArgument: l,
                                        shouldMergeJsonValue: f
                                    };
                                }(e, r, oe);
                            })), fe = 0; fe < le.guards.length; fe += 1) if (0 === te(r, {
                                steps: [ {
                                    filter: le.guards[fe],
                                    mode: "filter",
                                    recursive: !1
                                } ]
                            }).length) return r;
                            var ce = te(r, le.selector);
                            if (s) return ce.length > 0 && a && a(), r;
                            if (!("remove" === le.mutation.mode || "string" == typeof e.name && e.name.startsWith("trusted-"))) return u(e, "JSONPath set and append operations are allowed only in trusted scriptlets"), 
                            r;
                            if ("remove" === le.mutation.mode) return function(e) {
                                for (var r = new Set, t = new Map, n = 0; n < e.length; n += 1) {
                                    var a = e[n];
                                    if (null !== a.parent && null !== a.key && !r.has(a.path)) if (r.add(a.path), Array.isArray(a.parent)) {
                                        var i = t.get(a.parent) || [];
                                        i.push(Number(a.key)), t.set(a.parent, i);
                                    } else delete a.parent[a.key], ae();
                                }
                                t.forEach((function(e, r) {
                                    for (var t = Array.from(new Set(e)).sort((function(e, r) {
                                        return r - e;
                                    })), n = 0; n < t.length; n += 1) {
                                        var a = t[n];
                                        a >= 0 && a < r.length && (r.splice(a, 1), ae());
                                    }
                                }));
                            }(ce), ne && a && a(), r;
                            le.mutation.updater && (r = function(e, r, t) {
                                for (var n = new Set, a = e, i = 0; i < r.length; i += 1) {
                                    var o = r[i];
                                    n.has(o.path) || (n.add(o.path), null !== o.parent || null !== o.key || o.path !== l ? null !== o.parent && null !== o.key && (o.parent[o.key] = t(o.parent[o.key]), 
                                    ae()) : (a = t(a), ae()));
                                }
                                return a;
                            }(r, ce, le.mutation.updater), ne && a && a());
                        } catch (r) {
                            u(e, `JSONPath processing failed for expression '${t}': ${r.message}`);
                        }
                        return r;
                    }(e, t, r, b, (function() {
                        return i(e);
                    }), n) : function(e, r, t, n, a, l) {
                        var {nativeStringify: c} = l;
                        if (0 === t.length && 0 === n.length) return u(e, `${window.location.hostname}\n${c(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                        r && "object" == typeof r && u(e, r, !0, !1), r;
                        try {
                            if (!1 === function(e, r, t, n, a, i) {
                                if (!r) return !1;
                                var l, {nativeStringify: c} = i, p = t.map((function(e) {
                                    return e.path;
                                })), v = n.map((function(e) {
                                    return e.path;
                                }));
                                if (0 === p.length && v.length > 0) {
                                    var h = c(r);
                                    if (f(v.join("")).test(h)) return u(e, `${window.location.hostname}\n${c(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                                    r && "object" == typeof r && u(e, r, !0, !1), l = !1;
                                }
                                if (a && !o(a, (new Error).stack || "")) return l = !1;
                                for (var d, g = [ ".*.", "*.", ".*", ".[].", "[].", ".[]" ], m = function() {
                                    var e = v[y], t = e.split(".").pop(), n = g.some((function(r) {
                                        return e.includes(r);
                                    })), a = s(r, e, n);
                                    if (!a.length) return {
                                        v: l = !1
                                    };
                                    l = !n;
                                    for (var i = 0; i < a.length; i += 1) {
                                        var o = "string" == typeof t && void 0 !== a[i].base[t];
                                        l = n ? o || l : o && l;
                                    }
                                }, y = 0; y < v.length; y += 1) if (d = m()) return d.v;
                                return l;
                            }(e, r, t, n, a, l)) return r;
                            t.forEach((function(t) {
                                for (var n = t.path, a = t.value, o = s(r, n, !0, [], a), u = o.length - 1; u >= 0; u -= 1) {
                                    var l = o[u];
                                    if (void 0 !== l && l.base) if (i(e), Array.isArray(l.base)) try {
                                        var f = Number(l.prop);
                                        if (Number.isNaN(f)) continue;
                                        l.base.splice(f, 1);
                                    } catch (e) {
                                        console.error("Error while deleting array element", e);
                                    } else delete l.base[l.prop];
                                }
                            }));
                        } catch (r) {
                            u(e, r);
                        }
                        return r;
                    }(e, t, c, $, n, b);
                }, x = function() {
                    for (var e = arguments.length, r = new Array(e), t = 0; t < e; t++) r[t] = arguments[t];
                    var n = b.nativeParse.apply(JSON, r);
                    return w(n);
                };
                x.toString = b.nativeParse.toString.bind(b.nativeParse);
                JSON.parse = x;
                var A = Response.prototype.json;
                "undefined" != typeof Response && (Response.prototype.json = function() {
                    return A.apply(this).then((function(e) {
                        return w(e);
                    }));
                });
            }).apply(this, a);
            e.uniqueId && Object.defineProperty(_c, n, {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {}
    }
    function i(e) {
        if (e.verbose) {
            try {
                var r = console.trace.bind(console), t = "[ext] ";
                "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                e.args ? t += `#%#//s('${e.name}', '${e.args.join("', '")}')` : t += `#%#//s('${e.name}')`), 
                r && r(t);
            } catch (e) {}
            "function" == typeof window._d && window._d(e);
        }
    }
    function o(e, r) {
        if (!e || "" === e) return !0;
        var t = function() {
            try {
                for (var e = [], r = 1; r < 10; r += 1) {
                    var t = `$${r}`;
                    if (!RegExp[t]) break;
                    e.push(RegExp[t]);
                }
                return e;
            } catch (e) {
                return [];
            }
        }();
        if (function(e, r) {
            var t = "inlineScript", n = "injectedScript", a = function(e) {
                return e.includes(t);
            }, i = function(e) {
                return e.includes(n);
            };
            if (!a(e) && !i(e)) return !1;
            var o = window.location.href, s = o.indexOf("#");
            -1 !== s && (o = o.slice(0, s));
            var u = r.split("\n").slice(2).map((function(e) {
                return e.trim();
            })).map((function(e) {
                var r, a = /(.*?@)?(\S+)(:\d+)(:\d+)\)?$/.exec(e);
                if (a) {
                    var i, s, u = a[2], l = a[3], f = a[4];
                    if (null !== (i = u) && void 0 !== i && i.startsWith("(") && (u = u.slice(1)), null !== (s = u) && void 0 !== s && s.startsWith("<anonymous>")) {
                        var c;
                        u = n;
                        var p = void 0 !== a[1] ? a[1].slice(0, -1) : e.slice(0, a.index).trim();
                        null !== (c = p) && void 0 !== c && c.startsWith("at") && (p = p.slice(2).trim()), 
                        r = `${p} ${u}${l}${f}`.trim();
                    } else r = u === o ? `${t}${l}${f}`.trim() : `${u}${l}${f}`.trim();
                } else r = e;
                return r;
            }));
            if (u) for (var l = 0; l < u.length; l += 1) {
                if (a(e) && u[l].startsWith(t) && u[l].match(f(e))) return !0;
                if (i(e) && u[l].startsWith(n) && u[l].match(f(e))) return !0;
            }
            return !1;
        }(e, r)) return t.length && t[0] !== RegExp.$1 && c(t), !0;
        var n = f(e), a = r.split("\n").slice(2).map((function(e) {
            return e.trim();
        })).join("\n");
        return t.length && t[0] !== RegExp.$1 && c(t), function() {
            var e = Object.getOwnPropertyDescriptor(RegExp.prototype, "test"), r = null == e ? void 0 : e.value;
            if (e && "function" == typeof e.value) return r;
            throw new Error("RegExp.prototype.test is not a function");
        }().call(n, a);
    }
    function s(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : [], a = arguments.length > 4 ? arguments[4] : void 0, i = r.indexOf(".");
        if (-1 === i) {
            if ("*" === r || "[]" === r) {
                for (var o in e) if (Object.prototype.hasOwnProperty.call(e, o)) if (void 0 !== a) {
                    var u = e[o];
                    "string" == typeof u && a instanceof RegExp ? a.test(u) && n.push({
                        base: e,
                        prop: o
                    }) : u === a && n.push({
                        base: e,
                        prop: o
                    });
                } else n.push({
                    base: e,
                    prop: o
                });
            } else if (void 0 !== a) {
                var l = e[r];
                "string" == typeof l && a instanceof RegExp ? a.test(l) && n.push({
                    base: e,
                    prop: r
                }) : e[r] === a && n.push({
                    base: e,
                    prop: r
                });
            } else n.push({
                base: e,
                prop: r
            });
            return n;
        }
        var f = r.slice(0, i);
        if ("[]" === f && Array.isArray(e) || "*" === f && e instanceof Object || "[-]" === f && Array.isArray(e) || "{-}" === f && e instanceof Object) {
            var c = r.slice(i + 1), p = Object.keys(e);
            if ("{-}" === f || "[-]" === f) {
                var v = Array.isArray(e) ? "array" : "object";
                return ("{-}" !== f || "object" !== v) && ("[-]" !== f || "array" !== v) || p.forEach((function(r) {
                    (function(e, r, t) {
                        var n = r.split("."), a = function(e, r) {
                            if (null == e) return !1;
                            if (0 === r.length) return void 0 === t || ("string" == typeof e && t instanceof RegExp ? t.test(e) : e === t);
                            var n = r[0], i = r.slice(1);
                            if ("*" === n || "[]" === n) {
                                if (Array.isArray(e)) return e.some((function(e) {
                                    return a(e, i);
                                }));
                                if ("object" == typeof e && null !== e) return Object.keys(e).some((function(r) {
                                    return a(e[r], i);
                                }));
                            }
                            return !!Object.prototype.hasOwnProperty.call(e, n) && a(e[n], i);
                        };
                        return a(e, n);
                    })(e[r], c, a) && n.push({
                        base: e,
                        prop: r
                    });
                })), n;
            }
            p.forEach((function(r) {
                s(e[r], c, t, n, a);
            }));
        }
        Array.isArray(e) && e.forEach((function(e) {
            void 0 !== e && s(e, r, t, n, a);
        }));
        var h = e[f];
        return r = r.slice(i + 1), void 0 !== h && s(h, r, t, n, a), n;
    }
    function u(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: a, verbose: i} = e;
        if (t || i) {
            var o = console.log;
            n ? o(`${a}: ${r}`) : Array.isArray(r) ? o(`${a}:`, ...r) : o(`${a}:`, r);
        }
    }
    function l(e) {
        var r = ".[=].";
        if ("string" == typeof e && void 0 !== e && "" !== e) {
            var t = function(e) {
                for (var t = [], n = "", a = 0, i = !1, o = !1; a < e.length; ) {
                    var s = e[a];
                    if (i) n += s, "\\" === s ? o = !o : ("/" !== s || o || (i = !1), o = !1), a += 1; else {
                        if (" " === s || "\n" === s || "\t" === s || "\r" === s || "\f" === s || "\v" === s) {
                            for (;a < e.length && /\s/.test(e[a]); ) a += 1;
                            "" !== n && (t.push(n), n = "");
                            continue;
                        }
                        if (e.startsWith(r, a)) {
                            if (n += r, "/" === e[a += 5]) {
                                i = !0, o = !1, n += "/", a += 1;
                                continue;
                            }
                            continue;
                        }
                        n += s, a += 1;
                    }
                }
                return "" !== n && t.push(n), t;
            }(e);
            return t.map((function(e) {
                var t = e.split(r), n = t[0], a = t[1];
                return void 0 !== a ? ("true" === a ? a = !0 : "false" === a ? a = !1 : a.startsWith("/") ? a = f(a) : "string" == typeof a && /^\d+$/.test(a) && (a = parseFloat(a)), 
                {
                    path: n,
                    value: a
                }) : {
                    path: n
                };
            }));
        }
        return [];
    }
    function f(e) {
        var r = e || "", t = "/";
        if ("" === r) return new RegExp(".?");
        var n, a, i = r.lastIndexOf(t), o = r.substring(i + 1), s = r.substring(0, i + 1), u = (a = o, 
        (n = s).startsWith(t) && n.endsWith(t) && !n.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(a) ? a : "");
        if (r.startsWith(t) && r.endsWith(t) || u) return new RegExp((u ? s : r).slice(1, -1), u);
        var l = r.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(l);
    }
    function c(e) {
        if (e.length) try {
            var r;
            r = 1 === e.length ? `(${e[0]})` : e.reduce((function(e, r, t) {
                return 1 === t ? `(${e}),(${r})` : `${e},(${r})`;
            }));
            var t = new RegExp(r);
            e.toString().replace(t, "");
        } catch (e) {
            var n = `Failed to restore RegExp values: ${e}`;
            console.log(n);
        }
    }
    function p() {
        return v;
    }
    function v() {}
    function h() {
        return !0;
    }
    function d() {
        return !1;
    }
    function g() {
        throw new Error;
    }
    function m() {
        return Promise.reject();
    }
    function y() {
        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "{}", r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "", t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "basic";
        if ("undefined" != typeof Response) {
            var n = new Response(e, {
                headers: {
                    "Content-Length": `${e.length}`
                },
                status: 200,
                statusText: "OK"
            });
            return "opaque" === t ? Object.defineProperties(n, {
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
            }) : Object.defineProperties(n, {
                url: {
                    value: r
                },
                type: {
                    value: t
                }
            }), Promise.resolve(n);
        }
    }
}
try {
    var _k = "d0f891fdae741a62191ebec09a106f45";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPrune.apply(this, [ {
        name: "json-prune",
        args: [ "overlay.bottomSheetOverlayRenderer", "overlay.bottomSheetOverlayRenderer.displayImmediately" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "overlay.bottomSheetOverlayRenderer", "overlay.bottomSheetOverlayRenderer.displayImmediately" ]));
} catch (e) {}
})();
