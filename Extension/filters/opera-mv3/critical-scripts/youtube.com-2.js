(function () {
try {
    const e = "done";
    if (Window.prototype.toString.b149f5f8f73c8f7b2b21d20e1538bea4 === e) return;
    (() => {
        const e = {
            apply: (e, t, o) => {
                const n = o[0];
                return "function" == typeof n && n.toString().includes("onAbnormalityDetected") && (o[0] = function() {}), 
                Reflect.apply(e, t, o);
            }
        };
        window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, e);
    })();
    Object.defineProperty(Window.prototype.toString, "b149f5f8f73c8f7b2b21d20e1538bea4", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "b149f5f8f73c8f7b2b21d20e1538bea4" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.b2938935474adeb9fa9f991bc00ad666 === e) return;
    (() => {
        const e = {
            apply: (e, t, o) => {
                const n = Reflect.apply(e, t, o);
                try {
                    n instanceof HTMLIFrameElement && "about:blank" === n.src && n.contentWindow && (n.contentWindow.fetch = window.fetch, 
                    n.contentWindow.Request = window.Request);
                } catch (e) {}
                return n;
            }
        };
        Node.prototype.appendChild = new Proxy(Node.prototype.appendChild, e);
    })();
    Object.defineProperty(Window.prototype.toString, "b2938935474adeb9fa9f991bc00ad666", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "b2938935474adeb9fa9f991bc00ad666" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.ae4fa77cc5169989696ccbb4288099b4 === e) return;
    (() => {
        let e = document.location.href, t = [], n = [], o = "", r = !1;
        const c = Array.prototype.push, i = {
            apply: (e, o, i) => (window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id && i[0] && i[0] !== window && "number" == typeof i[0].start && i[0].end && "ssap" === i[0].namespace && i[0].id && (r || 0 !== i[0]?.start || n.includes(i[0].id) || (t.length = 0, 
            n.length = 0, r = !0, c.call(t, i[0]), c.call(n, i[0].id)), r && 0 !== i[0]?.start && !n.includes(i[0].id) && (c.call(t, i[0]), 
            c.call(n, i[0].id))), Reflect.apply(e, o, i))
        };
        window.Array.prototype.push = new Proxy(window.Array.prototype.push, i), document.addEventListener("DOMContentLoaded", (function() {
            if (!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id) return;
            const c = () => {
                const e = document.querySelector("video");
                if (e && t.length) {
                    const c = Math.round(e.duration), i = Math.round(t.at(-1).end / 1e3), a = n.join(",");
                    if (!1 === e.loop && o !== a && c && c === i) {
                        const n = t.at(-1).start / 1e3;
                        e.currentTime < n && (e.currentTime = n, r = !1, o = a);
                    } else if (!0 === e.loop && c && c === i) {
                        const n = t.at(-1).start / 1e3;
                        e.currentTime < n && (e.currentTime = n, r = !1, o = a);
                    }
                }
            };
            c();
            new MutationObserver((() => {
                e !== document.location.href && (e = document.location.href, t.length = 0, n.length = 0, 
                r = !1), c();
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        }));
    })();
    Object.defineProperty(Window.prototype.toString, "ae4fa77cc5169989696ccbb4288099b4", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "ae4fa77cc5169989696ccbb4288099b4" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["44880ffb9eb9254b1d06b92aaa4a78d0"] === e) return;
    (() => {
        const e = "pyv", t = "param_first", a = "param_second", n = "client_screen", o = "ad_type", c = "none", r = "eAFgAQ", l = "8AUB", i = "YAHI", s = "CHANNEL", y = t;
        let p = y, u = null;
        const d = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState"), b = () => {
            try {
                Object.defineProperty(document, "visibilityState", {
                    get: () => "visible",
                    configurable: !0
                });
            } catch (e) {}
        }, f = window.JSON.stringify, m = e => {
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
        })(), m(n));
        const x = e => {
            (e.playbackContext || e.playerRequest) && delete e.context?.client?.configInfo?.appInstallData;
        }, C = (p, f, C) => {
            try {
                if (!p || !f || !C) return;
                (e => {
                    const t = e?.videoId;
                    t && (u && u !== t && m(y), u = t);
                })(p);
                const R = document.getElementById("movie_player")?.getPlayerResponse()?.playabilityStatus?.status;
                if ("LOGIN_REQUIRED" !== R && "CONTENT_CHECK_REQUIRED" !== R || (C = c), C === t && p.context?.client?.clientScreen !== s && !p.params?.startsWith(i)) return p.params = r, 
                p.playerRequest && p.playerRequest.params !== r && (p.playerRequest.params = r), 
                p.playbackContext && p.playbackContext.params !== r && (p.playbackContext.params = r), 
                f.contentPlaybackContext.lactMilliseconds = String(Date.now()), b(), void x(p);
                if (C === a && p.context?.client?.clientScreen !== s && !p.params?.startsWith(i)) return p.params !== l && (p.params = l), 
                p.playerRequest && p.playerRequest.params !== l && (p.playerRequest.params = l), 
                p.playbackContext && p.playbackContext.params !== l && (p.playbackContext.params = l), 
                p.playlistId || (p.context.client.clientScreen = s), f.contentPlaybackContext.lactMilliseconds = String(Date.now()), 
                b(), void x(p);
                if (!(C !== e || p.context?.client?.clientScreen === s || f.params?.startsWith(r) && f.params?.startsWith(l))) return f.adPlaybackContext = {
                    pyv: !0
                }, f.contentPlaybackContext.lactMilliseconds = String(Date.now()), void x(p);
                if (C === n && "WEB" === p.context?.client?.clientName) return p.context.client.clientScreen = s, 
                f.contentPlaybackContext.lactMilliseconds = String(Date.now()), b(), void x(p);
                if (C === o) return f.adPlaybackContext = {
                    adType: "AD_TYPE_INSTREAM"
                }, f.contentPlaybackContext.lactMilliseconds = String(Date.now()), b(), void x(p);
                if (C === c) return delete f.adPlaybackContext, void (() => {
                    try {
                        Object.defineProperty(document, "visibilityState", d);
                    } catch (e) {}
                })();
            } catch (e) {}
        }, R = [ "playerErrorMessageRenderer", "UNPLAYABLE" ], w = {
            apply: (r, l, i) => {
                if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/") || p === c) return Reflect.apply(r, l, i);
                let s;
                try {
                    if (s = Reflect.apply(r, l, i), !s.responseContext && !s.playabilityStatus) return s;
                    const y = f(s);
                    return R.some((e => y.includes(e))) && !y.includes("CONTENT_CHECK_REQUIRED") ? p === t ? (m(a), 
                    s) : p === a ? (m(e), s) : p === e ? (m(n), s) : p === n ? (m(o), s) : (m(c), s) : (p === t && s.playerConfig?.audioConfig?.muteOnStart && (location.href.includes("/watch") || s.cards && !s.playabilityStatus?.miniplayer) && (delete s.playerConfig.audioConfig.muteOnStart, 
                    s.messages?.[0]?.youThereRenderer && delete s.messages[0].youThereRenderer), p === o && s.playerConfig?.granularVariableSpeedConfig && (s.playerConfig.granularVariableSpeedConfig.maximumPlaybackRate = 200, 
                    s.playerConfig.granularVariableSpeedConfig.minimumPlaybackRate = 25), s);
                } catch (e) {}
                return Reflect.apply(r, l, i);
            }
        };
        window.JSON.parse = new Proxy(window.JSON.parse, w);
        const g = {
            apply: (e, t, a) => {
                if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(e, t, a);
                try {
                    let n = a[0];
                    if (n && (n.includes('"contentPlaybackContext"') || n.includes('"adSignalsInfo"'))) {
                        const o = JSON.parse(n);
                        if (!o.context?.client) return Reflect.apply(e, t, a);
                        o.playbackContext && C(o, o.playbackContext, p), o.playerRequest && C(o, o.playerRequest.playbackContext, p), 
                        n = f(o), a[0] = n;
                    }
                } catch (e) {}
                return Reflect.apply(e, t, a);
            }
        };
        window.TextEncoder.prototype.encode = new Proxy(window.TextEncoder.prototype.encode, g);
        const k = {
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
        window.JSON.stringify = new Proxy(window.JSON.stringify, k);
        const S = {
            construct: (e, t, a) => {
                try {
                    const n = t[0];
                    let o = t[1]?.body;
                    if (!n?.includes("youtubei") || location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/") || !o) return Reflect.construct(e, t, a);
                    if (o.includes('"contentPlaybackContext"') || o.includes('"adSignalsInfo"')) {
                        const n = JSON.parse(o);
                        if (!n.context?.client) return Reflect.construct(e, t, a);
                        n.playbackContext && C(n, n.playbackContext, p), n.playerRequest && C(n, n.playerRequest.playbackContext, p), 
                        o = f(n), t[1].body = o;
                    }
                } catch (e) {}
                return Reflect.construct(e, t, a);
            }
        };
        window.Request = new Proxy(window.Request, S);
    })();
    Object.defineProperty(Window.prototype.toString, "44880ffb9eb9254b1d06b92aaa4a78d0", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "44880ffb9eb9254b1d06b92aaa4a78d0" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.db1d269c06f73d400756ed71f805dc26 === e) return;
    (() => {
        const e = "movie_player", t = "ytd-watch-flexy[player-unavailable]", r = `#${e} > .ytp-error`, n = "yt-playability-error-supported-renderers#error-screen:has(>*)", a = 'yt-playability-error-supported-renderers#error-screen a[href^="//support.google.com/youtube/answer/2802245"]', o = "LOGIN_REQUIRED", i = "CONTENT_CHECK_REQUIRED", c = "pyv", l = "param_first", s = "param_second", d = "client_screen", y = "ad_type", u = "none", p = "eAFgAQ", f = "8AUB", m = "YAHI", b = "CHANNEL", S = l;
        let v = S, x = null;
        const g = new Set, C = () => {
            const t = document.getElementById(e), r = window.location.search, n = new URLSearchParams(r).get("v") || t?.getVideoData?.().video_id, a = new URLSearchParams(r).get("t") ?? "0";
            return {
                videoId: n,
                timeInSeconds: parseInt(a, 10)
            };
        }, I = () => {
            q();
            const t = document.getElementById(e);
            if (t && "function" == typeof t.loadVideoById) try {
                const {videoId: e, timeInSeconds: r} = C();
                t.loadVideoById(e, r);
            } catch (e) {}
        }, R = (() => {
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
        })(), P = e => {
            v = e;
        }, h = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState"), w = () => {
            try {
                Object.defineProperty(document, "visibilityState", {
                    get: () => "visible",
                    configurable: !0
                });
            } catch (e) {}
        }, q = () => {
            const r = document.getElementById(e), c = document.querySelector(n), l = document.querySelector("yt-playability-error-supported-renderers.ytdMiniplayerPlayerContainerPlayabilityError:has(>*)"), s = document.querySelector(t), d = document.querySelector(a);
            if (!r || d) return;
            const y = r.getPlayerResponse?.();
            y?.playabilityStatus?.status !== o && y?.playabilityStatus?.status !== i ? (s || l) && (c?.style.setProperty("display", "none", "important"), 
            l?.style.setProperty("display", "none", "important"), s?.removeAttribute("player-unavailable")) : c?.style.setProperty("display", "block", "important");
        }, k = e => {
            (e.playbackContext || e.playerRequest) && delete e.context?.client?.configInfo?.appInstallData;
        }, E = (e, t, r) => {
            try {
                if (!e || !t || !r) return;
                if ((e => {
                    const t = e?.videoId;
                    t && (x && x !== t && P(S), x = t);
                })(e), r === l && e.context?.client?.clientScreen !== b && !e.params?.startsWith(m)) return e.params = p, 
                e.playerRequest && e.playerRequest.params !== p && (e.playerRequest.params = p), 
                e.playbackContext && e.playbackContext.params !== p && (e.playbackContext.params = p), 
                t.contentPlaybackContext.lactMilliseconds = String(Date.now()), w(), void k(e);
                if (r === s && e.context?.client?.clientScreen !== b && !e.params?.startsWith(m)) return e.params !== f && (e.params = f), 
                e.playerRequest && e.playerRequest.params !== f && (e.playerRequest.params = f), 
                e.playbackContext && e.playbackContext.params !== f && (e.playbackContext.params = f), 
                e.playlistId || (e.context.client.clientScreen = b), t.contentPlaybackContext.lactMilliseconds = String(Date.now()), 
                w(), void k(e);
                if (!(r !== c || e.context?.client?.clientScreen === b || t.params?.startsWith(p) && t.params?.startsWith(f))) return t.adPlaybackContext = {
                    pyv: !0
                }, t.contentPlaybackContext.lactMilliseconds = String(Date.now()), w(), void k(e);
                if (r === d && "WEB" === e.context?.client?.clientName) return e.context.client.clientScreen = b, 
                t.contentPlaybackContext.lactMilliseconds = String(Date.now()), w(), void k(e);
                if (r === y) return t.adPlaybackContext = {
                    adType: "AD_TYPE_INSTREAM"
                }, t.contentPlaybackContext.lactMilliseconds = String(Date.now()), w(), void k(e);
                if (r === u) return delete t.adPlaybackContext, void (() => {
                    try {
                        Object.defineProperty(document, "visibilityState", h);
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
        const D = document.documentElement;
        new MutationObserver((() => {
            if (document.querySelector(n) && q(), !(() => {
                const c = document.getElementById(e), l = document.querySelector(r), s = document.querySelector(n), d = document.querySelector(t), y = document.querySelector(a);
                if (!c || y) return !1;
                const u = c.getPlayerResponse?.();
                if (u?.playabilityStatus?.status === o || u?.playabilityStatus?.status === i) return !1;
                const p = c.getVideoData?.();
                return (s || d || l) && null != p?.errorCode;
            })()) return;
            const {videoId: p} = C();
            (e => {
                if (e) for (const t of g) t !== e && g.delete(t);
            })(p), (() => {
                if (v === l) {
                    if (!R(s)) return void I();
                    P(s), I();
                } else if (v === s) {
                    if (!R(c)) return void I();
                    P(c), I();
                } else if (v === c) {
                    if (!R(d)) return void I();
                    P(d), I();
                } else if (v === d) {
                    if (!R(y)) return void I();
                    P(y), I();
                } else if (v === y) {
                    if (!R(u)) return void I();
                    P(u), I();
                } else if (v === u) {
                    const {videoId: e} = C();
                    if (!e || g.has(e)) return void q();
                    g.add(e), I();
                }
            })();
        })).observe(D, {
            attributes: !0,
            childList: !0,
            subtree: !0
        });
    })();
    Object.defineProperty(Window.prototype.toString, "db1d269c06f73d400756ed71f805dc26", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "db1d269c06f73d400756ed71f805dc26" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString["6538866de1d555f6662421f37564b39c"] === e) return;
    (() => {
        const e = {
            apply: (e, r, t) => {
                const n = t[0];
                if ("string" == typeof n?.value && n.value.includes("playerResponse")) try {
                    n.value = (o = n.value, (location.href.includes("/watch") || o.includes("cards") && !o.includes('"miniplayer"')) && o.includes('"muteOnStart":true') && (o = o.replace('"muteOnStart":true', '"muteOnStart":false')).includes('"youThereRenderer":') && (o = o.replace('"youThereRenderer":', '"no_youThereRenderer":')), 
                    o.replace(/"(adSlots|playerAds)":/g, '"no_ads":')), t[0] = n;
                } catch (e) {}
                var o;
                return Reflect.apply(e, r, t);
            }
        }, r = {
            apply: (r, t, n) => {
                const o = n[0];
                return "function" == typeof o && o.toString().includes(".next(") && (n[0] = new Proxy(o, e)), 
                Reflect.apply(r, t, n);
            }
        };
        window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, r);
    })();
    Object.defineProperty(Window.prototype.toString, "6538866de1d555f6662421f37564b39c", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "6538866de1d555f6662421f37564b39c" due to: ' + e);
}
try {
    const e = "done";
    if (Window.prototype.toString.cc07a31f6361dd25da8c32728ac08e9f === e) return;
    (() => {
        const e = {
            apply: (e, t, o) => {
                const r = Reflect.apply(e, t, o);
                if (r?.responseContext) try {
                    delete r.adSlots, delete r.playerAds, r.playerConfig?.audioConfig?.muteOnStart && (location.href.includes("/watch") || r.cards && !r.playabilityStatus?.miniplayer) && (delete r.playerConfig.audioConfig.muteOnStart, 
                    r.messages[0]?.youThereRenderer && delete r.messages[0].youThereRenderer);
                } catch (e) {}
                return r;
            }
        }, t = {
            apply: (t, o, r) => {
                const n = r[0];
                return "function" == typeof n && n.toString().includes("jspbResponseCtor") && (r[0] = new Proxy(n, e)), 
                Reflect.apply(t, o, r);
            }
        };
        window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, t);
    })();
    Object.defineProperty(Window.prototype.toString, "cc07a31f6361dd25da8c32728ac08e9f", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "cc07a31f6361dd25da8c32728ac08e9f" due to: ' + e);
}
try {
    const t = "done";
    if (Window.prototype.toString.ab30cf651bf4f7660cc398c45c285c13 === t) return;
    (() => {
        const t = {
            apply: (t, e, c) => {
                if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(t, e, c);
                try {
                    const o = c[0];
                    if (!o?.context?.client) return Reflect.apply(t, e, c);
                    const n = String(Date.now());
                    o.playbackContext && void 0 === o.playbackContext.adPlaybackContext && (o.playbackContext.contentPlaybackContext.lactMilliseconds = n), 
                    o.playerRequest && void 0 === o.playerRequest.playbackContext?.adPlaybackContext && (o.playerRequest.playbackContext.contentPlaybackContext.lactMilliseconds = n), 
                    c[0] = o;
                } catch (t) {}
                return Reflect.apply(t, e, c);
            }
        };
        window.JSON.stringify = new Proxy(window.JSON.stringify, t);
    })();
    Object.defineProperty(Window.prototype.toString, "ab30cf651bf4f7660cc398c45c285c13", {
        value: t,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (t) {
    console.error('Error executing AG js rule with uniqueId "ab30cf651bf4f7660cc398c45c285c13" due to: ' + t);
}
})();
