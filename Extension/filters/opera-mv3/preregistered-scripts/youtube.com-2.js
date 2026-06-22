(function () {
var _b = new Set(), _c = {};
try {
    var _k = "b149f5f8f73c8f7b2b21d20e1538bea4";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        const t = {
            apply: (t, e, n) => {
                const o = n[0];
                return "function" == typeof o && o.toString().includes("onAbnormalityDetected") && (n[0] = function() {}), 
                Reflect.apply(t, e, n);
            }
        };
        window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, t);
    })();
} catch (t) {}
try {
    var _k = "b2938935474adeb9fa9f991bc00ad666";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        const t = {
            apply: (t, e, n) => {
                const o = Reflect.apply(t, e, n);
                try {
                    o instanceof HTMLIFrameElement && "about:blank" === o.src && o.contentWindow && (o.contentWindow.fetch = window.fetch, 
                    o.contentWindow.Request = window.Request);
                } catch (t) {}
                return o;
            }
        };
        Node.prototype.appendChild = new Proxy(Node.prototype.appendChild, t);
    })();
} catch (t) {}
try {
    var _k = "ae4fa77cc5169989696ccbb4288099b4";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        let t = document.location.href, e = [], n = [], o = "", r = !1;
        const a = Array.prototype.push, c = {
            apply: (t, o, c) => (window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id && c[0] && c[0] !== window && "number" == typeof c[0].start && c[0].end && "ssap" === c[0].namespace && c[0].id && (r || 0 !== c[0]?.start || n.includes(c[0].id) || (e.length = 0, 
            n.length = 0, r = !0, a.call(e, c[0]), a.call(n, c[0].id)), r && 0 !== c[0]?.start && !n.includes(c[0].id) && (a.call(e, c[0]), 
            a.call(n, c[0].id))), Reflect.apply(t, o, c))
        };
        window.Array.prototype.push = new Proxy(window.Array.prototype.push, c), document.addEventListener("DOMContentLoaded", (function() {
            if (!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id) return;
            const a = () => {
                const t = document.querySelector("video");
                if (t && e.length) {
                    const a = Math.round(t.duration), c = Math.round(e.at(-1).end / 1e3), i = n.join(",");
                    if (!1 === t.loop && o !== i && a && a === c) {
                        const n = e.at(-1).start / 1e3;
                        t.currentTime < n && (t.currentTime = n, r = !1, o = i);
                    } else if (!0 === t.loop && a && a === c) {
                        const n = e.at(-1).start / 1e3;
                        t.currentTime < n && (t.currentTime = n, r = !1, o = i);
                    }
                }
            };
            a();
            new MutationObserver((() => {
                t !== document.location.href && (t = document.location.href, e.length = 0, n.length = 0, 
                r = !1), a();
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        }));
    })();
} catch (t) {}
try {
    var _k = "2e8e930a77cdc0a58bb793b156709071";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        const e = "pyv", t = "param_first", a = "param_second", n = "client_screen", c = "ad_type", o = "none", r = "eAFgAQ", l = "8AUB", i = "YAHI", s = "CHANNEL", y = t;
        let p = y, u = null;
        const d = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState"), b = () => {
            try {
                Object.defineProperty(document, "visibilityState", {
                    get: () => "visible",
                    configurable: !0
                });
            } catch (e) {}
        }, m = window.JSON.stringify, f = e => {
            p = e;
        };
        (() => {
            try {
                const e = Object.getOwnPropertyDescriptor(window.JSON, "parse");
                return !!e && e.writable;
            } catch (e) {
                return !1;
            }
        })() || ((() => {
            const e = {
                apply: (e, t, a) => {
                    try {
                        const e = t;
                        e?.includes('"minimumPlaybackRate":100,"maximumPlaybackRate":100') && (t = e.replace('"minimumPlaybackRate":100,"maximumPlaybackRate":100', '"minimumPlaybackRate":25,"maximumPlaybackRate":200'));
                    } catch (e) {}
                    return Reflect.apply(e, t, a);
                }
            };
            window.String.prototype.replace = new Proxy(window.String.prototype.replace, e);
        })(), f(n));
        const x = e => {
            (e.playbackContext || e.playerRequest) && delete e.context?.client?.configInfo?.appInstallData;
        }, C = (p, m, C) => {
            try {
                if (!p || !m || !C) return;
                (e => {
                    const t = e?.videoId;
                    t && (u && u !== t && f(y), u = t);
                })(p);
                const R = document.getElementById("movie_player")?.getPlayerResponse()?.playabilityStatus?.status;
                if ("LOGIN_REQUIRED" !== R && "CONTENT_CHECK_REQUIRED" !== R || (C = o), C === t && p.context?.client?.clientScreen !== s && !p.params?.startsWith(i)) return p.params = r, 
                p.playerRequest && p.playerRequest.params !== r && (p.playerRequest.params = r), 
                p.playbackContext && p.playbackContext.params !== r && (p.playbackContext.params = r), 
                m.contentPlaybackContext.lactMilliseconds = String(Date.now()), b(), void x(p);
                if (C === a && p.context?.client?.clientScreen !== s && !p.params?.startsWith(i)) return p.params !== l && (p.params = l), 
                p.playerRequest && p.playerRequest.params !== l && (p.playerRequest.params = l), 
                p.playbackContext && p.playbackContext.params !== l && (p.playbackContext.params = l), 
                p.playlistId || (p.context.client.clientScreen = s), m.contentPlaybackContext.lactMilliseconds = String(Date.now()), 
                b(), void x(p);
                if (!(C !== e || p.context?.client?.clientScreen === s || m.params?.startsWith(r) && m.params?.startsWith(l))) return m.adPlaybackContext = {
                    pyv: !0
                }, m.contentPlaybackContext.lactMilliseconds = String(Date.now()), void x(p);
                if (C === n && "WEB" === p.context?.client?.clientName) return p.context.client.clientScreen = s, 
                m.contentPlaybackContext.lactMilliseconds = String(Date.now()), b(), void x(p);
                if (C === c) return m.adPlaybackContext = {
                    adType: "AD_TYPE_INSTREAM"
                }, m.contentPlaybackContext.lactMilliseconds = String(Date.now()), b(), void x(p);
                if (C === o) return delete m.adPlaybackContext, void (() => {
                    try {
                        Object.defineProperty(document, "visibilityState", d);
                    } catch (e) {}
                })();
            } catch (e) {}
        }, R = [ "playerErrorMessageRenderer", "UNPLAYABLE" ], k = {
            apply: (r, l, i) => {
                if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/") || p === o) return Reflect.apply(r, l, i);
                let s;
                try {
                    if (s = Reflect.apply(r, l, i), !s.responseContext && !s.playabilityStatus) return s;
                    const y = m(s);
                    return R.some((e => y.includes(e))) && !y.includes("CONTENT_CHECK_REQUIRED") ? p === t ? (f(a), 
                    s) : p === a ? (f(e), s) : p === e ? (f(n), s) : p === n ? (f(c), s) : (f(o), s) : (p === t && s.playerConfig?.audioConfig?.muteOnStart && (location.href.includes("/watch") || s.cards && !s.playabilityStatus?.miniplayer) && (delete s.playerConfig.audioConfig.muteOnStart, 
                    s.messages[0]?.youThereRenderer && delete s.messages[0].youThereRenderer), p === c && s.playerConfig?.granularVariableSpeedConfig && (s.playerConfig.granularVariableSpeedConfig.maximumPlaybackRate = 200, 
                    s.playerConfig.granularVariableSpeedConfig.minimumPlaybackRate = 25), s);
                } catch (e) {}
                return s;
            }
        };
        window.JSON.parse = new Proxy(window.JSON.parse, k);
        const w = {
            apply: (e, t, a) => {
                if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(e, t, a);
                try {
                    let n = a[0];
                    if (n && (n.includes('"contentPlaybackContext"') || n.includes('"adSignalsInfo"'))) {
                        const c = JSON.parse(n);
                        if (!c.context?.client) return Reflect.apply(e, t, a);
                        c.playbackContext && C(c, c.playbackContext, p), c.playerRequest && C(c, c.playerRequest.playbackContext, p), 
                        n = m(c), a[0] = n;
                    }
                } catch (e) {}
                return Reflect.apply(e, t, a);
            }
        };
        window.TextEncoder.prototype.encode = new Proxy(window.TextEncoder.prototype.encode, w);
        const g = {
            apply: (e, t, a) => {
                if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(e, t, a);
                try {
                    const n = a[0];
                    if (!n?.context?.client) return Reflect.apply(e, t, a);
                    n.playbackContext && void 0 === n.playbackContext.adPlaybackContext && C(n, n.playbackContext, p), 
                    n.playerRequest && void 0 === n.playerRequest.playbackContext.adPlaybackContext && C(n, n.playerRequest.playbackContext, p), 
                    a[0] = n;
                } catch (e) {}
                return Reflect.apply(e, t, a);
            }
        };
        window.JSON.stringify = new Proxy(window.JSON.stringify, g);
        const h = {
            construct: (e, t, a) => {
                try {
                    const n = t[0];
                    let c = t[1]?.body;
                    if (!n?.includes("youtubei") || location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/") || !c) return Reflect.construct(e, t, a);
                    if (c.includes('"contentPlaybackContext"') || c.includes('"adSignalsInfo"')) {
                        const n = JSON.parse(c);
                        if (!n.context?.client) return Reflect.construct(e, t, a);
                        n.playbackContext && C(n, n.playbackContext, p), n.playerRequest && C(n, n.playerRequest.playbackContext, p), 
                        c = m(n), t[1].body = c;
                    }
                } catch (e) {}
                return Reflect.construct(e, t, a);
            }
        };
        window.Request = new Proxy(window.Request, h);
    })();
} catch (e) {}
try {
    var _k = "db1d269c06f73d400756ed71f805dc26";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        const e = "movie_player", t = "ytd-watch-flexy[player-unavailable]", r = `#${e} > .ytp-error`, n = "yt-playability-error-supported-renderers#error-screen:has(>*)", a = 'yt-playability-error-supported-renderers#error-screen a[href^="//support.google.com/youtube/answer/2802245"]', o = "LOGIN_REQUIRED", i = "CONTENT_CHECK_REQUIRED", c = "pyv", l = "param_first", s = "param_second", y = "client_screen", d = "ad_type", p = "none", u = "eAFgAQ", f = "8AUB", m = "YAHI", b = "CHANNEL", S = l;
        let v = S, x = null;
        const g = new Set, C = () => {
            const t = document.getElementById(e), r = window.location.search, n = new URLSearchParams(r).get("v") || t?.getVideoData?.().video_id, a = new URLSearchParams(r).get("t") ?? "0";
            return {
                videoId: n,
                timeInSeconds: parseInt(a, 10)
            };
        }, R = () => {
            q();
            const t = document.getElementById(e);
            if (t && "function" == typeof t.loadVideoById) try {
                const {videoId: e, timeInSeconds: r} = C();
                t.loadVideoById(e, r);
            } catch (e) {}
        }, I = (() => {
            let e = null, t = null, r = 0;
            return n => {
                try {
                    if (!n) return !1;
                    const {videoId: a} = C();
                    return !!a && (e === a && t === n ? r++ : (e = a, t = n, r = 1), r >= 2 && (r = 0, 
                    !0));
                } catch (e) {
                    return !1;
                }
            };
        })(), h = e => {
            v = e;
        }, k = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState"), P = () => {
            try {
                Object.defineProperty(document, "visibilityState", {
                    get: () => "visible",
                    configurable: !0
                });
            } catch (e) {}
        }, q = () => {
            const r = document.getElementById(e), c = document.querySelector(n), l = document.querySelector("yt-playability-error-supported-renderers.ytdMiniplayerPlayerContainerPlayabilityError:has(>*)"), s = document.querySelector(t), y = document.querySelector(a);
            if (!r || y) return;
            const d = r.getPlayerResponse?.();
            d?.playabilityStatus?.status !== o && d?.playabilityStatus?.status !== i ? (s || l) && (c?.style.setProperty("display", "none", "important"), 
            l?.style.setProperty("display", "none", "important"), s?.removeAttribute("player-unavailable")) : c?.style.setProperty("display", "block", "important");
        }, w = e => {
            (e.playbackContext || e.playerRequest) && delete e.context?.client?.configInfo?.appInstallData;
        }, E = (e, t, r) => {
            try {
                if (!e || !t || !r) return;
                if ((e => {
                    const t = e?.videoId;
                    t && (x && x !== t && h(S), x = t);
                })(e), r === l && e.context?.client?.clientScreen !== b && !e.params?.startsWith(m)) return e.params = u, 
                e.playerRequest && e.playerRequest.params !== u && (e.playerRequest.params = u), 
                e.playbackContext && e.playbackContext.params !== u && (e.playbackContext.params = u), 
                t.contentPlaybackContext.lactMilliseconds = String(Date.now()), P(), void w(e);
                if (r === s && e.context?.client?.clientScreen !== b && !e.params?.startsWith(m)) return e.params !== f && (e.params = f), 
                e.playerRequest && e.playerRequest.params !== f && (e.playerRequest.params = f), 
                e.playbackContext && e.playbackContext.params !== f && (e.playbackContext.params = f), 
                e.playlistId || (e.context.client.clientScreen = b), t.contentPlaybackContext.lactMilliseconds = String(Date.now()), 
                P(), void w(e);
                if (!(r !== c || e.context?.client?.clientScreen === b || t.params?.startsWith(u) && t.params?.startsWith(f))) return t.adPlaybackContext = {
                    pyv: !0
                }, t.contentPlaybackContext.lactMilliseconds = String(Date.now()), P(), void w(e);
                if (r === y && "WEB" === e.context?.client?.clientName) return e.context.client.clientScreen = b, 
                t.contentPlaybackContext.lactMilliseconds = String(Date.now()), P(), void w(e);
                if (r === d) return t.adPlaybackContext = {
                    adType: "AD_TYPE_INSTREAM"
                }, t.contentPlaybackContext.lactMilliseconds = String(Date.now()), P(), void w(e);
                if (r === p) return delete t.adPlaybackContext, void (() => {
                    try {
                        Object.defineProperty(document, "visibilityState", k);
                    } catch (e) {}
                })();
            } catch (e) {}
        };
        (() => {
            const e = {
                apply: (e, t, r) => {
                    try {
                        let n = r[0];
                        if (!n || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(e, t, r);
                        const a = Array.isArray(n), o = a ? n[0] : n;
                        if ("string" != typeof o) return Reflect.apply(e, t, r);
                        if (!o.includes('"contentPlaybackContext"') && !o.includes('"adSignalsInfo"')) return Reflect.apply(e, t, r);
                        const i = JSON.parse(o);
                        if (!i.context?.client) return Reflect.apply(e, t, r);
                        i.playbackContext && E(i, i.playbackContext, v), i.playerRequest && E(i, i.playerRequest.playbackContext, v);
                        const c = JSON.stringify(i);
                        a ? r[0][0] = c : r[0] = c;
                    } catch (e) {}
                    return Reflect.apply(e, t, r);
                }
            };
            window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, e);
        })();
        const _ = document.documentElement;
        new MutationObserver((() => {
            if (document.querySelector(n) && q(), !(() => {
                const c = document.getElementById(e), l = document.querySelector(r), s = document.querySelector(n), y = document.querySelector(t), d = document.querySelector(a);
                if (!c || d) return !1;
                const p = c.getPlayerResponse?.();
                if (p?.playabilityStatus?.status === o || p?.playabilityStatus?.status === i) return !1;
                const u = c.getVideoData?.();
                return (s || y || l) && null != u?.errorCode;
            })()) return;
            const {videoId: u} = C();
            (e => {
                if (e) for (const t of g) t !== e && g.delete(t);
            })(u), (() => {
                if (v === l) {
                    if (!I(s)) return void R();
                    h(s), R();
                } else if (v === s) {
                    if (!I(c)) return void R();
                    h(c), R();
                } else if (v === c) {
                    if (!I(y)) return void R();
                    h(y), R();
                } else if (v === y) {
                    if (!I(d)) return void R();
                    h(d), R();
                } else if (v === d) {
                    if (!I(p)) return void R();
                    h(p), R();
                } else if (v === p) {
                    const {videoId: e} = C();
                    if (!e || g.has(e)) return void q();
                    g.add(e), R();
                }
            })();
        })).observe(_, {
            attributes: !0,
            childList: !0,
            subtree: !0
        });
    })();
} catch (e) {}
try {
    var _k = "6538866de1d555f6662421f37564b39c";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        const e = {
            apply: (e, r, t) => {
                const n = t[0];
                if ("string" == typeof n?.value && n.value.includes("playerResponse")) try {
                    n.value = (a = n.value, (location.href.includes("/watch") || a.includes("cards") && !a.includes('"miniplayer"')) && a.includes('"muteOnStart":true') && (a = a.replace('"muteOnStart":true', '"muteOnStart":false')).includes('"youThereRenderer":') && (a = a.replace('"youThereRenderer":', '"no_youThereRenderer":')), 
                    a.replace(/"(adSlots|playerAds)":/g, '"no_ads":')), t[0] = n;
                } catch (e) {}
                var a;
                return Reflect.apply(e, r, t);
            }
        }, r = {
            apply: (r, t, n) => {
                const a = n[0];
                return "function" == typeof a && a.toString().includes(".next(") && (n[0] = new Proxy(a, e)), 
                Reflect.apply(r, t, n);
            }
        };
        window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, r);
    })();
} catch (e) {}
try {
    var _k = "cc07a31f6361dd25da8c32728ac08e9f";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        const e = {
            apply: (e, t, r) => {
                const o = Reflect.apply(e, t, r);
                if (o?.responseContext) try {
                    delete o.adSlots, delete o.playerAds, o.playerConfig?.audioConfig?.muteOnStart && (location.href.includes("/watch") || o.cards && !o.playabilityStatus?.miniplayer) && (delete o.playerConfig.audioConfig.muteOnStart, 
                    o.messages[0]?.youThereRenderer && delete o.messages[0].youThereRenderer);
                } catch (e) {}
                return o;
            }
        }, t = {
            apply: (t, r, o) => {
                const n = o[0];
                return "function" == typeof n && n.toString().includes("jspbResponseCtor") && (o[0] = new Proxy(n, e)), 
                Reflect.apply(t, r, o);
            }
        };
        window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, t);
    })();
} catch (e) {}
try {
    var _k = "ab30cf651bf4f7660cc398c45c285c13";
    if (_b.has(_k)) return;
    _b.add(_k);
    (() => {
        const t = {
            apply: (t, e, c) => {
                if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(t, e, c);
                try {
                    const a = c[0];
                    if (!a?.context?.client) return Reflect.apply(t, e, c);
                    const n = String(Date.now());
                    a.playbackContext && void 0 === a.playbackContext.adPlaybackContext && (a.playbackContext.contentPlaybackContext.lactMilliseconds = n), 
                    a.playerRequest && void 0 === a.playerRequest.playbackContext?.adPlaybackContext && (a.playerRequest.playbackContext.contentPlaybackContext.lactMilliseconds = n), 
                    c[0] = a;
                } catch (t) {}
                return Reflect.apply(t, e, c);
            }
        };
        window.JSON.stringify = new Proxy(window.JSON.stringify, t);
    })();
} catch (t) {}
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
    var _k = "a79747ca5a3b506b4590de1db083a676";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "google_ad_status", "1" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "google_ad_status", "1" ]));
} catch (a) {}
try {
    var _k = "0e437cd9baa32e47cb46c248a8fae1af";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "ytInitialPlayerResponse.adPlacements", "undefined" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "ytInitialPlayerResponse.adPlacements", "undefined" ]));
} catch (e) {}
try {
    var _k = "c268db58a9b15a4952a089c725f88fb7";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "ytInitialPlayerResponse.adSlots", "undefined" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "ytInitialPlayerResponse.adSlots", "undefined" ]));
} catch (e) {}
try {
    var _k = "15da581c43ae3d6de94366a3a6d93ec0";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "ytInitialPlayerResponse.playerAds", "undefined" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "ytInitialPlayerResponse.playerAds", "undefined" ]));
} catch (e) {}
try {
    var _k = "eb74dd2b5cb035caf128a3a4f18d8562";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "playerResponse.adPlacements", "undefined" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "playerResponse.adPlacements", "undefined" ]));
} catch (e) {}
try {
    var _k = "86c53bb798ee026ecd0219fd92697d94";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "ytcfg.data_.EXPERIMENT_FLAGS.web_streaming_watch", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "ytcfg.data_.EXPERIMENT_FLAGS.web_streaming_watch", "false" ]));
} catch (a) {}
try {
    var _k = "def1d0a41edae4ed720e459cfcc04a43";
    if (_b.has(_k)) return;
    _b.add(_k);
    setConstant.apply(this, [ {
        name: "set-constant",
        args: [ "__Cpn.prototype.showAds", "false" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "__Cpn.prototype.showAds", "false" ]));
} catch (e) {}
function jsonPrune(e, r) {
    var t = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(r) ? r.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[n] !== t) {
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
                        var i = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : "", u = arguments.length > 6 && void 0 !== arguments[6] && arguments[6], l = "$", c = ".", $ = "..", b = "", w = "\\", x = ")", W = "[", A = "@", j = "contains", P = "equal", S = "exists", O = "greater_than", E = "greater_than_or_equal", R = "less_than", N = "less_than_or_equal", k = "not_equal", _ = "regex", V = [ "==", "!=", "<=", ">=", "*=", "=~", "<", ">", "=" ], I = /^[A-Za-z_$][\w$]*$/;
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
                                var u = e[o];
                                if (i) {
                                    if (u !== i || M(e, o) || (i = null), r(o, !1)) return;
                                } else if (F(u)) {
                                    if (i = u, r(o, !1)) return;
                                } else {
                                    var s = !0;
                                    if (u === W ? t += 1 : "]" === u ? t -= 1 : "{" === u ? n += 1 : "}" === u ? n -= 1 : "(" === u ? a += 1 : u === x ? a -= 1 : s = !1, 
                                    r(o, !s && 0 === t && 0 === n && 0 === a)) return;
                                }
                            }
                        }
                        function D(e, r) {
                            for (var t = 0, n = null, a = r; a < e.length; a += 1) {
                                var i = e[a];
                                if (n) i !== n || M(e, a) || (n = null); else if (F(i)) n = i; else if (i !== W) {
                                    if ("]" === i && 0 == (t -= 1)) return a;
                                } else t += 1;
                            }
                            return -1;
                        }
                        function G(e, r) {
                            var t = [], n = b, a = new Set;
                            return T(e, (function(i, o) {
                                if (!a.has(i)) if (o && e.startsWith(r, i)) {
                                    t.push(n.trim()), n = b;
                                    for (var u = 1; u < r.length; u += 1) a.add(i + u);
                                } else n += e[i];
                            })), n !== b && t.push(n.trim()), t;
                        }
                        function K(e) {
                            var r = e.trim();
                            return r.startsWith(A) && (r = r.slice(1)), r === b ? l : r.startsWith(l) ? r : r.startsWith(c) || r.startsWith($) || r.startsWith(W) ? `${l}${r}` : `${l}${c}${r}`;
                        }
                        function Z(e) {
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
                            var u = G(r, "||");
                            if (u.length > 1) return {
                                conditions: u.map((function(e) {
                                    return Z(e);
                                })),
                                operator: "or"
                            };
                            var s = G(r, "&&");
                            if (s.length > 1) return {
                                conditions: s.map((function(e) {
                                    return Z(e);
                                })),
                                operator: "and"
                            };
                            if (r.startsWith("!") && !r.startsWith("!=")) return {
                                condition: Z(r.slice(1).trim()),
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
                                operator: S,
                                selectorPath: K(r)
                            };
                            var d = r.slice(0, h.index).trim(), g = r.slice(h.index + h.operator.length).trim(), m = P;
                            "!=" === h.operator ? m = k : "<" === h.operator ? m = R : "<=" === h.operator ? m = N : ">" === h.operator ? m = O : ">=" === h.operator ? m = E : "*=" === h.operator ? m = j : ("=~" === h.operator || "=" === h.operator && /^\/.*\/[a-z]*$/i.test(g)) && (m = _);
                            var y, $, b = g.trim(), w = b === l || b.startsWith(l + c) || b.startsWith(l + W), I = b === A || b.startsWith(A + c) || b.startsWith(A + W);
                            return w || I ? {
                                comparisonSelectorPath: K(b),
                                operator: m,
                                resolveComparisonAgainstRoot: w,
                                selectorPath: K(d)
                            } : {
                                comparisonValue: (y = g, $ = y.trim(), "true" === $ || "false" !== $ && ("null" === $ ? null : /^-?\d+(?:\.\d+)?$/.test($) ? Number($) : /^\/.*\/[a-z]*$/i.test($) ? f($) : C($))),
                                operator: m,
                                selectorPath: K(d)
                            };
                        }
                        function B(e, r) {
                            if ("*" === e) return {
                                mode: "wildcard",
                                recursive: r
                            };
                            if (e.startsWith("?")) return {
                                filter: Z(e.slice(1)),
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
                                if (e[t] !== W) if ("*" !== e[t]) {
                                    for (var a = t; a < e.length && e[a] !== c && e[a] !== W; ) a += 1;
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
                                    var u = e.slice(t + 1, o).trim();
                                    r.push(B(u, n)), t = o + 1;
                                }
                            }
                            return {
                                steps: r
                            };
                        }
                        function Q(e, r, t) {
                            var n, a = e.trim();
                            if (a.startsWith("{") || a.startsWith(W)) n = r(a); else {
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
                                    if (i instanceof RegExp) for (var o = Object.keys(e.value), u = 0; u < o.length; u += 1) {
                                        var s = o[u];
                                        i.lastIndex = 0, i.test(s) && !n.has(s) && (n.add(s), t.push(L(e.value[s], e.value, s, z(e.path, s))));
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
                                    for (var u = Math.min(e - 1, t); u > Math.max(-1, n); u += i) a.push(u);
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
                                if (t.operator === S) return a.length > 0;
                                var i = t.comparisonValue;
                                if (t.comparisonSelectorPath) {
                                    var o = te(t.resolveComparisonAgainstRoot ? r : e, H(t.comparisonSelectorPath));
                                    if (0 === o.length) return !1;
                                    i = o[0].value;
                                }
                                for (var u = 0; u < a.length; u += 1) {
                                    var s = a[u].value;
                                    if (t.operator !== j) {
                                        if (t.operator !== _) {
                                            if (t.operator === P && s === i) return !0;
                                            if (t.operator === k && s !== i) return !0;
                                            if (t.operator === R && s < i) return !0;
                                            if (t.operator === N && s <= i) return !0;
                                            if (t.operator === O && s > i) return !0;
                                            if (t.operator === E && s >= i) return !0;
                                        } else if ("string" == typeof s && i instanceof RegExp && (i.lastIndex = 0, i.test(s))) return !0;
                                    } else if ("string" == typeof s && s.includes(String(i))) return !0;
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
                                var u = t.steps[o];
                                if ("filter" === u.mode && u.filter) i = a(i, u.filter); else {
                                    for (var s = [], f = 0; f < i.length; f += 1) for (var c = i[f], p = u.recursive ? Y(c) : [ c ], v = 0; v < p.length; v += 1) for (var h = re(p[v], u), d = 0; d < h.length; d += 1) s.push(h[d]);
                                    i = s;
                                }
                            }
                            return i;
                        }
                        var ne = !1;
                        function ae() {
                            ne = !0;
                        }
                        if (!J(r)) return r;
                        var ie, oe = (ie = n) && ie.nativeParse ? ie.nativeParse : JSON.parse, ue = function(e) {
                            return e && e.nativeStringify ? e.nativeStringify : JSON.stringify;
                        }(n), se = (new Error).stack || "";
                        if (i && !o(i, se)) return r;
                        if (!t) return s(e, `${window.location.hostname}\n${ue(r, null, 2)}\nStack trace:\n${se}`, !0), 
                        s(e, r, !0, !1), r;
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
                                        r.push(Z(a.slice(1))), t = t.slice(n + 1).trim();
                                    }
                                    return {
                                        guards: r,
                                        selectorPart: t
                                    };
                                }(a.selectorPart), o = H((n = i.selectorPart.trim()) === b ? l : n.startsWith(l) ? n : n.startsWith(c) || n.startsWith(W) || n.startsWith($) ? `${l}${n}` : `${l}${c}${n}`), u = {
                                    mode: a.mode
                                };
                                return "append" === a.mode ? u = {
                                    mode: "append",
                                    updater: Q(a.valuePart, r, t)
                                } : "set" === a.mode && (u = {
                                    mode: "set",
                                    updater: U(a.valuePart, r, t)
                                }), {
                                    guards: i.guards,
                                    mutation: u,
                                    selector: o
                                };
                            }(t, oe, (function(r) {
                                return function(e, r, t) {
                                    var n, a, i = "json:", o = "replace:", u = "", l = !1, f = !1;
                                    if (r.startsWith(o)) {
                                        var c = extractRegexAndReplacement(r);
                                        if (!c) return s(e, `Invalid argument value format: ${r}`), null;
                                        u = c.regexPart, n = c.replacementPart, l = !0;
                                    } else if (r.startsWith(i)) try {
                                        n = t(r.slice(i.length)), f = !0;
                                    } catch (t) {
                                        return s(e, `Invalid JSON argument value: ${r}`), null;
                                    } else if ("undefined" === r) n = void 0; else if ("false" === r) n = !1; else if ("true" === r) n = !0; else if ("null" === r) n = null; else if ("NaN" === r) n = NaN; else if ("emptyArr" === r || "[]" === r) n = []; else if ("emptyObj" === r || "{}" === r) n = {}; else if ("noopFunc" === r) n = v; else if ("noopCallbackFunc" === r) n = p; else if ("trueFunc" === r) n = h; else if ("falseFunc" === r) n = d; else if ("throwFunc" === r) n = g; else if ("noopPromiseResolve" === r) n = y; else if ("noopPromiseReject" === r) n = m; else if (/^-?\d+$/.test(r)) {
                                        if (a = n = parseFloat(r), (Number.isNaN || window.isNaN)(a)) return null;
                                    } else n = r;
                                    return {
                                        constantValue: n,
                                        replaceRegexValue: u,
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
                            if (u) return ce.length > 0 && a && a(), r;
                            if (!("remove" === le.mutation.mode || "string" == typeof e.name && e.name.startsWith("trusted-"))) return s(e, "JSONPath set and append operations are allowed only in trusted scriptlets"), 
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
                            s(e, `JSONPath processing failed for expression '${t}': ${r.message}`);
                        }
                        return r;
                    }(e, t, r, b, (function() {
                        return i(e);
                    }), n) : function(e, r, t, n, a, l) {
                        var {nativeStringify: c} = l;
                        if (0 === t.length && 0 === n.length) return s(e, `${window.location.hostname}\n${c(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                        r && "object" == typeof r && s(e, r, !0, !1), r;
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
                                    if (f(v.join("")).test(h)) return s(e, `${window.location.hostname}\n${c(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                                    r && "object" == typeof r && s(e, r, !0, !1), l = !1;
                                }
                                if (a && !o(a, (new Error).stack || "")) return l = !1;
                                for (var d, g = [ ".*.", "*.", ".*", ".[].", "[].", ".[]" ], m = function() {
                                    var e = v[y], t = e.split(".").pop(), n = g.some((function(r) {
                                        return e.includes(r);
                                    })), a = u(r, e, n);
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
                                for (var n = t.path, a = t.value, o = u(r, n, !0, [], a), s = o.length - 1; s >= 0; s -= 1) {
                                    var l = o[s];
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
                            s(e, r);
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
                var W = Response.prototype.json;
                "undefined" != typeof Response && (Response.prototype.json = function() {
                    return W.apply(this).then((function(e) {
                        return w(e);
                    }));
                });
            }).apply(this, a);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, n, {
                value: t,
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
                var r = console.trace.bind(console), t = "[AdGuard] ";
                "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                e.args ? t += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : t += `#%#//scriptlet('${e.name}')`), 
                r && r(t);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
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
            var o = window.location.href, u = o.indexOf("#");
            -1 !== u && (o = o.slice(0, u));
            var s = r.split("\n").slice(2).map((function(e) {
                return e.trim();
            })).map((function(e) {
                var r, a = /(.*?@)?(\S+)(:\d+)(:\d+)\)?$/.exec(e);
                if (a) {
                    var i, u, s = a[2], l = a[3], f = a[4];
                    if (null !== (i = s) && void 0 !== i && i.startsWith("(") && (s = s.slice(1)), null !== (u = s) && void 0 !== u && u.startsWith("<anonymous>")) {
                        var c;
                        s = n;
                        var p = void 0 !== a[1] ? a[1].slice(0, -1) : e.slice(0, a.index).trim();
                        null !== (c = p) && void 0 !== c && c.startsWith("at") && (p = p.slice(2).trim()), 
                        r = `${p} ${s}${l}${f}`.trim();
                    } else r = s === o ? `${t}${l}${f}`.trim() : `${s}${l}${f}`.trim();
                } else r = e;
                return r;
            }));
            if (s) for (var l = 0; l < s.length; l += 1) {
                if (a(e) && s[l].startsWith(t) && s[l].match(f(e))) return !0;
                if (i(e) && s[l].startsWith(n) && s[l].match(f(e))) return !0;
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
    function u(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : [], a = arguments.length > 4 ? arguments[4] : void 0, i = r.indexOf(".");
        if (-1 === i) {
            if ("*" === r || "[]" === r) {
                for (var o in e) if (Object.prototype.hasOwnProperty.call(e, o)) if (void 0 !== a) {
                    var s = e[o];
                    "string" == typeof s && a instanceof RegExp ? a.test(s) && n.push({
                        base: e,
                        prop: o
                    }) : s === a && n.push({
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
                u(e[r], c, t, n, a);
            }));
        }
        Array.isArray(e) && e.forEach((function(e) {
            void 0 !== e && u(e, r, t, n, a);
        }));
        var h = e[f];
        return r = r.slice(i + 1), void 0 !== h && u(h, r, t, n, a), n;
    }
    function s(e, r) {
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
                    var u = e[a];
                    if (i) n += u, "\\" === u ? o = !o : ("/" !== u || o || (i = !1), o = !1), a += 1; else {
                        if (" " === u || "\n" === u || "\t" === u || "\r" === u || "\f" === u || "\v" === u) {
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
                        n += u, a += 1;
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
        var n, a, i = r.lastIndexOf(t), o = r.substring(i + 1), u = r.substring(0, i + 1), s = (a = o, 
        (n = u).startsWith(t) && n.endsWith(t) && !n.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(a) ? a : "");
        if (r.startsWith(t) && r.endsWith(t) || s) return new RegExp((s ? u : r).slice(1, -1), s);
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
    var _k = "058a7c556e9dee902eb335e878a4c202";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPrune.apply(this, [ {
        name: "json-prune",
        args: [ "playerResponse.adPlacements playerResponse.adSlots", "playerResponse.streamingData.serverAbrStreamingUrl" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "playerResponse.adPlacements playerResponse.adSlots", "playerResponse.streamingData.serverAbrStreamingUrl" ]));
} catch (e) {}
try {
    var _k = "6c421f821292af01ec734d9a198d6f3b";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPrune.apply(this, [ {
        name: "json-prune",
        args: [ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots" ]));
} catch (e) {}
try {
    var _k = "82d7d8fb8b4fc45ecb294ca0d84091d9";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPrune.apply(this, [ {
        name: "json-prune",
        args: [ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots", "", "/https:\\/\\/www\\.youtube\\.com\\/s\\/player\\/.*\\/tv-player-ias\\.vflset\\/tv-player-ias\\.js:/" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots", "", "/https:\\/\\/www\\.youtube\\.com\\/s\\/player\\/.*\\/tv-player-ias\\.vflset\\/tv-player-ias\\.js:/" ]));
} catch (e) {}
try {
    var _k = "1543fd1ba40f942fe3b2db7ecb383d98";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPrune.apply(this, [ {
        name: "json-prune",
        args: [ "entries.[-].command.reelWatchEndpoint.adClientParams.isAd" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "entries.[-].command.reelWatchEndpoint.adClientParams.isAd" ]));
} catch (e) {}
try {
    var _k = "83374fc017baf63da8ca5d5e315972d4";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPrune.apply(this, [ {
        name: "json-prune",
        args: [ "playerResponse.messages.[].youThereRenderer" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "playerResponse.messages.[].youThereRenderer" ]));
} catch (e) {}
function jsonPruneXhrResponse(e, r) {
    var t = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(r) ? r.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[n] !== t) {
        var a = r ? [].concat(e).concat(r) : [ e ];
        try {
            (function(e, r, t) {
                var n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", a = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "";
                if ("undefined" != typeof Proxy) {
                    var b = !r && !t, w = function(e, r) {
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
                    }(r, arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : ""), $ = "legacy" === w.mode ? d(r) : [], x = "legacy" === w.mode ? d(t) : [], R = window.JSON.parse, W = window.JSON.stringify, j = {
                        nativeParse: R,
                        nativeStringify: W
                    }, A = function(t) {
                        return "jsonpath" === w.mode ? function(e, r, t, n, a) {
                            var i = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : "", d = arguments.length > 6 && void 0 !== arguments[6] && arguments[6], g = "$", m = ".", b = "..", w = "", $ = "\\", x = ")", R = "[", W = "@", j = "contains", A = "equal", E = "exists", P = "greater_than", O = "greater_than_or_equal", S = "less_than", k = "less_than_or_equal", N = "not_equal", q = "regex", M = [ "==", "!=", "<=", ">=", "*=", "=~", "<", ">", "=" ], L = /^[A-Za-z_$][\w$]*$/;
                            function _(e) {
                                return null !== e && "object" == typeof e;
                            }
                            function I(e) {
                                if (!_(e) || Array.isArray(e)) return !1;
                                var r = Object.getPrototypeOf(e);
                                return r === Object.prototype || null === r;
                            }
                            function V(e) {
                                return "'" === e || '"' === e;
                            }
                            function H(e, r) {
                                for (var t = 0, n = r - 1; n >= 0 && e[n] === $; ) t += 1, n -= 1;
                                return t % 2 != 0;
                            }
                            function J(e) {
                                var r = e.trim();
                                if (r.length < 2) return r;
                                var t = r[0], n = r[r.length - 1];
                                return V(t) && t === n ? r.slice(1, -1).split("\\'").join("'").split('\\"').join('"').split($ + $).join($) : r;
                            }
                            function T(e, r) {
                                return "number" == typeof r || /^\d+$/.test(String(r)) ? `${e}[${r}]` : L.test(String(r)) ? `${e}.${r}` : `${e}['${String(r).replace(/'/g, "\\'")}']`;
                            }
                            function X(e, r, t, n) {
                                return {
                                    key: t,
                                    parent: r,
                                    path: n,
                                    value: e
                                };
                            }
                            function F(e, r) {
                                for (var t = 0, n = 0, a = 0, i = null, o = 0; o < e.length; o += 1) {
                                    var s = e[o];
                                    if (i) {
                                        if (s !== i || H(e, o) || (i = null), r(o, !1)) return;
                                    } else if (V(s)) {
                                        if (i = s, r(o, !1)) return;
                                    } else {
                                        var u = !0;
                                        if (s === R ? t += 1 : "]" === s ? t -= 1 : "{" === s ? n += 1 : "}" === s ? n -= 1 : "(" === s ? a += 1 : s === x ? a -= 1 : u = !1, 
                                        r(o, !u && 0 === t && 0 === n && 0 === a)) return;
                                    }
                                }
                            }
                            function C(e, r) {
                                for (var t = 0, n = null, a = r; a < e.length; a += 1) {
                                    var i = e[a];
                                    if (n) i !== n || H(e, a) || (n = null); else if (V(i)) n = i; else if (i !== R) {
                                        if ("]" === i && 0 == (t -= 1)) return a;
                                    } else t += 1;
                                }
                                return -1;
                            }
                            function z(e, r) {
                                var t = [], n = w, a = new Set;
                                return F(e, (function(i, o) {
                                    if (!a.has(i)) if (o && e.startsWith(r, i)) {
                                        t.push(n.trim()), n = w;
                                        for (var s = 1; s < r.length; s += 1) a.add(i + s);
                                    } else n += e[i];
                                })), n !== w && t.push(n.trim()), t;
                            }
                            function B(e) {
                                var r = e.trim();
                                return r.startsWith(W) && (r = r.slice(1)), r === w ? g : r.startsWith(g) ? r : r.startsWith(m) || r.startsWith(b) || r.startsWith(R) ? `${g}${r}` : `${g}${m}${r}`;
                            }
                            function U(e) {
                                var r = e.trim();
                                if (r.startsWith("(") && r.endsWith(x)) {
                                    for (var t = 0, n = null, a = !1, i = 0; i < r.length; i += 1) {
                                        var o = r[i];
                                        if (n) o !== n || H(r, i) || (n = null); else if (V(o)) n = o; else if ("(" === o) t += 1; else if (o === x && 0 == (t -= 1)) {
                                            a = i === r.length - 1;
                                            break;
                                        }
                                    }
                                    a && (r = r.slice(1, -1).trim());
                                }
                                var u = z(r, "||");
                                if (u.length > 1) return {
                                    conditions: u.map((function(e) {
                                        return U(e);
                                    })),
                                    operator: "or"
                                };
                                var l = z(r, "&&");
                                if (l.length > 1) return {
                                    conditions: l.map((function(e) {
                                        return U(e);
                                    })),
                                    operator: "and"
                                };
                                if (r.startsWith("!") && !r.startsWith("!=")) return {
                                    condition: U(r.slice(1).trim()),
                                    operator: "not"
                                };
                                var c, f, p = (f = null, F(c = r, (function(e, r) {
                                    if (!r) return !1;
                                    for (var t = null, n = 0; n < M.length; n += 1) {
                                        var a = M[n];
                                        c.startsWith(a, e) && (null === t || a.length > t.length) && (t = a);
                                    }
                                    return null !== t && (f = {
                                        index: e,
                                        operator: t
                                    }, !0);
                                })), f);
                                if (!p) return {
                                    operator: E,
                                    selectorPath: B(r)
                                };
                                var v = r.slice(0, p.index).trim(), h = r.slice(p.index + p.operator.length).trim(), d = A;
                                "!=" === p.operator ? d = N : "<" === p.operator ? d = S : "<=" === p.operator ? d = k : ">" === p.operator ? d = P : ">=" === p.operator ? d = O : "*=" === p.operator ? d = j : ("=~" === p.operator || "=" === p.operator && /^\/.*\/[a-z]*$/i.test(h)) && (d = q);
                                var y, b, w = h.trim(), $ = w === g || w.startsWith(g + m) || w.startsWith(g + R), L = w === W || w.startsWith(W + m) || w.startsWith(W + R);
                                return $ || L ? {
                                    comparisonSelectorPath: B(w),
                                    operator: d,
                                    resolveComparisonAgainstRoot: $,
                                    selectorPath: B(v)
                                } : {
                                    comparisonValue: (y = h, b = y.trim(), "true" === b || "false" !== b && ("null" === b ? null : /^-?\d+(?:\.\d+)?$/.test(b) ? Number(b) : /^\/.*\/[a-z]*$/i.test(b) ? s(b) : J(b))),
                                    operator: d,
                                    selectorPath: B(v)
                                };
                            }
                            function D(e, r) {
                                if ("*" === e) return {
                                    mode: "wildcard",
                                    recursive: r
                                };
                                if (e.startsWith("?")) return {
                                    filter: U(e.slice(1)),
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
                                    var r = [], t = w;
                                    return F(e, (function(n, a) {
                                        a && ":" === e[n] ? (r.push(t.trim()), t = w) : t += e[n];
                                    })), r.push(t.trim()), r;
                                }(e);
                                if (n.length > 1) {
                                    var a = n[0] === w ? void 0 : Number(n[0]);
                                    return {
                                        mode: "slice",
                                        recursive: r,
                                        slice: {
                                            end: n[1] === w ? void 0 : Number(n[1]),
                                            start: a,
                                            step: n.length > 2 && n[2] !== w ? Number(n[2]) : 1
                                        }
                                    };
                                }
                                var i = function(e, r) {
                                    var t = [], n = w;
                                    return F(e, (function(a, i) {
                                        i && e[a] === r ? (t.push(n.trim()), n = w) : n += e[a];
                                    })), n !== w && t.push(n.trim()), t;
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
                                        return r = e.trim(), /^\/.*\/[a-z]*$/i.test(r) ? s(r) : J(r);
                                        var r;
                                    })),
                                    recursive: r
                                };
                            }
                            function G(e) {
                                var r = [], t = 0;
                                for (e.startsWith(g) && (t = 1); t < e.length; ) {
                                    var n = !1;
                                    if (e.startsWith(b, t) ? (n = !0, t += 2) : e[t] === m && (t += 1), t >= e.length) break;
                                    if (e[t] !== R) if ("*" !== e[t]) {
                                        for (var a = t; a < e.length && e[a] !== m && e[a] !== R; ) a += 1;
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
                                        var o = C(e, t);
                                        if (-1 === o) throw new Error(`Invalid JSONPath expression: ${e}`);
                                        var s = e.slice(t + 1, o).trim();
                                        r.push(D(s, n)), t = o + 1;
                                    }
                                }
                                return {
                                    steps: r
                                };
                            }
                            function K(e, r, t) {
                                var n, a = e.trim();
                                if (a.startsWith("{") || a.startsWith(R)) n = r(a); else {
                                    var i = t(a);
                                    if (!i || i.shouldReplaceArgument) throw new Error(`Invalid append value: ${e}`);
                                    n = i.constantValue;
                                }
                                return function(e) {
                                    return Array.isArray(e) ? Array.isArray(n) ? e.concat(n) : e.concat([ n ]) : I(e) && I(n) ? Object.assign({}, e, n) : "string" == typeof e && "string" == typeof n ? `${e}${n}` : n;
                                };
                            }
                            function Z(e, r, t) {
                                var n = e.trim();
                                if (n.startsWith("replace(") && n.endsWith(x)) return function(e, r) {
                                    var t = r(e.slice(8, -1));
                                    if ("string" != typeof t.regex || "string" != typeof t.replacement) throw new Error('Invalid replace payload: "regex" and "replacement" must be strings');
                                    var n = t.regex.startsWith("/") ? s(t.regex) : new RegExp(t.regex, t.flags || w);
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
                            function Q(e) {
                                if (!_(e.value)) return [];
                                for (var r = Object.keys(e.value), t = [], n = 0; n < r.length; n += 1) {
                                    var a = r[n];
                                    t.push(X(e.value[a], e.value, a, T(e.path, a)));
                                }
                                return t;
                            }
                            function Y(e) {
                                for (var r = [ e ], t = Q(e), n = 0; n < t.length; n += 1) r.push(t[n]);
                                for (var a = 1; a < r.length; ) {
                                    for (var i = Q(r[a]), o = 0; o < i.length; o += 1) r.push(i[o]);
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
                                    if (!_(e.value) || !r.properties) return t;
                                    for (var n = new Set, a = 0; a < r.properties.length; a += 1) {
                                        var i = r.properties[a];
                                        if (i instanceof RegExp) for (var o = Object.keys(e.value), s = 0; s < o.length; s += 1) {
                                            var u = o[s];
                                            i.lastIndex = 0, i.test(u) && !n.has(u) && (n.add(u), t.push(X(e.value[u], e.value, u, T(e.path, u))));
                                        } else !n.has(i) && Object.prototype.hasOwnProperty.call(e.value, i) && (n.add(i), 
                                        t.push(X(e.value[i], e.value, i, T(e.path, i))));
                                    }
                                    return t;
                                }
                                if ("wildcard" === r.mode) return Q(e);
                                if ("index" === r.mode) {
                                    if (!Array.isArray(e.value) || !r.indexes) return t;
                                    for (var l = 0; l < r.indexes.length; l += 1) {
                                        var c = ee(e.value.length, r.indexes[l]);
                                        c >= 0 && c < e.value.length && t.push(X(e.value[c], e.value, c, T(e.path, c)));
                                    }
                                    return t;
                                }
                                if ("computed-index" === r.mode) {
                                    if (!Array.isArray(e.value)) return t;
                                    var f = e.value.length - (r.subtractLength || 0);
                                    return f >= 0 && f < e.value.length && t.push(X(e.value[f], e.value, f, T(e.path, f))), 
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
                                        t.push(X(e.value[h], e.value, h, T(e.path, h)));
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
                                    var a = te(e, G(t.selectorPath));
                                    if (t.operator === E) return a.length > 0;
                                    var i = t.comparisonValue;
                                    if (t.comparisonSelectorPath) {
                                        var o = te(t.resolveComparisonAgainstRoot ? r : e, G(t.comparisonSelectorPath));
                                        if (0 === o.length) return !1;
                                        i = o[0].value;
                                    }
                                    for (var s = 0; s < a.length; s += 1) {
                                        var u = a[s].value;
                                        if (t.operator !== j) {
                                            if (t.operator !== q) {
                                                if (t.operator === A && u === i) return !0;
                                                if (t.operator === N && u !== i) return !0;
                                                if (t.operator === S && u < i) return !0;
                                                if (t.operator === k && u <= i) return !0;
                                                if (t.operator === P && u > i) return !0;
                                                if (t.operator === O && u >= i) return !0;
                                            } else if ("string" == typeof u && i instanceof RegExp && (i.lastIndex = 0, i.test(u))) return !0;
                                        } else if ("string" == typeof u && u.includes(String(i))) return !0;
                                    }
                                    return !1;
                                }
                                function a(e, r) {
                                    for (var t = [], a = 0; a < e.length; a += 1) {
                                        var i = e[a];
                                        if (Array.isArray(i.value)) for (var o = 0; o < i.value.length; o += 1) n(i.value[o], r) && t.push(X(i.value[o], i.value, o, T(i.path, o))); else n(i.value, r) && t.push(i);
                                    }
                                    return t;
                                }
                                for (var i = [ X(e, null, null, g) ], o = 0; o < t.steps.length; o += 1) {
                                    var s = t.steps[o];
                                    if ("filter" === s.mode && s.filter) i = a(i, s.filter); else {
                                        for (var u = [], l = 0; l < i.length; l += 1) for (var c = i[l], f = s.recursive ? Y(c) : [ c ], p = 0; p < f.length; p += 1) for (var v = re(f[p], s), h = 0; h < v.length; h += 1) u.push(v[h]);
                                        i = u;
                                    }
                                }
                                return i;
                            }
                            var ne = !1;
                            function ae() {
                                ne = !0;
                            }
                            if (!_(r)) return r;
                            var ie, oe = (ie = n) && ie.nativeParse ? ie.nativeParse : JSON.parse, se = function(e) {
                                return e && e.nativeStringify ? e.nativeStringify : JSON.stringify;
                            }(n), ue = (new Error).stack || "";
                            if (i && !y(i, ue)) return r;
                            if (!t) return o(e, `${window.location.hostname}\n${se(r, null, 2)}\nStack trace:\n${ue}`, !0), 
                            o(e, r, !0, !1), r;
                            try {
                                for (var le = function(e, r, t) {
                                    var n, a = function(e) {
                                        var r = -1, t = "remove", n = 0;
                                        return F(e, (function(a, i) {
                                            return !!i && (e.startsWith("+=", a) ? (r = a, t = "append", n = 2, !0) : "=" === e[a] && (r = a, 
                                            t = "set", n = 1, !0));
                                        })), -1 === r ? {
                                            mode: "remove",
                                            selectorPart: e.trim(),
                                            valuePart: w
                                        } : {
                                            mode: t,
                                            selectorPart: e.slice(0, r).trim(),
                                            valuePart: e.slice(r + n).trim()
                                        };
                                    }(e), i = function(e) {
                                        for (var r = [], t = e.trim(); t.startsWith("[?"); ) {
                                            var n = C(t, 0);
                                            if (-1 === n) break;
                                            var a = t.slice(1, n);
                                            r.push(U(a.slice(1))), t = t.slice(n + 1).trim();
                                        }
                                        return {
                                            guards: r,
                                            selectorPart: t
                                        };
                                    }(a.selectorPart), o = G((n = i.selectorPart.trim()) === w ? g : n.startsWith(g) ? n : n.startsWith(m) || n.startsWith(R) || n.startsWith(b) ? `${g}${n}` : `${g}${m}${n}`), s = {
                                        mode: a.mode
                                    };
                                    return "append" === a.mode ? s = {
                                        mode: "append",
                                        updater: K(a.valuePart, r, t)
                                    } : "set" === a.mode && (s = {
                                        mode: "set",
                                        updater: Z(a.valuePart, r, t)
                                    }), {
                                        guards: i.guards,
                                        mutation: s,
                                        selector: o
                                    };
                                }(t, oe, (function(r) {
                                    return function(e, r, t) {
                                        var n, a = "json:", i = "replace:", s = "", d = !1, g = !1;
                                        if (r.startsWith(i)) {
                                            var y = extractRegexAndReplacement(r);
                                            if (!y) return o(e, `Invalid argument value format: ${r}`), null;
                                            s = y.regexPart, n = y.replacementPart, d = !0;
                                        } else if (r.startsWith(a)) try {
                                            n = t(r.slice(a.length)), g = !0;
                                        } catch (t) {
                                            return o(e, `Invalid JSON argument value: ${r}`), null;
                                        } else if ("undefined" === r) n = void 0; else if ("false" === r) n = !1; else if ("true" === r) n = !0; else if ("null" === r) n = null; else if ("NaN" === r) n = NaN; else if ("emptyArr" === r || "[]" === r) n = []; else if ("emptyObj" === r || "{}" === r) n = {}; else if ("noopFunc" === r) n = l; else if ("noopCallbackFunc" === r) n = u; else if ("trueFunc" === r) n = c; else if ("falseFunc" === r) n = f; else if ("throwFunc" === r) n = p; else if ("noopPromiseResolve" === r) n = h; else if ("noopPromiseReject" === r) n = v; else if (/^-?\d+$/.test(r)) {
                                            if (n = parseFloat(r), nativeIsNaN(n)) return null;
                                        } else n = r;
                                        return {
                                            constantValue: n,
                                            replaceRegexValue: s,
                                            shouldReplaceArgument: d,
                                            shouldMergeJsonValue: g
                                        };
                                    }(e, r, oe);
                                })), ce = 0; ce < le.guards.length; ce += 1) if (0 === te(r, {
                                    steps: [ {
                                        filter: le.guards[ce],
                                        mode: "filter",
                                        recursive: !1
                                    } ]
                                }).length) return r;
                                var fe = te(r, le.selector);
                                if (d) return fe.length > 0 && a && a(), r;
                                if (!("remove" === le.mutation.mode || "string" == typeof e.name && e.name.startsWith("trusted-"))) return o(e, "JSONPath set and append operations are allowed only in trusted scriptlets"), 
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
                                }(fe), ne && a && a(), r;
                                le.mutation.updater && (r = function(e, r, t) {
                                    for (var n = new Set, a = e, i = 0; i < r.length; i += 1) {
                                        var o = r[i];
                                        n.has(o.path) || (n.add(o.path), null !== o.parent || null !== o.key || o.path !== g ? null !== o.parent && null !== o.key && (o.parent[o.key] = t(o.parent[o.key]), 
                                        ae()) : (a = t(a), ae()));
                                    }
                                    return a;
                                }(r, fe, le.mutation.updater), ne && a && a());
                            } catch (r) {
                                o(e, `JSONPath processing failed for expression '${t}': ${r.message}`);
                            }
                            return r;
                        }(e, t, r, j, (function() {
                            return i(e);
                        }), "") : function(e, r, t, n, a, u) {
                            var {nativeStringify: l} = u;
                            if (0 === t.length && 0 === n.length) return o(e, `${window.location.hostname}\n${l(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                            r && "object" == typeof r && o(e, r, !0, !1), r;
                            try {
                                if (!1 === function(e, r, t, n, a, i) {
                                    if (!r) return !1;
                                    var u, {nativeStringify: l} = i, c = t.map((function(e) {
                                        return e.path;
                                    })), f = n.map((function(e) {
                                        return e.path;
                                    }));
                                    if (0 === c.length && f.length > 0) {
                                        var p = l(r);
                                        if (s(f.join("")).test(p)) return o(e, `${window.location.hostname}\n${l(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                                        r && "object" == typeof r && o(e, r, !0, !1), u = !1;
                                    }
                                    for (var v, h = [ ".*.", "*.", ".*", ".[].", "[].", ".[]" ], d = function() {
                                        var e = f[g], t = e.split(".").pop(), n = h.some((function(r) {
                                            return e.includes(r);
                                        })), a = m(r, e, n);
                                        if (!a.length) return {
                                            v: u = !1
                                        };
                                        u = !n;
                                        for (var i = 0; i < a.length; i += 1) {
                                            var o = "string" == typeof t && void 0 !== a[i].base[t];
                                            u = n ? o || u : o && u;
                                        }
                                    }, g = 0; g < f.length; g += 1) if (v = d()) return v.v;
                                    return u;
                                }(e, r, t, n, 0, u)) return r;
                                t.forEach((function(t) {
                                    for (var n = t.path, a = t.value, o = m(r, n, !0, [], a), s = o.length - 1; s >= 0; s -= 1) {
                                        var u = o[s];
                                        if (void 0 !== u && u.base) if (i(e), Array.isArray(u.base)) try {
                                            var l = Number(u.prop);
                                            if (Number.isNaN(l)) continue;
                                            u.base.splice(l, 1);
                                        } catch (e) {
                                            console.error("Error while deleting array element", e);
                                        } else delete u.base[u.prop];
                                    }
                                }));
                            } catch (r) {
                                o(e, r);
                            }
                            return r;
                        }(e, t, $, x, 0, j);
                    }, E = window.XMLHttpRequest.prototype.open, P = window.XMLHttpRequest.prototype.send, O = new Map, S = new Map, k = {
                        apply: function(e, r, t) {
                            var n = S.get(r);
                            n && n.push(t);
                            return Reflect.apply(e, r, t);
                        }
                    }, N = {
                        apply: function(r, t, a) {
                            var i = g.apply(null, a);
                            (function(e, r, t) {
                                if ("" === r || "*" === r) return !0;
                                var n, a = function(e) {
                                    var r = {};
                                    return e.split(" ").forEach((function(e) {
                                        var t = e.indexOf(":"), n = e.slice(0, t);
                                        if (function(e) {
                                            return [ "url", "method", "headers", "body", "credentials", "cache", "redirect", "referrer", "referrerPolicy", "integrity", "keepalive", "signal", "mode" ].includes(e);
                                        }(n)) {
                                            var a = e.slice(t + 1);
                                            r[n] = a;
                                        } else r.url = e;
                                    })), r;
                                }(r);
                                if (function(e) {
                                    return Object.values(e).every((function(e) {
                                        return function(e) {
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
                                        }(e);
                                    }));
                                }(a)) {
                                    var i = function(e) {
                                        var r = {};
                                        return Object.keys(e).forEach((function(t) {
                                            r[t] = s(e[t]);
                                        })), r;
                                    }(a);
                                    n = Object.keys(i).every((function(e) {
                                        var r = i[e], n = t[e];
                                        return Object.prototype.hasOwnProperty.call(t, e) && "string" == typeof n && (null == r ? void 0 : r.test(n));
                                    }));
                                } else o(e, `Invalid parameter: ${r}`), n = !1;
                                return n;
                            }(e, n, i) || b) && O.set(t, i);
                            if (O.has(t) && !S.has(t)) {
                                S.set(t, []);
                                t.setRequestHeader = new Proxy(t.setRequestHeader, k);
                            }
                            return Reflect.apply(r, t, a);
                        }
                    }, q = {
                        apply: function(r, t, n) {
                            if (!O.has(t)) return Reflect.apply(r, t, n);
                            var s = O.get(t), u = (new Error).stack || "";
                            if (!s || a && !y(a, u)) {
                                S.delete(t);
                                O.delete(t);
                                return Reflect.apply(r, t, n);
                            }
                            var l = new XMLHttpRequest;
                            l.withCredentials = t.withCredentials;
                            l.addEventListener("readystatechange", (function() {
                                if (4 === l.readyState) {
                                    var {readyState: r, response: n, responseText: a, responseURL: s, responseXML: c, status: f, statusText: p} = l, v = a || n;
                                    if ("string" == typeof v || "object" == typeof v) {
                                        var h;
                                        if ("string" == typeof v) try {
                                            var d = R(v);
                                            if (b) {
                                                o(e, `${window.location.hostname}\n${W(d, null, 2)}\nStack trace:\n${u}`, !0);
                                                o(e, d, !0, !1);
                                                h = v;
                                            } else {
                                                h = A(d);
                                                try {
                                                    var {responseType: g} = t;
                                                    switch (g) {
                                                      case "":
                                                      case "text":
                                                        h = W(h);
                                                        break;

                                                      case "arraybuffer":
                                                        h = (new TextEncoder).encode(W(h)).buffer;
                                                        break;

                                                      case "blob":
                                                        h = new Blob([ W(h) ]);
                                                    }
                                                } catch (r) {
                                                    o(e, `Response body cannot be converted to response type: '${v}'`);
                                                    h = v;
                                                }
                                            }
                                        } catch (r) {
                                            o(e, `Response body cannot be converted to json: '${v}'`);
                                            h = v;
                                        }
                                        Object.defineProperties(t, {
                                            readyState: {
                                                value: r,
                                                writable: !1
                                            },
                                            responseURL: {
                                                value: s,
                                                writable: !1
                                            },
                                            responseXML: {
                                                value: c,
                                                writable: !1
                                            },
                                            status: {
                                                value: f,
                                                writable: !1
                                            },
                                            statusText: {
                                                value: p,
                                                writable: !1
                                            },
                                            response: {
                                                value: h,
                                                writable: !1
                                            },
                                            responseText: {
                                                value: h,
                                                writable: !1
                                            }
                                        });
                                        setTimeout((function() {
                                            var e = new Event("readystatechange");
                                            t.dispatchEvent(e);
                                            var r = new Event("load");
                                            t.dispatchEvent(r);
                                            var n = new Event("loadend");
                                            t.dispatchEvent(n);
                                        }), 1);
                                        i(e);
                                    }
                                }
                            }));
                            E.apply(l, [ s.method, s.url, Boolean(s.async) ]);
                            (S.get(t) || []).forEach((function(e) {
                                l.setRequestHeader(e[0], e[1]);
                            }));
                            S.delete(t);
                            O.delete(t);
                            try {
                                Reflect.apply(P, l, n);
                            } catch (e) {
                                return Reflect.apply(r, t, n);
                            }
                        }
                    };
                    XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, N);
                    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, q);
                }
            }).apply(this, a);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, n, {
                value: t,
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
                var r = console.trace.bind(console), t = "[AdGuard] ";
                "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                e.args ? t += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : t += `#%#//scriptlet('${e.name}')`), 
                r && r(t);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
        }
    }
    function o(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: a, verbose: i} = e;
        if (t || i) {
            var o = console.log;
            n ? o(`${a}: ${r}`) : Array.isArray(r) ? o(`${a}:`, ...r) : o(`${a}:`, r);
        }
    }
    function s(e) {
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
    function u() {
        return l;
    }
    function l() {}
    function c() {
        return !0;
    }
    function f() {
        return !1;
    }
    function p() {
        throw new Error;
    }
    function v() {
        return Promise.reject();
    }
    function h() {
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
    function d(e) {
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
                return void 0 !== a ? ("true" === a ? a = !0 : "false" === a ? a = !1 : a.startsWith("/") ? a = s(a) : "string" == typeof a && /^\d+$/.test(a) && (a = parseFloat(a)), 
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
    function g(e, r, t, n, a) {
        return {
            method: e,
            url: r,
            async: t,
            user: n,
            password: a
        };
    }
    function y(e, r) {
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
            var o = window.location.href, u = o.indexOf("#");
            -1 !== u && (o = o.slice(0, u));
            var l = r.split("\n").slice(2).map((function(e) {
                return e.trim();
            })).map((function(e) {
                var r, a = /(.*?@)?(\S+)(:\d+)(:\d+)\)?$/.exec(e);
                if (a) {
                    var i, s, u = a[2], l = a[3], c = a[4];
                    if (null !== (i = u) && void 0 !== i && i.startsWith("(") && (u = u.slice(1)), null !== (s = u) && void 0 !== s && s.startsWith("<anonymous>")) {
                        var f;
                        u = n;
                        var p = void 0 !== a[1] ? a[1].slice(0, -1) : e.slice(0, a.index).trim();
                        null !== (f = p) && void 0 !== f && f.startsWith("at") && (p = p.slice(2).trim()), 
                        r = `${p} ${u}${l}${c}`.trim();
                    } else r = u === o ? `${t}${l}${c}`.trim() : `${u}${l}${c}`.trim();
                } else r = e;
                return r;
            }));
            if (l) for (var c = 0; c < l.length; c += 1) {
                if (a(e) && l[c].startsWith(t) && l[c].match(s(e))) return !0;
                if (i(e) && l[c].startsWith(n) && l[c].match(s(e))) return !0;
            }
            return !1;
        }(e, r)) return t.length && t[0] !== RegExp.$1 && b(t), !0;
        var n = s(e), a = r.split("\n").slice(2).map((function(e) {
            return e.trim();
        })).join("\n");
        return t.length && t[0] !== RegExp.$1 && b(t), function() {
            var e = Object.getOwnPropertyDescriptor(RegExp.prototype, "test"), r = null == e ? void 0 : e.value;
            if (e && "function" == typeof e.value) return r;
            throw new Error("RegExp.prototype.test is not a function");
        }().call(n, a);
    }
    function m(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : [], a = arguments.length > 4 ? arguments[4] : void 0, i = r.indexOf(".");
        if (-1 === i) {
            if ("*" === r || "[]" === r) {
                for (var o in e) if (Object.prototype.hasOwnProperty.call(e, o)) if (void 0 !== a) {
                    var s = e[o];
                    "string" == typeof s && a instanceof RegExp ? a.test(s) && n.push({
                        base: e,
                        prop: o
                    }) : s === a && n.push({
                        base: e,
                        prop: o
                    });
                } else n.push({
                    base: e,
                    prop: o
                });
            } else if (void 0 !== a) {
                var u = e[r];
                "string" == typeof u && a instanceof RegExp ? a.test(u) && n.push({
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
        var l = r.slice(0, i);
        if ("[]" === l && Array.isArray(e) || "*" === l && e instanceof Object || "[-]" === l && Array.isArray(e) || "{-}" === l && e instanceof Object) {
            var c = r.slice(i + 1), f = Object.keys(e);
            if ("{-}" === l || "[-]" === l) {
                var p = Array.isArray(e) ? "array" : "object";
                return ("{-}" !== l || "object" !== p) && ("[-]" !== l || "array" !== p) || f.forEach((function(r) {
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
            f.forEach((function(r) {
                m(e[r], c, t, n, a);
            }));
        }
        Array.isArray(e) && e.forEach((function(e) {
            void 0 !== e && m(e, r, t, n, a);
        }));
        var v = e[l];
        return r = r.slice(i + 1), void 0 !== v && m(v, r, t, n, a), n;
    }
    function b(e) {
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
}
try {
    var _k = "5145fe57afd944b716703bc5335c5dad";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPruneXhrResponse.apply(this, [ {
        name: "json-prune-xhr-response",
        args: [ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots", "", "/playlist\\?list=|\\/player(?!.*(get_drm_license))|watch\\?[tv]=|get_watch\\?/" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots", "", "/playlist\\?list=|\\/player(?!.*(get_drm_license))|watch\\?[tv]=|get_watch\\?/" ]));
} catch (e) {}
function jsonPruneFetchResponse(e, r) {
    var t = "done", n = e.uniqueId + e.name + "_" + (Array.isArray(r) ? r.join("_") : "");
    if (!e.uniqueId || Window.prototype.toString[n] !== t) {
        var i = r ? [].concat(e).concat(r) : [ e ];
        try {
            (function(e, r, t) {
                var n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : "", i = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "";
                if ("undefined" != typeof fetch && "undefined" != typeof Proxy && "undefined" != typeof Response) {
                    var $ = function(e, r) {
                        var t = "legacy", n = "jsonpath", i = "string" == typeof r ? r.trim().toLowerCase() : "";
                        if (i === t || i === n) return {
                            mode: i
                        };
                        var a = "string" == typeof e ? e.trim() : "";
                        return a.startsWith("$") || a.startsWith("[?") ? {
                            mode: n
                        } : {
                            mode: t
                        };
                    }(r, arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : ""), b = "legacy" === $.mode ? d(r) : [], w = "legacy" === $.mode ? d(t) : [], x = window.Request.prototype.clone, j = window.Response.prototype.clone, O = window.fetch, W = {
                        nativeParse: window.JSON.parse,
                        nativeStringify: window.JSON.stringify
                    }, A = function(t) {
                        return "jsonpath" === $.mode ? function(e, r, t, n, i) {
                            var a = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : "", u = arguments.length > 6 && void 0 !== arguments[6] && arguments[6], d = "$", m = ".", $ = "..", b = "", w = "\\", x = ")", j = "[", O = "@", W = "contains", A = "equal", P = "exists", R = "greater_than", E = "greater_than_or_equal", S = "less_than", k = "less_than_or_equal", N = "not_equal", _ = "regex", I = [ "==", "!=", "<=", ">=", "*=", "=~", "<", ">", "=" ], V = /^[A-Za-z_$][\w$]*$/;
                            function q(e) {
                                return null !== e && "object" == typeof e;
                            }
                            function J(e) {
                                if (!q(e) || Array.isArray(e)) return !1;
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
                            function T(e, r) {
                                return "number" == typeof r || /^\d+$/.test(String(r)) ? `${e}[${r}]` : V.test(String(r)) ? `${e}.${r}` : `${e}['${String(r).replace(/'/g, "\\'")}']`;
                            }
                            function z(e, r, t, n) {
                                return {
                                    key: t,
                                    parent: r,
                                    path: n,
                                    value: e
                                };
                            }
                            function L(e, r) {
                                for (var t = 0, n = 0, i = 0, a = null, o = 0; o < e.length; o += 1) {
                                    var u = e[o];
                                    if (a) {
                                        if (u !== a || M(e, o) || (a = null), r(o, !1)) return;
                                    } else if (F(u)) {
                                        if (a = u, r(o, !1)) return;
                                    } else {
                                        var s = !0;
                                        if (u === j ? t += 1 : "]" === u ? t -= 1 : "{" === u ? n += 1 : "}" === u ? n -= 1 : "(" === u ? i += 1 : u === x ? i -= 1 : s = !1, 
                                        r(o, !s && 0 === t && 0 === n && 0 === i)) return;
                                    }
                                }
                            }
                            function U(e, r) {
                                for (var t = 0, n = null, i = r; i < e.length; i += 1) {
                                    var a = e[i];
                                    if (n) a !== n || M(e, i) || (n = null); else if (F(a)) n = a; else if (a !== j) {
                                        if ("]" === a && 0 == (t -= 1)) return i;
                                    } else t += 1;
                                }
                                return -1;
                            }
                            function D(e, r) {
                                var t = [], n = b, i = new Set;
                                return L(e, (function(a, o) {
                                    if (!i.has(a)) if (o && e.startsWith(r, a)) {
                                        t.push(n.trim()), n = b;
                                        for (var u = 1; u < r.length; u += 1) i.add(a + u);
                                    } else n += e[a];
                                })), n !== b && t.push(n.trim()), t;
                            }
                            function G(e) {
                                var r = e.trim();
                                return r.startsWith(O) && (r = r.slice(1)), r === b ? d : r.startsWith(d) ? r : r.startsWith(m) || r.startsWith($) || r.startsWith(j) ? `${d}${r}` : `${d}${m}${r}`;
                            }
                            function K(e) {
                                var r = e.trim();
                                if (r.startsWith("(") && r.endsWith(x)) {
                                    for (var t = 0, n = null, i = !1, a = 0; a < r.length; a += 1) {
                                        var o = r[a];
                                        if (n) o !== n || M(r, a) || (n = null); else if (F(o)) n = o; else if ("(" === o) t += 1; else if (o === x && 0 == (t -= 1)) {
                                            i = a === r.length - 1;
                                            break;
                                        }
                                    }
                                    i && (r = r.slice(1, -1).trim());
                                }
                                var u = D(r, "||");
                                if (u.length > 1) return {
                                    conditions: u.map((function(e) {
                                        return K(e);
                                    })),
                                    operator: "or"
                                };
                                var s = D(r, "&&");
                                if (s.length > 1) return {
                                    conditions: s.map((function(e) {
                                        return K(e);
                                    })),
                                    operator: "and"
                                };
                                if (r.startsWith("!") && !r.startsWith("!=")) return {
                                    condition: K(r.slice(1).trim()),
                                    operator: "not"
                                };
                                var l, c, f = (c = null, L(l = r, (function(e, r) {
                                    if (!r) return !1;
                                    for (var t = null, n = 0; n < I.length; n += 1) {
                                        var i = I[n];
                                        l.startsWith(i, e) && (null === t || i.length > t.length) && (t = i);
                                    }
                                    return null !== t && (c = {
                                        index: e,
                                        operator: t
                                    }, !0);
                                })), c);
                                if (!f) return {
                                    operator: P,
                                    selectorPath: G(r)
                                };
                                var p = r.slice(0, f.index).trim(), v = r.slice(f.index + f.operator.length).trim(), h = A;
                                "!=" === f.operator ? h = N : "<" === f.operator ? h = S : "<=" === f.operator ? h = k : ">" === f.operator ? h = R : ">=" === f.operator ? h = E : "*=" === f.operator ? h = W : ("=~" === f.operator || "=" === f.operator && /^\/.*\/[a-z]*$/i.test(v)) && (h = _);
                                var g, $, b = v.trim(), w = b === d || b.startsWith(d + m) || b.startsWith(d + j), V = b === O || b.startsWith(O + m) || b.startsWith(O + j);
                                return w || V ? {
                                    comparisonSelectorPath: G(b),
                                    operator: h,
                                    resolveComparisonAgainstRoot: w,
                                    selectorPath: G(p)
                                } : {
                                    comparisonValue: (g = v, $ = g.trim(), "true" === $ || "false" !== $ && ("null" === $ ? null : /^-?\d+(?:\.\d+)?$/.test($) ? Number($) : /^\/.*\/[a-z]*$/i.test($) ? y($) : C($))),
                                    operator: h,
                                    selectorPath: G(p)
                                };
                            }
                            function Z(e, r) {
                                if ("*" === e) return {
                                    mode: "wildcard",
                                    recursive: r
                                };
                                if (e.startsWith("?")) return {
                                    filter: K(e.slice(1)),
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
                                    return L(e, (function(n, i) {
                                        i && ":" === e[n] ? (r.push(t.trim()), t = b) : t += e[n];
                                    })), r.push(t.trim()), r;
                                }(e);
                                if (n.length > 1) {
                                    var i = n[0] === b ? void 0 : Number(n[0]);
                                    return {
                                        mode: "slice",
                                        recursive: r,
                                        slice: {
                                            end: n[1] === b ? void 0 : Number(n[1]),
                                            start: i,
                                            step: n.length > 2 && n[2] !== b ? Number(n[2]) : 1
                                        }
                                    };
                                }
                                var a = function(e, r) {
                                    var t = [], n = b;
                                    return L(e, (function(i, a) {
                                        a && e[i] === r ? (t.push(n.trim()), n = b) : n += e[i];
                                    })), n !== b && t.push(n.trim()), t;
                                }(e, ",");
                                return a.every((function(e) {
                                    return /^-?\d+$/.test(e);
                                })) ? {
                                    indexes: a.map((function(e) {
                                        return Number(e);
                                    })),
                                    mode: "index",
                                    recursive: r
                                } : {
                                    mode: "property",
                                    properties: a.map((function(e) {
                                        return r = e.trim(), /^\/.*\/[a-z]*$/i.test(r) ? y(r) : C(r);
                                        var r;
                                    })),
                                    recursive: r
                                };
                            }
                            function B(e) {
                                var r = [], t = 0;
                                for (e.startsWith(d) && (t = 1); t < e.length; ) {
                                    var n = !1;
                                    if (e.startsWith($, t) ? (n = !0, t += 2) : e[t] === m && (t += 1), t >= e.length) break;
                                    if (e[t] !== j) if ("*" !== e[t]) {
                                        for (var i = t; i < e.length && e[i] !== m && e[i] !== j; ) i += 1;
                                        var a = e.slice(t, i).trim();
                                        a && r.push({
                                            mode: "property",
                                            properties: [ a ],
                                            recursive: n
                                        }), t = i;
                                    } else r.push({
                                        mode: "wildcard",
                                        recursive: n
                                    }), t += 1; else {
                                        var o = U(e, t);
                                        if (-1 === o) throw new Error(`Invalid JSONPath expression: ${e}`);
                                        var u = e.slice(t + 1, o).trim();
                                        r.push(Z(u, n)), t = o + 1;
                                    }
                                }
                                return {
                                    steps: r
                                };
                            }
                            function H(e, r, t) {
                                var n, i = e.trim();
                                if (i.startsWith("{") || i.startsWith(j)) n = r(i); else {
                                    var a = t(i);
                                    if (!a || a.shouldReplaceArgument) throw new Error(`Invalid append value: ${e}`);
                                    n = a.constantValue;
                                }
                                return function(e) {
                                    return Array.isArray(e) ? Array.isArray(n) ? e.concat(n) : e.concat([ n ]) : J(e) && J(n) ? Object.assign({}, e, n) : "string" == typeof e && "string" == typeof n ? `${e}${n}` : n;
                                };
                            }
                            function Q(e, r, t) {
                                var n = e.trim();
                                if (n.startsWith("replace(") && n.endsWith(x)) return function(e, r) {
                                    var t = r(e.slice(8, -1));
                                    if ("string" != typeof t.regex || "string" != typeof t.replacement) throw new Error('Invalid replace payload: "regex" and "replacement" must be strings');
                                    var n = t.regex.startsWith("/") ? y(t.regex) : new RegExp(t.regex, t.flags || b);
                                    return function(e) {
                                        return "string" != typeof e ? e : e.replace(n, t.replacement);
                                    };
                                }(n, r);
                                var i = t(n);
                                if (!i) throw new Error(`Invalid set value: ${e}`);
                                return function(e) {
                                    return function(e, r) {
                                        return r.shouldReplaceArgument ? "string" == typeof e ? e.replace(r.replaceRegexValue, r.constantValue) : e : !r.shouldMergeJsonValue || null === e || "object" != typeof e || Array.isArray(e) || null === r.constantValue || "object" != typeof r.constantValue || Array.isArray(r.constantValue) ? r.constantValue : Object.assign({}, e, r.constantValue);
                                    }(e, i);
                                };
                            }
                            function X(e) {
                                if (!q(e.value)) return [];
                                for (var r = Object.keys(e.value), t = [], n = 0; n < r.length; n += 1) {
                                    var i = r[n];
                                    t.push(z(e.value[i], e.value, i, T(e.path, i)));
                                }
                                return t;
                            }
                            function Y(e) {
                                for (var r = [ e ], t = X(e), n = 0; n < t.length; n += 1) r.push(t[n]);
                                for (var i = 1; i < r.length; ) {
                                    for (var a = X(r[i]), o = 0; o < a.length; o += 1) r.push(a[o]);
                                    i += 1;
                                }
                                return r;
                            }
                            function ee(e, r) {
                                return r < 0 ? e + r : r;
                            }
                            function re(e, r) {
                                var t = [];
                                if ("property" === r.mode) {
                                    if (!q(e.value) || !r.properties) return t;
                                    for (var n = new Set, i = 0; i < r.properties.length; i += 1) {
                                        var a = r.properties[i];
                                        if (a instanceof RegExp) for (var o = Object.keys(e.value), u = 0; u < o.length; u += 1) {
                                            var s = o[u];
                                            a.lastIndex = 0, a.test(s) && !n.has(s) && (n.add(s), t.push(z(e.value[s], e.value, s, T(e.path, s))));
                                        } else !n.has(a) && Object.prototype.hasOwnProperty.call(e.value, a) && (n.add(a), 
                                        t.push(z(e.value[a], e.value, a, T(e.path, a))));
                                    }
                                    return t;
                                }
                                if ("wildcard" === r.mode) return X(e);
                                if ("index" === r.mode) {
                                    if (!Array.isArray(e.value) || !r.indexes) return t;
                                    for (var l = 0; l < r.indexes.length; l += 1) {
                                        var c = ee(e.value.length, r.indexes[l]);
                                        c >= 0 && c < e.value.length && t.push(z(e.value[c], e.value, c, T(e.path, c)));
                                    }
                                    return t;
                                }
                                if ("computed-index" === r.mode) {
                                    if (!Array.isArray(e.value)) return t;
                                    var f = e.value.length - (r.subtractLength || 0);
                                    return f >= 0 && f < e.value.length && t.push(z(e.value[f], e.value, f, T(e.path, f))), 
                                    t;
                                }
                                if ("slice" === r.mode) {
                                    if (!Array.isArray(e.value) || !r.slice) return t;
                                    for (var p = function(e, r) {
                                        var t, n, i = [], a = void 0 === r.step ? 1 : r.step;
                                        if (0 === a) return i;
                                        if (t = void 0 === r.start ? a > 0 ? 0 : e - 1 : ee(e, r.start), n = void 0 === r.end ? a > 0 ? e : -1 : ee(e, r.end), 
                                        a > 0) {
                                            for (var o = Math.max(0, t); o < Math.min(e, n); o += a) i.push(o);
                                            return i;
                                        }
                                        for (var u = Math.min(e - 1, t); u > Math.max(-1, n); u += a) i.push(u);
                                        return i;
                                    }(e.value.length, r.slice), v = 0; v < p.length; v += 1) {
                                        var h = p[v];
                                        t.push(z(e.value[h], e.value, h, T(e.path, h)));
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
                                    var i = te(e, B(t.selectorPath));
                                    if (t.operator === P) return i.length > 0;
                                    var a = t.comparisonValue;
                                    if (t.comparisonSelectorPath) {
                                        var o = te(t.resolveComparisonAgainstRoot ? r : e, B(t.comparisonSelectorPath));
                                        if (0 === o.length) return !1;
                                        a = o[0].value;
                                    }
                                    for (var u = 0; u < i.length; u += 1) {
                                        var s = i[u].value;
                                        if (t.operator !== W) {
                                            if (t.operator !== _) {
                                                if (t.operator === A && s === a) return !0;
                                                if (t.operator === N && s !== a) return !0;
                                                if (t.operator === S && s < a) return !0;
                                                if (t.operator === k && s <= a) return !0;
                                                if (t.operator === R && s > a) return !0;
                                                if (t.operator === E && s >= a) return !0;
                                            } else if ("string" == typeof s && a instanceof RegExp && (a.lastIndex = 0, a.test(s))) return !0;
                                        } else if ("string" == typeof s && s.includes(String(a))) return !0;
                                    }
                                    return !1;
                                }
                                function i(e, r) {
                                    for (var t = [], i = 0; i < e.length; i += 1) {
                                        var a = e[i];
                                        if (Array.isArray(a.value)) for (var o = 0; o < a.value.length; o += 1) n(a.value[o], r) && t.push(z(a.value[o], a.value, o, T(a.path, o))); else n(a.value, r) && t.push(a);
                                    }
                                    return t;
                                }
                                for (var a = [ z(e, null, null, d) ], o = 0; o < t.steps.length; o += 1) {
                                    var u = t.steps[o];
                                    if ("filter" === u.mode && u.filter) a = i(a, u.filter); else {
                                        for (var s = [], l = 0; l < a.length; l += 1) for (var c = a[l], f = u.recursive ? Y(c) : [ c ], p = 0; p < f.length; p += 1) for (var v = re(f[p], u), h = 0; h < v.length; h += 1) s.push(v[h]);
                                        a = s;
                                    }
                                }
                                return a;
                            }
                            var ne = !1;
                            function ie() {
                                ne = !0;
                            }
                            if (!q(r)) return r;
                            var ae, oe = (ae = n) && ae.nativeParse ? ae.nativeParse : JSON.parse, ue = function(e) {
                                return e && e.nativeStringify ? e.nativeStringify : JSON.stringify;
                            }(n), se = (new Error).stack || "";
                            if (a && !g(a, se)) return r;
                            if (!t) return o(e, `${window.location.hostname}\n${ue(r, null, 2)}\nStack trace:\n${se}`, !0), 
                            o(e, r, !0, !1), r;
                            try {
                                for (var le = function(e, r, t) {
                                    var n, i = function(e) {
                                        var r = -1, t = "remove", n = 0;
                                        return L(e, (function(i, a) {
                                            return !!a && (e.startsWith("+=", i) ? (r = i, t = "append", n = 2, !0) : "=" === e[i] && (r = i, 
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
                                    }(e), a = function(e) {
                                        for (var r = [], t = e.trim(); t.startsWith("[?"); ) {
                                            var n = U(t, 0);
                                            if (-1 === n) break;
                                            var i = t.slice(1, n);
                                            r.push(K(i.slice(1))), t = t.slice(n + 1).trim();
                                        }
                                        return {
                                            guards: r,
                                            selectorPart: t
                                        };
                                    }(i.selectorPart), o = B((n = a.selectorPart.trim()) === b ? d : n.startsWith(d) ? n : n.startsWith(m) || n.startsWith(j) || n.startsWith($) ? `${d}${n}` : `${d}${m}${n}`), u = {
                                        mode: i.mode
                                    };
                                    return "append" === i.mode ? u = {
                                        mode: "append",
                                        updater: H(i.valuePart, r, t)
                                    } : "set" === i.mode && (u = {
                                        mode: "set",
                                        updater: Q(i.valuePart, r, t)
                                    }), {
                                        guards: a.guards,
                                        mutation: u,
                                        selector: o
                                    };
                                }(t, oe, (function(r) {
                                    return function(e, r, t) {
                                        var n, i = "json:", a = "replace:", u = "", d = !1, g = !1;
                                        if (r.startsWith(a)) {
                                            var y = extractRegexAndReplacement(r);
                                            if (!y) return o(e, `Invalid argument value format: ${r}`), null;
                                            u = y.regexPart, n = y.replacementPart, d = !0;
                                        } else if (r.startsWith(i)) try {
                                            n = t(r.slice(i.length)), g = !0;
                                        } catch (t) {
                                            return o(e, `Invalid JSON argument value: ${r}`), null;
                                        } else if ("undefined" === r) n = void 0; else if ("false" === r) n = !1; else if ("true" === r) n = !0; else if ("null" === r) n = null; else if ("NaN" === r) n = NaN; else if ("emptyArr" === r || "[]" === r) n = []; else if ("emptyObj" === r || "{}" === r) n = {}; else if ("noopFunc" === r) n = l; else if ("noopCallbackFunc" === r) n = s; else if ("trueFunc" === r) n = c; else if ("falseFunc" === r) n = f; else if ("throwFunc" === r) n = p; else if ("noopPromiseResolve" === r) n = h; else if ("noopPromiseReject" === r) n = v; else if (/^-?\d+$/.test(r)) {
                                            if (n = parseFloat(r), nativeIsNaN(n)) return null;
                                        } else n = r;
                                        return {
                                            constantValue: n,
                                            replaceRegexValue: u,
                                            shouldReplaceArgument: d,
                                            shouldMergeJsonValue: g
                                        };
                                    }(e, r, oe);
                                })), ce = 0; ce < le.guards.length; ce += 1) if (0 === te(r, {
                                    steps: [ {
                                        filter: le.guards[ce],
                                        mode: "filter",
                                        recursive: !1
                                    } ]
                                }).length) return r;
                                var fe = te(r, le.selector);
                                if (u) return fe.length > 0 && i && i(), r;
                                if (!("remove" === le.mutation.mode || "string" == typeof e.name && e.name.startsWith("trusted-"))) return o(e, "JSONPath set and append operations are allowed only in trusted scriptlets"), 
                                r;
                                if ("remove" === le.mutation.mode) return function(e) {
                                    for (var r = new Set, t = new Map, n = 0; n < e.length; n += 1) {
                                        var i = e[n];
                                        if (null !== i.parent && null !== i.key && !r.has(i.path)) if (r.add(i.path), Array.isArray(i.parent)) {
                                            var a = t.get(i.parent) || [];
                                            a.push(Number(i.key)), t.set(i.parent, a);
                                        } else delete i.parent[i.key], ie();
                                    }
                                    t.forEach((function(e, r) {
                                        for (var t = Array.from(new Set(e)).sort((function(e, r) {
                                            return r - e;
                                        })), n = 0; n < t.length; n += 1) {
                                            var i = t[n];
                                            i >= 0 && i < r.length && (r.splice(i, 1), ie());
                                        }
                                    }));
                                }(fe), ne && i && i(), r;
                                le.mutation.updater && (r = function(e, r, t) {
                                    for (var n = new Set, i = e, a = 0; a < r.length; a += 1) {
                                        var o = r[a];
                                        n.has(o.path) || (n.add(o.path), null !== o.parent || null !== o.key || o.path !== d ? null !== o.parent && null !== o.key && (o.parent[o.key] = t(o.parent[o.key]), 
                                        ie()) : (i = t(i), ie()));
                                    }
                                    return i;
                                }(r, fe, le.mutation.updater), ne && i && i());
                            } catch (r) {
                                o(e, `JSONPath processing failed for expression '${t}': ${r.message}`);
                            }
                            return r;
                        }(e, t, r, W, (function() {
                            return a(e);
                        }), i) : function(e, r, t, n, i, u) {
                            var {nativeStringify: s} = u;
                            if (0 === t.length && 0 === n.length) return o(e, `${window.location.hostname}\n${s(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                            r && "object" == typeof r && o(e, r, !0, !1), r;
                            try {
                                if (!1 === function(e, r, t, n, i, a) {
                                    if (!r) return !1;
                                    var u, {nativeStringify: s} = a, l = t.map((function(e) {
                                        return e.path;
                                    })), c = n.map((function(e) {
                                        return e.path;
                                    }));
                                    if (0 === l.length && c.length > 0) {
                                        var f = s(r);
                                        if (y(c.join("")).test(f)) return o(e, `${window.location.hostname}\n${s(r, null, 2)}\nStack trace:\n${(new Error).stack}`, !0), 
                                        r && "object" == typeof r && o(e, r, !0, !1), u = !1;
                                    }
                                    if (i && !g(i, (new Error).stack || "")) return u = !1;
                                    for (var p, v = [ ".*.", "*.", ".*", ".[].", "[].", ".[]" ], h = function() {
                                        var e = c[d], t = e.split(".").pop(), n = v.some((function(r) {
                                            return e.includes(r);
                                        })), i = m(r, e, n);
                                        if (!i.length) return {
                                            v: u = !1
                                        };
                                        u = !n;
                                        for (var a = 0; a < i.length; a += 1) {
                                            var o = "string" == typeof t && void 0 !== i[a].base[t];
                                            u = n ? o || u : o && u;
                                        }
                                    }, d = 0; d < c.length; d += 1) if (p = h()) return p.v;
                                    return u;
                                }(e, r, t, n, i, u)) return r;
                                t.forEach((function(t) {
                                    for (var n = t.path, i = t.value, o = m(r, n, !0, [], i), u = o.length - 1; u >= 0; u -= 1) {
                                        var s = o[u];
                                        if (void 0 !== s && s.base) if (a(e), Array.isArray(s.base)) try {
                                            var l = Number(s.prop);
                                            if (Number.isNaN(l)) continue;
                                            s.base.splice(l, 1);
                                        } catch (e) {
                                            console.error("Error while deleting array element", e);
                                        } else delete s.base[s.prop];
                                    }
                                }));
                            } catch (r) {
                                o(e, r);
                            }
                            return r;
                        }(e, t, b, w, i, W);
                    }, P = {
                        apply: async function(r, t, i) {
                            var s, l, c, f = function(e, r) {
                                var t, n, i = {}, a = e[0];
                                if (a instanceof Request) {
                                    var o = function(e) {
                                        var r = [ "url", "method", "headers", "body", "credentials", "cache", "redirect", "referrer", "referrerPolicy", "integrity", "keepalive", "signal", "mode" ].map((function(r) {
                                            return [ r, e[r] ];
                                        }));
                                        return Object.fromEntries(r);
                                    }(r.call(a));
                                    t = o.url, n = o;
                                } else t = a, n = e[1];
                                (i.url = t, n instanceof Object) && Object.keys(n).forEach((function(e) {
                                    i[e] = n[e];
                                }));
                                return i;
                            }(i, x);
                            if (!function(e, r, t) {
                                if ("" === r || "*" === r) return !0;
                                var n, i = function(e) {
                                    var r = {};
                                    return e.split(" ").forEach((function(e) {
                                        var t = e.indexOf(":"), n = e.slice(0, t);
                                        if (function(e) {
                                            return [ "url", "method", "headers", "body", "credentials", "cache", "redirect", "referrer", "referrerPolicy", "integrity", "keepalive", "signal", "mode" ].includes(e);
                                        }(n)) {
                                            var i = e.slice(t + 1);
                                            r[n] = i;
                                        } else r.url = e;
                                    })), r;
                                }(r);
                                if (function(e) {
                                    return Object.values(e).every((function(e) {
                                        return function(e) {
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
                                        }(e);
                                    }));
                                }(i)) {
                                    var a = function(e) {
                                        var r = {};
                                        return Object.keys(e).forEach((function(t) {
                                            r[t] = y(e[t]);
                                        })), r;
                                    }(i);
                                    n = Object.keys(a).every((function(e) {
                                        var r = a[e], n = t[e];
                                        return Object.prototype.hasOwnProperty.call(t, e) && "string" == typeof n && (null == r ? void 0 : r.test(n));
                                    }));
                                } else o(e, `Invalid parameter: ${r}`), n = !1;
                                return n;
                            }(e, n, f)) return Reflect.apply(r, t, i);
                            try {
                                s = await O.apply(null, i);
                                l = j.call(s);
                            } catch (n) {
                                o(e, `Could not make an original fetch request: ${f.url}`);
                                return Reflect.apply(r, t, i);
                            }
                            try {
                                c = await s.json();
                            } catch (r) {
                                var p = `Response body can't be converted to json: ${u(f)}`;
                                o(e, p);
                                return l;
                            }
                            var v = A(c), h = function(e, r) {
                                var {bodyUsed: t, headers: n, ok: i, redirected: a, status: o, statusText: u, type: s, url: l} = e, c = new Response(r, {
                                    status: o,
                                    statusText: u,
                                    headers: n
                                });
                                return Object.defineProperties(c, {
                                    url: {
                                        value: l
                                    },
                                    type: {
                                        value: s
                                    },
                                    ok: {
                                        value: i
                                    },
                                    bodyUsed: {
                                        value: t
                                    },
                                    redirected: {
                                        value: a
                                    }
                                }), c;
                            }(s, W.nativeStringify(v));
                            a(e);
                            return h;
                        }
                    };
                    window.fetch = new Proxy(window.fetch, P);
                }
            }).apply(this, i);
            e.uniqueId && Object.defineProperty(Window.prototype.toString, n, {
                value: t,
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
                var r = console.trace.bind(console), t = "[AdGuard] ";
                "corelibs" === e.engine ? t += e.ruleText : (e.domainName && (t += `${e.domainName}`), 
                e.args ? t += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : t += `#%#//scriptlet('${e.name}')`), 
                r && r(t);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
        }
    }
    function o(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: i, verbose: a} = e;
        if (t || a) {
            var o = console.log;
            n ? o(`${i}: ${r}`) : Array.isArray(r) ? o(`${i}:`, ...r) : o(`${i}:`, r);
        }
    }
    function u(e) {
        return e && "object" == typeof e ? function(e) {
            return 0 === Object.keys(e).length && !e.prototype;
        }(e) ? "{}" : Object.entries(e).map((function(e) {
            var r = e[0], t = e[1], n = t;
            return t instanceof Object && (n = `{ ${u(t)} }`), `${r}:"${n}"`;
        })).join(" ") : String(e);
    }
    function s() {
        return l;
    }
    function l() {}
    function c() {
        return !0;
    }
    function f() {
        return !1;
    }
    function p() {
        throw new Error;
    }
    function v() {
        return Promise.reject();
    }
    function h() {
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
    function d(e) {
        var r = ".[=].";
        if ("string" == typeof e && void 0 !== e && "" !== e) {
            var t = function(e) {
                for (var t = [], n = "", i = 0, a = !1, o = !1; i < e.length; ) {
                    var u = e[i];
                    if (a) n += u, "\\" === u ? o = !o : ("/" !== u || o || (a = !1), o = !1), i += 1; else {
                        if (" " === u || "\n" === u || "\t" === u || "\r" === u || "\f" === u || "\v" === u) {
                            for (;i < e.length && /\s/.test(e[i]); ) i += 1;
                            "" !== n && (t.push(n), n = "");
                            continue;
                        }
                        if (e.startsWith(r, i)) {
                            if (n += r, "/" === e[i += 5]) {
                                a = !0, o = !1, n += "/", i += 1;
                                continue;
                            }
                            continue;
                        }
                        n += u, i += 1;
                    }
                }
                return "" !== n && t.push(n), t;
            }(e);
            return t.map((function(e) {
                var t = e.split(r), n = t[0], i = t[1];
                return void 0 !== i ? ("true" === i ? i = !0 : "false" === i ? i = !1 : i.startsWith("/") ? i = y(i) : "string" == typeof i && /^\d+$/.test(i) && (i = parseFloat(i)), 
                {
                    path: n,
                    value: i
                }) : {
                    path: n
                };
            }));
        }
        return [];
    }
    function g(e, r) {
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
            var t = "inlineScript", n = "injectedScript", i = function(e) {
                return e.includes(t);
            }, a = function(e) {
                return e.includes(n);
            };
            if (!i(e) && !a(e)) return !1;
            var o = window.location.href, u = o.indexOf("#");
            -1 !== u && (o = o.slice(0, u));
            var s = r.split("\n").slice(2).map((function(e) {
                return e.trim();
            })).map((function(e) {
                var r, i = /(.*?@)?(\S+)(:\d+)(:\d+)\)?$/.exec(e);
                if (i) {
                    var a, u, s = i[2], l = i[3], c = i[4];
                    if (null !== (a = s) && void 0 !== a && a.startsWith("(") && (s = s.slice(1)), null !== (u = s) && void 0 !== u && u.startsWith("<anonymous>")) {
                        var f;
                        s = n;
                        var p = void 0 !== i[1] ? i[1].slice(0, -1) : e.slice(0, i.index).trim();
                        null !== (f = p) && void 0 !== f && f.startsWith("at") && (p = p.slice(2).trim()), 
                        r = `${p} ${s}${l}${c}`.trim();
                    } else r = s === o ? `${t}${l}${c}`.trim() : `${s}${l}${c}`.trim();
                } else r = e;
                return r;
            }));
            if (s) for (var l = 0; l < s.length; l += 1) {
                if (i(e) && s[l].startsWith(t) && s[l].match(y(e))) return !0;
                if (a(e) && s[l].startsWith(n) && s[l].match(y(e))) return !0;
            }
            return !1;
        }(e, r)) return t.length && t[0] !== RegExp.$1 && $(t), !0;
        var n = y(e), i = r.split("\n").slice(2).map((function(e) {
            return e.trim();
        })).join("\n");
        return t.length && t[0] !== RegExp.$1 && $(t), function() {
            var e = Object.getOwnPropertyDescriptor(RegExp.prototype, "test"), r = null == e ? void 0 : e.value;
            if (e && "function" == typeof e.value) return r;
            throw new Error("RegExp.prototype.test is not a function");
        }().call(n, i);
    }
    function y(e) {
        var r = e || "", t = "/";
        if ("" === r) return new RegExp(".?");
        var n, i, a = r.lastIndexOf(t), o = r.substring(a + 1), u = r.substring(0, a + 1), s = (i = o, 
        (n = u).startsWith(t) && n.endsWith(t) && !n.endsWith("\\/") && function(e) {
            if (!e) return !1;
            try {
                return new RegExp("", e), !0;
            } catch (e) {
                return !1;
            }
        }(i) ? i : "");
        if (r.startsWith(t) && r.endsWith(t) || s) return new RegExp((s ? u : r).slice(1, -1), s);
        var l = r.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(l);
    }
    function m(e, r) {
        var t = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : [], i = arguments.length > 4 ? arguments[4] : void 0, a = r.indexOf(".");
        if (-1 === a) {
            if ("*" === r || "[]" === r) {
                for (var o in e) if (Object.prototype.hasOwnProperty.call(e, o)) if (void 0 !== i) {
                    var u = e[o];
                    "string" == typeof u && i instanceof RegExp ? i.test(u) && n.push({
                        base: e,
                        prop: o
                    }) : u === i && n.push({
                        base: e,
                        prop: o
                    });
                } else n.push({
                    base: e,
                    prop: o
                });
            } else if (void 0 !== i) {
                var s = e[r];
                "string" == typeof s && i instanceof RegExp ? i.test(s) && n.push({
                    base: e,
                    prop: r
                }) : e[r] === i && n.push({
                    base: e,
                    prop: r
                });
            } else n.push({
                base: e,
                prop: r
            });
            return n;
        }
        var l = r.slice(0, a);
        if ("[]" === l && Array.isArray(e) || "*" === l && e instanceof Object || "[-]" === l && Array.isArray(e) || "{-}" === l && e instanceof Object) {
            var c = r.slice(a + 1), f = Object.keys(e);
            if ("{-}" === l || "[-]" === l) {
                var p = Array.isArray(e) ? "array" : "object";
                return ("{-}" !== l || "object" !== p) && ("[-]" !== l || "array" !== p) || f.forEach((function(r) {
                    (function(e, r, t) {
                        var n = r.split("."), i = function(e, r) {
                            if (null == e) return !1;
                            if (0 === r.length) return void 0 === t || ("string" == typeof e && t instanceof RegExp ? t.test(e) : e === t);
                            var n = r[0], a = r.slice(1);
                            if ("*" === n || "[]" === n) {
                                if (Array.isArray(e)) return e.some((function(e) {
                                    return i(e, a);
                                }));
                                if ("object" == typeof e && null !== e) return Object.keys(e).some((function(r) {
                                    return i(e[r], a);
                                }));
                            }
                            return !!Object.prototype.hasOwnProperty.call(e, n) && i(e[n], a);
                        };
                        return i(e, n);
                    })(e[r], c, i) && n.push({
                        base: e,
                        prop: r
                    });
                })), n;
            }
            f.forEach((function(r) {
                m(e[r], c, t, n, i);
            }));
        }
        Array.isArray(e) && e.forEach((function(e) {
            void 0 !== e && m(e, r, t, n, i);
        }));
        var v = e[l];
        return r = r.slice(a + 1), void 0 !== v && m(v, r, t, n, i), n;
    }
    function $(e) {
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
}
try {
    var _k = "670d140f5f62f93071f0fd73ccac9f7b";
    if (_b.has(_k)) return;
    _b.add(_k);
    jsonPruneFetchResponse.apply(this, [ {
        name: "json-prune-fetch-response",
        args: [ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots", "", "/playlist\\?list=|player\\?|watch\\?[tv]=/" ],
        engine: "extension",
        version: "2.4.2",
        verbose: !1
    } ].concat([ "playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots", "", "/playlist\\?list=|player\\?|watch\\?[tv]=/" ]));
} catch (e) {}
})();
