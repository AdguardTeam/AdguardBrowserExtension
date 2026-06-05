(function () {
try {
    const e = "done";
    if (Window.prototype.toString["5b9872087d5e72503ae69e868973c51c"] === e) return;
    (() => {
        const e = Function.prototype.call;
        let t = !1, o = !1, n = !1;
        const c = {
            apply: (c, r, a) => {
                const i = a[0];
                if (i?.requestNumber && i?.snapshot) try {
                    o = ((e, t = 5) => {
                        if ("object" != typeof e || null === e) return !1;
                        const o = new Array(1e3);
                        let c = 0;
                        const r = new WeakSet;
                        for (o[c++] = {
                            obj: e,
                            depth: 0
                        }; c > 0 && !n; ) {
                            const {obj: a, depth: i} = o[--c];
                            if (i > t || "object" != typeof a || null === a || r.has(a)) continue;
                            let l;
                            r.add(a);
                            try {
                                l = Object.hasOwn(a, "backoffTimeMs");
                            } catch (e) {}
                            if (l) return void 0 !== a.backoffTimeMs || (n = !0, !1);
                            for (const t in a) if (Object.hasOwn(a, t)) {
                                let n;
                                try {
                                    n = a[t];
                                } catch (e) {}
                                null !== n && "object" == typeof n && !r.has(n) && c < o.length && (o[c++] = {
                                    obj: n,
                                    depth: i + 1
                                });
                            }
                        }
                        return !1;
                    })(i), t = !0, (o || n) && (Function.prototype.call = e);
                } catch (e) {}
                return Reflect.apply(c, r, a);
            }
        };
        window.Function.prototype.call = new Proxy(window.Function.prototype.call, c);
        window.addEventListener("load", (async () => {
            if (Function.prototype.call = e, !o && t) return;
            const n = window.location.search, c = new URLSearchParams(n).get("v");
            if (!c) return;
            const r = await (a = "#movie_player", new Promise((e => {
                0;
                const t = Date.now() + 1e4, o = () => {
                    const n = document.querySelector(a);
                    n ? e(n) : Date.now() > t ? e(null) : setTimeout(o, 200);
                };
                o();
            })));
            var a;
            if (!r) return;
            const i = new URLSearchParams(n).get("t") ?? "0", l = parseInt(i, 10);
            if ("function" == typeof r.loadVideoById && !location.search.includes("&rco=")) try {
                r.loadVideoById(c, l);
            } catch (e) {}
        }));
    })();
    Object.defineProperty(Window.prototype.toString, "5b9872087d5e72503ae69e868973c51c", {
        value: e,
        enumerable: !1,
        writable: !1,
        configurable: !1
    });
} catch (e) {
    console.error('Error executing AG js rule with uniqueId "5b9872087d5e72503ae69e868973c51c" due to: ' + e);
}
})();
