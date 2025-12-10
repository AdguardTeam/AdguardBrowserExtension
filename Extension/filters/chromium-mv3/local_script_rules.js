/**
 * Search for 'JS_RULES_EXECUTION' to find all parts of script execution
 * process in the extension.
 *
 * 1. We collect and bundle all scripts that can be executed on web pages into
 *     the extension package into so-called `localScriptRules`.
 * 2. Rules that control when and where these scripts can be executed are also
 *     bundled within the extension package inside ruleset files.
 * 3. The rules look like: `example.org#%#scripttext`. Whenever the rule is
 *     matched, we check if there's a function for scripttext in
 *     `localScriptRules`, retrieve it from there and execute it.
 *
 * Below is the file with all the registered scripts that can be executed.
 */
export const localScriptRules = {
    '(function(){var a=document.currentScript,b=String.prototype.charCodeAt,c=function(){return true;};Object.defineProperty(String.prototype,"charCodeAt",{get:function(){return document.currentScript===a?b:c},set:function(a){}})})();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString.a415b8ebbf930b083a9d813bb1a1367a === t) return;
            !function() {
                var t = document.currentScript, e = String.prototype.charCodeAt, r = function() {
                    return !0;
                };
                Object.defineProperty(String.prototype, "charCodeAt", {
                    get: function() {
                        return document.currentScript === t ? e : r;
                    },
                    set: function(t) {}
                });
            }();
            Object.defineProperty(Window.prototype.toString, "a415b8ebbf930b083a9d813bb1a1367a", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "a415b8ebbf930b083a9d813bb1a1367a" due to: ' + t);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{if(typeof $==="function"){var $player=$(".player");$player.html($player.html().replace(/\x3c!--|--\x3e/g,""));}}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e781468d8e503942bd8a2b5d75e820e3 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                if ("function" == typeof $) {
                    var e = $(".player");
                    e.html(e.html().replace(/<!--|-->/g, ""));
                }
            }));
            Object.defineProperty(Window.prototype.toString, "e781468d8e503942bd8a2b5d75e820e3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e781468d8e503942bd8a2b5d75e820e3" due to: ' + e);
        }
    },
    '(()=>{const t=window.Map.prototype.values,a={apply:(a,e,p)=>{try{const a=Array.from(t.call(e))[0];(a?.parentElement?.matches(".supbar")||a?.matches?.(".rotator"))&&(e=new Map)}catch(t){}return Reflect.apply(a,e,p)}};window.Map.prototype.values=new Proxy(window.Map.prototype.values,a)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d64b4dac3a9d8fa9ed65b3d8c658a01f === e) return;
            (() => {
                const e = window.Map.prototype.values, t = {
                    apply: (t, a, r) => {
                        try {
                            const t = Array.from(e.call(a))[0];
                            (t?.parentElement?.matches(".supbar") || t?.matches?.(".rotator")) && (a = new Map);
                        } catch (e) {}
                        return Reflect.apply(t, a, r);
                    }
                };
                window.Map.prototype.values = new Proxy(window.Map.prototype.values, t);
            })();
            Object.defineProperty(Window.prototype.toString, "d64b4dac3a9d8fa9ed65b3d8c658a01f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d64b4dac3a9d8fa9ed65b3d8c658a01f" due to: ' + e);
        }
    },
    "(function() { var isSet = false; Object.defineProperty(window, 'vas', { get: function() { return isSet ? false : undefined; }, set: function() { isSet = false; } }); })();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d818588d2f70a2feaf95e6d52f17ccbe === e) return;
            !function() {
                var e = !1;
                Object.defineProperty(window, "vas", {
                    get: function() {
                        return !e && void 0;
                    },
                    set: function() {
                        e = !1;
                    }
                });
            }();
            Object.defineProperty(Window.prototype.toString, "d818588d2f70a2feaf95e6d52f17ccbe", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d818588d2f70a2feaf95e6d52f17ccbe" due to: ' + e);
        }
    },
    "window.trckd = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9694a84d652f8dc20c14bac2f5d04885"] === e) return;
            window.trckd = !0;
            Object.defineProperty(Window.prototype.toString, "9694a84d652f8dc20c14bac2f5d04885", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9694a84d652f8dc20c14bac2f5d04885" due to: ' + e);
        }
    },
    "window.ab = false;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4b8a3a3cee481368c865f50cdb63083f"] === e) return;
            window.ab = !1;
            Object.defineProperty(Window.prototype.toString, "4b8a3a3cee481368c865f50cdb63083f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4b8a3a3cee481368c865f50cdb63083f" due to: ' + e);
        }
    },
    "window.aadnet = {};": () => {
        try {
            const d = "done";
            if (Window.prototype.toString["723ed96afa36adad6fac95f60ddc793d"] === d) return;
            window.aadnet = {};
            Object.defineProperty(Window.prototype.toString, "723ed96afa36adad6fac95f60ddc793d", {
                value: d,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (d) {
            console.error('Error executing AG js rule with uniqueId "723ed96afa36adad6fac95f60ddc793d" due to: ' + d);
        }
    },
    "var isadblock=1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0528f2e6eabb867d601e3b5619e18249"] === e) return;
            var isadblock = 1;
            Object.defineProperty(Window.prototype.toString, "0528f2e6eabb867d601e3b5619e18249", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0528f2e6eabb867d601e3b5619e18249" due to: ' + e);
        }
    },
    "function setTimeout() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2fe08ac469bce8e0959ec04f0f994427"] === e) return;
            function setTimeout() {}
            Object.defineProperty(Window.prototype.toString, "2fe08ac469bce8e0959ec04f0f994427", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "2fe08ac469bce8e0959ec04f0f994427" due to: ' + t);
        }
    },
    "window.google_jobrunner = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["59956228dfe006ac6f5c8faa9d7247e2"] === e) return;
            window.google_jobrunner = function() {};
            Object.defineProperty(Window.prototype.toString, "59956228dfe006ac6f5c8faa9d7247e2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "59956228dfe006ac6f5c8faa9d7247e2" due to: ' + e);
        }
    },
    "var block = false;": () => {
        try {
            const a = "done";
            if (Window.prototype.toString["84381f8c4a4c9c214a07baa32a8b8a38"] === a) return;
            var block = !1;
            Object.defineProperty(Window.prototype.toString, "84381f8c4a4c9c214a07baa32a8b8a38", {
                value: a,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (a) {
            console.error('Error executing AG js rule with uniqueId "84381f8c4a4c9c214a07baa32a8b8a38" due to: ' + a);
        }
    },
    "window.setTimeout=function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["61f2a933309703d6e7d9383e4428a8e6"] === e) return;
            window.setTimeout = function() {};
            Object.defineProperty(Window.prototype.toString, "61f2a933309703d6e7d9383e4428a8e6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "61f2a933309703d6e7d9383e4428a8e6" due to: ' + e);
        }
    },
    "var canRunAds = true;": () => {
        try {
            const c = "done";
            if (Window.prototype.toString["8a68886c66c8ca4dccac563705f5891c"] === c) return;
            var canRunAds = !0;
            Object.defineProperty(Window.prototype.toString, "8a68886c66c8ca4dccac563705f5891c", {
                value: c,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (c) {
            console.error('Error executing AG js rule with uniqueId "8a68886c66c8ca4dccac563705f5891c" due to: ' + c);
        }
    },
    "Element.prototype.attachShadow = function(){};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["34432d844bc8123e149136a1ccd4dca3"] === e) return;
            Element.prototype.attachShadow = function() {};
            Object.defineProperty(Window.prototype.toString, "34432d844bc8123e149136a1ccd4dca3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "34432d844bc8123e149136a1ccd4dca3" due to: ' + e);
        }
    },
    "window.atob = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1dd67b659846dea638d69419abe06c73"] === e) return;
            window.atob = function() {};
            Object.defineProperty(Window.prototype.toString, "1dd67b659846dea638d69419abe06c73", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1dd67b659846dea638d69419abe06c73" due to: ' + e);
        }
    },
    "window.Worker = function() { this.postMessage = function() {} };": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f9e77f2ee05d700d3205a8848507f6b1 === e) return;
            window.Worker = function() {
                this.postMessage = function() {};
            };
            Object.defineProperty(Window.prototype.toString, "f9e77f2ee05d700d3205a8848507f6b1", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f9e77f2ee05d700d3205a8848507f6b1" due to: ' + e);
        }
    },
    "(function() { var intervalId = 0; var blockAds = function() { try { if (typeof BeSeedRotator != 'undefined' && BeSeedRotator.Container.player) { clearInterval(intervalId); BeSeedRotator.showDismissButton(); BeSeedRotator.reCache(); } } catch (ex) {}  }; intervalId = setInterval(blockAds, 100); })();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["52c186b38202f876b11210bbe1307dcf"] === e) return;
            !function() {
                var e = 0;
                e = setInterval((function() {
                    try {
                        if ("undefined" != typeof BeSeedRotator && BeSeedRotator.Container.player) {
                            clearInterval(e);
                            BeSeedRotator.showDismissButton();
                            BeSeedRotator.reCache();
                        }
                    } catch (e) {}
                }), 100);
            }();
            Object.defineProperty(Window.prototype.toString, "52c186b38202f876b11210bbe1307dcf", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "52c186b38202f876b11210bbe1307dcf" due to: ' + e);
        }
    },
    '(function(){var getElementsByTagName=document.getElementsByTagName;document.getElementsByTagName=function(tagName){if(tagName=="script")return[];return getElementsByTagName.call(this,tagName)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b1d2d1ecc236da7e56f0c6627c80f309 === e) return;
            !function() {
                var e = document.getElementsByTagName;
                document.getElementsByTagName = function(t) {
                    return "script" == t ? [] : e.call(this, t);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "b1d2d1ecc236da7e56f0c6627c80f309", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b1d2d1ecc236da7e56f0c6627c80f309" due to: ' + e);
        }
    },
    '(function(){var b={};(function(a,c,d){"undefined"!==typeof window[a]?window[a][c]=d:Object.defineProperty(window,a,{get:function(){return b[a]},set:function(e){b[a]=e;e[c]=d}})})("authConfig","adfox",[])})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f08e1e484fb2ed477eff5477b270c3ab === e) return;
            !function() {
                var e, o, t, n = {};
                e = "authConfig", o = "adfox", t = [], void 0 !== window[e] ? window[e][o] = t : Object.defineProperty(window, e, {
                    get: function() {
                        return n[e];
                    },
                    set: function(r) {
                        n[e] = r;
                        r[o] = t;
                    }
                });
            }();
            Object.defineProperty(Window.prototype.toString, "f08e1e484fb2ed477eff5477b270c3ab", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f08e1e484fb2ed477eff5477b270c3ab" due to: ' + e);
        }
    },
    '!function(){const p={apply:(p,e,n)=>{const r=Reflect.apply(p,e,n),s=r?.[0]?.props?.data;return s&&null===s.user&&(r[0].props.data.user="guest"),r}};window.JSON.parse=new Proxy(window.JSON.parse,p)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ff8cf9783100a66d151550ce6ced34a2 === e) return;
            !function() {
                const e = {
                    apply: (e, r, t) => {
                        const o = Reflect.apply(e, r, t), n = o?.[0]?.props?.data;
                        return n && null === n.user && (o[0].props.data.user = "guest"), o;
                    }
                };
                window.JSON.parse = new Proxy(window.JSON.parse, e);
            }();
            Object.defineProperty(Window.prototype.toString, "ff8cf9783100a66d151550ce6ced34a2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ff8cf9783100a66d151550ce6ced34a2" due to: ' + e);
        }
    },
    "(()=>{const a={apply:(a,t,r)=>{try{!0===r[0]?.parameters?.[1]?.autoplay&&(r[0].parameters[1].autoplay=!1)}catch(a){console.trace(a)}return Reflect.apply(a,t,r)}};window.JSON.stringify=new Proxy(window.JSON.stringify,a)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4f79921d4ac95552f4af81dfd58692a0"] === e) return;
            (() => {
                const e = {
                    apply: (e, r, t) => {
                        try {
                            !0 === t[0]?.parameters?.[1]?.autoplay && (t[0].parameters[1].autoplay = !1);
                        } catch (e) {
                            console.trace(e);
                        }
                        return Reflect.apply(e, r, t);
                    }
                };
                window.JSON.stringify = new Proxy(window.JSON.stringify, e);
            })();
            Object.defineProperty(Window.prototype.toString, "4f79921d4ac95552f4af81dfd58692a0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4f79921d4ac95552f4af81dfd58692a0" due to: ' + e);
        }
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e="div[id^=\'atf\']:empty { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b8fa834f4adf06d6a85a989a38de37be === e) return;
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, {
                apply: (e, t, a) => {
                    const o = Reflect.apply(e, t, a), n = "div[id^='atf']:empty { display: none !important; }";
                    if ("adoptedStyleSheets" in document) {
                        const e = new CSSStyleSheet;
                        e.replaceSync(n), o.adoptedStyleSheets = [ e ];
                    } else {
                        const e = document.createElement("style");
                        e.innerText = n, o.appendChild(e);
                    }
                    return o;
                }
            });
            Object.defineProperty(Window.prototype.toString, "b8fa834f4adf06d6a85a989a38de37be", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b8fa834f4adf06d6a85a989a38de37be" due to: ' + e);
        }
    },
    '(()=>{const o=Math.floor(1e5+9e5*Math.random()),a=`${Date.now()}${o}`;var t,e,m,$;t="_ym_uid",e=a,m="/",$=".gecmisi.com.tr",document.cookie=`${t}=${e};path=${m};domain=${$};`})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0104074ac36239af0632fc0f2aa96707"] === e) return;
            (() => {
                const e = Math.floor(1e5 + 9e5 * Math.random());
                var o;
                o = `${Date.now()}${e}`, document.cookie = `_ym_uid=${o};path=/;domain=.gecmisi.com.tr;`;
            })();
            Object.defineProperty(Window.prototype.toString, "0104074ac36239af0632fc0f2aa96707", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0104074ac36239af0632fc0f2aa96707" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{const e=document.querySelector(".adsbygoogle:not(.adsbygoogle-noablate)"),t=document.createElement("div");t.textContent=".".repeat(3e3),e.appendChild(t)}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bdadee2d2471bf842565a6d2880f96f2 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                const e = document.querySelector(".adsbygoogle:not(.adsbygoogle-noablate)"), t = document.createElement("div");
                t.textContent = ".".repeat(3e3), e.appendChild(t);
            }));
            Object.defineProperty(Window.prototype.toString, "bdadee2d2471bf842565a6d2880f96f2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bdadee2d2471bf842565a6d2880f96f2" due to: ' + e);
        }
    },
    "window.samDetected = false;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c377d77d43a05809c9a0d8a9ceab3d41 === e) return;
            window.samDetected = !1;
            Object.defineProperty(Window.prototype.toString, "c377d77d43a05809c9a0d8a9ceab3d41", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c377d77d43a05809c9a0d8a9ceab3d41" due to: ' + e);
        }
    },
    "var _amw1 = 1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["18c5b42ee23d66b2e421249a57fa79b6"] === e) return;
            var _amw1 = 1;
            Object.defineProperty(Window.prototype.toString, "18c5b42ee23d66b2e421249a57fa79b6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "18c5b42ee23d66b2e421249a57fa79b6" due to: ' + e);
        }
    },
    "var AdmostClient = 1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["68f39c1ee25950ec0093a17497f1746a"] === e) return;
            var AdmostClient = 1;
            Object.defineProperty(Window.prototype.toString, "68f39c1ee25950ec0093a17497f1746a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "68f39c1ee25950ec0093a17497f1746a" due to: ' + e);
        }
    },
    "var advertisement_not_blocked = 1;": () => {
        try {
            const d = "done";
            if (Window.prototype.toString["7d86fff0df182d87d917f92dd5565564"] === d) return;
            var advertisement_not_blocked = 1;
            Object.defineProperty(Window.prototype.toString, "7d86fff0df182d87d917f92dd5565564", {
                value: d,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (d) {
            console.error('Error executing AG js rule with uniqueId "7d86fff0df182d87d917f92dd5565564" due to: ' + d);
        }
    },
    "var criteo_medyanet_loaded = 1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["36a1a7ba76fefd6b56dea5d5a3260cf4"] === e) return;
            var criteo_medyanet_loaded = 1;
            Object.defineProperty(Window.prototype.toString, "36a1a7ba76fefd6b56dea5d5a3260cf4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "36a1a7ba76fefd6b56dea5d5a3260cf4" due to: ' + e);
        }
    },
    '(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/RTCPeerConnection[\\s\\S]*?new MouseEvent\\("click"/.test(a.toString()))return b(a,c)};})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ad3cc2fb594ccbd52529466a1f774118 === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/RTCPeerConnection[\s\S]*?new MouseEvent\("click"/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "ad3cc2fb594ccbd52529466a1f774118", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ad3cc2fb594ccbd52529466a1f774118" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{"function"==typeof load_3rdparties&&load_3rdparties()}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d32c830c0e926685887f2481f9379565 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                "function" == typeof load_3rdparties && load_3rdparties();
            }));
            Object.defineProperty(Window.prototype.toString, "d32c830c0e926685887f2481f9379565", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d32c830c0e926685887f2481f9379565" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?u=aHR0c")){var a=location.href.split("/?u=");if(a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString["8286156f54f298badd47131511830b06"] === o) return;
            !function() {
                if (-1 < window.location.href.indexOf("/?u=aHR0c")) {
                    var o = location.href.split("/?u=");
                    if (o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "8286156f54f298badd47131511830b06", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "8286156f54f298badd47131511830b06" due to: ' + o);
        }
    },
    'document.cookie="modalads=yes; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["48f46432b0c186dccc332dff0c8a87fe"] === e) return;
            document.cookie = "modalads=yes; path=/;";
            Object.defineProperty(Window.prototype.toString, "48f46432b0c186dccc332dff0c8a87fe", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "48f46432b0c186dccc332dff0c8a87fe" due to: ' + e);
        }
    },
    "if(window.sessionStorage) { window.sessionStorage.pageCount = 0; }": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["96c1872f8a0322e86045b358d415f5c4"] === e) return;
            window.sessionStorage && (window.sessionStorage.pageCount = 0);
            Object.defineProperty(Window.prototype.toString, "96c1872f8a0322e86045b358d415f5c4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "96c1872f8a0322e86045b358d415f5c4" due to: ' + e);
        }
    },
    'setTimeout ("HideFloatAdBanner()", 1000);': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["56182d371d85af85aa5af8cbd48e5b34"] === e) return;
            setTimeout("HideFloatAdBanner()", 1e3);
            Object.defineProperty(Window.prototype.toString, "56182d371d85af85aa5af8cbd48e5b34", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "56182d371d85af85aa5af8cbd48e5b34" due to: ' + e);
        }
    },
    '!function(){const e={apply:(e,t,n)=>(n&&n[1]&&"useAdBlockerDetector"===n[1]&&n[2]&&n[2].get&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n))};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["121f6100a828e1c169bfff6bafc69bfd"] === e) return;
            !function() {
                const e = {
                    apply: (e, t, r) => (r && r[1] && "useAdBlockerDetector" === r[1] && r[2] && r[2].get && (r[2].get = function() {
                        return function() {
                            return !1;
                        };
                    }), Reflect.apply(e, t, r))
                };
                window.Object.defineProperty = new Proxy(window.Object.defineProperty, e);
            }();
            Object.defineProperty(Window.prototype.toString, "121f6100a828e1c169bfff6bafc69bfd", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "121f6100a828e1c169bfff6bafc69bfd" due to: ' + e);
        }
    },
    "window.google_tag_manager = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["62de8ad86c59d0b7297a578a18ec0db3"] === e) return;
            window.google_tag_manager = function() {};
            Object.defineProperty(Window.prototype.toString, "62de8ad86c59d0b7297a578a18ec0db3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "62de8ad86c59d0b7297a578a18ec0db3" due to: ' + e);
        }
    },
    "(()=>{const e=function(){};window.tC={privacy:{getOptinCategories:e,cookieData:[]},addConsentChangeListener:e,removeConsentChangeListener:e,container:{reload:e}},window.tc_events_global=e})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["3e6ad3ca98205e8e015d731852c14ada"] === e) return;
            (() => {
                const e = function() {};
                window.tC = {
                    privacy: {
                        getOptinCategories: e,
                        cookieData: []
                    },
                    addConsentChangeListener: e,
                    removeConsentChangeListener: e,
                    container: {
                        reload: e
                    }
                }, window.tc_events_global = e;
            })();
            Object.defineProperty(Window.prototype.toString, "3e6ad3ca98205e8e015d731852c14ada", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "3e6ad3ca98205e8e015d731852c14ada" due to: ' + e);
        }
    },
    '(()=>{window.TATM=window.TATM||{},TATM.init=()=>{},TATM.initAdUnits=()=>{},TATM.pageReady=()=>{},TATM.getVast=function(n){return new Promise((n=>{n()}))},TATM.push=function(n){if("function"==typeof n)try{n()}catch(n){console.debug(n)}};})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["103de1b5e23e730a477b9b7da10564a4"] === e) return;
            window.TATM = window.TATM || {}, TATM.init = () => {}, TATM.initAdUnits = () => {}, 
            TATM.pageReady = () => {}, TATM.getVast = function(e) {
                return new Promise((e => {
                    e();
                }));
            }, TATM.push = function(e) {
                if ("function" == typeof e) try {
                    e();
                } catch (e) {
                    console.debug(e);
                }
            };
            Object.defineProperty(Window.prototype.toString, "103de1b5e23e730a477b9b7da10564a4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "103de1b5e23e730a477b9b7da10564a4" due to: ' + e);
        }
    },
    '(()=>{document.location.href.includes("/pop_advisor")&&window.addEventListener("load",()=>{const e=new CustomEvent("visibilitychange"),t=t=>{Object.defineProperty(t.view.top.document,"hidden",{value:!0,writable:!0}),t.view.top.document.dispatchEvent(e),setTimeout((()=>{Object.defineProperty(t.view.top.document,"hidden",{value:!1,writable:!0}),t.view.top.document.dispatchEvent(e)}),100)},n=document.querySelector("button.btn-continu");n&&n.addEventListener("click",t)});})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["962185cb0a55f058eae7c7389bbc7327"] === e) return;
            document.location.href.includes("/pop_advisor") && window.addEventListener("load", (() => {
                const e = new CustomEvent("visibilitychange"), t = document.querySelector("button.btn-continu");
                t && t.addEventListener("click", (t => {
                    Object.defineProperty(t.view.top.document, "hidden", {
                        value: !0,
                        writable: !0
                    }), t.view.top.document.dispatchEvent(e), setTimeout((() => {
                        Object.defineProperty(t.view.top.document, "hidden", {
                            value: !1,
                            writable: !0
                        }), t.view.top.document.dispatchEvent(e);
                    }), 100);
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "962185cb0a55f058eae7c7389bbc7327", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "962185cb0a55f058eae7c7389bbc7327" due to: ' + e);
        }
    },
    '(()=>{document.location.href.includes("/iframe_ad")&&window.addEventListener("load",(()=>{const e=new CustomEvent("visibilitychange"),t=()=>{Object.defineProperty(document,"hidden",{value:!0,writable:!0}),document.dispatchEvent(e),setTimeout((()=>{Object.defineProperty(document,"hidden",{value:!1,writable:!0}),document.dispatchEvent(e)}),100)},n=document.querySelector("a.btn-ad-iframe");n&&n.addEventListener("click",t)}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a715b406996eaeeeaf44515461187620 === e) return;
            document.location.href.includes("/iframe_ad") && window.addEventListener("load", (() => {
                const e = new CustomEvent("visibilitychange"), t = document.querySelector("a.btn-ad-iframe");
                t && t.addEventListener("click", (() => {
                    Object.defineProperty(document, "hidden", {
                        value: !0,
                        writable: !0
                    }), document.dispatchEvent(e), setTimeout((() => {
                        Object.defineProperty(document, "hidden", {
                            value: !1,
                            writable: !0
                        }), document.dispatchEvent(e);
                    }), 100);
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "a715b406996eaeeeaf44515461187620", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a715b406996eaeeeaf44515461187620" due to: ' + e);
        }
    },
    '(function(){var a={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(c,a){if("function"==typeof a)try{if(1===a.length){a({})}}catch(a){}}}};a.cmd.push=function(b){let a=function(){try{"function"==typeof b&&b()}catch(a){}};"complete"===document.readyState?a():window.addEventListener("load",()=>{a()})},window.jad=a})();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString["176456e95ac0c8ff1ac49bbf30461c8b"] === t) return;
            !function() {
                var t = {
                    cmd: [],
                    public: {
                        getVideoAdUrl: function() {},
                        createNewPosition: function() {},
                        refreshAds: function() {},
                        setTargetingOnPosition: function() {},
                        getDailymotionAdsParamsForScript: function(t, e) {
                            if ("function" == typeof e) try {
                                1 === e.length && e({});
                            } catch (e) {}
                        }
                    }
                };
                t.cmd.push = function(t) {
                    let e = function() {
                        try {
                            "function" == typeof t && t();
                        } catch (t) {}
                    };
                    "complete" === document.readyState ? e() : window.addEventListener("load", (() => {
                        e();
                    }));
                }, window.jad = t;
            }();
            Object.defineProperty(Window.prototype.toString, "176456e95ac0c8ff1ac49bbf30461c8b", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "176456e95ac0c8ff1ac49bbf30461c8b" due to: ' + t);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/target_url/.test(a)){ _st(a,b);}};": () => {
        try {
            const t = "done";
            if (Window.prototype.toString["315672b76833d426a2a0b83c85c50797"] === t) return;
            var _st = window.setTimeout;
            window.setTimeout = function(t, e) {
                /target_url/.test(t) || _st(t, e);
            };
            Object.defineProperty(Window.prototype.toString, "315672b76833d426a2a0b83c85c50797", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "315672b76833d426a2a0b83c85c50797" due to: ' + t);
        }
    },
    '(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty("appName")){if(obj.applaunch?.data?.player?.features?.ad?.enabled){obj.applaunch.data.player.features.ad.enabled=false}if(obj.applaunch?.data?.player?.features?.ad?.dai?.enabled){obj.applaunch.data.player.features.ad.dai.enabled=false}}}else{JSON.parse=nativeJSONParse}return obj}};JSON.parse=new Proxy(JSON.parse,handler)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["03b60dbf8e3b5b8f2423393210afcf06"] === e) return;
            !function() {
                let e = 0;
                const a = JSON.parse, r = {
                    apply() {
                        e++;
                        const r = Reflect.apply(...arguments);
                        if (e <= 10) {
                            if (r.hasOwnProperty("appName")) {
                                r.applaunch?.data?.player?.features?.ad?.enabled && (r.applaunch.data.player.features.ad.enabled = !1);
                                r.applaunch?.data?.player?.features?.ad?.dai?.enabled && (r.applaunch.data.player.features.ad.dai.enabled = !1);
                            }
                        } else JSON.parse = a;
                        return r;
                    }
                };
                JSON.parse = new Proxy(JSON.parse, r);
            }();
            Object.defineProperty(Window.prototype.toString, "03b60dbf8e3b5b8f2423393210afcf06", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "03b60dbf8e3b5b8f2423393210afcf06" due to: ' + e);
        }
    },
    "(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty('env')&&obj.env.hasOwnProperty('origin')){if(!obj.hasOwnProperty('ads')){obj.ads={};}obj.ads.enable=false;obj.ads._prerolls=false;obj.ads._midrolls=false;}}else{JSON.parse=nativeJSONParse;}return obj;}};JSON.parse=new Proxy(JSON.parse,handler);})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["076ec28f8d5bd40b7dc4be56dc82b841"] === e) return;
            !function() {
                let e = 0;
                const r = JSON.parse, o = {
                    apply() {
                        e++;
                        const o = Reflect.apply(...arguments);
                        if (e <= 10) {
                            if (o.hasOwnProperty("env") && o.env.hasOwnProperty("origin")) {
                                o.hasOwnProperty("ads") || (o.ads = {});
                                o.ads.enable = !1;
                                o.ads._prerolls = !1;
                                o.ads._midrolls = !1;
                            }
                        } else JSON.parse = r;
                        return o;
                    }
                };
                JSON.parse = new Proxy(JSON.parse, o);
            }();
            Object.defineProperty(Window.prototype.toString, "076ec28f8d5bd40b7dc4be56dc82b841", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "076ec28f8d5bd40b7dc4be56dc82b841" due to: ' + e);
        }
    },
    '(()=>{if(location.href.includes("cdn.sirdata.eu/load_with_tcf.php?url=https")){const a=new URLSearchParams(location.search).get("url");a&&location.assign(a)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ca7a8176701e7a23e0d4c73706555161 === e) return;
            (() => {
                if (location.href.includes("cdn.sirdata.eu/load_with_tcf.php?url=https")) {
                    const e = new URLSearchParams(location.search).get("url");
                    e && location.assign(e);
                }
            })();
            Object.defineProperty(Window.prototype.toString, "ca7a8176701e7a23e0d4c73706555161", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ca7a8176701e7a23e0d4c73706555161" due to: ' + e);
        }
    },
    '(()=>{window.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'.embed-container > [data-blocked-by-rodoguard="true"]\').forEach((e=>{const t=e.getAttribute("data-src")||e.getAttribute("src"),r=e.tagName.toLowerCase(),a=e.attributes;if(!t||!r)return;const o=document.createElement(r);if(o.setAttribute("src",t),"iframe"===r&&a.length)for(const e of a)"src"!==e.name&&"data-blocked-by-rodoguard"!==e.name&&o.setAttribute(e.name,e.value);e.replaceWith(o)}))}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["308daff31d0bda9bb201d56661aea646"] === e) return;
            window.addEventListener("DOMContentLoaded", (() => {
                document.querySelectorAll('.embed-container > [data-blocked-by-rodoguard="true"]').forEach((e => {
                    const t = e.getAttribute("data-src") || e.getAttribute("src"), r = e.tagName.toLowerCase(), a = e.attributes;
                    if (!t || !r) return;
                    const o = document.createElement(r);
                    if (o.setAttribute("src", t), "iframe" === r && a.length) for (const e of a) "src" !== e.name && "data-blocked-by-rodoguard" !== e.name && o.setAttribute(e.name, e.value);
                    e.replaceWith(o);
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "308daff31d0bda9bb201d56661aea646", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "308daff31d0bda9bb201d56661aea646" due to: ' + e);
        }
    },
    '(()=>{window.patroniteGdprData={google_recaptcha:"allow"}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fc25d8c99ebbbc3be6aedb39d0c00819 === e) return;
            window.patroniteGdprData = {
                google_recaptcha: "allow"
            };
            Object.defineProperty(Window.prototype.toString, "fc25d8c99ebbbc3be6aedb39d0c00819", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fc25d8c99ebbbc3be6aedb39d0c00819" due to: ' + e);
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector(\'cmp-button[variant="primary"]\');c&&(c.click(),o.disconnect())})),c={apply:(c,n,a)=>{const r=Reflect.apply(c,n,a);return!e&&n.matches("cmp-dialog")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9318631bdeb75b748ea1cad12107b17a"] === e) return;
            (() => {
                let e, t = !1;
                const o = new MutationObserver(((t, o) => {
                    const r = e?.querySelector('cmp-button[variant="primary"]');
                    r && (r.click(), o.disconnect());
                })), r = {
                    apply: (r, a, n) => {
                        const c = Reflect.apply(r, a, n);
                        return !t && a.matches("cmp-dialog") && (t = !0, e = c), o.observe(c, {
                            subtree: !0,
                            childList: !0
                        }), c;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, r);
            })();
            Object.defineProperty(Window.prototype.toString, "9318631bdeb75b748ea1cad12107b17a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9318631bdeb75b748ea1cad12107b17a" due to: ' + e);
        }
    },
    '(()=>{let t;const e=new MutationObserver(((e,o)=>{const n=t?.querySelector(\'button[data-testid="button-agree"]\');n&&(setTimeout((()=>{n.click()}),500),o.disconnect())})),o={apply:(o,n,c)=>{const a=Reflect.apply(o,n,c);return n.matches(".szn-cmp-dialog-container")&&(t=a),e.observe(a,{subtree:!0,childList:!0}),a}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,o)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2bca593aa0d901f23a66e9e0ba973abc"] === e) return;
            (() => {
                let e;
                const t = new MutationObserver(((t, a) => {
                    const o = e?.querySelector('button[data-testid="button-agree"]');
                    o && (setTimeout((() => {
                        o.click();
                    }), 500), a.disconnect());
                })), a = {
                    apply: (a, o, r) => {
                        const n = Reflect.apply(a, o, r);
                        return o.matches(".szn-cmp-dialog-container") && (e = n), t.observe(n, {
                            subtree: !0,
                            childList: !0
                        }), n;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, a);
            })();
            Object.defineProperty(Window.prototype.toString, "2bca593aa0d901f23a66e9e0ba973abc", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2bca593aa0d901f23a66e9e0ba973abc" due to: ' + e);
        }
    },
    '(function(){var noopFunc=function(){};var tcData={eventStatus:"tcloaded",gdprApplies:!1,listenerId:noopFunc,vendor:{consents:{967:true}},purpose:{consents:[]}};window.__tcfapi=function(command,version,callback){"function"==typeof callback&&"removeEventListener"!==command&&callback(tcData,!0)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["905285a22b2c90f963ab16245e1f463b"] === e) return;
            !function() {
                var e = {
                    eventStatus: "tcloaded",
                    gdprApplies: !1,
                    listenerId: function() {},
                    vendor: {
                        consents: {
                            967: !0
                        }
                    },
                    purpose: {
                        consents: []
                    }
                };
                window.__tcfapi = function(t, n, o) {
                    "function" == typeof o && "removeEventListener" !== t && o(e, !0);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "905285a22b2c90f963ab16245e1f463b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "905285a22b2c90f963ab16245e1f463b" due to: ' + e);
        }
    },
    'document.cookie="PostAnalytics=inactive; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8dd64e0e5c7cfb7ada0186747714df1b"] === e) return;
            document.cookie = "PostAnalytics=inactive; path=/;";
            Object.defineProperty(Window.prototype.toString, "8dd64e0e5c7cfb7ada0186747714df1b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8dd64e0e5c7cfb7ada0186747714df1b" due to: ' + e);
        }
    },
    "document.cookie='cmplz_consented_services={\"youtube\":true};path=/;';": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8cbd0cd2ffcfd41b8dd501b4861c18e3"] === e) return;
            document.cookie = 'cmplz_consented_services={"youtube":true};path=/;';
            Object.defineProperty(Window.prototype.toString, "8cbd0cd2ffcfd41b8dd501b4861c18e3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8cbd0cd2ffcfd41b8dd501b4861c18e3" due to: ' + e);
        }
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"jysk.nl","consent_domain":"jysk.nl","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4e7a66fe06a58f87f9deb67cb85b8a2c"] === e) return;
            !function() {
                if (!document.cookie.includes("CookieInformationConsent=")) {
                    var e = encodeURIComponent('{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"jysk.nl","consent_domain":"jysk.nl","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}');
                    document.cookie = "CookieInformationConsent=" + e + "; path=/;";
                }
            }();
            Object.defineProperty(Window.prototype.toString, "4e7a66fe06a58f87f9deb67cb85b8a2c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4e7a66fe06a58f87f9deb67cb85b8a2c" due to: ' + e);
        }
    },
    'document.cookie=\'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;\';': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bee65ec0755ccff706db52148c4173c7 === e) return;
            document.cookie = 'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;';
            Object.defineProperty(Window.prototype.toString, "bee65ec0755ccff706db52148c4173c7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bee65ec0755ccff706db52148c4173c7" due to: ' + e);
        }
    },
    '(function(){try{var a=location.pathname.split("/")[1],b="dra_cookie_consent_allowed_"+a,c=new RegExp(/[a-z]+_[a-z]+/);if(!document.cookie.includes(b)&&c.test(a)){var d=encodeURIComponent("v=1&t=1&f=1&s=0&m=0");document.cookie=b+"="+d+"; path=/;"}}catch(e){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["89284264a9e746e269120c04d8e07578"] === e) return;
            !function() {
                try {
                    var e = location.pathname.split("/")[1], o = "dra_cookie_consent_allowed_" + e, t = new RegExp(/[a-z]+_[a-z]+/);
                    if (!document.cookie.includes(o) && t.test(e)) {
                        var n = encodeURIComponent("v=1&t=1&f=1&s=0&m=0");
                        document.cookie = o + "=" + n + "; path=/;";
                    }
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "89284264a9e746e269120c04d8e07578", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "89284264a9e746e269120c04d8e07578" due to: ' + e);
        }
    },
    'document.cookie="dw_cookies_accepted=D; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["65ddec250513cfa895af9e691c980515"] === e) return;
            document.cookie = "dw_cookies_accepted=D; path=/;";
            Object.defineProperty(Window.prototype.toString, "65ddec250513cfa895af9e691c980515", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "65ddec250513cfa895af9e691c980515" due to: ' + e);
        }
    },
    '(function(){document.cookie.includes("cookies-consents")||(document.cookie=\'cookies-consents={"ad_storage":false,"analytics_storage":false}\')})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ccaa77db2be3c96b3a11b73a501af1f1 === e) return;
            document.cookie.includes("cookies-consents") || (document.cookie = 'cookies-consents={"ad_storage":false,"analytics_storage":false}');
            Object.defineProperty(Window.prototype.toString, "ccaa77db2be3c96b3a11b73a501af1f1", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ccaa77db2be3c96b3a11b73a501af1f1" due to: ' + e);
        }
    },
    'document.cookie="ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["58bc9348bcf4f1f2b6163529b3298384"] === e) return;
            document.cookie = "ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";
            Object.defineProperty(Window.prototype.toString, "58bc9348bcf4f1f2b6163529b3298384", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "58bc9348bcf4f1f2b6163529b3298384" due to: ' + e);
        }
    },
    'document.cookie="cookieconsent_status=allow; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["95e24d457a7de10b441b7cbe6b509b42"] === e) return;
            document.cookie = "cookieconsent_status=allow; path=/;";
            Object.defineProperty(Window.prototype.toString, "95e24d457a7de10b441b7cbe6b509b42", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "95e24d457a7de10b441b7cbe6b509b42" due to: ' + e);
        }
    },
    'document.cookie="cookieConsentLevel=functional; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["787f6ec1d270f080d84075658a3154bd"] === e) return;
            document.cookie = "cookieConsentLevel=functional; path=/;";
            Object.defineProperty(Window.prototype.toString, "787f6ec1d270f080d84075658a3154bd", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "787f6ec1d270f080d84075658a3154bd" due to: ' + e);
        }
    },
    'document.cookie="cookies_accept=all; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["25fbbc330687fea937e26e0888468fc1"] === e) return;
            document.cookie = "cookies_accept=all; path=/;";
            Object.defineProperty(Window.prototype.toString, "25fbbc330687fea937e26e0888468fc1", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "25fbbc330687fea937e26e0888468fc1" due to: ' + e);
        }
    },
    'document.cookie="waconcookiemanagement=min; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0898665962f7d4da16a3e93e72148415"] === e) return;
            document.cookie = "waconcookiemanagement=min; path=/;";
            Object.defineProperty(Window.prototype.toString, "0898665962f7d4da16a3e93e72148415", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0898665962f7d4da16a3e93e72148415" due to: ' + e);
        }
    },
    'document.cookie="apcAcceptedTrackingCookie3=1111000; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ebce46e2aa13a6690a7be922ea601529 === e) return;
            document.cookie = "apcAcceptedTrackingCookie3=1111000; path=/;";
            Object.defineProperty(Window.prototype.toString, "ebce46e2aa13a6690a7be922ea601529", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ebce46e2aa13a6690a7be922ea601529" due to: ' + e);
        }
    },
    'document.cookie="bbDatenstufe=stufe3; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9d2c1d25c86235dc271dab2c2b2e99b2"] === e) return;
            document.cookie = "bbDatenstufe=stufe3; path=/;";
            Object.defineProperty(Window.prototype.toString, "9d2c1d25c86235dc271dab2c2b2e99b2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9d2c1d25c86235dc271dab2c2b2e99b2" due to: ' + e);
        }
    },
    'document.cookie="newsletter-signup=viewed; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0cee21006fa668615b19188582a82e34"] === e) return;
            document.cookie = "newsletter-signup=viewed; path=/;";
            Object.defineProperty(Window.prototype.toString, "0cee21006fa668615b19188582a82e34", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0cee21006fa668615b19188582a82e34" due to: ' + e);
        }
    },
    'document.cookie="user_cookie_consent=essential; path=/";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["00c1162ebf92fa57d12e33c78f9ab876"] === e) return;
            document.cookie = "user_cookie_consent=essential; path=/";
            Object.defineProperty(Window.prototype.toString, "00c1162ebf92fa57d12e33c78f9ab876", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "00c1162ebf92fa57d12e33c78f9ab876" due to: ' + e);
        }
    },
    'document.cookie="cookiebanner=closed; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["64b6a01f2a020125dffd898bafb19615"] === e) return;
            document.cookie = "cookiebanner=closed; path=/;";
            Object.defineProperty(Window.prototype.toString, "64b6a01f2a020125dffd898bafb19615", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "64b6a01f2a020125dffd898bafb19615" due to: ' + e);
        }
    },
    'document.cookie=\'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;\';': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d61d4bd09c7716fa4e2f0235b892e274 === e) return;
            document.cookie = 'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;';
            Object.defineProperty(Window.prototype.toString, "d61d4bd09c7716fa4e2f0235b892e274", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d61d4bd09c7716fa4e2f0235b892e274" due to: ' + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("GPRD")&&(document.cookie="GPRD=128; path=/;",location.reload())})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.dcadc5846fed7b2f033974e6075c5fed === e) return;
            -1 == document.cookie.indexOf("GPRD") && (document.cookie = "GPRD=128; path=/;", 
            location.reload());
            Object.defineProperty(Window.prototype.toString, "dcadc5846fed7b2f033974e6075c5fed", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "dcadc5846fed7b2f033974e6075c5fed" due to: ' + e);
        }
    },
    'document.cookie="acceptRodoSie=hide; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d52e913bca352f639daec5b240f07513 === e) return;
            document.cookie = "acceptRodoSie=hide; path=/;";
            Object.defineProperty(Window.prototype.toString, "d52e913bca352f639daec5b240f07513", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d52e913bca352f639daec5b240f07513" due to: ' + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("cookie-functional")&&(document.cookie="cookie-functional=1; path=/;",document.cookie="popupek=1; path=/;",location.reload())})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["23d2c0ec8e7bc0167527c1acc5bb5355"] === e) return;
            -1 == document.cookie.indexOf("cookie-functional") && (document.cookie = "cookie-functional=1; path=/;", 
            document.cookie = "popupek=1; path=/;", location.reload());
            Object.defineProperty(Window.prototype.toString, "23d2c0ec8e7bc0167527c1acc5bb5355", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "23d2c0ec8e7bc0167527c1acc5bb5355" due to: ' + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("ccb")&&(document.cookie="ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;",location.reload())})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f2aea7e44ba000bb61336ea707125580 === e) return;
            -1 == document.cookie.indexOf("ccb") && (document.cookie = "ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;", 
            location.reload());
            Object.defineProperty(Window.prototype.toString, "f2aea7e44ba000bb61336ea707125580", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f2aea7e44ba000bb61336ea707125580" due to: ' + e);
        }
    },
    "(function(){-1===document.cookie.indexOf(\"CookieConsent\")&&(document.cookie='CookieConsent=mandatory|osm; path=/;')})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f7a28a06b7a2a2e94cb072030083586d === e) return;
            -1 === document.cookie.indexOf("CookieConsent") && (document.cookie = "CookieConsent=mandatory|osm; path=/;");
            Object.defineProperty(Window.prototype.toString, "f7a28a06b7a2a2e94cb072030083586d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f7a28a06b7a2a2e94cb072030083586d" due to: ' + e);
        }
    },
    '(function(){-1===document.cookie.indexOf("CookieControl")&&(document.cookie=\'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}\')})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["06ad4ed929d84e1793e13be6c4a31b38"] === e) return;
            -1 === document.cookie.indexOf("CookieControl") && (document.cookie = 'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}');
            Object.defineProperty(Window.prototype.toString, "06ad4ed929d84e1793e13be6c4a31b38", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "06ad4ed929d84e1793e13be6c4a31b38" due to: ' + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("CONSENT")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="CONSENT=301212NN; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2f7b46464b7a29f89080a98e454b73a8"] === e) return;
            !function() {
                if (-1 == document.cookie.indexOf("CONSENT")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "CONSENT=301212NN; path=/; expires=" + o.toUTCString(), location.reload();
                }
            }();
            Object.defineProperty(Window.prototype.toString, "2f7b46464b7a29f89080a98e454b73a8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2f7b46464b7a29f89080a98e454b73a8" due to: ' + e);
        }
    },
    'document.cookie="dsgvo=basic; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c8f808a7e878f97d64286800484605d0 === e) return;
            document.cookie = "dsgvo=basic; path=/;";
            Object.defineProperty(Window.prototype.toString, "c8f808a7e878f97d64286800484605d0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c8f808a7e878f97d64286800484605d0" due to: ' + e);
        }
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"elkjop.no","consent_domain":"elkjop.no","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6051620f594fcf9636bd68b417cb0e5b"] === e) return;
            !function() {
                if (!document.cookie.includes("CookieInformationConsent=")) {
                    var e = encodeURIComponent('{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"elkjop.no","consent_domain":"elkjop.no","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}');
                    document.cookie = "CookieInformationConsent=" + e + "; path=/;";
                }
            }();
            Object.defineProperty(Window.prototype.toString, "6051620f594fcf9636bd68b417cb0e5b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6051620f594fcf9636bd68b417cb0e5b" due to: ' + e);
        }
    },
    '(function(){var a={timestamp:(new Date).getTime(),choice:2,version:"1.0"};document.cookie="mxp="+JSON.stringify(a)+"; path=/"})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4cdd2100913b4096462563fee10f5daa"] === e) return;
            !function() {
                var e = {
                    timestamp: (new Date).getTime(),
                    choice: 2,
                    version: "1.0"
                };
                document.cookie = "mxp=" + JSON.stringify(e) + "; path=/";
            }();
            Object.defineProperty(Window.prototype.toString, "4cdd2100913b4096462563fee10f5daa", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4cdd2100913b4096462563fee10f5daa" due to: ' + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("bavarianfootballworks.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["504f6b7ac8c9c857fc49addc0eb518fd"] === e) return;
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("bavarianfootballworks.com")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
            Object.defineProperty(Window.prototype.toString, "504f6b7ac8c9c857fc49addc0eb518fd", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "504f6b7ac8c9c857fc49addc0eb518fd" due to: ' + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("goldenstateofmind.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["62fd4c05daebdd55280e0b23009cc9aa"] === e) return;
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("goldenstateofmind.com")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
            Object.defineProperty(Window.prototype.toString, "62fd4c05daebdd55280e0b23009cc9aa", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "62fd4c05daebdd55280e0b23009cc9aa" due to: ' + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("mmafighting.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1a42ed4d4e4e6922f6fda946f00f4816"] === e) return;
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("mmafighting.com")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
            Object.defineProperty(Window.prototype.toString, "1a42ed4d4e4e6922f6fda946f00f4816", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1a42ed4d4e4e6922f6fda946f00f4816" due to: ' + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("cms_cookies")&&(document.cookie="cms_cookies=6; path=/;",document.cookie="cms_cookies_saved=true; path=/;",location.reload())})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c69eca07b387ee449234ff30bf5ce30e === e) return;
            -1 == document.cookie.indexOf("cms_cookies") && (document.cookie = "cms_cookies=6; path=/;", 
            document.cookie = "cms_cookies_saved=true; path=/;", location.reload());
            Object.defineProperty(Window.prototype.toString, "c69eca07b387ee449234ff30bf5ce30e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c69eca07b387ee449234ff30bf5ce30e" due to: ' + e);
        }
    },
    'document.cookie="erlaubte_cookies=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fa4fb1ef63a96ddb1e25a44e7d9cfcfe === e) return;
            document.cookie = "erlaubte_cookies=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "fa4fb1ef63a96ddb1e25a44e7d9cfcfe", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fa4fb1ef63a96ddb1e25a44e7d9cfcfe" due to: ' + e);
        }
    },
    'document.cookie="klaviano_police=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0625bed2a838c73f77094993c60b81cc"] === e) return;
            document.cookie = "klaviano_police=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "0625bed2a838c73f77094993c60b81cc", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0625bed2a838c73f77094993c60b81cc" due to: ' + e);
        }
    },
    'document.cookie=\'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;\';': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f5b9b753afe5738b6731ee8166dcd891 === e) return;
            document.cookie = 'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;';
            Object.defineProperty(Window.prototype.toString, "f5b9b753afe5738b6731ee8166dcd891", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f5b9b753afe5738b6731ee8166dcd891" due to: ' + e);
        }
    },
    '(function(){if(!document.cookie.includes("trackingPermissionConsentsValue=")){var a=encodeURIComponent(\'"cookies_analytics":false,"cookies_personalization":false,"cookies_advertisement":false\');document.cookie="trackingPermissionConsentsValue={"+a+"}; path=/;"}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c99384d0ca41c87dbb63212ebb71470f === e) return;
            !function() {
                if (!document.cookie.includes("trackingPermissionConsentsValue=")) {
                    var e = encodeURIComponent('"cookies_analytics":false,"cookies_personalization":false,"cookies_advertisement":false');
                    document.cookie = "trackingPermissionConsentsValue={" + e + "}; path=/;";
                }
            }();
            Object.defineProperty(Window.prototype.toString, "c99384d0ca41c87dbb63212ebb71470f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c99384d0ca41c87dbb63212ebb71470f" due to: ' + e);
        }
    },
    'document.cookie="allowTracking=false; path=/;"; document.cookie="trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["380715610fe9f7be74ee211b5df06559"] === e) return;
            document.cookie = "allowTracking=false; path=/;";
            document.cookie = "trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";
            Object.defineProperty(Window.prototype.toString, "380715610fe9f7be74ee211b5df06559", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "380715610fe9f7be74ee211b5df06559" due to: ' + e);
        }
    },
    'document.cookie="userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["967efe0b8b7e9d602d9c0ecdf20fc0cf"] === e) return;
            document.cookie = "userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";
            Object.defineProperty(Window.prototype.toString, "967efe0b8b7e9d602d9c0ecdf20fc0cf", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "967efe0b8b7e9d602d9c0ecdf20fc0cf" due to: ' + e);
        }
    },
    'document.cookie="sendgb_cookiewarning=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["190bccd6dfb21f403e2765c76b59110f"] === e) return;
            document.cookie = "sendgb_cookiewarning=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "190bccd6dfb21f403e2765c76b59110f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "190bccd6dfb21f403e2765c76b59110f" due to: ' + e);
        }
    },
    'document.cookie="rodopop=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9ed981f72e0e18755c3a1ffe09bbd2ba"] === e) return;
            document.cookie = "rodopop=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "9ed981f72e0e18755c3a1ffe09bbd2ba", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9ed981f72e0e18755c3a1ffe09bbd2ba" due to: ' + e);
        }
    },
    'document.cookie="eu_cn=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["868ecbdfeac245c25b130bfba6792d71"] === e) return;
            document.cookie = "eu_cn=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "868ecbdfeac245c25b130bfba6792d71", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "868ecbdfeac245c25b130bfba6792d71" due to: ' + e);
        }
    },
    'document.cookie="gdprAccepted=true; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2c12d864ca83dfdf8bc7e1c395c19fef"] === e) return;
            document.cookie = "gdprAccepted=true; path=/;";
            Object.defineProperty(Window.prototype.toString, "2c12d864ca83dfdf8bc7e1c395c19fef", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2c12d864ca83dfdf8bc7e1c395c19fef" due to: ' + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("BCPermissionLevel")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="BCPermissionLevel=PERSONAL; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["29fd06a58b635f18a26d675807f87ee7"] === e) return;
            !function() {
                if (-1 == document.cookie.indexOf("BCPermissionLevel")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "BCPermissionLevel=PERSONAL; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
            Object.defineProperty(Window.prototype.toString, "29fd06a58b635f18a26d675807f87ee7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "29fd06a58b635f18a26d675807f87ee7" due to: ' + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e7ea60642fa9501751b42fd2fe95103b === e) return;
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
            Object.defineProperty(Window.prototype.toString, "e7ea60642fa9501751b42fd2fe95103b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e7ea60642fa9501751b42fd2fe95103b" due to: ' + e);
        }
    },
    "!function(a,b,c,f,g,d,e){e=a[c]||a['WebKit'+c]||a['Moz'+c],e&&(d=new e(function(){b[f].contains(g)&&(b[f].remove(g),d.disconnect())}),d.observe(b,{attributes:!0,attributeFilter:['class']}))}(window,document.documentElement,'MutationObserver','classList','layer_cookie__visible');": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["61e6ac2655edf1e9450373c1fd849cd0"] === e) return;
            !function(e, t, o, n, r, c, i) {
                (i = e[o] || e["WebKit" + o] || e["Moz" + o]) && (c = new i((function() {
                    t[n].contains(r) && (t[n].remove(r), c.disconnect());
                }))).observe(t, {
                    attributes: !0,
                    attributeFilter: [ "class" ]
                });
            }(window, document.documentElement, "MutationObserver", "classList", "layer_cookie__visible");
            Object.defineProperty(Window.prototype.toString, "61e6ac2655edf1e9450373c1fd849cd0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "61e6ac2655edf1e9450373c1fd849cd0" due to: ' + e);
        }
    },
    'var cw;Object.defineProperty(window,"cookieWallSettings",{get:function(){return cw},set:function(a){document.cookie="rtlcookieconsent="+a.version.toString()+";";cw=a}});': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b32831777a037cfe79fc602cdef09ab7 === e) return;
            var cw;
            Object.defineProperty(window, "cookieWallSettings", {
                get: function() {
                    return cw;
                },
                set: function(e) {
                    document.cookie = "rtlcookieconsent=" + e.version.toString() + ";";
                    cw = e;
                }
            });
            Object.defineProperty(Window.prototype.toString, "b32831777a037cfe79fc602cdef09ab7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b32831777a037cfe79fc602cdef09ab7" due to: ' + e);
        }
    },
    '(()=>{if(!location.pathname.includes("/search"))return;const t={attributes:!0,childList:!0,subtree:!0},e=(t,e)=>{for(const n of t){const t=n.target.querySelector(".privacy-statement + .get-started-btn-wrapper > button.inline-explicit");t&&(t.click(),e.disconnect())}},n={apply:(n,o,c)=>{const r=Reflect.apply(n,o,c);if(o&&o.matches("cib-muid-consent")){new MutationObserver(e).observe(r,t)}return r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,n)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["36fc3a243e85a682dd99c26376ad6c57"] === e) return;
            (() => {
                if (!location.pathname.includes("/search")) return;
                const e = {
                    attributes: !0,
                    childList: !0,
                    subtree: !0
                }, t = (e, t) => {
                    for (const o of e) {
                        const e = o.target.querySelector(".privacy-statement + .get-started-btn-wrapper > button.inline-explicit");
                        e && (e.click(), t.disconnect());
                    }
                }, o = {
                    apply: (o, r, n) => {
                        const c = Reflect.apply(o, r, n);
                        r && r.matches("cib-muid-consent") && new MutationObserver(t).observe(c, e);
                        return c;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, o);
            })();
            Object.defineProperty(Window.prototype.toString, "36fc3a243e85a682dd99c26376ad6c57", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "36fc3a243e85a682dd99c26376ad6c57" due to: ' + e);
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector("button.uc-deny-button");c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#usercentrics-cmp-ui")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7d2a68c5db67d5c0b987bcc67516ef8e"] === e) return;
            (() => {
                let e, t = !1;
                const c = new MutationObserver(((t, c) => {
                    const o = e?.querySelector("button.uc-deny-button");
                    o && (o.click(), c.disconnect());
                })), o = {
                    apply: (o, r, n) => {
                        const d = Reflect.apply(o, r, n);
                        return !t && r.matches("#usercentrics-cmp-ui") && (t = !0, e = d), c.observe(d, {
                            subtree: !0,
                            childList: !0
                        }), d;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, o);
            })();
            Object.defineProperty(Window.prototype.toString, "7d2a68c5db67d5c0b987bcc67516ef8e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7d2a68c5db67d5c0b987bcc67516ef8e" due to: ' + e);
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector(\'button[data-testid="uc-accept-all-button"]\');c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#usercentrics-root")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c3fa9bec7cb9559b8965f87071a37fc6 === e) return;
            (() => {
                let e, t = !1;
                const c = new MutationObserver(((t, c) => {
                    const o = e?.querySelector('button[data-testid="uc-accept-all-button"]');
                    o && (o.click(), c.disconnect());
                })), o = {
                    apply: (o, r, n) => {
                        const a = Reflect.apply(o, r, n);
                        return !t && r.matches("#usercentrics-root") && (t = !0, e = a), c.observe(a, {
                            subtree: !0,
                            childList: !0
                        }), a;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, o);
            })();
            Object.defineProperty(Window.prototype.toString, "c3fa9bec7cb9559b8965f87071a37fc6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c3fa9bec7cb9559b8965f87071a37fc6" due to: ' + e);
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector(\'button[data-testid="uc-deny-all-button"]\');c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#usercentrics-root")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7924c03c0efcdc958073d4f764522f33"] === e) return;
            (() => {
                let e, t = !1;
                const o = new MutationObserver(((t, o) => {
                    const c = e?.querySelector('button[data-testid="uc-deny-all-button"]');
                    c && (c.click(), o.disconnect());
                })), c = {
                    apply: (c, r, n) => {
                        const d = Reflect.apply(c, r, n);
                        return !t && r.matches("#usercentrics-root") && (t = !0, e = d), o.observe(d, {
                            subtree: !0,
                            childList: !0
                        }), d;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, c);
            })();
            Object.defineProperty(Window.prototype.toString, "7924c03c0efcdc958073d4f764522f33", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7924c03c0efcdc958073d4f764522f33" due to: ' + e);
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector("#cmpbox a.cmptxt_btn_yes");c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#cmpwrapper")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9c5d8cfc5b5533f486ab90d24d15e42c"] === e) return;
            (() => {
                let e, t = !1;
                const c = new MutationObserver(((t, c) => {
                    const o = e?.querySelector("#cmpbox a.cmptxt_btn_yes");
                    o && (o.click(), c.disconnect());
                })), o = {
                    apply: (o, r, n) => {
                        const d = Reflect.apply(o, r, n);
                        return !t && r.matches("#cmpwrapper") && (t = !0, e = d), c.observe(d, {
                            subtree: !0,
                            childList: !0
                        }), d;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, o);
            })();
            Object.defineProperty(Window.prototype.toString, "9c5d8cfc5b5533f486ab90d24d15e42c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9c5d8cfc5b5533f486ab90d24d15e42c" due to: ' + e);
        }
    },
    '(function(o){function a(a){return{get:function(){return a},set:b}}function b(){}function c(){throw"Adguard: stopped a script execution.";}var d={},e=a(function(a){a(!1)}),f={},g=EventTarget.prototype.addEventListener;o(d,{spid_control_callback:a(b),content_control_callback:a(b),vid_control_callback:a(b)});o(f,{config:a(d),_setSpKey:{get:c,set:c},checkState:e,isAdBlocking:e,getSafeUri:a(function(a){return a}),pageChange:a(b),setupSmartBeacons:a(b)});Object.defineProperty(window,"_sp_",a(f));EventTarget.prototype.addEventListener=function(a){"sp.blocking"!=a&&"sp.not_blocking"!=a&&g.apply(this,arguments)}})(Object.defineProperties);': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a1233e00aac3b1e9bd547e64ca938543 === e) return;
            !function(e) {
                function t(e) {
                    return {
                        get: function() {
                            return e;
                        },
                        set: n
                    };
                }
                function n() {}
                function o() {
                    throw "Adguard: stopped a script execution.";
                }
                var r = {}, c = t((function(e) {
                    e(!1);
                })), a = {}, i = EventTarget.prototype.addEventListener;
                e(r, {
                    spid_control_callback: t(n),
                    content_control_callback: t(n),
                    vid_control_callback: t(n)
                });
                e(a, {
                    config: t(r),
                    _setSpKey: {
                        get: o,
                        set: o
                    },
                    checkState: c,
                    isAdBlocking: c,
                    getSafeUri: t((function(e) {
                        return e;
                    })),
                    pageChange: t(n),
                    setupSmartBeacons: t(n)
                });
                Object.defineProperty(window, "_sp_", t(a));
                EventTarget.prototype.addEventListener = function(e) {
                    "sp.blocking" != e && "sp.not_blocking" != e && i.apply(this, arguments);
                };
            }(Object.defineProperties);
            Object.defineProperty(Window.prototype.toString, "a1233e00aac3b1e9bd547e64ca938543", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a1233e00aac3b1e9bd547e64ca938543" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,t,l)=>{try{const e=(new Error).stack;if(e?.includes?.("initAdBlockDetection")&&4===l[0]?.length)return Promise.resolve()}catch(e){}return Reflect.apply(e,t,l)}};window.Promise.allSettled=new Proxy(window.Promise.allSettled,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c2e008a1d6491e8fa4125943a91eb8b8 === e) return;
            (() => {
                const e = {
                    apply: (e, t, r) => {
                        try {
                            const e = (new Error).stack;
                            if (e?.includes?.("initAdBlockDetection") && 4 === r[0]?.length) return Promise.resolve();
                        } catch (e) {}
                        return Reflect.apply(e, t, r);
                    }
                };
                window.Promise.allSettled = new Proxy(window.Promise.allSettled, e);
            })();
            Object.defineProperty(Window.prototype.toString, "c2e008a1d6491e8fa4125943a91eb8b8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c2e008a1d6491e8fa4125943a91eb8b8" due to: ' + e);
        }
    },
    '(()=>{const d={getUserConsentStatusForVendor:()=>!0};window.didomiOnReady=window.didomiOnReady||[],window.didomiOnReady.push=n=>{"function"==typeof n&&n(d)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4f42a63fdc8f353f50712cbd342cc7be"] === e) return;
            (() => {
                const e = {
                    getUserConsentStatusForVendor: () => !0
                };
                window.didomiOnReady = window.didomiOnReady || [], window.didomiOnReady.push = o => {
                    "function" == typeof o && o(e);
                };
            })();
            Object.defineProperty(Window.prototype.toString, "4f42a63fdc8f353f50712cbd342cc7be", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4f42a63fdc8f353f50712cbd342cc7be" due to: ' + e);
        }
    },
    '(()=>{const e={apply:async(e,t,a)=>{if(a[0]&&a[0]?.match(/adsbygoogle|doubleclick|googlesyndication|static\\.cloudflareinsights\\.com\\/beacon\\.min\\.js/)){const e=(e="{}",t="",a="opaque")=>{const n=new Response(e,{statusText:"OK"}),o=String((s=50800,r=50900,Math.floor(Math.random()*(r-s+1)+s)));var s,r;return n.headers.set("Content-Length",o),Object.defineProperties(n,{type:{value:a},status:{value:0},statusText:{value:""},url:{value:""}}),Promise.resolve(n)};return e("{}",a[0])}return Reflect.apply(e,t,a)}};window.fetch=new Proxy(window.fetch,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9dbd26c8d0d4dcb61410c72cac73374e"] === e) return;
            (() => {
                const e = {
                    apply: async (e, t, o) => {
                        if (o[0] && o[0]?.match(/adsbygoogle|doubleclick|googlesyndication|static\.cloudflareinsights\.com\/beacon\.min\.js/)) {
                            const e = (e = "{}", t = "", o = "opaque") => {
                                const c = new Response(e, {
                                    statusText: "OK"
                                }), n = String(Math.floor(101 * Math.random() + 50800));
                                return c.headers.set("Content-Length", n), Object.defineProperties(c, {
                                    type: {
                                        value: o
                                    },
                                    status: {
                                        value: 0
                                    },
                                    statusText: {
                                        value: ""
                                    },
                                    url: {
                                        value: ""
                                    }
                                }), Promise.resolve(c);
                            };
                            return e("{}", o[0]);
                        }
                        return Reflect.apply(e, t, o);
                    }
                };
                window.fetch = new Proxy(window.fetch, e);
            })();
            Object.defineProperty(Window.prototype.toString, "9dbd26c8d0d4dcb61410c72cac73374e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9dbd26c8d0d4dcb61410c72cac73374e" due to: ' + e);
        }
    },
    "window.ad_allowed = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["049921132ffe411b4692a70bec90d335"] === e) return;
            window.ad_allowed = !0;
            Object.defineProperty(Window.prototype.toString, "049921132ffe411b4692a70bec90d335", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "049921132ffe411b4692a70bec90d335" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/google_ads_frame/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["47f456fa4a14a6df26efb37ac4b35e9a"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/google_ads_frame/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "47f456fa4a14a6df26efb37ac4b35e9a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "47f456fa4a14a6df26efb37ac4b35e9a" due to: ' + e);
        }
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/var ad = document\\.querySelector\\("ins\\.adsbygoogle"\\);/.test(a)){ _st(a,b);}};': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8468c20094b47b4c6230a90bb0cf2d54"] === e) return;
            var _st = window.setTimeout;
            window.setTimeout = function(e, t) {
                /var ad = document\.querySelector\("ins\.adsbygoogle"\);/.test(e) || _st(e, t);
            };
            Object.defineProperty(Window.prototype.toString, "8468c20094b47b4c6230a90bb0cf2d54", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8468c20094b47b4c6230a90bb0cf2d54" due to: ' + e);
        }
    },
    "document.avp_ready = 1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1cd8368bac9abff3d844c605b628fee9"] === e) return;
            document.avp_ready = 1;
            Object.defineProperty(Window.prototype.toString, "1cd8368bac9abff3d844c605b628fee9", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1cd8368bac9abff3d844c605b628fee9" due to: ' + e);
        }
    },
    "window.ADTECH = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e42f31b21c3855d599c00a3f8701ede6 === e) return;
            window.ADTECH = function() {};
            Object.defineProperty(Window.prototype.toString, "e42f31b21c3855d599c00a3f8701ede6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e42f31b21c3855d599c00a3f8701ede6" due to: ' + e);
        }
    },
    "fuckAdBlock = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["5c3f48e3f24ff8813da9609a53a72433"] === e) return;
            fuckAdBlock = function() {};
            Object.defineProperty(Window.prototype.toString, "5c3f48e3f24ff8813da9609a53a72433", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "5c3f48e3f24ff8813da9609a53a72433" due to: ' + e);
        }
    },
    "window.IM = [1,2,3];": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6e0b841e576ac763f81d5c219813906b"] === e) return;
            window.IM = [ 1, 2, 3 ];
            Object.defineProperty(Window.prototype.toString, "6e0b841e576ac763f81d5c219813906b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6e0b841e576ac763f81d5c219813906b" due to: ' + e);
        }
    },
    "window.google_jobrunner = function() { };": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c155982f45f07c347701b45fce31f5d3 === e) return;
            window.google_jobrunner = function() {};
            Object.defineProperty(Window.prototype.toString, "c155982f45f07c347701b45fce31f5d3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c155982f45f07c347701b45fce31f5d3" due to: ' + e);
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return !Number.isNaN(g)&&/\\$\\('#l'\\+|#linkdiv/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["009922e6198163d89edac4a47ce341c7"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    return !Number.isNaN(o) && /\$\('#l'\+|#linkdiv/.test(t.toString()) && (o *= .01), 
                    e.apply(this, arguments);
                }.bind(window);
            }();
            Object.defineProperty(Window.prototype.toString, "009922e6198163d89edac4a47ce341c7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "009922e6198163d89edac4a47ce341c7" due to: ' + e);
        }
    },
    "window.blockAdBlock = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7b0fe49ca4878b71af2e77dfe4259f5a"] === e) return;
            window.blockAdBlock = function() {};
            Object.defineProperty(Window.prototype.toString, "7b0fe49ca4878b71af2e77dfe4259f5a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7b0fe49ca4878b71af2e77dfe4259f5a" due to: ' + e);
        }
    },
    '(()=>{let t;const e={apply:(e,o,c)=>{try{const r=c[0],l=c[1];let y;try{y=t?.getNitroStateValue()}catch{return Reflect.apply(e,o,c)}if(y&&"object"==typeof r&&null!==r&&1===Object.keys(r).length&&"number"==typeof Object.values(r)[0]&&"object"==typeof l&&null!==l&&(n=l,Object.values(n).some((t=>{if("function"==typeof t&&t.toString().includes("]:!0}"))return!0})))){const[t]=Object.keys(r);void 0!==t&&Reflect.set(r,t,y+1)}}catch(t){}var n;return Reflect.apply(e,o,c)}};window.Object.is=new Proxy(window.Object.is,e);const o={apply:(e,o,c)=>{try{const e=c[0],o=c[1];!t&&e&&o&&"object"==typeof e&&"Module"===e[Symbol.toStringTag]&&"string"==typeof o&&"NitroScript"===o&&(t=e)}catch(t){}return Reflect.apply(e,o,c)}};window.Object.defineProperty=new Proxy(window.Object.defineProperty,o)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b990af6625716f6d6fe45948d5a5b4fa === e) return;
            (() => {
                let e;
                const t = {
                    apply: (t, o, r) => {
                        try {
                            const c = r[0], f = r[1];
                            let i;
                            try {
                                i = e?.getNitroStateValue();
                            } catch {
                                return Reflect.apply(t, o, r);
                            }
                            if (i && "object" == typeof c && null !== c && 1 === Object.keys(c).length && "number" == typeof Object.values(c)[0] && "object" == typeof f && null !== f && (n = f, 
                            Object.values(n).some((e => {
                                if ("function" == typeof e && e.toString().includes("]:!0}")) return !0;
                            })))) {
                                const [e] = Object.keys(c);
                                void 0 !== e && Reflect.set(c, e, i + 1);
                            }
                        } catch (e) {}
                        var n;
                        return Reflect.apply(t, o, r);
                    }
                };
                window.Object.is = new Proxy(window.Object.is, t);
                const o = {
                    apply: (t, o, r) => {
                        try {
                            const t = r[0], o = r[1];
                            !e && t && o && "object" == typeof t && "Module" === t[Symbol.toStringTag] && "string" == typeof o && "NitroScript" === o && (e = t);
                        } catch (e) {}
                        return Reflect.apply(t, o, r);
                    }
                };
                window.Object.defineProperty = new Proxy(window.Object.defineProperty, o);
            })();
            Object.defineProperty(Window.prototype.toString, "b990af6625716f6d6fe45948d5a5b4fa", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b990af6625716f6d6fe45948d5a5b4fa" due to: ' + e);
        }
    },
    '!function(){const e={apply:(e,t,o)=>{const i=o[1];if(!i||"object"!=typeof i.QiyiPlayerProphetData)return Reflect.apply(e,t,o)}};window.Object.defineProperties=new Proxy(window.Object.defineProperties,e)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["545a0289c2a1afd8dd9039c82074c2b7"] === e) return;
            !function() {
                const e = {
                    apply: (e, t, o) => {
                        const r = o[1];
                        if (!r || "object" != typeof r.QiyiPlayerProphetData) return Reflect.apply(e, t, o);
                    }
                };
                window.Object.defineProperties = new Proxy(window.Object.defineProperties, e);
            }();
            Object.defineProperty(Window.prototype.toString, "545a0289c2a1afd8dd9039c82074c2b7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "545a0289c2a1afd8dd9039c82074c2b7" due to: ' + e);
        }
    },
    "!function(){const s={apply:(c,e,n)=>(n[0]?.adSlots&&(n[0].adSlots=[]),n[1]?.success&&(n[1].success=new Proxy(n[1].success,s)),Reflect.apply(c,e,n))};window.Object.assign=new Proxy(window.Object.assign,s)}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7c9eb641391ed7a82e455b87f3672582"] === e) return;
            !function() {
                const e = {
                    apply: (o, t, n) => (n[0]?.adSlots && (n[0].adSlots = []), n[1]?.success && (n[1].success = new Proxy(n[1].success, e)), 
                    Reflect.apply(o, t, n))
                };
                window.Object.assign = new Proxy(window.Object.assign, e);
            }();
            Object.defineProperty(Window.prototype.toString, "7c9eb641391ed7a82e455b87f3672582", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7c9eb641391ed7a82e455b87f3672582" due to: ' + e);
        }
    },
    "\"use strict\"; window.MutationObserver = new Proxy(window.MutationObserver, { construct(Target, Args) { let Stringified = Args[0].toString(); if (Stringified.includes('cs:') && Stringified.includes('gl:') && Stringified.includes('ne:') && Stringified.includes('dg:')) { return Reflect.construct(Target, [() => {}]); } return Reflect.construct(Target, Args); } });": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c287d35369268f7ace0d483cc8ca2199 === e) return;
            window.MutationObserver = new Proxy(window.MutationObserver, {
                construct(e, c) {
                    let t = c[0].toString();
                    return t.includes("cs:") && t.includes("gl:") && t.includes("ne:") && t.includes("dg:") ? Reflect.construct(e, [ () => {} ]) : Reflect.construct(e, c);
                }
            });
            Object.defineProperty(Window.prototype.toString, "c287d35369268f7ace0d483cc8ca2199", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c287d35369268f7ace0d483cc8ca2199" due to: ' + e);
        }
    },
    "\"use strict\"; window.Function.prototype.apply = new Proxy(window.Function.prototype.apply, { apply(Target, ThisArg, Args) { let FunctionContext = ThisArg.toString(); if (FunctionContext.includes('veta') && FunctionContext.includes('http') && FunctionContext.includes('/gfp/') && FunctionContext.includes('().mark((')) { return Reflect.apply(Target, async () => false, []); } return Reflect.apply(Target, ThisArg, Args); } });": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2eb1c0de2ccaf6cb36c187f9ae65492e"] === e) return;
            window.Function.prototype.apply = new Proxy(window.Function.prototype.apply, {
                apply(e, t, c) {
                    let n = t.toString();
                    return n.includes("veta") && n.includes("http") && n.includes("/gfp/") && n.includes("().mark((") ? Reflect.apply(e, (async () => !1), []) : Reflect.apply(e, t, c);
                }
            });
            Object.defineProperty(Window.prototype.toString, "2eb1c0de2ccaf6cb36c187f9ae65492e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2eb1c0de2ccaf6cb36c187f9ae65492e" due to: ' + e);
        }
    },
    '(()=>{const e=document.documentElement;new MutationObserver((()=>{const e=document.querySelector(\'body > div[role="dialog"].neon-border-purple > p.text-center + button.neon-button-purple\');e&&e.textContent.includes("I Understand")&&e.click()})).observe(e,{attributes:!0,childList:!0,subtree:!0})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7ff1ec00ee1e83864c8bcaba82126a50"] === e) return;
            (() => {
                const e = document.documentElement;
                new MutationObserver((() => {
                    const e = document.querySelector('body > div[role="dialog"].neon-border-purple > p.text-center + button.neon-button-purple');
                    e && e.textContent.includes("I Understand") && e.click();
                })).observe(e, {
                    attributes: !0,
                    childList: !0,
                    subtree: !0
                });
            })();
            Object.defineProperty(Window.prototype.toString, "7ff1ec00ee1e83864c8bcaba82126a50", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7ff1ec00ee1e83864c8bcaba82126a50" due to: ' + e);
        }
    },
    'document.cookie="popup=9999999999999; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.dd5fb4eeed8b7505e5767b7045cb23cc === e) return;
            document.cookie = "popup=9999999999999; path=/;";
            Object.defineProperty(Window.prototype.toString, "dd5fb4eeed8b7505e5767b7045cb23cc", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "dd5fb4eeed8b7505e5767b7045cb23cc" due to: ' + e);
        }
    },
    'document.cookie="overlay-geschenk=donotshowfor7days; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c244d6b503d07944e92dae676220ac14 === e) return;
            document.cookie = "overlay-geschenk=donotshowfor7days; path=/;";
            Object.defineProperty(Window.prototype.toString, "c244d6b503d07944e92dae676220ac14", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c244d6b503d07944e92dae676220ac14" due to: ' + e);
        }
    },
    'document.cookie="popupSubscription=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["07e3ab9b26da8896b57fb83067364723"] === e) return;
            document.cookie = "popupSubscription=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "07e3ab9b26da8896b57fb83067364723", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "07e3ab9b26da8896b57fb83067364723" due to: ' + e);
        }
    },
    'document.cookie="hide_footer_login_layer=T; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6610b2172699f352e936bdda56179645"] === e) return;
            document.cookie = "hide_footer_login_layer=T; path=/;";
            Object.defineProperty(Window.prototype.toString, "6610b2172699f352e936bdda56179645", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6610b2172699f352e936bdda56179645" due to: ' + e);
        }
    },
    '!function(){const t={apply:(t,e,n)=>{if(n[0]&&"function"==typeof n[0])try{if(n[0].toString().includes("LOGIN_FORCE_TIME"))return}catch(t){console.trace(t)}return Reflect.apply(t,e,n)}},e=new Proxy(window.setTimeout,t);Object.defineProperty(window,"setTimeout",{set:function(){},get:function(){return e}})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.af15a185bba3bf6f247f74549465a83e === e) return;
            !function() {
                const e = {
                    apply: (e, t, n) => {
                        if (n[0] && "function" == typeof n[0]) try {
                            if (n[0].toString().includes("LOGIN_FORCE_TIME")) return;
                        } catch (e) {
                            console.trace(e);
                        }
                        return Reflect.apply(e, t, n);
                    }
                }, t = new Proxy(window.setTimeout, e);
                Object.defineProperty(window, "setTimeout", {
                    set: function() {},
                    get: function() {
                        return t;
                    }
                });
            }();
            Object.defineProperty(Window.prototype.toString, "af15a185bba3bf6f247f74549465a83e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "af15a185bba3bf6f247f74549465a83e" due to: ' + e);
        }
    },
    "(function(){window.setTimeout=new Proxy(window.setTimeout,{apply:(a,b,c)=>c&&c[0]&&/SkipMsg\\(\\)/.test(c[0].toString())&&c[1]?(c[1]=1,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)})})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ddae51deac37af19fec2771965b890e1 === e) return;
            window.setTimeout = new Proxy(window.setTimeout, {
                apply: (e, t, o) => o && o[0] && /SkipMsg\(\)/.test(o[0].toString()) && o[1] ? (o[1] = 1, 
                Reflect.apply(e, t, o)) : Reflect.apply(e, t, o)
            });
            Object.defineProperty(Window.prototype.toString, "ddae51deac37af19fec2771965b890e1", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ddae51deac37af19fec2771965b890e1" due to: ' + e);
        }
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ips4_bacalltoactionpopup="+b})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["21f664952df8e1eaf1fb9a92db8b174e"] === e) return;
            !function() {
                var e = (new Date).getTime();
                document.cookie = "ips4_bacalltoactionpopup=" + e;
            }();
            Object.defineProperty(Window.prototype.toString, "21f664952df8e1eaf1fb9a92db8b174e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "21f664952df8e1eaf1fb9a92db8b174e" due to: ' + e);
        }
    },
    "if (window.PushManager) { window.PushManager.prototype.subscribe = function () { return { then: function (func) { } }; }; }": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f271f5a04b96c738d8491cb877889952 === e) return;
            window.PushManager && (window.PushManager.prototype.subscribe = function() {
                return {
                    then: function(e) {}
                };
            });
            Object.defineProperty(Window.prototype.toString, "f271f5a04b96c738d8491cb877889952", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f271f5a04b96c738d8491cb877889952" due to: ' + e);
        }
    },
    '(()=>{const t={construct:(t,e,n)=>{const r=e[0],o=r?.toString(),c=o?.includes("e[0].intersectionRatio");return c&&(e[0]=()=>{}),Reflect.construct(t,e,n)}};window.IntersectionObserver=new Proxy(window.IntersectionObserver,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c12b1283487b21a0e823718579c18ede === e) return;
            (() => {
                const e = {
                    construct: (e, t, r) => {
                        const n = t[0], o = n?.toString(), c = o?.includes("e[0].intersectionRatio");
                        return c && (t[0] = () => {}), Reflect.construct(e, t, r);
                    }
                };
                window.IntersectionObserver = new Proxy(window.IntersectionObserver, e);
            })();
            Object.defineProperty(Window.prototype.toString, "c12b1283487b21a0e823718579c18ede", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c12b1283487b21a0e823718579c18ede" due to: ' + e);
        }
    },
    '(function(){var b=document.addEventListener;document.addEventListener=function(c,a,d){if(a&&-1==a.toString().indexOf("adsBlocked"))return b(c,a,d)}.bind(window)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["62c4837e2d6ffab7f90fde5590cc73ab"] === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, r) {
                    if (n && -1 == n.toString().indexOf("adsBlocked")) return e(t, n, r);
                }.bind(window);
            }();
            Object.defineProperty(Window.prototype.toString, "62c4837e2d6ffab7f90fde5590cc73ab", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "62c4837e2d6ffab7f90fde5590cc73ab" due to: ' + e);
        }
    },
    '(function(b){Object.defineProperty(Element.prototype,"innerHTML",{get:function(){return b.get.call(this)},set:function(a){/^(?:<([abisuq]) id="[^"]*"><\\/\\1>)*$/.test(a)||b.set.call(this,a)},enumerable:!0,configurable:!0})})(Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML"));': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a45ed61db8e971a6cfde1b21ffc65573 === e) return;
            !function(e) {
                Object.defineProperty(Element.prototype, "innerHTML", {
                    get: function() {
                        return e.get.call(this);
                    },
                    set: function(t) {
                        /^(?:<([abisuq]) id="[^"]*"><\/\1>)*$/.test(t) || e.set.call(this, t);
                    },
                    enumerable: !0,
                    configurable: !0
                });
            }(Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML"));
            Object.defineProperty(Window.prototype.toString, "a45ed61db8e971a6cfde1b21ffc65573", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a45ed61db8e971a6cfde1b21ffc65573" due to: ' + e);
        }
    },
    '(function(a){Object.defineProperty(window,"upManager",{get:function(){return{push:a,register:a,fireNow:a,start:a}},set:function(a){if(!(a instanceof Error))throw Error();}})})(function(){});': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e7cde92d3ed85b2159f3eefcc50b7ab6 === e) return;
            !function(e) {
                Object.defineProperty(window, "upManager", {
                    get: function() {
                        return {
                            push: e,
                            register: e,
                            fireNow: e,
                            start: e
                        };
                    },
                    set: function(e) {
                        if (!(e instanceof Error)) throw Error();
                    }
                });
            }((function() {}));
            Object.defineProperty(Window.prototype.toString, "e7cde92d3ed85b2159f3eefcc50b7ab6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e7cde92d3ed85b2159f3eefcc50b7ab6" due to: ' + e);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8d3f556a4543374ea8319bc03583025f"] === e) return;
            !function() {
                var e = XMLHttpRequest.prototype.open, t = /[/.@](piguiqproxy\.com|rcdn\.pro|amgload\.net|dsn-fishki\.ru|v6t39t\.ru|greencuttlefish\.com|rgy1wk\.ru|vt4dlx\.ru|d38dub\.ru)[:/]/i;
                XMLHttpRequest.prototype.open = function(r, o) {
                    if ("GET" !== r || !t.test(o)) return e.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "8d3f556a4543374ea8319bc03583025f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8d3f556a4543374ea8319bc03583025f" due to: ' + e);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru|csp-oz66pp\\.ru|ok9ydq\\.ru|kingoablc\\.com)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["22514194ad8441cc56e68716b1f75f69"] === e) return;
            !function() {
                var e = XMLHttpRequest.prototype.open, t = /[/.@](piguiqproxy\.com|rcdn\.pro|amgload\.net|dsn-fishki\.ru|v6t39t\.ru|greencuttlefish\.com|rgy1wk\.ru|vt4dlx\.ru|d38dub\.ru|csp-oz66pp\.ru|ok9ydq\.ru|kingoablc\.com)[:/]/i;
                XMLHttpRequest.prototype.open = function(r, o) {
                    if ("GET" !== r || !t.test(o)) return e.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "22514194ad8441cc56e68716b1f75f69", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "22514194ad8441cc56e68716b1f75f69" due to: ' + e);
        }
    },
    '(()=>{const e=()=>{},t=function(){return this},n=()=>null,o=()=>[],r=new Map,i=new Map,s=new Map,a=new Map,d=new Map,l=new Map,g=function(e,t){return d.has(e)||d.set(e,new Set),d.get(e).add(t),this},c=function(e,t){return!!d.has(e)&&d.get(e).delete(t)},p=(e,t)=>new Promise((n=>{requestAnimationFrame((()=>{const o=[0,0],r=d.get(e)||[],i=Array.from(r);for(let e=0;e<i.length;e+=1)i[e]({isEmpty:!0,size:o,slot:t});n()}))})),m=e=>{if(!e)return;const t=e.getSlotElementId();if(!document.getElementById(t))return p("rewardedSlotGranted",e),void setTimeout((()=>p("rewardedSlotClosed",e)),5e3);const n=document.getElementById(t);n&&n.appendChild(document.createElement("div")),(e=>{const t=document.getElementById(e.getSlotElementId());for(;t?.lastChild;)t.lastChild.remove()})(e),(e=>{const t=`google_ads_iframe_${e.getId()}`;document.getElementById(t)?.remove();const n=document.getElementById(e.getSlotElementId());if(n){const e=document.createElement("iframe");e.id=t,e.srcdoc="<body></body>",e.style="position:absolute; width:0; height:0; left:0; right:0; z-index:-1; border:0",e.setAttribute("width",0),e.setAttribute("height",0),e.setAttribute("data-load-complete",!0),e.setAttribute("data-google-container-id",!0),e.setAttribute("sandbox",""),n.appendChild(e)}})(e),p("slotRenderEnded",e),p("slotRequested",e),p("slotResponseReceived",e),p("slotOnload",e),p("impressionViewable",e)},u={addEventListener:g,removeEventListener:c,enableSyncLoading:e,setRefreshUnfilledSlots:e,getSlots:o},y={addEventListener:g,removeEventListener:c,setContent:e};function f(){}function E(){}f.prototype.display=e,f.prototype.get=n,f.prototype.set=t,f.prototype.setClickUrl=t,f.prototype.setTagForChildDirectedTreatment=t,f.prototype.setTargeting=t,f.prototype.updateTargetingFromMap=t,E.prototype.addSize=t,E.prototype.build=n;const h=e=>{if("string"==typeof e)return[e];try{return Array.prototype.flat.call(e)}catch{}return[]},b=(e,n,o)=>{if(i.has(o))return document.getElementById(o)?.remove(),i.get(o);const d=new Map,g=new Map,c=new Set,p={advertiserId:void 0,campaignId:void 0,creativeId:void 0,creativeTemplateId:void 0,lineItemId:void 0},m=[{getHeight:()=>2,getWidth:()=>2}],u=(s.get(e)||0)+1;s.set(e,u);const y=`${e}_${u}`;let f="",E=null;const b=new Set,S={addService:e=>(b.add(e),S),clearCategoryExclusions:t,clearTargeting(e){void 0===e?g.clear():g.delete(e)},defineSizeMapping(e){return a.set(o,e),this},get:e=>d.get(e),getAdUnitPath:()=>e,getAttributeKeys:()=>Array.from(d.keys()),getCategoryExclusions:()=>Array.from(c),getClickUrl:()=>f,getCollapseEmptyDiv:()=>E,getContentUrl:()=>"",getDivStartsCollapsed:()=>null,getDomId:()=>o,getEscapedQemQueryId:()=>"",getFirstLook:()=>0,getId:()=>y,getHtml:()=>"",getName:()=>y,getOutOfPage:()=>!1,getResponseInformation:()=>p,getServices:()=>Array.from(b),getSizes:()=>m,getSlotElementId:()=>o,getSlotId:()=>S,getTargeting:e=>g.get(e)||l.get(e)||[],getTargetingKeys:()=>Array.from(new Set(Array.of(...l.keys(),...g.keys()))),getTargetingMap:()=>Object.assign(Object.fromEntries(l.entries()),Object.fromEntries(g.entries())),set:(e,t)=>(d.set(e,t),S),setCategoryExclusion:e=>(c.add(e),S),setClickUrl:e=>(f=e,S),setCollapseEmptyDiv:e=>(E=!!e,S),setSafeFrameConfig:t,setTagForChildDirectedTreatment:t,setTargeting:(e,t)=>(g.set(e,h(t)),S),toString:()=>y,updateTargetingFromMap:e=>(((e,t)=>{if("object"==typeof t)for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e.set(n,h(t[n]))})(g,e),S)};return r.set(e,S),i.set(o,S),a.set(o,n),S},S={addEventListener:g,removeEventListener:c,clear:e,clearCategoryExclusions:t,clearTagForChildDirectedTreatment:t,clearTargeting(e){void 0===e?l.clear():l.delete(e)},collapseEmptyDivs:e,defineOutOfPagePassback:()=>new f,definePassback:()=>new f,disableInitialLoad:e,display:e,enableAsyncRendering:e,enableLazyLoad:e,enableSingleRequest:e,enableSyncRendering:e,enableVideoAds:e,get:n,getAttributeKeys:o,getTargeting:o,getTargetingKeys:o,getSlots:o,isInitialLoadDisabled:()=>!0,refresh:e,set:t,setCategoryExclusion:t,setCentering:e,setCookieOptions:t,setForceSafeFrame:t,setLocation:t,setPrivacySettings:t,setPublisherProvidedId:t,setRequestNonPersonalizedAds:t,setSafeFrameConfig:t,setTagForChildDirectedTreatment:t,setTargeting:t,setVideoContent:t,updateCorrelator:e},{googletag:v={}}=window,{cmd:C=[]}=v;for(v.apiReady=!0,v.cmd=[],v.cmd.push=e=>{try{e()}catch(e){console.trace(e)}return 1},v.companionAds=()=>u,v.content=()=>y,v.defineOutOfPageSlot=b,v.defineSlot=b,v.destroySlots=function(){r.clear(),i.clear()},v.disablePublisherConsole=e,v.display=function(e){let t;t=e?.getSlotElementId?e.getSlotElementId():e?.nodeType?e.id:String(e),m(i.get(t))},v.enableServices=e,v.getVersion=()=>"",v.pubads=()=>S,v.pubadsReady=!0,v.setAdIframeTitle=e,v.sizeMapping=()=>new E,v.enums={OutOfPageFormat:{REWARDED:"REWARDED"}},window.googletag=v;0!==C.length;)v.cmd.push(C.shift())})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["3fed16eb400f779de1afec5bc42b57fc"] === e) return;
            (() => {
                const e = () => {}, t = function() {
                    return this;
                }, n = () => null, r = () => [], o = new Map, i = new Map, a = new Map, s = new Map, d = new Map, l = new Map, g = function(e, t) {
                    return d.has(e) || d.set(e, new Set), d.get(e).add(t), this;
                }, c = function(e, t) {
                    return !!d.has(e) && d.get(e).delete(t);
                }, p = (e, t) => new Promise((n => {
                    requestAnimationFrame((() => {
                        const r = [ 0, 0 ], o = d.get(e) || [], i = Array.from(o);
                        for (let e = 0; e < i.length; e += 1) i[e]({
                            isEmpty: !0,
                            size: r,
                            slot: t
                        });
                        n();
                    }));
                })), m = {
                    addEventListener: g,
                    removeEventListener: c,
                    enableSyncLoading: e,
                    setRefreshUnfilledSlots: e,
                    getSlots: r
                }, u = {
                    addEventListener: g,
                    removeEventListener: c,
                    setContent: e
                };
                function f() {}
                function y() {}
                f.prototype.display = e, f.prototype.get = n, f.prototype.set = t, f.prototype.setClickUrl = t, 
                f.prototype.setTagForChildDirectedTreatment = t, f.prototype.setTargeting = t, f.prototype.updateTargetingFromMap = t, 
                y.prototype.addSize = t, y.prototype.build = n;
                const b = e => {
                    if ("string" == typeof e) return [ e ];
                    try {
                        return Array.prototype.flat.call(e);
                    } catch {}
                    return [];
                }, h = (e, n, r) => {
                    if (i.has(r)) return document.getElementById(r)?.remove(), i.get(r);
                    const d = new Map, g = new Map, c = new Set, p = {
                        advertiserId: void 0,
                        campaignId: void 0,
                        creativeId: void 0,
                        creativeTemplateId: void 0,
                        lineItemId: void 0
                    }, m = [ {
                        getHeight: () => 2,
                        getWidth: () => 2
                    } ], u = (a.get(e) || 0) + 1;
                    a.set(e, u);
                    const f = `${e}_${u}`;
                    let y = "", h = null;
                    const E = new Set, S = {
                        addService: e => (E.add(e), S),
                        clearCategoryExclusions: t,
                        clearTargeting(e) {
                            void 0 === e ? g.clear() : g.delete(e);
                        },
                        defineSizeMapping(e) {
                            return s.set(r, e), this;
                        },
                        get: e => d.get(e),
                        getAdUnitPath: () => e,
                        getAttributeKeys: () => Array.from(d.keys()),
                        getCategoryExclusions: () => Array.from(c),
                        getClickUrl: () => y,
                        getCollapseEmptyDiv: () => h,
                        getContentUrl: () => "",
                        getDivStartsCollapsed: () => null,
                        getDomId: () => r,
                        getEscapedQemQueryId: () => "",
                        getFirstLook: () => 0,
                        getId: () => f,
                        getHtml: () => "",
                        getName: () => f,
                        getOutOfPage: () => !1,
                        getResponseInformation: () => p,
                        getServices: () => Array.from(E),
                        getSizes: () => m,
                        getSlotElementId: () => r,
                        getSlotId: () => S,
                        getTargeting: e => g.get(e) || l.get(e) || [],
                        getTargetingKeys: () => Array.from(new Set(Array.of(...l.keys(), ...g.keys()))),
                        getTargetingMap: () => Object.assign(Object.fromEntries(l.entries()), Object.fromEntries(g.entries())),
                        set: (e, t) => (d.set(e, t), S),
                        setCategoryExclusion: e => (c.add(e), S),
                        setClickUrl: e => (y = e, S),
                        setCollapseEmptyDiv: e => (h = !!e, S),
                        setSafeFrameConfig: t,
                        setTagForChildDirectedTreatment: t,
                        setTargeting: (e, t) => (g.set(e, b(t)), S),
                        toString: () => f,
                        updateTargetingFromMap: e => (((e, t) => {
                            if ("object" == typeof t) for (const n in t) Object.prototype.hasOwnProperty.call(t, n) && e.set(n, b(t[n]));
                        })(g, e), S)
                    };
                    return o.set(e, S), i.set(r, S), s.set(r, n), S;
                }, E = {
                    addEventListener: g,
                    removeEventListener: c,
                    clear: e,
                    clearCategoryExclusions: t,
                    clearTagForChildDirectedTreatment: t,
                    clearTargeting(e) {
                        void 0 === e ? l.clear() : l.delete(e);
                    },
                    collapseEmptyDivs: e,
                    defineOutOfPagePassback: () => new f,
                    definePassback: () => new f,
                    disableInitialLoad: e,
                    display: e,
                    enableAsyncRendering: e,
                    enableLazyLoad: e,
                    enableSingleRequest: e,
                    enableSyncRendering: e,
                    enableVideoAds: e,
                    get: n,
                    getAttributeKeys: r,
                    getTargeting: r,
                    getTargetingKeys: r,
                    getSlots: r,
                    isInitialLoadDisabled: () => !0,
                    refresh: e,
                    set: t,
                    setCategoryExclusion: t,
                    setCentering: e,
                    setCookieOptions: t,
                    setForceSafeFrame: t,
                    setLocation: t,
                    setPrivacySettings: t,
                    setPublisherProvidedId: t,
                    setRequestNonPersonalizedAds: t,
                    setSafeFrameConfig: t,
                    setTagForChildDirectedTreatment: t,
                    setTargeting: t,
                    setVideoContent: t,
                    updateCorrelator: e
                }, {googletag: S = {}} = window, {cmd: v = []} = S;
                for (S.apiReady = !0, S.cmd = [], S.cmd.push = e => {
                    try {
                        e();
                    } catch (e) {
                        console.trace(e);
                    }
                    return 1;
                }, S.companionAds = () => m, S.content = () => u, S.defineOutOfPageSlot = h, S.defineSlot = h, 
                S.destroySlots = function() {
                    o.clear(), i.clear();
                }, S.disablePublisherConsole = e, S.display = function(e) {
                    let t;
                    t = e?.getSlotElementId ? e.getSlotElementId() : e?.nodeType ? e.id : String(e), 
                    (e => {
                        if (!e) return;
                        const t = e.getSlotElementId();
                        if (!document.getElementById(t)) return p("rewardedSlotGranted", e), void setTimeout((() => p("rewardedSlotClosed", e)), 5e3);
                        const n = document.getElementById(t);
                        n && n.appendChild(document.createElement("div")), (e => {
                            const t = document.getElementById(e.getSlotElementId());
                            for (;t?.lastChild; ) t.lastChild.remove();
                        })(e), (e => {
                            const t = `google_ads_iframe_${e.getId()}`;
                            document.getElementById(t)?.remove();
                            const n = document.getElementById(e.getSlotElementId());
                            if (n) {
                                const e = document.createElement("iframe");
                                e.id = t, e.srcdoc = "<body></body>", e.style = "position:absolute; width:0; height:0; left:0; right:0; z-index:-1; border:0", 
                                e.setAttribute("width", 0), e.setAttribute("height", 0), e.setAttribute("data-load-complete", !0), 
                                e.setAttribute("data-google-container-id", !0), e.setAttribute("sandbox", ""), n.appendChild(e);
                            }
                        })(e), p("slotRenderEnded", e), p("slotRequested", e), p("slotResponseReceived", e), 
                        p("slotOnload", e), p("impressionViewable", e);
                    })(i.get(t));
                }, S.enableServices = e, S.getVersion = () => "", S.pubads = () => E, S.pubadsReady = !0, 
                S.setAdIframeTitle = e, S.sizeMapping = () => new y, S.enums = {
                    OutOfPageFormat: {
                        REWARDED: "REWARDED"
                    }
                }, window.googletag = S; 0 !== v.length; ) S.cmd.push(v.shift());
            })();
            Object.defineProperty(Window.prototype.toString, "3fed16eb400f779de1afec5bc42b57fc", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "3fed16eb400f779de1afec5bc42b57fc" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,n,o)=>{try{const t=n,e=o[0];if("{}"===t&&"google"===e)return!0}catch(t){}return Reflect.apply(t,n,o)}};window.String.prototype.includes=new Proxy(window.String.prototype.includes,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6212dddf8146db41c33f7121175843aa"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, r) => {
                        try {
                            const e = t, o = r[0];
                            if ("{}" === e && "google" === o) return !0;
                        } catch (e) {}
                        return Reflect.apply(e, t, r);
                    }
                };
                window.String.prototype.includes = new Proxy(window.String.prototype.includes, e);
            })();
            Object.defineProperty(Window.prototype.toString, "6212dddf8146db41c33f7121175843aa", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6212dddf8146db41c33f7121175843aa" due to: ' + e);
        }
    },
    '(()=>{window.GADS={init:function(n){n&&"function"==typeof n.onFinish&&n.onFinish()}};})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c2ffc94b6ce8e97f2c432d64690cfc9d === e) return;
            window.GADS = {
                init: function(e) {
                    e && "function" == typeof e.onFinish && e.onFinish();
                }
            };
            Object.defineProperty(Window.prototype.toString, "c2ffc94b6ce8e97f2c432d64690cfc9d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c2ffc94b6ce8e97f2c432d64690cfc9d" due to: ' + e);
        }
    },
    '(()=>{const a=function(a){"function"==typeof a&&a()};window.aiptag={adplayer:"",cmd:[]},window.aiptag.cmd.player=[],window.aiptag.cmd.display=[],window.aiptag.cmd.push=a,window.aiptag.cmd.player.push=a,window.aiptag.cmd.display.push=a,window.aipDisplayTag={display:function(){}},window.aipPlayer=function(a){a&&a.AIP_COMPLETE&&(this.startPreRoll=a.AIP_COMPLETE)}})();': () => {
        try {
            const a = "done";
            if (Window.prototype.toString["8e9df515585941ac85187baf28cedac1"] === a) return;
            (() => {
                const a = function(a) {
                    "function" == typeof a && a();
                };
                window.aiptag = {
                    adplayer: "",
                    cmd: []
                }, window.aiptag.cmd.player = [], window.aiptag.cmd.display = [], window.aiptag.cmd.push = a, 
                window.aiptag.cmd.player.push = a, window.aiptag.cmd.display.push = a, window.aipDisplayTag = {
                    display: function() {}
                }, window.aipPlayer = function(a) {
                    a && a.AIP_COMPLETE && (this.startPreRoll = a.AIP_COMPLETE);
                };
            })();
            Object.defineProperty(Window.prototype.toString, "8e9df515585941ac85187baf28cedac1", {
                value: a,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (a) {
            console.error('Error executing AG js rule with uniqueId "8e9df515585941ac85187baf28cedac1" due to: ' + a);
        }
    },
    '((e="",t="",o="basic",s="",n)=>{const r={apply:(r,a,u)=>{try{let r="";const a=u[0],c=u[1]?.method||"";let l=!1;if("string"==typeof a&&a.includes(e)&&c.toLowerCase()===t.toLowerCase()?(r=a,l=!0):a instanceof Request&&a.url.includes(e)&&a.method.toLowerCase()===t.toLowerCase()&&(r=a.url,l=!0),l){const e=((e,t)=>{try{if(void 0===e||"cors"===e||"no-cors"===e)return new URL(t).origin===document.location.origin?"basic":"no-cors"===e?"opaque":"cors"}catch(e){}})(o,r),t=((e,t)=>{const o=e||"",n=new Response(s,{headers:{"Content-Length":`${s.length}`},status:200,statusText:"OK"});return"opaque"===t?Object.defineProperties(n,{body:{value:null},status:{value:0},ok:{value:!1},statusText:{value:""},url:{value:""},type:{value:t}}):Object.defineProperties(n,{url:{value:o},type:{value:t}}),n})(r,e);return n?new Promise((e=>{setTimeout((()=>{e(t)}),n)})):Promise.resolve(t)}}catch(e){}return Reflect.apply(r,a,u)}};window.fetch=new Proxy(window.fetch,r)})("https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299","HEAD","no-cors","",121);': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1f0bbc3c2e54b7a0357e267459f444cd"] === e) return;
            ((e = "", t = "", o = "basic", r = "", n) => {
                const c = {
                    apply: (c, s, a) => {
                        try {
                            let c = "";
                            const s = a[0], u = a[1]?.method || "";
                            let i = !1;
                            if ("string" == typeof s && s.includes(e) && u.toLowerCase() === t.toLowerCase() ? (c = s, 
                            i = !0) : s instanceof Request && s.url.includes(e) && s.method.toLowerCase() === t.toLowerCase() && (c = s.url, 
                            i = !0), i) {
                                const e = ((e, t) => {
                                    try {
                                        if (void 0 === e || "cors" === e || "no-cors" === e) return new URL(t).origin === document.location.origin ? "basic" : "no-cors" === e ? "opaque" : "cors";
                                    } catch (e) {}
                                })(o, c), t = ((e, t) => {
                                    const o = e || "", n = new Response(r, {
                                        headers: {
                                            "Content-Length": `${r.length}`
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
                                            value: o
                                        },
                                        type: {
                                            value: t
                                        }
                                    }), n;
                                })(c, e);
                                return n ? new Promise((e => {
                                    setTimeout((() => {
                                        e(t);
                                    }), n);
                                })) : Promise.resolve(t);
                            }
                        } catch (e) {}
                        return Reflect.apply(c, s, a);
                    }
                };
                window.fetch = new Proxy(window.fetch, c);
            })("https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299", "HEAD", "no-cors", "", 121);
            Object.defineProperty(Window.prototype.toString, "1f0bbc3c2e54b7a0357e267459f444cd", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1f0bbc3c2e54b7a0357e267459f444cd" due to: ' + e);
        }
    },
    '(()=>{const e={breakStatus:"done"},o=["beforeReward","adViewed","adBreakDone"];window.adsbygoogle=window.adsbygoogle||[],window.adsbygoogle.push=function(d){var a;d&&"object"==typeof d&&(a=d,o.every((e=>e in a&&"function"==typeof a[e])))&&(d.beforeReward(),d.adViewed(),d.adBreakDone(e))}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["36fd3167269f896e4009a009ae54edb3"] === e) return;
            (() => {
                const e = {
                    breakStatus: "done"
                }, o = [ "beforeReward", "adViewed", "adBreakDone" ];
                window.adsbygoogle = window.adsbygoogle || [], window.adsbygoogle.push = function(r) {
                    var d;
                    r && "object" == typeof r && (d = r, o.every((e => e in d && "function" == typeof d[e]))) && (r.beforeReward(), 
                    r.adViewed(), r.adBreakDone(e));
                };
            })();
            Object.defineProperty(Window.prototype.toString, "36fd3167269f896e4009a009ae54edb3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "36fd3167269f896e4009a009ae54edb3" due to: ' + e);
        }
    },
    '(()=>{const r={apply:(r,e,t)=>{try{const r=(new Error).stack,e=t[0];if(r.includes("adBlockingDetected")&&e?.adFailurePercentage)return 0}catch(r){}return Reflect.apply(r,e,t)}};window.Array.prototype.push=new Proxy(window.Array.prototype.push,r)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2569876940a174e979811de8e9ef4610"] === e) return;
            (() => {
                const e = {
                    apply: (e, r, t) => {
                        try {
                            const e = (new Error).stack, r = t[0];
                            if (e.includes("adBlockingDetected") && r?.adFailurePercentage) return 0;
                        } catch (e) {}
                        return Reflect.apply(e, r, t);
                    }
                };
                window.Array.prototype.push = new Proxy(window.Array.prototype.push, e);
            })();
            Object.defineProperty(Window.prototype.toString, "2569876940a174e979811de8e9ef4610", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2569876940a174e979811de8e9ef4610" due to: ' + e);
        }
    },
    '(()=>{let e;const t={apply:(t,n,o)=>(o[0]?.behavior?.controlType&&o[0]?.initialItems&&"function"==typeof o[0].update&&(e=o[0].update,o[0].update=function(){this.update=e}),Reflect.apply(t,n,o))};window.Object.keys=new Proxy(window.Object.keys,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ca0d0ab35fc86cd11d58ae07707d23fa === e) return;
            (() => {
                let e;
                const t = {
                    apply: (t, o, a) => (a[0]?.behavior?.controlType && a[0]?.initialItems && "function" == typeof a[0].update && (e = a[0].update, 
                    a[0].update = function() {
                        this.update = e;
                    }), Reflect.apply(t, o, a))
                };
                window.Object.keys = new Proxy(window.Object.keys, t);
            })();
            Object.defineProperty(Window.prototype.toString, "ca0d0ab35fc86cd11d58ae07707d23fa", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ca0d0ab35fc86cd11d58ae07707d23fa" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,n,t)=>{const o=t[1];return o&&["adBlockingDetected","assessAdBlocking"].includes(o)&&t[2]&&"function"==typeof t[2].value&&(t[2].value=()=>{}),Reflect.apply(e,n,t)}};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.dd013aac8504d0cebb16580d054020f6 === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => {
                        const d = o[1];
                        return d && [ "adBlockingDetected", "assessAdBlocking" ].includes(d) && o[2] && "function" == typeof o[2].value && (o[2].value = () => {}), 
                        Reflect.apply(e, t, o);
                    }
                };
                window.Object.defineProperty = new Proxy(window.Object.defineProperty, e);
            })();
            Object.defineProperty(Window.prototype.toString, "dd013aac8504d0cebb16580d054020f6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "dd013aac8504d0cebb16580d054020f6" due to: ' + e);
        }
    },
    '(()=>{window.adsbygoogle=window.adsbygoogle||[],window.adsbygoogle.loaded=!0,window.adsbygoogle.push=o=>{if("function"==typeof o?.params?.google_ad_loaded_callback)try{o.params.google_ad_loaded_callback()}catch(o){}};})();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString["8789bcbfab97b9bd3093b265e84dcf3d"] === o) return;
            window.adsbygoogle = window.adsbygoogle || [], window.adsbygoogle.loaded = !0, window.adsbygoogle.push = o => {
                if ("function" == typeof o?.params?.google_ad_loaded_callback) try {
                    o.params.google_ad_loaded_callback();
                } catch (o) {}
            };
            Object.defineProperty(Window.prototype.toString, "8789bcbfab97b9bd3093b265e84dcf3d", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "8789bcbfab97b9bd3093b265e84dcf3d" due to: ' + o);
        }
    },
    "(()=>{window.detectIncognito=()=>new Promise((e=>e({isPrivate:!0})));})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b8746b82569fc49e330a8e697f35c050 === e) return;
            window.detectIncognito = () => new Promise((e => e({
                isPrivate: !0
            })));
            Object.defineProperty(Window.prototype.toString, "b8746b82569fc49e330a8e697f35c050", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b8746b82569fc49e330a8e697f35c050" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,p,t)=>(!0===t[0]&&(t[0]=!1),Reflect.apply(e,p,t))},p={apply:(p,t,a)=>("__updateState"===a[1]&&a[2]&&a[2].value&&(a[2].value=new Proxy(a[2].value,e)),Reflect.apply(p,t,a))};window.Object.defineProperty=new Proxy(window.Object.defineProperty,p)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7c7972b55daaed8f85903876788453e9"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, r) => (!0 === r[0] && (r[0] = !1), Reflect.apply(e, t, r))
                }, t = {
                    apply: (t, r, o) => ("__updateState" === o[1] && o[2] && o[2].value && (o[2].value = new Proxy(o[2].value, e)), 
                    Reflect.apply(t, r, o))
                };
                window.Object.defineProperty = new Proxy(window.Object.defineProperty, t);
            })();
            Object.defineProperty(Window.prototype.toString, "7c7972b55daaed8f85903876788453e9", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7c7972b55daaed8f85903876788453e9" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,t,n)=>{const o=n[0];if(o&&o.status.includes("success"))for(const e in n[0])"1"===n[0][e]?n[0][e]="0":1===n[0][e]&&(n[0][e]=0);return Reflect.apply(e,t,n)}},t=["adblockEnabled","=!!parseInt(","disable_adb"],n={apply:(n,o,s)=>{const p=s[0];return"function"==typeof p&&t.some((e=>p.toString().includes(e)))&&(s[0]=new Proxy(s[0],e)),Reflect.apply(n,o,s)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,n)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["363a12f3db4852d23e4d57b5c84f4d68"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => {
                        const n = o[0];
                        if (n && n.status.includes("success")) for (const e in o[0]) "1" === o[0][e] ? o[0][e] = "0" : 1 === o[0][e] && (o[0][e] = 0);
                        return Reflect.apply(e, t, o);
                    }
                }, t = [ "adblockEnabled", "=!!parseInt(", "disable_adb" ], o = {
                    apply: (o, n, r) => {
                        const d = r[0];
                        return "function" == typeof d && t.some((e => d.toString().includes(e))) && (r[0] = new Proxy(r[0], e)), 
                        Reflect.apply(o, n, r);
                    }
                };
                window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, o);
            })();
            Object.defineProperty(Window.prototype.toString, "363a12f3db4852d23e4d57b5c84f4d68", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "363a12f3db4852d23e4d57b5c84f4d68" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,n,e)=>{if(e[0]&&null===e[0].html?.detected&&"function"==typeof e[0].html?.instance?.start&&"function"==typeof e[0].env?.instance?.start&&"function"==typeof e[0].http?.instance?.start){const t=function(){Object.keys(this).forEach((t=>{"boolean"==typeof this[t]&&(this[t]=!1)}))};["html","env","http"].forEach((n=>{e[0][n].instance.start=t}))}return Reflect.apply(t,n,e)}};window.Object.keys=new Proxy(window.Object.keys,t)})();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString["8e5af140bb8ff6dfac87d2aa8a7181a7"] === t) return;
            (() => {
                const t = {
                    apply: (t, e, n) => {
                        if (n[0] && null === n[0].html?.detected && "function" == typeof n[0].html?.instance?.start && "function" == typeof n[0].env?.instance?.start && "function" == typeof n[0].http?.instance?.start) {
                            const t = function() {
                                Object.keys(this).forEach((t => {
                                    "boolean" == typeof this[t] && (this[t] = !1);
                                }));
                            };
                            [ "html", "env", "http" ].forEach((e => {
                                n[0][e].instance.start = t;
                            }));
                        }
                        return Reflect.apply(t, e, n);
                    }
                };
                window.Object.keys = new Proxy(window.Object.keys, t);
            })();
            Object.defineProperty(Window.prototype.toString, "8e5af140bb8ff6dfac87d2aa8a7181a7", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "8e5af140bb8ff6dfac87d2aa8a7181a7" due to: ' + t);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{var el=document.body; var ce=document.createElement('div'); if(el) { el.appendChild(ce); ce.setAttribute(\"id\", \"QGSBETJjtZkYH\"); }})})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["660d8dc0098c8febc0f6d884977e6d4e"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                var e = document.body, t = document.createElement("div");
                if (e) {
                    e.appendChild(t);
                    t.setAttribute("id", "QGSBETJjtZkYH");
                }
            }));
            Object.defineProperty(Window.prototype.toString, "660d8dc0098c8febc0f6d884977e6d4e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "660d8dc0098c8febc0f6d884977e6d4e" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const e=document.querySelector("#widescreen1");if(e){const t=document.createElement("div");t.setAttribute("id","google_ads_iframe_"),e.appendChild(t)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["44c722190e3d03dbed05660dc5040600"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                const e = document.querySelector("#widescreen1");
                if (e) {
                    const t = document.createElement("div");
                    t.setAttribute("id", "google_ads_iframe_"), e.appendChild(t);
                }
            }));
            Object.defineProperty(Window.prototype.toString, "44c722190e3d03dbed05660dc5040600", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "44c722190e3d03dbed05660dc5040600" due to: ' + e);
        }
    },
    '(()=>{const n=window.String.prototype.includes,o={apply:(o,t,i)=>{const c=i[0];return!(!i||!n.call(c,"function onclick(lczxsusin)"))||Reflect.apply(o,t,i)}};window.String.prototype.includes=new Proxy(window.String.prototype.includes,o)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2e3a208e2520b56c4a151edf4ed886f4"] === e) return;
            (() => {
                const e = window.String.prototype.includes, t = {
                    apply: (t, o, n) => {
                        const r = n[0];
                        return !(!n || !e.call(r, "function onclick(lczxsusin)")) || Reflect.apply(t, o, n);
                    }
                };
                window.String.prototype.includes = new Proxy(window.String.prototype.includes, t);
            })();
            Object.defineProperty(Window.prototype.toString, "2e3a208e2520b56c4a151edf4ed886f4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2e3a208e2520b56c4a151edf4ed886f4" due to: ' + e);
        }
    },
    '(()=>{const e=new Set(["fimg","faimg","fbmg","fcmg","fdmg","femg","ffmg","fgmg","fjmg","fkmg"]),t={apply:(t,c,n)=>{const s=n[2];if(s){const t=Object.keys(s).length;if(t>1&&t<20)for(let t in s)if(e.has(t)&&!0===n[2][t])try{n[2][t]=!1}catch(e){console.trace(e)}else if(!0===s[t])try{const e=(new Error).stack;/NodeList\\.forEach|(<anonymous>|blob):[\\s\\S]{1,500}$/.test(e)&&(s[t]=!1)}catch(e){console.trace(e)}}return Reflect.apply(t,c,n)}};window.Object.assign=new Proxy(window.Object.assign,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["26f59c9e189170e8d303a40a632b2e28"] === e) return;
            (() => {
                const e = new Set([ "fimg", "faimg", "fbmg", "fcmg", "fdmg", "femg", "ffmg", "fgmg", "fjmg", "fkmg" ]), t = {
                    apply: (t, o, n) => {
                        const r = n[2];
                        if (r) {
                            const t = Object.keys(r).length;
                            if (t > 1 && t < 20) for (let t in r) if (e.has(t) && !0 === n[2][t]) try {
                                n[2][t] = !1;
                            } catch (e) {
                                console.trace(e);
                            } else if (!0 === r[t]) try {
                                const e = (new Error).stack;
                                /NodeList\.forEach|(<anonymous>|blob):[\s\S]{1,500}$/.test(e) && (r[t] = !1);
                            } catch (e) {
                                console.trace(e);
                            }
                        }
                        return Reflect.apply(t, o, n);
                    }
                };
                window.Object.assign = new Proxy(window.Object.assign, t);
            })();
            Object.defineProperty(Window.prototype.toString, "26f59c9e189170e8d303a40a632b2e28", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "26f59c9e189170e8d303a40a632b2e28" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,t,p)=>{const o=p[1];return o&&"string"==typeof o&&o.match(/pagead2\\.googlesyndication\\.com|google.*\\.js|\\/.*?\\/.*?ad.*?\\.js|\\.(shop|quest|autos)\\/.*?\\.(js|php|html)/)&&(t.prevent=!0),Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,e);const t={apply:(e,t,p)=>{if(!t.prevent)return Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c7605ee2684a2146beda3b04ccfa8bec === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => {
                        const p = o[1];
                        return p && "string" == typeof p && p.match(/pagead2\.googlesyndication\.com|google.*\.js|\/.*?\/.*?ad.*?\.js|\.(shop|quest|autos)\/.*?\.(js|php|html)/) && (t.prevent = !0), 
                        Reflect.apply(e, t, o);
                    }
                };
                window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, e);
                const t = {
                    apply: (e, t, o) => {
                        if (!t.prevent) return Reflect.apply(e, t, o);
                    }
                };
                window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, t);
            })();
            Object.defineProperty(Window.prototype.toString, "c7605ee2684a2146beda3b04ccfa8bec", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c7605ee2684a2146beda3b04ccfa8bec" due to: ' + e);
        }
    },
    '(()=>{const e=()=>{document.querySelectorAll(".chakra-portal").forEach((e=>{e.querySelector(\'.chakra-modal__overlay[style*="opacity"]\')&&e.setAttribute("style","display: none !important;")}))},t=()=>{},a=function(t,a){const r={name:t,listener:a};requestAnimationFrame((()=>{try{"rewardedSlotGranted"===r.name&&setTimeout(e,2e3),r.listener()}catch(e){}}))};window.googletag={cmd:[],pubads:()=>({addEventListener:a,removeEventListener:t,refresh:t,getTargeting:()=>[],setTargeting:t,disableInitialLoad:t,enableSingleRequest:t,collapseEmptyDivs:t,getSlots:t}),defineSlot:()=>({addService(){}}),defineOutOfPageSlot:t,enableServices:t,display:t,enums:{OutOfPageFormat:{REWARDED:1}}},googletag.cmd.push=e=>{try{e()}catch(e){}return 1}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["788553a11ab6cd27600ce601f07d7af8"] === e) return;
            (() => {
                const e = () => {
                    document.querySelectorAll(".chakra-portal").forEach((e => {
                        e.querySelector('.chakra-modal__overlay[style*="opacity"]') && e.setAttribute("style", "display: none !important;");
                    }));
                }, t = () => {}, r = function(t, r) {
                    const a = {
                        name: t,
                        listener: r
                    };
                    requestAnimationFrame((() => {
                        try {
                            "rewardedSlotGranted" === a.name && setTimeout(e, 2e3), a.listener();
                        } catch (e) {}
                    }));
                };
                window.googletag = {
                    cmd: [],
                    pubads: () => ({
                        addEventListener: r,
                        removeEventListener: t,
                        refresh: t,
                        getTargeting: () => [],
                        setTargeting: t,
                        disableInitialLoad: t,
                        enableSingleRequest: t,
                        collapseEmptyDivs: t,
                        getSlots: t
                    }),
                    defineSlot: () => ({
                        addService() {}
                    }),
                    defineOutOfPageSlot: t,
                    enableServices: t,
                    display: t,
                    enums: {
                        OutOfPageFormat: {
                            REWARDED: 1
                        }
                    }
                }, googletag.cmd.push = e => {
                    try {
                        e();
                    } catch (e) {}
                    return 1;
                };
            })();
            Object.defineProperty(Window.prototype.toString, "788553a11ab6cd27600ce601f07d7af8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "788553a11ab6cd27600ce601f07d7af8" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(window.CryptoJSAesJson&&window.CryptoJSAesJson.decrypt){const e=document.createElement("link");function t(){const t=document.querySelector(".entry-header.header");return parseInt(t.getAttribute("data-id"))}e.setAttribute("rel","stylesheet"),e.setAttribute("media","all"),e.setAttribute("href","/wp-content/cache/autoptimize/css/autoptimize_92c5b1cf0217cba9b3fab27d39f320b9.css"),document.head.appendChild(e);const r=3,n=5,o=13,a="07";let c="",i="";const d=1,l=6,g=1,s=5,u=2,p=8,m=8,A=(t,e)=>parseInt(t.toString()+e.toString()),b=(t,e,r)=>t.toString()+e.toString()+r.toString(),S=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let c=parseInt((t()+A(o,a))*r-e);return c=A(2*n+1,c),c},h=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let r=parseInt((t()+A(p,m))*(2*d)-e-(2*d*2+1));return r=b(2*l+g+g+1,c,r),r},y=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;return b(t()+2*s*2,i,e*(2*u))},f=(t,e)=>CryptoJSAesJson.decrypt(t,e);let k=document.querySelectorAll(".reading-content .page-break img");k.forEach((t=>{const e=t.getAttribute("id"),r=f(e,S().toString());t.setAttribute("id",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=parseInt(e.replace(/image-(\\d+)[a-z]+/i,"$1"));document.querySelectorAll(".reading-content .page-break")[r].appendChild(t)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=e.slice(-1);c+=r,t.setAttribute("id",e.slice(0,-1))})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta"),r=f(e,h().toString());t.setAttribute("dta",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta").slice(-2);i+=e,t.removeAttribute("dta")})),k.forEach((t=>{var e=t.getAttribute("data-src"),r=f(e,y().toString());t.setAttribute("data-src",r)})),k.forEach((t=>{t.classList.add("wp-manga-chapter-img","img-responsive","lazyload","effect-fade")}))}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["793501cfe6b6465e5f629489b079c172"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                if (window.CryptoJSAesJson && window.CryptoJSAesJson.decrypt) {
                    const t = document.createElement("link");
                    function e() {
                        const e = document.querySelector(".entry-header.header");
                        return parseInt(e.getAttribute("data-id"));
                    }
                    t.setAttribute("rel", "stylesheet"), t.setAttribute("media", "all"), t.setAttribute("href", "/wp-content/cache/autoptimize/css/autoptimize_92c5b1cf0217cba9b3fab27d39f320b9.css"), 
                    document.head.appendChild(t);
                    const r = 3, n = 5, o = 13, c = "07";
                    let a = "", i = "";
                    const d = 1, l = 6, u = 1, g = 5, s = 2, b = 8, p = 8, m = (e, t) => parseInt(e.toString() + t.toString()), A = (e, t, r) => e.toString() + t.toString() + r.toString(), f = () => {
                        const t = document.querySelectorAll(".reading-content .page-break img").length;
                        let a = parseInt((e() + m(o, c)) * r - t);
                        return a = m(2 * n + 1, a), a;
                    }, S = () => {
                        const t = document.querySelectorAll(".reading-content .page-break img").length;
                        let r = parseInt((e() + m(b, p)) * (2 * d) - t - (2 * d * 2 + 1));
                        return r = A(2 * l + u + u + 1, a, r), r;
                    }, y = () => {
                        const t = document.querySelectorAll(".reading-content .page-break img").length;
                        return A(e() + 2 * g * 2, i, t * (2 * s));
                    }, h = (e, t) => CryptoJSAesJson.decrypt(e, t);
                    let q = document.querySelectorAll(".reading-content .page-break img");
                    q.forEach((e => {
                        const t = e.getAttribute("id"), r = h(t, f().toString());
                        e.setAttribute("id", r);
                    })), q = document.querySelectorAll(".reading-content .page-break img"), q.forEach((e => {
                        const t = e.getAttribute("id"), r = parseInt(t.replace(/image-(\d+)[a-z]+/i, "$1"));
                        document.querySelectorAll(".reading-content .page-break")[r].appendChild(e);
                    })), q = document.querySelectorAll(".reading-content .page-break img"), q.forEach((e => {
                        const t = e.getAttribute("id"), r = t.slice(-1);
                        a += r, e.setAttribute("id", t.slice(0, -1));
                    })), q = document.querySelectorAll(".reading-content .page-break img"), q.forEach((e => {
                        const t = e.getAttribute("dta"), r = h(t, S().toString());
                        e.setAttribute("dta", r);
                    })), q = document.querySelectorAll(".reading-content .page-break img"), q.forEach((e => {
                        const t = e.getAttribute("dta").slice(-2);
                        i += t, e.removeAttribute("dta");
                    })), q.forEach((e => {
                        var t = e.getAttribute("data-src"), r = h(t, y().toString());
                        e.setAttribute("data-src", r);
                    })), q.forEach((e => {
                        e.classList.add("wp-manga-chapter-img", "img-responsive", "lazyload", "effect-fade");
                    }));
                }
            }));
            Object.defineProperty(Window.prototype.toString, "793501cfe6b6465e5f629489b079c172", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "793501cfe6b6465e5f629489b079c172" due to: ' + e);
        }
    },
    '(()=>{const e=new Map,t=function(){},o=t;o.prototype.dispose=t,o.prototype.setNetwork=t,o.prototype.resize=t,o.prototype.setServer=t,o.prototype.setLogLevel=t,o.prototype.newContext=function(){return this},o.prototype.setParameter=t,o.prototype.addEventListener=function(t,o){t&&(console.debug(`Type: ${t}, callback: ${o}`),e.set(t,o))},o.prototype.removeEventListener=t,o.prototype.setProfile=t,o.prototype.setCapability=t,o.prototype.setVideoAsset=t,o.prototype.setSiteSection=t,o.prototype.addKeyValue=t,o.prototype.addTemporalSlot=t,o.prototype.registerCustomPlayer=t,o.prototype.setVideoDisplaySize=t,o.prototype.setContentVideoElement=t,o.prototype.registerVideoDisplayBase=t,o.prototype.submitRequest=function(){const t={type:tv.freewheel.SDK.EVENT_SLOT_ENDED},o=e.get("EVENT_SLOT_ENDED");o&&setTimeout((()=>{try{o(t)}catch(e){console.error(e)}}),1)},window.tv={freewheel:{SDK:{Ad:t,AdManager:o,AdListener:t,_instanceQueue:{},setLogLevel:t,EVENT_SLOT_ENDED:"EVENT_SLOT_ENDED"}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["75be2f053259701edcb277b5ff24cd28"] === e) return;
            (() => {
                const e = new Map, t = function() {}, o = t;
                o.prototype.dispose = t, o.prototype.setNetwork = t, o.prototype.resize = t, o.prototype.setServer = t, 
                o.prototype.setLogLevel = t, o.prototype.newContext = function() {
                    return this;
                }, o.prototype.setParameter = t, o.prototype.addEventListener = function(t, o) {
                    t && (console.debug(`Type: ${t}, callback: ${o}`), e.set(t, o));
                }, o.prototype.removeEventListener = t, o.prototype.setProfile = t, o.prototype.setCapability = t, 
                o.prototype.setVideoAsset = t, o.prototype.setSiteSection = t, o.prototype.addKeyValue = t, 
                o.prototype.addTemporalSlot = t, o.prototype.registerCustomPlayer = t, o.prototype.setVideoDisplaySize = t, 
                o.prototype.setContentVideoElement = t, o.prototype.registerVideoDisplayBase = t, 
                o.prototype.submitRequest = function() {
                    const t = {
                        type: tv.freewheel.SDK.EVENT_SLOT_ENDED
                    }, o = e.get("EVENT_SLOT_ENDED");
                    o && setTimeout((() => {
                        try {
                            o(t);
                        } catch (e) {
                            console.error(e);
                        }
                    }), 1);
                }, window.tv = {
                    freewheel: {
                        SDK: {
                            Ad: t,
                            AdManager: o,
                            AdListener: t,
                            _instanceQueue: {},
                            setLogLevel: t,
                            EVENT_SLOT_ENDED: "EVENT_SLOT_ENDED"
                        }
                    }
                };
            })();
            Object.defineProperty(Window.prototype.toString, "75be2f053259701edcb277b5ff24cd28", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "75be2f053259701edcb277b5ff24cd28" due to: ' + e);
        }
    },
    '(()=>{const e=window.Promise,o={construct:(o,t,n)=>t[0]&&t[0]?.toString()?.includes("[!1,!1,!1,!1]")&&t[0]?.toString()?.includes(".responseText")?e.resolve(!1):Reflect.construct(o,t,n)},t=new Proxy(window.Promise,o);Object.defineProperty(window,"Promise",{set:e=>{},get:()=>t})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4e4e57eff747aed19b1eb6c7b2758126"] === e) return;
            (() => {
                const e = window.Promise, t = {
                    construct: (t, o, r) => o[0] && o[0]?.toString()?.includes("[!1,!1,!1,!1]") && o[0]?.toString()?.includes(".responseText") ? e.resolve(!1) : Reflect.construct(t, o, r)
                }, o = new Proxy(window.Promise, t);
                Object.defineProperty(window, "Promise", {
                    set: e => {},
                    get: () => o
                });
            })();
            Object.defineProperty(Window.prototype.toString, "4e4e57eff747aed19b1eb6c7b2758126", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4e4e57eff747aed19b1eb6c7b2758126" due to: ' + e);
        }
    },
    "(()=>{window.viAPItag={init(){}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["88012e776a891c545cc6e77db0f643af"] === e) return;
            window.viAPItag = {
                init() {}
            };
            Object.defineProperty(Window.prototype.toString, "88012e776a891c545cc6e77db0f643af", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "88012e776a891c545cc6e77db0f643af" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ "function"==typeof ViewModelBase&&"object"==typeof ViewModelBase.prototype&&"function"==typeof ViewModelBase.prototype.LoadBrandAdAsync&&(ViewModelBase.prototype.LoadBrandAdAsync=function(){}) }));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ac3452ef83db17c4e84323d15083a03b === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                "function" == typeof ViewModelBase && "object" == typeof ViewModelBase.prototype && "function" == typeof ViewModelBase.prototype.LoadBrandAdAsync && (ViewModelBase.prototype.LoadBrandAdAsync = function() {});
            }));
            Object.defineProperty(Window.prototype.toString, "ac3452ef83db17c4e84323d15083a03b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ac3452ef83db17c4e84323d15083a03b" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var a=document.querySelectorAll("ins.adsbygoogle");a.length&&a.forEach(a=>{var b=document.createElement("iframe");b.style="display: none !important;",a.setAttribute("data-ad-status","filled"),a.appendChild(b)}) }));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["81b55e3b01cb8f931036cccb4d1056b6"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                var e = document.querySelectorAll("ins.adsbygoogle");
                e.length && e.forEach((e => {
                    var t = document.createElement("iframe");
                    t.style = "display: none !important;", e.setAttribute("data-ad-status", "filled"), 
                    e.appendChild(t);
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "81b55e3b01cb8f931036cccb4d1056b6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "81b55e3b01cb8f931036cccb4d1056b6" due to: ' + e);
        }
    },
    '(()=>{if(!location.href.includes("://embed.wcostream.com/inc/embed/index.php?file="))return;const e=`/inc/embed/video-js.php${location.search}`;location.href=e})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b906e269a72b6af7c1d463b60f868697 === e) return;
            (() => {
                if (!location.href.includes("://embed.wcostream.com/inc/embed/index.php?file=")) return;
                const e = `/inc/embed/video-js.php${location.search}`;
                location.href = e;
            })();
            Object.defineProperty(Window.prototype.toString, "b906e269a72b6af7c1d463b60f868697", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b906e269a72b6af7c1d463b60f868697" due to: ' + e);
        }
    },
    '(function(){window.adnPopConfig={zoneId:"149"}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cdb400a346ffb8cf37f33a522644f2cb === e) return;
            window.adnPopConfig = {
                zoneId: "149"
            };
            Object.defineProperty(Window.prototype.toString, "cdb400a346ffb8cf37f33a522644f2cb", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cdb400a346ffb8cf37f33a522644f2cb" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,e,o)=>{try{const t=e,o=t?.[0];t&&t.length>0&&t.length<10&&"string"==typeof o&&o?.includes?.("-bait-")&&(e=[])}catch(t){}return Reflect.apply(t,e,o)}};window.Array.prototype.some=new Proxy(window.Array.prototype.some,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ac633d86bc395ade3c178ab74b9477d7 === e) return;
            (() => {
                const e = {
                    apply: (e, t, r) => {
                        try {
                            const e = t, r = e?.[0];
                            e && e.length > 0 && e.length < 10 && "string" == typeof r && r?.includes?.("-bait-") && (t = []);
                        } catch (e) {}
                        return Reflect.apply(e, t, r);
                    }
                };
                window.Array.prototype.some = new Proxy(window.Array.prototype.some, e);
            })();
            Object.defineProperty(Window.prototype.toString, "ac633d86bc395ade3c178ab74b9477d7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ac633d86bc395ade3c178ab74b9477d7" due to: ' + e);
        }
    },
    '!function(){window.adsbygoogle={loaded:!0,push:function(){"undefined"===typeof this.length&&(this.length=0,this.length+=1)}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["065d3c28da0404a4fdfd569932271571"] === e) return;
            window.adsbygoogle = {
                loaded: !0,
                push: function() {
                    void 0 === this.length && (this.length = 0, this.length += 1);
                }
            };
            Object.defineProperty(Window.prototype.toString, "065d3c28da0404a4fdfd569932271571", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "065d3c28da0404a4fdfd569932271571" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var b=new MutationObserver(function(){try{for(var a,d=function(c){for(var a="",d=0;d<c;d++)a+="0123456789".charAt(Math.floor(10*Math.random()));return a},e=document.querySelectorAll(".adsbygoogle, script[data-ad-client]"),f=0;f<e.length;f++)if(e[f].getAttribute("data-ad-client")){a=e[f].getAttribute("data-ad-client");break}if(a){var g=`<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${a}&amp;output=html&amp;adk=${d(10)}&amp;adf=${d(10)}&amp;lmt=${d(10)}&amp;plat=${d(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${d(100)}&amp;bpp=2&amp;bdt=${d(3)}&amp;idt=${d(3)}&amp;shv=r${d(8)}&amp;mjsv=m${d(8)}&amp;ptt=${d(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${d(8)}&amp;frm=${d(2)}&amp;pv=2&amp;ga_vid=${d(10)}.${d(10)}&amp;ga_sid=${d(10)}&amp;ga_hid=${d(10)}&amp;ga_fc=0&amp;u_tz=${d(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${d(4)}&amp;u_w=${d(4)}&amp;u_ah=${d(4)}&amp;u_aw=${d(4)}&amp;u_cd=${d(2)}&amp;u_nplug=${d(1)}&amp;u_nmime=${d(1)}&amp;adx=-${d(8)}&amp;ady=-${d(8)}&amp;biw=${d(4)}&amp;bih=${d(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${d(30)}&amp;oid=${d(1)}&amp;pvsid=${d(16)}&amp;pem=${d(3)}&amp;eae=${d(1)}&amp;fc=${d(4)}&amp;brdim=${d(20)}&amp;vis=1&amp;rsz=${d(6)}&amp;abl=NS&amp;fu=${d(4)}&amp;bc=${d(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`,h=document.querySelector("body > *"),j=document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");h&&j.length&&(!h.querySelector("iframe#aswift_0")&&h.insertAdjacentHTML("afterend",g),j.forEach(a=>{a.querySelector("iframe#aswift_0")||(a.parentNode.style.height="200px",a.parentNode.style.width="200px",a.parentNode.innerHTML=g)}))}var k=document.querySelector(".page-body"),l=document.querySelectorAll(".adsbygoogle, .phpbb-ads-center");k&&!k.innerText.includes("deactivating your Ad-Blocker")&&l.length&&(l.forEach(a=>{a.remove()}),b.disconnect())}catch(a){}});b.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){b.disconnect()},1E4) }));})();': () => {
        try {
            const a = "done";
            if (Window.prototype.toString["802366024dd441867900263826a1b687"] === a) return;
            document.addEventListener("DOMContentLoaded", (() => {
                var a = new MutationObserver((function() {
                    try {
                        for (var e, t = function(a) {
                            for (var e = "", t = 0; t < a; t++) e += "0123456789".charAt(Math.floor(10 * Math.random()));
                            return e;
                        }, i = document.querySelectorAll(".adsbygoogle, script[data-ad-client]"), o = 0; o < i.length; o++) if (i[o].getAttribute("data-ad-client")) {
                            e = i[o].getAttribute("data-ad-client");
                            break;
                        }
                        if (e) {
                            var r = `<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${e}&amp;output=html&amp;adk=${t(10)}&amp;adf=${t(10)}&amp;lmt=${t(10)}&amp;plat=${t(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${t(100)}&amp;bpp=2&amp;bdt=${t(3)}&amp;idt=${t(3)}&amp;shv=r${t(8)}&amp;mjsv=m${t(8)}&amp;ptt=${t(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${t(8)}&amp;frm=${t(2)}&amp;pv=2&amp;ga_vid=${t(10)}.${t(10)}&amp;ga_sid=${t(10)}&amp;ga_hid=${t(10)}&amp;ga_fc=0&amp;u_tz=${t(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${t(4)}&amp;u_w=${t(4)}&amp;u_ah=${t(4)}&amp;u_aw=${t(4)}&amp;u_cd=${t(2)}&amp;u_nplug=${t(1)}&amp;u_nmime=${t(1)}&amp;adx=-${t(8)}&amp;ady=-${t(8)}&amp;biw=${t(4)}&amp;bih=${t(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${t(30)}&amp;oid=${t(1)}&amp;pvsid=${t(16)}&amp;pem=${t(3)}&amp;eae=${t(1)}&amp;fc=${t(4)}&amp;brdim=${t(20)}&amp;vis=1&amp;rsz=${t(6)}&amp;abl=NS&amp;fu=${t(4)}&amp;bc=${t(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`, p = document.querySelector("body > *"), n = document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");
                            p && n.length && (!p.querySelector("iframe#aswift_0") && p.insertAdjacentHTML("afterend", r), 
                            n.forEach((a => {
                                a.querySelector("iframe#aswift_0") || (a.parentNode.style.height = "200px", a.parentNode.style.width = "200px", 
                                a.parentNode.innerHTML = r);
                            })));
                        }
                        var d = document.querySelector(".page-body"), l = document.querySelectorAll(".adsbygoogle, .phpbb-ads-center");
                        d && !d.innerText.includes("deactivating your Ad-Blocker") && l.length && (l.forEach((a => {
                            a.remove();
                        })), a.disconnect());
                    } catch (e) {}
                }));
                a.observe(document, {
                    childList: !0,
                    subtree: !0
                }), setTimeout((function() {
                    a.disconnect();
                }), 1e4);
            }));
            Object.defineProperty(Window.prototype.toString, "802366024dd441867900263826a1b687", {
                value: a,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (a) {
            console.error('Error executing AG js rule with uniqueId "802366024dd441867900263826a1b687" due to: ' + a);
        }
    },
    '(()=>{const e=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").set,t=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").get;Object.defineProperty(Element.prototype,"innerHTML",{get(){return t.call(this)},set(t){if(t?.includes?.("disable your adblocker"))throw new Error;e.call(this,t)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["96cd53fdc3f56d04903d4a180e507d95"] === e) return;
            (() => {
                const e = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set, t = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").get;
                Object.defineProperty(Element.prototype, "innerHTML", {
                    get() {
                        return t.call(this);
                    },
                    set(t) {
                        if (t?.includes?.("disable your adblocker")) throw new Error;
                        e.call(this, t);
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "96cd53fdc3f56d04903d4a180e507d95", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "96cd53fdc3f56d04903d4a180e507d95" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,o,t)=>(null===t[0]&&(t[0]={isUserSubscriber:!0}),Reflect.apply(e,o,t))},o={apply:(o,t,n)=>{const r=n[0];return"function"==typeof r&&r.toString().includes("AdBlockDetector")&&(n[0]=()=>{}),"function"==typeof r&&r.toString().includes("Preroll Ad")&&(n[0]=new Proxy(n[0],e)),Reflect.apply(o,t,n)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,o)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["785fddde2c2648fbf7b3c872780aab8f"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => (null === o[0] && (o[0] = {
                        isUserSubscriber: !0
                    }), Reflect.apply(e, t, o))
                }, t = {
                    apply: (t, o, r) => {
                        const n = r[0];
                        return "function" == typeof n && n.toString().includes("AdBlockDetector") && (r[0] = () => {}), 
                        "function" == typeof n && n.toString().includes("Preroll Ad") && (r[0] = new Proxy(r[0], e)), 
                        Reflect.apply(t, o, r);
                    }
                };
                window.Promise.prototype.then = new Proxy(window.Promise.prototype.then, t);
            })();
            Object.defineProperty(Window.prototype.toString, "785fddde2c2648fbf7b3c872780aab8f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "785fddde2c2648fbf7b3c872780aab8f" due to: ' + e);
        }
    },
    '(()=>{const e=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").set,t=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").get;Object.defineProperty(Element.prototype,"innerHTML",{get(){return t.call(this)},set(t){if(t?.includes?.("allow adblock"))throw new Error;e.call(this,t)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["27477abfbce9ce3be4dd5c5e090561b7"] === e) return;
            (() => {
                const e = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set, t = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").get;
                Object.defineProperty(Element.prototype, "innerHTML", {
                    get() {
                        return t.call(this);
                    },
                    set(t) {
                        if (t?.includes?.("allow adblock")) throw new Error;
                        e.call(this, t);
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "27477abfbce9ce3be4dd5c5e090561b7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "27477abfbce9ce3be4dd5c5e090561b7" due to: ' + e);
        }
    },
    "window.adsbygoogle = { loaded: !0 };": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.df4e0801aa685812f605b6558f08d2df === e) return;
            window.adsbygoogle = {
                loaded: !0
            };
            Object.defineProperty(Window.prototype.toString, "df4e0801aa685812f605b6558f08d2df", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "df4e0801aa685812f605b6558f08d2df" due to: ' + e);
        }
    },
    '!function(){const e={apply:(e,l,t)=>{const o=t[0];return o?.includes(".b_ad,")?t[0]="#b_results":o?.includes(".b_restorableLink")&&(t[0]=".b_algo"),Reflect.apply(e,l,t)}};window.Element.prototype.querySelectorAll=new Proxy(window.Element.prototype.querySelectorAll,e)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["009a684340d0a5680676bfe531438c9e"] === e) return;
            !function() {
                const e = {
                    apply: (e, t, o) => {
                        const r = o[0];
                        return r?.includes(".b_ad,") ? o[0] = "#b_results" : r?.includes(".b_restorableLink") && (o[0] = ".b_algo"), 
                        Reflect.apply(e, t, o);
                    }
                };
                window.Element.prototype.querySelectorAll = new Proxy(window.Element.prototype.querySelectorAll, e);
            }();
            Object.defineProperty(Window.prototype.toString, "009a684340d0a5680676bfe531438c9e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "009a684340d0a5680676bfe531438c9e" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\]\\.bab\\(window/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["346833de4a18e6e5f53bde8d214083c7"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/\]\.bab\(window/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "346833de4a18e6e5f53bde8d214083c7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "346833de4a18e6e5f53bde8d214083c7" due to: ' + e);
        }
    },
    "(function(){var b=window.setInterval;window.setInterval=function(a,c){if(!/e\\.display=='hidden'[\\s\\S]*?e\\.visibility=='none'/.test(a.toString()))return b(a,c)}.bind(window)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["799170846df78b2e8c6f8f1ecbe9f9ab"] === e) return;
            !function() {
                var e = window.setInterval;
                window.setInterval = function(t, n) {
                    if (!/e\.display=='hidden'[\s\S]*?e\.visibility=='none'/.test(t.toString())) return e(t, n);
                }.bind(window);
            }();
            Object.defineProperty(Window.prototype.toString, "799170846df78b2e8c6f8f1ecbe9f9ab", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "799170846df78b2e8c6f8f1ecbe9f9ab" due to: ' + e);
        }
    },
    "window.$tieE3 = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.abf848581aab7ee411a3a190d6305e9f === e) return;
            window.$tieE3 = !0;
            Object.defineProperty(Window.prototype.toString, "abf848581aab7ee411a3a190d6305e9f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "abf848581aab7ee411a3a190d6305e9f" due to: ' + e);
        }
    },
    "window.Advertisement = 1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a77fad03c24e228b97652a46d1fa5f22 === e) return;
            window.Advertisement = 1;
            Object.defineProperty(Window.prototype.toString, "a77fad03c24e228b97652a46d1fa5f22", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a77fad03c24e228b97652a46d1fa5f22" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/getAdIFrameCount/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0f751b2f4dfde1f99c0f6624f4bb7d2e"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/getAdIFrameCount/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "0f751b2f4dfde1f99c0f6624f4bb7d2e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0f751b2f4dfde1f99c0f6624f4bb7d2e" due to: ' + e);
        }
    },
    "window.adsEnabled = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["62d14321dc3e190666318c2f0ddfdcac"] === e) return;
            window.adsEnabled = !0;
            Object.defineProperty(Window.prototype.toString, "62d14321dc3e190666318c2f0ddfdcac", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "62d14321dc3e190666318c2f0ddfdcac" due to: ' + e);
        }
    },
    "window.uabpdl = window.uabInject = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["33d2335f47a6a24e15dbab294084b29d"] === e) return;
            window.uabpdl = window.uabInject = !0;
            Object.defineProperty(Window.prototype.toString, "33d2335f47a6a24e15dbab294084b29d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "33d2335f47a6a24e15dbab294084b29d" due to: ' + e);
        }
    },
    'window.ads = "on";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1667ac15a74b79e35fdab510c44b45c6"] === e) return;
            window.ads = "on";
            Object.defineProperty(Window.prototype.toString, "1667ac15a74b79e35fdab510c44b45c6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1667ac15a74b79e35fdab510c44b45c6" due to: ' + e);
        }
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.querySelector\\("ins\\.adsbygoogle"\\)/.test(a)){ _st(a,b);}};': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7236f7ab988d26aeb65e644c0c708759"] === e) return;
            var _st = window.setTimeout;
            window.setTimeout = function(e, t) {
                /document\.querySelector\("ins\.adsbygoogle"\)/.test(e) || _st(e, t);
            };
            Object.defineProperty(Window.prototype.toString, "7236f7ab988d26aeb65e644c0c708759", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7236f7ab988d26aeb65e644c0c708759" due to: ' + e);
        }
    },
    "window.showAds = 1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a677ae0f959db896dab64fd632486735 === e) return;
            window.showAds = 1;
            Object.defineProperty(Window.prototype.toString, "a677ae0f959db896dab64fd632486735", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a677ae0f959db896dab64fd632486735" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/ad-free subscription/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["13bb27a7e03ad36f09dfe943af907243"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/ad-free subscription/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "13bb27a7e03ad36f09dfe943af907243", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "13bb27a7e03ad36f09dfe943af907243" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\!document\\.getElementById[\\s\\S]*?#updato-overlay/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const t = "done";
            if (Window.prototype.toString.c01f2a751b270a3b51a5d5bfcbcb1984 === t) return;
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/\!document\.getElementById[\s\S]*?#updato-overlay/.test(e.toString())) return t(e, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "c01f2a751b270a3b51a5d5bfcbcb1984", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "c01f2a751b270a3b51a5d5bfcbcb1984" due to: ' + t);
        }
    },
    "window.detector_active = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fff6b1a1e7573bdc8801939be0d52c55 === e) return;
            window.detector_active = !0;
            Object.defineProperty(Window.prototype.toString, "fff6b1a1e7573bdc8801939be0d52c55", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fff6b1a1e7573bdc8801939be0d52c55" due to: ' + e);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.getElementById\\('cootent'\\)\\.innerHTML=/.test(a)){ _st(a,b);}};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d1d17c910459844ab89551639599c825 === e) return;
            var _st = window.setTimeout;
            window.setTimeout = function(e, t) {
                /document\.getElementById\('cootent'\)\.innerHTML=/.test(e) || _st(e, t);
            };
            Object.defineProperty(Window.prototype.toString, "d1d17c910459844ab89551639599c825", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d1d17c910459844ab89551639599c825" due to: ' + e);
        }
    },
    "window.areAdsDisplayed = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8e2186350e194ef09a3cc1ab5f463826"] === e) return;
            window.areAdsDisplayed = !0;
            Object.defineProperty(Window.prototype.toString, "8e2186350e194ef09a3cc1ab5f463826", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8e2186350e194ef09a3cc1ab5f463826" due to: ' + e);
        }
    },
    "window.Adv_ab = false;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["5601052c8ba773fc21566b0dfbe3e078"] === e) return;
            window.Adv_ab = !1;
            Object.defineProperty(Window.prototype.toString, "5601052c8ba773fc21566b0dfbe3e078", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "5601052c8ba773fc21566b0dfbe3e078" due to: ' + e);
        }
    },
    "window.adsEnabled=!0;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.be54fb20467f57c75acee13f527620e5 === e) return;
            window.adsEnabled = !0;
            Object.defineProperty(Window.prototype.toString, "be54fb20467f57c75acee13f527620e5", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "be54fb20467f57c75acee13f527620e5" due to: ' + e);
        }
    },
    "window.showads=true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["312c329877d22ebe2fb61034e6a10055"] === e) return;
            window.showads = !0;
            Object.defineProperty(Window.prototype.toString, "312c329877d22ebe2fb61034e6a10055", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "312c329877d22ebe2fb61034e6a10055" due to: ' + e);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/_detectAdBlocker/.test(a)){ _st(a,b);}};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b052dc5df97eaa80a24a214c96f52633 === e) return;
            var _st = window.setTimeout;
            window.setTimeout = function(e, t) {
                /_detectAdBlocker/.test(e) || _st(e, t);
            };
            Object.defineProperty(Window.prototype.toString, "b052dc5df97eaa80a24a214c96f52633", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b052dc5df97eaa80a24a214c96f52633" due to: ' + e);
        }
    },
    '(function(a){setTimeout=function(){var b="function"==typeof arguments[0]?Function.prototype.toString.call(arguments[0]):"string"==typeof arguments[0]?arguments[0]:String(arguments[0]);return/\\[(_0x[a-z0-9]{4,})\\[\\d+\\]\\][\\[\\(]\\1\\[\\d+\\]/.test(b)?NaN:a.apply(window,arguments)}.bind();Object.defineProperty(setTimeout,"name",{value:a.name});setTimeout.toString=Function.prototype.toString.bind(a)})(setTimeout);': () => {
        try {
            const t = "done";
            if (Window.prototype.toString.d51de922f2ef3a82152acd709db8a549 === t) return;
            !function(t) {
                setTimeout = function() {
                    var e = "function" == typeof arguments[0] ? Function.prototype.toString.call(arguments[0]) : "string" == typeof arguments[0] ? arguments[0] : String(arguments[0]);
                    return /\[(_0x[a-z0-9]{4,})\[\d+\]\][\[\(]\1\[\d+\]/.test(e) ? NaN : t.apply(window, arguments);
                }.bind();
                Object.defineProperty(setTimeout, "name", {
                    value: t.name
                });
                setTimeout.toString = Function.prototype.toString.bind(t);
            }(setTimeout);
            Object.defineProperty(Window.prototype.toString, "d51de922f2ef3a82152acd709db8a549", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "d51de922f2ef3a82152acd709db8a549" due to: ' + t);
        }
    },
    '(function(b,c){setTimeout=function(){var a=arguments[0];if("function"==typeof a&&/^function [A-Za-z]{1,2}\\(\\)\\s*\\{([A-Za-z])\\|\\|\\(\\1=!0,[\\s\\S]{1,13}\\(\\)\\)\\}$/.test(c.call(a)))throw"Adguard stopped a script execution.";return b.apply(window,arguments)}})(setTimeout,Function.prototype.toString);': () => {
        try {
            const t = "done";
            if (Window.prototype.toString["41822b6439a26cd50f44b208e1bad083"] === t) return;
            !function(t, e) {
                setTimeout = function() {
                    var o = arguments[0];
                    if ("function" == typeof o && /^function [A-Za-z]{1,2}\(\)\s*\{([A-Za-z])\|\|\(\1=!0,[\s\S]{1,13}\(\)\)\}$/.test(e.call(o))) throw "Adguard stopped a script execution.";
                    return t.apply(window, arguments);
                };
            }(setTimeout, Function.prototype.toString);
            Object.defineProperty(Window.prototype.toString, "41822b6439a26cd50f44b208e1bad083", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "41822b6439a26cd50f44b208e1bad083" due to: ' + t);
        }
    },
    "window.sessionStorage.loadedAds = 3;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["73f1b4fc791cbf3105708cabf5b1db21"] === e) return;
            window.sessionStorage.loadedAds = 3;
            Object.defineProperty(Window.prototype.toString, "73f1b4fc791cbf3105708cabf5b1db21", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "73f1b4fc791cbf3105708cabf5b1db21" due to: ' + e);
        }
    },
    "window.call_Ad = function() { };": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7c1456a0dab6ca53b945e21a27f6b209"] === e) return;
            window.call_Ad = function() {};
            Object.defineProperty(Window.prototype.toString, "7c1456a0dab6ca53b945e21a27f6b209", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7c1456a0dab6ca53b945e21a27f6b209" due to: ' + e);
        }
    },
    "window.RunAds = !0;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6c387c219fbbef62f244b67bd5165f03"] === e) return;
            window.RunAds = !0;
            Object.defineProperty(Window.prototype.toString, "6c387c219fbbef62f244b67bd5165f03", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6c387c219fbbef62f244b67bd5165f03" due to: ' + e);
        }
    },
    "window._r3z = {}; Object.defineProperties(window._r3z, { jq: { value: undefined }, pub: { value: {} } });": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["48c98c062b9c63813998a881d8c039c9"] === e) return;
            window._r3z = {};
            Object.defineProperties(window._r3z, {
                jq: {
                    value: void 0
                },
                pub: {
                    value: {}
                }
            });
            Object.defineProperty(Window.prototype.toString, "48c98c062b9c63813998a881d8c039c9", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "48c98c062b9c63813998a881d8c039c9" due to: ' + e);
        }
    },
    "(function() { window.xRds = false; window.frg = true; window.frag = true;  })();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.baafa2147233f1a8add3836529d4779e === e) return;
            !function() {
                window.xRds = !1;
                window.frg = !0;
                window.frag = !0;
            }();
            Object.defineProperty(Window.prototype.toString, "baafa2147233f1a8add3836529d4779e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "baafa2147233f1a8add3836529d4779e" due to: ' + e);
        }
    },
    "window.canABP = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b1d0f666ef36ca7989b62d00b88a8084 === e) return;
            window.canABP = !0;
            Object.defineProperty(Window.prototype.toString, "b1d0f666ef36ca7989b62d00b88a8084", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b1d0f666ef36ca7989b62d00b88a8084" due to: ' + e);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/displayAdBlockedVideo/.test(a)){ _st(a,b);}};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2ac41d844f1f8bd49b7778aeb6e0c2cc"] === e) return;
            var _st = window.setTimeout;
            window.setTimeout = function(e, t) {
                /displayAdBlockedVideo/.test(e) || _st(e, t);
            };
            Object.defineProperty(Window.prototype.toString, "2ac41d844f1f8bd49b7778aeb6e0c2cc", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2ac41d844f1f8bd49b7778aeb6e0c2cc" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/adsbygoogle instanceof Array/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.db544946f4c7aec68c0cc554e909aa42 === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/adsbygoogle instanceof Array/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "db544946f4c7aec68c0cc554e909aa42", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "db544946f4c7aec68c0cc554e909aa42" due to: ' + e);
        }
    },
    'window.ad_permission = "OK";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7016d2bc404839b07be9953ba599b969"] === e) return;
            window.ad_permission = "OK";
            Object.defineProperty(Window.prototype.toString, "7016d2bc404839b07be9953ba599b969", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7016d2bc404839b07be9953ba599b969" due to: ' + e);
        }
    },
    'document.cookie="popunder=1; path=/;";': () => {
        try {
            const c = "done";
            if (Window.prototype.toString.cc60c320cd31f7c797cace7d0a8f787a === c) return;
            document.cookie = "popunder=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "cc60c320cd31f7c797cace7d0a8f787a", {
                value: c,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (c) {
            console.error('Error executing AG js rule with uniqueId "cc60c320cd31f7c797cace7d0a8f787a" due to: ' + c);
        }
    },
    "(()=>{const e={apply:(e,r,t)=>{try{const e=r[0];e?.adTree&&(r.shift(),t=[])}catch(e){console.trace(e)}return Reflect.apply(e,r,t)}};window.Array.prototype.splice=new Proxy(window.Array.prototype.splice,e)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2fa6b0fc3f291729ed8dab8e63b1df26"] === e) return;
            (() => {
                const e = {
                    apply: (e, r, t) => {
                        try {
                            const e = r[0];
                            e?.adTree && (r.shift(), t = []);
                        } catch (e) {
                            console.trace(e);
                        }
                        return Reflect.apply(e, r, t);
                    }
                };
                window.Array.prototype.splice = new Proxy(window.Array.prototype.splice, e);
            })();
            Object.defineProperty(Window.prototype.toString, "2fa6b0fc3f291729ed8dab8e63b1df26", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2fa6b0fc3f291729ed8dab8e63b1df26" due to: ' + e);
        }
    },
    "!function(){if(location.pathname.indexOf(\"/iframe/player\")===-1){Object.defineProperty(Object.prototype, 'kununu_mul', { get: function(){ throw null; }, set: function(){ throw null; }});}}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0024181b43199be4e6f6d4dc8cace28f"] === e) return;
            -1 === location.pathname.indexOf("/iframe/player") && Object.defineProperty(Object.prototype, "kununu_mul", {
                get: function() {
                    throw null;
                },
                set: function() {
                    throw null;
                }
            });
            Object.defineProperty(Window.prototype.toString, "0024181b43199be4e6f6d4dc8cace28f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0024181b43199be4e6f6d4dc8cace28f" due to: ' + e);
        }
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("{}")&&(e[0]="<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<vmap:VMAP version=\\"1.0\\" xmlns:vmap=\\"http://www.iab.net/videosuite/vmap\\"><vmap:AdBreak timeOffset=\\"start\\" breakType=\\"linear\\" breakId=\\"4f95e542-9da8-480e-8c2a-7ade1ffdcc3d\\"><vmap:AdSource allowMultipleAds=\\"true\\" followRedirects=\\"true\\"><vmap:VASTAdData></vmap:VASTAdData></vmap:AdSource></vmap:AdBreak></vmap:VMAP>"),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["631aed795dd7ba8bffc8ac13694e2216"] === e) return;
            !function() {
                const e = {
                    apply: (e, a, r) => (r[0]?.includes?.("{}") && (r[0] = '<?xml version="1.0" encoding="UTF-8"?>\n<vmap:VMAP version="1.0" xmlns:vmap="http://www.iab.net/videosuite/vmap"><vmap:AdBreak timeOffset="start" breakType="linear" breakId="4f95e542-9da8-480e-8c2a-7ade1ffdcc3d"><vmap:AdSource allowMultipleAds="true" followRedirects="true"><vmap:VASTAdData></vmap:VASTAdData></vmap:AdSource></vmap:AdBreak></vmap:VMAP>'), 
                    Reflect.apply(e, a, r))
                };
                window.DOMParser.prototype.parseFromString = new Proxy(window.DOMParser.prototype.parseFromString, e);
            }();
            Object.defineProperty(Window.prototype.toString, "631aed795dd7ba8bffc8ac13694e2216", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "631aed795dd7ba8bffc8ac13694e2216" due to: ' + e);
        }
    },
    '(()=>{window.googletag={apiReady:!0,getVersion:function(){return"202307200101"}};})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4f23857baa34d679fafb613b89f85cda"] === e) return;
            window.googletag = {
                apiReady: !0,
                getVersion: function() {
                    return "202307200101";
                }
            };
            Object.defineProperty(Window.prototype.toString, "4f23857baa34d679fafb613b89f85cda", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4f23857baa34d679fafb613b89f85cda" due to: ' + e);
        }
    },
    '!function(){const e={apply:(e,t,n)=>{if("prg"!==t?.id)return Reflect.apply(e,t,n);const o=Reflect.apply(e,t,n);return Object.defineProperty(o,"top",{value:500}),o}};window.Element.prototype.getBoundingClientRect=new Proxy(window.Element.prototype.getBoundingClientRect,e)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8de36e4bf3b484248c14b692ab7d0b97"] === e) return;
            !function() {
                const e = {
                    apply: (e, t, n) => {
                        if ("prg" !== t?.id) return Reflect.apply(e, t, n);
                        const o = Reflect.apply(e, t, n);
                        return Object.defineProperty(o, "top", {
                            value: 500
                        }), o;
                    }
                };
                window.Element.prototype.getBoundingClientRect = new Proxy(window.Element.prototype.getBoundingClientRect, e);
            }();
            Object.defineProperty(Window.prototype.toString, "8de36e4bf3b484248c14b692ab7d0b97", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8de36e4bf3b484248c14b692ab7d0b97" due to: ' + e);
        }
    },
    "window.atob = function() { };": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bd6f7fef7248ea934c306654651e8882 === e) return;
            window.atob = function() {};
            Object.defineProperty(Window.prototype.toString, "bd6f7fef7248ea934c306654651e8882", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bd6f7fef7248ea934c306654651e8882" due to: ' + e);
        }
    },
    "window.canABP = window.canRunAds = window.canCheckAds = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7fa951f734c0ba707fc4893dc83b1a38"] === e) return;
            window.canABP = window.canRunAds = window.canCheckAds = !0;
            Object.defineProperty(Window.prototype.toString, "7fa951f734c0ba707fc4893dc83b1a38", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7fa951f734c0ba707fc4893dc83b1a38" due to: ' + e);
        }
    },
    "window.canRun = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cb7e5a7f0c3e95af411eb95c880d423d === e) return;
            window.canRun = !0;
            Object.defineProperty(Window.prototype.toString, "cb7e5a7f0c3e95af411eb95c880d423d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cb7e5a7f0c3e95af411eb95c880d423d" due to: ' + e);
        }
    },
    'window.googleToken = "no";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["14f3ab7c380717fd60634b54e8ee9403"] === e) return;
            window.googleToken = "no";
            Object.defineProperty(Window.prototype.toString, "14f3ab7c380717fd60634b54e8ee9403", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "14f3ab7c380717fd60634b54e8ee9403" due to: ' + e);
        }
    },
    "window.my_random_number = 1;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a9f261eb34a000b190c43d2cb371ce6c === e) return;
            window.my_random_number = 1;
            Object.defineProperty(Window.prototype.toString, "a9f261eb34a000b190c43d2cb371ce6c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a9f261eb34a000b190c43d2cb371ce6c" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\[_0x/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const t = "done";
            if (Window.prototype.toString.ca00780d8510a4940d20b67629664146 === t) return;
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/\[_0x/.test(e.toString())) return t(e, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "ca00780d8510a4940d20b67629664146", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "ca00780d8510a4940d20b67629664146" due to: ' + t);
        }
    },
    "(()=>{window.com_adswizz_synchro_decorateUrl=(a)=>a;})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e98a98ef2962b13e300d81c08a1652e0 === e) return;
            window.com_adswizz_synchro_decorateUrl = e => e;
            Object.defineProperty(Window.prototype.toString, "e98a98ef2962b13e300d81c08a1652e0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e98a98ef2962b13e300d81c08a1652e0" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{var a=document.querySelector("body");document.location.hostname.includes("skmedix.pl")&&a&&a.insertAdjacentHTML("beforeend",\'<ins class="adsbygoogle" data-ad-status="filled"><div id="aswift_" style="position: absolute !important; left: -3000px !important;"><iframe id="aswift_"></iframe></div></ins><iframe src="/aframe"></iframe>\')})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["931980a2c6180f6edbcd6f228a2db536"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                var e = document.querySelector("body");
                document.location.hostname.includes("skmedix.pl") && e && e.insertAdjacentHTML("beforeend", '<ins class="adsbygoogle" data-ad-status="filled"><div id="aswift_" style="position: absolute !important; left: -3000px !important;"><iframe id="aswift_"></iframe></div></ins><iframe src="/aframe"></iframe>');
            }));
            Object.defineProperty(Window.prototype.toString, "931980a2c6180f6edbcd6f228a2db536", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "931980a2c6180f6edbcd6f228a2db536" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{   setTimeout(function() { if(typeof show_game_iframe === "function") { show_game_iframe(); } }, 1000); }));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["66e1a81529963f50c62391d4d9356ef0"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    "function" == typeof show_game_iframe && show_game_iframe();
                }), 1e3);
            }));
            Object.defineProperty(Window.prototype.toString, "66e1a81529963f50c62391d4d9356ef0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "66e1a81529963f50c62391d4d9356ef0" due to: ' + e);
        }
    },
    '(()=>{window.sas_idmnet=window.sas_idmnet||{};Object.assign(sas_idmnet,{releaseVideo:function(a){if("object"==typeof videoInit&&"function"==typeof videoInit.start)try{videoInit.start(a,n)}catch(a){}},release:function(){},placementsList:function(){}});const a=function(a,b){if(a&&a.push)for(a.push=b;a.length;)b(a.shift())},b=function(a){try{a()}catch(a){console.error(a)}};"complete"===document.readyState?a(sas_idmnet.cmd,b):window.addEventListener("load",()=>{a(sas_idmnet.cmd,b)})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["35966fc2cd75edd8c085792a4413cc08"] === e) return;
            (() => {
                window.sas_idmnet = window.sas_idmnet || {};
                Object.assign(sas_idmnet, {
                    releaseVideo: function(e) {
                        if ("object" == typeof videoInit && "function" == typeof videoInit.start) try {
                            videoInit.start(e, n);
                        } catch (e) {}
                    },
                    release: function() {},
                    placementsList: function() {}
                });
                const e = function(e, t) {
                    if (e && e.push) for (e.push = t; e.length; ) t(e.shift());
                }, t = function(e) {
                    try {
                        e();
                    } catch (e) {
                        console.error(e);
                    }
                };
                "complete" === document.readyState ? e(sas_idmnet.cmd, t) : window.addEventListener("load", (() => {
                    e(sas_idmnet.cmd, t);
                }));
            })();
            Object.defineProperty(Window.prototype.toString, "35966fc2cd75edd8c085792a4413cc08", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "35966fc2cd75edd8c085792a4413cc08" due to: ' + e);
        }
    },
    "!function(){window.YLHH={bidder:{startAuction:function(){}}};}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["609bede022cc082da833f6d8f49bff77"] === e) return;
            window.YLHH = {
                bidder: {
                    startAuction: function() {}
                }
            };
            Object.defineProperty(Window.prototype.toString, "609bede022cc082da833f6d8f49bff77", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "609bede022cc082da833f6d8f49bff77" due to: ' + e);
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return g===1e3&&/#kam-ban-player/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            const t = "done";
            if (Window.prototype.toString["4706a9dfd57dc72a9584b54986a27381"] === t) return;
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    return 1e3 === o && /#kam-ban-player/.test(e.toString()) && (o *= .01), t.apply(this, arguments);
                }.bind(window);
            }();
            Object.defineProperty(Window.prototype.toString, "4706a9dfd57dc72a9584b54986a27381", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "4706a9dfd57dc72a9584b54986a27381" due to: ' + t);
        }
    },
    "Object.defineProperty(Object.prototype,'getCreativeId',{value:()=>{}});": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bb1e9134a8b4e3c7a0b399a46c02c14b === e) return;
            Object.defineProperty(Object.prototype, "getCreativeId", {
                value: () => {}
            });
            Object.defineProperty(Window.prototype.toString, "bb1e9134a8b4e3c7a0b399a46c02c14b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bb1e9134a8b4e3c7a0b399a46c02c14b" due to: ' + e);
        }
    },
    '(()=>{const t=Object.getOwnPropertyDescriptor,e={apply:(e,n,r)=>{const o=r[0];if(o?.toString?.()?.includes("EventTarget")){const e=t(o,"addEventListener");e?.set?.toString&&(e.set.toString=function(){}),e?.get?.toString&&(e.get.toString=function(){})}return Reflect.apply(e,n,r)}};window.Object.getOwnPropertyDescriptors=new Proxy(window.Object.getOwnPropertyDescriptors,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f5e04b1e897644b8741f5724e8210233 === e) return;
            (() => {
                const e = Object.getOwnPropertyDescriptor, t = {
                    apply: (t, r, n) => {
                        const o = n[0];
                        if (o?.toString?.()?.includes("EventTarget")) {
                            const t = e(o, "addEventListener");
                            t?.set?.toString && (t.set.toString = function() {}), t?.get?.toString && (t.get.toString = function() {});
                        }
                        return Reflect.apply(t, r, n);
                    }
                };
                window.Object.getOwnPropertyDescriptors = new Proxy(window.Object.getOwnPropertyDescriptors, t);
            })();
            Object.defineProperty(Window.prototype.toString, "f5e04b1e897644b8741f5724e8210233", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f5e04b1e897644b8741f5724e8210233" due to: ' + e);
        }
    },
    '(()=>{Object.defineProperty=new Proxy(Object.defineProperty,{apply:(e,t,n)=>{const r=new Set(["VP","w3","JW"]),o=n[1],c=n[2]?.get;return o&&r.has(o)&&"function"==typeof c&&/^\\(\\)=>.$/.test(c.toString())&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n)}});})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["78efcafe6d31d29f2e5224aca115d0e2"] === e) return;
            Object.defineProperty = new Proxy(Object.defineProperty, {
                apply: (e, t, r) => {
                    const n = new Set([ "VP", "w3", "JW" ]), o = r[1], c = r[2]?.get;
                    return o && n.has(o) && "function" == typeof c && /^\(\)=>.$/.test(c.toString()) && (r[2].get = function() {
                        return function() {
                            return !1;
                        };
                    }), Reflect.apply(e, t, r);
                }
            });
            Object.defineProperty(Window.prototype.toString, "78efcafe6d31d29f2e5224aca115d0e2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "78efcafe6d31d29f2e5224aca115d0e2" due to: ' + e);
        }
    },
    "window.showAds = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8174026a0a9d6a02df2f05c27e91b2e6"] === e) return;
            window.showAds = !0;
            Object.defineProperty(Window.prototype.toString, "8174026a0a9d6a02df2f05c27e91b2e6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8174026a0a9d6a02df2f05c27e91b2e6" due to: ' + e);
        }
    },
    "window.uabpInject = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2809f16b065b7f9160467af78eee1331"] === e) return;
            window.uabpInject = function() {};
            Object.defineProperty(Window.prototype.toString, "2809f16b065b7f9160467af78eee1331", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2809f16b065b7f9160467af78eee1331" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/checkAds\\(\\);/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["140cb9c461f230aead2587075c4c3389"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/checkAds\(\);/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "140cb9c461f230aead2587075c4c3389", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "140cb9c461f230aead2587075c4c3389" due to: ' + e);
        }
    },
    "window.adblock = true;": () => {
        try {
            const a = "done";
            if (Window.prototype.toString.a512aca8faf6bfd74f571200978abea9 === a) return;
            window.adblock = !0;
            Object.defineProperty(Window.prototype.toString, "a512aca8faf6bfd74f571200978abea9", {
                value: a,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (a) {
            console.error('Error executing AG js rule with uniqueId "a512aca8faf6bfd74f571200978abea9" due to: ' + a);
        }
    },
    "window.ads_unblocked = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["786bc16fd657931f3a0d027130de4773"] === e) return;
            window.ads_unblocked = !0;
            Object.defineProperty(Window.prototype.toString, "786bc16fd657931f3a0d027130de4773", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "786bc16fd657931f3a0d027130de4773" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,e,o)=>{try{const t=e;t&&"object"==typeof t&&t.context?.bidRequestId&&(e={})}catch(t){}return Reflect.apply(t,e,o)}};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["34e4fe8cb80172726ed88130c50a490c"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => {
                        try {
                            const e = t;
                            e && "object" == typeof e && e.context?.bidRequestId && (t = {});
                        } catch (e) {}
                        return Reflect.apply(e, t, o);
                    }
                };
                window.Object.prototype.hasOwnProperty = new Proxy(window.Object.prototype.hasOwnProperty, e);
            })();
            Object.defineProperty(Window.prototype.toString, "34e4fe8cb80172726ed88130c50a490c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "34e4fe8cb80172726ed88130c50a490c" due to: ' + e);
        }
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("</VAST>")&&(e[0]=""),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["877dd0aed94e4d29a83c4c3327d544f8"] === e) return;
            !function() {
                const e = {
                    apply: (e, r, o) => (o[0]?.includes?.("</VAST>") && (o[0] = ""), Reflect.apply(e, r, o))
                };
                window.DOMParser.prototype.parseFromString = new Proxy(window.DOMParser.prototype.parseFromString, e);
            }();
            Object.defineProperty(Window.prototype.toString, "877dd0aed94e4d29a83c4c3327d544f8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "877dd0aed94e4d29a83c4c3327d544f8" due to: ' + e);
        }
    },
    "window.adsOk = !0;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["58f079e742093da39c91a591e99389ce"] === e) return;
            window.adsOk = !0;
            Object.defineProperty(Window.prototype.toString, "58f079e742093da39c91a591e99389ce", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "58f079e742093da39c91a591e99389ce" due to: ' + e);
        }
    },
    "window.ads_ok = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6038ece558032e1fa11a8e02beb32499"] === e) return;
            window.ads_ok = !0;
            Object.defineProperty(Window.prototype.toString, "6038ece558032e1fa11a8e02beb32499", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6038ece558032e1fa11a8e02beb32499" due to: ' + e);
        }
    },
    '(()=>{const t={construct:(t,n,o)=>{const e=n[0],s=e?.toString(),c=s?.includes("await this.whenGDPRClosed()");return c&&(n[0]=t=>t(!0)),Reflect.construct(t,n,o)}};window.Promise=new Proxy(window.Promise,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2def40885e045b3521a04fe19856fe24"] === e) return;
            (() => {
                const e = {
                    construct: (e, t, o) => {
                        const r = t[0], n = r?.toString(), i = n?.includes("await this.whenGDPRClosed()");
                        return i && (t[0] = e => e(!0)), Reflect.construct(e, t, o);
                    }
                };
                window.Promise = new Proxy(window.Promise, e);
            })();
            Object.defineProperty(Window.prototype.toString, "2def40885e045b3521a04fe19856fe24", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2def40885e045b3521a04fe19856fe24" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/notDetectedBy/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2eed1ef0d478b67cb9b988fd355d6582"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/notDetectedBy/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "2eed1ef0d478b67cb9b988fd355d6582", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2eed1ef0d478b67cb9b988fd355d6582" due to: ' + e);
        }
    },
    "window.adBlockTest = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ea236b492fa35d17f8aeddec6c38ef4a === e) return;
            window.adBlockTest = !0;
            Object.defineProperty(Window.prototype.toString, "ea236b492fa35d17f8aeddec6c38ef4a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ea236b492fa35d17f8aeddec6c38ef4a" due to: ' + e);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/ib\\.adnxs\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("POST"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["14b2658c5d58ff999b0f841402be6327"] === e) return;
            !function() {
                var e = XMLHttpRequest.prototype.open, t = /ib\.adnxs\.com/i;
                XMLHttpRequest.prototype.open = function(o, n) {
                    if ("POST" !== o || !t.test(n)) return e.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", n);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "14b2658c5d58ff999b0f841402be6327", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "14b2658c5d58ff999b0f841402be6327" due to: ' + e);
        }
    },
    '(()=>{if(!location.href.includes("/player.php?url="))return;const a=new URLSearchParams(location.search).get("url");a&&location.assign(a)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a9a1e83dfb5f1117af5ce4dfbce68798 === e) return;
            (() => {
                if (!location.href.includes("/player.php?url=")) return;
                const e = new URLSearchParams(location.search).get("url");
                e && location.assign(e);
            })();
            Object.defineProperty(Window.prototype.toString, "a9a1e83dfb5f1117af5ce4dfbce68798", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a9a1e83dfb5f1117af5ce4dfbce68798" due to: ' + e);
        }
    },
    '(()=>{window.addEventListener("load",(()=>{"object"==typeof window.player&&"function"==typeof window.player.trigger&&window.player.trigger("playlistComplete")}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["777ecb0cee36adcb947f146ce7e592d2"] === e) return;
            window.addEventListener("load", (() => {
                "object" == typeof window.player && "function" == typeof window.player.trigger && window.player.trigger("playlistComplete");
            }));
            Object.defineProperty(Window.prototype.toString, "777ecb0cee36adcb947f146ce7e592d2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "777ecb0cee36adcb947f146ce7e592d2" due to: ' + e);
        }
    },
    '!function(){if(location.pathname.includes("/source/playerads")){var b=new MutationObserver(function(){var a=document.querySelector(\'script[type="text/javascript"]\');a&&a.textContent.includes(\'"ads": [\')&&(b.disconnect(),a.textContent=a.textContent.replace(/("ads": \\[\\{)[\\s\\S]*?(\\}\\])/,"$1$2"))});b.observe(document,{childList:!0,subtree:!0})}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.aae0d51166190a469962b4394ad11852 === e) return;
            !function() {
                if (location.pathname.includes("/source/playerads")) {
                    var e = new MutationObserver((function() {
                        var t = document.querySelector('script[type="text/javascript"]');
                        t && t.textContent.includes('"ads": [') && (e.disconnect(), t.textContent = t.textContent.replace(/("ads": \[\{)[\s\S]*?(\}\])/, "$1$2"));
                    }));
                    e.observe(document, {
                        childList: !0,
                        subtree: !0
                    });
                }
            }();
            Object.defineProperty(Window.prototype.toString, "aae0d51166190a469962b4394ad11852", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "aae0d51166190a469962b4394ad11852" due to: ' + e);
        }
    },
    "clientSide.player.play(true);": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a5b3c4cf6ebf6b65e649d4696be29d38 === e) return;
            clientSide.player.play(!0);
            Object.defineProperty(Window.prototype.toString, "a5b3c4cf6ebf6b65e649d4696be29d38", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a5b3c4cf6ebf6b65e649d4696be29d38" due to: ' + e);
        }
    },
    '(()=>{if(location.href.includes("/embed/?link=")){const i=new URL(location.href).searchParams.get("link");if(i)try{location.assign(i)}catch(i){}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["70f2ca47c305ca62ef161409642baaae"] === e) return;
            (() => {
                if (location.href.includes("/embed/?link=")) {
                    const e = new URL(location.href).searchParams.get("link");
                    if (e) try {
                        location.assign(e);
                    } catch (e) {}
                }
            })();
            Object.defineProperty(Window.prototype.toString, "70f2ca47c305ca62ef161409642baaae", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "70f2ca47c305ca62ef161409642baaae" due to: ' + e);
        }
    },
    "(function(){Object.defineProperty(window, 'ExoLoader', { get: function() { return; } }); var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"getexoloader\"!=a&&-1==b.toString().indexOf('loader')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a8d7f5b4e27b5a94d3b0c3528bdccb9c === e) return;
            !function() {
                Object.defineProperty(window, "ExoLoader", {
                    get: function() {}
                });
                var e = document.addEventListener;
                document.addEventListener = function(t, n, o, d) {
                    "getexoloader" != t && -1 == n.toString().indexOf("loader") && e(t, n, o, d);
                }.bind(document);
            }();
            Object.defineProperty(Window.prototype.toString, "a8d7f5b4e27b5a94d3b0c3528bdccb9c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a8d7f5b4e27b5a94d3b0c3528bdccb9c" due to: ' + e);
        }
    },
    '((e,t)=>{const n={apply:(n,o,r)=>{try{const s=r[1];if(!s)return Reflect.apply(n,o,r);const c=typeof s;if("string"===c&&s.includes?.(t)){const t=new URL(s);t.searchParams.delete(e);const n=t.href.replace("%2CCuepointPlaylist","");r[1]=n}else if("object"===c&&s instanceof URL&&s.href?.includes?.(t)){s.searchParams.delete(e);const t=s.href.replace("%2CCuepointPlaylist","");r[1]=t}}catch(e){}return Reflect.apply(n,o,r)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,n)})("deviceAdInsertionTypeOverride","/GetPlaybackResources?");': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["5f0cb8ad699e93dee39f5abf0dfec256"] === e) return;
            ((e, t) => {
                const r = {
                    apply: (r, o, n) => {
                        try {
                            const c = n[1];
                            if (!c) return Reflect.apply(r, o, n);
                            const a = typeof c;
                            if ("string" === a && c.includes?.(t)) {
                                const t = new URL(c);
                                t.searchParams.delete(e);
                                const r = t.href.replace("%2CCuepointPlaylist", "");
                                n[1] = r;
                            } else if ("object" === a && c instanceof URL && c.href?.includes?.(t)) {
                                c.searchParams.delete(e);
                                const t = c.href.replace("%2CCuepointPlaylist", "");
                                n[1] = t;
                            }
                        } catch (e) {}
                        return Reflect.apply(r, o, n);
                    }
                };
                window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, r);
            })("deviceAdInsertionTypeOverride", "/GetPlaybackResources?");
            Object.defineProperty(Window.prototype.toString, "5f0cb8ad699e93dee39f5abf0dfec256", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "5f0cb8ad699e93dee39f5abf0dfec256" due to: ' + e);
        }
    },
    '(()=>{if(window.self!==window.top)try{if("object"==typeof localStorage)return}catch(a){delete window.localStorage,window.localStorage={setItem(){},getItem(){},removeItem(){},clear(){}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6c5874d9ea24235e4a8490028ce09e66"] === e) return;
            (() => {
                if (window.self !== window.top) try {
                    if ("object" == typeof localStorage) return;
                } catch (e) {
                    delete window.localStorage, window.localStorage = {
                        setItem() {},
                        getItem() {},
                        removeItem() {},
                        clear() {}
                    };
                }
            })();
            Object.defineProperty(Window.prototype.toString, "6c5874d9ea24235e4a8490028ce09e66", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6c5874d9ea24235e4a8490028ce09e66" due to: ' + e);
        }
    },
    '(()=>{const e=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").set,t=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").get;Object.defineProperty(Element.prototype,"innerHTML",{get(){const e=t.call(this);return e.includes("delete window")?"":e},set(t){e.call(this,t)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e233c6aa26d14c122933ca24bb028498 === e) return;
            (() => {
                const e = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set, t = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").get;
                Object.defineProperty(Element.prototype, "innerHTML", {
                    get() {
                        const e = t.call(this);
                        return e.includes("delete window") ? "" : e;
                    },
                    set(t) {
                        e.call(this, t);
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "e233c6aa26d14c122933ca24bb028498", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e233c6aa26d14c122933ca24bb028498" due to: ' + e);
        }
    },
    '(()=>{const e=new Event("resize");window.addEventListener("load",(()=>{const t=document.querySelector(".flexrow.app > div");(0===localStorage.length||void 0===JSON.parse(localStorage._ppp)["0_uid"])&&t&&t.clientWidth<window.innerWidth&&(Object.defineProperty(window,"innerWidth",{get:()=>document.documentElement.offsetWidth+315}),window.dispatchEvent(e))}))})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.deb5083a9bad3cb67b36ac148ea7ba26 === e) return;
            (() => {
                const e = new Event("resize");
                window.addEventListener("load", (() => {
                    const t = document.querySelector(".flexrow.app > div");
                    (0 === localStorage.length || void 0 === JSON.parse(localStorage._ppp)["0_uid"]) && t && t.clientWidth < window.innerWidth && (Object.defineProperty(window, "innerWidth", {
                        get: () => document.documentElement.offsetWidth + 315
                    }), window.dispatchEvent(e));
                }));
            })();
            Object.defineProperty(Window.prototype.toString, "deb5083a9bad3cb67b36ac148ea7ba26", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "deb5083a9bad3cb67b36ac148ea7ba26" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{"function"==typeof getfull&&getfull()}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["45e2ee4fbb5fd647b76cf34c6f5c7222"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                "function" == typeof getfull && getfull();
            }));
            Object.defineProperty(Window.prototype.toString, "45e2ee4fbb5fd647b76cf34c6f5c7222", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "45e2ee4fbb5fd647b76cf34c6f5c7222" due to: ' + e);
        }
    },
    '(()=>{let e=!1;const l={apply:async(e,l,o)=>{const r=o[0];return!1===r?.rewardAllowed&&(o[0].rewardAllowed=!0),Reflect.apply(e,l,o)}},o={apply:(o,r,t)=>{const n=t[0]?.pokiAdsCompleted;return!e&&n&&n[0]?.toString()?.includes("rewardAllowed")&&(n[0]=new Proxy(n[0],l),e=!0),Reflect.apply(o,r,t)}};window.Object.keys=new Proxy(window.Object.keys,o)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["85cbf457d7f9be26230706564eebecbe"] === e) return;
            (() => {
                let e = !1;
                const r = {
                    apply: async (e, r, t) => {
                        const o = t[0];
                        return !1 === o?.rewardAllowed && (t[0].rewardAllowed = !0), Reflect.apply(e, r, t);
                    }
                }, t = {
                    apply: (t, o, n) => {
                        const c = n[0]?.pokiAdsCompleted;
                        return !e && c && c[0]?.toString()?.includes("rewardAllowed") && (c[0] = new Proxy(c[0], r), 
                        e = !0), Reflect.apply(t, o, n);
                    }
                };
                window.Object.keys = new Proxy(window.Object.keys, t);
            })();
            Object.defineProperty(Window.prototype.toString, "85cbf457d7f9be26230706564eebecbe", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "85cbf457d7f9be26230706564eebecbe" due to: ' + e);
        }
    },
    '(()=>{window.Pogo=window.Pogo||{},window.Pogo.cmd=[],window.Pogo.cmd.push=o=>{"function"==typeof o&&o()},window.Pogo.getVideoTag=(o,w)=>{w&&"function"==typeof w&&w()};})();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString.f1975fac6cc2feb528947114b7201f11 === o) return;
            window.Pogo = window.Pogo || {}, window.Pogo.cmd = [], window.Pogo.cmd.push = o => {
                "function" == typeof o && o();
            }, window.Pogo.getVideoTag = (o, e) => {
                e && "function" == typeof e && e();
            };
            Object.defineProperty(Window.prototype.toString, "f1975fac6cc2feb528947114b7201f11", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "f1975fac6cc2feb528947114b7201f11" due to: ' + o);
        }
    },
    '(()=>{const e=document.documentElement;new MutationObserver((()=>{const e=document.querySelector(".skeleton-video-cover-noanimate > .relative > a[href] + button");e&&e.click()})).observe(e,{attributes:!0,childList:!0,subtree:!0})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ede6f5f26db9cc9b12941b760f3f2911 === e) return;
            (() => {
                const e = document.documentElement;
                new MutationObserver((() => {
                    const e = document.querySelector(".skeleton-video-cover-noanimate > .relative > a[href] + button");
                    e && e.click();
                })).observe(e, {
                    attributes: !0,
                    childList: !0,
                    subtree: !0
                });
            })();
            Object.defineProperty(Window.prototype.toString, "ede6f5f26db9cc9b12941b760f3f2911", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ede6f5f26db9cc9b12941b760f3f2911" due to: ' + e);
        }
    },
    "(()=>{const n=[];n.push=n=>{try{n()}catch(n){console.error(n)}},window.adsNinja=window.adsNinja||{queue:n}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4893d02be5a2a7c0f59287a47260c7b0"] === e) return;
            (() => {
                const e = [];
                e.push = e => {
                    try {
                        e();
                    } catch (e) {
                        console.error(e);
                    }
                }, window.adsNinja = window.adsNinja || {
                    queue: e
                };
            })();
            Object.defineProperty(Window.prototype.toString, "4893d02be5a2a7c0f59287a47260c7b0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4893d02be5a2a7c0f59287a47260c7b0" due to: ' + e);
        }
    },
    '(()=>{window.Bolt={on:(o,n,i)=>{"precontent_ad_video"===o&&"AD_COMPLETE"===n&&"function"==typeof i&&i()},BOLT_AD_COMPLETE:"AD_COMPLETE",BOLT_AD_ERROR:"AD_ERROR"},window.ramp=window.ramp||{},window.ramp.addUnits=()=>Promise.resolve(),window.ramp.displayUnits=()=>{setTimeout((()=>{"function"==typeof window.ramp.onPlayerReady&&window.ramp.onPlayerReady()}),1)};})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["13196ca8ba80be48cb3a530394beced8"] === e) return;
            window.Bolt = {
                on: (e, o, n) => {
                    "precontent_ad_video" === e && "AD_COMPLETE" === o && "function" == typeof n && n();
                },
                BOLT_AD_COMPLETE: "AD_COMPLETE",
                BOLT_AD_ERROR: "AD_ERROR"
            }, window.ramp = window.ramp || {}, window.ramp.addUnits = () => Promise.resolve(), 
            window.ramp.displayUnits = () => {
                setTimeout((() => {
                    "function" == typeof window.ramp.onPlayerReady && window.ramp.onPlayerReady();
                }), 1);
            };
            Object.defineProperty(Window.prototype.toString, "13196ca8ba80be48cb3a530394beced8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "13196ca8ba80be48cb3a530394beced8" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,t,o)=>(o[0]=!0,Reflect.apply(e,t,o))};let t,o=!1;Object.defineProperty(window,"ig",{get:function(){return"function"!=typeof t?.RetentionRewardedVideo?.prototype?.rewardedVideoResult||o||(t.RetentionRewardedVideo.prototype.rewardedVideoResult=new Proxy(t.RetentionRewardedVideo.prototype.rewardedVideoResult,e),o=!0),t},set:function(e){t=e}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["49064caba0f35708edea647b43d9260f"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => (o[0] = !0, Reflect.apply(e, t, o))
                };
                let t, o = !1;
                Object.defineProperty(window, "ig", {
                    get: function() {
                        return "function" != typeof t?.RetentionRewardedVideo?.prototype?.rewardedVideoResult || o || (t.RetentionRewardedVideo.prototype.rewardedVideoResult = new Proxy(t.RetentionRewardedVideo.prototype.rewardedVideoResult, e), 
                        o = !0), t;
                    },
                    set: function(e) {
                        t = e;
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "49064caba0f35708edea647b43d9260f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "49064caba0f35708edea647b43d9260f" due to: ' + e);
        }
    },
    '(()=>{let e,n=!1;const o=function(){};Object.defineProperty(window,"videojs",{get:function(){return e},set:function(t){e=t,!n&&e&&"function"==typeof e.registerPlugin&&(n=!0,e.registerPlugin("skipIma3Unskippable",o))}}),window.SlotTypeEnum={},window.ANAWeb=function(){},window.ANAWeb.prototype.createVideoSlot=function(){return Promise.resolve()},window.ANAWeb.prototype.createSlot=function(){},window.ANAWeb.VideoPlayerType={},window.ANAWeb.VideoPlacementType={InStream:1},window.ANAWeb.AdPosition={AboveTheFold:1},window.ANAWeb.PlaybackMethod={ClickSoundOn:1},window.addEventListener("load",(function(){document.dispatchEvent(new CustomEvent("ANAReady"))}))})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["3b3aa026a1d7fa6e2ba077f743a7d54d"] === e) return;
            (() => {
                let e, o = !1;
                const n = function() {};
                Object.defineProperty(window, "videojs", {
                    get: function() {
                        return e;
                    },
                    set: function(t) {
                        e = t, !o && e && "function" == typeof e.registerPlugin && (o = !0, e.registerPlugin("skipIma3Unskippable", n));
                    }
                }), window.SlotTypeEnum = {}, window.ANAWeb = function() {}, window.ANAWeb.prototype.createVideoSlot = function() {
                    return Promise.resolve();
                }, window.ANAWeb.prototype.createSlot = function() {}, window.ANAWeb.VideoPlayerType = {}, 
                window.ANAWeb.VideoPlacementType = {
                    InStream: 1
                }, window.ANAWeb.AdPosition = {
                    AboveTheFold: 1
                }, window.ANAWeb.PlaybackMethod = {
                    ClickSoundOn: 1
                }, window.addEventListener("load", (function() {
                    document.dispatchEvent(new CustomEvent("ANAReady"));
                }));
            })();
            Object.defineProperty(Window.prototype.toString, "3b3aa026a1d7fa6e2ba077f743a7d54d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "3b3aa026a1d7fa6e2ba077f743a7d54d" due to: ' + e);
        }
    },
    '(()=>{const a=function(){};window.apstag={fetchBids(c,a){"function"==typeof a&&a([])},init:a,setDisplayBids:a,targetingKeys:a}})();': () => {
        try {
            const c = "done";
            if (Window.prototype.toString["11a07f3c1f878acc052df77d287cc2cb"] === c) return;
            (() => {
                const c = function() {};
                window.apstag = {
                    fetchBids(c, t) {
                        "function" == typeof t && t([]);
                    },
                    init: c,
                    setDisplayBids: c,
                    targetingKeys: c
                };
            })();
            Object.defineProperty(Window.prototype.toString, "11a07f3c1f878acc052df77d287cc2cb", {
                value: c,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (c) {
            console.error('Error executing AG js rule with uniqueId "11a07f3c1f878acc052df77d287cc2cb" due to: ' + c);
        }
    },
    '(()=>{window.JSON.parse=new Proxy(JSON.parse,{apply(r,e,t){const s=Reflect.apply(r,e,t),l=s?.results;try{if(l&&Array.isArray(l))s?.results&&(s.results=s.results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})));else for(let r in s){const e=s[r]?.results;e&&Array.isArray(e)&&(s[r].results=s[r].results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})))}}catch(r){}return s}});})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b91767671ee5e3e933cdcfdac4efc25b === e) return;
            window.JSON.parse = new Proxy(JSON.parse, {
                apply(e, r, t) {
                    const c = Reflect.apply(e, r, t), o = c?.results;
                    try {
                        if (o && Array.isArray(o)) c?.results && (c.results = c.results.filter((e => {
                            if (!Object.prototype.hasOwnProperty.call(e, "adTitle")) return e;
                        }))); else for (let e in c) {
                            const r = c[e]?.results;
                            r && Array.isArray(r) && (c[e].results = c[e].results.filter((e => {
                                if (!Object.prototype.hasOwnProperty.call(e, "adTitle")) return e;
                            })));
                        }
                    } catch (e) {}
                    return c;
                }
            });
            Object.defineProperty(Window.prototype.toString, "b91767671ee5e3e933cdcfdac4efc25b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b91767671ee5e3e933cdcfdac4efc25b" due to: ' + e);
        }
    },
    '(()=>{let e,n=!1;const t=function(){};Object.defineProperty(window,"videojs",{get:function(){return e},set:function(i){e=i,!n&&e&&"function"==typeof e.registerPlugin&&(n=!0,e.registerPlugin("ads",t))}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c14cd51b0bc81e9fb5cd82344ac7da2e === e) return;
            (() => {
                let e, t = !1;
                const c = function() {};
                Object.defineProperty(window, "videojs", {
                    get: function() {
                        return e;
                    },
                    set: function(n) {
                        e = n, !t && e && "function" == typeof e.registerPlugin && (t = !0, e.registerPlugin("ads", c));
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "c14cd51b0bc81e9fb5cd82344ac7da2e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c14cd51b0bc81e9fb5cd82344ac7da2e" due to: ' + e);
        }
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){},rp:{requestVideoBids:function(n){if("function"==typeof n?.callback)try{n.callback.call()}catch(n){}}}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': () => {
        try {
            const n = "done";
            if (Window.prototype.toString.a12991f34fbcdc0cb606380a258fde90 === n) return;
            (() => {
                const n = function(n) {
                    if ("function" == typeof n) try {
                        n.call();
                    } catch (n) {}
                }, t = {
                    addAdUnits: function() {},
                    adServers: {
                        dfp: {
                            buildVideoUrl: function() {
                                return "";
                            }
                        }
                    },
                    adUnits: [],
                    aliasBidder: function() {},
                    cmd: [],
                    enableAnalytics: function() {},
                    getHighestCpmBids: function() {
                        return [];
                    },
                    libLoaded: !0,
                    que: [],
                    requestBids: function(n) {
                        if (n instanceof Object && n.bidsBackHandler) try {
                            n.bidsBackHandler.call();
                        } catch (n) {}
                    },
                    removeAdUnit: function() {},
                    setBidderConfig: function() {},
                    setConfig: function() {},
                    setTargetingForGPTAsync: function() {},
                    rp: {
                        requestVideoBids: function(n) {
                            if ("function" == typeof n?.callback) try {
                                n.callback.call();
                            } catch (n) {}
                        }
                    }
                };
                t.cmd.push = n, t.que.push = n, window.pbjs = t;
            })();
            Object.defineProperty(Window.prototype.toString, "a12991f34fbcdc0cb606380a258fde90", {
                value: n,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (n) {
            console.error('Error executing AG js rule with uniqueId "a12991f34fbcdc0cb606380a258fde90" due to: ' + n);
        }
    },
    '(()=>{const c=function(){[...arguments].forEach((c=>{if("function"==typeof c)try{c(!0)}catch(c){console.debug(c)}}))},n=[];n.push=c,window.PQ={cmd:n,getTargeting:c}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["52a467e415654146fde7899c49035b7f"] === e) return;
            (() => {
                const e = function() {
                    [ ...arguments ].forEach((e => {
                        if ("function" == typeof e) try {
                            e(!0);
                        } catch (e) {
                            console.debug(e);
                        }
                    }));
                }, t = [];
                t.push = e, window.PQ = {
                    cmd: t,
                    getTargeting: e
                };
            })();
            Object.defineProperty(Window.prototype.toString, "52a467e415654146fde7899c49035b7f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "52a467e415654146fde7899c49035b7f" due to: ' + e);
        }
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["5eccf85ec7e71ba4deefe939741fb145"] === e) return;
            (() => {
                const e = function(e) {
                    if ("function" == typeof e) try {
                        e.call();
                    } catch (e) {}
                }, n = {
                    addAdUnits: function() {},
                    adServers: {
                        dfp: {
                            buildVideoUrl: function() {
                                return "";
                            }
                        }
                    },
                    adUnits: [],
                    aliasBidder: function() {},
                    cmd: [],
                    enableAnalytics: function() {},
                    getHighestCpmBids: function() {
                        return [];
                    },
                    libLoaded: !0,
                    que: [],
                    requestBids: function(e) {
                        if (e instanceof Object && e.bidsBackHandler) try {
                            e.bidsBackHandler.call();
                        } catch (e) {}
                    },
                    removeAdUnit: function() {},
                    setBidderConfig: function() {},
                    setConfig: function() {},
                    setTargetingForGPTAsync: function() {}
                };
                n.cmd.push = e, n.que.push = e, window.pbjs = n;
            })();
            Object.defineProperty(Window.prototype.toString, "5eccf85ec7e71ba4deefe939741fb145", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "5eccf85ec7e71ba4deefe939741fb145" due to: ' + e);
        }
    },
    "(()=>{const e={apply:(e,t,l)=>{if(!t.matches('a[href][target=\"_blank\"]'))return Reflect.apply(e,t,l)}};window.HTMLElement.prototype.click=new Proxy(window.HTMLElement.prototype.click,e)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0a528b39acd15b3dec81e240fde05757"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, r) => {
                        if (!t.matches('a[href][target="_blank"]')) return Reflect.apply(e, t, r);
                    }
                };
                window.HTMLElement.prototype.click = new Proxy(window.HTMLElement.prototype.click, e);
            })();
            Object.defineProperty(Window.prototype.toString, "0a528b39acd15b3dec81e240fde05757", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0a528b39acd15b3dec81e240fde05757" due to: ' + e);
        }
    },
    '(()=>{const t=[];t.push=function(t){try{t()}catch(t){}};window.headertag={cmd:t,buildGamMvt:function(t,c){const n={[c]:"https://securepubads.g.doubleclick.net/gampad/ads"};return n||{}},retrieveVideoDemand:function(t,c,n){const e=t[0]?.htSlotName;if("function"==typeof c)try{c(e)}catch(t){}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4a7e38f499848781627483fb1bb70105"] === e) return;
            (() => {
                const e = [];
                e.push = function(e) {
                    try {
                        e();
                    } catch (e) {}
                };
                window.headertag = {
                    cmd: e,
                    buildGamMvt: function(e, t) {
                        return {
                            [t]: "https://securepubads.g.doubleclick.net/gampad/ads"
                        } || {};
                    },
                    retrieveVideoDemand: function(e, t, o) {
                        const n = e[0]?.htSlotName;
                        if ("function" == typeof t) try {
                            t(n);
                        } catch (e) {}
                    }
                };
            })();
            Object.defineProperty(Window.prototype.toString, "4a7e38f499848781627483fb1bb70105", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4a7e38f499848781627483fb1bb70105" due to: ' + e);
        }
    },
    '(()=>{const e="3.453.0",t=function(){},s={},n=function(e){const t=document.createElement("div");t.style.setProperty("display","none","important"),t.style.setProperty("visibility","collapse","important"),e&&e.appendChild(t)};n.prototype.destroy=t,n.prototype.initialize=t;const i=function(){};i.CompanionBackfillMode={ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},i.VpaidMode={DISABLED:0,ENABLED:1,INSECURE:2},i.prototype={c:!0,f:{},i:!1,l:"",p:"",r:0,t:"",v:"",getCompanionBackfill:t,getDisableCustomPlaybackForIOS10Plus(){return this.i},getDisabledFlashAds:()=>!0,getFeatureFlags(){return this.f},getLocale(){return this.l},getNumRedirects(){return this.r},getPlayerType(){return this.t},getPlayerVersion(){return this.v},getPpid(){return this.p},getVpaidMode(){return this.C},isCookiesEnabled(){return this.c},isVpaidAdapter(){return this.M},setCompanionBackfill:t,setAutoPlayAdBreaks(e){this.K=e},setCookiesEnabled(e){this.c=!!e},setDisableCustomPlaybackForIOS10Plus(e){this.i=!!e},setDisableFlashAds:t,setFeatureFlags(e){this.f=!!e},setIsVpaidAdapter(e){this.M=e},setLocale(e){this.l=!!e},setNumRedirects(e){this.r=!!e},setPageCorrelator(e){this.R=e},setPlayerType(e){this.t=!!e},setPlayerVersion(e){this.v=!!e},setPpid(e){this.p=!!e},setVpaidMode(e){this.C=e},setSessionId:t,setStreamCorrelator:t,setVpaidAllowed:t,CompanionBackfillMode:{ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},VpaidMode:{DISABLED:0,ENABLED:1,INSECURE:2}};const r=function(){this.listeners=new Map,this._dispatch=function(e){let t=this.listeners.get(e.type);t=t?t.values():[];for(const s of Array.from(t))try{s(e)}catch(e){console.trace(e)}},this.addEventListener=function(e,t,s,n){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const i=e[s];this.listeners.has(i)||this.listeners.set(i,new Map),this.listeners.get(i).set(t,t.bind(n||this))}},this.removeEventListener=function(e,t){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const n=e[s];this.listeners.get(n)?.delete(t)}}},o=new r;o.volume=1,o.collapse=t,o.configureAdsManager=t,o.destroy=t,o.discardAdBreak=t,o.expand=t,o.focus=t,o.getAdSkippableState=()=>!1,o.getCuePoints=()=>[0],o.getCurrentAd=()=>h,o.getCurrentAdCuePoints=()=>[],o.getRemainingTime=()=>0,o.getVolume=function(){return this.volume},o.init=t,o.isCustomClickTrackingUsed=()=>!1,o.isCustomPlaybackUsed=()=>!1,o.pause=t,o.requestNextAdBreak=t,o.resize=t,o.resume=t,o.setVolume=function(e){this.volume=e},o.skip=t,o.start=function(){for(const e of [T.Type.LOADED,T.Type.STARTED,T.Type.CONTENT_RESUME_REQUESTED,T.Type.AD_BUFFERING,T.Type.FIRST_QUARTILE,T.Type.MIDPOINT,T.Type.THIRD_QUARTILE,T.Type.COMPLETE,T.Type.ALL_ADS_COMPLETED])try{this._dispatch(new s.AdEvent(e))}catch(e){console.trace(e)}},o.stop=t,o.updateAdsRenderingSettings=t;const a=Object.create(o),d=function(e,t,s){this.type=e,this.adsRequest=t,this.userRequestContext=s};d.prototype={getAdsManager:()=>a,getUserRequestContext(){return this.userRequestContext?this.userRequestContext:{}}},d.Type={ADS_MANAGER_LOADED:"adsManagerLoaded"};const E=r;E.prototype.settings=new i,E.prototype.contentComplete=t,E.prototype.destroy=t,E.prototype.getSettings=function(){return this.settings},E.prototype.getVersion=()=>e,E.prototype.requestAds=function(e,t){requestAnimationFrame((()=>{const{ADS_MANAGER_LOADED:n}=d.Type,i=new s.AdsManagerLoadedEvent(n,e,t);this._dispatch(i)}));const n=new s.AdError("adPlayError",1205,1205,"The browser prevented playback initiated without user interaction.",e,t);requestAnimationFrame((()=>{this._dispatch(new s.AdErrorEvent(n))}))};const A=t,u=function(){};u.prototype={setAdWillAutoPlay:t,setAdWillPlayMuted:t,setContinuousPlayback:t};const l=function(){};l.prototype={getAdPosition:()=>1,getIsBumper:()=>!1,getMaxDuration:()=>-1,getPodIndex:()=>1,getTimeOffset:()=>0,getTotalAds:()=>1};const g=function(){};g.prototype.getAdIdRegistry=function(){return""},g.prototype.getAdIsValue=function(){return""};const p=function(){};p.prototype={pi:new l,getAdId:()=>"",getAdPodInfo(){return this.pi},getAdSystem:()=>"",getAdvertiserName:()=>"",getApiFramework:()=>null,getCompanionAds:()=>[],getContentType:()=>"",getCreativeAdId:()=>"",getDealId:()=>"",getDescription:()=>"",getDuration:()=>8.5,getHeight:()=>0,getMediaUrl:()=>null,getMinSuggestedDuration:()=>-2,getSkipTimeOffset:()=>-1,getSurveyUrl:()=>null,getTitle:()=>"",getTraffickingParametersString:()=>"",getUiElements:()=>[""],getUniversalAdIdRegistry:()=>"unknown",getUniversalAdIds:()=>[new g],getUniversalAdIdValue:()=>"unknown",getVastMediaBitrate:()=>0,getVastMediaHeight:()=>0,getVastMediaWidth:()=>0,getWidth:()=>0,getWrapperAdIds:()=>[""],getWrapperAdSystems:()=>[""],getWrapperCreativeIds:()=>[""],isLinear:()=>!0,isSkippable:()=>!0};const c=function(){};c.prototype={getAdSlotId:()=>"",getContent:()=>"",getContentType:()=>"",getHeight:()=>1,getWidth:()=>1};const C=function(e,t,s,n,i,r){this.errorCode=t,this.message=n,this.type=e,this.adsRequest=i,this.userRequestContext=r,this.getErrorCode=function(){return this.errorCode},this.getInnerError=function(){return null},this.getMessage=function(){return this.message},this.getType=function(){return this.type},this.getVastErrorCode=function(){return this.vastErrorCode},this.toString=function(){return`AdError ${this.errorCode}: ${this.message}`}};C.ErrorCode={},C.Type={};const h=(()=>{try{for(const e of Object.values(window.vidible._getContexts()))if(e.getPlayer()?.div?.innerHTML.includes("www.engadget.com"))return!0}catch(e){}return!1})()?void 0:new p,T=function(e){this.type=e};T.prototype={getAd:()=>h,getAdData:()=>{}},T.Type={AD_BREAK_READY:"adBreakReady",AD_BUFFERING:"adBuffering",AD_CAN_PLAY:"adCanPlay",AD_METADATA:"adMetadata",AD_PROGRESS:"adProgress",ALL_ADS_COMPLETED:"allAdsCompleted",CLICK:"click",COMPLETE:"complete",CONTENT_PAUSE_REQUESTED:"contentPauseRequested",CONTENT_RESUME_REQUESTED:"contentResumeRequested",DURATION_CHANGE:"durationChange",EXPANDED_CHANGED:"expandedChanged",FIRST_QUARTILE:"firstQuartile",IMPRESSION:"impression",INTERACTION:"interaction",LINEAR_CHANGE:"linearChange",LINEAR_CHANGED:"linearChanged",LOADED:"loaded",LOG:"log",MIDPOINT:"midpoint",PAUSED:"pause",RESUMED:"resume",SKIPPABLE_STATE_CHANGED:"skippableStateChanged",SKIPPED:"skip",STARTED:"start",THIRD_QUARTILE:"thirdQuartile",USER_CLOSE:"userClose",VIDEO_CLICKED:"videoClicked",VIDEO_ICON_CLICKED:"videoIconClicked",VIEWABLE_IMPRESSION:"viewable_impression",VOLUME_CHANGED:"volumeChange",VOLUME_MUTED:"mute"};const y=function(e){this.error=e,this.type="adError",this.getError=function(){return this.error},this.getUserRequestContext=function(){return this.error?.userRequestContext?this.error.userRequestContext:{}}};y.Type={AD_ERROR:"adError"};const I=function(){};I.Type={CUSTOM_CONTENT_LOADED:"deprecated-event"};const R=function(){};R.CreativeType={ALL:"All",FLASH:"Flash",IMAGE:"Image"},R.ResourceType={ALL:"All",HTML:"Html",IFRAME:"IFrame",STATIC:"Static"},R.SizeCriteria={IGNORE:"IgnoreSize",SELECT_EXACT_MATCH:"SelectExactMatch",SELECT_NEAR_MATCH:"SelectNearMatch"};const S=function(){};S.prototype={getCuePoints:()=>[],getAdIdRegistry:()=>"",getAdIdValue:()=>""};const D=t;Object.assign(s,{AdCuePoints:S,AdDisplayContainer:n,AdError:C,AdErrorEvent:y,AdEvent:T,AdPodInfo:l,AdProgressData:D,AdsLoader:E,AdsManager:a,AdsManagerLoadedEvent:d,AdsRenderingSettings:A,AdsRequest:u,CompanionAd:c,CompanionAdSelectionSettings:R,CustomContentLoadedEvent:I,gptProxyInstance:{},ImaSdkSettings:i,OmidAccessMode:{DOMAIN:"domain",FULL:"full",LIMITED:"limited"},OmidVerificationVendor:{1:"OTHER",2:"MOAT",3:"DOUBLEVERIFY",4:"INTEGRAL_AD_SCIENCE",5:"PIXELATE",6:"NIELSEN",7:"COMSCORE",8:"MEETRICS",9:"GOOGLE",OTHER:1,MOAT:2,DOUBLEVERIFY:3,INTEGRAL_AD_SCIENCE:4,PIXELATE:5,NIELSEN:6,COMSCORE:7,MEETRICS:8,GOOGLE:9},settings:new i,UiElements:{AD_ATTRIBUTION:"adAttribution",COUNTDOWN:"countdown"},UniversalAdIdInfo:g,VERSION:e,ViewMode:{FULLSCREEN:"fullscreen",NORMAL:"normal"}}),window.google||(window.google={}),window.google.ima?.dai&&(s.dai=window.google.ima.dai),window.google.ima=s})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d7a710ada6cca5832af6d92e62726e74 === e) return;
            (() => {
                const e = "3.453.0", t = function() {}, n = {}, r = function(e) {
                    const t = document.createElement("div");
                    t.style.setProperty("display", "none", "important"), t.style.setProperty("visibility", "collapse", "important"), 
                    e && e.appendChild(t);
                };
                r.prototype.destroy = t, r.prototype.initialize = t;
                const i = function() {};
                i.CompanionBackfillMode = {
                    ALWAYS: "always",
                    ON_MASTER_AD: "on_master_ad"
                }, i.VpaidMode = {
                    DISABLED: 0,
                    ENABLED: 1,
                    INSECURE: 2
                }, i.prototype = {
                    c: !0,
                    f: {},
                    i: !1,
                    l: "",
                    p: "",
                    r: 0,
                    t: "",
                    v: "",
                    getCompanionBackfill: t,
                    getDisableCustomPlaybackForIOS10Plus() {
                        return this.i;
                    },
                    getDisabledFlashAds: () => !0,
                    getFeatureFlags() {
                        return this.f;
                    },
                    getLocale() {
                        return this.l;
                    },
                    getNumRedirects() {
                        return this.r;
                    },
                    getPlayerType() {
                        return this.t;
                    },
                    getPlayerVersion() {
                        return this.v;
                    },
                    getPpid() {
                        return this.p;
                    },
                    getVpaidMode() {
                        return this.C;
                    },
                    isCookiesEnabled() {
                        return this.c;
                    },
                    isVpaidAdapter() {
                        return this.M;
                    },
                    setCompanionBackfill: t,
                    setAutoPlayAdBreaks(e) {
                        this.K = e;
                    },
                    setCookiesEnabled(e) {
                        this.c = !!e;
                    },
                    setDisableCustomPlaybackForIOS10Plus(e) {
                        this.i = !!e;
                    },
                    setDisableFlashAds: t,
                    setFeatureFlags(e) {
                        this.f = !!e;
                    },
                    setIsVpaidAdapter(e) {
                        this.M = e;
                    },
                    setLocale(e) {
                        this.l = !!e;
                    },
                    setNumRedirects(e) {
                        this.r = !!e;
                    },
                    setPageCorrelator(e) {
                        this.R = e;
                    },
                    setPlayerType(e) {
                        this.t = !!e;
                    },
                    setPlayerVersion(e) {
                        this.v = !!e;
                    },
                    setPpid(e) {
                        this.p = !!e;
                    },
                    setVpaidMode(e) {
                        this.C = e;
                    },
                    setSessionId: t,
                    setStreamCorrelator: t,
                    setVpaidAllowed: t,
                    CompanionBackfillMode: {
                        ALWAYS: "always",
                        ON_MASTER_AD: "on_master_ad"
                    },
                    VpaidMode: {
                        DISABLED: 0,
                        ENABLED: 1,
                        INSECURE: 2
                    }
                };
                const s = function() {
                    this.listeners = new Map, this._dispatch = function(e) {
                        let t = this.listeners.get(e.type);
                        t = t ? t.values() : [];
                        for (const n of Array.from(t)) try {
                            n(e);
                        } catch (e) {
                            console.trace(e);
                        }
                    }, this.addEventListener = function(e, t, n, r) {
                        Array.isArray(e) || (e = [ e ]);
                        for (let n = 0; n < e.length; n += 1) {
                            const i = e[n];
                            this.listeners.has(i) || this.listeners.set(i, new Map), this.listeners.get(i).set(t, t.bind(r || this));
                        }
                    }, this.removeEventListener = function(e, t) {
                        Array.isArray(e) || (e = [ e ]);
                        for (let n = 0; n < e.length; n += 1) {
                            const r = e[n];
                            this.listeners.get(r)?.delete(t);
                        }
                    };
                }, o = new s;
                o.volume = 1, o.collapse = t, o.configureAdsManager = t, o.destroy = t, o.discardAdBreak = t, 
                o.expand = t, o.focus = t, o.getAdSkippableState = () => !1, o.getCuePoints = () => [ 0 ], 
                o.getCurrentAd = () => h, o.getCurrentAdCuePoints = () => [], o.getRemainingTime = () => 0, 
                o.getVolume = function() {
                    return this.volume;
                }, o.init = t, o.isCustomClickTrackingUsed = () => !1, o.isCustomPlaybackUsed = () => !1, 
                o.pause = t, o.requestNextAdBreak = t, o.resize = t, o.resume = t, o.setVolume = function(e) {
                    this.volume = e;
                }, o.skip = t, o.start = function() {
                    for (const e of [ T.Type.LOADED, T.Type.STARTED, T.Type.CONTENT_RESUME_REQUESTED, T.Type.AD_BUFFERING, T.Type.FIRST_QUARTILE, T.Type.MIDPOINT, T.Type.THIRD_QUARTILE, T.Type.COMPLETE, T.Type.ALL_ADS_COMPLETED ]) try {
                        this._dispatch(new n.AdEvent(e));
                    } catch (e) {
                        console.trace(e);
                    }
                }, o.stop = t, o.updateAdsRenderingSettings = t;
                const a = Object.create(o), d = function(e, t, n) {
                    this.type = e, this.adsRequest = t, this.userRequestContext = n;
                };
                d.prototype = {
                    getAdsManager: () => a,
                    getUserRequestContext() {
                        return this.userRequestContext ? this.userRequestContext : {};
                    }
                }, d.Type = {
                    ADS_MANAGER_LOADED: "adsManagerLoaded"
                };
                const u = s;
                u.prototype.settings = new i, u.prototype.contentComplete = t, u.prototype.destroy = t, 
                u.prototype.getSettings = function() {
                    return this.settings;
                }, u.prototype.getVersion = () => e, u.prototype.requestAds = function(e, t) {
                    requestAnimationFrame((() => {
                        const {ADS_MANAGER_LOADED: r} = d.Type, i = new n.AdsManagerLoadedEvent(r, e, t);
                        this._dispatch(i);
                    }));
                    const r = new n.AdError("adPlayError", 1205, 1205, "The browser prevented playback initiated without user interaction.", e, t);
                    requestAnimationFrame((() => {
                        this._dispatch(new n.AdErrorEvent(r));
                    }));
                };
                const E = t, A = function() {};
                A.prototype = {
                    setAdWillAutoPlay: t,
                    setAdWillPlayMuted: t,
                    setContinuousPlayback: t
                };
                const l = function() {};
                l.prototype = {
                    getAdPosition: () => 1,
                    getIsBumper: () => !1,
                    getMaxDuration: () => -1,
                    getPodIndex: () => 1,
                    getTimeOffset: () => 0,
                    getTotalAds: () => 1
                };
                const g = function() {};
                g.prototype.getAdIdRegistry = function() {
                    return "";
                }, g.prototype.getAdIsValue = function() {
                    return "";
                };
                const c = function() {};
                c.prototype = {
                    pi: new l,
                    getAdId: () => "",
                    getAdPodInfo() {
                        return this.pi;
                    },
                    getAdSystem: () => "",
                    getAdvertiserName: () => "",
                    getApiFramework: () => null,
                    getCompanionAds: () => [],
                    getContentType: () => "",
                    getCreativeAdId: () => "",
                    getDealId: () => "",
                    getDescription: () => "",
                    getDuration: () => 8.5,
                    getHeight: () => 0,
                    getMediaUrl: () => null,
                    getMinSuggestedDuration: () => -2,
                    getSkipTimeOffset: () => -1,
                    getSurveyUrl: () => null,
                    getTitle: () => "",
                    getTraffickingParametersString: () => "",
                    getUiElements: () => [ "" ],
                    getUniversalAdIdRegistry: () => "unknown",
                    getUniversalAdIds: () => [ new g ],
                    getUniversalAdIdValue: () => "unknown",
                    getVastMediaBitrate: () => 0,
                    getVastMediaHeight: () => 0,
                    getVastMediaWidth: () => 0,
                    getWidth: () => 0,
                    getWrapperAdIds: () => [ "" ],
                    getWrapperAdSystems: () => [ "" ],
                    getWrapperCreativeIds: () => [ "" ],
                    isLinear: () => !0,
                    isSkippable: () => !0
                };
                const p = function() {};
                p.prototype = {
                    getAdSlotId: () => "",
                    getContent: () => "",
                    getContentType: () => "",
                    getHeight: () => 1,
                    getWidth: () => 1
                };
                const C = function(e, t, n, r, i, s) {
                    this.errorCode = t, this.message = r, this.type = e, this.adsRequest = i, this.userRequestContext = s, 
                    this.getErrorCode = function() {
                        return this.errorCode;
                    }, this.getInnerError = function() {
                        return null;
                    }, this.getMessage = function() {
                        return this.message;
                    }, this.getType = function() {
                        return this.type;
                    }, this.getVastErrorCode = function() {
                        return this.vastErrorCode;
                    }, this.toString = function() {
                        return `AdError ${this.errorCode}: ${this.message}`;
                    };
                };
                C.ErrorCode = {}, C.Type = {};
                const h = (() => {
                    try {
                        for (const e of Object.values(window.vidible._getContexts())) if (e.getPlayer()?.div?.innerHTML.includes("www.engadget.com")) return !0;
                    } catch (e) {}
                    return !1;
                })() ? void 0 : new c, T = function(e) {
                    this.type = e;
                };
                T.prototype = {
                    getAd: () => h,
                    getAdData: () => {}
                }, T.Type = {
                    AD_BREAK_READY: "adBreakReady",
                    AD_BUFFERING: "adBuffering",
                    AD_CAN_PLAY: "adCanPlay",
                    AD_METADATA: "adMetadata",
                    AD_PROGRESS: "adProgress",
                    ALL_ADS_COMPLETED: "allAdsCompleted",
                    CLICK: "click",
                    COMPLETE: "complete",
                    CONTENT_PAUSE_REQUESTED: "contentPauseRequested",
                    CONTENT_RESUME_REQUESTED: "contentResumeRequested",
                    DURATION_CHANGE: "durationChange",
                    EXPANDED_CHANGED: "expandedChanged",
                    FIRST_QUARTILE: "firstQuartile",
                    IMPRESSION: "impression",
                    INTERACTION: "interaction",
                    LINEAR_CHANGE: "linearChange",
                    LINEAR_CHANGED: "linearChanged",
                    LOADED: "loaded",
                    LOG: "log",
                    MIDPOINT: "midpoint",
                    PAUSED: "pause",
                    RESUMED: "resume",
                    SKIPPABLE_STATE_CHANGED: "skippableStateChanged",
                    SKIPPED: "skip",
                    STARTED: "start",
                    THIRD_QUARTILE: "thirdQuartile",
                    USER_CLOSE: "userClose",
                    VIDEO_CLICKED: "videoClicked",
                    VIDEO_ICON_CLICKED: "videoIconClicked",
                    VIEWABLE_IMPRESSION: "viewable_impression",
                    VOLUME_CHANGED: "volumeChange",
                    VOLUME_MUTED: "mute"
                };
                const y = function(e) {
                    this.error = e, this.type = "adError", this.getError = function() {
                        return this.error;
                    }, this.getUserRequestContext = function() {
                        return this.error?.userRequestContext ? this.error.userRequestContext : {};
                    };
                };
                y.Type = {
                    AD_ERROR: "adError"
                };
                const I = function() {};
                I.Type = {
                    CUSTOM_CONTENT_LOADED: "deprecated-event"
                };
                const R = function() {};
                R.CreativeType = {
                    ALL: "All",
                    FLASH: "Flash",
                    IMAGE: "Image"
                }, R.ResourceType = {
                    ALL: "All",
                    HTML: "Html",
                    IFRAME: "IFrame",
                    STATIC: "Static"
                }, R.SizeCriteria = {
                    IGNORE: "IgnoreSize",
                    SELECT_EXACT_MATCH: "SelectExactMatch",
                    SELECT_NEAR_MATCH: "SelectNearMatch"
                };
                const S = function() {};
                S.prototype = {
                    getCuePoints: () => [],
                    getAdIdRegistry: () => "",
                    getAdIdValue: () => ""
                };
                const D = t;
                Object.assign(n, {
                    AdCuePoints: S,
                    AdDisplayContainer: r,
                    AdError: C,
                    AdErrorEvent: y,
                    AdEvent: T,
                    AdPodInfo: l,
                    AdProgressData: D,
                    AdsLoader: u,
                    AdsManager: a,
                    AdsManagerLoadedEvent: d,
                    AdsRenderingSettings: E,
                    AdsRequest: A,
                    CompanionAd: p,
                    CompanionAdSelectionSettings: R,
                    CustomContentLoadedEvent: I,
                    gptProxyInstance: {},
                    ImaSdkSettings: i,
                    OmidAccessMode: {
                        DOMAIN: "domain",
                        FULL: "full",
                        LIMITED: "limited"
                    },
                    OmidVerificationVendor: {
                        1: "OTHER",
                        2: "MOAT",
                        3: "DOUBLEVERIFY",
                        4: "INTEGRAL_AD_SCIENCE",
                        5: "PIXELATE",
                        6: "NIELSEN",
                        7: "COMSCORE",
                        8: "MEETRICS",
                        9: "GOOGLE",
                        OTHER: 1,
                        MOAT: 2,
                        DOUBLEVERIFY: 3,
                        INTEGRAL_AD_SCIENCE: 4,
                        PIXELATE: 5,
                        NIELSEN: 6,
                        COMSCORE: 7,
                        MEETRICS: 8,
                        GOOGLE: 9
                    },
                    settings: new i,
                    UiElements: {
                        AD_ATTRIBUTION: "adAttribution",
                        COUNTDOWN: "countdown"
                    },
                    UniversalAdIdInfo: g,
                    VERSION: e,
                    ViewMode: {
                        FULLSCREEN: "fullscreen",
                        NORMAL: "normal"
                    }
                }), window.google || (window.google = {}), window.google.ima?.dai && (n.dai = window.google.ima.dai), 
                window.google.ima = n;
            })();
            Object.defineProperty(Window.prototype.toString, "d7a710ada6cca5832af6d92e62726e74", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d7a710ada6cca5832af6d92e62726e74" due to: ' + e);
        }
    },
    '(()=>{const t=[];t.push=function(t){"object"==typeof t&&t.events&&Object.values(t.events).forEach((t=>{if("function"==typeof t)try{t()}catch(t){}}))},window.AdBridg={cmd:t}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f6311be2c1ed023feeb00c3d41dea489 === e) return;
            (() => {
                const e = [];
                e.push = function(e) {
                    "object" == typeof e && e.events && Object.values(e.events).forEach((e => {
                        if ("function" == typeof e) try {
                            e();
                        } catch (e) {}
                    }));
                }, window.AdBridg = {
                    cmd: e
                };
            })();
            Object.defineProperty(Window.prototype.toString, "f6311be2c1ed023feeb00c3d41dea489", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f6311be2c1ed023feeb00c3d41dea489" due to: ' + e);
        }
    },
    '(()=>{let t=window?.__iasPET?.queue;Array.isArray(t)||(t=[]);const s=JSON.stringify({brandSafety:{},slots:{}});function e(t){try{t?.dataHandler?.(s)}catch(t){}}for(t.push=e,window.__iasPET={VERSION:"1.16.18",queue:t,sessionId:"",setTargetingForAppNexus(){},setTargetingForGPT(){},start(){}};t.length;)e(t.shift())})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.baf394a72c20f8e6c3a0adc04c9df104 === e) return;
            (() => {
                let e = window?.__iasPET?.queue;
                Array.isArray(e) || (e = []);
                const t = JSON.stringify({
                    brandSafety: {},
                    slots: {}
                });
                function r(e) {
                    try {
                        e?.dataHandler?.(t);
                    } catch (e) {}
                }
                for (e.push = r, window.__iasPET = {
                    VERSION: "1.16.18",
                    queue: e,
                    sessionId: "",
                    setTargetingForAppNexus() {},
                    setTargetingForGPT() {},
                    start() {}
                }; e.length; ) r(e.shift());
            })();
            Object.defineProperty(Window.prototype.toString, "baf394a72c20f8e6c3a0adc04c9df104", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "baf394a72c20f8e6c3a0adc04c9df104" due to: ' + e);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];if("string"!=typeof d||0===d.length)return Reflect.apply(a,b,c);const e=/topaz\\.dai\\.viacomcbs\\.digital\\/ondemand\\/hls\\/.*\\.m3u8/.test(d),f=/dai\\.google\\.com\\/ondemand\\/v.*\\/hls\\/content\\/.*\\/vid\\/.*\\/stream/.test(d);return(e||f)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;if(Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0}),f&&(null!==a&&void 0!==a&&a.ad_breaks&&(a.ad_breaks=[]),null!==a&&void 0!==a&&a.apple_tv&&(a.apple_tv={})),e){const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}}),Reflect.apply(a,b,c)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a8c6f78e34ee76b7ae128e62027dec2f === e) return;
            window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
                apply: async (e, t, o) => {
                    const n = o[1];
                    if ("string" != typeof n || 0 === n.length) return Reflect.apply(e, t, o);
                    const r = /topaz\.dai\.viacomcbs\.digital\/ondemand\/hls\/.*\.m3u8/.test(n), a = /dai\.google\.com\/ondemand\/v.*\/hls\/content\/.*\/vid\/.*\/stream/.test(n);
                    return (r || a) && t.addEventListener("readystatechange", (function() {
                        if (4 === t.readyState) {
                            const e = t.response;
                            if (Object.defineProperty(t, "response", {
                                writable: !0
                            }), Object.defineProperty(t, "responseText", {
                                writable: !0
                            }), a && (null != e && e.ad_breaks && (e.ad_breaks = []), null != e && e.apple_tv && (e.apple_tv = {})), 
                            r) {
                                const o = e.replaceAll(/#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, "");
                                t.response = o, t.responseText = o;
                            }
                        }
                    })), Reflect.apply(e, t, o);
                }
            });
            Object.defineProperty(Window.prototype.toString, "a8c6f78e34ee76b7ae128e62027dec2f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a8c6f78e34ee76b7ae128e62027dec2f" due to: ' + e);
        }
    },
    "(function(){window.twttr={conversion:{trackPid:function(){}}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b207994a134acba69e58503a5393b31a === e) return;
            window.twttr = {
                conversion: {
                    trackPid: function() {}
                }
            };
            Object.defineProperty(Window.prototype.toString, "b207994a134acba69e58503a5393b31a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b207994a134acba69e58503a5393b31a" due to: ' + e);
        }
    },
    "(() => { var ReplaceMap = {adBreaks: [], adState: null, currentAdBreak: 'undefined'}; Object.defineProperty = new Proxy(Object.defineProperty, { apply: (target, thisArg, ArgsList) => { var Original = Reflect.apply(target, thisArg, ArgsList); if (ArgsList[1] == 'getAdBreaks' || ArgsList[1] == 'getAdsDisplayStringParams') { return Original[ArgsList[1]] = function() {}; } else if (ArgsList[1] == 'adBreaks' || ArgsList[1] == 'currentAdBreak' || typeof Original['adBreaks'] !== 'undefined') { for (var [key, value] of Object.entries(Original)) { if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] !== 'undefined') { Original[key] = ReplaceMap[key]; } else if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] === 'undefined') { Original[key] = undefined; } } return Original; } else { return Original; }}})})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9072dab3b9fec602e942bbd140d1f7ea"] === e) return;
            (() => {
                var e = {
                    adBreaks: [],
                    adState: null,
                    currentAdBreak: "undefined"
                };
                Object.defineProperty = new Proxy(Object.defineProperty, {
                    apply: (r, t, d) => {
                        var n = Reflect.apply(r, t, d);
                        if ("getAdBreaks" == d[1] || "getAdsDisplayStringParams" == d[1]) return n[d[1]] = function() {};
                        if ("adBreaks" == d[1] || "currentAdBreak" == d[1] || void 0 !== n.adBreaks) {
                            for (var [a, o] of Object.entries(n)) void 0 !== e[a] && "undefined" !== e[a] ? n[a] = e[a] : void 0 !== e[a] && "undefined" === e[a] && (n[a] = void 0);
                            return n;
                        }
                        return n;
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "9072dab3b9fec602e942bbd140d1f7ea", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9072dab3b9fec602e942bbd140d1f7ea" due to: ' + e);
        }
    },
    '(()=>{const a=window.fetch,b={apply:async(b,c,d)=>{const e=d[0]instanceof Request?d[0].url:d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.includes("uplynk.com/")&&e.includes(".m3u8")){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/#UPLYNK-SEGMENT: \\S*\\,ad\\s[\\s\\S]+?((#UPLYNK-SEGMENT: \\S+\\,segment)|(#EXT-X-ENDLIST))/g,"$1"),new Response(c)}return Reflect.apply(b,c,d)}};try{window.fetch=new Proxy(window.fetch,b)}catch(a){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f2cc35b643de55322eb7ef4e3811aa59 === e) return;
            (() => {
                const e = window.fetch, t = {
                    apply: async (t, n, r) => {
                        const c = r[0] instanceof Request ? r[0].url : r[0];
                        if ("string" != typeof c || 0 === c.length) return Reflect.apply(t, n, r);
                        if (c.includes("uplynk.com/") && c.includes(".m3u8")) {
                            const t = await e(...r);
                            let n = await t.text();
                            return n = n.replaceAll(/#UPLYNK-SEGMENT: \S*\,ad\s[\s\S]+?((#UPLYNK-SEGMENT: \S+\,segment)|(#EXT-X-ENDLIST))/g, "$1"), 
                            new Response(n);
                        }
                        return Reflect.apply(t, n, r);
                    }
                };
                try {
                    window.fetch = new Proxy(window.fetch, t);
                } catch (e) {}
            })();
            Object.defineProperty(Window.prototype.toString, "f2cc35b643de55322eb7ef4e3811aa59", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f2cc35b643de55322eb7ef4e3811aa59" due to: ' + e);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0664f2a8c7617fced3e7790a26b1c7f8"] === e) return;
            window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
                apply: async (e, t, o) => {
                    const r = o[1];
                    return "string" != typeof r || 0 === r.length || r.match(/pubads\.g\.doubleclick.net\/ondemand\/hls\/.*\.m3u8/) && t.addEventListener("readystatechange", (function() {
                        if (4 === t.readyState) {
                            const e = t.response;
                            Object.defineProperty(t, "response", {
                                writable: !0
                            }), Object.defineProperty(t, "responseText", {
                                writable: !0
                            });
                            const o = e.replaceAll(/#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, "");
                            t.response = o, t.responseText = o;
                        }
                    })), Reflect.apply(e, t, o);
                }
            });
            Object.defineProperty(Window.prototype.toString, "0664f2a8c7617fced3e7790a26b1c7f8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0664f2a8c7617fced3e7790a26b1c7f8" due to: ' + e);
        }
    },
    '(()=>{const a=window.fetch;window.fetch=new Proxy(window.fetch,{apply:async(b,c,d)=>{const e=d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.match(/pubads\\.g\\.doubleclick\\.net\\/ondemand\\/.*\\/content\\/.*\\/vid\\/.*\\/streams\\/.*\\/manifest\\.mpd|pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/<Period id="(pre|mid|post)-roll-.-ad-[\\s\\S]*?>[\\s\\S]*?<\\/Period>|#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,""),new Response(c)}return Reflect.apply(b,c,d)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cce15678b7fd141ec70a16bc1f01aa96 === e) return;
            (() => {
                const e = window.fetch;
                window.fetch = new Proxy(window.fetch, {
                    apply: async (t, o, c) => {
                        const n = c[0];
                        if ("string" != typeof n || 0 === n.length) return Reflect.apply(t, o, c);
                        if (n.match(/pubads\.g\.doubleclick\.net\/ondemand\/.*\/content\/.*\/vid\/.*\/streams\/.*\/manifest\.mpd|pubads\.g\.doubleclick.net\/ondemand\/hls\/.*\.m3u8/)) {
                            const t = await e(...c);
                            let o = await t.text();
                            return o = o.replaceAll(/<Period id="(pre|mid|post)-roll-.-ad-[\s\S]*?>[\s\S]*?<\/Period>|#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, ""), 
                            new Response(o);
                        }
                        return Reflect.apply(t, o, c);
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "cce15678b7fd141ec70a16bc1f01aa96", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cce15678b7fd141ec70a16bc1f01aa96" due to: ' + e);
        }
    },
    "(()=>{window.FAVE=window.FAVE||{};const s={set:(s,e,a,n)=>{if(s?.settings?.ads?.ssai?.prod?.clips?.enabled&&(s.settings.ads.ssai.prod.clips.enabled=!1),s?.settings?.ads?.ssai?.prod?.liveAuth?.enabled&&(s.settings.ads.ssai.prod.liveAuth.enabled=!1),s?.settings?.ads?.ssai?.prod?.liveUnauth?.enabled&&(s.settings.ads.ssai.prod.liveUnauth.enabled=!1),s?.player?.instances)for(var i of Object.keys(s.player.instances))s.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled&&(s.player.instances[i].configs.ads.ssai.prod.clips.enabled=!1),s.player.instances[i]?.configs?.ads?.ssai?.prod?.liveAuth?.enabled&&(s.player.instances[i].configs.ads.ssai.prod.liveAuth.enabled=!1),s.player.instances[i]?.configs?.ads?.ssai?.prod?.liveUnauth?.enabled&&(s.player.instances[i].configs.ads.ssai.prod.liveUnauth.enabled=!1);return Reflect.set(s,e,a,n)}};window.FAVE=new Proxy(window.FAVE,s)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.db4626a48a0140f6bfa4180ae874f6ce === e) return;
            (() => {
                window.FAVE = window.FAVE || {};
                const e = {
                    set: (e, s, a, n) => {
                        if (e?.settings?.ads?.ssai?.prod?.clips?.enabled && (e.settings.ads.ssai.prod.clips.enabled = !1), 
                        e?.settings?.ads?.ssai?.prod?.liveAuth?.enabled && (e.settings.ads.ssai.prod.liveAuth.enabled = !1), 
                        e?.settings?.ads?.ssai?.prod?.liveUnauth?.enabled && (e.settings.ads.ssai.prod.liveUnauth.enabled = !1), 
                        e?.player?.instances) for (var i of Object.keys(e.player.instances)) e.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled && (e.player.instances[i].configs.ads.ssai.prod.clips.enabled = !1), 
                        e.player.instances[i]?.configs?.ads?.ssai?.prod?.liveAuth?.enabled && (e.player.instances[i].configs.ads.ssai.prod.liveAuth.enabled = !1), 
                        e.player.instances[i]?.configs?.ads?.ssai?.prod?.liveUnauth?.enabled && (e.player.instances[i].configs.ads.ssai.prod.liveUnauth.enabled = !1);
                        return Reflect.set(e, s, a, n);
                    }
                };
                window.FAVE = new Proxy(window.FAVE, e);
            })();
            Object.defineProperty(Window.prototype.toString, "db4626a48a0140f6bfa4180ae874f6ce", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "db4626a48a0140f6bfa4180ae874f6ce" due to: ' + e);
        }
    },
    "(()=>{window.PostRelease={Start(){}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f442d027f2647247aaa89f75941826f0 === e) return;
            window.PostRelease = {
                Start() {}
            };
            Object.defineProperty(Window.prototype.toString, "f442d027f2647247aaa89f75941826f0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f442d027f2647247aaa89f75941826f0" due to: ' + e);
        }
    },
    '(()=>{window.com_adswizz_synchro_decorateUrl=function(a){if("string"===typeof a&&a.startsWith("http"))return a}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2b3b012135adb550eb133e7becf3e060"] === e) return;
            window.com_adswizz_synchro_decorateUrl = function(e) {
                if ("string" == typeof e && e.startsWith("http")) return e;
            };
            Object.defineProperty(Window.prototype.toString, "2b3b012135adb550eb133e7becf3e060", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2b3b012135adb550eb133e7becf3e060" due to: ' + e);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/manifest\\..*\\.theplatform\\.com\\/.*\\/.*\\.m3u8\\?.*|manifest\\..*\\.theplatform\\.com\\/.*\\/*\\.meta.*/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:.*\\n.*tvessaiprod\\.nbcuni\\.com\\/video\\/[\\s\\S]*?#EXT-X-DISCONTINUITY|#EXT-X-VMAP-AD-BREAK[\\s\\S]*?#EXT-X-ENDLIST/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6f3d40e53e83daab7ecb0b1ff3b3d011"] === e) return;
            window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
                apply: async (e, t, o) => {
                    const r = o[1];
                    return "string" != typeof r || 0 === r.length || r.match(/manifest\..*\.theplatform\.com\/.*\/.*\.m3u8\?.*|manifest\..*\.theplatform\.com\/.*\/*\.meta.*/) && t.addEventListener("readystatechange", (function() {
                        if (4 === t.readyState) {
                            const e = t.response;
                            Object.defineProperty(t, "response", {
                                writable: !0
                            }), Object.defineProperty(t, "responseText", {
                                writable: !0
                            });
                            const o = e.replaceAll(/#EXTINF:.*\n.*tvessaiprod\.nbcuni\.com\/video\/[\s\S]*?#EXT-X-DISCONTINUITY|#EXT-X-VMAP-AD-BREAK[\s\S]*?#EXT-X-ENDLIST/g, "");
                            t.response = o, t.responseText = o;
                        }
                    })), Reflect.apply(e, t, o);
                }
            });
            Object.defineProperty(Window.prototype.toString, "6f3d40e53e83daab7ecb0b1ff3b3d011", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6f3d40e53e83daab7ecb0b1ff3b3d011" due to: ' + e);
        }
    },
    '(()=>{let e,t=!1;const n=function(){},o=function(t,n){if("function"==typeof n)try{window.KalturaPlayer?n([]):e=n}catch(e){console.error(e)}};let r;Object.defineProperty(window,"PWT",{value:{requestBids:o,generateConfForGPT:o,addKeyValuePairsToGPTSlots:n,generateDFPURL:n}}),Object.defineProperty(window,"KalturaPlayer",{get:function(){return r},set:function(n){r=n,t||(t=!0,e([]))}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["03163849cc3681e88adf734700efefc6"] === e) return;
            (() => {
                let e, t = !1;
                const r = function() {}, o = function(t, r) {
                    if ("function" == typeof r) try {
                        window.KalturaPlayer ? r([]) : e = r;
                    } catch (e) {
                        console.error(e);
                    }
                };
                let n;
                Object.defineProperty(window, "PWT", {
                    value: {
                        requestBids: o,
                        generateConfForGPT: o,
                        addKeyValuePairsToGPTSlots: r,
                        generateDFPURL: r
                    }
                }), Object.defineProperty(window, "KalturaPlayer", {
                    get: function() {
                        return n;
                    },
                    set: function(r) {
                        n = r, t || (t = !0, e([]));
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "03163849cc3681e88adf734700efefc6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "03163849cc3681e88adf734700efefc6" due to: ' + e);
        }
    },
    '(()=>{let e,t=!1;const n=function(){},o=function(t,n){if("function"==typeof n)try{window.KalturaPlayer?n([]):e=n}catch(e){console.error(e)}};let r;Object.defineProperty(window,"PWT",{get:()=>({requestBids:o,generateConfForGPT:o,addKeyValuePairsToGPTSlots:n,generateDFPURL:n}),set(){}}),Object.defineProperty(window,"KalturaPlayer",{get:function(){return r},set:function(n){r=n,!t&&e&&(t=!0,e([]))}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c8bf49746912973d817a11811377a065 === e) return;
            (() => {
                let e, t = !1;
                const r = function() {}, o = function(t, r) {
                    if ("function" == typeof r) try {
                        window.KalturaPlayer ? r([]) : e = r;
                    } catch (e) {
                        console.error(e);
                    }
                };
                let n;
                Object.defineProperty(window, "PWT", {
                    get: () => ({
                        requestBids: o,
                        generateConfForGPT: o,
                        addKeyValuePairsToGPTSlots: r,
                        generateDFPURL: r
                    }),
                    set() {}
                }), Object.defineProperty(window, "KalturaPlayer", {
                    get: function() {
                        return n;
                    },
                    set: function(r) {
                        n = r, !t && e && (t = !0, e([]));
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "c8bf49746912973d817a11811377a065", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c8bf49746912973d817a11811377a065" due to: ' + e);
        }
    },
    '(()=>{const a=function(){},b=function(c,a){if("function"==typeof a)try{a([])}catch(a){console.error(a)}};Object.defineProperty(window,"PWT",{value:{requestBids:b,generateConfForGPT:b,addKeyValuePairsToGPTSlots:a,generateDFPURL:a}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7a089dd23e47e252f413e97c2c706704"] === e) return;
            (() => {
                const e = function() {}, o = function(e, o) {
                    if ("function" == typeof o) try {
                        o([]);
                    } catch (o) {
                        console.error(o);
                    }
                };
                Object.defineProperty(window, "PWT", {
                    value: {
                        requestBids: o,
                        generateConfForGPT: o,
                        addKeyValuePairsToGPTSlots: e,
                        generateDFPURL: e
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "7a089dd23e47e252f413e97c2c706704", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7a089dd23e47e252f413e97c2c706704" due to: ' + e);
        }
    },
    "(()=>{window.turner_getTransactionId=turner_getGuid=function(){},window.AdFuelUtils={getUMTOCookies(){}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b023e1f40db016717028fe62421a3285 === e) return;
            window.turner_getTransactionId = turner_getGuid = function() {}, window.AdFuelUtils = {
                getUMTOCookies() {}
            };
            Object.defineProperty(Window.prototype.toString, "b023e1f40db016717028fe62421a3285", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b023e1f40db016717028fe62421a3285" due to: ' + e);
        }
    },
    '(function(){window.adsbygoogle={loaded:!0,push:function(a){if(null!==a&&a instanceof Object&&"Object"===a.constructor.name)for(let b in a)if("function"==typeof a[b])try{a[b].call()}catch(a){console.error(a)}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2ba6aeb1954873824c6148e3102a091c"] === e) return;
            window.adsbygoogle = {
                loaded: !0,
                push: function(e) {
                    if (null !== e && e instanceof Object && "Object" === e.constructor.name) for (let o in e) if ("function" == typeof e[o]) try {
                        e[o].call();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            Object.defineProperty(Window.prototype.toString, "2ba6aeb1954873824c6148e3102a091c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2ba6aeb1954873824c6148e3102a091c" due to: ' + e);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{setTimeout(function(){(function(){window.AdFuel={queueRegistry(){},destroySlots(){}}})()},500);})})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d4ca083794994e22dcb36f8fd698d98e === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    window.AdFuel = {
                        queueRegistry() {},
                        destroySlots() {}
                    };
                }), 500);
            }));
            Object.defineProperty(Window.prototype.toString, "d4ca083794994e22dcb36f8fd698d98e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d4ca083794994e22dcb36f8fd698d98e" due to: ' + e);
        }
    },
    "(function(){var a={setConfig:function(){},aliasBidder:function(){},removeAdUnit:function(){},que:[push=function(){}]};window.pbjs=a})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0d58ac66c89ef6fa9de7481fe82dcc9b"] === e) return;
            !function() {
                var e = {
                    setConfig: function() {},
                    aliasBidder: function() {},
                    removeAdUnit: function() {},
                    que: [ push = function() {} ]
                };
                window.pbjs = e;
            }();
            Object.defineProperty(Window.prototype.toString, "0d58ac66c89ef6fa9de7481fe82dcc9b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0d58ac66c89ef6fa9de7481fe82dcc9b" due to: ' + e);
        }
    },
    "window.addEventListener('DOMContentLoaded', function() { document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, \"\"); })": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["3238470ccdeda8472a95e2bbb72a4f2a"] === e) return;
            window.addEventListener("DOMContentLoaded", (function() {
                document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, "");
            }));
            Object.defineProperty(Window.prototype.toString, "3238470ccdeda8472a95e2bbb72a4f2a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "3238470ccdeda8472a95e2bbb72a4f2a" due to: ' + e);
        }
    },
    "!function(){window.rTimer=function(){};window.jitaJS={rtk:{refreshAdUnits:function(){}}};}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["642c5e10be75a4087f7ce1326ec9a7ee"] === e) return;
            !function() {
                window.rTimer = function() {};
                window.jitaJS = {
                    rtk: {
                        refreshAdUnits: function() {}
                    }
                };
            }();
            Object.defineProperty(Window.prototype.toString, "642c5e10be75a4087f7ce1326ec9a7ee", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "642c5e10be75a4087f7ce1326ec9a7ee" due to: ' + e);
        }
    },
    '(()=>{const t=new MutationObserver((t=>{for(let e of t){const t=e.target;if(t?.querySelector?.("div:not([class], [id]):first-child + div:not([class], [id]):not([class], [id]):last-child")){const e=t.querySelector("div:not([class], [id]):last-child"),o=e?.shadowRoot?.querySelector?.("div:not([class], [id]) > div:not([class], [id])")?.textContent?.trim?.()?.toLowerCase?.();if(o&&o.length<20&&o.includes?.("advertisement"))try{e.remove()}catch(t){console.trace(t)}}}})),e={apply:(e,o,s)=>{try{s[0].mode="open"}catch(t){console.error(t)}const c=Reflect.apply(e,o,s);return t.observe(c,{subtree:!0,childList:!0}),c}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,e)})();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString.ad28df58aaf20377983494d5153f190f === t) return;
            (() => {
                const t = new MutationObserver((t => {
                    for (let e of t) {
                        const o = e.target;
                        if (o?.querySelector?.("div:not([class], [id]):first-child + div:not([class], [id]):not([class], [id]):last-child")) {
                            const e = o.querySelector("div:not([class], [id]):last-child"), r = e?.shadowRoot?.querySelector?.("div:not([class], [id]) > div:not([class], [id])")?.textContent?.trim?.()?.toLowerCase?.();
                            if (r && r.length < 20 && r.includes?.("advertisement")) try {
                                e.remove();
                            } catch (t) {
                                console.trace(t);
                            }
                        }
                    }
                })), e = {
                    apply: (e, o, r) => {
                        try {
                            r[0].mode = "open";
                        } catch (t) {
                            console.error(t);
                        }
                        const n = Reflect.apply(e, o, r);
                        return t.observe(n, {
                            subtree: !0,
                            childList: !0
                        }), n;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, e);
            })();
            Object.defineProperty(Window.prototype.toString, "ad28df58aaf20377983494d5153f190f", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "ad28df58aaf20377983494d5153f190f" due to: ' + t);
        }
    },
    'document.cookie="vpn=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c30e73df868a56abad82ef46aea39100 === e) return;
            document.cookie = "vpn=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "c30e73df868a56abad82ef46aea39100", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c30e73df868a56abad82ef46aea39100" due to: ' + e);
        }
    },
    "(()=>{document.addEventListener(\"DOMContentLoaded\",(()=>{ if(typeof jQuery) { jQuery('#SearchButtom').unbind('click'); } }));})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1e2d5574e33a449dcd46c38824d46820"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                jQuery("#SearchButtom").unbind("click");
            }));
            Object.defineProperty(Window.prototype.toString, "1e2d5574e33a449dcd46c38824d46820", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1e2d5574e33a449dcd46c38824d46820" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ if(typeof videofunc) { videofunc(); } }));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c89cf796658574c24a11e4139372f1f6 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                videofunc();
            }));
            Object.defineProperty(Window.prototype.toString, "c89cf796658574c24a11e4139372f1f6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c89cf796658574c24a11e4139372f1f6" due to: ' + e);
        }
    },
    'document.cookie="p3006=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d2d456e85d536f31a032f2a730cbde22 === e) return;
            document.cookie = "p3006=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "d2d456e85d536f31a032f2a730cbde22", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d2d456e85d536f31a032f2a730cbde22" due to: ' + e);
        }
    },
    'document.cookie="rpuShownDesktop=1; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["651f3ee34f9ac7a2ac075d8fab9c1c17"] === e) return;
            document.cookie = "rpuShownDesktop=1; path=/;";
            Object.defineProperty(Window.prototype.toString, "651f3ee34f9ac7a2ac075d8fab9c1c17", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "651f3ee34f9ac7a2ac075d8fab9c1c17" due to: ' + e);
        }
    },
    '(()=>{if(!location.href.includes("/embed/")&&!location.href.includes("/file/"))return;const e={get(e,t,r){try{return"disabled"===t&&"function"==typeof e.start?(queueMicrotask((()=>{try{e.start()}catch(e){}})),!0):Reflect.get(e,t,r)}catch(c){return Reflect.get(e,t,r)}}},t={apply:(t,r,c)=>{try{const n=Reflect.apply(t,r,c);if(n&&"object"==typeof n){if((()=>{try{return(new Error).stack||""}catch{return""}})().includes("getVideoAdInstance"))return new Proxy(n,e)}return n}catch(e){return Reflect.apply(t,r,c)}}};window.Object.create=new Proxy(window.Object.create,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["08ac4125fe79ad45be931eeed20c8e89"] === e) return;
            (() => {
                if (!location.href.includes("/embed/") && !location.href.includes("/file/")) return;
                const e = {
                    get(e, t, r) {
                        try {
                            return "disabled" === t && "function" == typeof e.start ? (queueMicrotask((() => {
                                try {
                                    e.start();
                                } catch (e) {}
                            })), !0) : Reflect.get(e, t, r);
                        } catch (c) {
                            return Reflect.get(e, t, r);
                        }
                    }
                }, t = {
                    apply: (t, r, c) => {
                        try {
                            const n = Reflect.apply(t, r, c);
                            return n && "object" == typeof n && (() => {
                                try {
                                    return (new Error).stack || "";
                                } catch {
                                    return "";
                                }
                            })().includes("getVideoAdInstance") ? new Proxy(n, e) : n;
                        } catch (e) {
                            return Reflect.apply(t, r, c);
                        }
                    }
                };
                window.Object.create = new Proxy(window.Object.create, t);
            })();
            Object.defineProperty(Window.prototype.toString, "08ac4125fe79ad45be931eeed20c8e89", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "08ac4125fe79ad45be931eeed20c8e89" due to: ' + e);
        }
    },
    '(function(){if(-1!=window.location.href.indexOf("/intro-mm"))for(var c=document.cookie.split(";"),b=0;b<c.length;b++){var a=c[b];a=a.split("=");"redirect_url_to_intro"==a[0]&&window.location.replace(decodeURIComponent(a[1]))}})();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString.f09a7b4667c1146d3ffd2348387597d8 === o) return;
            !function() {
                if (-1 != window.location.href.indexOf("/intro-mm")) for (var o = document.cookie.split(";"), e = 0; e < o.length; e++) {
                    var t = o[e];
                    "redirect_url_to_intro" == (t = t.split("="))[0] && window.location.replace(decodeURIComponent(t[1]));
                }
            }();
            Object.defineProperty(Window.prototype.toString, "f09a7b4667c1146d3ffd2348387597d8", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "f09a7b4667c1146d3ffd2348387597d8" due to: ' + o);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf(':!!')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/;if\\(\\!/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["27ed43aa7951f19f9a24a3d955696ea3"] === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, o, r) {
                    "mousedown" != t && -1 == n.toString().indexOf(":!!") && e(t, n, o, r);
                }.bind(document);
                var t = window.setTimeout;
                window.setTimeout = function(e, n) {
                    if (!/;if\(\!/.test(e.toString())) return t(e, n);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "27ed43aa7951f19f9a24a3d955696ea3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "27ed43aa7951f19f9a24a3d955696ea3" due to: ' + e);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\..4P\\(|=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["16fc905e6e4d01b1d36604ce246bdcac"] === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, o, d) {
                    "mousedown" != t && -1 == n.toString().indexOf("Z4P") && e(t, n, o, d);
                }.bind(document);
                var t = window.setTimeout;
                window.setTimeout = function(e, n) {
                    if (!/\..4P\(|=setTimeout\(/.test(e.toString())) return t(e, n);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "16fc905e6e4d01b1d36604ce246bdcac", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "16fc905e6e4d01b1d36604ce246bdcac" due to: ' + e);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('bi()')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a9336ddeda1e9f4d8198cac4f6a59557 === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, d, n, o) {
                    "click" != t && -1 == d.toString().indexOf("bi()") && e(t, d, n, o);
                }.bind(document);
            }();
            Object.defineProperty(Window.prototype.toString, "a9336ddeda1e9f4d8198cac4f6a59557", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a9336ddeda1e9f4d8198cac4f6a59557" due to: ' + e);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Z4P/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["63f6bebe37e619f74c32a8b2415f86a2"] === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, o, r) {
                    "mousedown" != t && -1 == n.toString().indexOf("Z4P") && e(t, n, o, r);
                }.bind(document);
                var t = window.setTimeout;
                window.setTimeout = function(e, n) {
                    if (!/Z4P/.test(e.toString())) return t(e, n);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "63f6bebe37e619f74c32a8b2415f86a2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "63f6bebe37e619f74c32a8b2415f86a2" due to: ' + e);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('checkTarget')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d4daff20eda39f5bfe997a60b5b65564 === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, d, r) {
                    "click" != t && -1 == n.toString().indexOf("checkTarget") && e(t, n, d, r);
                }.bind(document);
            }();
            Object.defineProperty(Window.prototype.toString, "d4daff20eda39f5bfe997a60b5b65564", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d4daff20eda39f5bfe997a60b5b65564" due to: ' + e);
        }
    },
    '(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){"mouseup"!=a&&-1==b.toString().indexOf(`var U="click";var R=\'_blank\';var v="href";`)&&c(a,b,d,e)}.bind(document);})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2e5eb7acf02c72e68933dbb1fd9704ba"] === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, r, o) {
                    "mouseup" != t && -1 == n.toString().indexOf('var U="click";var R=\'_blank\';var v="href";') && e(t, n, r, o);
                }.bind(document);
            }();
            Object.defineProperty(Window.prototype.toString, "2e5eb7acf02c72e68933dbb1fd9704ba", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2e5eb7acf02c72e68933dbb1fd9704ba" due to: ' + e);
        }
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('span[data-nosnippet] > .q-box');e.forEach(function(e){var i=e.innerText;if(i){if(i!==void 0&&(!0===i.includes('Sponsored')||!0===i.includes('Ad by')||!0===i.includes('Promoted by'))){e.style=\"display:none!important;\"}}})} })();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9f6813ab855c342f13c90469c95da251"] === e) return;
            new MutationObserver((function() {
                document.querySelectorAll("span[data-nosnippet] > .q-box").forEach((function(e) {
                    var o = e.innerText;
                    o && (void 0 === o || !0 !== o.includes("Sponsored") && !0 !== o.includes("Ad by") && !0 !== o.includes("Promoted by") || (e.style = "display:none!important;"));
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "9f6813ab855c342f13c90469c95da251", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9f6813ab855c342f13c90469c95da251" due to: ' + e);
        }
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('.paged_list_wrapper > .pagedlist_item');e.forEach(function(e){var i=e.innerHTML;if(i){if(i!==void 0&&(!0===i.includes('Hide This Ad<\\/span>'))){e.style=\"display:none!important;\"}}})} })();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["17b3983e043325b0965b454cc7394766"] === e) return;
            new MutationObserver((function() {
                document.querySelectorAll(".paged_list_wrapper > .pagedlist_item").forEach((function(e) {
                    var t = e.innerHTML;
                    t && void 0 !== t && !0 === t.includes("Hide This Ad</span>") && (e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "17b3983e043325b0965b454cc7394766", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "17b3983e043325b0965b454cc7394766" due to: ' + e);
        }
    },
    '!function(){new MutationObserver((function(){document.querySelectorAll("article > div[class] > div[class]").forEach((function(e){Object.keys(e).forEach((function(c){if(c.includes("__reactEvents")||c.includes("__reactProps")){c=e[c];try{c.children?.props?.adFragmentKey?.items&&e.parentNode.remove()}catch(c){}}}))}))})).observe(document,{childList:!0,subtree:!0});}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["54509270c0f548739cf1d7c18ae3d312"] === e) return;
            new MutationObserver((function() {
                document.querySelectorAll("article > div[class] > div[class]").forEach((function(e) {
                    Object.keys(e).forEach((function(t) {
                        if (t.includes("__reactEvents") || t.includes("__reactProps")) {
                            t = e[t];
                            try {
                                t.children?.props?.adFragmentKey?.items && e.parentNode.remove();
                            } catch (t) {}
                        }
                    }));
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "54509270c0f548739cf1d7c18ae3d312", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "54509270c0f548739cf1d7c18ae3d312" due to: ' + e);
        }
    },
    "(()=>{let e=0;const i=[];new MutationObserver((function(){document.querySelectorAll(\"div[role='list'] > div[role='listitem']:not([style*='display: none']) div[data-test-id='pinWrapper'], div[role='list'] > div[role='listitem']:not([style*='display: none']) div[data-test-id='pinWrapper'] > div[data-test-id]\").forEach((s=>{Object.keys(s).forEach((t=>{if(t.includes(\"__reactProps\")){const r=s[t];try{if(r?.children?.props?.children?.props?.pinKey?.adDestinationUrl||r?.children[1]?.props?.children[1]?.props?.children?.props?.pinKey?.adDestinationUrl||r?.children[0]?.props?.children[1]?.props?.children[1]?.props?.children?.props?.pinKey?.adDestinationUrl){const t=s.closest(\"div[role='list'] > div[role='listitem']:not([style*='display: none'])\");if(!t)return;t.style=\"display: none !important;\",e++;const r=t.querySelector('div[data-test-id=\"pinrep-footer\"] > div[class] > div[class] > div[class]:last-child > div[class] > a[aria-label][href][rel] > div[class] > div[class] > div[class]');r&&(i.push([\"Ad blocked based on property [\"+e+\"] -> \"+r.innerText]),console.table(i))}}catch(e){console.error(e)}}}))}))})).observe(document,{childList:!0,subtree:!0})})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f108a248579190d52136e6e135a4d6c9 === e) return;
            (() => {
                let e = 0;
                const t = [];
                new MutationObserver((function() {
                    document.querySelectorAll("div[role='list'] > div[role='listitem']:not([style*='display: none']) div[data-test-id='pinWrapper'], div[role='list'] > div[role='listitem']:not([style*='display: none']) div[data-test-id='pinWrapper'] > div[data-test-id]").forEach((i => {
                        Object.keys(i).forEach((r => {
                            if (r.includes("__reactProps")) {
                                const o = i[r];
                                try {
                                    if (o?.children?.props?.children?.props?.pinKey?.adDestinationUrl || o?.children[1]?.props?.children[1]?.props?.children?.props?.pinKey?.adDestinationUrl || o?.children[0]?.props?.children[1]?.props?.children[1]?.props?.children?.props?.pinKey?.adDestinationUrl) {
                                        const r = i.closest("div[role='list'] > div[role='listitem']:not([style*='display: none'])");
                                        if (!r) return;
                                        r.style = "display: none !important;", e++;
                                        const o = r.querySelector('div[data-test-id="pinrep-footer"] > div[class] > div[class] > div[class]:last-child > div[class] > a[aria-label][href][rel] > div[class] > div[class] > div[class]');
                                        o && (t.push([ "Ad blocked based on property [" + e + "] -> " + o.innerText ]), 
                                        console.table(t));
                                    }
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                        }));
                    }));
                })).observe(document, {
                    childList: !0,
                    subtree: !0
                });
            })();
            Object.defineProperty(Window.prototype.toString, "f108a248579190d52136e6e135a4d6c9", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f108a248579190d52136e6e135a4d6c9" due to: ' + e);
        }
    },
    '!function(){var e=new MutationObserver(function(){var m=document.querySelectorAll("div[id^=\'mount_\']");{var e;e=0<m.length?document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\'):document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\')}e.forEach(function(e){function n(e,n){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"),socheck=0;socheck<h.length;socheck++)h[socheck].innerText.contains(n)&&(p=["1"],d=["1"],u=["1"],i=r=l=1,socheck=h.length)}function t(e,n,t,c,a){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] div[role="button"][tabindex]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] > span a > [class] [class]"),"0"==h.length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')),socheck=0;socheck<h.length;socheck++){spancheck=0,1<h.length?(spancheck=h[socheck].querySelectorAll("span")[0],0==spancheck&&(spancheck=h[socheck].querySelectorAll("b")[0])):(spancheck=h[0].querySelectorAll("span")[socheck],0==spancheck&&(spancheck=h[0].querySelectorAll("b")[socheck]));var o=h[0];if(0!=spancheck&&spancheck){if(2==spancheck.children.length&&0<m.length)for(spancheck=spancheck.querySelectorAll("span:not([style])"),spcheck=0;spcheck<spancheck.length;spcheck++)spancheck[spcheck].innerText.contains(n)?s=1:!spancheck[spcheck].innerText.contains(t)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(c)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(a)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1);0==m.length&&((!(spancheck.innerText.contains(n)&&0==spancheck.offsetTop||h[0].innerText.contains(n)&&0==h[0].offsetTop)||spancheck.innerText.contains(t)&&!h[0].innerText.contains(t)||spancheck.innerText.contains(c)&&!h[0].innerText.contains(c)||spancheck.innerText.contains(a)&&!h[0].innerText.contains(a))&&(!o.innerText.contains(n)||0!=o.offsetTop||o.innerText.contains(t)||o.innerText.contains(c)||o.innerText.contains(a))?!spancheck.innerText.contains(t)||0!=spancheck.offsetTop||spancheck.innerText.contains(n)||spancheck.innerText.contains(c)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(c)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(n)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(a)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(c)||spancheck.innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1):s=1)}}}function c(e,n,t,c,a){u=0<m.length?(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+n+"]"),p=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+t+"]"),d=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+c+"]"),e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+a+"]")):(h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+n+"]"),p=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+t+"]"),d=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+c+"]"),e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+a+"]"))}var s=0,l=0,r=0,i=0,h=0,p=0,d=0,u=0,a=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),o=document.querySelector("[lang]"),k=document.querySelectorAll("link[rel=\'preload\'][href*=\'/l/\']");o=o?document.querySelector("[lang]").lang:"en";var y,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),f=e.querySelectorAll(\'a[href*="ads/about"]\'),S=e.querySelectorAll(\'a[href*="https://www.facebook.com/business/help"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")&&(0<g.length||0<f.length||0<S.length?(T+=1,0<m.length?(""==(y=e.querySelectorAll("a[href]")[0].innerText)&&(y=e.querySelectorAll("a[href]")[1].innerText),""==y&&(y=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0].getAttribute("aria-label"))):y=e.querySelectorAll("a[href]")[2].innerText,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("F length: "+g.length),console.log("H length: "+f.length),console.log("I length (Paid partnership): "+S.length),console.log("--------"),e.style="display:none!important;"):0<a.length?(T+=1,y="Facebook",console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"):"af"==o?n(e,"Geborg"):"de"==o||"nl"==o?c(e,"G","e","s","n"):"am"==o?n(e,"የተከፈለበት ማስታወቂያ"):"ar"==o?n(e,"مُموَّل"):"as"==o?n(e,"পৃষ্ঠপোষকতা কৰা"):"az"==o?n(e,"Sponsor dəstəkli"):"co"==o?n(e,"Spunsurizatu"):"bs"==o||"sl"==o||"cs"==o?c(e,"S","p","z","n"):"da"==o||"en"==o||"et"==o||"fy"==o||"it"==o||"ku"==o||"nb"==o||"nn"==o||"pl"==o||"sq"==o||"sv"==o||"zz"==o?0<m.length?k[0].href.contains("en_UD")?n(e,"pəɹosuodS"):k[0].href.contains("ja_KS")?n(e,"広告"):k[0].href.contains("tz_MA")?n(e,"ⵉⴷⵍ"):k[0].href.contains("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):k[0].href.contains("cb_IQ")?n(e,"پاڵپشتیکراو"):k[0].href.contains("ar_AR")?n(e,"مُموَّل"):k[0].href.contains("sz_PL")?n(e,"Szpōnzorowane"):k[0].href.contains("eo_EO")?n(e,"Reklamo"):k[0].href.contains("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n"),"0"==h.length&&n(e,"Sponsored")):document.querySelector("body").className.includes("Locale_en_UD")?n(e,"pəɹosuodS"):document.querySelector("body").className.includes("ja_KS")?n(e,"広告"):document.querySelector("body").className.includes("tz_MA")?n(e,"ⵉⴷⵍ"):document.querySelector("body").className.includes("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):document.querySelector("body").className.includes("cb_IQ")?n(e,"پاڵپشتیکراو"):document.querySelector("body").className.includes("ar_AR")?n(e,"مُموَّل"):document.querySelector("body").className.includes("sz_PL")?n(e,"Szpōnzorowane"):document.querySelector("body").className.includes("eo_EO")?n(e,"Reklamo"):document.querySelector("body").className.includes("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n")):"be"==o?n(e,"Рэклама"):"bg"==o?n(e,"Спонсорирано"):"mk"==o?n(e,"Спонзорирано"):"br"==o?n(e,"Paeroniet"):"ca"==o?n(e,"Patrocinat"):"gl"==o||"pt"==o?(n(e,"Patrocinado"),"0"==l&&c(e,"P","a","c","o")):"bn"==o?n(e,"সৌজন্যে"):"cb"==o?n(e,"پاڵپشتیکراو"):"cx"==o?c(e,"G","i","s","n"):"cy"==o?n(e,"Noddwyd"):"el"==o?n(e,"Χορηγούμενη"):"eo"==o?n(e,"Reklamo"):"es"==o?c(e,"P","u","c","d"):"eu"==o?n(e,"Babestua"):"fa"==o?n(e,"دارای پشتیبانی مالی"):"ff"==o?n(e,"Yoɓanaama"):"fi"==o?n(e,"Sponsoroitu"):"fo"==o?n(e,"Stuðlað"):"fr"==o?0<m.length?k[0].href.contains("fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):document.querySelector("body").className.includes("Locale_fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):"ga"==o?n(e,"Urraithe"):"gn"==o?n(e,"Oñepatrosinapyre"):"gu"==o?n(e,"પ્રાયોજિત"):"ha"==o?n(e,"Daukar Nauyi"):"he"==o?n(e,"ממומן"):"hr"==o?n(e,"Plaćeni oglas"):"ht"==o?n(e,"Peye"):"ne"==o||"mr"==o||"hi"==o?n(e,"प्रायोजित"):"hu"==o?c(e,"H","i","r","d"):"hy"==o?n(e,"Գովազդային"):"id"==o?c(e,"B","e","p","n"):"is"==o?n(e,"Kostað"):"ja"==o?n(e,"広告"):"ms"==o?n(e,"Ditaja"):"jv"==o?n(e,"Disponsori"):"ka"==o?n(e,"რეკლამა"):"kk"==o?n(e,"Демеушілік көрсеткен"):"km"==o?n(e,"បានឧបត្ថម្ភ"):"kn"==o?n(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==o?n(e,"Sponsored"):"ky"==o?n(e,"Демөөрчүлөнгөн"):"lo"==o?n(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==o?n(e,"Remiama"):"lv"==o?n(e,"Apmaksāta reklāma"):"mg"==o?n(e,"Misy Mpiantoka"):"ml"==o?n(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==o?n(e,"Ивээн тэтгэсэн"):"mt"==o?n(e,"Sponsorjat"):"my"==o?(n(e,"ပံ့ပိုးထားသည်"),"0"==l&&n(e,"အခပေးကြော်ငြာ")):"or"==o?n(e,"ପ୍ରଯୋଜିତ"):"pa"==o?n(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==o?n(e,"تمويل شوي"):"ro"==o?n(e,"Sponsorizat"):"ru"==o||"uk"==o?n(e,"Реклама"):"rw"==o?n(e,"Icyamamaza ndasukirwaho"):"sc"==o?n(e,"Patronadu de"):"si"==o?n(e,"අනුග්රාහක"):"sk"==o?n(e,"Sponzorované"):"sn"==o?n(e,"Zvabhadharirwa"):"so"==o?n(e,"La maalgeliyey"):"sr"==o?n(e,"Спонзорисано"):"sw"==o?n(e,"Imedhaminiwa"):"sy"==o?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==o?n(e,"Szpōnzorowane"):"ta"==o?n(e,"விளம்பரம்"):"te"==o?n(e,"ప్రాయోజితం చేయబడింది"):"tg"==o?n(e,"Бо сарпарастӣ"):"th"==o?n(e,"ได้รับการสนับสนุน"):"tl"==o?n(e,"May Sponsor"):"tr"==o?n(e,"Sponsorlu"):"tt"==o?n(e,"Хәйрияче"):"tz"==o?n(e,"ⵉⴷⵍ"):"ur"==o?n(e,"سپانسرڈ"):"uz"==o?n(e,"Reklama"):"vi"==o?n(e,"Được tài trợ"):"zh-Hans"==o?n(e,"赞助内容"):"zh-Hant"==o&&n(e,"贊助"),0<h.length&&0<p.length&&0<d.length&&0<u.length)){for(cont=0;cont<h.length;cont++)0<h[cont].offsetHeight&&(cont=h.length,s=1);for(cont1=0;cont1<p.length;cont1++)0<p[cont1].offsetHeight&&(cont1=p.length,l=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,r=1);for(cont3=0;cont3<u.length;cont3++)0<u[cont3].offsetHeight&&(cont3=u.length,i=1);1==s&&1==l&&1==r&&1==i&&(0<m.length&&""!=(y=e.querySelectorAll("a[href]")[1].innerText)||(y=e.querySelectorAll("a[href]")[2].innerText),T+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("--------"),e.style="display:none!important;")}})}),T=0;e.observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cb487be2d2edd22f1a9ce90cd6ffe9cf === e) return;
            !function() {
                var e = new MutationObserver((function() {
                    var e = document.querySelectorAll("div[id^='mount_']");
                    (0 < e.length ? document.querySelectorAll('div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])') : document.querySelectorAll('[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]')).forEach((function(t) {
                        function c(n, t) {
                            for (0 < e.length ? "0" == (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span > span > span[data-content]')).length && (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span[aria-label]')) : h = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"), 
                            socheck = 0; socheck < h.length; socheck++) h[socheck].innerText.contains(t) && (d = [ "1" ], 
                            p = [ "1" ], u = [ "1" ], i = l = r = 1, socheck = h.length);
                        }
                        function o(n, t, c, o, a) {
                            for (0 < e.length ? "0" == (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span > span > span[data-content]')).length && (h = n.querySelectorAll('div[role="article"] span[dir="auto"] div[role="button"][tabindex]')) : h = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] > span a > [class] [class]"), 
                            "0" == h.length && (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span[aria-label]')), 
                            socheck = 0; socheck < h.length; socheck++) {
                                spancheck = 0, 1 < h.length ? (spancheck = h[socheck].querySelectorAll("span")[0], 
                                0 == spancheck && (spancheck = h[socheck].querySelectorAll("b")[0])) : (spancheck = h[0].querySelectorAll("span")[socheck], 
                                0 == spancheck && (spancheck = h[0].querySelectorAll("b")[socheck]));
                                var k = h[0];
                                if (0 != spancheck && spancheck) {
                                    if (2 == spancheck.children.length && 0 < e.length) for (spancheck = spancheck.querySelectorAll("span:not([style])"), 
                                    spcheck = 0; spcheck < spancheck.length; spcheck++) spancheck[spcheck].innerText.contains(t) ? s = 1 : !spancheck[spcheck].innerText.contains(c) || 0 != spancheck[spcheck].offsetTop || spancheck[spcheck].innerText.contains(t) || spancheck[spcheck].innerText.contains(o) || spancheck[spcheck].innerText.contains(a) ? !spancheck[spcheck].innerText.contains(o) || 0 != spancheck[spcheck].offsetTop || spancheck[spcheck].innerText.contains(c) || spancheck[spcheck].innerText.contains(t) || spancheck[spcheck].innerText.contains(a) ? !spancheck[spcheck].innerText.contains(a) || 0 != spancheck[spcheck].offsetTop || spancheck[spcheck].innerText.contains(c) || spancheck[spcheck].innerText.contains(o) || spancheck[spcheck].innerText.contains(t) || (u = [ "1" ], 
                                    i = 1) : (p = [ "1" ], l = 1) : (d = [ "1" ], r = 1);
                                    0 == e.length && ((!(spancheck.innerText.contains(t) && 0 == spancheck.offsetTop || h[0].innerText.contains(t) && 0 == h[0].offsetTop) || spancheck.innerText.contains(c) && !h[0].innerText.contains(c) || spancheck.innerText.contains(o) && !h[0].innerText.contains(o) || spancheck.innerText.contains(a) && !h[0].innerText.contains(a)) && (!k.innerText.contains(t) || 0 != k.offsetTop || k.innerText.contains(c) || k.innerText.contains(o) || k.innerText.contains(a)) ? !spancheck.innerText.contains(c) || 0 != spancheck.offsetTop || spancheck.innerText.contains(t) || spancheck.innerText.contains(o) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(o) || 0 != spancheck.offsetTop || spancheck.innerText.contains(c) || spancheck.innerText.contains(t) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(a) || 0 != spancheck.offsetTop || spancheck.innerText.contains(c) || spancheck.innerText.contains(o) || spancheck.innerText.contains(t) || (u = [ "1" ], 
                                    i = 1) : (p = [ "1" ], l = 1) : (d = [ "1" ], r = 1) : s = 1);
                                }
                            }
                        }
                        function a(n, t, c, o, a) {
                            u = 0 < e.length ? (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + t + "]"), 
                            d = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + c + "]"), 
                            p = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + o + "]"), 
                            n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + a + "]")) : (h = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + t + "]"), 
                            d = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + c + "]"), 
                            p = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + o + "]"), 
                            n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + a + "]"));
                        }
                        var s = 0, r = 0, l = 0, i = 0, h = 0, d = 0, p = 0, u = 0, k = t.querySelectorAll("div[style='width: 100%'] > a[href*='oculus.com/quest'] > div"), f = document.querySelector("[lang]"), y = document.querySelectorAll("link[rel='preload'][href*='/l/']");
                        f = f ? document.querySelector("[lang]").lang : "en";
                        var g, S = t.querySelectorAll('a[ajaxify*="ad_id"] > span'), m = t.querySelectorAll('a[href*="ads/about"]'), T = t.querySelectorAll('a[href*="https://www.facebook.com/business/help"]');
                        if ("display: none !important;" != t.getAttribute("style") && !t.classList.contains("hidden_elem") && (0 < S.length || 0 < m.length || 0 < T.length ? (n += 1, 
                        0 < e.length ? ("" == (g = t.querySelectorAll("a[href]")[0].innerText) && (g = t.querySelectorAll("a[href]")[1].innerText), 
                        "" == g && (g = t.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0].getAttribute("aria-label"))) : g = t.querySelectorAll("a[href]")[2].innerText, 
                        console.log("--------"), console.log("Ad hidden from: " + g), console.log("Total ads hidden: " + n), 
                        console.log("F length: " + S.length), console.log("H length: " + m.length), console.log("I length (Paid partnership): " + T.length), 
                        console.log("--------"), t.style = "display:none!important;") : 0 < k.length ? (n += 1, 
                        g = "Facebook", console.log("--------"), console.log("Ad hidden from: " + g), console.log("Total ads hidden: " + n), 
                        console.log("Non-declared ad"), console.log("--------"), t.style = "display:none!important;") : "af" == f ? c(t, "Geborg") : "de" == f || "nl" == f ? a(t, "G", "e", "s", "n") : "am" == f ? c(t, "የተከፈለበት ማስታወቂያ") : "ar" == f ? c(t, "مُموَّل") : "as" == f ? c(t, "পৃষ্ঠপোষকতা কৰা") : "az" == f ? c(t, "Sponsor dəstəkli") : "co" == f ? c(t, "Spunsurizatu") : "bs" == f || "sl" == f || "cs" == f ? a(t, "S", "p", "z", "n") : "da" == f || "en" == f || "et" == f || "fy" == f || "it" == f || "ku" == f || "nb" == f || "nn" == f || "pl" == f || "sq" == f || "sv" == f || "zz" == f ? 0 < e.length ? y[0].href.contains("en_UD") ? c(t, "pəɹosuodS") : y[0].href.contains("ja_KS") ? c(t, "広告") : y[0].href.contains("tz_MA") ? c(t, "ⵉⴷⵍ") : y[0].href.contains("sy_SY") ? c(t, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : y[0].href.contains("cb_IQ") ? c(t, "پاڵپشتیکراو") : y[0].href.contains("ar_AR") ? c(t, "مُموَّل") : y[0].href.contains("sz_PL") ? c(t, "Szpōnzorowane") : y[0].href.contains("eo_EO") ? c(t, "Reklamo") : y[0].href.contains("es_LA") ? a(t, "P", "u", "c", "d") : (a(t, "S", "p", "s", "n"), 
                        "0" == h.length && o(t, "S", "p", "s", "n"), "0" == h.length && c(t, "Sponsored")) : document.querySelector("body").className.includes("Locale_en_UD") ? c(t, "pəɹosuodS") : document.querySelector("body").className.includes("ja_KS") ? c(t, "広告") : document.querySelector("body").className.includes("tz_MA") ? c(t, "ⵉⴷⵍ") : document.querySelector("body").className.includes("sy_SY") ? c(t, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : document.querySelector("body").className.includes("cb_IQ") ? c(t, "پاڵپشتیکراو") : document.querySelector("body").className.includes("ar_AR") ? c(t, "مُموَّل") : document.querySelector("body").className.includes("sz_PL") ? c(t, "Szpōnzorowane") : document.querySelector("body").className.includes("eo_EO") ? c(t, "Reklamo") : document.querySelector("body").className.includes("es_LA") ? a(t, "P", "u", "c", "d") : (a(t, "S", "p", "s", "n"), 
                        "0" == h.length && o(t, "S", "p", "s", "n")) : "be" == f ? c(t, "Рэклама") : "bg" == f ? c(t, "Спонсорирано") : "mk" == f ? c(t, "Спонзорирано") : "br" == f ? c(t, "Paeroniet") : "ca" == f ? c(t, "Patrocinat") : "gl" == f || "pt" == f ? (c(t, "Patrocinado"), 
                        "0" == r && a(t, "P", "a", "c", "o")) : "bn" == f ? c(t, "সৌজন্যে") : "cb" == f ? c(t, "پاڵپشتیکراو") : "cx" == f ? a(t, "G", "i", "s", "n") : "cy" == f ? c(t, "Noddwyd") : "el" == f ? c(t, "Χορηγούμενη") : "eo" == f ? c(t, "Reklamo") : "es" == f ? a(t, "P", "u", "c", "d") : "eu" == f ? c(t, "Babestua") : "fa" == f ? c(t, "دارای پشتیبانی مالی") : "ff" == f ? c(t, "Yoɓanaama") : "fi" == f ? c(t, "Sponsoroitu") : "fo" == f ? c(t, "Stuðlað") : "fr" == f ? 0 < e.length ? y[0].href.contains("fr_FR") ? a(t, "S", "p", "s", "n") : a(t, "C", "o", "m", "n") : document.querySelector("body").className.includes("Locale_fr_FR") ? a(t, "S", "p", "s", "n") : a(t, "C", "o", "m", "n") : "ga" == f ? c(t, "Urraithe") : "gn" == f ? c(t, "Oñepatrosinapyre") : "gu" == f ? c(t, "પ્રાયોજિત") : "ha" == f ? c(t, "Daukar Nauyi") : "he" == f ? c(t, "ממומן") : "hr" == f ? c(t, "Plaćeni oglas") : "ht" == f ? c(t, "Peye") : "ne" == f || "mr" == f || "hi" == f ? c(t, "प्रायोजित") : "hu" == f ? a(t, "H", "i", "r", "d") : "hy" == f ? c(t, "Գովազդային") : "id" == f ? a(t, "B", "e", "p", "n") : "is" == f ? c(t, "Kostað") : "ja" == f ? c(t, "広告") : "ms" == f ? c(t, "Ditaja") : "jv" == f ? c(t, "Disponsori") : "ka" == f ? c(t, "რეკლამა") : "kk" == f ? c(t, "Демеушілік көрсеткен") : "km" == f ? c(t, "បានឧបត្ថម្ភ") : "kn" == f ? c(t, "ಪ್ರಾಯೋಜಿತ") : "ko" == f ? c(t, "Sponsored") : "ky" == f ? c(t, "Демөөрчүлөнгөн") : "lo" == f ? c(t, "ຜູ້ສະໜັບສະໜູນ") : "lt" == f ? c(t, "Remiama") : "lv" == f ? c(t, "Apmaksāta reklāma") : "mg" == f ? c(t, "Misy Mpiantoka") : "ml" == f ? c(t, "സ്പോൺസർ ചെയ്തത്") : "mn" == f ? c(t, "Ивээн тэтгэсэн") : "mt" == f ? c(t, "Sponsorjat") : "my" == f ? (c(t, "ပံ့ပိုးထားသည်"), 
                        "0" == r && c(t, "အခပေးကြော်ငြာ")) : "or" == f ? c(t, "ପ୍ରଯୋଜିତ") : "pa" == f ? c(t, "ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ") : "ps" == f ? c(t, "تمويل شوي") : "ro" == f ? c(t, "Sponsorizat") : "ru" == f || "uk" == f ? c(t, "Реклама") : "rw" == f ? c(t, "Icyamamaza ndasukirwaho") : "sc" == f ? c(t, "Patronadu de") : "si" == f ? c(t, "අනුග්රාහක") : "sk" == f ? c(t, "Sponzorované") : "sn" == f ? c(t, "Zvabhadharirwa") : "so" == f ? c(t, "La maalgeliyey") : "sr" == f ? c(t, "Спонзорисано") : "sw" == f ? c(t, "Imedhaminiwa") : "sy" == f ? c(t, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : "sz" == f ? c(t, "Szpōnzorowane") : "ta" == f ? c(t, "விளம்பரம்") : "te" == f ? c(t, "ప్రాయోజితం చేయబడింది") : "tg" == f ? c(t, "Бо сарпарастӣ") : "th" == f ? c(t, "ได้รับการสนับสนุน") : "tl" == f ? c(t, "May Sponsor") : "tr" == f ? c(t, "Sponsorlu") : "tt" == f ? c(t, "Хәйрияче") : "tz" == f ? c(t, "ⵉⴷⵍ") : "ur" == f ? c(t, "سپانسرڈ") : "uz" == f ? c(t, "Reklama") : "vi" == f ? c(t, "Được tài trợ") : "zh-Hans" == f ? c(t, "赞助内容") : "zh-Hant" == f && c(t, "贊助"), 
                        0 < h.length && 0 < d.length && 0 < p.length && 0 < u.length)) {
                            for (cont = 0; cont < h.length; cont++) 0 < h[cont].offsetHeight && (cont = h.length, 
                            s = 1);
                            for (cont1 = 0; cont1 < d.length; cont1++) 0 < d[cont1].offsetHeight && (cont1 = d.length, 
                            r = 1);
                            for (cont2 = 0; cont2 < p.length; cont2++) 0 < p[cont2].offsetHeight && (cont2 = p.length, 
                            l = 1);
                            for (cont3 = 0; cont3 < u.length; cont3++) 0 < u[cont3].offsetHeight && (cont3 = u.length, 
                            i = 1);
                            1 == s && 1 == r && 1 == l && 1 == i && (0 < e.length && "" != (g = t.querySelectorAll("a[href]")[1].innerText) || (g = t.querySelectorAll("a[href]")[2].innerText), 
                            n += 1, console.log("--------"), console.log("Ad hidden from: " + g), console.log("Total ads hidden: " + n), 
                            console.log("--------"), t.style = "display:none!important;");
                        }
                    }));
                })), n = 0;
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }();
            Object.defineProperty(Window.prototype.toString, "cb487be2d2edd22f1a9ce90cd6ffe9cf", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cb487be2d2edd22f1a9ce90cd6ffe9cf" due to: ' + e);
        }
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[data-pagelet^=\\"FeedUnit\\"]:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > div:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > span:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div[class] > #ssrb_feed_start ~ div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class] > div:not([class], [id]) div:not([class], [id]):not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class] > div:not([class], [id]) div:not([class], [id], [dir], [data-0], [style]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] h3[dir=\\"auto\\"] + div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > :is(h2, h3) ~ div > * div[class] > div > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > :is(h2, h3) ~ div > * > div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > :is(h2, h3) ~ div > * > div > div > span > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > :is(h2, h3) ~ div > * > div div span > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > :is(h2, h3) ~ div > * > div div span > div > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > :is(h2, h3) ~ div > * > div span > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > :is(h2, h3) ~ div > * > div span div[class=\\"\\"]:not([style*=\\"display: none\\"]), div:not([class],[id]) div:not([class],[id]) > [class]:not([style*=\\"display: none\\"],img,div,h3,span,a), div[role=\\"main\\"] h3 + div[aria-hidden] + div > * > *:not(div,[style*=\\"display: none\\"]),div[role=\\"main\\"] h3 + div[aria-hidden] + div > div:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes?.("__reactEvents")||a.includes?.("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.category?.includes("SPONSORED")||a.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.feed_story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category_sensitive?.cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.feedUnit?.lbl_sp_data?.ad_id||a.children?.props?.children?.props?.minGapType?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.spons_data?.brs_filter_setting||a.children?.props?.children?.props?.feedEdge?.cat_sensitive?.cat?.includes("SPONSORED")||a.children?.props?.children?.props?.feedEdge?.node?.sponso_dat_flag?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponso_dat_flag?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.minGapType?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.cat_sensitive?.cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.__fragments?.useCometFeedUnitReordering_newsFeedEdge?.node?.daspo_sto?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.new_sponsorw_distn_aucton_of||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.da_the_spons?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsore_da?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.spons_the_dat?.brs_filter_setting){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["576a8d1321e69ae4622d2409ad77deb0"] === e) return;
            !function() {
                var e = 0, d = [];
                new MutationObserver((function() {
                    document.querySelectorAll('div[data-pagelet^="FeedUnit"]:not([style*="display: none"]), div[role="feed"] > div:not([style*="display: none"]), div[role="feed"] > span:not([style*="display: none"]), #ssrb_feed_start + div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div[class] > #ssrb_feed_start ~ div > h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div > div > div[class]:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div > div > div[class] > div:not([class], [id]) div:not([class], [id]):not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class] > div:not([class], [id]) div:not([class], [id], [dir], [data-0], [style]), div[role="main"] div > h2 ~ div > div[class] > div > div:not([style*="display: none"]), div[role="main"] h3[dir="auto"] + div > div[class]:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div[class] > div > div:not([style*="display: none"]) > div:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div > div > div:not([style*="display: none"]) > div:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div > div > div:not([style*="display: none"]) > div:not([style*="display: none"]), div[role="main"] div > :is(h2, h3) ~ div > * div[class] > div > div:not([style*="display: none"]), div[role="main"] div > :is(h2, h3) ~ div > * > div > div[class]:not([style*="display: none"]), div[role="main"] div > :is(h2, h3) ~ div > * > div > div > span > div:not([style*="display: none"]), div[role="main"] div > :is(h2, h3) ~ div > * > div div span > div:not([style*="display: none"]), div[role="main"] div > :is(h2, h3) ~ div > * > div div span > div > div:not([style*="display: none"]), div[role="main"] div > :is(h2, h3) ~ div > * > div span > div:not([style*="display: none"]), div[role="main"] div > :is(h2, h3) ~ div > * > div span div[class=""]:not([style*="display: none"]), div:not([class],[id]) div:not([class],[id]) > [class]:not([style*="display: none"],img,div,h3,span,a), div[role="main"] h3 + div[aria-hidden] + div > * > *:not(div,[style*="display: none"]),div[role="main"] h3 + div[aria-hidden] + div > div:not([style*="display: none"])').forEach((function(i) {
                        Object.keys(i).forEach((function(r) {
                            if (r.includes?.("__reactEvents") || r.includes?.("__reactProps")) {
                                r = i[r];
                                try {
                                    if (r.children?.props?.category?.includes("SPONSORED") || r.children?.props?.children?.props?.category?.includes("SPONSORED") || r.children?.props?.feedEdge?.category?.includes("SPONSORED") || r.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.feed_story_category?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_category?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_cat?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category_sensitive?.cat?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.feedUnit?.lbl_sp_data?.ad_id || r.children?.props?.children?.props?.minGapType?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.spons_data?.brs_filter_setting || r.children?.props?.children?.props?.feedEdge?.cat_sensitive?.cat?.includes("SPONSORED") || r.children?.props?.children?.props?.feedEdge?.node?.sponso_dat_flag?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponso_dat_flag?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.minGapType?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.cat_sensitive?.cat?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.__fragments?.useCometFeedUnitReordering_newsFeedEdge?.node?.daspo_sto?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.new_sponsorw_distn_aucton_of || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.daspo_sto?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.da_the_spons?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsore_da?.brs_filter_setting || r.children?.props?.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.spons_the_dat?.brs_filter_setting) {
                                        e++, i.style = "display: none !important;";
                                        var s = i.querySelector("a[href][aria-label]:not([aria-hidden])");
                                        s && (d.push([ "Ad blocked based on property [" + e + "] -> " + s.ariaLabel ]), 
                                        console.table(d));
                                    }
                                } catch (r) {}
                            }
                        }));
                    }));
                })).observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }();
            Object.defineProperty(Window.prototype.toString, "576a8d1321e69ae4622d2409ad77deb0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "576a8d1321e69ae4622d2409ad77deb0" due to: ' + e);
        }
    },
    '(()=>{const e=new MutationObserver((()=>{const n=document.querySelectorAll(\'div[role="complementary"] div[class*=" "] > div[class] > div:not([class]) > div:not([class], [style*="display: none"]), div[role="complementary"] div[class*=" "] > div[class] > div:not([class]) > span[class] > div[class]:not([style*="display: none"]), div[role="complementary"] div:has(+ div[data-visualcompletion]) > div:not([style*="display: none"]), div[role="complementary"] > div[class] > div[class] > div[class] > div[class] > div > div:not([style*="display: none"]),div[role="complementary"] > div[class] > div[class] > div[class] > div[class] > div > div > div:not([style*="display: none"])\');for(const s of n){const n=Object.keys(s).find((e=>e.includes("__reactFiber")));if(n){const t=s[n];if(t?.pendingProps?.children?.props?.match?.__fragmentPropName?.includes("adsSideFeedUnit"))return s.style.display="none",void e.disconnect()}}}));e.observe(document.documentElement,{childList:!0,subtree:!0})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d7bdccff18fe1619323480eaa54a0ae2 === e) return;
            (() => {
                const e = new MutationObserver((() => {
                    const s = document.querySelectorAll('div[role="complementary"] div[class*=" "] > div[class] > div:not([class]) > div:not([class], [style*="display: none"]), div[role="complementary"] div[class*=" "] > div[class] > div:not([class]) > span[class] > div[class]:not([style*="display: none"]), div[role="complementary"] div:has(+ div[data-visualcompletion]) > div:not([style*="display: none"]), div[role="complementary"] > div[class] > div[class] > div[class] > div[class] > div > div:not([style*="display: none"]),div[role="complementary"] > div[class] > div[class] > div[class] > div[class] > div > div > div:not([style*="display: none"])');
                    for (const i of s) {
                        const s = Object.keys(i).find((e => e.includes("__reactFiber")));
                        if (s) {
                            const d = i[s];
                            if (d?.pendingProps?.children?.props?.match?.__fragmentPropName?.includes("adsSideFeedUnit")) return i.style.display = "none", 
                            void e.disconnect();
                        }
                    }
                }));
                e.observe(document.documentElement, {
                    childList: !0,
                    subtree: !0
                });
            })();
            Object.defineProperty(Window.prototype.toString, "d7bdccff18fe1619323480eaa54a0ae2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d7bdccff18fe1619323480eaa54a0ae2" due to: ' + e);
        }
    },
    '!function(){(new MutationObserver(function(){window.location.href.includes("/watch")&&document.querySelectorAll(\'#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]\').forEach(function(b){Object.keys(b).forEach(function(a){if(a.includes("__reactFiber")){a=b[a];try{var c,d,e,f;if(null==(c=a)?0:null==(d=c["return"])?0:null==(e=d.memoizedProps)?0:null==(f=e.story)?0:f.sponsored_data){var g=b.closest(\'#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])\');g.style="display: none !important;"}}catch(h){}}})})})).observe(document,{childList:!0,subtree:!0,attributeFilter:["style"]})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["21d8e78f9157f1f1188b26cd68182732"] === e) return;
            new MutationObserver((function() {
                window.location.href.includes("/watch") && document.querySelectorAll('#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]').forEach((function(e) {
                    Object.keys(e).forEach((function(t) {
                        if (t.includes("__reactFiber")) {
                            t = e[t];
                            try {
                                var n, o, r, i;
                                null != (n = t) && null != (o = n.return) && null != (r = o.memoizedProps) && null != (i = r.story) && i.sponsored_data && (e.closest('#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])').style = "display: none !important;");
                            } catch (e) {}
                        }
                    }));
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0,
                attributeFilter: [ "style" ]
            });
            Object.defineProperty(Window.prototype.toString, "21d8e78f9157f1f1188b26cd68182732", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "21d8e78f9157f1f1188b26cd68182732" due to: ' + e);
        }
    },
    '!function(){if(location.href.includes("marketplace/item")){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[aria-label=\'Marketplace listing viewer\'] > div div + div + span:not([style*=\'display: none\']), #ssrb_feed_start + div > div div + div + span:not([style*=\'display: none\'])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.children?.props?.adId){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b5ee651ceb5b17d69e521c7d45d2dc1f === e) return;
            !function() {
                if (location.href.includes("marketplace/item")) {
                    var e = 0, r = [];
                    new MutationObserver((function() {
                        document.querySelectorAll("div[aria-label='Marketplace listing viewer'] > div div + div + span:not([style*='display: none']), #ssrb_feed_start + div > div div + div + span:not([style*='display: none'])").forEach((function(t) {
                            Object.keys(t).forEach((function(i) {
                                if (i.includes("__reactEvents") || i.includes("__reactProps")) {
                                    i = t[i];
                                    try {
                                        if (i.children?.props?.children?.props?.adId) {
                                            e++, t.style = "display: none !important;";
                                            var n = t.querySelector("a[href][aria-label]:not([aria-hidden])");
                                            n && (r.push([ "Ad blocked based on property [" + e + "] -> " + n.ariaLabel ]), 
                                            console.table(r));
                                        }
                                    } catch (i) {}
                                }
                            }));
                        }));
                    })).observe(document, {
                        childList: !0,
                        subtree: !0
                    });
                }
            }();
            Object.defineProperty(Window.prototype.toString, "b5ee651ceb5b17d69e521c7d45d2dc1f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b5ee651ceb5b17d69e521c7d45d2dc1f" due to: ' + e);
        }
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\').forEach(function(e){function t(e,t){for(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [class] [class]\'),socheck=0;socheck<s.length;socheck++)s[socheck].innerText.contains(t)&&(c=["1"],d=["1"],i=["1"],r=l=a=1,socheck=s.length)}function o(e,t,o,n,a){s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+a+"]"),0==s.length&&(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+a+"]"))}var n=0,a=0,l=0,r=0,s=0,c=0,d=0,i=0,u=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),h=document.querySelector("[lang]").lang,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),p=e.querySelectorAll(\'a[href*="ads/about"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")){if(0<g.length||0<p.length){f+=1;var y=e.querySelectorAll("a[href]")[2].innerText;console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("F length: "+g.length),console.log("H length: "+p.length),console.log("--------"),e.style="display:none!important;"}else if(0<u.length){f+=1;y="Facebook";console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"}else"af"==h?t(e,"Geborg"):"de"==h||"nl"==h?o(e,"G","e","s","n"):"am"==h?t(e,"የተከፈለበት ማስታወቂያ"):"ar"==h?t(e,"مُموَّل"):"as"==h?t(e,"পৃষ্ঠপোষকতা কৰা"):"az"==h?t(e,"Sponsor dəstəkli"):"co"==h?t(e,"Spunsurizatu"):"bs"==h||"sl"==h||"cs"==h?o(e,"S","p","z","n"):"da"==h||"en"==h||"et"==h||"fy"==h||"it"==h||"ku"==h||"nb"==h||"nn"==h||"pl"==h||"sq"==h||"sv"==h||"zz"==h?document.querySelector("body").className.includes("Locale_en_UD")?t(e,"pəɹosuodS"):o(e,"S","p","s","n"):"be"==h?t(e,"Рэклама"):"bg"==h?t(e,"Спонсорирано"):"mk"==h?t(e,"Спонзорирано"):"br"==h?t(e,"Paeroniet"):"ca"==h?t(e,"Patrocinat"):"gl"==h||"pt"==h?t(e,"Patrocinado"):"bn"==h?t(e,"সৌজন্যে"):"cb"==h?t(e,"پاڵپشتیکراو"):"cx"==h?o(e,"G","i","s","n"):"cy"==h?t(e,"Noddwyd"):"el"==h?t(e,"Χορηγούμενη"):"eo"==h?t(e,"Reklamo"):"es"==h?o(e,"P","u","c","d"):"eu"==h?t(e,"Babestua"):"fa"==h?t(e,"دارای پشتیبانی مالی"):"ff"==h?t(e,"Yoɓanaama"):"fi"==h?t(e,"Sponsoroitu"):"fo"==h?t(e,"Stuðlað"):"fr"==h?document.querySelector("body").className.includes("Locale_fr_FR")?o(e,"S","p","s","n"):o(e,"C","o","m","n"):"ga"==h?t(e,"Urraithe"):"gn"==h?t(e,"Oñepatrosinapyre"):"gu"==h?t(e,"પ્રાયોજિત"):"ha"==h?t(e,"Daukar Nauyi"):"he"==h?t(e,"ממומן"):"hr"==h?t(e,"Plaćeni oglas"):"ht"==h?t(e,"Peye"):"ne"==h||"mr"==h||"hi"==h?t(e,"प्रायोजित"):"hu"==h?o(e,"H","i","r","d"):"hy"==h?t(e,"Գովազդային"):"id"==h?o(e,"B","e","p","n"):"is"==h?t(e,"Kostað"):"ja"==h?t(e,"広告"):"ms"==h?t(e,"Ditaja"):"jv"==h?t(e,"Disponsori"):"ka"==h?t(e,"რეკლამა"):"kk"==h?t(e,"Демеушілік көрсеткен"):"km"==h?t(e,"បានឧបត្ថម្ភ"):"kn"==h?t(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==h?t(e,"Sponsored"):"ky"==h?t(e,"Демөөрчүлөнгөн"):"lo"==h?t(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==h?t(e,"Remiama"):"lv"==h?t(e,"Apmaksāta reklāma"):"mg"==h?t(e,"Misy Mpiantoka"):"ml"==h?t(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==h?t(e,"Ивээн тэтгэсэн"):"mt"==h?t(e,"Sponsorjat"):"my"==h?t(e,"ပံ့ပိုးထားသည်"):"or"==h?t(e,"ପ୍ରଯୋଜିତ"):"pa"==h?t(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==h?t(e,"تمويل شوي"):"ro"==h?t(e,"Sponsorizat"):"ru"==h||"uk"==h?t(e,"Реклама"):"rw"==h?t(e,"Icyamamaza ndasukirwaho"):"sc"==h?t(e,"Patronadu de"):"si"==h?t(e,"අනුග්‍රාහක"):"sk"==h?t(e,"Sponzorované"):"sn"==h?t(e,"Zvabhadharirwa"):"so"==h?t(e,"La maalgeliyey"):"sr"==h?t(e,"Спонзорисано"):"sw"==h?t(e,"Imedhaminiwa"):"sy"==h?t(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==h?t(e,"Szpōnzorowane"):"ta"==h?t(e,"விளம்பரம்"):"te"==h?t(e,"ప్రాయోజితం చేయబడింది"):"tg"==h?t(e,"Бо сарпарастӣ"):"th"==h?t(e,"ได้รับการสนับสนุน"):"tl"==h?t(e,"May Sponsor"):"tr"==h?t(e,"Sponsorlu"):"tt"==h?t(e,"Хәйрияче"):"tz"==h?t(e,"ⵉⴷⵍ"):"ur"==h?t(e,"سپانسرڈ"):"uz"==h?t(e,"Reklama"):"vi"==h?t(e,"Được tài trợ"):"zh-Hans"==h?t(e,"赞助内容"):"zh-Hant"==h&&t(e,"贊助");if(0<s.length&&0<c.length&&0<d.length&&0<i.length){for(cont=0;cont<s.length;cont++)0<s[cont].offsetHeight&&(cont=s.length,n=1);for(cont1=0;cont1<c.length;cont1++)0<c[cont1].offsetHeight&&(cont1=c.length,a=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,l=1);for(cont3=0;cont3<i.length;cont3++)0<i[cont3].offsetHeight&&(cont3=i.length,r=1);if(1==n&&1==a&&1==l&&1==r){y=e.querySelectorAll("a[href]")[2].innerText;f+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("--------"),e.style="display:none!important;"}}}})}),f=0;e.observe(document,{childList:!0,subtree:!0,characterData:!0,attributes:!0})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c20e5794d5ff5adb72bad3179e0fd5f5 === e) return;
            !function() {
                var e = new MutationObserver((function() {
                    document.querySelectorAll('[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]').forEach((function(e) {
                        function o(e, t) {
                            for (c = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [class] [class]'), 
                            socheck = 0; socheck < c.length; socheck++) c[socheck].innerText.contains(t) && (d = [ "1" ], 
                            i = [ "1" ], u = [ "1" ], s = r = l = 1, socheck = c.length);
                        }
                        function n(e, t, o, n, a) {
                            c = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + t + "]"), 
                            d = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + o + "]"), 
                            i = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + n + "]"), 
                            u = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + a + "]"), 
                            0 == c.length && (c = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + t + "]"), 
                            d = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + o + "]"), 
                            i = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + n + "]"), 
                            u = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + a + "]"));
                        }
                        var a = 0, l = 0, r = 0, s = 0, c = 0, d = 0, i = 0, u = 0, h = e.querySelectorAll("div[style='width: 100%'] > a[href*='oculus.com/quest'] > div"), g = document.querySelector("[lang]").lang, f = e.querySelectorAll('a[ajaxify*="ad_id"] > span'), p = e.querySelectorAll('a[href*="ads/about"]');
                        if ("display: none !important;" != e.getAttribute("style") && !e.classList.contains("hidden_elem")) {
                            if (0 < f.length || 0 < p.length) {
                                t += 1;
                                var y = e.querySelectorAll("a[href]")[2].innerText;
                                console.log("--------"), console.log("Ad hidden from: " + y), console.log("Total ads hidden: " + t), 
                                console.log("F length: " + f.length), console.log("H length: " + p.length), console.log("--------"), 
                                e.style = "display:none!important;";
                            } else if (0 < h.length) {
                                t += 1;
                                y = "Facebook";
                                console.log("--------"), console.log("Ad hidden from: " + y), console.log("Total ads hidden: " + t), 
                                console.log("Non-declared ad"), console.log("--------"), e.style = "display:none!important;";
                            } else "af" == g ? o(e, "Geborg") : "de" == g || "nl" == g ? n(e, "G", "e", "s", "n") : "am" == g ? o(e, "የተከፈለበት ማስታወቂያ") : "ar" == g ? o(e, "مُموَّل") : "as" == g ? o(e, "পৃষ্ঠপোষকতা কৰা") : "az" == g ? o(e, "Sponsor dəstəkli") : "co" == g ? o(e, "Spunsurizatu") : "bs" == g || "sl" == g || "cs" == g ? n(e, "S", "p", "z", "n") : "da" == g || "en" == g || "et" == g || "fy" == g || "it" == g || "ku" == g || "nb" == g || "nn" == g || "pl" == g || "sq" == g || "sv" == g || "zz" == g ? document.querySelector("body").className.includes("Locale_en_UD") ? o(e, "pəɹosuodS") : n(e, "S", "p", "s", "n") : "be" == g ? o(e, "Рэклама") : "bg" == g ? o(e, "Спонсорирано") : "mk" == g ? o(e, "Спонзорирано") : "br" == g ? o(e, "Paeroniet") : "ca" == g ? o(e, "Patrocinat") : "gl" == g || "pt" == g ? o(e, "Patrocinado") : "bn" == g ? o(e, "সৌজন্যে") : "cb" == g ? o(e, "پاڵپشتیکراو") : "cx" == g ? n(e, "G", "i", "s", "n") : "cy" == g ? o(e, "Noddwyd") : "el" == g ? o(e, "Χορηγούμενη") : "eo" == g ? o(e, "Reklamo") : "es" == g ? n(e, "P", "u", "c", "d") : "eu" == g ? o(e, "Babestua") : "fa" == g ? o(e, "دارای پشتیبانی مالی") : "ff" == g ? o(e, "Yoɓanaama") : "fi" == g ? o(e, "Sponsoroitu") : "fo" == g ? o(e, "Stuðlað") : "fr" == g ? document.querySelector("body").className.includes("Locale_fr_FR") ? n(e, "S", "p", "s", "n") : n(e, "C", "o", "m", "n") : "ga" == g ? o(e, "Urraithe") : "gn" == g ? o(e, "Oñepatrosinapyre") : "gu" == g ? o(e, "પ્રાયોજિત") : "ha" == g ? o(e, "Daukar Nauyi") : "he" == g ? o(e, "ממומן") : "hr" == g ? o(e, "Plaćeni oglas") : "ht" == g ? o(e, "Peye") : "ne" == g || "mr" == g || "hi" == g ? o(e, "प्रायोजित") : "hu" == g ? n(e, "H", "i", "r", "d") : "hy" == g ? o(e, "Գովազդային") : "id" == g ? n(e, "B", "e", "p", "n") : "is" == g ? o(e, "Kostað") : "ja" == g ? o(e, "広告") : "ms" == g ? o(e, "Ditaja") : "jv" == g ? o(e, "Disponsori") : "ka" == g ? o(e, "რეკლამა") : "kk" == g ? o(e, "Демеушілік көрсеткен") : "km" == g ? o(e, "បានឧបត្ថម្ភ") : "kn" == g ? o(e, "ಪ್ರಾಯೋಜಿತ") : "ko" == g ? o(e, "Sponsored") : "ky" == g ? o(e, "Демөөрчүлөнгөн") : "lo" == g ? o(e, "ຜູ້ສະໜັບສະໜູນ") : "lt" == g ? o(e, "Remiama") : "lv" == g ? o(e, "Apmaksāta reklāma") : "mg" == g ? o(e, "Misy Mpiantoka") : "ml" == g ? o(e, "സ്പോൺസർ ചെയ്തത്") : "mn" == g ? o(e, "Ивээн тэтгэсэн") : "mt" == g ? o(e, "Sponsorjat") : "my" == g ? o(e, "ပံ့ပိုးထားသည်") : "or" == g ? o(e, "ପ୍ରଯୋଜିତ") : "pa" == g ? o(e, "ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ") : "ps" == g ? o(e, "تمويل شوي") : "ro" == g ? o(e, "Sponsorizat") : "ru" == g || "uk" == g ? o(e, "Реклама") : "rw" == g ? o(e, "Icyamamaza ndasukirwaho") : "sc" == g ? o(e, "Patronadu de") : "si" == g ? o(e, "අනුග්‍රාහක") : "sk" == g ? o(e, "Sponzorované") : "sn" == g ? o(e, "Zvabhadharirwa") : "so" == g ? o(e, "La maalgeliyey") : "sr" == g ? o(e, "Спонзорисано") : "sw" == g ? o(e, "Imedhaminiwa") : "sy" == g ? o(e, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : "sz" == g ? o(e, "Szpōnzorowane") : "ta" == g ? o(e, "விளம்பரம்") : "te" == g ? o(e, "ప్రాయోజితం చేయబడింది") : "tg" == g ? o(e, "Бо сарпарастӣ") : "th" == g ? o(e, "ได้รับการสนับสนุน") : "tl" == g ? o(e, "May Sponsor") : "tr" == g ? o(e, "Sponsorlu") : "tt" == g ? o(e, "Хәйрияче") : "tz" == g ? o(e, "ⵉⴷⵍ") : "ur" == g ? o(e, "سپانسرڈ") : "uz" == g ? o(e, "Reklama") : "vi" == g ? o(e, "Được tài trợ") : "zh-Hans" == g ? o(e, "赞助内容") : "zh-Hant" == g && o(e, "贊助");
                            if (0 < c.length && 0 < d.length && 0 < i.length && 0 < u.length) {
                                for (cont = 0; cont < c.length; cont++) 0 < c[cont].offsetHeight && (cont = c.length, 
                                a = 1);
                                for (cont1 = 0; cont1 < d.length; cont1++) 0 < d[cont1].offsetHeight && (cont1 = d.length, 
                                l = 1);
                                for (cont2 = 0; cont2 < i.length; cont2++) 0 < i[cont2].offsetHeight && (cont2 = i.length, 
                                r = 1);
                                for (cont3 = 0; cont3 < u.length; cont3++) 0 < u[cont3].offsetHeight && (cont3 = u.length, 
                                s = 1);
                                if (1 == a && 1 == l && 1 == r && 1 == s) {
                                    y = e.querySelectorAll("a[href]")[2].innerText;
                                    t += 1, console.log("--------"), console.log("Ad hidden from: " + y), console.log("Total ads hidden: " + t), 
                                    console.log("--------"), e.style = "display:none!important;";
                                }
                            }
                        }
                    }));
                })), t = 0;
                e.observe(document, {
                    childList: !0,
                    subtree: !0,
                    characterData: !0,
                    attributes: !0
                });
            }();
            Object.defineProperty(Window.prototype.toString, "c20e5794d5ff5adb72bad3179e0fd5f5", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c20e5794d5ff5adb72bad3179e0fd5f5" due to: ' + e);
        }
    },
    '!function(){var e,o;0<window.location.href.indexOf("marketplace")&&(e=new MutationObserver(function(){document.querySelectorAll(\'div[role="main"] div[class][style^="max-width:"] div[class][style^="max-width:"]\').forEach(function(e){var l,t=e.querySelectorAll(\'a[href*="ads/about"]\');"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||0<t.length&&(o+=1,""==(l=e.querySelectorAll("a[href]")[0].innerText)&&(l=e.querySelectorAll("a[href]")[1].innerText),""==l&&(l=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0]?.getAttribute("aria-label")),console.log("--------"),console.log("Ad hidden from: "+l),console.log("Total ads hidden: "+o),console.log("H length: "+t.length),console.log("--------"),e.style="display:none!important;")})}),o=0,e.observe(document,{childList:!0,subtree:!0}))}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e6189b04febc53c553beba1616cdd078 === e) return;
            !function() {
                var e, t;
                0 < window.location.href.indexOf("marketplace") && (e = new MutationObserver((function() {
                    document.querySelectorAll('div[role="main"] div[class][style^="max-width:"] div[class][style^="max-width:"]').forEach((function(e) {
                        var o, l = e.querySelectorAll('a[href*="ads/about"]');
                        "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || 0 < l.length && (t += 1, 
                        "" == (o = e.querySelectorAll("a[href]")[0].innerText) && (o = e.querySelectorAll("a[href]")[1].innerText), 
                        "" == o && (o = e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0]?.getAttribute("aria-label")), 
                        console.log("--------"), console.log("Ad hidden from: " + o), console.log("Total ads hidden: " + t), 
                        console.log("H length: " + l.length), console.log("--------"), e.style = "display:none!important;");
                    }));
                })), t = 0, e.observe(document, {
                    childList: !0,
                    subtree: !0
                }));
            }();
            Object.defineProperty(Window.prototype.toString, "e6189b04febc53c553beba1616cdd078", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e6189b04febc53c553beba1616cdd078" due to: ' + e);
        }
    },
    '!function(){new MutationObserver(function(){document.querySelectorAll("div[role=\\"main\\"] div[class][style^=\\"max-width:\\"] div[class][style*=\\"max-width:\\"]:not([style*=\\"display: none\\"])").forEach(function(c){Object.keys(c).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=c[a];try{a.children?.props?.adSurface?.startsWith("Marketplace")&&(c.style="display: none !important;")}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9201edecacad19e52ef0fb416ec8c902"] === e) return;
            new MutationObserver((function() {
                document.querySelectorAll('div[role="main"] div[class][style^="max-width:"] div[class][style*="max-width:"]:not([style*="display: none"])').forEach((function(e) {
                    Object.keys(e).forEach((function(t) {
                        if (t.includes("__reactEvents") || t.includes("__reactProps")) {
                            t = e[t];
                            try {
                                t.children?.props?.adSurface?.startsWith("Marketplace") && (e.style = "display: none !important;");
                            } catch (t) {}
                        }
                    }));
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "9201edecacad19e52ef0fb416ec8c902", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9201edecacad19e52ef0fb416ec8c902" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,t,r)=>{try{if(r[2]?.[0]&&r[2][0]?.includes?.("MarketplaceFeedAdStory")){const e=r[2][0],t=e.split(/\\r?\\n|\\r/).map((e=>JSON.parse(e)));t.forEach((e=>{e.data?.viewer?.marketplace_feed_stories?.edges&&(e.data.viewer.marketplace_feed_stories.edges=e.data.viewer.marketplace_feed_stories.edges.filter((e=>!e.node?.__typename?.includes("MarketplaceFeedAdStory"))))}));const a=t.map((e=>JSON.stringify(e))).join("\\r\\n");r[2][0]=a}return Reflect.apply(e,t,r)}catch(a){return console.trace(a),Reflect.apply(e,t,r)}}};window.Function.prototype.call=new Proxy(window.Function.prototype.call,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["62b1f9c5122ff0789e03ede3f535bab1"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, r) => {
                        try {
                            if (r[2]?.[0] && r[2][0]?.includes?.("MarketplaceFeedAdStory")) {
                                const e = r[2][0].split(/\r?\n|\r/).map((e => JSON.parse(e)));
                                e.forEach((e => {
                                    e.data?.viewer?.marketplace_feed_stories?.edges && (e.data.viewer.marketplace_feed_stories.edges = e.data.viewer.marketplace_feed_stories.edges.filter((e => !e.node?.__typename?.includes("MarketplaceFeedAdStory"))));
                                }));
                                const t = e.map((e => JSON.stringify(e))).join("\r\n");
                                r[2][0] = t;
                            }
                            return Reflect.apply(e, t, r);
                        } catch (o) {
                            return console.trace(o), Reflect.apply(e, t, r);
                        }
                    }
                };
                window.Function.prototype.call = new Proxy(window.Function.prototype.call, e);
            })();
            Object.defineProperty(Window.prototype.toString, "62b1f9c5122ff0789e03ede3f535bab1", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "62b1f9c5122ff0789e03ede3f535bab1" due to: ' + e);
        }
    },
    '!function(){if(window.location.href.includes("/marketplace/")){new MutationObserver(function(){document.querySelectorAll(\'div[data-testid="marketplace_home_feed"] div[class][data-testid^="MarketplaceUpsell-"] > div > div\').forEach(function(e){var t=e.outerHTML;t&&void 0!==t&&!0===t.includes("/ads/about/")&&(e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0})}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["53a0bb610abe908070c9b157e3ec2214"] === e) return;
            window.location.href.includes("/marketplace/") && new MutationObserver((function() {
                document.querySelectorAll('div[data-testid="marketplace_home_feed"] div[class][data-testid^="MarketplaceUpsell-"] > div > div').forEach((function(e) {
                    var t = e.outerHTML;
                    t && void 0 !== t && !0 === t.includes("/ads/about/") && (e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "53a0bb610abe908070c9b157e3ec2214", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "53a0bb610abe908070c9b157e3ec2214" due to: ' + e);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('about:blank')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b178c9ef485593de3d7ea5826bcd32c2 === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, d, o) {
                    "click" != t && -1 == n.toString().indexOf("about:blank") && e(t, n, d, o);
                }.bind(document);
            }();
            Object.defineProperty(Window.prototype.toString, "b178c9ef485593de3d7ea5826bcd32c2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b178c9ef485593de3d7ea5826bcd32c2" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Object\\[/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["3b230fa3fd4e2e2f5fa5fd1889bef31f"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, f) {
                    if (!/Object\[/.test(t.toString())) return e(t, f);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "3b230fa3fd4e2e2f5fa5fd1889bef31f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "3b230fa3fd4e2e2f5fa5fd1889bef31f" due to: ' + e);
        }
    },
    '(function(){Object.defineProperty(window,"open",{writable:!1,enumerable:!1,configurable:!1,value:window.open})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6ad868fcfeb6310fe49001d70d33c6cc"] === e) return;
            Object.defineProperty(window, "open", {
                writable: !1,
                enumerable: !1,
                configurable: !1,
                value: window.open
            });
            Object.defineProperty(Window.prototype.toString, "6ad868fcfeb6310fe49001d70d33c6cc", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6ad868fcfeb6310fe49001d70d33c6cc" due to: ' + e);
        }
    },
    "Object.defineProperty(window, 'sas_manager', { get: function() { return { noad: function() {} }; }, set: function() {} });": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["28fca7a5881cbf189a14d7cdf5e6b931"] === e) return;
            Object.defineProperty(window, "sas_manager", {
                get: function() {
                    return {
                        noad: function() {}
                    };
                },
                set: function() {}
            });
            Object.defineProperty(Window.prototype.toString, "28fca7a5881cbf189a14d7cdf5e6b931", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "28fca7a5881cbf189a14d7cdf5e6b931" due to: ' + e);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('.hi()')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fe0404e371f4ffecdbfb5cb284c5f6a9 === e) return;
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(t, n, f, c) {
                    "click" != t && -1 == n.toString().indexOf(".hi()") && e(t, n, f, c);
                }.bind(document);
            }();
            Object.defineProperty(Window.prototype.toString, "fe0404e371f4ffecdbfb5cb284c5f6a9", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fe0404e371f4ffecdbfb5cb284c5f6a9" due to: ' + e);
        }
    },
    'window["pop_clicked"] = 1;': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7388e0f8018a3f9b99906510f5d32edd"] === e) return;
            window.pop_clicked = 1;
            Object.defineProperty(Window.prototype.toString, "7388e0f8018a3f9b99906510f5d32edd", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7388e0f8018a3f9b99906510f5d32edd" due to: ' + e);
        }
    },
    "document.addEventListener('DOMContentLoaded', function() { if (window.location.href.indexOf(\"hpinterstitialnew.html\") != -1) { window.setCookie1('sitecapture_interstitial', 1, 1); window.location.href = \"http://www.ndtv.com/\"; } })": () => {
        try {
            const t = "done";
            if (Window.prototype.toString["9c145fd1fa9c4877477d33378243415b"] === t) return;
            document.addEventListener("DOMContentLoaded", (function() {
                if (-1 != window.location.href.indexOf("hpinterstitialnew.html")) {
                    window.setCookie1("sitecapture_interstitial", 1, 1);
                    window.location.href = "http://www.ndtv.com/";
                }
            }));
            Object.defineProperty(Window.prototype.toString, "9c145fd1fa9c4877477d33378243415b", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "9c145fd1fa9c4877477d33378243415b" due to: ' + t);
        }
    },
    "window.exo99HL3903jjdxtrnLoad = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ba561ed0ab3a43ea4e1d5efa8fb5a465 === e) return;
            window.exo99HL3903jjdxtrnLoad = !0;
            Object.defineProperty(Window.prototype.toString, "ba561ed0ab3a43ea4e1d5efa8fb5a465", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ba561ed0ab3a43ea4e1d5efa8fb5a465" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ prerollskip(); setTimeout(function() { prerollskip(); }, 100); setTimeout(function() { prerollskip(); }, 300); }));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bea12eedfd9b904b94659dc26fd1e724 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                prerollskip();
                setTimeout((function() {
                    prerollskip();
                }), 100);
                setTimeout((function() {
                    prerollskip();
                }), 300);
            }));
            Object.defineProperty(Window.prototype.toString, "bea12eedfd9b904b94659dc26fd1e724", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bea12eedfd9b904b94659dc26fd1e724" due to: ' + e);
        }
    },
    "!function(a,b){b=new MutationObserver(function(){a.classList.contains('idle')&&a.classList.remove('idle')}),b.observe(a,{attributes:!0,attributeFilter:['class']})}(document.documentElement);": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["58ce3922fa2965f0d4a1f9e3d1857281"] === e) return;
            !function(e) {
                new MutationObserver((function() {
                    e.classList.contains("idle") && e.classList.remove("idle");
                })).observe(e, {
                    attributes: !0,
                    attributeFilter: [ "class" ]
                });
            }(document.documentElement);
            Object.defineProperty(Window.prototype.toString, "58ce3922fa2965f0d4a1f9e3d1857281", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "58ce3922fa2965f0d4a1f9e3d1857281" due to: ' + e);
        }
    },
    "window.canRunAds = !0;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["34f856bab5f3c1916f563203a5ea7281"] === e) return;
            window.canRunAds = !0;
            Object.defineProperty(Window.prototype.toString, "34f856bab5f3c1916f563203a5ea7281", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "34f856bab5f3c1916f563203a5ea7281" due to: ' + e);
        }
    },
    "window.myatu_bgm = 0;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cdba7f77c6423f0c201c738bf909c4e8 === e) return;
            window.myatu_bgm = 0;
            Object.defineProperty(Window.prototype.toString, "cdba7f77c6423f0c201c738bf909c4e8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cdba7f77c6423f0c201c738bf909c4e8" due to: ' + e);
        }
    },
    "window.runad = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["958f02264ba3a90c77c6ba0c98ad72ce"] === e) return;
            window.runad = function() {};
            Object.defineProperty(Window.prototype.toString, "958f02264ba3a90c77c6ba0c98ad72ce", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "958f02264ba3a90c77c6ba0c98ad72ce" due to: ' + e);
        }
    },
    "setTimeout(function() { window.show_popup=false; window.download_inited = true; }, 300);": () => {
        try {
            const o = "done";
            if (Window.prototype.toString.dc40c845363864583b847cd52bfc4bd3 === o) return;
            setTimeout((function() {
                window.show_popup = !1;
                window.download_inited = !0;
            }), 300);
            Object.defineProperty(Window.prototype.toString, "dc40c845363864583b847cd52bfc4bd3", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "dc40c845363864583b847cd52bfc4bd3" due to: ' + o);
        }
    },
    "function setOverlayHTML() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cc37d89d454cab3a16143f6e2ea4a4f3 === e) return;
            function setOverlayHTML() {}
            Object.defineProperty(Window.prototype.toString, "cc37d89d454cab3a16143f6e2ea4a4f3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (r) {
            console.error('Error executing AG js rule with uniqueId "cc37d89d454cab3a16143f6e2ea4a4f3" due to: ' + r);
        }
    },
    "function setOverlayHTML_new() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["085c413105051fb148c3d7a6bf82b5c3"] === e) return;
            function setOverlayHTML_new() {}
            Object.defineProperty(Window.prototype.toString, "085c413105051fb148c3d7a6bf82b5c3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (r) {
            console.error('Error executing AG js rule with uniqueId "085c413105051fb148c3d7a6bf82b5c3" due to: ' + r);
        }
    },
    "setTimeout(removeOverlayHTML, 2000);": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b94a9a08e8bfdbb7535bd54ba79a2610 === e) return;
            setTimeout(removeOverlayHTML, 2e3);
            Object.defineProperty(Window.prototype.toString, "b94a9a08e8bfdbb7535bd54ba79a2610", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b94a9a08e8bfdbb7535bd54ba79a2610" due to: ' + e);
        }
    },
    '(()=>{const e="loader.min.js",t={includes:String.prototype.includes,filter:Array.prototype.filter},l=()=>(new Error).stack,n={construct:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&o[0]&&t.includes.call(o[0],"adshield")&&(o[0]=["(function(){})();"]),Reflect.construct(n,o,r)}};window.Blob=new Proxy(window.Blob,n);const o={apply:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&r[0]&&t.includes.call(r[0],"new Error")&&(r[0]=()=>{}),Reflect.apply(n,o,r)}};window.setTimeout=new Proxy(window.setTimeout,o);const r={apply:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&r[0]&&o?.includes?.("setTimeout")&&(o=t.filter.call(o,(e=>!t.includes.call(e,"setTimeout")))),Reflect.apply(n,o,r)}};window.Array.prototype.filter=new Proxy(window.Array.prototype.filter,r)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["10c10bf4c1c0b9946b322ae5e709306d"] === e) return;
            (() => {
                const e = "loader.min.js", t = {
                    includes: String.prototype.includes,
                    filter: Array.prototype.filter
                }, r = () => (new Error).stack, o = {
                    construct: (o, n, c) => {
                        const l = r();
                        return t.includes.call(l, e) && n[0] && t.includes.call(n[0], "adshield") && (n[0] = [ "(function(){})();" ]), 
                        Reflect.construct(o, n, c);
                    }
                };
                window.Blob = new Proxy(window.Blob, o);
                const n = {
                    apply: (o, n, c) => {
                        const l = r();
                        return t.includes.call(l, e) && c[0] && t.includes.call(c[0], "new Error") && (c[0] = () => {}), 
                        Reflect.apply(o, n, c);
                    }
                };
                window.setTimeout = new Proxy(window.setTimeout, n);
                const c = {
                    apply: (o, n, c) => {
                        const l = r();
                        return t.includes.call(l, e) && c[0] && n?.includes?.("setTimeout") && (n = t.filter.call(n, (e => !t.includes.call(e, "setTimeout")))), 
                        Reflect.apply(o, n, c);
                    }
                };
                window.Array.prototype.filter = new Proxy(window.Array.prototype.filter, c);
            })();
            Object.defineProperty(Window.prototype.toString, "10c10bf4c1c0b9946b322ae5e709306d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "10c10bf4c1c0b9946b322ae5e709306d" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,l,o)=>"link"===o[0]||"style"===o[0]?[]:Reflect.apply(e,l,o)};window.document.querySelectorAll=new Proxy(window.document.querySelectorAll,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["5662f0dae824e1b38f13e27f256c2066"] === e) return;
            (() => {
                const e = {
                    apply: (e, o, t) => "link" === t[0] || "style" === t[0] ? [] : Reflect.apply(e, o, t)
                };
                window.document.querySelectorAll = new Proxy(window.document.querySelectorAll, e);
            })();
            Object.defineProperty(Window.prototype.toString, "5662f0dae824e1b38f13e27f256c2066", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "5662f0dae824e1b38f13e27f256c2066" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,o,n)=>{const e=n[0];return"function"==typeof e&&e.toString().includes("onAbnormalityDetected")&&(n[0]=function(){}),Reflect.apply(t,o,n)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();': () => {
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
    },
    '(()=>{const e={apply:(e,t,n)=>{const o=Reflect.apply(e,t,n);try{o instanceof HTMLIFrameElement&&"about:blank"===o.src&&o.contentWindow&&(o.contentWindow.fetch=window.fetch,o.contentWindow.Request=window.Request)}catch(e){}return o}};Node.prototype.appendChild=new Proxy(Node.prototype.appendChild,e)})();': () => {
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
    },
    '(()=>{let t=document.location.href,e=[],n=[],o="",r=!1;const i=Array.prototype.push,a={apply:(t,o,a)=>(window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id&&a[0]&&a[0]!==window&&"number"==typeof a[0].start&&a[0].end&&"ssap"===a[0].namespace&&a[0].id&&(r||0!==a[0]?.start||n.includes(a[0].id)||(e.length=0,n.length=0,r=!0,i.call(e,a[0]),i.call(n,a[0].id)),r&&0!==a[0]?.start&&!n.includes(a[0].id)&&(i.call(e,a[0]),i.call(n,a[0].id))),Reflect.apply(t,o,a))};window.Array.prototype.push=new Proxy(window.Array.prototype.push,a),document.addEventListener("DOMContentLoaded",(function(){if(!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id)return;const i=()=>{const t=document.querySelector("video");if(t&&e.length){const i=Math.round(t.duration),a=Math.round(e.at(-1).end/1e3),c=n.join(",");if(!1===t.loop&&o!==c&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}else if(!0===t.loop&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}}};i();new MutationObserver((()=>{t!==document.location.href&&(t=document.location.href,e.length=0,n.length=0,r=!1),i()})).observe(document,{childList:!0,subtree:!0})}))})();': () => {
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
    },
    '(()=>{const t={construct:(t,e,c)=>{try{const n=e[0];let o=e[1]?.body;if(!n?.includes("youtubei")||location.href.includes("/shorts/")||location.href.includes("youtube.com/tv")||location.href.includes("youtube.com/embed/")||!o)return Reflect.construct(t,e,c);if(o.includes(\'"contentPlaybackContext"\')||o.includes(\'"adSignalsInfo"\')){const n=JSON.parse(o);if(!n.context?.client)return Reflect.construct(t,e,c);n.playbackContext&&(n.playbackContext.adPlaybackContext={pyv:!0}),n.playerRequest&&(n.playerRequest.playbackContext.adPlaybackContext={pyv:!0}),o=JSON.stringify(n),e[1].body=o}}catch(t){}return Reflect.construct(t,e,c)}};window.Request=new Proxy(window.Request,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2fc649d830c60700428d1c79c819788e"] === e) return;
            (() => {
                const e = {
                    construct: (e, t, c) => {
                        try {
                            const o = t[0];
                            let n = t[1]?.body;
                            if (!o?.includes("youtubei") || location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/") || !n) return Reflect.construct(e, t, c);
                            if (n.includes('"contentPlaybackContext"') || n.includes('"adSignalsInfo"')) {
                                const o = JSON.parse(n);
                                if (!o.context?.client) return Reflect.construct(e, t, c);
                                o.playbackContext && (o.playbackContext.adPlaybackContext = {
                                    pyv: !0
                                }), o.playerRequest && (o.playerRequest.playbackContext.adPlaybackContext = {
                                    pyv: !0
                                }), n = JSON.stringify(o), t[1].body = n;
                            }
                        } catch (e) {}
                        return Reflect.construct(e, t, c);
                    }
                };
                window.Request = new Proxy(window.Request, e);
            })();
            Object.defineProperty(Window.prototype.toString, "2fc649d830c60700428d1c79c819788e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2fc649d830c60700428d1c79c819788e" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,t,n)=>{if(location.href.includes("/shorts/")||location.href.includes("youtube.com/tv")||location.href.includes("youtube.com/embed/"))return Reflect.apply(e,t,n);try{let o=n[0];if(o&&(o.includes(\'"contentPlaybackContext"\')||o.includes(\'"adSignalsInfo"\'))){const c=JSON.parse(o);if(!c.context?.client)return Reflect.apply(e,t,n);c.playbackContext&&(c.playbackContext.adPlaybackContext={pyv:!0}),c.playerRequest&&(c.playerRequest.playbackContext.adPlaybackContext={pyv:!0}),o=JSON.stringify(c),n[0]=o}}catch(e){}return Reflect.apply(e,t,n)}};window.TextEncoder.prototype.encode=new Proxy(window.TextEncoder.prototype.encode,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["3aa0ca82f793e9b45f97041ef95c3106"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => {
                        if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(e, t, o);
                        try {
                            let n = o[0];
                            if (n && (n.includes('"contentPlaybackContext"') || n.includes('"adSignalsInfo"'))) {
                                const c = JSON.parse(n);
                                if (!c.context?.client) return Reflect.apply(e, t, o);
                                c.playbackContext && (c.playbackContext.adPlaybackContext = {
                                    pyv: !0
                                }), c.playerRequest && (c.playerRequest.playbackContext.adPlaybackContext = {
                                    pyv: !0
                                }), n = JSON.stringify(c), o[0] = n;
                            }
                        } catch (e) {}
                        return Reflect.apply(e, t, o);
                    }
                };
                window.TextEncoder.prototype.encode = new Proxy(window.TextEncoder.prototype.encode, e);
            })();
            Object.defineProperty(Window.prototype.toString, "3aa0ca82f793e9b45f97041ef95c3106", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "3aa0ca82f793e9b45f97041ef95c3106" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,e,n)=>{if(location.href.includes("/shorts/")||location.href.includes("youtube.com/tv")||location.href.includes("youtube.com/embed/"))return Reflect.apply(t,e,n);try{const a=n[0];if(!a?.context?.client)return Reflect.apply(t,e,n);a.playbackContext&&(a.playbackContext.adPlaybackContext={pyv:!0}),a.playerRequest&&(a.playerRequest.playbackContext.adPlaybackContext={pyv:!0}),n[0]=a}catch(t){}return Reflect.apply(t,e,n)}};window.JSON.stringify=new Proxy(window.JSON.stringify,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ada35774307d0b91d6a889956d103eb4 === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => {
                        if (location.href.includes("/shorts/") || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(e, t, o);
                        try {
                            const a = o[0];
                            if (!a?.context?.client) return Reflect.apply(e, t, o);
                            a.playbackContext && (a.playbackContext.adPlaybackContext = {
                                pyv: !0
                            }), a.playerRequest && (a.playerRequest.playbackContext.adPlaybackContext = {
                                pyv: !0
                            }), o[0] = a;
                        } catch (e) {}
                        return Reflect.apply(e, t, o);
                    }
                };
                window.JSON.stringify = new Proxy(window.JSON.stringify, e);
            })();
            Object.defineProperty(Window.prototype.toString, "ada35774307d0b91d6a889956d103eb4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ada35774307d0b91d6a889956d103eb4" due to: ' + e);
        }
    },
    '(()=>{let e=0;const t=new WeakSet,n=t=>{const n=t?.currentTarget||t?.target;if(n)try{if(e>0&&n.currentTime<e)return void(n.currentTime=e)}catch(e){}},r={apply:(r,c,i)=>{try{const r=c.currentSrc;e>0&&c.currentTime<e&&r?.includes("livestitches")&&(c.currentTime=e,t.has(c)||(c.addEventListener("timeupdate",n),t.add(c)))}catch(e){}return Reflect.apply(r,c,i)}};window.HTMLMediaElement.prototype.play=new Proxy(window.HTMLMediaElement.prototype.play,r);const c={apply:(t,n,r)=>{try{const t=r[1]?.response?.result;if(t){const n=t?.timeline?.[0];n&&"ad"===n?.type&&(e=n?.duration||0,delete r[1].response.result.timeline)}}catch(e){}return Reflect.apply(t,n,r)}};window.Function.prototype.call=new Proxy(window.Function.prototype.call,c)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1c396fe6bd39e959a9fa82c669329bca"] === e) return;
            (() => {
                let e = 0;
                const t = new WeakSet, r = t => {
                    const r = t?.currentTarget || t?.target;
                    if (r) try {
                        if (e > 0 && r.currentTime < e) return void (r.currentTime = e);
                    } catch (e) {}
                }, n = {
                    apply: (n, c, o) => {
                        try {
                            const n = c.currentSrc;
                            e > 0 && c.currentTime < e && n?.includes("livestitches") && (c.currentTime = e, 
                            t.has(c) || (c.addEventListener("timeupdate", r), t.add(c)));
                        } catch (e) {}
                        return Reflect.apply(n, c, o);
                    }
                };
                window.HTMLMediaElement.prototype.play = new Proxy(window.HTMLMediaElement.prototype.play, n);
                const c = {
                    apply: (t, r, n) => {
                        try {
                            const t = n[1]?.response?.result;
                            if (t) {
                                const r = t?.timeline?.[0];
                                r && "ad" === r?.type && (e = r?.duration || 0, delete n[1].response.result.timeline);
                            }
                        } catch (e) {}
                        return Reflect.apply(t, r, n);
                    }
                };
                window.Function.prototype.call = new Proxy(window.Function.prototype.call, c);
            })();
            Object.defineProperty(Window.prototype.toString, "1c396fe6bd39e959a9fa82c669329bca", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1c396fe6bd39e959a9fa82c669329bca" due to: ' + e);
        }
    },
    '(()=>{const t="/file/";if(!location.pathname.includes(t))return;const e=(new Date).toISOString(),n=location.pathname.split(t)[1];document.cookie=`adsRedirect_${n}=${e}; path=/;`})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2e6eacfae44118fb1fa0397d0470917e"] === e) return;
            (() => {
                const e = "/file/";
                if (!location.pathname.includes(e)) return;
                const t = (new Date).toISOString(), o = location.pathname.split(e)[1];
                document.cookie = `adsRedirect_${o}=${t}; path=/;`;
            })();
            Object.defineProperty(Window.prototype.toString, "2e6eacfae44118fb1fa0397d0470917e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2e6eacfae44118fb1fa0397d0470917e" due to: ' + e);
        }
    },
    '(()=>{const e={apply:async(n,o,t)=>(t[0]?.toString?.().includes("function () { [native code] }")&&(t[0]=new Proxy(t[0],e)),"object"==typeof t[0]&&t[0].linearAdBreaks&&(t[0].linearAdBreaks=[]),Reflect.apply(n,o,t))},n={construct:(n,o,t)=>{const r=o[0],c=r?.toString(),i=c?.includes("ad breaks");return i&&(o[0]=new Proxy(r,e)),Reflect.construct(n,o,t)}};window.Promise=new Proxy(window.Promise,n)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f9fdd7bf50948a3a4434700b9afa2851 === e) return;
            (() => {
                const e = {
                    apply: async (r, t, o) => (o[0]?.toString?.().includes("function () { [native code] }") && (o[0] = new Proxy(o[0], e)), 
                    "object" == typeof o[0] && o[0].linearAdBreaks && (o[0].linearAdBreaks = []), Reflect.apply(r, t, o))
                }, r = {
                    construct: (r, t, o) => {
                        const n = t[0], a = n?.toString(), i = a?.includes("ad breaks");
                        return i && (t[0] = new Proxy(n, e)), Reflect.construct(r, t, o);
                    }
                };
                window.Promise = new Proxy(window.Promise, r);
            })();
            Object.defineProperty(Window.prototype.toString, "f9fdd7bf50948a3a4434700b9afa2851", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f9fdd7bf50948a3a4434700b9afa2851" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'a[href^="https://af.gog.com/game/"]\').forEach((t=>{const e=t.getAttribute("href").replace("https://af.gog.com/","https://www.gog.com/");t.setAttribute("href",e)}))}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["639105ecfaab3d5ad7901b589aedc339"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                document.querySelectorAll('a[href^="https://af.gog.com/game/"]').forEach((e => {
                    const t = e.getAttribute("href").replace("https://af.gog.com/", "https://www.gog.com/");
                    e.setAttribute("href", t);
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "639105ecfaab3d5ad7901b589aedc339", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "639105ecfaab3d5ad7901b589aedc339" due to: ' + e);
        }
    },
    'window.addEventListener("load",(()=>{window.stop()}));': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["30a2cb89c6bbab38b94dced993fe90d2"] === e) return;
            window.addEventListener("load", (() => {
                window.stop();
            }));
            Object.defineProperty(Window.prototype.toString, "30a2cb89c6bbab38b94dced993fe90d2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "30a2cb89c6bbab38b94dced993fe90d2" due to: ' + e);
        }
    },
    '(()=>{const e={apply:(e,t,n)=>{try{const[e,r]=n,a=r?.toString();if("click"===e&&a?.includes("attached")&&t instanceof HTMLElement&&t.matches(".share-embed-container"))return}catch(e){}return Reflect.apply(e,t,n)}};window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,e)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["671bbc53b2753ab1de38c607e44cff6b"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, r) => {
                        try {
                            const [e, n] = r, o = n?.toString();
                            if ("click" === e && o?.includes("attached") && t instanceof HTMLElement && t.matches(".share-embed-container")) return;
                        } catch (e) {}
                        return Reflect.apply(e, t, r);
                    }
                };
                window.EventTarget.prototype.addEventListener = new Proxy(window.EventTarget.prototype.addEventListener, e);
            })();
            Object.defineProperty(Window.prototype.toString, "671bbc53b2753ab1de38c607e44cff6b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "671bbc53b2753ab1de38c607e44cff6b" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,e,n)=>"data:text/javascript;base64,KCk9Pnt9"!==e&&Reflect.apply(t,e,n)};window.String.prototype.includes=new Proxy(window.String.prototype.includes,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.be0a03459654f3c6591908806278974c === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => "data:text/javascript;base64,KCk9Pnt9" !== t && Reflect.apply(e, t, o)
                };
                window.String.prototype.includes = new Proxy(window.String.prototype.includes, e);
            })();
            Object.defineProperty(Window.prototype.toString, "be0a03459654f3c6591908806278974c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "be0a03459654f3c6591908806278974c" due to: ' + e);
        }
    },
    '(()=>{const t={apply:async(t,e,r)=>{try{const o=await Reflect.apply(t,e,r);return o?.feed&&Array.isArray(o.feed)&&o.feed.forEach((t=>{t?.data?.shortUrl&&t?.data?.webStoryAction&&Object.keys(t.data.webStoryAction).forEach((e=>{const r=t.data.webStoryAction.webUrl;if("string"==typeof r){const e=r.split("web-blocker"),o=e.length>1?e[1]:null;if(o){const e=document.querySelector(`a[href*="${o}"]`);e&&(e.href=t.data.shortUrl,e.setAttribute("web-blocker","true"))}}t.data.webStoryAction[e]=t.data.shortUrl}))})),o}catch(t){console.trace("Error occurred:",t)}return await Reflect.apply(t,e,r)}};window.Response.prototype.json=new Proxy(window.Response.prototype.json,t),window.addEventListener("click",(function(t){t&&("A"===t.target?.nodeName||"H3"===t.target?.nodeName&&t.target?.closest("li")?.querySelector(\'a[web-blocker="true"]\'))&&t.stopPropagation()}),!0)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["32d2bdde9819ba509479277938f60b35"] === e) return;
            (() => {
                const e = {
                    apply: async (e, t, r) => {
                        try {
                            const o = await Reflect.apply(e, t, r);
                            return o?.feed && Array.isArray(o.feed) && o.feed.forEach((e => {
                                e?.data?.shortUrl && e?.data?.webStoryAction && Object.keys(e.data.webStoryAction).forEach((t => {
                                    const r = e.data.webStoryAction.webUrl;
                                    if ("string" == typeof r) {
                                        const t = r.split("web-blocker"), o = t.length > 1 ? t[1] : null;
                                        if (o) {
                                            const t = document.querySelector(`a[href*="${o}"]`);
                                            t && (t.href = e.data.shortUrl, t.setAttribute("web-blocker", "true"));
                                        }
                                    }
                                    e.data.webStoryAction[t] = e.data.shortUrl;
                                }));
                            })), o;
                        } catch (e) {
                            console.trace("Error occurred:", e);
                        }
                        return await Reflect.apply(e, t, r);
                    }
                };
                window.Response.prototype.json = new Proxy(window.Response.prototype.json, e), window.addEventListener("click", (function(e) {
                    e && ("A" === e.target?.nodeName || "H3" === e.target?.nodeName && e.target?.closest("li")?.querySelector('a[web-blocker="true"]')) && e.stopPropagation();
                }), !0);
            })();
            Object.defineProperty(Window.prototype.toString, "32d2bdde9819ba509479277938f60b35", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "32d2bdde9819ba509479277938f60b35" due to: ' + e);
        }
    },
    'document.cookie="dl-mobile-banner=hidden;path=/";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8b440f9710dbfd56131d1f8c2abc993c"] === e) return;
            document.cookie = "dl-mobile-banner=hidden;path=/";
            Object.defineProperty(Window.prototype.toString, "8b440f9710dbfd56131d1f8c2abc993c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8b440f9710dbfd56131d1f8c2abc993c" due to: ' + e);
        }
    },
    'document.cookie="downloadcta-state=hidden;path=/";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1d980de172103bc108eaf73424fc9bb2"] === e) return;
            document.cookie = "downloadcta-state=hidden;path=/";
            Object.defineProperty(Window.prototype.toString, "1d980de172103bc108eaf73424fc9bb2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1d980de172103bc108eaf73424fc9bb2" due to: ' + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("native-app-topper")&&(document.cookie="native-app-topper="+Date.now()+"; path=/;",location.reload())})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9d74c934588df2de463c39e31e3adc10"] === e) return;
            -1 == document.cookie.indexOf("native-app-topper") && (document.cookie = "native-app-topper=" + Date.now() + "; path=/;", 
            location.reload());
            Object.defineProperty(Window.prototype.toString, "9d74c934588df2de463c39e31e3adc10", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9d74c934588df2de463c39e31e3adc10" due to: ' + e);
        }
    },
    '(function(){var a=new Date;a=a.getFullYear()+"-"+(a.getMonth()+1)+"-"+a.getDate();document.cookie="closed="+a})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fe33bd03974a18f9ee09ea4bd62ae980 === e) return;
            !function() {
                var e = new Date;
                e = e.getFullYear() + "-" + (e.getMonth() + 1) + "-" + e.getDate();
                document.cookie = "closed=" + e;
            }();
            Object.defineProperty(Window.prototype.toString, "fe33bd03974a18f9ee09ea4bd62ae980", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fe33bd03974a18f9ee09ea4bd62ae980" due to: ' + e);
        }
    },
    'document.cookie="com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6e884abc83f56c42a030fb5b7c6a7e21"] === e) return;
            document.cookie = "com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";
            Object.defineProperty(Window.prototype.toString, "6e884abc83f56c42a030fb5b7c6a7e21", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6e884abc83f56c42a030fb5b7c6a7e21" due to: ' + e);
        }
    },
    'document.cookie="sb-closed=true; path=/;";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["5d933778415cb98cdeaf6df08d1c3ad3"] === e) return;
            document.cookie = "sb-closed=true; path=/;";
            Object.defineProperty(Window.prototype.toString, "5d933778415cb98cdeaf6df08d1c3ad3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "5d933778415cb98cdeaf6df08d1c3ad3" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/loadAppStoreBanner/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["4a9a4c88d375de003f5ff00b3d926a2e"] === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/loadAppStoreBanner/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "4a9a4c88d375de003f5ff00b3d926a2e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "4a9a4c88d375de003f5ff00b3d926a2e" due to: ' + e);
        }
    },
    '(()=>{var b=EventTarget.prototype.addEventListener,c=function(a,b){var c=document.querySelector("button.AppHeader-login, .AppHeader-userInfo > .AppHeader-profile > div > button.Button--blue");c&&b.bind(c)("click",function(){d.disconnect()},{once:!0})},d=new MutationObserver(function(){var a=document.querySelector(".Modal-wrapper .signFlowModal > .Modal-closeButton");a&&(d.disconnect(),e.disconnect(),a.click())});d.observe(document,{childList:!0,subtree:!0});var e=new MutationObserver(a=>{c(a,b)});e.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){e.disconnect(),d.disconnect()},5E3)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f8538b151cd703002da3f4fc86771de0 === e) return;
            (() => {
                var e = EventTarget.prototype.addEventListener, t = new MutationObserver((function() {
                    var e = document.querySelector(".Modal-wrapper .signFlowModal > .Modal-closeButton");
                    e && (t.disconnect(), o.disconnect(), e.click());
                }));
                t.observe(document, {
                    childList: !0,
                    subtree: !0
                });
                var o = new MutationObserver((o => {
                    !function(e, o) {
                        var n = document.querySelector("button.AppHeader-login, .AppHeader-userInfo > .AppHeader-profile > div > button.Button--blue");
                        n && o.bind(n)("click", (function() {
                            t.disconnect();
                        }), {
                            once: !0
                        });
                    }(0, e);
                }));
                o.observe(document, {
                    childList: !0,
                    subtree: !0
                }), setTimeout((function() {
                    o.disconnect(), t.disconnect();
                }), 5e3);
            })();
            Object.defineProperty(Window.prototype.toString, "f8538b151cd703002da3f4fc86771de0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f8538b151cd703002da3f4fc86771de0" due to: ' + e);
        }
    },
    '(function(){if(!document.cookie.includes("zip_and_city=")){var a=encodeURIComponent(\'{"zip":"","city":""}\');document.cookie="zip_and_city="+a+"; path=/;"}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["150eefbfeffab2cb6822c774c048adf4"] === e) return;
            !function() {
                if (!document.cookie.includes("zip_and_city=")) {
                    var e = encodeURIComponent('{"zip":"","city":""}');
                    document.cookie = "zip_and_city=" + e + "; path=/;";
                }
            }();
            Object.defineProperty(Window.prototype.toString, "150eefbfeffab2cb6822c774c048adf4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "150eefbfeffab2cb6822c774c048adf4" due to: ' + e);
        }
    },
    "(function(){var b=window.alert;window.alert=function(a){if(!/do geolokalizacji/.test(a.toString()))return b(a)};})();": () => {
        try {
            const t = "done";
            if (Window.prototype.toString["1362854a89198b0689400538f0b1a4dc"] === t) return;
            !function() {
                var t = window.alert;
                window.alert = function(e) {
                    if (!/do geolokalizacji/.test(e.toString())) return t(e);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "1362854a89198b0689400538f0b1a4dc", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "1362854a89198b0689400538f0b1a4dc" due to: ' + t);
        }
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=portal.abczdrowie.pl")||decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=parenting.pl"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace("https://"+a)}catch(b){}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ec8cfc984fdc64eb0423e2b09bc54f74 === e) return;
            !function() {
                if (decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=portal.abczdrowie.pl") || decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=parenting.pl")) try {
                    var e = new URL(window.location.href).searchParams.get("s");
                    location.replace("https://" + e);
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "ec8cfc984fdc64eb0423e2b09bc54f74", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ec8cfc984fdc64eb0423e2b09bc54f74" due to: ' + e);
        }
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=https://"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace(a)}catch(b){}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8b26d974cb42343c8f14233fe3c568e8"] === e) return;
            !function() {
                if (decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=https://")) try {
                    var e = new URL(window.location.href).searchParams.get("s");
                    location.replace(e);
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "8b26d974cb42343c8f14233fe3c568e8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8b26d974cb42343c8f14233fe3c568e8" due to: ' + e);
        }
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ucs=lbit="+b})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bc114c1bbc5dee318bd43b511cdcb308 === e) return;
            !function() {
                var e = (new Date).getTime();
                document.cookie = "ucs=lbit=" + e;
            }();
            Object.defineProperty(Window.prototype.toString, "bc114c1bbc5dee318bd43b511cdcb308", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bc114c1bbc5dee318bd43b511cdcb308" due to: ' + e);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/loginPopup.show/.test(a)){ _st(a,b);}};": () => {
        try {
            const t = "done";
            if (Window.prototype.toString["1042964cb83bcd640195f230a152da77"] === t) return;
            var _st = window.setTimeout;
            window.setTimeout = function(t, e) {
                /loginPopup.show/.test(t) || _st(t, e);
            };
            Object.defineProperty(Window.prototype.toString, "1042964cb83bcd640195f230a152da77", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "1042964cb83bcd640195f230a152da77" due to: ' + t);
        }
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'div[id^="substream_"] div[id^="hyperfeed_story_id"]\').forEach(function(e){var n=e.querySelectorAll(".userContentWrapper > div[class] > div[class] > div[class]"),o=e.querySelectorAll(".userContentWrapper > div[class] > div > div span");if("display: none !important;"!=e.getAttribute("style")){if(0<n.length&&n[0].innerText.contains("Suggested")){console.log("--------"),t+=1;var l=e.querySelectorAll("a[href]")[2].innerText;console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}if(0<o.length&&o[0].innerText.contains("People you may know"))console.log("--------"),t+=1,""==(l=e.querySelectorAll("a[href]")[2].innerText)&&(l="Facebook"),console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}})}),t=0;e.observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2d5a4b03ebe219d77f997c0a788b2eed"] === e) return;
            !function() {
                var e = new MutationObserver((function() {
                    document.querySelectorAll('div[id^="substream_"] div[id^="hyperfeed_story_id"]').forEach((function(e) {
                        var n = e.querySelectorAll(".userContentWrapper > div[class] > div[class] > div[class]"), t = e.querySelectorAll(".userContentWrapper > div[class] > div > div span");
                        if ("display: none !important;" != e.getAttribute("style")) {
                            if (0 < n.length && n[0].innerText.contains("Suggested")) {
                                console.log("--------"), o += 1;
                                var l = e.querySelectorAll("a[href]")[2].innerText;
                                console.log("Annoyance hidden from: " + l), console.log("Total annoyances Hidden: " + o), 
                                console.log("F length: " + n.length), console.log("--------"), e.style = "display:none!important;";
                            }
                            0 < t.length && t[0].innerText.contains("People you may know") && (console.log("--------"), 
                            o += 1, "" == (l = e.querySelectorAll("a[href]")[2].innerText) && (l = "Facebook"), 
                            console.log("Annoyance hidden from: " + l), console.log("Total annoyances Hidden: " + o), 
                            console.log("F length: " + n.length), console.log("--------"), e.style = "display:none!important;");
                        }
                    }));
                })), o = 0;
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }();
            Object.defineProperty(Window.prototype.toString, "2d5a4b03ebe219d77f997c0a788b2eed", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2d5a4b03ebe219d77f997c0a788b2eed" due to: ' + e);
        }
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["03e8fcb55c09dc00ea2c8fbc43ccc9ac"] === e) return;
            new MutationObserver((function() {
                document.querySelectorAll('div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])').forEach((function(e) {
                    "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you") && (console.log("--------"), 
                    console.log("Annoyances hidden (Suggested for you)"), e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "03e8fcb55c09dc00ea2c8fbc43ccc9ac", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "03e8fcb55c09dc00ea2c8fbc43ccc9ac" due to: ' + e);
        }
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > span\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7658e09af099cd1524b0fba53dd1cb1c"] === e) return;
            new MutationObserver((function() {
                document.querySelectorAll('div[role="feed"] > span').forEach((function(e) {
                    "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you") && (console.log("--------"), 
                    console.log("Annoyances hidden (Suggested for you)"), e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "7658e09af099cd1524b0fba53dd1cb1c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7658e09af099cd1524b0fba53dd1cb1c" due to: ' + e);
        }
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("#ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SHOWCASE")||a.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.feedEdge?.category?.includes("FB_SHORTS")){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["SHOWCASE post blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b1df923a63194358ca6f0ed1143474e5 === e) return;
            !function() {
                var e = 0, r = [];
                new MutationObserver((function() {
                    document.querySelectorAll('#ssrb_feed_start + div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class]:not([style*="display: none"])').forEach((function(n) {
                        Object.keys(n).forEach((function(s) {
                            if (s.includes("__reactEvents") || s.includes("__reactProps")) {
                                s = n[s];
                                try {
                                    if (s.children?.props?.category?.includes("SHOWCASE") || s.children?.props?.children?.props?.category?.includes("SHOWCASE") || s.children?.props?.children?.props?.feedEdge?.category?.includes("SHOWCASE") || s.children?.props?.category?.includes("FB_SHORTS") || s.children?.props?.children?.props?.category?.includes("FB_SHORTS") || s.children?.props?.children?.props?.feedEdge?.category?.includes("FB_SHORTS")) {
                                        e++, n.style = "display: none !important;";
                                        var t = n.querySelector("a[href][aria-label]:not([aria-hidden])");
                                        t && (r.push([ "SHOWCASE post blocked based on property [" + e + "] -> " + t.ariaLabel ]), 
                                        console.table(r));
                                    }
                                } catch (s) {}
                            }
                        }));
                    }));
                })).observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }();
            Object.defineProperty(Window.prototype.toString, "b1df923a63194358ca6f0ed1143474e5", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b1df923a63194358ca6f0ed1143474e5" due to: ' + e);
        }
    },
    "setInterval(function() { var el = document.querySelector('.howto-video video'); if (el) { el.pause(); el.src = ''; }}, 100);": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6037ae33aba3b05f056f756787dd2f13"] === e) return;
            setInterval((function() {
                var e = document.querySelector(".howto-video video");
                if (e) {
                    e.pause();
                    e.src = "";
                }
            }), 100);
            Object.defineProperty(Window.prototype.toString, "6037ae33aba3b05f056f756787dd2f13", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6037ae33aba3b05f056f756787dd2f13" due to: ' + e);
        }
    },
    'document.addEventListener(\'DOMContentLoaded\', function(){setTimeout(function(){var a=document.querySelector(".onp-sl-content");if("function"===typeof jQuery&&"object"===typeof bizpanda.lockerOptions&&a)try{a=0;for(var c=Object.keys(bizpanda.lockerOptions);a<c.length;a++){var d=c[a];if(d.includes("onpLock")){var b=bizpanda.lockerOptions[d];b&&jQuery.ajax({url:b.ajaxUrl,method:"post",data:{lockerId:b.lockerId,action:"opanda_loader",hash:b.contentHash},success:function(a){var b=jQuery(".onp-sl-content"),c=jQuery(".onp-sl-social-locker"); b.append(a);b.css("display","block");c.css("display","none")}})}}}catch(e){}},1E3)});': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f8726a98e9ee7f87afd7c9376374eb99 === e) return;
            document.addEventListener("DOMContentLoaded", (function() {
                setTimeout((function() {
                    var e = document.querySelector(".onp-sl-content");
                    if ("function" == typeof jQuery && "object" == typeof bizpanda.lockerOptions && e) try {
                        e = 0;
                        for (var o = Object.keys(bizpanda.lockerOptions); e < o.length; e++) {
                            var t = o[e];
                            if (t.includes("onpLock")) {
                                var n = bizpanda.lockerOptions[t];
                                n && jQuery.ajax({
                                    url: n.ajaxUrl,
                                    method: "post",
                                    data: {
                                        lockerId: n.lockerId,
                                        action: "opanda_loader",
                                        hash: n.contentHash
                                    },
                                    success: function(e) {
                                        var o = jQuery(".onp-sl-content"), t = jQuery(".onp-sl-social-locker");
                                        o.append(e);
                                        o.css("display", "block");
                                        t.css("display", "none");
                                    }
                                });
                            }
                        }
                    } catch (e) {}
                }), 1e3);
            }));
            Object.defineProperty(Window.prototype.toString, "f8726a98e9ee7f87afd7c9376374eb99", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f8726a98e9ee7f87afd7c9376374eb99" due to: ' + e);
        }
    },
    '(()=>{if(!location.href.includes("/download-"))return;document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'#downloadpage > form[action][method="POST"] > input[value^="https://"]\').forEach((e=>{const o=e.closest("form");var t,n;o&&(t=o,n=e.value,t.addEventListener("click",(e=>{e.preventDefault(),window.location.href=n})))}))}))})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7d835d508a44fa6f33710266eee3a2c3"] === e) return;
            location.href.includes("/download-") && document.addEventListener("DOMContentLoaded", (() => {
                document.querySelectorAll('#downloadpage > form[action][method="POST"] > input[value^="https://"]').forEach((e => {
                    const o = e.closest("form");
                    var t, n;
                    o && (t = o, n = e.value, t.addEventListener("click", (e => {
                        e.preventDefault(), window.location.href = n;
                    })));
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "7d835d508a44fa6f33710266eee3a2c3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7d835d508a44fa6f33710266eee3a2c3" due to: ' + e);
        }
    },
    '(function(){try{var a=location.href.split("/#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["32d9aaa2320ef0aacd203039342dcf58"] === e) return;
            !function() {
                try {
                    var e = location.href.split("/#");
                    if (e[1]) {
                        e = e[1];
                        for (var a = 0; 10 > a; a++) {
                            e = atob(e);
                            try {
                                new URL(decodeURIComponent(e));
                                var t = !0;
                            } catch (e) {
                                t = !1;
                            }
                            if (t) try {
                                location.assign(decodeURIComponent(e));
                                break;
                            } catch (e) {}
                        }
                    }
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "32d9aaa2320ef0aacd203039342dcf58", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "32d9aaa2320ef0aacd203039342dcf58" due to: ' + e);
        }
    },
    '(()=>{if(location.href.includes("?s=http")){const a=location.href.split("?s=").slice(1);try{location.assign(decodeURIComponent(a))}catch(a){}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["89966e93a718e4bf486ce24ffd372a32"] === e) return;
            (() => {
                if (location.href.includes("?s=http")) {
                    const e = location.href.split("?s=").slice(1);
                    try {
                        location.assign(decodeURIComponent(e));
                    } catch (e) {}
                }
            })();
            Object.defineProperty(Window.prototype.toString, "89966e93a718e4bf486ce24ffd372a32", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "89966e93a718e4bf486ce24ffd372a32" due to: ' + e);
        }
    },
    '!function(){if(location.href.includes("wpsafelink")){var e=new MutationObserver((function(){try{var t=document.querySelector(\'form#landing > input[name="go"][value]\'),n=document.querySelector("body > script");t&&t.value.startsWith("aHR0c")&&n&&n.textContent.includes("document.getElementById(\'landing\').submit();")&&(n.remove(),e.disconnect(),location.assign(atob(t.value)))}catch(e){}}));e.observe(document,{childList:!0,subtree:!0}),setTimeout((function(){e.disconnect()}),1e4)}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.eb7c35a03ee3cc3b96b7bb0b0d90a333 === e) return;
            !function() {
                if (location.href.includes("wpsafelink")) {
                    var e = new MutationObserver((function() {
                        try {
                            var t = document.querySelector('form#landing > input[name="go"][value]'), n = document.querySelector("body > script");
                            t && t.value.startsWith("aHR0c") && n && n.textContent.includes("document.getElementById('landing').submit();") && (n.remove(), 
                            e.disconnect(), location.assign(atob(t.value)));
                        } catch (e) {}
                    }));
                    e.observe(document, {
                        childList: !0,
                        subtree: !0
                    }), setTimeout((function() {
                        e.disconnect();
                    }), 1e4);
                }
            }();
            Object.defineProperty(Window.prototype.toString, "eb7c35a03ee3cc3b96b7bb0b0d90a333", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "eb7c35a03ee3cc3b96b7bb0b0d90a333" due to: ' + e);
        }
    },
    '!function(){if(-1<location.href.indexOf("?data=aHR0c")){var a=(new URL(window.location.href)).searchParams.get("data");if(a)try{window.location.assign(atob(a))}catch(b){}}}();': () => {
        try {
            const a = "done";
            if (Window.prototype.toString["44bad01b6f166fd09caa76089752d560"] === a) return;
            !function() {
                if (-1 < location.href.indexOf("?data=aHR0c")) {
                    var a = new URL(window.location.href).searchParams.get("data");
                    if (a) try {
                        window.location.assign(atob(a));
                    } catch (a) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "44bad01b6f166fd09caa76089752d560", {
                value: a,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (a) {
            console.error('Error executing AG js rule with uniqueId "44bad01b6f166fd09caa76089752d560" due to: ' + a);
        }
    },
    '!function(){if(-1<location.href.indexOf("?wpsafelink=http")){var a=(new URL(window.location.href)).searchParams.get("wpsafelink");if(a)try{window.location.assign(a)}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["11a8706f0dda4c1354a0f23ace755f3f"] === e) return;
            !function() {
                if (-1 < location.href.indexOf("?wpsafelink=http")) {
                    var e = new URL(window.location.href).searchParams.get("wpsafelink");
                    if (e) try {
                        window.location.assign(e);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "11a8706f0dda4c1354a0f23ace755f3f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "11a8706f0dda4c1354a0f23ace755f3f" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?go=")){var a=location.href.split("?go=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString["74acd4f9bf691bd110a5d483c18ecd56"] === o) return;
            !function() {
                if (-1 < window.location.href.indexOf("/?go=")) {
                    var o = location.href.split("?go=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "74acd4f9bf691bd110a5d483c18ecd56", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "74acd4f9bf691bd110a5d483c18ecd56" due to: ' + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?redirect=aHR0c")){var a=location.href.split("/?redirect=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["18e9f4638ee3f7cd8505ffa2c9efb0db"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/?redirect=aHR0c")) {
                    var e = location.href.split("/?redirect=");
                    if (e && e[1]) try {
                        window.location = atob(e[1]);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "18e9f4638ee3f7cd8505ffa2c9efb0db", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "18e9f4638ee3f7cd8505ffa2c9efb0db" due to: ' + e);
        }
    },
    '!function(){if(-1<location.href.indexOf("?data=")){var b=(new URL(window.location.href)).searchParams.get("data");if(b)try{var a=atob(b);a=a.split("&ulink=")[1];a.startsWith("http")&&window.location.assign(a)}catch(c){}}}();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString.d6c3eb40b31cb88fd93e2cbf35857f8c === t) return;
            !function() {
                if (-1 < location.href.indexOf("?data=")) {
                    var t = new URL(window.location.href).searchParams.get("data");
                    if (t) try {
                        var e = atob(t);
                        (e = e.split("&ulink=")[1]).startsWith("http") && window.location.assign(e);
                    } catch (t) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "d6c3eb40b31cb88fd93e2cbf35857f8c", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "d6c3eb40b31cb88fd93e2cbf35857f8c" due to: ' + t);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=aHR0c")){var a=location.href.split("/?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8407ee6883a7daf63bdaba9212c0a5f4"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/?r=aHR0c")) {
                    var e = location.href.split("/?r=");
                    if (e && e[1]) try {
                        window.location = atob(e[1]);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "8407ee6883a7daf63bdaba9212c0a5f4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8407ee6883a7daf63bdaba9212c0a5f4" due to: ' + e);
        }
    },
    '(function(){if(location.href.includes("/to/aHR0c"))try{var a=location.href.split("/to/");a=atob(a[1]);location=decodeURIComponent(a)}catch(b){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.faa1e5b373e282c3295d2edb730eab59 === e) return;
            !function() {
                if (location.href.includes("/to/aHR0c")) try {
                    var e = location.href.split("/to/");
                    e = atob(e[1]);
                    location = decodeURIComponent(e);
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "faa1e5b373e282c3295d2edb730eab59", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "faa1e5b373e282c3295d2edb730eab59" due to: ' + e);
        }
    },
    '(function(){"function"===typeof fetch&&location.href.includes("/?id=")&&fetch(location.href).then(function(e){e.headers.forEach(function(a,f){if("refresh"===f&&a.includes("url=http"))try{if(a.includes("&url=aHR0c")){var b,c=null==(b=a.split(/&url=/))?void 0:b[1];location=atob(c)}else{var d;location=c=null==(d=a.split(/url=(.+)/))?void 0:d[1]}}catch(g){}})})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1aa697d9b99b2928e92895ee3e7133f4"] === e) return;
            "function" == typeof fetch && location.href.includes("/?id=") && fetch(location.href).then((function(e) {
                e.headers.forEach((function(e, t) {
                    if ("refresh" === t && e.includes("url=http")) try {
                        if (e.includes("&url=aHR0c")) {
                            var o, r = null == (o = e.split(/&url=/)) ? void 0 : o[1];
                            location = atob(r);
                        } else {
                            var n;
                            location = r = null == (n = e.split(/url=(.+)/)) ? void 0 : n[1];
                        }
                    } catch (e) {}
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "1aa697d9b99b2928e92895ee3e7133f4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1aa697d9b99b2928e92895ee3e7133f4" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("out/?aHR0c")){var a=location.href.split("out/?");if(a&&a[1])try{window.location=atob(decodeURIComponent(a[1]))}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["14e7b6eeaed2b6c9766d1673c27e5f11"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("out/?aHR0c")) {
                    var e = location.href.split("out/?");
                    if (e && e[1]) try {
                        window.location = atob(decodeURIComponent(e[1]));
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "14e7b6eeaed2b6c9766d1673c27e5f11", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "14e7b6eeaed2b6c9766d1673c27e5f11" due to: ' + e);
        }
    },
    '!function(){if(window.location.href.includes("api")&&window.location.href.includes("&url=")){var b=location.href.split("&url=")[1];a:{try{var a=new URL(b)}catch(c){a=!1;break a}a="http:"===a.protocol||"https:"===a.protocol}if(a)try{window.location=b}catch(c){}}}();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString.a7aa2c291e20b59040377e4089cb13d8 === o) return;
            !function() {
                if (window.location.href.includes("api") && window.location.href.includes("&url=")) {
                    var o = location.href.split("&url=")[1];
                    o: {
                        try {
                            var e = new URL(o);
                        } catch (o) {
                            e = !1;
                            break o;
                        }
                        e = "http:" === e.protocol || "https:" === e.protocol;
                    }
                    if (e) try {
                        window.location = o;
                    } catch (o) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "a7aa2c291e20b59040377e4089cb13d8", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "a7aa2c291e20b59040377e4089cb13d8" due to: ' + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/download.php?")&&-1<window.location.href.indexOf("link=aHR0c")){var a=location.href.split("link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString.fbed59262d4b4df211cd5517c4c36cf1 === o) return;
            !function() {
                if (-1 < window.location.href.indexOf("/download.php?") && -1 < window.location.href.indexOf("link=aHR0c")) {
                    var o = location.href.split("link=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "fbed59262d4b4df211cd5517c4c36cf1", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "fbed59262d4b4df211cd5517c4c36cf1" due to: ' + o);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const a=function(a){const b=new DOMParser().parseFromString(a,"text/html");return b.documentElement.textContent},b=function(){if("object"==typeof _sharedData&&"string"==typeof _sharedData[0]?.destination){const b=a(_sharedData[0].destination);if(b.startsWith("http"))try{window.location=b}catch(a){}}};if(window._sharedData)b();else{const a=new MutationObserver(function(){window._sharedData&&(a.disconnect(),b())});a.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){a.disconnect()},1E4)}})})();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString["9cac65361b045047e010c7826d557bc0"] === t) return;
            document.addEventListener("DOMContentLoaded", (() => {
                const t = function() {
                    if ("object" == typeof _sharedData && "string" == typeof _sharedData[0]?.destination) {
                        const t = function(t) {
                            return (new DOMParser).parseFromString(t, "text/html").documentElement.textContent;
                        }(_sharedData[0].destination);
                        if (t.startsWith("http")) try {
                            window.location = t;
                        } catch (t) {}
                    }
                };
                if (window._sharedData) t(); else {
                    const e = new MutationObserver((function() {
                        window._sharedData && (e.disconnect(), t());
                    }));
                    e.observe(document, {
                        childList: !0,
                        subtree: !0
                    }), setTimeout((function() {
                        e.disconnect();
                    }), 1e4);
                }
            }));
            Object.defineProperty(Window.prototype.toString, "9cac65361b045047e010c7826d557bc0", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "9cac65361b045047e010c7826d557bc0" due to: ' + t);
        }
    },
    '!function(){if(-1<window.location.href.indexOf(".html?url=aHR0c")){var a=location.href.split(".html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString["0b9c803325dd9cf5e623a58f3f42c964"] === t) return;
            !function() {
                if (-1 < window.location.href.indexOf(".html?url=aHR0c")) {
                    var t = location.href.split(".html?url=");
                    if (t && t[1]) try {
                        window.location = atob(t[1]);
                    } catch (t) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "0b9c803325dd9cf5e623a58f3f42c964", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "0b9c803325dd9cf5e623a58f3f42c964" due to: ' + t);
        }
    },
    '!function(){if(-1<location.href.indexOf("/aHR0c")){var a=location.href.split("/").pop();if(a&&a.includes("aHR0c"))try{location=decodeURIComponent(atob(a))}catch(b){}}}();': () => {
        try {
            const o = "done";
            if (Window.prototype.toString.fa04035c4b218bf538509b1f9bca93d9 === o) return;
            !function() {
                if (-1 < location.href.indexOf("/aHR0c")) {
                    var o = location.href.split("/").pop();
                    if (o && o.includes("aHR0c")) try {
                        location = decodeURIComponent(atob(o));
                    } catch (o) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "fa04035c4b218bf538509b1f9bca93d9", {
                value: o,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (o) {
            console.error('Error executing AG js rule with uniqueId "fa04035c4b218bf538509b1f9bca93d9" due to: ' + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/gotothedl.html?url=")){var a=location.href.split("/gotothedl.html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fd6511a662b1e2713ee805351331ec88 === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/gotothedl.html?url=")) {
                    var e = location.href.split("/gotothedl.html?url=");
                    if (e && e[1]) try {
                        window.location = atob(e[1]);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "fd6511a662b1e2713ee805351331ec88", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fd6511a662b1e2713ee805351331ec88" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/link/?link=aHR0c")){var a=location.href.split("/link/?link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const d = "done";
            if (Window.prototype.toString.d182d7cd6901d7ba2db76b7116137d30 === d) return;
            !function() {
                if (-1 < window.location.href.indexOf("/link/?link=aHR0c")) {
                    var d = location.href.split("/link/?link=");
                    if (d && d[1]) try {
                        window.location = atob(d[1]);
                    } catch (d) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "d182d7cd6901d7ba2db76b7116137d30", {
                value: d,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (d) {
            console.error('Error executing AG js rule with uniqueId "d182d7cd6901d7ba2db76b7116137d30" due to: ' + d);
        }
    },
    '!function(){if(-1<location.pathname.indexOf("/view.php")){var a=(new URL(window.location.href)).searchParams.get("id");if(a&&-1==document.cookie.indexOf(a))try{document.cookie=a+"=user; path=/;";location.reload();}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["89696970bfadbdff1c23f38046797c74"] === e) return;
            !function() {
                if (-1 < location.pathname.indexOf("/view.php")) {
                    var e = new URL(window.location.href).searchParams.get("id");
                    if (e && -1 == document.cookie.indexOf(e)) try {
                        document.cookie = e + "=user; path=/;";
                        location.reload();
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "89696970bfadbdff1c23f38046797c74", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "89696970bfadbdff1c23f38046797c74" due to: ' + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("exUserId")&&(document.cookie="exUserId=1; domain=.4shared.com; path=/;")})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["83200f16f2ddab39b258418b8f092a1e"] === e) return;
            -1 == document.cookie.indexOf("exUserId") && (document.cookie = "exUserId=1; domain=.4shared.com; path=/;");
            Object.defineProperty(Window.prototype.toString, "83200f16f2ddab39b258418b8f092a1e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "83200f16f2ddab39b258418b8f092a1e" due to: ' + e);
        }
    },
    '!function(){if(-1<location.pathname.indexOf("/redirect")){var a=(new URL(window.location.href)).searchParams.get("to");if(a)try{window.location=atob(a)}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.af354057b5f1999097c4f848b8100343 === e) return;
            !function() {
                if (-1 < location.pathname.indexOf("/redirect")) {
                    var e = new URL(window.location.href).searchParams.get("to");
                    if (e) try {
                        window.location = atob(e);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "af354057b5f1999097c4f848b8100343", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "af354057b5f1999097c4f848b8100343" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("?url=")){var a=location.href.split("?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8015f163e0243425947c898a301100ae"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("?url=")) {
                    var e = location.href.split("?url=");
                    if (e && e[1]) try {
                        window.location = atob(e[1]);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "8015f163e0243425947c898a301100ae", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8015f163e0243425947c898a301100ae" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1<location.pathname.indexOf("/go/")){var b=new MutationObserver(function(){if(document.querySelector("#get_link_btn"))try{[].slice.call(document.getElementsByTagName("script")).some(function(a){a.text.match(/goToUrl \\("/)&&(a=a.text.split(/goToUrl \\("([\\s\\S]*?)"\\);/),location=a[1])})}catch(a){}});b.observe(document,{childList:!0,subtree:!0});setTimeout(function(){b.disconnect()},1E4)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1b7a3b5c1b1b60eb96bdd9dfb49f36ed"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                if (-1 < location.pathname.indexOf("/go/")) {
                    var e = new MutationObserver((function() {
                        if (document.querySelector("#get_link_btn")) try {
                            [].slice.call(document.getElementsByTagName("script")).some((function(e) {
                                e.text.match(/goToUrl \("/) && (e = e.text.split(/goToUrl \("([\s\S]*?)"\);/), location = e[1]);
                            }));
                        } catch (e) {}
                    }));
                    e.observe(document, {
                        childList: !0,
                        subtree: !0
                    });
                    setTimeout((function() {
                        e.disconnect();
                    }), 1e4);
                }
            }));
            Object.defineProperty(Window.prototype.toString, "1b7a3b5c1b1b60eb96bdd9dfb49f36ed", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1b7a3b5c1b1b60eb96bdd9dfb49f36ed" due to: ' + e);
        }
    },
    "document.addEventListener('DOMContentLoad', function() { setTimeout(function() { second = 0; }, 300); });": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["034a6d2e27669874997985e584d3fc8b"] === e) return;
            document.addEventListener("DOMContentLoad", (function() {
                setTimeout((function() {
                    second = 0;
                }), 300);
            }));
            Object.defineProperty(Window.prototype.toString, "034a6d2e27669874997985e584d3fc8b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "034a6d2e27669874997985e584d3fc8b" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=")){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["307379e4f228b3973b29e647d7b9d240"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/?r=")) {
                    var e = location.href.split("?r=");
                    if (e && e[1]) try {
                        window.location = atob(e[1]);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "307379e4f228b3973b29e647d7b9d240", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "307379e4f228b3973b29e647d7b9d240" due to: ' + e);
        }
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/removeAttr\\('disabled'\\)/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8a9f85f8cf15c1e19462f7c54155e865"] === e) return;
            !function() {
                var e = window.setInterval;
                window.setInterval = function(t, r) {
                    return 1e3 === r && /removeAttr\('disabled'\)/.test(t.toString()) && (r *= .01), 
                    e.apply(this, arguments);
                }.bind(window);
            }();
            Object.defineProperty(Window.prototype.toString, "8a9f85f8cf15c1e19462f7c54155e865", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8a9f85f8cf15c1e19462f7c54155e865" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt(window.location.href.split("#?o=")[1].replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6d9ca9f617340a6d9976710f1e5a7b50"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    if ("undefined" != typeof aesCrypto && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("#?o=")) try {
                        window.location = aesCrypto.decrypt(window.location.href.split("#?o=")[1].replace(/^\s+/, "").replace(/\s+$/, ""), "root".replace(/^\s+/, "").replace(/\s+$/, ""));
                    } catch (e) {}
                }), 300);
            }));
            Object.defineProperty(Window.prototype.toString, "6d9ca9f617340a6d9976710f1e5a7b50", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6d9ca9f617340a6d9976710f1e5a7b50" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt($.urlParam("o").replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e3c828d254377a11d58cabf38f975080 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    if ("undefined" != typeof aesCrypto && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("#?o=")) try {
                        window.location = aesCrypto.decrypt($.urlParam("o").replace(/^\s+/, "").replace(/\s+$/, ""), "root".replace(/^\s+/, "").replace(/\s+$/, ""));
                    } catch (e) {}
                }), 300);
            }));
            Object.defineProperty(Window.prototype.toString, "e3c828d254377a11d58cabf38f975080", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e3c828d254377a11d58cabf38f975080" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("function"===typeof convertstr&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("html#?o="))try{window.location=aesCrypto.decrypt(convertstr($.urlParam("o")),convertstr("root"))}catch(a){}},300)})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e50329594db3b07068dcf74209e441a3 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    if ("function" == typeof convertstr && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("html#?o=")) try {
                        window.location = aesCrypto.decrypt(convertstr($.urlParam("o")), convertstr("root"));
                    } catch (e) {}
                }), 300);
            }));
            Object.defineProperty(Window.prototype.toString, "e50329594db3b07068dcf74209e441a3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e50329594db3b07068dcf74209e441a3" due to: ' + e);
        }
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/'#timer'/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.de338228231bafa3ab4463a596c1790d === e) return;
            !function() {
                var e = window.setInterval;
                window.setInterval = function(t, r) {
                    return 1e3 === r && /'#timer'/.test(t.toString()) && (r *= .01), e.apply(this, arguments);
                }.bind(window);
            }();
            Object.defineProperty(Window.prototype.toString, "de338228231bafa3ab4463a596c1790d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "de338228231bafa3ab4463a596c1790d" due to: ' + e);
        }
    },
    '(()=>{const a=new MutationObserver(function(){const b=document.querySelector("script[src^=\\"/assets/js/unlock.js\\"]");if(b){a.disconnect();let c;for(let a of b.attributes)if(a.textContent.includes("aHR0c")){c=a.textContent;break}c&&setTimeout(function(){location.assign(atob(c))},500)}});a.observe(document,{childList:!0,subtree:!0})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["36bc1f9853e93deac861c56d6200a5b0"] === e) return;
            (() => {
                const e = new MutationObserver((function() {
                    const t = document.querySelector('script[src^="/assets/js/unlock.js"]');
                    if (t) {
                        e.disconnect();
                        let o;
                        for (let e of t.attributes) if (e.textContent.includes("aHR0c")) {
                            o = e.textContent;
                            break;
                        }
                        o && setTimeout((function() {
                            location.assign(atob(o));
                        }), 500);
                    }
                }));
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            })();
            Object.defineProperty(Window.prototype.toString, "36bc1f9853e93deac861c56d6200a5b0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "36bc1f9853e93deac861c56d6200a5b0" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1!==window.location.href.indexOf("onet.pl/?utm_source=")){const o=new MutationObserver(function(){var e=document.querySelector(\'a[href][onclick*="Nitro_clickmore"][onclick*="czytaj_wiecej"], a[href][class^="NitroCard_sectionLink_"], article[class^="NitroCard_nitroCard__"] > a[href][class^="Common_sectionLink__"]:not([href^="undefined"])\');e&&(o.disconnect(),location.replace(e.href))});o.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){o.disconnect()},1e4)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1ef1848adf82a2225338e1cf0d384d9f"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                if (-1 !== window.location.href.indexOf("onet.pl/?utm_source=")) {
                    const e = new MutationObserver((function() {
                        var o = document.querySelector('a[href][onclick*="Nitro_clickmore"][onclick*="czytaj_wiecej"], a[href][class^="NitroCard_sectionLink_"], article[class^="NitroCard_nitroCard__"] > a[href][class^="Common_sectionLink__"]:not([href^="undefined"])');
                        o && (e.disconnect(), location.replace(o.href));
                    }));
                    e.observe(document, {
                        childList: !0,
                        subtree: !0
                    }), setTimeout((function() {
                        e.disconnect();
                    }), 1e4);
                }
            }));
            Object.defineProperty(Window.prototype.toString, "1ef1848adf82a2225338e1cf0d384d9f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1ef1848adf82a2225338e1cf0d384d9f" due to: ' + e);
        }
    },
    "!function(){if(-1<location.pathname.indexOf(\"/pushredirect/\")){var url=new URL(window.location.href); var dest=url.searchParams.get('dest'); if(dest){location=dest;}}}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6b5cea966014c82ed21c8c5706e0bee8"] === e) return;
            !function() {
                if (-1 < location.pathname.indexOf("/pushredirect/")) {
                    var e = new URL(window.location.href).searchParams.get("dest");
                    e && (location = e);
                }
            }();
            Object.defineProperty(Window.prototype.toString, "6b5cea966014c82ed21c8c5706e0bee8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6b5cea966014c82ed21c8c5706e0bee8" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("dynamic?r=")&&!/https?:\\/\\/(www\\.)?h-gen\\.xyz\\//.test(document.referrer)){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fefa615247862ad4c7b0ecd9355c39fd === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("dynamic?r=") && !/https?:\/\/(www\.)?h-gen\.xyz\//.test(document.referrer)) {
                    var e = location.href.split("?r=");
                    if (e && e[1]) try {
                        window.location = atob(e[1]);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "fefa615247862ad4c7b0ecd9355c39fd", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fefa615247862ad4c7b0ecd9355c39fd" due to: ' + e);
        }
    },
    "!function(){const t={apply:(t,e,n)=>{const a=Reflect.apply(t,e,n);return a?.data?.getDetailPageContent?.linkCustomAdOffers&&(a.data.getDetailPageContent.linkCustomAdOffers=[]),a}};window.JSON.parse=new Proxy(window.JSON.parse,t)}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c4448628d8540260def416c0db16d29f === e) return;
            !function() {
                const e = {
                    apply: (e, t, n) => {
                        const o = Reflect.apply(e, t, n);
                        return o?.data?.getDetailPageContent?.linkCustomAdOffers && (o.data.getDetailPageContent.linkCustomAdOffers = []), 
                        o;
                    }
                };
                window.JSON.parse = new Proxy(window.JSON.parse, e);
            }();
            Object.defineProperty(Window.prototype.toString, "c4448628d8540260def416c0db16d29f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c4448628d8540260def416c0db16d29f" due to: ' + e);
        }
    },
    "(() => {document.addEventListener(\"DOMContentLoaded\", (() => {setTimeout(function() { if(typeof player.pause != 'undefined') { player.pause(); } }, 3000);}));})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a74d879c7ac45de88fa5296db6cc0537 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    void 0 !== player.pause && player.pause();
                }), 3e3);
            }));
            Object.defineProperty(Window.prototype.toString, "a74d879c7ac45de88fa5296db6cc0537", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a74d879c7ac45de88fa5296db6cc0537" due to: ' + e);
        }
    },
    '(function(){var a="http"+(new URL(window.location.href)).searchParams.get("xurl");try{new URL(a);var b=!0}catch(c){b=!1}if(b)try{window.location=a}catch(c){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.df209bc351ff0553f6a35cad491038e2 === e) return;
            !function() {
                var e = "http" + new URL(window.location.href).searchParams.get("xurl");
                try {
                    new URL(e);
                    var t = !0;
                } catch (e) {
                    t = !1;
                }
                if (t) try {
                    window.location = e;
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "df209bc351ff0553f6a35cad491038e2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "df209bc351ff0553f6a35cad491038e2" due to: ' + e);
        }
    },
    "window.self = window.top;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["443a08e7b42a84571d7f5117b4d64c9f"] === e) return;
            window.self = window.top;
            Object.defineProperty(Window.prototype.toString, "443a08e7b42a84571d7f5117b4d64c9f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "443a08e7b42a84571d7f5117b4d64c9f" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{var b=document.getElementById("sm_dl_wait");if(b){var c=document.createElement("a");c.setAttribute("href",b.getAttribute("data-id"));c.innerHTML="<b>"+("function"==typeof window.a?IMSLPGetMsg("js-s"):"Click here to continue your download.")+"</b>";var d=document.createElement("style");d.innerHTML="#sm_dl_wait{display:none!important;}";b.parentNode.insertBefore(c,b);b.parentNode.insertBefore(d,b)}}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7b45e913b52ddafeab6005ad59c3472a"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                var e = document.getElementById("sm_dl_wait");
                if (e) {
                    var t = document.createElement("a");
                    t.setAttribute("href", e.getAttribute("data-id"));
                    t.innerHTML = "<b>" + ("function" == typeof window.a ? IMSLPGetMsg("js-s") : "Click here to continue your download.") + "</b>";
                    var n = document.createElement("style");
                    n.innerHTML = "#sm_dl_wait{display:none!important;}";
                    e.parentNode.insertBefore(t, e);
                    e.parentNode.insertBefore(n, e);
                }
            }));
            Object.defineProperty(Window.prototype.toString, "7b45e913b52ddafeab6005ad59c3472a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7b45e913b52ddafeab6005ad59c3472a" due to: ' + e);
        }
    },
    '(()=>{["contextmenu","copy","selectstart"].forEach((o=>{window.addEventListener(o,(o=>{o.stopPropagation()}),!0)}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["58381ff8715080c5ddef89be33326b0c"] === e) return;
            [ "contextmenu", "copy", "selectstart" ].forEach((e => {
                window.addEventListener(e, (e => {
                    e.stopPropagation();
                }), !0);
            }));
            Object.defineProperty(Window.prototype.toString, "58381ff8715080c5ddef89be33326b0c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "58381ff8715080c5ddef89be33326b0c" due to: ' + e);
        }
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0); window.addEventListener("copy",function(a){a.stopPropagation()},!0);': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f5bda0983617c9e82a78a551426bbb32 === e) return;
            window.addEventListener("contextmenu", (function(e) {
                e.stopPropagation();
            }), !0);
            window.addEventListener("copy", (function(e) {
                e.stopPropagation();
            }), !0);
            Object.defineProperty(Window.prototype.toString, "f5bda0983617c9e82a78a551426bbb32", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f5bda0983617c9e82a78a551426bbb32" due to: ' + e);
        }
    },
    'window.addEventListener("selectstart",function(a){a.stopPropagation()},!0);': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bd1b4f0e1559b5644a30844b6213ffd3 === e) return;
            window.addEventListener("selectstart", (function(e) {
                e.stopPropagation();
            }), !0);
            Object.defineProperty(Window.prototype.toString, "bd1b4f0e1559b5644a30844b6213ffd3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bd1b4f0e1559b5644a30844b6213ffd3" due to: ' + e);
        }
    },
    "(function(){z=self.EventTarget.prototype.addEventListener;self.EventTarget.prototype.addEventListener=function(a,b){if(!/cut|copy|paste/.test(a.toString()))return z.apply(this,arguments)}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8342d640dabc53d6d2d38df78178b78e"] === e) return;
            !function() {
                z = self.EventTarget.prototype.addEventListener;
                self.EventTarget.prototype.addEventListener = function(e, t) {
                    if (!/cut|copy|paste/.test(e.toString())) return z.apply(this, arguments);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "8342d640dabc53d6d2d38df78178b78e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8342d640dabc53d6d2d38df78178b78e" due to: ' + e);
        }
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0);': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["99382d0bad7923913149eaceb54a5bcd"] === e) return;
            window.addEventListener("contextmenu", (function(e) {
                e.stopPropagation();
            }), !0);
            Object.defineProperty(Window.prototype.toString, "99382d0bad7923913149eaceb54a5bcd", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "99382d0bad7923913149eaceb54a5bcd" due to: ' + e);
        }
    },
    '(function(){const b=function(d){const a=Math.pow(10,d-1),b=Math.pow(10,d);return Math.floor(Math.random()*(b-a)+a)}(12);window.addEventListener("load",function(){window.google_image_requests=[],window.google_global_correlator=b,window._hmt=window._hmt||[],_hmt.id=b})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.eb04a415377ef4ca383dbeb96bc0959d === e) return;
            !function() {
                const e = function() {
                    const e = Math.pow(10, 11), o = Math.pow(10, 12);
                    return Math.floor(Math.random() * (o - e) + e);
                }();
                window.addEventListener("load", (function() {
                    window.google_image_requests = [], window.google_global_correlator = e, window._hmt = window._hmt || [], 
                    _hmt.id = e;
                }));
            }();
            Object.defineProperty(Window.prototype.toString, "eb04a415377ef4ca383dbeb96bc0959d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "eb04a415377ef4ca383dbeb96bc0959d" due to: ' + e);
        }
    },
    'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError(/^(?!.*(rt-error.js)).*$/);': () => {
        try {
            const r = "done";
            if (Window.prototype.toString["2c65b37bc179c213f5741f032fbc81bd"] === r) return;
            function preventError(r) {
                window.addEventListener("error", (function(e) {
                    if (e.srcElement && e.srcElement.src) {
                        new RegExp(r).test(e.srcElement.src) && (e.srcElement.onerror = function() {});
                    }
                }), !0);
            }
            preventError(/^(?!.*(rt-error.js)).*$/);
            Object.defineProperty(Window.prototype.toString, "2c65b37bc179c213f5741f032fbc81bd", {
                value: r,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2c65b37bc179c213f5741f032fbc81bd" due to: ' + e);
        }
    },
    "window.ad = window.ads = window.dzad = window.dzads = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ae3e820b38653aaf630b5b70d22a1bb6 === e) return;
            window.ad = window.ads = window.dzad = window.dzads = !0;
            Object.defineProperty(Window.prototype.toString, "ae3e820b38653aaf630b5b70d22a1bb6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ae3e820b38653aaf630b5b70d22a1bb6" due to: ' + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Adblock/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e156fcdd4472579f7801d0e4acc20c97 === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/Adblock/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "e156fcdd4472579f7801d0e4acc20c97", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e156fcdd4472579f7801d0e4acc20c97" due to: ' + e);
        }
    },
    "(function(){window._czc={push:function(){}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["23ea3840e6c6f4717038a47e91ac5633"] === e) return;
            window._czc = {
                push: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "23ea3840e6c6f4717038a47e91ac5633", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "23ea3840e6c6f4717038a47e91ac5633" due to: ' + e);
        }
    },
    "(()=>{let e=!1;window.qyMesh=window.qyMesh||{},window.qyMesh=new Proxy(window.qyMesh,{get:function(a,t,d){return!e&&a?.preload?.Page_recommend_1?.response?.items&&(a.preload.Page_recommend_1.response.items.forEach((e=>{e.extData?.dataExtAd&&(e.extData.dataExtAd={}),e.video&&e.video.forEach((e=>{e.adverts&&(e.adverts=[]),e.data&&(e.data=e.data.filter((e=>!e.ad)))}))})),e=!0),Reflect.get(a,t,d)}})})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fde1dae48543296e9f6bd72f2157ce95 === e) return;
            (() => {
                let e = !1;
                window.qyMesh = window.qyMesh || {}, window.qyMesh = new Proxy(window.qyMesh, {
                    get: function(t, d, o) {
                        return !e && t?.preload?.Page_recommend_1?.response?.items && (t.preload.Page_recommend_1.response.items.forEach((e => {
                            e.extData?.dataExtAd && (e.extData.dataExtAd = {}), e.video && e.video.forEach((e => {
                                e.adverts && (e.adverts = []), e.data && (e.data = e.data.filter((e => !e.ad)));
                            }));
                        })), e = !0), Reflect.get(t, d, o);
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "fde1dae48543296e9f6bd72f2157ce95", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fde1dae48543296e9f6bd72f2157ce95" due to: ' + e);
        }
    },
    '(function(){window.eval=new Proxy(eval,{apply:(e,c,n)=>{const o=Reflect.apply(e,c,n);if("object"==typeof o&&o.banners)try{o.banners.forEach(((e,c)=>{e.commercial&&(e.commercial={})}))}catch(e){console.debug(e)}return o}})})();': () => {
        try {
            const flag = "done";
            if (Window.prototype.toString["119696f6d27a9b6c225cdaa7954a52fd"] === flag) return;
            (function() {
                window.eval = new Proxy(eval, {
                    apply: (e, a, o) => {
                        const r = Reflect.apply(e, a, o);
                        if ("object" == typeof r && r.banners) try {
                            r.banners.forEach(((e, a) => {
                                e.commercial && (e.commercial = {});
                            }));
                        } catch (e) {
                            console.debug(e);
                        }
                        return r;
                    }
                });
            })();
            Object.defineProperty(Window.prototype.toString, "119696f6d27a9b6c225cdaa7954a52fd", {
                value: flag,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "119696f6d27a9b6c225cdaa7954a52fd" due to: ' + e);
        }
    },
    '(()=>{const i=function(){};window.__uid2=window.__uid2||{},window.__uid2.init=i,window.__uid2.setIdentityFromEmail=i,window.__uid2.callbacks=window.__uid2.callbacks||[],window.__uid2.callbacks.push=function(i){"function"==typeof i&&i("InitCompleted",{identity:null})}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b2a535efb393e3b426f36ad8e34ba1f7 === e) return;
            (() => {
                const e = function() {};
                window.__uid2 = window.__uid2 || {}, window.__uid2.init = e, window.__uid2.setIdentityFromEmail = e, 
                window.__uid2.callbacks = window.__uid2.callbacks || [], window.__uid2.callbacks.push = function(e) {
                    "function" == typeof e && e("InitCompleted", {
                        identity: null
                    });
                };
            })();
            Object.defineProperty(Window.prototype.toString, "b2a535efb393e3b426f36ad8e34ba1f7", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b2a535efb393e3b426f36ad8e34ba1f7" due to: ' + e);
        }
    },
    "setTimeout(function() { var el = document.querySelector('input[name=\"dfp\"]'); if(el){el.value = '1234567890123456';} }, 300);": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a07f45c054f1a02c9581416dcc133e06 === e) return;
            setTimeout((function() {
                var e = document.querySelector('input[name="dfp"]');
                e && (e.value = "1234567890123456");
            }), 300);
            Object.defineProperty(Window.prototype.toString, "a07f45c054f1a02c9581416dcc133e06", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a07f45c054f1a02c9581416dcc133e06" due to: ' + e);
        }
    },
    "(()=>{const n=function(){};window.pa={avInsights:{Media:function(){return{set:n}}},setConfigurations:n,sendEvent:n,refresh:n,getVisitorId:n}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["79d1903ec5ebd79ef6e85148b259526b"] === e) return;
            (() => {
                const e = function() {};
                window.pa = {
                    avInsights: {
                        Media: function() {
                            return {
                                set: e
                            };
                        }
                    },
                    setConfigurations: e,
                    sendEvent: e,
                    refresh: e,
                    getVisitorId: e
                };
            })();
            Object.defineProperty(Window.prototype.toString, "79d1903ec5ebd79ef6e85148b259526b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "79d1903ec5ebd79ef6e85148b259526b" due to: ' + e);
        }
    },
    '(()=>{window.analytics=[],analytics.user=function(){return this},analytics.track=function(){},analytics.anonymousId=function(){},analytics.push=function(){[...arguments].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}Array.isArray(n)&&[...n].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}}))}))};})();': () => {
        try {
            const c = "done";
            if (Window.prototype.toString.c5eccff17c5bfd7b81d14b2ae2d579e6 === c) return;
            window.analytics = [], analytics.user = function() {
                return this;
            }, analytics.track = function() {}, analytics.anonymousId = function() {}, analytics.push = function() {
                [ ...arguments ].forEach((c => {
                    if ("function" == typeof c) try {
                        c();
                    } catch (c) {
                        console.debug(c);
                    }
                    Array.isArray(c) && [ ...c ].forEach((c => {
                        if ("function" == typeof c) try {
                            c();
                        } catch (c) {
                            console.debug(c);
                        }
                    }));
                }));
            };
            Object.defineProperty(Window.prototype.toString, "c5eccff17c5bfd7b81d14b2ae2d579e6", {
                value: c,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (c) {
            console.error('Error executing AG js rule with uniqueId "c5eccff17c5bfd7b81d14b2ae2d579e6" due to: ' + c);
        }
    },
    '(()=>{window.ga=function(){const a=arguments.length;if(0===a)return;const b=arguments[a-1];let c;b instanceof Object&&null!==b&&"function"==typeof b.hitCallback?c=b.hitCallback:"function"==typeof b&&(c=()=>{b(ga.create())});try{setTimeout(c,1)}catch(a){}}})();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString.c36460b31e5b7f98f266af7f13766c20 === t) return;
            window.ga = function() {
                const t = arguments.length;
                if (0 === t) return;
                const e = arguments[t - 1];
                let n;
                e instanceof Object && null !== e && "function" == typeof e.hitCallback ? n = e.hitCallback : "function" == typeof e && (n = () => {
                    e(ga.create());
                });
                try {
                    setTimeout(n, 1);
                } catch (t) {}
            };
            Object.defineProperty(Window.prototype.toString, "c36460b31e5b7f98f266af7f13766c20", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "c36460b31e5b7f98f266af7f13766c20" due to: ' + t);
        }
    },
    "(()=>{const t={getExperimentStates:function(){return[]}};window.optimizely={get:function(){return t}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f7c0c8e9372a7fa53bbbce0298119df8 === e) return;
            (() => {
                const e = {
                    getExperimentStates: function() {
                        return [];
                    }
                };
                window.optimizely = {
                    get: function() {
                        return e;
                    }
                };
            })();
            Object.defineProperty(Window.prototype.toString, "f7c0c8e9372a7fa53bbbce0298119df8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f7c0c8e9372a7fa53bbbce0298119df8" due to: ' + e);
        }
    },
    "(()=>{window.google_optimize={get(){}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["36df238a158cc003e8a8e5fdca90b30c"] === e) return;
            window.google_optimize = {
                get() {}
            };
            Object.defineProperty(Window.prototype.toString, "36df238a158cc003e8a8e5fdca90b30c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "36df238a158cc003e8a8e5fdca90b30c" due to: ' + e);
        }
    },
    "(()=>{window.tC={event:{track(){}}}})();": () => {
        try {
            const c = "done";
            if (Window.prototype.toString["99d72f7c5b99c10e8cdafc4f2cfcb2fd"] === c) return;
            window.tC = {
                event: {
                    track() {}
                }
            };
            Object.defineProperty(Window.prototype.toString, "99d72f7c5b99c10e8cdafc4f2cfcb2fd", {
                value: c,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (c) {
            console.error('Error executing AG js rule with uniqueId "99d72f7c5b99c10e8cdafc4f2cfcb2fd" due to: ' + c);
        }
    },
    "(()=>{window.CQ_Analytics={SegmentMgr:{loadSegments(){}},ClientContextUtils:{init(){}}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8715a0ec32e4b4aacff2e980a0cc496f"] === e) return;
            window.CQ_Analytics = {
                SegmentMgr: {
                    loadSegments() {}
                },
                ClientContextUtils: {
                    init() {}
                }
            };
            Object.defineProperty(Window.prototype.toString, "8715a0ec32e4b4aacff2e980a0cc496f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8715a0ec32e4b4aacff2e980a0cc496f" due to: ' + e);
        }
    },
    "(function(){window.DD_LOGS={onReady:function(){},logger:{log:function(){}}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8b87d29cf52f44fbcd9dd5303e9f1ad3"] === e) return;
            window.DD_LOGS = {
                onReady: function() {},
                logger: {
                    log: function() {}
                }
            };
            Object.defineProperty(Window.prototype.toString, "8b87d29cf52f44fbcd9dd5303e9f1ad3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8b87d29cf52f44fbcd9dd5303e9f1ad3" due to: ' + e);
        }
    },
    "(function(){window.swua={swEvent:function(){}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f28a1bc10a399048b74c1518d0e7b0c4 === e) return;
            window.swua = {
                swEvent: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "f28a1bc10a399048b74c1518d0e7b0c4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f28a1bc10a399048b74c1518d0e7b0c4" due to: ' + e);
        }
    },
    "!function(){window.pSUPERFLY={virtualPage:function(){}};}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["400e65f5eeab811a9c314d5e9dc23b9a"] === e) return;
            window.pSUPERFLY = {
                virtualPage: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "400e65f5eeab811a9c314d5e9dc23b9a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "400e65f5eeab811a9c314d5e9dc23b9a" due to: ' + e);
        }
    },
    'new MutationObserver(function(){var t=["?fbclid","%3Ffbclid","&fbclid","%26fbclid","&__tn__","%__26tn__","%3Futm","?utm","&fbc=","%26fbc%3D","?share=","%3Fshare%3D","%3F__twitter_impression%3D","?__twitter_impression=","?wtmc=","%3Fwtmc%3D","?originalReferrer=","%3ForiginalReferrer%3D","?wtrid=","%3Fwtrid%3D","?trbo=","%3Ftrbo%3D","?GEPC=","%3FGEPC%3D","?whatsapp=","%3Fwhatsapp%3D","?fbc=","%3Ffbc%3D","?dmcid=","%3Fdmcid%3D"];document.querySelectorAll(\'a[target="_blank"]\').forEach(function(e){for(i=0;i<t.length;i++){var r;e.href.includes(t[i])&&(r=(r=(r=e.href.split("#!")[1])||e.href.split("%23%21")[1])||"",e.href.includes("#!")&&(r="#!"+r),e.href.includes("%23%21")&&(r="%23%21"+r),r=(r=(r=e.href.split("&feature=share&")[1])||e.href.split("%26feature%3Dshare%26")[1])||"",e.href.includes("&feature=share&")&&(r="?"+r),e.href.includes("%26feature%3Dshare%26")&&(r="%3F"+r),r=(r=(r=e.href.split("&h=")[1])||e.href.split("%26h%3D")[1])||"",e.href.includes("&h=")&&(r="&h="+r),e.href.includes("%26h%3D")&&(r="%26h%3D"+r),e.setAttribute("href",e.href.split(t[i])[0]+r))}})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2ca94c74fb35fa6f5e63d15da842f5b6"] === e) return;
            new MutationObserver((function() {
                var e = [ "?fbclid", "%3Ffbclid", "&fbclid", "%26fbclid", "&__tn__", "%__26tn__", "%3Futm", "?utm", "&fbc=", "%26fbc%3D", "?share=", "%3Fshare%3D", "%3F__twitter_impression%3D", "?__twitter_impression=", "?wtmc=", "%3Fwtmc%3D", "?originalReferrer=", "%3ForiginalReferrer%3D", "?wtrid=", "%3Fwtrid%3D", "?trbo=", "%3Ftrbo%3D", "?GEPC=", "%3FGEPC%3D", "?whatsapp=", "%3Fwhatsapp%3D", "?fbc=", "%3Ffbc%3D", "?dmcid=", "%3Fdmcid%3D" ];
                document.querySelectorAll('a[target="_blank"]').forEach((function(r) {
                    for (i = 0; i < e.length; i++) {
                        var t;
                        r.href.includes(e[i]) && (t = (t = (t = r.href.split("#!")[1]) || r.href.split("%23%21")[1]) || "", 
                        r.href.includes("#!") && (t = "#!" + t), r.href.includes("%23%21") && (t = "%23%21" + t), 
                        t = (t = (t = r.href.split("&feature=share&")[1]) || r.href.split("%26feature%3Dshare%26")[1]) || "", 
                        r.href.includes("&feature=share&") && (t = "?" + t), r.href.includes("%26feature%3Dshare%26") && (t = "%3F" + t), 
                        t = (t = (t = r.href.split("&h=")[1]) || r.href.split("%26h%3D")[1]) || "", r.href.includes("&h=") && (t = "&h=" + t), 
                        r.href.includes("%26h%3D") && (t = "%26h%3D" + t), r.setAttribute("href", r.href.split(e[i])[0] + t));
                    }
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "2ca94c74fb35fa6f5e63d15da842f5b6", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2ca94c74fb35fa6f5e63d15da842f5b6" due to: ' + e);
        }
    },
    'new MutationObserver(function(){var t=["&eid=","%26eid%3D","?eid=","%3Feid%3D","?__tn__=","%3F%5F%5Ftn%5F%5F%3D","&__tn__=","%26%5F%5Ftn%5F%5F%3D","?source=","%3Fsource%3D","?__xts__","%3F%5F%5Fxts%5F%5F","&__xts__","%26%5F%5Fxts%5F%5F","&amp;__xts__%5B","?ref=","%3Fref%3D","?fref=","%3Ffref%3D","?epa=","%3Fepa%3D","&ifg=","%26ifg%3D","?comment_tracking=","%3Fcomment_tracking%3D","?av=","%3Fav%3D","&av=","%26av%3D","?acontext=","%3Facontext%3D","&session_id=","%26session_id%3D","&amp;session_id=","?hc_location=","%3Fhc_location%3D","&fref=","%26fref%3D","?__cft","%3f__cft"];document.querySelectorAll(\'a:not([target="_blank"]):not([href*="2fac/"])\').forEach(function(e){for(i=0;i<t.length;i++)e.href.includes(t[i])&&e.setAttribute("href",e.href.split(t[i])[0])})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b53943d876c5b199f25b9db1658e015b === e) return;
            new MutationObserver((function() {
                var e = [ "&eid=", "%26eid%3D", "?eid=", "%3Feid%3D", "?__tn__=", "%3F%5F%5Ftn%5F%5F%3D", "&__tn__=", "%26%5F%5Ftn%5F%5F%3D", "?source=", "%3Fsource%3D", "?__xts__", "%3F%5F%5Fxts%5F%5F", "&__xts__", "%26%5F%5Fxts%5F%5F", "&amp;__xts__%5B", "?ref=", "%3Fref%3D", "?fref=", "%3Ffref%3D", "?epa=", "%3Fepa%3D", "&ifg=", "%26ifg%3D", "?comment_tracking=", "%3Fcomment_tracking%3D", "?av=", "%3Fav%3D", "&av=", "%26av%3D", "?acontext=", "%3Facontext%3D", "&session_id=", "%26session_id%3D", "&amp;session_id=", "?hc_location=", "%3Fhc_location%3D", "&fref=", "%26fref%3D", "?__cft", "%3f__cft" ];
                document.querySelectorAll('a:not([target="_blank"]):not([href*="2fac/"])').forEach((function(t) {
                    for (i = 0; i < e.length; i++) t.href.includes(e[i]) && t.setAttribute("href", t.href.split(e[i])[0]);
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
            Object.defineProperty(Window.prototype.toString, "b53943d876c5b199f25b9db1658e015b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b53943d876c5b199f25b9db1658e015b" due to: ' + e);
        }
    },
    "window.yaCounter27017517 ={ reachGoal: function() {} };": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["28268c21993e00b00d4bd15a3332c6e1"] === e) return;
            window.yaCounter27017517 = {
                reachGoal: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "28268c21993e00b00d4bd15a3332c6e1", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "28268c21993e00b00d4bd15a3332c6e1" due to: ' + e);
        }
    },
    "var _gaq = []; var _gat = { _getTracker: function() { return { _initData: function(){}, _trackPageview: function(){}, _trackEvent: function(){}, _setAllowLinker: function() {}, _setCustomVar: function() {} } }, _createTracker: function() { return this._getTracker(); }, _anonymizeIp: function() {} };": () => {
        try {
            const t = "done";
            if (Window.prototype.toString["9af1bf2ffd37b0dabb58c7227027d089"] === t) return;
            var _gaq = [], _gat = {
                _getTracker: function() {
                    return {
                        _initData: function() {},
                        _trackPageview: function() {},
                        _trackEvent: function() {},
                        _setAllowLinker: function() {},
                        _setCustomVar: function() {}
                    };
                },
                _createTracker: function() {
                    return this._getTracker();
                },
                _anonymizeIp: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "9af1bf2ffd37b0dabb58c7227027d089", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "9af1bf2ffd37b0dabb58c7227027d089" due to: ' + t);
        }
    },
    "function urchinTracker() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.aad463a3895c1cb1e7e6311e112123e8 === e) return;
            function urchinTracker() {}
            Object.defineProperty(Window.prototype.toString, "aad463a3895c1cb1e7e6311e112123e8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (r) {
            console.error('Error executing AG js rule with uniqueId "aad463a3895c1cb1e7e6311e112123e8" due to: ' + r);
        }
    },
    "window.yaCounter9890803 = { reachGoal: function() {} };": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["891411839e95d2a44430b81d04572631"] === e) return;
            window.yaCounter9890803 = {
                reachGoal: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "891411839e95d2a44430b81d04572631", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "891411839e95d2a44430b81d04572631" due to: ' + e);
        }
    },
    "window.yaCounter14913877={ reachGoal: function() {} };": () => {
        try {
            const a = "done";
            if (Window.prototype.toString["5ac1747a2f0ac39ddd8af63cfdfa1830"] === a) return;
            window.yaCounter14913877 = {
                reachGoal: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "5ac1747a2f0ac39ddd8af63cfdfa1830", {
                value: a,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (a) {
            console.error('Error executing AG js rule with uniqueId "5ac1747a2f0ac39ddd8af63cfdfa1830" due to: ' + a);
        }
    },
    "window.ga = function(){var a = arguments[5];a&&a.hitCallback&&a.hitCallback();}": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b2af76ffe41c76ed1f7a45e1ed6d7565 === e) return;
            window.ga = function() {
                var e = arguments[5];
                e && e.hitCallback && e.hitCallback();
            };
            Object.defineProperty(Window.prototype.toString, "b2af76ffe41c76ed1f7a45e1ed6d7565", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b2af76ffe41c76ed1f7a45e1ed6d7565" due to: ' + e);
        }
    },
    "window.ga = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a760a3059d00f32d9d1298bce181428e === e) return;
            window.ga = function() {};
            Object.defineProperty(Window.prototype.toString, "a760a3059d00f32d9d1298bce181428e", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a760a3059d00f32d9d1298bce181428e" due to: ' + e);
        }
    },
    "window.google_trackConversion = function() {};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["71153fe6d998e6884985cac5294b8a71"] === e) return;
            window.google_trackConversion = function() {};
            Object.defineProperty(Window.prototype.toString, "71153fe6d998e6884985cac5294b8a71", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "71153fe6d998e6884985cac5294b8a71" due to: ' + e);
        }
    },
    "(()=>{window.a2a={init(){}}})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c0325f223958d06b946b83a6dd260418 === e) return;
            window.a2a = {
                init() {}
            };
            Object.defineProperty(Window.prototype.toString, "c0325f223958d06b946b83a6dd260418", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c0325f223958d06b946b83a6dd260418" due to: ' + e);
        }
    },
    "twttr={events: { bind: function() {} }};": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["14a0dfcfc56570b45c7aa35014affd67"] === e) return;
            twttr = {
                events: {
                    bind: function() {}
                }
            };
            Object.defineProperty(Window.prototype.toString, "14a0dfcfc56570b45c7aa35014affd67", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "14a0dfcfc56570b45c7aa35014affd67" due to: ' + e);
        }
    },
    '(()=>{const t={apply:(t,e,n)=>{try{let a=n[0];if(!a||location.href.includes("youtube.com/tv")||location.href.includes("youtube.com/embed/"))return Reflect.apply(t,e,n);const o=Array.isArray(a),c=o?a[0]:a;if(c.includes(\'"contentPlaybackContext"\')||c.includes(\'"adSignalsInfo"\')){const a=JSON.parse(c);if(!a.context?.client)return Reflect.apply(t,e,n);a.playbackContext&&(a.playbackContext.adPlaybackContext={pyv:!0}),a.playerRequest&&(a.playerRequest.playbackContext.adPlaybackContext={pyv:!0});const l=JSON.stringify(a);o?n[0][0]=l:n[0]=l}}catch(t){}return Reflect.apply(t,e,n)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,t)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0744e734dd6494c69ab59ea87abf571c"] === e) return;
            (() => {
                const e = {
                    apply: (e, t, o) => {
                        try {
                            let n = o[0];
                            if (!n || location.href.includes("youtube.com/tv") || location.href.includes("youtube.com/embed/")) return Reflect.apply(e, t, o);
                            const a = Array.isArray(n), c = a ? n[0] : n;
                            if (c.includes('"contentPlaybackContext"') || c.includes('"adSignalsInfo"')) {
                                const n = JSON.parse(c);
                                if (!n.context?.client) return Reflect.apply(e, t, o);
                                n.playbackContext && (n.playbackContext.adPlaybackContext = {
                                    pyv: !0
                                }), n.playerRequest && (n.playerRequest.playbackContext.adPlaybackContext = {
                                    pyv: !0
                                });
                                const r = JSON.stringify(n);
                                a ? o[0][0] = r : o[0] = r;
                            }
                        } catch (e) {}
                        return Reflect.apply(e, t, o);
                    }
                };
                window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, e);
            })();
            Object.defineProperty(Window.prototype.toString, "0744e734dd6494c69ab59ea87abf571c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0744e734dd6494c69ab59ea87abf571c" due to: ' + e);
        }
    },
    '(()=>{const t=Function.prototype.call;let e=!1,o=!1,n=!1;const c={apply:(c,r,a)=>{const l=a[0];if(l?.requestNumber&&l?.snapshot)try{o=((t,e=5)=>{if("object"!=typeof t||null===t)return!1;const o=new Array(1e3);let c=0;const r=new WeakSet;for(o[c++]={obj:t,depth:0};c>0&&!n;){const{obj:t,depth:a}=o[--c];if(a>e||"object"!=typeof t||null===t||r.has(t))continue;let l;r.add(t);try{l=Object.hasOwn(t,"backoffTimeMs")}catch(t){}if(l)return void 0!==t.backoffTimeMs||(n=!0,!1);for(const e in t)if(Object.hasOwn(t,e)){let n;try{n=t[e]}catch(t){}null!==n&&"object"==typeof n&&!r.has(n)&&c<o.length&&(o[c++]={obj:n,depth:a+1})}}return!1})(l),e=!0,(o||n)&&(Function.prototype.call=t)}catch(t){}return Reflect.apply(c,r,a)}};window.Function.prototype.call=new Proxy(window.Function.prototype.call,c);window.addEventListener("load",(async()=>{if(Function.prototype.call=t,!o&&e)return;const n=window.location.search,c=new URLSearchParams(n).get("v");if(!c)return;const r=await(a="#movie_player",l=200,i=1e4,new Promise((t=>{if(!a||!l||!i)return void t(null);const e=Date.now()+i,o=()=>{const n=document.querySelector(a);n?t(n):Date.now()>e?t(null):setTimeout(o,l)};o()})));var a,l,i;if(!r)return;const s=new URLSearchParams(n).get("t")??"0",u=parseInt(s,10);if("function"==typeof r.loadVideoById)try{r.loadVideoById(c,u)}catch(t){}}))})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0ec54e33a67947118e2943fefd47d510"] === e) return;
            (() => {
                const e = Function.prototype.call;
                let t = !1, o = !1, n = !1;
                const r = {
                    apply: (r, c, a) => {
                        const i = a[0];
                        if (i?.requestNumber && i?.snapshot) try {
                            o = ((e, t = 5) => {
                                if ("object" != typeof e || null === e) return !1;
                                const o = new Array(1e3);
                                let r = 0;
                                const c = new WeakSet;
                                for (o[r++] = {
                                    obj: e,
                                    depth: 0
                                }; r > 0 && !n; ) {
                                    const {obj: a, depth: i} = o[--r];
                                    if (i > t || "object" != typeof a || null === a || c.has(a)) continue;
                                    let l;
                                    c.add(a);
                                    try {
                                        l = Object.hasOwn(a, "backoffTimeMs");
                                    } catch (e) {}
                                    if (l) return void 0 !== a.backoffTimeMs || (n = !0, !1);
                                    for (const t in a) if (Object.hasOwn(a, t)) {
                                        let n;
                                        try {
                                            n = a[t];
                                        } catch (e) {}
                                        null !== n && "object" == typeof n && !c.has(n) && r < o.length && (o[r++] = {
                                            obj: n,
                                            depth: i + 1
                                        });
                                    }
                                }
                                return !1;
                            })(i), t = !0, (o || n) && (Function.prototype.call = e);
                        } catch (e) {}
                        return Reflect.apply(r, c, a);
                    }
                };
                window.Function.prototype.call = new Proxy(window.Function.prototype.call, r);
                window.addEventListener("load", (async () => {
                    if (Function.prototype.call = e, !o && t) return;
                    const n = window.location.search, r = new URLSearchParams(n).get("v");
                    if (!r) return;
                    const c = await (a = "#movie_player", new Promise((e => {
                        0;
                        const t = Date.now() + 1e4, o = () => {
                            const n = document.querySelector(a);
                            n ? e(n) : Date.now() > t ? e(null) : setTimeout(o, 200);
                        };
                        o();
                    })));
                    var a;
                    if (!c) return;
                    const i = new URLSearchParams(n).get("t") ?? "0", l = parseInt(i, 10);
                    if ("function" == typeof c.loadVideoById) try {
                        c.loadVideoById(r, l);
                    } catch (e) {}
                }));
            })();
            Object.defineProperty(Window.prototype.toString, "0ec54e33a67947118e2943fefd47d510", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0ec54e33a67947118e2943fefd47d510" due to: ' + e);
        }
    },
    "!function(){window.somtag={cmd:function(){}};}();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["54ae50f5a5c3a82be06ee24cd3c05183"] === e) return;
            window.somtag = {
                cmd: function() {}
            };
            Object.defineProperty(Window.prototype.toString, "54ae50f5a5c3a82be06ee24cd3c05183", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "54ae50f5a5c3a82be06ee24cd3c05183" due to: ' + e);
        }
    },
    "window.werbeblocker = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["0f7c5eb1cea174c4baeb46ecd074e090"] === e) return;
            window.werbeblocker = !0;
            Object.defineProperty(Window.prototype.toString, "0f7c5eb1cea174c4baeb46ecd074e090", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "0f7c5eb1cea174c4baeb46ecd074e090" due to: ' + e);
        }
    },
    "adet = false;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a44a6107aec5ff60e35ccabb1052df4d === e) return;
            adet = !1;
            Object.defineProperty(Window.prototype.toString, "a44a6107aec5ff60e35ccabb1052df4d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a44a6107aec5ff60e35ccabb1052df4d" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{"function"==typeof initPage&&initPage()}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["094835ecb49c317258d87cdb8826694a"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                "function" == typeof initPage && initPage();
            }));
            Object.defineProperty(Window.prototype.toString, "094835ecb49c317258d87cdb8826694a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "094835ecb49c317258d87cdb8826694a" due to: ' + e);
        }
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e=".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cf91ecb912e2bbad7423b9f79d6847f3 === e) return;
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, {
                apply: (e, t, n) => {
                    const o = Reflect.apply(e, t, n), r = ".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";
                    if ("adoptedStyleSheets" in document) {
                        const e = new CSSStyleSheet;
                        e.replaceSync(r), o.adoptedStyleSheets = [ e ];
                    } else {
                        const e = document.createElement("style");
                        e.innerText = r, o.appendChild(e);
                    }
                    return o;
                }
            });
            Object.defineProperty(Window.prototype.toString, "cf91ecb912e2bbad7423b9f79d6847f3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cf91ecb912e2bbad7423b9f79d6847f3" due to: ' + e);
        }
    },
    "(()=>{const t={construct:(t,n,e)=>{const o=n[0],r=o?.toString();return r&&r.length>500&&r.length<1e3&&/=>[\\s\\S]*?for[\\s\\S]*?\\[.+\\]/.test(r)&&(n[0]=()=>{}),Reflect.construct(t,n,e)}};window.MutationObserver=new Proxy(window.MutationObserver,t)})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c7d43d7f4bded61bedc6218a5f6b0727 === e) return;
            (() => {
                const e = {
                    construct: (e, t, r) => {
                        const o = t[0], n = o?.toString();
                        return n && n.length > 500 && n.length < 1e3 && /=>[\s\S]*?for[\s\S]*?\[.+\]/.test(n) && (t[0] = () => {}), 
                        Reflect.construct(e, t, r);
                    }
                };
                window.MutationObserver = new Proxy(window.MutationObserver, e);
            })();
            Object.defineProperty(Window.prototype.toString, "c7d43d7f4bded61bedc6218a5f6b0727", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c7d43d7f4bded61bedc6218a5f6b0727" due to: ' + e);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{const o=[];[...document.scripts].forEach((c=>{const n=c.innerText,t=/window\\..*\\[\"(.*)\"]/;if(n.includes('\"impr\":')){const c=n.match(t)[1];o.push(c)}})),o.forEach((o=>{const c=document.querySelector(`.${o}`);c&&c.remove()}))})})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["457e0165e3e3728dbee48f0406d58268"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                const e = [];
                [ ...document.scripts ].forEach((t => {
                    const o = t.innerText, n = /window\..*\["(.*)"]/;
                    if (o.includes('"impr":')) {
                        const t = o.match(n)[1];
                        e.push(t);
                    }
                })), e.forEach((e => {
                    const t = document.querySelector(`.${e}`);
                    t && t.remove();
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "457e0165e3e3728dbee48f0406d58268", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "457e0165e3e3728dbee48f0406d58268" due to: ' + e);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,{apply:(a,b,c)=>{const d=b.urlCalled;return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):d.match(/\\.damoh\\./)?void 0:Reflect.apply(a,b,c)}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cc36ce7238df0916503c980264bdfe26 === e) return;
            window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, {
                apply: (e, t, o) => {
                    const r = t.urlCalled;
                    return "string" != typeof r || 0 === r.length ? Reflect.apply(e, t, o) : r.match(/\.damoh\./) ? void 0 : Reflect.apply(e, t, o);
                }
            });
            Object.defineProperty(Window.prototype.toString, "cc36ce7238df0916503c980264bdfe26", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cc36ce7238df0916503c980264bdfe26" due to: ' + e);
        }
    },
    '!function(){var n={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(n,t){if("function"==typeof t)try{1===t.length&&t({preroll:"moviepilot"})}catch(t){}},setConfig:function(){},loadPositions:function(){},displayPositions:function(){}}};n.cmd.push=function(n){let t=function(){try{"function"==typeof n&&n()}catch(n){}};"complete"===document.readyState?t():window.addEventListener("load",(()=>{t()}))},window.jad=n}();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString.f1c7875f7971c5540a49992dc8a2bd9e === t) return;
            !function() {
                var t = {
                    cmd: [],
                    public: {
                        getVideoAdUrl: function() {},
                        createNewPosition: function() {},
                        refreshAds: function() {},
                        setTargetingOnPosition: function() {},
                        getDailymotionAdsParamsForScript: function(t, o) {
                            if ("function" == typeof o) try {
                                1 === o.length && o({
                                    preroll: "moviepilot"
                                });
                            } catch (o) {}
                        },
                        setConfig: function() {},
                        loadPositions: function() {},
                        displayPositions: function() {}
                    }
                };
                t.cmd.push = function(t) {
                    let o = function() {
                        try {
                            "function" == typeof t && t();
                        } catch (t) {}
                    };
                    "complete" === document.readyState ? o() : window.addEventListener("load", (() => {
                        o();
                    }));
                }, window.jad = t;
            }();
            Object.defineProperty(Window.prototype.toString, "f1c7875f7971c5540a49992dc8a2bd9e", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "f1c7875f7971c5540a49992dc8a2bd9e" due to: ' + t);
        }
    },
    'var st = ".sidebar > div.widget-container:first-of-type, .sidebar > a[href^=\\"http://future-sale-system.de\\"], #messageList > li.message:not([id]), .sidebar > a[target=\\"_blank\\"] > img {display: none!important; }", a=document.createElement("style");a.type="text/css";a.styleSheet?a.styleSheet.cssText=st:a.innerHTML=st;document.getElementsByTagName("head")[0].appendChild(a);': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d5fec51f23abfe393fc62b4a6d96a44b === e) return;
            var st = '.sidebar > div.widget-container:first-of-type, .sidebar > a[href^="http://future-sale-system.de"], #messageList > li.message:not([id]), .sidebar > a[target="_blank"] > img {display: none!important; }', a = document.createElement("style");
            a.type = "text/css";
            a.styleSheet ? a.styleSheet.cssText = st : a.innerHTML = st;
            document.getElementsByTagName("head")[0].appendChild(a);
            Object.defineProperty(Window.prototype.toString, "d5fec51f23abfe393fc62b4a6d96a44b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d5fec51f23abfe393fc62b4a6d96a44b" due to: ' + e);
        }
    },
    "window.disablePopUnder = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b80435e9460675a80ec183f27eb50cbf === e) return;
            window.disablePopUnder = !0;
            Object.defineProperty(Window.prototype.toString, "b80435e9460675a80ec183f27eb50cbf", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b80435e9460675a80ec183f27eb50cbf" due to: ' + e);
        }
    },
    "var originalUserAgent = navigator.userAgent; Object.defineProperty(navigator, 'userAgent', { get: function() { return originalUserAgent + ' Edge'; } });": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c3123d07eda7051ae1561c7613cf6cd8 === e) return;
            var originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, "userAgent", {
                get: function() {
                    return originalUserAgent + " Edge";
                }
            });
            Object.defineProperty(Window.prototype.toString, "c3123d07eda7051ae1561c7613cf6cd8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c3123d07eda7051ae1561c7613cf6cd8" due to: ' + e);
        }
    },
    '(()=>{let e=[];document.addEventListener("DOMContentLoaded",(()=>{const t=document.querySelector("body script").textContent.match(/"] = \'(.*?)\'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*\'(.*?)\'/,"$1");e.push(r)}));const r=document.querySelector(\'.dl_button[href*="preview"]\').href.split("?")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(".dl_button[href]").forEach((t=>{let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.dd2ab3ea1b069f5b262d0c2924b695ca === e) return;
            (() => {
                let e = [];
                document.addEventListener("DOMContentLoaded", (() => {
                    const t = document.querySelector("body script").textContent.match(/"] = '(.*?)'/g);
                    if (!t) return;
                    t.forEach((t => {
                        const r = t.replace(/.*'(.*?)'/, "$1");
                        e.push(r);
                    }));
                    const r = document.querySelector('.dl_button[href*="preview"]').href.split("?")[1];
                    e.includes(r) && (e = e.filter((e => e !== r)));
                    document.querySelectorAll(".dl_button[href]").forEach((t => {
                        let r = t.cloneNode(!0);
                        r.href = t.href.replace(/\?.*/, `?${e[0]}`), t.after(r);
                        let o = t.cloneNode(!0);
                        o.href = t.href.replace(/\?.*/, `?${e[1]}`), t.after(o);
                    }));
                }));
            })();
            Object.defineProperty(Window.prototype.toString, "dd2ab3ea1b069f5b262d0c2924b695ca", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "dd2ab3ea1b069f5b262d0c2924b695ca" due to: ' + e);
        }
    },
    '!function(){const o={apply:(o,n,r)=>(new Error).stack.includes("refreshad")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.aac06a0fe043d0b0021afeae4330a5d5 === e) return;
            !function() {
                const e = {
                    apply: (e, a, o) => (new Error).stack.includes("refreshad") ? 0 : Reflect.apply(e, a, o)
                };
                window.Math.floor = new Proxy(window.Math.floor, e);
            }();
            Object.defineProperty(Window.prototype.toString, "aac06a0fe043d0b0021afeae4330a5d5", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "aac06a0fe043d0b0021afeae4330a5d5" due to: ' + e);
        }
    },
    '(function(){const a=Function.prototype.toString;window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,{apply:(b,c,d)=>{const e=d[1],f=/detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;return e&&"function"==typeof e&&(f.test(a.call(e))||f.test(e.toString()))&&(d[1]=function(){}),Reflect.apply(b,c,d)}});Function.prototype.bind=new Proxy(Function.prototype.bind,{apply:(b,c,d)=>{const e=a.call(c),f=Reflect.apply(b,c,d);return f.toString=function(){return e},f}})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e33ef1a5a53f3c2f5bbed2ef8c665146 === e) return;
            !function() {
                const e = Function.prototype.toString;
                window.EventTarget.prototype.addEventListener = new Proxy(window.EventTarget.prototype.addEventListener, {
                    apply: (t, n, o) => {
                        const r = o[1], c = /detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;
                        return r && "function" == typeof r && (c.test(e.call(r)) || c.test(r.toString())) && (o[1] = function() {}), 
                        Reflect.apply(t, n, o);
                    }
                });
                Function.prototype.bind = new Proxy(Function.prototype.bind, {
                    apply: (t, n, o) => {
                        const r = e.call(n), c = Reflect.apply(t, n, o);
                        return c.toString = function() {
                            return r;
                        }, c;
                    }
                });
            }();
            Object.defineProperty(Window.prototype.toString, "e33ef1a5a53f3c2f5bbed2ef8c665146", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e33ef1a5a53f3c2f5bbed2ef8c665146" due to: ' + e);
        }
    },
    '!function(){var t={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(t,n){if("function"==typeof n)try{if(1===n.length){const o=t[0];n({[o]:o})}}catch(n){console.debug(n)}}}};t.cmd.push=function(t){let n=function(){try{"function"==typeof t&&t()}catch(t){}};"complete"===document.readyState?n():window.addEventListener("load",(()=>{n()}))},window.jad=t}();': () => {
        try {
            const t = "done";
            if (Window.prototype.toString["4b02efce565c43abd97593b12856ccd8"] === t) return;
            !function() {
                var t = {
                    cmd: [],
                    public: {
                        getVideoAdUrl: function() {},
                        createNewPosition: function() {},
                        refreshAds: function() {},
                        setTargetingOnPosition: function() {},
                        getDailymotionAdsParamsForScript: function(t, e) {
                            if ("function" == typeof e) try {
                                if (1 === e.length) {
                                    const n = t[0];
                                    e({
                                        [n]: n
                                    });
                                }
                            } catch (e) {
                                console.debug(e);
                            }
                        }
                    }
                };
                t.cmd.push = function(t) {
                    let e = function() {
                        try {
                            "function" == typeof t && t();
                        } catch (t) {}
                    };
                    "complete" === document.readyState ? e() : window.addEventListener("load", (() => {
                        e();
                    }));
                }, window.jad = t;
            }();
            Object.defineProperty(Window.prototype.toString, "4b02efce565c43abd97593b12856ccd8", {
                value: t,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (t) {
            console.error('Error executing AG js rule with uniqueId "4b02efce565c43abd97593b12856ccd8" due to: ' + t);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/s.php?i="))try{for(var a=location.href.split("/s.php?i=")[1],c=0;10>c;c++){a=atob(a);try{new URL(a);var d=!0}catch(b){d=!1}if(d)try{a=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});a=decodeURIComponent(a);window.location=a;break}catch(b){}}}catch(b){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["2df496ddbea99bcffb94b9b433cac64d"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/s.php?i=")) try {
                    for (var e = location.href.split("/s.php?i=")[1], o = 0; 10 > o; o++) {
                        e = atob(e);
                        try {
                            new URL(e);
                            var r = !0;
                        } catch (e) {
                            r = !1;
                        }
                        if (r) try {
                            e = e.replace(/[a-zA-Z]/g, (function(e) {
                                return String.fromCharCode(("Z" >= e ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26);
                            }));
                            e = decodeURIComponent(e);
                            window.location = e;
                            break;
                        } catch (e) {}
                    }
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "2df496ddbea99bcffb94b9b433cac64d", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "2df496ddbea99bcffb94b9b433cac64d" due to: ' + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/#aHR0c")){var a=location.href.split("/#");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8b3aa220c71f03621cb9cd086eb59619"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/#aHR0c")) {
                    var e = location.href.split("/#");
                    if (e && e[1]) try {
                        window.location = atob(e[1]);
                    } catch (e) {}
                }
            }();
            Object.defineProperty(Window.prototype.toString, "8b3aa220c71f03621cb9cd086eb59619", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8b3aa220c71f03621cb9cd086eb59619" due to: ' + e);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/pagead2\\.googlesyndication\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b56615f06c5a4f3d6dbd34cd41a23997 === e) return;
            !function() {
                var e = XMLHttpRequest.prototype.open, t = /pagead2\.googlesyndication\.com/i;
                XMLHttpRequest.prototype.open = function(o, n) {
                    if ("GET" !== o || !t.test(n)) return e.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", n);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "b56615f06c5a4f3d6dbd34cd41a23997", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b56615f06c5a4f3d6dbd34cd41a23997" due to: ' + e);
        }
    },
    '(()=>{let e="";const t={adsbygoogle:{url:"//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",value:"google_plmetrics"},outbrain:{url:"//widgets.outbrain.com/outbrain.js",value:"outbrain"},cdnpcStyleMin:{url:"//s4.cdnpc.net/front/css/style.min.css",value:"slider--features"},cdnpcMain:{url:"//s4.cdnpc.net/vite-bundle/main.css",value:"data-v-d23a26c8"},taboola:{url:"//cdn.taboola.com/libtrc/san1go-network/loader.js",value:"feOffset"}},n=n=>{try{const o=n;if(!o.responseText){const n=(e=>{const n=Object.values(t).find((t=>e.includes(t.url)));return n?n.value:""})(e);Object.defineProperty(o,"responseText",{value:n})}"function"==typeof o.onload&&o.onload(),"function"==typeof o.onreadystatechange&&(Object.defineProperty(o,"status",{value:200}),Object.defineProperty(o,"readyState",{value:4}),o.onreadystatechange())}catch(e){console.trace(e)}},o={apply:(n,o,a)=>{const r=a[1];return r&&(e=>Object.values(t).some((t=>e.includes(t.url))))(r)&&(o.prevent=!0,e=r),Reflect.apply(n,o,a)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,o);const a={apply:async(t,o,a)=>{if(!o.prevent)return Reflect.apply(t,o,a);try{const t=await fetch(e);if((await t.text()).length<2e3)return n(o)}catch(e){return console.trace(e),n(o)}return Reflect.apply(t,o,a)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,a)})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["999651d762087524799a382abaeba96f"] === e) return;
            (() => {
                let e = "";
                const t = {
                    adsbygoogle: {
                        url: "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
                        value: "google_plmetrics"
                    },
                    outbrain: {
                        url: "//widgets.outbrain.com/outbrain.js",
                        value: "outbrain"
                    },
                    cdnpcStyleMin: {
                        url: "//s4.cdnpc.net/front/css/style.min.css",
                        value: "slider--features"
                    },
                    cdnpcMain: {
                        url: "//s4.cdnpc.net/vite-bundle/main.css",
                        value: "data-v-d23a26c8"
                    },
                    taboola: {
                        url: "//cdn.taboola.com/libtrc/san1go-network/loader.js",
                        value: "feOffset"
                    }
                }, o = o => {
                    try {
                        const n = o;
                        if (!n.responseText) {
                            const o = (e => {
                                const o = Object.values(t).find((t => e.includes(t.url)));
                                return o ? o.value : "";
                            })(e);
                            Object.defineProperty(n, "responseText", {
                                value: o
                            });
                        }
                        "function" == typeof n.onload && n.onload(), "function" == typeof n.onreadystatechange && (Object.defineProperty(n, "status", {
                            value: 200
                        }), Object.defineProperty(n, "readyState", {
                            value: 4
                        }), n.onreadystatechange());
                    } catch (e) {
                        console.trace(e);
                    }
                }, n = {
                    apply: (o, n, a) => {
                        const r = a[1];
                        return r && (e => Object.values(t).some((t => e.includes(t.url))))(r) && (n.prevent = !0, 
                        e = r), Reflect.apply(o, n, a);
                    }
                };
                window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, n);
                const a = {
                    apply: async (t, n, a) => {
                        if (!n.prevent) return Reflect.apply(t, n, a);
                        try {
                            const t = await fetch(e);
                            if ((await t.text()).length < 2e3) return o(n);
                        } catch (e) {
                            return console.trace(e), o(n);
                        }
                        return Reflect.apply(t, n, a);
                    }
                };
                window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, a);
            })();
            Object.defineProperty(Window.prototype.toString, "999651d762087524799a382abaeba96f", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "999651d762087524799a382abaeba96f" due to: ' + e);
        }
    },
    "window.loadingAds = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["92cb1336a3ae04946fb7472ef921e5a2"] === e) return;
            window.loadingAds = !0;
            Object.defineProperty(Window.prototype.toString, "92cb1336a3ae04946fb7472ef921e5a2", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "92cb1336a3ae04946fb7472ef921e5a2" due to: ' + e);
        }
    },
    "window.N3CanRunAds = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.bf2528e3820489391dd14ff4e676bf77 === e) return;
            window.N3CanRunAds = !0;
            Object.defineProperty(Window.prototype.toString, "bf2528e3820489391dd14ff4e676bf77", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "bf2528e3820489391dd14ff4e676bf77" due to: ' + e);
        }
    },
    "window.UFads = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6f1638cef962ca7bcf9ae1cd4762f141"] === e) return;
            window.UFads = !0;
            Object.defineProperty(Window.prototype.toString, "6f1638cef962ca7bcf9ae1cd4762f141", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6f1638cef962ca7bcf9ae1cd4762f141" due to: ' + e);
        }
    },
    "window.pr_okvalida=true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9cea5435efc0d37e874e0db2f82cafe5"] === e) return;
            window.pr_okvalida = !0;
            Object.defineProperty(Window.prototype.toString, "9cea5435efc0d37e874e0db2f82cafe5", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9cea5435efc0d37e874e0db2f82cafe5" due to: ' + e);
        }
    },
    "window.pr_okAd = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a20a9b76443176de1d59662b7bec69ac === e) return;
            window.pr_okAd = !0;
            Object.defineProperty(Window.prototype.toString, "a20a9b76443176de1d59662b7bec69ac", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a20a9b76443176de1d59662b7bec69ac" due to: ' + e);
        }
    },
    "window.adblockDetecter = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["077ad96f9724037e5e50572b0e1dad20"] === e) return;
            window.adblockDetecter = !0;
            Object.defineProperty(Window.prototype.toString, "077ad96f9724037e5e50572b0e1dad20", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "077ad96f9724037e5e50572b0e1dad20" due to: ' + e);
        }
    },
    "window.isAdsDisplayed = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6fdd528c721ed150a4988b0a7c6d81fb"] === e) return;
            window.isAdsDisplayed = !0;
            Object.defineProperty(Window.prototype.toString, "6fdd528c721ed150a4988b0a7c6d81fb", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6fdd528c721ed150a4988b0a7c6d81fb" due to: ' + e);
        }
    },
    "window.pr_okvalida = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["61d8c36d64bce12eddcaa6d5227fb569"] === e) return;
            window.pr_okvalida = !0;
            Object.defineProperty(Window.prototype.toString, "61d8c36d64bce12eddcaa6d5227fb569", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "61d8c36d64bce12eddcaa6d5227fb569" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{try{let t;"function"==typeof decode_link&&"string"==typeof link_out&&(t=decode_link(atob(link_out)),location.assign(t)),"string"==typeof api_key&&(document.cookie=`${api_key}=Wn275; path=/`);const e=document.querySelector("* > .button#contador");e&&t&&setTimeout((()=>{const o=e.cloneNode(!0);e.parentNode.replaceChild(o,e),o.addEventListener("click",(function(){location.assign(t)}),!1)}),500)}catch(t){}}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["90c94b5e54df0c8bc3584e6dd04ae87a"] === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                try {
                    let e;
                    "function" == typeof decode_link && "string" == typeof link_out && (e = decode_link(atob(link_out)), 
                    location.assign(e)), "string" == typeof api_key && (document.cookie = `${api_key}=Wn275; path=/`);
                    const t = document.querySelector("* > .button#contador");
                    t && e && setTimeout((() => {
                        const o = t.cloneNode(!0);
                        t.parentNode.replaceChild(o, t), o.addEventListener("click", (function() {
                            location.assign(e);
                        }), !1);
                    }), 500);
                } catch (e) {}
            }));
            Object.defineProperty(Window.prototype.toString, "90c94b5e54df0c8bc3584e6dd04ae87a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "90c94b5e54df0c8bc3584e6dd04ae87a" due to: ' + e);
        }
    },
    '(()=>{window.addEventListener("load",(()=>{document.querySelectorAll(\'.count > li > a[href*="/#!"]\').forEach((t=>{const e=(t=>{let e=t;for(let t=0;t<10;t++)try{e=atob(e)}catch(t){break}return decodeURIComponent(e)})(t.href.split("/#!")[1]);(t=>{let e=t;try{e=new URL(t)}catch(t){return!1}return"http:"===e.protocol||"https:"===e.protocol})(e)&&t.setAttribute("href",e)}))}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["96e43c3e77d12216cc72163eb5a036f3"] === e) return;
            window.addEventListener("load", (() => {
                document.querySelectorAll('.count > li > a[href*="/#!"]').forEach((e => {
                    const t = (e => {
                        let t = e;
                        for (let r = 0; r < 10; r++) try {
                            t = atob(t);
                        } catch (e) {
                            break;
                        }
                        return decodeURIComponent(t);
                    })(e.href.split("/#!")[1]);
                    (e => {
                        let t = e;
                        try {
                            t = new URL(e);
                        } catch (e) {
                            return !1;
                        }
                        return "http:" === t.protocol || "https:" === t.protocol;
                    })(t) && e.setAttribute("href", t);
                }));
            }));
            Object.defineProperty(Window.prototype.toString, "96e43c3e77d12216cc72163eb5a036f3", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "96e43c3e77d12216cc72163eb5a036f3" due to: ' + e);
        }
    },
    '!function(){if(window.location.href.includes(".php?")&&window.location.href.includes("=")){const o=location.href.split("=");if(o&&o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){const n=decodeURIComponent(t);let c=!1;try{new URL(n),c=!0}catch(o){c=!1}if(c){location.assign(n);break}}}}}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.aed92a9e5fa43ee06d13ea0740f42251 === e) return;
            !function() {
                if (window.location.href.includes(".php?") && window.location.href.includes("=")) {
                    const e = location.href.split("=");
                    if (e && e[1]) {
                        let o = e[1];
                        for (let e = 0; e < 10; e++) try {
                            o = atob(o);
                        } catch (e) {
                            const t = decodeURIComponent(o);
                            let n = !1;
                            try {
                                new URL(t), n = !0;
                            } catch (e) {
                                n = !1;
                            }
                            if (n) {
                                location.assign(t);
                                break;
                            }
                        }
                    }
                }
            }();
            Object.defineProperty(Window.prototype.toString, "aed92a9e5fa43ee06d13ea0740f42251", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "aed92a9e5fa43ee06d13ea0740f42251" due to: ' + e);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);g=g.split("&url=")[1];try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.e461bea6c1765b5004b1bdf45a657484 === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/#")) {
                    var e = location.href.split("/#");
                    if (e && e[1]) {
                        e = e[1];
                        for (var o = 0; 10 > o; o++) try {
                            e = atob(e);
                        } catch (o) {
                            var r = decodeURIComponent(e);
                            r = r.split("&url=")[1];
                            try {
                                new URL(r);
                                var t = !0;
                            } catch (e) {
                                t = !1;
                            }
                            if (t) {
                                location.assign(r);
                                break;
                            }
                        }
                    }
                }
            }();
            Object.defineProperty(Window.prototype.toString, "e461bea6c1765b5004b1bdf45a657484", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "e461bea6c1765b5004b1bdf45a657484" due to: ' + e);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["9b5e9479cf0e6f4ce35ed63d4353bab4"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/#")) {
                    var e = location.href.split("/#");
                    if (e && e[1]) {
                        e = e[1];
                        for (var o = 0; 10 > o; o++) try {
                            e = atob(e);
                        } catch (o) {
                            var r = decodeURIComponent(e);
                            try {
                                new URL(r);
                                var t = !0;
                            } catch (e) {
                                t = !1;
                            }
                            if (t) {
                                location.assign(r);
                                break;
                            }
                        }
                    }
                }
            }();
            Object.defineProperty(Window.prototype.toString, "9b5e9479cf0e6f4ce35ed63d4353bab4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "9b5e9479cf0e6f4ce35ed63d4353bab4" due to: ' + e);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#!")){var b=location.href.split("/#!");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["06564135eca95acc020e6910b740c355"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("/#!")) {
                    var e = location.href.split("/#!");
                    if (e && e[1]) {
                        e = e[1];
                        for (var o = 0; 10 > o; o++) try {
                            e = atob(e);
                        } catch (o) {
                            var r = decodeURIComponent(e);
                            try {
                                new URL(r);
                                var t = !0;
                            } catch (e) {
                                t = !1;
                            }
                            if (t) {
                                location.assign(r);
                                break;
                            }
                        }
                    }
                }
            }();
            Object.defineProperty(Window.prototype.toString, "06564135eca95acc020e6910b740c355", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "06564135eca95acc020e6910b740c355" due to: ' + e);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("o.php?l=")){var b=location.href.split("o.php?l=");if(b&&b[1]){b=b[1].replace(/\\|\\d/,\'\');for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["7236b4fca7e3b34846de4af64f512064"] === e) return;
            !function() {
                if (-1 < window.location.href.indexOf("o.php?l=")) {
                    var e = location.href.split("o.php?l=");
                    if (e && e[1]) {
                        e = e[1].replace(/\|\d/, "");
                        for (var o = 0; 10 > o; o++) try {
                            e = atob(e);
                        } catch (o) {
                            var r = decodeURIComponent(e);
                            try {
                                new URL(r);
                                var t = !0;
                            } catch (e) {
                                t = !1;
                            }
                            if (t) {
                                location.assign(r);
                                break;
                            }
                        }
                    }
                }
            }();
            Object.defineProperty(Window.prototype.toString, "7236b4fca7e3b34846de4af64f512064", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "7236b4fca7e3b34846de4af64f512064" due to: ' + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{try{"function"==typeof window.noobBypass&&noobBypass()}catch(b){}}));})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.cf094940c140bb6a8015c9e1f15490f1 === e) return;
            document.addEventListener("DOMContentLoaded", (() => {
                try {
                    "function" == typeof window.noobBypass && noobBypass();
                } catch (e) {}
            }));
            Object.defineProperty(Window.prototype.toString, "cf094940c140bb6a8015c9e1f15490f1", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "cf094940c140bb6a8015c9e1f15490f1" due to: ' + e);
        }
    },
    '!function(){const e=e=>{const t=document.querySelector(".down-button");if(t&&t.textContent.includes("Continuar al enlace"))return;const o=new XMLHttpRequest;o.open("POST","/check.php",!0),o.setRequestHeader("Content-type","application/x-www-form-urlencoded"),o.send("a");const n=atob(window.ext_site).replace(/[a-z]/gi,(e=>String.fromCharCode(e.charCodeAt(0)+(e.toLowerCase()<="m"?13:-13))));let i=e.replaceAll(\'\\\\"\',\'"\');i=i.replace("\'+ api_key+ \'",window.api_key),i=i.replace("\'+ link_out+ \\"",window.link_out),i=i.replace(/action="\'\\+ .*?\\+ \'"/,`action="${n}"`);var a;const r=(a=i,(new DOMParser).parseFromString(a,"text/html")).querySelector("form"),c=new FormData(r),w=new XMLHttpRequest;w.open("POST",n,!0),w.send(c),window.tab2=window,postMessage("_clicked_b",location.origin)},t={apply:(t,o,n)=>{if(n[1]&&n[1].includes("api_key")){const t=window.link_out,o=window.api_key,i=n[1].match(/<form target=[\\s\\S]*?<\\/form>/)[0];if(n[1]=n[1].replace(/(setTimeout\\(function\\(\\)\\{)window\\[.\\[.\\]\\]\\[.\\[.*?\\]\\]= .*?(\\},3000)/,"$1$2"),n[1]=n[1].replace(/(window\\[).\\[\\d+\\](\\]\\(.\\(atob\\(main_site)/,\'$1"location"]["assign"$2\'),t&&o&&i)try{"loading"===document.readyState?window.addEventListener("load",(()=>{e(i)}),{once:!0}):e(i)}catch(e){console.debug(e)}}return Reflect.apply(t,o,n)}};window.Function.prototype.constructor=new Proxy(window.Function.prototype.constructor,t)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.ca77be71e26513295ae5e7edf2a6fb1a === e) return;
            !function() {
                const e = e => {
                    const t = document.querySelector(".down-button");
                    if (t && t.textContent.includes("Continuar al enlace")) return;
                    const o = new XMLHttpRequest;
                    o.open("POST", "/check.php", !0), o.setRequestHeader("Content-type", "application/x-www-form-urlencoded"), 
                    o.send("a");
                    const n = atob(window.ext_site).replace(/[a-z]/gi, (e => String.fromCharCode(e.charCodeAt(0) + (e.toLowerCase() <= "m" ? 13 : -13))));
                    let r = e.replaceAll('\\"', '"');
                    r = r.replace("'+ api_key+ '", window.api_key), r = r.replace("'+ link_out+ \"", window.link_out), 
                    r = r.replace(/action="'\+ .*?\+ '"/, `action="${n}"`);
                    var a;
                    const i = (a = r, (new DOMParser).parseFromString(a, "text/html")).querySelector("form"), c = new FormData(i), d = new XMLHttpRequest;
                    d.open("POST", n, !0), d.send(c), window.tab2 = window, postMessage("_clicked_b", location.origin);
                }, t = {
                    apply: (t, o, n) => {
                        if (n[1] && n[1].includes("api_key")) {
                            const t = window.link_out, o = window.api_key, r = n[1].match(/<form target=[\s\S]*?<\/form>/)[0];
                            if (n[1] = n[1].replace(/(setTimeout\(function\(\)\{)window\[.\[.\]\]\[.\[.*?\]\]= .*?(\},3000)/, "$1$2"), 
                            n[1] = n[1].replace(/(window\[).\[\d+\](\]\(.\(atob\(main_site)/, '$1"location"]["assign"$2'), 
                            t && o && r) try {
                                "loading" === document.readyState ? window.addEventListener("load", (() => {
                                    e(r);
                                }), {
                                    once: !0
                                }) : e(r);
                            } catch (e) {
                                console.debug(e);
                            }
                        }
                        return Reflect.apply(t, o, n);
                    }
                };
                window.Function.prototype.constructor = new Proxy(window.Function.prototype.constructor, t);
            }();
            Object.defineProperty(Window.prototype.toString, "ca77be71e26513295ae5e7edf2a6fb1a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "ca77be71e26513295ae5e7edf2a6fb1a" due to: ' + e);
        }
    },
    '!function(){const e=e=>{const o=new XMLHttpRequest;o.open("POST","/check.php",!0),o.setRequestHeader("Content-type","application/x-www-form-urlencoded"),o.send("a");const t=atob(window.ext_site).replace(/[a-z]/gi,(e=>String.fromCharCode(e.charCodeAt(0)+(e.toLowerCase()<="m"?13:-13))));let n=e.replaceAll(\'\\\\"\',\'"\');n=n.replace("\'+ api_key+ \'",window.api_key),n=n.replace("\'+ link_out+ \\"",window.link_out),n=n.replace(/action="\'\\+ .*?\\+ \'"/,`action="${t}"`);var a;const i=(a=n,(new DOMParser).parseFromString(a,"text/html")).querySelector("form"),r=new FormData(i),c=new XMLHttpRequest;c.open("POST",t,!0),c.send(r),window.tab2=window,postMessage("_clicked_b",location.origin)},o={apply:(o,t,n)=>{if(n[1]&&n[1].includes("api_key")){const o=window.link_out,t=window.api_key,a=n[1].match(/window\\.open\\(.*?\\(atob\\(main_site\\)\\).*?("\\/.*\\.php\\?.*=").*?("&.*?=").*?(api_key),"view"/),i=a[1].replaceAll(\'"\',""),r=a[2].replaceAll(\'"\',""),c=n[1].match(/<form target=[\\s\\S]*?<\\/form>/)[0];if(n[1]=n[1].replace("window.location.href","var nulled"),n[1]=n[1].replace("window.open(f","location.assign(f"),n[1]=n[1].replace(/(parseInt\\(c\\.split\\("-"\\)\\[0\\]\\)<= 0).*?(\\)\\{)/,"$1$2"),o&&t&&i&&r&&c)try{"loading"===document.readyState?window.addEventListener("load",(()=>{e(c)}),{once:!0}):e(c)}catch(e){console.debug(e)}}return Reflect.apply(o,t,n)}};window.Function.prototype.constructor=new Proxy(window.Function.prototype.constructor,o)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fd77edacac830e016dc4109bc637175a === e) return;
            !function() {
                const e = e => {
                    const o = new XMLHttpRequest;
                    o.open("POST", "/check.php", !0), o.setRequestHeader("Content-type", "application/x-www-form-urlencoded"), 
                    o.send("a");
                    const t = atob(window.ext_site).replace(/[a-z]/gi, (e => String.fromCharCode(e.charCodeAt(0) + (e.toLowerCase() <= "m" ? 13 : -13))));
                    let n = e.replaceAll('\\"', '"');
                    n = n.replace("'+ api_key+ '", window.api_key), n = n.replace("'+ link_out+ \"", window.link_out), 
                    n = n.replace(/action="'\+ .*?\+ '"/, `action="${t}"`);
                    var a;
                    const r = (a = n, (new DOMParser).parseFromString(a, "text/html")).querySelector("form"), c = new FormData(r), i = new XMLHttpRequest;
                    i.open("POST", t, !0), i.send(c), window.tab2 = window, postMessage("_clicked_b", location.origin);
                }, o = {
                    apply: (o, t, n) => {
                        if (n[1] && n[1].includes("api_key")) {
                            const o = window.link_out, t = window.api_key, a = n[1].match(/window\.open\(.*?\(atob\(main_site\)\).*?("\/.*\.php\?.*=").*?("&.*?=").*?(api_key),"view"/), r = a[1].replaceAll('"', ""), c = a[2].replaceAll('"', ""), i = n[1].match(/<form target=[\s\S]*?<\/form>/)[0];
                            if (n[1] = n[1].replace("window.location.href", "var nulled"), n[1] = n[1].replace("window.open(f", "location.assign(f"), 
                            n[1] = n[1].replace(/(parseInt\(c\.split\("-"\)\[0\]\)<= 0).*?(\)\{)/, "$1$2"), 
                            o && t && r && c && i) try {
                                "loading" === document.readyState ? window.addEventListener("load", (() => {
                                    e(i);
                                }), {
                                    once: !0
                                }) : e(i);
                            } catch (e) {
                                console.debug(e);
                            }
                        }
                        return Reflect.apply(o, t, n);
                    }
                };
                window.Function.prototype.constructor = new Proxy(window.Function.prototype.constructor, o);
            }();
            Object.defineProperty(Window.prototype.toString, "fd77edacac830e016dc4109bc637175a", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fd77edacac830e016dc4109bc637175a" due to: ' + e);
        }
    },
    '(()=>{try{const o=location.href.split("/#");if(o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){break}const c=decodeURIComponent(t).split("&url=")[1];c&&location.assign(c)}}catch(o){console.error(o)}})();': () => {
        try {
            const c = "done";
            if (Window.prototype.toString["665cc7cdf79cd8609ccd1c640a89ccd0"] === c) return;
            (() => {
                try {
                    const c = location.href.split("/#");
                    if (c[1]) {
                        let t = c[1];
                        for (let c = 0; c < 10; c++) try {
                            t = atob(t);
                        } catch (c) {
                            break;
                        }
                        const o = decodeURIComponent(t).split("&url=")[1];
                        o && location.assign(o);
                    }
                } catch (c) {
                    console.error(c);
                }
            })();
            Object.defineProperty(Window.prototype.toString, "665cc7cdf79cd8609ccd1c640a89ccd0", {
                value: c,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (c) {
            console.error('Error executing AG js rule with uniqueId "665cc7cdf79cd8609ccd1c640a89ccd0" due to: ' + c);
        }
    },
    '(function(){try{var a=location.href.split("out#!");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a97c62453393267bb0f7c37f1de195be === e) return;
            !function() {
                try {
                    var e = location.href.split("out#!");
                    if (e[1]) {
                        e = e[1];
                        for (var t = 0; 10 > t; t++) {
                            e = atob(e);
                            try {
                                new URL(decodeURIComponent(e));
                                var o = !0;
                            } catch (e) {
                                o = !1;
                            }
                            if (o) try {
                                location.assign(decodeURIComponent(e));
                                break;
                            } catch (e) {}
                        }
                    }
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "a97c62453393267bb0f7c37f1de195be", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a97c62453393267bb0f7c37f1de195be" due to: ' + e);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',function(){if(window.deco_url_b64&&typeof deco_url_b64==='string'&&deco_url_b64.startsWith('http')){location.assign(deco_url_b64);}});})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["370c2e67375d1730dbabcd4586b41c96"] === e) return;
            document.addEventListener("DOMContentLoaded", (function() {
                window.deco_url_b64 && "string" == typeof deco_url_b64 && deco_url_b64.startsWith("http") && location.assign(deco_url_b64);
            }));
            Object.defineProperty(Window.prototype.toString, "370c2e67375d1730dbabcd4586b41c96", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "370c2e67375d1730dbabcd4586b41c96" due to: ' + e);
        }
    },
    '(function(){try{var a=location.href.split("#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["5c24323e179726bab950bb8e6732b33b"] === e) return;
            !function() {
                try {
                    var e = location.href.split("#");
                    if (e[1]) {
                        e = e[1];
                        for (var t = 0; 10 > t; t++) {
                            e = atob(e);
                            try {
                                new URL(decodeURIComponent(e));
                                var o = !0;
                            } catch (e) {
                                o = !1;
                            }
                            if (o) try {
                                location.assign(decodeURIComponent(e));
                                break;
                            } catch (e) {}
                        }
                    }
                } catch (e) {}
            }();
            Object.defineProperty(Window.prototype.toString, "5c24323e179726bab950bb8e6732b33b", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "5c24323e179726bab950bb8e6732b33b" due to: ' + e);
        }
    },
    '(()=>{window.addEventListener("message",(e=>{e?.data?.includes("__done__")&&e?.data?.length<9&&Object.defineProperty(e,"source",{value:""})}),!0);const e=new MutationObserver((()=>{document.querySelector("a.button#contador")&&(e.disconnect(),setTimeout((()=>{postMessage("__done__")}),100))}));e.observe(document,{childList:!0,subtree:!0})})();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["340e5298fafdd8b74113e0fea4af6efa"] === e) return;
            (() => {
                window.addEventListener("message", (e => {
                    e?.data?.includes("__done__") && e?.data?.length < 9 && Object.defineProperty(e, "source", {
                        value: ""
                    });
                }), !0);
                const e = new MutationObserver((() => {
                    document.querySelector("a.button#contador") && (e.disconnect(), setTimeout((() => {
                        postMessage("__done__");
                    }), 100));
                }));
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            })();
            Object.defineProperty(Window.prototype.toString, "340e5298fafdd8b74113e0fea4af6efa", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "340e5298fafdd8b74113e0fea4af6efa" due to: ' + e);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("s.php?i=")){var a=location.href.split("s.php?i=");if(a&&a[1]){a=a[1];for(var c=0;10>c;c++)try{a=atob(a)}catch(f){var d=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});try{new URL(d);var e=!0}catch(b){e=!1}if(e){window.location=d;break}}}}})();': () => {
        try {
            const r = "done";
            if (Window.prototype.toString.c351c9c83ef852439382448ab0d1ad4a === r) return;
            !function() {
                if (-1 < window.location.href.indexOf("s.php?i=")) {
                    var r = location.href.split("s.php?i=");
                    if (r && r[1]) {
                        r = r[1];
                        for (var e = 0; 10 > e; e++) try {
                            r = atob(r);
                        } catch (e) {
                            var o = r.replace(/[a-zA-Z]/g, (function(r) {
                                return String.fromCharCode(("Z" >= r ? 90 : 122) >= (r = r.charCodeAt(0) + 13) ? r : r - 26);
                            }));
                            try {
                                new URL(o);
                                var t = !0;
                            } catch (r) {
                                t = !1;
                            }
                            if (t) {
                                window.location = o;
                                break;
                            }
                        }
                    }
                }
            }();
            Object.defineProperty(Window.prototype.toString, "c351c9c83ef852439382448ab0d1ad4a", {
                value: r,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (r) {
            console.error('Error executing AG js rule with uniqueId "c351c9c83ef852439382448ab0d1ad4a" due to: ' + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\(\\)>0x0\\)\\{fA=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.acb1e5048f2d6e4f5da7f33333aa8ad4 === e) return;
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, o) {
                    if (!/\(\)>0x0\)\{fA=setTimeout\(/.test(t.toString())) return e(t, o);
                };
            }();
            Object.defineProperty(Window.prototype.toString, "acb1e5048f2d6e4f5da7f33333aa8ad4", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "acb1e5048f2d6e4f5da7f33333aa8ad4" due to: ' + e);
        }
    },
    '!function(){let e=()=>{document.querySelector("#case-1-generichide > .test-banner1").style.width="200px"};"complete"===document.readyState?e():window.document.addEventListener("readystatechange",e)}();': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["08d18a5e02e0ff3dfa7a775c5b3836b8"] === e) return;
            !function() {
                let e = () => {
                    document.querySelector("#case-1-generichide > .test-banner1").style.width = "200px";
                };
                "complete" === document.readyState ? e() : window.document.addEventListener("readystatechange", e);
            }();
            Object.defineProperty(Window.prototype.toString, "08d18a5e02e0ff3dfa7a775c5b3836b8", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "08d18a5e02e0ff3dfa7a775c5b3836b8" due to: ' + e);
        }
    },
    "window.__testCase1 = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["8a8aa6a230159f083731d3a062edeb18"] === e) return;
            window.__testCase1 = !0;
            Object.defineProperty(Window.prototype.toString, "8a8aa6a230159f083731d3a062edeb18", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "8a8aa6a230159f083731d3a062edeb18" due to: ' + e);
        }
    },
    "window.adg_test=true;": () => {
        try {
            const a = "done";
            if (Window.prototype.toString.c136fa853777f29ac17a0c1a894aa2f3 === a) return;
            window.adg_test = !0;
            Object.defineProperty(Window.prototype.toString, "c136fa853777f29ac17a0c1a894aa2f3", {
                value: a,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (a) {
            console.error('Error executing AG js rule with uniqueId "c136fa853777f29ac17a0c1a894aa2f3" due to: ' + a);
        }
    },
    "window.adg_test=false;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["6f8ed085dee34ed45bfb71045a0616a9"] === e) return;
            window.adg_test = !1;
            Object.defineProperty(Window.prototype.toString, "6f8ed085dee34ed45bfb71045a0616a9", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "6f8ed085dee34ed45bfb71045a0616a9" due to: ' + e);
        }
    },
    'window.orderTest = ""': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a0403a559be05ba0de5bdb80c0325e94 === e) return;
            window.orderTest = "";
            Object.defineProperty(Window.prototype.toString, "a0403a559be05ba0de5bdb80c0325e94", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a0403a559be05ba0de5bdb80c0325e94" due to: ' + e);
        }
    },
    'window.orderTest += "1"': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["3f403bbf69b850dbf46515c5c7615709"] === e) return;
            window.orderTest += "1";
            Object.defineProperty(Window.prototype.toString, "3f403bbf69b850dbf46515c5c7615709", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "3f403bbf69b850dbf46515c5c7615709" due to: ' + e);
        }
    },
    'window.orderTest += "2"': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.a7190718bfca59dadb30d33bebaff55c === e) return;
            window.orderTest += "2";
            Object.defineProperty(Window.prototype.toString, "a7190718bfca59dadb30d33bebaff55c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "a7190718bfca59dadb30d33bebaff55c" due to: ' + e);
        }
    },
    'window.orderTest += "3"': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c26870644e508dfd86b557896eb3c2d0 === e) return;
            window.orderTest += "3";
            Object.defineProperty(Window.prototype.toString, "c26870644e508dfd86b557896eb3c2d0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c26870644e508dfd86b557896eb3c2d0" due to: ' + e);
        }
    },
    'window.orderTest += "4"': () => {
        try {
            const f = "done";
            if (Window.prototype.toString["2475fffcdfcd248879bffb6f21a8c8b2"] === f) return;
            window.orderTest += "4";
            Object.defineProperty(Window.prototype.toString, "2475fffcdfcd248879bffb6f21a8c8b2", {
                value: f,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (f) {
            console.error('Error executing AG js rule with uniqueId "2475fffcdfcd248879bffb6f21a8c8b2" due to: ' + f);
        }
    },
    "window.__firefoxTest1 = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d04ddcada5b00fa7230c05e03bd1d894 === e) return;
            window.__firefoxTest1 = !0;
            Object.defineProperty(Window.prototype.toString, "d04ddcada5b00fa7230c05e03bd1d894", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d04ddcada5b00fa7230c05e03bd1d894" due to: ' + e);
        }
    },
    'document.cookie = "adg_test";': () => {
        try {
            const e = "done";
            if (Window.prototype.toString.f66f0ad97a0cae5ed2b26ce553b41e6c === e) return;
            document.cookie = "adg_test";
            Object.defineProperty(Window.prototype.toString, "f66f0ad97a0cae5ed2b26ce553b41e6c", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "f66f0ad97a0cae5ed2b26ce553b41e6c" due to: ' + e);
        }
    },
    "document.__jsinjectTest = true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.b07c84c23738051113848eafa1e44cef === e) return;
            document.__jsinjectTest = !0;
            Object.defineProperty(Window.prototype.toString, "b07c84c23738051113848eafa1e44cef", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "b07c84c23738051113848eafa1e44cef" due to: ' + e);
        }
    },
    "window.__case13=true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["92d00c167835bf53559f945369ec23ae"] === e) return;
            window.__case13 = !0;
            Object.defineProperty(Window.prototype.toString, "92d00c167835bf53559f945369ec23ae", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "92d00c167835bf53559f945369ec23ae" due to: ' + e);
        }
    },
    "window.__case14=true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.c52a0d4da064c7de432600ef235faf29 === e) return;
            window.__case14 = !0;
            Object.defineProperty(Window.prototype.toString, "c52a0d4da064c7de432600ef235faf29", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "c52a0d4da064c7de432600ef235faf29" due to: ' + e);
        }
    },
    "window.__case15=true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["272eefde36401a0eb3838b86f16eead5"] === e) return;
            window.__case15 = !0;
            Object.defineProperty(Window.prototype.toString, "272eefde36401a0eb3838b86f16eead5", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "272eefde36401a0eb3838b86f16eead5" due to: ' + e);
        }
    },
    "window.__case16=true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.d64311307f8ae03b7fbc0de8b3ae5923 === e) return;
            window.__case16 = !0;
            Object.defineProperty(Window.prototype.toString, "d64311307f8ae03b7fbc0de8b3ae5923", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "d64311307f8ae03b7fbc0de8b3ae5923" due to: ' + e);
        }
    },
    "window.__case5=true;": () => {
        try {
            const e = "done";
            if (Window.prototype.toString["1502d8f3f87366a37f6bee28282bb902"] === e) return;
            window.__case5 = !0;
            Object.defineProperty(Window.prototype.toString, "1502d8f3f87366a37f6bee28282bb902", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "1502d8f3f87366a37f6bee28282bb902" due to: ' + e);
        }
    },
    "console.log('script rule')": () => {
        try {
            const e = "done";
            if (Window.prototype.toString.fdc3a65c3b049da967420c0a8f3e07f0 === e) return;
            console.log("script rule");
            Object.defineProperty(Window.prototype.toString, "fdc3a65c3b049da967420c0a8f3e07f0", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "fdc3a65c3b049da967420c0a8f3e07f0" due to: ' + e);
        }
    },
    'console.log(Date.now(), "default registered script")': () => {
        try {
            const e = "done";
            if (Window.prototype.toString["50d42f5d75309544cd581b726c33ba20"] === e) return;
            console.log(Date.now(), "default registered script");
            Object.defineProperty(Window.prototype.toString, "50d42f5d75309544cd581b726c33ba20", {
                value: e,
                enumerable: !1,
                writable: !1,
                configurable: !1
            });
        } catch (e) {
            console.error('Error executing AG js rule with uniqueId "50d42f5d75309544cd581b726c33ba20" due to: ' + e);
        }
    }
};